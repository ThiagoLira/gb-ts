import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"
import { Gameboy } from "./gameboy"


let gameboy = new Gameboy()
let IGetter = InstructionGetter;
let breakpoint = 0;



// main function runs gameboy until breakpoint is reached,
// then returns a new breakpoint on the next instruction, plus the new gameboy state
function main(breakpoint: number, gameboy: Gameboy) : [number,Gameboy] {

    let stop = false;

    while (true) {

        var old_pc = gameboy.cpu.registers.pc;
        // fetch opcode
        let op = gameboy.mmu.getByte(gameboy.cpu.registers.pc)

        // detect prefix
        let is_cb = op == 0xCB;
        // fetch opcode after prefix
        if (is_cb) { op = gameboy.mmu.getByte(++gameboy.cpu.registers.pc) };

        // fetch Instruction
        var inst = (is_cb) ? IGetter.GetCBInstruction(op) : IGetter.GetInstruction(op);

        let arg = 0;
        let new_pc = 0;

        [arg,new_pc] = gameboy.GetArgAndPC(inst.arg_number);

        // check before running instruction
        if (old_pc == breakpoint ) {
            stop = true;
            console.log('Reached checkpoint: ' + breakpoint.toString(16));
            console.log('Will run ' + inst.help_string + " next.")
            registers_div.innerHTML = gameboy.cpu.toString();
            console.log(gameboy.gpu.tileset2string());
            gameboy.gpu.draw_screen(gameboy.mmu,screen_obj)
            breakpoint = new_pc;
            return [breakpoint,gameboy]
        }else{
            //commit to new PC and keep going
            gameboy.cpu.registers.pc = new_pc;
        }


        if (inst.cycles == 0) { console.log(inst.help_string); console.log(old_pc.toString(16)); break };

         inst.op({ arg: arg,
                        cpu : gameboy.cpu  ,
                        mmu : gameboy.mmu });

        // machine cycles logic


    };


    // why are u here?
    return [breakpoint,gameboy]

}



function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

let btn = document.getElementById("startbt");
let one_step_btn = document.getElementById("onestepbt");
let breakpoint_input =  <HTMLInputElement>document.getElementById("breakpoint_input") ;
let registers_div =  <HTMLInputElement>document.getElementById("registers") ;
let screen_obj = <HTMLCanvasElement>document.getElementById("screen");






if (btn) { btn.addEventListener("click", (e: Event) => [breakpoint,gameboy] = main(parseInt(breakpoint_input.value) ,gameboy)); }

if (one_step_btn) { one_step_btn.addEventListener("click", (e: Event) => [breakpoint,gameboy] = main(breakpoint,gameboy)); }
