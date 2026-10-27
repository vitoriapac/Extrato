# Roteiro de Auditoria Manual com NVDA — StudyTrack

Este documento detalha o protocolo e o roteiro passo a passo para a execução de auditorias manuais de acessibilidade com o leitor de telas **NVDA (NonVisual Desktop Access)** no Windows, com o objetivo de auditar e comprovar a conformidade do StudyTrack com o nível AA das WCAG 2.1 e WCAG 2.2.

> [!IMPORTANT]
> **Status de Cobertura:** Os fluxos abaixo contam com suporte a teclado, focus trap e anúncios via `aria-live` implementados e validados por testes unitários e E2E no Playwright. No entanto, sessões manuais completas com operador cego ou leitor NVDA físico instalado em ambiente de produção estão marcadas como **Não verificado**, devendo ser preenchidas apenas após execução manual em máquina com sintetizador de voz.

---

## 1. Ambiente e Configuração Recomendada

- **Sistema Operacional:** Windows 10/11 x64.
- **Leitor de Telas:** NVDA versão 2024.1 ou superior.
- **Navegador:** Google Chrome ou Mozilla Firefox (versões estáveis mais recentes).
- **Sintetizador:** Windows OneCore ou eSpeak NG padrão em Português do Brasil (`pt-BR`).
- **Modos de navegação NVDA:**
  - `NVDA + Espaço`: Alternar entre Modo de Foco (*Focus Mode*) e Modo de Navegação (*Browse Mode*).
  - `Tab` / `Shift + Tab`: Navegação por controles interativos.
  - `Setas acima / abaixo`: Leitura linear no Modo de Navegação.
  - `H` / `Shift + H`: Navegação por cabeçalhos (`<h1>` a `<h6>`).
  - `D` / `Shift + D`: Navegação por marcos estruturais (*landmarks*).
  - `Escape`: Fechamento de diálogos e popovers.

---

## 2. Matriz de Auditoria por Fluxo

| ID | Fluxo / Superfície | Elementos Auditados | Critério de Sucesso | Status da Verificação Manual NVDA |
| :--- | :--- | :--- | :--- | :--- |
| **NVDA-01** | Cronômetro de Estudos | Botões Iniciar, Pausar, Zerar, `#timerAriaLive` | Mudança de estado falada automaticamente ("Cronômetro iniciado", "Cronômetro pausado", etc.) sem necessidade de mudar o foco | **Não verificado com NVDA real** *(Validado via E2E)* |
| **NVDA-02** | Diálogo Novo Card de Erro | `Dialog`, inputs de texto, botão Fechar, Escape | Foco restrito ao modal (focus trap), Escape fecha e devolve o foco ao botão "+ Novo Card" | **Não verificado com NVDA real** *(Validado via E2E)* |
| **NVDA-03** | Avaliação de Flashcard | Botões Errei / Difícil / Bom / Fácil, `aria-live` | Feedback de próxima revisão anunciado de forma audível após classificação | **Não verificado com NVDA real** *(Validado via E2E)* |
| **NVDA-04** | Tour Guiado (Onboarding) | `GuidedTourPopover`, botões Próximo / Pular / Voltar | Foco transferido para o diálogo do tour, leitura do título/conteúdo, ciclo de foco preso no popover | **Não verificado com NVDA real** *(Validado via E2E)* |
| **NVDA-05** | Diálogo de Sessão Pós-Estudo | `#sessionModalOverlay`, campos de matéria e páginas | Foco inicial no campo prioritário, leitura de labels associados a todos os selects e inputs | **Não verificado com NVDA real** *(Validado via E2E)* |
| **NVDA-06** | Navegação por Abas Principais | Barra de abas com `role="tab"` / `role="tablist"` | Estado ativo anunciado (`aria-selected="true"`), troca com Setas ou Enter | **Não verificado com NVDA real** *(Validado via E2E)* |

---

## 3. Roteiro Passo a Passo

### Fluxo 1: Cronômetro de Estudos (`#overview-timer`)
1. Com o NVDA ativo, acesse o painel principal (*Dashboard*).
2. Pressione `Tab` até alcançar o botão "▶ Iniciar" do cronômetro.
3. Pressione `Enter` ou `Espaço`.
   - **Comportamento Esperado:** O sintetizador deve vocalizar imediatamente: *"Cronômetro iniciado."*
4. Aguarde alguns segundos e pressione `Tab` até o botão "⏸ Pausar". Pressione `Enter`.
   - **Comportamento Esperado:** O sintetizador deve vocalizar: *"Cronômetro pausado."*
5. Pressione `Tab` até o botão "↺ Zerar" e confirme o diálogo.
   - **Comportamento Esperado:** O sintetizador deve vocalizar: *"Cronômetro zerado."*

### Fluxo 2: Modal de Novo Card no Caderno de Erros
1. Navegue até a aba **Questões** e ative o botão **Caderno de Erros (Flashcards)**.
2. Pressione `Tab` até o botão "+ Novo Card" e pressione `Enter`.
3. Verifique o posicionamento do foco:
   - O foco deve ser direcionado automaticamente para o primeiro campo interativo do modal (`textarea` da questão).
4. Pressione repetidamente `Tab`:
   - O foco deve circular estritamente entre o primeiro campo, segundo campo, terceiro campo, botão Salvar e botão Cancelar.
   - **O foco NÃO pode vazar** para a página em segundo plano (*Focus Trap*).
5. Pressione `Escape`:
   - O modal deve se fechar instantaneamente.
   - O foco do teclado **deve retornar para o botão "+ Novo Card"** que disparou a abertura.

### Fluxo 3: Tour Guiado (`GuidedTourPopover`)
1. No menu de ajuda ou via atalho, inicie o Tour Guiado.
2. Verifique se o diálogo do tour é anunciado com seu papel (`dialog`) e nome acessível.
3. Pressione `Tab` e confirme que os botões "Próximo", "Voltar" e "Pular" mantêm o foco contido dentro da caixa de diálogo.
4. Pressione `Escape` para interromper o tour e confirme o fechamento e a liberação do foco.

---

## 4. Registro de Ocorrências e Débitos Técnicos

| Data | Versão | Inspetor | Fluxo | Ocorrência / Sintoma | Ação Corretiva |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 27/10/2026 | 1.0.0 | Antigravity AI | Todos | Testes automatizados cobrem `aria-live` e focus traps; aguardando operador humano com NVDA | Roteiro estabelecido; documentação atualizada para não fazer alegações indevidas |
