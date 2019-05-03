import { CPU } from "./cpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { readBinFile } from "./utilities"





function main() {


    let cpu = new CPU(new Registers());
    let mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin");
}

main();
