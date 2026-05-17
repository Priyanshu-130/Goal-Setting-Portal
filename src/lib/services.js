import { supabase } from './supabase';

// --- Mock Database Helper (LocalStorage Persistence) ---
const MOCK_DB_KEY = 'performx_mock_db_v2';

const isDemo = () => {
  return !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project-id.supabase.co';
};

const isDemoActive = () => {
  if (isDemo()) return true;
  const demoUser = localStorage.getItem('performx_demo_user');
  if (demoUser) {
    try {
      const user = JSON.parse(demoUser);
      return user && user.id && user.id.startsWith('demo-');
    } catch (e) {
      return false;
    }
  }
  return false;
};

const getMockDb = () => {
  const stored = localStorage.getItem(MOCK_DB_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Auto-reseed/upgrade if it's the old sparse version with fewer than 100 profiles
      if (parsed.profiles && parsed.profiles.length >= 100) {
        return parsed;
      }
    } catch (e) {
      console.warn("Corrupted mock database. Re-initializing...");
    }
  }
  
  // Rich enterprise SaaS dataset seeding
  const firstNames = [
    'Aarav', 'Rohan', 'Priyanshu', 'Sameer', 'Kabir', 'Arjun', 'Amit', 'Vikram', 'Siddharth', 'Rahul', 
    'Ishan', 'Dev', 'Yash', 'Raj', 'Kunal', 'Rohit', 'Deepak', 'Sanjay', 'Manish', 'Vivek', 
    'Ankit', 'Varun', 'Nikhil', 'Shivam', 'Harshi', 'Janhvi', 'Anshu', 'Anika', 'Tanya', 'Simran', 
    'Neha', 'Riya', 'Priya', 'Shalini', 'Aditi', 'Sneha', 'Divya', 'Pooja', 'Anjali', 'Meera', 
    'Kiran', 'Kavita', 'Shreya', 'Ishita', 'Ritu', 'Payal', 'Kajal', 'Sakshi', 'Nisha', 'Aishwarya',
    'Mehak', 'Karan', 'Abhishek', 'Gaurav', 'Aditya', 'Pranav', 'Mayank', 'Rishabh', 'Aayush', 'Tanmay'
  ];
  const lastNames = [
    'Sharma', 'Das', 'Roy', 'Khan', 'Goel', 'Singh', 'Kumari', 'Gupta', 'Mehta', 'Sen', 
    'Joshi', 'Patel', 'Kaur', 'Malhotra', 'Verma', 'Kumar', 'Choudhury', 'Iyer', 'Reddy', 'Nair', 
    'Bose', 'Mishra', 'Dubey', 'Yadav', 'Trivedi', 'Saxena', 'Kapoor', 'Bhasin', 'Jha', 'Deshmukh'
  ];

  const departments = [
    { name: 'Operations', managerId: 'demo-mgr-1', designations: ['Operations Analyst', 'Logistics Coordinator', 'Process Specialist', 'Operations Associate'] },
    { name: 'Engineering', managerId: 'demo-mgr-2', designations: ['Software Developer', 'Frontend Engineer', 'Backend Dev', 'Fullstack Engineer', 'DevOps Specialist'] },
    { name: 'Product', managerId: 'demo-mgr-3', designations: ['Product Manager', 'Associate PM', 'Product Specialist', 'UX Researcher'] },
    { name: 'Design', managerId: 'demo-mgr-4', designations: ['UI Designer', 'UX Designer', 'Interaction Designer', 'Graphic Designer'] },
    { name: 'Marketing', managerId: 'demo-mgr-5', designations: ['Marketing Analyst', 'SEO Specialist', 'Content Writer', 'Growth Hacker'] },
    { name: 'Sales', managerId: 'demo-mgr-6', designations: ['Sales Executive', 'Account Executive', 'Business Dev Rep', 'Sales Specialist'] },
    { name: 'Customer Success', managerId: 'demo-mgr-7', designations: ['CS Associate', 'Account Manager', 'Support Engineer', 'CS Specialist'] },
    { name: 'People & Culture', managerId: 'demo-mgr-8', designations: ['HR Associate', 'Talent Acquisition', 'People Specialist', 'HR Coordinator'] },
    { name: 'Finance', managerId: 'demo-mgr-9', designations: ['Financial Analyst', 'Accountant', 'Billing Specialist', 'Finance Associate'] },
    { name: 'Security', managerId: 'demo-mgr-10', designations: ['Security Analyst', 'Penetration Tester', 'Compliance Specialist', 'Security Engineer'] }
  ];

  const managers = [
    { id: 'demo-mgr-1', name: 'Janhvi Singh', role: 'manager', status: 'active', designation: 'Operations Manager', department: 'Operations' },
    { id: 'demo-mgr-2', name: 'Arjun Mehta', role: 'manager', status: 'active', designation: 'Engineering Manager', department: 'Engineering' },
    { id: 'demo-mgr-3', name: 'Neha Gupta', role: 'manager', status: 'active', designation: 'Product Director', department: 'Product' },
    { id: 'demo-mgr-4', name: 'Kabir Malhotra', role: 'manager', status: 'active', designation: 'Design Lead', department: 'Design' },
    { id: 'demo-mgr-5', name: 'Riya Sen', role: 'manager', status: 'active', designation: 'Marketing Manager', department: 'Marketing' },
    { id: 'demo-mgr-6', name: 'Vikram Malhotra', role: 'manager', status: 'active', designation: 'Sales VP', department: 'Sales' },
    { id: 'demo-mgr-7', name: 'Aarav Joshi', role: 'manager', status: 'active', designation: 'Customer Success Manager', department: 'Customer Success' },
    { id: 'demo-mgr-8', name: 'Simran Kaur', role: 'manager', status: 'active', designation: 'HR Manager', department: 'People & Culture' },
    { id: 'demo-mgr-9', name: 'Amit Patel', role: 'manager', status: 'active', designation: 'Finance Manager', department: 'Finance' },
    { id: 'demo-mgr-10', name: 'Siddharth Sharma', role: 'manager', status: 'active', designation: 'Security Director', department: 'Security' }
  ];

  const admin = { id: 'demo-adm-1', name: 'Anshu Raj', role: 'admin', status: 'active', designation: 'VP Operations', department: 'Executive' };

  // Create profiles array
  const profiles = [admin, ...managers];

  // Base core employees
  const coreEmployees = [
    { id: 'demo-emp-1', name: 'Harshi Singh', role: 'employee', status: 'active', designation: 'Senior Analyst', department: 'Operations', manager_id: 'demo-mgr-1' },
    { id: 'demo-emp-2', name: 'Rohan Das', role: 'employee', status: 'active', designation: 'Software Developer', department: 'Engineering', manager_id: 'demo-mgr-2' },
    { id: 'demo-emp-3', name: 'Priyanshu Sharma', role: 'employee', status: 'active', designation: 'UI Engineer', department: 'Engineering', manager_id: 'demo-mgr-2' },
    { id: 'demo-emp-4', name: 'Anika Roy', role: 'employee', status: 'active', designation: 'Product Specialist', department: 'Product', manager_id: 'demo-mgr-3' },
    { id: 'demo-emp-5', name: 'Sameer Khan', role: 'employee', status: 'active', designation: 'DevOps Engineer', department: 'Engineering', manager_id: 'demo-mgr-2' },
    { id: 'demo-emp-6', name: 'Tanya Goel', role: 'employee', status: 'active', designation: 'QA Analyst', department: 'Security', manager_id: 'demo-mgr-10' }
  ];

  const employees = [];
  let empIndex = 0;

  for (let mIdx = 0; mIdx < managers.length; mIdx++) {
    const manager = managers[mIdx];
    const dept = departments.find(d => d.name === manager.department) || departments[mIdx];
    
    // Find how many core employees are already assigned to this manager
    const coreForManager = coreEmployees.filter(e => e.manager_id === manager.id);
    
    // Add the core employees first
    coreForManager.forEach(core => {
      employees.push({
        ...core,
        avatar: core.name.split(' ').map(n => n[0]).join('').toUpperCase()
      });
    });
    
    // Fill up the rest of the 10 spots for this manager with synthesized employees
    const spotsToFill = 10 - coreForManager.length;
    for (let s = 0; s < spotsToFill; s++) {
      let newEmpId;
      do {
        empIndex++;
        newEmpId = `demo-emp-${empIndex}`;
      } while (coreEmployees.some(e => e.id === newEmpId) || empIndex <= 6);
      
      const fName = firstNames[empIndex % firstNames.length];
      const lName = lastNames[empIndex % lastNames.length];
      const name = `${fName} ${lName}`;
      const desIdx = empIndex % dept.designations.length;
      const designation = dept.designations[desIdx];
      
      employees.push({
        id: newEmpId,
        name,
        role: 'employee',
        status: 'active',
        designation,
        department: manager.department,
        manager_id: manager.id,
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase()
      });
    }
  }

  // Sort employees by their numerical ID to keep it consistent
  employees.sort((a, b) => {
    const aNum = parseInt(a.id.replace('demo-emp-', ''));
    const bNum = parseInt(b.id.replace('demo-emp-', ''));
    return aNum - bNum;
  });

  profiles.push(...employees);

  // Initialize goals & checkins list
  const goals = [
    // Harshi Singh (demo-emp-1)
    { id: 'g-hs-1', title: 'Improve Production System Uptime', status: 'approved', thrust_area: 'Infrastructure', weightage: 30, target: '99.9%', employee_id: 'demo-emp-1' },
    { id: 'g-hs-2', title: 'Optimize Backend API Latency', status: 'approved', thrust_area: 'Performance', weightage: 40, target: '< 100ms', employee_id: 'demo-emp-1' },
    { id: 'g-hs-3', title: 'Security Audit and RLS Compliance', status: 'draft', thrust_area: 'Security', weightage: 30, target: '100% Pass', employee_id: 'demo-emp-1' },
    
    // Rohan Das (demo-emp-2)
    { id: 'g-rd-1', title: 'Build Real-time Telemetry Engine', status: 'approved', thrust_area: 'Analytics', weightage: 50, target: '50ms response', employee_id: 'demo-emp-2' },
    { id: 'g-rd-2', title: 'Implement Automation Suite Coverage', status: 'submitted', thrust_area: 'Quality', weightage: 50, target: '90% coverage', employee_id: 'demo-emp-2' },
    
    // Priyanshu Sharma (demo-emp-3)
    { id: 'g-ps-1', title: 'Revamp Dashboard Glassmorphic Layout', status: 'approved', thrust_area: 'Frontend', weightage: 40, target: '4.9 UX rating', employee_id: 'demo-emp-3' },
    { id: 'g-ps-2', title: 'Develop Global Persona Switcher', status: 'approved', thrust_area: 'Core Engineering', weightage: 60, target: '100% hot-swap', employee_id: 'demo-emp-3' },
    
    // Anika Roy (demo-emp-4)
    { id: 'g-ar-1', title: 'Launch Product Marketing Campaign', status: 'approved', thrust_area: 'Growth', weightage: 40, target: '10k signups', employee_id: 'demo-emp-4' },
    { id: 'g-ar-2', title: 'Coordinate Q3 User Satisfaction Surveys', status: 'approved', thrust_area: 'Product', weightage: 60, target: '95% CSAT', employee_id: 'demo-emp-4' },
    
    // Sameer Khan (demo-emp-5)
    { id: 'g-sk-1', title: 'Automate Multi-Region CI/CD Pipeline', status: 'approved', thrust_area: 'DevOps', weightage: 50, target: '< 5 min builds', employee_id: 'demo-emp-5' },
    { id: 'g-sk-2', title: 'Purge Cloud Resource Redundancies', status: 'approved', thrust_area: 'Cost Optimization', weightage: 50, target: '$5k saved/mo', employee_id: 'demo-emp-5' },
    
    // Tanya Goel (demo-emp-6)
    { id: 'g-tg-1', title: 'Configure Core Integration Tests Suite', status: 'submitted', thrust_area: 'Quality Assurance', weightage: 60, target: '100% automation', employee_id: 'demo-emp-6' },
    { id: 'g-tg-2', title: 'Perform Rigorous Pen-Testing on API', status: 'draft', thrust_area: 'Security', weightage: 40, target: 'Zero vulnerability', employee_id: 'demo-emp-6' }
  ];

  const check_ins = [
    // Harshi Singh - Goal 1
    { id: 'c-1', goal_id: 'g-hs-1', quarter: 'Q1', status: 'completed', planned_value: '99.9%', actual_value: '99.92%', notes: 'Production server migration completed smoothly.' },
    { id: 'c-2', goal_id: 'g-hs-1', quarter: 'Q2', status: 'completed', planned_value: '99.9%', actual_value: '99.95%', notes: 'Load balancer configurations fine-tuned.' },
    { id: 'c-3', goal_id: 'g-hs-1', quarter: 'Q3', status: 'completed', planned_value: '99.9%', actual_value: '99.98%', notes: 'Handling regional network failovers and multi-zone backups.' },
    { id: 'c-4', goal_id: 'g-hs-1', quarter: 'Q4', status: 'not_started', planned_value: '99.9%', actual_value: '', notes: '' },

    // Harshi Singh - Goal 2
    { id: 'c-5', goal_id: 'g-hs-2', quarter: 'Q1', status: 'completed', planned_value: '150ms', actual_value: '142ms', notes: 'Initial endpoints caching layer deployed.' },
    { id: 'c-6', goal_id: 'g-hs-2', quarter: 'Q2', status: 'completed', planned_value: '100ms', actual_value: '95ms', notes: 'Database indexes optimized and redundancy reduced.' },
    { id: 'c-7', goal_id: 'g-hs-2', quarter: 'Q3', status: 'completed', planned_value: '100ms', actual_value: '88ms', notes: 'Memory leaks resolved in server middleware.' },
    { id: 'c-8', goal_id: 'g-hs-2', quarter: 'Q4', status: 'not_started', planned_value: '100ms', actual_value: '', notes: '' },

    // Rohan Das - Goal 4
    { id: 'c-9', goal_id: 'g-rd-1', quarter: 'Q1', status: 'completed', planned_value: '80ms', actual_value: '72ms', notes: 'Finalized the telemetry schema and data architecture.' },
    { id: 'c-10', goal_id: 'g-rd-1', quarter: 'Q2', status: 'completed', planned_value: '50ms', actual_value: '48ms', notes: 'Optimized internal memory structures.' },
    { id: 'c-11', goal_id: 'g-rd-1', quarter: 'Q3', status: 'completed', planned_value: '50ms', actual_value: '45ms', notes: 'Executing parallel simulated benchmark workloads.' },

    // Priyanshu Sharma - Goal 6
    { id: 'c-12', goal_id: 'g-ps-1', quarter: 'Q1', status: 'completed', planned_value: '4.5', actual_value: '4.6', notes: 'Finished visual layout and UX prototypes.' },
    { id: 'c-13', goal_id: 'g-ps-1', quarter: 'Q2', status: 'completed', planned_value: '4.8', actual_value: '4.85', notes: 'Glassmorphism theme and custom timeline implemented.' },
    { id: 'c-14', goal_id: 'g-ps-1', quarter: 'Q3', status: 'completed', planned_value: '4.8', actual_value: '4.9', notes: 'Deployed UI polish globally across components.' },

    // Priyanshu Sharma - Goal 7
    { id: 'c-15', goal_id: 'g-ps-2', quarter: 'Q1', status: 'completed', planned_value: '50%', actual_value: '60%', notes: 'Hot-swap Context state hooks coded.' },
    { id: 'c-16', goal_id: 'g-ps-2', quarter: 'Q2', status: 'completed', planned_value: '100%', actual_value: '100%', notes: 'Integrated persona switcher header pill.' },

    // Anika Roy - Goal 8
    { id: 'c-17', goal_id: 'g-ar-1', quarter: 'Q1', status: 'completed', planned_value: '2k', actual_value: '2.4k', notes: 'Launch materials ready.' },
    { id: 'c-18', goal_id: 'g-ar-1', quarter: 'Q2', status: 'completed', planned_value: '5k', actual_value: '5.8k', notes: 'Social media campaign launched successfully.' },
    { id: 'c-19', goal_id: 'g-ar-1', quarter: 'Q3', status: 'completed', planned_value: '8k', actual_value: '8.2k', notes: 'Exceeded target user acquisition rates.' },

    // Sameer Khan - Goal 10
    { id: 'c-20', goal_id: 'g-sk-1', quarter: 'Q1', status: 'completed', planned_value: '10 min', actual_value: '8.5 min', notes: 'CI/CD pipeline parallel runs enabled.' },
    { id: 'c-21', goal_id: 'g-sk-1', quarter: 'Q2', status: 'completed', planned_value: '5 min', actual_value: '4.8 min', notes: 'Optimized Docker container caching.' },
    { id: 'c-22', goal_id: 'g-sk-1', quarter: 'Q3', status: 'completed', planned_value: '5 min', actual_value: '4.2 min', notes: 'Global region distribution optimized.' }
  ];

  const goalPools = {
    'Operations': [
      { title: 'Streamline Resource Utilization Rates', thrust: 'Operations', target: '92% efficiency' },
      { title: 'Minimize Dispatch Cycle Delay times', thrust: 'Logistics', target: '< 15 mins' },
      { title: 'Optimize Process Standard Operations', thrust: 'Quality', target: '99% audit pass' }
    ],
    'Engineering': [
      { title: 'Implement Frontend Performance Caching', thrust: 'Performance', target: '95+ Lighthouse' },
      { title: 'Refactor Legacy Codebase Abstractions', thrust: 'Technical Debt', target: 'Zero critical lints' },
      { title: 'Deploy Automated Testing Pipelines', thrust: 'CI/CD', target: '95% test coverage' }
    ],
    'Product': [
      { title: 'Refine Feature Onboarding Funnels', thrust: 'Growth', target: '80% completion' },
      { title: 'Conduct User Satisfaction Surveys', thrust: 'UX Research', target: '4.8 rating' },
      { title: 'Formulate Product Strategy Roadmaps', thrust: 'Core Strategy', target: 'Sign-off received' }
    ],
    'Design': [
      { title: 'Establish Shared UI Design Tokens', thrust: 'Design System', target: '100% components' },
      { title: 'Revamp Workspace Glassmorphic Panels', thrust: 'UI Polish', target: '4.9 satisfaction' },
      { title: 'Construct Interactive Motion Prototypes', thrust: 'UX Motion', target: 'All core flows' }
    ],
    'Marketing': [
      { title: 'Accelerate Organic Brand Awareness', thrust: 'Growth', target: '20% MoM increase' },
      { title: 'Optimize Paid Search Engine Ad Campaigns', thrust: 'Acquisition', target: '30% CAC reduction' },
      { title: 'Publish Quality Technical Blog Posts', thrust: 'Content Marketing', target: '10 posts/month' }
    ],
    'Sales': [
      { title: 'Achieve High Quarterly Revenue Targets', thrust: 'Revenue', target: '$150k ARR added' },
      { title: 'Enlarge Direct Enterprise Leads pipeline', thrust: 'Leads', target: '50 warm accounts' },
      { title: 'Reduce Customer Sales Conversion cycles', thrust: 'Sales Cycle', target: '< 14 days' }
    ],
    'Customer Success': [
      { title: 'Elevate Client Retention Ratios', thrust: 'Retention', target: '98% renewal rate' },
      { title: 'Curtail Customer Support Response delays', thrust: 'Support SLA', target: '< 30 min response' },
      { title: 'Implement Client Knowledgebase Articles', thrust: 'Self-Service', target: '40 new articles' }
    ],
    'People & Culture': [
      { title: 'Execute Annual Employee Review cycles', thrust: 'Performance', target: '100% completion' },
      { title: 'Foster Inclusive Diversity Programs', thrust: 'Culture', target: '95% positive feedback' },
      { title: 'Streamline Automated Hiring Workflows', thrust: 'Recruiting', target: '< 21 days time-to-hire' }
    ],
    'Finance': [
      { title: 'Enforce Rigorous Budget Control guidelines', thrust: 'Budgeting', target: 'Zero budget overrun' },
      { title: 'Accelerate Monthly Billing Statement cycle', thrust: 'Billing', target: 'Done by 2nd business day' },
      { title: 'Audit Vendor Cloud Resource Expense invoices', thrust: 'Cost Optimization', target: '$12k cost reduction' }
    ],
    'Security': [
      { title: 'Audit Platform Row-Level Security Rules', thrust: 'Security Compliance', target: '100% secure' },
      { title: 'Execute Routine Cyber Attack Penetration Tests', thrust: 'Risk Mitigation', target: 'Zero critical issues' },
      { title: 'Deploy Enhanced Multi-Factor Authentication', thrust: 'Identity Access', target: 'All client accounts' }
    ]
  };

  // Generate goals and checkins for each employee from 7 to 100 under 10 managers
  for (let i = 7; i <= 100; i++) {
    const empId = `demo-emp-${i}`;
    const emp = employees.find(e => e.id === empId);
    if (!emp) continue;
    
    const pool = goalPools[emp.department] || goalPools['Operations'];
    const goalIndex1 = i % pool.length;
    const g1 = pool[goalIndex1];
    const g1Id = `g-emp-${i}-1`;
    
    let status = 'approved';
    if (i % 7 === 0) status = 'submitted';
    else if (i % 9 === 0) status = 'draft';
    
    goals.push({
      id: g1Id,
      title: g1.title,
      status,
      thrust_area: g1.thrust,
      weightage: 50,
      target: g1.target,
      employee_id: empId
    });
    
    if (i % 5 === 0) {
      const goalIndex2 = (i + 1) % pool.length;
      const g2 = pool[goalIndex2];
      const g2Id = `g-emp-${i}-2`;
      goals.push({
        id: g2Id,
        title: g2.title,
        status: 'approved',
        thrust_area: g2.thrust,
        weightage: 50,
        target: g2.target,
        employee_id: empId
      });
      
      if (status === 'approved') {
        check_ins.push(
          { id: `c-${i}-2-q1`, goal_id: g2Id, quarter: 'Q1', status: 'completed', planned_value: '50%', actual_value: '52%', notes: 'First phase objectives reached.' },
          { id: `c-${i}-2-q2`, goal_id: g2Id, quarter: 'Q2', status: 'completed', planned_value: '100%', actual_value: '100%', notes: 'Second phase achievements verified.' }
        );
      }
    }

    if (status === 'approved') {
      const q1Actual = (50 + (i % 10)) + '%';
      const q2Actual = (80 + (i % 15)) + '%';
      const q3Actual = (90 + (i % 9)) + '%';
      
      check_ins.push(
        { id: `c-${i}-1-q1`, goal_id: g1Id, quarter: 'Q1', status: 'completed', planned_value: '50%', actual_value: q1Actual, notes: 'Milestone 1 target met.' },
        { id: `c-${i}-1-q2`, goal_id: g1Id, quarter: 'Q2', status: 'completed', planned_value: '80%', actual_value: q2Actual, notes: 'Performance aligns with plans.' },
        { id: `c-${i}-1-q3`, goal_id: g1Id, quarter: 'Q3', status: 'completed', planned_value: '100%', actual_value: q3Actual, notes: 'Q3 checkpoint review successfully submitted.' }
      );
    }
  }

  const audit_logs = [
    { id: 'a-1', action: 'SYSTEM_INIT', actor: 'System', details: 'Enterprise system scaling complete: 100 employees and 10 managers active.', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'a-2', action: 'GOAL_UNLOCKED', actor: 'Anshu Raj', details: 'Unlocked goal sheet for FY2026 enterprise performance cycle', timestamp: new Date(Date.now() - 3600000 * 6).toISOString() },
    { id: 'a-3', action: 'GOAL_CREATED', actor: 'Harshi Singh', details: 'Created goal "Security Audit and RLS Compliance" as draft', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 'a-4', action: 'SUBMITTED_GOALS', actor: 'Tanya Goel', details: 'Submitted 1 goals for approval', timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString() },
    { id: 'a-5', action: 'GOAL_APPROVED', actor: 'Janhvi Singh', details: 'Approved goal "Build Real-time Telemetry Engine" for Rohan Das', timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString() },
    { id: 'a-6', action: 'CHECK_IN_SUBMITTED', actor: 'Priyanshu Sharma', details: 'Submitted Q2 check-in for "Revamp Dashboard Glassmorphic Layout" (completed)', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'a-7', action: 'CHECK_IN_SUBMITTED', actor: 'Sameer Khan', details: 'Submitted Q2 check-in for "Automate Multi-Region CI/CD Pipeline" (completed)', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
    { id: 'a-8', action: 'GOAL_APPROVED', actor: 'Janhvi Singh', details: 'Distributed shared KPI "Optimize Telemetry Bandwidth" to [Rohan Das, Sameer Khan]', timestamp: new Date(Date.now() - 600000 * 4).toISOString() },
    { id: 'a-9', action: 'GOAL_UPDATED', actor: 'Harshi Singh', details: 'Updated goal "Optimize Backend API Latency"', timestamp: new Date(Date.now() - 600000 * 2).toISOString() },
    { id: 'a-10', action: 'GOAL_CREATED', actor: 'Arjun Mehta', details: 'Assigned engineering sprint performance targets for 12 developers', timestamp: new Date(Date.now() - 3600000 * 8).toISOString() },
    { id: 'a-11', action: 'GOAL_APPROVED', actor: 'Neha Gupta', details: 'Approved Q3 roadmaps for Product Specialization Teams', timestamp: new Date(Date.now() - 3600000 * 10).toISOString() },
    { id: 'a-12', action: 'CHECK_IN_SUBMITTED', actor: 'Aarav Joshi', details: 'Submitted customer CSAT audit response sheet (98% CSAT)', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: 'a-13', action: 'GOAL_UPDATED', actor: 'Simran Kaur', details: 'Updated core company-wide HR hiring lifecycle parameters', timestamp: new Date(Date.now() - 3600000 * 14).toISOString() },
    { id: 'a-14', action: 'GOAL_APPROVED', actor: 'Siddharth Sharma', details: 'Approved security penetration testing checklist for QA analysts', timestamp: new Date(Date.now() - 3600000 * 18).toISOString() }
  ];

  const initial = { profiles, goals, check_ins, audit_logs };
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(initial));
  return initial;
};

