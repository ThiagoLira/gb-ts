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
    static LDr1r2(reg1: number, reg2: number): InstructionConfig {

        return {
            op: function(args: op_args) { reg1 = reg2; },
            cycles: 4,
            arg_number: 1,
            help_string: "LD B,n"
        }

    };




}


export class InstructionGetter {

    // no no
    private constructor() { };


    public static GetInstruction(opcode: number): InstructionConfig {


        switch (opcode) {


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

            case 0x7F: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.cpu.registers.a; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD A,A"
                }
            }

            case 0x78: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.cpu.registers.b; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD A,B"
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
