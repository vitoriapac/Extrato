const safe = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char: string) =>
      (
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }) as Record<string, string>
      )[char]
  );

export function renderQuestionImport(model: Record<string, any>) {
  if (model.issues && model.issues.length) {
    return `
      <div class="structured-import-error">
        <h4>Não foi possível importar as questões.</h4>
        <p>${model.issues.length} ${model.issues.length === 1 ? 'problema encontrado' : 'problemas encontrados'}:</p>
        <ol>
          ${model.issues.map((item: any) => `<li>${item.line ? `Linha ${item.line} — ` : ''}${safe(item.message)}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  const p = model.preview;
  if (!p) {
    return '<div class="empty-state"><p>Nenhum dado para prévia.</p></div>';
  }

  return `
    <div class="structured-import-preview">
      <p class="structured-file"><strong>Arquivo:</strong> ${safe(model.fileName)}</p>

      <div class="study-plan-summary">
        <div><strong>${p.totalResolved}</strong><span>questões resolvidas</span></div>
        <div><strong>${p.totalCorrect}</strong><span>acertos</span></div>
        <div><strong>${p.accuracy}%</strong><span>precisão geral</span></div>
        <div><strong>${p.totalSessions}</strong><span>sessões de estudo</span></div>
      </div>

      <div class="structured-import-counts">
        <section>
          <h4>Correspondências</h4>
          <p>${p.matchedSubjectsCount} disciplinas e ${p.matchedTopicsCount} tópicos encontrados no seu plano.</p>
        </section>

        <section>
          <h4>Novos cadastros</h4>
          <p>
            ${p.newSubjectsCount > 0 ? `+${p.newSubjectsCount} novas disciplinas` : 'Nenhuma nova disciplina'} ·
            ${p.newTopicsCount > 0 ? `+${p.newTopicsCount} novos tópicos` : 'Nenhum novo tópico'}
          </p>
        </section>

        <section>
          <h4>Duplicatas</h4>
          <p>${p.duplicateCount > 0 ? `${p.duplicateCount} sessões já existentes serão ignoradas.` : 'Nenhuma duplicata detectada.'}</p>
        </section>

        ${
          p.unknownErrorCategoryCount > 0
            ? `
        <section>
          <h4>Categorias de erro</h4>
          <p>${p.unknownErrorCategoryCount} ${p.unknownErrorCategoryCount === 1 ? 'linha com categoria de erro não reconhecida' : 'linhas com categoria de erro não reconhecida'} (ignorada).</p>
        </section>
        `
            : ''
        }

        ${
          p.archivedRecordCount > 0
            ? `
        <section>
          <h4>Itens arquivados</h4>
          <p>${p.archivedRecordCount} ${p.archivedRecordCount === 1 ? 'registro irá' : 'registros irão'} para disciplinas/tópicos arquivados: ${p.archivedMatches.map(safe).join(', ')}.</p>
        </section>
        `
            : ''
        }
      </div>

      ${
        p.newSubjects.length
          ? `
        <details class="structured-conflicts">
          <summary>Novas disciplinas a criar (${p.newSubjects.length})</summary>
          <ul>
            ${p.newSubjects.map((s: any) => `<li>${safe(s)}</li>`).join('')}
          </ul>
        </details>
      `
          : ''
      }

      ${
        p.newTopics.length
          ? `
        <details class="structured-conflicts">
          <summary>Novos tópicos a criar (${p.newTopics.length})</summary>
          <ul>
            ${p.newTopics
              .slice(0, 30)
              .map(
                (t: any) => `<li><strong>${safe(t.subjectName)}:</strong> ${safe(t.topicName)}</li>`
              )
              .join('')}
            ${p.newTopics.length > 30 ? `<li><em>...e mais ${p.newTopics.length - 30} tópicos</em></li>` : ''}
          </ul>
        </details>
      `
          : ''
      }

      ${
        p.recordsSample.length
          ? `
        <details class="structured-conflicts" open>
          <summary>Amostra dos registros (${p.recordsSample.length} de ${p.totalSessions})</summary>
          <table class="log" style="width:100%;font-size:12px;margin-top:8px;">
            <thead>
              <tr>
                <th>Data</th>
                <th>Disciplina</th>
                <th>Tópico</th>
                <th>Resolvidas</th>
                <th>Acertos</th>
              </tr>
            </thead>
            <tbody>
              ${p.recordsSample
                .map(
                  (r: any) => `
                <tr ${r.isDuplicate ? 'style="opacity:0.6;" title="Duplicata existente (será ignorada)"' : ''}>
                  <td>${safe(r.date)}</td>
                  <td>${safe(r.subjectName)}</td>
                  <td>${safe(r.topicName || '—')}</td>
                  <td>${r.resolved}</td>
                  <td>${r.correct}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </details>
      `
          : ''
      }
    </div>
  `;
}
