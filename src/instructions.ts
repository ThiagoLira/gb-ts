import { CPU } from "./cpu"
import { MMU } from "./mmu"
import { Gameboy } from "./gameboy"


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


function TwoComplementConvert(val:number): number{
    // convert to 2-complement if highest bit is 1
    let res = val;

    if ((val >> 7) & 0x01) { res = val - (1 << 8)  }

    return res;

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

                args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers[reg] >> 8);
                args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers[reg] & 0xFF);
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

    static SetFlagsCP(n: number, args: op_args) {

        // set subtraction flag
        args.cpu.registers.f = 0x40;

        // check borrow
        if (args.cpu.registers.a - n < 0) {
            // set C
            args.cpu.registers.f |= 0x10;
        }else{
            args.cpu.registers.f &= 0xEF;
        }

        if (args.cpu.registers.a - n == 0) {
            // set Z
            args.cpu.registers.f |= 0x80;
        }else{
            args.cpu.registers.f &= 0x7F;
        }
        // check borrow on 4-th bit
        if ((args.cpu.registers.a & 0xF) < (n & 0xF)) {
            //set H
            args.cpu.registers.f |= 0x20;

        }else{
            args.cpu.registers.f &= 0xDF;
        }


    }
    // SUB A,n (n is A,B,C,D,E,H,L)
    static CP(reg: string): InstructionConfig {

        return {
            op: function(args: op_args) {

                var a = args.cpu.registers.a;
                var n = args.cpu.registers[reg];


                OpTemplate.SetFlagsCP(n, args);

            },
            cycles: 4,
            arg_number: 0,
            help_string: "CP " + reg.toUpperCase()
        }

    };

    static AND(reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "AND (HL)" : "AND " + reg;

        let cycles = (reg == '(hl)') ? 8 : 4;

        // being sneak sneak with closures
        var reg_closure = reg;

        let f = function(args: op_args) {

            var a = args.cpu.registers.a;

            var n = (reg_closure == '(hl)') ? args.mmu.getByte(args.cpu.registers.hl) : args.cpu.registers[reg];

            args.cpu.registers.a &= n;

            if (args.cpu.registers.a == 0) { args.cpu.registers.f = 0b10100000 }
            else { args.cpu.registers.f = 0b00100000 }

        }

        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string
        }



    }

    static OR(reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "OR (HL)" : "OR " + reg;

        let cycles = (reg == '(hl)') ? 8 : 4;

        // being sneak sneak with closures
        var reg_closure = reg;

        let f = function(args: op_args) {

            var a = args.cpu.registers.a;

            var n = (reg_closure == '(hl)') ? args.mmu.getByte(args.cpu.registers.hl) : args.cpu.registers[reg];

            args.cpu.registers.a |= n;

            if (args.cpu.registers.a == 0) { args.cpu.registers.f = 0b10000000 }
            else { args.cpu.registers.f = 0b00000000 }

        }

        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string
        }



    }

    static XOR(reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "XOR (HL)" : "XOR " + reg;

        let cycles = (reg == '(hl)') ? 8 : 4;

        // being sneak sneak with closures
        var reg_closure = reg;

        let f = function(args: op_args) {

            var a = args.cpu.registers.a;

            var n = (reg_closure == '(hl)') ? args.mmu.getByte(args.cpu.registers.hl) : args.cpu.registers[reg];

            args.cpu.registers.a ^= n;

            if (args.cpu.registers.a == 0) { args.cpu.registers.f = 0b10000000 }
            else { args.cpu.registers.f = 0b00000000 }

        }

        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string
        }



    }

    static SWAP(reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "SWAP (HL)" : "SWAP " + reg;

        let cycles = (reg == '(hl)') ? 16 : 8;

        // being sneak sneak with closures
        var reg_closure = reg;

        let f = function(args: op_args) {

            var a = args.cpu.registers.a;

            let res = 0;

            // extract the high byte hibyte = (x & 0xff00) >> 8;
            // extract the low byte lobyte = (x & 0xff);
            // combine them in the reverse order x = lobyte << 8 | hibyte;
            if (reg_closure == '(hl)') {
                let byte = args.mmu.getByte(args.cpu.registers.hl);
                let high_byte = (byte & 0xf0) >> 4;
                let low_byte = (byte & 0xf);
                res = (low_byte << 4) | high_byte;
                args.mmu.setByte(args.cpu.registers.hl, res);

            }
            else {
                let byte = args.cpu.registers[reg];
                let high_byte = (byte & 0xf0) >> 4;
                let low_byte = (byte & 0xf);
                res = (low_byte << 4) | high_byte;
                args.cpu.registers[reg] = res;
            }

            if (res == 0) { args.cpu.registers.f = 0b10000000 }
            else { args.cpu.registers.f = 0b00000000 }
        }

        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string
        }



    }

    static BIT(bit_pos: number, reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "BIT " + bit_pos.toString() + "(HL)" : "BIT " + bit_pos.toString() + " " + reg;

        let cycles = (reg == '(hl)') ? 16 : 8;

        let f = function(args: op_args) {


            // what is the bit on bit_pos position?
            let test = (args.cpu.registers[reg] >> bit_pos) & 0x01;
            // if test bit was zero set Z flag
            if (!test) { args.cpu.registers.f |= 0b10000000 } else { args.cpu.registers.f &= 0x01110000 }

            //reset flag N
            args.cpu.registers.f &= 0b10110000;
            //set flag H
            args.cpu.registers.f |= 0b00100000;

        }
        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string


        }



    }
    static RES(bit_pos: number, reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "RES " + bit_pos.toString() + "(HL)" : "RES " + bit_pos.toString() + " " + reg;

        let cycles = (reg == '(hl)') ? 16 : 8;

        let f = function(args: op_args) {


            args.cpu.registers[reg] &= ~(1 << bit_pos);              // shorthand

        }
        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string


        }



    }
    static SET(bit_pos: number, reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "SET " + bit_pos.toString() + "(HL)" : "SET " + bit_pos.toString() + " " + reg;

        let cycles = (reg == '(hl)') ? 16 : 8;

        let f = function(args: op_args) {


            args.cpu.registers[reg] |= 1 << bit_pos;              // shorthand


        }
        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string


        }



    }
    static INC(reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "INC (HL)" : "INC " + reg;

        let cycles = (reg == '(hl)') ? 12 : 4;

        // being sneak sneak with closures
        var reg_closure = reg;

        let f = function(args: op_args) {

            var a = args.cpu.registers.a;

            let res = 0;
            let before = 0;
            if (reg_closure == '(hl)') {
                before = args.mmu.getByte(args.cpu.registers.hl);
                args.mmu.setByte(args.cpu.registers.hl, (args.mmu.getByte(args.cpu.registers.hl) + 1) & 0xff);
                res = args.mmu.getByte(args.cpu.registers.hl);
            }
            else {
                before = args.cpu.registers[reg];
                args.cpu.registers[reg] = (args.cpu.registers[reg] + 1) & 0xff;
                res = args.cpu.registers[reg];
            }

            // zero flag
            if (res == 0) { args.cpu.registers.f |= 0x80; } else {args.cpu.registers.f &= 0x7F  };
            // check carry on 4-th bit

            // check if lower nibble before was 1111 i.e. incrementing 1 resulted in overflow
            if ((before & 0b1111) == 0b1111) { args.cpu.registers.f |= 0x20; } else { args.cpu.registers.f &= 0xDF  };
            // reset N flag
            args.cpu.registers.f &= 0xB0;
        }

        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string
        }
    }

    static DEC(reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "DEC (HL)" : "DEC " + reg;

        let cycles = (reg == '(hl)') ? 12 : 4;

        // being sneak sneak with closures
        var reg_closure = reg;

        let f = function(args: op_args) {


            let res = 0;
            let before = 0;

            if (reg_closure == '(hl)') {
                before = args.mmu.getByte(args.cpu.registers.hl) ;
                args.mmu.setByte(args.cpu.registers.hl, (args.mmu.getByte(args.cpu.registers.hl) - 1) & 0xff) ;
                res = args.mmu.getByte(args.cpu.registers.hl);

            }
            else {
                before = args.cpu.registers[reg];
                args.cpu.registers[reg] = (args.cpu.registers[reg] - 1) & 0xff;
                res = args.cpu.registers[reg];
            }

            // zero flag
            if (res == 0) { args.cpu.registers.f |= 0x80; }
            else{
                args.cpu.registers.f &= 0x7F; 
            }

            if ((before & 0xF) < 1) {
                //set H
                args.cpu.registers.f |= 0x20;

            }else{
                args.cpu.registers.f &= 0xDF;
                 }
            // set N flag
            args.cpu.registers.f |= 0b01000000;
        }

        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string
        }
    }
    // rotate right through carry
    static RR(reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "RR (HL)" : "RR " + reg;

        let cycles = (reg == '(hl)') ? 16 : 8;

        // being sneak sneak with closures
        var reg_closure = reg;

        let f = function(args: op_args) {

            if (reg == '(hl)') {
                let byte = args.mmu.getByte(args.cpu.registers.hl);

                byte = byte >> 1

                let new_flag = (byte >> 0) & 0x01;

                let old_flag = args.cpu.registers.carry_flag;

                (new_flag) ? args.cpu.set_carry_flag : args.cpu.reset_carry_flag;

                (old_flag) ? byte |= 1 << 7 : byte &= ~(1 << 7);


                args.mmu.setByte(args.cpu.registers.hl, byte);


            }
            else {
                let byte = args.cpu.registers[reg]

                byte = byte >> 1

                let new_flag = (byte >> 0) & 0x01;

                let old_flag = args.cpu.registers.carry_flag;

                (new_flag) ? args.cpu.set_carry_flag : args.cpu.reset_carry_flag;

                (old_flag) ? byte |= 1 << 7 : byte &= ~(1 << 7);

                args.cpu.registers[reg] = byte;
            }

        }

        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string
        }



    }
    // rotate left through carry
    static RL(reg: string): InstructionConfig {


        let help_string = (reg == '(hl)') ? "RL (HL)" : "RL " + reg;

        let cycles = (reg == '(hl)') ? 16 : 8;

        (reg == 'a')? cycles = 4: cycles = cycles;


        // being sneak sneak with closures
        var reg_closure = reg;

        let f = function(args: op_args) {

            let shifted_byte = 0;


            if (reg == '(hl)') {
                let byte = args.mmu.getByte(args.cpu.registers.hl);

                byte = (byte << 1)

                shifted_byte = byte;

                let new_flag = (byte >> 7) & 0x01;

                let old_flag = args.cpu.registers.carry_flag;

                (new_flag) ? args.cpu.set_carry_flag() : args.cpu.reset_carry_flag();

                (old_flag) ? byte |= 1 << 0 : byte &= ~(1 << 0);


                args.mmu.setByte(args.cpu.registers.hl, byte);


            }
            else {
                let byte = args.cpu.registers[reg]

                shifted_byte = (byte << 1) & 0xFF;

                let new_flag = (byte >> 7) & 0x01;

                let old_flag = args.cpu.registers.carry_flag;

                (new_flag) ? args.cpu.set_carry_flag() : args.cpu.reset_carry_flag();

                shifted_byte |= old_flag? (1) : (0);

                args.cpu.registers[reg] = shifted_byte;

            }

            if(shifted_byte == 0){
                //set zero flag
                args.cpu.set_zero_flag()
            }else{
                // reset zero flag
                args.cpu.reset_zero_flag()
            }


            // reset N & H flags
            args.cpu.registers.f &= 0x90

        }

        return {
            op: f,
            cycles: cycles,
            arg_number: 0,
            help_string: help_string
        }



    }



}





