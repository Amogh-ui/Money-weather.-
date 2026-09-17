import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Money Weather",
  description: "See what is safe to use and whether your UPI spending is moving faster than your week.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
