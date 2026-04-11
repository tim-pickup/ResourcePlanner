export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export type FundingType = 'Group Strategy Funded' | 'Sector Funded' | 'Business Funded';
export type AssignmentStatus = 'tentative' | 'locked';
export type UserRole =
  | 'project_lead'
  | 'resource_manager'
  | 'prioritisation_board'
  | 'pmo_admin';

export interface Theme {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Skill {
  id: string;
  themeId: string;
  name: string;
  isActive: boolean;
}

export interface SkillLevel {
  id: string;
  label: string;
  rank: number;
}

export interface EngineerSkill {
  skillId: string;
  skillLevelId: string;
}

export interface Engineer {
  id: string;
  name: string;
  weeklyCapacityHours: number;
  isActive: boolean;
  themeIds: string[];
  skills: EngineerSkill[];
}

export interface WeeklyHours {
  weekCommencing: string;
  hours: number;
}

export interface ProjectPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  fundingType: FundingType;
}

export interface DemandRow {
  id: string;
  projectId: string;
  phaseId: string;
  skillId: string;
  label?: string;
  requiredSkillLevelId: string | null;
  weeklyHours: WeeklyHours[];
}

export interface Assignment {
  id: string;
  projectId: string;
  demandRowId: string;
  engineerId: string;
  weeklyHours: WeeklyHours[];
  status: AssignmentStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  phases: ProjectPhase[];
  createdByUserId: string;
  status: ProjectStatus;
  rejectionReason: string;
  submittedAt: string | null;
}
