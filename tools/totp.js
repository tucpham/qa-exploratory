#!/usr/bin/env node
// RFC 6238 TOTP for test accounts with MFA. The secret stays in .env, never in the repo or in prompts.
//   node tools/totp.js <ENV_NAME_OF_BASE32_SECRET>      -> prints the current 6-digit code
const crypto = require('crypto');

function base32Decode(s) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = s.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = ''; for (const c of clean) { const v = alphabet.indexOf(c); if (v < 0) throw new Error('Invalid base32'); bits += v.toString(2).padStart(5, '0'); }
  const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(key, counter, digits = 6, algo = 'sha1') {
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac(algo, key).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 10 ** digits).padStart(digits, '0');
}

function totp(secret, { time = Date.now(), step = 30, digits = 6, algo = 'sha1', raw = false } = {}) {
  const key = raw ? Buffer.from(secret) : base32Decode(secret);
  return hotp(key, Math.floor(time / 1000 / step), digits, algo);
}

module.exports = { totp, hotp, base32Decode };

if (require.main === module) {
  require('./lib/common').loadEnv();
  const name = process.argv[2];
  if (!name || !process.env[name]) { console.error('Usage: node tools/totp.js <ENV_NAME> (env var must hold the base32 secret)'); process.exit(2); }
  console.log(totp(process.env[name]));
}
