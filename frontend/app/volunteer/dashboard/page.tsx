'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import StatCard from '../../../components/StatCard';
import StatusBadge from '../../../components/StatusBadge';
import { VolunteerDashboardData } from '../../../types';
import {
  Award,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-28">
        <Sparkles className="w-8 h-8 text-indigo-600 animate-bounce mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading your volunteer hub...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-white rounded-3xl border border-rose-200 shadow-mooney-card text-rose-800">
        <h3 className="text-base font-bold">Unable to load your dashboard</h3>
        <p className="text-xs text-slate-600 mt-1">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-mooney-hover border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold border border-white/10 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Volunteer Space · Pune, MH
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {data.volunteer.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Volunteer ID: <span className="font-mono font-bold text-amber-300">{data.volunteer.volunteerId || 'Assigned'}</span> · Supervised by <span className="font-semibold text-white">Mr. Sanjay Kumar</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/volunteer/tasks"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition"
            >
              <span>View My Tasks</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Verified Service Hours"
          value={`${data.serviceHours.official}h`}
          subtitle="Dynamically Verified"
          colorScheme="emerald"
          icon={<Award className="w-5 h-5" />}
        />
        <StatCard
          title="Total Assigned"
          value={data.tasks.total}
          subtitle="All Assigned Tasks"
          colorScheme="indigo"
          icon={<CheckSquare className="w-5 h-5" />}
        />
        <StatCard
          title="Under Review"
          value={data.tasks.submitted}
          subtitle="Awaiting Admin Check"
          colorScheme="amber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Approved Tasks"
          value={data.tasks.approved}
          subtitle="Hours Credited"
          colorScheme="emerald"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          title="Revision Needed"
          value={data.tasks.rejected}
          subtitle="Check feedback notes"
          colorScheme="rose"
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      {/* Dynamic Hours Info Callout */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-mooney-card flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">How Service Hours Accrue</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Your official service hours are dynamically aggregated strictly when an administrator reviews and approves
            your task submission. Logging hours on submitted tasks indicates expected completion, but only approved
            hours count toward your official certificate.
          </p>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-mooney-card overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Recent Assignments</h2>
            <p className="text-xs text-slate-500">Your latest volunteer initiatives</p>
          </div>
          <Link
            href="/volunteer/tasks"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
          >
            <span>All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data.recentTasks.length === 0 ? (
            <p className="p-8 text-xs text-slate-500 text-center">No tasks assigned yet.</p>
          ) : (
            data.recentTasks.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                <div className="space-y-1 max-w-[70%]">
                  <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    Assigned: {new Date(t.assignmentDate).toLocaleDateString()} · Due:{' '}
                    <span className="font-medium text-slate-700">
                      {new Date(t.deadline).toLocaleDateString()}
                    </span>
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mentor Guidance Card */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HeartHandshake className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">NGO Mentorship</p>
            <p className="text-sm font-bold text-white">Guided by Mr. Sanjay Kumar</p>
            <p className="text-xs text-slate-400">A Ray of Hope Foundation · Pune, Maharashtra</p>
          </div>
        </div>
        <Link
          href="/volunteer/impact"
          className="text-xs font-semibold text-indigo-300 hover:text-white underline underline-offset-4"
        >
          View Impact Summary →
        </Link>
      </div>
    </div>
  );
}
