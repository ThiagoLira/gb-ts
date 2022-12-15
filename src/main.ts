
import { Gameboy } from "./gameboy"
import { _base64ToBuffer } from "./utilities"

let gb: Gameboy;
let breakpoint = 0;

const DEBUG_MODE = true;

let one_step_btn = document.getElementById("onestepbt");
let many_step_btn = <HTMLInputElement>document.getElementById("manystep");
let tillbreak_btn = document.getElementById("untilbreak");
let breakpoint_input = <HTMLInputElement>document.getElementById("breakpoint_input");
let one_frame_btn = <HTMLInputElement>document.getElementById("oneframebt");
let run_500_frames_btn = <HTMLInputElement>document.getElementById("framesbt");
let registers_div = <HTMLInputElement>document.getElementById("registers");
let interrupts_div = <HTMLInputElement>document.getElementById("interrupts");
let screen_obj = <HTMLCanvasElement>document.getElementById("screen");
let full_screen_obj = <HTMLCanvasElement>document.getElementById("fullscreen");
let load_rom = <HTMLInputElement>document.getElementById("loadrom");
let log_buffer = <HTMLTextAreaElement>document.getElementById("log_buffer");


window.onload = function() {

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


        let frame_and_draw = () => {
                gb.RunFrame()
                registers_div.innerHTML = gb.cpu.toString();
                interrupts_div.innerHTML = gb.mmu.interruptstate2string();
                if (DEBUG_MODE) {
                        let log_line = gb.getLog();
                        log_buffer.value += log_line + '\n'
                }
                gb.gpu.draw_screen(gb.mmu, full_screen_obj);

        }

        // run one instruction
        if (one_step_btn) {
                one_step_btn.addEventListener("click", (e: Event) => {
                        // run just one instruction with parameter 
                        // just_one_instruction
                        gb.RunFrame(true)
                        registers_div.innerHTML = gb.cpu.toString();
                        interrupts_div.innerHTML = gb.mmu.interruptstate2string();
                        gb.gpu.draw_screen(gb.mmu, full_screen_obj);
                })
        };
        // run 500 instructions
        if (many_step_btn) {
                many_step_btn.addEventListener("click", (e: Event) => {
                        // run just one instruction with parameter 
                        let log_line = gb.getLog();
                        log_buffer.value += log_line + '\n'
                        for (var i = 0; i < 500; i++) {
                                gb.RunFrame(true)
                                if (DEBUG_MODE) {
                                        let log_line = gb.getLog();
                                        log_buffer.value += log_line + '\n'
                                }
                        }
                        registers_div.innerHTML = gb.cpu.toString();
                        interrupts_div.innerHTML = gb.mmu.interruptstate2string();
                        gb.gpu.draw_screen(gb.mmu, full_screen_obj);
                })
        };

        // run until breakpoint OR ONE FRAME
        if (tillbreak_btn) {
                tillbreak_btn.addEventListener("click", (e: Event) => {
                        //parse breakpoint
                        let bpt = parseInt(breakpoint_input.value)

                        // run just one instruction with parameter 
                        // just_one_instruction
                        gb.RunFrame(false, bpt)
                        registers_div.innerHTML = gb.cpu.toString();
                        interrupts_div.innerHTML = gb.mmu.interruptstate2string();
                        gb.gpu.draw_screen(gb.mmu, full_screen_obj);
                })
        };

        // run one frame
        if (one_frame_btn) {
                one_frame_btn.addEventListener("click", (e: Event) => {
                        // run 1 frames
                        setTimeout(frame_and_draw, 16)
                })
        };

        // run 500 frames
        if (run_500_frames_btn) {
                run_500_frames_btn.addEventListener("click", (e: Event) => {
                        // run 500 frames
                        for (var i = 0; i < 500; i++) {
                                setTimeout(frame_and_draw, 16)
                        }
                })
        };

        if (load_rom) {

                load_rom.addEventListener("change", (e: Event) => {
                        var fileReader = new FileReader();

                        fileReader.onload = function(e) {
                                let buff = new Buffer(fileReader.result as ArrayBuffer);

                                gb = new Gameboy(buff, true);
                                console.log('loaded gameboy with ROM provided!');
                                if (DEBUG_MODE) {
                                        // load values that should be in memory after bootrom runs
                                        // A 	0x01
                                        // F 	0xB0 (or CH-Z if managing flags individually)
                                        // B 	0x00
                                        // C 	0x13
                                        // D 	0x13
                                        // E 	0xD8
                                        // H 	0x01
                                        // L 	0x4D
                                        // SP 	0xFFFE
                                        // PC 	0x0100
                                        gb.cpu.registers.a = 0x01
                                        gb.cpu.registers.f = 0xB0
                                        gb.cpu.registers.b = 0x00
                                        gb.cpu.registers.c = 0x13
                                        gb.cpu.registers.d = 0x00
                                        gb.cpu.registers.e = 0xD8
                                        gb.cpu.registers.h = 0x01
                                        gb.cpu.registers.l = 0x4D
                                        gb.cpu.registers.sp = 0xFFFE
                                        gb.cpu.registers.pc = 0x0100
                                }
                                registers_div.innerHTML = gb.cpu.toString();
                                interrupts_div.innerHTML = gb.mmu.interruptstate2string();

                        }
                        fileReader.readAsArrayBuffer((load_rom.files as FileList)[0]);

                })
        }




};
