import { useState } from "react";
import { useEVM } from "@/contexts/EVMContext";
import { Project } from "@/types/evm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

export default function Projects() {
  const { projects, addProject, updateProject, deleteProject, setSelectedProjectId, selectedProjectId } = useEVM();

  const [projForm, setProjForm] = useState({ name: '', bac: '', startDate: '', endDate: '' });
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleSaveProject = async () => {
    if (!projForm.name || !projForm.bac || !projForm.startDate || !projForm.endDate) return;
    if (editingProject) {
      await updateProject({ ...editingProject, name: projForm.name, bac: Number(projForm.bac), startDate: projForm.startDate, endDate: projForm.endDate });
      setEditingProject(null);
    } else {
      await addProject({ name: projForm.name, bac: Number(projForm.bac), startDate: projForm.startDate, endDate: projForm.endDate });
    }
    setProjForm({ name: '', bac: '', startDate: '', endDate: '' });
  };

  const startEditProject = (p: Project) => {
    setEditingProject(p);
    setProjForm({ name: p.name, bac: String(p.bac), startDate: p.startDate, endDate: p.endDate });
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setProjForm({ name: '', bac: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold">Projetos</h1>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={projForm.name} onChange={e => setProjForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>BAC (R$)</Label>
            <Input type="number" value={projForm.bac} onChange={e => setProjForm(f => ({ ...f, bac: e.target.value }))} />
          </div>
          <div>
            <Label>Início</Label>
            <Input type="date" value={projForm.startDate} onChange={e => setProjForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <Label>Término Previsto</Label>
            <Input type="date" value={projForm.endDate} onChange={e => setProjForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={handleSaveProject} size="sm">
            {editingProject ? <><Save className="h-4 w-4 mr-1" /> Salvar</> : <><Plus className="h-4 w-4 mr-1" /> Adicionar</>}
          </Button>
          {editingProject && (
            <Button variant="outline" size="sm" onClick={cancelEdit}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>BAC</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Término</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map(p => (
              <TableRow key={p.id} className={p.id === selectedProjectId ? 'bg-primary/5' : ''}>
                <TableCell className="font-medium cursor-pointer" onClick={() => setSelectedProjectId(p.id)}>{p.name}</TableCell>
                <TableCell className="font-mono text-sm">R$ {p.bac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>{new Date(p.startDate).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{new Date(p.endDate).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditProject(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>Tem certeza que deseja excluir o projeto "{p.name}"? Todas as etapas e tarefas serão removidas.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProject(p.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum projeto cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
