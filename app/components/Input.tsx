import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="fq-field">
      {label && inputId && <label htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={`fq-input${error ? " fq-input-error" : ""} ${className}`.trim()} aria-invalid={Boolean(error)} {...props} />
      {error && <p className="fq-field-error" role="alert">{error}</p>}
    </div>
  );
}
