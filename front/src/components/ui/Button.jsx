import Spinner from './Spinner';

const variants = {
  primary: 'bg-[#4a1f06] text-white shadow-sm hover:bg-[#3a1804]',
  secondary: 'bg-[#fff3e8] text-[#4a1f06] hover:bg-[#ffe8d0]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border-2 border-[#4a1f06] text-[#4a1f06] hover:bg-[#fff3e8]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
