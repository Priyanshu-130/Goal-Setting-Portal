export const THRUST_AREAS = [
  'Technical Excellence',
  'Customer Satisfaction',
  'Revenue Growth',
  'Process Improvement',
  'Team Development',
  'Innovation',
  'Compliance & Risk',
  'Digital Transformation',
];

// Unit of Measurement options with min/max direction distinction
export const UNIT_OPTIONS = [
  { value: 'numeric_min', label: 'Numeric (Min – Higher is Better)', placeholder: 'e.g. 50 tickets', direction: 'min' },
  { value: 'numeric_max', label: 'Numeric (Max – Lower is Better)', placeholder: 'e.g. TAT < 2 hours', direction: 'max' },
  { value: 'percentage_min', label: '% (Min – Higher is Better)', placeholder: 'e.g. 95%', direction: 'min' },
  { value: 'percentage_max', label: '% (Max – Lower is Better)', placeholder: 'e.g. < 5% error rate', direction: 'max' },
  { value: 'timeline', label: 'Timeline (Date-based)', placeholder: 'e.g. Q2 2026', direction: 'timeline' },
  { value: 'zero_based', label: 'Zero-Based (0 = 100%)', placeholder: 'e.g. 0 incidents', direction: 'zero' },
];

// Legacy simple unit options (for backward compat)
export const UNIT_OPTIONS_SIMPLE = [
  { value: 'numeric', label: 'Numeric', placeholder: 'e.g. 50 tickets' },
  { value: 'percentage', label: 'Percentage', placeholder: 'e.g. 95%' },
  { value: 'timeline', label: 'Timeline', placeholder: 'e.g. Q2 2026' },
  { value: 'zero_based', label: 'Zero-Based', placeholder: 'e.g. 0 incidents' },
];

export const GOAL_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REWORK: 'rework',
};

export const CHECK_IN_STATUS = {
  NOT_STARTED: 'not_started',
  ON_TRACK: 'on_track',
  COMPLETED: 'completed',
  AT_RISK: 'at_risk',
};

// Check-in schedule enforcement per spec
export const CHECK_IN_SCHEDULE = {
  'Phase 1': { opens: '2026-05-01', label: 'Goal Setting (May 1)', action: 'Goal Creation, Submission & Approval' },
  Q1: { opens: '2026-07-01', label: 'Q1 (July)', action: 'Progress Update — Planned vs. Actual' },
  Q2: { opens: '2026-10-01', label: 'Q2 (October)', action: 'Progress Update — Planned vs. Actual' },
  Q3: { opens: '2027-01-01', label: 'Q3 (January)', action: 'Progress Update — Planned vs. Actual' },
  Q4: { opens: '2027-03-01', label: 'Q4 / Annual (March/April)', action: 'Final Achievement Capture' },
};

/**
 * Compute progress score (0–100) from a check-in entry and goal metadata.
 * Formulas per spec:
 *   - Min (Numeric/%) — Higher is better: Achievement ÷ Target × 100
 *   - Max (Numeric/%) — Lower is better: Target ÷ Achievement × 100
 *   - Timeline: completion date vs deadline (binary: done = 100, else 0)
 *   - Zero: if actual == 0 → 100%, else 0%
 */
export function computeProgressScore(goal, ci) {
  if (!ci || !ci.actual) return null;
  const unit = goal.unit || 'numeric';
  const actual = parseFloat(ci.actual);
  const target = parseFloat(goal.target);

  if (unit === 'zero_based') {
    return actual === 0 ? 100 : 0;
  }
  if (unit === 'timeline') {
    // If they recorded an actual date, treat as complete
    return ci.actual && ci.actual.trim() ? 100 : 0;
  }
  if (unit.includes('_max') || unit === 'numeric_max') {
    // Lower is better: Target ÷ Achievement
    if (actual === 0) return 100;
    return Math.min(Math.round((target / actual) * 100), 100);
  }
  // Default: Min / Higher is better — Achievement ÷ Target
  if (target === 0) return 100;
  return Math.min(Math.round((actual / target) * 100), 100);
}

