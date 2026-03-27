import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Stage, Task, EVMMetrics, DateFilter } from '@/types/evm';

interface EVMContextType {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  selectedProjectId: string | null;
  dateFilter: DateFilter;
  selectedStageIds: string[];
  setSelectedProjectId: (id: string | null) => void;
  setDateFilter: (f: DateFilter) => void;
  setSelectedStageIds: (ids: string[]) => void;
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (p: Project) => void;
  deleteProject: (id: string) => void;
  addStage: (s: Omit<Stage, 'id'>) => void;
  updateStage: (s: Stage) => void;
  deleteStage: (id: string) => void;
  addTask: (t: Omit<Task, 'id'>) => void;
  updateTask: (t: Task) => void;
  deleteTask: (id: string) => void;
  getFilteredTasks: () => Task[];
  getMetrics: () => EVMMetrics;
  getProjectStages: () => Stage[];
  getTimeSeriesData: () => TimeSeriesPoint[];
  getStageData: () => StageDataPoint[];
  getInsights: () => Insight[];
}

export interface TimeSeriesPoint {
  date: string;
  pv: number;
  ac: number;
  ev: number;
  eac: number;
  etc: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
}

export interface StageDataPoint {
  stage: string;
  ac: number;
  pv: number;
  ev: number;
}

export interface Insight {
  type: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
}

const EVMContext = createContext<EVMContextType | undefined>(undefined);

