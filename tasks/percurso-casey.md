# Percurso da Casey (celular, polegar, interrupções) em 15/11/2026

Perfil: usa o celular com uma mão, é interrompida, toca em vez de digitar. Emulação: 375×812 com toque, demo. Capturas em `tasks/prints-casey/`.

| Passo | Medido | Resultado |
|---|---|---|
| Chegar ao Planejamento | 2 toques (Mais → Planejamento), barra inferior em y=756 (56 px) | ok |
| Primeira ação da Semana | "Ajustar disponibilidade" em y=539, 44 px de altura, na primeira tela e na metade de baixo (zona do polegar) | ok |
| Trocar de subaba | seletor nativo de 44 px | ok (esconde as outras 3 subabas atrás de um toque) |
| Editar uma meta (Prova e metas) | cartão com 2 campos (Meta de acerto, Questões por semana) e "Mais campos"; "Salvar alterações" 136×44 | ok |
| Barra de salvar | estava com 126 px e sob a barra de abas (texto cortado); **corrigido**: agora fica acima da barra de abas (y=629, termina antes de 756) | corrigido |
| Legenda "Meta geral…" | quebrava numa coluna de ~105 px em 7 linhas; **corrigido**: largura total, 2 linhas | corrigido |
| Recarregar no meio da edição | a subaba e o hash (`#planejamento/prova`) se mantêm; **o rascunho não editado é perdido** (existe aviso do navegador ao sair, mas o celular pode descartar a aba sem aviso) | **risco aberto** |
| Fechamento: "Revisar o retrato" | alcançável; "Salvar fechamento" em y=631 livre da barra de abas | ok |
| Fim da página | último elemento termina em y=654, antes da barra de abas (756) | ok |

## Pontos abertos
1. **Rascunho da tabela de metas só vive na memória.** Se o navegador do celular descartar a aba, a edição se perde. Opção: guardar o rascunho em `sessionStorage` e restaurar.
2. O selo "Salvo" flutuante e o botão "voltar ao topo" ficam sobre o conteúdo no canto direito (nesta passada, o "voltar ao topo" encosta no botão Descartar).
3. O cabeçalho do app (faixa de demonstração, cabeçalho e ícones) ocupa ~200 px antes de "Planejamento".
