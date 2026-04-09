import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, className = '', type = 'text', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={ref}
        type={type}
        className={`border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;
