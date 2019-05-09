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

    let gameRunning = true;



    let op = 0;


    while (gameRunning) {


        // fetch opcode
        op = mmu.bios[cpu.registers.pc]
        console.log(op);
        // fetch Instruction
        var inst = IGetter.GetInstruction(op);

        var arg = 0;

        switch (inst.arg_number) {

            case 0: { cpu.registers.pc++; break; }
            case 1: { cpu.registers.pc += 2; arg = mmu.bios[cpu.registers.pc + 1] }
            case 2: { cpu.registers.pc += 3; arg = mmu.bios[cpu.registers.pc + 1] + mmu.bios[cpu.registers.pc + 2] << 8 }
        }

        console.log(arg);
        console.log(op);

        gameRunning = false;

    };




}

main();
