import { Registers } from "./registers"



enum State {

    running,
    interrupt,

}


export class CPU {


    state = State.running;

    registers: Registers;

    flag_z: boolean = false;
    flag_n: boolean = false;
    flag_h: boolean = false;
    flag_c: boolean = false;

    constructor(registers: Registers) {

        this.registers = registers;
    }

    // reset CPU
    reset() {
        this.registers = new Registers();


        this.flag_z = false;
        this.flag_n = false;
        this.flag_h = false;
        this.flag_c = false;

    }

}



