import React, { useState } from 'react';
import { format, parseISO, isBefore } from 'date-fns';
import { TASK_STATUS, TASK_STATUS_LABELS } from '../utils/constants';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  User,
  Calendar,
} from 'lucide-react';

const TaskCard = ({
  task,
  currentUserId,
  isManagerOrAdmin,
  onStatusChange,
  onEdit,
  onDelete,
  onComment,
  comments = [],
  commentsOpen = false,
  commentDrafts = {},
  setCommentDrafts,
  onAddComment,
  updatingId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localComment, setLocalComment] = useState(commentDrafts[task.id] || '');

  const assignee = task.assignee_detail || task.assignee;
  const creator = task.created_by_detail || task.created_by;

  const canEdit = isManagerOrAdmin || (assignee && String(assignee.id) === String(currentUserId));
  const canDelete = isManagerOrAdmin;
  const canUpdateStatus = isManagerOrAdmin || (assignee && String(assignee.id) === String(currentUserId));
  const isOverdue = task.deadline && isBefore(parseISO(task.deadline), new Date()) && task.status !== TASK_STATUS.DONE;
  const isUpdating = updatingId === task.id;

  const getStatusClass = (status) => {
    switch (status) {
      case TASK_STATUS.DONE: return 'status-done';
      case TASK_STATUS.IN_PROGRESS: return 'status-in-progress';
      default: return 'status-todo';
    }
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
    onDelete(task.id);
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

  return (
    <div className={`task-card ${isExpanded ? 'expanded' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="task-main-info">
          <div className="task-title-section">
            <h4 className="task-title">{task.title}</h4>
            <div className="task-badges">
              {isOverdue && <span className="overdue-badge">Overdue</span>}
              <span className={`status-badge ${getStatusClass(task.status)}`}>
                {TASK_STATUS_LABELS[task.status] || task.status}
              </span>
            </div>
          </div>
          <div className="task-meta">
            {task.deadline && (
              <span className="meta-item">
                <Calendar size={14} />
                {format(parseISO(task.deadline), 'MMM d, yyyy')}
                {task.deadline_time && ` at ${task.deadline_time}`}
              </span>
            )}
            <span className="meta-item">
              <User size={14} />
              <span>
                <span className="label">Assigned To:</span>{' '}
                <span>
                  {assignee
                    ? assignee.name || assignee.email || assignee.username
                    : 'Unassigned'}
                </span>
              </span>
            </span>
            {creator && (
              <span className="meta-item">
                <User size={14} />
                <span>
                  <span className="label">Created By:</span>{' '}
                  <span>
                    {creator.name || creator.email || creator.username}
                  </span>
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="task-actions-header">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div className="task-details">
          <div className="task-description">
            <h5>Description</h5>
            <p>{task.description || 'No description provided.'}</p>
          </div>
          
          <div className="task-meta-details">
            <div>
              <span className="label">Created:</span>
              <span>{format(parseISO(task.created_at), 'MMM d, yyyy')}</span>
            </div>
            {task.updated_at && task.updated_at !== task.created_at && (
              <div>
                <span className="label">Last Updated:</span>
                <span>{format(parseISO(task.updated_at), 'MMM d, yyyy')}</span>
              </div>
            )}
            {assignee && (
              <div>
                <span className="label">Assigned To:</span>
                <span>{assignee.name || assignee.email || assignee.username}</span>
              </div>
            )}
            {creator && (
              <div>
                <span className="label">Created By:</span>
                <span>{creator.name || creator.email || creator.username}</span>
              </div>
            )}
          </div>
          
          <div className="task-actions">
            {canUpdateStatus && (
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
            )}
            
            {isManagerOrAdmin && (
              <div className="manager-actions">
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default TaskCard;