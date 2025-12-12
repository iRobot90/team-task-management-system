import { TASK_STATUS } from './constants';

/**
 * Compute per-user stats, top performer, and unassigned summary
 * for a given list of tasks. Only tasks with a real assignee
 * participate in the Top Performer calculation.
 */
export function computeTeamMetrics(tasks = [], users = []) {
  const statusCounts = {
    [TASK_STATUS.TODO]: 0,
    [TASK_STATUS.IN_PROGRESS]: 0,
    [TASK_STATUS.DONE]: 0,
  };

  const perUser = {};
  const unassigned = {
    total: 0,
    [TASK_STATUS.TODO]: 0,
    [TASK_STATUS.IN_PROGRESS]: 0,
    [TASK_STATUS.DONE]: 0,
  };

  tasks.forEach((task) => {
    const status = task.status;
    if (statusCounts[status] != null) {
      statusCounts[status] += 1;
    }

    const assignee = task.assignee_detail;

    if (assignee) {
      const key = assignee.id;
      if (!perUser[key]) {
        perUser[key] = {
          user: assignee,
          total: 0,
          [TASK_STATUS.TODO]: 0,
          [TASK_STATUS.IN_PROGRESS]: 0,
          [TASK_STATUS.DONE]: 0,
        };
      }
      const entry = perUser[key];
      entry.total += 1;
      if (entry[status] != null) {
        entry[status] += 1;
      }
    } else {
      unassigned.total += 1;
      if (unassigned[status] != null) {
        unassigned[status] += 1;
      }
    }
  });

  const topPerformer = computeTopPerformer(perUser);

  const totalTasks = tasks.length;
  const memberCount = users.length || Object.keys(perUser).length;
  const tasksPerMember =
    memberCount > 0 ? Number((totalTasks / memberCount).toFixed(1)) : 0;
  const activeMembers = Object.values(perUser).filter((e) => e.total > 0).length;

  return {
    statusCounts,
    perUser,
    topPerformer,
    unassigned,
    tasksPerMember,
    activeMembers,
    totalTasks,
  };
}

/**
 * Minimal, testable utility for computing the top performer.
 * Returns null if there is no assigned user.
 */
export function computeTopPerformer(perUserMap = {}) {
  const entries = Object.values(perUserMap);
  if (!entries.length) return null;

  const sorted = entries
    .slice()
    .sort((a, b) => {
      const aDone = a[TASK_STATUS.DONE] || 0;
      const bDone = b[TASK_STATUS.DONE] || 0;
      if (bDone !== aDone) return bDone - aDone;
      return (b.total || 0) - (a.total || 0);
    });

  const best = sorted[0];
  const completed = best[TASK_STATUS.DONE] || 0;
  const total = best.total || 0;
  const completionRate =
    total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

  return {
    user: best.user,
    total,
    completed,
    completionRate,
  };
}
