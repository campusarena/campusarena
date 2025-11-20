import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

import Providers from "./providers";
import NavBar from "@/components/Navbar";

export const metadata = {
  title: "CampusArena",
  description: "Campus recreation and esports leagues and tournaments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="ca-body">
        <Providers>
          <NavBar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
