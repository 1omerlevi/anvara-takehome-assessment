import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/auth-helpers';
import { getPublisherAdSlots } from './actions';
import { PublisherDashboardClient } from './components/publisher-dashboard-client';


export default async function PublisherDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  // Verify user has 'publisher' role
  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'publisher') {
    redirect('/');
  }

  const { adSlots, error } = await getPublisherAdSlots();

  return (
    <div className="space-y-6">
      <PublisherDashboardClient initialAdSlots={adSlots} loadError={error} />
    </div>
  );
}

