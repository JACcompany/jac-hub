interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "primary" | "success" | "coffee";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, hint, accent = "primary", icon }: StatCardProps) {
  const color =
    accent === "success" ? "text-primary" :
    accent === "coffee"  ? "text-[color:var(--coffee)]" :
                           "text-secondary";
  return (
    <div className="card-soft rounded-2xl p-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        {icon && <div className={color}>{icon}</div>}
      </div>
      <div className="mt-2 text-3xl font-mono font-semibold tracking-tight">{value}</div>
      {hint && <div className={`mt-1 text-xs ${color}`}>{hint}</div>}
    </div>
  );
}
