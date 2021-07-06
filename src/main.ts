import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"
import { Gameboy } from "./gameboy"
import {_base64ToBuffer} from "./utilities"

let gb : Gameboy;
let breakpoint = 0;




// main function runs gameboy until breakpoint is reached,
// then returns a new breakpoint on the next instruction, plus the new gameboy state
function main(breakpoint: number, gameboy: Gameboy) : [number,Gameboy] {


    let count = 0;

    let stop = false;


    gameboy.cpu.registers.pc = 0x0;

    let will_break = false;

    while (true) {

        count++;


        // probably all of this will eventually be inside runFrame function
        let old_pc = gameboy.cpu.registers.pc;

        let {arg,new_pc,inst} = gameboy.FetchOpCode();

        if(count==100){
            count = 0;

            console.log('Reached checkpoint: ' + old_pc.toString(16));
            console.log('Will run ' + inst.help_string + " next.")
        }

        // check before running instruction
        if (old_pc == breakpoint  ) {
            stop = true;
            console.log('Reached checkpoint: ' + breakpoint.toString(16));
            console.log('Will run ' + inst.help_string + " next.")
            registers_div.innerHTML = gameboy.cpu.toString();
            console.log(gameboy.gpu.tileset2string());
            console.log(gameboy.gpu.tilemap2string(gameboy.mmu));
            gameboy.gpu.draw_tiles(gameboy.mmu,screen_obj);
            gameboy.gpu.draw_screen(gameboy.mmu,full_screen_obj);

            will_break = true;
        }

        // must run instruction before breaking
        gameboy.cpu.registers.pc = new_pc;


        // run interruption
        inst.op({ arg: arg,
                  cpu : gameboy.cpu  ,
                  mmu : gameboy.mmu });

        gameboy.gpu.RunClocks(inst.cycles);

        gameboy.HandleInterrupts();


        if (will_break) {
            return [breakpoint,gameboy]
        }

    };


    // why are u here?
    return [breakpoint,gameboy]

}



function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

let btn = document.getElementById("startbt");
let one_step_btn = document.getElementById("onestepbt");
let tillbreak = document.getElementById("untilbreak");
let breakpoint_input =  <HTMLInputElement>document.getElementById("breakpoint_input") ;
let registers_div =  <HTMLInputElement>document.getElementById("registers") ;
let screen_obj = <HTMLCanvasElement>document.getElementById("screen");
let full_screen_obj = <HTMLCanvasElement>document.getElementById("fullscreen");
let load_rom = <HTMLInputElement>document.getElementById("loadrom");

window.onload = function () {
        let el = <HTMLDataElement>document.getElementById("not_a_rom");
        console.log(el)
        if (el){
            let buff = _base64ToBuffer(el.value)
                if(buff){
                    gb = new Gameboy(buff, true)
                    console.log('Loaded rom from page!')
                }
        }

};




if (load_rom) { load_rom.addEventListener("change", (e: Event) =>
                                          {var fileReader = new FileReader();

                                           fileReader.onload = function (e) {
                                               let buff = new Buffer(fileReader.result as ArrayBuffer);

                                               gb = new Gameboy(buff,true);

                                           }
                                           fileReader.readAsArrayBuffer((load_rom.files as FileList)[0]);

                                          }) }



if (tillbreak) { tillbreak.addEventListener("click", (e: Event) => [breakpoint,gb] = main(parseInt(breakpoint_input.value) ,gb)); }

if (one_step_btn) { one_step_btn.addEventListener("click", (e: Event) => [breakpoint,gb] = main(breakpoint,gb)); }
