'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import Link from 'next/link';
import StatCard from '../../../components/StatCard';
import StatusBadge from '../../../components/StatusBadge';
import { AdminDashboardData, VolunteerStatisticsItem } from '../../../types';
import {
  Users,
  UserCheck,
  CheckSquare,
  Clock,
  Award,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Plus,
  ShieldCheck,
} from 'lucide-react';

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

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 animate-bounce mb-3 shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Connecting to Volunteer Hub...</p>
        <p className="text-xs text-slate-400 mt-1">Aggregating live community metrics</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-rose-200 shadow-mooney-card text-rose-800">
        <h3 className="text-base font-bold">Unable to load administrative overview</h3>
        <p className="text-xs mt-1 text-slate-600">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const totalTasksCount = dashboard.tasks.total || 1;
  const assignedPct = Math.round((dashboard.tasks.assigned / totalTasksCount) * 100);
  const submittedPct = Math.round((dashboard.tasks.submitted / totalTasksCount) * 100);
  const approvedPct = Math.round((dashboard.tasks.approved / totalTasksCount) * 100);
  const rejectedPct = Math.round((dashboard.tasks.rejected / totalTasksCount) * 100);

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Live Status & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Verified Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Admin Overview & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            A Ray of Hope Foundation · Pune, Maharashtra · Mentor: <span className="font-semibold text-slate-700">Mr. Sanjay Kumar</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/tasks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            Assign Task
          </Link>
          <Link
            href="/admin/volunteers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Volunteer
          </Link>
        </div>
      </div>

      {/* Hero Community Impact Card (Mooney Dimensional Styling) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-mooney-hover border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold border border-white/10 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Dynamic Single Source of Truth
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {dashboard.serviceHours.official} Official Service Hours
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every verified hour is dynamically calculated from reviewed and approved task submissions. 
              Active volunteer network across Pune supporting education, health, and environmental sustainability.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {dashboard.volunteers.active} Active Volunteers
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                {dashboard.tasks.approved} Approved Tasks
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {dashboard.submissions.pending} Pending Review
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center shrink-0 min-w-[200px] text-center">
            <TrendingUp className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-xs uppercase tracking-wider text-slate-300 font-bold">Community Reach</p>
            <p className="text-3xl font-extrabold text-white mt-1">100%</p>
            <p className="text-[11px] text-slate-400 mt-1">Pune NGOs & Centers</p>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Volunteers"
          value={dashboard.volunteers.total}
          subtitle="Registered Network"
          colorScheme="indigo"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Active Volunteers"
          value={dashboard.volunteers.active}
          subtitle="Ready for tasks"
          colorScheme="emerald"
          icon={<UserCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Total Tasks"
          value={dashboard.tasks.total}
          subtitle={`${dashboard.tasks.assigned} in progress`}
          colorScheme="sky"
          icon={<CheckSquare className="w-5 h-5" />}
        />
        <StatCard
          title="Pending Reviews"
          value={dashboard.submissions.pending}
          subtitle="Queue awaiting check"
          colorScheme="amber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Approved Tasks"
          value={dashboard.tasks.approved}
          subtitle="Hours credited"
          colorScheme="emerald"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Official Hours"
          value={`${dashboard.serviceHours.official}h`}
          subtitle="Verified Service"
          colorScheme="indigo"
          icon={<Award className="w-5 h-5" />}
        />
      </div>

      {/* Task Lifecycle Distribution Pipeline */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-mooney-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Task Execution Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status breakdown across all {dashboard.tasks.total} tasks</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{dashboard.tasks.total} Total Tasks</span>
        </div>

        {/* Segmented Pipeline Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 mb-5">
          <div style={{ width: `${assignedPct}%` }} className="h-full bg-sky-500 rounded-l-full transition-all" title={`Assigned: ${dashboard.tasks.assigned}`} />
          <div style={{ width: `${submittedPct}%` }} className="h-full bg-amber-500 transition-all" title={`Submitted: ${dashboard.tasks.submitted}`} />
          <div style={{ width: `${approvedPct}%` }} className="h-full bg-emerald-500 transition-all" title={`Approved: ${dashboard.tasks.approved}`} />
          <div style={{ width: `${rejectedPct}%` }} className="h-full bg-rose-500 rounded-r-full transition-all" title={`Rejected: ${dashboard.tasks.rejected}`} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 uppercase">Assigned</span>
              <span className="text-[10px] font-semibold text-sky-600">{assignedPct}%</span>
            </div>
            <p className="text-2xl font-extrabold text-sky-950 mt-1">{dashboard.tasks.assigned}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase">Submitted</span>
              <span className="text-[10px] font-semibold text-amber-600">{submittedPct}%</span>
            </div>
            <p className="text-2xl font-extrabold text-amber-950 mt-1">{dashboard.tasks.submitted}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Approved</span>
              <span className="text-[10px] font-semibold text-emerald-600">{approvedPct}%</span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-950 mt-1">{dashboard.tasks.approved}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase">Rejected</span>
              <span className="text-[10px] font-semibold text-rose-600">{rejectedPct}%</span>
            </div>
            <p className="text-2xl font-extrabold text-rose-950 mt-1">{dashboard.tasks.rejected}</p>
          </div>
        </div>
      </div>

      {/* Grid: Recent Tasks & Volunteer Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-mooney-card overflow-hidden">
          <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Recent Assignments</h2>
              <p className="text-xs text-slate-500">Latest active tasks across volunteer network</p>
            </div>
            <Link
              href="/admin/tasks"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {dashboard.recentTasks.length === 0 ? (
              <p className="p-8 text-xs text-slate-500 text-center">No tasks recorded yet.</p>
            ) : (
              dashboard.recentTasks.map((t) => (
                <div key={t.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="space-y-1 max-w-[70%]">
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      Assigned to: <span className="text-slate-800 font-medium">{t.volunteer.name}</span>
                      {t.volunteer.volunteerId && (
                        <span className="ml-1 font-mono text-[11px] text-indigo-600">({t.volunteer.volunteerId})</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Due {new Date(t.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Volunteer Leaderboard & Dynamic Official Hours */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-mooney-card overflow-hidden">
          <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Volunteer Leaderboard</h2>
              <p className="text-xs text-slate-500">Official verified service hours (dynamic calculation)</p>
            </div>
            <Link
              href="/admin/volunteers"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <span>Manage all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3">Volunteer</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center">Tasks</th>
                  <th className="px-5 py-3 text-right">Official Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      No volunteers registered.
                    </td>
                  </tr>
                ) : (
                  volunteers.slice(0, 8).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {getInitials(v.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{v.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">{v.volunteerId || 'No ID'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-slate-700">
                        {v.taskCount}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {v.approvedTaskCount} approved
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-bold text-emerald-700 text-sm">{v.officialServiceHours}</span>
                        <span className="text-[10px] text-emerald-600 ml-0.5">hrs</span>
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
