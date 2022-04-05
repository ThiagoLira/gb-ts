
import { Gameboy } from "./gameboy"
import { _base64ToBuffer } from "./utilities"

let gb: Gameboy;
let breakpoint = 0;


let btn = document.getElementById("startbt");
let one_step_btn = document.getElementById("onestepbt");
let tillbreak_btn = document.getElementById("untilbreak");
let breakpoint_input = <HTMLInputElement>document.getElementById("breakpoint_input");
let one_frame_btn = <HTMLInputElement>document.getElementById("oneframebt");
let run_500_frames_btn = <HTMLInputElement>document.getElementById("framesbt");
let registers_div = <HTMLInputElement>document.getElementById("registers");
let interrupts_div = <HTMLInputElement>document.getElementById("interrupts");
let screen_obj = <HTMLCanvasElement>document.getElementById("screen");
let full_screen_obj = <HTMLCanvasElement>document.getElementById("fullscreen");
let load_rom = <HTMLInputElement>document.getElementById("loadrom");


window.onload = function () {
    
    // first load this, which is totally not a base64 encoded ROM
    let el = <HTMLDataElement>document.getElementById("not_a_rom");
    console.log(el)
    if (el) {
        let buff = _base64ToBuffer(el.value)
        if (buff) {
            gb = new Gameboy(buff, true)
            console.log('Loaded (not) rom from page!')
        }
    }


    let frame_and_draw = () =>{
            gb.RunFrame()
            registers_div.innerHTML = gb.cpu.toString();
            interrupts_div.innerHTML = gb.mmu.interruptstate2string();
            gb.gpu.draw_screen(gb.mmu,full_screen_obj);
        
    }

    // run one instruction
    if (one_step_btn) { one_step_btn.addEventListener("click", (e: Event) => 
        {
            // run just one instruction with parameter 
            // just_one_instruction
            gb.RunFrame(true)
            registers_div.innerHTML = gb.cpu.toString();
            interrupts_div.innerHTML = gb.mmu.interruptstate2string();
            gb.gpu.draw_screen(gb.mmu,full_screen_obj);
        })};
    
    // run until breakpoint OR ONE FRAME
    if (tillbreak_btn) { tillbreak_btn.addEventListener("click", (e: Event) => 
        {
            //parse breakpoint
            let bpt = parseInt(breakpoint_input.value)

            // run just one instruction with parameter 
            // just_one_instruction
            gb.RunFrame(false, bpt)
            registers_div.innerHTML = gb.cpu.toString();
            interrupts_div.innerHTML = gb.mmu.interruptstate2string();
            gb.gpu.draw_screen(gb.mmu,full_screen_obj);
        })};

    // run one frame
    if (one_frame_btn) { one_frame_btn.addEventListener("click", (e: Event) => 
        {
            // run 1 frames
            setTimeout(frame_and_draw,16)
        })};

    // run 500 frames
    if (run_500_frames_btn) { run_500_frames_btn.addEventListener("click", (e: Event) => 
        {
            // run 500 frames
            for (var i = 0; i < 500; i++) {
            setTimeout(frame_and_draw,16)
            }
        })};
       






};
