import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Multiplicacao {
  id: string;
  celula_origem_id: string;
  celula_destino_id: string;
  data_multiplicacao: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  origem?: { id: string; name: string } | null;
  destino?: { id: string; name: string } | null;
}

export function useMultiplicacaoByDestino(celulaId?: string) {
  return useQuery({
    queryKey: ['multiplicacoes', 'destino', celulaId],
    queryFn: async () => {
      if (!celulaId) return null;
      const { data, error } = await supabase
        .from('multiplicacoes')
        .select(`
          *,
          origem:celulas!multiplicacoes_celula_origem_id_fkey(id, name),
          destino:celulas!multiplicacoes_celula_destino_id_fkey(id, name)
        `)
        .eq('celula_destino_id', celulaId)
        .single();
      if (error && (error as any).code !== 'PGRST116') throw error;
      return (data || null) as Multiplicacao | null;
    },
    enabled: !!celulaId,
  });
}

export function useMultiplicacoesByOrigem(celulaId?: string) {
  return useQuery({
    queryKey: ['multiplicacoes', 'origem', celulaId],
    queryFn: async () => {
      if (!celulaId) return [];
      const { data, error } = await supabase
        .from('multiplicacoes')
        .select(`
          *,
          origem:celulas!multiplicacoes_celula_origem_id_fkey(id, name),
          destino:celulas!multiplicacoes_celula_destino_id_fkey(id, name)
        `)
        .eq('celula_origem_id', celulaId)
        .order('data_multiplicacao', { ascending: false });
      if (error) throw error;
      return (data || []) as Multiplicacao[];
    },
    enabled: !!celulaId,
  });
}

export function useCreateMultiplicacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      celula_origem_id: string;
      celula_destino_id: string;
      data_multiplicacao: string;
      notes?: string | null;
      created_by?: string | null;
    }) => {
      const { data: existing } = await supabase
        .from('multiplicacoes')
        .select('id')
        .eq('celula_destino_id', input.celula_destino_id)
        .limit(1);
      if (existing && existing.length > 0) {
        throw new Error('A célula destino já possui uma origem registrada.');
      }
      if (input.celula_origem_id === input.celula_destino_id) {
        throw new Error('A célula origem não pode ser igual à célula destino.');
      }
      const { data, error } = await supabase
        .from('multiplicacoes')
        .insert({
          celula_origem_id: input.celula_origem_id,
          celula_destino_id: input.celula_destino_id,
          data_multiplicacao: input.data_multiplicacao,
          notes: input.notes ?? null,
          created_by: input.created_by ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Multiplicacao;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['multiplicacoes', 'origem', variables.celula_origem_id] });
      queryClient.invalidateQueries({ queryKey: ['multiplicacoes', 'destino', variables.celula_destino_id] });
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
    },
  });
}
