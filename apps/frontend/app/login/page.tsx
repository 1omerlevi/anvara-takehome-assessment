'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/auth-client';

const API_URL = globalThis.process?.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

type Role = 'sponsor' | 'publisher';

const roleContent: Record<
  Role,
  {
    label: string;
    email: string;
    destination: string;
    summary: string;
  }
> = {
  sponsor: {
    label: 'Sponsor',
    email: 'sponsor@example.com',
    destination: '/dashboard/sponsor',
    summary: 'Browse placements and manage campaigns.',
  },
  publisher: {
    label: 'Publisher',
    email: 'publisher@example.com',
    destination: '/dashboard/publisher',
    summary: 'Manage inventory and update listings.',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('sponsor');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedRole = roleContent[role];
  const password = 'password';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email(
      {
        email: selectedRole.email,
        password,
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: async (ctx) => {
          try {
            const userId = ctx.data?.user?.id;

            if (!userId) {
              router.push('/');
              return;
            }

            const response = await fetch(`${API_URL}/api/auth/role/${userId}`);
            const data = (await response.json()) as { role?: Role };

            if (data.role === 'sponsor') {
              router.push('/dashboard/sponsor');
            } else if (data.role === 'publisher') {
              router.push('/dashboard/publisher');
            } else {
              router.push('/');
            }
          } catch {
            router.push(selectedRole.destination);
          }
        },
        onError: (ctx) => {
          setError(ctx.error.message || 'Login failed');
          setLoading(false);
        },
      }
    );

    if (signInError) {
      setError(signInError.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <section className="dashboard-shell w-full max-w-3xl p-6 sm:p-8">
        <div className="dashboard-grid">
          <div className="mx-auto max-w-2xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/80">
              Demo Login
            </p>
            <h1 className="mt-4 text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Choose a role and continue.
            </h1>
            <p className="mt-3 text-center text-sm leading-7 text-slate-300">
              Pick the view you want to test. Credentials are filled in for you.
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {(['sponsor', 'publisher'] as const).map((item) => {
                  const content = roleContent[item];
                  const isActive = role === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRole(item)}
                      className={`dashboard-card dashboard-card-hover text-left p-5 ${
                        isActive ? 'border-white/25 ring-2 ring-white/12' : ''
                      }`}
                    >
                      <div className="relative z-10">
                        <div
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.2em] ${
                            isActive
                              ? 'border-white/30 bg-white/10 text-white'
                              : 'border-white/10 bg-white/6 text-slate-300'
                          }`}
                        >
                          {content.label}
                        </div>
                        <p className="mt-4 text-lg font-semibold text-white">{content.label} View</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{content.summary}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="dashboard-card p-5">
                <div className="relative z-10 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
                    <p className="mt-2 text-base font-semibold text-white">{selectedRole.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Password</p>
                    <p className="mt-2 text-base font-semibold text-white">{password}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="dashboard-button dashboard-button-primary w-full text-base disabled:opacity-60"
              >
                {loading ? 'Logging in...' : `Continue as ${selectedRole.label}`}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
