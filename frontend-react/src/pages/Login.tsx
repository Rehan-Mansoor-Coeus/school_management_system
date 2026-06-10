import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  GraduationCap,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import api from '../api/client';
import { formatApiError } from '../utils/apiError';
import { useNavigate, useSearchParams } from 'react-router-dom';

const systemFeatures = [
  {
    icon: GraduationCap,
    title: 'Admissions & enrollment',
    description: 'Apply online, upload documents, pay fees, and track approval through registry, department, and finance.',
  },
  {
    icon: Users,
    title: 'Students & staff',
    description: 'Manage users, roles, permissions, and institution-wide access from one secure platform.',
  },
  {
    icon: Wallet,
    title: 'Fees & finance',
    description: 'Track registration fees, tuition, semester balances, and payment verification.',
  },
  {
    icon: BookOpen,
    title: 'Academics',
    description: 'Programmes, subjects, semesters, and course registration with HOD approval.',
  },
  {
    icon: Building2,
    title: 'Institution operations',
    description: 'Hostel, canteen, letters, timesheets, and other modules configured per institution.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure access',
    description: 'Role-based dashboards, audit-ready workflows, and bilingual support (English / French).',
  },
];

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { login, password });
      const token = res.data?.token;
      if (!token) {
        setError(formatApiError({ response: { status: 500, data: { message: 'Login succeeded but no token was returned.' } } }, 'Login failed'));
        return;
      }
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/');
    } catch (err: unknown) {
      setError(formatApiError(err, 'Login failed'));
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-10 text-white lg:flex">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-200">School Management System</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight">
              One platform for admissions, academics, and campus operations
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100">
              Sign in to manage applications, review documents, verify payments, register courses,
              and access modules enabled for your institution.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {systemFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{feature.title}</h2>
                    <p className="mt-1 text-sm text-blue-100">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-xs text-blue-200">
            Need help? Contact your institution administrator for account access.
          </p>
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-6 lg:hidden">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#1e3a5f]">School Management System</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">Sign in to continue</h1>
              <p className="mt-2 text-sm text-slate-500">
                Admissions, fees, academics, hostel, canteen, and more — all in one place.
              </p>
            </div>

            <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">Use your username or email and password.</p>

              {sessionExpired && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Your session has expired. Please sign in again.
                </div>
              )}
              {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

              <label className="mt-5 block text-sm font-medium text-slate-700">Username or email</label>
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="username or email@school.edu"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                required
              />

              <label className="mt-4 block text-sm font-medium text-slate-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Enter your password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                required
              />

              <button className="mt-6 w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a]">
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
