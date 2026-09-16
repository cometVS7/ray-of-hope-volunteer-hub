'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';
import Modal from '../../../components/Modal';
import { Task, TaskStatus, TaskSubmission } from '../../../types';

export default function VolunteerTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submit Task modal state
  const [submitModalTask, setSubmitModalTask] = useState<Task | null>(null);
  const [actualHours, setActualHours] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Submission details modal state (for viewing review notes/status)
  const [detailSubmission, setDetailSubmission] = useState<TaskSubmission | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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
        '/volunteer/tasks',
        params
      );
      setTasks(res.tasks || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openSubmitModal = (task: Task) => {
    setSubmitError(null);
    setSubmitModalTask(task);
    setActualHours(String(task.expectedHours || ''));
    setCompletionNotes('');
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalTask) return;
    setSubmitError(null);

    const hours = parseFloat(actualHours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setSubmitError('Please enter actual hours between 0.1 and 24.');
      return;
    }
    if (!completionNotes.trim()) {
      setSubmitError('Completion notes are required to document your volunteer work.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/volunteer/tasks/${submitModalTask.id}/submit`, {
        actualHours: hours,
        completionNotes: completionNotes.trim(),
      });

      setSuccessMessage(`Task "${submitModalTask.title}" submitted successfully for admin review!`);
      setSubmitModalTask(null);
      fetchTasks();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSubmission = async (task: Task) => {
    try {
      setIsLoadingDetail(true);
      const sub = await api.get<TaskSubmission>(`/volunteer/tasks/${task.id}/submission`);
      setDetailSubmission(sub);
    } catch (err: any) {
      alert(err.message || 'Could not retrieve submission details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Assigned Tasks</h1>
        <p className="text-xs text-slate-500 mt-1">
          View your assignments, complete and submit tasks, and check feedback from coordinators.
        </p>
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

      {/* Task List Cards */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-sm">
          <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading your tasks...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-600 text-sm bg-white rounded-xl border border-rose-200">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400 text-sm">
          No tasks found matching your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">{task.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                  <span>
                    Expected:{' '}
                    <span className="font-semibold text-slate-700">{task.expectedHours} hrs</span>
                  </span>
                  <span>·</span>
                  <span>
                    Deadline:{' '}
                    <span className="font-semibold text-slate-700">
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </span>
                  <span>·</span>
                  <span>
                    Assigned: {new Date(task.assignmentDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 flex-shrink-0">
                {task.status === 'ASSIGNED' && (
                  <button
                    onClick={() => openSubmitModal(task)}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Done — Send for Review
                  </button>
                )}

                {task.status === 'SUBMITTED' && (
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">
                      Under Review
                    </span>
                    <button
                      onClick={() => handleViewSubmission(task)}
                      className="block text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                    >
                      View Notes
                    </button>
                  </div>
                )}

                {task.status === 'APPROVED' && (
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold">
                      Verified
                    </span>
                    <button
                      onClick={() => handleViewSubmission(task)}
                      className="block text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                    >
                      View Review
                    </button>
                  </div>
                )}

                {task.status === 'REJECTED' && (
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-medium">
                      Needs Revision
                    </span>
                    <button
                      onClick={() => handleViewSubmission(task)}
                      className="block text-xs text-rose-600 hover:text-rose-800 font-medium mt-1"
                    >
                      View Feedback
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
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
      )}

      {/* Modal: Submit Task */}
      <Modal
        isOpen={Boolean(submitModalTask)}
        onClose={() => {
          if (!isSubmitting) setSubmitModalTask(null);
        }}
        title="Submit Completed Task"
      >
        {submitModalTask && (
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {submitError}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Task:</span> {submitModalTask.title}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Expected Hours:</span>{' '}
                {submitModalTask.expectedHours} hrs
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Actual Hours Spent *
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                required
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                placeholder="e.g. 3.5"
              />
              <p className="text-[11px] text-slate-400 mt-1">Between 0.25 and 24 hours.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Completion Notes & Summary of Work *
              </label>
              <textarea
                required
                rows={4}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                placeholder="Describe what was accomplished, number of people served, any issues encountered..."
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSubmitModalTask(null)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: View Submission Details */}
      <Modal
        isOpen={Boolean(detailSubmission)}
        onClose={() => setDetailSubmission(null)}
        title="Task Submission Details"
      >
        {detailSubmission && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-500 uppercase">Review Status</span>
              <StatusBadge status={detailSubmission.reviewStatus} />
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase block mb-1">Submitted On</span>
              <p className="text-slate-800 font-medium">
                {new Date(detailSubmission.submittedAt).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-500 uppercase block text-[10px]">Logged Actual Hours</span>
                <p className="text-base font-bold text-slate-900 mt-1">{detailSubmission.actualHours} hrs</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="font-semibold text-emerald-700 uppercase block text-[10px]">Official Approved Hours</span>
                <p className="text-base font-black text-emerald-700 mt-1">{detailSubmission.approvedHours} hrs</p>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase block mb-1">Your Completion Notes</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap text-slate-800">
                {detailSubmission.completionNotes}
              </div>
            </div>

            {detailSubmission.reviewNotes && (
              <div
                className={`p-3 rounded-lg border ${
                  detailSubmission.reviewStatus === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span className="font-semibold uppercase block mb-1 text-[10px]">Admin Feedback</span>
                <p className="whitespace-pre-wrap">{detailSubmission.reviewNotes}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailSubmission(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
