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


    HandleInterrupts() : boolean{

        if(!this.mmu.ime){
            return false;
        }


        let interruptFlag = this.mmu.interrupt_flag;

        let interruptEnable = this.mmu.interrupt_enable;


        let handler = 0;

        if ((interruptEnable & interruptFlag & (1 << 0)) != 0) {
            handler = 0x0040; // V-Blank
        }
        if ((interruptEnable & interruptFlag & (1 << 1)) != 0) {
            handler = 0x0048; // LCDC Status
        }
        if ((interruptEnable & interruptFlag & (1 << 2)) != 0) {
            handler = 0x0050; // Timer Overflow
        }
        if ((interruptEnable & interruptFlag & (1 << 3)) != 0) {
            handler = 0x0058; // Serial Transfer
        }
        if ((interruptEnable & interruptFlag & (1 << 4)) != 0) {
            handler = 0x0060; // Hi-Lo of P10-P13
        }


        if (handler != 0){

            // set IME to 0
            this.mmu.ime = 0;
            // set 0xFF0F to 0
            // equivalent to this.mmu.interrupt_flag = 0;
            this.mmu.setByte(0xFF0F,0);

            // PUSH current PC to stack

            this.mmu.setByte(this.cpu.registers.sp - 1, this.cpu.registers.pc >> 8);
            this.mmu.setByte(this.cpu.registers.sp - 2, this.cpu.registers.pc & 0xFF);
            this.cpu.registers.sp -= 2;

            // jump to correct memory location

            this.cpu.registers.pc = handler;

            return true;
        }else{
            return false;
        }





    }

    // this function should run the emulation for 1.1ms i.e. the time
    // to calculate one frame
    RunFrame(){

        let clock_count = 0;


        // one frame timing

        while(clock_count < 70224){

            let old_pc = this.cpu.registers.pc;

            // check for interrupts
            this.HandleInterrupts();

            let {arg,new_pc,inst} = this.FetchOpCode();

            this.cpu.registers.pc = new_pc;

            inst.op({   arg: arg,
                        cpu : this.cpu  ,
                        mmu : this.mmu });

            clock_count += inst.cycles;


            this.gpu.RunClocks(clock_count);

       }

        // update screen



    }



}
