import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      label,
      name,
      placeholder,
      value,
      onChange,
      required,
      error,
      className,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const id = idProp ?? `field-${name}`;
    return (
      <div className={cn("field", className)}>
        <Label htmlFor={id}>
          {label}
          {required && " *"}
        </Label>
        <div className="password-field">
          <Input
            ref={ref}
            id={id}
            name={name}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            autoComplete="current-password"
            {...props}
          />
          <button
            type="button"
            className="password-field__toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && (
          <span id={`${id}-error`} className="field__error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";

export default PasswordField;
