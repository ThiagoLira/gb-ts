import { CPU } from "./cpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"




function main() {


    let cpu = new CPU(new Registers());

    // load bootrom on MMU
    let mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin");

    // https://www.typescriptlang.org/docs/handbook/classes.html
    let IGetter = InstructionGetter;




    let op = 0;


    let numOps = 100;

    while (numOps > 0) {
        numOps--;

        // fetch opcode
        op = mmu.getByte(cpu.registers.pc)
        // detect prefix
        let is_cb = op == 0xCB;
        // fetch opcode after prefix
        if (is_cb) { op = mmu.getByte(++cpu.registers.pc) };

        // fetch Instruction
        var inst = (is_cb) ? IGetter.GetCBInstruction(op) : IGetter.GetInstruction(op);

        var arg = 0;

        switch (inst.arg_number) {

            case 0: {
                cpu.registers.pc++;
                break;
            }
            case 1: {
                arg = mmu.getByte(cpu.registers.pc + 1);
                cpu.registers.pc += 2;

                // convert to 2-complement if highest bit is 1
                if ((arg >> 7) & 0x01) { arg = arg - (1 << 8) }

                break;
            }
            case 2: {
                arg = (mmu.getByte(cpu.registers.pc + 1) + (mmu.getByte(cpu.registers.pc + 2) << 8));
                cpu.registers.pc += 3;
                break;
            }
        }



        console.log("Running instruction " + inst.help_string + " on arg " + arg.toString(16));
        // run op
        inst.op({ arg, cpu, mmu });
        console.log("after instrucion PC value is: " + cpu.registers.pc.toString(16));
    };




}

main();
