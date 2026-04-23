import { FormEvent, useMemo, useState } from 'react';
import {
  Bot,
  BookOpen,
  Database,
  FileQuestion,
  Lock,
  MessageSquare,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';

import PageHeader from '@/components/ui/PageHeader';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  steps?: string[];
};

type AssistantAnswer = {
  text: string;
  steps?: string[];
};

const QUICK_PROMPTS = [
  'How do I post an insurance payment in Open Dental?',
  'Where do I find unscheduled treatment follow-ups?',
  'Explain the morning huddle workflow for today.',
  'How should front desk handle a failed claim review?',
  'How do I verify insurance eligibility?',
  'What should I do when a claim is missing an attachment?',
];

const KNOWLEDGE_AREAS = [
  {
    title: 'Open Dental guidance',
    description: 'Walks staff through common Open Dental tasks using clear, step-by-step language.',
    icon: Database,
  },
  {
    title: 'Summit workflow help',
    description: 'Explains where to find Summit tools for recall, claim review, follow-ups, reports, and patient worklists.',
    icon: BookOpen,
  },
  {
    title: 'Employee support',
    description: 'Helps team members handle routine questions without waiting for a manager.',
    icon: FileQuestion,
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: 'Hi. I can preview how the AI Assistant will help staff with Open Dental tasks, Summit tools, and common front office workflows. Choose a prompt or ask a question below.',
  },
  {
    id: 2,
    role: 'user',
    text: 'Where do I review patients who have not accepted treatment?',
  },
  {
    id: 3,
    role: 'assistant',
    text: 'Use Treatment Follow-Up to review pending treatment plans, prioritize the patients most likely to need outreach, and document each contact attempt.',
    steps: ['Open Treatment Follow-Up', 'Review the patient and pending plan', 'Send or edit the recommended message', 'Log the outreach result'],
  },
];

const ANSWERS: Array<{ keywords: string[]; answer: AssistantAnswer }> = [
  {
    keywords: ['insurance payment', 'post payment', 'payment in open dental', 'era', 'eob'],
    answer: {
      text: 'For an insurance payment, start by matching the carrier payment to the correct claim or batch. Confirm the patient, procedure dates, allowed amounts, adjustments, and any remaining patient responsibility before posting.',
      steps: ['Open the insurance payment or claim payment area', 'Match the payment to the correct claim', 'Review allowed amounts and adjustments', 'Post the payment and verify the patient balance'],
    },
  },
  {
    keywords: ['treatment follow', 'accepted treatment', 'unscheduled treatment', 'pending treatment', 'treatment plans'],
    answer: {
      text: 'Use Treatment Follow-Up to find patients with pending plans and keep outreach organized. Start with high-value, older, or time-sensitive plans, then document the result so the next team member has context.',
      steps: ['Open Treatment Follow-Up', 'Sort by priority or age', 'Review the plan and patient notes', 'Send outreach or schedule a call', 'Log the outcome'],
    },
  },
  {
    keywords: ['morning huddle', 'huddle workflow', 'today workflow', 'today schedule'],
    answer: {
      text: 'The morning huddle should give the team a practical view of today: schedule risks, open balances, unscheduled treatment opportunities, medical alerts, and any patients who need special handling.',
      steps: ['Review today’s schedule', 'Check production and openings', 'Identify balances and unscheduled treatment', 'Flag clinical or patient-specific notes', 'Assign follow-up tasks'],
    },
  },
  {
    keywords: ['failed claim', 'claim review', 'claim scrubber', 'claim error', 'claim failed'],
    answer: {
      text: 'When a claim review fails, treat it as a work queue item. Review the reason, correct missing or inconsistent information, attach required documentation, and only submit once the claim is clean.',
      steps: ['Open Claim Review', 'Read the failure reason', 'Correct codes, provider, subscriber, or attachment issues', 'Recheck the claim', 'Submit or route for review'],
    },
  },
  {
    keywords: ['eligibility', 'verify insurance', 'insurance verification', 'benefits'],
    answer: {
      text: 'Eligibility verification should confirm whether coverage is active and whether key benefit details are available before the appointment. If anything is unclear, flag it for follow-up before the patient arrives.',
      steps: ['Find the patient appointment', 'Review insurance information', 'Verify active coverage', 'Check benefits relevant to the visit', 'Flag missing or unclear details'],
    },
  },
  {
    keywords: ['missing attachment', 'attachment', 'xray', 'x-ray', 'narrative'],
    answer: {
      text: 'For a missing attachment, identify what the payer requires, gather the correct document, and resubmit with a clear note. Common items include X-rays, perio charting, narratives, or supporting clinical documentation.',
      steps: ['Review the claim message', 'Identify the required attachment', 'Add the document or narrative', 'Recheck payer requirements', 'Resubmit and document the action'],
    },
  },
  {
    keywords: ['recall', 'overdue patient', 'overdue recall', 'hygiene'],
    answer: {
      text: 'Use Recall to find patients who are overdue or coming due soon. Prioritize patients with larger care gaps, recent cancellations, or incomplete treatment so outreach is focused.',
      steps: ['Open Recall', 'Filter overdue or due-soon patients', 'Prioritize the outreach list', 'Send the recommended message or call', 'Record the result'],
    },
  },
  {
    keywords: ['patient balance', 'balance', 'statement', 'collections'],
    answer: {
      text: 'For a patient balance question, review the ledger, insurance payments, adjustments, and any pending claims before contacting the patient. The goal is to confirm the balance is accurate before collecting.',
      steps: ['Open the patient account or ledger', 'Review charges, payments, and adjustments', 'Check for pending insurance', 'Confirm the amount owed', 'Document the conversation or next step'],
    },
  },
  {
    keywords: ['bronze', 'silver', 'gold', 'package', 'pricing', 'tier'],
    answer: {
      text: 'Bronze covers the operational foundation. Silver adds growth and revenue tools. Gold includes full package access, including insurance, clinical support, fee optimization, and advanced settings.',
      steps: ['Choose Bronze for core operations', 'Choose Silver for growth and revenue workflows', 'Choose Gold for the broadest toolset', 'Ask for a demo to match the package to your office'],
    },
  },
];

