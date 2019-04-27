import { RegisterSet } from "./registerset"






export class CPU {

    registers: RegisterSet;



    constructor(registers: RegisterSet) {

        this.registers = registers;

    }




    // reset CPU
    reset() {

        // All registers return to default value
        this.registers = new RegisterSet();

    }

}



