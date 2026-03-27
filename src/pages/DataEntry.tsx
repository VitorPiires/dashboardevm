import { useState, useRef } from "react";
import { useEVM } from "@/contexts/EVMContext";
import { Stage, Task } from "@/types/evm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const [taskForm, setTaskForm] = useState({ name: '', stageId: '', date: '', pv: '', ac: '', ev: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if ((ch === ',' || ch === ';') && !inQuotes) { result.push(current.trim()); current = ''; continue; }
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

      const headers = parseCSVLine(lines[0]).map(normalizeHeader);
      const dateIdx = headers.indexOf('date');
      const nameIdx = headers.indexOf('name');
      const stageIdx = headers.indexOf('stage');
      const pvIdx = headers.indexOf('pv');
      const acIdx = headers.indexOf('ac');
      const evIdx = headers.indexOf('ev');

      if (nameIdx === -1) { toast.error('Coluna "Nome" não encontrada no cabeçalho do CSV.'); return; }
      if (dateIdx === -1) { toast.error('Coluna "Data" não encontrada no cabeçalho do CSV.'); return; }

      // Build a map of existing stage names for this project
      const existingStages = new Map<string, string>();
      projectStages.forEach(s => existingStages.set(s.name.toLowerCase(), s.id));

      // Collect unique stage names from CSV and create missing ones
      const stageNames = new Set<string>();
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const stageName = stageIdx !== -1 ? cols[stageIdx]?.trim() : '';
        if (stageName && !existingStages.has(stageName.toLowerCase())) {
          stageNames.add(stageName);
        }
      }

      // Create new stages
      for (const name of stageNames) {
        await addStage({ projectId: selectedProjectId, name });
      }

      // Refresh stage map after creation - read from context (stages state will be updated by addStage)
      // We need a small delay or re-read. Instead, build map from what we know:
      const updatedStages = new Map<string, string>(existingStages);
      // The addStage calls update context, but we need IDs. Let's re-fetch from stages state.
      // Actually stages state updates async. Let's query supabase directly for this project's stages.
      const { data: freshStages } = await (await import('@/integrations/supabase/client')).supabase
        .from('stages').select('*').eq('project_id', selectedProjectId);
      if (freshStages) {
        freshStages.forEach(s => updatedStages.set(s.name.toLowerCase(), s.id));
      }

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const name = nameIdx !== -1 ? cols[nameIdx]?.trim() : '';
        if (!name) continue;

        const rawDate = dateIdx !== -1 ? cols[dateIdx]?.trim() : '';
        // Try to parse date in multiple formats: dd/mm/yyyy, yyyy-mm-dd, mm/dd/yyyy
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

        const stageName = stageIdx !== -1 ? cols[stageIdx]?.trim() : '';
        const stageId = stageName ? updatedStages.get(stageName.toLowerCase()) : projectStages[0]?.id;
        if (!stageId) continue;

        const pv = pvIdx !== -1 ? Number(cols[pvIdx]?.replace(',', '.')) || 0 : 0;
        const ac = acIdx !== -1 ? Number(cols[acIdx]?.replace(',', '.')) || 0 : 0;
        const ev = evIdx !== -1 ? Number(cols[evIdx]?.replace(',', '.')) || 0 : 0;

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
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="w-[100px]">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {projectStages.map(s => (
                  <TableRow key={s.id}>
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
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhuma etapa cadastrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4">
          {projectStages.length === 0 ? (
            <p className="text-muted-foreground">Cadastre ao menos uma etapa antes de adicionar tarefas.</p>
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

              <Card className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>{stage?.name || '-'}</TableCell>
                          <TableCell>{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
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
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma tarefa cadastrada</TableCell></TableRow>
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
