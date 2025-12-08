// src/app/invite/[token]/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { InvitationStatus } from '@prisma/client';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import InviteClient from '@/components/InviteClient';

type Props = {
  params: { token: string };
};

export default async function InvitePage({ params }: Props) {
  const token = params.token;

  // 1. Require login; if not logged in, go to sign-in then back to this invite
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/auth/signin?callbackUrl=/invite/${token}`);
  }

  // 2. Load invitation + tournament
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      tournament: true,
      invitedBy: true,
    },
  });

  if (!invitation) {
    return (
      <main className="ca-section">
        <div className="text-center text-white w-100">
          <h2>Invitation not found</h2>
          <p>This link might be invalid or expired.</p>
        </div>
      </main>
    );
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    return (
      <main className="ca-section">
        <div className="text-center text-white w-100">
          <h2>Invitation already used</h2>
          <p>Status: {invitation.status}</p>
        </div>
      </main>
    );
  }

  // 3. Render client-side accept/decline UI
  return (
    <main className="ca-section">
      <InviteClient invitation={invitation} />
    </main>
  );
}
