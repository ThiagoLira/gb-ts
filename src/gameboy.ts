import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { MMU } from "./mmu"
import { Registers } from "./registers"



//this class should hold the complete state of the gameboy to halt and de-halt emulation
export class Gameboy {

    cpu: CPU;
    gpu: GPU;
    mmu: MMU;

    constructor(){
        this.cpu = new CPU(new Registers());

        this.gpu = new GPU();

        this.mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin", this.gpu);
    }

    GetArgAndPC(arg_number: number) : [number,number]{

        let arg = 0;
        let new_pc = 0;
        switch (arg_number) {

            case 0: {
                new_pc  = this.cpu.registers.pc + 1;
                break;
            }
            case 1: {
                arg = this.mmu.getByte(this.cpu.registers.pc + 1);
                new_pc = this.cpu.registers.pc + 2;
                break;
            }
            case 2: {
                arg = (this.mmu.getByte(this.cpu.registers.pc + 1) + (this.mmu.getByte(this.cpu.registers.pc + 2) << 8));
                new_pc = this.cpu.registers.pc + 3;
                break;
            }
        }

        return [arg,new_pc]

    }

}
