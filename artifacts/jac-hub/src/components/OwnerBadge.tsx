import { Crown } from "lucide-react";

interface OwnerBadgeProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function OwnerBadge({ size = "md", showLabel = true, className = "" }: OwnerBadgeProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-[9px]" : size === "lg" ? "text-xs" : "text-[10px]";
  const padding = size === "sm" ? "px-1 py-0" : "px-1.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded font-bold uppercase tracking-widest owner-badge ${padding} ${textSize} ${className}`}
      title="OWNER — Fundador del estudio"
    >
      <Crown className={`${iconSize} owner-crown`} />
      {showLabel && <span>OWNER</span>}
    </span>
  );
}

interface OwnerNameProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export function OwnerName({ name, size = "md" }: OwnerNameProps) {
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  return (
    <span className={`owner-name font-bold ${textSize}`}>
      {name}
    </span>
  );
}
