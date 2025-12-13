// src/lib/invitationActions.ts
'use server';

import { randomBytes } from 'crypto';
import { getServerSession } from 'next-auth';
import { InvitationStatus, EventRole, Role } from '@prisma/client';
import authOptions from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

const INVITE_EXPIRY_DAYS = 7;
const INVITE_EXPIRY_MS = INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

function getInvitationExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + INVITE_EXPIRY_MS);
}

function isInvitationExpired(createdAt: Date): boolean {
  return Date.now() > createdAt.getTime() + INVITE_EXPIRY_MS;
}

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
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });

  if (!tournament) {
    throw new Error('Event not found.');
  }

  if (tournament.status === 'completed') {
    throw new Error('Cannot generate invite codes for a completed event.');
  }

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
  const expiresAt = getInvitationExpiresAt(invite.createdAt);

  console.log(
    `Invite from ${inviterEmail} to ${email}: ${acceptUrl} (expires ${expiresAt.toISOString()})`,
  );

  return {
    ok: true,
    url: acceptUrl,
    expiresAt: expiresAt.toISOString(),
    message: `Invite link expires in ${INVITE_EXPIRY_DAYS} days (${expiresAt.toLocaleString()}).`,
  };
}

/**
 * Accept an invitation: link this user and add them as Participant (if not already).
 * Invitations are now reusable - multiple users can join with the same code.
 */
export async function acceptInvitation(token: string) {
  const { id: userId } = await requireUser();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new Error('Invitation not found.');
  }

  if (isInvitationExpired(invitation.createdAt)) {
    await prisma.invitation.update({
      where: { token },
      data: { status: InvitationStatus.EXPIRED, respondedAt: new Date() },
    });
    throw new Error('This invitation has expired.');
  }

  // Remove single-use restriction - invitations can be used multiple times
  // if (invitation.status !== InvitationStatus.PENDING) {
  //   throw new Error('This invitation is no longer valid.');
  // }

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

  if (existingParticipant) {
    throw new Error('You are already a participant in this tournament.');
  }

  // Auto-assign next available seed when a player joins via invite.
  const maxSeedRow = await prisma.participant.findFirst({
    where: { tournamentId: invitation.tournamentId },
    orderBy: { seed: 'desc' },
    select: { seed: true },
  });

  const nextSeed = (maxSeedRow?.seed ?? 0) + 1;

  await prisma.participant.create({
    data: {
      tournamentId: invitation.tournamentId,
      userId,
      seed: nextSeed,
    },
  });

  // Update invitation to track latest usage, but keep it reusable
  await prisma.invitation.update({
    where: { token },
    data: {
      status: InvitationStatus.ACCEPTED,
      respondedAt: new Date(),
      // Note: invitedUserId is not updated to allow reuse by multiple users
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

  if (isInvitationExpired(invitation.createdAt)) {
    await prisma.invitation.update({
      where: { token },
      data: { status: InvitationStatus.EXPIRED, respondedAt: new Date() },
    });
    throw new Error('This invitation has expired.');
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

  const expiresAt = getInvitationExpiresAt(invite.createdAt);

  return {
    ok: true,
    code: invite.token,
    expiresAt: expiresAt.toISOString(),
    message: `Join code expires in ${INVITE_EXPIRY_DAYS} days (${expiresAt.toLocaleString()}).`,
  };
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
