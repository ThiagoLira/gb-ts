import { Gameboy } from "./gameboy";
import { _base64ToBuffer } from "./utilities";

// --- State ---
let gb: Gameboy | null = null;
let currentRom: Uint8Array | null = null;
let breakpoint = -1;
let isRunning = false;

// --- DOM refs (cached once) ---
const $ = (id: string) => document.getElementById(id);

const stepBtn = $("step-btn") as HTMLButtonElement;
const stepManyBtn = $("step-many-btn") as HTMLButtonElement;
const frameBtn = $("frame-btn") as HTMLButtonElement;
const runBtn = $("run-btn") as HTMLButtonElement;
const stopBtn = $("stop-btn") as HTMLButtonElement;
const resetBtn = $("reset-btn") as HTMLButtonElement;
const runUntilBreakBtn = $("run-until-break-btn") as HTMLButtonElement;
const stepCountInput = $("step-count") as HTMLInputElement;
const breakpointInput = $("breakpoint-input") as HTMLInputElement;
const loadRomInput = $("rom-loader") as HTMLInputElement;
const disableIOCb = $("disable-io-cb") as HTMLInputElement;

const screenCanvas = $("screen-canvas") as HTMLCanvasElement;
const bgMapCanvas = $("bg-map-canvas") as HTMLCanvasElement;
const tilesetCanvas = $("tileset-canvas") as HTMLCanvasElement;

const registersDiv = $("registers") as HTMLDivElement;
const flagsDiv = $("flags") as HTMLDivElement;
const interruptsDiv = $("interrupts") as HTMLDivElement;
const gpuStateDiv = $("gpu-state") as HTMLDivElement;

const logBox = $("log-box") as HTMLTextAreaElement;
const memAddrInput = $("mem-addr") as HTMLInputElement;
const memInspectBtn = $("mem-inspect-btn") as HTMLButtonElement;
const memDump = $("mem-dump") as HTMLDivElement;
const statusSpan = $("status") as HTMLSpanElement;

