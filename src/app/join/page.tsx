import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/authOptions';
import JoinClient from '@/components/JoinClient';
import BackButton from "@/components/BackButton";

export default async function JoinPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/signin?callbackUrl=/join');
  }

  return (
    <section className="ca-section">
      <div className="container d-flex flex-column align-items-center">

        {/* This wrapper matches the card width */}
        <div className="w-100" style={{ maxWidth: "500px" }}>

          {/* Back button aligned to card’s left edge */}
<div className="mb-3">
  <BackButton />
</div>

          {/* Centered Join Card */}
          <JoinClient />

        </div>
      </div>
    </section>
  );
}
