import { WORKBOOK_CHAPTERS, WorkbookChapter } from '../data/workbookData';

/**
 * Generates a clean, beautifully formatted Markdown file representing the entire workbook.
 */
export function generateWorkbookMarkdown(): string {
  let md = `# QUANTARA ALGORITHMIC TRADING WORKBOOK & OPERATOR MANUAL\n`;
  md += `*Institutional Quantitative Trading • MetaTrader 5 (MT5) Bridge • Risk Firewall*\n\n`;
  md += `**Document Version:** 2.4.0-Production\n`;
  md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Author:** Quantara Quantitative Systems Engineering\n\n`;
  md += `---\n\n`;

  md += `## TABLE OF CONTENTS\n\n`;
  WORKBOOK_CHAPTERS.forEach((ch) => {
    md += `${ch.number}. [Chapter ${ch.number}: ${ch.title}](#chapter-${ch.number}-${ch.id}) (${ch.readTime})\n`;
  });
  md += `\n---\n\n`;

  WORKBOOK_CHAPTERS.forEach((ch) => {
    md += `<a id="chapter-${ch.number}-${ch.id}"></a>\n\n`;
    md += `# CHAPTER ${ch.number}: ${ch.title.toUpperCase()}\n`;
    md += `### *${ch.subtitle}*\n\n`;
    md += `**Category:** ${ch.category} | **Est. Reading Time:** ${ch.readTime}\n\n`;
    md += `> **Chapter Executive Summary:**\n`;
    md += `> ${ch.summary}\n\n`;

    md += `#### Key Takeaways:\n`;
    ch.keyTakeaways.forEach((k) => {
      md += `- [x] ${k}\n`;
    });
    md += `\n`;

    ch.sections.forEach((sec) => {
      md += `### ${sec.heading}\n\n`;
      sec.paragraphs.forEach((p) => {
        md += `${p}\n\n`;
      });

      if (sec.callout) {
        md += `> **[${sec.callout.type.toUpperCase()}] ${sec.callout.title}**\n`;
        md += `> ${sec.callout.text}\n\n`;
      }

      if (sec.codeOrFormula) {
        md += `\`\`\`text\n${sec.codeOrFormula}\n\`\`\`\n\n`;
      }

      if (sec.table) {
        md += `| ${sec.table.headers.join(' | ')} |\n`;
        md += `| ${sec.table.headers.map(() => '---').join(' | ')} |\n`;
        sec.table.rows.forEach((row) => {
          md += `| ${row.join(' | ')} |\n`;
        });
        md += `\n`;
      }
    });

    md += `#### Chapter Knowledge Checkpoint:\n`;
    md += `**Question:** ${ch.quiz.question}\n\n`;
    ch.quiz.options.forEach((opt, idx) => {
      const marker = idx === ch.quiz.correctIndex ? '(CORRECT ANSWER)' : '';
      md += `- [${String.fromCharCode(65 + idx)}] ${opt} ${marker}\n`;
    });
    md += `\n*Explanation:* ${ch.quiz.explanation}\n\n`;
    md += `---\n\n`;
  });

  md += `## APPENDIX: OPERATOR'S QUICK REFERENCE CHEAT SHEET\n\n`;
  md += `| Parameter | Conservative / Demo | Balanced Compounding | Aggressive Prop Scalp |\n`;
  md += `| --- | --- | --- | --- |\n`;
  md += `| Max Risk per Trade | 0.5% - 1.0% | 1.5% - 2.0% | 2.5% - 3.0% |\n`;
  md += `| Max Daily Loss | 3.0% | 5.0% | 6.0% |\n`;
  md += `| Max Concurrent Positions | 2 positions | 3 positions | 4 positions |\n`;
  md += `| Recommended Gold Leverage | 1:200 - 1:500 | 1:500 | 1:500 or 1:1000 |\n`;
  md += `| Recommended Stop Loss on Gold | 25 - 35 pips ($2.50 - $3.50) | 30 - 45 pips | 20 - 30 pips |\n`;
  md += `| Trailing Stop Trigger | 1.0x R:R | 1.2x R:R | 1.0x R:R |\n\n`;

  md += `*End of Quantara Algorithmic Trading Workbook. Keep this file stored locally for offline reference.*\n`;

  return md;
}

/**
 * Generates a self-contained, standalone single-file HTML document for offline reading or printing.
 */
