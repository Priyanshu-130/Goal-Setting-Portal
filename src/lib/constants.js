export const GOAL_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REWORK: 'rework',
};

export const THRUST_AREAS = [
  'Financial',
  'Customer',
  'Internal Process',
  'Learning & Growth',
  'Strategic Projects'
];

export const UNIT_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)', placeholder: 'e.g. 95%' },
  { value: 'currency', label: 'Currency ($)', placeholder: 'e.g. 50000' },
  { value: 'numeric', label: 'Number (#)', placeholder: 'e.g. 10' },
  { value: 'date', label: 'Date', placeholder: 'e.g. 2026-12-31' },
  { value: 'boolean', label: 'Boolean (Yes/No)', placeholder: 'e.g. Yes' }
];

export const computeProgressScore = (goal, checkIn) => {
  if (!checkIn || !checkIn.actual || !goal.target) return null;
  
  const target = parseFloat(goal.target);
  const actual = parseFloat(checkIn.actual);
  
  if (isNaN(target) || isNaN(actual)) return null;
  
  // Basic calculation for "higher is better"
  // For more complex units, this can be expanded
  let score = (actual / target) * 100;
  return Math.min(Math.round(score), 100);
};

export const CHECK_IN_STATUS = {
  NOT_STARTED: 'not_started',
  ON_TRACK: 'on_track',
  COMPLETED: 'completed',
  AT_RISK: 'at_risk',
  SUBMITTED: 'submitted',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};