// --- Helpers ---
function hex8(n: number): string {
  return "0x" + (n & 0xFF).toString(16).toUpperCase().padStart(2, "0");
}
function hex16(n: number): string {
  return "0x" + (n & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
}

function setStatus(msg: string): void {
  statusSpan.textContent = msg;
}

function parseAddr(s: string): number {
  const v = s.trim();
  const n = v.startsWith("0x") || v.startsWith("0X") ? parseInt(v, 16) : parseInt(v, 10);
  return isNaN(n) ? -1 : n;
}

// --- UI Rendering ---
function renderRegisters(): void {
  if (!gb) { registersDiv.innerHTML = ""; return; }
  const r = gb.cpu.registers;
  const regs: [string, string][] = [
    ["A", hex8(r.a)],  ["F", hex8(r.f)],
    ["B", hex8(r.b)],  ["C", hex8(r.c)],
    ["D", hex8(r.d)],  ["E", hex8(r.e)],
    ["H", hex8(r.h)],  ["L", hex8(r.l)],
    ["SP", hex16(r.sp)], ["PC", hex16(r.pc)],
  ];
  registersDiv.innerHTML = regs.map(([name, val]) =>
    `<div class="reg-item"><span class="reg-name">${name}</span><span class="reg-val">${val}</span></div>`
  ).join("");
}

function renderFlags(): void {
  if (!gb) { flagsDiv.innerHTML = ""; return; }
  const f = gb.cpu.registers.f;
  const flags: [string, boolean][] = [
    ["Z", (f & 0x80) !== 0],
    ["N", (f & 0x40) !== 0],
    ["H", (f & 0x20) !== 0],
    ["C", (f & 0x10) !== 0],
  ];
  flagsDiv.innerHTML = flags.map(([name, on]) =>
    `<span class="flag-pill${on ? " on" : ""}">${name}</span>`
  ).join("");
}

function renderInterrupts(): void {
  if (!gb) { interruptsDiv.innerHTML = ""; return; }
  const intr = gb.bus.interrupts;
  const items: [string, string][] = [
    ["IE", hex8(intr.IE)],
    ["IF", hex8(intr.IF)],
    ["IME", intr.IME ? "1" : "0"],
  ];
  interruptsDiv.innerHTML = items.map(([name, val]) =>
    `<div class="int-item"><span class="reg-name">${name}</span><span class="reg-val">${val}</span></div>`
  ).join("");
}

function renderGPUState(): void {
  if (!gb) { gpuStateDiv.innerHTML = ""; return; }
  const g = gb.gpu;
  const modeNames = ["HBlank", "VBlank", "OAM", "VRAM"];
  const items: [string, string][] = [
    ["Mode", `${g.mode} (${modeNames[g.mode] || "?"})`],
    ["LY", g.ly.toString()],
    ["SCX", g.scx.toString()],
    ["SCY", g.scy.toString()],
    ["LCDC", hex8(g.lcdc)],
    ["BGP", hex8(g.bgp)],
  ];
  gpuStateDiv.innerHTML = items.map(([name, val]) =>
    `<div class="gpu-item"><span class="reg-name">${name}</span><span class="reg-val">${val}</span></div>`
  ).join("");
}

function renderScreen(): void {
  if (!gb) return;
  gb.gpu.draw_screen(screenCanvas);
}

function renderDebugCanvases(): void {
  if (!gb) return;
  gb.gpu.draw_tilemap(gb.mmu, bgMapCanvas);
  gb.gpu.draw_tiles(gb.mmu, tilesetCanvas);
}

function refreshUI(): void {
  renderRegisters();
  renderFlags();
  renderInterrupts();
  renderGPUState();
  renderScreen();
  renderDebugCanvases();
}

function refreshScreenOnly(): void {
  renderScreen();
}

function updateLog(log: string): void {
  if (!log) return;
  const lines = log.split("\n");
  const tail = lines.slice(-50).join("\n");
  logBox.value = tail;
  logBox.scrollTop = logBox.scrollHeight;
}

// --- Execution engine ---
function parseBreakpoint(): void {
  breakpoint = parseAddr(breakpointInput.value);
}


function noUI(): boolean { return disableIOCb.checked; }

function stepOne(): void {
  if (!gb) { setStatus("No ROM loaded"); return; }
  const log = gb.RunFrame(true, -1);
  if (noUI()) { refreshScreenOnly(); } else { updateLog(log); refreshUI(); }
  setStatus(`Stepped — PC=${hex16(gb.cpu.registers.pc)}`);
}

function stepMany(count: number): void {
  if (!gb) { setStatus("No ROM loaded"); return; }
  for (let i = 0; i < count; i++) {
    gb.RunFrame(true, -1);
  }
  if (noUI()) refreshScreenOnly(); else refreshUI();
  setStatus(`Stepped ${count} — PC=${hex16(gb.cpu.registers.pc)}`);
}

function runOneFrame(): void {
  if (!gb) { setStatus("No ROM loaded"); return; }
  const log = gb.RunFrame(false, -1);
  if (noUI()) { refreshScreenOnly(); } else { updateLog(log); refreshUI(); }
  setStatus(`Frame done — PC=${hex16(gb.cpu.registers.pc)}`);
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function runFrames(): Promise<void> {
  if (!gb) { setStatus("No ROM loaded"); return; }
  isRunning = true;
  setStatus("Running...");
  let frameCount = 0;
  while (isRunning) {
    gb.RunFrame(false, -1);
    frameCount++;
    if (noUI()) {
      refreshScreenOnly();
      if (frameCount % 100 === 0) await delay(0);
    } else {
      refreshUI();
      await delay(16);
    }
  }
  refreshUI();
  setStatus(`Stopped after ${frameCount} frames — PC=${hex16(gb.cpu.registers.pc)}`);
}

async function runUntilBreakpoint(): Promise<void> {
  if (!gb) { setStatus("No ROM loaded"); return; }
  if (breakpoint === -1) { setStatus("No breakpoint set"); return; }
  isRunning = true;
  setStatus(`Running to ${hex16(breakpoint)}...`);
  let frameCount = 0;
  while (isRunning) {
    gb.RunFrame(false, breakpoint);
    frameCount++;
    if (gb.cpu.registers.pc === breakpoint) {
      isRunning = false;
      refreshUI();
      setStatus(`Hit breakpoint at ${hex16(breakpoint)} after ${frameCount} frames`);
      return;
    }
    if (noUI()) {
      refreshScreenOnly();
      if (frameCount % 100 === 0) await delay(0);
    } else if (frameCount % 10 === 0) {
      refreshUI();
      await delay(0);
    }
  }
  refreshUI();
  setStatus(`Stopped after ${frameCount} frames — PC=${hex16(gb.cpu.registers.pc)}`);
}

function stopExecution(): void {
  isRunning = false;
  setStatus("Stopped");
}

function resetEmulator(): void {
  isRunning = false;
  if (!currentRom) { setStatus("No ROM to reset"); return; }
  gb = new Gameboy(currentRom, false);
  logBox.value = "";
  memDump.textContent = "";
  refreshUI();
  setStatus("Reset — Ready");
}

// --- Memory inspector ---
function inspectMemory(): void {
  if (!gb) { memDump.textContent = "No ROM loaded"; return; }
  const addr = parseAddr(memAddrInput.value);
  if (addr < 0) { memDump.textContent = "Invalid address"; return; }

  let out = "       00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F\n";
  out += "      ------------------------------------------------\n";
  for (let row = 0; row < 16; row++) {
    const rowAddr = (addr + row * 16) & 0xFFFF;
    out += hex16(rowAddr).slice(2) + " | ";
    let ascii = "";
    for (let col = 0; col < 16; col++) {
      const byteAddr = (rowAddr + col) & 0xFFFF;
      let byte: number;
      try { byte = gb.mmu.getByte(byteAddr); } catch { byte = -1; }
      if (byte < 0) {
        out += "??";
        ascii += "?";
      } else {
        out += byte.toString(16).toUpperCase().padStart(2, "0");
        ascii += (byte >= 0x20 && byte < 0x7F) ? String.fromCharCode(byte) : ".";
      }
      if (col === 7) out += "  "; else out += " ";
    }
    out += " " + ascii + "\n";
  }
  memDump.textContent = out;
}

// --- ROM loading ---
function loadRom(buff: Uint8Array, use_bootrom = false): void {
  currentRom = buff;
  gb = new Gameboy(buff, use_bootrom);
  refreshUI();
  setStatus("ROM loaded — Ready");
}
(window as any).loadRom = loadRom;

// --- Event binding ---
window.onload = () => {
  // Load embedded ROM
  const romData = document.getElementById("not_a_rom") as HTMLDataElement | null;
  if (romData) {
    const buff = _base64ToBuffer(romData.value);
    currentRom = buff;
    gb = new Gameboy(buff, false);
    refreshUI();
    setStatus("Embedded ROM loaded (no bootrom)");
    console.log("Loaded embedded ROM (skip bootrom)");
  }

  stepBtn.addEventListener("click", () => { stepOne(); });
  stepManyBtn.addEventListener("click", () => { stepMany(parseInt(stepCountInput.value, 10) || 50); });
  frameBtn.addEventListener("click", () => { runOneFrame(); });
  runBtn.addEventListener("click", () => { runFrames(); });
  stopBtn.addEventListener("click", stopExecution);
  resetBtn.addEventListener("click", resetEmulator);
  runUntilBreakBtn.addEventListener("click", () => { parseBreakpoint(); runUntilBreakpoint(); });

  memInspectBtn.addEventListener("click", inspectMemory);
  memAddrInput.addEventListener("keydown", (e) => { if (e.key === "Enter") inspectMemory(); });

  loadRomInput.addEventListener("change", () => {
    if (!loadRomInput.files || loadRomInput.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      const buff = new Uint8Array(reader.result as ArrayBuffer);
      loadRom(buff);
    };
    reader.readAsArrayBuffer(loadRomInput.files[0]);
  });

  document.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    switch (e.key) {
      case "s": stepOne(); break;
      case "f": runOneFrame(); break;
      case "Escape": stopExecution(); break;
    }
  });

  // --- Claude debug API ---
  (window as any).__debug = {
    registers() {
      if (!gb) return null;
      const r = gb.cpu.registers;
      return { a: r.a, f: r.f, b: r.b, c: r.c, d: r.d, e: r.e, h: r.h, l: r.l, sp: r.sp, pc: r.pc };
    },
    flags() {
      if (!gb) return null;
      const f = gb.cpu.registers.f;
      return { Z: !!(f & 0x80), N: !!(f & 0x40), H: !!(f & 0x20), C: !!(f & 0x10) };
    },
    gpu() {
      if (!gb) return null;
      const g = gb.gpu;
      return { mode: g.mode, ly: g.ly, scx: g.scx, scy: g.scy, lcdc: g.lcdc, bgp: g.bgp, stat: g.stat };
    },
    interrupts() {
      if (!gb) return null;
      const i = gb.bus.interrupts;
      return { IE: i.IE, IF: i.IF, IME: i.IME };
    },
    mem(addr: number, len = 256) {
      if (!gb) return null;
      const bytes: number[] = [];
      for (let i = 0; i < len; i++) {
        try { bytes.push(gb.mmu.getByte((addr + i) & 0xFFFF)); } catch { bytes.push(-1); }
      }
      return bytes;
    },
    memHex(addr: number, len = 256) {
      const bytes = this.mem(addr, len);
      if (!bytes) return null;
      return bytes.map((b: number) => b < 0 ? "??" : b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
    },
    step(n = 1) {
      if (n === 1) stepOne(); else stepMany(n);
      return this.state();
    },
    frame(n = 1) {
      for (let i = 0; i < n; i++) runOneFrame();
      return this.state();
    },
    reset() {
      resetEmulator();
      return this.state();
    },
    bp(addr: number) {
      breakpointInput.value = "0x" + addr.toString(16);
      parseBreakpoint();
      return breakpoint;
    },
    mbc() {
      if (!gb) return null;
      return { romBank: gb.mmu.romBank, ramBank: gb.mmu.ramBank, ramEnabled: gb.mmu.ramEnabled, romSize: gb.mmu.rom.length };
    },
    state() {
      return {
        registers: this.registers(),
        flags: this.flags(),
        gpu: this.gpu(),
        interrupts: this.interrupts(),
        mbc: this.mbc(),
        status: statusSpan.textContent,
      };
    },
    // --- Memory watchpoints ---
    // Watch writes to an address. value=-1 means any write, otherwise triggers only on that value.
    watchMem(addr: number, value = -1) {
      if (!gb) return 'no rom';
      gb.mmu.watchpoints.set(addr, { value });
      return `watching 0x${addr.toString(16)}` + (value === -1 ? ' (any write)' : ` (value=0x${value.toString(16)})`);
    },
    unwatchMem(addr: number) {
      if (!gb) return 'no rom';
      gb.mmu.watchpoints.delete(addr);
      return `unwatched 0x${addr.toString(16)}`;
    },
    clearWatches() {
      if (!gb) return 'no rom';
      gb.mmu.watchpoints.clear();
      return 'all watches cleared';
    },
    // Run until a watchpoint fires or maxFrames reached. Returns the watch hit + trace.
    runUntilWatch(maxFrames = 10000) {
      if (!gb) return null;
      gb.mmu.lastWatchHit = null;
      for (let i = 0; i < maxFrames; i++) {
        gb.RunFrame(false, -1);
        if (gb.mmu.lastWatchHit) {
          const hit = gb.mmu.lastWatchHit;
          gb.mmu.lastWatchHit = null;
          const r = gb.cpu.registers;
          return {
            hit: {
              address: '0x' + hit.address.toString(16),
              value: '0x' + hit.value.toString(16),
              oldValue: '0x' + hit.oldValue.toString(16),
            },
            frame: i,
            state: this.state(),
            trace: this.trace(30),
          };
        }
      }
      return { hit: null, msg: 'no watchpoint hit in ' + maxFrames + ' frames' };
    },
    // Get the last N trace entries (instruction history)
    trace(n = 50) {
      if (!gb) return null;
      const buf = gb.traceBuffer;
      const entries = buf.slice(-n);
      return entries.map((t: any) =>
        `PC=${t.pc.toString(16).padStart(4,'0')} [${t.opcode.toString(16).padStart(2,'0')}] ${t.help.padEnd(16)} ` +
        `A=${t.a.toString(16).padStart(2,'0')} F=${t.f.toString(16).padStart(2,'0')} ` +
        `BC=${((t.b<<8)|t.c).toString(16).padStart(4,'0')} DE=${((t.d<<8)|t.e).toString(16).padStart(4,'0')} ` +
        `HL=${((t.h<<8)|t.l).toString(16).padStart(4,'0')} SP=${t.sp.toString(16).padStart(4,'0')} ` +
        `LY=${t.ly} IME=${t.ime} IE=${t.ie.toString(16)} IF=${t.if_.toString(16)}`
      );
    },
    // Run until watch, returning just the compact trace (for large searches)
    runUntilWatchCompact(maxFrames = 10000) {
      if (!gb) return null;
      gb.mmu.lastWatchHit = null;
      for (let i = 0; i < maxFrames; i++) {
        gb.RunFrame(false, -1);
        if (gb.mmu.lastWatchHit) {
          const hit = gb.mmu.lastWatchHit;
          gb.mmu.lastWatchHit = null;
          return {
            addr: '0x' + hit.address.toString(16),
            val: '0x' + hit.value.toString(16),
            old: '0x' + hit.oldValue.toString(16),
            frame: i,
            pc: '0x' + gb.cpu.registers.pc.toString(16),
            sp: '0x' + gb.cpu.registers.sp.toString(16),
          };
        }
      }
      return null;
    },
  };
};
