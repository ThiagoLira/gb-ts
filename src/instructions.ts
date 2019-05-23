import { CPU } from "./cpu"
import { RegisterSet } from "./registerset"
import { MMU } from "./mmu"



// type of anonymous function arguments used on the classes on this file
type op_args = { arg: number, cpu: CPU, mmu: MMU }


export interface InstructionConfig {

    op: (args: op_args) => void;
    cycles: number;
    // how many cells (bytes) in memory are the args occuping?
    // e.g 1 -> arg has 1 byte => program counter incremented by 2
    //     2 -> arg has 2 bytes => program counter incremented by 3
    arg_number: number;
    help_string?: string;


}



export class OpTemplate {

    // LD r1,r2
    // reg1 and reg2 must be LOWERCASE 
    static LDr1r2(reg1: string, reg2: string): InstructionConfig {

        return {
            op: function(args: op_args) { args.cpu.registers[reg1] = args.cpu.registers[reg2] },
            cycles: 4,
            arg_number: 0,
            help_string: "LD " + reg1.toUpperCase() + "," + reg2.toUpperCase()
        }

    };

    static PUSH(reg: string): InstructionConfig {


        return {
            op: function(args: op_args) {
                args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers[reg] & 0xFF);
                args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers[reg] >> 8);
                args.cpu.registers.sp -= 2;
            },
            cycles: 16,
            arg_number: 0,
            help_string: "PUSH " + reg.toUpperCase()
        }




    };

    static POP(reg: string): InstructionConfig {


        return {
            op: function(args: op_args) {
                // if reg is "af" reg[0] is "a" and reg[1] is "f"
                args.cpu.registers[reg[1]] = args.mmu.getByte(args.cpu.registers.sp);
                args.cpu.registers[reg[0]] = args.mmu.getByte(args.cpu.registers.sp + 1);
                args.cpu.registers.sp += 2;
            },
            cycles: 12,
            arg_number: 0,
            help_string: "POP " + reg.toUpperCase()
        }




    };

}


export class InstructionGetter {

    // no no
    private constructor() { };


