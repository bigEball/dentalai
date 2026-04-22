import React from 'react';
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

const QUICK_PROMPTS = [
  'How do I post an insurance payment in Open Dental?',
  'Where do I find unscheduled treatment follow-ups?',
  'Explain the morning huddle workflow for today.',
  'How should front desk handle a failed claim review?',
];

const KNOWLEDGE_AREAS = [
  {
    title: 'Open Dental guidance',
    description: 'Answers staff questions about common Open Dental workflows, screens, and daily office tasks.',
    icon: Database,
  },
  {
    title: 'Summit workflow help',
    description: 'Explains how to use Summit AI Services tools like recalls, claim review, follow-ups, and reports.',
    icon: BookOpen,
  },
  {
    title: 'Employee support',
    description: 'Gives step-by-step instructions so new and existing team members can move faster with less interruption.',
    icon: FileQuestion,
  },
];

export default function AIAssistantPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="AI Assistant"
        subtitle="Beta paid add-on that will help employees use Open Dental and Summit AI Services workflows."
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
                  <p className="text-xs text-gray-500">Preview mode - responses are examples only</p>
                </div>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200 sm:flex">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Beta preview
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Bot size={16} />
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                <p className="text-sm leading-relaxed text-gray-700">
                  Hi, I am the AI Assistant. Ask me how to complete Open Dental tasks, where to find Summit tools, or how your office workflow should be handled.
                </p>
              </div>
            </div>

            <div className="flex items-start justify-end gap-3">
              <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3">
                <p className="text-sm leading-relaxed text-white">
                  How do I follow up on patients who have not accepted treatment?
                </p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                FD
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Bot size={16} />
              </div>
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                <p className="text-sm leading-relaxed text-gray-700">
                  Open Treatment Follow-Up to review patients with pending plans. Start with the highest-value or longest-open plans, review the suggested reason for hesitation, then send or edit the recommended message before logging the outreach.
                </p>
                <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                  <span className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-gray-200">Find patient</span>
                  <span className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-gray-200">Review plan</span>
                  <span className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-gray-200">Send follow-up</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                disabled
                value=""
                placeholder="Ask about Open Dental or Summit workflows..."
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-500 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
                readOnly
              />
              <button
                type="button"
                disabled
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white opacity-50"
                title="Chat is not active in beta preview"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900">What it is used for</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              The AI Assistant is planned as an internal support chatbot for employees. It will answer questions about Open Dental, explain Summit AI Services tools, and guide staff through office workflows without needing to interrupt a manager.
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
              This preview is not included in Bronze, Silver, or Gold. It is shown as a future paid add-on.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Example questions</h3>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-gray-500">
              <li>How do I verify insurance eligibility?</li>
              <li>Where do I review overdue recall patients?</li>
              <li>What should I do when a claim is missing an attachment?</li>
              <li>How do I find a patient balance in Open Dental?</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
