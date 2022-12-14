
import { GPU } from "./gpu"

export class MMU {



    constructor( gpu: GPU,use_bootrom?: boolean,buff?: Buffer) {
        // use chromium with this function for now!

        // debug: hard code GB logo on cartridge memory location 0x104 - 0x133

        // we need this reference so we can update the tiledata
        // everytime the VRAM is updated
        this.gpu = gpu;

        if(use_bootrom){
            this.using_bootrom = use_bootrom;
        }else{
            this.using_bootrom = true;
        }


        if (this.using_bootrom){
            let logo_bytes =
            [
                0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D,
                0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E, 0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99,
                0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC, 0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E,
            ]
        // considering that cartridge begins at 0x100
        // so cartridge[4] corresponds to memory location 0x104
        for (let i = 4; i < 0x033; i += 1) {
            this.cartridge[i] = logo_bytes[i - 4];
            // suppose the gameboy has nothing inserted
            // this.cartridge[i] = 0xFF
        }}

        if(buff){
            this.loadRomFromFile(buff);
        }
    }

    gpu: GPU;

    using_bootrom: boolean;

    bios: number[] = [
        0x31, 0xFE, 0xFF, 0xAF, 0x21, 0xFF, 0x9F, 0x32, 0xCB, 0x7C, 0x20, 0xFB, 0x21, 0x26, 0xFF, 0x0E,
        0x11, 0x3E, 0x80, 0x32, 0xE2, 0x0C, 0x3E, 0xF3, 0xE2, 0x32, 0x3E, 0x77, 0x77, 0x3E, 0xFC, 0xE0,
        0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1A, 0xCD, 0x95, 0x00, 0xCD, 0x96, 0x00, 0x13, 0x7B,
        0xFE, 0x34, 0x20, 0xF3, 0x11, 0xD8, 0x00, 0x06, 0x08, 0x1A, 0x13, 0x22, 0x23, 0x05, 0x20, 0xF9,
        0x3E, 0x19, 0xEA, 0x10, 0x99, 0x21, 0x2F, 0x99, 0x0E, 0x0C, 0x3D, 0x28, 0x08, 0x32, 0x0D, 0x20,
        0xF9, 0x2E, 0x0F, 0x18, 0xF3, 0x67, 0x3E, 0x64, 0x57, 0xE0, 0x42, 0x3E, 0x91, 0xE0, 0x40, 0x04,
        0x1E, 0x02, 0x0E, 0x0C, 0xF0, 0x44, 0xFE, 0x90, 0x20, 0xFA, 0x0D, 0x20, 0xF7, 0x1D, 0x20, 0xF2,
        0x0E, 0x13, 0x24, 0x7C, 0x1E, 0x83, 0xFE, 0x62, 0x28, 0x06, 0x1E, 0xC1, 0xFE, 0x64, 0x20, 0x06,
        0x7B, 0xE2, 0x0C, 0x3E, 0x87, 0xE2, 0xF0, 0x42, 0x90, 0xE0, 0x42, 0x15, 0x20, 0xD2, 0x05, 0x20,
        0x4F, 0x16, 0x20, 0x18, 0xCB, 0x4F, 0x06, 0x04, 0xC5, 0xCB, 0x11, 0x17, 0xC1, 0xCB, 0x11, 0x17,
        0x05, 0x20, 0xF5, 0x22, 0x23, 0x22, 0x23, 0xC9, 0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B,
        0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D, 0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E,
        0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99, 0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC,
        0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E, 0x3C, 0x42, 0xB9, 0xA5, 0xB9, 0xA5, 0x42, 0x3C,
        0x21, 0x04, 0x01, 0x11, 0xA8, 0x00, 0x1A, 0x13, 0xBE, 0x00, 0x00, 0x23, 0x7D, 0xFE, 0x34, 0x20,
        0xF5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xFB, 0x86, 0x00, 0x00, 0x3E, 0x01, 0xE0, 0x50
    ];


    // rom has 32 kbs
    rom: number[] = [];

    // vram has 8kbs
    vram: number[] = Array(0x2000).fill(0xFF);

