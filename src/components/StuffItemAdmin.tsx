/*
import { Stuff } from '@prisma/client';

const StuffItemAdmin = ({ name, quantity, condition, owner, id }: Stuff) => (
  <tr>
    <td>{name}</td>
    <td>{quantity}</td>
    <td>{condition}</td>
    <td>{owner}</td>
    <td>
      <a href={`/edit/${id}`}>Edit</a>
    </td>
  </tr>
);

export default StuffItemAdmin;
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

