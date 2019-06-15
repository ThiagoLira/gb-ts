import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"




function main() {


    let cpu = new CPU(new Registers());

    // load bootrom on MMU
    let mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin");

    let gpu = new GPU();

    gpu.hard_code_nintendo_logo();
    // https://www.typescriptlang.org/docs/handbook/classes.html
    let IGetter = InstructionGetter;




    let op = 0;


    let numOps = 10;

    while (numOps > 0) {
        numOps--;


        var old_pc = cpu.registers.pc;

        // fetch opcode
        try { op = mmu.getByte(cpu.registers.pc) }
        catch { console.log("Unable to get next instruction"); console.log(cpu.registers.pc.toString(16)) };
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

        // console.log("Running instruction " + inst.help_string + " on arg " + arg.toString(16));
        if (inst.cycles == 0) { console.log(inst.help_string); console.log(old_pc.toString(16)); break };


        try { inst.op({ arg, cpu, mmu }); }
        catch (err) {
            console.log(err);
            console.log(cpu.registers.de);
            console.log("failed to run " + inst.help_string);
            break;
        }
    };




}

main();
