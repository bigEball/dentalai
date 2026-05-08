import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceDir = path.join(root, 'docs/legal/templates/service-agreements');
const outDir = path.join(root, 'docs/legal/dist');
const generatedAt = new Date().toISOString().slice(0, 10);

const documents = [
  ['01-master-services-agreement.md', 'Master Services Agreement'],
  ['02-business-associate-agreement.md', 'Business Associate Agreement'],
  ['03-implementation-statement-of-work.md', 'Implementation Statement of Work'],
  ['04-security-and-data-protection-addendum.md', 'Security and Data Protection Addendum'],
  ['05-open-dental-integration-authorization.md', 'Open Dental Integration Authorization'],
  ['06-ai-clinical-use-addendum.md', 'AI Clinical Use Addendum'],
  ['07-patient-recording-ai-consent.md', 'Patient Recording and AI Documentation Consent'],
  ['08-staff-recording-ai-policy.md', 'Staff Recording and AI Documentation Policy'],
  ['09-patient-communications-addendum.md', 'Patient Communications Addendum'],
  ['10-billing-insurance-addendum.md', 'Billing and Insurance Addendum'],
  ['11-subprocessor-and-vendor-checklist.md', 'Subprocessor and Vendor Checklist'],
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function renderTable(lines) {
  const rows = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()));

  const header = rows[0] ?? [];
  const body = rows.slice(2);
  const headHtml = header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('');
  const bodyHtml = body.map((row) => (
    `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`
  )).join('\n');

  return `<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let paragraph = [];
  let list = [];
  let quote = [];
  let table = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
    list = [];
  }

  function flushQuote() {
    if (!quote.length) return;
    html.push(`<blockquote>${quote.map((item) => `<p>${inlineMarkdown(item)}</p>`).join('')}</blockquote>`);
    quote = [];
  }

  function flushTable() {
    if (!table.length) return;
    html.push(renderTable(table));
    table = [];
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushQuote();
    flushTable();
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (/^\|.*\|$/.test(line)) {
      flushParagraph();
      flushList();
      flushQuote();
      table.push(line);
      continue;
    }

    flushTable();

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = Math.min(heading[1].length + 1, 6);
      const text = heading[2].replace(/\s*\{#.+\}\s*$/, '');
      html.push(`<h${level}>${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^- \[([ xX])\]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      flushQuote();
      list.push(`${unordered[1].toLowerCase() === 'x' ? '[x]' : '[ ]'} ${unordered[2]}`);
      continue;
    }

    const bullet = line.match(/^- (.+)$/);
    if (bullet) {
      flushParagraph();
      flushQuote();
      list.push(bullet[1]);
      continue;
    }

    const quoteLine = line.match(/^>\s?(.*)$/);
    if (quoteLine) {
      flushParagraph();
      flushList();
      quote.push(quoteLine[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }

  flushAll();
  return html.join('\n');
}

function normalizeBody(markdown, fileName) {
  const title = documents.find(([name]) => name === fileName)?.[1] ?? fileName;
  const withoutTitle = markdown.replace(/^# .+\n+/, '');
  return `# ${title}\n\n${withoutTitle.trim()}\n`;
}

function pdfEscape(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '-');
}

function stripMarkdown(value) {
  return value
    .replace(/^#+\s*/, '')
    .replace(/^\|\s*/, '')
    .replace(/\s*\|$/, '')
    .replace(/\|/g, ' | ')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^- \[[ xX]\]\s+/, '[ ] ')
    .replace(/^- /, '- ')
    .replace(/^>\s*/, '')
    .trim();
}

function estimateWidth(text, size) {
  let units = 0;
  for (const char of text) {
    if ('il.,:;!|'.includes(char)) units += 0.28;
    else if ('mwMW@#%&'.includes(char)) units += 0.85;
    else if (char === ' ') units += 0.28;
    else units += 0.52;
  }
  return units * size;
}

function wrapText(text, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateWidth(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (estimateWidth(word, size) <= maxWidth) {
      current = word;
      continue;
    }

    let fragment = '';
    for (const char of word) {
      const next = `${fragment}${char}`;
      if (estimateWidth(next, size) <= maxWidth) {
        fragment = next;
      } else {
        if (fragment) lines.push(fragment);
        fragment = char;
      }
    }
    current = fragment;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function createDirectPdf(markdown) {
  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 54;
  const marginTop = 58;
  const marginBottom = 54;
  const usableWidth = pageWidth - marginX * 2;
  const pages = [];
  let content = [];
  let y = pageHeight - marginTop;
  let pageNumber = 0;

  function line(text, x, yValue, size = 10, font = 'F1', color = '172033') {
    const r = parseInt(color.slice(0, 2), 16) / 255;
    const g = parseInt(color.slice(2, 4), 16) / 255;
    const b = parseInt(color.slice(4, 6), 16) / 255;
    content.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    content.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${yValue.toFixed(2)} Td (${pdfEscape(text)}) Tj ET`);
  }

  function rect(x, yValue, width, height, color) {
    const r = parseInt(color.slice(0, 2), 16) / 255;
    const g = parseInt(color.slice(2, 4), 16) / 255;
    const b = parseInt(color.slice(4, 6), 16) / 255;
    content.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    content.push(`${x.toFixed(2)} ${yValue.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  }

  function strokeLine(x1, y1, x2, y2, color = 'd0d5dd', width = 0.7) {
    const r = parseInt(color.slice(0, 2), 16) / 255;
    const g = parseInt(color.slice(2, 4), 16) / 255;
    const b = parseInt(color.slice(4, 6), 16) / 255;
    content.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    content.push(`${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  function finishPage() {
    if (pageNumber > 1) {
      strokeLine(marginX, 38, pageWidth - marginX, 38, 'e4e7ec');
      line('DentalAI Office Deployment Agreement Packet', marginX, 25, 7.8, 'F1', '667085');
      line(String(pageNumber), pageWidth - marginX - 12, 25, 7.8, 'F1', '667085');
    }
    pages.push(content.join('\n'));
    content = [];
  }

  function newPage() {
    if (content.length) finishPage();
    pageNumber += 1;
    y = pageHeight - marginTop;
  }

  function ensureSpace(amount) {
    if (y - amount < marginBottom) newPage();
  }

  function drawWrapped(text, options = {}) {
    const {
      x = marginX,
      size = 10,
      font = 'F1',
      color = '172033',
      width = usableWidth,
      leading = size * 1.35,
      before = 0,
      after = 5,
      bullet = null,
    } = options;

    y -= before;
    const lines = wrapText(text, size, width - (bullet ? 14 : 0));
    ensureSpace(lines.length * leading + after);
    lines.forEach((textLine, index) => {
      if (bullet && index === 0) line(bullet, x, y, size, font, color);
      line(textLine, x + (bullet ? 14 : 0), y, size, font, color);
      y -= leading;
    });
    y -= after;
  }

  function coverPage() {
    pageNumber = 1;
    rect(0, 0, pageWidth, pageHeight, 'ffffff');
    strokeLine(48, 48, pageWidth - 48, 48, '1f2a44', 1.2);
    strokeLine(48, pageHeight - 48, pageWidth - 48, pageHeight - 48, '1f2a44', 1.2);
    strokeLine(48, 48, 48, pageHeight - 48, '1f2a44', 1.2);
    strokeLine(pageWidth - 48, 48, pageWidth - 48, pageHeight - 48, '1f2a44', 1.2);
    line('DENTALAI DEPLOYMENT PACKET', 72, 690, 9, 'F2', '356b5c');
    line('Office Service Agreements', 72, 622, 30, 'F2', '111827');
    line('and Compliance Templates', 72, 584, 30, 'F2', '111827');
    drawCoverText('A consolidated contract packet for deploying an AI-enabled dental operations platform in a dental office using Open Dental and related service providers.', 72, 536, 13, 430);
    rect(72, 405, 410, 72, 'f5f7fa');
    rect(72, 405, 5, 72, '356b5c');
    drawCoverText('Draft for counsel review. This packet is a practical starting point, not legal advice. It should be reviewed and adapted by qualified healthcare, privacy, and commercial counsel before use.', 92, 452, 10.5, 365);
    line('Prepared For', 72, 204, 8, 'F2', '667085');
    line('[Dental Practice Legal Name]', 72, 186, 11, 'F2', '111827');
    line('Prepared By', 330, 204, 8, 'F2', '667085');
    line('[Vendor Legal Name]', 330, 186, 11, 'F2', '111827');
    line('Generated', 72, 142, 8, 'F2', '667085');
    line(generatedAt, 72, 124, 11, 'F2', '111827');
    line('Version', 330, 142, 8, 'F2', '667085');
    line('Attorney Review Draft v0.1', 330, 124, 11, 'F2', '111827');
    finishPage();
  }

  function drawCoverText(text, x, yValue, size, width) {
    const lines = wrapText(text, size, width);
    lines.forEach((textLine, index) => line(textLine, x, yValue - index * size * 1.38, size, 'F1', '374151'));
  }

  function tocPage() {
    newPage();
    line('Table of Contents', marginX, y, 23, 'F2', '111827');
    y -= 42;
    documents.forEach(([, title], index) => {
      ensureSpace(18);
      line(`${index + 1}. ${title}`, marginX, y, 10.5, 'F1', '172033');
      strokeLine(270, y - 1.5, 500, y - 1.5, 'cbd5e1', 0.45);
      line('Page ____', 508, y, 9.5, 'F1', '667085');
      y -= 20;
    });
    y -= 18;
    drawWrapped('Page numbers are intentionally left blank in the editable draft. Regenerate or finalize after counsel completes revisions.', {
      size: 8.8,
      color: '667085',
      before: 8,
    });
    finishPage();
  }

  coverPage();
  tocPage();
  newPage();

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  for (const rawLine of lines) {
    const original = rawLine.trimEnd();
    const trimmed = original.trim();

    if (!trimmed) {
      y -= 3;
      continue;
    }

    if (trimmed === '---') {
      newPage();
      continue;
    }

    if (/^\|[-:\s|]+\|$/.test(trimmed)) continue;

    if (trimmed.startsWith('# ')) {
      if (content.length && y < pageHeight - marginTop - 20) newPage();
      const text = stripMarkdown(trimmed);
      ensureSpace(54);
      line(text, marginX, y, 20, 'F2', '111827');
      y -= 14;
      strokeLine(marginX, y, pageWidth - marginX, y, '1f2a44', 1.1);
      y -= 20;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const text = stripMarkdown(trimmed);
      ensureSpace(34);
      y -= 8;
      line(text, marginX, y, 13.2, 'F2', '1f2a44');
      y -= 18;
      continue;
    }

    if (trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
      const text = stripMarkdown(trimmed);
      ensureSpace(28);
      y -= 5;
      line(text, marginX, y, 11, 'F2', '263248');
      y -= 16;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      drawWrapped(stripMarkdown(trimmed).replace(/^- /, ''), {
        size: 9.6,
        bullet: '-',
        before: 0,
        after: 2,
      });
      continue;
    }

    if (trimmed.startsWith('|')) {
      drawWrapped(stripMarkdown(trimmed), {
        size: 8.2,
        font: 'F3',
        color: '344054',
        before: 1,
        after: 1,
      });
      continue;
    }

    if (trimmed.startsWith('>')) {
      ensureSpace(26);
      rect(marginX, y - 18, 3, 22, '96b4aa');
      drawWrapped(stripMarkdown(trimmed), {
        x: marginX + 12,
        width: usableWidth - 12,
        size: 9.2,
        color: '344054',
        before: 0,
        after: 4,
      });
      continue;
    }

    drawWrapped(stripMarkdown(trimmed), {
      size: 9.8,
      before: 0,
      after: 4,
    });
  }

  if (content.length) finishPage();

  const objects = [];
  function addObject(value) {
    objects.push(value);
    return objects.length;
  }

  const fontRegular = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBold = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const fontMono = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const pageObjectIds = [];
  const contentObjectIds = [];

  pages.forEach((page) => {
    const stream = `<< /Length ${Buffer.byteLength(page, 'utf8')} >>\nstream\n${page}\nendstream`;
    contentObjectIds.push(addObject(stream));
    pageObjectIds.push(null);
  });

  const pagesId = objects.length + pages.length + 1;
  pages.forEach((_, index) => {
    pageObjectIds[index] = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R /F3 ${fontMono} 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`);
  });
  addObject(`<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>`);
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

if (!existsSync(sourceDir)) {
  throw new Error(`Missing source directory: ${sourceDir}`);
}

mkdirSync(outDir, { recursive: true });

const combinedSections = documents.map(([fileName]) => {
  const filePath = path.join(sourceDir, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`Missing source document: ${filePath}`);
  }
  return normalizeBody(readFileSync(filePath, 'utf8'), fileName);
});

const combinedMarkdown = `# DentalAI Office Deployment Agreement Packet

**Prepared for:** [Dental Practice Legal Name]

**Prepared by:** [Vendor Legal Name]

**Generated:** ${generatedAt}

**Status:** Draft contract templates for attorney review. These materials are not legal advice and should not be signed until reviewed by qualified healthcare, privacy, and commercial counsel.

## Packet Contents

${documents.map(([, title], index) => `${index + 1}. ${title}`).join('\n')}

## Deployment Notes

- Use the Master Services Agreement, Business Associate Agreement, Security Addendum, Implementation SOW, Open Dental Authorization, and AI Clinical Use Addendum for every production deployment.
- Attach patient communications, billing/insurance, recording, and staff policy documents only when those modules or workflows are enabled.
- Keep all bracketed placeholders current and customer-specific.
- Do not enable any vendor that may process PHI until the subprocessor checklist is complete and required BAAs or equivalent safeguards are in place.

${combinedSections.join('\n\n---\n\n')}
`;

const toc = documents.map(([, title], index) => (
  `<li><span>${index + 1}. ${escapeHtml(title)}</span><span class="toc-fill"></span><span>Page ____</span></li>`
)).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DentalAI Office Deployment Agreement Packet</title>
  <style>
    @page {
      size: Letter;
      margin: 0.72in 0.68in 0.76in;
    }

    * {
      box-sizing: border-box;
    }

    body {
      color: #172033;
      font-family: -apple-system, BlinkMacSystemFont, "Avenir Next", "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.44;
      margin: 0;
      background: #fff;
    }

    .cover {
      min-height: 9.35in;
      border: 1.5pt solid #18233a;
      padding: 0.62in;
      position: relative;
      page-break-after: always;
    }

    .eyebrow {
      color: #356b5c;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .cover h1 {
      color: #111827;
      font-size: 31pt;
      line-height: 1.03;
      margin: 0.45in 0 0.18in;
      max-width: 6.4in;
    }

    .subtitle {
      color: #374151;
      font-size: 13pt;
      max-width: 5.85in;
    }

    .meta-grid {
      border-top: 1pt solid #d5dae3;
      bottom: 0.62in;
      display: grid;
      gap: 0.12in;
      grid-template-columns: 1fr 1fr;
      left: 0.62in;
      padding-top: 0.22in;
      position: absolute;
      right: 0.62in;
    }

    .meta-label {
      color: #667085;
      display: block;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .meta-value {
      color: #111827;
      display: block;
      font-size: 10.5pt;
      font-weight: 650;
      margin-top: 0.03in;
    }

    .notice {
      background: #f5f7fa;
      border-left: 3pt solid #356b5c;
      margin-top: 0.45in;
      padding: 0.16in 0.19in;
      width: 5.9in;
    }

    .notice strong {
      color: #111827;
    }

    .toc-page {
      page-break-after: always;
    }

    .toc-page h2 {
      border: 0;
      color: #111827;
      font-size: 22pt;
      margin-top: 0;
      padding: 0;
    }

    .toc {
      list-style: none;
      margin: 0.25in 0 0;
      padding: 0;
    }

    .toc li {
      align-items: baseline;
      display: flex;
      font-size: 10.5pt;
      gap: 0.08in;
      margin: 0.11in 0;
    }

    .toc-fill {
      border-bottom: 1px dotted #98a2b3;
      flex: 1;
      transform: translateY(-0.04in);
    }

    .section {
      page-break-before: always;
    }

    .section:first-of-type {
      page-break-before: auto;
    }

    h2 {
      border-bottom: 1.5pt solid #1f2a44;
      color: #111827;
      font-size: 20pt;
      line-height: 1.12;
      margin: 0 0 0.22in;
      padding-bottom: 0.1in;
    }

    h3 {
      color: #1f2a44;
      font-size: 12.5pt;
      margin: 0.22in 0 0.07in;
      page-break-after: avoid;
    }

    h4, h5, h6 {
      color: #263248;
      font-size: 10.8pt;
      margin: 0.17in 0 0.05in;
      page-break-after: avoid;
    }

    p {
      margin: 0.055in 0 0.09in;
      orphans: 3;
      widows: 3;
    }

    ul {
      margin: 0.055in 0 0.11in 0.2in;
      padding: 0;
    }

    li {
      margin: 0.035in 0;
      padding-left: 0.03in;
    }

    table {
      border-collapse: collapse;
      font-size: 8.4pt;
      margin: 0.13in 0 0.18in;
      page-break-inside: avoid;
      width: 100%;
    }

    th {
      background: #eef3f1;
      color: #10231f;
      font-weight: 700;
      text-align: left;
    }

    th, td {
      border: 0.6pt solid #ccd5df;
      padding: 0.055in;
      vertical-align: top;
    }

    blockquote {
      border-left: 2.5pt solid #96b4aa;
      color: #344054;
      margin: 0.1in 0 0.16in;
      padding: 0.04in 0 0.04in 0.13in;
    }

    code {
      background: #f1f5f9;
      border: 0.5pt solid #dde5ee;
      border-radius: 2pt;
      font-family: "SFMono-Regular", Menlo, Consolas, monospace;
      font-size: 8.8pt;
      padding: 0 2pt;
    }

    hr {
      border: 0;
      page-break-after: always;
    }

    .doc-body > h2 {
      page-break-before: always;
    }

    .doc-body > h2:first-child {
      page-break-before: auto;
    }

    .signature-line {
      border-bottom: 1pt solid #111827;
      display: inline-block;
      min-width: 2.2in;
    }

    .footer-note {
      color: #667085;
      font-size: 8.5pt;
      margin-top: 0.22in;
    }
  </style>
</head>
<body>
  <section class="cover">
    <div class="eyebrow">DentalAI Deployment Packet</div>
    <h1>Office Service Agreements and Compliance Templates</h1>
    <p class="subtitle">A consolidated contract packet for deploying an AI-enabled dental operations platform in a dental office using Open Dental and related service providers.</p>
    <div class="notice">
      <p><strong>Draft for counsel review.</strong> This packet is a practical starting point, not legal advice. It should be reviewed and adapted by qualified healthcare, privacy, and commercial counsel before use.</p>
    </div>
    <div class="meta-grid">
      <div>
        <span class="meta-label">Prepared For</span>
        <span class="meta-value">[Dental Practice Legal Name]</span>
      </div>
      <div>
        <span class="meta-label">Prepared By</span>
        <span class="meta-value">[Vendor Legal Name]</span>
      </div>
      <div>
        <span class="meta-label">Generated</span>
        <span class="meta-value">${generatedAt}</span>
      </div>
      <div>
        <span class="meta-label">Version</span>
        <span class="meta-value">Attorney Review Draft v0.1</span>
      </div>
    </div>
  </section>

  <section class="toc-page">
    <h2>Table of Contents</h2>
    <ol class="toc">${toc}</ol>
    <p class="footer-note">Page numbers are intentionally left blank in the editable draft. Regenerate or finalize after counsel completes revisions.</p>
  </section>

  <main class="doc-body">
    ${renderMarkdown(combinedSections.join('\n\n---\n\n'))}
  </main>
</body>
</html>
`;

const mdPath = path.join(outDir, 'DentalAI-Service-Agreement-Packet.md');
const htmlPath = path.join(outDir, 'DentalAI-Service-Agreement-Packet.html');
const pdfPath = path.join(outDir, 'DentalAI-Service-Agreement-Packet.pdf');

writeFileSync(mdPath, combinedMarkdown);
writeFileSync(htmlPath, html);
writeFileSync(pdfPath, createDirectPdf(combinedSections.join('\n\n---\n\n')));

console.log(`Wrote ${path.relative(root, mdPath)}`);
console.log(`Wrote ${path.relative(root, htmlPath)}`);
console.log(`Wrote ${path.relative(root, pdfPath)}`);
