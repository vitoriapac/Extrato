import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTimerTitle,
  shouldMarkHidden,
  buildTimerMiniView,
  createPipTimerController,
  PIP_FINISH_NOTICE,
} from '../../src/ui/controllers/pip-timer-controller.js';

const baseTitle = 'StudyTrack — Extrato de Estudos';

test('título da aba mostra o cronômetro enquanto há sessão', () => {
  assert.equal(
    formatTimerTitle({
      started: true,
      running: true,
      time: '24:15',
      subjectName: 'Português',
      baseTitle,
    }),
    '24:15 · Português — StudyTrack'
  );
  assert.equal(
    formatTimerTitle({
      started: true,
      running: false,
      time: '24:15',
      subjectName: 'Português',
      baseTitle,
    }),
    '[Pausado] 24:15 · Português — StudyTrack'
  );
  assert.equal(
    formatTimerTitle({ started: true, running: true, time: '01:02:03', baseTitle }),
    '01:02:03 — StudyTrack'
  );
});

test('sem sessão o título volta ao original', () => {
  assert.equal(
    formatTimerTitle({
      started: false,
      running: false,
      time: '00:00',
      subjectName: 'Português',
      baseTitle,
    }),
    baseTitle
  );
});

test('janela aberta impede marcar a aba como esquecida', () => {
  assert.equal(shouldMarkHidden({ isRunning: true, pipOpen: false }), true);
  assert.equal(shouldMarkHidden({ isRunning: true, pipOpen: true }), false);
  assert.equal(shouldMarkHidden({ isRunning: false, pipOpen: false }), false);
});

const formatTime = seconds =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
test('mini view monta tempo, meta, progresso, etapa e bookmark', () => {
  const view = buildTimerMiniView({
    running: true,
    seconds: 900,
    targetMinutes: 60,
    subjectName: 'Português',
    topicName: 'Crase',
    bookmarkLabel: 'PDF · pág. 42',
    stepLabel: 'Etapa 1/3: Teoria',
    formatTime,
  });
  assert.deepEqual(
    { ...view },
    {
      title: 'Português — Crase',
      bookmark: 'Continuar de: PDF · pág. 42',
      time: '15:00',
      target: 'Meta de 60 min',
      progress: 25,
      step: 'Etapa 1/3: Teoria',
      running: true,
      toggleLabel: 'Pausar',
    }
  );
  const free = buildTimerMiniView({ running: false, seconds: 30, formatTime });
  assert.equal(free.title, 'Sessão livre');
  assert.equal(free.progress, null);
  assert.equal(free.target, '');
  assert.equal(free.toggleLabel, 'Retomar');
  assert.equal(buildTimerMiniView({ seconds: 7200, targetMinutes: 60, formatTime }).progress, 100);
});

function fakePictureInPicture() {
  const calls = [];
  const element = tag => {
    const listeners = {};
    return {
      tag,
      className: '',
      textContent: '',
      hidden: false,
      disabled: false,
      children: [],
      append(...nodes) {
        this.children.push(...nodes);
      },
      addEventListener(type, fn) {
        listeners[type] = fn;
      },
      click() {
        listeners.click?.();
      },
    };
  };
  const makeWindow = () => {
    const listeners = {},
      timers = { intervals: new Map(), timeouts: [] };
    let id = 0;
    const win = {
      closed: false,
      focused: 0,
      timers,
      document: { createElement: element, body: element('body') },
      addEventListener(type, fn) {
        listeners[type] = fn;
      },
      setInterval(fn) {
        timers.intervals.set(++id, fn);
        return id;
      },
      clearInterval(key) {
        timers.intervals.delete(key);
      },
      setTimeout(fn) {
        timers.timeouts.push(fn);
      },
      focus() {
        win.focused++;
      },
      close() {
        win.closed = true;
        listeners.pagehide?.();
      },
      pagehide() {
        listeners.pagehide?.();
      },
    };
    return win;
  };
  return {
    calls,
    requestWindow: async options => {
      calls.push(options);
      return makeWindow();
    },
  };
}
const find = (node, className) =>
  node.className === className
    ? node
    : node.children?.map(child => find(child, className)).find(Boolean);
const view = {
  title: 'Português — Crase',
  bookmark: '',
  time: '10:00',
  target: '',
  progress: null,
  step: '',
  running: true,
  toggleLabel: 'Pausar',
};

test('sem suporte a janela não abre nem lança erro', async () => {
  const controller = createPipTimerController({
    pictureInPicture: undefined,
    getView: () => view,
    onToggle() {},
    onFinish() {},
  });
  assert.equal(controller.supported, false);
  assert.equal(await controller.open(), null);
  assert.equal(controller.isOpen(), false);
});

test('abre uma única janela, renderiza e repassa os botões', async () => {
  const pip = fakePictureInPicture(),
    events = [];
  let copied = 0;
  const controller = createPipTimerController({
    pictureInPicture: pip,
    getView: () => view,
    onToggle: () => events.push('toggle'),
    onFinish: () => events.push('finish'),
    copyStyles: () => copied++,
  });
  const [first, second] = await Promise.all([controller.open(), controller.open()]);
  assert.equal(pip.calls.length, 1);
  assert.deepEqual(pip.calls[0], { width: 320, height: 200 });
  assert.equal(first, second);
  assert.equal(copied, 1);
  await controller.open();
  assert.equal(pip.calls.length, 1);
  assert.equal(first.focused, 1);
  const root = first.document.body;
  assert.equal(find(root, 'pip-timer__time').textContent, '10:00');
  assert.equal(find(root, 'pip-timer__bookmark').hidden, true);
  assert.equal(find(root, 'pip-timer__progress').hidden, true);
  assert.equal(first.timers.intervals.size, 1);
  find(root, 'btn').click();
  assert.deepEqual(events, ['toggle']);
  find(root, 'btn ghost').click();
  assert.deepEqual(events, ['toggle', 'finish']);
  assert.equal(find(root, 'pip-timer__notice').hidden, false);
  assert.equal(find(root, 'pip-timer__notice').textContent, PIP_FINISH_NOTICE);
  assert.equal(first.closed, false);
  first.timers.timeouts.at(-1)();
  assert.equal(first.closed, true);
  assert.equal(controller.isOpen(), false);
  assert.equal(first.timers.intervals.size, 0);
});

test('fechar no X só descarta a referência', async () => {
  const pip = fakePictureInPicture(),
    events = [];
  const controller = createPipTimerController({
    pictureInPicture: pip,
    getView: () => view,
    onToggle: () => events.push('toggle'),
    onFinish: () => events.push('finish'),
  });
  const opened = await controller.open();
  opened.pagehide();
  assert.equal(controller.isOpen(), false);
  assert.deepEqual(events, []);
  assert.equal(opened.timers.intervals.size, 0);
  controller.render();
  await controller.open();
  assert.equal(pip.calls.length, 2);
});
