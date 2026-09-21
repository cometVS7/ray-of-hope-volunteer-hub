import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../components/Toast';

export const metadata: Metadata = {
  title: 'Ray of Hope — Volunteer Management System',
  description: 'Volunteer Management & Service Hours Verification Platform • Pune, Maharashtra',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#f7f9fc]">
      <body className="min-h-full flex flex-col text-slate-900 antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
