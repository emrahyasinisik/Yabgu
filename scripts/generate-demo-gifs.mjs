/**
 * One-shot demo GIF generator (no deps). Run: node scripts/generate-demo-gifs.mjs
 * Creates assets/mcp-add-cursor.gif and assets/scan-plan-apply.gif
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");

const BG = [0x1a, 0x1a, 0x1a];
const GOLD = [0xc4, 0xa3, 0x5a];
const GREEN = [0x8a, 0x9a, 0x7b];
const MUTED = [0x6a, 0x6a, 0x6a];
const WHITE = [0xe8, 0xe4, 0xd8];
const PANEL = [0x24, 0x24, 0x24];
const ACCENT = [0x3d, 0x4a, 0x38];

/** Build a 16-color palette (RGB triples). */
function palette(...colors) {
  const out = [];
  for (const c of colors) out.push(...c);
  while (out.length < 16 * 3) out.push(0, 0, 0);
  return Buffer.from(out.slice(0, 16 * 3));
}

function colorIndex(rgb, pal) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < 16; i++) {
    const o = i * 3;
    const d =
      (rgb[0] - pal[o]) ** 2 + (rgb[1] - pal[o + 1]) ** 2 + (rgb[2] - pal[o + 2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function fill(buf, w, h, rgb, pal) {
  const idx = colorIndex(rgb, pal);
  buf.fill(idx);
}

function rect(buf, w, h, x, y, rw, rh, rgb, pal) {
  const idx = colorIndex(rgb, pal);
  for (let yy = y; yy < y + rh && yy < h; yy++) {
    if (yy < 0) continue;
    for (let xx = x; xx < x + rw && xx < w; xx++) {
      if (xx < 0) continue;
      buf[yy * w + xx] = idx;
    }
  }
}

function hline(buf, w, h, x, y, len, rgb, pal) {
  rect(buf, w, h, x, y, len, 2, rgb, pal);
}

/** Tiny 5x7 bitmap font for A–Z, 0–9, space, punctuation used in demos. */
const GLYPHS = {
  " ": [],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  "3": [0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  ".": [0, 0, 0, 0, 0, 0b00100, 0b00100],
  ",": [0, 0, 0, 0, 0, 0b00100, 0b01000],
  ":": [0, 0b00100, 0, 0, 0b00100, 0, 0],
  "-": [0, 0, 0, 0b11111, 0, 0, 0],
  ">": [0b10000, 0b01000, 0b00100, 0b00010, 0b00100, 0b01000, 0b10000],
  "/": [0b00001, 0b00010, 0b00100, 0b00100, 0b01000, 0b10000, 0b10000],
  "(": [0b00100, 0b01000, 0b10000, 0b10000, 0b10000, 0b01000, 0b00100],
  ")": [0b00100, 0b00010, 0b00001, 0b00001, 0b00001, 0b00010, 0b00100],
  "[": [0b01110, 0b01000, 0b01000, 0b01000, 0b01000, 0b01000, 0b01110],
  "]": [0b01110, 0b00010, 0b00010, 0b00010, 0b00010, 0b00010, 0b01110],
  "{": [0b00110, 0b01000, 0b01000, 0b10000, 0b01000, 0b01000, 0b00110],
  "}": [0b01100, 0b00010, 0b00010, 0b00001, 0b00010, 0b00010, 0b01100],
  '"': [0b01010, 0b01010, 0, 0, 0, 0, 0],
  "'": [0b00100, 0b00100, 0, 0, 0, 0, 0],
  "=": [0, 0b11111, 0, 0b11111, 0, 0, 0],
  "+": [0, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0],
  "_": [0, 0, 0, 0, 0, 0, 0b11111],
};

function drawText(buf, w, h, x, y, text, rgb, pal, scale = 2) {
  const idx = colorIndex(rgb, pal);
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS["."];
    for (let row = 0; row < 7; row++) {
      const bits = g[row] ?? 0;
      for (let col = 0; col < 5; col++) {
        if (bits & (1 << (4 - col))) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = cx + col * scale + sx;
              const py = y + row * scale + sy;
              if (px >= 0 && px < w && py >= 0 && py < h) buf[py * w + px] = idx;
            }
          }
        }
      }
    }
    cx += 6 * scale;
  }
}

