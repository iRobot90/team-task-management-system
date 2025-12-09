import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../api/tasks';
import Loading from '../components/Loading';
import { TASK_STATUS_LABELS } from '../utils/constants';
import './Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await tasksAPI.getAll(params);
      setTasks(Array.isArray(data.results) ? data.results : data);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading tasks..." />;
  }

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1>Tasks</h1>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'todo' ? 'active' : ''}
            onClick={() => setFilter('todo')}
          >
            Todo
          </button>
          <button
            className={filter === 'in_progress' ? 'active' : ''}
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </button>
          <button
            className={filter === 'done' ? 'active' : ''}
            onClick={() => setFilter('done')}
          >
            Done
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">No tasks found</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className={`status-badge status-${task.status}`}>
                  {TASK_STATUS_LABELS[task.status] || task.status}
                </span>
              </div>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-meta">
                {task.assignee_detail && (
                  <span>Assigned to: {task.assignee_detail.email}</span>
                )}
                {task.deadline && (
                  <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;

