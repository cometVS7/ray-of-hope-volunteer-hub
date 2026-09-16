'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const adminLinks = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Volunteers', href: '/admin/volunteers', icon: '👥' },
    { label: 'Tasks', href: '/admin/tasks', icon: '📋' },
    { label: 'Submissions', href: '/admin/submissions', icon: '📝' },
  ];

  const volunteerLinks = [
    { label: 'Dashboard', href: '/volunteer/dashboard', icon: '📊' },
    { label: 'My Tasks', href: '/volunteer/tasks', icon: '📋' },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : volunteerLinks;

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex-shrink-0 md:min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {user.role === 'ADMIN' ? 'Admin Portal' : 'Volunteer Portal'}
        </p>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="mr-3 text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
