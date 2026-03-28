import { useState, useRef } from "react";
import { useEVM } from "@/contexts/EVMContext";
import { Stage, Task } from "@/types/evm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Save, X, Upload } from "lucide-react";
import { toast } from "sonner";

export default function DataEntry({ defaultTab = "tasks" }: { defaultTab?: string }) {
  const {
    stages, tasks, selectedProjectId,
    addStage, updateStage, deleteStage,
    addTask, updateTask, deleteTask,
  } = useEVM();

  const projectStages = stages.filter(s => s.projectId === selectedProjectId);
  const projectTasks = tasks.filter(t => t.projectId === selectedProjectId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [stageName, setStageName] = useState('');
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [selectedStageIds, setSelectedStageIds] = useState<Set<string>>(new Set());

  const [taskForm, setTaskForm] = useState({ name: '', stageId: '', date: '', pv: '', ac: '', ev: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [csvLoading, setCsvLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Currency parser: "1.500,00" -> 1500.00 ---
  const parseCurrency = (value: string | undefined): number => {
    if (!value) return 0;
    const cleaned = value.replace(/"/g, '').trim();
    if (!cleaned) return 0;
    // Brazilian format: dots as thousands sep, comma as decimal sep
    const normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };

  const handleSaveStage = async () => {
    if (!stageName || !selectedProjectId) return;
    if (editingStage) {
      await updateStage({ ...editingStage, name: stageName });
      setEditingStage(null);
    } else {
      await addStage({ projectId: selectedProjectId, name: stageName });
    }
    setStageName('');
  };

  const handleSaveTask = async () => {
    if (!taskForm.name || !taskForm.stageId || !taskForm.date || !selectedProjectId) return;
    const data = { name: taskForm.name, stageId: taskForm.stageId, date: taskForm.date, pv: Number(taskForm.pv) || 0, ac: Number(taskForm.ac) || 0, ev: Number(taskForm.ev) || 0, projectId: selectedProjectId };
    if (editingTask) {
      await updateTask({ ...editingTask, ...data });
      setEditingTask(null);
    } else {
      await addTask(data);
    }
    setTaskForm({ name: '', stageId: '', date: '', pv: '', ac: '', ev: '' });
  };

  const startEditStage = (s: Stage) => {
    setEditingStage(s);
    setStageName(s.name);
  };

  const startEditTask = (t: Task) => {
    setEditingTask(t);
    setTaskForm({ name: t.name, stageId: t.stageId, date: t.date, pv: String(t.pv), ac: String(t.ac), ev: String(t.ev) });
  };

  const cancelEdit = () => {
    setEditingStage(null);
    setEditingTask(null);
    setStageName('');
    setTaskForm({ name: '', stageId: '', date: '', pv: '', ac: '', ev: '' });
  };

  // --- Bulk delete handlers ---
  const toggleStageSelection = (id: string) => {
    setSelectedStageIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllStages = () => {
    if (selectedStageIds.size === projectStages.length) {
      setSelectedStageIds(new Set());
    } else {
      setSelectedStageIds(new Set(projectStages.map(s => s.id)));
    }
  };

  const deleteSelectedStages = async () => {
    for (const id of selectedStageIds) {
      await deleteStage(id);
    }
    setSelectedStageIds(new Set());
    toast.success(`${selectedStageIds.size} etapa(s) excluída(s).`);
  };

  const deleteAllStages = async () => {
    for (const s of projectStages) {
      await deleteStage(s.id);
    }
    setSelectedStageIds(new Set());
    toast.success('Todas as etapas foram excluídas.');
  };

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllTasks = () => {
    if (selectedTaskIds.size === projectTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(projectTasks.map(t => t.id)));
    }
  };

  const deleteSelectedTasks = async () => {
    for (const id of selectedTaskIds) {
      await deleteTask(id);
    }
    const count = selectedTaskIds.size;
    setSelectedTaskIds(new Set());
    toast.success(`${count} tarefa(s) excluída(s).`);
  };

  const deleteAllTasks = async () => {
    for (const t of projectTasks) {
      await deleteTask(t.id);
    }
    setSelectedTaskIds(new Set());
    toast.success('Todas as tarefas foram excluídas.');
  };

  // --- CSV helpers ---
  const normalizeHeader = (header: string): string => {
    const h = header.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (['data', 'date'].includes(h)) return 'date';
    if (['nome', 'name', 'tarefa', 'task'].includes(h)) return 'name';
    if (['etapa', 'stage', 'fase', 'phase'].includes(h)) return 'stage';
    if (h === 'pv' || h === 'valor planejado') return 'pv';
    if (h === 'ac' || h === 'custo real') return 'ac';
    if (h === 'ev' || h === 'valor agregado') return 'ev';
    return h;
  };

  const detectDelimiter = (headerLine: string): string => {
    // Count occurrences outside quotes
    let semicolons = 0, commas = 0, inQ = false;
    for (const ch of headerLine) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (!inQ && ch === ';') semicolons++;
      if (!inQ && ch === ',') commas++;
    }
    return semicolons >= commas ? ';' : ',';
  };

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === delimiter && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProjectId) return;
    setCsvLoading(true);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error('O arquivo CSV deve ter ao menos 2 linhas (cabeçalho + dados).'); return; }

      const delimiter = detectDelimiter(lines[0]);
      const headers = parseCSVLine(lines[0], delimiter).map(normalizeHeader);
      const dateIdx = headers.indexOf('date');
      const nameIdx = headers.indexOf('name');
      const stageIdx = headers.indexOf('stage');
      const pvIdx = headers.indexOf('pv');
      const acIdx = headers.indexOf('ac');
      const evIdx = headers.indexOf('ev');

      if (nameIdx === -1) { toast.error('Coluna "Nome" não encontrada no cabeçalho do CSV.'); return; }
      if (dateIdx === -1) { toast.error('Coluna "Data" não encontrada no cabeçalho do CSV.'); return; }

      const existingStages = new Map<string, string>();
      projectStages.forEach(s => existingStages.set(s.name.toLowerCase(), s.id));

      const stageNames = new Set<string>();
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], delimiter);
        const sName = stageIdx !== -1 ? cols[stageIdx]?.trim() : '';
        if (sName && !existingStages.has(sName.toLowerCase())) {
          stageNames.add(sName);
        }
      }

      for (const name of stageNames) {
        await addStage({ projectId: selectedProjectId, name });
      }

      const { data: freshStages } = await (await import('@/integrations/supabase/client')).supabase
        .from('stages').select('*').eq('project_id', selectedProjectId);
      const updatedStages = new Map<string, string>(existingStages);
      if (freshStages) {
        freshStages.forEach(s => updatedStages.set(s.name.toLowerCase(), s.id));
      }

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], delimiter);
        const name = nameIdx !== -1 ? cols[nameIdx]?.trim() : '';
        if (!name) continue;

        const rawDate = dateIdx !== -1 ? cols[dateIdx]?.trim() : '';
        let date = '';
        if (rawDate.includes('/')) {
          const parts = rawDate.split('/');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else {
              date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        } else if (rawDate.includes('-')) {
          date = rawDate;
        }
        if (!date) continue;

        const sName = stageIdx !== -1 ? cols[stageIdx]?.trim() : '';
        const stageId = sName ? updatedStages.get(sName.toLowerCase()) : projectStages[0]?.id;
        if (!stageId) continue;

        const pv = pvIdx !== -1 ? parseCurrency(cols[pvIdx]) : 0;
        const ac = acIdx !== -1 ? parseCurrency(cols[acIdx]) : 0;
        const ev = evIdx !== -1 ? parseCurrency(cols[evIdx]) : 0;

        await addTask({ projectId: selectedProjectId, stageId, name, date, pv, ac, ev });
        imported++;
      }

      toast.success(`${imported} tarefa(s) importada(s) com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao processar o arquivo CSV.');
    } finally {
      setCsvLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Format date for display without timezone shift
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <p className="text-lg font-medium">Nenhum projeto selecionado</p>
        <p className="text-sm mt-1">Selecione um projeto no menu lateral para lançar dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold">Lançamentos</h1>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="stages">Etapas</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
        </TabsList>

        {/* STAGES TAB */}
        <TabsContent value="stages" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">{editingStage ? 'Editar Etapa' : 'Nova Etapa'}</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>Nome da Etapa</Label>
                <Input value={stageName} onChange={e => setStageName(e.target.value)} />
              </div>
              <Button onClick={handleSaveStage} size="sm">
                {editingStage ? <><Save className="h-4 w-4 mr-1" /> Salvar</> : <><Plus className="h-4 w-4 mr-1" /> Adicionar</>}
              </Button>
              {editingStage && (
                <Button variant="outline" size="sm" onClick={cancelEdit}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
              )}
            </div>
          </Card>

          {/* Bulk actions for stages */}
          {projectStages.length > 0 && (
            <div className="flex gap-2 items-center">
              {selectedStageIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir Selecionadas ({selectedStageIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>Tem certeza que deseja excluir {selectedStageIds.size} etapa(s) selecionada(s)? As tarefas associadas serão removidas.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteSelectedStages} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/50">
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir Todas
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão total</AlertDialogTitle>
                    <AlertDialogDescription>Tem certeza que deseja excluir TODAS as {projectStages.length} etapa(s)? Todas as tarefas associadas serão removidas.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllStages} className="bg-destructive text-destructive-foreground">Excluir Todas</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={projectStages.length > 0 && selectedStageIds.size === projectStages.length}
                      onCheckedChange={toggleAllStages}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectStages.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStageIds.has(s.id)}
                        onCheckedChange={() => toggleStageSelection(s.id)}
                      />
                    </TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditStage(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>Tem certeza que deseja excluir a etapa "{s.name}"? Todas as tarefas desta etapa serão removidas.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteStage(s.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {projectStages.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhuma etapa cadastrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4">
          <Card className="p-4 border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Importar CSV</h3>
                <p className="text-sm text-muted-foreground">A primeira linha deve conter os nomes: Data, Nome, Etapa, PV, AC, EV</p>
              </div>
              <div>
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={csvLoading}>
                  <Upload className="h-4 w-4 mr-1" /> {csvLoading ? 'Importando...' : 'Carregar CSV'}
                </Button>
              </div>
            </div>
          </Card>
          {projectStages.length === 0 ? (
            <p className="text-muted-foreground">Cadastre ao menos uma etapa antes de adicionar tarefas manualmente.</p>
          ) : (
            <>
              <Card className="p-4">
                <h3 className="font-semibold mb-3">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <Label>Nome</Label>
                    <Input value={taskForm.name} onChange={e => setTaskForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Etapa</Label>
                    <Select value={taskForm.stageId} onValueChange={v => setTaskForm(f => ({ ...f, stageId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {projectStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={taskForm.date} onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>PV (R$)</Label>
                    <Input type="number" value={taskForm.pv} onChange={e => setTaskForm(f => ({ ...f, pv: e.target.value }))} />
                  </div>
                  <div>
                    <Label>AC (R$)</Label>
                    <Input type="number" value={taskForm.ac} onChange={e => setTaskForm(f => ({ ...f, ac: e.target.value }))} />
                  </div>
                  <div>
                    <Label>EV (R$)</Label>
                    <Input type="number" value={taskForm.ev} onChange={e => setTaskForm(f => ({ ...f, ev: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={handleSaveTask} size="sm">
                    {editingTask ? <><Save className="h-4 w-4 mr-1" /> Salvar</> : <><Plus className="h-4 w-4 mr-1" /> Adicionar</>}
                  </Button>
                  {editingTask && (
                    <Button variant="outline" size="sm" onClick={cancelEdit}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
                  )}
                </div>
              </Card>

              {/* Bulk actions for tasks */}
              {projectTasks.length > 0 && (
                <div className="flex gap-2 items-center">
                  {selectedTaskIds.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" /> Excluir Selecionadas ({selectedTaskIds.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>Tem certeza que deseja excluir {selectedTaskIds.size} tarefa(s) selecionada(s)?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteSelectedTasks} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/50">
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir Todas
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão total</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza que deseja excluir TODAS as {projectTasks.length} tarefa(s)?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAllTasks} className="bg-destructive text-destructive-foreground">Excluir Todas</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              <Card className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={projectTasks.length > 0 && selectedTaskIds.size === projectTasks.length}
                          onCheckedChange={toggleAllTasks}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>PV</TableHead>
                      <TableHead>AC</TableHead>
                      <TableHead>EV</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectTasks.map(t => {
                      const stage = stages.find(s => s.id === t.stageId);
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTaskIds.has(t.id)}
                              onCheckedChange={() => toggleTaskSelection(t.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>{stage?.name || '-'}</TableCell>
                          <TableCell>{formatDate(t.date)}</TableCell>
                          <TableCell className="font-mono text-sm">R$ {t.pv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="font-mono text-sm">R$ {t.ac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="font-mono text-sm">R$ {t.ev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditTask(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>Tem certeza que deseja excluir a tarefa "{t.name}"?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteTask(t.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {projectTasks.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma tarefa cadastrada</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
