'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { VolunteerDashboardData } from '../../../types';
import StatCard from '../../../components/StatCard';
import {
  Award,
  Sparkles,
  Printer,
  ShieldCheck,
  CheckCircle2,
  HeartHandshake,
} from 'lucide-react';

export default function VolunteerImpactPage() {
  const [data, setData] = useState<VolunteerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<VolunteerDashboardData>('/volunteer/dashboard');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <Sparkles className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Generating your Impact Certificate preview...</p>
      </div>
    );
  }

  const officialHours = data?.serviceHours.official || 0;
  const volunteerName = data?.volunteer.name || 'Volunteer';
  const volunteerId = data?.volunteer.volunteerId || 'ARH-VOL';

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Official Service Credential
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Service Learning Impact & Certificate
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified community contributions for A Ray of Hope Foundation · Pune, Maharashtra
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer self-start"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Certificate</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Official Verified Hours"
          value={`${officialHours} hrs`}
          subtitle="Dynamically Certified"
          colorScheme="emerald"
          icon={<Award className="w-5 h-5" />}
        />
        <StatCard
          title="Approved Tasks"
          value={data?.tasks.approved || 0}
          subtitle="Completed Initiatives"
          colorScheme="indigo"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          title="NGO Partner"
          value="Ray of Hope"
          subtitle="Pune, Maharashtra"
          colorScheme="sky"
          icon={<HeartHandshake className="w-5 h-5" />}
        />
      </div>

      {/* Printable Certificate Canvas */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-slate-200/90 shadow-mooney-card relative overflow-hidden print:m-0 print:border-none print:shadow-none">
        {/* Certificate Watermark / Accent Border */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-md mb-4">
            <Sparkles className="w-7 h-7" />
          </div>

          <p className="text-xs uppercase tracking-widest font-extrabold text-indigo-600">
            A Ray of Hope Foundation · Pune
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-2">
            Certificate of Community Service Learning
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official Academic Verification & Hours Attribution
          </p>

          <p className="text-sm text-slate-600 mt-8">This certifies that</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 underline underline-offset-8 decoration-indigo-300 mt-2">
            {volunteerName}
          </p>
          <p className="text-xs font-mono text-slate-500 mt-2">Volunteer ID: {volunteerId}</p>

          <p className="text-sm text-slate-700 leading-relaxed mt-6">
            has successfully rendered <span className="font-bold text-indigo-600">{officialHours} official verified hours</span> of
            dedicated community service learning in Pune, Maharashtra, contributing to educational outreach, public health,
            hunger relief, and environmental sustainability initiatives.
          </p>

          {/* Certificate Signatures and Badges */}
          <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 gap-8 items-end">
            <div className="text-left">
              <div className="font-serif italic text-lg text-slate-800">Sanjay Kumar</div>
              <div className="w-36 h-0.5 bg-slate-400 mt-1" />
              <p className="text-xs font-bold text-slate-900 mt-1">Mr. Sanjay Kumar</p>
              <p className="text-[11px] text-slate-500">NGO Mentor · A Ray of Hope Foundation</p>
              <p className="text-[10px] text-slate-400">Pune, Maharashtra</p>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Single Source of Truth Verified</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-2">
                Certified on {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
