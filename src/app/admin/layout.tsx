import { getServerSession } from 'next-auth';
import Container from 'react-bootstrap/Container';
import authOptions from '@/lib/authOptions';
import { adminProtectedPage } from '@/lib/page-protection';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  adminProtectedPage(
    session as unknown as {
      user: { email: string; id: string; randomKey: string };
    } | null
  );

  return (
    <div className="ca-section">
      <Container className="py-5">{children}</Container>
    </div>
  );
}
