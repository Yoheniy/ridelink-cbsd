import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      name,
      type = "text",
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
    const id = idProp ?? `field-${name}`;
    return (
      <div className={cn("field", className)}>
        <Label htmlFor={id}>
          {label}
          {required && " *"}
        </Label>
        <Input
          ref={ref}
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <span id={`${id}-error`} className="field__error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export default FormField;
