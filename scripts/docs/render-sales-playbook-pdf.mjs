import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inputPath = path.resolve(root, process.argv[2] || 'docs/sales/playbooks/summit-sales-playbook/source.md');
const outputPath = path.resolve(root, process.argv[3] || 'docs/sales/dist/Summit-AI-Services-Sales-Playbook.pdf');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const coverKicker = process.argv[4] || 'SUMMIT AI SERVICES';
const coverTitleA = process.argv[5] || 'Sales';
const coverTitleB = process.argv[6] || 'Playbook';
const coverSubtitle = process.argv[7] || 'A practical guide for selling dental AI workflows';
const coverPill = process.argv[8] || 'Notes  |  Front Desk  |  Billing  |  Complete';
const coverFooter = process.argv[9] || 'Built for reps who need to understand the product, the dental office, the buyer pain, the demo path, and the safe way to sell.';

const PAGE = { w: 612, h: 792 };
const M = { left: 58, right: 58, top: 58, bottom: 58 };
const COLORS = {
  ink: [15, 23, 42],
  muted: [71, 85, 105],
  light: [226, 232, 240],
  paper: [248, 250, 252],
  navy: [7, 19, 31],
  cyan: [8, 145, 178],
  cyanLight: [207, 250, 254],
  gold: [245, 158, 11],
  rose: [225, 29, 72],
  green: [5, 150, 105],
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
    .replace(/\r/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function stripInline(s) {
  return s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function parseTable(lines, start) {
  const rows = [];
  let i = start;
  while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
    const row = lines[i].trim().slice(1, -1).split('|').map((x) => stripInline(x.trim()));
    rows.push(row);
    i += 1;
  }
  if (rows.length >= 2 && rows[1].every((cell) => /^:?-{2,}:?$/.test(cell))) {
    rows.splice(1, 1);
  }
  return { rows, next: i };
}

function tokenize(md) {
  const lines = md.split(/\n/);
  const tokens = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      tokens.push({ type: 'rule' });
      i += 1;
      continue;
    }
    if (/^\s*\|.+\|\s*$/.test(line)) {
      const parsed = parseTable(lines, i);
      tokens.push({ type: 'table', rows: parsed.rows });
      i = parsed.next;
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      tokens.push({ type: `h${heading[1].length}`, text: stripInline(heading[2]) });
      i += 1;
      continue;
    }
    const quote = /^>\s*(.+)$/.exec(line);
    if (quote) {
      const parts = [stripInline(quote[1])];
      i += 1;
      while (i < lines.length && /^>\s*(.+)$/.test(lines[i])) {
        parts.push(stripInline(lines[i].replace(/^>\s*/, '')));
        i += 1;
      }
      tokens.push({ type: 'quote', text: parts.join(' ') });
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line.trim());
    if (bullet) {
      tokens.push({ type: 'bullet', text: stripInline(bullet[1]) });
      i += 1;
      continue;
    }
    const ordered = /^\d+\.\s+(.+)$/.exec(line.trim());
    if (ordered) {
      tokens.push({ type: 'number', text: stripInline(ordered[1]) });
      i += 1;
      continue;
    }
    if (/^[A-Za-z0-9 /.-]+:$/.test(line.trim()) && line.trim().length < 80) {
      tokens.push({ type: 'label', text: stripInline(line.trim()) });
      i += 1;
      continue;
    }
    const para = [stripInline(line)];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^>\s+/.test(lines[i]) &&
      !/^\s*\|.+\|\s*$/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      para.push(stripInline(lines[i]));
      i += 1;
    }
    tokens.push({ type: 'p', text: para.join(' ') });
  }
  return tokens;
}

class PdfDoc {
  constructor(options = {}) {
    this.pages = [];
    this.current = null;
    this.pageNo = 0;
    this.options = options;
  }

  addPage({ dark = false, title = '' } = {}) {
    this.pageNo += 1;
    this.current = { ops: [], dark, title };
    this.pages.push(this.current);
    this.y = PAGE.h - M.top;
    if (!dark) this.pageChrome(title);
  }

  op(s) {
    this.current.ops.push(s);
  }

