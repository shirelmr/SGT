export default function Card({ title, children, className = '', borderColor }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}
      style={borderColor ? { borderLeft: `4px solid ${borderColor}` } : {}}
    >
      {title && (
        <h3 className="font-sora font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}
