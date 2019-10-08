import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { MMU } from "./mmu"
import { Registers } from "./registers"
import { InstructionConfig, InstructionGetter } from "./instructions"



//this class should hold the complete state of the gameboy to halt and de-halt emulation
export class Gameboy {

    cpu: CPU;
    gpu: GPU;
    mmu: MMU;
    getter = InstructionGetter;



    constructor(buff? : Buffer){
        this.cpu = new CPU(new Registers());

        this.gpu = new GPU();

        this.mmu = new MMU(this.gpu,false,buff);
    }




    // fetch next instruction
    // fetch argument
    // return argument,new_pc and instruction object
    // dont run instruction yet
    FetchOpCode()  {

        // fetch opcode
        let op = this.mmu.getByte(this.cpu.registers.pc)
        // detect prefix
        let is_cb = op == 0xCB;
        // fetch opcode after prefix
        if (is_cb) { op = this.mmu.getByte(++this.cpu.registers.pc) };

        // fetch Instruction
        let inst = (is_cb) ? this.getter.GetCBInstruction(op) : this.getter.GetInstruction(op);

        let arg = 0;
        let new_pc = 0;

        switch (inst.arg_number) {

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

        return {

            arg: arg,
            new_pc: new_pc,
            inst: inst

        }
    }

    // this function should run the emulation for 1.1ms i.e. the time
    // to calculate one frame
    RunFrame(){





    }



}
