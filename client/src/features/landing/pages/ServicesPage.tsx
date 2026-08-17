import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CreditCard,
  FileCheck2,
  FileText,
  LineChart,
  MessageSquare,
  Mic,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import PageShell from '../PageShell';
import { Reveal } from '../motion';

const CORE = [
  {
    icon: FileText,
    title: 'Patient intake + scheduling portal',
    desc: 'A no-login intake and scheduling page on your own branded, per-office address. Patients fill forms and request times; on staff accept, Summit Tech can create the patient, book the OpenDental appointment, and file the completed form PDF to the chart.',
  },
  {
    icon: Mic,
    title: 'AI clinical notes',
    desc: 'Record or dictate; Summit Tech drafts the SOAP note, a person reviews and approves, and it writes back to OpenDental as a procedure note — with a signed attestation trail.',
  },
  {
    icon: RefreshCw,
    title: 'Two-way OpenDental writeback',
    desc: 'Summit Tech reads from the chart you already run, works on top, and writes results back. Your OpenDental stays the system of record — the through-line under every workflow.',
  },
  {
    icon: Activity,
    title: 'Patient retention & recovery',
    desc: 'Churn scoring surfaces at-risk patients with one-click email, call, or offer outreach. Every action a person takes is logged back to OpenDental.',
  },
  {
    icon: BarChart3,
    title: 'Fee & PPO analytics',
    desc: 'Write-off recapture and renegotiation briefs built from your own production — so fee work is grounded in what the office actually bills.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance autopilot',
    desc: 'A living, jurisdiction-aware regulatory checklist — daily sterilizer logs to annual reviews — so nothing lapses.',
  },
];

const REST = [
  {
    icon: MessageSquare,
    title: 'Communications hub',
    desc: 'Patient messages and follow-up in one place, reviewed by a person before anything goes out.',
  },
  {
    icon: LineChart,
    title: 'Reports & analytics',
    desc: 'Production, recall, and follow-up work pulled together so the day is easier to read.',
  },
  {
    icon: CreditCard,
    title: 'Billing & dunning',
    desc: 'Billing queues and payment follow-up kept visible before they become collections work.',
  },
  {
    icon: FileCheck2,
    title: 'Claim reviewer',
    desc: 'Scrub claims and narratives before they leave for OpenDental.',
  },
  {
    icon: Users,
    title: 'Team roles & permissions',
    desc: 'Scoped access so each person sees and approves the work that is theirs.',
  },
];

function Card({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof FileText;
  title: string;
  desc: string;
}) {
  return (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d0dbe9] text-[#0b6bcb]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-[18px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-[16px] leading-7 text-[#4a5b73]">{desc}</p>
    </>
  );
}

export default function ServicesPage() {
  return (
    <PageShell>
      <section className="bg-white px-6 pb-16 pt-32 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0b6bcb]">
              Product
            </p>
            <h1 className="mt-4 max-w-3xl text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.4rem]">
              One AI operating layer for your dental practice.
            </h1>
            <p className="mt-6 max-w-2xl text-[18px] leading-8 text-[#4a5b73]">
              Summit Tech runs on top of the OpenDental you already use — drafting notes, filling the
              schedule, recovering revenue — and writes it all back into the chart. Your team
              reviews and approves every action before it touches a patient record.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                to="/login"
                className="summit-cta summit-cta-primary inline-flex items-center gap-2 rounded-full bg-[#0a1628] px-7 py-3.5 text-[17px] font-medium tracking-tight text-white"
              >
                Open the live demo
                <ArrowRight className="summit-cta-arrow h-[17px] w-[17px]" />
              </Link>
              <Link
                to="/contact"
                className="text-[16px] font-medium text-[#0a1628] underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                Contact us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f5f8fc] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="grid items-end gap-4 lg:grid-cols-12">
              <h2 className="text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.6rem] lg:col-span-6">
                The workflows Summit Tech runs on your chart.
              </h2>
              <p className="text-[17px] leading-7 text-[#4a5b73] lg:col-span-5 lg:col-start-8">
                Each one reads from OpenDental, works on top, and writes results back — with a
                person in the loop on every record change.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {CORE.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <Card {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="grid items-end gap-4 lg:grid-cols-12">
              <h2 className="text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.6rem] lg:col-span-6">
                And the rest of the practice.
              </h2>
              <p className="text-[17px] leading-7 text-[#4a5b73] lg:col-span-5 lg:col-start-8">
                Everything else runs on the same layer.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {REST.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <Card {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fc] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="text-[2rem] font-semibold tracking-[-0.035em] sm:text-[2.6rem]">
              See Summit Tech on a chart like yours.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[18px] leading-8 text-[#4a5b73]">
              Walk through Summit Tech yourself on a chart that looks like yours, or tell us about
              your office and we will walk through it with you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
              <Link
                to="/login"
                className="summit-cta summit-cta-primary inline-flex items-center gap-2 rounded-full bg-[#0a1628] px-7 py-3.5 text-[17px] font-medium tracking-tight text-white"
              >
                Open the live demo
                <ArrowRight className="summit-cta-arrow h-[17px] w-[17px]" />
              </Link>
              <Link
                to="/contact"
                className="text-[16px] font-medium text-[#0a1628] underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                Contact us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
