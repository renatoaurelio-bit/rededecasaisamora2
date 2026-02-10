import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Users2, CheckCircle2, Circle, Link2, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Member, useMembers, useUpdateMember, useRemoveMember } from '@/hooks/useMembers';
import { useCasais, useDeleteCasal } from '@/hooks/useCasais';
import { MemberFormDialogSimple } from './cellleader/MemberFormDialogSimple';
import { CasalFormDialog } from './cellleader/CasalFormDialog';
import { useMultiplicacaoByDestino, useMultiplicacoesByOrigem } from '@/hooks/useMultiplicacoes';
import { MultiplicacaoFormDialog } from '@/components/celulas/MultiplicacaoFormDialog';

interface CelulaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celulaId: string;
  celulaName: string;
}

const MARCOS_ESPIRITUAIS = [
  { key: 'batismo', label: 'Batismo' },
  { key: 'encontro_com_deus', label: 'Encontro com Deus' },
  { key: 'renovo', label: 'Renovo' },
  { key: 'encontro_de_casais', label: 'Encontro de Casais' },
  { key: 'curso_lidere', label: 'Curso Lidere' },
  { key: 'is_discipulado', label: 'É Discipulado' },
  { key: 'is_lider_em_treinamento', label: 'Líder em Treinamento' },
] as const;

