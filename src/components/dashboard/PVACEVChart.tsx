import { useEVM } from "@/contexts/EVMContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatChartDate, axisTickStyle, axisStroke, tooltipContentStyle, tooltipLabelStyle, tooltipItemStyle } from "@/lib/chartFormat";

export function PVACEVChart() {
  const { getTimeSeriesData } = useEVM();
  const data = getTimeSeriesData();

  return (
    <div className="chart-container lg:col-span-2">
      <h3 className="text-sm font-semibold mb-4">PV × AC × EV</h3>
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
            <Line type="monotone" dataKey="pv" name="PV" stroke="hsl(var(--chart-pv))" strokeWidth={2} strokeDasharray="8 4" dot={false} />
            <Line type="monotone" dataKey="ac" name="AC" stroke="hsl(var(--chart-ac))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ev" name="EV" stroke="hsl(var(--chart-ev))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
