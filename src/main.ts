import { CPU } from "./cpu"
import { RegisterSet } from "./registerset"
import { RomReader } from "./romreader"
import * as fs from "fs";






function main() {


    let cpu = new CPU(new RegisterSet());
    let reader = new RomReader("http://thiagolira.blot.im/Files/sample.bin");
}

main();
