/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { BoxArrowRight, Lock, PersonFill, PersonPlusFill } from 'react-bootstrap-icons';

const NavBar: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email;
  const userWithRole = session?.user as { email: string; randomKey: string };
  const role = userWithRole?.randomKey;
  const pathName = usePathname();
  return (
    <Navbar expand="lg" className="campus-arena-navbar">
      <div className="campus-arena-nav-content">
        <Navbar.Brand href="/" className="campus-arena-brand">
          CampusArena
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="campus-arena-nav-links">
            {currentUser ? (
              <>
                <Nav.Link href="/" active={pathName === '/'} className="campus-nav-link">
                  Dashboard
                </Nav.Link>
                <Nav.Link href="/events" active={pathName === '/events'} className="campus-nav-link">
                  Events
                </Nav.Link>
                <Nav.Link href="/create-event" active={pathName === '/create-event'} className="campus-nav-link">
                  Create Event
                </Nav.Link>
                {role === 'ADMIN' && (
                  <Nav.Link href="/admin" active={pathName === '/admin'} className="campus-nav-link">
                    Admin
                  </Nav.Link>
                )}
              </>
            ) : (
              <>
                <Nav.Link href="/" active={pathName === '/'} className="campus-nav-link">
                  Dashboard
                </Nav.Link>
                <Nav.Link href="/events" className="campus-nav-link">
                  Events
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav className="ms-auto">
            {session ? (
              <NavDropdown id="login-dropdown" title="Profile" className="campus-nav-link">
                <NavDropdown.Item href="/profile">
                  <PersonFill /> {currentUser}
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item id="login-dropdown-change-password" href="/auth/change-password">
                  <Lock /> Change Password
                </NavDropdown.Item>
                <NavDropdown.Item id="login-dropdown-sign-out" href="/api/auth/signout">
                  <BoxArrowRight /> Sign Out
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown id="login-dropdown" title="Login" className="campus-nav-link">
                <NavDropdown.Item id="login-dropdown-sign-in" href="/auth/signin">
                  <PersonFill /> Sign in
                </NavDropdown.Item>
                <NavDropdown.Item id="login-dropdown-sign-up" href="/auth/signup">
                  <PersonPlusFill /> Sign up
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};

export default NavBar;
