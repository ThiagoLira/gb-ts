import { CPU } from "./cpu"
import { GameBoyBus } from "./bus"
import { GPU } from "./gpu"
import { MMU } from "./mmu"
import { Registers } from "./registers"
import { InstructionConfig, InstructionGetter } from "./instructions"



//this class should hold the complete state of the gameboy to halt and de-halt emulation
export class Gameboy {
	bus: GameBoyBus;

	cpu: CPU;
	gpu: GPU;
        mmu: MMU;
        getter = InstructionGetter;

        // stores the last 50 executed instruction logs
        logBuffer: string[] = [];



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

		if (!this.bus.interrupts.IME) {
			//console.log('Interrupts not enabled!')
			return false;
		}


		let interruptFlag = this.bus.interrupts.IF;

		let interruptEnable = this.bus.interrupts.IE;

		let interruptName = '';

		let handler = 0;

		if ((interruptEnable & interruptFlag & (1 << 0)) != 0) {
			handler = 0x0040; // V-Blank
			interruptName = 'V-Blank'
		}
		if ((interruptEnable & interruptFlag & (1 << 1)) != 0) {
			handler = 0x0048; // LCDC Status
			interruptName = 'LCDC'
		}
		if ((interruptEnable & interruptFlag & (1 << 2)) != 0) {
			handler = 0x0050; // Timer Overflow
			interruptName = 'Timer'
		}
		if ((interruptEnable & interruptFlag & (1 << 3)) != 0) {
			handler = 0x0058; // Serial Transfer
		}
		if ((interruptEnable & interruptFlag & (1 << 4)) != 0) {
			handler = 0x0060; // Hi-Lo of P10-P13
		}

		if (handler != 0) {

			// set IME to 0
			this.bus.interrupts.IME = 0;
			// set 0xFF0F to 0
			// equivalent to this.bus.interrupts.IF = 0;
			this.mmu.setByte(0xFF0F, 0);
			this.bus.interrupts.IF = 0;

			// PUSH current PC to stack

			this.mmu.setByte(this.cpu.registers.sp - 1, this.cpu.registers.pc >> 8);
			this.mmu.setByte(this.cpu.registers.sp - 2, this.cpu.registers.pc & 0xFF);
			this.cpu.registers.sp -= 2;

			// jump to correct memory location
			console.log('Handled interrupt' + interruptName);
			this.cpu.registers.pc = handler;

			// set IME to 1
			this.bus.interrupts.IME = 0x1;
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

			let old_pc = this.cpu.registers.pc;

                        if (old_pc == breakpoint && breakpoint != -1) {
                                console.log(`Emulator halted on PC==${old_pc.toString(16)}`)
                                return this.logBuffer.join('\n');
                        }

			let { arg, new_pc, inst } = this.FetchOpCode();

			this.cpu.registers.pc = new_pc;
			inst.op({
				arg: arg,
				cpu: this.cpu,
				mmu: this.mmu
			});

			clock_count += inst.cycles;


                        this.gpu.RunClocks(inst.cycles);
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
