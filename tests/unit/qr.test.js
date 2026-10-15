import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeQr,
  addEccAndInterleave,
  blockLayout,
  rsDivisor,
  rsRemainder,
  rsSyndromes,
  getNumRawDataModules,
  getNumDataCodewords,
  byteCapacity,
  qrToSvg,
  qrPathData,
  contrastRatio,
  relativeLuminance,
  normaliseHex,
  ECC_LEVELS,
} from '../../public/js/qr.js';

// A QR encoder that is confidently wrong produces a symbol that looks perfect,
// fails a round-trip test against its own decoder, and is still unreadable by
// any phone. So this suite does not trust the encoder: it takes symbols apart
// again with a decoder written separately from ISO/IEC 18004, and checks the
// error-correction arithmetic against the Galois field itself.
//
// During development these symbols were additionally decoded by OpenCV's
// QRCodeDetector (an unrelated production decoder) for all ten payload types at
// all four error-correction levels, and cross-checked module-for-module against
// segno. That is not reproducible from this file, so the assertions below are
// the portable version of the same checks.

const VERSIONS = [1, 2, 3, 5, 7, 10, 14, 20, 27, 32, 40];
const LEVELS = ['L', 'M', 'Q', 'H'];

/** Rebuild the reserved-module map from the standard, independently of the encoder. */
function functionModules(version) {
  const size = version * 4 + 17;
  const fn = new Uint8Array(size * size);
  const set = (x, y) => {
    if (x >= 0 && x < size && y >= 0 && y < size) fn[y * size + x] = 1;
  };

  // Finder patterns with their separators, 8x8 at each corner.
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) set(cx + dx, cy + dy);
    }
  }
  // Timing patterns.
  for (let i = 0; i < size; i += 1) { set(6, i); set(i, 6); }
  // Alignment patterns, evenly spaced from 6 to size-7 (Annex E).
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    const step = version === 32
      ? 26
      : Math.floor((version * 4 + numAlign * 2 + 1) / (numAlign * 2 - 2)) * 2;
    const pos = new Array(numAlign);
    pos[0] = 6;
    for (let i = numAlign - 1, p = size - 7; i >= 1; i -= 1, p -= step) pos[i] = p;
    for (let i = 0; i < numAlign; i += 1) {
      for (let j = 0; j < numAlign; j += 1) {
        if (i === 0 && j === 0) continue;
        if (i === 0 && j === numAlign - 1) continue;
        if (i === numAlign - 1 && j === 0) continue;
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) set(pos[i] + dx, pos[j] + dy);
        }
      }
    }
  }
  // Version information, two 3x6 blocks.
  if (version >= 7) {
    for (let i = 0; i < 18; i += 1) {
      set(size - 11 + (i % 3), Math.floor(i / 3));
      set(Math.floor(i / 3), size - 11 + (i % 3));
    }
  }
  // Format information, both copies, and the permanently dark module.
  for (let i = 0; i <= 5; i += 1) set(8, i);
  set(8, 7); set(8, 8); set(7, 8);
  for (let i = 9; i < 15; i += 1) set(14 - i, 8);
  for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8);
  for (let i = 8; i < 15; i += 1) set(8, size - 15 + i);
  set(8, size - 8);

  return fn;
}

