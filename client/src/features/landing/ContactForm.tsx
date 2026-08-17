import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { COMPANY, SMS_CONSENT_LABEL, SMS_DISCLOSURE } from './company';
import { proseLink } from './prose';

const EMPTY = { name: '', email: '', practice: '', phone: '', message: '' };

const isEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

/**
 * Everything the visitor typed, as an email they can send themselves.
 *
 * This page is published as a static site on at least one host, where `/api/*`
 * is deliberately routed to a 404 so the app's mock-data fallback engages.
 * There is no backend there to take this form. Without a way out, a filled-in
 * enquiry ended at "please try again" and the lead was simply lost — the worst
 * possible failure on the one page whose entire job is collecting them.
 */
function mailtoFallback(form: typeof EMPTY, smsConsent: boolean) {
  const body = [
    `Name: ${form.name}`,
    `Practice: ${form.practice}`,
    `Email: ${form.email}`,
    form.phone ? `Phone: ${form.phone}` : null,
    smsConsent ? 'Consented to SMS: yes' : null,
    '',
    form.message || '(no message)',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return `mailto:${COMPANY.email}?subject=${encodeURIComponent(
    `Demo request — ${form.practice || form.name}`,
  )}&body=${encodeURIComponent(body)}`;
}

const field =
  'w-full rounded-lg border border-[#c8d5e6] bg-white px-3 py-2.5 text-[16px] text-[#0a1628] outline-none transition placeholder:text-[#8695ab] focus:border-[#0b6bcb] focus:ring-2 focus:ring-[#0b6bcb]/20';
const label = 'mb-1.5 block text-[15px] font-medium text-[#0a1628]';

export default function ContactForm({ source = 'contact' }: { source?: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [smsConsent, setSmsConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [undeliverable, setUndeliverable] = useState(false);

  function set(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setUndeliverable(false);

    if (!form.name.trim() || !form.email.trim() || !form.practice.trim()) {
      setError('Name, email, and practice are required.');
      return;
    }
    if (!isEmail(form.email)) {
      setError('Enter a valid email.');
      return;
    }
    // Consent to be texted at a number we do not have is not consent.
    if (smsConsent && !form.phone.trim()) {
      setError('To consent to text messages, please provide a phone number.');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/v1/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          practice: form.practice,
          phone: form.phone || null,
          message: form.message || null,
          source,
          smsConsent,
        }),
      });
      if (!response.ok) {
        setUndeliverable(true);
        return;
      }
    } catch {
      setUndeliverable(true);
      return;
    } finally {
      setSending(false);
    }

    navigate('/thank-you');
  }

  // The form succeeded at everything except reaching us. Rather than asking
  // someone to retype it into their mail client, hand it over already written.
  if (undeliverable) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-[#d8e1ed] bg-white p-6 shadow-[0_1px_2px_rgba(10,22,40,0.04)] sm:p-8"
      >
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0a1628]">
          We could not send that from here.
        </h2>
        <p className="mt-3 text-[16px] leading-7 text-[#4a5b73]">
          Nothing you typed is lost. Send it to us directly — the message below opens in your
          email with everything already filled in.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href={mailtoFallback(form, smsConsent)}
            className="summit-cta summit-cta-primary inline-flex items-center gap-2 rounded-full bg-[#0a1628] px-6 py-3 text-[16px] font-medium tracking-tight text-white"
          >
            Email it to us
            <ArrowRight className="summit-cta-arrow h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => setUndeliverable(false)}
            className="text-[16px] font-medium text-[#0a1628] underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Back to the form
          </button>
        </div>

        <p className="mt-6 text-[15px] leading-6 text-[#5d6b80]">
          Or reach us at{' '}
          <a href={`mailto:${COMPANY.email}`} className={proseLink}>
            {COMPANY.email}
          </a>{' '}
          and{' '}
          <a href={`tel:${COMPANY.phone.replace(/[^+\d]/g, '')}`} className={proseLink}>
            {COMPANY.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-2xl border border-[#d8e1ed] bg-white p-6 shadow-[0_1px_2px_rgba(10,22,40,0.04)] sm:p-8"
    >
      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-700"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={label}>
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            maxLength={200}
            value={form.name}
            onChange={set}
            aria-required="true"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="contact-practice" className={label}>
            Office/Practice Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-practice"
            name="practice"
            type="text"
            maxLength={200}
            value={form.practice}
            onChange={set}
            aria-required="true"
            className={field}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-email" className={label}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            maxLength={320}
            value={form.email}
            onChange={set}
            aria-required="true"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className={label}>
            Phone
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            maxLength={40}
            value={form.phone}
            onChange={set}
            className={field}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message" className={label}>
          What can we help with?
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          maxLength={2000}
          value={form.message}
          onChange={set}
          placeholder="For example: notes after hygiene visits, missed calls, pre-auth tracking, claims, or front desk workload."
          className={`${field} resize-none`}
        />
      </div>

      {/* Unchecked by default and never pre-ticked — an A2P campaign is
          rejected if consent is bundled into the submit button. */}
      <label className="mt-5 flex items-start gap-3 text-[15px] leading-6 text-[#4a5b73]">
        <input
          type="checkbox"
          name="smsConsent"
          checked={smsConsent}
          onChange={(event) => setSmsConsent(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-[#c8d5e6] accent-[#0b6bcb]"
        />
        <span>{SMS_CONSENT_LABEL}</span>
      </label>

      <p className="mt-4 text-[13px] leading-5 text-[#5d6b80]">
        By submitting this form you agree to our{' '}
        <Link to="/privacy" className={proseLink}>
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link to="/terms" className={proseLink}>
          Terms of Service
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={sending}
        className="summit-cta summit-cta-primary mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0a1628] px-5 py-3.5 text-[16px] font-medium tracking-tight text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? 'Sending...' : 'Send message'}
        {!sending && <ArrowRight className="summit-cta-arrow h-4 w-4" />}
      </button>

      <p className="mt-4 text-[13px] leading-5 text-[#5d6b80]">{SMS_DISCLOSURE}</p>
    </form>
  );
}
