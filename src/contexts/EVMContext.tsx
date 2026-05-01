import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, Stage, Task, EVMMetrics, DateFilter, ETCMode } from '@/types/evm';

interface EVMContextType {
  projects: Project[];
  stages: Stage[];
  tasks: Task[];
  selectedProjectId: string | null;
  dateFilter: DateFilter;
  selectedStageIds: string[];
  etcMode: ETCMode;
  loading: boolean;
  setSelectedProjectId: (id: string | null) => void;
  setDateFilter: (f: DateFilter) => void;
  setSelectedStageIds: (ids: string[]) => void;
  setEtcMode: (m: ETCMode) => void;
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addStage: (s: Omit<Stage, 'id'>) => Promise<void>;
  updateStage: (s: Stage) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  addTask: (t: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
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

export function EVMProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [etcMode, setEtcMode] = useState<ETCMode>('progress');
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [pRes, sRes, tRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('stages').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('date', { ascending: true }),
      ]);
      const mappedProjects: Project[] = (pRes.data || []).map(r => ({
        id: r.id, name: r.name, bac: Number(r.bac),
        startDate: r.start_date, endDate: r.end_date, createdAt: r.created_at,
      }));
      const mappedStages: Stage[] = (sRes.data || []).map(r => ({
        id: r.id, projectId: r.project_id, name: r.name,
      }));
      const mappedTasks: Task[] = (tRes.data || []).map(r => ({
        id: r.id, projectId: r.project_id, stageId: r.stage_id,
        name: r.name, date: r.date, pv: Number(r.pv), ac: Number(r.ac), ev: Number(r.ev),
      }));
      setProjects(mappedProjects);
      setStages(mappedStages);
      setTasks(mappedTasks);
      if (mappedProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(mappedProjects[0].id);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const addProject = useCallback(async (p: Omit<Project, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('projects').insert({
      name: p.name, bac: p.bac, start_date: p.startDate, end_date: p.endDate,
    }).select().single();
    if (error || !data) return;
    const newP: Project = { id: data.id, name: data.name, bac: Number(data.bac), startDate: data.start_date, endDate: data.end_date, createdAt: data.created_at };
    setProjects(prev => [...prev, newP]);
    if (!selectedProjectId) setSelectedProjectId(newP.id);
  }, [selectedProjectId]);

  const updateProject = useCallback(async (p: Project) => {
    await supabase.from('projects').update({
      name: p.name, bac: p.bac, start_date: p.startDate, end_date: p.endDate,
    }).eq('id', p.id);
    setProjects(prev => prev.map(x => x.id === p.id ? p : x));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(x => x.id !== id));
    setStages(prev => prev.filter(x => x.projectId !== id));
    setTasks(prev => prev.filter(x => x.projectId !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  }, [selectedProjectId]);

  const addStage = useCallback(async (s: Omit<Stage, 'id'>) => {
    const { data, error } = await supabase.from('stages').insert({
      project_id: s.projectId, name: s.name,
    }).select().single();
    if (error || !data) return;
    setStages(prev => [...prev, { id: data.id, projectId: data.project_id, name: data.name }]);
  }, []);

  const updateStage = useCallback(async (s: Stage) => {
    await supabase.from('stages').update({ name: s.name }).eq('id', s.id);
    setStages(prev => prev.map(x => x.id === s.id ? s : x));
  }, []);

  const deleteStage = useCallback(async (id: string) => {
    await supabase.from('stages').delete().eq('id', id);
    setStages(prev => prev.filter(x => x.id !== id));
    setTasks(prev => prev.filter(x => x.stageId !== id));
  }, []);

  const addTask = useCallback(async (t: Omit<Task, 'id'>) => {
    const { data, error } = await supabase.from('tasks').insert({
      project_id: t.projectId, stage_id: t.stageId,
      name: t.name, date: t.date, pv: t.pv, ac: t.ac, ev: t.ev,
    }).select().single();
    if (error || !data) return;
    setTasks(prev => [...prev, {
      id: data.id, projectId: data.project_id, stageId: data.stage_id,
      name: data.name, date: data.date, pv: Number(data.pv), ac: Number(data.ac), ev: Number(data.ev),
    }]);
  }, []);

  const updateTask = useCallback(async (t: Task) => {
    await supabase.from('tasks').update({
      name: t.name, stage_id: t.stageId, date: t.date, pv: t.pv, ac: t.ac, ev: t.ev,
    }).eq('id', t.id);
    setTasks(prev => prev.map(x => x.id === t.id ? t : x));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
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
    let etc = 0;
    if (cpi !== 0) {
      if (etcMode === 'deadline' && spi !== 0) {
        etc = (bac - ev) / (cpi * spi);
      } else {
        etc = (bac - ev) / cpi;
      }
    }
    const eac = ac + etc;

    return { bac, ac, pv, ev, cv, sv, cpi, spi, eac, etc };
  }, [selectedProjectId, projects, getFilteredTasks, etcMode]);

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
      let etc = 0;
      if (cpi !== 0) {
        if (etcMode === 'deadline' && spi !== 0) {
          etc = (project.bac - cumEv) / (cpi * spi);
        } else {
          etc = (project.bac - cumEv) / cpi;
        }
      }
      const eac = cumAc + etc;
      const cv = cumEv - cumAc;
      const sv = cumEv - cumPv;
      return { date, pv: cumPv, ac: cumAc, ev: cumEv, eac, etc, cv, sv, cpi, spi };
    });
  }, [getFilteredTasks, selectedProjectId, projects, etcMode]);

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
      projects, stages, tasks, selectedProjectId, dateFilter, selectedStageIds, etcMode, loading,
      setSelectedProjectId, setDateFilter, setSelectedStageIds, setEtcMode,
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
