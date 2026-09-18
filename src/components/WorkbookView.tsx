import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Printer,
  CheckCircle2,
  Circle,
  FileText,
  Search,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Shield,
  HelpCircle,
  Clock,
  BookMarked,
  Share2,
  FileDown,
  Info,
  Layers,
  Zap,
} from 'lucide-react';
import { WORKBOOK_CHAPTERS, WorkbookChapter } from '../data/workbookData';
import { generateWorkbookHTML, generateWorkbookMarkdown, downloadFile } from '../utils/workbookExport';

interface WorkbookViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const WorkbookView: React.FC<WorkbookViewProps> = ({ onNavigateTab }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(WORKBOOK_CHAPTERS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedChapters, setCompletedChapters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quantara_workbook_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [copiedState, setCopiedState] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('quantara_workbook_completed', JSON.stringify(completedChapters));
    } catch {
      // Ignore local storage errors
    }
  }, [completedChapters]);

  const toggleChapterCompleted = (chapterId: string) => {
    setCompletedChapters((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]
    );
  };

  const activeChapter =
    WORKBOOK_CHAPTERS.find((ch) => ch.id === selectedChapterId) || WORKBOOK_CHAPTERS[0];

  const activeIndex = WORKBOOK_CHAPTERS.findIndex((ch) => ch.id === activeChapter.id);
  const prevChapter = activeIndex > 0 ? WORKBOOK_CHAPTERS[activeIndex - 1] : null;
  const nextChapter = activeIndex < WORKBOOK_CHAPTERS.length - 1 ? WORKBOOK_CHAPTERS[activeIndex + 1] : null;

  // Filter chapters by search query
  const filteredChapters = WORKBOOK_CHAPTERS.filter((ch) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ch.title.toLowerCase().includes(q) ||
      ch.subtitle.toLowerCase().includes(q) ||
      ch.category.toLowerCase().includes(q) ||
      ch.sections.some((s) => s.heading.toLowerCase().includes(q) || s.paragraphs.some((p) => p.toLowerCase().includes(q)))
    );
  });

  const completionPercent = Math.round((completedChapters.length / WORKBOOK_CHAPTERS.length) * 100);

  const handleDownloadHTML = () => {
    const htmlContent = generateWorkbookHTML();
    downloadFile('quantara-trading-workbook.html', htmlContent, 'text/html');
    setDownloadSuccess('Offline HTML eBook downloaded successfully! Open it in any browser or print to PDF.');
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  const handleDownloadMarkdown = () => {
    const mdContent = generateWorkbookMarkdown();
    downloadFile('quantara-trading-workbook.md', mdContent, 'text/markdown');
    setDownloadSuccess('Markdown manual downloaded! You can open it in Obsidian, Notion, or any text editor.');
    setTimeout(() => setDownloadSuccess(null), 5000);
  };

  const handleCopyMarkdown = () => {
    const mdContent = generateWorkbookMarkdown();
    navigator.clipboard.writeText(mdContent);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2500);
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateWorkbookHTML());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      window.print();
    }
  };

  const handleSelectOption = (chapterId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [chapterId]: optionIndex }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Offline Downloads */}
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-[#0C1222] via-[#101826] to-[#0A0E17] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 rounded-md bg-blue-500/15 px-2.5 py-1 text-[11px] font-mono font-bold text-blue-300 border border-blue-500/30">
                <BookOpen className="h-3.5 w-3.5" />
                <span>OFFICIAL CURRICULUM & MANUAL</span>
              </span>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                8 LECTURE MODULES
              </span>
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                OFFLINE COMPATIBLE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-tech uppercase tracking-wide">
              Quantara Operator's Workbook & Trading Manual
            </h1>
            <p className="text-xs sm:text-sm text-[#8E9299] max-w-2xl leading-relaxed">
              Master the algorithmic execution mechanics, understand MetaTrader 5 broker bridges, discover the $10 micro-account compounding methodology, and adopt institutional risk protocols. Download the entire manual for offline reading.
            </p>
          </div>

          {/* Action Download Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadHTML}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-xs font-mono font-bold text-white transition-all shadow-lg hover:shadow-blue-500/20"
              title="Download standalone single-file HTML workbook for offline reading on any device"
            >
              <FileDown className="h-4 w-4" />
              <span>Download Offline eBook (.html)</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-[#141418] hover:bg-[#1E1E24] border border-[#2B2B33] px-3.5 py-3 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all"
              title="Download standard Markdown format for Obsidian, Notion, or local reading"
            >
              <FileText className="h-4 w-4 text-blue-400" />
              <span>Markdown (.md)</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-[#141418] hover:bg-[#1E1E24] border border-[#2B2B33] px-3.5 py-3 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all"
              title="Print directly or save as PDF"
            >
              <Printer className="h-4 w-4 text-zinc-400" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-[#141418] hover:bg-[#1E1E24] border border-[#2B2B33] px-3 py-3 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all"
              title="Copy entire manual as Markdown to clipboard"
            >
              {copiedState ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* Download Feedback Alert */}
        {downloadSuccess && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-200 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Reading Progress Indicator */}
        <div className="mt-5 pt-4 border-t border-[#1F1F23]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-[#8E9299]">
              Curriculum Progress: <strong className="text-white">{completedChapters.length} of {WORKBOOK_CHAPTERS.length} Chapters</strong> ({completionPercent}%)
            </span>
          </div>
          <div className="w-full sm:w-64 h-2 rounded-full bg-[#1F1F23] overflow-hidden border border-[#2A2A30]">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Chapters Sidebar + Active Lecture Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chapter Index & Search (4 columns on lg) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8E9299]" />
            <input
              type="text"
              placeholder="Search lectures (e.g. Gold, MT5, Risk)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#1F1F23] bg-[#141418] pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#6E717A] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[#8E9299] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Chapter Cards List */}
          <div className="rounded-2xl border border-[#1F1F23] bg-[#0E0E12] p-3 space-y-2">
            <div className="px-2 py-1.5 flex items-center justify-between text-[11px] font-mono text-[#8E9299] uppercase font-bold tracking-wider">
              <span>Lecture Modules</span>
              <span>{filteredChapters.length} Available</span>
            </div>

            <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredChapters.map((chapter) => {
                const isSelected = chapter.id === selectedChapterId;
                const isCompleted = completedChapters.includes(chapter.id);

                return (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border relative flex items-start space-x-3 ${
                      isSelected
                        ? 'border-blue-500/60 bg-blue-950/25 shadow-md shadow-blue-500/5'
                        : 'border-[#1B1B20] bg-[#121216] hover:bg-[#18181E] hover:border-zinc-700'
                    }`}
                  >
                    {/* Completion indicator circle */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChapterCompleted(chapter.id);
                      }}
                      className="mt-0.5 shrink-0 text-[#8E9299] hover:text-emerald-400 cursor-pointer"
                      title={isCompleted ? 'Mark as unread' : 'Mark as completed'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] font-bold uppercase text-blue-400">
                          Chapter {chapter.number}
                        </span>
                        <span className="font-mono text-[10px] text-[#8E9299] flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{chapter.readTime}</span>
                        </span>
                      </div>
                      <h4 className={`text-xs font-semibold leading-snug line-clamp-2 ${isSelected ? 'text-white font-bold' : 'text-zinc-300'}`}>
                        {chapter.title}
                      </h4>
                      <p className="text-[11px] text-[#8E9299] line-clamp-1">
                        {chapter.category}
                      </p>
                    </div>

                    <ChevronRight className={`h-4 w-4 shrink-0 mt-1 transition-transform ${isSelected ? 'text-blue-400 translate-x-0.5' : 'text-zinc-600'}`} />
                  </button>
                );
              })}

              {filteredChapters.length === 0 && (
                <div className="p-6 text-center text-xs text-[#8E9299] space-y-2">
                  <p>No chapters match "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-blue-400 hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Offline Reading Helper Card */}
          <div className="rounded-2xl border border-[#1F1F23] bg-[#101015] p-4 text-xs space-y-2.5">
            <div className="flex items-center space-x-2 text-white font-tech font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span>Offline Field Manual Features</span>
            </div>
            <p className="text-[#8E9299] leading-relaxed text-[11px]">
              The downloaded single-file HTML eBook contains zero external script dependencies. Save it to your phone, tablet, or laptop to review trading rules while traveling or offline.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-blue-400">
              <button
                onClick={handleDownloadHTML}
                className="hover:underline flex items-center space-x-1"
              >
                <span>Save Offline File</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
              <button
                onClick={handlePrintPDF}
                className="hover:underline text-zinc-400 hover:text-white"
              >
                Direct Print
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Lecture Content Reader (8 columns on lg) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-[#1F1F23] bg-[#0E0E12] p-5 sm:p-8 shadow-xl space-y-6">
            {/* Chapter Header */}
            <div className="pb-5 border-b border-[#1F1F23] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="rounded bg-blue-500/15 px-2.5 py-1 text-[11px] font-mono font-bold text-blue-300 border border-blue-500/30">
                    CHAPTER {activeChapter.number}
                  </span>
                  <span className="rounded bg-[#1F1F23] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#8E9299] border border-[#2E2E35]">
                    {activeChapter.category}
                  </span>
                  <span className="text-[11px] font-mono text-[#8E9299] flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{activeChapter.readTime}</span>
                  </span>
                </div>

                {/* Mark as Completed Toggle Button */}
                <button
                  onClick={() => toggleChapterCompleted(activeChapter.id)}
                  className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all border ${
                    completedChapters.includes(activeChapter.id)
                      ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                      : 'border-[#2E2E35] bg-[#141418] text-[#8E9299] hover:text-white'
                  }`}
                >
                  {completedChapters.includes(activeChapter.id) ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Mark Completed</span>
                    </>
                  )}
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white font-tech uppercase tracking-wide">
                {activeChapter.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#8E9299] font-medium leading-relaxed">
                {activeChapter.subtitle}
              </p>

              {/* Action Tab Quicklink inside Chapter */}
              {activeChapter.actionTab && (
                <div className="pt-2">
                  <button
                    onClick={() => onNavigateTab(activeChapter.actionTab!)}
                    className="inline-flex items-center space-x-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 px-3.5 py-2 text-xs font-mono font-bold text-blue-300 transition-all shadow-sm"
                  >
                    <span>Practical Execution: {activeChapter.actionLabel}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Executive Summary Box */}
            <div className="rounded-xl border border-blue-500/25 bg-blue-950/15 p-4 sm:p-5 space-y-2">
              <div className="flex items-center space-x-2 text-blue-300 font-mono text-xs font-bold uppercase tracking-wider">
                <Info className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Executive Summary</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {activeChapter.summary}
              </p>
            </div>

            {/* Key Objectives / Takeaways */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center space-x-2 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Key Learning Objectives</span>
              </div>
              <ul className="space-y-1.5">
                {activeChapter.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5 text-xs text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lecture Content Sections */}
            <div className="space-y-8 pt-2">
              {activeChapter.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-3.5">
                  <h3 className="text-base sm:text-lg font-bold text-white font-tech uppercase tracking-wide border-b border-[#1F1F23] pb-2">
                    {section.heading}
                  </h3>

                  <div className="space-y-3 text-xs sm:text-sm text-[#B7B9C2] leading-relaxed">
                    {section.paragraphs.map((para, pIdx) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>

                  {/* Code or Formula Snippet (if present) */}
                  {section.codeOrFormula && (
                    <div className="rounded-xl border border-[#26262F] bg-[#0A0A0E] p-3.5 my-3 font-mono text-xs text-blue-300 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                      <code>{section.codeOrFormula}</code>
                    </div>
                  )}

                  {/* Section Callout (if present) */}
                  {section.callout && (
                    <div
                      className={`rounded-xl border p-4 text-xs space-y-1.5 ${
                        section.callout.type === 'warning'
                          ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                          : section.callout.type === 'danger'
                          ? 'border-red-500/40 bg-red-950/20 text-red-200'
                          : section.callout.type === 'success'
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                          : 'border-blue-500/40 bg-blue-950/20 text-blue-200'
                      }`}
                    >
                      <span className="font-tech font-bold uppercase tracking-wider text-xs block">
                        {section.callout.title}
                      </span>
                      <p className="leading-relaxed opacity-90">{section.callout.text}</p>
                    </div>
                  )}

                  {/* Section Table (if present) */}
                  {section.table && (
                    <div className="overflow-x-auto rounded-xl border border-[#1F1F23] bg-[#0A0A0E] my-3">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-[#1F1F23] bg-[#14141A] text-zinc-300">
                            {section.table.headers.map((h, hIdx) => (
                              <th key={hIdx} className="p-3 font-semibold whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F1F23] text-[#A1A1AA]">
                          {section.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-[#121218]">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-3 whitespace-nowrap">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Interactive Knowledge Checkpoint / Quiz */}
            <div className="mt-8 rounded-2xl border border-blue-500/30 bg-[#12141C] p-5 sm:p-6 space-y-4">
              <div className="flex items-center space-x-2 text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="h-4 w-4" />
                <span>Chapter Knowledge Checkpoint</span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">
                  {activeChapter.quiz.question}
                </p>
                <div className="space-y-2 pt-2">
                  {activeChapter.quiz.options.map((opt, oIdx) => {
                    const selected = userAnswers[activeChapter.id] === oIdx;
                    const isCorrect = oIdx === activeChapter.quiz.correctIndex;
                    const answered = userAnswers[activeChapter.id] !== undefined;

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(activeChapter.id, oIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs font-mono flex items-start space-x-3 ${
                          answered && selected && isCorrect
                            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                            : answered && selected && !isCorrect
                            ? 'border-red-500 bg-red-950/30 text-red-200'
                            : answered && isCorrect
                            ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                            : 'border-[#1F1F23] bg-[#0C0D11] hover:bg-[#181922] text-zinc-300'
                        }`}
                      >
                        <span className="font-bold text-zinc-400 shrink-0">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {answered && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Answer Rationale Explanation */}
                {userAnswers[activeChapter.id] !== undefined && (
                  <div
                    className={`mt-3 rounded-xl p-3.5 text-xs font-mono leading-relaxed border ${
                      userAnswers[activeChapter.id] === activeChapter.quiz.correctIndex
                        ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                        : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
                    }`}
                  >
                    <strong>
                      {userAnswers[activeChapter.id] === activeChapter.quiz.correctIndex
                        ? '✓ Correct! '
                        : 'Rationale: '}
                    </strong>
                    <span>{activeChapter.quiz.explanation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Chapter Paging Buttons */}
            <div className="pt-6 border-t border-[#1F1F23] flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevChapter ? (
                <button
                  onClick={() => setSelectedChapterId(prevChapter.id)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-[#1F1F23] bg-[#141418] hover:bg-[#1E1E24] px-4 py-3 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous: Chapter {prevChapter.number}</span>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              <button
                onClick={() => toggleChapterCompleted(activeChapter.id)}
                className="w-full sm:w-auto rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 px-4 py-3 text-xs font-mono font-bold text-blue-300 transition-all"
              >
                {completedChapters.includes(activeChapter.id)
                  ? '✓ Completed Chapter'
                  : 'Mark Chapter as Completed'}
              </button>

              {nextChapter ? (
                <button
                  onClick={() => setSelectedChapterId(nextChapter.id)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-xs font-mono font-bold text-white transition-all shadow-md"
                >
                  <span>Next: Chapter {nextChapter.number}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="text-xs font-mono text-emerald-400 font-bold text-center sm:text-right">
                  🎉 Final Chapter Reached
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
