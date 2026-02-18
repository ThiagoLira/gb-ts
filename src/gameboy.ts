import { CPU } from "./cpu"
import { GameBoyBus } from "./bus"
import { GPU } from "./gpu"
import { MMU } from "./mmu"
import { Registers } from "./registers"
import { InstructionConfig, InstructionGetter } from "./instructions"

export type TraceEntry = {
	pc: number;
	opcode: number;
	a: number; f: number; b: number; c: number;
	d: number; e: number; h: number; l: number;
	sp: number;
	ly: number;
	ime: number;
	ie: number;
	if_: number;
	help: string;
};

//this class should hold the complete state of the gameboy to halt and de-halt emulation
export class Gameboy {
	bus: GameBoyBus;

	cpu: CPU;
	gpu: GPU;
        mmu: MMU;
        getter = InstructionGetter;

        // stores the last 50 executed instruction logs
        logBuffer: string[] = [];

        // Instruction trace ring buffer (last 200 instructions)
        traceBuffer: TraceEntry[] = [];
        traceMax: number = 5000;



	constructor(buff: Uint8Array, use_bootrom: boolean) {
		this.bus = new GameBoyBus();
		this.cpu = new CPU(this.bus);
		this.bus.cpu = this.cpu;

		this.gpu = new GPU(this.bus);
		this.bus.gpu = this.gpu;

		this.mmu = new MMU(this.bus, use_bootrom, buff);
		this.bus.mmu = this.mmu;
	}






	// fetch next instruction
	// fetch argument
	// return argument,new_pc and instruction object
	// dont run instruction yet
	FetchOpCode() {

		// fetch opcode
		let op = this.mmu.getByte(this.cpu.registers.pc)
		// detect prefix
		let is_cb = op == 0xCB;
		// fetch opcode after prefix
		if (is_cb) { op = this.mmu.getByte(++this.cpu.registers.pc) };

		// fetch Instruction
		let inst = (is_cb) ? this.getter.GetCBInstruction(op) : this.getter.GetInstruction(op);

		let arg = 0;
		let new_pc = 0;

		switch (inst.arg_number) {

			case 0: {
				new_pc = this.cpu.registers.pc + 1;
				break;
			}
			case 1: {
				arg = this.mmu.getByte(this.cpu.registers.pc + 1);
				new_pc = this.cpu.registers.pc + 2;
				break;
			}
			case 2: {
				arg = (this.mmu.getByte(this.cpu.registers.pc + 1) + (this.mmu.getByte(this.cpu.registers.pc + 2) << 8));
				new_pc = this.cpu.registers.pc + 3;
				break;
			}
		}

		return {

			arg: arg,
			new_pc: new_pc,
			inst: inst

		}
	}


	HandleInterrupts(): boolean {

		// HALT wakes up when any interrupt is pending (IE & IF), even if IME=0
		if (this.cpu.halted && (this.bus.interrupts.IE & this.bus.interrupts.IF & 0x1F)) {
			this.cpu.halted = false;
		}

		if (!this.bus.interrupts.IME) {
			return false;
		}


		let interruptFlag = this.bus.interrupts.IF;

		let interruptEnable = this.bus.interrupts.IE;

		let interruptName = '';

		let handler = 0;
		let interruptBit = -1;

		// Priority: VBlank > LCDC > Timer > Serial > Joypad
		// Use else-if so highest priority wins
		if ((interruptEnable & interruptFlag & (1 << 0)) != 0) {
			handler = 0x0040; // V-Blank
			interruptBit = 0;
			interruptName = 'V-Blank'
		} else if ((interruptEnable & interruptFlag & (1 << 1)) != 0) {
			handler = 0x0048; // LCDC Status
			interruptBit = 1;
			interruptName = 'LCDC'
		} else if ((interruptEnable & interruptFlag & (1 << 2)) != 0) {
			handler = 0x0050; // Timer Overflow
			interruptBit = 2;
			interruptName = 'Timer'
		} else if ((interruptEnable & interruptFlag & (1 << 3)) != 0) {
			handler = 0x0058; // Serial Transfer
			interruptBit = 3;
		} else if ((interruptEnable & interruptFlag & (1 << 4)) != 0) {
			handler = 0x0060; // Hi-Lo of P10-P13
			interruptBit = 4;
		}

		if (handler != 0) {

			// set IME to 0 — stays 0 until RETI re-enables it
			this.bus.interrupts.IME = 0;

			// clear ONLY the specific interrupt flag bit, not all flags
			this.bus.interrupts.IF &= ~(1 << interruptBit);
			this.mmu.setByte(0xFF0F, this.bus.interrupts.IF);

			// PUSH current PC to stack
			this.mmu.setByte(this.cpu.registers.sp - 1, this.cpu.registers.pc >> 8);
			this.mmu.setByte(this.cpu.registers.sp - 2, this.cpu.registers.pc & 0xFF);
			this.cpu.registers.sp -= 2;

			// jump to handler — IME remains 0, handler must use RETI to re-enable
			this.cpu.registers.pc = handler;

			return true;
		} else {
			return false;
		}
	}

