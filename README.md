# StudyTrack — Extrato de Estudos

Aplicação local para planejar estudos, acompanhar tópicos, registrar questões e simulados, organizar revisões adaptativas e medir progresso.

## Recursos

- Disciplinas, tópicos, notas, tags e níveis de dificuldade.
- Calendário, agenda de revisões e plano diário.
- Cronômetro e histórico de sessões.
- Histórico compacto no desktop, com detalhes sob demanda e filtros recolhíveis no celular.
- Relatório estratégico A4 com prontidão, planejamento, execução, projeção, riscos, oportunidades, recomendações e erros.
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
