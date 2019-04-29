import { readBinFile } from "./utilities"



export class RomReader {



    rom: string;



    constructor(path: string) {

        this.rom = readBinFile(path);


    }





}




