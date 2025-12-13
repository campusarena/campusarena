'use server';

import { hash } from 'bcrypt';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

/**
 * 🚨 Legacy placeholder: old "Stuff" endpoints
 * These functions stay temporarily to avoid breaking old imports,
 * but they no longer touch the database.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/** Legacy addStuff placeholder */
export async function addStuff(_stuff: {
  name: string;
  quantity: number;
  owner: string;
  condition: string;
}) {
  console.warn('addStuff() called — Stuff model removed. Redirecting to home.');
  redirect('/');
}

/** Legacy editStuff placeholder */
export async function editStuff(_stuff: {
  id: number;
  name: string;
  quantity: number;
  owner: string;
  condition: string;
}) {
  console.warn('editStuff() called — Stuff model removed. Redirecting to home.');
  redirect('/');
}

/** Legacy deleteStuff placeholder */
export async function deleteStuff(_id: number) {
  console.warn('deleteStuff() called — Stuff model removed. Redirecting to home.');
  redirect('/');
}

/* eslint-enable @typescript-eslint/no-unused-vars */

/* ============================================================
   AUTH: USERS
   ============================================================ */

/**
 * Creates a new user in the database.
 * Throws "EMAIL_TAKEN" or "NAME_TAKEN" for unique violations.
 */
export async function createUser(credentials: { email: string; password: string; name: string }) {
  const password = await hash(credentials.password, 10);

  try {
    await prisma.user.create({
      data: {
        email: credentials.email,
        password,
        name: credentials.name,
      },
    });
  } catch (err: unknown) {
    const e = err as { code?: string; meta?: { target?: string[] } };

    if (e.code === 'P2002') {
      const target = e.meta?.target ?? [];
      if (target.includes('email')) {
        throw new Error('EMAIL_TAKEN');
      }
      if (target.includes('name')) {
        throw new Error('NAME_TAKEN');
      }
    }
    throw err;
  }
}

/**
 * Update the logged-in user's profile (name + email).
 * `currentEmail` is used to locate the user row.
 * Throws "EMAIL_TAKEN" / "NAME_TAKEN" similar to createUser.
 */
export async function updateProfile(data: {
  currentEmail: string;
  newEmail: string;
  name: string;
}) {
  const { currentEmail, newEmail, name } = data;

  try {
    await prisma.user.update({
      where: { email: currentEmail },
      data: {
        email: newEmail,
        name,
      },
    });
  } catch (err: unknown) {
    const e = err as { code?: string; meta?: { target?: string[] } };

    if (e.code === 'P2002') {
      const target = e.meta?.target ?? [];
      if (target.includes('email')) {
        throw new Error('EMAIL_TAKEN');
      }
      if (target.includes('name')) {
        throw new Error('NAME_TAKEN');
      }
    }
    throw err;
  }
}

export async function changePassword(credentials: { email: string; password: string }) {
  const password = await hash(credentials.password, 10);
  await prisma.user.update({
    where: { email: credentials.email },
    data: { password },
  });
}

/* ============================================================
   TOURNAMENTS (CAMPUSARENA CORE)
   ============================================================ */

export async function createTournament(data: {
  name: string;
  game: string;
  supportedGameId?: number | null;
  seedBySkill?: boolean;
  isTeamBased: boolean;
  startDate: Date;
  endDate?: Date | null;
  maxParticipants?: number | null;
  location?: string | null;
}) {
  return prisma.tournament.create({
    data: {
      name: data.name,
      game: data.game,
      supportedGameId: data.supportedGameId ?? null,
      seedBySkill: data.seedBySkill ?? false,
      format: 'SINGLE_ELIM',
      isTeamBased: data.isTeamBased,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      status: 'upcoming',
      maxParticipants: data.maxParticipants ?? null,
      location: data.location ?? null,
    },
  });
}
