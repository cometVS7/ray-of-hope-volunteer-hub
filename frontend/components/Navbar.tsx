'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Sparkles, Shield, User as UserIcon, LogOut, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const settingsHref = user?.role === 'ADMIN' ? '/admin/settings' : '/volunteer/settings';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link
              href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/volunteer/dashboard'}
              className="flex items-center gap-2.5 group transition"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-indigo-600 transition-colors">
                    Ray of Hope
                  </span>
                  <span className="hidden sm:inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full">
                    Volunteer Hub
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Pune, Maharashtra</p>
              </div>
            </Link>
          </div>

          {/* Center: Official NGO Mentor Attribution */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 font-medium">NGO Mentor:</span>
            <span className="font-semibold text-slate-800">Mr. Sanjay Kumar</span>
            <span className="text-slate-400 text-[10px]">· A Ray of Hope Foundation</span>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user && (
              <>
                <div className="flex items-center gap-3">
                  {/* Avatar Initials */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {getInitials(user.name)}
                  </div>

                  <div className="text-left hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 leading-none">{user.name}</p>
                      {user.isMasterAdmin && (
                        <span
                          title="Master Administrator"
                          className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300/70 px-1.5 py-0.2 rounded-sm"
                        >
                          <Shield className="w-2.5 h-2.5 text-amber-700" />
                          Master
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {user.role === 'VOLUNTEER' ? (
                        <span className="font-mono text-indigo-600 font-medium">{user.volunteerId || user.email}</span>
                      ) : (
                        <span className="text-slate-500">{user.email}</span>
                      )}
                    </p>
                  </div>
                </div>

                <Link
                  href={settingsHref}
                  title="Account Settings & Security"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                <button
                  onClick={logout}
                  title="Sign out of your session"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
