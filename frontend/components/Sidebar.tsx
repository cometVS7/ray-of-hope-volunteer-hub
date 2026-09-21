'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Clock,
  Settings,
  Award,
  Menu,
  X,
  FileCheck,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  pendingSubmissionsCount?: number;
}

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingSubmissionsCount }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const adminLinks: SidebarItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Volunteers', href: '/admin/volunteers', icon: Users },
    { label: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
    {
      label: 'Review Queue',
      href: '/admin/submissions',
      icon: Clock,
      badge: pendingSubmissionsCount !== undefined && pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined,
    },
    { label: 'Impact Analytics', href: '/admin/analytics', icon: TrendingUp },
    { label: 'Settings & Admins', href: '/admin/settings', icon: Settings },
  ];

  const volunteerLinks: SidebarItem[] = [
    { label: 'My Dashboard', href: '/volunteer/dashboard', icon: LayoutDashboard },
    { label: 'My Tasks', href: '/volunteer/tasks', icon: CheckSquare },
    { label: 'Impact & Certificate', href: '/volunteer/impact', icon: Award },
    { label: 'Account Settings', href: '/volunteer/settings', icon: Settings },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : volunteerLinks;

  return (
    <>
      {/* Mobile Drawer Trigger Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {user.role === 'ADMIN' ? 'Admin Navigation' : 'Volunteer Navigation'}
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`${
          isOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-slate-900 text-slate-100 flex-shrink-0 md:min-h-[calc(100vh-4rem)] flex flex-col justify-between border-r border-slate-800/80 transition-all`}
      >
        <div className="p-4">
          <div className="px-3 pb-3 mb-2 border-b border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {user.role === 'ADMIN' ? 'Admin Control Center' : 'Volunteer Space'}
            </p>
          </div>

          <nav className="space-y-1.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </div>

                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-slate-950 glow-amber">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Attribution Card: NGO Mentor Attribution */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 m-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">NGO Mentor</p>
          </div>
          <p className="text-sm font-semibold text-white mt-1">Mr. Sanjay Kumar</p>
          <p className="text-xs text-slate-400 leading-snug mt-0.5">A Ray of Hope Foundation</p>
          <p className="text-[11px] text-indigo-400 font-mono mt-1">Pune, Maharashtra</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
