import { CPU } from "./cpu"
import { MMU } from "./mmu"



export class Instructions {

    // no no
    private constructor() { };


    public static RunOperation(opcode: number, arg: number, cpu: CPU, mmu: MMU) {


        switch (opcode) {


            // LD B,n
            case 0x06: { cpu.registers.b = arg; break }

            // LD C,n
            case 0x0E: { cpu.registers.c = arg; break; }

            // LD D,n
            case 0x16: { cpu.registers.d = arg; break; }

            // LD E,n
            case 0x1E: { cpu.registers.e = arg; break; }

            // LD H,n
            case 0x26: { cpu.registers.h = arg; break; }

            // LD L,n
            case 0x2E: { cpu.registers.l = arg; break; }



            // LD A,A
            case 0x7F: { cpu.registers.a = cpu.registers.a; break; }




        }




    }







}
