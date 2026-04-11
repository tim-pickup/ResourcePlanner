import { Theme, Skill, SkillLevel, Engineer, Project, DemandRow, Assignment } from '../types';

export const SEED_THEMES: Theme[] = [
  { id: 'theme-mom', name: 'MOM', isActive: true },
  { id: 'theme-miv', name: 'MI&V', isActive: true },
];

export const SEED_SKILLS: Skill[] = [
  { id: 'skill-s7', themeId: 'theme-mom', name: 'Simatic S7', isActive: true },
  { id: 'skill-wincc', themeId: 'theme-mom', name: 'WinCC', isActive: true },
  { id: 'skill-scada', themeId: 'theme-mom', name: 'SCADA Integration', isActive: true },
  { id: 'skill-mes', themeId: 'theme-mom', name: 'MES Configuration', isActive: true },
  { id: 'skill-plc', themeId: 'theme-mom', name: 'PLC Programming', isActive: true },
  { id: 'skill-hmi', themeId: 'theme-mom', name: 'HMI Development', isActive: true },
  { id: 'skill-api', themeId: 'theme-miv', name: 'API Integrations', isActive: true },
  { id: 'skill-pbi', themeId: 'theme-miv', name: 'Power BI', isActive: true },
  { id: 'skill-dm', themeId: 'theme-miv', name: 'Data Modelling', isActive: true },
  { id: 'skill-iot', themeId: 'theme-miv', name: 'Azure IoT', isActive: true },
  { id: 'skill-opc', themeId: 'theme-miv', name: 'OPC UA', isActive: true },
  { id: 'skill-sql', themeId: 'theme-miv', name: 'SQL Analytics', isActive: true },
];

export const SEED_SKILL_LEVELS: SkillLevel[] = [
  { id: 'sl-basic', label: 'Basic', rank: 1 },
  { id: 'sl-advanced', label: 'Advanced', rank: 2 },
  { id: 'sl-specialist', label: 'Specialist', rank: 3 },
];

export const SEED_ENGINEERS: Engineer[] = [
  {
    id: 'eng-alice', name: 'Alice Chen', weeklyCapacityHours: 40, isActive: true,
    themeIds: ['theme-mom'],
    skills: [
      { skillId: 'skill-s7', skillLevelId: 'sl-advanced' },
      { skillId: 'skill-wincc', skillLevelId: 'sl-specialist' },
      { skillId: 'skill-plc', skillLevelId: 'sl-advanced' },
    ],
  },
  {
    id: 'eng-bob', name: 'Bob Kumar', weeklyCapacityHours: 40, isActive: true,
    themeIds: ['theme-mom'],
    skills: [
      { skillId: 'skill-scada', skillLevelId: 'sl-specialist' },
      { skillId: 'skill-mes', skillLevelId: 'sl-advanced' },
      { skillId: 'skill-hmi', skillLevelId: 'sl-basic' },
    ],
  },
  {
    id: 'eng-carol', name: 'Carol White', weeklyCapacityHours: 40, isActive: true,
    themeIds: ['theme-mom', 'theme-miv'],
    skills: [
      { skillId: 'skill-s7', skillLevelId: 'sl-basic' },
      { skillId: 'skill-api', skillLevelId: 'sl-advanced' },
      { skillId: 'skill-opc', skillLevelId: 'sl-basic' },
    ],
  },
  {
    id: 'eng-david', name: 'David Lee', weeklyCapacityHours: 40, isActive: true,
    themeIds: ['theme-miv'],
    skills: [
      { skillId: 'skill-pbi', skillLevelId: 'sl-specialist' },
      { skillId: 'skill-dm', skillLevelId: 'sl-advanced' },
      { skillId: 'skill-sql', skillLevelId: 'sl-advanced' },
    ],
  },
  {
    id: 'eng-emma', name: 'Emma Park', weeklyCapacityHours: 40, isActive: true,
    themeIds: ['theme-miv'],
    skills: [
      { skillId: 'skill-iot', skillLevelId: 'sl-advanced' },
      { skillId: 'skill-opc', skillLevelId: 'sl-specialist' },
      { skillId: 'skill-api', skillLevelId: 'sl-advanced' },
    ],
  },
  {
    id: 'eng-frank', name: 'Frank Torres', weeklyCapacityHours: 40, isActive: true,
    themeIds: ['theme-mom', 'theme-miv'],
    skills: [
      { skillId: 'skill-plc', skillLevelId: 'sl-specialist' },
      { skillId: 'skill-opc', skillLevelId: 'sl-advanced' },
    ],
  },
];

