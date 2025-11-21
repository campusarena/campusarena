import { getServerSession } from 'next-auth';
import authOptions from '@/lib/authOptions';
import { loggedInProtectedPage } from '@/lib/page-protection';
import { Container } from 'react-bootstrap';

const Events = async () => {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );
  
  return (
    <main>
      <Container className="py-4">
        <h1>Events</h1>
        <p>Event listing page coming soon...</p>
      </Container>
    </main>
  );
};

export default Events;
