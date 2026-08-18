import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Skibidi IELTS", template: "%s · Skibidi IELTS" },
  description: "Focused IELTS vocabulary and AI-assisted Writing feedback for learners progressing from Band 3.5 to 6.5+."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
