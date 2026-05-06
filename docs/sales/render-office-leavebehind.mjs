import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'docs/sales/Summit-AI-Services-Office-Dropoff-Packet.pdf');

const PAGE = { w: 612, h: 792 };
const C = {
  navy: [7, 19, 31],
  navy2: [12, 28, 44],
  ink: [15, 23, 42],
  muted: [71, 85, 105],
  slate: [100, 116, 139],
  line: [226, 232, 240],
  paper: [248, 250, 252],
  cyan: [8, 145, 178],
  cyan2: [34, 211, 238],
  cyanPale: [207, 250, 254],
  gold: [245, 158, 11],
  green: [5, 150, 105],
  red: [225, 29, 72],
  white: [255, 255, 255],
};

function rgb(c) {
  return c.map((v) => (v / 255).toFixed(4)).join(' ');
}

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

class PDF {
  constructor() {
    this.pages = [];
    this.page = null;
  }

  addPage() {
    this.page = [];
    this.pages.push(this.page);
  }

  op(s) {
    this.page.push(s);
  }

  color(c, stroke = false) {
    this.op(`${rgb(c)} ${stroke ? 'RG' : 'rg'}`);
  }

  rect(x, y, w, h, fill, stroke = null) {
    this.op('q');
    if (fill) this.color(fill);
    if (stroke) this.color(stroke, true);
    this.op(`${x} ${y} ${w} ${h} re ${stroke ? (fill ? 'B' : 'S') : 'f'}`);
    this.op('Q');
  }

