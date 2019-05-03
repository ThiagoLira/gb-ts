import { Registers } from "./registers"






export class CPU {


    registers: Registers;

    constructor(registers: Registers) {

        this.registers = registers;
    }

    // reset CPU
    reset() {
        this.registers = new Registers();

    }

}