function generateId() {
  return crypto.randomUUID();
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function EVMProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('evm_projects', []));
  const [stages, setStages] = useState<Stage[]>(() => loadFromStorage('evm_stages', []));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('evm_tasks', []));
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => loadFromStorage('evm_selected_project', null));
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);

  useEffect(() => { localStorage.setItem('evm_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('evm_stages', JSON.stringify(stages)); }, [stages]);
  useEffect(() => { localStorage.setItem('evm_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('evm_selected_project', JSON.stringify(selectedProjectId)); }, [selectedProjectId]);

  const addProject = useCallback((p: Omit<Project, 'id' | 'createdAt'>) => {
    const newP: Project = { ...p, id: generateId(), createdAt: new Date().toISOString() };
    setProjects(prev => [...prev, newP]);
    if (!selectedProjectId) setSelectedProjectId(newP.id);
  }, [selectedProjectId]);

  const updateProject = useCallback((p: Project) => {
    setProjects(prev => prev.map(x => x.id === p.id ? p : x));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(x => x.id !== id));
    setStages(prev => prev.filter(x => x.projectId !== id));
    setTasks(prev => prev.filter(x => x.projectId !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  }, [selectedProjectId]);

  const addStage = useCallback((s: Omit<Stage, 'id'>) => {
    setStages(prev => [...prev, { ...s, id: generateId() }]);
  }, []);

  const updateStage = useCallback((s: Stage) => {
    setStages(prev => prev.map(x => x.id === s.id ? s : x));
  }, []);

  const deleteStage = useCallback((id: string) => {
    setStages(prev => prev.filter(x => x.id !== id));
    setTasks(prev => prev.filter(x => x.stageId !== id));
  }, []);

  const addTask = useCallback((t: Omit<Task, 'id'>) => {
    setTasks(prev => [...prev, { ...t, id: generateId() }]);
  }, []);

  const updateTask = useCallback((t: Task) => {
    setTasks(prev => prev.map(x => x.id === t.id ? t : x));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(x => x.id !== id));
  }, []);

  const getProjectStages = useCallback(() => {
    if (!selectedProjectId) return [];
    return stages.filter(s => s.projectId === selectedProjectId);
  }, [selectedProjectId, stages]);

  const getFilteredTasks = useCallback(() => {
    if (!selectedProjectId) return [];
    let filtered = tasks.filter(t => t.projectId === selectedProjectId);

    if (selectedStageIds.length > 0) {
      filtered = filtered.filter(t => selectedStageIds.includes(t.stageId));
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const days = dateFilter === '7d' ? 7 : 30;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.date) >= cutoff);
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedProjectId, tasks, selectedStageIds, dateFilter]);

  const getMetrics = useCallback((): EVMMetrics => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return { bac: 0, ac: 0, pv: 0, ev: 0, cv: 0, sv: 0, cpi: 0, spi: 0, eac: 0, etc: 0 };

    const filtered = getFilteredTasks();
    const ac = filtered.reduce((s, t) => s + t.ac, 0);
    const pv = filtered.reduce((s, t) => s + t.pv, 0);
    const ev = filtered.reduce((s, t) => s + t.ev, 0);
    const bac = project.bac;
    const cv = ev - ac;
    const sv = ev - pv;
    const cpi = ac !== 0 ? ev / ac : 0;
    const spi = pv !== 0 ? ev / pv : 0;
    const eac = cpi !== 0 ? bac / cpi : 0;
    const etc = eac - ac;

    return { bac, ac, pv, ev, cv, sv, cpi, spi, eac, etc };
  }, [selectedProjectId, projects, getFilteredTasks]);

  const getTimeSeriesData = useCallback((): TimeSeriesPoint[] => {
    const filtered = getFilteredTasks();
    if (filtered.length === 0) return [];
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return [];

    const dateMap = new Map<string, { pv: number; ac: number; ev: number }>();
    filtered.forEach(t => {
      const existing = dateMap.get(t.date) || { pv: 0, ac: 0, ev: 0 };
      existing.pv += t.pv;
      existing.ac += t.ac;
      existing.ev += t.ev;
      dateMap.set(t.date, existing);
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    let cumPv = 0, cumAc = 0, cumEv = 0;

    return sortedDates.map(date => {
      const d = dateMap.get(date)!;
      cumPv += d.pv;
      cumAc += d.ac;
      cumEv += d.ev;
      const cpi = cumAc !== 0 ? cumEv / cumAc : 0;
      const spi = cumPv !== 0 ? cumEv / cumPv : 0;
      const eac = cpi !== 0 ? project.bac / cpi : 0;
      const etc = eac - cumAc;
      const cv = cumEv - cumAc;
      const sv = cumEv - cumPv;
      return { date, pv: cumPv, ac: cumAc, ev: cumEv, eac, etc, cv, sv, cpi, spi };
    });
  }, [getFilteredTasks, selectedProjectId, projects]);

  const getStageData = useCallback((): StageDataPoint[] => {
    const filtered = getFilteredTasks();
    const projectStages = getProjectStages();
    return projectStages.map(stage => {
      const stageTasks = filtered.filter(t => t.stageId === stage.id);
      return {
        stage: stage.name,
        ac: stageTasks.reduce((s, t) => s + t.ac, 0),
        pv: stageTasks.reduce((s, t) => s + t.pv, 0),
        ev: stageTasks.reduce((s, t) => s + t.ev, 0),
      };
    }).filter(d => d.ac > 0 || d.pv > 0 || d.ev > 0);
  }, [getFilteredTasks, getProjectStages]);

  const getInsights = useCallback((): Insight[] => {
    const m = getMetrics();
    const insights: Insight[] = [];
    if (m.ac === 0 && m.pv === 0 && m.ev === 0) return insights;

    if (m.cpi < 0.9) {
      insights.push({ type: 'danger', title: 'Custo Acima do Previsto', description: `CPI de ${m.cpi.toFixed(2)} indica que o projeto está gastando ${((1 - m.cpi) * 100).toFixed(0)}% mais do que o planejado. Revise os custos imediatamente.` });
    } else if (m.cpi < 1.0) {
      insights.push({ type: 'warning', title: 'Custo Levemente Acima', description: `CPI de ${m.cpi.toFixed(2)} indica um leve estouro de custos. Monitore os próximos lançamentos.` });
    } else if (m.cpi >= 1.0) {
      insights.push({ type: 'success', title: 'Custos Sob Controle', description: `CPI de ${m.cpi.toFixed(2)} indica que o projeto está dentro ou abaixo do orçamento planejado.` });
    }

    if (m.spi < 0.9) {
      insights.push({ type: 'danger', title: 'Cronograma Atrasado', description: `SPI de ${m.spi.toFixed(2)} indica atraso significativo. O projeto entregou apenas ${(m.spi * 100).toFixed(0)}% do previsto para o período.` });
    } else if (m.spi < 1.0) {
      insights.push({ type: 'warning', title: 'Leve Atraso no Cronograma', description: `SPI de ${m.spi.toFixed(2)} indica um pequeno atraso. Atenção às próximas entregas.` });
    } else {
      insights.push({ type: 'success', title: 'Cronograma em Dia', description: `SPI de ${m.spi.toFixed(2)} indica que o projeto está no prazo ou adiantado.` });
    }

    if (m.eac > m.bac * 1.1) {
      insights.push({ type: 'danger', title: 'Previsão de Estouro', description: `EAC de R$ ${m.eac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} está ${(((m.eac - m.bac) / m.bac) * 100).toFixed(0)}% acima do BAC. Ação corretiva necessária.` });
    }

    if (m.cv < 0 && m.sv < 0) {
      insights.push({ type: 'danger', title: 'Atenção Dupla', description: 'O projeto está simultaneamente acima do orçamento e atrasado. Priorize ações corretivas urgentes.' });
    }

    return insights;
  }, [getMetrics]);

  return (
    <EVMContext.Provider value={{
      projects, stages, tasks, selectedProjectId, dateFilter, selectedStageIds,
      setSelectedProjectId, setDateFilter, setSelectedStageIds,
      addProject, updateProject, deleteProject,
      addStage, updateStage, deleteStage,
      addTask, updateTask, deleteTask,
      getFilteredTasks, getMetrics, getProjectStages, getTimeSeriesData, getStageData, getInsights,
    }}>
      {children}
    </EVMContext.Provider>
  );
}

export function useEVM() {
  const ctx = useContext(EVMContext);
  if (!ctx) throw new Error('useEVM must be used within EVMProvider');
  return ctx;
}
