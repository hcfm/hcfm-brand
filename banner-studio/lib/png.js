// Server-side PNG validation without external deps.
// Verifies PNG signature and extracts width/height from the IHDR chunk.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

export function parsePng(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  if (buf.length < 24) return { ok: false, error: 'File is too small to be a PNG.' };
  if (!buf.slice(0, 8).equals(PNG_SIGNATURE)) {
    return { ok: false, error: 'File is not a PNG. Please use a .png file.' };
  }
  // Bytes 8-11 are IHDR length (should be 13), 12-15 are "IHDR" tag.
  // Width is bytes 16-19, height is 20-23, both big-endian uint32.
  if (buf.slice(12, 16).toString('ascii') !== 'IHDR') {
    return { ok: false, error: 'PNG appears malformed (no IHDR chunk).' };
  }
  const width  = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { ok: true, width, height };
}
