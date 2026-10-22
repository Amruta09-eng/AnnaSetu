// AnnaSetu System Constants & Rules

const ROLES = ['donor', 'ngo', 'volunteer', 'beneficiary', 'admin'];

const CATEGORIES = [
  'Food',
  'Water',
  'Clothing',
  'Blankets',
  'Hygiene',
  'Medical supplies'
];

const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

// Boundary Value Analysis limits
const QTY_LIMITS = {
  min: 1,
  max: 500
};

const SERVINGS_LIMITS = {
  min: 1,
  max: 1000
};

// Lifecycle Transitions matching Phase 3 State Diagram:
// Created -> Submitted -> UnderReview -> Approved -> Available -> Assigned -> InTransit -> Delivered
// UnderReview -> Rejected -> Created (edit and resubmit)
// Created / Submitted / Approved -> Cancelled
const LIFECYCLE_TRANSITIONS = {
  submit: {
    from: ['Created'],
    to: 'Submitted',
    role: ['donor']
  },
  review: {
    from: ['Submitted'],
    to: 'UnderReview',
    role: ['ngo']
  },
  approve: {
    from: ['UnderReview'],
    to: 'Approved',
    role: ['ngo']
  },
  reject: {
    from: ['UnderReview'],
    to: 'Rejected',
    role: ['ngo']
  },
  reopen: {
    from: ['Rejected'],
    to: 'Created',
    role: ['donor']
  },
  release: {
    from: ['Approved'],
    to: 'Available',
    role: ['ngo']
  },
  assign: {
    from: ['Available'],
    to: 'Assigned',
    role: ['ngo']
  },
  start: {
    from: ['Assigned'],
    to: 'InTransit',
    role: ['volunteer']
  },
  deliver: {
    from: ['InTransit'],
    to: 'Delivered',
    role: ['volunteer']
  },
  cancel: {
    from: ['Created', 'Submitted', 'Approved'],
    to: 'Cancelled',
    role: ['donor', 'admin']
  }
};

module.exports = {
  ROLES,
  CATEGORIES,
  URGENCIES,
  QTY_LIMITS,
  SERVINGS_LIMITS,
  LIFECYCLE_TRANSITIONS
};
