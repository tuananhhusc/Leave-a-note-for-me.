import type { Metadata } from "next";
import { Quicksand, Caveat } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  variable: "--font-quicksand",
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Bức Tường Tương Lai YSOF — Hãy Để Lại Ký Ức Của Bạn",
  description:
    "Một bức tường kỹ thuật số nơi bạn có thể để lại những dòng ký ức, lời chúc và hy vọng cho tương lai YSOF. Viết một note và dán lên tường ngay!",
  keywords: ["YSOF", "tương lai", "ký ức", "note", "bức tường"],
  openGraph: {
    title: "Bức Tường Tương Lai YSOF",
    description:
      "Hãy để lại một mảnh ký ức cho YSOF trong tương lai 💙",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`h-full antialiased ${quicksand.variable} ${caveat.variable}`}>
      <body className="min-h-full flex flex-col">
        {/* Decorative background shapes */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)',
              animation: 'drift 20s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-1/3 -right-16 w-64 h-64 rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, #c7d2fe 0%, transparent 70%)',
              animation: 'drift 25s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, #fce7f3 0%, transparent 70%)',
              animation: 'drift 18s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #ddd6fe 0%, transparent 70%)',
              animation: 'drift 22s ease-in-out infinite reverse',
            }}
          />
        </div>
        
        {/* Main content layer */}
        <div className="relative z-10 flex flex-col flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
