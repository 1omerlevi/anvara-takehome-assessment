import type { ReactNode } from 'react';

export default function Template({ children }: { children: ReactNode }) {
  // Fixes: adds a lightweight route-level entrance transition for app pages.
  return <div className="dashboard-page-transition">{children}</div>;
}
