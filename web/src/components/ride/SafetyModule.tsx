import type { ReactNode } from "react";
import { Button } from "../ui/button";

type SafetyAction = {
  label: string;
  variant?: "primary" | "danger";
};

type SafetyModuleProps = {
  title?: string;
  description?: ReactNode;
  actionsClassName: string;
  buttonBaseClassName: string;
  actions: SafetyAction[];
};

function SafetyModule({
  title = "Safety Module",
  description,
  actionsClassName,
  buttonBaseClassName,
  actions
}: SafetyModuleProps) {
  return (
    <>
      <h2>{title}</h2>
      {description}
      <div className={actionsClassName}>
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant={action.variant === "danger" ? "destructive" : "ghost"}
            className={`${buttonBaseClassName} ${action.variant === "danger" ? `${buttonBaseClassName}--danger` : action.variant === "primary" ? `${buttonBaseClassName}--primary` : ""}`.trim()}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </>
  );
}

export default SafetyModule;
