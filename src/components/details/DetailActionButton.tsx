import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type DetailActionTone =
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | "emerald"
  | "rose";

interface DetailActionButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  tone?: DetailActionTone;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Detail-page adapter for the shared Button. Keep this small wrapper only for
 * readable detail-page code; visual styles live in components/ui/button.
 */
export function DetailActionButton({
  children,
  icon,
  tone = "secondary",
  onClick,
  disabled = false,
  className = "",
}: DetailActionButtonProps) {
  const toneVariantMap: Record<
    DetailActionTone,
    "primary" | "secondary" | "danger" | "outline"
  > = {
    primary: "primary",
    secondary: "outline",
    warning: "outline",
    danger: "danger",
    emerald: "outline",
    rose: "danger",
  };

  const warningClass =
    tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
      : "";
  const emeraldClass =
    tone === "emerald"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : "";

  return (
    <Button
      variant={toneVariantMap[tone]}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`w-full justify-center gap-2 ${warningClass} ${emeraldClass} ${className}`}
    >
      {icon}
      {children}
    </Button>
  );
}
