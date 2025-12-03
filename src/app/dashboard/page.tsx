// src/app/dashboard/page.tsx

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import DashboardClient from '@/components/dashboard/DashboardClient';
import { getDashboardDataForUser } from '@/lib/dashboardService';
import authOptions from '@/lib/authOptions';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // We know from authOptions callbacks that we attach `id` to the user.
  const typedUser = session.user as { id?: string | number; email?: string | null };

  if (!typedUser.id) {
    // If somehow missing, treat as unauthenticated for safety.
    redirect('/auth/signin');
  }

  const userId = Number(typedUser.id);

  const data = await getDashboardDataForUser(userId);

  return <DashboardClient data={data} />;
}
