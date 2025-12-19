import { Controller, type Control } from "react-hook-form";

interface StarRatingInputProps {
  name: string;
  control: Control<any>;
  max?: number;
  label: string;
  allowZero?: boolean;
}

export default function StarRatingInput({
  name,
  control,
  max = 6,
  label,
  allowZero = false,
}: StarRatingInputProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = field.value ?? (allowZero ? 0 : 1);

        return (
          <div className="mb-3">
            <label className="block mb-1 font-medium">{label}</label>

            <div className="flex gap-1">
              {[...Array(max)].map((_, index) => {
                const starValue = index + 1;
                const active = starValue <= value;

                return (
                  <button
                    type="button"
                    key={starValue}
                    onClick={() => field.onChange(starValue)}
                    className={`text-2xl cursor-pointer hover:text-yellow-400 transition ${
                      active ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                );
              })}

              {allowZero && (
                <button
                  type="button"
                  onClick={() => field.onChange(0)}
                  className="ml-2 text-sm text-gray-500 underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