function wh(weeks: string[], hours: number) {
  return weeks.map(w => ({ weekCommencing: w, hours }));
}

// Week ranges for seed data
const W8_JAN = ['2026-01-05','2026-01-12','2026-01-19','2026-01-26','2026-02-02','2026-02-09','2026-02-16','2026-02-23'];
const W8_FEB = ['2026-02-02','2026-02-09','2026-02-16','2026-02-23','2026-03-02','2026-03-09','2026-03-16','2026-03-23'];
const W8_APR = ['2026-04-06','2026-04-13','2026-04-20','2026-04-27','2026-05-04','2026-05-11','2026-05-18','2026-05-25'];
const W8_MAY = ['2026-05-04','2026-05-11','2026-05-18','2026-05-25','2026-06-01','2026-06-08','2026-06-15','2026-06-22'];

// proj-3 SCADA: Assessment (Mar–Apr) + Integration (Apr–May)
const W5_MAR_APR = [
  '2026-03-02','2026-03-09','2026-03-16','2026-03-23','2026-03-30',
];
const W7_APR_MAY = [
  '2026-04-06','2026-04-13','2026-04-20','2026-04-27',
  '2026-05-04','2026-05-11','2026-05-18',
];

// proj-6 Azure IoT: Foundation (Apr–May) + Deployment (Jun–Jul)
const W8_APR_MAY_EXT = [
  '2026-04-06','2026-04-13','2026-04-20','2026-04-27',
  '2026-05-04','2026-05-11','2026-05-18','2026-05-25',
];
const W8_JUN_JUL = [
  '2026-06-01','2026-06-08','2026-06-15','2026-06-22',
  '2026-07-06','2026-07-13','2026-07-20','2026-07-27',
];

// proj-7 OPC UA: Feb–Apr (8 weeks, rejected)
const W8_FEB_MAR = [
  '2026-02-16','2026-02-23','2026-03-02','2026-03-09',
  '2026-03-16','2026-03-23','2026-03-30','2026-04-06',
];

