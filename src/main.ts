import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"




function main() {


    let cpu = new CPU(new Registers());

    let gpu = new GPU();

    // load bootrom on MMU
    let mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin", gpu);


    // gpu.hard_code_nintendo_logo();
    // gpu.draw_screen(mmu);
    // https://www.typescriptlang.org/docs/handbook/classes.html
    let IGetter = InstructionGetter;



    let screen_obj = <HTMLCanvasElement>document.getElementById("screen");

    let op = 0;

    let stop = false;

    // run until PC is at this position, then wait for orders
    let run_until = 0x1D;


    while (true) {

        var old_pc = cpu.registers.pc;

        if (old_pc == run_until) {
            stop = true;
            console.log('Reached checkpoint: ' + run_until.toString(16));
        }

        // debug
        if (stop) {
            let res = prompt('Enter new checkpoint for PC (will stop exec on that position)');

            if (res == 'stop') {
                console.log('EMULATION now over');
                break;
            }
            if (res == 'vram') {
                console.log(mmu.vram);
            }
            else if (res == 'draw') {

                gpu.draw_screen(mmu, screen_obj);
            }
            else if (res == 'cartridge') {
                console.log(mmu.cartridge);
                console.log(mmu.getByte(0x104));
            }
            else if (res == 'registers') {
                console.log(cpu.registers);
            }
            else {
                if (res) {
                    run_until = parseInt(res);
                }
            }


            stop = false
        }

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

        console.log("Running instruction " + inst.help_string + " on arg " + arg.toString(16) + " at " + old_pc.toString(16));

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

// emulation won't start until pressed
let btn = document.getElementById("startbt");
if (btn) { btn.addEventListener("click", (e: Event) => main()); }

