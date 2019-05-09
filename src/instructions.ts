import { CPU } from "./cpu"
import { MMU } from "./mmu"



// type of anonymous function arguments used on the classes on this file
type op_args = { arg: number, cpu: CPU, mmu: MMU }


export interface InstructionConfig {

    op: (args: op_args) => void;
    cycles: number;
    // how many cells in memory are the args occuping?
    // e.g 1 -> arg has 1 byte => program counter incremented by 2
    //     2 -> arg has 2 bytes => program counter incremented by 3
    arg_number: number;
    help_string?: string;


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
            case 0x0E: {
                return {
                    op: function(args: op_args) { args.cpu.registers.c = args.arg; },
                    cycles: 4,
                    arg_number: 1,
                    help_string: "LD C,n"
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
