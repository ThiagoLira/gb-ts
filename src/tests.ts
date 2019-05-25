
import { CPU } from "./cpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"


import 'mocha';
import { expect } from 'chai';


describe('add', function() {

    let cpu: CPU;
    let mmu: MMU;

    before("init", function() {

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
        console.log(inst.help_string);
        inst.op({ arg, cpu, mmu });

        expect(cpu.registers.a).to.equal(0x3);
    });


});
