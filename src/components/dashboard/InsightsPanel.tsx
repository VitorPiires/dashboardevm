import { useEVM } from "@/contexts/EVMContext";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const borderColorMap = {
  success: 'border-kpi-positive',
  warning: 'border-warning',
  danger: 'border-kpi-negative',
};

const iconColorMap = {
  success: 'text-kpi-positive',
  warning: 'text-warning',
  danger: 'text-kpi-negative',
};

export function InsightsPanel() {
  const { getInsights } = useEVM();
  const insights = getInsights();

  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Insights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.type];
          return (
            <div key={i} className={`insight-card ${borderColorMap[insight.type]}`}>
              <div className="flex items-start gap-2">
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColorMap[insight.type]}`} />
                <div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
