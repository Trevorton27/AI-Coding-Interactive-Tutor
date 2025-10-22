// apps/web/app/components/ProgressBar.tsx
"use client";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function ProgressBar({ 
  value, 
  label, 
  showPercentage = true,
  color = 'blue' 
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const colorStyles = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-600">{Math.round(clampedValue)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full ${colorStyles[color]} transition-all duration-300 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

// Mastery-specific progress bar
interface MasteryProgressProps {
  mastery: number; // 600-1800
  conceptName: string;
}

export function MasteryProgress({ mastery, conceptName }: MasteryProgressProps) {
  // Convert 600-1800 scale to 0-100
  const percentage = ((mastery - 600) / 1200) * 100;
  
  // Determine color based on mastery
  let color: 'red' | 'yellow' | 'blue' | 'green' = 'blue';
  if (mastery < 800) color = 'red';
  else if (mastery < 1000) color = 'yellow';
  else if (mastery >= 1400) color = 'green';

  const level = mastery < 900 ? 'Beginner' 
    : mastery < 1200 ? 'Intermediate' 
    : mastery < 1500 ? 'Advanced' 
    : 'Expert';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-900">{conceptName}</span>
        <span className="text-xs text-gray-600">{level}</span>
      </div>
      <ProgressBar value={percentage} color={color} showPercentage={false} />
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>600</span>
        <span className="font-medium">{mastery}</span>
        <span>1800</span>
      </div>
    </div>
  );
}