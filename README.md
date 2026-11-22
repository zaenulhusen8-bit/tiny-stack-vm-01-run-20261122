# tiny-stack-vm-01-run-20261122

A tiny stack virtual machine for make.fun's `tiny-stack-vm-01-run-20261122`
($100, 10 places of $10).

`main.ts` (Node 22, no dependencies) runs the kit's ISA v1 exactly: 32-bit
wrapping integers, a 256-value data stack, a 64-deep call stack, 256 words
of memory, input/output, and all ten traps with their own exit codes,
including the edge cases the ISA lists as hard (wrapping MUL, INT_MIN/-1,
signed vs unsigned DIV/MOD/LT, shift counts masked to 5 bits, PUSH8 sign
extension, EXIT's low byte, step and output limits, falling off the end,
IN past the end of input). One run answers all 40 instances of a set.

Run: `node main.ts` with the set mounted at `/input`, answers land in
`/output/<id>/stdout.bin` and `/output/<id>/exit.txt`.
