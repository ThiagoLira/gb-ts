
import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { GameBoyBus } from "./bus"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"


import 'mocha';
import { expect } from 'chai';



describe('BOOTROM', function() {

    let cpu: CPU;
    let mmu: MMU;
    let gpu: GPU;
    let bus: GameBoyBus;

    beforeEach("init", function() {

        bus = new GameBoyBus();
        gpu = new GPU(bus);
        bus.gpu = gpu;
        cpu = new CPU(bus);
        // load bootrom on MMU
        mmu = new MMU(bus);
        bus.mmu = mmu;

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

describe('logic instructions', function() {

    let cpu: CPU;
    let mmu: MMU;
    let gpu: GPU;
    let bus: GameBoyBus;

    beforeEach("init", function() {

        bus = new GameBoyBus();
        gpu = new GPU(bus);
        bus.gpu = gpu;
        cpu = new CPU(bus);
        // load bootrom on MMU
        mmu = new MMU(bus);
        bus.mmu = mmu;

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

describe('other instructions', function() {

    let cpu: CPU;
    let mmu: MMU;
    let gpu: GPU;
    let bus: GameBoyBus;

    beforeEach("init", function() {

        bus = new GameBoyBus();
        cpu = new CPU(bus);
        gpu = new GPU(bus);
        bus.gpu = gpu;
        // load bootrom on MMU
        mmu = new MMU(bus);
        bus.mmu = mmu;

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

    it('RL C', function() {

        // C before CE
        // C after 9D
        // F before 10
        // F after 10
        cpu.registers.c = 0xCE;
        cpu.registers.f = 0x10;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test INC B
        var inst = IGetter.GetCBInstruction(0x11);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.c).to.equal(0x9D);
        expect(cpu.registers.f).to.equal(0x10);

    });
    it('RL C 2', function() {

        // C before CE
        // C after 9D
        // F before 10
        // F after 10
        cpu.registers.c = 0xEB;
        cpu.registers.f = 0xC0;

        var arg = 0;


        let IGetter = InstructionGetter;

        var inst = IGetter.GetCBInstruction(0x11);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.c).to.equal(0xD6);
        expect(cpu.registers.f).to.equal(0x10);

    });
    it('CP A 34', function() {

        cpu.registers.a = 0x05;
        cpu.registers.f = 0xC0;

        var arg = 0x34;


        let IGetter = InstructionGetter;

        var inst = IGetter.GetInstruction(0xFE);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.f).to.equal(0x50);

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
    it('RLA', function() {


        cpu.registers.a = 0x9D;
        cpu.registers.f = 0x10;
        var arg = 0;


        let IGetter = InstructionGetter;

        // test RLA
        var inst = IGetter.GetInstruction(0x17);
        inst.op({ arg, cpu, mmu });



        expect(cpu.registers.a).to.equal(0x3B);

    });

    it('DEC B', function() {


        cpu.registers.b = 0x04;
        cpu.registers.f = 0x10;
        var arg = 0;


        let IGetter = InstructionGetter;

        // test RLA
        var inst = IGetter.GetInstruction(0x05);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.b).to.equal(0x03);
        expect(cpu.registers.f).to.equal(0x50);
    });

    it('JR NZ 0x0098', function() {

        cpu.registers.a = 0x3B;
        cpu.registers.f = 0x50;
        cpu.registers.pc = 0xA3;

        var arg = 0xF5;


        let IGetter = InstructionGetter;

        // test RLA
        var inst = IGetter.GetInstruction(0x20);
        inst.op({ arg, cpu, mmu });


        expect( cpu.registers.pc).to.equal(0x0098);

    });
    it('POP BC', function() {

        cpu.registers.b = 0x04;
        cpu.registers.c = 0x9C;
        cpu.registers.sp = 0xFFFA;
        // the stack
        mmu.setByte(0xFFFE,0x42)
        mmu.setByte(0xFFFD,0x00)
        mmu.setByte(0xFFFC,0x2B)
        mmu.setByte(0xFFFB,0x04)
        mmu.setByte(0xFFFA,0xCE)

        var arg = 0;


        let IGetter = InstructionGetter;

        // test RLA
        var inst = IGetter.GetInstruction(0xC1);
        inst.op({ arg, cpu, mmu });


        expect(mmu.getByte(0xFFFA)).to.equal(0xCE);
        expect( cpu.registers.sp).to.equal(0xFFFC);
        expect(mmu.getByte(0xFFFB)).to.equal(0x04);

    });
    it('PUSH BC', function() {

        cpu.registers.b = 0x04;
        cpu.registers.c = 0xce;
 
        cpu.registers.sp = 0xFFFC;
       // the stack
        mmu.setByte(0xFFFE,0x42)
        mmu.setByte(0xFFFD,0x00)
        mmu.setByte(0xFFFC,0x2B)
        mmu.setByte(0xFFFB,0xD7)
        mmu.setByte(0xFFFA,0xD6)

        var arg = 0;


        let IGetter = InstructionGetter;

        // test RLA
        var inst = IGetter.GetInstruction(0xC5);
        inst.op({ arg, cpu, mmu });


        expect(mmu.getByte(0xFFFA)).to.equal(0xCE);
        expect( cpu.registers.sp).to.equal(0xFFFA);
        expect(mmu.getByte(0xFFFB)).to.equal(0x04);

    });




    it('LDI (HL),A', function() {


        cpu.registers.a = 0xFC;
        cpu.registers.hl = 0x801A;
        mmu.setByte(0x801A,0x0000)
        var arg = 0;


        let IGetter = InstructionGetter;

        // test RLA
        var inst = IGetter.GetInstruction(0x22);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0xFC);
        expect(mmu.getByte(0x801A)).to.equal(0xFC);
        expect(cpu.registers.hl).to.equal(0x801b);
    });
    it('RLA 2', function() {


        cpu.registers.a = 0b00000100;

        var arg = 0;


        let IGetter = InstructionGetter;

        // test RLA
        var inst = IGetter.GetInstruction(0x17);
        inst.op({ arg, cpu, mmu });



        expect(cpu.registers.a).to.equal(0b00001000);
        expect(cpu.registers.carry_flag).to.equal(0);

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

    it('BGP setup', function() {

        cpu.registers.a = 0;

        let IGetter = InstructionGetter;

        // LD A, 0xFC
        var inst = IGetter.GetCBInstruction(0x3E);
        inst.op({ arg: 0xFC, cpu, mmu });


        // LD (0xFF00 + 0x47), A
        var inst = IGetter.GetCBInstruction(0xE0);
        inst.op({ arg: 0x47, cpu, mmu });

        expect(gpu.bgp).to.equal(0xFC);


    });

    it('LOAD NINTENDO LOGO FROM BOOTROM', function() {

        cpu.registers.a = 0;

        let IGetter = InstructionGetter;

        // LD A, 0xFC
        var inst = IGetter.GetCBInstruction(0x3E);
        inst.op({ arg: 0xFC, cpu, mmu });


        // LD (0xFF00 + 0x47), A
        var inst = IGetter.GetCBInstruction(0xE0);
        inst.op({ arg: 0x47, cpu, mmu });

        expect(gpu.bgp).to.equal(0xFC);


    });
});
