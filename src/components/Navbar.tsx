"use client";

import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  return (
    <Navbar expand="lg" className="ca-glass-nav">
      <Container>
        <Link
          href="/"
          className="navbar-brand fw-bold text-white text-decoration-none"
        >
          CampusArena
        </Link>

        <Navbar.Toggle aria-controls="nav" />
        <Navbar.Collapse id="nav" className="justify-content-end">
          {/* ---------- LEFT NAV LINKS ---------- */}
          <Nav className="me-auto">
            {/* Public links */}
            <Link href="/events" className="nav-link ca-nav-link">
              Events
            </Link>
            <Link href="/features" className="nav-link ca-nav-link">
              Features
            </Link>
            <Link href="/about" className="nav-link ca-nav-link">
              About
            </Link>
            <Link href="/dashboard" className="nav-link ca-nav-link">
              Dashboard
            </Link>
            <Link href="/event" className="nav-link ca-nav-link">
              Create Event
            </Link>
            <Link href="/standings" className="nav-link ca-nav-link">
              Standings
            </Link>
            <Link href="/match" className="nav-link ca-nav-link">
              Match
            </Link>
          </Nav>

          {/* ---------- AUTH CONTROLS (RIGHT SIDE) ---------- */}
          {!session && (
            <Nav className="d-flex align-items-center gap-2">
              <Link href="/auth/signin">
                <Button
                  variant="outline-light"
                  size="sm"
                  className="ca-glass-button"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  variant="light"
                  size="sm"
                  className="ca-solid-button"
                >
                  Sign up
                </Button>
              </Link>
            </Nav>
          )}

          {session && (
            <Nav>
              <NavDropdown
                align="end"
                title={<span className="text-white">{userEmail}</span>}
                id="user-dropdown"
                className="ca-nav-dropdown"
              >
                <NavDropdown.Item as={Link} href="/auth/change-password">
                  Change Password
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() =>
                    signOut({ callbackUrl: "/", redirect: true })
                  }
                  className="text-danger"
                >
                  Sign Out
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
