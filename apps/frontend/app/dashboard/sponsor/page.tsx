import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserRole, type RoleData } from '@/lib/auth-helpers';
import { CampaignList } from './components/campaign-list';
import { getSponsorCampaigns } from './actions';

const REQUEST_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    }),
  ]);
}

export default async function SponsorDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  let roleData: RoleData;
  try {
    roleData = await withTimeout(getUserRole(session.user.id), REQUEST_TIMEOUT_MS);
  } catch {
    return <CampaignList campaigns={[]} error="Failed to load campaigns" />;
  }

  if (roleData.role !== 'sponsor' || !roleData.sponsorId) {
    redirect('/');
  }

  const { campaigns, error } = await getSponsorCampaigns(roleData.sponsorId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Campaigns</h1>
        {/* TODO: Add CreateCampaignButton here */}
      </div>

      <CampaignList campaigns={campaigns} error={error} />
    </div>
  );
}
