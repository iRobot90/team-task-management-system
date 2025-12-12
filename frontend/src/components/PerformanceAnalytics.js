import React from 'react';
import { Trophy, Users, TrendingUp, AlertCircle, CheckCircle, Clock, UserMinus } from 'lucide-react';
import { computeTeamMetrics, computeTopPerformer, getStatusColor, getUserDisplayName } from '../utils/teamMetrics';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../utils/constants';
import './PerformanceAnalytics.css';

const PerformanceAnalytics = ({ tasks = [], users = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="performance-analytics loading">
        <div className="loading-spinner"></div>
        <p>Loading performance analytics...</p>
      </div>
    );
  }

  const metrics = computeTeamMetrics(tasks, users);
  const topPerformer = computeTopPerformer(metrics.perUser);

  const getStatusIcon = (status) => {
    switch (status) {
      case TASK_STATUS.DONE: return <CheckCircle size={16} />;
      case TASK_STATUS.IN_PROGRESS: return <Clock size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getCompletionRateColor = (rate) => {
    if (rate >= 80) return '#10B981'; // green
    if (rate >= 60) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  return (
    <div className="performance-analytics">
      {/* Header */}
      <div className="analytics-header">
        <h2>Team Performance Analytics</h2>
        <p className="analytics-subtitle">
          Real-time insights into team productivity and task completion
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {/* Total Tasks */}
        <div className="metric-card">
          <div className="metric-icon">
            <CheckCircle size={24} color={getStatusColor(TASK_STATUS.DONE)} />
          </div>
          <div className="metric-content">
            <h3>{metrics.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} color={getCompletionRateColor(metrics.completionRate)} />
          </div>
          <div className="metric-content">
            <h3 style={{ color: getCompletionRateColor(metrics.completionRate) }}>
              {metrics.completionRate}%
            </h3>
            <p>Completion Rate</p>
          </div>
        </div>

        {/* Active Members */}
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={24} color="#3B82F6" />
          </div>
          <div className="metric-content">
            <h3>{metrics.activeMembers}</h3>
            <p>Active Members</p>
          </div>
        </div>

        {/* Tasks Per Member */}
        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} color="#8B5CF6" />
          </div>
          <div className="metric-content">
            <h3>{metrics.tasksPerMember}</h3>
            <p>Avg Tasks/Member</p>
          </div>
        </div>
      </div>

      {/* Top Performer Section */}
      <div className="top-performer-section">
        <h3>
          <Trophy size={20} />
          Top Performer
        </h3>
        {topPerformer ? (
          <div className="top-performer-card">
            <div className="performer-info">
              <div className="performer-avatar">
                <UserMinus size={32} />
              </div>
              <div className="performer-details">
                <h4>{getUserDisplayName(topPerformer.user)}</h4>
                <p className="performer-role">{topPerformer.user.role}</p>
              </div>
            </div>
            <div className="performer-stats">
              <div className="stat-item">
                <span className="stat-value">{topPerformer.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{topPerformer.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item">
                <span className="stat-value" style={{ color: getCompletionRateColor(topPerformer.completionRate) }}>
                  {topPerformer.completionRate}%
                </span>
                <span className="stat-label">Rate</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-performer">
            <AlertCircle size={20} />
            <p>No completed tasks yet. Top performer will appear here once tasks are completed.</p>
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="status-breakdown">
        <h3>Task Status Breakdown</h3>
        <div className="status-grid">
          {Object.entries(metrics.statusCounts).map(([status, count]) => (
            <div key={status} className="status-item">
              <div className="status-icon" style={{ color: getStatusColor(status) }}>
                {getStatusIcon(status)}
              </div>
              <div className="status-info">
                <span className="status-count">{count}</span>
                <span className="status-label">{TASK_STATUS_LABELS[status]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Member Performance */}
      <div className="team-performance">
        <h3>Team Member Performance</h3>
        <div className="member-grid">
          {Object.values(metrics.perUser).map(userMetric => (
            <div key={userMetric.user.id} className="member-card">
              <div className="member-header">
                <div className="member-avatar">
                  <UserMinus size={24} />
                </div>
                <div className="member-info">
                  <h4>{getUserDisplayName(userMetric.user)}</h4>
                  <p className="member-role">{userMetric.user.role}</p>
                </div>
              </div>
              
              <div className="member-stats">
                <div className="member-stat">
                  <span className="stat-number">{userMetric.total}</span>
                  <span className="stat-text">Total</span>
                </div>
                <div className="member-stat">
                  <span className="stat-number" style={{ color: getStatusColor(TASK_STATUS.DONE) }}>
                    {userMetric[TASK_STATUS.DONE]}
                  </span>
                  <span className="stat-text">Done</span>
                </div>
                <div className="member-stat">
                  <span className="stat-number" style={{ color: getStatusColor(TASK_STATUS.IN_PROGRESS) }}>
                    {userMetric[TASK_STATUS.IN_PROGRESS]}
                  </span>
                  <span className="stat-text">In Progress</span>
                </div>
                <div className="member-stat">
                  <span className="stat-number" style={{ color: getStatusColor(TASK_STATUS.TODO) }}>
                    {userMetric[TASK_STATUS.TODO]}
                  </span>
                  <span className="stat-text">To Do</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress-fill done"
                    style={{ 
                      width: `${userMetric.total > 0 ? (userMetric[TASK_STATUS.DONE] / userMetric.total) * 100 : 0}%` 
                    }}
                  />
                  <div 
                    className="progress-fill in-progress"
                    style={{ 
                      width: `${userMetric.total > 0 ? (userMetric[TASK_STATUS.IN_PROGRESS] / userMetric.total) * 100 : 0}%` 
                    }}
                  />
                  <div 
                    className="progress-fill todo"
                    style={{ 
                      width: `${userMetric.total > 0 ? (userMetric[TASK_STATUS.TODO] / userMetric.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="progress-labels">
                  <span className="progress-label done">
                    {userMetric.total > 0 ? Math.round((userMetric[TASK_STATUS.DONE] / userMetric.total) * 100) : 0}%
                  </span>
                  <span className="completion-rate">
                    {userMetric.total > 0 ? Math.round(((userMetric[TASK_STATUS.DONE] + userMetric[TASK_STATUS.IN_PROGRESS]) / userMetric.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unassigned Tasks */}
      {metrics.unassigned.total > 0 && (
        <div className="unassigned-tasks">
          <h3>
            <UserMinus size={20} />
            Unassigned Tasks
          </h3>
          <div className="unassigned-stats">
            <div className="unassigned-summary">
              <span className="unassigned-total">{metrics.unassigned.total}</span>
              <span className="unassigned-label">Unassigned Tasks</span>
            </div>
            <div className="unassigned-breakdown">
              {Object.entries(metrics.unassigned).map(([status, count]) => {
                if (status === 'total') return null;
                return (
                  <div key={status} className="unassigned-item">
                    <span className="unassigned-count">{count}</span>
                    <span className="unassigned-status">{TASK_STATUS_LABELS[status]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="performance-insights">
        <h3>Performance Insights</h3>
        <div className="insights-grid">
          {metrics.overdueTasks > 0 && (
            <div className="insight-card warning">
              <AlertCircle size={20} color="#EF4444" />
              <div className="insight-content">
                <h4>Overdue Tasks</h4>
                <p>{metrics.overdueTasks} tasks are overdue and need attention</p>
              </div>
            </div>
          )}
          
          {metrics.completionRate >= 80 && (
            <div className="insight-card success">
              <TrendingUp size={20} color="#10B981" />
              <div className="insight-content">
                <h4>Excellent Performance</h4>
                <p>Team completion rate of {metrics.completionRate}% is outstanding</p>
              </div>
            </div>
          )}
          
          {metrics.completionRate < 50 && (
            <div className="insight-card warning">
              <AlertCircle size={20} color="#F59E0B" />
              <div className="insight-content">
                <h4>Needs Improvement</h4>
                <p>Completion rate of {metrics.completionRate}% is below target</p>
              </div>
            </div>
          )}

          {metrics.unassigned.total > metrics.totalTasks * 0.2 && (
            <div className="insight-card info">
              <UserMinus size={20} color="#3B82F6" />
              <div className="insight-content">
                <h4>High Unassigned Rate</h4>
                <p>{Math.round((metrics.unassigned.total / metrics.totalTasks) * 100)}% of tasks are unassigned</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