  line(x1, y1, x2, y2, color = C.line, width = 1) {
    this.op('q');
    this.color(color, true);
    this.op(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
    this.op('Q');
  }

  circle(x, y, r, fill) {
    const k = 0.5522847498;
    this.op('q');
    this.color(fill);
    this.op(`${x + r} ${y} m`);
    this.op(`${x + r} ${y + k * r} ${x + k * r} ${y + r} ${x} ${y + r} c`);
    this.op(`${x - k * r} ${y + r} ${x - r} ${y + k * r} ${x - r} ${y} c`);
    this.op(`${x - r} ${y - k * r} ${x - k * r} ${y - r} ${x} ${y - r} c`);
    this.op(`${x + k * r} ${y - r} ${x + r} ${y - k * r} ${x + r} ${y} c f`);
    this.op('Q');
  }

  text(s, x, y, opts = {}) {
    const { font = 'F1', size = 10, color = C.ink } = opts;
    this.op('BT');
    this.color(color);
    this.op(`/${font} ${size} Tf`);
    this.op(`1 0 0 1 ${x} ${y} Tm`);
    this.op(`(${esc(s)}) Tj`);
    this.op('ET');
  }

  width(s, size, font = 'F1') {
    return String(s).length * size * (font === 'F2' ? 0.56 : 0.5);
  }

  wrap(s, width, size = 10, font = 'F1') {
    const words = String(s).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (this.width(test, size, font) <= width || !line) line = test;
      else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  para(s, x, y, width, opts = {}) {
    const { size = 10, font = 'F1', color = C.ink, leading = 14 } = opts;
    const lines = this.wrap(s, width, size, font);
    lines.forEach((line, i) => this.text(line, x, y - i * leading, { size, font, color }));
    return y - lines.length * leading;
  }

  bullet(s, x, y, width, opts = {}) {
    const { size = 9.5, color = C.ink } = opts;
    this.circle(x + 3, y + 3, 2.2, C.cyan);
    return this.para(s, x + 14, y, width - 14, { size, color, leading: 12.5 }) - 3;
  }

  header(title, pageNo) {
    this.rect(0, 784, 612, 8, C.navy);
    this.rect(0, 784, 198, 8, C.cyan);
    this.text('SUMMIT AI SERVICES', 44, 758, { font: 'F2', size: 8.5, color: C.cyan });
    this.text(title, 395, 758, { size: 8.5, color: C.slate });
    this.line(44, 746, 568, 746, C.line, 0.8);
    this.text(String(pageNo), 558, 25, { size: 8, color: C.slate });
  }

  card(x, y, w, h, title, body, accent = C.cyan, opts = {}) {
    this.rect(x, y, w, h, opts.fill || C.white, C.line);
    this.rect(x, y + h - 5, w, 5, accent);
    this.text(title, x + 14, y + h - 24, { font: 'F2', size: opts.titleSize || 11, color: C.ink });
    if (Array.isArray(body)) {
      let yy = y + h - 44;
      body.forEach((b) => {
        yy = this.bullet(b, x + 14, yy, w - 28, { size: opts.bodySize || 8.8 });
      });
    } else {
      this.para(body, x + 14, y + h - 44, w - 28, { size: opts.bodySize || 9, color: C.muted, leading: 12.5 });
    }
  }

  pill(text, x, y, color = C.cyan) {
    this.rect(x, y, this.width(text, 8.5, 'F2') + 20, 20, color);
    this.text(text, x + 10, y + 6, { font: 'F2', size: 8.5, color: C.white });
  }

  page1() {
    this.addPage();
    this.rect(0, 0, 612, 792, C.navy);
    this.rect(0, 0, 612, 792, C.navy2);
    this.rect(0, 0, 612, 126, [5, 33, 50]);
    this.circle(504, 646, 92, [8, 86, 109]);
    this.circle(548, 600, 92, [8, 145, 178]);
    this.circle(585, 554, 92, [34, 211, 238]);
    this.rect(44, 626, 110, 7, C.cyan);
    this.rect(44, 611, 68, 7, C.gold);
    this.text('SUMMIT AI SERVICES', 44, 574, { font: 'F2', size: 12, color: C.cyanPale });
    this.text('Dental AI', 44, 492, { font: 'F2', size: 54, color: C.white });
    this.text('Operations Layer', 44, 436, { font: 'F2', size: 46, color: C.white });
    this.para('A leave-behind for dental offices evaluating AI support for notes, front desk work, billing, recall, treatment follow-up, and practice visibility.', 48, 392, 410, { size: 15, color: [203, 213, 225], leading: 20 });
    this.rect(44, 252, 404, 72, [15, 23, 42], [30, 41, 59]);
    this.text('Core idea', 64, 298, { font: 'F2', size: 10, color: C.gold });
    this.para('Summit helps dental teams see what needs attention, draft the repetitive work, and keep follow-up from falling through the cracks.', 64, 278, 360, { font: 'F2', size: 12, color: C.white, leading: 15 });
    const cards = [
      ['Notes', 'Structured drafts with provider review'],
      ['Front Desk', 'Huddles, scheduling, forms, recall'],
      ['Billing', 'Claim review, pre-auths, AR, payment plans'],
      ['Complete', 'One operating layer for the practice'],
    ];
    cards.forEach(([a, b], i) => {
      const x = 44 + (i % 2) * 256;
      const y = 138 - Math.floor(i / 2) * 66;
      this.rect(x, y, 232, 48, [248, 250, 252]);
      this.text(a, x + 12, y + 28, { font: 'F2', size: 13, color: C.navy });
      this.text(b, x + 12, y + 12, { size: 8.5, color: C.muted });
    });
    this.text('The practice stays in control. Summit supports the work.', 44, 34, { font: 'F2', size: 10.5, color: C.cyanPale });
  }

  page2() {
    this.addPage();
    this.header('Demo Preview', 2);
    this.text('What the demo looks like', 44, 704, { font: 'F2', size: 30, color: C.navy });
    this.para('The demo uses realistic dental office data so your team can see how Summit feels during a real day: schedule prep, notes, claims, recall, treatment follow-up, balances, and staff questions.', 44, 676, 505, { size: 11.5, color: C.muted, leading: 15 });
    this.card(44, 524, 160, 104, 'Dashboard', ['Pending claims', 'Outstanding balances', 'Overdue recall', 'Notes awaiting approval'], C.cyan);
    this.card(226, 524, 160, 104, 'Morning Huddle', ['Today schedule', 'Patient flags', 'Insurance issues', 'No-show risk'], C.gold);
    this.card(408, 524, 160, 104, 'AI Notes', ['Voice or text input', 'SOAP-style draft', 'Provider review', 'Approval status'], C.green);
    this.card(44, 388, 160, 104, 'Claim Review', ['Risk score', 'Missing attachments', 'Narrative gaps', 'Payer patterns'], C.red);
    this.card(226, 388, 160, 104, 'Recall + Treatment', ['Overdue patients', 'Unaccepted care', 'Outreach status', 'Priority context'], C.cyan);
    this.card(408, 388, 160, 104, 'Billing', ['Aging balances', 'Statements', 'Payment plans', 'Reports'], C.gold);
    this.rect(44, 246, 524, 96, C.navy);
    this.text('Demo takeaway', 68, 312, { font: 'F2', size: 11, color: C.gold });
    this.para('Summit is not one more dashboard. It is a daily workflow layer for the work that affects time, revenue, and follow-through.', 68, 290, 462, { font: 'F2', size: 14, color: C.white, leading: 18 });
    this.text('What to look for during the demo', 44, 198, { font: 'F2', size: 16, color: C.navy });
    let y = 170;
    ['Which workflow creates the most pressure today?', 'Which screen would your team actually use first?', 'Where does human review happen?', 'What would count as a clear first win?'].forEach((b) => {
      y = this.bullet(b, 54, y, 470, { size: 10 });
    });
  }

  page3() {
    this.addPage();
    this.header('Packages + Fit', 3);
    this.text('Start with the workflow that hurts most', 44, 704, { font: 'F2', size: 27, color: C.navy });
    this.para('Summit can support the whole office, but the best rollout starts narrow: one painful workflow, one owner, one success measure.', 44, 676, 505, { size: 11.5, color: C.muted, leading: 15 });
    this.card(44, 532, 248, 104, 'Notes Package', 'For providers who need faster documentation. AI-drafted SOAP notes with provider review and approval.', C.green, { titleSize: 13, bodySize: 10 });
    this.card(320, 532, 248, 104, 'Front Desk Package', 'For teams overloaded by calls, scheduling, forms, recall, reminders, cancellations, and staff questions.', C.cyan, { titleSize: 13, bodySize: 10 });
    this.card(44, 404, 248, 104, 'Billing Package', 'For offices dealing with claim rework, pre-auths, patient balances, payment plans, AR, and fee questions.', C.red, { titleSize: 13, bodySize: 10 });
    this.card(320, 404, 248, 104, 'Complete Package', 'For growing practices that want notes, front desk, billing, reporting, recall, and treatment follow-up together.', C.gold, { titleSize: 13, bodySize: 10 });
    this.text('Fast fit guide', 44, 350, { font: 'F2', size: 17, color: C.navy });
    const rows = [
      ['Providers chart after hours', 'Notes Package'],
      ['Front desk is overwhelmed', 'Front Desk Package'],
      ['Claims or AR are painful', 'Billing Package'],
      ['Owner wants full visibility', 'Complete Package'],
      ['New staff need workflow help', 'AI Assistant add-on'],
    ];
    let y = 318;
    rows.forEach((r, i) => {
      this.rect(44, y - 4, 524, 34, i % 2 ? C.white : C.paper, C.line);
      this.text(r[0], 60, y + 8, { size: 10.5, color: C.ink });
      this.text(r[1], 352, y + 8, { font: 'F2', size: 10.5, color: C.cyan });
      y -= 34;
    });
    this.rect(44, 82, 524, 72, C.cyanPale);
    this.text('Best first step', 64, 128, { font: 'F2', size: 11, color: C.cyan });
    this.para('Pick the one workflow your office most wants to make easier. If Summit can make that workflow clearer, faster, and easier to manage, expansion becomes practical.', 64, 106, 470, { font: 'F2', size: 11.5, color: C.navy, leading: 15 });
  }

  page4() {
    this.addPage();
    this.header('Trust + Next Step', 4);
    this.text('Built for responsible dental AI', 44, 704, { font: 'F2', size: 29, color: C.navy });
    this.para('Summit is designed for human-reviewed dental workflows. The software supports the team; the practice remains responsible for final clinical, billing, and compliance decisions.', 44, 676, 505, { size: 11.5, color: C.muted, leading: 15 });
    this.rect(44, 558, 524, 78, C.navy);
    this.text('Legal and compliance position', 66, 610, { font: 'F2', size: 10.5, color: C.gold });
    this.para('Summit is built for legal and compliant dental workflow implementation when configured with the proper practice policies, security controls, BAA process, consent workflows, access controls, audit logging, and human review.', 66, 590, 478, { font: 'F2', size: 10.8, color: C.white, leading: 14.2 });
    this.text('Responsible workflow principles', 44, 510, { font: 'F2', size: 16, color: C.navy });
    let y = 482;
    ['Providers make final clinical decisions.', 'Providers review and approve notes.', 'Billing teams review claims before submission.', 'Open Dental remains the system of record when used by the practice.', 'Security, BAA, access, audit, retention, and consent needs are reviewed during implementation.'].forEach((b) => {
      y = this.bullet(b, 54, y, 490, { size: 10 });
    });
    this.text('Focused demo agenda', 44, 322, { font: 'F2', size: 16, color: C.navy });
    const steps = ['1. Confirm the biggest workflow pain', '2. Show the relevant package workflow', '3. Review human approval points', '4. Discuss integration and compliance needs', '5. Choose a first rollout workflow'];
    y = 294;
    steps.forEach((s) => {
      this.text(s, 58, y, { font: 'F2', size: 10.5, color: C.ink });
      y -= 22;
    });
    this.rect(44, 66, 524, 106, C.cyan);
    this.text('Schedule the right demo', 66, 132, { font: 'F2', size: 20, color: C.white });
    this.para('Notes workflow  |  Front desk workflow  |  Billing workflow  |  Complete practice workflow  |  AI Assistant add-on preview', 66, 106, 470, { font: 'F2', size: 11.5, color: C.white, leading: 15 });
    this.text('Bring one question: What work is falling through the cracks in your office today?', 66, 80, { font: 'F2', size: 9.8, color: C.cyanPale });
  }

  build() {
    this.page1();
    this.page2();
    this.page3();
    this.page4();
    const objects = [];
    const add = (s) => {
      objects.push(s);
      return objects.length;
    };
    const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const kids = [];
    const pageObjs = [];
    for (const p of this.pages) {
      const stream = p.join('\n');
      const content = add(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
      const page = add(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`);
      kids.push(`${page} 0 R`);
      pageObjs.push(page);
    }
    const pages = add(`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`);
    pageObjs.forEach((pageNo) => {
      objects[pageNo - 1] = objects[pageNo - 1].replace('/Parent 0 0 R', `/Parent ${pages} 0 R`);
    });
    const catalog = add(`<< /Type /Catalog /Pages ${pages} 0 R >>`);
    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [0];
    objects.forEach((obj, i) => {
      offsets.push(Buffer.byteLength(pdf, 'binary'));
      pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((o) => {
      pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(pdf, 'binary');
  }
}

const pdf = new PDF();
fs.writeFileSync(out, pdf.build());
console.log(`Wrote ${out}`);
console.log('4 pages');
