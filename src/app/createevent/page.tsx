// src/app/createevent/page.tsx
import { prisma } from '@/lib/prisma';
import CreateEventClient from '@/app/createevent/CreateEventClient';

export const dynamic = 'force-dynamic';

export default async function CreateEventPage() {
  const supportedGames = await prisma.game.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <CreateEventClient supportedGames={supportedGames} />
  );
}
