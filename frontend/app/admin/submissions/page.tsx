'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';
import Modal from '../../../components/Modal';
import { TaskSubmission, ReviewStatus } from '../../../types';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [approveModalSubmission, setApproveModalSubmission] = useState<TaskSubmission | null>(null);
  const [rejectModalSubmission, setRejectModalSubmission] = useState<TaskSubmission | null>(null);

  // Form states
  const [approvedHours, setApprovedHours] = useState<string>('');
  const [approveNotes, setApproveNotes] = useState<string>('');
  const [rejectNotes, setRejectNotes] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (statusFilter !== 'ALL') params.reviewStatus = statusFilter;

      const res = await api.get<{
        submissions: TaskSubmission[];
        pagination: { total: number; page: number; totalPages: number };
      }>('/admin/submissions', params);
      setSubmissions(res.submissions || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load task submissions.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const openApproveModal = (sub: TaskSubmission) => {
    setActionError(null);
    setApproveModalSubmission(sub);
    setApprovedHours(String(sub.actualHours));
    setApproveNotes('');
  };

  const openRejectModal = (sub: TaskSubmission) => {
    setActionError(null);
    setRejectModalSubmission(sub);
    setRejectNotes('');
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalSubmission) return;
    setActionError(null);

    const hours = parseFloat(approvedHours);
    if (isNaN(hours) || hours <= 0) {
      setActionError('Approved hours must be a number greater than 0.');
      return;
    }
    if (hours > approveModalSubmission.actualHours) {
      setActionError(
        `Approved hours cannot exceed logged actual hours (${approveModalSubmission.actualHours} hrs).`
      );
      return;
    }

    try {
      setSubmittingAction(true);
      await api.patch(`/admin/submissions/${approveModalSubmission.id}/approve`, {
        approvedHours: hours,
        reviewNotes: approveNotes.trim() || undefined,
      });

      setSuccessMessage(
        `Submission for "${approveModalSubmission.task?.title}" approved with ${hours} official service hours!`
      );
      setApproveModalSubmission(null);
      fetchSubmissions();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve submission.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalSubmission) return;
    setActionError(null);

    if (!rejectNotes.trim()) {
      setActionError('Rejection notes/feedback are required so the volunteer can make corrections.');
      return;
    }

    try {
      setSubmittingAction(true);
      await api.patch(`/admin/submissions/${rejectModalSubmission.id}/reject`, {
        reviewNotes: rejectNotes.trim(),
      });

      setSuccessMessage(
        `Submission for "${rejectModalSubmission.task?.title}" has been rejected. Feedback recorded.`
      );
      setRejectModalSubmission(null);
      fetchSubmissions();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject submission.');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Submissions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review completed volunteer tasks, evaluate logged hours, and officially verify service hours.
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

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
              statusFilter === st
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-sm">
          <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading submissions...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-600 text-sm bg-white rounded-xl border border-rose-200">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchSubmissions}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400 text-sm">
          No submissions found for the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className={`bg-white rounded-xl border shadow-xs p-5 transition ${
                sub.reviewStatus === 'PENDING'
                  ? 'border-amber-300 border-l-4 border-l-amber-500 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-slate-900">
                      {sub.task?.title || 'Untitled Task'}
                    </h3>
                    <StatusBadge status={sub.reviewStatus} />
                    {sub.reviewStatus === 'PENDING' && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        Action Required
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    Submitted by:{' '}
                    <span className="font-semibold text-slate-700">{sub.volunteer?.name || 'Unknown'}</span>{' '}
                    ({sub.volunteer?.volunteerId || 'No ID'}) ·{' '}
                    <span>{new Date(sub.submittedAt).toLocaleString()}</span>
                  </p>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 mt-2">
                    <span className="font-semibold text-slate-900 block mb-1">Volunteer Completion Notes:</span>
                    <p className="whitespace-pre-wrap">{sub.completionNotes}</p>
                  </div>

                  {sub.reviewNotes && (
                    <div
                      className={`p-3 rounded-lg border text-xs mt-2 ${
                        sub.reviewStatus === 'APPROVED'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                          : 'bg-rose-50 border-rose-100 text-rose-900'
                      }`}
                    >
                      <span className="font-semibold block mb-1">
                        {sub.reviewStatus === 'APPROVED' ? 'Admin Approval Note:' : 'Rejection Reason:'}
                      </span>
                      <p className="whitespace-pre-wrap">{sub.reviewNotes}</p>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-start gap-3 flex-shrink-0 md:min-w-[150px] text-right">
                  <div className="space-y-1">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-[11px] text-slate-400 uppercase font-medium">Expected:</span>
                      <span className="text-sm font-semibold text-slate-600">{sub.task?.expectedHours || 0}h</span>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-[11px] text-slate-500 uppercase font-bold">Logged:</span>
                      <span className="text-lg font-bold text-slate-900">{sub.actualHours} hrs</span>
                    </div>
                  </div>

                  {sub.reviewStatus === 'APPROVED' && (
                    <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block uppercase font-bold tracking-wider">
                        Official Hours
                      </span>
                      <span className="text-xl font-black text-emerald-700">+{sub.approvedHours} hrs</span>
                    </div>
                  )}

                  {sub.reviewStatus === 'PENDING' && (
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => openApproveModal(sub)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(sub)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total: <span className="font-semibold text-slate-700">{total}</span> submissions
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

      {/* Modal: Approve Submission */}
      <Modal
        isOpen={Boolean(approveModalSubmission)}
        onClose={() => {
          if (!submittingAction) setApproveModalSubmission(null);
        }}
        title="Approve Volunteer Task Submission"
      >
        {approveModalSubmission && (
          <form onSubmit={handleApproveSubmit} className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {actionError}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Task:</span> {approveModalSubmission.task?.title}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Volunteer:</span>{' '}
                {approveModalSubmission.volunteer?.name}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Logged Hours:</span>{' '}
                <span className="font-bold">{approveModalSubmission.actualHours} hrs</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Approved Service Hours *
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max={approveModalSubmission.actualHours}
                required
                value={approvedHours}
                onChange={(e) => setApprovedHours(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Must be &gt; 0 and ≤ logged actual hours ({approveModalSubmission.actualHours} hrs).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reviewer Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900"
                placeholder="Great job completing the distribution ahead of schedule!"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setApproveModalSubmission(null)}
                disabled={submittingAction}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAction}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-xs cursor-pointer"
              >
                {submittingAction ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Reject Submission */}
      <Modal
        isOpen={Boolean(rejectModalSubmission)}
        onClose={() => {
          if (!submittingAction) setRejectModalSubmission(null);
        }}
        title="Reject Volunteer Task Submission"
      >
        {rejectModalSubmission && (
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {actionError}
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Task:</span> {rejectModalSubmission.task?.title}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Volunteer:</span>{' '}
                {rejectModalSubmission.volunteer?.name}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Logged Hours:</span>{' '}
                {rejectModalSubmission.actualHours} hrs
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Rejection / Feedback *
              </label>
              <textarea
                required
                rows={4}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 text-slate-900"
                placeholder="Please provide more detail regarding the location distribution and adjust hours to actual time spent."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The volunteer will see this feedback and can make adjustments to resubmit.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setRejectModalSubmission(null)}
                disabled={submittingAction}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition shadow-xs cursor-pointer"
              >
                {submittingAction ? 'Rejecting...' : 'Reject & Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
