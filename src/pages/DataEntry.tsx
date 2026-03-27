import { useState } from "react";
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
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

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
