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



    constructor(buff : Buffer,use_bootrom : boolean){
        this.cpu = new CPU(new Registers());

        this.gpu = new GPU();

        this.mmu = new MMU(this.gpu,use_bootrom,buff);
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

    // interfaces CPU and MMU to check for interrupts
    CheckInterrupts(){

        // check for interrupts






    }

    // this function should run the emulation for 1.1ms i.e. the time
    // to calculate one frame
    RunFrame(){

        let clock_count = 0;


        // one frame timing

        while(clock_count < 70224){

            let old_pc = this.cpu.registers.pc;

            let {arg,new_pc,inst} = this.FetchOpCode();

            this.cpu.registers.pc = new_pc;

            // run interruption
            inst.op({   arg: arg,
                        cpu : this.cpu  ,
                        mmu : this.mmu });

            clock_count += inst.cycles;


            this.gpu.run_clocks(clock_count);

            // check for interrupts

            if (this.mmu.ime && this.mmu.interrupt_enable && this.mmu.interrupt_flag ){

                // execute interrupts


            }




       }

        // update screen



    }



}
