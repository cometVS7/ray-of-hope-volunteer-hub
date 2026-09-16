'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import Link from 'next/link';
import StatCard from '../../../components/StatCard';
import StatusBadge from '../../../components/StatusBadge';
import { AdminDashboardData, VolunteerStatisticsItem } from '../../../types';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerStatisticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [dashData, volData] = await Promise.all([
        api.get<AdminDashboardData>('/admin/dashboard'),
        api.get<VolunteerStatisticsItem[]>('/admin/dashboard/volunteers'),
      ]);
      setDashboard(dashData);
      setVolunteers(volData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-2 text-indigo-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-medium text-slate-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={loadData}
          className="mt-3 px-3 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Overview</h1>
        <p className="text-xs text-slate-500 mt-1">
          Live statistics and volunteer activity for A Ray of Hope Foundation (Pune).
        </p>
      </div>

      {/* Top 6 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Volunteers"
          value={dashboard.volunteers.total}
          subtitle="Registered NGO Network"
          accentColor="border-l-blue-600"
        />
        <StatCard
          title="Active Volunteers"
          value={dashboard.volunteers.active}
          subtitle="Ready for Assignments"
          accentColor="border-l-emerald-600"
        />
        <StatCard
          title="Inactive Volunteers"
          value={dashboard.volunteers.inactive}
          subtitle="Paused / Pending"
          accentColor="border-l-slate-400"
        />
        <StatCard
          title="Total Tasks"
          value={dashboard.tasks.total}
          subtitle={`${dashboard.tasks.assigned} Assigned`}
          accentColor="border-l-indigo-600"
        />
        <StatCard
          title="Pending Reviews"
          value={dashboard.submissions.pending}
          subtitle="Awaiting Verification"
          accentColor="border-l-amber-500"
        />
        <StatCard
          title="Official Service Hours"
          value={`${dashboard.serviceHours.official} hrs`}
          subtitle="Dynamically Verified"
          accentColor="border-l-purple-600"
        />
      </div>

      {/* Task Status Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
          Task Distribution by Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-center">
            <p className="text-xs font-semibold text-blue-700 uppercase">Assigned</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{dashboard.tasks.assigned}</p>
          </div>
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-center">
            <p className="text-xs font-semibold text-amber-700 uppercase">Submitted</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{dashboard.tasks.submitted}</p>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
            <p className="text-xs font-semibold text-emerald-700 uppercase">Approved</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{dashboard.tasks.approved}</p>
          </div>
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-100 text-center">
            <p className="text-xs font-semibold text-rose-700 uppercase">Rejected</p>
            <p className="text-2xl font-bold text-rose-900 mt-1">{dashboard.tasks.rejected}</p>
          </div>
        </div>
      </div>

      {/* Grid: Recent Tasks & Volunteer Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Recent Tasks</h2>
            <Link href="/admin/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.recentTasks.length === 0 ? (
              <p className="p-6 text-xs text-slate-500 text-center">No tasks recorded yet.</p>
            ) : (
              dashboard.recentTasks.map((t) => (
                <div key={t.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      Assigned to: <span className="text-slate-700 font-medium">{t.volunteer.name}</span> (
                      {t.volunteer.volunteerId || 'No ID'})
                    </p>
                    <p className="text-xs text-slate-400">
                      Deadline: {new Date(t.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Volunteer Statistics */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Volunteer Leaderboard & Stats</h2>
            <Link href="/admin/volunteers" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Manage →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Volunteer</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center">Tasks</th>
                  <th className="px-4 py-3 text-right">Official Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">
                      No volunteers registered.
                    </td>
                  </tr>
                ) : (
                  volunteers.slice(0, 8).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{v.name}</p>
                        <p className="text-slate-400">{v.volunteerId || 'N/A'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-slate-700">
                        {v.taskCount}{' '}
                        <span className="text-[10px] text-slate-400">({v.approvedTaskCount} apprv)</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {v.officialServiceHours} hrs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
