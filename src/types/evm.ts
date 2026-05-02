export interface Project {
  id: string;
  name: string;
  bac: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Stage {
  id: string;
  projectId: string;
  name: string;
}

export interface Task {
  id: string;
  projectId: string;
  stageId: string;
  name: string;
  date: string;
  pv: number;
  ac: number;
  ev: number;
}

export interface EVMMetrics {
  bac: number;
  ac: number;
  pv: number;
  ev: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  etc: number;
}

export type DateFilter = '7d' | '30d' | 'all';

export type ETCMode = 'cpi' | 'cpi_spi';
