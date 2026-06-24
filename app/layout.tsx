import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROVE Hire",
  description: "Internal recruiting workspace for ROVE"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
