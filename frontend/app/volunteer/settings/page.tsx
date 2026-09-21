'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { useToast } from '../../../components/Toast';
import { User } from '../../../types';
import { User as UserIcon, KeyRound, HeartHandshake, ShieldCheck } from 'lucide-react';

export default function VolunteerSettingsPage() {
  const { user, updateUserSession } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Validation Error', 'Name is required');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await api.patch<{ token: string; user: User }>('/auth/profile', {
        name: name.trim(),
        phone: phone.trim() || null,
      });

      updateUserSession(res.token, res.user);
      success('Profile Saved', 'Your volunteer contact information has been updated.');
    } catch (err: any) {
      error('Update Failed', err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      error('Validation Error', 'All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('Validation Error', 'New password and confirmation do not match');
      return;
    }

    if (newPassword.length < 8) {
      error('Validation Error', 'New password must be at least 8 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api.patch<{ token: string; user: User }>('/auth/password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      updateUserSession(res.token, res.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      success('Password Updated', 'Your volunteer account password has been updated.');
    } catch (err: any) {
      error('Change Failed', err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Settings & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Update your contact details and protect your account credentials.
        </p>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-mooney-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Volunteer Information</h2>
            <p className="text-xs text-slate-500">Official registered profile</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Volunteer ID
            </label>
            <input
              type="text"
              disabled
              value={user?.volunteerId || 'Assigned'}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">Assigned by NGO administration</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Registered Email
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98220 XXXXX"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Management */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-mooney-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Keep your account secure with a strong password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              New Password (minimum 8 characters)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Mentor Information Card */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <HeartHandshake className="w-8 h-8 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">NGO Mentorship</p>
            <p className="text-base font-bold text-white">Mr. Sanjay Kumar</p>
            <p className="text-xs text-slate-400">A Ray of Hope Foundation · Pune, Maharashtra</p>
          </div>
        </div>
      </div>
    </div>
  );
}