export class InstructionGetter {

    // no no
    private constructor() { };
    public static GetCBInstruction(opcode: number): InstructionConfig {

        switch (opcode) {

            case 0x17: {
                return OpTemplate.RL('a');
            }

            case 0x10: {
                return OpTemplate.RL('b');
            }

            case 0x11: {
                return OpTemplate.RL('c');
            }

            case 0x12: {
                return OpTemplate.RL('d');
            }

            case 0x13: {
                return OpTemplate.RL('e');
            }

            case 0x14: {
                return OpTemplate.RL('h');
            }

            case 0x15: {
                return OpTemplate.RL('l');
            }

            case 0x16: {
                return OpTemplate.RL('(hl)');
            }


            case 0x37: {
                return OpTemplate.SWAP('a');
            }

            case 0x30: {
                return OpTemplate.SWAP('b');
            }

            case 0x31: {
                return OpTemplate.SWAP('c');
            }

            case 0x32: {
                return OpTemplate.SWAP('d');
            }

            case 0x33: {
                return OpTemplate.SWAP('e');
            }

            case 0x34: {
                return OpTemplate.SWAP('h');
            }

            case 0x35: {
                return OpTemplate.SWAP('l');
            }

            case 0x36: {
                return OpTemplate.SWAP('(hl)');
            }
            case 0x40: {
                return OpTemplate.BIT(0, 'b');
            }
            case 0x41: {
                return OpTemplate.BIT(0, 'c');
            }
            case 0x42: {
                return OpTemplate.BIT(0, 'd');
            }
            case 0x43: {
                return OpTemplate.BIT(0, 'e');
            }
            case 0x44: {
                return OpTemplate.BIT(0, 'h');
            }
            case 0x45: {
                return OpTemplate.BIT(0, 'l');
            }
            case 0x46: {
                return OpTemplate.BIT(0, '(hl)');
            }
            case 0x47: {
                return OpTemplate.BIT(0, 'a');
            }
            case 0x48: {
                return OpTemplate.BIT(1, 'b');
            }
            case 0x49: {
                return OpTemplate.BIT(1, 'c');
            }
            case 0x4A: {
                return OpTemplate.BIT(1, 'd');
            }
            case 0x4B: {
                return OpTemplate.BIT(1, 'e');
            }
            case 0x4C: {
                return OpTemplate.BIT(1, 'h');
            }
            case 0x4D: {
                return OpTemplate.BIT(1, 'l');
            }
            case 0x4E: {
                return OpTemplate.BIT(1, '(hl)');
            }
            case 0x4F: {
                return OpTemplate.BIT(1, 'a');
            }
            case 0x50: {
                return OpTemplate.BIT(2, 'b');
            }
            case 0x51: {
                return OpTemplate.BIT(2, 'c');
            }
            case 0x52: {
                return OpTemplate.BIT(2, 'd');
            }
            case 0x53: {
                return OpTemplate.BIT(2, 'e');
            }
            case 0x54: {
                return OpTemplate.BIT(2, 'h');
            }
            case 0x55: {
                return OpTemplate.BIT(2, 'l');
            }
            case 0x56: {
                return OpTemplate.BIT(2, '(hl)');
            }
            case 0x57: {
                return OpTemplate.BIT(2, 'a');
            }
            case 0x58: {
                return OpTemplate.BIT(3, 'b');
            }
            case 0x59: {
                return OpTemplate.BIT(3, 'c');
            }
            case 0x5A: {
                return OpTemplate.BIT(3, 'd');
            }
            case 0x5B: {
                return OpTemplate.BIT(3, 'e');
            }
            case 0x5C: {
                return OpTemplate.BIT(3, 'h');
            }
            case 0x5D: {
                return OpTemplate.BIT(3, 'l');
            }
            case 0x5E: {
                return OpTemplate.BIT(3, '(hl)');
            }
            case 0x5F: {
                return OpTemplate.BIT(3, 'a');
            }
            case 0x60: {
                return OpTemplate.BIT(4, 'b');
            }
            case 0x61: {
                return OpTemplate.BIT(4, 'c');
            }
            case 0x62: {
                return OpTemplate.BIT(4, 'd');
            }
            case 0x63: {
                return OpTemplate.BIT(4, 'e');
            }
            case 0x64: {
                return OpTemplate.BIT(4, 'h');
            }
            case 0x65: {
                return OpTemplate.BIT(4, 'l');
            }
            case 0x66: {
                return OpTemplate.BIT(4, '(hl)');
            }
            case 0x67: {
                return OpTemplate.BIT(4, 'a');
            }
            case 0x68: {
                return OpTemplate.BIT(5, 'b');
            }
            case 0x69: {
                return OpTemplate.BIT(5, 'c');
            }
            case 0x6A: {
                return OpTemplate.BIT(5, 'd');
            }
            case 0x6B: {
                return OpTemplate.BIT(5, 'e');
            }
            case 0x6C: {
                return OpTemplate.BIT(5, 'h');
            }
            case 0x6D: {
                return OpTemplate.BIT(5, 'l');
            }
            case 0x6E: {
                return OpTemplate.BIT(5, '(hl)');
            }
            case 0x6F: {
                return OpTemplate.BIT(5, 'a');
            }
            case 0x70: {
                return OpTemplate.BIT(6, 'b');
            }
            case 0x71: {
                return OpTemplate.BIT(6, 'c');
            }
            case 0x72: {
                return OpTemplate.BIT(6, 'd');
            }
            case 0x73: {
                return OpTemplate.BIT(6, 'e');
            }
            case 0x74: {
                return OpTemplate.BIT(6, 'h');
            }
            case 0x75: {
                return OpTemplate.BIT(6, 'l');
            }
            case 0x76: {
                return OpTemplate.BIT(6, '(hl)');
            }
            case 0x77: {
                return OpTemplate.BIT(6, 'a');
            }
            case 0x78: {
                return OpTemplate.BIT(7, 'b');
            }
            case 0x79: {
                return OpTemplate.BIT(7, 'c');
            }
            case 0x7A: {
                return OpTemplate.BIT(7, 'd');
            }
            case 0x7B: {
                return OpTemplate.BIT(7, 'e');
            }
            case 0x7C: {
                return OpTemplate.BIT(7, 'h');
            }
            case 0x7D: {
                return OpTemplate.BIT(7, 'l');
            }
            case 0x7E: {
                return OpTemplate.BIT(7, '(hl)');
            }
            case 0x7F: {
                return OpTemplate.BIT(7, 'a');
            }


            case 0x80: {
                return OpTemplate.RES(0, 'b');
            }
            case 0x81: {
                return OpTemplate.RES(0, 'c');
            }
            case 0x82: {
                return OpTemplate.RES(0, 'd');
            }
            case 0x83: {
                return OpTemplate.RES(0, 'e');
            }
            case 0x84: {
                return OpTemplate.RES(0, 'h');
            }
            case 0x85: {
                return OpTemplate.RES(0, 'l');
            }
            case 0x86: {
                return OpTemplate.RES(0, '(hl)');
            }
            case 0x87: {
                return OpTemplate.RES(0, 'a');
            }
            case 0x88: {
                return OpTemplate.RES(1, 'b');
            }
            case 0x89: {
                return OpTemplate.RES(1, 'c');
            }
            case 0x8A: {
                return OpTemplate.RES(1, 'd');
            }
            case 0x8B: {
                return OpTemplate.RES(1, 'e');
            }
            case 0x8C: {
                return OpTemplate.RES(1, 'h');
            }
            case 0x8D: {
                return OpTemplate.RES(1, 'l');
            }
            case 0x8E: {
                return OpTemplate.RES(1, '(hl)');
            }
            case 0x8F: {
                return OpTemplate.RES(1, 'a');
            }
            case 0x90: {
                return OpTemplate.RES(2, 'b');
            }
            case 0x91: {
                return OpTemplate.RES(2, 'c');
            }
            case 0x92: {
                return OpTemplate.RES(2, 'd');
            }
            case 0x93: {
                return OpTemplate.RES(2, 'e');
            }
            case 0x94: {
                return OpTemplate.RES(2, 'h');
            }
            case 0x95: {
                return OpTemplate.RES(2, 'l');
            }
            case 0x96: {
                return OpTemplate.RES(2, '(hl)');
            }
            case 0x97: {
                return OpTemplate.RES(2, 'a');
            }
            case 0x98: {
                return OpTemplate.RES(3, 'b');
            }
            case 0x99: {
                return OpTemplate.RES(3, 'c');
            }
            case 0x9A: {
                return OpTemplate.RES(3, 'd');
            }
            case 0x9B: {
                return OpTemplate.RES(3, 'e');
            }
            case 0x9C: {
                return OpTemplate.RES(3, 'h');
            }
            case 0x9D: {
                return OpTemplate.RES(3, 'l');
            }
            case 0x9E: {
                return OpTemplate.RES(3, '(hl)');
            }
            case 0x9F: {
                return OpTemplate.RES(3, 'a');
            }
            case 0xA0: {
                return OpTemplate.RES(4, 'b');
            }
            case 0xA1: {
                return OpTemplate.RES(4, 'c');
            }
            case 0xA2: {
                return OpTemplate.RES(4, 'd');
            }
            case 0xA3: {
                return OpTemplate.RES(4, 'e');
            }
            case 0xA4: {
                return OpTemplate.RES(4, 'h');
            }
            case 0xA5: {
                return OpTemplate.RES(4, 'l');
            }
            case 0xA6: {
                return OpTemplate.RES(4, '(hl)');
            }
            case 0xA7: {
                return OpTemplate.RES(4, 'a');
            }
            case 0xA8: {
                return OpTemplate.RES(5, 'b');
            }
            case 0xA9: {
                return OpTemplate.RES(5, 'c');
            }
            case 0xAA: {
                return OpTemplate.RES(5, 'd');
            }
            case 0xAB: {
                return OpTemplate.RES(5, 'e');
            }
            case 0xAC: {
                return OpTemplate.RES(5, 'h');
            }
            case 0xAD: {
                return OpTemplate.RES(5, 'l');
            }
            case 0xAE: {
                return OpTemplate.RES(5, '(hl)');
            }
            case 0xAF: {
                return OpTemplate.RES(5, 'a');
            }
            case 0xB0: {
                return OpTemplate.RES(6, 'b');
            }
            case 0xB1: {
                return OpTemplate.RES(6, 'c');
            }
            case 0xB2: {
                return OpTemplate.RES(6, 'd');
            }
            case 0xB3: {
                return OpTemplate.RES(6, 'e');
            }
            case 0xB4: {
                return OpTemplate.RES(6, 'h');
            }
            case 0xB5: {
                return OpTemplate.RES(6, 'l');
            }
            case 0xB6: {
                return OpTemplate.RES(6, '(hl)');
            }
            case 0xB7: {
                return OpTemplate.RES(6, 'a');
            }
            case 0xB8: {
                return OpTemplate.RES(7, 'b');
            }
            case 0xB9: {
                return OpTemplate.RES(7, 'c');
            }
            case 0xBA: {
                return OpTemplate.RES(7, 'd');
            }
            case 0xBB: {
                return OpTemplate.RES(7, 'e');
            }
            case 0xBC: {
                return OpTemplate.RES(7, 'h');
            }
            case 0xBD: {
                return OpTemplate.RES(7, 'l');
            }
            case 0xBE: {
                return OpTemplate.RES(7, '(hl)');
            }
            case 0xBF: {
                return OpTemplate.RES(7, 'a');
            }


            case 0xC0: {
                return OpTemplate.SET(0, 'b');
            }
            case 0xC1: {
                return OpTemplate.SET(0, 'c');
            }
            case 0xC2: {
                return OpTemplate.SET(0, 'd');
            }
            case 0xC3: {
                return OpTemplate.SET(0, 'e');
            }
            case 0xC4: {
                return OpTemplate.SET(0, 'h');
            }
            case 0xC5: {
                return OpTemplate.SET(0, 'l');
            }
            case 0xC6: {
                return OpTemplate.SET(0, '(hl)');
            }
            case 0xC7: {
                return OpTemplate.SET(0, 'a');
            }
            case 0xC8: {
                return OpTemplate.SET(1, 'b');
            }
            case 0xC9: {
                return OpTemplate.SET(1, 'c');
            }
            case 0xCA: {
                return OpTemplate.SET(1, 'd');
            }
            case 0xCB: {
                return OpTemplate.SET(1, 'e');
            }
            case 0xCC: {
                return OpTemplate.SET(1, 'h');
            }
            case 0xCD: {
                return OpTemplate.SET(1, 'l');
            }
            case 0xCE: {
                return OpTemplate.SET(1, '(hl)');
            }
            case 0xCF: {
                return OpTemplate.SET(1, 'a');
            }
            case 0xD0: {
                return OpTemplate.SET(2, 'b');
            }
            case 0xD1: {
                return OpTemplate.SET(2, 'c');
            }
            case 0xD2: {
                return OpTemplate.SET(2, 'd');
            }
            case 0xD3: {
                return OpTemplate.SET(2, 'e');
            }
            case 0xD4: {
                return OpTemplate.SET(2, 'h');
            }
            case 0xD5: {
                return OpTemplate.SET(2, 'l');
            }
            case 0xD6: {
                return OpTemplate.SET(2, '(hl)');
            }
            case 0xD7: {
                return OpTemplate.SET(2, 'a');
            }
            case 0xD8: {
                return OpTemplate.SET(3, 'b');
            }
            case 0xD9: {
                return OpTemplate.SET(3, 'c');
            }
            case 0xDA: {
                return OpTemplate.SET(3, 'd');
            }
            case 0xDB: {
                return OpTemplate.SET(3, 'e');
            }
            case 0xDC: {
                return OpTemplate.SET(3, 'h');
            }
            case 0xDD: {
                return OpTemplate.SET(3, 'l');
            }
            case 0xDE: {
                return OpTemplate.SET(3, '(hl)');
            }
            case 0xDF: {
                return OpTemplate.SET(3, 'a');
            }
            case 0xE0: {
                return OpTemplate.SET(4, 'b');
            }
            case 0xE1: {
                return OpTemplate.SET(4, 'c');
            }
            case 0xE2: {
                return OpTemplate.SET(4, 'd');
            }
            case 0xE3: {
                return OpTemplate.SET(4, 'e');
            }
            case 0xE4: {
                return OpTemplate.SET(4, 'h');
            }
            case 0xE5: {
                return OpTemplate.SET(4, 'l');
            }
            case 0xE6: {
                return OpTemplate.SET(4, '(hl)');
            }
            case 0xE7: {
                return OpTemplate.SET(4, 'a');
            }
            case 0xE8: {
                return OpTemplate.SET(5, 'b');
            }
            case 0xE9: {
                return OpTemplate.SET(5, 'c');
            }
            case 0xEA: {
                return OpTemplate.SET(5, 'd');
            }
            case 0xEB: {
                return OpTemplate.SET(5, 'e');
            }
            case 0xEC: {
                return OpTemplate.SET(5, 'h');
            }
            case 0xED: {
                return OpTemplate.SET(5, 'l');
            }
            case 0xEE: {
                return OpTemplate.SET(5, '(hl)');
            }
            case 0xEF: {
                return OpTemplate.SET(5, 'a');
            }
            case 0xF0: {
                return OpTemplate.SET(6, 'b');
            }
            case 0xF1: {
                return OpTemplate.SET(6, 'c');
            }
            case 0xF2: {
                return OpTemplate.SET(6, 'd');
            }
            case 0xF3: {
                return OpTemplate.SET(6, 'e');
            }
            case 0xF4: {
                return OpTemplate.SET(6, 'h');
            }
            case 0xF5: {
                return OpTemplate.SET(6, 'l');
            }
            case 0xF6: {
                return OpTemplate.SET(6, '(hl)');
            }
            case 0xF7: {
                return OpTemplate.SET(6, 'a');
            }
            case 0xF8: {
                return OpTemplate.SET(7, 'b');
            }
            case 0xF9: {
                return OpTemplate.SET(7, 'c');
            }
            case 0xFA: {
                return OpTemplate.SET(7, 'd');
            }
            case 0xFB: {
                return OpTemplate.SET(7, 'e');
            }
            case 0xFC: {
                return OpTemplate.SET(7, 'h');
            }
            case 0xFD: {
                return OpTemplate.SET(7, 'l');
            }
            case 0xFE: {
                return OpTemplate.SET(7, '(hl)');
            }
            case 0xFF: {
                return OpTemplate.SET(7, 'a');
            }


        }

        return {
            op: function(args: op_args) { },
            cycles: 0,
            arg_number: 0,
            help_string: "UNINPLEMENTED OPCODE: CB  " + opcode.toString(16)
        }

    }

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

