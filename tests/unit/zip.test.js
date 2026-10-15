import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createZip } from '../../public/js/zip.js';

// A ZIP written by hand, with no library to check it against, is exactly the
// kind of code that is confidently wrong. These tests verify the bytes with
// something that is not this project: where the `unzip` binary is present the
// archive is extracted for real, and everywhere the structure is parsed against
// the APPNOTE layout field by field.

const enc = (s) => new TextEncoder().encode(s);
const blob = (s) => new Blob([enc(s)], { type: 'image/png' });

const bytes = async (b) => Buffer.from(await b.arrayBuffer());

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

async function build(entries) {
  const zip = await createZip(entries, new Date(2026, 0, 2, 3, 4, 5));
  const buf = await bytes(zip);
  // The end-of-central-directory record is the last 22 bytes when there is no
  // comment, so everything before it is the payload.
  const eocdAt = buf.length - 22;
  return {
    zip,
    buf,
    count: buf.readUInt16LE(eocdAt + 10),
    centralSize: buf.readUInt32LE(eocdAt + 12),
    centralAt: buf.readUInt32LE(eocdAt + 16),
  };
}

/** Walk the central directory, which is the authoritative list of entries. */
function central(buf, at, count) {
  const out = [];
  let p = at;
  for (let i = 0; i < count; i += 1) {
    assert.equal(buf.readUInt32LE(p), CENTRAL_SIG, `entry ${i} has no central header`);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    out.push({
      name: buf.subarray(p + 46, p + 46 + nameLen).toString('utf8'),
      method: buf.readUInt16LE(p + 10),
      flags: buf.readUInt16LE(p + 8),
      crc: buf.readUInt32LE(p + 16),
      size: buf.readUInt32LE(p + 24),
      localOffset: buf.readUInt32LE(p + 42),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

describe('zip writer', () => {
  test('produces a structurally valid archive', async () => {
    const { buf, count, centralSize, centralAt } = await build([
      { name: 'one.png', blob: blob('first') },
      { name: 'two.jpg', blob: blob('second') },
    ]);

    assert.equal(buf.readUInt32LE(0), LOCAL_SIG, 'no local file header at offset 0');
    assert.equal(buf.readUInt32LE(buf.length - 22), EOCD_SIG, 'no end-of-central-directory record');
    assert.equal(count, 2);
    assert.equal(centralAt + centralSize, buf.length - 22, 'the central directory does not end where the EOCD begins');
  });

  test('every entry is stored verbatim, with a CRC that matches its bytes', async () => {
    const payloads = ['alpha', 'bravo', 'charlie'];
    const { buf, centralAt, count } = await build(
      payloads.map((p, i) => ({ name: `f${i}.png`, blob: blob(p) })),
    );

    for (const entry of central(buf, centralAt, count)) {
      // Method 0 is the whole point: JPEG, PNG and WebP are already compressed,
      // so DEFLATE would cost CPU and return nothing.
      assert.equal(entry.method, 0, `${entry.name} was deflated`);
      // Bit 11 declares the name as UTF-8.
      assert.equal(entry.flags & 0x800, 0x800, `${entry.name} is not flagged UTF-8`);

      assert.equal(entry.size, payloads[Number(entry.name[1])].length);
      // The payload sits immediately after the local header and its name.
      const nameLen = buf.readUInt16LE(entry.localOffset + 26);
      const extraLen = buf.readUInt16LE(entry.localOffset + 28);
      const start = entry.localOffset + 30 + nameLen + extraLen;
      assert.equal(buf.subarray(start, start + entry.size).toString('utf8'), payloads[Number(entry.name[1])]);
      assert.equal(buf.readUInt32LE(entry.localOffset + 14), entry.crc, `${entry.name} CRC disagrees with its central record`);
    }
  });

  test('duplicate names are made unique instead of silently overwriting', async () => {
    // A ZIP is addressed by name. Two entries called photo.png means the second
    // one replaces the first in some extractors, which loses a photo silently.
    const { buf, centralAt, count } = await build([
      { name: 'photo.png', blob: blob('first') },
      { name: 'photo.png', blob: blob('second') },
      { name: 'photo.png', blob: blob('third') },
    ]);
    const names = central(buf, centralAt, count).map((e) => e.name);
    assert.deepEqual(names, ['photo.png', 'photo (2).png', 'photo (3).png']);
    assert.equal(new Set(names).size, 3);
  });

  test('names cannot escape the extraction directory', async () => {
    const { buf, centralAt, count } = await build([
      { name: '../../etc/passwd.png', blob: blob('a') },
      { name: 'sub\\dir\\x.png', blob: blob('b') },
    ]);
    for (const entry of central(buf, centralAt, count)) {
      assert.ok(!/[\\/]/.test(entry.name), `path separator survived in "${entry.name}"`);
      // With no separator the whole name is a single component, so the only
      // thing that can traverse is being exactly "..". The leftover dots in
      // "..-..-etc-passwd.png" are cosmetic, not a path.
      assert.notEqual(entry.name, '..');
      assert.notEqual(entry.name, '.');
    }
  });

  test('non-ASCII names round-trip through the central directory', async () => {
    // Asserted against this parser rather than an extractor: the Info-ZIP build
    // on Windows rewrites non-ASCII names through the OEM codepage on extract,
    // so an extractor-based check would be testing that binary rather than the
    // archive. Every spec-compliant reader decodes bit 11 as UTF-8.
    const names = ['café ☕.webp', 'naïve résumé.png'];
    const { buf, centralAt, count } = await build(names.map((n) => ({ name: n, blob: blob(n) })));
    const entries = central(buf, centralAt, count);
    for (const [i, name] of names.entries()) {
      assert.equal(entries[i].name, name);
      assert.equal(entries[i].flags & 0x800, 0x800, `${name} is not flagged UTF-8`);
    }
  });

  test('an empty batch is refused rather than written as a broken archive', async () => {
    await assert.rejects(() => createZip([]), /nothing to download/i);
    await assert.rejects(() => createZip([{ name: 'a.png', blob: null }]), /nothing to download/i);
  });

  test('the recorded timestamp survives the MS-DOS encoding', async () => {
    const { buf, centralAt, count } = await build([{ name: 'a.png', blob: blob('x') }]);
    const entry = central(buf, centralAt, count)[0];
    const time = buf.readUInt16LE(centralAt + 12);
    const date = buf.readUInt16LE(centralAt + 14);
    assert.equal((date >> 9) + 1980, 2026);
    assert.equal((date >> 5) & 0x0f, 1, 'month should be January');
    assert.equal(date & 0x1f, 2, 'day should be the 2nd');
    assert.equal(time >> 11, 3, 'hours');
  });

  test('a real unzip verifies every CRC and extracts the payload', async (t) => {
    let unzip;
    try {
      execFileSync('unzip', ['-v'], { stdio: 'ignore' });
      unzip = true;
    } catch {
      unzip = false;
    }
    if (!unzip) {
      t.skip('the unzip binary is not available on this machine');
      return;
    }

    const dir = mkdtempSync(join(tmpdir(), 'stylzo-zip-'));
    try {
      const { zip } = await build([
        { name: 'holiday photo.png', blob: blob('PNGDATA-holiday') },
        { name: 'holiday photo.png', blob: blob('PNGDATA-second') },
        { name: 'nested name.png', blob: blob('PNGDATA-nested') },
      ]);
      const file = join(dir, 'out.zip');
      writeFileSync(file, await bytes(zip));

      // -t recomputes every CRC from the stored bytes and compares it to the
      // value in both headers. A wrong CRC here is what makes an archive look
      // fine until it is 40 files deep in someone's downloads folder.
      const out = execFileSync('unzip', ['-t', file], { encoding: 'utf8' });
      assert.match(out, /No errors detected/);
      execFileSync('unzip', ['-o', '-q', file, '-d', dir]);

      assert.equal(readFileSync(join(dir, 'holiday photo.png'), 'utf8'), 'PNGDATA-holiday');
      assert.equal(readFileSync(join(dir, 'holiday photo (2).png'), 'utf8'), 'PNGDATA-second');
      assert.equal(readFileSync(join(dir, 'nested name.png'), 'utf8'), 'PNGDATA-nested');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('Python agrees with this parser about names and contents', async (t) => {
    // zipfile is the reference implementation most tools on the platform are
    // built against, including Windows Explorer's own unzip handler.
    let python;
    const exe = process.platform === 'win32' ? 'python' : 'python3';
    try {
      execFileSync(exe, ['-c', 'import zipfile'], { stdio: 'ignore' });
      python = exe;
    } catch {
      t.skip('python is not available on this machine');
      return;
    }

    const dir = mkdtempSync(join(tmpdir(), 'stylzo-zyp-'));
    try {
      const { zip } = await build([
        { name: 'café ☕.webp', blob: blob('WEBPDATA') },
        { name: 'same.png', blob: blob('first') },
        { name: 'same.png', blob: blob('second') },
      ]);
      const file = join(dir, 'out.zip');
      writeFileSync(file, await bytes(zip));

      const script = [
        'import json, zipfile',
        'z = zipfile.ZipFile(r' + JSON.stringify(file) + ')',
        'assert z.testzip() is None, z.testzip()',
        'print(json.dumps([[i.filename, z.read(i.filename).decode()] for i in z.infolist()]))',
      ].join('\n');

      const rows = JSON.parse(execFileSync(python, ['-c', script], { encoding: 'utf8' }));
      assert.deepEqual(rows, [
        ['café ☕.webp', 'WEBPDATA'],
        ['same.png', 'first'],
        ['same (2).png', 'second'],
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
