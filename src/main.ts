import { CPU } from "./cpu"
import { Registers } from "./registers"
import { MMU } from "./mmu"
import { Instructions } from "./instructions"




function main() {


    let cpu = new CPU(new Registers());
    let mmu = new MMU("file:///Users/thiagolira/gb-ts/lib/sample.bin");

    // https://www.typescriptlang.org/docs/handbook/classes.html
    let InstructionsRunner = Instructions;

    let gameRunning = true;







    while (gameRunning) {

        let op = 0;
        let arg = 0;


        InstructionsRunner.RunOperation(op, arg, cpu, mmu);



        gameRunning = false;

    };




}

main();
