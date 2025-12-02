// src/app/dashboard/page.tsx

import DashboardClient from '@/components/dashboard/DashboardClient';
import { getDashboardDataForUser } from '@/lib/dashboardService';

export default async function DashboardPage() {
  // Later we'll pass the real user id (from session).
  const data = await getDashboardDataForUser(null);

  return <DashboardClient data={data} />;
}
