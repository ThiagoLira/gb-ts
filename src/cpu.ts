import { Registers } from "./registers"



enum State {

    running,
    interrupt,

}


export class CPU {


    state = State.running;

    registers: Registers;

    reset_carry_flag() {
        this.registers.f &= ~(1 << 4)
    }

    reset_half_carry_flag() {
        this.registers.f &= ~(1 << 5)
    }

    reset_n_flag() {
        this.registers.f &= ~(1 << 6)
    }

    reset_zero_flag() {
        this.registers.f &= ~(1 << 7)
    }

    set_carry_flag() {
        this.registers.f |= 1 << 4
    }

    set_half_carry_flag() {
        this.registers.f |= 1 << 5
    }

    set_n_flag() {
        this.registers.f |= 1 << 6
    }

    set_zero_flag() {
        this.registers.f |= 1 << 7
    }

    constructor(registers: Registers) {

        this.registers = registers;
    }

    // reset CPU
    reset() {
        this.registers = new Registers();
    }

    // convert to 2-complement and add val to reg(string)
    twoComplementAdd(reg:string,val:number): void{
        // convert to 2-complement if highest bit is 1

        if ((val >> 7) & 0x01) { val = val - (1 << 8)  }

        // this.registers[reg]+= (val + 2);
        this.registers[reg]+= (val );

    }


    public toString = () : string => {
        return `AF = (${this.registers.a.toString(16)} ${this.registers.f.toString(16)}) \n
BC = (${this.registers.b.toString(16)} ${this.registers.c.toString(16)}) \n
DE = (${this.registers.d.toString(16)} ${this.registers.e.toString(16)}) \n
HL = (${this.registers.hl.toString(16)}) \n
SP = (${this.registers.sp.toString(16)}) \n
PC = (${this.registers.pc.toString(16)}) `;
    }
    public toString2 = () : string => {
        return `AF = (${this.registers.af.toString(16)}) \n
BC = (${this.registers.bc.toString(16)}) \n
DE = (${this.registers.de.toString(16)}) \n
HL = (${this.registers.hl.toString(16)}) \n
SP = (${this.registers.sp.toString(16)}) \n
PC = (${this.registers.pc.toString(16)}) `;
    }


}



