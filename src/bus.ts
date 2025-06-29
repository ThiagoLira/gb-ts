import { CPU } from './cpu';
import { GPU } from './gpu';
import { MMU } from './mmu';
import { InterruptController } from './interrupt';

export class GameBoyBus {
    cpu!: CPU;
    gpu!: GPU;
    mmu!: MMU;
    interrupts: InterruptController = new InterruptController();
}
