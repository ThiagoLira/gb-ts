import { MMU } from "./mmu";
import { GameBoyBus } from "./bus";
import { Int } from "./interrupt";





function get_RGB(color: number): number[] {
	switch (color) {
		case (0): { return [255, 255, 255] }
		case (1): { return [192, 192, 192] }
		case (2): { return [96, 96, 96] }
		case (3): { return [0, 0, 0] }
	}
	return [0, 0, 0]

}


export class GPU {
	bus: GameBoyBus;




	constructor(bus: GameBoyBus) {
		this.bus = bus;
		this.reset();
	}

	// internal clock count to manage gpu states
	modeclock: number = 0;
	// internal mode inside frame
	mode: number = 0;

	// these atributes are set by MMU object
	// video registers
	// lcd control
	lcdc: number = 0x00;

	// lcdc status
	stat: number = 0x0;

	// SCY
	scy: number = 0x0;

	//scx
	scx: number = 0x0;

	//LCDC Y coordinate
	// YOU CHANGED LINE VARIABLE TO THIS
	ly: number = 0x0;

	//ly compare
	lyc: number = 0x0;

	dma: number = 0x0;

	// Background Color Pallete
	bgp: number = 0x00;

	bp0: number = 0xff;
	bp1: number = 0xff;

	wx: number = 0x00;
	wy: number = 0x00;

	framebuffer: number[] = new Array(160 * 144 * 4).fill(0);


	// values of the whole view
	// 255 x 255 pixels (32x32 tiles)
	// will only draw on screen a smaller 160x144 pixels via scx and scy registers
	// value on each pixel will be 0, 1, 2, 3.
	// color will be defined by Background Pallete Register
	private full_pixel_grid: number[] = Array(65025).fill(0x00);

	// indices of tiles to be displayed
	// 32 by 32 tiles
	private tileset_indices: number[][][] = Array(32).fill(0).map(() => new Array(32).fill(0))


