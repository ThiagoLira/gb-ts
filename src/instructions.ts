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

            case 0x7E: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(args.cpu.registers.hl); },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "LD A,(HL)"
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

            case 0x70: { };
            case 0x71: { };
            case 0x72: { };
            case 0x73: { };
            case 0x74: { };
            case 0x75: { };


            case 0x36: { };


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
            help_string: "UNINPLEMENTED OPCODE"
        }




    }







}