// proj-8 SQL Analytics: Apr–Jun (11 weeks, submitted)
const W11_APR_JUN = [
  '2026-04-13','2026-04-20','2026-04-27',
  '2026-05-04','2026-05-11','2026-05-18','2026-05-25',
  '2026-06-01','2026-06-08','2026-06-15','2026-06-22',
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-1', name: 'MOM Phase 2 Upgrade',
    description: 'Upgrade MOM system to support new production lines in Plant B, including Simatic S7 configuration and PLC integration.',
    startDate: '2026-05-04', endDate: '2026-06-26',
    phases: [{ id: 'phase-1-1', name: 'Implementation', startDate: '2026-05-04', endDate: '2026-06-26', fundingType: 'Group Strategy Funded' }],
    createdByUserId: 'user-1',
    status: 'draft', rejectionReason: '', submittedAt: null,
  },
  {
    id: 'proj-2', name: 'MI&V Analytics Platform',
    description: 'Deploy Power BI dashboards and data models for production analytics across all manufacturing sites.',
    startDate: '2026-04-06', endDate: '2026-05-29',
    phases: [{ id: 'phase-2-1', name: 'Design & Build', startDate: '2026-04-06', endDate: '2026-05-29', fundingType: 'Business Funded' }],
    createdByUserId: 'user-1',
    status: 'submitted', rejectionReason: '', submittedAt: '2026-03-20T09:00:00.000Z',
  },
  {
    id: 'proj-3', name: 'SCADA System Integration',
    description: 'Integrate new SCADA system with existing MES infrastructure across Lines 1–4.',
    startDate: '2026-03-02', endDate: '2026-05-22',
    phases: [
      { id: 'phase-3-1', name: 'Assessment', startDate: '2026-03-02', endDate: '2026-04-03', fundingType: 'Business Funded' },
      { id: 'phase-3-2', name: 'Integration', startDate: '2026-04-06', endDate: '2026-05-22', fundingType: 'Sector Funded' },
    ],
    createdByUserId: 'user-1',
    status: 'under_review', rejectionReason: '', submittedAt: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 'proj-4', name: 'Power BI Dashboard Suite',
    description: 'Create comprehensive analytics dashboards for all manufacturing KPIs and executive reporting.',
    startDate: '2026-02-02', endDate: '2026-03-27',
    phases: [{ id: 'phase-4-1', name: 'Delivery', startDate: '2026-02-02', endDate: '2026-03-27', fundingType: 'Group Strategy Funded' }],
    createdByUserId: 'user-1',
    status: 'pending_approval', rejectionReason: '', submittedAt: '2026-01-20T11:00:00.000Z',
  },
  {
    id: 'proj-5', name: 'PLC Modernisation Programme',
    description: 'Replace legacy PLCs with modern Siemens S7-1500 series across Line 3.',
    startDate: '2026-01-05', endDate: '2026-02-27',
    phases: [{ id: 'phase-5-1', name: 'Implementation', startDate: '2026-01-05', endDate: '2026-02-27', fundingType: 'Group Strategy Funded' }],
    createdByUserId: 'user-1',
    status: 'approved', rejectionReason: '', submittedAt: '2025-12-20T09:00:00.000Z',
  },
  {
    id: 'proj-6', name: 'Azure IoT Connectivity Suite',
    description: 'Deploy Azure IoT hub and OPC UA gateway across all manufacturing lines enabling real-time telemetry and edge analytics.',
    startDate: '2026-04-06', endDate: '2026-07-31',
    phases: [
      { id: 'phase-6-1', name: 'Foundation', startDate: '2026-04-06', endDate: '2026-05-29', fundingType: 'Group Strategy Funded' },
      { id: 'phase-6-2', name: 'Deployment', startDate: '2026-06-01', endDate: '2026-07-31', fundingType: 'Sector Funded' },
    ],
    createdByUserId: 'user-1',
    status: 'approved', rejectionReason: '', submittedAt: '2026-03-01T09:00:00.000Z',
  },
  {
    id: 'proj-7', name: 'OPC UA Legacy Migration',
    description: 'Migrate legacy proprietary protocols to OPC UA standard across lines 5–8.',
    startDate: '2026-02-16', endDate: '2026-04-03',
    phases: [{ id: 'phase-7-1', name: 'Migration', startDate: '2026-02-16', endDate: '2026-04-03', fundingType: 'Business Funded' }],
    createdByUserId: 'user-1',
    status: 'rejected', rejectionReason: 'Insufficient OPC UA engineering capacity in the target window. Emma and Frank are already committed to Azure IoT. Recommend deferring to Q3 2026.', submittedAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'proj-8', name: 'SQL Analytics & Reporting Hub',
    description: 'Build centralised SQL analytics layer for production and quality reporting across all sites, including Power BI integration.',
    startDate: '2026-04-13', endDate: '2026-06-26',
    phases: [{ id: 'phase-8-1', name: 'Build & Deploy', startDate: '2026-04-13', endDate: '2026-06-26', fundingType: 'Business Funded' }],
    createdByUserId: 'user-1',
    status: 'submitted', rejectionReason: '', submittedAt: '2026-04-05T14:00:00.000Z',
  },
];

