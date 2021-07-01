
import { Gameboy } from "./gameboy"
import { _base64ToBuffer } from "./utilities"

let gb: Gameboy;
let breakpoint = 0;


let btn = document.getElementById("startbt");
let one_step_btn = document.getElementById("onestepbt");
let tillbreak = document.getElementById("untilbreak");
let breakpoint_input = <HTMLInputElement>document.getElementById("breakpoint_input");
let registers_div = <HTMLInputElement>document.getElementById("registers");
let screen_obj = <HTMLCanvasElement>document.getElementById("screen");
let full_screen_obj = <HTMLCanvasElement>document.getElementById("fullscreen");
let load_rom = <HTMLInputElement>document.getElementById("loadrom");


window.onload = function () {
    let el = <HTMLDataElement>document.getElementById("not_a_rom");
    console.log(el)
    if (el) {
        let buff = _base64ToBuffer(el.value)
        if (buff) {
            gb = new Gameboy(buff, true)
            console.log('Loaded rom from page!')
        }
    }



    if (one_step_btn) { one_step_btn.addEventListener("click", (e: Event) => 
        {
            gb.RunFrame()
            registers_div.innerHTML = gb.cpu.toString();
            gb.gpu.draw_full_screen(gb.mmu,full_screen_obj);
        })};
       






};
