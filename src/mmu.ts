

export class MMU {

    constructor(path: string) {
        // use chromium with this function for now!
        // open -a Chromium --args --disable-web-security --user-data-dir
        // this.readLocalFile(path);


    }


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

    // lcd control
    lcdc: number = 0x91;

    // lcdc status
    stat: number = 0x0;

    // SCY
    scy: number = 0x0;

    //scx
    scx: number = 0x0;

    //LCDC Y coordinate
    ly: number = 0x0;

    //ly compare
    lyc: number = 0x0;

    // echo iram
    //  do I just copy the reference to the iram?
    echo_iram: number[] = this.iram;


    getByte(address: number): number {

        let address_without_offset = address;
        switch (true) {

            // boot rom range
            case (address < 0x100):
                return this.bios[address_without_offset];

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

            case ((0xFEA0 > address) && (address >= 0xFE00)):
                address_without_offset = address - 0xFE00;
                return this.oam[address_without_offset];

            // video related registers
            case ((0xFF46 > address) && (address >= 0xFF40)):
                if (address == 0xFF40) { return this.lcdc; }
                if (address == 0xFF41) { return this.stat; }
                if (address == 0xFF42) { return this.scy; }
                if (address == 0xFF43) { return this.scx; }
                if (address == 0xFF44) { return this.ly; }
                if (address == 0xFF45) { return this.lyc; }

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
                this.vram[address_without_offset] = val;

            // iram	
            case ((0xE000 > address) && (address >= 0xC000)):
                address_without_offset = address - 0xC000
                this.iram[address_without_offset] = val;

            // iram echo	
            case ((0xFE00 > address) && (address >= 0xE000)):
                address_without_offset = address - 0xE000;
                this.echo_iram[address_without_offset] = val;

            // OAM
            case ((0xFEA0 > address) && (address >= 0xFE00)):
                address_without_offset = address - 0xFE00;
                this.oam[address_without_offset] = val;

            // video related registers
            case ((0xFF46 > address) && (address >= 0xFF40)):
                if (address == 0xFF40) { this.lcdc = val; }
                if (address == 0xFF41) { this.stat = val; }
                if (address == 0xFF42) { this.scy = val; }
                if (address == 0xFF43) { this.scx = val; }
                if (address == 0xFF44) { this.ly = val; }
                if (address == 0xFF45) { this.lyc = val; }

        }

    }





    // readLocalFile(filePath: string) {
    // var fileRequest = new XMLHttpRequest();

    //  Simulating a request against our local system
    // fileRequest.open("GET", filePath, false);
    // fileRequest.onreadystatechange = () => {
    // if (fileRequest.readyState === 4) {
    // if (fileRequest.status === 200 || fileRequest.status == 0) {
    // var buff = fileRequest.response;
    // convert string to bytes array
    // var bytes: number[] = [];
    // var charCode;
    // for (var i = 0; i < buff.length; ++i) {
    // charCode = buff.charCodeAt(i);
    // bytes.push((charCode & 0xFF00) >> 8);
    // bytes.push(charCode & 0xFF);
    // }

    // this.rom = bytes.slice(0);
    // }
    // }
    // }

    // fileRequest.send(null);
    // }







}




