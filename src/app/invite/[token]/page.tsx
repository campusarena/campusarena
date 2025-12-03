// src/app/invite/[token]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

type PageProps = {
  params: { token: string };
};

export default async function AcceptInvitePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  // If not logged in, send them to sign-in, then back here.
  if (!email) {
    const callbackUrl = encodeURIComponent(`/invite/${params.token}`);
    redirect(`/auth/signin?callbackUrl=${callbackUrl}`);
  }

  // Look up the invitation by token
  const invite = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: {
      tournament: true,
    },
  });

  if (!invite) {
    return notFound();
  }

  // Only allow pending invites
  if (invite.status !== 'PENDING') {
    // Later you can render a nicer "Invite already used / expired" page.
    return notFound();
  }

  // Safety: make sure the invite was actually sent to this email
  if (invite.invitedEmail !== email) {
    // You could show a "this invite isn't for you" page instead.
    return notFound();
  }

  // Get or create the user (should already exist, but just in case)
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // This should basically never happen if auth is working, but be safe:
    return notFound();
  }

  // Check if already a participant in this tournament
  const existingParticipant = await prisma.participant.findFirst({
    where: {
      tournamentId: invite.tournamentId,
      userId: user.id,
    },
  });

  if (!existingParticipant) {
    await prisma.participant.create({
      data: {
        tournamentId: invite.tournamentId,
        userId: user.id,
        // seed can be set later by organizer
      },
    });
  }

  // Mark invite as accepted
  await prisma.invitation.update({
    where: { id: invite.id },
    data: {
      status: 'ACCEPTED',
      respondedAt: new Date(),
      invitedUserId: user.id,
    },
  });

  // Finally, send them to the event page (adjust path to match your routing)
  redirect(`/events/${invite.tournamentId}`);
}
