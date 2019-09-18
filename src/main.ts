import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"




// will run emulator until pc==breakpoint and then run_n_more steps
function main(breakpoint: number,run_n_more : number) {


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
    // let breakpoint = 0x95;


    let count_to_stop = 0;


    while (true) {



        var old_pc = cpu.registers.pc;
        // fetch opcode
        op = mmu.getByte(cpu.registers.pc)

        // detect prefix
        let is_cb = op == 0xCB;

        // fetch opcode after prefix
        if (is_cb) { op = mmu.getByte(++cpu.registers.pc) };

        // fetch Instruction
        try{var inst = (is_cb) ? IGetter.GetCBInstruction(op) : IGetter.GetInstruction(op);}
        catch(err){
            console.log(err);
            break;
        }

        if(stop){
            count_to_stop++
            console.log("--------------------------------------")
            console.log( 'At memory position ' + old_pc.toString(16));
            console.log('Will run ' + inst.help_string + " next.")
            console.log(cpu.toString());
            console.log("--------------------------------------")
            if(count_to_stop == run_n_more){
                break;
            }

        }

        if (old_pc == breakpoint && (~stop)) {
            stop = true;
            console.log('Reached checkpoint: ' + breakpoint.toString(16));
            console.log('Will run ' + inst.help_string + " next.")
            console.log(cpu.toString());
            console.log(gpu.tileset2string());
            gpu.draw_screen(mmu,screen_obj)
        }


        var arg = 0;

        switch (inst.arg_number) {

            case 0: {
                cpu.registers.pc++;
                break;
            }
            case 1: {
                arg = mmu.getByte(cpu.registers.pc + 1);
                cpu.registers.pc += 2;
                break;
            }
            case 2: {
                arg = (mmu.getByte(cpu.registers.pc + 1) + (mmu.getByte(cpu.registers.pc + 2) << 8));
                cpu.registers.pc += 3;
                break;
            }
        }


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
let breakpoint_input =  <HTMLInputElement>document.getElementById("breakpoint_input") ;

if (btn) { btn.addEventListener("click", (e: Event) => main(    parseInt(breakpoint_input.value) ,5  )); }

