/*
import { Stuff } from '@prisma/client';
import Link from 'next/link';

const StuffItem = ({ name, quantity, condition, id }: Stuff) => (
  <tr>
    <td>{name}</td>
    <td>{quantity}</td>
    <td>{condition}</td>
    <td>
      <Link href={`/edit/${id}`}>Edit</Link>
    </td>
  </tr>
);

export default StuffItem;

*/

import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { loggedInProtectedPage } from '@/lib/page-protection';

export default async function PlaceholderPage() {
  const session = await getServerSession(authOptions);

  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );

  return (
    <main className="container py-5 text-light">
      <h1>Coming Soon</h1>
      <p>This page is currently unimplemented and will be replaced with the correct CampusArena feature.</p>

      <div className="mt-3">
        <strong>Logged in as:</strong>{' '}
        {session?.user?.email ?? 'Unknown user'}
      </div>

      <p className="mt-4">
        If you reached this page through old template routes (add/list/edit stuff),
        they will be updated as the tournament features are implemented.
      </p>
    </main>
  );
}

