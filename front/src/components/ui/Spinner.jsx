export default function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div
      className={`${sizes[size]} rounded-full border-orange-500 border-t-transparent animate-spin`}
    />
  );
}
