import type { MouseEvent, ReactNode } from 'react';
import { COMPANY, COMPANY_LINKS, LEGAL_LINKS, SMS_DISCLOSURE } from './company';

/**
 * Called before the browser follows one of the footer's internal links. A host
 * with a router calls `preventDefault()` and navigates itself; the standalone
 * landing project passes nothing and the plain anchors work as they are.
 */
export type NavigateHandler = (
  to: string,
  event: MouseEvent<HTMLAnchorElement>,
) => void;

export interface SiteFooterProps {
  logoSrc?: string;
  /**
   * Rendered above the footer proper, inside the same dark band. The landing
   * page passes its closing call to action here so the close and the footer
   * share one floor instead of costing two screens of scrolling.
   */
  top?: ReactNode;
  onNavigate?: NavigateHandler;
}

const columnLink = 'text-[14px] text-white/60 transition-colors duration-300 hover:text-white';

/** Declared at module scope so it keeps its identity across renders. */
function Link({
  to,
  className,
  children,
  onNavigate,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  onNavigate?: NavigateHandler;
}) {
  return (
    <a href={to} className={className} onClick={(event) => onNavigate?.(to, event)}>
      {children}
    </a>
  );
}

export default function SiteFooter({
  logoSrc = '/logo-mark.png',
  top,
  onNavigate,
}: SiteFooterProps) {
  return (
    <footer
      className={`summit-footer relative overflow-hidden bg-[#0a1628] px-6 pb-12 text-white ${
        top ? 'pt-20 sm:pt-24' : 'pt-16'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 50% 0%, rgba(11,107,203,0.35) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        {top}

        <div
          className={`grid gap-10 sm:grid-cols-2 lg:grid-cols-12 ${
            top ? 'mt-20 border-t border-white/10 pt-12' : ''
          }`}
        >
          <div className="lg:col-span-6">
            <div className="flex items-center gap-2.5">
              <img src={logoSrc} alt="" className="h-6 w-auto object-contain" />
              <span className="text-[16px] font-semibold tracking-tight">
                {COMPANY.legalName}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-[14px] leading-6 text-white/60">
              {COMPANY.tagline}
            </p>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Company
            </h3>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={columnLink} onNavigate={onNavigate}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={columnLink} onNavigate={onNavigate}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Registered address, email and phone on one line. Carriers reviewing
            an A2P campaign look for exactly this next to the policy links. */}
        <p className="mt-12 border-t border-white/10 pt-8 text-[14px] leading-6 text-white/60">
          {COMPANY.address}
          {' · '}
          <a
            href={`mailto:${COMPANY.email}`}
            className="transition-colors duration-300 hover:text-white"
          >
            {COMPANY.email}
          </a>
          {' · '}
          <a
            href={`tel:${COMPANY.phone.replace(/[^+\d]/g, '')}`}
            className="transition-colors duration-300 hover:text-white"
          >
            {COMPANY.phone}
          </a>
        </p>

        <div className="mt-4 flex flex-col items-start justify-between gap-3 text-[14px] text-white/60 sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
          </span>
          <Link to="/login" className="transition-colors duration-300 hover:text-white" onNavigate={onNavigate}>
            Demo access
          </Link>
        </div>

        <p className="mt-8 max-w-3xl text-[13px] leading-5 text-white/45">
          {SMS_DISCLOSURE} See our{' '}
          <Link to="/privacy" className="underline transition-colors duration-300 hover:text-white" onNavigate={onNavigate}>
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link to="/terms" className="underline transition-colors duration-300 hover:text-white" onNavigate={onNavigate}>
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
