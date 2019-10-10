import { MMU } from "./mmu";





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


    constructor() {
        this.reset();
    }

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
    // address is a index on vram object, not the actual memory
    public update_tiles(address_without_offset: number, val: number, val_at_next_addr: number) {

        let tile = (address_without_offset >> 4) & 511;
        let y = (address_without_offset >> 1) & 7;

        for (let b = 0; b < 8; b += 1) {
            let bit1 = (val >> b) & 1;
            let bit2 = (val_at_next_addr >> b) & 1;

            this.tileset_data[tile][y][b] = (bit1 ? 1 : 0) +
                (bit2 ? 2 : 0)

        }
    }



    public tileset2string(): string{

        let out = ""

        for (let t = 0 ; t < 384; t++){
            out = out + "Tile " + t.toString() + " :"
            out = out + "\n"
            for (let c =0;c<8;c++){
                for (let l =0;l<8;l++){
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


            console.log(img_data.width);
            console.log(img_data.height);

            // for each tile on memory
            for (let p = 0; p < 300; p++){


                for (let l = 7; l>=0;l--){
                    for (let c = 7; c>=0;c--){

                        let pixel = (p * 8 % 160) + l*4 + (c + p * 8 / 160 * 8) * 640


                        let pixel_color = this.tileset_data[p][c][l];
                        let [r, g, b] = get_RGB(pixel_color);

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
    // fetcher draws memory on the screen
    public draw_screen(mmu: MMU, screen_obj: HTMLCanvasElement): void {

        // draw background data
        let context = screen_obj.getContext('2d');

        if (context) {
            let img_data = context.getImageData(0, 0, screen_obj.width, screen_obj.height);
            // full pixel grid
            let full_image = Array(255).fill(0).map(() => new Array(255))

            let pixels = img_data.data;

            let offset_vram = 0x8000;
            let offset_x = mmu.scx;
            let offset_y = mmu.scy;


            // tilemap region 1
            for (let i = 0x9800 - offset_vram; i<= 0x9bff - offset_vram;i++){


            }





            context.putImageData(img_data, 0, 0);

        }
    }

    public draw_full_screen(mmu: MMU, screen_obj: HTMLCanvasElement): void {

        // draw background data
        let context = screen_obj.getContext('2d');

        if (context) {
            let img_data = context.getImageData(0, 0, screen_obj.width, screen_obj.height);

            let pixels = img_data.data;

            let offset_vram = 0x8000;


            // tilemap region 1
            for (let i = 0x9800 - offset_vram; i<= 0x9bff - offset_vram;i++){


                let t =  mmu.vram[i]
                // draw full tile
                let p = 0; 


                for (let l = 0; l<8;l++){
                    for (let c = 0; c<8;c++){


                        let pixel = (p * 8 % 255) + l*4 + (c + p * 8 / 255 * 8) * (255 * 4)


                        let pixel_color = this.tileset_data[t][l][c];
                        if(t!=0){
                            console.log(t,l,c,i,pixel);
                        }
                        let [r, g, b] = get_RGB(pixel_color);

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
