import React, { useState, useEffect, useCallback } from 'react';
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
  Bell,
  Plus,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Star,
  Briefcase,
  ArrowUp,
  ArrowDown,
  X,
  User,
  Mail,
  Settings,
  Trash2,
  Package,
  MapPin
} from 'lucide-react';
import { tasksAPI, usersAPI, notificationsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import { computeTeamMetrics, computeTopPerformer, getStatusColor, getUserDisplayName } from '../../utils/teamMetrics';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../../utils/constants';
import { storage } from '../../utils/storage';
import '../styles/Dashboard.css';

const ModernDashboard = () => {
  const { user } = useAuth();
  const [wasteReports, setWasteReports] = useState([]);
  const [collections, setCollections] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [pendingCollections, setPendingCollections] = useState([]);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Report creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    waste_type: 'electronics',
    quantity: '',
    location: '',
    preferred_date: '',
    images: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isCollector = user?.role === USER_ROLES.WASTE_COLLECTOR;
  const isCitizen = user?.role === USER_ROLES.CITIZEN;

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = storage.getToken();
      if (!token) {
        setError('Please log in to access the dashboard');
        return;
      }

      // Simulate data for e-waste management
      const mockReports = [
        { id: 1, title: 'Old Computer', status: 'pending', waste_type: 'electronics', location: 'Downtown', created_at: new Date().toISOString() },
        { id: 2, title: 'Broken Phone', status: 'collected', waste_type: 'electronics', location: 'Uptown', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, title: 'Battery Disposal', status: 'pending', waste_type: 'batteries', location: 'Suburb', created_at: new Date(Date.now() - 172800000).toISOString() }
      ];

      setWasteReports(mockReports);
      setRecentReports(mockReports.slice(0, 3));
      setPendingCollections(mockReports.filter(r => r.status === 'pending'));

      // Fetch notifications
      try {
        const notificationsData = await notificationsAPI.getAll();
        setNotifications(notificationsData.results || notificationsData || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setNotifications([]);
      }

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSuccess('');

    // Validation
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.location.trim()) errors.location = 'Location is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const reportData = {
        ...formData,
        reported_by: user.id
      };

      // Simulate API call
      console.log('Creating report:', reportData);
      
      setSuccess('Report created successfully!');
      setFormData({
        title: '',
        description: '',
        waste_type: 'electronics',
        quantity: '',
        location: '',
        preferred_date: '',
        images: []
      });
      setShowCreateModal(false);
      await fetchDashboardData();
    } catch (err) {
      console.error('Report creation error:', err);
      setFormErrors({ general: 'Failed to create report' });
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      setUpdatingId(reportId);
      // Simulate API call
      console.log('Updating report status:', reportId, newStatus);
      await fetchDashboardData();
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const computeMetrics = () => {
    if (wasteReports.length === 0) return null;

    const collected = wasteReports.filter(r => r.status === 'collected').length;
    const pending = wasteReports.filter(r => r.status === 'pending').length;
    const urgent = wasteReports.filter(r => r.priority === 'high').length;

    return {
      total: wasteReports.length,
      collected,
      pending,
      urgent,
      completionRate: wasteReports.length > 0 ? Math.round((collected / wasteReports.length) * 100) : 0
    };
  };

  const metrics = computeMetrics();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="loading-skeleton" style={{ height: '60px', borderRadius: '12px' }} />
        </div>
        <div className="dashboard-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="loading-skeleton" style={{ height: '120px', borderRadius: '12px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <AlertCircle size={48} style={{ color: '#f56565', margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#f56565', marginBottom: '1rem' }}>Error Loading Dashboard</h2>
            <p style={{ color: '#718096', marginBottom: '1rem' }}>{error}</p>
            <button onClick={handleRefresh} className="btn-modern primary">
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">Welcome back, {getUserDisplayName(user)}!</h1>
            <p className="dashboard-subtitle">
              Here's what's happening with e-waste management today
            </p>
          </div>
          <div className="dashboard-actions">
            <button 
              onClick={handleRefresh} 
              className="btn-modern secondary"
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            {isCitizen && (
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="btn-modern primary"
              >
                <Plus size={16} />
                Report Waste
              </button>
            )}
            <div style={{ position: 'relative' }}>
              <Bell size={20} style={{ color: '#718096', cursor: 'pointer' }} />
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </div>
            <div className="user-avatar">
              {getUserDisplayName(user).charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="dashboard-grid">
          <div className="stats-card">
            <div className="stats-card-header">
              <div className="stats-card-icon primary">
                <Target size={24} />
              </div>
              <div>
                <div className="stats-card-title">Total Reports</div>
                <div className="stats-card-value">{metrics.total}</div>
              </div>
            </div>
            <div className="stats-card-change positive">
              <ArrowUp size={14} />
              <span>12% from last month</span>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <div className="stats-card-icon success">
                <CheckCircle size={24} />
              </div>
              <div>
                <div className="stats-card-title">Collected</div>
                <div className="stats-card-value">{metrics.collected}</div>
              </div>
            </div>
            <div className="stats-card-change positive">
              <ArrowUp size={14} />
              <span>{metrics.completionRate}% collection rate</span>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <div className="stats-card-icon warning">
                <Clock size={24} />
              </div>
              <div>
                <div className="stats-card-title">Pending</div>
                <div className="stats-card-value">{metrics.pending}</div>
              </div>
            </div>
            <div className="stats-card-change">
              <Activity size={14} />
              <span>Awaiting collection</span>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <div className="stats-card-icon danger">
                <AlertCircle size={24} />
              </div>
              <div>
                <div className="stats-card-title">Urgent</div>
                <div className="stats-card-value">{metrics.urgent}</div>
              </div>
            </div>
            <div className="stats-card-change negative">
              <ArrowDown size={14} />
              <span>Need immediate attention</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a202c', marginBottom: '1rem' }}>
            Recent Reports
          </h3>
          <div className="recent-tasks">
            {recentReports.length > 0 ? (
              recentReports.map(report => (
                <div key={report.id} className="recent-task-item">
                  <div className="recent-task-header">
                    <div className="recent-task-title">{report.title}</div>
                    <div className={`recent-task-status ${getStatusColor(report.status)}`}>
                      {report.status}
                    </div>
                  </div>
                  <div className="recent-task-meta">
                    <span>{report.waste_type}</span>
                    <span>•</span>
                    <span>{report.location}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-tasks">
                <Package size={48} color="#cbd5e0" />
                <p>No recent reports</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1a202c', marginBottom: '1rem' }}>
            Pending Collections
          </h3>
          <div className="recent-tasks">
            {pendingCollections.length > 0 ? (
              pendingCollections.map(collection => (
                <div key={collection.id} className="recent-task-item urgent">
                  <div className="recent-task-header">
                    <div className="recent-task-title">{collection.title}</div>
                    <div className="recent-task-priority">
                      <AlertCircle size={14} />
                      <span>Urgent</span>
                    </div>
                  </div>
                  <div className="recent-task-meta">
                    <span>{collection.waste_type}</span>
                    <span>•</span>
                    <span>{collection.location}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-tasks">
                <CheckCircle size={48} color="#cbd5e0" />
                <p>No pending collections</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Report E-Waste</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateReport} className="form-modern">
              {formErrors.general && (
                <div className="error-message">{formErrors.general}</div>
              )}
              {success && (
                <div className="success-message">{success}</div>
              )}
              
              <div className="form-group-modern">
                <label htmlFor="title">Item Description</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input-modern"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Old Computer, Broken Phone"
                />
                {formErrors.title && <div style={{ color: '#f56565', fontSize: '0.875rem' }}>{formErrors.title}</div>}
              </div>

              <div className="form-group-modern">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input-modern form-textarea-modern"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the e-waste item and condition"
                />
                {formErrors.description && <div style={{ color: '#f56565', fontSize: '0.875rem' }}>{formErrors.description}</div>}
              </div>

              <div className="form-group-modern">
                <label htmlFor="waste_type">Waste Type</label>
                <select
                  id="waste_type"
                  name="waste_type"
                  className="form-input-modern form-select-modern"
                  value={formData.waste_type}
                  onChange={(e) => setFormData({...formData, waste_type: e.target.value})}
                >
                  <option value="electronics">Electronics</option>
                  <option value="batteries">Batteries</option>
                  <option value="appliances">Appliances</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group-modern">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="form-input-modern"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Pickup location"
                />
                {formErrors.location && <div style={{ color: '#f56565', fontSize: '0.875rem' }}>{formErrors.location}</div>}
              </div>

              <div className="form-group-modern">
                <label htmlFor="preferred_date">Preferred Pickup Date</label>
                <input
                  type="date"
                  id="preferred_date"
                  name="preferred_date"
                  className="form-input-modern"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="btn-modern secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modern primary">
                  <Plus size={16} />
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDashboard;
