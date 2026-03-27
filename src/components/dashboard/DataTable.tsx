import { useEVM } from "@/contexts/EVMContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function DataTable() {
  const { getFilteredTasks, stages } = useEVM();
  const tasks = getFilteredTasks();

  if (tasks.length === 0) return null;

  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold mb-4">Dados Lançados</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tarefa</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>PV</TableHead>
              <TableHead>AC</TableHead>
              <TableHead>EV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(t => {
              const stage = stages.find(s => s.id === t.stageId);
              return (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{stage?.name || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">R$ {t.pv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="font-mono text-sm">R$ {t.ac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="font-mono text-sm">R$ {t.ev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
