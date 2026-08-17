import type { ReactNode } from 'react';

/**
 * The typographic scale the three legal documents share. They are long, plain
 * prose in a page whose other sections are two-column and image-heavy, so they
 * get their own narrow measure on white rather than the landing grid.
 */

export function Doc({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white px-6 py-16 sm:py-20">
      <article className="mx-auto max-w-3xl text-[16px] leading-7 text-[#4a5b73]">
        {children}
      </article>
    </div>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-[#0a1628] sm:text-[2.6rem]">
      {children}
    </h1>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 text-[1.3rem] font-semibold tracking-[-0.02em] text-[#0a1628]">
      {children}
    </h2>
  );
}

/** A short all-caps heading — used only for the SMS notice at the top. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 text-[16px] font-semibold uppercase tracking-[0.08em] text-[#0a1628]">
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-4">{children}</p>;
}

/** The bolded label that introduces a list, e.g. "Opt-Out Instructions:". */
export function Term({ children }: { children: ReactNode }) {
  return <p className="mt-5 font-semibold text-[#0a1628]">{children}</p>;
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="mt-2 list-disc space-y-1.5 pl-6">{children}</ul>;
}

export function Numbered({ children }: { children: ReactNode }) {
  return <ol className="mt-4 list-decimal space-y-4 pl-6">{children}</ol>;
}

/** Inline bold run inside a list item or paragraph. */
export function B({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-[#0a1628]">{children}</span>;
}

export const proseLink =
  'font-medium text-[#0b6bcb] underline underline-offset-2 transition-opacity hover:opacity-70';
