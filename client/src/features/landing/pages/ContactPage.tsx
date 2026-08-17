import { Building2, Mail, MapPin, Phone } from 'lucide-react';
import PageShell from '../PageShell';
import ContactForm from '../ContactForm';
import { COMPANY } from '../company';
import { Reveal } from '../motion';

const DETAILS = [
  { icon: Building2, label: 'Business', value: COMPANY.legalName },
  { icon: MapPin, label: 'Address', value: COMPANY.address },
  { icon: Phone, label: 'Phone', value: COMPANY.phone, href: `tel:${COMPANY.phone.replace(/[^+\d]/g, '')}` },
  { icon: Mail, label: 'Email', value: COMPANY.email, href: `mailto:${COMPANY.email}` },
];

export default function ContactPage() {
  return (
    <PageShell>
      <section className="bg-white px-6 pb-16 pt-32 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
              Contact
            </p>
            <h1 className="mt-4 max-w-3xl text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.4rem]">
              Talk to {COMPANY.brand}.
            </h1>
            <p className="mt-6 max-w-2xl text-[18px] leading-8 text-[#4a5b73]">
              Tell us a little about your office. We will walk through Summit Tech and the rollout
              that fits your providers, locations, integrations, and workflow priorities.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f5f8fc] px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <Reveal>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
                Get in touch
              </p>
              <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.4rem]">
                Reach our team.
              </h2>
              <p className="mt-4 text-[17px] leading-7 text-[#4a5b73]">
                Send us your details and we will follow up to schedule a walkthrough.
              </p>

              <dl className="mt-8 divide-y divide-[#d8e1ed] border-y border-[#d8e1ed]">
                {DETAILS.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <div key={detail.label} className="flex items-start gap-4 py-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d0dbe9] text-[#0b6bcb]">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </div>
                      <div>
                        <dt className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5d6b80]">
                          {detail.label}
                        </dt>
                        <dd className="mt-1 text-[16px] leading-6">
                          {detail.href ? (
                            <a
                              href={detail.href}
                              className="transition-opacity hover:opacity-70"
                            >
                              {detail.value}
                            </a>
                          ) : (
                            detail.value
                          )}
                        </dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={100}>
              <ContactForm source="contact" />
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
