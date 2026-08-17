/**
 * The company's legal identity, written once.
 *
 * The footer, the privacy policy, the terms, the accessibility statement and
 * the SMS disclosures all print these values. A carrier reviewing an A2P
 * registration compares the address and phone on the policy page against the
 * ones in the footer, so they cannot be allowed to drift apart — hence one
 * source rather than a string per page.
 */
export const COMPANY = {
  /** What the company is called. Used everywhere except the places below. */
  brand: 'Summit Tech',
  /**
   * The registered entity. Only where the entity is what matters: the footer's
   * copyright and address block, the privacy policy, and the terms — these are
   * what an A2P messaging registration is checked against, so they carry the
   * full legal form rather than the short brand.
   */
  legalName: 'SUMMIT TECH LLC',
  domain: 'summitaisoftware.com',
  url: 'https://summitaisoftware.com',
  email: 'contact@summitaisoftware.com',
  phone: '+1 435-900-8455',
  address: '1255 E 200 S, Apt 9, Salt Lake City, UT 84102',
  effectiveDate: 'June 15, 2026',
  tagline:
    'The AI operating layer that runs on top of your OpenDental — and writes everything back into the chart.',
} as const;

/**
 * The label beside the opt-in checkbox on the contact form. This is the
 * consent language itself — the thing the box being ticked agrees to — so it
 * has to name the sender, the message types, and both keywords.
 */
export const SMS_CONSENT_LABEL =
  'I consent to receive marketing text messages, about offers and service updates from SUMMIT TECH LLC at the phone number provided. Message frequency may vary. Message & data rates may apply. Text HELP for assistance, reply STOP to opt out.';

/**
 * The disclosure printed under the form and again in the footer. Shorter than
 * the checkbox label because it restates the terms rather than collecting
 * agreement to them.
 */
export const SMS_DISCLOSURE =
  'By opting in to text messages above, you consent to receive SMS from SUMMIT TECH LLC at the number provided. Message & data rates may apply. Reply STOP to unsubscribe, HELP for help.';

export const COMPANY_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Contact', to: '/contact' },
] as const;

export const LEGAL_LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Accessibility', to: '/accessibility' },
] as const;