const saveMockDb = (data) => {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(data));
};

/**
 * GOALS SERVICE
 */
export const goalsService = {
  async getEmployeeGoals(employeeId) {
    if (isDemoActive() || (employeeId && employeeId.toString().startsWith('demo-'))) {
      const db = getMockDb();
      const employeeGoals = db.goals.filter(g => g.employee_id === employeeId);
      return employeeGoals.map(g => ({
        ...g,
        check_ins: db.check_ins.filter(ci => ci.goal_id === g.id)
      }));
    }
    
    const { data, error } = await supabase
      .from('goals')
      .select('*, check_ins(*)')
      .eq('employee_id', employeeId);

    if (error) throw error;
    return data;
  },

  async getTeamGoals(managerId) {
    if (isDemoActive() || (managerId && managerId.toString().startsWith('demo-'))) {
      const db = getMockDb();
      const mid = managerId || 'demo-mgr-1';
      const teamProfiles = db.profiles.filter(p => p.role === 'employee' && p.manager_id === mid);
      const teamIds = teamProfiles.map(p => p.id);
      return db.goals.filter(g => teamIds.includes(g.employee_id)).map(g => {
        const profile = db.profiles.find(p => p.id === g.employee_id);
        return {
          ...g,
          profiles: profile ? { name: profile.name, department: profile.department } : null,
          check_ins: db.check_ins.filter(ci => ci.goal_id === g.id)
        };
      });
    }

    const { data: team, error: teamError } = await supabase
      .from('profiles')
      .select('id')
      .eq('manager_id', managerId);

    if (teamError) throw teamError;
    const teamIds = team.map(member => member.id);

    const { data, error } = await supabase
      .from('goals')
      .select('*, profiles(name), check_ins(*)')
      .in('employee_id', teamIds);

    if (error) throw error;
    return data;
  },

  async getManagerTeamGoals(managerId) {
    return this.getTeamGoals(managerId);
  },

  async getAllGoals() {
    if (isDemoActive()) {
      const db = getMockDb();
      return db.goals.map(g => {
        const profile = db.profiles.find(p => p.id === g.employee_id);
        return {
          ...g,
          profiles: profile ? { name: profile.name, department: profile.department } : null,
          check_ins: db.check_ins.filter(ci => ci.goal_id === g.id)
        };
      });
    }

    const { data, error } = await supabase
      .from('goals')
      .select('*, profiles(name, department), check_ins(*)');

    if (error) throw error;
    return data;
  },

  async createGoal(goalData) {
    if (isDemoActive()) {
      const db = getMockDb();
      const newGoal = { ...goalData, id: 'g-' + Math.random().toString(36).substr(2, 9) };
      db.goals.push(newGoal);
      saveMockDb(db);
      return newGoal;
    }

    const { data, error } = await supabase
      .from('goals')
      .insert([goalData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGoal(goalId, updates) {
    if (isDemoActive()) {
      const db = getMockDb();
      const idx = db.goals.findIndex(g => g.id === goalId);
      if (idx !== -1) {
        db.goals[idx] = { ...db.goals[idx], ...updates };
        saveMockDb(db);
        return db.goals[idx];
      }
      return null;
    }

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertGoals(goals) {
    if (isDemoActive()) {
      const db = getMockDb();
      goals.forEach(g => {
        const idx = db.goals.findIndex(eg => eg.id === g.id);
        if (idx !== -1) db.goals[idx] = { ...db.goals[idx], ...g };
        else db.goals.push({ ...g, id: g.id || 'g-' + Math.random().toString(36).substr(2, 9) });
      });
      saveMockDb(db);
      return goals;
    }

    const { data, error } = await supabase
      .from('goals')
      .upsert(goals)
      .select();

    if (error) throw error;
    return data;
  },

  async submitCheckIn(checkInData) {
    if (isDemoActive()) {
      const db = getMockDb();
      const idx = db.check_ins.findIndex(ci => ci.goal_id === checkInData.goal_id && ci.quarter === checkInData.quarter);
      if (idx !== -1) {
        db.check_ins[idx] = { ...db.check_ins[idx], ...checkInData };
      } else {
        db.check_ins.push({
          ...checkInData,
          id: checkInData.id || 'c-' + Math.random().toString(36).substr(2, 9)
        });
      }
      saveMockDb(db);
      return checkInData;
    }

    const { data, error } = await supabase
      .from('check_ins')
      .upsert([checkInData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * USERS SERVICE
 */
export const usersService = {
  async getProfile(userId) {
    if (isDemoActive() || (userId && userId.toString().startsWith('demo-'))) {
      const db = getMockDb();
      return db.profiles.find(p => p.id === userId) || { id: userId, name: 'Demo User', role: 'employee' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getTeam(managerId) {
    if (isDemoActive() || (managerId && managerId.toString().startsWith('demo-'))) {
      const db = getMockDb();
      const mid = managerId || 'demo-mgr-1';
      return db.profiles.filter(p => p.role === 'employee' && p.manager_id === mid);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('manager_id', managerId);

    if (error) throw error;
    return data;
  },

  async getTeamMembers(managerId) {
    return this.getTeam(managerId);
  },

  async getAllUsers() {
    if (isDemoActive()) return getMockDb().profiles;

    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    return data;
  },

  async createProfile(profileData) {
    if (isDemoActive()) {
      const db = getMockDb();
      const newProfile = { ...profileData, id: profileData.id || Math.random().toString(36).substr(2, 9) };
      db.profiles.push(newProfile);
      saveMockDb(db);
      return newProfile;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    if (isDemoActive()) {
      const db = getMockDb();
      const idx = db.profiles.findIndex(p => p.id === userId);
      if (idx !== -1) {
        db.profiles[idx] = { ...db.profiles[idx], ...updates };
        saveMockDb(db);
        return db.profiles[idx];
      }
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

/**
 * AUDIT SERVICE
 */
export const auditService = {
  async getRecentLogs(limit = 10) {
    if (isDemoActive()) return getMockDb().audit_logs.slice(-limit).reverse();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async logAction(action, actor, details) {
    if (isDemoActive()) {
      const db = getMockDb();
      const log = { id: 'a-' + Math.random().toString(), action, actor, details, timestamp: new Date().toISOString() };
      db.audit_logs.push(log);
      saveMockDb(db);
      return log;
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{ action, actor, details, timestamp: new Date().toISOString() }]);

    if (error) throw error;
    return data;
  }
};


