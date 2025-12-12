import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Filter,
  Download,
  RefreshCw,
  User,
  Briefcase,
  Star,
  Zap,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  TrendingDown,
  CalendarDays,
  FileText,
  Eye
} from 'lucide-react';
import { tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import { computeTeamMetrics, computeTopPerformer, getStatusColor, getUserDisplayName } from '../utils/teamMetrics';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../utils/constants';
import './TeamPerformance.css';

const TeamPerformance = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedUser, setSelectedUser] = useState('all');
  const [metrics, setMetrics] = useState(null);
  const [topPerformer, setTopPerformer] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);

  const isManager = user?.role === USER_ROLES.MANAGER || user?.role === USER_ROLES.ADMIN;

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange, selectedUser]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all data in parallel
      const [tasksResponse, usersResponse] = await Promise.all([
        tasksAPI.getAll(),
        usersAPI.getAll()
      ]);

      const tasksData = tasksResponse.results || tasksResponse;
      const usersData = usersResponse.results || usersResponse;

      // Filter users to show only members (exclude managers and admins)
      const memberUsers = usersData.filter(user => 
        user.role === USER_ROLES.MEMBER || 
        user.role === 'member' || 
        user.role === 'Member'
      );

      // Filter tasks based on date range
      const filteredTasks = filterTasksByDateRange(tasksData, dateRange);
      
      // Filter by selected user if specified
      const finalTasks = selectedUser === 'all' 
        ? filteredTasks 
        : filteredTasks.filter(task => task.assignee === parseInt(selectedUser));

      setTasks(finalTasks);
      setUsers(memberUsers);
      
      // Calculate comprehensive metrics
      const teamMetrics = computeTeamMetrics(finalTasks, memberUsers);
      setMetrics(teamMetrics);
      
      // Calculate top performer
      const topPerf = computeTopPerformer(teamMetrics.perUser);
      setTopPerformer(topPerf);
      
      // Generate performance data for charts
      const perfData = generatePerformanceData(finalTasks, memberUsers);
      setPerformanceData(perfData);
      
    } catch (err) {
      setError('Failed to load performance data');
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

  const generatePerformanceData = (tasks, users) => {
    return users.map(user => {
      const userTasks = tasks.filter(task => task.assignee === user.id);
      const completedTasks = userTasks.filter(task => task.status === TASK_STATUS.DONE);
      const inProgressTasks = userTasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS);
      const todoTasks = userTasks.filter(task => task.status === TASK_STATUS.TODO);
      
      const completionRate = userTasks.length > 0 
        ? Math.round((completedTasks.length / userTasks.length) * 100)
        : 0;
      
      return {
        user,
        totalTasks: userTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        todoTasks: todoTasks.length,
        completionRate,
        avgCompletionTime: calculateAvgCompletionTime(completedTasks)
      };
    }).filter(data => data.totalTasks > 0);
  };

  const calculateAvgCompletionTime = (completedTasks) => {
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((sum, task) => {
      if (task.completed_at) {
        const created = new Date(task.created_at);
        const completed = new Date(task.completed_at);
        return sum + (completed - created);
      }
      return sum;
    }, 0);
    
    return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60)); // hours
  };
      const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPerformanceData();
    setRefreshing(false);
  };

  const handleExport = () => {
    const metrics = computeTeamMetrics(tasks, users);
    const csvContent = generatePerformanceCSV(metrics, users);
    downloadCSV(csvContent, 'team-performance.csv');
  };

  const generatePerformanceCSV = (metrics, users) => {
    const headers = ['User', 'Total Tasks', 'Completed', 'In Progress', 'To Do', 'Completion Rate', 'Avg Completion Time'];
    const rows = users.map(user => {
      const userMetrics = metrics.member_stats[user.id] || {};
      return [
        getUserDisplayName(user),
        userMetrics.total || 0,
        userMetrics.completed || 0,
        userMetrics.in_progress || 0,
        userMetrics.todo || 0,
        `${(userMetrics.completion_rate || 0).toFixed(1)}%`,
        `${(userMetrics.avg_completion_time || 0).toFixed(1)} days`
      ];
    });

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

  if (loading) {
    return (
      <div className="performance-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-page">
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
    <div className="performance-page enhanced">
      {/* Modern Header */}
      <div className="performance-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">Team Performance Analytics</h1>
            <p className="page-subtitle">
              Comprehensive insights into team productivity and individual performance metrics
            </p>
          </div>
          
          <div className="header-right">
            <div className="filter-controls">
              <div className="date-filter">
                <label className="filter-label">Time Range</label>
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="modern-select"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              
              <div className="user-filter">
                <label className="filter-label">Team Member</label>
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="modern-select"
                >
                  <option value="all">All Members</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {getUserDisplayName(user)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={handleRefresh}
                className="btn btn-secondary modern"
                disabled={refreshing}
              >
                <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
                Refresh
              </button>
              <button 
                onClick={handleExport}
                className="btn btn-primary modern"
              >
                <Download size={16} />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="metrics-overview">
        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-header">
              <div className="metric-icon">
                <Target size={24} />
              </div>
              <div className="metric-info">
                <h3>{metrics?.totalTasks || 0}</h3>
                <p>Total Tasks</p>
              </div>
            </div>
            <div className="metric-trend">
              <ArrowUp size={16} />
              <span>+12% from last period</span>
            </div>
            <Target size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Tasks</h3>
            <p className="metric-value">{metrics.total}</p>
            <span className="metric-label">Active tasks</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <CheckCircle size={24} />
          </div>
          <div className="metric-content">
            <h3>Completed</h3>
            <p className="metric-value">{metrics.completed}</p>
            <span className="metric-label">{metrics.completion_rate.toFixed(1)}% completion rate</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <h3>In Progress</h3>
            <p className="metric-value">{metrics.in_progress}</p>
            <span className="metric-label">Being worked on</span>
          </div>
        </div>

        <div className="metric-card danger">
          <div className="metric-icon">
            <AlertCircle size={24} />
          </div>
          <div className="metric-content">
            <h3>Overdue</h3>
            <p className="metric-value">{metrics.overdue}</p>
            <span className="metric-label">Need attention</span>
          </div>
        </div>
      </div>

      {/* Top Performer */}
      {topPerformer && (
        <div className="top-performer-section">
          <div className="section-header">
            <Award size={20} />
            <h2>Top Performer</h2>
          </div>
          <div className="top-performer-card">
            <div className="performer-avatar">
              {topPerformer.user.first_name ? 
                topPerformer.user.first_name.charAt(0).toUpperCase() : 
                topPerformer.user.username.charAt(0).toUpperCase()
              }
            </div>
            <div className="performer-info">
              <h3>{getUserDisplayName(topPerformer.user)}</h3>
              <p className="performer-role">{topPerformer.user.role}</p>
              <div className="performer-stats">
                <span className="stat">
                  <CheckCircle size={14} />
                  {topPerformer.completed_tasks} completed
                </span>
                <span className="stat">
                  <TrendingUp size={14} />
                  {topPerformer.completion_rate.toFixed(1)}% rate
                </span>
              </div>
            </div>
            <div className="performer-badge">
              <Star size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Table */}
      <div className="team-performance-section">
        <div className="section-header">
          <Users size={20} />
          <h2>Member Performance</h2>
        </div>
        
        <div className="performance-table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Total Tasks</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>To Do</th>
                <th>Completion Rate</th>
                <th>Avg Time</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const userMetrics = metrics.member_stats[user.id] || {};
                const completionRate = userMetrics.completion_rate || 0;
                const performanceLevel = completionRate >= 80 ? 'excellent' : 
                                       completionRate >= 60 ? 'good' : 
                                       completionRate >= 40 ? 'average' : 'needs-improvement';
                
                return (
                  <tr key={user.id}>
                    <td className="user-cell">
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.first_name ? 
                            user.first_name.charAt(0).toUpperCase() : 
                            user.username.charAt(0).toUpperCase()
                          }
                        </div>
                        <div>
                          <div className="user-name">{getUserDisplayName(user)}</div>
                          <div className="user-role">{user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>{userMetrics.total || 0}</td>
                    <td className="completed-cell">{userMetrics.completed || 0}</td>
                    <td className="progress-cell">{userMetrics.in_progress || 0}</td>
                    <td className="todo-cell">{userMetrics.todo || 0}</td>
                    <td>
                      <div className="rate-cell">
                        <span>{completionRate.toFixed(1)}%</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>{(userMetrics.avg_completion_time || 0).toFixed(1)} days</td>
                    <td>
                      <span className={`performance-badge ${performanceLevel}`}>
                        {performanceLevel === 'excellent' && <Zap size={12} />}
                        {performanceLevel.replace('-', ' ').charAt(0).toUpperCase() + 
                         performanceLevel.replace('-', ' ').slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="insights-section">
        <div className="section-header">
          <BarChart3 size={20} />
          <h2>Productivity Insights</h2>
        </div>
        
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <TrendingUp size={20} />
            </div>
            <div className="insight-content">
              <h3>Team Efficiency</h3>
              <p>The team completes {metrics.avg_completion_time.toFixed(1)} days per task on average</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <Activity size={20} />
            </div>
            <div className="insight-content">
              <h3>Workload Distribution</h3>
              <p>{metrics.unassigned_tasks} tasks are currently unassigned and need attention</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <Calendar size={20} />
            </div>
            <div className="insight-content">
              <h3>Deadline Performance</h3>
              <p>{((metrics.completed / metrics.total) * 100).toFixed(1)}% of tasks are completed on time</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <Briefcase size={20} />
            </div>
            <div className="insight-content">
              <h3>Team Capacity</h3>
              <p>{users.length} team members handling {metrics.total} active tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformance;
