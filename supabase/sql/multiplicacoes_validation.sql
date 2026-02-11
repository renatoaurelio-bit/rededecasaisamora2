-- Verificar tabela e colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'multiplicacoes'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'multiplicacoes';

-- Verificar unicidade de destino
SELECT celula_destino_id, COUNT(*) AS qtd
FROM public.multiplicacoes
GROUP BY celula_destino_id
HAVING COUNT(*) > 1;

-- Verificar regra de mesma rede (todas linhas devem retornar)
SELECT m.id
FROM public.multiplicacoes m
JOIN public.celulas o ON o.id = m.celula_origem_id
JOIN public.coordenacoes co_o ON co_o.id = o.coordenacao_id
JOIN public.redes r_o ON r_o.id = co_o.rede_id
JOIN public.celulas d ON d.id = m.celula_destino_id
JOIN public.coordenacoes co_d ON co_d.id = d.coordenacao_id
JOIN public.redes r_d ON r_d.id = co_d.rede_id
WHERE r_o.id = r_d.id;

-- Listar origem de uma célula destino (substitua pelo UUID real)
-- :CELULA_DESTINO_ID
SELECT m.*, o.name AS origem_name
FROM public.multiplicacoes m
JOIN public.celulas o ON o.id = m.celula_origem_id
WHERE m.celula_destino_id = :CELULA_DESTINO_ID;

-- Listar destinos gerados por uma célula origem (substitua pelo UUID real)
-- :CELULA_ORIGEM_ID
SELECT m.*, d.name AS destino_name
FROM public.multiplicacoes m
JOIN public.celulas d ON d.id = m.celula_destino_id
WHERE m.celula_origem_id = :CELULA_ORIGEM_ID
ORDER BY m.data_multiplicacao DESC;
