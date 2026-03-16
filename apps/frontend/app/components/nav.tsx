'use client';

import process from 'node:process';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authClient } from '@/auth-client';

type UserRole = 'sponsor' | 'publisher' | null;

export function Nav() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const pathname = usePathname();
  const [roleState, setRoleState] = useState<{ userId: string | null; role: UserRole }>({
    userId: null,
    role: null,
  });
  const role = roleState.userId === user?.id ? roleState.role : null;
  const navLinkClass = (href: string) =>
    `inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition ${
      pathname === href
        ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
        : 'text-slate-300 hover:bg-white/6 hover:text-white'
    }`;
  const pendingPillClass =
    'inline-flex h-10 items-center rounded-full border border-white/8 bg-white/5 text-transparent';

  // TODO: Convert to server component and fetch role server-side
  // Fetch user role from backend when user is logged in
  useEffect(() => {
    if (!user?.id) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291'}/api/auth/role/${user.id}`)
        .then((res) => res.json())
        .then((data) => setRoleState({ userId: user.id, role: data.role }))
        .catch(() => setRoleState({ userId: user.id, role: null }));
  }, [user?.id]);

  // TODO: Add active link styling using usePathname() from next/navigation
  // The current page's link should be highlighted differently

  return (
    <header className="sticky top-0 z-30 px-4 pt-5 sm:px-6 lg:px-8">
      <nav className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(15,23,42,0.78))] px-5 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center rounded-full px-4 py-2 text-2xl font-semibold tracking-tight text-white transition hover:bg-white/5"
        >
          Anvara
        </Link>

        <div className="hidden items-center justify-self-end rounded-full border border-white/10 bg-black/12 p-1 sm:mr-6 sm:flex">
          {isPending ? (
            <>
              <span className={`${pendingPillClass} px-5`}>Marketplace</span>
              <span className={`${pendingPillClass} ml-1 px-5`}>My Ad Slots</span>
            </>
          ) : (
            <Link href="/marketplace" className={navLinkClass('/marketplace')}>
              Marketplace
            </Link>
          )}

          {!isPending && user && role === 'sponsor' ? (
            <Link href="/dashboard/sponsor" className={navLinkClass('/dashboard/sponsor')}>
              My Campaigns
            </Link>
          ) : !isPending && user && role === 'publisher' ? (
            <Link href="/dashboard/publisher" className={navLinkClass('/dashboard/publisher')}>
              My Ad Slots
            </Link>
          ) : null}
        </div>

        <div className="flex items-center justify-self-end">
          {isPending ? (
            <div className="flex items-center rounded-full border border-white/10 bg-black/12 p-1">
              <span className={`${pendingPillClass} hidden px-5 sm:inline-flex`}>
                Demo Publisher (publisher)
              </span>
              <span className={`${pendingPillClass} ml-0 px-5 sm:ml-3`}>Logout</span>
            </div>
          ) : user ? (
            <div className="flex items-center rounded-full border border-white/10 bg-black/12 p-1">
              <span className="hidden items-center rounded-full px-4 py-2 text-sm text-slate-300 sm:inline-flex">
                {user.name} {role && `(${role})`}
              </span>
              <button
                onClick={async () => {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        window.location.href = '/';
                      },
                    },
                  });
                }}
                className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[linear-gradient(180deg,var(--color-primary-light),var(--color-primary))] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(49,80,255,0.42)] ring-1 ring-white/12 transition hover:brightness-110"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
