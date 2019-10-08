import { CPU } from "./cpu"
import { GPU } from "./gpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { InstructionConfig, InstructionGetter } from "./instructions"
import { Gameboy } from "./gameboy"


let gb : Gameboy;
let breakpoint = 0;



// main function runs gameboy until breakpoint is reached,
// then returns a new breakpoint on the next instruction, plus the new gameboy state
function main(breakpoint: number, gameboy: Gameboy) : [number,Gameboy] {

    let stop = false;


    gameboy.cpu.registers.pc = 0x2817;


    console.log(gameboy.mmu.cartridge2string());


    while (true) {

        let old_pc = gameboy.cpu.registers.pc;

        let {arg,new_pc,inst} = gameboy.FetchOpCode();

        console.log('Reached checkpoint: ' + old_pc.toString(16));
        console.log('Will run ' + inst.help_string + " next.")
        // check before running instruction
        if (old_pc == breakpoint ) {
            stop = true;
            console.log('Reached checkpoint: ' + breakpoint.toString(16));
            console.log('Will run ' + inst.help_string + " next.")
            registers_div.innerHTML = gameboy.cpu.toString();
            // console.log(gameboy.gpu.tileset2string());
            console.log(gameboy.mmu.cartridge2string());
            gameboy.gpu.draw_screen(gameboy.mmu,screen_obj);
            gameboy.cpu.registers.pc = new_pc;
            // run instruction to keep going later
            inst.op({ arg: arg,
                      cpu : gameboy.cpu  ,
                      mmu : gameboy.mmu });

            breakpoint = gameboy.cpu.registers.pc;

            return [breakpoint,gameboy]
        }

        gameboy.cpu.registers.pc = new_pc;

        inst.op({ arg: arg,
                        cpu : gameboy.cpu  ,
                        mmu : gameboy.mmu });

        // machine cycles logic
        // console.log("-----------------------------------")
        // console.log("Register C before : " + gameboy.cpu.registers.c.toString(16) + "Carry flag : " + gameboy.cpu.registers.carry_flag.toString(16))
        // console.log(inst.help_string + " on arg " + arg.toString(16));
        // console.log("Register C after : " + gameboy.cpu.registers.c.toString(16)+ "Carry flag : " + gameboy.cpu.registers.carry_flag.toString(16))
        // console.log("-----------------------------------")



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
let load_rom = <HTMLInputElement>document.getElementById("loadrom");





if (load_rom) { load_rom.addEventListener("change", (e: Event) =>
                                          {var fileReader = new FileReader();

                                           fileReader.onload = function (e) {
                                               let buff = new Buffer(fileReader.result as ArrayBuffer);

                                               gb = new Gameboy(buff)

                                           }
                                           fileReader.readAsArrayBuffer((load_rom.files as FileList)[0]);

                                          }) }

if (btn) { btn.addEventListener("click", (e: Event) => [breakpoint,gb] = main(parseInt(breakpoint_input.value) , gb)); }

if (tillbreak) { tillbreak.addEventListener("click", (e: Event) => [breakpoint,gb] = main(parseInt(breakpoint_input.value) ,gb)); }

if (one_step_btn) { one_step_btn.addEventListener("click", (e: Event) => [breakpoint,gb] = main(breakpoint,gb)); }
