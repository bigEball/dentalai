import PageShell from '../PageShell';
import { COMPANY } from '../company';
import { Doc, H1, H2, List, P, proseLink } from '../prose';

/**
 * The statement written about *this* site rather than a generic one — it names
 * the components that were actually fixed. Keep it that way: every claim below
 * is meant to be checkable against the page it sits on.
 */
const REVIEWED = '15 August 2026';

const TESTED = [
  'Every text and background pair on the page was measured for contrast against the 4.5:1 threshold for body text and 3:1 for interface components and state icons.',
  'The whole page was walked with the keyboard alone — tab order, the drop-down menus, the mobile menu, the accordions, and the four-part product stepper — to confirm that everything reachable with a mouse is reachable without one, and that focus is always visible and never gets stranded.',
  'Structure was checked for heading order, landmarks, alternative text, and the name/role/state exposed by each control.',
];

const FIXES: [string, string, string][] = [
  [
    'Captions, labels and the module ticker fell between 2.3:1 and 4.1:1 against their backgrounds',
    '1.4.3 Contrast (Minimum)',
    'Fixed',
  ],
  [
    'The keyboard focus ring measured 2.4:1 on white and was effectively invisible on the navy header',
    '1.4.11 Non-text Contrast',
    'Fixed',
  ],
  [
    'Four of the five drop-down menus could not be reached with a keyboard at all',
    '2.1.1 Keyboard',
    'Fixed — the down arrow now steps into an open menu, Escape steps back out',
  ],
  [
    "No way to skip the header's thirty-odd links and reach the page content",
    '2.4.1 Bypass Blocks',
    'Fixed — a skip link is the first thing in the tab order',
  ],
  [
    'The product stepper advanced on a timer under keyboard users, swapping out what they were reading',
    '2.2.2 Pause, Stop, Hide',
    'Fixed — it now pauses while focus is inside it, and stops for good once a moment is chosen',
  ],
  [
    "The headline's words were separated by a CSS margin rather than spaces, so they were announced and copied as one run-on word",
    '1.3.1 Info and Relationships',
    'Fixed',
  ],
  [
    'Expandable questions and menus did not say which region they controlled',
    '4.1.2 Name, Role, Value',
    'Fixed',
  ],
  ['Escape closed the mobile menu but left focus stranded', '2.4.3 Focus Order', 'Fixed'],
];

const LIMITS: [string, string][] = [
  [
    'No independent audit',
    'The assessment above is our own. We have not commissioned a third-party audit or published a VPAT.',
  ],
  [
    'Limited assistive-technology testing',
    'Testing was done against the specification and by keyboard. It has not yet been run end to end with VoiceOver, NVDA, and JAWS, which is the only way to catch some announcement problems.',
  ],
  [
    'Dividers and hairlines',
    'The thin rules that separate sections sit below 3:1. They are decorative — no information depends on seeing them — but they will be hard to make out in high-contrast conditions.',
  ],
  [
    'The product demo behind the sign-in',
    'This statement covers the public marketing site. The application itself has not yet been through the same review.',
  ],
  [
    'The animated instrument in the header',
    'It is decorative and hidden from screen readers, and it stops entirely when reduced motion is requested. It carries no information you would miss.',
  ],
];

export default function AccessibilityPage() {
  return (
    <PageShell>
      <Doc>
        <p className="text-[14px] uppercase tracking-[0.14em] text-[#5d6b80]">
          Last reviewed {REVIEWED}
        </p>
        <div className="mt-3">
          <H1>Accessibility statement</H1>
        </div>
        <P>
          We want this site to be usable by everyone who comes to it, including people who
          browse with a keyboard, a screen reader, a magnifier, or with motion and contrast
          preferences turned on. This page says what we have measured, what we found, and what
          is still outstanding.
        </P>

        <H2>Conformance</H2>
        <P>
          This site aims to conform to the{' '}
          <a
            href="https://www.w3.org/TR/WCAG21/"
            className={proseLink}
            target="_blank"
            rel="noreferrer"
          >
            Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
          </a>
          . WCAG 2.1 AA is the standard commonly used to judge whether a public-facing website
          meets the accessibility expectations of the Americans with Disabilities Act.
        </P>

        {/* Said plainly and up front, because the alternative — a badge implying
            certification — is the thing this paragraph exists to rule out. */}
        <p className="mt-5 border-l-2 border-[#0b6bcb] bg-[#f5f8fc] px-5 py-4">
          <span className="font-semibold text-[#0a1628]">This is a self-assessment.</span> We
          evaluated the site ourselves against the WCAG 2.1 AA success criteria and fixed what
          we found. No independent auditor has certified it, and there is no such thing as an
          official ADA certificate or seal for a website — no government body issues one. Any
          site displaying a badge that implies otherwise is describing its own testing, as we
          are here.
        </p>

        <H2>What we tested, and how</H2>
        <List>
          {TESTED.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>
            The page was checked with{' '}
            <code className="rounded bg-[#eef2f8] px-1.5 py-0.5 text-[14px]">
              prefers-reduced-motion
            </code>{' '}
            enabled and at 200% browser zoom.
          </li>
        </List>

        <H2>What we changed</H2>
        <P>Issues found in the August 2026 review and their resolution.</P>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-[#d8e1ed]">
                <th className="py-3 pr-4 font-semibold text-[#0a1628]">Issue</th>
                <th className="py-3 pr-4 font-semibold text-[#0a1628]">Criterion</th>
                <th className="py-3 font-semibold text-[#0a1628]">Status</th>
              </tr>
            </thead>
            <tbody>
              {FIXES.map(([issue, criterion, status]) => (
                <tr key={criterion + issue} className="border-b border-[#e4ebf4] align-top">
                  <td className="py-3 pr-4">{issue}</td>
                  <td className="whitespace-nowrap py-3 pr-4 text-[#5d6b80]">{criterion}</td>
                  <td className="py-3">{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2>Known limitations</H2>
        <P>We would rather list these than imply the site is finished.</P>
        <dl className="mt-4 space-y-5">
          {LIMITS.map(([term, detail]) => (
            <div key={term}>
              <dt className="font-semibold text-[#0a1628]">{term}</dt>
              <dd className="mt-1">{detail}</dd>
            </div>
          ))}
        </dl>

        <H2>Tell us if something does not work</H2>
        <P>
          If any part of this site gets in your way, we want to hear about it — that is more
          useful to us than any audit. Email{' '}
          <a href={`mailto:${COMPANY.email}`} className={proseLink}>
            {COMPANY.email}
          </a>{' '}
          and tell us what page you were on, what you were trying to do, and what you use to
          browse. We aim to reply within five working days.
        </P>

        <p className="mt-12 border-t border-[#d8e1ed] pt-6 text-[15px]">
          Reviewed August 2026 against WCAG 2.1 Level AA by {COMPANY.brand}.
        </p>
      </Doc>
    </PageShell>
  );
}
