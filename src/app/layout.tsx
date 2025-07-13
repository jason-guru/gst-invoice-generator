import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GST Invoice Generator",
  description: "Generate GST tax invoices and RCM self-invoices",
};

// Navigation component
const Navigation = () => (
  <nav className="bg-white border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-8">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Invoice Generator</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/" 
                className="text-gray-900 hover:bg-gray-50 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                GST Invoice
              </Link>
              <Link 
                href="/rcm" 
                className="text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                RCM Self-Invoice
              </Link>
            </div>
          </div>
        </div>
        {/* Mobile menu button - you can expand this later */}
        <div className="md:hidden">
          <div className="flex space-x-2">
            <Link 
              href="/" 
              className="text-gray-900 hover:text-blue-600 px-2 py-1 rounded text-sm font-medium"
            >
              Home
            </Link>
            <Link 
              href="/rcm" 
              className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded text-sm font-medium"
            >
              RCM
            </Link>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
