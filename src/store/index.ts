import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, Skill, SkillLevel, Engineer, Project, DemandRow, Assignment, UserRole } from '../types';
import {
  SEED_THEMES, SEED_SKILLS, SEED_SKILL_LEVELS, SEED_ENGINEERS,
  SEED_PROJECTS, SEED_DEMAND_ROWS, SEED_ASSIGNMENTS,
} from '../utils/seed';

const ROLE_USER_MAP: Record<UserRole, string> = {
  project_lead: 'user-1',
  resource_manager: 'user-2',
  prioritisation_board: 'user-3',
  pmo_admin: 'user-4',
};

interface StoreState {
  themes: Theme[];
  skills: Skill[];
  skillLevels: SkillLevel[];
  engineers: Engineer[];
  projects: Project[];
  demandRows: DemandRow[];
  assignments: Assignment[];
  currentRole: UserRole;
  currentUserId: string;

  setRole: (role: UserRole) => void;
  seedData: () => void;

  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  addDemandRow: (row: DemandRow) => void;
  updateDemandRow: (id: string, updates: Partial<DemandRow>) => void;
  removeDemandRow: (id: string) => void;
  setProjectDemandRows: (projectId: string, rows: DemandRow[]) => void;

  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  removeTentativeAssignments: (projectId: string) => void;
  lockProjectAssignments: (projectId: string) => void;

  addTheme: (theme: Theme) => void;
  updateTheme: (id: string, updates: Partial<Theme>) => void;
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  addEngineer: (engineer: Engineer) => void;
  updateEngineer: (id: string, updates: Partial<Engineer>) => void;
  updateSkillLevel: (id: string, updates: Partial<SkillLevel>) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      themes: [],
      skills: [],
      skillLevels: [],
      engineers: [],
      projects: [],
      demandRows: [],
      assignments: [],
      currentRole: 'project_lead',
      currentUserId: 'user-1',

      setRole: (role) => set({ currentRole: role, currentUserId: ROLE_USER_MAP[role] }),

      seedData: () => set({
        themes: SEED_THEMES,
        skills: SEED_SKILLS,
        skillLevels: SEED_SKILL_LEVELS,
        engineers: SEED_ENGINEERS,
        projects: SEED_PROJECTS,
        demandRows: SEED_DEMAND_ROWS,
        assignments: SEED_ASSIGNMENTS,
      }),

      addProject: (project) => set(s => ({ projects: [...s.projects, project] })),
      updateProject: (id, updates) => set(s => ({
        projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p),
      })),

      addDemandRow: (row) => set(s => ({ demandRows: [...s.demandRows, row] })),
      updateDemandRow: (id, updates) => set(s => ({
        demandRows: s.demandRows.map(r => r.id === id ? { ...r, ...updates } : r),
      })),
      removeDemandRow: (id) => set(s => ({ demandRows: s.demandRows.filter(r => r.id !== id) })),
      setProjectDemandRows: (projectId, rows) => set(s => ({
        demandRows: [...s.demandRows.filter(r => r.projectId !== projectId), ...rows],
      })),

      addAssignment: (a) => set(s => ({ assignments: [...s.assignments, a] })),
      removeAssignment: (id) => set(s => ({ assignments: s.assignments.filter(a => a.id !== id) })),
      updateAssignment: (id, updates) => set(s => ({
        assignments: s.assignments.map(a => a.id === id ? { ...a, ...updates } : a),
      })),
      removeTentativeAssignments: (projectId) => set(s => ({
        assignments: s.assignments.filter(a => !(a.projectId === projectId && a.status === 'tentative')),
      })),
      lockProjectAssignments: (projectId) => set(s => ({
        assignments: s.assignments.map(a =>
          a.projectId === projectId ? { ...a, status: 'locked' as const } : a
        ),
      })),

      addTheme: (theme) => set(s => ({ themes: [...s.themes, theme] })),
      updateTheme: (id, updates) => set(s => ({
        themes: s.themes.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      addSkill: (skill) => set(s => ({ skills: [...s.skills, skill] })),
      updateSkill: (id, updates) => set(s => ({
        skills: s.skills.map(sk => sk.id === id ? { ...sk, ...updates } : sk),
      })),
      addEngineer: (engineer) => set(s => ({ engineers: [...s.engineers, engineer] })),
      updateEngineer: (id, updates) => set(s => ({
        engineers: s.engineers.map(e => e.id === id ? { ...e, ...updates } : e),
      })),
      updateSkillLevel: (id, updates) => set(s => ({
        skillLevels: s.skillLevels.map(l => l.id === id ? { ...l, ...updates } : l),
      })),
    }),
    { name: 'resource-planner-v1' }
  )
);
