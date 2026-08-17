import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';
import { COMPANY } from './company';
import { useSeo } from './useSeo';
import './landing.css';

export interface PageShellProps {
  children: ReactNode;
  contactEmail?: string;
  logoSrc?: string;
}

/**
 * The header and footer every page other than the landing page sits inside.
 * The landing page builds its own closing band, so it uses `SiteFooter`
 * directly rather than going through here.
 */
export default function PageShell({
  children,
  contactEmail = COMPANY.email,
  logoSrc = '/logo-mark.png',
}: PageShellProps) {
  const navigate = useNavigate();

  // Every page that sits in this shell is a public URL, so all of them need a
  // title and canonical of their own rather than the one baked into the HTML.
  useSeo();

  // Router navigation keeps the old scroll position, which lands you halfway
  // down a policy you have not started reading.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="summit-root min-h-screen overflow-x-hidden bg-[#eef2f8] font-sans text-[#0a1628] antialiased">
      <a href="#main" className="summit-skip">
        Skip to main content
      </a>

      <SiteNav
        demoHref="/login"
        onDemoClick={(event) => {
          event.preventDefault();
          navigate('/login');
        }}
        contactEmail={contactEmail}
        logoSrc={logoSrc}
        onNavigate={(to, event) => {
          event.preventDefault();
          navigate(to);
        }}
      />

      {/* tabIndex -1 so the skip link above actually moves focus here, rather
          than only scrolling — the same as the landing page's own main. */}
      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <SiteFooter
        logoSrc={logoSrc}
        onNavigate={(to, event) => {
          event.preventDefault();
          navigate(to);
        }}
      />
    </div>
  );
}
