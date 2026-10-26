import { buildQuestionImportViewModel } from './question-import-view-model.js';

export function createQuestionImportController({
  document,
  window,
  service,
  render,
  notify,
  onImported = (_res: Record<string, any>) => {},
  onCancel = (_status: string) => {},
  maxBytes = 5 * 1024 * 1024,
}: any = {}) {
  const input = document.getElementById('questionsImportFile') as HTMLInputElement | null;
  const open = document.getElementById('importQuestionsBtn');
  const overlay = document.getElementById('questionsImportOverlay');
  const content = document.getElementById('questionsImportContent');
  const confirm = document.getElementById('questionsImportConfirmBtn');
  const cancel = document.getElementById('questionsImportCancelBtn');

  if (!input || !overlay || !content || !confirm || !cancel) {
    return Object.freeze({
      read: () => {},
      close: () => {},
      choose: () => {},
    });
  }

  let pending: Record<string, any> | null = null;
  let previousFocus: any = null;

  const close = ({ completed = false } = {}) => {
    overlay.classList.remove('show');
    pending = null;
    onCancel({ completed });
    previousFocus?.focus?.();
    previousFocus = null;
  };

  const show = (model: Record<string, any>) => {
    content.innerHTML = render(model);
    confirm.hidden = !model.canConfirm;
    overlay.classList.add('show');
    cancel.focus();
  };

  const read = (file: File) => {
    if (!file) return;
    if (file.size > maxBytes) {
      notify('O arquivo excede o limite de 5 MB.');
      return;
    }

    const FileReaderClass = window.FileReader || globalThis.FileReader;
    const reader = new FileReaderClass();
    reader.onerror = () => notify('Não foi possível ler o arquivo.');
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const preview = service.preview(text, { fileName: file.name || 'questoes.csv' });
        pending = { preview, fileName: file.name || 'questoes.csv' };
        show(buildQuestionImportViewModel({ ...pending }));
      } catch (error) {
        pending = null;
        show(
          buildQuestionImportViewModel({
            fileName: file.name || 'questoes.csv',
            issues: error?.issues || [{ message: error?.message || 'Arquivo inválido.' }],
          })
        );
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const choose = () => {
    previousFocus = document.activeElement;
    input.click();
  };

  if (open) {
    open.addEventListener('click', choose);
  }

  input.addEventListener('change', () => {
    if (input.files?.[0]) {
      read(input.files[0]);
    } else {
      onCancel({ completed: false });
    }
    input.value = '';
  });

  cancel.addEventListener('click', () => close());

  confirm.addEventListener('click', () => {
    if (!pending || !pending.preview) return;
    try {
      const result = service.import(pending.preview, { createMissing: true, skipDuplicates: true });
      close({ completed: true });
      onImported(result);
    } catch (error) {
      notify(error?.message || 'A importação de questões falhou. Nenhum dado foi alterado.');
    }
  });

  overlay.addEventListener('keydown', (event: any) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  return Object.freeze({ read, close, choose });
}