export function CelulaDetailsDialog({ open, onOpenChange, celulaId, celulaName }: CelulaDetailsDialogProps) {
  const { data: members, isLoading: membersLoading } = useMembers(celulaId);
  const { data: casais, isLoading: casaisLoading } = useCasais(celulaId);
  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();
  const deleteCasal = useDeleteCasal();
  
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [casalDialogOpen, setCasalDialogOpen] = useState(false);
  const [multiplicacaoDialogOpen, setMultiplicacaoDialogOpen] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  const isLoading = membersLoading || casaisLoading;

  const { data: origemDaCelula } = useMultiplicacaoByDestino(celulaId);
  const { data: destinosGerados } = useMultiplicacoesByOrigem(celulaId);

  const toggleExpanded = (memberId: string) => {
    setExpandedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleMarcoChange = async (member: Member, marco: string, checked: boolean) => {
    await updateMember.mutateAsync({
      id: member.id,
      [marco]: checked,
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      await removeMember.mutateAsync(memberId);
    }
  };

  const handleRemoveCasal = async (casalId: string) => {
    if (confirm('Tem certeza que deseja remover este vínculo de casal?')) {
      await deleteCasal.mutateAsync(casalId);
    }
  };

  const getMarcoCount = (member: Member) => {
    let count = 0;
    if (member.batismo) count++;
    if (member.encontro_com_deus) count++;
    if (member.renovo) count++;
    if (member.encontro_de_casais) count++;
    if (member.curso_lidere) count++;
    if (member.is_discipulado) count++;
    if (member.is_lider_em_treinamento) count++;
    return count;
  };

  const membersInCouples = new Set<string>();
  casais?.forEach(casal => {
    membersInCouples.add(casal.member1_id);
    membersInCouples.add(casal.member2_id);
  });

  const availableMembers = members?.filter(m => !membersInCouples.has(m.id)) || [];

  const membrosStats = {
    total: members?.length || 0,
    batismo: members?.filter(m => m.batismo).length || 0,
    encontro_com_deus: members?.filter(m => m.encontro_com_deus).length || 0,
    renovo: members?.filter(m => m.renovo).length || 0,
    encontro_de_casais: members?.filter(m => m.encontro_de_casais).length || 0,
    curso_lidere: members?.filter(m => m.curso_lidere).length || 0,
    is_discipulado: members?.filter(m => m.is_discipulado).length || 0,
    is_lider_em_treinamento: members?.filter(m => m.is_lider_em_treinamento).length || 0,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {celulaName}
            </DialogTitle>
            <DialogDescription>
              Gerencie os membros e casais da célula
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="resumo" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="membros">Membros ({members?.length || 0})</TabsTrigger>
                <TabsTrigger value="casais">Casais ({casais?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="resumo" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Membros</CardTitle>
                      <CardDescription>Total de membros ativos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{membrosStats.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Casais</CardTitle>
                      <CardDescription>Casais vinculados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{casais?.length || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Marcos Espirituais</CardTitle>
                    <CardDescription>Progresso dos membros</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {MARCOS_ESPIRITUAIS.map(({ key, label }) => {
                        const count = membrosStats[key as keyof typeof membrosStats];
                        const percentage = membrosStats.total > 0 
                          ? Math.round((count / membrosStats.total) * 100) 
                          : 0;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm">{label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <Badge variant="secondary" className="min-w-[60px] justify-center">
                                {count}/{membrosStats.total}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex md:flex-row md:items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Multiplicações</CardTitle>
                      <CardDescription>Origem e destinos desta célula</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setMultiplicacaoDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Multiplicação
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {origemDaCelula ? (
                      <div className="text-sm">
                        Esta célula surgiu de: <span className="font-medium">{origemDaCelula.origem?.name}</span> em{' '}
                        <span className="font-mono">{origemDaCelula.data_multiplicacao}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Esta célula não possui origem registrada.
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Células multiplicadas por esta célula</div>
                      {destinosGerados && destinosGerados.length > 0 ? (
                        <div className="space-y-2">
                          {destinosGerados.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-sm">
                              <span>{m.destino?.name}</span>
                              <Badge variant="outline">{m.data_multiplicacao}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Nenhuma célula multiplicada registrada.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="membros" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setMemberDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </div>
                
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-3">
                    {members?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum membro cadastrado. Clique em "Adicionar Membro" para começar.
                      </div>
                    ) : (
                      members?.map((member) => (
                        <Collapsible
                          key={member.id}
                          open={expandedMembers.has(member.id)}
                          onOpenChange={() => toggleExpanded(member.id)}
                        >
                          <div className="border rounded-lg p-3">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {member.profile?.name?.charAt(0) || 'M'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{member.profile?.name || 'Sem nome'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {member.profile?.email || 'Sem email'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {getMarcoCount(member)}/7 marcos
                                  </Badge>
                                  {expandedMembers.has(member.id) ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="pt-4">
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">Marcos Espirituais:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {MARCOS_ESPIRITUAIS.map(({ key, label }) => (
                                    <div key={key} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${member.id}-${key}`}
                                        checked={member[key as keyof Member] as boolean}
                                        onCheckedChange={(checked) => 
                                          handleMarcoChange(member, key, checked as boolean)
                                        }
                                        disabled={updateMember.isPending}
                                      />
                                      <label
                                        htmlFor={`${member.id}-${key}`}
                                        className="text-sm cursor-pointer"
                                      >
                                        {label}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-end pt-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveMember(member.id)}
                                    disabled={removeMember.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="casais" className="space-y-4">
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setCasalDialogOpen(true)} 
                    size="sm"
                    disabled={availableMembers.length < 2}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Vincular Casal
                  </Button>
                </div>
                
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-3">
                    {casais?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>Nenhum casal vinculado ainda.</p>
                        {availableMembers.length >= 2 ? (
                          <p className="text-sm">Clique em "Vincular Casal" para começar.</p>
                        ) : (
                          <p className="text-sm">Adicione pelo menos 2 membros para vincular casais.</p>
                        )}
                      </div>
                    ) : (
                      casais?.map((casal) => (
                        <Card key={casal.id} className="bg-gradient-to-r from-primary/5 to-primary/10">
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={casal.member1?.profile?.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {casal.member1?.profile?.name?.charAt(0) || 'M'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {casal.member1?.profile?.name || 'Sem nome'}
                                  </span>
                                </div>

                                <Link2 className="h-5 w-5 text-primary flex-shrink-0" />

                                <div className="flex items-center gap-2">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={casal.member2?.profile?.avatar_url || undefined} />
                                    <AvatarFallback>
                                      {casal.member2?.profile?.name?.charAt(0) || 'M'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {casal.member2?.profile?.name || 'Sem nome'}
                                  </span>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCasal(casal.id)}
                                disabled={deleteCasal.isPending}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <MemberFormDialogSimple
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        celulaId={celulaId}
      />

      <CasalFormDialog
        open={casalDialogOpen}
        onOpenChange={setCasalDialogOpen}
        celulaId={celulaId}
        availableMembers={availableMembers}
      />
      <MultiplicacaoFormDialog
        open={multiplicacaoDialogOpen}
        onOpenChange={setMultiplicacaoDialogOpen}
        initialOrigemId={celulaId}
      />
    </>
  );
}
