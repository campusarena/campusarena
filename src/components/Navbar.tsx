"use client";

import { Navbar, Nav, Container, Button } from "react-bootstrap";
import Link from "next/link";

export default function NavBar() {
  return (
    <Navbar expand="lg" className="ca-glass-nav">
      <Container>
        <Link href="/" className="navbar-brand fw-bold text-white text-decoration-none">
          CampusArena
        </Link>
        <Navbar.Toggle aria-controls="nav" />
        <Navbar.Collapse id="nav" className="justify-content-end">
          <Nav className="me-2">
            <Link href="/events" className="nav-link ca-nav-link">
              Events
            </Link>
            <Link href="/features" className="nav-link ca-nav-link">
              Features
            </Link>
            <Link href="/about" className="nav-link ca-nav-link">
              About
            </Link>
          </Nav>
          <div className="d-flex gap-2">
            <Link href="/auth/signin">
              <Button variant="outline-light" size="sm" className="ca-glass-button">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="light" size="sm" className="ca-solid-button">
                Get started
              </Button>
            </Link>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
