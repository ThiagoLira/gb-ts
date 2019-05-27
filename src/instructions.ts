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


    // call AFTER summation to check and set flags 
    static SetFlagsAddition(reg_a_before: number, n: number, args: op_args) {

        // check overflow 7-th bit
        if (args.cpu.registers.a > 255) {
            // set C
            args.cpu.registers.f = 0x10;
            // if value was greater than 0xff throw away extra bits
            args.cpu.registers.a &= 255;
        }
        if (args.cpu.registers.a == 0) {
            // set Z
            args.cpu.registers.f |= 0x80;
        }
        // check carry on 3-th bit
        if ((n + reg_a_before) & 0x10) {
            //set H
            args.cpu.registers.f |= 0x20;

        }


    }

    // ADD A,n (n is A,B,C,D,E,H,L)
    static ADD(reg: string): InstructionConfig {

        return {
            op: function(args: op_args) {

                var a = args.cpu.registers.a;
                var n = args.cpu.registers[reg];

                args.cpu.registers.a += args.cpu.registers[reg];

                OpTemplate.SetFlagsAddition(a, n, args);

            },
            cycles: 4,
            arg_number: 0,
            help_string: "ADD A," + reg.toUpperCase()
        }

    };

    // ADC A,n (n is A,B,C,D,E,H,L) 
    static ADD_C(reg: string): InstructionConfig {

        return {
            op: function(args: op_args) {

                var a = args.cpu.registers.a;
                var n = args.cpu.registers[reg] + args.cpu.registers.carry_flag;

                args.cpu.registers.a += n;

                OpTemplate.SetFlagsAddition(a, n, args);

            },
            cycles: 4,
            arg_number: 0,
            help_string: "ADC A," + reg.toUpperCase()
        }

    };

    // call AFTER summation to check and set flags 
    static SetFlagsSubtraction(reg_a_before: number, n: number, args: op_args) {

        // set subtraction flag
        args.cpu.registers.f = 0x40;

        // check borrow 
        if (args.cpu.registers.a < 0) {
            // set C
            args.cpu.registers.f = 0x10;
            // if value was less than 0 let's not be negative 
            args.cpu.registers.a &= 255;
        }

        if (args.cpu.registers.a == 0) {
            // set Z
            args.cpu.registers.f |= 0x80;
        }
        // check borrow on 4-th bit
        if ((reg_a_before & 0xF) < (n & 0xF)) {
            //set H
            args.cpu.registers.f |= 0x20;

        }


    }

    // SUB A,n (n is A,B,C,D,E,H,L)
    static SUB(reg: string): InstructionConfig {

        return {
            op: function(args: op_args) {

                var a = args.cpu.registers.a;
                var n = args.cpu.registers[reg];

                args.cpu.registers.a -= args.cpu.registers[reg];

                OpTemplate.SetFlagsSubtraction(a, n, args);

            },
            cycles: 4,
            arg_number: 0,
            help_string: "SUB A," + reg.toUpperCase()
        }

    };

    // SBC A,n (n is A,B,C,D,E,H,L) 
    static SUB_C(reg: string): InstructionConfig {

        return {
            op: function(args: op_args) {

                var a = args.cpu.registers.a;
                var n = args.cpu.registers[reg] + args.cpu.registers.carry_flag;

                args.cpu.registers.a -= n;

                OpTemplate.SetFlagsSubtraction(a, n, args);

            },
            cycles: 4,
            arg_number: 0,
            help_string: "SBC A," + reg.toUpperCase()
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
                return OpTemplate.LDr1r2("a", "a");
            }

            case 0x78: {
                return OpTemplate.LDr1r2("a", "b");
            }

            case 0x79: {
                return OpTemplate.LDr1r2("a", "c");
            }

            case 0x7A: {
                return OpTemplate.LDr1r2("a", "d");
            }

            case 0x7B: {
                return OpTemplate.LDr1r2("a", "e");
            }

            case 0x7C: {
                return OpTemplate.LDr1r2("a", "h");
            }
            case 0x7D: {
                return OpTemplate.LDr1r2("a", "l");
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
                return OpTemplate.LDr1r2("b", "b");
            }

            case 0x41: {
                return OpTemplate.LDr1r2("b", "c");
            }

            case 0x42: {
                return OpTemplate.LDr1r2("b", "d");
            }

            case 0x43: {
                return OpTemplate.LDr1r2("b", "e");
            }

            case 0x44: {
                return OpTemplate.LDr1r2("b", "h");
            }

            case 0x45: {
                return OpTemplate.LDr1r2("b", "l");
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
                return OpTemplate.LDr1r2("b", "a");
            }
            case 0x48: {
                return OpTemplate.LDr1r2("c", "b");
            }

            case 0x49: {
                return OpTemplate.LDr1r2("c", "c");
            }

            case 0x4A: {
                return OpTemplate.LDr1r2("c", "d");
            }

            case 0x4B: {
                return OpTemplate.LDr1r2("c", "e");
            }

            case 0x4C: {
                return OpTemplate.LDr1r2("c", "h");
            }

            case 0x4D: {
                return OpTemplate.LDr1r2("c", "l");
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
                return OpTemplate.LDr1r2("c", "a");
            }
            case 0x50: {
                return OpTemplate.LDr1r2("d", "b");
            }

            case 0x51: {
                return OpTemplate.LDr1r2("d", "c");
            }

            case 0x52: {
                return OpTemplate.LDr1r2("d", "d");
            }

            case 0x53: {
                return OpTemplate.LDr1r2("d", "e");
            }

            case 0x54: {
                return OpTemplate.LDr1r2("d", "h");
            }

            case 0x55: {
                return OpTemplate.LDr1r2("d", "l");
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
                return OpTemplate.LDr1r2("d", "a");
            }
            case 0x58: {
                return OpTemplate.LDr1r2("e", "b");
            }

            case 0x59: {
                return OpTemplate.LDr1r2("e", "c");
            }

            case 0x5A: {
                return OpTemplate.LDr1r2("e", "d");
            }

            case 0x5B: {
                return OpTemplate.LDr1r2("e", "e");
            }

            case 0x5C: {
                return OpTemplate.LDr1r2("e", "h");
            }

            case 0x5D: {
                return OpTemplate.LDr1r2("e", "l");
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
                return OpTemplate.LDr1r2("e", "a");
            }

            case 0x60: {
                return OpTemplate.LDr1r2("h", "b");
            }

            case 0x61: {
                return OpTemplate.LDr1r2("h", "c");
            }

            case 0x62: {
                return OpTemplate.LDr1r2("h", "d");
            }

            case 0x63: {
                return OpTemplate.LDr1r2("h", "e");
            }

            case 0x64: {
                return OpTemplate.LDr1r2("h", "h");
            }

            case 0x65: {
                return OpTemplate.LDr1r2("h", "l");
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
                return OpTemplate.LDr1r2("h", "a");
            }
            case 0x68: {
                return OpTemplate.LDr1r2("l", "b");
            }

            case 0x69: {
                return OpTemplate.LDr1r2("l", "c");
            }

            case 0x6A: {
                return OpTemplate.LDr1r2("l", "d");
            }

            case 0x6B: {
                return OpTemplate.LDr1r2("l", "e");
            }

            case 0x6C: {
                return OpTemplate.LDr1r2("l", "h");
            }

            case 0x6D: {
                return OpTemplate.LDr1r2("l", "l");
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
                return OpTemplate.LDr1r2("l", "a");
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
                return OpTemplate.PUSH('af');
            }
            case 0xC5: {
                return OpTemplate.PUSH('bc');
            }
            case 0xD5: {
                return OpTemplate.PUSH('de');
            }
            case 0xE5: {
                return OpTemplate.PUSH('hl');
            }

            case 0xF1: {
                return OpTemplate.POP('af');
            }
            case 0xC1: {
                return OpTemplate.POP('bc');
            }
            case 0xD1: {
                return OpTemplate.POP('de');
            }
            case 0xE1: {
                return OpTemplate.POP('hl');
            }
            // Arith
            case 0x87: {
                return OpTemplate.ADD('a');
            }

            case 0x80: {
                return OpTemplate.ADD('b');
            }

            case 0x81: {
                return OpTemplate.ADD('c');
            }

            case 0x82: {
                return OpTemplate.ADD('d');
            }

            case 0x83: {
                return OpTemplate.ADD('e');
            }

            case 0x84: {
                return OpTemplate.ADD('h');
            }

            case 0x85: {
                return OpTemplate.ADD('l');
            }

            case 0x86: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        var n = args.cpu.registers.hl;
                        args.cpu.registers.a += args.mmu.getByte(args.cpu.registers.hl);
                        OpTemplate.SetFlagsAddition(a, n, args);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "ADD A,(HL)"
                }
            }

            case 0xC6: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        args.cpu.registers.a += args.arg
                        OpTemplate.SetFlagsAddition(a, args.arg, args);
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "ADD A,#"
                }
            }


            // Arith
            case 0x8F: {
                return OpTemplate.ADD_C('a');
            }

            case 0x88: {
                return OpTemplate.ADD_C('b');
            }

            case 0x89: {
                return OpTemplate.ADD_C('c');
            }

            case 0x8A: {
                return OpTemplate.ADD_C('d');
            }

            case 0x8B: {
                return OpTemplate.ADD_C('e');
            }

            case 0x8C: {
                return OpTemplate.ADD_C('h');
            }

            case 0x8D: {
                return OpTemplate.ADD_C('l');
            }

            case 0x8E: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        var n = args.mmu.getByte(args.cpu.registers.hl) + args.cpu.registers.carry_flag;
                        args.cpu.registers.a += n;
                        OpTemplate.SetFlagsAddition(a, n, args);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "ADC A,(HL)"
                }
            }

            case 0xCE: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        var n = args.arg + args.cpu.registers.carry_flag;
                        args.cpu.registers.a += n;
                        OpTemplate.SetFlagsAddition(a, n, args);
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "ADC A,#"
                }
            }


            case 0xAF: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.cpu.registers.a ^ args.cpu.registers.a; },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "XOR A"
                }
            }


            case 0x97: {
                return OpTemplate.SUB('a');
            }

            case 0x90: {
                return OpTemplate.SUB('b');
            }

            case 0x91: {
                return OpTemplate.SUB('c');
            }

            case 0x92: {
                return OpTemplate.SUB('d');
            }

            case 0x93: {
                return OpTemplate.SUB('e');
            }

            case 0x94: {
                return OpTemplate.SUB('h');
            }

            case 0x95: {
                return OpTemplate.SUB('l');
            }

            case 0x96: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        var n = args.cpu.registers.hl;
                        args.cpu.registers.a += args.mmu.getByte(args.cpu.registers.hl);
                        OpTemplate.SetFlagsAddition(a, n, args);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "SUB A,(HL)"
                }
            }

            case 0xD6: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        args.cpu.registers.a += args.arg
                        OpTemplate.SetFlagsAddition(a, args.arg, args);
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "SUB A,#"
                }
            }


            // Arith
            case 0x9F: {
                return OpTemplate.SUB_C('a');
            }

            case 0x98: {
                return OpTemplate.SUB_C('b');
            }

            case 0x99: {
                return OpTemplate.SUB_C('c');
            }

            case 0x9A: {
                return OpTemplate.SUB_C('d');
            }

            case 0x9B: {
                return OpTemplate.SUB_C('e');
            }

            case 0x9C: {
                return OpTemplate.SUB_C('h');
            }

            case 0x9D: {
                return OpTemplate.SUB_C('l');
            }

            case 0x9E: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        var n = args.mmu.getByte(args.cpu.registers.hl) + args.cpu.registers.carry_flag;
                        args.cpu.registers.a -= n;
                        OpTemplate.SetFlagsSubtraction(a, n, args);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "SBC A,(HL)"
                }
            }
            // ?????
            case 189129182: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        var n = args.arg + args.cpu.registers.carry_flag;
                        args.cpu.registers.a -= n;
                        OpTemplate.SetFlagsSubtraction(a, n, args);
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "SBC A,#"
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
