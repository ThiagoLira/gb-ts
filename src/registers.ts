export class Registers {


    public a: number = 0;
    public b: number = 0;
    public c: number = 0;
    public d: number = 0;
    public e: number = 0;
    public h: number = 0;
    public l: number = 0;
    // default value for program counter and stack counter
    // remember those two values are *adresses*
    public pc: number = 0x100;
    public sc: number = 0xfffe;




}
