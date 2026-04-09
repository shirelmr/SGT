export default function ProgressBar({ value = 0, showLabel = true }) {
  const clamped = Math.min(100, Math.max(0, value));

  let color;
  if (clamped <= 30) color = 'bg-gradient-to-r from-red-400 to-red-500';
  else if (clamped <= 60) color = 'bg-gradient-to-r from-yellow-400 to-yellow-500';
  else color = 'bg-gradient-to-r from-green-400 to-green-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 min-w-[36px] text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
