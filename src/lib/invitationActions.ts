'use server';

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';

export async function sendEventInvite(tournamentId: number, email: string) {
  const session = await getServerSession(authOptions);
  const currentEmail = session?.user?.email;
  if (!currentEmail) throw new Error('Not authenticated');

  const inviter = await prisma.user.findUnique({ where: { email: currentEmail } });
  if (!inviter) throw new Error('Inviter not found');

  // Optional: check inviter is OWNER/ORGANIZER for this event via EventRoleAssignment

  const existingUser = await prisma.user.findUnique({ where: { email } });

  const token = randomBytes(32).toString('hex');

  const invite = await prisma.invitation.create({
    data: {
      tournamentId,
      invitedById: inviter.id,
      invitedEmail: email,
      invitedUserId: existingUser?.id ?? null,
      token,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const acceptUrl = `${baseUrl}/invite/${invite.token}`;

  // For now, just log it. Later: send via email or copy-to-clipboard in UI.
  console.log('Invite URL:', acceptUrl);

  return { ok: true, url: acceptUrl };
}
