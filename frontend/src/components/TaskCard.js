import React, { useState } from 'react';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../utils/constants';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { getStatusColor, getUserDisplayName } from '../utils/teamMetrics';
import './TaskCard.css';

// Helper function for relative time formatting
const getRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TaskCard = ({
  task,
  currentUserId,
  isManagerOrAdmin,
  onStatusChange,
  onEdit,
  onDelete,
  onAssign,
  onComment,
  comments = [],
  commentsOpen = false,
  commentDrafts = {},
  setCommentDrafts,
  onAddComment,
  updatingId,
  users = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localComment, setLocalComment] = useState(commentDrafts[task.id] || '');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  const assignee = task.assignee_detail || task.assignee;
  const creator = task.created_by_detail || task.created_by;

  // Role-based permissions
  const canEdit = isManagerOrAdmin || (assignee && String(assignee?.id) === String(currentUserId));
  const canDelete = isManagerOrAdmin;
  const canUpdateStatus = isManagerOrAdmin || (assignee && String(assignee?.id) === String(currentUserId));
  const canAssign = isManagerOrAdmin;
  const isAssignedToMe = assignee && String(assignee?.id) === String(currentUserId);

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== TASK_STATUS.DONE;
  const isUpdating = updatingId === task.id;

  const getStatusClass = (status) => {
    switch (status) {
      case TASK_STATUS.DONE: return 'status-done';
      case TASK_STATUS.IN_PROGRESS: return 'status-in-progress';
      default: return 'status-todo';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case TASK_STATUS.DONE: return <CheckCircle size={16} />;
      case TASK_STATUS.IN_PROGRESS: return <Clock size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getPriorityClass = () => {
    if (isOverdue) return 'priority-high';
    if (task.status === TASK_STATUS.IN_PROGRESS) return 'priority-medium';
    return 'priority-normal';
  };

  const handleStatusChange = (e) => {
    e.stopPropagation();
    onStatusChange(task.id, e.target.value);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleAssign = (e, userId) => {
    e.stopPropagation();
    onAssign(task.id, userId);
    setShowAssignDropdown(false);
  };

  const toggleComments = (e) => {
    e.stopPropagation();
    onComment(task.id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (localComment.trim()) {
      onAddComment(task.id);
      setLocalComment('');
    }
  };

  const updateCommentDraft = (value) => {
    setLocalComment(value);
    setCommentDrafts(prev => ({ ...prev, [task.id]: value }));
  };

  const formatCommentContent = (content) => {
    if (!content) return '';
    // Handle Python dictionary string representation that crept into DB
    if (typeof content === 'string' && content.startsWith("{'content':") && content.endsWith("}")) {
      try {
        // Simple extraction for the common case
        const inner = content.slice(12, -2); // remove {'content': ' and '}
        // Handle escaped quotes if any (basic)
        return inner.replace(/^'(.*)'$/, '$1');
      } catch (e) {
        return content;
      }
    }
    return content;
  };

  return (
    <div className={`task-card ${getPriorityClass()} ${isExpanded ? 'expanded' : ''} ${isAssignedToMe ? 'assigned-to-me' : ''}`}>
      {/* Card Header */}
      <div className="task-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="task-main-content">
          {/* Title and Status */}
          <div className="task-title-section">
            <div className="task-title-row">
              <h4 className="task-title">{task.title}</h4>
              <div className="task-badges">
                {isOverdue && <span className="overdue-badge">Overdue</span>}
                {isAssignedToMe && <span className="assigned-badge">Assigned to You</span>}
                <span className={`status-badge ${getStatusClass(task.status)}`}>
                  {getStatusIcon(task.status)}
                  {TASK_STATUS_LABELS[task.status] || task.status}
                </span>
              </div>
            </div>

            {/* Description Preview */}
            {task.description && (
              <p className="task-description-preview">
                {task.description.length > 100
                  ? `${task.description.substring(0, 100)}...`
                  : task.description}
              </p>
            )}
          </div>

          {/* Meta Information */}
          <div className="task-meta">
            {task.deadline && (
              <div className={`meta-item ${isOverdue ? 'overdue' : ''}`}>
                <Calendar size={14} />
                <span>
                  {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {isOverdue && <span className="overdue-text"> (Overdue)</span>}
                </span>
              </div>
            )}

            <div className="meta-item">
              <User size={14} />
              <span>
                {assignee
                  ? getUserDisplayName(assignee)
                  : 'Unassigned'
                }
              </span>
            </div>

            {task.created_at && (
              <div className="meta-item">
                <Clock size={14} />
                <span>{getRelativeTime(new Date(task.created_at))}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="task-expand-icon">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="task-details">
          {/* Full Description */}
          <div className="task-description-section">
            <h5>Description</h5>
            <p className="task-description-full">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Detailed Meta Information */}
          <div className="task-meta-grid">
            <div className="meta-grid-item">
              <span className="meta-label">Created:</span>
              <span>{new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {task.updated_at && task.updated_at !== task.created_at && (
              <div className="meta-grid-item">
                <span className="meta-label">Last Updated:</span>
                <span>{new Date(task.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}

            {task.deadline && (
              <div className="meta-grid-item">
                <span className="meta-label">Deadline:</span>
                <span className={isOverdue ? 'overdue' : ''}>
                  {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            <div className="meta-grid-item">
              <span className="meta-label">Created By:</span>
              <span>{creator ? getUserDisplayName(creator) : 'Unknown'}</span>
            </div>

            <div className="meta-grid-item">
              <span className="meta-label">Assigned To:</span>
              <span>{assignee ? getUserDisplayName(assignee) : 'Unassigned'}</span>
            </div>
          </div>

          {/* Actions Section */}
          <div className="task-actions-section">
            {/* Status Update - Available to both members and managers */}
            {canUpdateStatus && (
              <div className="action-group">
                <label className="action-label">Update Status:</label>
                <select
                  value={task.status}
                  onChange={handleStatusChange}
                  disabled={isUpdating}
                  className="status-select"
                >
                  {Object.values(TASK_STATUS).map(status => (
                    <option key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manager/Admin Actions */}
            {isManagerOrAdmin && (
              <div className="manager-actions">
                <div className="action-group">
                  <label className="action-label">Assign Task:</label>
                  <div className="assign-controls">
                    <button
                      className="assign-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAssignDropdown(!showAssignDropdown);
                      }}
                    >
                      <UserPlus size={16} />
                      {assignee ? 'Reassign' : 'Assign'}
                    </button>

                    {showAssignDropdown && (
                      <div className="assign-dropdown">
                        <button
                          onClick={(e) => handleAssign(e, null)}
                          className="assign-option unassign"
                        >
                          <UserMinus size={14} />
                          Unassign
                        </button>
                        {users.map(user => (
                          <button
                            key={user.id}
                            onClick={(e) => handleAssign(e, user.id)}
                            className="assign-option"
                          >
                            <User size={14} />
                            {getUserDisplayName(user)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="action-group">
                  <label className="action-label">Task Management:</label>
                  <div className="task-management-buttons">
                    <button
                      onClick={handleEdit}
                      className="btn btn-edit"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        className="btn btn-delete"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="comments-section">
              <button
                className="comments-toggle"
                onClick={toggleComments}
              >
                <MessageSquare size={16} />
                {commentsOpen ? 'Hide Comments' : 'Show Comments'}
                {comments.length > 0 && <span className="comment-count">({comments.length})</span>}
              </button>

              {commentsOpen && (
                <div className="comments-container">
                  <div className="comments-list">
                    {comments.length === 0 ? (
                      <p className="no-comments">No comments yet</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-header">
                            <span className="comment-author">
                              {comment.author_detail ? getUserDisplayName(comment.author_detail) : 'Unknown'}
                            </span>
                            <span className="comment-time">
                              {getRelativeTime(new Date(comment.created_at))}
                            </span>
                          </div>
                          <div className="comment-content">{formatCommentContent(comment.content)}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleCommentSubmit} className="comment-form">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={localComment}
                      onChange={(e) => updateCommentDraft(e.target.value)}
                      className="comment-input"
                    />
                    <button type="submit" className="comment-submit">
                      Post
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;