import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import NavBar from "@/components/Navbar";

export const metadata = {
  title: "CampusArena",
  description: "Campus recreation and esports leagues and tournaments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="ca-body">
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}