import { useState } from 'react';

interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col relative">
      <label htmlFor={name} className="mb-1 font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-300"
        placeholder={label}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-9 text-sm text-blue-500"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}