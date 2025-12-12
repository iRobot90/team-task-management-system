import React, { useEffect, useState } from 'react';
import { tasksAPI } from '../api/tasks';
import { usersAPI } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { USER_ROLES, TASK_STATUS } from '../utils/constants';
import { computeTeamMetrics } from '../utils/teamMetrics';
import {
  Users,
  User as UserIcon,
  Target,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import './Performance.css';

const Performance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const isManagerOrAdmin =
    user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [tasksRes] = await Promise.all([
          tasksAPI.getAll(),
        ]);

        const taskList = Array.isArray(tasksRes.results)
          ? tasksRes.results
          : tasksRes;
        setTasks(taskList || []);

        if (isManagerOrAdmin) {
          const usersRes = await usersAPI.getAll();
          const userList = Array.isArray(usersRes.results)
            ? usersRes.results
            : usersRes;
          setUsers(userList || []);
        }
      } catch (err) {
        console.error('Failed to load performance data', err);
        setError('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isManagerOrAdmin]);

  if (loading) return <Loading message="Loading performance..." />;
  if (error) return <div className="performance-error">{error}</div>;

  if (!user) return null;

  if (isManagerOrAdmin) {
    return <ManagerPerformance tasks={tasks} users={users} />;
  }

  return <MemberPerformance tasks={tasks} currentUser={user} />;
};

const ManagerPerformance = ({ tasks, users }) => {
  const metrics = computeTeamMetrics(tasks, users);
  const {
    statusCounts,
    perUser,
    topPerformer,
    tasksPerMember,
    activeMembers,
    totalTasks,
  } = metrics;

  const completed = statusCounts[TASK_STATUS.DONE] || 0;
  const teamCompletionRate =
    totalTasks > 0 ? ((completed / totalTasks) * 100).toFixed(1) : 0;

  const overdueTasks = tasks.filter(
    (t) =>
      t.deadline &&
      new Date(t.deadline) < new Date() &&
      t.status !== TASK_STATUS.DONE
  ).length;

  const completedTasksForAvg = tasks.filter(
    (t) => t.status === TASK_STATUS.DONE && t.updated_at && t.created_at
  );
  const avgCompletionTime =
    completedTasksForAvg.length > 0
      ? completedTasksForAvg.reduce(
          (acc, t) =>
            acc +
            (new Date(t.updated_at) - new Date(t.created_at)) /
              (1000 * 60 * 60 * 24),
          0
        ) / completedTasksForAvg.length
      : 0;

  const teamUtilization = Object.values(perUser).reduce(
    (acc, member) => acc + (member[TASK_STATUS.IN_PROGRESS] || 0),
    0
  );

  return (
    <div className="performance-page">
      <header className="performance-header">
        <div>
          <h1>Team Performance</h1>
          <p className="performance-subtitle">
            Deep dive into how your team is executing across all tasks.
          </p>
        </div>
      </header>

      <section className="performance-section">
        <h2>
          <BarChart3 size={18} />
          Key Metrics
        </h2>
        <div className="performance-grid">
          <div className="perf-card primary">
            <div className="perf-card-header">
              <Target size={16} />
              <span>Completion Rate</span>
            </div>
            <div className="perf-card-value">{teamCompletionRate}%</div>
            <p className="perf-card-hint">
              {completed} of {totalTasks} tasks completed.
            </p>
          </div>

          <div className="perf-card warning">
            <div className="perf-card-header">
              <AlertCircle size={16} />
              <span>Overdue Tasks</span>
            </div>
            <div className="perf-card-value">{overdueTasks}</div>
            <p className="perf-card-hint">Tasks past their deadline.</p>
          </div>

          <div className="perf-card success">
            <div className="perf-card-header">
              <Clock size={16} />
              <span>Avg. Completion Time</span>
            </div>
            <div className="perf-card-value">{avgCompletionTime.toFixed(1)} d</div>
            <p className="perf-card-hint">Average days from created to completed.</p>
          </div>

          <div className="perf-card info">
            <div className="perf-card-header">
              <Activity size={16} />
              <span>Active Workload</span>
            </div>
            <div className="perf-card-value">{teamUtilization}</div>
            <p className="perf-card-hint">Tasks currently in progress.</p>
          </div>
        </div>
      </section>

      <section className="performance-section">
        <h2>
          <Users size={18} />
          Team Breakdown
        </h2>
        <div className="performance-grid">
          {topPerformer && (
            <div className="perf-card top-performer">
              <div className="perf-card-header">
                <CheckCircle size={16} />
                <span>Top Performer</span>
              </div>
              <div className="perf-card-main">
                <div className="perf-top-name">
                  {topPerformer.user.email ||
                    topPerformer.user.username ||
                    'Team Member'}
                </div>
                <div className="perf-top-stats">
                  <span>{topPerformer.completed} completed</span>
                  <span>{topPerformer.completionRate}% success</span>
                </div>
              </div>
            </div>
          )}

          <div className="perf-card">
            <div className="perf-card-header">
              <Users size={16} />
              <span>Team Overview</span>
            </div>
            <div className="perf-overview-row">
              <span>Members with tasks</span>
              <span className="strong">{activeMembers}</span>
            </div>
            <div className="perf-overview-row">
              <span>Tasks per member</span>
              <span className="strong">{tasksPerMember}</span>
            </div>
            <div className="perf-overview-row">
              <span>Total tasks</span>
              <span className="strong">{totalTasks}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="performance-section">
        <h2>
          <Users size={18} />
          Individual Performance
        </h2>
        <div className="performance-list">
          {Object.values(perUser)
            .sort(
              (a, b) =>
                (b[TASK_STATUS.DONE] || 0) - (a[TASK_STATUS.DONE] || 0)
            )
            .map((entry) => {
              const completedCount = entry[TASK_STATUS.DONE] || 0;
              const inProgressCount = entry[TASK_STATUS.IN_PROGRESS] || 0;
              const total = entry.total || 0;
              const completionPct = total > 0 ? (completedCount / total) * 100 : 0;
              const label =
                entry.user.email || entry.user.username || 'Team Member';

              return (
                <div key={entry.user.id} className="performance-row">
                  <div className="performance-row-main">
                    <div className="performance-row-name">{label}</div>
                    <div className="performance-row-meta">
                      <span>{total} total</span>
                      <span className="done">{completedCount} done</span>
                      <span className="in-progress">{inProgressCount} in progress</span>
                    </div>
                  </div>
                  <div className="performance-row-bar">
                    <div
                      className="performance-row-fill"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
};

const MemberPerformance = ({ tasks, currentUser }) => {
  const myTasks = tasks.filter((t) => {
    const assigneeId =
      t.assignee != null ? t.assignee : t.assignee_detail?.id ?? null;
    return String(assigneeId) === String(currentUser.id);
  });

  const total = myTasks.length;
  const statusCounts = myTasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const completed = statusCounts[TASK_STATUS.DONE] || 0;
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

  const inProgress = statusCounts[TASK_STATUS.IN_PROGRESS] || 0;
  const pending = statusCounts[TASK_STATUS.TODO] || 0;

  const completedTasksForAvg = myTasks.filter(
    (t) => t.status === TASK_STATUS.DONE && t.updated_at && t.created_at
  );
  const avgCompletionTime =
    completedTasksForAvg.length > 0
      ? completedTasksForAvg.reduce(
          (acc, t) =>
            acc +
            (new Date(t.updated_at) - new Date(t.created_at)) /
              (1000 * 60 * 60 * 24),
          0
        ) / completedTasksForAvg.length
      : 0;

  const overdue = myTasks.filter(
    (t) =>
      t.deadline &&
      new Date(t.deadline) < new Date() &&
      t.status !== TASK_STATUS.DONE
  ).length;

  return (
    <div className="performance-page">
      <header className="performance-header">
        <div>
          <h1>My Performance</h1>
          <p className="performance-subtitle">
            See how you are progressing on your assigned tasks.
          </p>
        </div>
      </header>

      <section className="performance-section">
        <h2>
          <BarChart3 size={18} />
          Overview
        </h2>
        <div className="performance-grid">
          <div className="perf-card primary">
            <div className="perf-card-header">
              <CheckCircle size={16} />
              <span>Completion Rate</span>
            </div>
            <div className="perf-card-value">{completionRate}%</div>
            <p className="perf-card-hint">
              {completed} of {total} tasks completed.
            </p>
          </div>

          <div className="perf-card">
            <div className="perf-card-header">
              <UserIcon size={16} />
              <span>My Workload</span>
            </div>
            <div className="perf-overview-row">
              <span>Pending</span>
              <span className="strong">{pending}</span>
            </div>
            <div className="perf-overview-row">
              <span>In Progress</span>
              <span className="strong">{inProgress}</span>
            </div>
            <div className="perf-overview-row">
              <span>Completed</span>
              <span className="strong">{completed}</span>
            </div>
          </div>

          <div className="perf-card warning">
            <div className="perf-card-header">
              <AlertCircle size={16} />
              <span>Overdue Tasks</span>
            </div>
            <div className="perf-card-value">{overdue}</div>
            <p className="perf-card-hint">Tasks past their deadline.</p>
          </div>

          <div className="perf-card success">
            <div className="perf-card-header">
              <Clock size={16} />
              <span>Avg. Completion Time</span>
            </div>
            <div className="perf-card-value">{avgCompletionTime.toFixed(1)} d</div>
            <p className="perf-card-hint">Average days from created to completed.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Performance;
