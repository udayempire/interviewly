import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ReactQueryProvider } from "./ReactQueryProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://interviewlyy.xyz"),
  title: {
    default: "Interviewlyy - AI Voice Interviews for Candidates & Hiring Teams",
    template: "%s | Interviewlyy",
  },
  description:
    "AI-powered voice interview platform. Candidates: practice with personalized questions from your resume & GitHub. Hiring teams: screen candidates with structured AI interviews, get detailed reports, and make better hiring decisions.",
  keywords: [
    // Candidate-focused
    "AI interview practice",
    "voice interview",
    "mock interview",
    "interview preparation",
    "AI interviewer",
    "technical interview practice",
    "behavioral interview",
    "resume-based interview",
    // Hiring/B2B-focused
    "candidate screening tool",
    "AI hiring tool",
    "automated interview platform",
    "interview assessment software",
    "AI candidate screening",
    "structured interview tool",
    "hiring interview automation",
    "technical screening platform",
    "pre-screening interview",
    "recruitment AI tool",
    "interview report",
    "interviewlyy",
  ],
  authors: [{ name: "Interviewlyy" }],
  creator: "Interviewlyy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://interviewlyy.xyz",
    siteName: "Interviewlyy",
    title: "Interviewlyy — AI Voice Interviews for Candidates & Hiring Teams",
    description:
      "Practice interviews or screen candidates with AI-powered voice conversations. Personalized questions from resumes, projects & GitHub. Structured reports for better hiring decisions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interviewlyy — AI Voice Interviews for Candidates & Hiring Teams",
    description:
      "Practice interviews or screen candidates with AI voice conversations. Personalized questions, structured reports, better hiring decisions.",

  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://interviewlyy.xyz",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        {/* Inline script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
