import { MMU } from "./mmu"



// RGB values for each shitty color on the classic gameboy
enum DISPLAY_COLOR {
    OFF,
    THIRD,
    SIXTH,
    ON,
}


function get_RGB(col: DISPLAY_COLOR) {
    switch (col) {
        case (DISPLAY_COLOR.OFF): { return [255, 255, 255] }
        case (DISPLAY_COLOR.THIRD): { return [192, 192, 192] }
        case (DISPLAY_COLOR.SIXTH): { return [96, 96, 96] }
        case (DISPLAY_COLOR.ON): { return [0, 0, 0] }
    }

}


export class GPU {


    constructor() {
    }

    // values of the whole view
    // 255 x 255 pixels (32x32 tiles)
    // will only draw on screen a smaller 160x144 pixels via scx and scy registers
    // value on each pixel will be 0, 1, 2, 3.
    // color will be defined by Background Pallete Register
    private full_pixel_grid: number[] = Array(65025).fill(0x00);

    // indices of tiles to be displayed
    private tileset_indices: number[] = Array(384).fill(0x00);


    // for testing and fun
    // write tileset for nintendo logo internally on GPU
    public hard_code_nintendo_logo() {
        // Nintendo Logo
        //  $CE,$ED,$66,$66,$CC,$0D,$00,$0B,$03,$73,$00,$83,$00,$0C,$00,$0D 
        //  $00,$08,$11,$1F,$88,$89,$00,$0E,$DC,$CC,$6E,$E6,$DD,$DD,$D9,$99 
        //  $BB,$BB,$67,$63,$6E,$0E,$EC,$CC,$DD,$DC,$99,$9F,$BB,$B9,$33,$3E 


    }


    // canvas element
    // this is only 160x144 pixels, as we are drawing just what
    // really shows on screen
    private screen_obj = document.getElementById("screen");



    // fetcher draws memory on the screen
    public draw_screen(mmu: MMU): void {





    }

    public reset() {




    }

}
