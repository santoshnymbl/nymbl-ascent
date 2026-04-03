import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nymbl Ascent",
  description: "Game-based candidate screening by Nymbl",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
