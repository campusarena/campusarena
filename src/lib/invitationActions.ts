// src/lib/invitationActions.ts
'use server';

import { randomBytes } from 'crypto';
import { getServerSession } from 'next-auth';
import { InvitationStatus, EventRole, Role } from '@prisma/client';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

/** Helper: get current user id + email or throw */
async function requireUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const rawId = (session?.user as { id?: string | number } | undefined)?.id;

  if (!email || rawId == null) {
    throw new Error('Not authenticated.');
  }

  const id = typeof rawId === 'string' ? Number(rawId) : rawId;

  if (!id || Number.isNaN(id)) {
    console.error('requireUser: invalid id from session', { rawId });
    throw new Error('Invalid user id in session.');
  }

  return { id, email };
}

/** Helper: ensure user is OWNER or ORGANIZER for a tournament */
async function requireOrganizerForTournament(tournamentId: number, userId: number) {
  // 1) Load the user record
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error('requireOrganizerForTournament: user not found', { userId });
    throw new Error('User not found.');
  }

  // 2) Global admin override
  if (user.role === Role.ADMIN) {
    return;
  }

  // 3) Check OWNER / ORGANIZER role assignment for this tournament
  const assignment = await prisma.eventRoleAssignment.findFirst({
    where: {
      tournamentId,
      userId,
      role: { in: [EventRole.OWNER, EventRole.ORGANIZER] },
    },
  });

  if (!assignment) {
    console.error('requireOrganizerForTournament: no role row found', {
      tournamentId,
      userId,
    });
    throw new Error('You do not have permission to manage invitations for this event.');
  }
}


/**
 * Create an invitation for a given tournament + email.
 * Returns { ok, url } where url is /invite/<token>.
 */
export async function sendEventInvite(tournamentId: number, email: string) {
  const { id: inviterId, email: inviterEmail } = await requireUser();

  // Optional: check they are organizer/owner for this tournament
  await requireOrganizerForTournament(tournamentId, inviterId);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  const token = randomBytes(32).toString('hex');

  const invite = await prisma.invitation.create({
    data: {
      tournamentId,
      invitedById: inviterId,
      invitedEmail: email,
      invitedUserId: existingUser?.id ?? null,
      token,
      status: InvitationStatus.PENDING,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const acceptUrl = `${baseUrl}/invite/${invite.token}`;

  console.log(`Invite from ${inviterEmail} to ${email}: ${acceptUrl}`);

  return { ok: true, url: acceptUrl };
}

/**
 * Accept an invitation: link this user and add them as Participant (if not already).
 */
export async function acceptInvitation(token: string) {
  const { id: userId } = await requireUser();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new Error('Invitation not found.');
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new Error('This invitation is no longer valid.');
  }

  // Optional: enforce email match
  // const session = await getServerSession(authOptions);
  // if (session?.user?.email && session.user.email !== invitation.invitedEmail) {
  //   throw new Error('This invite was not sent to your email.');
  // }

  // Ensure user is not already a participant
  const existingParticipant = await prisma.participant.findFirst({
    where: {
      tournamentId: invitation.tournamentId,
      userId,
    },
  });

  if (!existingParticipant) {
    await prisma.participant.create({
      data: {
        tournamentId: invitation.tournamentId,
        userId,
      },
    });
  }

  await prisma.invitation.update({
    where: { token },
    data: {
      status: InvitationStatus.ACCEPTED,
      invitedUserId: userId,
      respondedAt: new Date(),
    },
  });
}

/**
 * Decline an invitation (no participant created).
 */
export async function declineInvitation(token: string) {
  const { id: userId } = await requireUser();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new Error('Invitation not found.');
  }

  await prisma.invitation.update({
    where: { token },
    data: {
      status: InvitationStatus.DECLINED,
      invitedUserId: userId,
      respondedAt: new Date(),
    },
  });
}

/**
 * Generate a generic join code for a tournament (no email required).
 * Organizer/owner only.
 */
export async function generateEventJoinCode(tournamentId: number) {
  const { id: inviterId } = await requireUser();
  await requireOrganizerForTournament(tournamentId, inviterId);

  const token = randomBytes(8).toString('hex');

  const invite = await prisma.invitation.create({
    data: {
      tournamentId,
      invitedById: inviterId,
      invitedEmail: 'code-only',
      invitedUserId: null,
      token,
    },
  });

  return { ok: true, code: invite.token };
}


/**
 * Accept invitation by code (used on /join).
 * Just calls the same logic as acceptInvitation(token).
 */
export async function acceptInvitationByCode(code: string) {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new Error('Code is required.');
  }
  await acceptInvitation(trimmed);
}
