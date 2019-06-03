export class Registers {

    // we can access any member with a index string
    // will be useful to create templates for cpu operations
    // https://basarat.gitbooks.io/typescript/docs/types/index-signatures.html
    [key: string]: number;

    public a: number = 0;
    public b: number = 0;
    public c: number = 0;
    public d: number = 0;
    public e: number = 0;
    public h: number = 0;
    public l: number = 0;
    // flag register
    // Z N H C 0 0 0 0 
    public f: number = 0;
    // default value for program counter and stack counter
    // remember those two values are *adresses*
    public pc: number = 0x00;
    public sp: number = 0xfffe;



    get carry_flag(): number {

        return ((this.f >> 4) & 0x01);
    }

    get half_carry_flag(): number {

        return ((this.f >> 5) & 0x01);
    }

    get sub_flag(): number {

        return ((this.f >> 6) & 0x01);
    }

    get zero_flag(): number {

        return ((this.f >> 7) & 0x01);
    }

    get af(): number {
        return (this.a << 4) | this.f;
    }

    set af(val: number) {

        this.a = val >> 7;
        this.f = val & 0xff;
    }

    get bc(): number {
        return (this.b << 4) | this.c;
    }

    set bc(val: number) {

        this.b = val >> 7;
        this.c = val & 0xff;
    }

    get de(): number {
        return (this.d << 4) | this.e;
    }

    set de(val: number) {

        this.d = val >> 7;
        this.e = val & 0xff;
    }

    get hl(): number {
        return (this.h << 4) | this.l;
    }

    set hl(val: number) {

        this.h = val >> 7;
        this.l = val & 0xff;
    }

}
