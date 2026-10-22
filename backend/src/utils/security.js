// Security utilities: Password hashing via scrypt + timing-safe comparison

const crypto = require('crypto');

/**
 * Hashes a plaintext password using crypto.scryptSync with a 16-byte random salt.
 * @param {string} password
 * @param {string} [salt]
 * @returns {string} format: "salt:hash"
 */
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verifies a plaintext password against the stored salt:hash string using constant-time comparison.
 * @param {string} password
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  const [salt] = storedHash.split(':');
  const computed = hashPassword(password, salt);
  const bufA = Buffer.from(computed);
  const bufB = Buffer.from(storedHash);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a cryptographically secure random session token.
 * @returns {string}
 */
function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken
};
