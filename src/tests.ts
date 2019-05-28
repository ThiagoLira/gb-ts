
import { CPU } from "./cpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"


import 'mocha';
import { expect } from 'chai';


describe('add', function() {

    let cpu: CPU;
    let mmu: MMU;

    beforeEach("init", function() {

        cpu = new CPU(new Registers());
        // load bootrom on MMU
        mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin");

    });

    afterEach("memory dump", function() {
        if (this.currentTest!.state === 'failed') {
            console.log(cpu.registers);
        }

    });

    it('should add regs A and B and set flags', function() {



        cpu.registers.b = 0x01;
        cpu.registers.a = 0x02;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test ADD A,B
        var inst = IGetter.GetInstruction(0x80);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x3);
    });

    it('0xFF + 0x10 (ADD A,B) should flag an overflow', function() {



        cpu.registers.b = 0xFF;
        cpu.registers.a = 0x10;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test ADD A,B
        var inst = IGetter.GetInstruction(0x80);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x0F);
        expect(cpu.registers.f).to.equal(0b00010000);

    });

    it('A + direct # with underflow on lower nibble', function() {



        cpu.registers.a = 0xF;

        var arg = 0xF;


        let IGetter = InstructionGetter;

        // test ADD A,B
        var inst = IGetter.GetInstruction(0xC6);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x1E);
        expect(cpu.registers.f).to.equal(0b00100000);

    });

});

describe('sub', function() {

    let cpu: CPU;
    let mmu: MMU;

    beforeEach("init", function() {

        cpu = new CPU(new Registers());
        // load bootrom on MMU
        mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin");

    });

    afterEach("memory dump", function() {
        if (this.currentTest!.state === 'failed') {
            console.log(cpu.registers);
        }

    });

    it('0x16 AND 0x90 == 0x10', function() {


        cpu.registers.b = 0x16;
        cpu.registers.a = 0x90;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test ADD A,B
        var inst = IGetter.GetInstruction(0xA0);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x10);

    });

    it('0x16 OR 0x90 == 0x10', function() {


        cpu.registers.b = 0x16;
        cpu.registers.a = 0x90;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test ADD A,B
        var inst = IGetter.GetInstruction(0xB0);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x16 | 0x90);

    });

    it('0x6E - 0x37 == 0x37', function() {


        cpu.registers.b = 0x37;
        cpu.registers.a = 0x6E;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test ADD A,B
        var inst = IGetter.GetInstruction(0x90);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x37);
        expect(cpu.registers.f).to.equal(0b01000000);

    });


});
