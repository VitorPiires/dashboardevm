import { useEVM } from "@/contexts/EVMContext";
import { DateFilter, ETCMode } from "@/types/evm";
import { KPICards } from "@/components/dashboard/KPICards";
import { PVACEVChart } from "@/components/dashboard/PVACEVChart";
import { StageCostsChart } from "@/components/dashboard/StageCostsChart";
import { EACETCChart } from "@/components/dashboard/EACETCChart";
import { CVSVChart } from "@/components/dashboard/CVSVChart";
import { CPISPIChart } from "@/components/dashboard/CPISPIChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { DataTable } from "@/components/dashboard/DataTable";

const dateFilterOptions: { label: string; value: DateFilter }[] = [
  { label: "Tudo", value: "all" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
];

const etcModeOptions: { label: string; value: ETCMode }[] = [
  { label: "Mesmo progresso", value: "cpi" },
  { label: "Terminar no prazo", value: "cpi_spi" },
];

export default function Dashboard() {
  const {
    selectedProjectId, projects, dateFilter, setDateFilter,
    selectedStageIds, setSelectedStageIds, getProjectStages,
    etcMode, setEtcMode,
  } = useEVM();

  const project = projects.find(p => p.id === selectedProjectId);
  const projectStages = getProjectStages();

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <p className="text-lg font-medium">Nenhum projeto selecionado</p>
        <p className="text-sm mt-1">Crie um projeto na aba de Projetos para começar.</p>
      </div>
    );
  }

  const toggleStage = (stageId: string) => {
    setSelectedStageIds(
      selectedStageIds.includes(stageId)
        ? selectedStageIds.filter(id => id !== stageId)
        : [...selectedStageIds, stageId]
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(project.startDate).toLocaleDateString('pt-BR')} — {new Date(project.endDate).toLocaleDateString('pt-BR')}
          {' · '}BAC: R$ {project.bac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Segmented Filters */}
      <div className="flex flex-wrap gap-6 items-start">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Período</p>
          <div className="segmented-control">
            {dateFilterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDateFilter(opt.value)}
                className={`segmented-btn ${dateFilter === opt.value ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {projectStages.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Etapas</p>
            <div className="segmented-control">
              {projectStages.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => toggleStage(stage.id)}
                  className={`segmented-btn ${selectedStageIds.includes(stage.id) ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
                >
                  {stage.name}
                </button>
              ))}
              {selectedStageIds.length > 0 && (
                <button
                  onClick={() => setSelectedStageIds([])}
                  className="segmented-btn segmented-btn-inactive text-xs"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Cálculo do ETC</p>
          <div className="segmented-control">
            {etcModeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setEtcMode(opt.value)}
                className={`segmented-btn ${etcMode === opt.value ? 'segmented-btn-active' : 'segmented-btn-inactive'}`}
                title={opt.value === 'cpi' ? 'ETC = (BAC - EV) / CPI' : 'ETC = (BAC - EV) / (CPI × SPI)'}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <KPICards />

      <InsightsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PVACEVChart />
        <StageCostsChart />
        <EACETCChart />
        <CVSVChart />
        <CPISPIChart />
      </div>

      <DataTable />
    </div>
  );
}