/** LZW encode indexed pixels for GIF (min code size 4 for 16 colors). */
function lzwEncode(indexStream, minCodeSize = 4) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoi + 1;
  const maxCode = () => (1 << codeSize) - 1;

  const dict = new Map();
  const resetDict = () => {
    dict.clear();
    for (let i = 0; i < clear; i++) dict.set(String(i), i);
    nextCode = eoi + 1;
    codeSize = minCodeSize + 1;
  };
  resetDict();

  const outBits = [];
  let bitBuf = 0;
  let bitCount = 0;
  const writeCode = (code) => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      outBits.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitCount -= 8;
    }
  };

  writeCode(clear);
  let w = String(indexStream[0]);
  for (let i = 1; i < indexStream.length; i++) {
    const k = String(indexStream[i]);
    const wk = w + "," + k;
    if (dict.has(wk)) {
      w = wk;
    } else {
      writeCode(dict.get(w));
      if (nextCode <= 4095) {
        dict.set(wk, nextCode++);
        if (nextCode > maxCode() + 1 && codeSize < 12) codeSize++;
      } else {
        writeCode(clear);
        resetDict();
      }
      w = k;
    }
  }
  writeCode(dict.get(w));
  writeCode(eoi);
  if (bitCount > 0) outBits.push(bitBuf & 0xff);
  return Buffer.from(outBits);
}

function gifPack(width, height, pal, frames, delayCs = 80) {
  const parts = [];
  // Header
  parts.push(Buffer.from("GIF89a"));
  const logical = Buffer.alloc(7);
  logical.writeUInt16LE(width, 0);
  logical.writeUInt16LE(height, 2);
  logical[4] = 0x80 | (4 - 1) << 4 | (4 - 1); // GCT flag, color res, size 16
  logical[5] = 0; // bg
  logical[6] = 0; // aspect
  parts.push(logical);
  parts.push(pal);

  // Netscape loop
  parts.push(Buffer.from([0x21, 0xff, 0x0b]));
  parts.push(Buffer.from("NETSCAPE2.0"));
  parts.push(Buffer.from([0x03, 0x01, 0x00, 0x00, 0x00]));

  for (const frame of frames) {
    // Graphic control
    const gce = Buffer.alloc(8);
    gce[0] = 0x21;
    gce[1] = 0xf9;
    gce[2] = 0x04;
    gce[3] = 0x00;
    gce.writeUInt16LE(delayCs, 4);
    gce[6] = 0;
    gce[7] = 0;
    parts.push(gce);

    // Image descriptor
    const id = Buffer.alloc(10);
    id[0] = 0x2c;
    id.writeUInt16LE(0, 1);
    id.writeUInt16LE(0, 3);
    id.writeUInt16LE(width, 5);
    id.writeUInt16LE(height, 7);
    id[9] = 0;
    parts.push(id);

    const compressed = lzwEncode(frame, 4);
    parts.push(Buffer.from([4])); // LZW min code size
    let offset = 0;
    while (offset < compressed.length) {
      const n = Math.min(255, compressed.length - offset);
      parts.push(Buffer.from([n]));
      parts.push(compressed.subarray(offset, offset + n));
      offset += n;
    }
    parts.push(Buffer.from([0]));
  }

  parts.push(Buffer.from([0x3b]));
  return Buffer.concat(parts);
}

