import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Star,
  Brain,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Tag,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  Target,
  Award,
  Zap,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  TradeHistoryItem,
  DisciplineRating,
  EmotionalState,
  PlanAdherence,
  TradeJournalEntry,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { firestoreSync } from '../services/firestoreSync';
import { api } from '../services/api';

interface TradeJournalViewProps {
  tradesHistory: TradeHistoryItem[];
  onNavigateTab?: (tab: string) => void;
  onTradeReviewed?: (trade: TradeHistoryItem) => void;
}

const PRESET_MISTAKE_TAGS = [
  'FollowedRules',
  'PatienceOnEntry',
  'IdealRtoR',
  'LetWinnerRun',
  'CutLossFast',
  'HighConfluence',
  'FOMOEntry',
  'PrematureExit',
  'MovedStopLoss',
  'Overleveraged',
  'ChasedBreakout',
  'RevengeTrade',
  'IgnoredSpread',
  'FatiguedExecution',
];

const EMOTIONAL_STATES: { id: EmotionalState; label: string; icon: string; category: 'positive' | 'negative' | 'neutral' }[] = [
  { id: 'CALM_FOCUSED', label: 'Calm & Focused', icon: '🧘', category: 'positive' },
  { id: 'DISCIPLINED', label: 'Disciplined Execution', icon: '🎯', category: 'positive' },
  { id: 'PATIENT', label: 'Patient & Selective', icon: '⏳', category: 'positive' },
  { id: 'FOMO_IMPATIENT', label: 'FOMO / Impatient', icon: '⚡', category: 'negative' },
  { id: 'ANXIOUS_HESITANT', label: 'Anxious / Hesitant', icon: '😰', category: 'negative' },
  { id: 'OVERCONFIDENT', label: 'Overconfident', icon: '🚀', category: 'negative' },
  { id: 'REVENGE_BIAS', label: 'Revenge Bias', icon: '🔥', category: 'negative' },
  { id: 'FATIGUED', label: 'Fatigued / Distracted', icon: '🥱', category: 'neutral' },
];

