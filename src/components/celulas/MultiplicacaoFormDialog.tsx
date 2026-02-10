import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useCelulas, Celula } from '@/hooks/useCelulas';
import { useCreateMultiplicacao, useMultiplicacaoByDestino } from '@/hooks/useMultiplicacoes';
import { useToast } from '@/hooks/use-toast';

interface MultiplicacaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOrigemId?: string;
}

export function MultiplicacaoFormDialog({ open, onOpenChange, initialOrigemId }: MultiplicacaoFormDialogProps) {
  const { data: celulas } = useCelulas();
  const [origemId, setOrigemId] = useState<string | undefined>(initialOrigemId);
  const [destinoId, setDestinoId] = useState<string | undefined>(undefined);
  const [data, setData] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState<string>('');
  const createMultiplicacao = useCreateMultiplicacao();
  const { toast } = useToast();

  const destinoCheck = useMultiplicacaoByDestino(destinoId);

  useEffect(() => {
    setOrigemId(initialOrigemId);
  }, [initialOrigemId]);

  const celulasOptions = useMemo(() => celulas || [], [celulas]);

  async function handleSubmit() {
    try {
      if (!origemId || !destinoId) {
        toast({ title: 'Selecione origem e destino', variant: 'destructive' });
        return;
      }
      if (origemId === destinoId) {
        toast({ title: 'Origem não pode ser igual ao destino', variant: 'destructive' });
        return;
      }
      if (destinoCheck.data) {
        toast({ title: 'Destino já possui origem registrada', variant: 'destructive' });
        return;
      }
      await createMultiplicacao.mutateAsync({
        celula_origem_id: origemId,
        celula_destino_id: destinoId,
        data_multiplicacao: data,
        notes,
      });
      toast({ title: 'Multiplicação registrada com sucesso' });
      onOpenChange(false);
      setNotes('');
      setDestinoId(undefined);
    } catch (e: any) {
      toast({ title: 'Erro ao registrar multiplicação', description: e?.message, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Multiplicação</DialogTitle>
          <DialogDescription>Vincule a célula origem à célula destino</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Célula Origem</Label>
            <Select value={origemId} onValueChange={setOrigemId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a célula origem" />
              </SelectTrigger>
              <SelectContent>
                {celulasOptions.map((c: Celula) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Célula Destino</Label>
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a célula destino" />
              </SelectTrigger>
              <SelectContent>
                {celulasOptions.map((c: Celula) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {destinoCheck.data && (
              <Card className="border-amber-200">
                <CardContent className="text-sm text-amber-700 py-2">
                  Atenção: esta célula já possui origem registrada.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data da Multiplicação</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMultiplicacao.isPending}>
              {createMultiplicacao.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
