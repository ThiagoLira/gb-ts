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

}



