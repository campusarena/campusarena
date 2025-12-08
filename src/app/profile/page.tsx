// src/app/profile/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    // Not logged in → send to sign in
    redirect('/auth/signin');
  }

  const currentEmail = session.user.email;

  const user = await prisma.user.findUnique({
    where: { email: currentEmail },
    select: {
      email: true,
      name: true,
    },
  });

  if (!user) {
    // Shouldn’t happen, but just in case
    redirect('/');
  }

  return (
    <ProfileClient
      initialEmail={user.email}
      initialName={user.name ?? ''}
    />
  );
}
