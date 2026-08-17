import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import PageShell from '../PageShell';

export default function ThankYouPage() {
  return (
    <PageShell>
      <section className="bg-white px-6 pb-24 pt-40 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[2.4rem] font-semibold tracking-[-0.04em] sm:text-[3rem]">
            Thank you
          </h1>
          <p className="mt-5 text-[18px] leading-8 text-[#4a5b73]">
            Thank you for contacting us. Our team will review your request and get back to you
            shortly.
          </p>
          <Link
            to="/"
            className="summit-cta summit-cta-primary mt-9 inline-flex items-center gap-2 rounded-full bg-[#0a1628] px-7 py-3.5 text-[17px] font-medium tracking-tight text-white"
          >
            <Home className="h-[17px] w-[17px]" aria-hidden="true" />
            Back to Home
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
