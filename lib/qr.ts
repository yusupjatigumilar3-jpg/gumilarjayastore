// Pembuat QR Code (model 2) tanpa pustaka luar dan tanpa jaringan.
// Mode byte (UTF-8), koreksi kesalahan level M, versi 1 sampai 10 (hingga 213 byte).
// Cukup untuk alamat verifikasi kwitansi. Dipakai agar QR di kwitansi cetak
// tidak bergantung pada layanan luar yang bisa gagal dimuat saat mencetak.

type Block = { count: number; data: number };

// Per versi (1..10), level M: jumlah byte koreksi per blok dan susunan blok data.
const VERSIONS: { ec: number; blocks: Block[] }[] = [
  { ec: 10, blocks: [{ count: 1, data: 16 }] },
  { ec: 16, blocks: [{ count: 1, data: 28 }] },
  { ec: 26, blocks: [{ count: 1, data: 44 }] },
  { ec: 18, blocks: [{ count: 2, data: 32 }] },
  { ec: 24, blocks: [{ count: 2, data: 43 }] },
  { ec: 16, blocks: [{ count: 4, data: 27 }] },
  { ec: 18, blocks: [{ count: 4, data: 31 }] },
  { ec: 22, blocks: [{ count: 2, data: 38 }, { count: 2, data: 39 }] },
  { ec: 22, blocks: [{ count: 3, data: 36 }, { count: 2, data: 37 }] },
  { ec: 26, blocks: [{ count: 4, data: 43 }, { count: 1, data: 44 }] },
];

const ALIGN: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

// ---- Aritmetika GF(256) untuk Reed-Solomon ----
const EXP: number[] = new Array(512).fill(0);
const LOG: number[] = new Array(256).fill(0);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data: number[], degree: number): number[] {
  const gen = rsGenerator(degree);
  const res: number[] = new Array(degree).fill(0);
  for (const b of data) {
    const factor = b ^ (res.shift() as number);
    res.push(0);
    for (let i = 0; i < degree; i++) res[i] ^= mul(gen[i + 1], factor);
  }
  return res;
}

const bit = (value: number, i: number) => ((value >>> i) & 1) === 1;

function utf8(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/** Kembalikan matriks modul (true = gelap) atau null bila teks terlalu panjang. */
export function qrMatrix(text: string): boolean[][] | null {
  const bytes = utf8(text);

  // Pilih versi terkecil yang muat.
  let version = 0;
  let dataCodewords = 0;
  for (let v = 1; v <= 10; v++) {
    const total = VERSIONS[v - 1].blocks.reduce((s, b) => s + b.count * b.data, 0);
    const countBits = v <= 9 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= total * 8) {
      version = v;
      dataCodewords = total;
      break;
    }
  }
  if (!version) return null;

  // ---- Bit data ----
  const bits: number[] = [];
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));
  push(0, Math.min(4, dataCodewords * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    data.push(b);
  }
  for (let pad = 0xec; data.length < dataCodewords; pad ^= 0xec ^ 0x11) data.push(pad);

  // ---- Bagi ke blok, hitung koreksi, lalu susun selang-seling ----
  const info = VERSIONS[version - 1];
  const blocks: number[][] = [];
  let offset = 0;
  for (const g of info.blocks) {
    for (let i = 0; i < g.count; i++) {
      blocks.push(data.slice(offset, offset + g.data));
      offset += g.data;
    }
  }
  const eccBlocks = blocks.map((b) => rsRemainder(b, info.ec));
  const maxData = Math.max(...blocks.map((b) => b.length));
  const all: number[] = [];
  for (let i = 0; i < maxData; i++) blocks.forEach((b) => { if (i < b.length) all.push(b[i]); });
  for (let i = 0; i < info.ec; i++) eccBlocks.forEach((b) => all.push(b[i]));

  // ---- Matriks ----
  const size = 17 + 4 * version;
  const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFn: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const setFn = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFn[y][x] = true;
  };

  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, dist !== 2 && dist !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  const pos = ALIGN[version - 1];
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFn(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  const drawFormat = (mask: number) => {
    const d = (0 << 3) | mask; // level M = 00
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits15 = ((d << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(bits15, i));
    setFn(8, 7, bit(bits15, 6));
    setFn(8, 8, bit(bits15, 7));
    setFn(7, 8, bit(bits15, 8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(bits15, i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(bits15, i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(bits15, i));
    setFn(8, size - 8, true);
  };
  drawFormat(0);

  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const v18 = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, bit(v18, i));
      setFn(b, a, bit(v18, i));
    }
  }

  // ---- Tempatkan data (zigzag) ----
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFn[y][x] && k < all.length * 8) {
          modules[y][x] = bit(all[k >>> 3], 7 - (k & 7));
          k++;
        }
      }
    }
  }

  const applyMask = (mask: number) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let invert = false;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (!isFn[y][x] && invert) modules[y][x] = !modules[y][x];
      }
    }
  };

  const penalty = (): number => {
    let p = 0;
    const line = (get: (i: number) => boolean) => {
      let run = 1;
      for (let i = 1; i < size; i++) {
        if (get(i) === get(i - 1)) {
          run++;
          if (run === 5) p += 3;
          else if (run > 5) p += 1;
        } else run = 1;
      }
      // pola mirip penanda posisi (1011101 dengan 4 modul terang di salah satu sisi)
      const s = Array.from({ length: size }, (_, i) => (get(i) ? '1' : '0')).join('');
      for (let i = 0; i + 11 <= size; i++) {
        const w = s.substr(i, 11);
        if (w === '10111010000' || w === '00001011101') p += 40;
      }
    };
    for (let y = 0; y < size; y++) line((x) => modules[y][x]);
    for (let x = 0; x < size; x++) line((y) => modules[y][x]);
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) p += 3;
      }
    }
    let dark = 0;
    for (const row of modules) for (const c of row) if (c) dark++;
    const total = size * size;
    p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return p;
  };

  let best = 0;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m);
    drawFormat(m);
    const score = penalty();
    if (score < bestScore) { best = m; bestScore = score; }
    applyMask(m); // balikkan
  }
  applyMask(best);
  drawFormat(best);
  return modules;
}
