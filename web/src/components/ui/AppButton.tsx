import * as React from "react";
import { cn } from "@/lib/utils";

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, type = "button", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn("ui-btn ui-btn--md btn--primary", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
AppButton.displayName = "AppButton";

export default AppButton;
