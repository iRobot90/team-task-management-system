import React from 'react';
import { TASK_STATUS_LABELS } from '../utils/constants';

const STATUS_COLORS = {
  todo: 'bg-gray-200 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onToggleComments,
  commentsOpen,
  canManageTasks,
  isMember,
  onAssign,
  onStatusChange,
  updatingId,
  members,
  comments,
  commentDraft,
  onPostComment,
}) => {
  return (
    <article className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{task.description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600 items-center">
            <span className={`inline-flex items-center px-2 py-0.5 rounded ${STATUS_COLORS[task.status] || STATUS_COLORS.todo}`}>
              {TASK_STATUS_LABELS[task.status] || task.status}
            </span>

            {task.assignee_detail && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9 9 0 1118.88 6.196 9 9 0 015.12 17.804z"/></svg>
                <span>Assigned: <strong className="text-gray-800">{task.assignee_detail.email}</strong></span>
              </span>
            )}

            {/* Inline assign for managers/admins */}
            {canManageTasks && (
              <div className="assign-row mt-2">
                <select
                  className="assign-select"
                  value={task.assignee || ''}
                  onChange={(e) => onAssign && onAssign(e.target.value)}
                  disabled={updatingId === task.id}
                >
                  <option value="">Unassigned</option>
                  {(members || []).map((m) => (
                    <option key={m.id} value={m.id}>{m.email}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status select for members (quick update) */}
            {isMember && (
              <div className="status-row mt-2">
                <label className="mr-2">Status</label>
                <select
                  value={task.status}
                  onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
                  disabled={updatingId === task.id}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}

            {task.created_by_detail && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>
                <span>Created by: <strong className="text-gray-800">{task.created_by_detail.email}</strong></span>
              </span>
            )}

            {task.deadline && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>Deadline: <strong className="text-gray-800">{new Date(task.deadline).toLocaleDateString()}</strong></span>
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 ml-2 flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {canManageTasks && (
              <>
                <button
                  onClick={() => onEdit && onEdit(task)}
                  className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete && onDelete()}
                  className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          <div>
            <button
              onClick={() => onToggleComments && onToggleComments()}
              className="text-sm text-gray-600 hover:underline"
            >
              {commentsOpen ? 'Hide comments' : 'View comments'}
            </button>
          </div>
        </div>
      </div>

      {/* comments area */}
      {commentsOpen && (
        <div className="comments-box mt-3">
          {(comments || []).map((c) => (
            <div key={c.id} className="comment">
              <div className="comment-meta">
                <div>{c.author_detail?.email}</div>
                <div className="muted">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <div className="comment-body">{c.content}</div>
            </div>
          ))}
          <div className="comment-input mt-2">
            <input value={commentDraft || ''} onChange={(e) => onPostComment && onPostComment(e.target.value)} placeholder="Add a comment..." />
            <button onClick={() => onPostComment && onPostComment(commentDraft)} className="px-3 py-1 rounded bg-indigo-600 text-white">Post</button>
          </div>
        </div>
      )}
    </article>
  );
};

export default TaskCard;