	// this function should run the emulation for 1.1ms i.e. the time
	// to calculate one frame
	// ARGS:
	//
	// just_one_instruction(bool) : wheter to run just one instruction and stop
	//
        // breakpoint(int) : if != -1, if PC=breakpoint, the function halts
        // The last 50 executed instructions are stored internally and returned
        // at the end of the call
        RunFrame(just_one_instruction = false, breakpoint = -1): string {

                let print_debug_info = true;

                // max clocks in a frame
                let clock_count_MAX = 70224;
                if (just_one_instruction) {
                        clock_count_MAX = 1;
                }

                let clock_count = 0;
                // one frame timing
                while (clock_count < clock_count_MAX) {

                        const log_line = this.getLog();
                        this.logBuffer.push(log_line);
                        if (this.logBuffer.length > 50) {
                                this.logBuffer.shift();
                        }


			// check for interrupts
			this.HandleInterrupts();

			// HALT: advance clocks without executing instructions
			if (this.cpu.halted) {
				clock_count += 4;
				this.gpu.RunClocks(4);
				continue;
			}

			let old_pc = this.cpu.registers.pc;

                        if (old_pc == breakpoint && breakpoint != -1) {
                                console.log(`Emulator halted on PC==${old_pc.toString(16)}`)
                                return this.logBuffer.join('\n');
                        }

			let { arg, new_pc, inst } = this.FetchOpCode();

			// Record trace BEFORE executing
			const r = this.cpu.registers;
			this.traceBuffer.push({
				pc: old_pc,
				opcode: this.mmu.getByte(old_pc),
				a: r.a, f: r.f, b: r.b, c: r.c,
				d: r.d, e: r.e, h: r.h, l: r.l,
				sp: r.sp,
				ly: this.gpu.ly,
				ime: this.bus.interrupts.IME,
				ie: this.bus.interrupts.IE,
				if_: this.bus.interrupts.IF,
				help: inst.help_string,
			});
			if (this.traceBuffer.length > this.traceMax) {
				this.traceBuffer.shift();
			}

			this.cpu.registers.pc = new_pc;
			inst.op({
				arg: arg,
				cpu: this.cpu,
				mmu: this.mmu
			});

			clock_count += inst.cycles;

                        this.gpu.RunClocks(inst.cycles);

			// Check if a watchpoint fired during this instruction
			if (this.mmu.lastWatchHit) {
				return this.logBuffer.join('\n');
			}
                }

                return this.logBuffer.join('\n');
        }
	getLog(): string {
		// FORMAT
		// A:00 F:11 B:22 C:33 D:44 E:55 H:66 L:77 SP:8888 PC:9999 PCMEM:AA,BB,CC,DD
		let log = `LY:${this.bus.mmu.getByte(0xFF44)} A:${this.bus.cpu.registers.a.toString(16).padStart(2, '0')} F:${this.bus.cpu.registers.f.toString(16).padStart(2, '0')} B:${this.bus.cpu.registers.b.toString(16).padStart(2, '0')} C:${this.bus.cpu.registers.c.toString(16).padStart(2, '0')} D:${this.bus.cpu.registers.d.toString(16).padStart(2, '0')} E:${this.bus.cpu.registers.e.toString(16).padStart(2, '0')} H:${this.bus.cpu.registers.h.toString(16).padStart(2, '0')} L:${this.bus.cpu.registers.l.toString(16).padStart(2, '0')} SP:${this.bus.cpu.registers.sp.toString(16).padStart(4, '0')} PC:${this.bus.cpu.registers.pc.toString(16).padStart(4, '0')} PCMEM:${this.bus.mmu.getByte(this.bus.cpu.registers.pc).toString(16).padStart(2, '0')},${this.bus.mmu.getByte(this.bus.cpu.registers.pc + 1).toString(16).padStart(2, '0')},${this.bus.mmu.getByte(this.bus.cpu.registers.pc + 2).toString(16).padStart(2, '0')},${this.bus.mmu.getByte(this.bus.cpu.registers.pc + 3).toString(16).padStart(2, '0')}`;

		return log.toUpperCase();
	}
}
