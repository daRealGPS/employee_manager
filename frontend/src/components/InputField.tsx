interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
}

  
export default function InputField({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  onChange,
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(name, e.target.value)}
        disabled={disabled}
        className={`p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-300 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}

  
