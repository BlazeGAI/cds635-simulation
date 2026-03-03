import Link from 'next/link';
import './globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <p className="site-title">CDS635 Cyber Threat Intelligence Simulation</p>
            <nav aria-label="Main navigation">
              <Link href="/" className="nav-link">
                Home
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
