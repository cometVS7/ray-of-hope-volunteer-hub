'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';
import Modal from '../../../components/Modal';
import { User, UserStatus } from '../../../types';

export default function AdminVolunteersPage() {
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form state for creating a volunteer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    skills: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Action loading state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchVolunteers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get<{ volunteers: User[]; pagination: { total: number; page: number; totalPages: number } }>(
        '/admin/volunteers',
        params
      );
      setVolunteers(res.volunteers || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load volunteers.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const handleToggleStatus = async (volunteer: User) => {
    const nextStatus: UserStatus = volunteer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmMessage = `Are you sure you want to set ${volunteer.name} to ${nextStatus}?`;
    if (!confirm(confirmMessage)) return;

    try {
      setUpdatingId(volunteer.id);
      await api.patch(`/admin/volunteers/${volunteer.id}/status`, { status: nextStatus });
      setSuccessMessage(`Updated ${volunteer.name} status to ${nextStatus}.`);
      fetchVolunteers();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setFormError('Name, email, and password are required.');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };
      if (formData.phone.trim()) payload.phone = formData.phone.trim();
      if (formData.skills.trim()) {
        payload.skills = formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const res = await api.post<User>('/admin/volunteers', payload);
      setSuccessMessage(`Volunteer ${res.name} created successfully! Assigned ID: ${res.volunteerId}`);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', skills: '' });
      fetchVolunteers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create volunteer.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Volunteer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage NGO volunteers, monitor active status, and issue volunteer IDs.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-xs cursor-pointer"
        >
          <span className="mr-1.5 text-base leading-none">+</span> Add Volunteer
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
            placeholder="Search by name, Volunteer ID, or email..."
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
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
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
            Loading volunteers...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            <p className="font-medium">{error}</p>
            <button
              onClick={fetchVolunteers}
              className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : volunteers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No volunteers found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3">Volunteer ID</th>
                  <th className="px-5 py-3">Full Name</th>
                  <th className="px-5 py-3">Email & Phone</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {volunteers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-mono font-semibold text-indigo-700">
                      {v.volunteerId || <span className="text-slate-400 font-normal">None</span>}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{v.name}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-800">{v.email}</p>
                      {v.phone && <p className="text-slate-400 text-[11px]">{v.phone}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(v)}
                        disabled={updatingId === v.id}
                        className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                          v.status === 'ACTIVE'
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {updatingId === v.id
                          ? 'Updating...'
                          : v.status === 'ACTIVE'
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
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
            Total: <span className="font-semibold text-slate-700">{total}</span> volunteers
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

      {/* Modal: Create Volunteer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!formSubmitting) setIsModalOpen(false);
        }}
        title="Register New Volunteer"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              placeholder="Pooja Sharma"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              placeholder="pooja.sharma@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              placeholder="••••••••"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters recommended.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              placeholder="+91 98220 12345"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Skills (Optional, comma-separated)
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              placeholder="Primary Tutoring, First Aid, Event Logistics"
            />
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
              {formSubmitting ? 'Creating...' : 'Create Volunteer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
