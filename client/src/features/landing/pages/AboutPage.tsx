import { Link } from 'react-router-dom';
import { ArrowRight, Gauge, Lightbulb, Timer, TrendingUp } from 'lucide-react';
import PageShell from '../PageShell';
import { COMPANY } from '../company';
import { Reveal } from '../motion';

const VALUES = [
  {
    icon: Lightbulb,
    title: 'Clarity first',
    desc: 'Plain language and tools your team can understand before a sales conversation.',
  },
  {
    icon: Timer,
    title: 'Less administrative strain',
    desc: 'Summit Tech is built to reduce repetitive front desk work so your team has more room for patients.',
  },
  {
    icon: TrendingUp,
    title: 'Measurable practice impact',
    desc: 'Focus on the work that affects recall, treatment follow-up, claims, collections, and daily production.',
  },
  {
    icon: Gauge,
    title: 'Operational calm',
    desc: 'Bring scheduling, follow-up, forms, reporting, and team visibility into a cleaner daily rhythm.',
  },
];

const STEPS = [
  {
    label: 'Map',
    title: 'Identify the bottleneck',
    desc: 'Start with the workflow that is costing the most time: clinical notes, front desk work, billing, or all three.',
  },
  {
    label: 'Connect',
    title: 'Run on your OpenDental',
    desc: 'Summit Tech reads from the chart you already run, works on top, and writes results back — your OpenDental stays the system of record.',
  },
  {
    label: 'Review',
    title: 'See it on a chart like yours',
    desc: 'We walk through Summit Tech during a demo so you can evaluate fit against your providers and workflows.',
  },
  {
    label: 'Expand',
    title: 'Add coverage as needed',
    desc: 'Start narrow, then turn on adjacent workflows when the team is ready for broader support.',
  },
];

const FITS = [
  {
    label: 'Private practices',
    desc: 'For offices that need more capacity without immediately adding another administrative hire.',
  },
  {
    label: 'Growing groups',
    desc: 'For multi-provider teams that need cleaner visibility and more consistent follow-through.',
  },
  {
    label: 'Busy front desks',
    desc: 'For teams managing repeatable operations, reporting, and accountability across the day.',
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <section className="bg-white px-6 pb-16 pt-32 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
              About {COMPANY.legalName}
            </p>
            <h1 className="mt-4 max-w-3xl text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.4rem]">
              Software that makes the dental office feel more organized, not more complicated.
            </h1>
            <p className="mt-6 max-w-2xl text-[18px] leading-8 text-[#4a5b73]">
              {COMPANY.legalName} builds practical software for dental offices that want a
              smoother day and a healthier schedule. We put AI around the real workflows that
              slow an office down: clinical notes, front desk support, billing, and complete
              practice operations.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f5f8fc] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="max-w-3xl">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
                Our mission
              </p>
              <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.6rem]">
                Help the team protect time, improve visibility, and keep patient care moving.
              </h2>
              <p className="mt-6 text-[17px] leading-8 text-[#4a5b73]">
                Summit Tech is built around practical dental operations: clear tools, consistent
                follow-through, and fewer loose ends at the front desk. The goal is bigger than
                any single feature. We want software that reduces the calls, checks, lists, and
                handoffs that slow the day down.
              </p>
              <p className="mt-5 text-[17px] leading-8 text-[#4a5b73]">
                The work that is easy to miss on a busy day is exactly the work that affects
                patient experience, production, collections, and staff time. Overdue recall,
                unscheduled treatment, missed claims, and billing gaps belong back in view, not
                lost on a sticky note. Summit Tech focuses on those operational gaps so your team can
                spend more time with patients and less time chasing tasks.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
              Core values
            </p>
            <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.6rem]">
              What we hold ourselves to.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, i) => {
              const Icon = value.icon;
              return (
                <Reveal key={value.title} delay={i * 80}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d0dbe9] text-[#0b6bcb]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold tracking-tight">{value.title}</h3>
                  <p className="mt-3 text-[16px] leading-7 text-[#4a5b73]">{value.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fc] px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
                How it works
              </p>
              <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.4rem]">
                Built around the job to be done, not a confusing feature list.
              </h2>
              <p className="mt-5 text-[17px] leading-7 text-[#4a5b73]">
                Summit Tech maps to a budget owner and a painful workflow: providers want better
                notes, the front desk wants fewer interruptions, and office managers want
                billing work under control.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.label} delay={i * 70}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5d6b80]">
                    {step.label}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d0dbe9] text-[14px] font-semibold text-[#0a1628]">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-[16px] leading-7 text-[#4a5b73]">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
                Why Summit Tech
              </p>
              <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.4rem]">
                For teams that want more capacity without more chaos.
              </h2>
              <p className="mt-5 text-[17px] leading-7 text-[#4a5b73]">
                Summit Tech is a fit when the practice needs a clear set of operational tools and
                room to turn on more as needs grow.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <div className="border-t border-[#d8e1ed]">
              {FITS.map((fit, i) => (
                <Reveal key={fit.label} delay={i * 70}>
                  <div className="grid gap-2 border-b border-[#d8e1ed] py-6 sm:grid-cols-[200px_1fr]">
                    <h3 className="text-[17px] font-semibold tracking-tight">{fit.label}</h3>
                    <p className="text-[16px] leading-7 text-[#4a5b73]">{fit.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fc] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.6rem]">
              Ready to see Summit Tech in your office?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[18px] leading-8 text-[#4a5b73]">
              Tell us a little about your practice and we will walk through Summit Tech on a chart
              that looks like yours.
            </p>
            <Link
              to="/contact"
              className="summit-cta summit-cta-primary mt-8 inline-flex items-center gap-2 rounded-full bg-[#0a1628] px-7 py-3.5 text-[17px] font-medium tracking-tight text-white"
            >
              Contact us
              <ArrowRight className="summit-cta-arrow h-[17px] w-[17px]" />
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
