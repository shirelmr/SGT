export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-sora text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}
