import { useEVM } from "@/contexts/EVMContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { axisTickStyle, axisStroke, tooltipContentStyle, tooltipLabelStyle, tooltipItemStyle } from "@/lib/chartFormat";

export function StageCostsChart() {
  const { getStageData } = useEVM();
  const data = getStageData();

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold mb-4">Gastos por Etapa</h3>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">Sem dados para exibir</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="stage" tick={axisTickStyle} stroke={axisStroke} />
            <YAxis tick={axisTickStyle} stroke={axisStroke} />
            <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            <Bar dataKey="ac" name="AC" fill="hsl(var(--chart-stage))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
