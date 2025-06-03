interface StatusPillProps {
  label: string;
  variant: 'success' | 'error' | 'warning';
}

export default function StatusPill({ label, variant }: StatusPillProps) {
  const base = 'inline-flex px-2 py-1 rounded-full text-xs font-medium';
  const colors =
    variant === 'success'
      ? 'bg-green-100 text-green-800'
      : variant === 'error'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-800';

  return <span className={`${base} ${colors}`}>{label}</span>;
}