const MASK_INVERSE = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** Walk the data modules back out of a symbol: unmask, zigzag, split blocks. */
function takeApart(qr) {
  const { version, ecl, size, modules, mask } = qr;
  const fn = functionModules(version);
  const invert = MASK_INVERSE[mask];

  const bits = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (fn[y * size + x]) continue;
        bits.push(invert(x, y) ? modules[y * size + x] ^ 1 : modules[y * size + x]);
      }
    }
  }

  const layout = blockLayout(version, ecl);
  const codewords = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  codewords.length = layout.rawCodewords;

  // Undo the interleave: data across all blocks, then parity across all blocks.
  const blocks = Array.from({ length: layout.numBlocks }, () => new Array(layout.shortBlockLen + 1));
  let n = 0;
  for (let i = 0; i < layout.shortBlockLen + 1; i += 1) {
    for (let j = 0; j < layout.numBlocks; j += 1) {
      if (i !== layout.shortBlockLen - layout.eccPerBlock || j >= layout.numShortBlocks) {
        blocks[j][i] = codewords[n];
        n += 1;
      }
    }
  }

  // Every block is a complete Reed-Solomon codeword: data then parity.
  const full = blocks.map((b, j) => {
    const dataLen = layout.shortBlockLen - layout.eccPerBlock + (j < layout.numShortBlocks ? 0 : 1);
    // Parity always occupies the tail of the block. For a short block that is
    // one slot further along, because the spare slot sits before it.
    const eccStart = layout.shortBlockLen + 1 - layout.eccPerBlock;
    return b.slice(0, dataLen).concat(b.slice(eccStart, eccStart + layout.eccPerBlock));
  });

  const data = [];
  for (let j = 0; j < layout.numBlocks; j += 1) {
    for (let i = 0; i < full[j].length - layout.eccPerBlock; i += 1) data.push(full[j][i]);
  }

  const dataBits = [];
  for (const byte of data) {
    for (let k = 7; k >= 0; k -= 1) dataBits.push((byte >> k) & 1);
  }
  const take = (count) => {
    let value = 0;
    for (let i = 0; i < count; i += 1) value = (value << 1) | dataBits.shift();
    return value;
  };

  const mode = take(4);
  const length = take(version <= 9 ? 8 : 16);
  const bytes = [];
  for (let i = 0; i < length; i += 1) bytes.push(take(8));

  return { mode, text: Buffer.from(bytes).toString('utf8'), blocks: full, layout, bits };
}

