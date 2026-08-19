import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Skibidi IELTS", template: "%s · Skibidi IELTS" },
  description: "IELTS vocabulary and AI-assisted Writing evaluation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