            case 0x07: {
                return {
                    op: function(args: op_args) {
                        let a = args.cpu.registers.a;
                        let carry = (a >> 7) & 1;
                        args.cpu.registers.a = ((a << 1) | carry) & 0xFF;
                        args.cpu.registers.f = carry ? 0x10 : 0;
                    },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "RLCA"
                }
            }
            case 0x0F: {
                return {
                    op: function(args: op_args) {
                        let a = args.cpu.registers.a;
                        let carry = a & 1;
                        args.cpu.registers.a = ((a >> 1) | (carry << 7)) & 0xFF;
                        args.cpu.registers.f = carry ? 0x10 : 0;
                    },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "RRCA"
                }
            }
            case 0x17: {
                return {
                    op: function(args: op_args) {
                        let a = args.cpu.registers.a;
                        let oldCarry = (args.cpu.registers.f >> 4) & 1;
                        let newCarry = (a >> 7) & 1;
                        args.cpu.registers.a = ((a << 1) | oldCarry) & 0xFF;
                        args.cpu.registers.f = newCarry ? 0x10 : 0;
                    },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "RLA"
                }
            }
            case 0x1F: {
                return {
                    op: function(args: op_args) {
                        let a = args.cpu.registers.a;
                        let oldCarry = (args.cpu.registers.f >> 4) & 1;
                        let newCarry = a & 1;
                        args.cpu.registers.a = ((a >> 1) | (oldCarry << 7)) & 0xFF;
                        args.cpu.registers.f = newCarry ? 0x10 : 0;
                    },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "RRA"
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


            case 0x3E: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.arg; },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "LD A,#"
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
            case 0x70: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.cpu.registers.b); },
                    cycles: 8, arg_number: 0, help_string: "LD (HL),B"
                }
            }
            case 0x71: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.cpu.registers.c); },
                    cycles: 8, arg_number: 0, help_string: "LD (HL),C"
                }
            }
            case 0x72: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.cpu.registers.d); },
                    cycles: 8, arg_number: 0, help_string: "LD (HL),D"
                }
            }
            case 0x73: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.cpu.registers.e); },
                    cycles: 8, arg_number: 0, help_string: "LD (HL),E"
                }
            }
            case 0x74: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.cpu.registers.h); },
                    cycles: 8, arg_number: 0, help_string: "LD (HL),H"
                }
            }
            case 0x75: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.cpu.registers.l); },
                    cycles: 8, arg_number: 0, help_string: "LD (HL),L"
                }
            }

            case 0x36: {
                return {
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.arg); },
                    cycles: 12, arg_number: 1, help_string: "LD (HL),n"
                }
            }

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
                    op: function(args: op_args) { args.mmu.setByte(args.cpu.registers.hl, args.cpu.registers.a); args.cpu.registers.hl-- },
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
                    op: function(args: op_args) { args.mmu.setByte(0xFF00 + TwoComplementConvert(args.arg), args.cpu.registers.a); },
                    cycles: 12,
                    arg_number: 1,
                    help_string: "LDH (n),A"
                }
            }


            case 0xF0: {
                return {
                    op: function(args: op_args) { args.cpu.registers.a = args.mmu.getByte(0xFF00 + TwoComplementConvert(args.arg)); },
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


            case 0x20: {
                return {
                    op: function(args: op_args) {

                        let will_call = !args.cpu.registers.zero_flag;
                        if (will_call) {
                            // pc <- arg
                            args.cpu.twoComplementAdd('pc',args.arg);
                            //args.cpu.registers.pc += args.arg
                        }
                    },
                    cycles: 12,
                    arg_number: 1,
                    help_string: "JR NZ"
                }
            }

            case 0x28: {
                return {
                    op: function(args: op_args) {

                        let will_call = args.cpu.registers.zero_flag;

                        if (will_call) {
                            // pc <- arg
                            args.cpu.twoComplementAdd('pc',args.arg);
                            //args.cpu.registers.pc += args.arg
                        }
                    },
                    cycles: 12,
                    arg_number: 1,
                    help_string: "JR Z"
                }
            }

            case 0x30: {
                return {
                    op: function(args: op_args) {

                        let will_call = !args.cpu.registers.carry_flag;

                        if (will_call) {
                            // pc <- arg
                            args.cpu.twoComplementAdd('pc',args.arg);
                            //args.cpu.registers.pc += args.arg
                        }
                    },
                    cycles: 12,
                    arg_number: 1,
                    help_string: "JR NC"
                }
            }

            case 0x38: {
                return {
                    op: function(args: op_args) {

                        let will_call = args.cpu.registers.carry_flag;

                        if (will_call) {
                            // pc <- arg
                            args.cpu.twoComplementAdd('pc',args.arg);
                            //args.cpu.registers.pc += args.arg
                        }
                    },
                    cycles: 24,
                    arg_number: 1,
                    help_string: "JR C"
                }
            }
            case 0xC2: {
                return {
                    op: function(args: op_args) {

                        let will_call = !args.cpu.registers.zero_flag;

                        if (will_call) {
                            // pc <- arg
                            args.cpu.registers.pc = args.arg
                        }
                    },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "JP NZ"
                }
            }

            case 0xCA: {

                return {
                    op: function(args: op_args) {

                        let will_call = args.cpu.registers.zero_flag;

                        if (will_call) {
                            // pc <- argu
                            args.cpu.registers.pc = args.arg
                        }
                    },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "JP Z"
                }
            }

            case 0xD2: {

                return {
                    op: function(args: op_args) {

                        let will_call = !args.cpu.registers.carry_flag;

                        if (will_call) {
                            // pc <- arg
                            args.cpu.registers.pc = args.arg
                        }
                    },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "JP NC"
                }
            }

            case 0xDA: {

                return {
                    op: function(args: op_args) {

                        let will_call = args.cpu.registers.carry_flag;

                        if (will_call) {
                            // pc <- arg
                            args.cpu.registers.pc = args.arg
                        }
                    },
                    cycles: 24,
                    arg_number: 2,
                    help_string: "JP C"
                }
            }


            case 0xE9: {
                return {
                    op: function(args: op_args) { args.cpu.registers.pc = args.cpu.registers.hl },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "JP (HL)"
                }
            }

            case 0x18: {
                return {
                    op: function(args: op_args) { args.cpu.twoComplementAdd('pc',args.arg)},
                    cycles: 8,
                    arg_number: 1,
                    help_string: "JP n"
                }
            }
            case 0xCD: {

                return {
                    op: function(args: op_args) {
                        // (sp - 1) <- PCh (sp - 2) <- PCl
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        // pc <- arg
                        args.cpu.registers.pc = args.arg
                    },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "CALL"
                }


            }

            case 0xC3: {



                return {
                    op: function(args: op_args) {
                        args.cpu.registers.pc = args.arg; 
                    },
                    cycles: 12,
                    arg_number: 2,
                    help_string: "JP nn"
                }




            }

            case 0xC4: {

                return {
                    op: function(args: op_args) {
                        let will_call = !args.cpu.registers.zero_flag;
                        if (will_call) {
                            // (sp - 1) <- PCh (sp - 2) <- PCl
                            args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                            args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                            args.cpu.registers.sp -= 2;
                            args.cpu.registers.pc = args.arg
                        }
                    },
                    cycles: 24,
                    arg_number: 2,
                    help_string: "CALL NZ"
                }
            }

            case 0xCC: {
                return {
                    op: function(args: op_args) {
                        let will_call = args.cpu.registers.zero_flag;
                        if (will_call) {
                            args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                            args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                            args.cpu.registers.sp -= 2;
                            args.cpu.registers.pc = args.arg
                        }
                    },
                    cycles: 24,
                    arg_number: 2,
                    help_string: "CALL Z"
                }
            }

            case 0xD4: {
                return {
                    op: function(args: op_args) {
                        let will_call = !args.cpu.registers.carry_flag;
                        if (will_call) {
                            args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                            args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                            args.cpu.registers.sp -= 2;
                            args.cpu.registers.pc = args.arg
                        }
                    },
                    cycles: 24,
                    arg_number: 2,
                    help_string: "CALL NC"
                }
            }

            case 0xDC: {
                return {
                    op: function(args: op_args) {
                        let will_call = args.cpu.registers.carry_flag;
                        if (will_call) {
                            args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                            args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                            args.cpu.registers.sp -= 2;
                            args.cpu.registers.pc = args.arg
                        }
                    },
                    cycles: 24,
                    arg_number: 2,
                    help_string: "CALL C"
                }


            }

            case 0xC9: {
                return {
                    op: function(args: op_args) {
                        // pcl  (SP), pch  (SP+1), SPSP+2
                        let low_byte = args.mmu.getByte(args.cpu.registers.sp);
                        let high_byte = args.mmu.getByte(args.cpu.registers.sp + 1);
                        let res = (high_byte << 8) | low_byte;
                        args.cpu.registers.pc = res;
                        args.cpu.registers.sp += 2;
                    },
                    cycles: 16,
                    arg_number: 0,
                    help_string: "RET"
                }
            }


            // Stack function
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
                        let comp_arg = 0;
                        // convert to 2 complement
                        if ((args.arg >> 7) & 0x01) { comp_arg = args.arg - (1 << 8) }

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
                        var n = args.mmu.getByte(args.cpu.registers.hl);
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
                        args.cpu.registers.a -= args.arg;
                        OpTemplate.SetFlagsSubtraction(a, args.arg, args);
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "SUB A,#"
                }
            }


            case 0xBF: {
                return OpTemplate.CP('a');
            }

            case 0xB8: {
                return OpTemplate.CP('b');
            }

            case 0xB9: {
                return OpTemplate.CP('c');
            }

            case 0xBA: {
                return OpTemplate.CP('d');
            }

            case 0xBB: {
                return OpTemplate.CP('e');
            }

            case 0xBC: {
                return OpTemplate.CP('h');
            }

            case 0xBD: {
                return OpTemplate.CP('l');
            }

            case 0xBE: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        var n = args.mmu.getByte(args.cpu.registers.hl);
                        OpTemplate.SetFlagsCP(n, args);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "CP (HL)"
                }
            }

            case 0xFE: {
                return {
                    op: function(args: op_args) {
                        OpTemplate.SetFlagsCP(args.arg, args);
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "CP #"
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

            case 0xA7: {
                return OpTemplate.AND('a');
            }

            case 0xA0: {
                return OpTemplate.AND('b');
            }

            case 0xA1: {
                return OpTemplate.AND('c');
            }

            case 0xA2: {
                return OpTemplate.AND('d');
            }

            case 0xA3: {
                return OpTemplate.AND('e');
            }

            case 0xA4: {
                return OpTemplate.AND('h');
            }

            case 0xA5: {
                return OpTemplate.AND('l');
            }

            case 0xA6: {
                return OpTemplate.AND('(hl)');
            }

            case 0xE6: {
                return {
                    op: function(args: op_args) {

                        var n = args.arg;

                        args.cpu.registers.a &= n;

                        if (args.cpu.registers.a == 0) { args.cpu.registers.f = 0b10100000 }
                        else { args.cpu.registers.f = 0b00100000 }
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "AND A,#"
                }
            }

            case 0xB7: {
                return OpTemplate.OR('a');
            }

            case 0xB0: {
                return OpTemplate.OR('b');
            }

            case 0xB1: {
                return OpTemplate.OR('c');
            }

            case 0xB2: {
                return OpTemplate.OR('d');
            }

            case 0xB3: {
                return OpTemplate.OR('e');
            }

            case 0xB4: {
                return OpTemplate.OR('h');
            }

            case 0xB5: {
                return OpTemplate.OR('l');
            }

            case 0xB6: {
                return OpTemplate.OR('(hl)');
            }

            case 0xF6: {
                return {
                    op: function(args: op_args) {

                        var n = args.arg;

                        args.cpu.registers.a |= n;

                        if (args.cpu.registers.a == 0) { args.cpu.registers.f = 0b10000000 }
                        else { args.cpu.registers.f = 0b00000000 }
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "OR A,#"
                }
            }
            case 0xAF: {
                return OpTemplate.XOR('a');
            }

            case 0xA8: {
                return OpTemplate.XOR('b');
            }

            case 0xA9: {
                return OpTemplate.XOR('c');
            }

            case 0xAA: {
                return OpTemplate.XOR('d');
            }

            case 0xAB: {
                return OpTemplate.XOR('e');
            }

            case 0xAC: {
                return OpTemplate.XOR('h');
            }

            case 0xAD: {
                return OpTemplate.XOR('l');
            }

            case 0xAE: {
                return OpTemplate.XOR('(hl)');
            }

            case 0xEE: {
                return {
                    op: function(args: op_args) {

                        var n = args.arg;

                        args.cpu.registers.a ^= n;

                        if (args.cpu.registers.a == 0) { args.cpu.registers.f = 0b10000000 }
                        else { args.cpu.registers.f = 0b00000000 }
                    },
                    cycles: 8,
                    arg_number: 1,
                    help_string: "XOR A,#"
                }
            }
            case 0x3C: {
                return OpTemplate.INC('a');
            }

            case 0x04: {
                return OpTemplate.INC('b');
            }

            case 0x0C: {
                return OpTemplate.INC('c');
            }

            case 0x14: {
                return OpTemplate.INC('d');
            }

            case 0x1C: {
                return OpTemplate.INC('e');
            }

            case 0x24: {
                return OpTemplate.INC('h');
            }

            case 0x2C: {
                return OpTemplate.INC('l');
            }

            case 0x34: {
                return OpTemplate.INC('(hl)');
            }

            case 0x03: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.bc =  (args.cpu.registers.bc + 1) & (0xffff);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "INC BC"
                }
            }
            case 0x13: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.de =  (args.cpu.registers.de + 1) & (0xffff);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "INC DE"
                }
            }
            case 0x23: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.hl =  (args.cpu.registers.hl + 1) & (0xffff);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "INC hl"
                }
            }
            case 0x33: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.sp =  (args.cpu.registers.sp + 1) & (0xffff);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "INC SP"
                }
            }

            case 0x3D: {
                return OpTemplate.DEC('a');
            }

            case 0x05: {
                return OpTemplate.DEC('b');
            }

            case 0x0D: {
                return OpTemplate.DEC('c');
            }

            case 0x15: {
                return OpTemplate.DEC('d');
            }

            case 0x1D: {
                return OpTemplate.DEC('e');
            }

            case 0x25: {
                return OpTemplate.DEC('h');
            }

            case 0x2D: {
                return OpTemplate.DEC('l');
            }

            case 0x35: {
                return OpTemplate.DEC('(hl)');
            }

            case 0x0B: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.bc =  (args.cpu.registers.bc - 1) & (0xffff);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "DEC BC"
                }
            }
            case 0x1B: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.de =  (args.cpu.registers.de - 1) & (0xffff);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "DEC DE"
                }
            }
            case 0x2B: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.hl =  (args.cpu.registers.hl - 1) & (0xffff);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "DEC hl"
                }
            }
            case 0x3B: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.sp =  (args.cpu.registers.sp - 1) & (0xffff);
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "DEC SP"
                }
            }

            case 0xF3: {
                return {
                    op: function(args: op_args) {
                        // interrupt master enable
                        args.mmu.bus.interrupts.IME = 0x0;
                    },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "DI"
                }
            }
            case 0xFB: {
                return {
                    op: function(args: op_args) {
                        args.mmu.bus.interrupts.IME = 0x1;
                    },
                    cycles: 4,
                    arg_number: 0,
                    help_string: "EI"
                }
            }


            case 0x00:{

                return {
                    op: function(args: op_args) {},
                    cycles: 4,
                    arg_number: 0,
                    help_string: "NOP"
                }




            }

            // ADD HL, rr
            case 0x09: {
                return {
                    op: function(args: op_args) {
                        let hl = args.cpu.registers.hl;
                        let val = args.cpu.registers.bc;
                        let result = hl + val;
                        args.cpu.registers.f &= 0x80; // preserve Z, clear N/H/C
                        if ((hl & 0xFFF) + (val & 0xFFF) > 0xFFF) args.cpu.registers.f |= 0x20; // H
                        if (result > 0xFFFF) args.cpu.registers.f |= 0x10; // C
                        args.cpu.registers.hl = result & 0xFFFF;
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "ADD HL,BC"
                }
            }
            case 0x19: {
                return {
                    op: function(args: op_args) {
                        let hl = args.cpu.registers.hl;
                        let val = args.cpu.registers.de;
                        let result = hl + val;
                        args.cpu.registers.f &= 0x80;
                        if ((hl & 0xFFF) + (val & 0xFFF) > 0xFFF) args.cpu.registers.f |= 0x20;
                        if (result > 0xFFFF) args.cpu.registers.f |= 0x10;
                        args.cpu.registers.hl = result & 0xFFFF;
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "ADD HL,DE"
                }
            }
            case 0x29: {
                return {
                    op: function(args: op_args) {
                        let hl = args.cpu.registers.hl;
                        let result = hl + hl;
                        args.cpu.registers.f &= 0x80;
                        if ((hl & 0xFFF) + (hl & 0xFFF) > 0xFFF) args.cpu.registers.f |= 0x20;
                        if (result > 0xFFFF) args.cpu.registers.f |= 0x10;
                        args.cpu.registers.hl = result & 0xFFFF;
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "ADD HL,HL"
                }
            }
            case 0x39: {
                return {
                    op: function(args: op_args) {
                        let hl = args.cpu.registers.hl;
                        let val = args.cpu.registers.sp;
                        let result = hl + val;
                        args.cpu.registers.f &= 0x80;
                        if ((hl & 0xFFF) + (val & 0xFFF) > 0xFFF) args.cpu.registers.f |= 0x20;
                        if (result > 0xFFFF) args.cpu.registers.f |= 0x10;
                        args.cpu.registers.hl = result & 0xFFFF;
                    },
                    cycles: 8,
                    arg_number: 0,
                    help_string: "ADD HL,SP"
                }
            }

            // Conditional returns
            case 0xC0: {
                return {
                    op: function(args: op_args) {
                        if (!args.cpu.registers.zero_flag) {
                            let low_byte = args.mmu.getByte(args.cpu.registers.sp);
                            let high_byte = args.mmu.getByte(args.cpu.registers.sp + 1);
                            args.cpu.registers.pc = (high_byte << 8) | low_byte;
                            args.cpu.registers.sp += 2;
                        }
                    },
                    cycles: 20,
                    arg_number: 0,
                    help_string: "RET NZ"
                }
            }

            case 0xC8: {
                return {
                    op: function(args: op_args) {
                        if (args.cpu.registers.zero_flag) {
                            let low_byte = args.mmu.getByte(args.cpu.registers.sp);
                            let high_byte = args.mmu.getByte(args.cpu.registers.sp + 1);
                            args.cpu.registers.pc = (high_byte << 8) | low_byte;
                            args.cpu.registers.sp += 2;
                        }
                    },
                    cycles: 20,
                    arg_number: 0,
                    help_string: "RET Z"
                }
            }

            case 0xD0: {
                return {
                    op: function(args: op_args) {
                        if (!args.cpu.registers.carry_flag) {
                            let low_byte = args.mmu.getByte(args.cpu.registers.sp);
                            let high_byte = args.mmu.getByte(args.cpu.registers.sp + 1);
                            args.cpu.registers.pc = (high_byte << 8) | low_byte;
                            args.cpu.registers.sp += 2;
                        }
                    },
                    cycles: 20,
                    arg_number: 0,
                    help_string: "RET NC"
                }
            }

            case 0xD8: {
                return {
                    op: function(args: op_args) {
                        if (args.cpu.registers.carry_flag) {
                            let low_byte = args.mmu.getByte(args.cpu.registers.sp);
                            let high_byte = args.mmu.getByte(args.cpu.registers.sp + 1);
                            args.cpu.registers.pc = (high_byte << 8) | low_byte;
                            args.cpu.registers.sp += 2;
                        }
                    },
                    cycles: 20,
                    arg_number: 0,
                    help_string: "RET C"
                }
            }

            // RETI - return and enable interrupts
            case 0xD9: {
                return {
                    op: function(args: op_args) {
                        let low_byte = args.mmu.getByte(args.cpu.registers.sp);
                        let high_byte = args.mmu.getByte(args.cpu.registers.sp + 1);
                        args.cpu.registers.pc = (high_byte << 8) | low_byte;
                        args.cpu.registers.sp += 2;
                        args.mmu.bus.interrupts.IME = 1;
                    },
                    cycles: 16,
                    arg_number: 0,
                    help_string: "RETI"
                }
            }

            // RST instructions - push PC and jump to fixed address
            case 0xC7: {
                return {
                    op: function(args: op_args) {
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        args.cpu.registers.pc = 0x00;
                    },
                    cycles: 16, arg_number: 0, help_string: "RST $00"
                }
            }
            case 0xCF: {
                return {
                    op: function(args: op_args) {
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        args.cpu.registers.pc = 0x08;
                    },
                    cycles: 16, arg_number: 0, help_string: "RST $08"
                }
            }
            case 0xD7: {
                return {
                    op: function(args: op_args) {
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        args.cpu.registers.pc = 0x10;
                    },
                    cycles: 16, arg_number: 0, help_string: "RST $10"
                }
            }
            case 0xDF: {
                return {
                    op: function(args: op_args) {
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        args.cpu.registers.pc = 0x18;
                    },
                    cycles: 16, arg_number: 0, help_string: "RST $18"
                }
            }
            case 0xE7: {
                return {
                    op: function(args: op_args) {
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        args.cpu.registers.pc = 0x20;
                    },
                    cycles: 16, arg_number: 0, help_string: "RST $20"
                }
            }
            case 0xEF: {
                return {
                    op: function(args: op_args) {
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        args.cpu.registers.pc = 0x28;
                    },
                    cycles: 16, arg_number: 0, help_string: "RST $28"
                }
            }
            case 0xF7: {
                return {
                    op: function(args: op_args) {
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        args.cpu.registers.pc = 0x30;
                    },
                    cycles: 16, arg_number: 0, help_string: "RST $30"
                }
            }
            case 0xFF: {
                return {
                    op: function(args: op_args) {
                        args.mmu.setByte(args.cpu.registers.sp - 1, args.cpu.registers.pc >> 8);
                        args.mmu.setByte(args.cpu.registers.sp - 2, args.cpu.registers.pc & 0xFF);
                        args.cpu.registers.sp -= 2;
                        args.cpu.registers.pc = 0x38;
                    },
                    cycles: 16, arg_number: 0, help_string: "RST $38"
                }
            }

            // CPL - complement A (flip all bits)
            case 0x2F: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.a = (~args.cpu.registers.a) & 0xFF;
                        args.cpu.registers.f |= 0x60; // set N and H
                    },
                    cycles: 4, arg_number: 0, help_string: "CPL"
                }
            }

            // DAA - decimal adjust A
            case 0x27: {
                return {
                    op: function(args: op_args) {
                        let a = args.cpu.registers.a;
                        let f = args.cpu.registers.f;
                        let correction = 0;
                        let carry = false;

                        if (f & 0x20) { // H flag
                            correction |= 0x06;
                        }
                        if (f & 0x10) { // C flag
                            correction |= 0x60;
                            carry = true;
                        }

                        if (f & 0x40) { // N flag (after subtraction)
                            a -= correction;
                        } else { // after addition
                            if ((a & 0x0F) > 0x09) correction |= 0x06;
                            if (a > 0x99) { correction |= 0x60; carry = true; }
                            a += correction;
                        }

                        a &= 0xFF;
                        args.cpu.registers.a = a;
                        // Z flag, preserve N, clear H, set C if carry
                        args.cpu.registers.f = (args.cpu.registers.f & 0x40) | (a === 0 ? 0x80 : 0) | (carry ? 0x10 : 0);
                    },
                    cycles: 4, arg_number: 0, help_string: "DAA"
                }
            }

            // SCF - set carry flag
            case 0x37: {
                return {
                    op: function(args: op_args) {
                        args.cpu.registers.f = (args.cpu.registers.f & 0x80) | 0x10; // preserve Z, clear N/H, set C
                    },
                    cycles: 4, arg_number: 0, help_string: "SCF"
                }
            }

            // CCF - complement carry flag
            case 0x3F: {
                return {
                    op: function(args: op_args) {
                        let c = (args.cpu.registers.f & 0x10) ? 0 : 0x10; // flip C
                        args.cpu.registers.f = (args.cpu.registers.f & 0x80) | c; // preserve Z, clear N/H
                    },
                    cycles: 4, arg_number: 0, help_string: "CCF"
                }
            }

            // HALT - halt CPU until interrupt
            case 0x76: {
                return {
                    op: function(args: op_args) {
                        // For now, just skip ahead to avoid infinite loop
                        // A proper implementation would wait for an interrupt
                        args.cpu.halted = true;
                    },
                    cycles: 4, arg_number: 0, help_string: "HALT"
                }
            }

            // STOP
            case 0x10: {
                return {
                    op: function(args: op_args) {
                        // STOP is a 2-byte opcode; skip the next byte
                        args.cpu.registers.pc += 1;
                    },
                    cycles: 4, arg_number: 0, help_string: "STOP"
                }
            }

            // ADD SP, n (signed immediate)
            case 0xE8: {
                return {
                    op: function(args: op_args) {
                        let val = args.arg > 127 ? args.arg - 256 : args.arg; // sign extend
                        let sp = args.cpu.registers.sp;
                        let result = sp + val;
                        args.cpu.registers.f = 0; // clear all flags
                        if ((sp & 0xF) + (args.arg & 0xF) > 0xF) args.cpu.registers.f |= 0x20; // H
                        if ((sp & 0xFF) + (args.arg & 0xFF) > 0xFF) args.cpu.registers.f |= 0x10; // C
                        args.cpu.registers.sp = result & 0xFFFF;
                    },
                    cycles: 16, arg_number: 1, help_string: "ADD SP,n"
                }
            }

            // SBC A, n (immediate)
            case 0xDE: {
                return {
                    op: function(args: op_args) {
                        var a = args.cpu.registers.a;
                        var n = args.arg + args.cpu.registers.carry_flag;
                        args.cpu.registers.a -= n;
                        OpTemplate.SetFlagsSubtraction(a, n, args);
                    },
                    cycles: 8, arg_number: 1, help_string: "SBC A,#"
                }
            }

        }

        throw new Error("UNINPLEMENTED OPCODE:  " + opcode.toString(16));


    }







}
