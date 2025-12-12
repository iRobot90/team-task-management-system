import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  BarChart3,
  Target,
  Award,
  Filter,
  Download,
  RefreshCw,
  User,
  Briefcase,
  Zap,
  Activity
} from 'lucide-react';
import { tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { getStatusColor, getUserDisplayName } from '../utils/teamMetrics';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../utils/constants';
import './MyPerformance.css';

const MyPerformance = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user's tasks
      const response = await tasksAPI.getAll();
      const tasksData = response.results || response;

      // Filter tasks assigned to current user
      const userTasks = tasksData.filter(task => task.assignee === user.id);

      // Filter tasks based on date range
      const filteredTasks = filterTasksByDateRange(userTasks, dateRange);
      
      setTasks(filteredTasks);
    } catch (err) {
      setError('Failed to fetch performance data');
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTasksByDateRange = (tasks, days) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    return tasks.filter(task => new Date(task.created_at) >= cutoffDate);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPerformanceData();
    setRefreshing(false);
  };

  const handleExport = () => {
    const csvContent = generatePerformanceCSV();
    downloadCSV(csvContent, 'my-performance.csv');
  };

  const generatePerformanceCSV = () => {
    const headers = ['Task Title', 'Status', 'Created Date', 'Due Date', 'Completed Date'];
    const rows = tasks.map(task => [
      task.title,
      TASK_STATUS_LABELS[task.status] || task.status,
      new Date(task.created_at).toLocaleDateString(),
      task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline',
      task.status === TASK_STATUS.DONE && task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'Not completed'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate performance metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === TASK_STATUS.DONE).length;
  const inProgressTasks = tasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS).length;
  const todoTasks = tasks.filter(task => task.status === TASK_STATUS.TODO).length;
  const overdueTasks = tasks.filter(task => 
    task.deadline && 
    new Date(task.deadline) < new Date() && 
    task.status !== TASK_STATUS.DONE
  ).length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Calculate average completion time for completed tasks
  const completedTasksWithTime = tasks.filter(task => 
    task.status === TASK_STATUS.DONE && task.created_at && task.updated_at
  );
  const avgCompletionTime = completedTasksWithTime.length > 0 
    ? completedTasksWithTime.reduce((sum, task) => {
        const created = new Date(task.created_at);
        const completed = new Date(task.updated_at);
        return sum + (completed - created) / (1000 * 60 * 60 * 24); // Convert to days
      }, 0) / completedTasksWithTime.length
    : 0;

  // Performance level
  const performanceLevel = completionRate >= 80 ? 'excellent' : 
                           completionRate >= 60 ? 'good' : 
                           completionRate >= 40 ? 'average' : 'needs-improvement';

  if (loading) {
    return (
      <div className="my-performance-page">
        <div className="loading-state">
          <RefreshCw className="spinning" size={32} />
          <p>Loading your performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-performance-page">
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button onClick={fetchPerformanceData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-performance-page">
      {/* Header */}
      <div className="performance-header">
        <div className="header-content">
          <div>
            <h1>My Performance</h1>
            <p className="header-subtitle">
              Track your personal productivity and task completion metrics
            </p>
          </div>
          
          <div className="header-actions">
            <div className="date-filter">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="filter-select"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            <button 
              onClick={handleRefresh} 
              className="btn btn-secondary"
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            
            <button onClick={handleExport} className="btn btn-outline">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Personal Stats Overview */}
      <div className="personal-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Tasks</h3>
            <p className="stat-value">{totalTasks}</p>
            <span className="stat-label">Assigned to you</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Completed</h3>
            <p className="stat-value">{completedTasks}</p>
            <span className="stat-label">{completionRate.toFixed(1)}% completion rate</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>In Progress</h3>
            <p className="stat-value">{inProgressTasks}</p>
            <span className="stat-label">Currently working on</span>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Overdue</h3>
            <p className="stat-value">{overdueTasks}</p>
            <span className="stat-label">Need attention</span>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="performance-summary">
        <div className="summary-header">
          <Award size={20} />
          <h2>Performance Summary</h2>
        </div>
        
        <div className="summary-content">
          <div className="summary-card">
            <div className="summary-avatar">
              {user?.first_name ? 
                user.first_name.charAt(0).toUpperCase() : 
                user?.username?.charAt(0).toUpperCase() || '?'
              }
            </div>
            <div className="summary-info">
              <h3>{getUserDisplayName(user)}</h3>
              <p className="summary-role">{user?.role}</p>
              <div className="performance-badge">
                <Zap size={12} />
                {performanceLevel.replace('-', ' ').charAt(0).toUpperCase() + 
                 performanceLevel.replace('-', ' ').slice(1)} Performance
              </div>
            </div>
            <div className="summary-metrics">
              <div className="metric">
                <span className="metric-value">{completionRate.toFixed(1)}%</span>
                <span className="metric-label">Completion Rate</span>
              </div>
              <div className="metric">
                <span className="metric-value">{avgCompletionTime.toFixed(1)}</span>
                <span className="metric-label">Avg Days/Task</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="task-breakdown">
        <div className="breakdown-header">
          <BarChart3 size={20} />
          <h2>Task Breakdown</h2>
        </div>
        
        <div className="breakdown-content">
          <div className="status-breakdown">
            <div className="status-item">
              <div className="status-indicator completed"></div>
              <span className="status-label">Completed</span>
              <span className="status-count">{completedTasks}</span>
              <span className="status-percentage">{completionRate.toFixed(1)}%</span>
            </div>
            
            <div className="status-item">
              <div className="status-indicator in-progress"></div>
              <span className="status-label">In Progress</span>
              <span className="status-count">{inProgressTasks}</span>
              <span className="status-percentage">
                {totalTasks > 0 ? ((inProgressTasks / totalTasks) * 100).toFixed(1) : 0}%
              </span>
            </div>
            
            <div className="status-item">
              <div className="status-indicator todo"></div>
              <span className="status-label">To Do</span>
              <span className="status-count">{todoTasks}</span>
              <span className="status-percentage">
                {totalTasks > 0 ? ((todoTasks / totalTasks) * 100).toFixed(1) : 0}%
              </span>
            </div>
            
            {overdueTasks > 0 && (
              <div className="status-item">
                <div className="status-indicator overdue"></div>
                <span className="status-label">Overdue</span>
                <span className="status-count">{overdueTasks}</span>
                <span className="status-percentage">
                  {totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(1) : 0}%
                </span>
              </div>
            )}
          </div>
          
          <div className="progress-visualization">
            <div className="progress-bar-container">
              <div 
                className="progress-segment completed" 
                style={{ width: `${completionRate}%` }}
              ></div>
              <div 
                className="progress-segment in-progress" 
                style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }}
              ></div>
              <div 
                className="progress-segment todo" 
                style={{ width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="progress-legend">
              <span className="legend-item">
                <span className="legend-color completed"></span>
                Completed
              </span>
              <span className="legend-item">
                <span className="legend-color in-progress"></span>
                In Progress
              </span>
              <span className="legend-item">
                <span className="legend-color todo"></span>
                To Do
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-header">
          <Activity size={20} />
          <h2>Recent Activity</h2>
        </div>
        
        <div className="activity-list">
          {tasks.length === 0 ? (
            <div className="no-activity">
              <Briefcase size={32} />
              <p>No tasks found in the selected time period</p>
            </div>
          ) : (
            tasks.slice(0, 10).map(task => (
              <div key={task.id} className="activity-item">
                <div className={`activity-status ${task.status}`}></div>
                <div className="activity-content">
                  <h4>{task.title}</h4>
                  <p className="activity-meta">
                    Created {new Date(task.created_at).toLocaleDateString()}
                    {task.deadline && ` • Due ${new Date(task.deadline).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`activity-badge ${task.status}`}>
                  {TASK_STATUS_LABELS[task.status] || task.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="performance-insights">
        <div className="insights-header">
          <TrendingUp size={20} />
          <h2>Performance Insights</h2>
        </div>
        
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <Target size={20} />
            </div>
            <div className="insight-content">
              <h3>Task Efficiency</h3>
              <p>You complete tasks in {avgCompletionTime.toFixed(1)} days on average</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <CheckCircle size={20} />
            </div>
            <div className="insight-content">
              <h3>Completion Rate</h3>
              <p>Your completion rate is {completionRate.toFixed(1)}%, which is {performanceLevel}</p>
            </div>
          </div>

          {overdueTasks > 0 && (
            <div className="insight-card warning">
              <div className="insight-icon">
                <AlertCircle size={20} />
              </div>
              <div className="insight-content">
                <h3>Attention Needed</h3>
                <p>You have {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''} that need attention</p>
              </div>
            </div>
          )}

          <div className="insight-card">
            <div className="insight-icon">
              <Calendar size={20} />
            </div>
            <div className="insight-content">
              <h3>Workload</h3>
              <p>Currently managing {inProgressTasks} active task{inProgressTasks !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPerformance;
