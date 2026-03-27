import { useEVM } from "@/contexts/EVMContext";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatIndex(v: number) {
  return v.toFixed(2);
}

export function KPICards() {
  const { getMetrics } = useEVM();
  const m = getMetrics();

  const cards = [
    { label: 'BAC', value: formatCurrency(m.bac), color: 'neutral' as const },
    { label: 'PV', value: formatCurrency(m.pv), color: 'neutral' as const },
    { label: 'AC', value: formatCurrency(m.ac), color: 'neutral' as const },
    { label: 'EV', value: formatCurrency(m.ev), color: 'neutral' as const },
    { label: 'CV', value: formatCurrency(m.cv), color: m.cv >= 0 ? 'positive' as const : 'negative' as const },
    { label: 'SV', value: formatCurrency(m.sv), color: m.sv >= 0 ? 'positive' as const : 'negative' as const },
    { label: 'CPI', value: formatIndex(m.cpi), color: m.cpi >= 1 ? 'positive' as const : m.cpi > 0 ? 'negative' as const : 'neutral' as const },
    { label: 'SPI', value: formatIndex(m.spi), color: m.spi >= 1 ? 'positive' as const : m.spi > 0 ? 'negative' as const : 'neutral' as const },
    { label: 'EAC', value: formatCurrency(m.eac), color: m.eac <= m.bac ? 'positive' as const : 'negative' as const },
    { label: 'ETC', value: formatCurrency(m.etc), color: 'neutral' as const },
  ];

  const iconMap = { positive: TrendingUp, negative: TrendingDown, neutral: Minus };
  const colorMap = { positive: 'text-kpi-positive', negative: 'text-kpi-negative', neutral: 'text-kpi-neutral' };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {cards.map(c => {
        const Icon = iconMap[c.color];
        return (
          <div key={c.label} className="kpi-card">
            <div className="flex items-center justify-between mb-1">
              <span className="kpi-label">{c.label}</span>
              <Icon className={`h-3.5 w-3.5 ${colorMap[c.color]}`} />
            </div>
            <p className={`kpi-value ${colorMap[c.color]}`}>{c.value}</p>
          </div>
        );
      })}
    </div>
  );
}
