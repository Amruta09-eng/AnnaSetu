// Input validation rules matching Boundary Value Analysis (BVA) & Equivalence Partitioning (EP)

const { CATEGORIES, URGENCIES, QTY_LIMITS, SERVINGS_LIMITS } = require('../config/constants');

/**
 * Validates a donation payload.
 * @param {Object} body
 * @returns {string[]} array of error messages
 */
function validateDonationInput(body) {
  const errors = [];
  const qty = Number(body.quantity);

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.length > 100) {
    errors.push('Title must be 3-100 characters');
  }

  if (!CATEGORIES.includes(body.category)) {
    errors.push('Invalid category');
  }

  if (!Number.isInteger(qty) || qty < QTY_LIMITS.min || qty > QTY_LIMITS.max) {
    errors.push(`Quantity must be a whole number ${QTY_LIMITS.min}-${QTY_LIMITS.max}`);
  }

  if (
    body.servings !== undefined &&
    body.servings !== '' &&
    body.servings !== null
  ) {
    const servings = Number(body.servings);
    if (!Number.isInteger(servings) || servings < SERVINGS_LIMITS.min || servings > SERVINGS_LIMITS.max) {
      errors.push(`Servings must be ${SERVINGS_LIMITS.min}-${SERVINGS_LIMITS.max}`);
    }
  }

  if (body.deadline) {
    const parsed = Date.parse(body.deadline);
    if (isNaN(parsed)) {
      errors.push('Invalid consumption deadline');
    }
  }

  if (!body.pickup || typeof body.pickup !== 'string' || !body.pickup.trim()) {
    errors.push('Pickup location is required');
  }

  return errors;
}

/**
 * Validates an emergency/resource request payload.
 * @param {Object} body
 * @returns {string[]} array of error messages
 */
function validateRequestInput(body) {
  const errors = [];
  const qty = Number(body.quantity);

  if (!CATEGORIES.includes(body.category)) {
    errors.push('Invalid category');
  }

  if (!Number.isInteger(qty) || qty < QTY_LIMITS.min || qty > QTY_LIMITS.max) {
    errors.push(`Quantity must be a whole number ${QTY_LIMITS.min}-${QTY_LIMITS.max}`);
  }

  if (!body.location || typeof body.location !== 'string' || !body.location.trim()) {
    errors.push('Location is required');
  }

  if (!URGENCIES.includes(body.urgency)) {
    errors.push('Invalid urgency');
  }

  return errors;
}

module.exports = {
  validateDonationInput,
  validateRequestInput
};
