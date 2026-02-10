-- Tabela de multiplicações de células
CREATE TABLE public.multiplicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  celula_origem_id uuid NOT NULL REFERENCES public.celulas(id) ON DELETE CASCADE,
  celula_destino_id uuid NOT NULL REFERENCES public.celulas(id) ON DELETE CASCADE,
  data_multiplicacao date NOT NULL,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT multiplicacoes_unique_destino UNIQUE (celula_destino_id),
  CONSTRAINT multiplicacoes_origem_destino_diferentes CHECK (celula_origem_id <> celula_destino_id)
);

-- Índices para desempenho
CREATE INDEX IF NOT EXISTS multiplicacoes_origem_idx ON public.multiplicacoes (celula_origem_id);
CREATE INDEX IF NOT EXISTS multiplicacoes_destino_idx ON public.multiplicacoes (celula_destino_id);
CREATE INDEX IF NOT EXISTS multiplicacoes_data_idx ON public.multiplicacoes (data_multiplicacao);

-- Habilitar RLS
ALTER TABLE public.multiplicacoes ENABLE ROW LEVEL SECURITY;

-- Política de SELECT respeitando o escopo
CREATE POLICY "Multiplicacoes view by scope"
ON public.multiplicacoes
FOR SELECT
USING (
  public.is_admin(auth.uid())
  OR public.can_manage_celula(auth.uid(), celula_origem_id)
  OR public.can_manage_celula(auth.uid(), celula_destino_id)
  OR EXISTS (
    SELECT 1
    FROM public.celulas c
    JOIN public.coordenacoes co ON c.coordenacao_id = co.id
    JOIN public.supervisores s ON s.coordenacao_id = co.id
    WHERE s.profile_id = public.get_profile_id(auth.uid())
      AND (c.id = celula_origem_id OR c.id = celula_destino_id)
  )
);

-- Política de INSERT com checagens de escopo e contexto
CREATE POLICY "Multiplicacoes create by authorized roles"
ON public.multiplicacoes
FOR INSERT
WITH CHECK (
  -- Permissão: admin, líderes de rede/coord/líder de célula (via can_manage_celula em ambas as células)
  (
    public.is_admin(auth.uid())
    OR (
      public.can_manage_celula(auth.uid(), celula_origem_id)
      AND public.can_manage_celula(auth.uid(), celula_destino_id)
    )
    OR EXISTS (
      -- Supervisores vinculados à coordenação da origem e destino
      SELECT 1
      FROM public.celulas c1
      JOIN public.coordenacoes co1 ON c1.coordenacao_id = co1.id
      JOIN public.supervisores s1 ON s1.coordenacao_id = co1.id
      JOIN public.celulas c2 ON c2.id = celula_destino_id
      JOIN public.coordenacoes co2 ON c2.coordenacao_id = co2.id
      JOIN public.supervisores s2 ON s2.coordenacao_id = co2.id
      WHERE c1.id = celula_origem_id
        AND s1.profile_id = public.get_profile_id(auth.uid())
        AND s2.profile_id = public.get_profile_id(auth.uid())
    )
  )
  AND EXISTS (
    -- Mesma rede para origem e destino
    SELECT 1
    FROM public.celulas o
    JOIN public.coordenacoes co_o ON o.coordenacao_id = co_o.id
    JOIN public.redes r_o ON co_o.rede_id = r_o.id
    JOIN public.celulas d ON d.id = celula_destino_id
    JOIN public.coordenacoes co_d ON d.coordenacao_id = co_d.id
    JOIN public.redes r_d ON co_d.rede_id = r_d.id
    WHERE o.id = celula_origem_id
      AND r_o.id = r_d.id
  )
);

-- Política de UPDATE (editar data/notes) com escopo
CREATE POLICY "Multiplicacoes update by scope"
ON public.multiplicacoes
FOR UPDATE
USING (
  public.is_admin(auth.uid())
  OR public.can_manage_celula(auth.uid(), celula_origem_id)
  OR public.can_manage_celula(auth.uid(), celula_destino_id)
  OR EXISTS (
    SELECT 1
    FROM public.celulas c
    JOIN public.coordenacoes co ON c.coordenacao_id = co.id
    JOIN public.supervisores s ON s.coordenacao_id = co.id
    WHERE s.profile_id = public.get_profile_id(auth.uid())
      AND (c.id = celula_origem_id OR c.id = celula_destino_id)
  )
);

-- Política de DELETE com escopo (apenas quem tem gestão)
CREATE POLICY "Multiplicacoes delete by scope"
ON public.multiplicacoes
FOR DELETE
USING (
  public.is_admin(auth.uid())
  OR public.can_manage_celula(auth.uid(), celula_origem_id)
  OR public.can_manage_celula(auth.uid(), celula_destino_id)
);

-- Trigger para updated_at
CREATE TRIGGER update_multiplicacoes_updated_at
BEFORE UPDATE ON public.multiplicacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