export const TradeJournalView: React.FC<TradeJournalViewProps> = ({
  tradesHistory = [],
  onNavigateTab,
  onTradeReviewed,
}) => {
  const { user } = useAuth();

  // Local storage cache key for offline/fallback reviews
  const STORAGE_KEY = `quantara_journal_reviews_${user?.uid || 'guest'}`;

  // Merged reviews dictionary { [tradeId]: Partial<TradeHistoryItem> }
  const [reviewsMap, setReviewsMap] = useState<Record<string, Partial<TradeHistoryItem>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active modal trade for review
  const [selectedTrade, setSelectedTrade] = useState<TradeHistoryItem | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'needs_review' | 'reviewed' | 'wins' | 'losses'>('all');
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<'exitTime' | 'pnl' | 'discipline'>('exitTime');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Expanded card rows
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Form State for Active Review
  const [formRating, setFormRating] = useState<DisciplineRating>(5);
  const [formEmotion, setFormEmotion] = useState<EmotionalState>('CALM_FOCUSED');
  const [formPlan, setFormPlan] = useState<PlanAdherence>('STRICT_YES');
  const [formSetupQuality, setFormSetupQuality] = useState<'A+' | 'A' | 'B' | 'C' | 'D'>('A');
  const [formSubjectiveNotes, setFormSubjectiveNotes] = useState('');
  const [formLessonsLearned, setFormLessonsLearned] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [cloudSyncedCount, setCloudSyncedCount] = useState<number>(0);

  // 1. Subscribe to Cloud Firestore Journal if signed in
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firestoreSync.subscribeJournalTrades(user.uid, (cloudEntries: TradeJournalEntry[]) => {
      setCloudSyncedCount(cloudEntries.length);
      setReviewsMap((prev) => {
        const next = { ...prev };
        cloudEntries.forEach((entry) => {
          if (entry.id) {
            next[entry.id] = {
              ...next[entry.id],
              disciplineRating: entry.disciplineRating,
              emotionalState: entry.emotionalState,
              followedPlan: entry.followedPlan,
              mistakeTags: entry.mistakeTags,
              subjectiveNotes: entry.subjectiveNotes || entry.notes,
              lessonsLearned: entry.lessonsLearned,
              targetSetupQuality: entry.targetSetupQuality,
              psychologyReviewCompleted: entry.psychologyReviewCompleted ?? (!!entry.disciplineRating || !!entry.subjectiveNotes),
            };
          }
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore quota
        }
        return next;
      });
    });

    return () => unsubscribe();
  }, [user?.uid, STORAGE_KEY]);

  // Combine raw trades with subjective review overlays
  const mergedTrades = useMemo(() => {
    return tradesHistory.map((trade) => {
      const review = reviewsMap[trade.id];
      if (!review) return trade;
      return {
        ...trade,
        disciplineRating: review.disciplineRating ?? trade.disciplineRating,
        emotionalState: review.emotionalState ?? trade.emotionalState,
        followedPlan: review.followedPlan ?? trade.followedPlan,
        mistakeTags: review.mistakeTags ?? trade.mistakeTags,
        subjectiveNotes: review.subjectiveNotes ?? trade.subjectiveNotes ?? trade.notes,
        lessonsLearned: review.lessonsLearned ?? trade.lessonsLearned,
        targetSetupQuality: review.targetSetupQuality ?? trade.targetSetupQuality,
        psychologyReviewCompleted: review.psychologyReviewCompleted ?? trade.psychologyReviewCompleted ?? (!!review.disciplineRating || !!review.subjectiveNotes),
      };
    });
  }, [tradesHistory, reviewsMap]);

  // Performance & Psychological Metrics Calculations
  const stats = useMemo(() => {
    const total = mergedTrades.length;
    if (total === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        netPnl: 0,
        avgDiscipline: 0,
        adherenceRate: 0,
        calmRate: 0,
        reviewedCount: 0,
        pendingCount: 0,
        highDisciplineAvgPnl: 0,
        lowDisciplineAvgPnl: 0,
        disciplineCorrelationPositive: true,
        tagFrequencies: [] as { tag: string; count: number }[],
        emotionStats: [] as { state: EmotionalState; count: number; netPnl: number; winRate: number }[],
      };
    }

    const wins = mergedTrades.filter((t) => t.realizedPnl > 0);
    const winRate = (wins.length / total) * 100;
    const netPnl = mergedTrades.reduce((sum, t) => sum + t.realizedPnl, 0);

    const reviewed = mergedTrades.filter((t) => t.psychologyReviewCompleted || t.disciplineRating || t.subjectiveNotes);
    const reviewedCount = reviewed.length;
    const pendingCount = total - reviewedCount;

    // Average Discipline
    const ratedTrades = mergedTrades.filter((t) => typeof t.disciplineRating === 'number');
    const avgDiscipline = ratedTrades.length > 0
      ? ratedTrades.reduce((sum, t) => sum + (t.disciplineRating || 0), 0) / ratedTrades.length
      : 0;

    // Plan adherence rate
    const strictlyFollowed = mergedTrades.filter((t) => t.followedPlan === 'STRICT_YES').length;
    const adherenceRate = reviewedCount > 0 ? (strictlyFollowed / reviewedCount) * 100 : 0;

    // Calm / Positive rate
    const calmCount = mergedTrades.filter(
      (t) => t.emotionalState === 'CALM_FOCUSED' || t.emotionalState === 'DISCIPLINED' || t.emotionalState === 'PATIENT'
    ).length;
    const calmRate = reviewedCount > 0 ? (calmCount / reviewedCount) * 100 : 0;

    // Discipline vs Profitability Correlation
    const highDisciplineTrades = mergedTrades.filter((t) => (t.disciplineRating || 0) >= 4);
    const lowDisciplineTrades = mergedTrades.filter((t) => (t.disciplineRating || 0) <= 2 && (t.disciplineRating || 0) > 0);

    const highDisciplineAvgPnl = highDisciplineTrades.length > 0
      ? highDisciplineTrades.reduce((sum, t) => sum + t.realizedPnl, 0) / highDisciplineTrades.length
      : 0;
    const lowDisciplineAvgPnl = lowDisciplineTrades.length > 0
      ? lowDisciplineTrades.reduce((sum, t) => sum + t.realizedPnl, 0) / lowDisciplineTrades.length
      : 0;

    // Tag frequencies
    const tagCountMap: Record<string, number> = {};
    mergedTrades.forEach((t) => {
      (t.mistakeTags || []).forEach((tag) => {
        tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
      });
    });
    const tagFrequencies = Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Emotion stats breakdown
    const emotionStats = EMOTIONAL_STATES.map((em) => {
      const matching = mergedTrades.filter((t) => t.emotionalState === em.id);
      const eWins = matching.filter((t) => t.realizedPnl > 0).length;
      const eNetPnl = matching.reduce((sum, t) => sum + t.realizedPnl, 0);
      const eWinRate = matching.length > 0 ? (eWins / matching.length) * 100 : 0;
      return {
        state: em.id,
        count: matching.length,
        netPnl: eNetPnl,
        winRate: eWinRate,
      };
    }).filter((item) => item.count > 0);

    return {
      totalTrades: total,
      winRate,
      netPnl,
      avgDiscipline,
      adherenceRate,
      calmRate,
      reviewedCount,
      pendingCount,
      highDisciplineAvgPnl,
      lowDisciplineAvgPnl,
      disciplineCorrelationPositive: highDisciplineAvgPnl >= lowDisciplineAvgPnl,
      tagFrequencies,
      emotionStats,
    };
  }, [mergedTrades]);

  // Filtered & Sorted Trades
  const filteredTrades = useMemo(() => {
    return mergedTrades
      .filter((trade) => {
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSym = trade.symbol.toLowerCase().includes(q);
          const matchStrat = trade.strategyName?.toLowerCase().includes(q);
          const matchNotes = trade.subjectiveNotes?.toLowerCase().includes(q);
          const matchLessons = trade.lessonsLearned?.toLowerCase().includes(q);
          const matchTags = (trade.mistakeTags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchSym && !matchStrat && !matchNotes && !matchLessons && !matchTags) return false;
        }

        // Status Filter
        if (statusFilter === 'needs_review') {
          if (trade.psychologyReviewCompleted) return false;
        } else if (statusFilter === 'reviewed') {
          if (!trade.psychologyReviewCompleted) return false;
        } else if (statusFilter === 'wins') {
          if (trade.realizedPnl <= 0) return false;
        } else if (statusFilter === 'losses') {
          if (trade.realizedPnl >= 0) return false;
        }

        // Emotion Filter
        if (emotionFilter !== 'all') {
          if (trade.emotionalState !== emotionFilter) return false;
        }

        // Discipline Filter
        if (disciplineFilter !== 'all') {
          if (trade.disciplineRating !== disciplineFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === 'exitTime') {
          valA = a.exitTime || 0;
          valB = b.exitTime || 0;
        } else if (sortField === 'pnl') {
          valA = a.realizedPnl || 0;
          valB = b.realizedPnl || 0;
        } else if (sortField === 'discipline') {
          valA = a.disciplineRating || 0;
          valB = b.disciplineRating || 0;
        }
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [mergedTrades, searchQuery, statusFilter, emotionFilter, disciplineFilter, sortField, sortOrder]);

  // Open Review Modal
  const handleOpenReview = (trade: TradeHistoryItem) => {
    setSelectedTrade(trade);
    setFormRating(trade.disciplineRating || 5);
    setFormEmotion(trade.emotionalState || 'CALM_FOCUSED');
    setFormPlan(trade.followedPlan || 'STRICT_YES');
    setFormSetupQuality(trade.targetSetupQuality || 'A');
    setFormSubjectiveNotes(trade.subjectiveNotes || trade.notes || '');
    setFormLessonsLearned(trade.lessonsLearned || '');
    setFormTags(trade.mistakeTags ? [...trade.mistakeTags] : []);
    setCustomTagInput('');
  };

  // Toggle tag
  const handleToggleTag = (tag: string) => {
    setFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Add custom tag
  const handleAddCustomTag = () => {
    const clean = customTagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (!formTags.includes(clean)) {
      setFormTags((prev) => [...prev, clean]);
    }
    setCustomTagInput('');
  };

  // Save Trade Review
  const handleSaveReview = async () => {
    if (!selectedTrade) return;
    setIsSaving(true);

    const reviewData: Partial<TradeHistoryItem> = {
      disciplineRating: formRating,
      emotionalState: formEmotion,
      followedPlan: formPlan,
      targetSetupQuality: formSetupQuality,
      subjectiveNotes: formSubjectiveNotes.trim(),
      lessonsLearned: formLessonsLearned.trim(),
      mistakeTags: formTags,
      psychologyReviewCompleted: true,
      reviewedAt: Date.now(),
    };

    try {
      // 1. Save to local storage optimistically
      const nextMap = {
        ...reviewsMap,
        [selectedTrade.id]: reviewData,
      };
      setReviewsMap(nextMap);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap));
      } catch {
        // ignore
      }

      // 2. Persist to Express backend
      api.updateTradeJournalReview(selectedTrade.id, reviewData).catch((err) => {
        console.warn('Backend journal review save notice:', err);
      });

      // 3. Persist to Google Cloud Firestore if authenticated
      if (user?.uid) {
        await firestoreSync.saveTradeJournalReview(user.uid, selectedTrade.id, {
          disciplineRating: formRating,
          emotionalState: formEmotion,
          followedPlan: formPlan,
          targetSetupQuality: formSetupQuality,
          subjectiveNotes: formSubjectiveNotes.trim(),
          lessonsLearned: formLessonsLearned.trim(),
          mistakeTags: formTags,
          notes: formSubjectiveNotes.trim(),
        });
      }

      // Notify parent if handler provided
      if (onTradeReviewed) {
        onTradeReviewed({
          ...selectedTrade,
          ...reviewData,
        });
      }

      setFeedbackToast(`Review for ${selectedTrade.symbol} saved & synced.`);
      setTimeout(() => setFeedbackToast(null), 3500);
      setSelectedTrade(null);
    } catch (error) {
      console.error('Error saving trade journal review:', error);
      setFeedbackToast('Saved locally. Will sync to cloud once connection is confirmed.');
      setTimeout(() => setFeedbackToast(null), 3500);
      setSelectedTrade(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Export Journal to CSV
  const handleExportCSV = () => {
    if (mergedTrades.length === 0) return;

    const headers = [
      'Trade ID',
      'Symbol',
      'Direction',
      'Lot Size',
      'Entry Price',
      'Exit Price',
      'Realized PnL ($)',
      'Realized PnL (%)',
      'Strategy',
      'Exit Reason',
      'Entry Time (UTC)',
      'Exit Time (UTC)',
      'Discipline Rating (1-5)',
      'Emotional State',
      'Plan Adherence',
      'Setup Quality',
      'Tags',
      'Subjective Strategy Notes',
      'Actionable Lessons Learned',
    ];

    const rows = mergedTrades.map((t) => [
      `"${t.id}"`,
      `"${t.symbol}"`,
      `"${t.side}"`,
      t.lotSize || 0.01,
      t.entryPrice,
      t.exitPrice,
      t.realizedPnl.toFixed(2),
      (t.realizedPnlPercent * 100).toFixed(2),
      `"${t.strategyName || ''}"`,
      `"${t.exitReason || ''}"`,
      `"${new Date(t.entryTime).toISOString()}"`,
      `"${new Date(t.exitTime).toISOString()}"`,
      t.disciplineRating || '',
      `"${t.emotionalState || ''}"`,
      `"${t.followedPlan || ''}"`,
      `"${t.targetSetupQuality || ''}"`,
      `"${(t.mistakeTags || []).join('; ')}"`,
      `"${(t.subjectiveNotes || t.notes || '').replace(/"/g, '""')}"`,
      `"${(t.lessonsLearned || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Quantara_Trade_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-[#1F1F23] bg-[#0E0E11] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Automated Trade Journal
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Psychological Feedback Loop
                </span>
              </h1>
              <p className="text-xs text-[#8E9299]">
                Continuous historical execution telemetry, subjective mental reflections, and disciplined behavioral audits.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {stats.pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('needs_review')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/25 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{stats.pendingCount} Pending Review</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#181920] border border-[#27272A] text-zinc-300 hover:text-white text-xs font-medium hover:border-zinc-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          {user && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Cloud Sync: Active ({cloudSyncedCount} entries)</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Telemetry & Discipline Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Trades & Net PnL */}
        <div className="p-4 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-1">
          <span className="text-[11px] font-medium text-[#8E9299] uppercase tracking-wider block">Total Trades</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono">{stats.totalTrades}</span>
            <span className={`text-xs font-mono font-semibold ${stats.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.netPnl >= 0 ? '+' : ''}${stats.netPnl.toFixed(2)}
            </span>
          </div>
          <div className="text-[10px] text-[#8E9299]">Win Rate: <span className="text-zinc-200 font-mono">{stats.winRate.toFixed(1)}%</span></div>
        </div>

        {/* Avg Discipline Score */}
        <div className="p-4 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-1">
          <span className="text-[11px] font-medium text-[#8E9299] uppercase tracking-wider block">Discipline Score</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono flex items-center gap-1">
              {stats.avgDiscipline > 0 ? stats.avgDiscipline.toFixed(1) : '—'}
              <Star className="h-4 w-4 fill-amber-400 text-amber-400 inline" />
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">/ 5.0</span>
          </div>
          <div className="text-[10px] text-[#8E9299]">
            {stats.avgDiscipline >= 4.5 ? 'Institutional Elite' : stats.avgDiscipline >= 3.5 ? 'Consistent' : 'Emotional Leakage'}
          </div>
        </div>

        {/* Rule Adherence Rate */}
        <div className="p-4 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-1">
          <span className="text-[11px] font-medium text-[#8E9299] uppercase tracking-wider block">Plan Adherence</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-400 font-mono">{stats.adherenceRate.toFixed(0)}%</span>
            <Target className="h-4 w-4 text-emerald-400/60" />
          </div>
          <div className="text-[10px] text-[#8E9299]">Strict rule compliance</div>
        </div>

        {/* Emotional Stability */}
        <div className="p-4 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-1">
          <span className="text-[11px] font-medium text-[#8E9299] uppercase tracking-wider block">Mental State</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-blue-400 font-mono">{stats.calmRate.toFixed(0)}%</span>
            <Brain className="h-4 w-4 text-blue-400/60" />
          </div>
          <div className="text-[10px] text-[#8E9299]">Calm & disciplined entries</div>
        </div>

        {/* Discipline Alpha Card */}
        <div className="p-4 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-1">
          <span className="text-[11px] font-medium text-[#8E9299] uppercase tracking-wider block">Discipline Alpha</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-base font-bold font-mono ${stats.highDisciplineAvgPnl >= 0 ? 'text-emerald-400' : 'text-zinc-200'}`}>
              +${stats.highDisciplineAvgPnl.toFixed(2)}
            </span>
            <Award className="h-4 w-4 text-amber-400/70" />
          </div>
          <div className="text-[10px] text-[#8E9299]">Avg PnL on 4-5★ trades</div>
        </div>

        {/* Review Progress */}
        <div className="p-4 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-1">
          <span className="text-[11px] font-medium text-[#8E9299] uppercase tracking-wider block">Audit Progress</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white font-mono">{stats.reviewedCount} / {stats.totalTrades}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {stats.totalTrades > 0 ? Math.round((stats.reviewedCount / stats.totalTrades) * 100) : 0}%
            </span>
          </div>
          <div className="text-[10px] text-[#8E9299]">
            {stats.pendingCount === 0 ? 'All trades audited' : `${stats.pendingCount} need reflection`}
          </div>
        </div>
      </div>

      {/* Behavioral Analysis & Feedback Loops Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Discipline vs PnL Proof */}
        <div className="p-5 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Discipline vs. P&L Correlation</h2>
            </div>
            <span className="text-[10px] text-[#8E9299]">Proof of Edge</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Mathematical comparison of realized return between disciplined executions versus rule deviations:
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  High Discipline (4 - 5 Stars)
                </span>
                <span className="text-[10px] text-zinc-400">Strict rules & patient sizing</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {stats.highDisciplineAvgPnl >= 0 ? '+' : ''}${stats.highDisciplineAvgPnl.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 block">per trade avg</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-red-300 flex items-center gap-1">
                  Rule Deviations (1 - 2 Stars)
                </span>
                <span className="text-[10px] text-zinc-400">FOMO, early exit, impulse</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-red-400">
                  {stats.lowDisciplineAvgPnl >= 0 ? '+' : ''}${stats.lowDisciplineAvgPnl.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 block">per trade avg</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#141416] border border-[#27272A] text-[11px] text-zinc-300 flex items-start space-x-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Discipline Insight:</span> High discipline trades exhibit significantly superior statistical expectancy. Every rule breach leaks capital directly to the market spread.
            </div>
          </div>
        </div>

        {/* Card 2: Emotional State Breakdown */}
        <div className="p-5 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Emotional State Spectrum</h2>
            </div>
            <span className="text-[10px] text-[#8E9299]">Mindset Ledger</span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {stats.emotionStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8E9299]">
                Append emotional tags to your closed trades to populate your mindset spectrum.
              </div>
            ) : (
              stats.emotionStats.map((item) => {
                const emMeta = EMOTIONAL_STATES.find((e) => e.id === item.state);
                return (
                  <div
                    key={item.state}
                    className="p-2 rounded-lg bg-[#141416] border border-[#1F1F23] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{emMeta?.icon || '🧠'}</span>
                      <div>
                        <span className="font-medium text-white">{emMeta?.label || item.state}</span>
                        <span className="text-[10px] text-[#8E9299] block">{item.count} trade{item.count > 1 ? 's' : ''} ({item.winRate.toFixed(0)}% win)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${item.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.netPnl >= 0 ? '+' : ''}${item.netPnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card 3: Execution Tags & Feedback Loops */}
        <div className="p-5 rounded-xl border border-[#1F1F23] bg-[#0E0E11] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Execution & Leakage Tags</h2>
            </div>
            <span className="text-[10px] text-[#8E9299]">Behavioral Cloud</span>
          </div>

          <p className="text-xs text-zinc-400">
            Identify repeat execution strengths and recurring psychological errors:
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {stats.tagFrequencies.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8E9299] w-full">
                No tags recorded yet. Select any closed trade below and tag your behavior!
              </div>
            ) : (
              stats.tagFrequencies.map(({ tag, count }) => {
                const isPositive = ['FollowedRules', 'PatienceOnEntry', 'IdealRtoR', 'LetWinnerRun', 'CutLossFast', 'HighConfluence'].includes(tag);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-300 border border-red-500/20'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="px-1 rounded bg-black/40 text-[9px] text-zinc-300">{count}</span>
                  </span>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-[#1F1F23]">
            <div className="text-[11px] text-[#8E9299]">
              <span className="text-zinc-300 font-semibold">Feedback Loop Rule:</span> Every mistake tagged with <span className="text-red-400">#FOMOEntry</span> or <span className="text-red-400">#PrematureExit</span> requires mandatory 15-minute cool-off before entering another order.
            </div>
          </div>
        </div>
      </div>

      {/* Historical Performance Log Table Header & Controls */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#0E0E11] shadow-2xl overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-[#1F1F23] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#141416]/50">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-[#8E9299] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol, strategy, subjective notes, or #tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E0E11] border border-[#27272A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8E9299] focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-[#181920] text-zinc-400 hover:text-white border border-[#27272A]'
              }`}
            >
              All Trades ({stats.totalTrades})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('needs_review')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'needs_review'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-[#181920] text-zinc-400 hover:text-white border border-[#27272A]'
              }`}
            >
              Needs Review ({stats.pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('reviewed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'reviewed'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-[#181920] text-zinc-400 hover:text-white border border-[#27272A]'
              }`}
            >
              Reviewed ({stats.reviewedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('wins')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'wins'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-[#181920] text-zinc-400 hover:text-white border border-[#27272A]'
              }`}
            >
              Wins
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('losses')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'losses'
                  ? 'bg-red-700 text-white font-semibold'
                  : 'bg-[#181920] text-zinc-400 hover:text-white border border-[#27272A]'
              }`}
            >
              Losses
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#8E9299]">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-[#0E0E11] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="exitTime">Closed Time</option>
              <option value="pnl">Realized P&L</option>
              <option value="discipline">Discipline Score</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 rounded-lg bg-[#181920] border border-[#27272A] text-zinc-300 hover:text-white"
              title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            >
              {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Trades Table List */}
        {filteredTrades.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-[#8E9299] mx-auto opacity-40" />
            <h3 className="text-sm font-semibold text-white">No Closed Trades Found Matching Criteria</h3>
            <p className="text-xs text-[#8E9299] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try clearing your search query or switching the filter tab.'
                : 'As the trading engine and MT5 servers execute and close trades, they will automatically appear here for psychological audit.'}
            </p>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                <span>Go to Live Terminal</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#1F1F23]">
            {filteredTrades.map((trade) => {
              const isProfit = trade.realizedPnl >= 0;
              const hasReview = trade.psychologyReviewCompleted || trade.disciplineRating || trade.subjectiveNotes;
              const isExpanded = expandedTradeId === trade.id;
              const emotionMeta = EMOTIONAL_STATES.find((e) => e.id === trade.emotionalState);
              const durationSec = Math.max(0, Math.round(((trade.exitTime || 0) - (trade.entryTime || 0)) / 1000));
              const durationStr = durationSec < 60
                ? `${durationSec}s`
                : durationSec < 3600
                ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
                : `${(durationSec / 3600).toFixed(1)}h`;

              return (
                <div
                  key={trade.id}
                  className={`p-4 transition-colors ${
                    isExpanded ? 'bg-[#141416]' : 'hover:bg-[#121215]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Column 1: Trade Meta & Symbol */}
                    <div className="flex items-start space-x-3 min-w-[260px]">
                      <div
                        className={`px-2 py-1 rounded text-[11px] font-mono font-bold uppercase shrink-0 ${
                          trade.side === 'LONG'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                        }`}
                      >
                        {trade.side}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white font-mono">{trade.symbol}</span>
                          <span className="text-xs text-[#8E9299] font-mono">
                            {trade.lotSize ? `${trade.lotSize.toFixed(2)} Lots` : `${trade.quantity} units`}
                          </span>
                          {trade.accountName && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                              {trade.accountName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8E9299] flex items-center space-x-2 pt-0.5">
                          <span>${trade.entryPrice.toFixed(2)} ➔ ${trade.exitPrice?.toFixed(2) || '0.00'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3 inline" />
                            {durationStr}
                          </span>
                          <span>•</span>
                          <span>{trade.strategyName || 'Autonomous Engine'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Realized P&L */}
                    <div className="flex items-center space-x-6 min-w-[160px]">
                      <div>
                        <span className="text-[10px] text-[#8E9299] uppercase tracking-wider block">Realized Return</span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className={`text-base font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}${trade.realizedPnl.toFixed(2)}
                          </span>
                          <span className={`text-xs font-mono font-medium ${isProfit ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                            ({isProfit ? '+' : ''}{(trade.realizedPnlPercent * 100).toFixed(2)}%)
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500">{trade.exitReason || 'EXECUTION_CLOSED'}</span>
                      </div>
                    </div>

                    {/* Column 3: Psychological Discipline Badges */}
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      {hasReview ? (
                        <>
                          {/* Discipline Stars */}
                          <div className="inline-flex items-center space-x-0.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= (trade.disciplineRating || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-zinc-600'
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-[11px] font-mono">{trade.disciplineRating}/5</span>
                          </div>

                          {/* Emotional State Badge */}
                          {trade.emotionalState && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                              <span>{emotionMeta?.icon || '🧠'}</span>
                              <span className="text-[11px] font-medium">{emotionMeta?.label || trade.emotionalState}</span>
                            </span>
                          )}

                          {/* Plan Adherence Badge */}
                          {trade.followedPlan && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                trade.followedPlan === 'STRICT_YES'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : trade.followedPlan === 'MINOR_DEVIATION'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-red-500/15 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {trade.followedPlan === 'STRICT_YES'
                                ? 'Strict Plan'
                                : trade.followedPlan === 'MINOR_DEVIATION'
                                ? 'Minor Deviation'
                                : 'Rule Breach'}
                            </span>
                          )}

                          {/* Setup Quality */}
                          {trade.targetSetupQuality && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              Setup: {trade.targetSetupQuality}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                          <span>Pending Psychological Review</span>
                        </div>
                      )}
                    </div>

                    {/* Column 4: Review Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(trade)}
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          hasReview
                            ? 'bg-[#181920] border border-[#27272A] text-zinc-300 hover:text-white hover:border-zinc-500'
                            : 'bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20'
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{hasReview ? 'Edit Review' : 'Add Note & Review'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                        className="p-1.5 rounded-lg bg-[#181920] border border-[#27272A] text-zinc-400 hover:text-white"
                        title={isExpanded ? 'Collapse notes' : 'Expand notes'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Subjective Notes & Feedback Loop Preview */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#1F1F23] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in">
                      {/* Subjective Notes */}
                      <div className="p-3 rounded-lg bg-[#0E0E11] border border-[#1F1F23] space-y-1.5">
                        <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                          Subjective Strategy Reflections:
                        </span>
                        <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                          {trade.subjectiveNotes || trade.notes || (
                            <span className="text-zinc-600 italic">No subjective reflections written yet. Click &apos;Add Note &amp; Review&apos; above.</span>
                          )}
                        </p>
                      </div>

                      {/* Lessons Learned & Tags */}
                      <div className="p-3 rounded-lg bg-[#0E0E11] border border-[#1F1F23] space-y-2">
                        <div>
                          <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            Actionable Takeaway (Feedback Loop):
                          </span>
                          <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap pt-1">
                            {trade.lessonsLearned || (
                              <span className="text-zinc-600 italic">No feedback rule set yet.</span>
                            )}
                          </p>
                        </div>

                        {trade.mistakeTags && trade.mistakeTags.length > 0 && (
                          <div className="pt-2 border-t border-[#1F1F23] flex flex-wrap gap-1">
                            {trade.mistakeTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Review Trade & Psychological Audit */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0E0E11] border border-[#1F1F23] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1F1F23] bg-[#141416] flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                      selectedTrade.side === 'LONG'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    }`}
                  >
                    {selectedTrade.side}
                  </span>
                  <h3 className="text-base font-bold text-white font-mono">{selectedTrade.symbol}</h3>
                  <span className="text-xs text-[#8E9299] font-mono">
                    {selectedTrade.lotSize ? `${selectedTrade.lotSize.toFixed(2)} Lots` : `${selectedTrade.quantity} units`}
                  </span>
                </div>
                <p className="text-xs text-[#8E9299] mt-0.5">
                  Closed with{' '}
                  <span className={`font-mono font-bold ${selectedTrade.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedTrade.realizedPnl >= 0 ? '+' : ''}${selectedTrade.realizedPnl.toFixed(2)} ({(selectedTrade.realizedPnlPercent * 100).toFixed(2)}%)
                  </span>{' '}
                  via {selectedTrade.exitReason || 'TAKE_PROFIT'}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrade(null)}
                className="p-1.5 rounded-lg bg-[#181920] border border-[#27272A] text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Form Fields */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Field 1: Discipline Rating (1 to 5 Stars) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    Psychological Discipline Score:
                  </label>
                  <span className="text-amber-400 font-mono font-bold text-sm">{formRating} / 5 Stars</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((score) => {
                    const descriptions = [
                      'Severe Tilt (Impulse / Revenge)',
                      'High Rule Breach (Fear exit / Moved SL)',
                      'Neutral (Followed plan with hesitation)',
                      'Solid Discipline (Minor emotional friction)',
                      'Flawless Execution (100% Rule Adherence)',
                    ];
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setFormRating(score as DisciplineRating)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          formRating === score
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-500'
                            : 'bg-[#141416] border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          <Star className={`h-4 w-4 ${formRating >= score ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                        </div>
                        <div className="font-mono text-sm">{score}★</div>
                        <div className="text-[9px] text-zinc-400 mt-1 leading-tight line-clamp-2">
                          {descriptions[score - 1]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 2: Emotional State During Execution */}
              <div className="space-y-2">
                <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-blue-400" />
                  Emotional Mindset at Entry & Management:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EMOTIONAL_STATES.map((em) => {
                    const isSelected = formEmotion === em.id;
                    return (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => setFormEmotion(em.id)}
                        className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white font-semibold ring-1 ring-blue-500'
                            : 'bg-[#141416] border-[#27272A] text-zinc-400 hover:text-white hover:border-zinc-500'
                        }`}
                      >
                        <span className="text-base">{em.icon}</span>
                        <span className="text-[11px] truncate">{em.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Plan Adherence & Setup Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plan Adherence */}
                <div className="space-y-2">
                  <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-emerald-400" />
                    Plan Adherence:
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'STRICT_YES', label: 'Strict Plan (100% Rules Followed)', color: 'text-emerald-400' },
                      { id: 'MINOR_DEVIATION', label: 'Minor Deviation (Slight hesitation)', color: 'text-amber-400' },
                      { id: 'BREACHED_RULES', label: 'Breached Rules (Tampered with SL / Sized up)', color: 'text-red-400' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormPlan(opt.id as PlanAdherence)}
                        className={`w-full p-2 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                          formPlan === opt.id
                            ? 'bg-emerald-500/10 border-emerald-500 text-white font-medium'
                            : 'bg-[#141416] border-[#27272A] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {formPlan === opt.id && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Setup Quality */}
                <div className="space-y-2">
                  <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-purple-400" />
                    Setup Grade:
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['A+', 'A', 'B', 'C', 'D'] as const).map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setFormSetupQuality(grade)}
                        className={`py-2 rounded-lg border text-center font-mono font-bold text-xs transition-colors ${
                          formSetupQuality === grade
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 ring-1 ring-purple-500'
                            : 'bg-[#141416] border-[#27272A] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-500 block pt-1">
                    Grade setup based on pre-market confluence, liquidity zones, and risk-to-reward ratio.
                  </span>
                </div>
              </div>

              {/* Field 4: Subjective Strategy Reflections */}
              <div className="space-y-1.5">
                <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  Subjective Strategy Notes:
                </label>
                <textarea
                  rows={3}
                  value={formSubjectiveNotes}
                  onChange={(e) => setFormSubjectiveNotes(e.target.value)}
                  placeholder="Record what was going through your mind during this trade. Did you feel anxiety? Why did you enter? Was the spread normal? Did you feel temptation to close early?..."
                  className="w-full bg-[#141416] border border-[#27272A] rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
                />
              </div>

              {/* Field 5: Actionable Feedback Loop Rule */}
              <div className="space-y-1.5">
                <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Actionable Feedback Loop (Rule for Next Trade):
                </label>
                <input
                  type="text"
                  value={formLessonsLearned}
                  onChange={(e) => setFormLessonsLearned(e.target.value)}
                  placeholder="e.g., Wait for 5m candle close before entry; do not touch stop loss once set."
                  className="w-full bg-[#141416] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Field 6: Behavioral Tags Cloud */}
              <div className="space-y-2">
                <label className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-zinc-400" />
                  Execution &amp; Behavioral Tags:
                </label>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {PRESET_MISTAKE_TAGS.map((tag) => {
                    const isSelected = formTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-[#181920] border border-[#27272A] text-zinc-400 hover:text-white'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                  {formTags.filter((t) => !PRESET_MISTAKE_TAGS.includes(t)).map((custom) => (
                    <button
                      key={custom}
                      type="button"
                      onClick={() => handleToggleTag(custom)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-purple-600 text-white font-semibold flex items-center gap-1"
                    >
                      <span>#{custom}</span>
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>

                {/* Add Custom Tag */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom tag (e.g. LondonBreakout)..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    className="flex-1 bg-[#141416] border border-[#27272A] rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1 rounded-lg bg-[#181920] border border-[#27272A] text-xs text-zinc-300 hover:text-white flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Tag</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1F1F23] bg-[#141416] flex items-center justify-between">
              <span className="text-[11px] text-[#8E9299]">
                {user ? 'Cloud sync enabled' : 'Saved locally in operator storage'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedTrade(null)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-[#27272A] text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving &amp; Syncing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save &amp; Commit Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
