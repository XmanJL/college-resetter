import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reset Room | Make space for one next thing",
  description: "A private reset space for college overwhelm.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
