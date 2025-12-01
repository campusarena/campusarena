'use server';

import { hash } from 'bcrypt';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

/**
 * 🚨 Legacy placeholder: old "Stuff" endpoints
 *
 * We keep these functions around so that any leftover components
 * importing addStuff / editStuff / deleteStuff do not cause build
 * errors. They no longer talk to the database and should be
 * removed/replaced once all old template UI is gone.
 */

/**
 * Legacy addStuff placeholder.
 * No longer writes to the database.
 */
export async function addStuff(_stuff: {
  name: string;
  quantity: number;
  owner: string;
  condition: string;
}) {
  console.warn('addStuff() was called, but the Stuff model has been removed. Redirecting to home.');
  redirect('/');
}

/**
 * Legacy editStuff placeholder.
 * No longer writes to the database.
 */
export async function editStuff(_stuff: {
  id: number;
  name: string;
  quantity: number;
  owner: string;
  condition: string;
}) {
  console.warn('editStuff() was called, but the Stuff model has been removed. Redirecting to home.');
  redirect('/');
}

/**
 * Legacy deleteStuff placeholder.
 * No longer writes to the database.
 */
export async function deleteStuff(_id: number) {
  console.warn('deleteStuff() was called, but the Stuff model has been removed. Redirecting to home.');
  redirect('/');
}

/* ============================================================
   AUTH: USERS
   ============================================================ */

/**
 * Creates a new user in the database.
 * Used by the Sign Up page.
 */
export async function createUser(credentials: { email: string; password: string }) {
  const password = await hash(credentials.password, 10);

  await prisma.user.create({
    data: {
      email: credentials.email,
      password,
      // role defaults to USER according to the Prisma schema
    },
  });
}

/**
 * Changes the password of an existing user in the database.
 */
export async function changePassword(credentials: { email: string; password: string }) {
  const password = await hash(credentials.password, 10);

  await prisma.user.update({
    where: { email: credentials.email },
    data: {
      password,
    },
  });
}

/* ============================================================
   TOURNAMENTS (CAMPUSARENA CORE)
   ============================================================ */

/**
 * Creates a new tournament/event.
 * This is a starting point for CampusArena; you can expand this
 * with more fields as your UI grows (e.g., description, rules, etc.).
 */
export async function createTournament(data: {
  name: string;
  game: string;
  isTeamBased: boolean;
  startDate: Date;
  endDate?: Date | null;
  maxParticipants?: number | null;
  location?: string | null;
}) {
  const tournament = await prisma.tournament.create({
    data: {
      name: data.name,
      game: data.game,
      format: 'SINGLE_ELIM', // for now, we only support single elimination
      isTeamBased: data.isTeamBased,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      status: 'upcoming',
      maxParticipants: data.maxParticipants ?? null,
      location: data.location ?? null,
    },
  });

  return tournament;
}
