import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Props {
  data: number[];
  title?: string;
}

export function ProductivityChart({ data, title = "Productividad semanal" }: Props) {
  const chartData = data.map((v, i) => ({ day: DAYS[i], min: v }));
  const delta = Math.round((data[data.length - 1] - data[0]) || 0);

  return (
    <div className="card-soft rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Gráfico</div>
          <div className="text-base font-mono font-semibold mt-1">{title}</div>
        </div>
        <div className={`text-xs font-mono ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
          {delta >= 0 ? "+" : ""}{delta} min vs lunes
        </div>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ccc-chart-gr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(v: number) => [`${v} min`, "Programando"]}
            />
            <Area type="monotone" dataKey="min" stroke="#00d4ff" strokeWidth={2} fill="url(#ccc-chart-gr)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