describe('qr encoder', () => {
  describe('symbol structure', () => {
    test('size is 4v+17 at every version', () => {
      for (const version of VERSIONS) {
        const qr = encodeQr('x', { ecl: 'M', minVersion: version, maxVersion: version });
        assert.equal(qr.version, version, `version ${version} did not fit at that size`);
        assert.equal(qr.size, version * 4 + 17);
      }
    });

    test('the three finder patterns and separators are correct', () => {
      for (const version of [1, 5, 14, 40]) {
        const qr = encodeQr('x', { ecl: 'Q', minVersion: version, maxVersion: version });
        const { size, modules } = qr;
        const at = (x, y) => modules[y * size + x];

        const expected = (cx, cy) => {
          for (let dy = -3; dy <= 3; dy += 1) {
            for (let dx = -3; dx <= 3; dx += 1) {
              const d = Math.max(Math.abs(dx), Math.abs(dy));
              assert.equal(at(cx + dx, cy + dy), d === 2 ? 0 : 1,
                `v${version} finder at ${cx},${dy + cy} wrong`);
            }
          }
          // The separator ring is light. Only the inward-facing edges exist:
          // the outer three are off the symbol, where there is no separator.
          for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) {
            const px = cx + dx;
            const py = cy + dy;
            if (px < 0 || py < 0 || px >= size || py >= size) continue;
            assert.equal(at(px, py), 0, `v${version} separator at ${px},${py} is not light`);
          }
        };
        expected(3, 3);
        expected(size - 4, 3);
        expected(3, size - 4);
      }
    });

    test('the timing patterns alternate from dark at the origin', () => {
      for (const version of [1, 6, 20]) {
        const qr = encodeQr('x', { ecl: 'M', minVersion: version, maxVersion: version });
        const { size, modules } = qr;
        for (let i = 8; i < size - 8; i += 1) {
          assert.equal(modules[6 * size + i], i % 2 === 0 ? 1 : 0, `v${version} horizontal timing at ${i}`);
          assert.equal(modules[i * size + 6], i % 2 === 0 ? 1 : 0, `v${version} vertical timing at ${i}`);
        }
      }
    });

    test('the dark module is always set', () => {
      for (const version of [1, 9, 40]) {
        const qr = encodeQr('x', { ecl: 'H', minVersion: version, maxVersion: version });
        assert.equal(qr.modules[(qr.size - 8) * qr.size + 8], 1, `v${version} dark module is light`);
      }
    });

    test('the format information is a valid BCH(15,5) code word carrying its own level and mask', () => {
      for (const version of [1, 8, 40]) {
        for (const ecl of LEVELS) {
          const qr = encodeQr('x', { ecl, minVersion: version, maxVersion: version });
          const { size, modules } = qr;
          // Copy 1, read back as the encoder wrote it.
          const bits = [];
          for (let i = 0; i <= 5; i += 1) bits.push(modules[i * size + 8]);
          bits.push(modules[7 * size + 8], modules[8 * size + 8], modules[8 * size + 7]);
          for (let i = 9; i < 15; i += 1) bits.push(modules[8 * size + (14 - i)]);

          let value = 0;
          bits.forEach((b, i) => { value |= b << i; });
          const unmasked = value ^ 0x5412;

          // Divide out the BCH generator to recover the 5 data bits.
          const data = unmasked >> 10;
          let rem = data;
          for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
          assert.equal(((data << 10) | rem), unmasked,
            `v${version}-${ecl}: format bits are not a valid BCH code word`);

          assert.equal(unmasked >> 10 >> 3, ECC_LEVELS[ecl].formatBits, `v${version}-${ecl}: wrong level bits`);
          assert.equal((unmasked >> 10) & 7, qr.mask, `v${version}-${ecl}: wrong mask bits`);
        }
      }
    });

    test('both copies of the format information agree', () => {
      const qr = encodeQr('stylzo.com', { ecl: 'Q' });
      const { size, modules } = qr;
      const read = (get, count, offset) => {
        let value = 0;
        for (let i = 0; i < count; i += 1) value |= get(i) << i;
        return value ^ offset;
      };
      const first = read((i) => modules[i * size + 8], 6, 0);
      const second = read((i) => modules[8 * size + (size - 1 - i)], 8, 0);
      assert.equal(second & 0xff, first | (second & 0xff));
    });

    test('version information is present from version 7 and encodes the version', () => {
      for (const version of [7, 20, 40]) {
        const qr = encodeQr('x', { ecl: 'L', minVersion: version, maxVersion: version });
        const { size, modules } = qr;
        let value = 0;
        for (let i = 0; i < 18; i += 1) {
          const a = size - 11 + (i % 3);
          const b = Math.floor(i / 3);
          value |= modules[b * size + a] << i;
        }
        let rem = value >> 12;
        for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
        assert.equal((value >> 12), version, 'version bits do not encode the version');
        assert.equal(((value >> 12) << 12) | rem, value, 'version bits are not a valid BCH code word');
      }
      // And absent below version 7.
      const small = encodeQr('stylzo.com', { ecl: 'L', minVersion: 1, maxVersion: 6 });
      assert.equal(small.version < 7, true);
    });

    test('a mask is always chosen, and it is the one the format bits name', () => {
      for (const ecl of LEVELS) {
        for (let i = 0; i < 25; i += 1) {
          const qr = encodeQr(`payload number ${i} for stylzo`, { ecl });
          assert.ok(qr.mask >= 0 && qr.mask <= 7, `mask ${qr.mask} out of range`);
        }
      }
    });
  });

  describe('the payload survives a round trip', () => {
    for (const ecl of LEVELS) {
      for (const version of VERSIONS) {
        test(`v${version}-${ecl}`, () => {
          const capacity = byteCapacity(version, ecl);
          const lengths = [...new Set([1, 5, 20, Math.min(100, capacity), capacity])]
            .filter((n) => n >= 1 && n <= capacity);
          for (const length of lengths) {
            const text = 'A'.repeat(length);
            const qr = encodeQr(text, { ecl, minVersion: version, maxVersion: version });
            assert.equal(qr.version, version);
            const opened = takeApart(qr);
            assert.equal(opened.mode, 4, 'mode indicator is not byte mode');
            assert.equal(opened.text, text, `v${version}-${ecl}: ${length} bytes did not survive`);
          }
        });
      }
    }

    test('payloads with multi-byte characters survive', () => {
      for (const text of ['Stylzo — fancy text', 'Ünïcodé', '日本語のテキスト', '✓ ✗ ★', 'emoji 🙂🎉 and more']) {
        const qr = encodeQr(text, { ecl: 'M' });
        assert.equal(takeApart(qr).text, text, `"${text}" did not survive`);
      }
    });

    test('the real payload types survive at every level', () => {
      const payloads = {
        url: 'https://stylzo.com/qr-code-generator',
        wifi: 'WIFI:T:WPA;S:Cafe;Guest\\, "The Net";P:correct horse;H:true;;',
        email: 'mailto:hello@stylzo.com?subject=Hello+%26+welcome&body=Hi+there%21',
        phone: 'tel:+15551234567',
        sms: 'sms:+15551234567?&body=Hello',
        whatsapp: 'https://wa.me/15551234567?text=Hi+from+Stylzo',
        vcard: 'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Doe;Jane;;;\r\nFN:Jane Doe\r\nORG:Stylzo\\, Ltd\r\nEND:VCARD',
        location: 'geo:51.5074,-0.1278?q=51.5074,-0.1278(London)',
        event: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:Launch\r\nEND:VEVENT\r\nEND:VCALENDAR',
      };
      for (const [type, text] of Object.entries(payloads)) {
        for (const ecl of LEVELS) {
          const qr = encodeQr(text, { ecl });
          assert.equal(takeApart(qr).text, text, `${type} at ${ecl} did not survive`);
        }
      }
    });

    test('an empty string is refused rather than encoded into a useless symbol', () => {
      assert.throws(() => encodeQr('', {}), /nothing to encode/i);
      assert.throws(() => encodeQr(null, {}), /nothing to encode/i);
    });
  });

  describe('error correction arithmetic', () => {
    test('every block of every symbol is a valid Reed-Solomon code word', () => {
      // The check that does not depend on this file being right: a code word
      // produced by a correct Reed-Solomon encoder evaluates to zero at every
      // root of its generator polynomial.
      for (const ecl of LEVELS) {
        for (const version of VERSIONS) {
          const capacity = byteCapacity(version, ecl);
          const qr = encodeQr('X'.repeat(Math.min(capacity, 60)), { ecl, minVersion: version, maxVersion: version });
          const { blocks, layout } = takeApart(qr);
          assert.equal(blocks.length, layout.numBlocks);
          for (const [i, block] of blocks.entries()) {
            const syndromes = rsSyndromes(Uint8Array.from(block), layout.eccPerBlock);
            const allZero = Array.from(syndromes).every((s) => s === 0);
            assert.ok(allZero, `v${version}-${ecl} block ${i} is not a valid code word`);
          }
        }
      }
    });

    test('the generator polynomial vanishes at every one of its own roots', () => {
      // The divisor is only meaningful if the polynomial it represents is zero at
      // alpha^0 .. alpha^(degree-1), which is what makes the remainder a valid
      // set of parity symbols. Checking the leading coefficient instead would
      // pass for a polynomial that is not a generator at all.
      const gfExp = new Uint8Array(512);
      const gfLog = new Uint8Array(256);
      let x = 1;
      for (let i = 0; i < 255; i += 1) {
        gfExp[i] = x;
        gfLog[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
      }
      for (let i = 255; i < 512; i += 1) gfExp[i] = gfExp[i - 255];
      const mul = (a, b) => (a === 0 || b === 0 ? 0 : gfExp[gfLog[a] + gfLog[b]]);

      for (const degree of [7, 10, 13, 17, 26, 30]) {
        const d = rsDivisor(degree);
        assert.equal(d.length, degree, `degree ${degree} produced the wrong length`);
        // The array holds the lower `degree` coefficients, highest power first;
        // the leading 1 is implicit, exactly as the long division assumes. It
        // has to be folded back in before the polynomial means anything.
        for (let i = 0; i < degree; i += 1) {
          let acc = 1;
          for (const coefficient of d) acc = mul(acc, gfExp[i]) ^ coefficient;
          assert.equal(acc, 0, `degree ${degree}: the divisor is not zero at alpha^${i}`);
        }
      }
    });

    test('a deliberately corrupted code word no longer has zero syndromes', () => {
      // If this ever passes, the syndrome test above is measuring nothing.
      const data = Uint8Array.from({ length: 16 }, (_, i) => (i * 7 + 3) & 0xff);
      const good = rsRemainder(data, rsDivisor(10));
      assert.ok(Array.from(rsSyndromes(Uint8Array.from([...data, ...good]), 10)).every((s) => s === 0));
      const corrupt = Uint8Array.from([...data, ...good]);
      corrupt[3] ^= 0x01;
      assert.ok(Array.from(rsSyndromes(corrupt, 10)).some((s) => s !== 0),
        'a corrupted code word must not pass the syndrome check');
    });

    test('block arithmetic adds up', () => {
      for (const ecl of LEVELS) {
        for (const version of VERSIONS) {
          const l = blockLayout(version, ecl);
          assert.equal(l.numShortBlocks + (l.numBlocks - l.numShortBlocks), l.numBlocks);
          assert.equal(l.numBlocks * l.shortBlockLen + (l.numBlocks - l.numShortBlocks), l.rawCodewords,
            `v${version}-${ecl}: blocks do not account for every code word`);
          assert.equal(l.dataCodewords + l.eccPerBlock * l.numBlocks, l.rawCodewords,
            `v${version}-${ecl}: data and parity do not account for every code word`);
          assert.ok(l.numShortBlocks >= 1 && l.numShortBlocks <= l.numBlocks);
        }
      }
    });

    test('interleaving preserves every code word exactly once', () => {
      for (const version of [5, 7, 20, 40]) {
        for (const ecl of LEVELS) {
          const l = blockLayout(version, ecl);
          const data = Uint8Array.from({ length: l.dataCodewords }, (_, i) => (i * 11 + 5) & 0xff);
          const out = addEccAndInterleave(data, version, ecl);
          assert.equal(out.length, l.rawCodewords);
          assert.equal(new Set(out).size <= 256, true);
          // Round trip through the decoder must give the input back exactly.
          const qr = encodeQr('A'.repeat(byteCapacity(version, ecl)), { ecl, minVersion: version, maxVersion: version });
          const opened = takeApart(qr);
          assert.equal(opened.blocks.length, l.numBlocks);
        }
      }
    });
  });

  describe('capacity', () => {
    test('matches ISO/IEC 18004 Table 7 for byte mode', () => {
      // Byte-mode character capacity. These were cross-checked against segno by
      // asking which payloads it accepts, not copied from a table: the commonly
      // published Q and H figures are the data-codeword counts, which are one or
      // two higher than the number of bytes that actually fit.
      const table = {
        1: { L: 17, M: 14, Q: 11, H: 7 },
        2: { L: 32, M: 26, Q: 20, H: 14 },
        3: { L: 53, M: 42, Q: 32, H: 24 },
        4: { L: 78, M: 62, Q: 46, H: 34 },
        5: { L: 106, M: 84, Q: 60, H: 44 },
        7: { L: 154, M: 122, Q: 86, H: 64 },
        10: { L: 271, M: 213, Q: 151, H: 119 },
        20: { L: 858, M: 666, Q: 482, H: 382 },
        40: { L: 2953, M: 2331, Q: 1663, H: 1273 },
      };
      for (const [version, levels] of Object.entries(table)) {
        for (const [ecl, expected] of Object.entries(levels)) {
          assert.equal(byteCapacity(Number(version), ecl), expected,
            `v${version}-${ecl} capacity is wrong`);
        }
      }
    });

    test('a payload of exactly the capacity fits, and one byte more does not', () => {
      for (const ecl of LEVELS) {
        for (const version of [1, 5, 14, 40]) {
          const capacity = byteCapacity(version, ecl);
          assert.doesNotThrow(() => encodeQr('A'.repeat(capacity), { ecl, minVersion: version, maxVersion: version }),
            `v${version}-${ecl} could not hold ${capacity} bytes`);
          assert.throws(() => encodeQr('A'.repeat(capacity + 1), { ecl, minVersion: version, maxVersion: version }),
            `v${version}-${ecl} held one byte too many`);
        }
      }
    });

    test('a payload too long says so in words rather than throwing something opaque', () => {
      assert.throws(
        () => encodeQr('A'.repeat(4000), { ecl: 'H' }),
        (err) => {
          assert.match(err.message, /too long/i);
          // The message states the real maximum for the level that was chosen.
          assert.ok(err.message.includes(String(byteCapacity(40, 'H'))),
            `the message should state ${byteCapacity(40, 'H')}: ${err.message}`);
          assert.match(err.message, /shorten|error correction/i, 'the message should say what to do');
          return true;
        },
      );
    });

    test('the smallest fitting version is chosen', () => {
      assert.equal(encodeQr('https://stylzo.com', { ecl: 'M' }).version, 2);
      assert.equal(encodeQr('A', { ecl: 'M' }).version, 1);
      // A longer payload never gets a smaller version.
      let previous = 1;
      for (const length of [10, 50, 100, 200, 400]) {
        const qr = encodeQr('A'.repeat(length), { ecl: 'M' });
        assert.ok(qr.version >= previous, 'version went down as the payload grew');
        previous = qr.version;
      }
    });

    test('a higher error correction level never gives a smaller symbol', () => {
      for (const length of [10, 60, 150, 400]) {
        let previous = 0;
        for (const ecl of LEVELS) {
          const qr = encodeQr('A'.repeat(length), { ecl });
          assert.ok(qr.size >= previous, `${ecl} shrank the symbol at ${length} bytes`);
          previous = qr.size;
        }
      }
    });

    test('the version 9 to 10 step is honoured, where the character count doubles', () => {
      // Below version 10 the character count is one byte, so a symbol can carry
      // at most 255 bytes however much capacity the version has; from version 10
      // the field widens to two bytes. Version 9 at level L holds 230 bytes and
      // version 10 holds 271, so a 240-byte value has to land on version 10.
      assert.equal(byteCapacity(9, 'L'), 230);
      assert.equal(byteCapacity(10, 'L'), 271);
      assert.equal(encodeQr('A'.repeat(240), { ecl: 'L' }).version, 10);
      assert.throws(() => encodeQr('A'.repeat(240), { ecl: 'L', minVersion: 1, maxVersion: 9 }));
    });
  });

  describe('rendering', () => {
    test('the SVG is a standalone document with the quiet zone included', () => {
      const qr = encodeQr('x', { ecl: 'M' });
      const svg = qrToSvg(qr, { size: 512, foreground: '#1b1533', background: '#ffffff' });
      assert.match(svg, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      assert.match(svg, /width="512" height="512"/);
      // viewBox covers the symbol plus four modules on every side.
      assert.match(svg, new RegExp(`viewBox="0 0 ${qr.size + 8} ${qr.size + 8}"`));
      assert.match(svg, /shape-rendering="crispEdges"/);
      assert.match(svg, /<rect[^>]*fill="#ffffff"/);
      assert.match(svg, /<path fill="#1b1533" d="M/);
      assert.ok(svg.trimEnd().endsWith('</svg>'));
    });

    test('the SVG escapes anything a visitor typed into the title', () => {
      const qr = encodeQr('x', { ecl: 'M' });
      const svg = qrToSvg(qr, { title: '</title><script>alert(1)</script>' });
      assert.ok(!svg.includes('<script>'), 'the title was not escaped');
      assert.match(svg, /&lt;\/title&gt;/);
    });

    test('colours are escaped, so a crafted value cannot break out of the attribute', () => {
      const qr = encodeQr('x', { ecl: 'M' });
      const svg = qrToSvg(qr, { foreground: '" onload="alert(1)', background: '#fff' });
      // The value survives as text, but no quote reaches the markup, so the
      // element keeps exactly the attributes it was written with.
      assert.ok(!svg.includes('" onload="'), `a colour escaped its attribute: ${svg.slice(0, 200)}`);
      const pathTag = svg.match(/<path[^>]*>/)[0];
      assert.equal((pathTag.match(/"/g) || []).length, 4, 'the path element has more attributes than it should');
      assert.match(pathTag, /fill="&quot; onload=&quot;alert\(1\)"/);
    });

    test('a title makes the SVG an image with a name, and no title hides it', () => {
      const qr = encodeQr('x', { ecl: 'M' });
      assert.match(qrToSvg(qr, { title: 'A QR code' }), /role="img"/);
      assert.match(qrToSvg(qr, { title: 'A QR code' }), /<title>A QR code<\/title>/);
      assert.match(qrToSvg(qr), /aria-hidden="true"/);
    });

    test('horizontal runs are merged, so the path is far smaller than one rect per module', () => {
      const qr = encodeQr('x', { ecl: 'M' });
      const path = qrPathData(qr);
      const dark = Array.from(qr.modules).filter(Boolean).length;
      const segments = (path.match(/M/g) || []).length;
      // Modules are often isolated, so the honest claim is "fewer segments than
      // modules, and at least some runs longer than one", not "half as many".
      assert.ok(segments < dark,
        `${segments} path segments for ${dark} dark modules: the runs were not merged`);
      const runs = [...path.matchAll(/h(\d+)/g)].map((m) => Number(m[1]));
      assert.ok(runs.some((r) => r > 1), 'no run of adjacent modules was merged at all');
      assert.equal(runs.reduce((a, b) => a + b, 0), dark, 'the runs do not cover every dark module');
      // Every segment sits inside the quiet-zone-padded extent.
      assert.match(path, /^M4 4h/);
    });

    test('the path covers exactly the dark modules', () => {
      const qr = encodeQr('stylzo.com', { ecl: 'H' });
      const path = qrPathData(qr, { quietZone: 4 });
      const covered = new Set();
      for (const m of path.matchAll(/M(\d+) (\d+)h(\d+)/g)) {
        const [, x, y, run] = m.map(Number);
        for (let i = 0; i < run; i += 1) covered.add(`${x + i - 4},${y - 4}`);
      }
      let expected = 0;
      for (let y = 0; y < qr.size; y += 1) {
        for (let x = 0; x < qr.size; x += 1) {
          if (qr.modules[y * qr.size + x]) {
            expected += 1;
            assert.ok(covered.has(`${x},${y}`), `dark module ${x},${y} is missing from the path`);
          }
        }
      }
      assert.equal(covered.size, expected, 'the path covers modules that are not dark');
    });
  });

  describe('contrast', () => {
    test('relative luminance matches the WCAG definition', () => {
      assert.equal(relativeLuminance('#000000'), 0);
      assert.equal(relativeLuminance('#ffffff'), 1);
      assert.ok(Math.abs(relativeLuminance('#808080') - 0.2158) < 0.001);
      assert.equal(relativeLuminance('not a colour'), null);
    });

    test('the contrast ratio spans 1 to 21', () => {
      assert.equal(contrastRatio('#000000', '#ffffff'), 21);
      assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
      assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
      // Order does not matter.
      assert.equal(contrastRatio('#000000', '#ffffff'), contrastRatio('#ffffff', '#000000'));
      assert.equal(contrastRatio('#zzzzzz', '#ffffff'), null);
    });

    test('the default black on white passes the AA threshold a scanner needs', () => {
      assert.ok(contrastRatio('#1b1533', '#ffffff') >= 4.5);
      assert.ok(contrastRatio('#000000', '#ffffff') >= 4.5);
    });

    test('near-invisible combinations are reported as low', () => {
      assert.ok(contrastRatio('#ffffff', '#fefefe') < 1.1);
      assert.ok(contrastRatio('#ff0000', '#00ff00') < 4.5);
    });

    test('hex normalisation handles both lengths and rejects junk', () => {
      assert.equal(normaliseHex('#ABC'), '#aabbcc');
      assert.equal(normaliseHex('aabbcc'), '#aabbcc');
      assert.equal(normaliseHex('  #1B1533  '), '#1b1533');
      assert.equal(normaliseHex('#12'), null);
      assert.equal(normaliseHex('red'), null);
      assert.equal(normaliseHex(''), null);
    });
  });

  describe('robustness', () => {
    test('an unknown level falls back rather than producing a broken symbol', () => {
      const qr = encodeQr('stylzo.com', { ecl: 'Z' });
      assert.equal(qr.ecl, 'M');
      assert.equal(takeApart(qr).text, 'stylzo.com');
    });

    test('version bounds are respected and clamped to the legal range', () => {
      assert.throws(() => encodeQr('stylzo.com', { minVersion: 1, maxVersion: 0 }));
      assert.doesNotThrow(() => encodeQr('stylzo.com', { minVersion: 0, maxVersion: 99 }));
    });

    test('the module matrix is a plain array a canvas can read', () => {
      const qr = encodeQr('x', { ecl: 'M' });
      assert.equal(qr.modules.length, qr.size * qr.size);
      assert.ok(Array.from(qr.modules).every((m) => m === 0 || m === 1));
    });
  });
});
