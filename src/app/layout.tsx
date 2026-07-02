import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import "./globals.css";
import Providers from "../components/Providers";
import Login from "../components/Login";

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
              <Link
                href="/invoices"
                className="text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Invoices
              </Link>
              <Link
                href="/clients"
                className="text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Clients
              </Link>
              <Link
                href="/suppliers"
                className="text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Suppliers
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Login />
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
            <Link
              href="/invoices"
              className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded text-sm font-medium"
            >
              Invoices
            </Link>
            <Link
              href="/clients"
              className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded text-sm font-medium"
            >
              Clients
            </Link>
            <Link
              href="/suppliers"
              className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded text-sm font-medium"
            >
              Suppliers
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
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
