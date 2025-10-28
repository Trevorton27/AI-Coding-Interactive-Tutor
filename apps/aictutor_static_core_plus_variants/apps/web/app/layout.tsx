// apps/web/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Coding Tutor - Learn Web Development',
  description: 'Master web development through hands-on practice with AI-powered guidance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Optional: Add navigation bar here */}
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <a href="/" className="text-xl font-bold text-gray-900">
              🧠 AI Coding Tutor
            </a>
            <div className="flex gap-6">
              <a href="/learn" className="text-gray-600 hover:text-gray-900">
                Learn
              </a>
              <a href="/tasks" className="text-gray-600 hover:text-gray-900">
                Tasks
              </a>
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}