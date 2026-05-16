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
  'Percentage (%)',
  'Currency ($)',
  'Number (#)',
  'Date',
  'Boolean (Yes/No)'
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