  color(c, stroke = false) {
    this.op(`${rgb(c)} ${stroke ? 'RG' : 'rg'}`);
  }

  rect(x, y, w, h, c, stroke = null) {
    this.op('q');
    if (c) this.color(c);
    if (stroke) this.color(stroke, true);
    this.op(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${stroke ? (c ? 'B' : 'S') : 'f'}`);
    this.op('Q');
  }

  line(x1, y1, x2, y2, c = COLORS.light, width = 1) {
    this.op('q');
    this.color(c, true);
    this.op(`${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    this.op('Q');
  }

  text(s, x, y, { font = 'F1', size = 10, color = COLORS.ink, leading = null } = {}) {
    this.op('BT');
    this.color(color);
    this.op(`/${font} ${size} Tf`);
    if (leading) this.op(`${leading} TL`);
    this.op(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    this.op(`(${esc(s)}) Tj`);
    this.op('ET');
  }

  textWidth(s, size, font = 'F1') {
    const weight = font === 'F2' ? 0.58 : font === 'F3' ? 0.56 : 0.52;
    return stripInline(s).length * size * weight;
  }

  wrap(text, width, size = 10, font = 'F1') {
    const words = stripInline(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (this.textWidth(trial, size, font) <= width || !line) {
        line = trial;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  ensure(height, title = '') {
    if (this.y - height < M.bottom + 28) {
      this.footer();
      this.addPage({ title });
    }
  }

  pageChrome(title) {
    this.rect(0, 0, PAGE.w, PAGE.h, COLORS.white);
    this.rect(0, PAGE.h - 8, PAGE.w, 8, COLORS.navy);
    this.rect(0, PAGE.h - 8, PAGE.w * 0.32, 8, COLORS.cyan);
    this.text('Summit AI Services', M.left, PAGE.h - 34, { font: 'F2', size: 9, color: COLORS.cyan });
    if (title) this.text(title.slice(0, 58), PAGE.w - M.right - 230, PAGE.h - 34, { size: 8.5, color: COLORS.muted });
    this.line(M.left, PAGE.h - 46, PAGE.w - M.right, PAGE.h - 46, COLORS.light, 0.8);
    this.y = PAGE.h - 72;
  }

  footer() {
    if (!this.current || this.current.dark) return;
    this.line(M.left, 38, PAGE.w - M.right, 38, COLORS.light, 0.8);
    this.text('Sales Playbook', M.left, 24, { size: 8, color: COLORS.muted });
    this.text(String(this.pageNo), PAGE.w - M.right - 8, 24, { size: 8, color: COLORS.muted });
  }

  cover() {
    this.addPage({ dark: true });
    this.rect(0, 0, PAGE.w, PAGE.h, COLORS.navy);
    this.rect(0, 0, PAGE.w, PAGE.h, [8, 30, 46]);
    this.rect(0, PAGE.h - 170, PAGE.w, 170, [7, 19, 31]);
    this.rect(48, 548, 112, 8, COLORS.cyan);
    this.rect(48, 532, 68, 8, COLORS.gold);
    this.rect(416, 96, 138, 138, [14, 116, 144]);
    this.rect(454, 134, 138, 138, [8, 145, 178]);
    this.rect(492, 172, 138, 138, [34, 211, 238]);
    this.text(this.options.coverKicker || 'SUMMIT AI SERVICES', 48, 608, { font: 'F2', size: 13, color: COLORS.cyanLight });
    this.text(this.options.coverTitleA || 'Sales', 48, 492, { font: 'F2', size: 58, color: COLORS.white });
    this.text(this.options.coverTitleB || 'Playbook', 48, 430, { font: 'F2', size: 58, color: COLORS.white });
    this.text(this.options.coverSubtitle || 'A practical guide for selling dental AI workflows', 52, 374, { size: 17, color: [203, 213, 225] });
    this.text(this.options.coverPill || 'Notes  |  Front Desk  |  Billing  |  Complete', 52, 334, { font: 'F2', size: 12, color: COLORS.cyanLight });
    this.rect(48, 86, 380, 94, [15, 23, 42]);
    const footerLines = this.wrap(this.options.coverFooter || 'Built for reps who need to understand the product, the dental office, the buyer pain, the demo path, and the safe way to sell.', 330, 11, 'F1').slice(0, 2);
    footerLines.forEach((line, idx) => {
      this.text(line, 70, 144 - idx * 20, { size: 11, color: [226, 232, 240] });
    });
    this.text('May 2026', 70, 102, { font: 'F2', size: 10, color: COLORS.gold });
  }

  toc(tokens) {
    this.addPage({ title: 'Table of Contents' });
    this.sectionTitle('Table of Contents', 'Find the right section quickly during sales prep.');
    let yStart = this.y;
    let col = 0;
    const colW = 236;
    let y = yStart;
    const headings = tokens.filter((t) => t.type === 'h2').map((t) => t.text);
    headings.forEach((h, idx) => {
      if (y < 96) {
        col += 1;
        y = yStart;
      }
      const x = M.left + col * (colW + 24);
      this.text(String(idx).padStart(2, '0'), x, y, { font: 'F2', size: 8, color: COLORS.cyan });
      this.text(h.replace(/^\d+\.\s*/, ''), x + 28, y, { size: 10.5, color: COLORS.ink });
      y -= 24;
    });
    this.y = Math.min(y, yStart);
  }

  sectionTitle(title, subtitle = '') {
    this.ensure(94, title);
    this.rect(M.left, this.y - 52, PAGE.w - M.left - M.right, 54, COLORS.navy);
    this.rect(M.left, this.y - 52, 8, 54, COLORS.cyan);
    this.text(title, M.left + 20, this.y - 22, { font: 'F2', size: 20, color: COLORS.white });
    if (subtitle) this.text(subtitle, M.left + 20, this.y - 42, { size: 9.5, color: [203, 213, 225] });
    this.y -= 78;
  }

  h2(text) {
    this.footer();
    this.addPage({ title: text });
    this.sectionTitle(text);
  }

  h3(text) {
    this.ensure(46);
    this.text(text, M.left, this.y, { font: 'F2', size: 15, color: COLORS.navy });
    this.rect(M.left, this.y - 9, 42, 3, COLORS.cyan);
    this.y -= 28;
  }

  h4(text) {
    this.ensure(32);
    this.text(text, M.left, this.y, { font: 'F2', size: 11.5, color: COLORS.cyan });
    this.y -= 19;
  }

  para(text) {
    const lines = this.wrap(text, PAGE.w - M.left - M.right, 10.2, 'F1');
    this.ensure(lines.length * 14 + 8);
    for (const line of lines) {
      this.text(line, M.left, this.y, { size: 10.2, color: COLORS.ink });
      this.y -= 14.2;
    }
    this.y -= 5;
  }

  label(text) {
    this.ensure(24);
    this.text(text, M.left, this.y, { font: 'F2', size: 10.4, color: COLORS.ink });
    this.y -= 16;
  }

  bullet(text, ordered = false) {
    const left = M.left + 18;
    const lines = this.wrap(text, PAGE.w - left - M.right, 9.8, 'F1');
    this.ensure(lines.length * 13.2 + 6);
    this.text(ordered ? '-' : '-', M.left + 2, this.y, { font: 'F2', size: 10, color: COLORS.cyan });
    lines.forEach((line, idx) => {
      this.text(line, left, this.y - idx * 13.2, { size: 9.8, color: COLORS.ink });
    });
    this.y -= lines.length * 13.2 + 3;
  }

  quote(text) {
    const width = PAGE.w - M.left - M.right;
    const lines = this.wrap(text, width - 34, 11, 'F2');
    const h = lines.length * 15 + 28;
    this.ensure(h + 8);
    this.rect(M.left, this.y - h + 10, width, h, COLORS.cyanLight);
    this.rect(M.left, this.y - h + 10, 5, h, COLORS.cyan);
    let yy = this.y - 15;
    lines.forEach((line) => {
      this.text(line, M.left + 22, yy, { font: 'F2', size: 11, color: COLORS.navy });
      yy -= 15;
    });
    this.y -= h + 10;
  }

  rule() {
    this.ensure(22);
    this.line(M.left, this.y, PAGE.w - M.right, this.y, COLORS.light, 1);
    this.y -= 20;
  }

  table(rows) {
    if (!rows.length) return;
    const colCount = Math.min(rows[0].length, 4);
    const width = PAGE.w - M.left - M.right;
    const colW = Array(colCount).fill(width / colCount);
    if (colCount === 3) colW.splice(0, 3, width * 0.26, width * 0.32, width * 0.42);
    if (colCount === 4) colW.splice(0, 4, width * 0.23, width * 0.27, width * 0.25, width * 0.25);
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r].slice(0, colCount);
      const wrapped = row.map((cell, c) => this.wrap(cell, colW[c] - 12, r === 0 ? 8.3 : 8.1, r === 0 ? 'F2' : 'F1'));
      const rowH = Math.max(24, Math.max(...wrapped.map((x) => x.length)) * 11 + 13);
      this.ensure(rowH + 4);
      const yTop = this.y;
      this.rect(M.left, yTop - rowH + 4, width, rowH, r === 0 ? COLORS.navy : (r % 2 ? COLORS.paper : COLORS.white), COLORS.light);
      let x = M.left;
      for (let c = 0; c < colCount; c += 1) {
        if (c > 0) this.line(x, yTop - rowH + 4, x, yTop + 4, COLORS.light, 0.5);
        let yy = yTop - 12;
        wrapped[c].forEach((line) => {
          this.text(line, x + 6, yy, { font: r === 0 ? 'F2' : 'F1', size: r === 0 ? 8.3 : 8.1, color: r === 0 ? COLORS.white : COLORS.ink });
          yy -= 11;
        });
        x += colW[c];
      }
      this.y -= rowH;
    }
    this.y -= 10;
  }

  render(tokens) {
    this.cover();
    this.toc(tokens);
    let currentTitle = '';
    for (const t of tokens) {
      if (t.type === 'h1') continue;
      if (t.type === 'h2') {
        currentTitle = t.text;
        this.h2(t.text);
      } else if (t.type === 'h3') this.h3(t.text);
      else if (t.type === 'h4') this.h4(t.text);
      else if (t.type === 'p') this.para(t.text);
      else if (t.type === 'label') this.label(t.text);
      else if (t.type === 'bullet') this.bullet(t.text);
      else if (t.type === 'number') this.bullet(t.text, true);
      else if (t.type === 'quote') this.quote(t.text);
      else if (t.type === 'rule') this.rule();
      else if (t.type === 'table') this.table(t.rows);
      currentTitle = currentTitle;
    }
    this.footer();
  }

  buildPdf() {
    const objects = [];
    const add = (s) => {
      objects.push(s);
      return objects.length;
    };
    const font1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const font2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const font3 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
    const pageKids = [];
    const pageObjs = [];
    for (const p of this.pages) {
      const stream = p.ops.join('\n');
      const content = add(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
      const page = add(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${PAGE.w} ${PAGE.h}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R /F3 ${font3} 0 R >> >> /Contents ${content} 0 R >>`);
      pageKids.push(`${page} 0 R`);
      pageObjs.push(page);
    }
    const pagesObj = add(`<< /Type /Pages /Kids [${pageKids.join(' ')}] /Count ${pageKids.length} >>`);
    for (const page of pageObjs) {
      objects[page - 1] = objects[page - 1].replace('/Parent 0 0 R', `/Parent ${pagesObj} 0 R`);
    }
    const catalog = add(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);
    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [0];
    objects.forEach((obj, idx) => {
      offsets.push(Buffer.byteLength(pdf, 'binary'));
      pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(pdf, 'binary');
  }
}

const md = fs.readFileSync(inputPath, 'utf8');
const tokens = tokenize(md);
const doc = new PdfDoc({ coverKicker, coverTitleA, coverTitleB, coverSubtitle, coverPill, coverFooter });
doc.render(tokens);
fs.writeFileSync(outputPath, doc.buildPdf());
console.log(`Wrote ${outputPath}`);
console.log(`${doc.pages.length} pages`);
