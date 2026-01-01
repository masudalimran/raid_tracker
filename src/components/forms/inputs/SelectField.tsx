// components/form/SelectField.tsx
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface SelectFieldProps {
  label: string;
  labelIcon?: string;
  options: readonly string[];
  register: UseFormRegisterReturn;
  error?: FieldError;
  className?: string;
}

export default function SelectField({
  label,
  labelIcon,
  options,
  register,
  error,
  className,
}: SelectFieldProps) {
  return (
    <div className="mb-3">
      <label className="mb-1 font-medium flex justify-start items-center gap-2">
        {label}
        {labelIcon && (
          <img src={labelIcon} className="w-5 h-5 object-cover rounded-full" />
        )}
      </label>

      <select {...register} className={`basic-select ${className}`}>
        <option value="">Select {label}</option>

        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
}
