
import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"


import 'mocha';
import { expect } from 'chai';



describe('BOOTROM', function() {

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

    it('FIRST INSTRUCTIONS', function() {




        var arg = 0;


        let IGetter = InstructionGetter;

        // test ADD A,B
        var inst = IGetter.GetInstruction(0xAF);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x0);

        arg = 0x9fff;

        var inst = IGetter.GetInstruction(0x21);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.hl).to.equal(0x9fff);


        var inst = IGetter.GetInstruction(0x32);
        inst.op({ arg, cpu, mmu });

        expect(mmu.getByte(0x9fff)).to.equal(0);
    });
});

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

    it('should add regs a and b and set flags', function() {



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

    it('INC B 0xF, check lower nibble overflow', function() {


        cpu.registers.b = 0xF;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test INC B
        var inst = IGetter.GetInstruction(0x04);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.b).to.equal(0xF + 1);
        expect(cpu.registers.f).to.equal(0b00100000);

    });

    it('SWAP C', function() {


        cpu.registers.c = 0xF0;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test INC B
        var inst = IGetter.GetCBInstruction(0x31);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.c).to.equal(0x0F);
        expect(cpu.registers.f).to.equal(0b00000000);

    });
    it('set HL', function() {


        cpu.registers.hl = 0b11010011;



        // test INC B

        expect(cpu.registers.hl).to.equal(0b11010011);

    });
    it('HL == H | L', function() {


        cpu.registers.h = 0b1101;
        cpu.registers.l = 0b10;



        // test INC B

        // expect(cpu.registers.hl).to.equal(0b11010010);

    });
    it('BIT 7 H', function() {


        cpu.registers.h = 0b10000000;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test INC B
        var inst = IGetter.GetCBInstruction(0x7C);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.f).to.equal(0b00100000);

    });

    it('GPU reset', function() {

        // let gpu = new GPU();


        // console.log(gpu.tileset_data);


    });
});
