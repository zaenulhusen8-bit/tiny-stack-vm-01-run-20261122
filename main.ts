// Tiny stack VM (ISA v1) - make.fun tiny-stack-vm-01-run-20261122.
// One run answers all 40 instances i001..i040 of a set.
// 32-bit wrapping ints, 256-value stack, 64-deep call stack, 256 words of
// memory, ten traps with their own exit codes, 1e6-step / 65536-byte limits.
const fs = require("node:fs");
const V = new Uint8Array(256);
for (const k of [0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 48, 49, 50, 51, 52, 64, 65, 80, 81, 82, 83]) V[k] = 1;
function run(g, q) {
  const m = new Int32Array(256), s = new Int32Array(256), c = new Int32Array(64), o = Buffer.alloc(65536);
  let sp = 0, cp = 0, pc = 0, ip = 0, n = 0, ol = 0, e = 0, d = 0, a, b, t;
  while (!d) {
    if (n >= 1e6) { e = 10; break; } // step limit, checked first
    if (pc < 0 || pc >= g.length) { e = 9; break; } // pc outside program
    const k = g[pc];
    if (!V[k]) { e = 5; break; } // unknown opcode
    const im = k === 1 ? 1 : k === 2 ? 4 : k >= 48 && k <= 51 ? 2 : 0;
    if (pc + 1 + im > g.length) { e = 9; break; } // immediate cut off
    n++;
    switch (k) {
      case 0: d = 1; break; // HALT, exit 0
      case 1: if (sp > 255) { e = 3; d = 1; break; } s[sp++] = (g[pc + 1] << 24) >> 24; pc += 2; break; // PUSH8, sign-extended
      case 2: if (sp > 255) { e = 3; d = 1; break; } s[sp++] = g[pc + 1] | g[pc + 2] << 8 | g[pc + 3] << 16 | g[pc + 4] << 24; pc += 5; break; // PUSH32 LE
      case 3: if (sp < 1) { e = 2; d = 1; break; } sp--; pc++; break; // POP
      case 4: if (sp < 1) { e = 2; d = 1; break; } if (sp > 255) { e = 3; d = 1; break; } s[sp] = s[sp - 1]; sp++; pc++; break; // DUP
      case 5: if (sp < 2) { e = 2; d = 1; break; } a = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = a; pc++; break; // SWAP
      case 6: if (sp < 2) { e = 2; d = 1; break; } if (sp > 255) { e = 3; d = 1; break; } s[sp] = s[sp - 2]; sp++; pc++; break; // OVER
      case 7: if (sp < 3) { e = 2; d = 1; break; } a = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = a; pc++; break; // ROT
      case 16: case 17: case 18: case 19: case 20: case 21: case 22: case 24: case 25: case 26: case 28: case 29: case 30: case 32: case 33: case 34:
        if (sp < 2) { e = 2; d = 1; break; }
        b = s[sp - 1]; a = s[sp - 2];
        if ((k === 19 || k === 20 || k === 21 || k === 22) && b === 0) { e = 4; d = 1; break; } // div by zero
        if (k === 16) s[sp - 2] = (a + b) | 0; // ADD
        else if (k === 17) s[sp - 2] = (a - b) | 0; // SUB
        else if (k === 18) s[sp - 2] = Math.imul(a, b); // MUL, low 32 bits
        else if (k === 19) s[sp - 2] = (a / b) | 0; // DIV, trunc to zero; INT_MIN/-1 wraps to INT_MIN
        else if (k === 20) s[sp - 2] = (a % b) | 0; // MOD, sign of a; x%-1 is 0
        else if (k === 21) s[sp - 2] = Math.floor((a >>> 0) / (b >>> 0)) | 0; // DIVU
        else if (k === 22) s[sp - 2] = ((a >>> 0) % (b >>> 0)) | 0; // MODU
        else if (k === 24) s[sp - 2] = a & b;
        else if (k === 25) s[sp - 2] = a | b;
        else if (k === 26) s[sp - 2] = a ^ b;
        else if (k === 28) s[sp - 2] = a << (b & 31); // SHL, low 5 bits only
        else if (k === 29) s[sp - 2] = a >> (b & 31); // SHR arithmetic
        else if (k === 30) s[sp - 2] = (a >>> (b & 31)) | 0; // SHRU logical
        else if (k === 32) s[sp - 2] = a === b ? 1 : 0; // EQ
        else if (k === 33) s[sp - 2] = a < b ? 1 : 0; // LT signed
        else s[sp - 2] = (a >>> 0) < (b >>> 0) ? 1 : 0; // LTU unsigned
        sp--; pc++; break;
      case 23: if (sp < 1) { e = 2; d = 1; break; } s[sp - 1] = (-s[sp - 1]) | 0; pc++; break; // NEG
      case 27: if (sp < 1) { e = 2; d = 1; break; } s[sp - 1] = ~s[sp - 1]; pc++; break; // NOT
      case 48: pc = pc + 3 + ((g[pc + 1] | g[pc + 2] << 8) << 16 >> 16); break; // JMP, signed offset from next instr
      case 49: case 50:
        if (sp < 1) { e = 2; d = 1; break; }
        a = s[--sp];
        if ((k === 49 && a === 0) || (k === 50 && a !== 0)) pc = pc + 3 + ((g[pc + 1] | g[pc + 2] << 8) << 16 >> 16);
        else pc += 3;
        break; // JZ / JNZ
      case 51: if (cp > 63) { e = 7; d = 1; break; } c[cp++] = pc + 3; pc = g[pc + 1] | g[pc + 2] << 8; break; // CALL, unsigned target
      case 52: if (cp < 1) { e = 8; d = 1; break; } pc = c[--cp]; break; // RET
      case 64: if (sp < 1) { e = 2; d = 1; break; } a = s[sp - 1]; if (a < 0 || a > 255) { e = 6; d = 1; break; } s[sp - 1] = m[a]; pc++; break; // LOAD
      case 65: if (sp < 2) { e = 2; d = 1; break; } a = s[sp - 1]; b = s[sp - 2]; if (a < 0 || a > 255) { e = 6; d = 1; break; } m[a] = b; sp -= 2; pc++; break; // STORE (v addr --)
      case 80: if (sp < 1) { e = 2; d = 1; break; } a = s[--sp]; t = String(a); if (ol + t.length > 65536) { e = 11; d = 1; break; } ol += o.write(t, ol); pc++; break; // PRINT decimal
      case 81: if (sp < 1) { e = 2; d = 1; break; } if (ol >= 65536) { e = 11; d = 1; break; } o[ol++] = s[--sp] & 255; pc++; break; // PUTC
      case 82: if (sp > 255) { e = 3; d = 1; break; } s[sp++] = ip < q.length ? q[ip++] : -1; pc++; break; // IN, -1 when used up
      case 83: if (sp < 1) { e = 2; d = 1; break; } e = s[--sp] & 255; d = 1; break; // EXIT, low byte
      default: e = 5; d = 1; break; // unreachable: V check above
    }
  }
  return { out: o.subarray(0, ol), code: e };
}
for (let n = 1; n <= 40; n++) {
  const id = "i" + String(n).padStart(3, "0");
  const r = run(fs.readFileSync("/input/" + id + "/program.bin"), fs.readFileSync("/input/" + id + "/input.bin"));
  fs.mkdirSync("/output/" + id, { recursive: true });
  fs.writeFileSync("/output/" + id + "/stdout.bin", r.out);
  fs.writeFileSync("/output/" + id + "/exit.txt", String(r.code));
}
