// src/app/join/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/authOptions';
import JoinClient from '@/components/JoinClient';

export default async function JoinPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    // After login, send them back here
    redirect('/auth/signin?callbackUrl=/join');
  }

  return (
    <section className="ca-section">
      <div className="container d-flex justify-content-center">
        <JoinClient />
      </div>
    </section>
  );
}
