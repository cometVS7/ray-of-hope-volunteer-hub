'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';
import Modal from '../../../components/Modal';
import { Task, TaskStatus, User } from '../../../types';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active volunteers for assigning tasks
  const [volunteers, setVolunteers] = useState<User[]>([]);

  // Modal & Form state for creating a task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expectedHours: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    deadline: '',
    assignedToId: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get<{ tasks: Task[]; pagination: { total: number; page: number; totalPages: number } }>(
        '/admin/tasks',
        params
      );
      setTasks(res.tasks || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  const fetchActiveVolunteers = async () => {
    try {
      const res = await api.get<{ volunteers: User[] }>('/admin/volunteers', {
        status: 'ACTIVE',
        limit: '100',
      });
      setVolunteers(res.volunteers || []);
    } catch (err) {
      console.error('Failed to load active volunteers list for dropdown', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchActiveVolunteers();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const hours = parseFloat(formData.expectedHours);
    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    if (isNaN(hours) || hours <= 0) {
      setFormError('Expected hours must be a number greater than 0.');
      return;
    }
    if (!formData.deadline) {
      setFormError('Deadline date is required.');
      return;
    }
    if (!formData.assignedToId) {
      setFormError('Please select a volunteer to assign this task.');
      return;
    }

    try {
      setFormSubmitting(true);
      await api.post<Task>('/admin/tasks', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        expectedHours: hours,
        assignmentDate: new Date(formData.assignmentDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        assignedToId: formData.assignedToId,
      });

      setSuccessMessage('Task created and assigned successfully!');
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        expectedHours: '',
        assignmentDate: new Date().toISOString().split('T')[0],
        deadline: '',
        assignedToId: '',
      });
      fetchTasks();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create task.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create volunteer assignments, set deadlines, and track completion progress.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-xs cursor-pointer"
        >
          <span className="mr-1.5 text-base leading-none">+</span> Create & Assign Task
        </button>
      </div>

      {/* Alert / Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by task title or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading tasks...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            <p className="font-medium">{error}</p>
            <button
              onClick={fetchTasks}
              className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No tasks found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3">Task Title & Details</th>
                  <th className="px-5 py-3">Assigned Volunteer</th>
                  <th className="px-5 py-3 text-center">Expected Hrs</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-semibold text-slate-900 text-sm">{t.title}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{t.description}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{t.assignedTo?.name || 'Unassigned'}</p>
                      <p className="text-indigo-600 font-mono text-[11px]">
                        {t.assignedTo?.volunteerId || t.assignedTo?.email || ''}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                      {t.expectedHours}h
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700">
                        Due: <span className="font-medium">{new Date(t.deadline).toLocaleDateString()}</span>
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Start: {new Date(t.assignmentDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total: <span className="font-semibold text-slate-700">{total}</span> tasks
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="font-medium text-slate-700">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Task */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!formSubmitting) setIsModalOpen(false);
        }}
        title="Create & Assign Volunteer Task"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              placeholder="e.g. Swargate Food Packet Distribution"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Instructions *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              placeholder="e.g. Coordinate with on-site coordinator to pack and distribute 250 meal boxes..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Expected Hours *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={formData.expectedHours}
                onChange={(e) => setFormData({ ...formData, expectedHours: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                placeholder="4.0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assign To Volunteer *
              </label>
              <select
                required
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 bg-white"
              >
                <option value="">-- Select Active Volunteer --</option>
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.volunteerId || v.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assignment Date *
              </label>
              <input
                type="date"
                required
                value={formData.assignmentDate}
                onChange={(e) => setFormData({ ...formData, assignmentDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deadline *
              </label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={formSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              {formSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
