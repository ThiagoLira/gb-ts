# Missing features for boot logo and Tetris

This repository implements a partial Game Boy emulator. To fully play through the boot logo and load the `Tetris` ROM, several components are still incomplete or absent.

## Boot ROM
- The boot ROM cannot be disabled. Address `0xFF50` is not handled in `MMU`, so the emulator never switches from the boot ROM to cartridge ROM after initialization.

## Memory mapped I/O
- Many registers under `0xFF00`–`0xFF7F` are not implemented. For example the joypad register (`0xFF00`), timer registers (`0xFF04`–`0xFF07`), and sound registers are missing.
- The `LY` register (`0xFF44`) is hard‑coded to return `0x90` instead of the actual scanline value. This prevents accurate boot logo timing.

## GPU
- Rendering only supports background tiles. Sprite drawing and complete LCD timing are not available.
- Interrupts such as V‑Blank are stubbed and do not update the screen correctly.

## CPU
- Several opcodes are still unimplemented. The default case in `instructions.ts` throws `UNINPLEMENTED OPCODE` for any missing instruction.

## Input & Audio
- Joypad input and audio output are not handled at all.

These gaps need to be filled to progress past the boot ROM, display the full logo animation, and start the `Tetris` title screen.
