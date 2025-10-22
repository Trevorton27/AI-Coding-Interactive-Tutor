// apps/web/app/components/HintIndicator.tsx
"use client";

interface HintIndicatorProps {
  level: 1 | 2 | 3;
  conceptTag?: string;
}

export function HintIndicator({ level, conceptTag }: HintIndicatorProps) {
  const colors = {
    1: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', emoji: '🟡' },
    2: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', emoji: '🟠' },
    3: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', emoji: '🔴' }
  };

  const labels = {
    1: 'Conceptual Hint',
    2: 'API Reference',
    3: 'Code Pattern'
  };

  const style = colors[level];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${style.bg} ${style.border}`}>
      <span className="text-lg">{style.emoji}</span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${style.text}`}>
          {labels[level]}
        </p>
        {conceptTag && (
          <p className="text-xs text-gray-600 mt-0.5">
            Concept: {conceptTag}
          </p>
        )}
      </div>
      <span className={`text-xs font-semibold ${style.text}`}>
        Level {level}
      </span>
    </div>
  );
}