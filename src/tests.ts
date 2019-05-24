
import { CPU } from "./cpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"


import 'mocha';
import { expect } from 'chai';


describe('add', function() {

    it('should add regs A and B and set flags', function() {


        let cpu = new CPU(new Registers());

        // load bootrom on MMU
        let mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin");

        cpu.registers.b = 0x01;
        cpu.registers.a = 0x02;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test ADD A,B
        var inst = IGetter.GetInstruction(0x80);

        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x3);
    });
});
