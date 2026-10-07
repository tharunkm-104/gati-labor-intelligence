import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Labor Market & Demand Intelligence Hub",
  description:
    "A filterable directory of official labor market, vacancy demand, and workforce mobility datasets."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