export const mockGoals = [
  // ─── Harshi Singh (employeeId: 1) ─── approved goals ───
  {
    id: 'G-001',
    employeeId: 1,
    title: 'Reduce Bug Count by 40%',
    description: 'Decrease the number of production bugs reported per sprint from 25 to 15 through better unit test coverage and code reviews.',
    thrustArea: 'Technical Excellence',
    unit: 'percentage_min',
    target: '40',
    weightage: 25,
    status: GOAL_STATUS.APPROVED,
    isShared: false,
    managerComment: 'Great goal, well defined. Keep it up! — Janhvi',
    createdAt: '2026-01-10',
    checkIns: {
      Q1: { planned: '10', actual: '12', status: CHECK_IN_STATUS.COMPLETED, notes: 'Ahead of target after sprint reviews.' },
      Q2: { planned: '10', actual: '8',  status: CHECK_IN_STATUS.ON_TRACK,  notes: 'Slightly behind, catching up.' },
      Q3: { planned: '10', actual: null,  status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '10', actual: null,  status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-002',
    employeeId: 1,
    title: 'Complete AWS Solutions Architect Certification',
    description: 'Obtain the AWS Solutions Architect Associate certification to strengthen cloud architecture skills.',
    thrustArea: 'Innovation',
    unit: 'timeline',
    target: 'Q2 2026',
    weightage: 20,
    status: GOAL_STATUS.APPROVED,
    isShared: false,
    managerComment: 'Highly encouraged. Training budget approved. — Janhvi',
    createdAt: '2026-01-10',
    checkIns: {
      Q1: { planned: 'Enroll in course', actual: 'Enrolled, 40% complete', status: CHECK_IN_STATUS.ON_TRACK, notes: 'On schedule.' },
      Q2: { planned: 'Pass exam', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q3: { planned: 'N/A', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: 'N/A', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-003',
    employeeId: 1,
    title: 'Achieve 95% Code Review Turnaround',
    description: 'Ensure all code review requests are responded to within 24 hours, maintaining a 95% compliance rate.',
    thrustArea: 'Process Improvement',
    unit: 'percentage_min',
    target: '95',
    weightage: 20,
    status: GOAL_STATUS.APPROVED,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-10',
    checkIns: {
      Q1: { planned: '95', actual: '97', status: CHECK_IN_STATUS.COMPLETED, notes: 'Exceeded target.' },
      Q2: { planned: '95', actual: '93', status: CHECK_IN_STATUS.ON_TRACK, notes: 'Slightly below, improving.' },
      Q3: { planned: '95', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '95', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-004',
    employeeId: 1,
    title: 'Zero Critical Security Vulnerabilities',
    description: 'Maintain zero critical security vulnerabilities in production codebase through regular security scans.',
    thrustArea: 'Compliance & Risk',
    unit: 'zero_based',
    target: '0',
    weightage: 15,
    status: GOAL_STATUS.APPROVED,
    isShared: true,
    sharedByManagerId: 2,
    managerComment: 'Shared KPI across team. Critical for compliance. — Janhvi',
    createdAt: '2026-01-10',
    checkIns: {
      Q1: { planned: '0', actual: '0', status: CHECK_IN_STATUS.COMPLETED, notes: 'Clean scan.' },
      Q2: { planned: '0', actual: '0', status: CHECK_IN_STATUS.ON_TRACK, notes: 'On track.' },
      Q3: { planned: '0', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '0', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-005',
    employeeId: 1,
    title: 'Mentor 2 Junior Developers',
    description: 'Provide structured mentorship to at least 2 junior engineers including weekly 1:1s and code reviews.',
    thrustArea: 'Team Development',
    unit: 'numeric_min',
    target: '2',
    weightage: 20,
    status: GOAL_STATUS.APPROVED,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-10',
    checkIns: {
      Q1: { planned: '2', actual: '2', status: CHECK_IN_STATUS.COMPLETED, notes: 'Weekly sessions active with 2 mentees.' },
      Q2: { planned: '2', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q3: { planned: '2', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '2', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },

  // ─── Arjun Mehta (employeeId: 4) ─── submitted goals ───
  {
    id: 'G-006',
    employeeId: 4,
    title: 'Deliver Microservices Migration',
    description: 'Lead the migration of 3 monolithic services to microservices architecture.',
    thrustArea: 'Technical Excellence',
    unit: 'numeric_min',
    target: '3',
    weightage: 30,
    status: GOAL_STATUS.SUBMITTED,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-12',
    checkIns: {
      Q1: { planned: '1', actual: '1', status: CHECK_IN_STATUS.COMPLETED, notes: 'First service migrated on time.' },
      Q2: { planned: '1', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q3: { planned: '1', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-007',
    employeeId: 4,
    title: 'Improve API Response Time by 30%',
    description: 'Optimize slow APIs to achieve 30% improvement in P95 response time.',
    thrustArea: 'Process Improvement',
    unit: 'percentage_min',
    target: '30',
    weightage: 25,
    status: GOAL_STATUS.SUBMITTED,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-12',
    checkIns: {
      Q1: { planned: '10', actual: '8', status: CHECK_IN_STATUS.ON_TRACK, notes: 'Query optimizations in progress.' },
      Q2: { planned: '10', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q3: { planned: '10', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-008',
    employeeId: 4,
    title: 'Zero Critical Security Vulnerabilities',
    description: 'Shared KPI for all engineers — maintain zero critical CVEs in production.',
    thrustArea: 'Compliance & Risk',
    unit: 'zero_based',
    target: '0',
    weightage: 15,
    status: GOAL_STATUS.SUBMITTED,
    isShared: true,
    sharedByManagerId: 2,
    managerComment: '',
    createdAt: '2026-01-12',
    checkIns: {
      Q1: { planned: '0', actual: '0', status: CHECK_IN_STATUS.COMPLETED, notes: 'Scan passed.' },
      Q2: { planned: '0', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q3: { planned: '0', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-009',
    employeeId: 4,
    title: 'Complete System Design Course',
    description: 'Complete a structured system design course and apply learnings in architecture reviews.',
    thrustArea: 'Innovation',
    unit: 'timeline',
    target: 'Q3 2026',
    weightage: 30,
    status: GOAL_STATUS.SUBMITTED,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-12',
    checkIns: {
      Q1: { planned: 'Enroll', actual: 'Enrolled', status: CHECK_IN_STATUS.COMPLETED, notes: 'Chapter 1-4 done.' },
      Q2: { planned: '50% done', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q3: { planned: 'Complete', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: 'N/A', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },

  // ─── Kavya Nair (employeeId: 5) ─── draft goals ───
  {
    id: 'G-010',
    employeeId: 5,
    title: 'Launch New Design System',
    description: 'Build and launch a comprehensive component library used across all products.',
    thrustArea: 'Digital Transformation',
    unit: 'timeline',
    target: 'Q2 2026',
    weightage: 40,
    status: GOAL_STATUS.DRAFT,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-15',
    checkIns: { Q1: {}, Q2: {}, Q3: {}, Q4: {} },
  },
  {
    id: 'G-011',
    employeeId: 5,
    title: 'Improve Lighthouse Score to 95+',
    description: 'Optimize web app performance for Lighthouse score above 95.',
    thrustArea: 'Technical Excellence',
    unit: 'numeric_min',
    target: '95',
    weightage: 30,
    status: GOAL_STATUS.DRAFT,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-15',
    checkIns: { Q1: {}, Q2: {}, Q3: {}, Q4: {} },
  },
  {
    id: 'G-012',
    employeeId: 5,
    title: 'Zero Critical Security Vulnerabilities',
    description: 'Shared KPI for all engineers.',
    thrustArea: 'Compliance & Risk',
    unit: 'zero_based',
    target: '0',
    weightage: 15,
    status: GOAL_STATUS.DRAFT,
    isShared: true,
    sharedByManagerId: 2,
    managerComment: '',
    createdAt: '2026-01-15',
    checkIns: { Q1: {}, Q2: {}, Q3: {}, Q4: {} },
  },
  {
    id: 'G-013',
    employeeId: 5,
    title: 'Conduct User Research Sessions',
    description: 'Run 10+ user interviews to inform product decisions.',
    thrustArea: 'Customer Satisfaction',
    unit: 'numeric_min',
    target: '10',
    weightage: 15,
    status: GOAL_STATUS.DRAFT,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-15',
    checkIns: { Q1: {}, Q2: {}, Q3: {}, Q4: {} },
  },

  // ─── Suresh Patel (employeeId: 6) ─── approved goals ───
  {
    id: 'G-014',
    employeeId: 6,
    title: 'Drive 20% Revenue Growth in Q2',
    description: 'Grow ARR by 20% through upselling and new account acquisition.',
    thrustArea: 'Revenue Growth',
    unit: 'percentage_min',
    target: '20',
    weightage: 35,
    status: GOAL_STATUS.APPROVED,
    isShared: false,
    managerComment: 'Ambitious but achievable. Monthly reviews needed.',
    createdAt: '2026-01-08',
    checkIns: {
      Q1: { planned: '5', actual: '7', status: CHECK_IN_STATUS.COMPLETED, notes: 'Strong pipeline.' },
      Q2: { planned: '8', actual: '5', status: CHECK_IN_STATUS.AT_RISK, notes: 'Market slowdown impacting pipeline.' },
      Q3: { planned: '7', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-015',
    employeeId: 6,
    title: 'Reduce Customer Churn to < 5%',
    description: 'Improve retention through better onboarding and customer success programs.',
    thrustArea: 'Customer Satisfaction',
    unit: 'percentage_max',
    target: '5',
    weightage: 30,
    status: GOAL_STATUS.APPROVED,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-08',
    checkIns: {
      Q1: { planned: '6', actual: '5.8', status: CHECK_IN_STATUS.ON_TRACK, notes: 'Almost at target.' },
      Q2: { planned: '5', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q3: { planned: '5', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '5', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
  {
    id: 'G-016',
    employeeId: 6,
    title: 'Launch 3 Product Features',
    description: 'Successfully launch 3 major product features in coordination with engineering.',
    thrustArea: 'Digital Transformation',
    unit: 'numeric_min',
    target: '3',
    weightage: 35,
    status: GOAL_STATUS.APPROVED,
    isShared: false,
    managerComment: '',
    createdAt: '2026-01-08',
    checkIns: {
      Q1: { planned: '1', actual: '1', status: CHECK_IN_STATUS.COMPLETED, notes: 'Feature X launched.' },
      Q2: { planned: '1', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q3: { planned: '1', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
      Q4: { planned: '', actual: null, status: CHECK_IN_STATUS.NOT_STARTED, notes: '' },
    },
  },
];

export const teamProgressData = [
  { name: 'Harshi Singh',  completion: 78, goals: 5, approved: 5, submitted: 0, draft: 0, checkInsCompleted: 3 },
  { name: 'Arjun Mehta',  completion: 45, goals: 4, approved: 0, submitted: 4, draft: 0, checkInsCompleted: 2 },
  { name: 'Kavya Nair',   completion: 20, goals: 4, approved: 0, submitted: 0, draft: 4, checkInsCompleted: 0 },
  { name: 'Suresh Patel', completion: 62, goals: 3, approved: 3, submitted: 0, draft: 0, checkInsCompleted: 2 },
  { name: 'Deepa Reddy',  completion: 55, goals: 4, approved: 3, submitted: 1, draft: 0, checkInsCompleted: 1 },
];

export const quarterlyData = [
  { quarter: 'Q1', completion: 82, avg: 76, target: 80 },
  { quarter: 'Q2', completion: 68, avg: 61, target: 80 },
  { quarter: 'Q3', completion: 0,  avg: 0,  target: 80 },
  { quarter: 'Q4', completion: 0,  avg: 0,  target: 80 },
];
