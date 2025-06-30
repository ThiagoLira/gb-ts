export enum Int {
    VBlank = 0,
    LCDStat = 1,
    Timer = 2,
    Serial = 3,
    Joypad = 4
}

export class InterruptController {
    IE: number = 0;
    IF: number = 0;
    IME: number = 1;

    request(i: Int) {
        this.IF |= 1 << i;
    }
}
