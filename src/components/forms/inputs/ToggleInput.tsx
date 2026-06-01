import type { UseFormRegisterReturn } from "react-hook-form";

interface ToggleInputProps {
  label: string;
  register: UseFormRegisterReturn;
  disabled?: boolean;
}

export default function ToggleInput({ label, register, disabled = false }: ToggleInputProps) {
  return (
    <label className={`flex items-center gap-3 select-none ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
      <input type="checkbox" className="sr-only peer" {...register} disabled={disabled} />
      <div className="w-10 h-5 bg-gray-300 rounded-full relative transition-colors peer-checked:bg-green-500 shrink-0">
        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform peer-checked:translate-x-5" />
      </div>
      <span className="text-sm">{label}</span>
    </label>
  );
}
