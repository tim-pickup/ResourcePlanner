import { Engineer, SkillLevel, Assignment } from '../types';

export function getEngineerAvailableHours(
  engineerId: string,
  weekCommencing: string,
  engineers: Engineer[],
  assignments: Assignment[]
): number {
  const engineer = engineers.find(e => e.id === engineerId);
  if (!engineer) return 0;
  const committed = assignments
    .filter(a => a.engineerId === engineerId && a.status === 'locked')
    .reduce((sum, a) => {
      const wh = a.weeklyHours.find(w => w.weekCommencing === weekCommencing);
      return sum + (wh?.hours ?? 0);
    }, 0);
  return Math.max(0, engineer.weeklyCapacityHours - committed);
}

export function getQualifiedEngineers(
  skillId: string,
  requiredSkillLevelId: string | null,
  engineers: Engineer[],
  skillLevels: SkillLevel[]
): Engineer[] {
  return engineers.filter(engineer => {
    if (!engineer.isActive) return false;
    const es = engineer.skills.find(s => s.skillId === skillId);
    if (!es) return false;
    if (!requiredSkillLevelId) return true;
    const reqLevel = skillLevels.find(l => l.id === requiredSkillLevelId);
    const engLevel = skillLevels.find(l => l.id === es.skillLevelId);
    if (!reqLevel || !engLevel) return false;
    return engLevel.rank >= reqLevel.rank;
  });
}

export function getSkillAvailableHours(
  skillId: string,
  requiredSkillLevelId: string | null,
  weekCommencing: string,
  engineers: Engineer[],
  skillLevels: SkillLevel[],
  assignments: Assignment[]
): number {
  const qualified = getQualifiedEngineers(skillId, requiredSkillLevelId, engineers, skillLevels);
  return qualified.reduce((sum, eng) => {
    return sum + getEngineerAvailableHours(eng.id, weekCommencing, engineers, assignments);
  }, 0);
}

export function getTotalDemand(demandRowId: string, assignments: Assignment[]): Record<string, number> {
  const result: Record<string, number> = {};
  assignments
    .filter(a => a.demandRowId === demandRowId)
    .forEach(a => {
      a.weeklyHours.forEach(wh => {
        result[wh.weekCommencing] = (result[wh.weekCommencing] ?? 0) + wh.hours;
      });
    });
  return result;
}
