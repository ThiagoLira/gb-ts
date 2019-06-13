import { MMU } from "./mmu"

export class GPU {



    // values of the whole view
    // 255 x 255 pixels (32x32 tiles)
    // will only draw on screen a smaller 160x144 pixels via sx and sy registers
    // future proof, every entry on the array will be a RGB value, gameboy color someday HEHEWUHEUSHEUAH
    private full_view: number[] = Array(65025).fill(0xFF);

    constructor() {


    }

    // canvas element
    private screen_obj = document.getElementById("screen");



    // fetcher draws memory on the screen
    public draw_screen(mmu: MMU): void {





    }

    public reset() {




    }

}
