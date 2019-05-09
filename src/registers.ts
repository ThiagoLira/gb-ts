export class Registers {


    public a: number = 0;
    public b: number = 0;
    public c: number = 0;
    public d: number = 0;
    public e: number = 0;
    public h: number = 0;
    public l: number = 0;
    public f: number = 0;
    // default value for program counter and stack counter
    // remember those two values are *adresses*
    public pc: number = 0x00;
    public sp: number = 0xfffe;



    public flag_reg: number = 0;



    get af(): number {
        return (this.a << 8) | this.f;
    }

    set af(val: number) {

        this.a = val >> 8;
        this.f = val & 0xff;
    }

    get bc(): number {
        return (this.b << 8) | this.c;
    }

    set bc(val: number) {

        this.b = val >> 8;
        this.c = val & 0xff;
    }

    get de(): number {
        return (this.d << 8) | this.e;
    }

    set de(val: number) {

        this.d = val >> 8;
        this.e = val & 0xff;
    }

    get hl(): number {
        return (this.h << 8) | this.l;
    }

    set hl(val: number) {

        this.h = val >> 8;
        this.l = val & 0xff;
    }

}
