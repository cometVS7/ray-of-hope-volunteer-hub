'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { useToast } from '../../../components/Toast';
import { AdminItem, User } from '../../../types';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  UserPlus,
  Users,
  CheckCircle2,
  Info,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, updateUserSession } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'admins' | 'attribution'>('profile');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Admin Management State (Master Admin)
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setEmail(user.email);
    }
  }, [user]);

  // Load admins if master admin
  const loadAdmins = async () => {
    if (!user?.isMasterAdmin) return;
    try {
      setIsLoadingAdmins(true);
      const data = await api.get<AdminItem[]>('/admin/admins');
      setAdmins(data);
    } catch (err: any) {
      error('Failed to load administrators', err.message);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admins') {
      loadAdmins();
    }
  }, [activeTab, user?.isMasterAdmin]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Validation Error', 'Name is required');
      return;
    }

    const emailChanged = email.trim().toLowerCase() !== user?.email.toLowerCase();
    if (emailChanged && !currentPasswordForEmail) {
      error('Validation Error', 'Current password is required to change your email address');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await api.patch<{ token: string; user: User }>('/auth/profile', {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim(),
        currentPassword: emailChanged ? currentPasswordForEmail : undefined,
      });

      updateUserSession(res.token, res.user);
      setCurrentPasswordForEmail('');
      success('Profile Updated', 'Your profile details have been successfully saved.');
    } catch (err: any) {
      error('Update Failed', err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Change
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
      success('Password Changed', 'Your account password has been successfully updated.');
    } catch (err: any) {
      error('Password Change Failed', err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      error('Validation Error', 'Name, email, and password are required');
      return;
    }

    if (newAdminPassword.length < 8) {
      error('Validation Error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setIsCreatingAdmin(true);
      await api.post('/admin/admins', {
        name: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword,
        phone: newAdminPhone.trim() || null,
      });

      success('Administrator Created', `New admin account for ${newAdminName} has been created.`);
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminPhone('');
      loadAdmins();
    } catch (err: any) {
      error('Creation Failed', err.message);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Settings & Administration</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your administrator profile, security settings, organization privileges, and project identity.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2 sm:gap-4">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'admins'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Administrators</span>
          {user?.isMasterAdmin && (
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300/80 px-1.5 py-0.2 rounded-sm font-bold">
              Master
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attribution')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'attribution'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Organization & Mentor</span>
        </button>
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-mooney-card">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Administrator Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your administrative profile contact info. Changing your email address requires password verification.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-xl">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            {email.trim().toLowerCase() !== user?.email.toLowerCase() && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-900 mb-2">
                  Confirm Password to change email address
                </p>
                <input
                  type="password"
                  required
                  value={currentPasswordForEmail}
                  onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2 rounded-lg border border-amber-300 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98230 XXXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
              >
                {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-mooney-card">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure your account is using a long, random password with at least 8 characters.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-xl">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
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
                {isChangingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Administrators (Master Admin) */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-mooney-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Administrator Accounts</h2>
                  {user?.isMasterAdmin && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                      Master Authorized
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Platform administrators have full oversight over tasks, volunteers, and service hour approvals.
                </p>
              </div>

              {user?.isMasterAdmin ? (
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition shadow-xs self-start cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Administrator</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium border border-slate-200">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Master Admin privileges required to invite administrators</span>
                </div>
              )}
            </div>

            {isLoadingAdmins ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading administrators...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="px-5 py-3">Administrator</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Privilege Level</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admins.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900">{adm.name}</p>
                          <p className="text-slate-400 font-mono text-[11px]">{adm.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{adm.phone || '—'}</td>
                        <td className="px-4 py-3">
                          {adm.isMasterAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                              <Shield className="w-2.5 h-2.5 text-amber-700" />
                              Master Admin
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600 font-medium">Administrator</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {adm.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-400 text-[11px]">
                          {new Date(adm.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Admin Modal */}
          {showAddAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-mooney-hover">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Add New Administrator</h3>
                  <button
                    onClick={() => setShowAddAdminModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g., Rajesh Sharma"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin@rayofhope.org"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Initial Password (minimum 8 characters)
                    </label>
                    <input
                      type="password"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="+91 98220 XXXXX"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddAdminModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingAdmin}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isCreatingAdmin ? 'Creating...' : 'Create Admin Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Organization & Official Mentor Attribution */}
      {activeTab === 'attribution' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-mooney-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Organization & Mentorship Identity</h2>
                <p className="text-xs text-slate-500">Service Learning Partner & Academic Guidance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Partner NGO Organization
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">A Ray of Hope Foundation</p>
                <p className="text-xs text-slate-600 mt-1">Pune, Maharashtra, India</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  A registered grassroots non-governmental organization conducting impactful community outreach across Pune,
                  including remedial education, tree plantations, slum health camps, and grocery support.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Official NGO Mentor
                </span>
                <p className="text-lg font-bold text-slate-900 mt-1">Mr. Sanjay Kumar</p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">A Ray of Hope Foundation · Pune</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Project guide and organizational advisor overseeing field operations, student volunteer allocations,
                  and community welfare verification standards.
                </p>
              </div>
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Dynamic Verification Policy</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Official volunteer service hours are strictly calculated dynamically as:
              </p>
              <code className="block mt-2 p-3 bg-white rounded-xl border border-indigo-200 font-mono text-xs text-indigo-900">
                SUM(TaskSubmission.approvedHours) WHERE reviewStatus = &apos;APPROVED&apos;
              </code>
              <p className="text-[11px] text-slate-500 mt-2">
                No duplicate total is stored on user accounts. Submissions pending review or rejected do not contribute to
                official accredited hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