	// tileset data copied from vram
	// 384 tiles, each with 8 colunms each with 8 pixels, each with 2 bits of information
	public tileset_data: number[][][] = Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Array(8).fill(0)));


	// update gpu state by giving number of clocks elapsed on instruction by CPU
	public RunClocks(clock_count: number) {

		this.modeclock += clock_count;

		let prevMode = this.mode;
		let prevLy = this.ly;

		switch (this.mode) {
			// OAM read mode, scanline active
			case 2:
				if (this.modeclock >= 80) {
					// Enter scanline mode 3
					this.modeclock = 0;
					this.mode = 3;
				}
				break;

			// VRAM read mode, scanline active
			// Treat end of mode 3 as end of scanline
			case 3:
				if (this.modeclock >= 172) {
					// Enter hblank
					this.modeclock = 0;
					this.mode = 0;
					this.render_scan();
				}
				break;

			// Hblank
			// After the last hblank, push the screen data to canvas
			case 0:
				if (this.modeclock >= 204) {
					this.modeclock = 0;
					this.ly++;

					if (this.ly == 144) {
						this.bus.interrupts.request(Int.VBlank);
						// Enter vblank
						this.mode = 1;
					}
					else {
						this.mode = 2;
					}
				}
				break;

			// Vblank (10 lines)
			case 1:
				if (this.modeclock >= 456) {
					this.modeclock = 0;
					this.ly++;

					if (this.ly > 153) {
						// Restart scanning modes
						this.mode = 2;
						this.ly = 0;
					}
				}
				break;
		}

		// update STAT register
		// set mode bits 0-1 (preserve upper bits 2-7)
		this.stat = (this.stat & 0xFC) | (this.mode & 0x03);
		// set Coincidence flag bit 2
		let lycMatch = (this.ly == this.lyc);
		lycMatch ? this.stat |= 1 << 2 : this.stat &= ~(1 << 2);

		// Fire STAT interrupt (INT $48) when any enabled STAT source triggers.
		// STAT bit 3 = Mode 0 (HBlank) interrupt source
		// STAT bit 4 = Mode 1 (VBlank) interrupt source
		// STAT bit 5 = Mode 2 (OAM) interrupt source
		// STAT bit 6 = LYC=LY coincidence interrupt source
		let statIRQ = false;
		if ((this.stat & (1 << 3)) && this.mode === 0 && prevMode !== 0) statIRQ = true;
		if ((this.stat & (1 << 4)) && this.mode === 1 && prevMode !== 1) statIRQ = true;
		if ((this.stat & (1 << 5)) && this.mode === 2 && prevMode !== 2) statIRQ = true;
		if ((this.stat & (1 << 6)) && lycMatch && (this.ly !== prevLy || prevMode !== this.mode)) statIRQ = true;
		if (statIRQ) {
			this.bus.interrupts.request(Int.LCDStat);
		}

	}



	// this function should draw a complete line of pixels on the gpu's internal pixel matrix
	public render_scan() {
		const y_in_map = (this.ly + this.scy) & 255;
		const tile_row_in_map = Math.floor(y_in_map / 8);
		const pixel_row_in_tile = y_in_map % 8;
		// 4. Loop for each of the 160 pixels of the horizontal scanline
		for (let x = 0; x < 160; x++) {
			// 5. Determine the horizontal pixel position in the 256x256 map
			const x_in_map = (x + this.scx) & 255;

			// 6. Determine which column of tiles we are in
			const tile_col_in_map = Math.floor(x_in_map / 8);

			// 7. Determine which column of pixels we need from inside that tile
			const pixel_col_in_tile = x_in_map % 8;

			// 8. Find the tile index from VRAM (you need to determine the correct tile map base address)
			const tile_map_base = 0x9800; // or 0x9C00 depending on LCDC
			const tile_map_index = (tile_row_in_map * 32) + tile_col_in_map;
			const tile_index_from_vram = this.bus.mmu.vram[tile_map_base - 0x8000 + tile_map_index];

			// 9. Get the color from your tileset_data, apply BGP palette
			const raw_color = this.tileset_data[tile_index_from_vram][pixel_row_in_tile][pixel_col_in_tile];
			const shade = (this.bgp >> (raw_color * 2)) & 3;
			const [r, g, b] = get_RGB(shade);

			// 10. Calculate the position in your new framebuffer and set the pixel
			const frame_buffer_pos = (this.ly * 160 + x) * 4;
			this.framebuffer[frame_buffer_pos + 0] = r;
			this.framebuffer[frame_buffer_pos + 1] = g;
			this.framebuffer[frame_buffer_pos + 2] = b;
			this.framebuffer[frame_buffer_pos + 3] = 255; // Alpha
		}
	}



	// for testing and fun
	// write tileset for nintendo logo internally on GPU
	public hard_code_nintendo_logo() {
		// Nintendo Logo
		//  $CE,$ED,$66,$66,$CC,$0D,$00,$0B,$03,$73,$00,$83,$00,$0C,$00,$0D
		//  $00,$08,$11,$1F,$88,$89,$00,$0E,$DC,$CC,$6E,$E6,$DD,$DD,$D9,$99
		//  $BB,$BB,$67,$63,$6E,$0E,$EC,$CC,$DD,$DC,$99,$9F,$BB,$B9,$33,$3E
		let logo_bytes =
			[
				0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D,
				0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E, 0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99,
				0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC, 0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E,
			]




		for (let t = 0; t < logo_bytes.length; t += 16) {
			for (let i = 0; i < 16; i += 2) {
				let byte1 = logo_bytes[t + i];
				let byte2 = logo_bytes[t + i + 1];

				// console.log(byte1.toString(16), byte2.toString(16));
				for (let b = 0; b < 7; b += 1) {
					let bit1 = (byte1 >> b) & 1;
					let bit2 = (byte2 >> b) & 1;

					let pixel = bit1 + bit2;
					this.tileset_data[t / 16][i / 2][b] = pixel
				}

			}
		}
	}



	// this function is called when some byte is written on the VRAM
	// it should then update the tiles object on the gpu for fast drawing of the background
	// address is a index on vram object, not the actual memory (vram must already be updated)
	public update_tiles(address_without_offset: number) {
		// Align to even address — each tile row is a 2-byte pair (low, high)
		const base = address_without_offset & ~1;
		const tile = (base >> 4) & 511;
		const y = (base >> 1) & 7;

		const low_byte = this.bus.mmu.vram[base];
		const high_byte = this.bus.mmu.vram[base + 1];

		for (let b = 0; b < 8; b += 1) {
			const bit1 = (low_byte >> b) & 1;
			const bit2 = (high_byte >> b) & 1;
			this.tileset_data[tile][y][7 - b] = bit1 + (bit2 << 1);
		}
	}


	// DEBUG PURPOSES
	public tileset2string(): string {

		let out = ""

		for (let t = 0; t < 384; t++) {
			out = out + "Tile " + t.toString() + " :"
			out = out + "\n"
			for (let c = 0; c < 8; c++) {
				for (let l = 0; l < 8; l++) {
					out = out + this.tileset_data[t][c][l].toString()
				}

				out = out + "\n"
			}
		}

		return out

	}

	// fetcher draws memory on the screen
	public draw_tiles(mmu: MMU, screen_obj: HTMLCanvasElement): void {

		// draw background data
		let context = screen_obj.getContext('2d');

		if (context) {
			let img_data = context.getImageData(0, 0, screen_obj.width, screen_obj.height);

			let pixels = img_data.data;

			// 20 tiles per row, 15 rows = 300 tiles
			const tiles_per_row = 20;
			const row_stride = screen_obj.width * 4;
			for (let p = 0; p < 300; p++) {
				const tile_col = p % tiles_per_row;
				const tile_row = ~~(p / tiles_per_row);
				for (let c = 0; c < 8; c++) {
					for (let l = 0; l < 8; l++) {
						const px = tile_col * 8 + l;
						const py = tile_row * 8 + c;
						const pixel = py * row_stride + px * 4;

						let [r, g, b] = get_RGB(this.tileset_data[p][c][l]);
						pixels[pixel + 0] = r;
						pixels[pixel + 1] = g;
						pixels[pixel + 2] = b;
						pixels[pixel + 3] = 255;
					}
				}
			}

			context.putImageData(img_data, 0, 0);

		}
	}

	public tilemap2string(mmu: MMU) {


		let offset_vram = 0x8000;

		let ret = "";
		for (let i = 0x9800 - offset_vram; i <= 0x9bff - offset_vram; i++) {

			let current_position = (i + offset_vram).toString(16);

			ret += mmu.vram[i].toString();

			if (i % 32 == 0 && i != 0) {
				ret += '\n'
			}
		}

		return ret;

	}

	// draw empty tiles with borders
	// use this to study pixel offsets
	public draw_full_screen_debug(mmu: MMU, screen_obj: HTMLCanvasElement): void {

		// draw background data
		let context = screen_obj.getContext('2d');

		if (context) {
			let img_data = context.getImageData(0, 0, screen_obj.width, screen_obj.height);

			let pixels = img_data.data;

			let offset_vram = 0x8000;


			let p = 0;
			// tilemap region 1
			for (let i = 0x9800 - offset_vram; i <= 0x9bff - offset_vram; i++) {

				// which line of the 32x32 grid of tiles we are now
				let line_of_tiles = ~~(p / 32);
				// which tile on the horizontal line of tiles are we? (32 tiles per line)
				let column_of_tiles = p % 32;


				// draw full tile
				for (let l = 0; l < 8; l++) {
					for (let c = 0; c < 8; c++) {

						//offsets for tile grid Y, tile grid X, pixel column Y, pixel line X

						let pixel = (line_of_tiles * 8 * 1020) + (column_of_tiles * 8 * 4) + l * 4 + (1020 * c);


						let [r, g, b] = [255, 255, 255];

						if (l == 0) {
							[r, g, b] = [0, 0, 0];
						}


						pixels[pixel + 0] = r;
						pixels[pixel + 1] = g;
						pixels[pixel + 2] = b;
						pixels[pixel + 3] = 255;


					}
				}

				p++
			}





			context.putImageData(img_data, 0, 0);
		}
	}

	// Blit the 160x144 framebuffer (produced by render_scan) to canvas
	public draw_screen(screen_obj: HTMLCanvasElement): void {
		let context = screen_obj.getContext('2d');
		if (context) {
			const img_data = context.createImageData(160, 144);
			img_data.data.set(this.framebuffer);
			context.putImageData(img_data, 0, 0);
		}
	}

	// Debug: render the full 256x256 BG tilemap from VRAM
	public draw_tilemap(mmu: MMU, screen_obj: HTMLCanvasElement): void {
		let context = screen_obj.getContext('2d');
		if (context) {
			let img_data = context.getImageData(0, 0, screen_obj.width, screen_obj.height);
			let pixels = img_data.data;
			const row_stride = screen_obj.width * 4;

			let p = 0;
			for (let i = 0x1800; i <= 0x1bff; i++) {
				let t = mmu.vram[i];
				let line_of_tiles = ~~(p / 32);
				let column_of_tiles = p % 32;

				for (let c = 0; c < 8; c++) {
					for (let l = 0; l < 8; l++) {
						let pixel = (line_of_tiles * 8 + c) * row_stride + (column_of_tiles * 8 + l) * 4;
						let [r, g, b] = get_RGB(this.tileset_data[t][c][l]);
						pixels[pixel + 0] = r;
						pixels[pixel + 1] = g;
						pixels[pixel + 2] = b;
						pixels[pixel + 3] = 255;
					}
				}
				p++;
			}

			context.putImageData(img_data, 0, 0);
		}
	}


	public reset() {
		// reset tiledata
		for (let tile of this.tileset_data) {
			for (let collumn of tile) {
				for (let pixel of collumn) {

					pixel = 0;
				}
			}
		}








	}

}
