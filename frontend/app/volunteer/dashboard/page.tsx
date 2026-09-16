'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import StatCard from '../../../components/StatCard';
import StatusBadge from '../../../components/StatusBadge';
import { VolunteerDashboardData } from '../../../types';

export default function VolunteerDashboardPage() {
  const [data, setData] = useState<VolunteerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<VolunteerDashboardData>('/volunteer/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load volunteer dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-2 text-indigo-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-medium text-slate-600">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
        <p className="font-semibold">Unable to load dashboard</p>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-3 px-3 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200 bg-indigo-800/60 px-2.5 py-1 rounded-full">
            Volunteer Hub
          </span>
          <h1 className="text-2xl font-bold mt-2">Welcome back, {data.volunteer.name}!</h1>
          <p className="text-xs text-indigo-200 mt-1">
            Volunteer ID: <span className="font-mono font-bold text-white">{data.volunteer.volunteerId || 'Assigned'}</span>
          </p>
        </div>
        <Link
          href="/volunteer/tasks"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-xs rounded-xl shadow-xs transition"
        >
          View My Tasks →
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <StatCard
            title="Official Service Hours"
            value={`${data.serviceHours.official} hrs`}
            subtitle="Admin Verified"
            accentColor="border-l-emerald-600"
          />
        </div>
        <StatCard
          title="Total Assigned"
          value={data.tasks.total}
          subtitle="All Assigned Tasks"
          accentColor="border-l-blue-600"
        />
        <StatCard
          title="Under Review"
          value={data.tasks.submitted}
          subtitle="Awaiting Verification"
          accentColor="border-l-amber-500"
        />
        <StatCard
          title="Approved Tasks"
          value={data.tasks.approved}
          subtitle="Service Hours Verified"
          accentColor="border-l-emerald-600"
        />
        <StatCard
          title="Needs Revision"
          value={data.tasks.rejected}
          subtitle="Review Feedback"
          accentColor="border-l-rose-500"
        />
      </div>

      {/* Recent Assigned Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Recent Assigned Tasks
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Your latest community service tasks</p>
          </div>
          <Link href="/volunteer/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            View all →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data.recentTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No tasks currently assigned. Contact your coordinator if you are ready for a new task!
            </div>
          ) : (
            data.recentTasks.map((t) => (
              <div key={t.id} className="p-4 sm:px-6 hover:bg-slate-50 transition flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-400">
                    Deadline: <span className="text-slate-600 font-medium">{new Date(t.deadline).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <StatusBadge status={t.status} />
                  <Link
                    href="/volunteer/tasks"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