    // iram has 8kbs
    iram: number[] = Array(0x2000).fill(0xFF);

    // oam has idkn how many kbs
    oam: number[] = Array(0xA0).fill(0x0);


    // echo iram
    //  do I just copy the reference to the iram?
    echo_iram: number[] = this.iram;

    // RAM on top of memory usually used for the stack
    stack_ram: number[] = Array(0x7F).fill(0x0);

    // 32kb cartridge
    cartridge: number[] = Array(0x8000).fill(0x0);


    //IF
    interrupt_flag: number = 0xF;

    // enables for each type of interrupt
    interrupt_enable: number = 0xF;

    // interrupt master enable IME
    ime : number = 0x1;


    getByte(address: number): number {

        let address_without_offset = address;
        switch (true) {

            // boot rom range
            case (0x100 > address):
                if(this.using_bootrom){
                    return this.bios[address_without_offset];
                }
                else{
                    // cartridge also maps 0 til 0x100 addresses
                    return this.cartridge[address_without_offset]
                }
            // cartridge
            case (0x8000 > address) && (address >= 0x100):
                return this.cartridge[address_without_offset];
            //vram
            case ((0xA000 > address) && (address >= 0x8000)):
                address_without_offset = address - 0x8000;
                return this.vram[address_without_offset];
            // iram
            case ((0xE000 > address) && (address >= 0xC000)):
                address_without_offset = address - 0xC000
                return this.iram[address_without_offset];
            // iram echo
            case ((0xFE00 > address) && (address >= 0xE000)):
                address_without_offset = address - 0xE000;
                return this.echo_iram[address_without_offset];
            // oam
            case ((0xFF0F > address) && (address >= 0xFE00)):
                address_without_offset = address - 0xFE00;
                return this.oam[address_without_offset];
            // video related registers
            case ((0xFF4C > address) && (address >= 0xFF0F)):
                if (address == 0xFF0F) { return this.interrupt_flag; }
                if (address == 0xFF40) { return this.gpu.lcdc; }
                if (address == 0xFF41) { return this.gpu.stat; }
                if (address == 0xFF42) { return this.gpu.scy; }
                if (address == 0xFF43) { return this.gpu.scx; }
                // HARDCODE THIS TO USE GB DEBUGGER
                // if (address == 0xFF44) { return this.gpu.ly; }
                if (address == 0xFF44) { return 0x90; }
                if (address == 0xFF45) { return this.gpu.lyc; }
                if (address == 0xFF46) { return this.gpu.dma; }
                if (address == 0xFF47) { return this.gpu.bgp; }
                if (address == 0xFF48) { return this.gpu.bp0; }
                if (address == 0xFF49) { return this.gpu.bp1; }
                if (address == 0xFF4A) { return this.gpu.wy; }
                if (address == 0xFF4B) { return this.gpu.wx; }
            // stack
            case ((0xFFFF > address) && (address >= 0xFF80)):
                address_without_offset = address - 0xFF80;
                return this.stack_ram[address_without_offset];

            case(0xFFFF == address):
                return this.interrupt_enable ;

        }
        throw new Error('Acessing non-implemented memory location: ' + address.toString(16));
    }

