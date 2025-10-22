// apps/web/app/components/TaskCard.tsx
"use client";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    difficulty: number;
    conceptIds: string[];
  };
  completed?: boolean;
  locked?: boolean;
  onSelect?: () => void;
}

export function TaskCard({ task, completed = false, locked = false, onSelect }: TaskCardProps) {
  const difficultyColors = {
    1: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    2: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    3: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
    4: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    5: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
  };

  const style = difficultyColors[task.difficulty as keyof typeof difficultyColors] || difficultyColors[1];

  return (
    <div
      onClick={locked ? undefined : onSelect}
      className={`
        relative border rounded-lg p-4 transition-all
        ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:scale-[1.02]'}
        ${completed ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}
      `}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        {completed && <span className="text-2xl">✅</span>}
        {locked && <span className="text-2xl">🔒</span>}
      </div>

      {/* Difficulty Badge */}
      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${style.bg} ${style.border} ${style.text} border`}>
        Level {task.difficulty}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 pr-8">
        {task.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {task.description}
      </p>

      {/* Concepts */}
      {task.conceptIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.conceptIds.slice(0, 3).map((conceptId) => (
            <span
              key={conceptId}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
            >
              {conceptId.split('-').pop()}
            </span>
          ))}
          {task.conceptIds.length > 3 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              +{task.conceptIds.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}