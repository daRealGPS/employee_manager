import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const baseClasses =
  'rounded-lg px-3 py-1 text-xs md:text-sm shadow hover:cursor-pointer inline-flex items-center justify-center gap-1';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-purple-600 hover:bg-purple-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

export default function ActionButton({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
