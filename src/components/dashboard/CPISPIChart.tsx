import { useEVM } from "@/contexts/EVMContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { formatChartDate, axisTickStyle, axisStroke, tooltipContentStyle, tooltipLabelStyle, tooltipItemStyle } from "@/lib/chartFormat";

export function CPISPIChart() {
  const { getTimeSeriesData } = useEVM();
  const data = getTimeSeriesData();

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold mb-4">CPI × SPI</h3>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">Sem dados para exibir</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={axisTickStyle} stroke={axisStroke} tickFormatter={formatChartDate} />
            <YAxis tick={axisTickStyle} stroke={axisStroke} domain={['auto', 'auto']} />
            <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} labelFormatter={formatChartDate} />
            <Legend />
            <ReferenceLine y={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeOpacity={0.5} />
            <Line type="monotone" dataKey="cpi" name="CPI" stroke="hsl(var(--chart-cpi))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="spi" name="SPI" stroke="hsl(var(--chart-spi))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
