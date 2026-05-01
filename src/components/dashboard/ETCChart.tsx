import { useEVM } from "@/contexts/EVMContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function ETCChart() {
  const { getTimeSeriesData } = useEVM();
  const data = getTimeSeriesData();

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold mb-4">ETC — Estimativa para Conclusão</h3>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">Sem dados para exibir</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Legend />
            <Line type="monotone" dataKey="etc" name="ETC" stroke="hsl(var(--chart-etc))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
