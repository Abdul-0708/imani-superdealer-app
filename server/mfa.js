'use strict';
/*
 * Multi-factor authentication (TOTP, RFC 6238) — compatible with Google
 * Authenticator, Microsoft Authenticator, Authy, 1Password, etc.
 * Pure Node crypto (HMAC-SHA1); no third-party TOTP dependency. QR rendering
 * uses the `qrcode` library (pure JS, produces inline SVG).
 */
var crypto = require('crypto');

var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  var bits = 0, value = 0, out = '';
  for (var i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i]; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function base32Decode(str) {
  str = String(str).replace(/=+$/, '').toUpperCase().replace(/\s+/g, '');
  var bits = 0, value = 0, out = [];
  for (var i = 0; i < str.length; i++) {
    var idx = B32.indexOf(str[i]); if (idx < 0) continue;
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

function generateSecret() { return base32Encode(crypto.randomBytes(20)); }

function hotp(secretB32, counter) {
  var key = base32Decode(secretB32);
  var buf = Buffer.alloc(8);
  for (var i = 7; i >= 0; i--) { buf[i] = counter & 0xff; counter = Math.floor(counter / 256); }
  var h = crypto.createHmac('sha1', key).update(buf).digest();
  var off = h[h.length - 1] & 0x0f;
  var code = ((h[off] & 0x7f) << 24) | ((h[off + 1] & 0xff) << 16) | ((h[off + 2] & 0xff) << 8) | (h[off + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}
function totp(secretB32, atMs) { return hotp(secretB32, Math.floor((atMs || Date.now()) / 1000 / 30)); }

/* Accept codes within +/- `window` 30s steps to tolerate clock drift. */
function verify(secretB32, token, window) {
  window = (window == null) ? 1 : window;
  token = String(token || '').trim();
  if (!/^\d{6}$/.test(token)) return false;
  var counter = Math.floor(Date.now() / 1000 / 30);
  for (var w = -window; w <= window; w++) {
    if (hotp(secretB32, counter + w) === token) return true;
  }
  return false;
}

function otpauthURI(secretB32, account, issuer) {
  issuer = issuer || 'IMANI SUPERDEALER';
  var label = encodeURIComponent(issuer) + ':' + encodeURIComponent(account);
  return 'otpauth://totp/' + label + '?secret=' + secretB32 + '&issuer=' + encodeURIComponent(issuer) + '&algorithm=SHA1&digits=6&period=30';
}
async function qrSvg(uri) {
  var QR = require('qrcode');
  return await QR.toString(uri, { type: 'svg', margin: 1, width: 190 });
}

module.exports = {
  generateSecret: generateSecret, totp: totp, verify: verify,
  otpauthURI: otpauthURI, qrSvg: qrSvg, base32Encode: base32Encode, base32Decode: base32Decode
};