function makeMcpAddGif() {
  const W = 640;
  const H = 360;
  const pal = palette(BG, GOLD, GREEN, MUTED, WHITE, PANEL, ACCENT, [0x2a, 0x2a, 0x2a]);
  const frames = [];

  const stages = [
    (buf) => {
      fill(buf, W, H, BG, pal);
      rect(buf, W, H, 24, 24, W - 48, H - 48, PANEL, pal);
      drawText(buf, W, H, 48, 48, "CURSOR  MCP", GOLD, pal, 3);
      drawText(buf, W, H, 48, 100, "1. CREATE .CURSOR/MCP.JSON", WHITE, pal, 2);
      drawText(buf, W, H, 48, 140, "SETTINGS > MCP", MUTED, pal, 2);
    },
    (buf) => {
      fill(buf, W, H, BG, pal);
      rect(buf, W, H, 24, 24, W - 48, H - 48, PANEL, pal);
      drawText(buf, W, H, 48, 48, "PASTE CONFIG", GOLD, pal, 3);
      rect(buf, W, H, 48, 110, W - 96, 180, [0x2a, 0x2a, 0x2a], pal);
      drawText(buf, W, H, 64, 128, '{ "MCPSERVERS": {', GREEN, pal, 2);
      drawText(buf, W, H, 64, 160, '  "YABGU": {', GREEN, pal, 2);
      drawText(buf, W, H, 64, 192, '    "COMMAND": "NPX",', GREEN, pal, 2);
      drawText(buf, W, H, 64, 224, '    "ARGS": ["-Y", "..."]', GREEN, pal, 2);
      drawText(buf, W, H, 64, 256, "  } } }", GREEN, pal, 2);
    },
    (buf) => {
      fill(buf, W, H, BG, pal);
      rect(buf, W, H, 24, 24, W - 48, H - 48, PANEL, pal);
      drawText(buf, W, H, 48, 48, "CONNECTED", GREEN, pal, 3);
      rect(buf, W, H, 48, 120, 16, 16, GREEN, pal);
      drawText(buf, W, H, 76, 118, "YABGU", WHITE, pal, 2);
      drawText(buf, W, H, 48, 170, "YABGU_SCAN", MUTED, pal, 2);
      drawText(buf, W, H, 48, 200, "YABGU_PLAN", MUTED, pal, 2);
      drawText(buf, W, H, 48, 230, "YABGU_APPLY", MUTED, pal, 2);
      drawText(buf, W, H, 48, 260, "YABGU_MEASURE", MUTED, pal, 2);
    },
    (buf) => {
      fill(buf, W, H, BG, pal);
      rect(buf, W, H, 24, 24, W - 48, H - 48, PANEL, pal);
      drawText(buf, W, H, 48, 48, "OR TERMINAL", GOLD, pal, 3);
      rect(buf, W, H, 48, 120, W - 96, 80, [0x2a, 0x2a, 0x2a], pal);
      drawText(buf, W, H, 64, 148, "NPX ... SETUP CURSOR --WRITE", GREEN, pal, 2);
      drawText(buf, W, H, 48, 240, "WRITES .CURSOR/MCP.JSON", WHITE, pal, 2);
    },
  ];

  for (const paint of stages) {
    const buf = Buffer.alloc(W * H);
    paint(buf);
    frames.push(buf);
  }
  return gifPack(W, H, pal, frames, 100);
}

function makeScanPlanGif() {
  const W = 640;
  const H = 360;
  const pal = palette(BG, GOLD, GREEN, MUTED, WHITE, PANEL, ACCENT, [0x2a, 0x2a, 0x2a]);
  const labels = ["SCAN", "PLAN", "APPROVE", "APPLY", "MEASURE"];
  const frames = [];

  for (let step = 0; step < labels.length; step++) {
    const buf = Buffer.alloc(W * H);
    fill(buf, W, H, BG, pal);
    rect(buf, W, H, 24, 24, W - 48, H - 48, PANEL, pal);
    drawText(buf, W, H, 48, 40, "YABGU LOOP", GOLD, pal, 3);

    const boxW = 100;
    const gap = 12;
    const startX = 40;
    const y = 120;
    for (let i = 0; i < labels.length; i++) {
      const x = startX + i * (boxW + gap);
      const active = i <= step;
      rect(buf, W, H, x, y, boxW, 48, active ? ACCENT : [0x2a, 0x2a, 0x2a], pal);
      if (active) hline(buf, W, H, x, y + 48, boxW, i === step ? GOLD : GREEN, pal);
      drawText(buf, W, H, x + 8, y + 16, labels[i], active ? WHITE : MUTED, pal, 1);
      if (i < labels.length - 1) {
        drawText(buf, W, H, x + boxW + 2, y + 16, ">", MUTED, pal, 1);
      }
    }

    drawText(buf, W, H, 48, 220, `STEP: ${labels[step]}`, GREEN, pal, 2);
    if (step === 0) drawText(buf, W, H, 48, 260, "LOCAL SHALLOW SCAN", WHITE, pal, 2);
    if (step === 1) drawText(buf, W, H, 48, 260, "DRAFTS + WHY", WHITE, pal, 2);
    if (step === 2) drawText(buf, W, H, 48, 260, "YOU CONFIRM FIRST", WHITE, pal, 2);
    if (step === 3) drawText(buf, W, H, 48, 260, "INSTRUCTION PATHS ONLY", WHITE, pal, 2);
    if (step === 4) drawText(buf, W, H, 48, 260, "SETUP HEALTH 0-100", WHITE, pal, 2);
    frames.push(buf);
  }
  return gifPack(W, H, pal, frames, 90);
}

mkdirSync(ASSETS, { recursive: true });
writeFileSync(join(ASSETS, "mcp-add-cursor.gif"), makeMcpAddGif());
writeFileSync(join(ASSETS, "scan-plan-apply.gif"), makeScanPlanGif());
console.log("Wrote assets/mcp-add-cursor.gif and assets/scan-plan-apply.gif");
