import { useEVM } from "@/contexts/EVMContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatChartDate, axisTickStyle, axisStroke, tooltipContentStyle, tooltipLabelStyle, tooltipItemStyle } from "@/lib/chartFormat";

export function CVSVChart() {
  const { getTimeSeriesData } = useEVM();
  const data = getTimeSeriesData();

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold mb-4">CV × SV</h3>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">Sem dados para exibir</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={axisTickStyle} stroke={axisStroke} tickFormatter={formatChartDate} />
            <YAxis tick={axisTickStyle} stroke={axisStroke} />
            <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} labelFormatter={formatChartDate} />
            <Legend />
            <Line type="monotone" dataKey="cv" name="CV" stroke="hsl(var(--chart-cv))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="sv" name="SV" stroke="hsl(var(--chart-sv))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
