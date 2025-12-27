// components/form/SelectField.tsx
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface SelectFieldProps {
  label: string;
  options: readonly string[];
  register: UseFormRegisterReturn;
  error?: FieldError;
}

export default function SelectField({
  label,
  options,
  register,
  error,
}: SelectFieldProps) {
  return (
    <div className="mb-3">
      <label className="block mb-1 font-medium">{label}</label>

      <select {...register} className="basic-select">
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