export function generateWorkbookHTML(): string {
  const chaptersHTML = WORKBOOK_CHAPTERS.map((ch) => {
    const takeaways = ch.keyTakeaways.map((t) => `<li>${t}</li>`).join('');

    const sections = ch.sections
      .map((sec) => {
        const paragraphs = sec.paragraphs.map((p) => `<p>${p}</p>`).join('');
        let calloutHTML = '';
        if (sec.callout) {
          const colors = {
            warning: 'border-l-4 border-amber-500 bg-amber-950/20 text-amber-200',
            info: 'border-l-4 border-blue-500 bg-blue-950/20 text-blue-200',
            success: 'border-l-4 border-emerald-500 bg-emerald-950/20 text-emerald-200',
            danger: 'border-l-4 border-red-500 bg-red-950/20 text-red-200',
          }[sec.callout.type];
          calloutHTML = `
            <div class="callout ${sec.callout.type} ${colors}">
              <strong>${sec.callout.title}</strong>
              <p>${sec.callout.text}</p>
            </div>
          `;
        }

        let tableHTML = '';
        if (sec.table) {
          const th = sec.table.headers.map((h) => `<th>${h}</th>`).join('');
          const tr = sec.table.rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
            .join('');
          tableHTML = `
            <div class="table-container">
              <table>
                <thead><tr>${th}</tr></thead>
                <tbody>${tr}</tbody>
              </table>
            </div>
          `;
        }

        let codeHTML = '';
        if (sec.codeOrFormula) {
          codeHTML = `
            <div class="code-container" style="background:#0c0d12; border:1px solid #2a2a35; border-radius:8px; padding:12px; margin:16px 0; font-family:monospace; font-size:13px; color:#93c5fd; overflow-x:auto; white-space:pre;">
              <code>${sec.codeOrFormula.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
            </div>
          `;
        }

        return `
          <div class="section">
            <h3>${sec.heading}</h3>
            ${paragraphs}
            ${codeHTML}
            ${calloutHTML}
            ${tableHTML}
          </div>
        `;
      })
      .join('');

    const quizOptions = ch.quiz.options
      .map(
        (opt, idx) => `
          <li class="${idx === ch.quiz.correctIndex ? 'correct' : ''}">
            <strong>${String.fromCharCode(65 + idx)}.</strong> ${opt}
            ${idx === ch.quiz.correctIndex ? ' <span class="badge">Correct Answer</span>' : ''}
          </li>
        `
      )
      .join('');

    return `
      <article class="chapter" id="chapter-${ch.number}">
        <div class="chapter-header">
          <span class="chapter-num">Chapter ${ch.number}</span>
          <span class="chapter-meta">${ch.category} • ${ch.readTime}</span>
          <h2>${ch.title}</h2>
          <p class="chapter-subtitle">${ch.subtitle}</p>
        </div>

        <div class="summary-box">
          <strong>Executive Summary:</strong>
          <p>${ch.summary}</p>
        </div>

        <div class="takeaways">
          <h4>Key Objectives:</h4>
          <ul>${takeaways}</ul>
        </div>

        <div class="chapter-body">
          ${sections}
        </div>

        <div class="quiz-box">
          <h4>Chapter Knowledge Checkpoint</h4>
          <p><strong>Question:</strong> ${ch.quiz.question}</p>
          <ul class="quiz-options">${quizOptions}</ul>
          <p class="quiz-exp"><em>Rationale:</em> ${ch.quiz.explanation}</p>
        </div>
      </article>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quantara Algorithmic Trading Workbook & Operator Manual</title>
  <style>
    :root {
      --bg: #0C0D11;
      --card-bg: #14151B;
      --border: #232530;
      --text: #E1E3EB;
      --text-muted: #8E92A4;
      --accent: #3B82F6;
      --accent-hover: #60A5FA;
      --gold: #F59E0B;
      --green: #10B981;
      --red: #EF4444;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.65;
      padding: 24px;
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
    }

    header.hero {
      border-bottom: 2px solid var(--border);
      padding-bottom: 28px;
      margin-bottom: 40px;
    }

    .brand {
      font-size: 14px;
      letter-spacing: 0.15em;
      color: var(--accent);
      text-transform: uppercase;
      font-weight: 800;
      margin-bottom: 8px;
    }

    h1 {
      font-size: 32px;
      line-height: 1.2;
      color: #FFF;
      margin-bottom: 12px;
      font-weight: 800;
    }

    .subtitle {
      font-size: 16px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .btn {
      background: var(--accent);
      color: #FFF;
      padding: 8px 18px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }

    .btn-secondary {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
    }

    .toc {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 48px;
    }

    .toc h3 {
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 16px;
      color: #FFF;
    }

    .toc ol {
      padding-left: 20px;
    }

    .toc li {
      margin-bottom: 10px;
      font-size: 14px;
    }

    .toc a {
      color: var(--accent-hover);
      text-decoration: none;
      font-weight: 500;
    }

    .toc a:hover {
      text-decoration: underline;
    }

    article.chapter {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 32px;
      margin-bottom: 48px;
      page-break-after: always;
    }

    .chapter-header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .chapter-num {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
    }

    .chapter-meta {
      font-size: 12px;
      color: var(--text-muted);
      margin-left: 12px;
    }

    h2 {
      font-size: 24px;
      color: #FFF;
      margin-top: 4px;
      margin-bottom: 6px;
    }

    .chapter-subtitle {
      font-size: 14px;
      color: var(--text-muted);
    }

    .summary-box {
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .takeaways {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 13.5px;
    }

    .takeaways h4 {
      color: var(--green);
      margin-bottom: 8px;
      font-size: 14px;
    }

    .takeaways ul {
      padding-left: 20px;
    }

    .takeaways li {
      margin-bottom: 4px;
    }

    .section {
      margin-bottom: 28px;
    }

    h3 {
      font-size: 18px;
      color: #FFF;
      margin-top: 20px;
      margin-bottom: 12px;
    }

    p {
      margin-bottom: 14px;
      font-size: 14.5px;
      color: #D1D5DB;
    }

    .callout {
      border-left: 4px solid var(--accent);
      background: rgba(255, 255, 255, 0.03);
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin: 18px 0;
      font-size: 13.5px;
    }

    .callout strong {
      display: block;
      margin-bottom: 4px;
    }

    .callout p {
      margin-bottom: 0;
    }

    .callout.warning { border-color: var(--gold); }
    .callout.danger { border-color: var(--red); }
    .callout.success { border-color: var(--green); }

    .table-container {
      overflow-x: auto;
      margin: 18px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th, td {
      border: 1px solid var(--border);
      padding: 10px 14px;
      text-align: left;
    }

    th {
      background: rgba(255, 255, 255, 0.05);
      color: #FFF;
      font-weight: 600;
    }

    tr:nth-child(even) td {
      background: rgba(255, 255, 255, 0.015);
    }

    .quiz-box {
      border-top: 1px solid var(--border);
      margin-top: 32px;
      padding-top: 20px;
    }

    .quiz-box h4 {
      font-size: 15px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .quiz-options {
      list-style: none;
      padding-left: 0;
      margin: 14px 0;
    }

    .quiz-options li {
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 13.5px;
    }

    .quiz-options li.correct {
      border-color: var(--green);
      background: rgba(16, 185, 129, 0.1);
      color: #E2E8F0;
    }

    .badge {
      display: inline-block;
      background: var(--green);
      color: #000;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
    }

    .quiz-exp {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 8px;
    }

    footer {
      text-align: center;
      padding: 32px;
      color: var(--text-muted);
      font-size: 12px;
      border-top: 1px solid var(--border);
      margin-top: 40px;
    }

    @media print {
      body { background: #FFF !important; color: #000 !important; }
      .btn, .actions { display: none !important; }
      article.chapter { border: 1px solid #CCC; background: #FFF; color: #000; break-after: page; }
      h1, h2, h3, h4, th { color: #000 !important; }
      p { color: #333 !important; }
      .toc { border: 1px solid #CCC; background: #FAFAFA; }
      .callout { background: #F5F5F5 !important; color: #111 !important; border-left-color: #333 !important; }
      .summary-box, .takeaways { background: #F8F9FA !important; border-color: #DDD !important; color: #111 !important; }
      table, th, td { border-color: #CCC !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="hero">
      <div class="brand">QUANTARA QUANTITATIVE SYSTEMS</div>
      <h1>Algorithmic Trading Operator's Workbook</h1>
      <p class="subtitle">Complete Lecture Series, Standard Operating Procedures & Technical Reference for MetaTrader 5 (MT5)</p>
      <div class="actions">
        <button class="btn" onclick="window.print()">Print / Save as PDF</button>
      </div>
    </header>

    <section class="toc">
      <h3>Table of Contents</h3>
      <ol>
        ${WORKBOOK_CHAPTERS.map(
          (ch) => `
          <li>
            <a href="#chapter-${ch.number}">Chapter ${ch.number}: ${ch.title}</a>
            <span style="color: var(--text-muted); font-size: 12px;">(${ch.readTime})</span>
          </li>
        `
        ).join('')}
      </ol>
    </section>

    <main>
      ${chaptersHTML}
    </main>

    <footer>
      <p>Quantara Intelligent Trading Systems • Offline Field Manual Edition • Confidential Trading Intellectual Property</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Triggers browser download of a generated text/blob file.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
