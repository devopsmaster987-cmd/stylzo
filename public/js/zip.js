// A minimal ZIP writer, for "download all" on the image compressor.
//
// Why not a library. The obvious candidates (JSZip, fflate) are real
// dependencies, and this project's client code is plain ES modules served
// straight out of /public with a CSP of `script-src 'self'`. There is no bundler
// to pull a package in through and no CDN the policy would allow, so the only
// honest options were a build step or this file. A build step to compress a
// visitor's photos would be a strange trade, so: ~120 lines, no dependencies.
//
// Why *store* and not DEFLATE. Every entry here is a JPEG, PNG or WebP, all of
// which are already entropy-coded. Running DEFLATE over an already-deflated
// stream reliably returns 0-2% at the cost of a compressor and a CRC pass per
// image. Method 0 (store) writes the bytes verbatim, so the archive costs 22
// bytes of EOCD plus 30+46 bytes of header per file and nothing else.
//
// The format is APPNOTE 6.3.x: local file header, central directory, end of
// central directory. Entry 4 is data descriptor; entry 0 is UTF-8.

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

// Both are 16-bit in the format. A ZIP that outgrows either is not something
// this writer can describe, so it refuses rather than emitting a file that
// unzips into garbage.
const MAX_ENTRIES = 0xffff;
const MAX_BYTES = 0xffffffff;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32 over a byte range. Needed per entry; there is no cheaper correct answer. */
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS date/time. The format's own fields top out in 2107, hence the clamp. */
function dosStamp(date) {
  const year = Math.min(Math.max(date.getFullYear(), 1980), 2107);
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/**
 * Make entry names unique.
 *
 * A ZIP addressed by name cannot hold two entries called `photo.jpg`, and the
 * second one silently overwrites the first in some extractors. Batch uploads
 * collide constantly, so ` (2)`, ` (3)` and so on are appended before the
 * extension, which keeps the file recognisable after extraction.
 */
function uniqueNames(names) {
  const seen = new Set();
  return names.map((raw) => {
    const base = String(raw || 'image').replace(/[/\\]+/g, '-').replace(/[\x00-\x1f\x7f]/g, '').trim() || 'image';
    if (!seen.has(base)) {
      seen.add(base);
      return base;
    }
    const dot = base.lastIndexOf('.');
    const stem = dot > 0 ? base.slice(0, dot) : base;
    const ext = dot > 0 ? base.slice(dot) : '';
    let n = 2;
    let candidate = `${stem} (${n})${ext}`;
    while (seen.has(candidate)) {
      n += 1;
      candidate = `${stem} (${n})${ext}`;
    }
    seen.add(candidate);
    return candidate;
  });
}

/**
 * Build a ZIP blob from already-encoded blobs. Everything happens in memory on
 * the visitor's device; nothing is uploaded.
 *
 * @param {{name: string, blob: Blob}[]} entries
 * @param {Date} [now] timestamp recorded in each entry
 * @returns {Promise<Blob>}
 */
export async function createZip(entries, now = new Date()) {
  const list = (entries || []).filter((e) => e && e.blob);
  if (!list.length) throw new Error('There is nothing to download yet.');
  if (list.length > MAX_ENTRIES) throw new Error('Too many images for one archive.');

  const encoder = new TextEncoder();
  const { time, date } = dosStamp(now);
  const names = uniqueNames(list.map((e) => e.name));

  // One header per entry, plus the payload. Built first so the central
  // directory can record the real offsets, which are only known once the
  // preceding local headers have been written.
  const parts = [];
  const records = [];
  let offset = 0;

  for (let i = 0; i < list.length; i += 1) {
    const nameBytes = encoder.encode(names[i]);
    const bytes = new Uint8Array(await list[i].blob.arrayBuffer());
    if (offset + bytes.length > MAX_BYTES) throw new Error('The archive would be too large to write.');

    const crc = crc32(bytes);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, LOCAL_SIG, true);
    local.setUint16(4, 20, true);          // version needed: 2.0
    local.setUint16(6, 0x0800, true);      // flag: UTF-8 names
    local.setUint16(8, 0, true);           // method: store
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, bytes.length, true);
    local.setUint32(22, bytes.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);          // extra field length

    parts.push(new Uint8Array(local.buffer), nameBytes, bytes);
    records.push({ nameBytes, crc, size: bytes.length, offset });
    offset += 30 + nameBytes.length + bytes.length;
  }

  const centralStart = offset;
  for (const record of records) {
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, CENTRAL_SIG, true);
    central.setUint16(4, 20, true);        // version made by
    central.setUint16(6, 20, true);        // version needed
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, time, true);
    central.setUint16(14, date, true);
    central.setUint32(16, record.crc, true);
    central.setUint32(20, record.size, true);
    central.setUint32(24, record.size, true);
    central.setUint16(28, record.nameBytes.length, true);
    central.setUint16(30, 0, true);        // extra
    central.setUint16(32, 0, true);        // comment
    central.setUint16(34, 0, true);        // disk number
    central.setUint16(36, 0, true);        // internal attrs
    central.setUint32(38, 0, true);        // external attrs
    central.setUint32(42, record.offset, true);
    parts.push(new Uint8Array(central.buffer), record.nameBytes);
    offset += 46 + record.nameBytes.length;
  }

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, EOCD_SIG, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, records.length, true);
  eocd.setUint16(10, records.length, true);
  eocd.setUint32(12, offset - centralStart, true);
  eocd.setUint32(16, centralStart, true);
  eocd.setUint16(20, 0, true);
  parts.push(new Uint8Array(eocd.buffer));

  return new Blob(parts, { type: 'application/zip' });
}