function getAssistantAnswer(question: string): AssistantAnswer {
  const normalized = question.toLowerCase();
  const match = ANSWERS.find(item => item.keywords.some(keyword => normalized.includes(keyword)));

  if (match) return match.answer;

  return {
    text: 'I can help with Open Dental workflows, Summit tools, recall, follow-ups, claim review, eligibility, billing, and package questions. For this preview, try asking about a specific task or choose one of the example prompts.',
    steps: ['Ask about a specific workflow', 'Include the tool or task name', 'Use a prompt above for a guided example'],
  };
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [nextId, setNextId] = useState(4);

  const exampleQuestions = useMemo(() => [
    'How do I verify insurance eligibility?',
    'Where do I review overdue recall patients?',
    'What should I do when a claim is missing an attachment?',
    'How do I find a patient balance?',
  ], []);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;

    const answer = getAssistantAnswer(trimmed);
    setMessages(prev => [
      ...prev,
      { id: nextId, role: 'user', text: trimmed },
      { id: nextId + 1, role: 'assistant', text: answer.text, steps: answer.steps },
    ]);
    setNextId(prev => prev + 2);
    setInput('');
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-x-hidden">
      <PageHeader
        title="AI Assistant"
        subtitle="Beta paid add-on for employee support, Open Dental guidance, and Summit workflow questions."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Beta
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Paid add-on
            </span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Employee workflow assistant</h2>
                  <p className="text-xs text-gray-500">Interactive preview with example responses</p>
                </div>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200 sm:flex">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Beta preview
              </div>
            </div>
          </div>

          <div className="max-h-[560px] space-y-5 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
            {messages.map(message => (
              <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`max-w-[calc(100%-44px)] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'rounded-tr-sm bg-indigo-600 text-white' : 'rounded-tl-sm bg-gray-100 text-gray-700'}`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  {message.steps && (
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      {message.steps.map(step => (
                        <span key={step} className={`rounded-lg px-2.5 py-2 ${message.role === 'user' ? 'bg-white/10 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'}`}>
                          {step}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                    FD
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="border-t border-gray-100 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => ask(prompt)}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about Open Dental or Summit workflows..."
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                disabled={!input.trim()}
                title="Send question"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900">What it is used for</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              The AI Assistant is an internal support chatbot for employees. It helps staff answer routine workflow questions, learn where tools are located, and follow consistent office processes.
            </p>
          </div>

          <div className="grid gap-3">
            {KNOWLEDGE_AREAS.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">{description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lock size={16} className="text-amber-700" />
              <h3 className="text-sm font-semibold text-amber-900">Separate add-on</h3>
            </div>
            <p className="text-xs leading-relaxed text-amber-800">
              This preview is not included in Bronze, Silver, or Gold. It is a separate paid add-on.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Good questions to ask</h3>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-gray-500">
              {exampleQuestions.map(question => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
