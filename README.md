# StudyTrack — Extrato de Estudos

StudyTrack (Extrato de Estudos) é uma SPA em JavaScript vanilla, sem frameworks ou dependências externas em runtime, para planejamento e acompanhamento de estudos. Arquitetura modular em camadas (state → core → storage → domain → ui), com regra explícita de fluxo de dependências documentada em ARCHITECTURE.md.

Persistência: IndexedDB como armazenamento primário, com fallback automático para localStorage, sincronização entre abas via BroadcastChannel, snapshots rotativos com checksum SHA-256 e migração/validação de esquema antes de adotar dados locais ou importados.

Funcionalidades: disciplinas e tópicos com tags e níveis de dificuldade, calendário e agenda de revisões, algoritmo de revisão espaçada (24h/7d/30d), cronômetro de sessões, banco de questões e simulados com diagnóstico de erros, índice de prontidão, radar por disciplina e replanejamento semanal.

PWA: instalável, funcionamento offline via Service Worker (requer servidor HTTP local para essa camada), tema claro/escuro e navegação acessível por teclado (incluindo busca global via Ctrl/Cmd+K).

Build e testes: bundling com esbuild (src/app.bundle.js gerado, não editado manualmente), suíte de testes unitários (tests/unit/) e testes de integração legados (tests/test-runner.html), CI configurado via GitHub Actions.

Privacidade: 100% client-side — nenhum dado de estudo trafega para servidor ou é enviado ao repositório; todo o histórico permanece no navegador do usuário.

## Recursos

- Disciplinas, tópicos, notas, tags e níveis de dificuldade.
- Calendário, agenda de revisões e plano diário.
- Cronômetro e histórico de sessões.
- Histórico compacto no desktop, com detalhes sob demanda e filtros recolhíveis no celular.
- Relatório estratégico A4 com período configurável, prova, planejamento versus execução, desempenho por disciplina, simulados, revisões, riscos, oportunidades, recomendações e erros.
- Questões, simulados, diagnóstico de erros e indicadores de prontidão.
- Metas semanais, mensais e por disciplina.
- Tema claro/escuro, interface responsiva e navegação por teclado.
- Persistência local, snapshots rotativos e importação/exportação de backup.
- Modo demonstração isolado, com 90 dias de dados fictícios e sem acesso à base real.
- Instalação como PWA e funcionamento offline quando servido por HTTP.

## Privacidade e dados

Os dados de estudo ficam no navegador do usuário. O projeto não possui servidor de aplicação nem envia o conteúdo do histórico para o GitHub. Para evitar perda de dados, exporte backups regularmente.

## Executar

Para uso simples, abra `index.html`. A persistência funciona localmente; recursos de PWA exigem um servidor HTTP local.

```powershell
npm run serve
```

Depois abra o endereço exibido. A página inicial será aberta automaticamente.

## Desenvolvimento

Requer Node.js 22 ou superior.

```powershell
npm install
npm run build
npm test
npm run check
```

Edite os módulos em `src/`. `src/app.bundle.js` é gerado pelo esbuild e não deve ser editado manualmente. O script `build.ps1` continua disponível como atalho no Windows.

Os testes legados de integração podem ser abertos em `tests/test-runner.html`. Novas regras puras devem receber testes em `tests/unit/`.

## Arquitetura

As regras de estudo, analytics, recomendações, revisões, persistência e relatórios ficam em módulos independentes do DOM. IndexedDB, armazenamento local e demonstração usam providers substituíveis; migrações são sequenciais e backups passam por validação antes da adoção. Consulte [ARCHITECTURE.md](ARCHITECTURE.md).

## Atalhos

- `Ctrl+K` ou `Cmd+K`: busca global.
- `1` a `7`: alterna entre as abas quando o foco não está em um campo.
- `Esc`: fecha busca ou modal ativo.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