    setByte(address: number, val: number): void {


        let address_without_offset = address;
        switch (true) {

            // boot rom range
            case (address < 0x100):
                throw new Error('Trying to write on bootrom');
            //vram
            case ((0xA000 > address) && (address >= 0x8000)):
                address_without_offset = address - 0x8000;
                //update tile data
                //

                if(address <= 0x97ff){
                    this.gpu.update_tiles(address_without_offset, val, this.vram[address_without_offset + 1]);
                }
                this.vram[address_without_offset] = val;
                break;
            // iram
            case ((0xE000 > address) && (address >= 0xC000)):
                address_without_offset = address - 0xC000
                this.iram[address_without_offset] = val;
                break;
            // iram echo
            case ((0xFE00 > address) && (address >= 0xE000)):
                address_without_offset = address - 0xE000;
                this.echo_iram[address_without_offset] = val;
                break;
            // OAM
            case ((0xFF0F > address) && (address >= 0xFE00)):
                address_without_offset = address - 0xFE00;
                this.oam[address_without_offset] = val;
                break;
            // video related registers
            case ((0xFF80 > address) && (address >= 0xFF0F)):
                if (address == 0xFF0F) { this.interrupt_flag = val; }
                if (address == 0xFF40) { this.gpu.lcdc = val; }
                if (address == 0xFF41) { this.gpu.stat = val; }
                if (address == 0xFF42) { this.gpu.scy = val; }
                if (address == 0xFF43) { this.gpu.scx = val; }
                if (address == 0xFF44) { this.gpu.ly = val; }
                if (address == 0xFF45) { this.gpu.lyc = val; }
                if (address == 0xFF46) { this.gpu.dma = val; }
                if (address == 0xFF47) { this.gpu.bgp = val; }
                if (address == 0xFF48) { this.gpu.bp0 = val; }
                if (address == 0xFF49) { this.gpu.bp1 = val; }
                if (address == 0xFF4A) { this.gpu.wy = val; }
                if (address == 0xFF4B) { this.gpu.wx = val; }
                break;
            case ((0xFFFF > address) && (address >= 0xFF80)):
                address_without_offset = address - 0xFF80;
                this.stack_ram[address_without_offset] = val;
                break;
            case(0xFFFF == address):
                this.interrupt_enable = val;
                // also set IME
                this.ime = val;
                break;
        }

    }

    public interruptstate2string() : string {
        return `IE = (${this.interrupt_enable.toString(16)}) \n
                IME = (${this.ime.toString(16)}) \n
                IF = (${this.interrupt_flag.toString(16)}) `;
    }

    // return string representation of vram
    public vram2string() : string{

        let offset = 0x8000
        let output = ""

        for (let i = this.vram.length - 2; i>=0;i=i-2){

            output = output + (offset + i).toString(16) + " : "
            // output = output + this.vram[i].toString(16) + this.vram[i+1].toString(16)
            output = output + (i + 1+ offset).toString(16) + " " + this.vram[i+1].toString(16) +" " +  (i  + offset).toString(16) +" " +   this.vram[i].toString(16)

            output = output + "\n"

        }
       return output
    }

    // return string representation of vram
    public hram2string() : string{

        let offset = 0xFF80;
        let output = ""

        for (let i = this.stack_ram.length - 2; i>=0;i=i-2){

            output = output + (offset + i).toString(16) + " : "
            output = output + (i + 1+ offset).toString(16) + " " + this.stack_ram[i+1].toString(16) +" " +  (i  + offset).toString(16) +" " +   this.stack_ram[i].toString(16)

            output = output + "\n"

        }
        return output
    }

    public tilemap2string(): string{


        let out = ""
        let offset_1 = 0x8000;
        // tilemap region 1
        for (let i = 0x9800; i<= 0x9bff;i++){
            out = out + " " + this.vram[ i - offset_1 ]
            if(i%32==0 && i!= 0x9800){
                out = out + '\n';
            }
        }
        return out
    }

    public screen2string(): string{

        let out = ""
        let offset_1 = 0x8000;
        let l = 0;
        // tilemap region 1
        for (let i = 0x9800; i<= 0x9bff;i++){
            for (let l = 0;l<=7;l++){

                let t =  this.vram[ i - offset_1 ]

                    for (let c =0;c<8;c++){
                            out = out + this.gpu.tileset_data[t][c][l].toString()
                    }

                if(i%32==0 && i!= 0x9800){
                    out = out + "\n"
                }
            }
        }
        return out
    }


    // return string representation of vram
    public cartridge2string() : string{

        let output = ""

        for (let i = 1; i <= this.cartridge.length - 2;i=i+2){

            output+= (i - 1).toString(16) + ": " + this.cartridge[i-1].toString(16)
            output+= "     "
            output+= (i).toString(16) +": " +   this.cartridge[i].toString(16)

            output = output + "\n"

        }
        return output
    }


    // load some bytes on cartridge from FileReader buffer 
    loadRomFromFile(buffArray: Buffer  ) {

        for (let i=0; i <= buffArray.length; i=i+1){
            this.cartridge[i] = buffArray[i];
        }


    }







}




