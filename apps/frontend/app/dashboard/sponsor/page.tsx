import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/auth-helpers';
import { getSponsorCampaigns } from './actions';
import { SponsorDashboardClient } from './components/sponsor-dashboard-client';

/*function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    }),
  ]);
}*/

export default async function SponsorDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'sponsor') {
    redirect('/');
  }

  const { campaigns, error } = await getSponsorCampaigns();

  return (
    <div className="space-y-6">
      <SponsorDashboardClient initialCampaigns={campaigns} loadError={error} />
    </div>
  );
}
