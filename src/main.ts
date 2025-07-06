import { Gameboy } from "./gameboy";
import { _base64ToBuffer } from "./utilities";

let gb: Gameboy;
let breakpoint = -1;
const DEBUG_MODE = true;

// DOM references
const stepBtn = document.getElementById("step-btn") as HTMLButtonElement | null;
const manyStepBtn = document.getElementById("step-many-btn") as HTMLButtonElement | null;
const untilBreakBtn = document.getElementById("run-until-break-btn") as HTMLButtonElement | null;
const breakpointInput = document.getElementById("breakpoint-input") as HTMLInputElement | null;
const oneFrameBtn = document.getElementById("frame-btn") as HTMLButtonElement | null;
const runFramesBtn = document.getElementById("run-frames-btn") as HTMLButtonElement | null;
const framesInput = document.getElementById("frames-input") as HTMLInputElement | null;
const registersDiv = document.getElementById("registers") as HTMLDivElement | null;
const interruptsDiv = document.getElementById("interrupts") as HTMLDivElement | null;
const screenCanvas = document.getElementById("fullscreen") as HTMLCanvasElement | null;
const loadRomInput = document.getElementById("rom-loader") as HTMLInputElement | null;
const logBox = document.getElementById("log-box") as HTMLTextAreaElement | null;

function parseBreakpoint(): void {
  if (!breakpointInput) return;
  const value = breakpointInput.value.trim();
  const num = value.startsWith("0x") || value.startsWith("0X") ?
    parseInt(value, 16) : parseInt(value, 10);
  breakpoint = isNaN(num) ? -1 : num;
}

function updateLog(buffer: string): void {
  if (!DEBUG_MODE || !logBox) return;
  logBox.value = buffer;
}

function refreshUI(): void {
  if (registersDiv) registersDiv.innerHTML = gb.cpu.toString();
  if (interruptsDiv) interruptsDiv.innerHTML = gb.mmu.interruptstate2string();
  if (screenCanvas) gb.gpu.draw_frame_buffer(screenCanvas);
}

function runInstructions(count: number): void {
  for (let i = 0; i < count; i++) {
    const log = gb.RunFrame(true, breakpoint);
    updateLog(log);
    refreshUI();
    if (gb.cpu.registers.pc === breakpoint && breakpoint !== -1) break;
  }
}

function runFrames(count: number): void {
  for (let i = 0; i < count; i++) {
    const log = gb.RunFrame(false, breakpoint);
    updateLog(log);
    refreshUI();
    if (gb.cpu.registers.pc === breakpoint && breakpoint !== -1) break;
  }
}

function runUntilBreakpoint(): void {
  if (breakpoint === -1) return;
  while (gb.cpu.registers.pc !== breakpoint) {
    const log = gb.RunFrame(false, breakpoint);
    updateLog(log);
    refreshUI();
    if (gb.cpu.registers.pc === breakpoint) break;
  }
}

function loadRomFromBuffer(buff: Uint8Array): void {
  gb = new Gameboy(buff, true);
}

window.onload = () => {
  // Load embedded ROM if present
  const romData = document.getElementById("not_a_rom") as HTMLDataElement | null;
  if (romData) {
    const buff = _base64ToBuffer(romData.value);
    gb = new Gameboy(buff, true);
    console.log("Loaded (not) rom from page!");
  }

  breakpointInput?.addEventListener("change", parseBreakpoint);
  parseBreakpoint();

  stepBtn?.addEventListener("click", () => {
    parseBreakpoint();
    runInstructions(1);
  });

  manyStepBtn?.addEventListener("click", () => {
    parseBreakpoint();
    runInstructions(50);
  });

  untilBreakBtn?.addEventListener("click", () => {
    parseBreakpoint();
    runUntilBreakpoint();
  });

  oneFrameBtn?.addEventListener("click", () => {
    parseBreakpoint();
    runFrames(1);
  });

  runFramesBtn?.addEventListener("click", () => {
    parseBreakpoint();
    const count = framesInput ? parseInt(framesInput.value, 10) || 0 : 0;
    if (count > 0) runFrames(count);
  });

  loadRomInput?.addEventListener("change", () => {
    if (!loadRomInput.files || loadRomInput.files.length === 0) return;
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const buff = new Uint8Array(fileReader.result as ArrayBuffer);
      loadRomFromBuffer(buff);
      refreshUI();
    };
    fileReader.readAsArrayBuffer(loadRomInput.files[0]);
  });
};