    public static GetInstruction(opcode: number): InstructionConfig {


        switch (opcode) {

            // 8-bit loads
            case 0x06: {
                return {
                    op: function(args: op_args) { args.cpu.registers.b = args.arg; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD B,n"
                }
            }

            case 0x0e: {
                return {
                    op: function(args: op_args) { args.cpu.registers.c = args.arg; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD C,n"
                }
            }

            case 0x16: {
                return {
                    op: function(args: op_args) { args.cpu.registers.d = args.arg; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD D,n"
                }
            }

            case 0x1E: {
                return {
                    op: function(args: op_args) { args.cpu.registers.e = args.arg; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD D,n"
                }
            }

            case 0x26: {
                return {
                    op: function(args: op_args) { args.cpu.registers.h = args.arg; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD H,n"
                }
            }

            case 0x2E: {
                return {
                    op: function(args: op_args) { args.cpu.registers.l = args.arg; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD L,n"
                }
            }

            // LD r1,r2 template
            case 0x7F: {
                OpTemplate.LDr1r2("a", "a");
            }

            case 0x78: {
                OpTemplate.LDr1r2("a", "b");
            }

            case 0x79: {
                OpTemplate.LDr1r2("a", "c");
            }

            case 0x7A: {
                OpTemplate.LDr1r2("a", "d");
            }

            case 0x7B: {
                OpTemplate.LDr1r2("a", "e");
            }

            case 0x7C: {
                OpTemplate.LDr1r2("a", "h");
            }
            case 0x7D: {
                OpTemplate.LDr1r2("a", "l");
            }

            case 0x0A: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(args.cpu.registers.bc); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD A,(BC)"
                }
            };

            case 0x1A: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(args.cpu.registers.de); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD A,(DE)"
                }
            };

            case 0x7E: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(args.cpu.registers.hl); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD A,(HL)"
                }
            };

            case 0xFA: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(args.arg); },
                    cycles: 16,
                    arg_number: 2,
                    help_string: "LD A,(nn)"
                }
            };

            case 0xF2: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(0xFF00 + args.cpu.registers.c); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD A,(C)"
                }
            };

            case 0xE2: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(0xFF00 + args.cpu.registers.c, args.cpu.registers.a); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD (C),A"
                }
            };

            case 0x02: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.bc, args.cpu.registers.a); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD (BC), A"
                }
            };

            case 0x12: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.de, args.cpu.registers.a); },

                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD (DE),A"
                }
            };

            case 0x77: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.cpu.registers.a); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD (HL),A"

                }
            };

            case 0xEA: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.arg, args.cpu.registers.a); },
                    cycles: 16,
                    arg_number: 2,
                    help_string: "LD (nn),A"
                }
            };
            case 0x40: {
                OpTemplate.LDr1r2("b", "b");
            }

            case 0x41: {
                OpTemplate.LDr1r2("b", "c");
            }

            case 0x42: {
                OpTemplate.LDr1r2("b", "d");
            }

            case 0x43: {
                OpTemplate.LDr1r2("b", "e");
            }

            case 0x44: {
                OpTemplate.LDr1r2("b", "h");
            }

            case 0x45: {
                OpTemplate.LDr1r2("b", "l");
            }

            case 0x46: {
                // LD B, (HL)
                return {
                    op: function(args: op_args) { args.cpu.registers.b = args.mmu.getByte(args.cpu.registers.hl); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD B,(HL)"
                }
            }


            case 0x47: {
                OpTemplate.LDr1r2("b", "a");
            }
            case 0x48: {
                OpTemplate.LDr1r2("c", "b");
            }

            case 0x49: {
                OpTemplate.LDr1r2("c", "c");
            }

            case 0x4A: {
                OpTemplate.LDr1r2("c", "d");
            }

            case 0x4B: {
                OpTemplate.LDr1r2("c", "e");
            }

            case 0x4C: {
                OpTemplate.LDr1r2("c", "h");
            }

            case 0x4D: {
                OpTemplate.LDr1r2("c", "l");
            }

            case 0x4E: {
                // LD C, (HL)
                return {
                    op: function(args: op_args) { args.cpu.registers.c = args.mmu.getByte(args.cpu.registers.hl); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD C,(HL)"
                }
            }

            case 0x4F: {
                OpTemplate.LDr1r2("c", "a");
            }
            case 0x50: {
                OpTemplate.LDr1r2("d", "b");
            }

            case 0x51: {
                OpTemplate.LDr1r2("d", "c");
            }

            case 0x52: {
                OpTemplate.LDr1r2("d", "d");
            }

            case 0x53: {
                OpTemplate.LDr1r2("d", "e");
            }

            case 0x54: {
                OpTemplate.LDr1r2("d", "h");
            }

            case 0x55: {
                OpTemplate.LDr1r2("d", "l");
            }

            case 0x56: {
                // LD D, (HL)
                return {
                    op: function(args: op_args) { args.cpu.registers.d = args.mmu.getByte(args.cpu.registers.hl); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD D,(HL)"
                }
            }


            case 0x57: {
                OpTemplate.LDr1r2("d", "a");
            }
            case 0x58: {
                OpTemplate.LDr1r2("e", "b");
            }

            case 0x59: {
                OpTemplate.LDr1r2("e", "c");
            }

            case 0x5A: {
                OpTemplate.LDr1r2("e", "d");
            }

            case 0x5B: {
                OpTemplate.LDr1r2("e", "e");
            }

            case 0x5C: {
                OpTemplate.LDr1r2("e", "h");
            }

            case 0x5D: {
                OpTemplate.LDr1r2("e", "l");
            }

            case 0x5E: {
                // LD E, (HL)
                return {
                    op: function(args: op_args) { args.cpu.registers.e = args.mmu.getByte(args.cpu.registers.hl); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD E,(HL)"
                }
            }

            case 0x5F: {
                OpTemplate.LDr1r2("e", "a");
            }

            case 0x60: {
                OpTemplate.LDr1r2("h", "b");
            }

            case 0x61: {
                OpTemplate.LDr1r2("h", "c");
            }

            case 0x62: {
                OpTemplate.LDr1r2("h", "d");
            }

            case 0x63: {
                OpTemplate.LDr1r2("h", "e");
            }

            case 0x64: {
                OpTemplate.LDr1r2("h", "h");
            }

            case 0x65: {
                OpTemplate.LDr1r2("h", "l");
            }

            case 0x66: {
                // LD H, (HL)
                return {
                    op: function(args: op_args) { args.cpu.registers.h = args.mmu.getByte(args.cpu.registers.hl); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD H,(HL)"
                }
            }

            case 0x67: {
                OpTemplate.LDr1r2("h", "a");
            }
            case 0x68: {
                OpTemplate.LDr1r2("l", "b");
            }

            case 0x69: {
                OpTemplate.LDr1r2("l", "c");
            }

            case 0x6A: {
                OpTemplate.LDr1r2("l", "d");
            }

            case 0x6B: {
                OpTemplate.LDr1r2("l", "e");
            }

            case 0x6C: {
                OpTemplate.LDr1r2("l", "h");
            }

            case 0x6D: {
                OpTemplate.LDr1r2("l", "l");
            }

            case 0x6E: {
                // LD L, (HL)
                return {
                    op: function(args: op_args) { args.cpu.registers.l = args.mmu.getByte(args.cpu.registers.hl); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD L,(HL)"
                }
            }

            case 0x6F: {
                OpTemplate.LDr1r2("l", "a");
            }
            case 0x70: { };
            case 0x71: { };
            case 0x72: { };
            case 0x73: { };
            case 0x74: { };
            case 0x75: { };


            case 0x36: { };

            case 0x3A: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(args.cpu.registers.hl--); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LDD A,(HL)"
                }
            }

            case 0x32: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl--, args.cpu.registers.a); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LDD (HL),A"
                }
            }
            case 0x2A: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(args.cpu.registers.hl++); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LDI A,(HL)"
                }
            }

            case 0x22: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl++, args.cpu.registers.a); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LDI (HL),A"
                }
            }





            case 0xE0: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(0xFF00 + args.arg, args.cpu.registers.a); },
                    cycles: 12,
                    arg_number: 1,
                    help_string: "LDH (n),A"
                }
            }


            case 0xF0: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(0xFF00 + args.arg); },
                    cycles: 12,
                    arg_number: 1,
                    help_string: "LDH A,(n)"
                }
            }

            case 0x01: {
                return {
                    op: function(args: op_args) { args.cpu.registers.bc = args.arg; },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "LDH BC,nn"
                }
            }

            case 0x11: {
                return {
                    op: function(args: op_args) { args.cpu.registers.de = args.arg; },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "LDH DE,nn"
                }
            }

            case 0x31: {
                return {
                    op: function(args: op_args) { args.cpu.registers.sp = args.arg; },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "LD SP,nn"
                }
            }

            case 0x21: {
                return {
                    op: function(args: op_args) { args.cpu.registers.hl = args.arg; },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "LD HL,nn"
                }
            }


            case 0xF9: {
                return {
                    op: function(args: op_args) { args.cpu.registers.sp = args.cpu.registers.hl; },
                    cycles: 12,
                    arg_number: 0,
                    help_string: "LD SP,HL"
                }
            }


            case 0xF8: {
                return {
                    op: function(args: op_args) { args.cpu.registers.hl = args.arg + args.cpu.registers.sp },
                    cycles: 12,
                    arg_number: 1,
                    help_string: "LDHL SP,n"
                }
            }

            case 0x08: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.arg, args.cpu.registers.sp); },
                    cycles: 20,
                    arg_number: 2,
                    help_string: "LD (nn),SP"
                }
            }



            // Stack functions	
            case 0xF5: {
                OpTemplate.PUSH('af');
            }
            case 0xC5: {
                OpTemplate.PUSH('bc');
            }
            case 0xD5: {
                OpTemplate.PUSH('de');
            }
            case 0xE5: {
                OpTemplate.PUSH('hl');
            }

            case 0xF1: {
                OpTemplate.POP('af');
            }
            case 0xC1: {
                OpTemplate.POP('bc');
            }
            case 0xD1: {
                OpTemplate.POP('de');
            }
            case 0xE1: {
                OpTemplate.POP('hl');
            }


            case 0xAF: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.cpu.registers.a ^ args.cpu.registers.a; },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "XOR A"
                }
            }






        }


        return {
            op: function(args: op_args) { },
            cycles: 0,
            arg_number: 0,
            help_string: "UNINPLEMENTED OPCODE: " + opcode.toString(16)
        }




    }







}
