import { useEVM } from "@/contexts/EVMContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatChartDate, axisTickStyle, axisStroke, tooltipContentStyle, tooltipLabelStyle, tooltipItemStyle } from "@/lib/chartFormat";

export function EACETCChart() {
  const { getTimeSeriesData } = useEVM();
  const data = getTimeSeriesData();

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold mb-4">EAC × ETC</h3>
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
            <Line type="monotone" dataKey="eac" name="EAC" stroke="hsl(var(--chart-eac))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="etc" name="ETC" stroke="hsl(var(--chart-etc))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
