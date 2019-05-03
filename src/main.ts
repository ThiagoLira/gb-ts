import { CPU } from "./cpu"
import { RegisterSet } from "./registerset"
import { MMU } from "./romreader"
import { readBinFile } from "./utilities"





function main() {


    let cpu = new CPU(new RegisterSet());
    let mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin");
}

main();
