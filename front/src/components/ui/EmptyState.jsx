import Button from './Button';

export default function EmptyState({ icon, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="font-sora font-semibold text-gray-800 text-lg mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-6 max-w-xs">{description}</p>}
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
}
