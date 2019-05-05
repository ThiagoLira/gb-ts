import { Registers } from "./registers"



enum State {

    running,
    interrupt,

}


export class CPU {


    state = State.running;

    registers: Registers;

    constructor(registers: Registers) {

        this.registers = registers;
    }

    // reset CPU
    reset() {
        this.registers = new Registers();

    }

}