export const SEED_DEMAND_ROWS: DemandRow[] = [
  // proj-1: draft (May–Jun) — single phase
  { id: 'dr-1-1', projectId: 'proj-1', phaseId: 'phase-1-1', skillId: 'skill-s7', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W8_MAY, 20) },
  { id: 'dr-1-2', projectId: 'proj-1', phaseId: 'phase-1-1', skillId: 'skill-plc', requiredSkillLevelId: null, weeklyHours: wh(W8_MAY, 16) },
  // proj-2: submitted (Apr–May)
  { id: 'dr-2-1', projectId: 'proj-2', phaseId: 'phase-2-1', skillId: 'skill-pbi', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W8_APR, 24) },
  { id: 'dr-2-2', projectId: 'proj-2', phaseId: 'phase-2-1', skillId: 'skill-api', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W8_APR, 16) },
  // proj-3: under_review — Phase 1 Assessment (SCADA), Phase 2 Integration (MES)
  { id: 'dr-3-1', projectId: 'proj-3', phaseId: 'phase-3-1', skillId: 'skill-scada', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W5_MAR_APR, 24) },
  { id: 'dr-3-2', projectId: 'proj-3', phaseId: 'phase-3-2', skillId: 'skill-mes', requiredSkillLevelId: null, weeklyHours: wh(W7_APR_MAY, 16) },
  // proj-4: pending_approval (Feb–Mar)
  { id: 'dr-4-1', projectId: 'proj-4', phaseId: 'phase-4-1', skillId: 'skill-pbi', requiredSkillLevelId: 'sl-specialist', weeklyHours: wh(W8_FEB, 24) },
  { id: 'dr-4-2', projectId: 'proj-4', phaseId: 'phase-4-1', skillId: 'skill-dm', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W8_FEB, 20) },
  // proj-5: approved (Jan–Feb)
  { id: 'dr-5-1', projectId: 'proj-5', phaseId: 'phase-5-1', skillId: 'skill-plc', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W8_JAN, 16) },
  { id: 'dr-5-2', projectId: 'proj-5', phaseId: 'phase-5-1', skillId: 'skill-s7', requiredSkillLevelId: 'sl-basic', weeklyHours: wh(W8_JAN, 8) },
  // proj-6: approved — Phase 1 Foundation (IoT, Apr–May), Phase 2 Deployment (OPC, Jun–Jul)
  { id: 'dr-6-1', projectId: 'proj-6', phaseId: 'phase-6-1', skillId: 'skill-iot', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W8_APR_MAY_EXT, 32) },
  { id: 'dr-6-2', projectId: 'proj-6', phaseId: 'phase-6-2', skillId: 'skill-opc', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W8_JUN_JUL, 24) },
  // proj-7: rejected (Feb–Apr)
  { id: 'dr-7-1', projectId: 'proj-7', phaseId: 'phase-7-1', skillId: 'skill-opc', requiredSkillLevelId: 'sl-specialist', weeklyHours: wh(W8_FEB_MAR, 24) },
  { id: 'dr-7-2', projectId: 'proj-7', phaseId: 'phase-7-1', skillId: 'skill-plc', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W8_FEB_MAR, 16) },
  // proj-8: submitted (Apr–Jun)
  { id: 'dr-8-1', projectId: 'proj-8', phaseId: 'phase-8-1', skillId: 'skill-sql', requiredSkillLevelId: 'sl-advanced', weeklyHours: wh(W11_APR_JUN, 24) },
  { id: 'dr-8-2', projectId: 'proj-8', phaseId: 'phase-8-1', skillId: 'skill-pbi', requiredSkillLevelId: null, weeklyHours: wh(W11_APR_JUN, 16) },
];

export const SEED_ASSIGNMENTS: Assignment[] = [
  // proj-3: under_review — Bob covers SCADA Phase 1 (tentative)
  { id: 'asgn-3-1', projectId: 'proj-3', demandRowId: 'dr-3-1', engineerId: 'eng-bob', status: 'tentative', weeklyHours: wh(W5_MAR_APR, 24) },
  // proj-4: pending_approval — David covers both skills (tentative, fully committed in Feb–Mar)
  { id: 'asgn-4-1', projectId: 'proj-4', demandRowId: 'dr-4-1', engineerId: 'eng-david', status: 'tentative', weeklyHours: wh(W8_FEB, 24) },
  { id: 'asgn-4-2', projectId: 'proj-4', demandRowId: 'dr-4-2', engineerId: 'eng-david', status: 'tentative', weeklyHours: wh(W8_FEB, 16) },
  // proj-5: approved — locked assignments (completed Jan–Feb)
  { id: 'asgn-5-1', projectId: 'proj-5', demandRowId: 'dr-5-1', engineerId: 'eng-frank', status: 'locked', weeklyHours: wh(W8_JAN, 16) },
  { id: 'asgn-5-2', projectId: 'proj-5', demandRowId: 'dr-5-2', engineerId: 'eng-alice', status: 'locked', weeklyHours: wh(W8_JAN, 8) },
  // proj-6: approved — Emma (IoT 32h Phase 1) + Frank (OPC 24h Phase 2) locked
  { id: 'asgn-6-1', projectId: 'proj-6', demandRowId: 'dr-6-1', engineerId: 'eng-emma', status: 'locked', weeklyHours: wh(W8_APR_MAY_EXT, 32) },
  { id: 'asgn-6-2', projectId: 'proj-6', demandRowId: 'dr-6-2', engineerId: 'eng-frank', status: 'locked', weeklyHours: wh(W8_JUN_JUL, 24) },
  // proj-2: submitted — David tentative on PBI, Carol tentative on API
  { id: 'asgn-2-1', projectId: 'proj-2', demandRowId: 'dr-2-1', engineerId: 'eng-david', status: 'tentative', weeklyHours: wh(W8_APR, 24) },
  { id: 'asgn-2-2', projectId: 'proj-2', demandRowId: 'dr-2-2', engineerId: 'eng-carol', status: 'tentative', weeklyHours: wh(W8_APR, 16) },
];
