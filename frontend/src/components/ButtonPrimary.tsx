import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonPrimaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function ButtonPrimary({
  children,
  className = '',
  ...props
}: ButtonPrimaryProps) {
  const base = 'w-full bg-purple-700 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow hover:cursor-pointer';
  const combined = `${base} ${className}`.trim();

  return (
    <button className={combined} {...props}>
      {children}
    </button>
  );
}
