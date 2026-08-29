export default function FormField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        aria-invalid={error ? true : undefined}
        className={
          error
            ? "rounded-sm border border-error bg-canvas px-[11px] py-[8px] text-[14px] text-ink outline-none transition-colors placeholder:text-ink-mute"
            : "rounded-sm border border-hairline-input bg-canvas px-[11px] py-[8px] text-[14px] text-ink outline-none transition-colors placeholder:text-ink-mute focus:border-primary"
        }
      />
      {error && <p className="text-[12px] text-error">{error}</p>}
    </div>
  );
}
