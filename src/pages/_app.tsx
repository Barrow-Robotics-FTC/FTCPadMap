import type { AppProps } from 'next/app'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FTC Pad Map",
  description: "Website to create a simple controller map diagram"
};

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme='dark' attribute='class'>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}