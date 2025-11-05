import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BootstrapClient from "./BootstrapClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMOL - Twitter Engagement Growth Tracker",
  description: "Track Twitter engagement growth by monitoring projects and scoring users based on delta metrics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <BootstrapClient />
      </body>
    </html>
  );
}
