import React, { useState } from 'react';
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  Shield,
  Sliders,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react';

interface TestItem {
  id: string;
  name: string;
  category: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  message: string;
}

interface SystemTestingViewProps {
  onRunTests: () => Promise<{ total: number; passed: number; failed: number; results: TestItem[] }>;
}

export const SystemTestingView: React.FC<SystemTestingViewProps> = ({ onRunTests }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: TestItem[];
  } | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await onRunTests();
      setTestResults(res);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Automated Verification & Unit Test Harness
              </h2>
              <p className="text-xs text-[#8E9299]">
                13-suite mathematical and functional test battery validating indicators, sizing, stops, and circuit breakers
              </p>
            </div>
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors flex items-center space-x-2 shadow-md shadow-blue-600/20"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Executing Assertion Suites...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Run Complete Test Harness</span>
              </>
            )}
          </button>
        </div>

        {testResults && (
          <div className="flex items-center space-x-4 pt-1 font-mono text-xs">
            <span className="text-[#8E9299]">
              Total Tests: <strong className="text-white">{testResults.total}</strong>
            </span>
            <span className="text-[#10B981] font-bold">Passed: {testResults.passed}</span>
            <span className="text-[#EF4444] font-bold">Failed: {testResults.failed}</span>
            <span className="text-[#8E9299]">
              Status: {testResults.failed === 0 ? 'ALL GREEN (100% PASS)' : 'FAILURES DETECTED'}
            </span>
          </div>
        )}
      </div>

      {/* Tests Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {testResults?.results.map((test) => {
          const isPassed = test.status === 'PASSED';
          return (
            <div
              key={test.id}
              className={`rounded-xl border p-4 space-y-2.5 transition-all ${
                isPassed ? 'border-[#1F1F23] bg-[#141416]' : 'border-[#EF4444]/40 bg-[#EF4444]/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isPassed ? (
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#EF4444] shrink-0" />
                  )}
                  <span className="font-semibold text-white text-xs">{test.name}</span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider font-mono ${
                    isPassed ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444]'
                  }`}
                >
                  {test.status} ({test.durationMs}ms)
                </span>
              </div>

              <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-semibold">{test.category}</div>
              <div className="text-xs text-[#E4E4E7] rounded-lg bg-[#0E0E11] p-2.5 border border-[#1F1F23] leading-relaxed font-mono">
                {test.message}
              </div>
            </div>
          );
        })}
      </div>

      {!testResults && (
        <div className="rounded-xl border border-dashed border-[#1F1F23] bg-[#141416]/50 p-12 text-center text-[#8E9299]">
          Click <strong className="text-white">"Run Complete Test Harness"</strong> to execute and verify the 13 institutional validation suites.
        </div>
      )}
    </div>
  );
};
