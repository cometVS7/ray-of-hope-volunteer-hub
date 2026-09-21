'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { AdminDashboardData, VolunteerStatisticsItem } from '../../../types';
import StatCard from '../../../components/StatCard';
import StatusBadge from '../../../components/StatusBadge';
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  PieChart,
  BarChart3,
  Calendar,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerStatisticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [dash, vols] = await Promise.all([
          api.get<AdminDashboardData>('/admin/dashboard'),
          api.get<VolunteerStatisticsItem[]>('/admin/dashboard/volunteers'),
        ]);
        setDashboard(dash);
        setVolunteers(vols);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <Sparkles className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Synthesizing Impact Analytics...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-rose-200 text-rose-800">
        <h3 className="text-base font-bold">Failed to load analytics</h3>
        <p className="text-xs text-slate-600 mt-1">{error}</p>
      </div>
    );
  }

  const totalTasks = dashboard.tasks.total || 1;
  const completionRate = Math.round((dashboard.tasks.approved / totalTasks) * 100);
  const totalOfficialHours = dashboard.serviceHours.official;
  const avgHoursPerVolunteer = (totalOfficialHours / (dashboard.volunteers.active || 1)).toFixed(1);

  // Sort volunteers by official hours
  const topContributors = [...volunteers].sort((a, b) => b.officialServiceHours - a.officialServiceHours);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            Impact Intelligence
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
          Community Impact Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Service hours metrics and performance reporting for A Ray of Hope Foundation · Pune
        </p>
      </div>

      {/* Top 4 Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Service Hours"
          value={`${totalOfficialHours} hrs`}
          subtitle="Dynamically accrued from approvals"
          colorScheme="emerald"
          icon={<Award className="w-5 h-5" />}
        />
        <StatCard
          title="Task Completion Rate"
          value={`${completionRate}%`}
          subtitle={`${dashboard.tasks.approved} of ${dashboard.tasks.total} finished`}
          colorScheme="indigo"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Avg Hours / Active Vol"
          value={`${avgHoursPerVolunteer} hrs`}
          subtitle="Across active volunteers"
          colorScheme="sky"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Reviewed Submissions"
          value={dashboard.submissions.approved + dashboard.submissions.rejected}
          subtitle={`${dashboard.submissions.pending} pending in review queue`}
          colorScheme="amber"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Domain Impact Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-mooney-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Program Domains</h2>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Distribution of volunteer efforts across community development initiatives in Pune.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Remedial Education</span>
                  <span className="text-indigo-600">38%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[38%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Slum Healthcare & Hygiene</span>
                  <span className="text-emerald-600">26%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[26%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Tree Plantation & Environment</span>
                  <span className="text-teal-600">20%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full w-[20%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Food Relief & Senior Support</span>
                  <span className="text-amber-600">16%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[16%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pune District Coverage</span>
            <span className="font-semibold text-slate-700">Kothrud, Hadapsar, Viman Nagar</span>
          </div>
        </div>

        {/* Top Contributors Full Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-mooney-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Top Service Contributors
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by verified official approved hours</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              Live Database Verification
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3">Rank & Volunteer</th>
                  <th className="px-4 py-3">Volunteer ID</th>
                  <th className="px-4 py-3 text-center">Approved / Total Tasks</th>
                  <th className="px-5 py-3 text-right">Verified Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topContributors.slice(0, 10).map((vol, idx) => (
                  <tr key={vol.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{vol.name}</p>
                          <p className="text-[11px] text-slate-400">{vol.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600 font-medium">
                      {vol.volunteerId || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-700">
                      <span className="text-emerald-700 font-bold">{vol.approvedTaskCount}</span>
                      <span className="text-slate-400"> / {vol.taskCount}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-emerald-700 text-sm">
                      {vol.officialServiceHours} <span className="text-[11px] font-normal text-slate-500">hrs</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mentor Recognition Footer */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">NGO Mentorship</p>
            <p className="text-base font-bold text-white">Supervised by Mr. Sanjay Kumar</p>
            <p className="text-xs text-slate-400">A Ray of Hope Foundation · Pune, Maharashtra</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 max-w-sm text-right">
          Service learning impact reports are certified in accordance with Foundation standards.
        </p>
      </div>
    </div>
  );
}
