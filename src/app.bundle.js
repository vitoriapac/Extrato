/* Arquivo gerado. Edite os modulos em src/, nao este bundle. */
(() => {
  // src/state/schema.js
  var STORAGE_KEY = "bb-premium-study-data";
  var BACKUP_KEY = STORAGE_KEY + "-automatic-backup";
  var BACKUP_INDEX_KEY = BACKUP_KEY + "-index";
  var AUTOMATIC_BACKUP_SLOTS = 5;
  var CURRENT_SCHEMA_VERSION = 17;
  var MAX_BACKUP_FILE_SIZE = 10 * 1024 * 1024;
  var DB_NAME = "extrato-estudos-db";
  var DB_VERSION = 1;
  var STORE_NAME = "app-state";
  var DEMO_STORAGE_KEY = "bb-premium-study-demo";
  var STATUS_OPTIONS = ["Não iniciado", "Em andamento", "Revisão", "Concluído"];
  var REVIEW_OPTIONS = ["—", "Revisão rápida", "Revisão completa", "Questões", "Resumo/Mapa mental"];
  var STATUS_CLASS = { "Não iniciado": "st-nao", "Em andamento": "st-and", "Revisão": "st-rev", "Concluído": "st-con" };
  var TIPO_AGENDA_OPTIONS = ["Revisão 24h", "Revisão 3 dias", "Revisão 7 dias", "Revisão 14 dias", "Revisão 15 dias", "Revisão 30 dias", "Revisão livre"];
  var DIFFICULTY_OPTIONS = ["Fácil", "Médio", "Difícil"];
  var DIFFICULTY_WEIGHT = { "Fácil": 1, "Médio": 2, "Difícil": 3 };
  var DIFFICULTY_CLASS = { "Fácil": "diff-facil", "Médio": "diff-medio", "Difícil": "diff-dificil" };

  // src/core/utils.js
  function uid(prefix = "id") {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return `${prefix}-${globalThis.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function nowISO() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  var SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
  function isPlainObject(value2) {
    return Boolean(value2) && typeof value2 === "object" && !Array.isArray(value2);
  }
  function isSafeId(value2) {
    return typeof value2 === "string" && SAFE_ID_PATTERN.test(value2);
  }
  function isISODate(value2) {
    if (typeof value2 !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value2)) return false;
    const [year, month, day] = value2.split("-").map(Number);
    const parsed = new Date(year, month - 1, day, 12);
    return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
  }
  function isOptionalTimestamp(value2) {
    return value2 == null || typeof value2 === "string" && Number.isFinite(Date.parse(value2));
  }
  function isFiniteNonNegative(value2) {
    return Number.isFinite(Number(value2)) && Number(value2) >= 0;
  }
  function structuredCloneSafe(value2) {
    return JSON.parse(JSON.stringify(value2));
  }
  function pluralize(count, singular, pluralForm = `${singular}s`) {
    return `${count} ${Number(count) === 1 ? singular : pluralForm}`;
  }

  // src/storage/indexed-db-provider.js
  function createIndexedDbProvider({ dbName, dbVersion, storeName, indexedDB = globalThis.indexedDB } = {}) {
    const open = () => new Promise((resolve, reject) => {
      if (!indexedDB) {
        reject(new Error("IndexedDB indisponível"));
        return;
      }
      const request = indexedDB.open(dbName, dbVersion);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = async (mode, operation) => {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode), request = operation(tx.objectStore(storeName));
        request.onsuccess = () => {
          if (mode === "readonly") resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => {
          db.close();
          if (mode !== "readonly") resolve(true);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    };
    return { get: (key) => transaction("readonly", (store) => store.get(key)), set: (key, value2) => transaction("readwrite", (store) => store.put(value2, key)), remove: (key) => transaction("readwrite", (store) => store.delete(key)) };
  }

  // src/storage/local-storage-provider.js
  function createLocalStorageProvider(storage = globalThis.localStorage) {
    return {
      get(key) {
        try {
          return storage?.getItem(key) || null;
        } catch (error) {
          return null;
        }
      },
      set(key, value2) {
        try {
          storage?.setItem(key, value2);
          return true;
        } catch (error) {
          return false;
        }
      },
      remove(key) {
        try {
          storage?.removeItem(key);
          return true;
        } catch (error) {
          return false;
        }
      }
    };
  }

  // src/storage/repository.js
  var localProvider = createLocalStorageProvider();
  function repositoryReadLocalState(key) {
    return localProvider.get(key);
  }
  function repositoryWriteLocalState(value2, key) {
    return localProvider.set(key, value2);
  }
  function serializedTimestamp(value2) {
    try {
      return Date.parse(JSON.parse(value2)?.updatedAt || 0) || 0;
    } catch (error) {
      return 0;
    }
  }
  function createStorageManager(config) {
    const indexedDb = createIndexedDbProvider(config);
    return {
      async get(key) {
        const values = [];
        try {
          const value2 = await indexedDb.get(key);
          if (value2) values.push(value2);
        } catch (error) {
          console.warn("IndexedDB indisponível", error);
        }
        if (globalThis.storage && typeof globalThis.storage.get === "function") {
          try {
            const result = await globalThis.storage.get(key, false);
            if (result?.value) values.push(result.value);
          } catch (error) {
            console.warn("window.storage indisponível", error);
          }
        }
        const localValue = repositoryReadLocalState(key);
        if (localValue) values.push(localValue);
        return values.sort((a, b) => serializedTimestamp(b) - serializedTimestamp(a))[0] || null;
      },
      async set(key, value2) {
        let success = false;
        try {
          await indexedDb.set(key, value2);
          success = true;
        } catch (error) {
          console.warn("Falha no IndexedDB", error);
        }
        if (globalThis.storage && typeof globalThis.storage.set === "function") {
          try {
            await globalThis.storage.set(key, value2, false);
            success = true;
          } catch (error) {
            console.warn("Falha no window.storage", error);
          }
        }
        if (repositoryWriteLocalState(value2, key)) success = true;
        return success;
      },
      async remove(key) {
        let success = false;
        try {
          await indexedDb.remove(key);
          success = true;
        } catch (error) {
          console.warn("Falha ao remover do IndexedDB", error);
        }
        if (globalThis.storage && typeof globalThis.storage.delete === "function") {
          try {
            await globalThis.storage.delete(key, false);
            success = true;
          } catch (error) {
            console.warn("Falha ao remover do window.storage", error);
          }
        }
        if (localProvider.remove(key)) success = true;
        return success;
      }
    };
  }

  // src/storage/storage-provider.js
  var STORAGE_PROVIDER_METHODS = Object.freeze(["get", "set", "remove", "readLocal", "writeLocal"]);
  function assertStorageProvider(provider) {
    if (!provider || STORAGE_PROVIDER_METHODS.some((method) => typeof provider[method] !== "function")) throw new TypeError("Provider de armazenamento incompleto.");
    provider.load = provider.load || provider.get.bind(provider);
    provider.save = provider.save || provider.set.bind(provider);
    provider.exportBackup = provider.exportBackup || provider.get.bind(provider);
    provider.importBackup = provider.importBackup || provider.set.bind(provider);
    return provider;
  }

  // src/storage/real-storage-provider.js
  function createRealStorageProvider({ manager, readLocal, writeLocal, removeLocal } = {}) {
    if (!manager || ["get", "set", "remove"].some((method) => typeof manager[method] !== "function")) throw new TypeError("O provider real requer um gerenciador persistente.");
    if (typeof readLocal !== "function" || typeof writeLocal !== "function") throw new TypeError("O provider real requer acesso ao armazenamento local.");
    return assertStorageProvider({
      get: (key) => manager.get(key),
      set: (key, value2) => manager.set(key, value2),
      remove: async (key) => {
        const removed = await manager.remove(key);
        if (typeof removeLocal === "function") removeLocal(key);
        return removed;
      },
      readLocal: (key) => readLocal(key),
      writeLocal: (key, value2) => writeLocal(value2, key),
      mode: "real"
    });
  }

  // src/storage/demo-storage-provider.js
  function createDemoStorageProvider({ storage, stateKey, demoKey, generate } = {}) {
    if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") throw new TypeError("O provider demo requer um armazenamento de sessão.");
    if (typeof generate !== "function") throw new TypeError("O provider demo requer um gerador de estado.");
    const keyFor = (key) => key === stateKey ? demoKey : `${demoKey}:${key}`;
    const ensureState = () => {
      let value2 = storage.getItem(demoKey);
      if (!value2) {
        value2 = JSON.stringify(generate());
        storage.setItem(demoKey, value2);
      }
      return value2;
    };
    return assertStorageProvider({
      async get(key) {
        return key === stateKey ? ensureState() : storage.getItem(keyFor(key));
      },
      async set(key, value2) {
        storage.setItem(keyFor(key), value2);
        return true;
      },
      async remove(key) {
        storage.removeItem(keyFor(key));
        return true;
      },
      readLocal(key) {
        return key === stateKey ? ensureState() : storage.getItem(keyFor(key));
      },
      writeLocal(key, value2) {
        storage.setItem(keyFor(key), value2);
        return true;
      },
      mode: "demo"
    });
  }

  // src/core/clock.js
  function asDate(value2) {
    const date2 = value2 instanceof Date ? new Date(value2.getTime()) : new Date(value2);
    if (Number.isNaN(date2.getTime())) throw new TypeError("O relógio retornou uma data inválida.");
    return date2;
  }
  function createClock({ now = () => /* @__PURE__ */ new Date() } = {}) {
    if (typeof now !== "function") throw new TypeError("O relógio precisa receber uma função now.");
    const current = () => asDate(now());
    return Object.freeze({
      now: current,
      nowISO: () => current().toISOString(),
      today: () => {
        const date2 = current();
        const year = date2.getFullYear(), month = String(date2.getMonth() + 1).padStart(2, "0"), day = String(date2.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      },
      timestamp: () => current().getTime()
    });
  }

  // src/application/create-app-context.js
  var REQUIRED_STORAGE_METHODS = ["get", "set", "remove"];
  function createAppContext({ storage, repositories = {}, clock, idGenerator } = {}) {
    if (!storage || REQUIRED_STORAGE_METHODS.some((method) => typeof storage[method] !== "function")) throw new TypeError("O contexto requer um provider de armazenamento válido.");
    if (!clock || typeof clock.today !== "function" || typeof clock.nowISO !== "function") throw new TypeError("O contexto requer um relógio válido.");
    if (typeof idGenerator !== "function") throw new TypeError("O contexto requer um gerador de IDs.");
    return Object.freeze({ storage, repositories: Object.freeze({ ...repositories }), clock, idGenerator });
  }

  // src/bootstrap/bootstrap-application.js
  async function bootstrapApplication({ context, start, onError = () => {
  } } = {}) {
    if (!context) throw new TypeError("O bootstrap requer o contexto da aplicação.");
    if (typeof start !== "function") throw new TypeError("O bootstrap requer uma função de inicialização.");
    try {
      await start(context);
      return { ok: true, context };
    } catch (error) {
      onError(error, context);
      return { ok: false, error, context };
    }
  }

  // src/bootstrap/register-lifecycle.js
  function registerApplicationLifecycle({ window: window2, onBeforeUnload, onResponsiveChange, mediaQuery = "(max-width:760px)" } = {}) {
    if (!window2) throw new TypeError("Ciclo de vida requer janela.");
    const media = window2.matchMedia(mediaQuery), beforeUnload = () => onBeforeUnload?.(), responsive = (event) => onResponsiveChange?.(event);
    window2.addEventListener("beforeunload", beforeUnload);
    media.addEventListener("change", responsive);
    return Object.freeze({ media, destroy: () => {
      window2.removeEventListener("beforeunload", beforeUnload);
      media.removeEventListener("change", responsive);
    } });
  }

  // src/domain/reviews.js
  var AGENDA_INTERVALS = [
    { dias: 1, tipo: "Revisão 24h" },
    { dias: 7, tipo: "Revisão 7 dias" },
    { dias: 30, tipo: "Revisão 30 dias" }
  ];
  var DIFFICULTY_INTERVALS = {
    "Difícil": [
      { dias: 1, tipo: "Revisão 24h" },
      { dias: 3, tipo: "Revisão 3 dias" },
      { dias: 7, tipo: "Revisão 7 dias" },
      { dias: 15, tipo: "Revisão 15 dias" }
    ],
    "Médio": [
      { dias: 1, tipo: "Revisão 24h" },
      { dias: 7, tipo: "Revisão 7 dias" },
      { dias: 30, tipo: "Revisão 30 dias" }
    ],
    "Fácil": [
      { dias: 1, tipo: "Revisão 24h" },
      { dias: 14, tipo: "Revisão 14 dias" },
      { dias: 30, tipo: "Revisão 30 dias" }
    ]
  };
  function calculateAdaptiveInterval({ baseDays, accuracy: accuracy2 = null, volume = 0, target = 70, trendKey = null, dominantErrorKey = null, reviews = 0 }) {
    const safeBase = Math.max(1, Number(baseDays) || 7);
    let factor = 1;
    const reasons = [];
    if (volume >= 10 && accuracy2 !== null) {
      if (accuracy2 < 50) {
        factor *= 0.65;
        reasons.push("acerto abaixo de 50%");
      } else if (accuracy2 < target) {
        factor *= 0.8;
        reasons.push("acerto abaixo da meta");
      } else if (accuracy2 >= target + 15) {
        factor *= 1.2;
        reasons.push("bom desempenho");
      }
    }
    if (trendKey === "down") {
      factor *= 0.8;
      reasons.push("tendência em queda");
    } else if (trendKey === "up") {
      factor *= 1.1;
      reasons.push("tendência positiva");
    }
    if (dominantErrorKey === "esqueci") {
      factor *= 0.8;
      reasons.push("esquecimento predominante");
    }
    if (dominantErrorKey === "naoSabia") {
      factor *= 0.85;
      reasons.push("lacuna de teoria");
    }
    if (reviews >= 3 && volume >= 10 && accuracy2 >= target) {
      factor *= 1.1;
      reasons.push("histórico consistente");
    }
    const upper = Math.min(60, Math.max(1, Math.floor(safeBase * 1.5)));
    const lower = Math.min(upper, Math.max(1, Math.ceil(safeBase * 0.5)));
    return {
      days: Math.max(lower, Math.min(upper, Math.round(safeBase * factor))),
      reason: reasons.length ? reasons.join(" · ") : "intervalo-base preservado"
    };
  }
  var REVIEW_RATINGS = Object.freeze({
    again: { label: "Errei", quality: 1 },
    hard: { label: "Difícil", quality: 3 },
    good: { label: "Bom", quality: 4 },
    easy: { label: "Fácil", quality: 5 }
  });
  function createAdaptiveReviewState(source = {}) {
    source = source || {};
    return {
      easinessFactor: Math.max(1.3, Number(source.easinessFactor) || 2.5),
      repetitions: Math.max(0, Math.floor(Number(source.repetitions) || 0)),
      intervalDays: Math.max(0, Math.floor(Number(source.intervalDays) || 0)),
      lastReviewDate: source.lastReviewDate || null,
      nextReviewDate: source.nextReviewDate || null,
      lastRating: REVIEW_RATINGS[source.lastRating] ? source.lastRating : null,
      algorithmVersion: Math.max(1, Number(source.algorithmVersion) || 2)
    };
  }
  function addLocalDays(iso, days) {
    const [year, month, day] = String(iso).split("-").map(Number), date2 = new Date(year, month - 1, day);
    date2.setDate(date2.getDate() + days);
    return `${date2.getFullYear()}-${String(date2.getMonth() + 1).padStart(2, "0")}-${String(date2.getDate()).padStart(2, "0")}`;
  }
  function applyAdaptiveReviewRating(source, rating, { reviewDate, algorithmVersion = 2 } = {}) {
    if (!REVIEW_RATINGS[rating]) throw new Error("Avaliação de revisão inválida.");
    const state2 = createAdaptiveReviewState(source), quality = REVIEW_RATINGS[rating].quality;
    let repetitions = state2.repetitions, intervalDays = state2.intervalDays;
    if (quality < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) intervalDays = rating === "easy" ? 4 : 1;
      else if (repetitions === 2) intervalDays = rating === "hard" ? 4 : rating === "easy" ? 8 : 6;
      else intervalDays = Math.max(1, Math.round(intervalDays * state2.easinessFactor * (rating === "hard" ? 0.8 : rating === "easy" ? 1.3 : 1)));
    }
    const easinessFactor = Math.max(1.3, state2.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    return { easinessFactor: Math.round(easinessFactor * 100) / 100, repetitions, intervalDays: Math.min(365, intervalDays), lastReviewDate: reviewDate, nextReviewDate: addLocalDays(reviewDate, Math.min(365, intervalDays)), lastRating: rating, algorithmVersion };
  }

  // src/state/strategic.js
  var DEFAULT_ALGORITHM_VERSIONS = Object.freeze({ readiness: 1, retention: 1, reviewHealth: 1, recommendations: 3, recommendationOutcomes: 1, adaptiveReview: 1, forecasts: 1 });
  var EXAM_PRIORITIES = Object.freeze(["low", "normal", "high"]);
  function normalizeTopicStrategy(topic) {
    const importance = topic.examImportance == null || topic.examImportance === "" ? NaN : Number(topic.examImportance);
    topic.examImportance = Number.isFinite(importance) ? Math.max(0, Math.min(1, importance)) : null;
    const minutes = Number(topic.estimatedStudyMinutes);
    topic.estimatedStudyMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null;
    topic.prerequisites = Array.isArray(topic.prerequisites) ? [...new Set(topic.prerequisites.filter((value2) => typeof value2 === "string" && value2 !== topic.id))] : [];
    return topic;
  }
  function normalizeExamBlueprint(value2 = {}, legacyExamDate = "") {
    const source = value2 && typeof value2 === "object" && !Array.isArray(value2) ? value2 : {};
    const target = Number(source.targetScore);
    return {
      examDate: typeof source.examDate === "string" && source.examDate ? source.examDate : legacyExamDate || null,
      targetScore: Number.isFinite(target) ? Math.max(0, Math.min(100, target)) : 80,
      configuredAt: typeof source.configuredAt === "string" ? source.configuredAt : null,
      subjects: Array.isArray(source.subjects) ? source.subjects.map((item) => ({
        subjectId: item?.subjectId || null,
        expectedQuestions: Math.max(0, Math.round(Number(item?.expectedQuestions) || 0)),
        questionWeight: Math.max(0, Number(item?.questionWeight) || 1),
        priority: EXAM_PRIORITIES.includes(item?.priority) ? item.priority : "normal"
      })) : []
    };
  }
  function normalizeAlgorithmVersions(value2 = {}) {
    const source = value2 && typeof value2 === "object" && !Array.isArray(value2) ? value2 : {};
    return Object.fromEntries(Object.entries(DEFAULT_ALGORITHM_VERSIONS).map(([key, fallback]) => [key, Math.max(1, Math.floor(Number(source[key]) || fallback))]));
  }

  // src/state/defaults.js
  function createDefaultState() {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      subjects: [{
        id: uid("subject"),
        name: "Português",
        collapsed: false,
        archived: false,
        archivedAt: null,
        createdAt: nowISO(),
        topics: [{
          id: uid("topic"),
          name: "Interpretação de Texto",
          link: "https://youtube.com",
          status: "Não iniciado",
          archived: false,
          archivedAt: null,
          notes: "",
          tags: [],
          difficulty: "Médio",
          createdAt: nowISO(),
          firstCompletedAt: null,
          lastCompletedAt: null,
          completionCount: 0,
          lastReviewedAt: null,
          reviewCount: 0,
          examImportance: null,
          estimatedStudyMinutes: null,
          prerequisites: []
        }]
      }],
      calendar: [],
      reviewAgenda: [],
      questoes: [],
      simulados: [],
      metas: {
        semanal: 5,
        mensal: 20,
        questoesSemanal: 150,
        simuladosSemanal: 1,
        metaAprovacao: 70,
        horasDiarias: 2.5,
        horasPorDia: { "0": 2.5, "1": 2.5, "2": 2.5, "3": 2.5, "4": 2.5, "5": 2.5, "6": 2.5 }
      },
      examDate: "",
      examBlueprint: { examDate: null, targetScore: 80, configuredAt: null, subjects: [] },
      algorithmVersions: { ...DEFAULT_ALGORITHM_VERSIONS },
      progressHistory: [],
      studySessions: [],
      dailyPlans: [],
      studyPlans: [],
      planAdjustments: [],
      recommendationFeedback: [],
      alertStates: [],
      activeTimer: {
        startedAt: null,
        runStartedAt: null,
        accumulatedSeconds: 0,
        isRunning: false,
        subjectId: null,
        topicId: null,
        type: "study",
        hiddenAt: null,
        planItemId: null,
        targetMinutes: null
      },
      topicHistory: [],
      achievementsUnlocked: {},
      metasPorDisciplina: [],
      lastBackupAt: null,
      updatedAt: null
    };
  }

  // src/ui/accessibility.js
  function labelDynamicControls(root = document) {
    root.querySelectorAll('input:not([type="hidden"]),select,textarea').forEach((control) => {
      const hasLabel = control.getAttribute("aria-label") || control.getAttribute("aria-labelledby") || control.closest("label") || control.id && document.querySelector(`label[for="${CSS.escape(control.id)}"]`);
      if (hasLabel) return;
      const cell = control.closest("td");
      const table = cell?.closest("table");
      const index = cell ? [...cell.parentElement.children].indexOf(cell) : -1;
      const heading = index >= 0 ? table?.querySelectorAll("thead th")?.[index]?.textContent?.trim() : "";
      const fallback = control.placeholder || { date: "Data", number: "Valor", url: "Link", search: "Busca" }[control.type] || "Campo";
      control.setAttribute("aria-label", heading || fallback);
    });
  }
  function trapModalTab(event, modals) {
    if (event.key !== "Tab") return false;
    const modal = modals.find((item) => item?.classList.contains("show"));
    if (!modal) return false;
    const selector = 'button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
    const focusable = [...modal.querySelectorAll(selector)].filter((item) => !item.hidden && item.offsetParent !== null);
    if (!focusable.length) return false;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return true;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  // src/ui/list-components.js
  function renderCollectionFooter({ total, visible, step = 0, showMoreAction = "", showAllAction = "", showLessAction = "", colspan = 1, label = "itens", variant = "table" }) {
    if (total <= visible && visible <= 0) return "";
    const shown = Math.min(total, visible);
    if (total <= shown && shown <= 0) return "";
    if (step > 0 && total <= shown && shown <= step) return "";
    const controls = `<div class="list-view-controls">
    <span class="list-view-count">Exibindo ${shown} de ${total} ${label}</span>
    ${shown < total && showMoreAction ? `<button class="btn ghost small" type="button" data-delegated-click="${showMoreAction}">Mostrar mais${step ? ` ${Math.min(step, total - shown)}` : ""}</button>` : ""}
    ${shown < total && showAllAction ? `<button class="btn ghost small" type="button" data-delegated-click="${showAllAction}">Ver todos</button>` : ""}
    ${shown > 0 && showLessAction ? `<button class="btn ghost small" type="button" data-delegated-click="${showLessAction}">Mostrar menos</button>` : ""}
  </div>`;
    return variant === "block" ? `<div class="list-summary-footer">${controls}</div>` : `<tr class="list-view-footer"><td colspan="${colspan}">${controls}</td></tr>`;
  }
  function renderGroupHeader({ title, count, tone = "neutral", expanded = true, toggleAction = "", colspan = 8 }) {
    const content = `<span class="review-group-title">${title}</span><span class="review-group-meta"><span class="count-badge">${count}</span>${toggleAction ? `<span class="review-group-chevron" aria-hidden="true">›</span>` : ""}</span>`;
    return `<tr class="review-group-row ${tone}"><td colspan="${colspan}">${toggleAction ? `<button type="button" class="review-group-header" aria-expanded="${expanded}" data-delegated-click="${toggleAction}">${content}</button>` : `<div class="review-group-header static">${content}</div>`}</td></tr>`;
  }

  // src/ui/filter-panel.js
  function countActiveFilters(filters, defaults = {}) {
    return Object.entries(filters || {}).reduce((total, [key, value2]) => {
      const baseline = Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : "";
      return total + (value2 !== baseline && value2 !== "" && value2 != null ? 1 : 0);
    }, 0);
  }
  function filterPanelLabel(count) {
    return count > 0 ? `Filtros (${count} ${count === 1 ? "ativo" : "ativos"})` : "Filtros";
  }

  // src/ui/session-history.js
  function filterStudySessions(sessions, filters, { today, addDays: addDays2, subjectIdOf }) {
    let rows = [...sessions || []];
    if (filters.date) rows = rows.filter((item) => item.date === filters.date);
    else if (filters.period !== "all") {
      const days = Math.max(1, Number(filters.period) || 30), cutoff = addDays2(today, -(days - 1));
      rows = rows.filter((item) => item.date && item.date >= cutoff && item.date <= today);
    }
    if (filters.subjectId) rows = rows.filter((item) => subjectIdOf(item) === filters.subjectId);
    if (filters.type) rows = rows.filter((item) => (item.type || "study") === filters.type);
    return rows.sort((a, b) => (b.endedAt || b.date || "").localeCompare(a.endedAt || a.date || ""));
  }
  function groupStudySessionsByDate(sessions) {
    const groups = /* @__PURE__ */ new Map();
    for (const session of sessions || []) {
      const date2 = session.date || "Sem data";
      if (!groups.has(date2)) groups.set(date2, []);
      groups.get(date2).push(session);
    }
    return [...groups.entries()];
  }

  // src/domain/analytics/evidence.js
  var CONFIDENCE_THRESHOLDS = { medium: 0.35, high: 0.7 };
  function confidenceLabel(value2) {
    const confidence = Math.max(0, Math.min(1, Number(value2) || 0));
    return confidence >= CONFIDENCE_THRESHOLDS.high ? "Alta" : confidence >= CONFIDENCE_THRESHOLDS.medium ? "Média" : "Baixa";
  }
  function createMetricEvidence({ sampleSize = 0, periodStart = null, periodEnd = null, confidence = 0, sources = [] } = {}) {
    const normalizedConfidence = Math.max(0, Math.min(1, Number(confidence) || 0));
    return {
      sampleSize: Math.max(0, Math.floor(Number(sampleSize) || 0)),
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
      confidence: normalizedConfidence,
      confidenceLabel: confidenceLabel(normalizedConfidence),
      sources: [...new Set((sources || []).filter(Boolean))]
    };
  }

  // src/domain/analytics/score-evidence.js
  var unit = (value2) => Math.max(0, Math.min(1, Number(value2) || 0));
  function describeScoreEvidence({ completeness = 0, evidenceStrength = null } = {}) {
    const coverage = unit(completeness), strength = evidenceStrength == null ? null : unit(evidenceStrength);
    return {
      completeness: coverage,
      completenessLabel: confidenceLabel(coverage),
      evidenceStrength: strength,
      evidenceLabel: strength === null ? "Não avaliada" : confidenceLabel(strength),
      uncertainty: "heuristic",
      detail: "Estimativa por regras; não representa probabilidade de aprovação."
    };
  }
  function calculateFactorScore(input = {}, weights = {}) {
    const factors = {}, missingFactors = [];
    let weighted = 0, availableWeight = 0;
    const totalWeight = Object.values(weights).reduce((sum3, value3) => sum3 + value3, 0);
    for (const [key, weight] of Object.entries(weights)) {
      const value3 = input[key];
      if (value3 == null || value3 === "" || !Number.isFinite(Number(value3))) {
        missingFactors.push(key);
        continue;
      }
      factors[key] = Math.max(0, Math.min(100, Number(value3)));
      weighted += factors[key] * weight;
      availableWeight += weight;
    }
    const value2 = availableWeight ? Math.round(weighted / availableWeight) : null;
    const exactContributions = Object.entries(factors).map(([key, score]) => ({ key, exact: score * weights[key] / availableWeight }));
    const contributionValues = exactContributions.map((item) => Math.floor(item.exact));
    let remainder = (value2 ?? 0) - contributionValues.reduce((sum3, item) => sum3 + item, 0);
    exactContributions.map((item, index) => ({ index, fraction: item.exact - Math.floor(item.exact) })).sort((a, b) => b.fraction - a.fraction || a.index - b.index).forEach((item) => {
      if (remainder > 0) {
        contributionValues[item.index]++;
        remainder--;
      }
    });
    const contributions = Object.fromEntries(exactContributions.map((item, index) => [item.key, contributionValues[index]]));
    const completeness = totalWeight ? Math.round(availableWeight / totalWeight * 100) / 100 : 0;
    return { value: value2, factors, missingFactors, contributions, completeness };
  }
  function createScoreResult({ value: value2 = null, state: state2 = null, evidence = null, confidence = null, factors = {}, reasons = [], algorithmVersion = 1, ...details } = {}) {
    const numeric3 = value2 == null || !Number.isFinite(Number(value2)) ? null : Math.max(0, Math.min(100, Math.round(Number(value2))));
    const scoreEvidence = evidence || describeScoreEvidence({ completeness: 0, evidenceStrength: confidence });
    return {
      value: numeric3,
      state: state2 || (numeric3 === null ? "empty" : "estimated"),
      evidence: scoreEvidence,
      confidence: confidence == null ? scoreEvidence.evidenceStrength : Math.max(0, Math.min(1, Number(confidence) || 0)),
      factors,
      reasons: [...new Set((reasons || []).filter(Boolean))],
      algorithmVersion: Math.max(1, Math.floor(Number(algorithmVersion) || 1)),
      ...details
    };
  }

  // src/domain/analytics/readiness-score.js
  function clampMetric(value2) {
    return Math.max(0, Math.min(100, Math.round(Number(value2) || 0)));
  }
  var READINESS_WEIGHTS = Object.freeze({ coverage: 0.3, mastery: 0.25, retention: 0.2, consistency: 0.15, simulations: 0.1 });
  function calculateReadinessScore(metrics, weights = READINESS_WEIGHTS) {
    const entries = Object.entries(weights);
    const available = entries.filter(([key]) => metrics?.[key]?.available && Number.isFinite(Number(metrics[key].score)));
    const missingFactors = entries.filter(([key]) => !available.some(([availableKey]) => availableKey === key)).map(([key]) => key);
    if (!available.length) return { value: null, confidence: 0, confidenceLabel: "Baixa", state: "empty", factors: Object.fromEntries(entries.map(([key]) => [key, null])), missingFactors, availableFactors: [], evidence: describeScoreEvidence(), reasons: ["sem fatores disponíveis"], algorithmVersion: 1 };
    const availableWeight = available.reduce((sum3, [, weight]) => sum3 + weight, 0);
    const value2 = clampMetric(available.reduce((sum3, [key, weight]) => sum3 + Number(metrics[key].score) * weight, 0) / availableWeight);
    const evidenceConfidence = available.reduce((sum3, [key, weight]) => sum3 + (Number(metrics[key].confidence) || 0) * weight, 0) / availableWeight;
    const coverageFactor = available.length / entries.length;
    const confidence = Math.max(0, Math.min(1, evidenceConfidence * (0.55 + 0.45 * coverageFactor)));
    return {
      value: value2,
      confidence,
      confidenceLabel: confidence >= 0.7 ? "Alta" : confidence >= 0.35 ? "Média" : "Baixa",
      state: available.length < 2 ? "insufficient" : "estimated",
      factors: Object.fromEntries(entries.map(([key]) => [key, metrics?.[key]?.available ? Number(metrics[key].score) : null])),
      missingFactors,
      availableFactors: available.map(([key]) => key),
      evidence: describeScoreEvidence({ completeness: availableWeight / entries.reduce((sum3, [, weight]) => sum3 + weight, 0), evidenceStrength: evidenceConfidence }),
      reasons: missingFactors.length ? [missingFactors.length + " fator(es) aguardando dados"] : ["todos os fatores disponíveis"],
      algorithmVersion: 1
    };
  }

  // src/domain/analytics/coverage.js
  function calculateTopicCoverage(topics = []) {
    const active = topics.filter((topic) => !topic.archived);
    if (!active.length) return { value: 0, completed: 0, total: 0, available: false };
    const completed = active.filter((topic) => topic.status === "Concluído").length;
    return { value: Math.round(completed / active.length * 100), completed, total: active.length, available: true };
  }

  // src/domain/analytics/consistency.js
  function calculateActivityStreak(activityDates, { today, addDays: addDays2 }) {
    let cursor = today;
    if (!activityDates.has(cursor)) {
      cursor = addDays2(cursor, -1);
      if (!activityDates.has(cursor)) return 0;
    }
    let count = 0;
    while (activityDates.has(cursor)) {
      count++;
      cursor = addDays2(cursor, -1);
    }
    return count;
  }
  function calculateGoalConsistency(days = []) {
    const applicable = days.filter((day) => Number(day.targetSeconds) > 0);
    const achieved = applicable.filter((day) => Number(day.studiedSeconds) >= Number(day.targetSeconds)).length;
    const studiedDays = days.filter((day) => Number(day.studiedSeconds) > 0).length;
    return { value: applicable.length ? achieved / applicable.length * 100 : null, achieved, applicable: applicable.length, studiedDays, available: applicable.length > 0 && studiedDays > 0 };
  }

  // src/domain/analytics/trends.js
  var TREND_ALGORITHM_VERSION = 2;
  var clamp = (value2) => Math.max(0, Math.min(100, value2));
  var round = (value2) => Math.round(value2 * 10) / 10;
  var pool = (data) => data.reduce((acc, week) => ({ resolved: acc.resolved + (Number(week.resolved) || 0), correct: acc.correct + (Number(week.correct) || 0) }), { resolved: 0, correct: 0 });
  var accuracy = (data) => data.resolved ? round(data.correct / data.resolved * 100) : null;
  function classification(delta) {
    if (delta >= 12) return { state: "strong_up", key: "up", direction: "up", icon: "↗", label: "Forte evolução" };
    if (delta >= 3) return { state: "up", key: "up", direction: "up", icon: "↗", label: "Em evolução" };
    if (delta <= -12) return { state: "strong_down", key: "down", direction: "down", icon: "↘", label: "Forte queda" };
    if (delta <= -3) return { state: "down", key: "down", direction: "down", icon: "↘", label: "Em queda" };
    return { state: "stable", key: "stable", direction: "stable", icon: "→", label: "Estável" };
  }
  function calculateWindowTrend(weeklyData = [], minWindow = 30, windowWeeks = 4) {
    const weeks = Array.isArray(weeklyData) ? weeklyData : [], recent = pool(weeks.slice(-windowWeeks)), previous = pool(weeks.slice(-(windowWeeks * 2), -windowWeeks)), recentAccuracy = accuracy(recent), previousAccuracy = accuracy(previous), sampleSize = recent.resolved + previous.resolved, confidence = round(Math.min(1, Math.min(recent.resolved, previous.resolved) / minWindow));
    const evidence = { sampleSize, windowWeeks, confidence, minimumPerPeriod: minWindow, sources: ["questions"] }, periods = { previous, recent, windowWeeks };
    if (recent.resolved < minWindow || previous.resolved < minWindow) return { value: null, state: "insufficient", key: "insufficient", direction: "none", icon: "—", label: "Amostra insuficiente", delta: null, recent, previous, recentAccuracy, previousAccuracy, periods, evidence, confidence, factors: { recentAccuracy, previousAccuracy }, reasons: ["Cada período precisa atingir a amostra mínima"], algorithmVersion: TREND_ALGORITHM_VERSION };
    const delta = round(recentAccuracy - previousAccuracy), kind = classification(delta);
    return { ...kind, value: round(clamp(50 + delta * 2)), delta, recent, previous, recentAccuracy, previousAccuracy, periods, evidence, confidence, factors: { recentAccuracy, previousAccuracy }, reasons: [kind.label], algorithmVersion: TREND_ALGORITHM_VERSION };
  }

  // src/domain/analytics/study-metrics.js
  function summarizeStudyRecords({ sessions = [], questions = [], simulations = [] }) {
    const seconds = sessions.reduce((sum3, item) => sum3 + (Number(item.durationSeconds) || 0), 0);
    const sessionQuestions = sessions.reduce((sum3, item) => sum3 + (Number(item.questionsResolved) || 0), 0);
    const sessionCorrect = sessions.reduce((sum3, item) => sum3 + (Number(item.correctAnswers) || 0), 0);
    const resolved = sessionQuestions + questions.reduce((sum3, item) => sum3 + (Number(item.resolved) || 0), 0);
    const correct = sessionCorrect + questions.reduce((sum3, item) => sum3 + (Number(item.correct) || 0), 0);
    return { seconds, questions: resolved, correct, accuracy: resolved ? Math.round(correct / resolved * 100) : null, simulations: simulations.length };
  }

  // src/application/build-executive-summary.js
  function buildExecutiveSummary({ readiness, daysToExam = null, pace = {}, topPriority = null, riskCount = 0, weeklyGoal = {}, opportunityCount = 0 } = {}) {
    const readinessValue = readiness?.value;
    const general = readinessValue == null ? { value: "—", label: "Aguardando dados", detail: "Registre atividades para calcular a prontidão." } : { value: `${readinessValue}/100`, label: `Confiança ${String(readiness.confidenceLabel || "baixa").toLowerCase()}`, detail: `${readiness.availableFactors?.length || 0} de 5 fatores disponíveis` };
    const exam = daysToExam === null ? { value: "—", label: "Data da prova não definida", detail: "Configure a prova para avaliar o prazo." } : { value: String(Math.max(0, daysToExam)), label: daysToExam === 1 ? "dia até a prova" : "dias até a prova", detail: daysToExam < 0 ? "A data informada já passou." : "" };
    const paceCard = pace.status === "ok" ? { value: String(pace.remaining), label: "tópicos restantes", detail: pace.comparativo === "atrasado" ? "Ritmo abaixo do necessário" : pace.comparativo === "no-prazo" ? "Ritmo compatível com o prazo" : "Prazo ainda não comparado" } : { value: pace.remaining == null ? "—" : String(pace.remaining), label: pace.status === "completo" ? "Plano concluído" : "Ritmo aguardando dados", detail: "Conclua tópicos para formar uma tendência." };
    const achieved = Number(weeklyGoal.achieved) || 0, target = Number(weeklyGoal.target) || 0;
    const weekly = { value: target ? `${Math.round(achieved / target * 100)}%` : "—", label: "meta semanal", detail: target ? `${achieved} de ${target} tópicos` : "Meta não configurada" };
    return {
      cards: [general, exam, paceCard, weekly],
      primaryAction: topPriority ? { title: topPriority.recommendedAction, subject: topPriority.subjectName, topic: topPriority.topicName, duration: topPriority.estimatedMinutes, reason: topPriority.reason || "Prioridade calculada com os dados atuais" } : null,
      riskCount: Math.max(0, Number(riskCount) || 0),
      opportunityCount: Math.max(0, Number(opportunityCount) || 0),
      opportunityMessage: opportunityCount > 0 ? `${opportunityCount} oportunidade${opportunityCount === 1 ? "" : "s"} com importância de prova configurada.` : "Ainda não há dados suficientes para identificar oportunidades. Configure os pesos da prova e registre questões."
    };
  }

  // src/domain/diagnostics/cognitive-profile.js
  var COGNITIVE_CONFIDENCE_LIMITS = Object.freeze({ low: 20, medium: 40, high: 80 });
  function cognitiveConfidence(categorizedErrors, limits = COGNITIVE_CONFIDENCE_LIMITS) {
    const count = Math.max(0, Number(categorizedErrors) || 0);
    if (count < limits.low) return { key: "insufficient", label: "Insuficiente" };
    if (count < limits.medium) return { key: "low", label: "Baixa" };
    if (count < limits.high) return { key: "medium", label: "Média" };
    return { key: "high", label: "Alta" };
  }
  function buildCognitiveProfile(records = [], categoryKeys = []) {
    const categories = Object.fromEntries(categoryKeys.map((key) => [key, 0]));
    let totalErrors = 0;
    const dates = [];
    for (const record of records) {
      const errors = Math.max(0, (Number(record.resolved) || 0) - (Number(record.correct) || 0));
      totalErrors += errors;
      if (record.date) dates.push(record.date);
      let remaining = errors;
      for (const key of categoryKeys) {
        const value2 = Math.max(0, Math.floor(Number(record.errorBreakdown?.[key]) || 0)), accepted = Math.min(value2, remaining);
        categories[key] += accepted;
        remaining -= accepted;
      }
    }
    const categorizedErrors = Object.values(categories).reduce((sum3, value2) => sum3 + value2, 0), orderedDates = dates.sort();
    return { categories, totalErrors, categorizedErrors, uncategorized: Math.max(0, totalErrors - categorizedErrors), coverage: totalErrors ? Math.round(categorizedErrors / totalErrors * 100) : 0, confidence: cognitiveConfidence(categorizedErrors), sampleSize: records.length, periodStart: orderedDates[0] || null, periodEnd: orderedDates[orderedDates.length - 1] || null };
  }

  // src/domain/analytics/heatmap.js
  var HEATMAP_METRICS = Object.freeze(["hours", "questions", "reviews", "simulations"]);
  function heatmapMetricValue(summary, metric) {
    if (metric === "questions") return Number(summary.questions) || 0;
    if (metric === "reviews") return Number(summary.reviews) || 0;
    if (metric === "simulations") return Number(summary.simulations) || 0;
    return Number(summary.seconds) || 0;
  }
  function heatmapMetricLevel(summary, metric) {
    const value2 = heatmapMetricValue(summary, metric);
    if (value2 <= 0) return 0;
    if (metric === "hours") {
      if (summary.targetSeconds > 0) return summary.goalPct < 50 ? 1 : summary.goalPct < 100 ? 2 : 3;
      return value2 < 3600 ? 1 : value2 < 7200 ? 2 : 3;
    }
    const limits = metric === "questions" ? [20, 50] : metric === "reviews" ? [1, 2] : [1, 2];
    return value2 <= limits[0] ? 1 : value2 <= limits[1] ? 2 : 3;
  }

  // src/domain/analytics/multidimensional-radar.js
  var clamp2 = (value2) => Math.max(0, Math.min(100, Math.round(Number(value2) || 0)));
  function calculateSubjectRadar(input = {}) {
    const axes = {
      coverage: Number.isFinite(input.coverage) ? clamp2(input.coverage) : null,
      mastery: Number.isFinite(input.mastery) ? clamp2(input.mastery) : null,
      retention: Number.isFinite(input.retention) ? clamp2(input.retention) : null,
      frequency: Number.isFinite(input.daysSinceContact) ? clamp2(100 - input.daysSinceContact * 5) : null,
      consistency: Number.isFinite(input.activeDays) ? clamp2(input.activeDays / 16 * 100) : null
    };
    const available = Object.values(axes).filter((value2) => value2 !== null);
    const confidence = available.length / 5;
    return { axes, availableAxes: available.length, confidence, confidenceLabel: confidence >= 0.8 ? "Alta" : confidence >= 0.4 ? "Média" : "Baixa", interpretation: interpretRadar(axes) };
  }
  function interpretRadar(axes) {
    if (axes.coverage !== null && axes.coverage >= 70 && axes.retention !== null && axes.retention < 50) return "Cobertura alta, mas retenção baixa: reforce as revisões.";
    if (axes.mastery !== null && axes.mastery >= 70 && axes.frequency !== null && axes.frequency < 50) return "Domínio alto, mas pouco contato recente: programe manutenção.";
    const values = Object.entries(axes).filter(([, value2]) => value2 !== null);
    if (values.length < 2) return "Aguardando mais dados para interpretar o perfil.";
    const weakest = values.sort((a, b) => a[1] - b[1])[0];
    const labels = { coverage: "cobertura", mastery: "domínio", retention: "retenção", frequency: "frequência", consistency: "consistência" };
    return `Principal ponto de atenção: ${labels[weakest[0]]} (${weakest[1]}/100).`;
  }

  // src/application/generate-diagnosis.js
  var clamp3 = (value2) => Math.max(0, Math.min(100, Number(value2) || 0));
  function generateDiagnosis(candidates = []) {
    const valid = candidates.filter((item) => item && !item.archived);
    const bottlenecks = valid.map((item) => {
      const factors = [
        ["Domínio", item.mastery == null ? null : 100 - clamp3(item.mastery)],
        ["Retenção", item.retention == null ? null : 100 - clamp3(item.retention)],
        ["Cobertura", item.coverage == null ? null : 100 - clamp3(item.coverage)],
        ["Frequência", item.frequency == null ? null : 100 - clamp3(item.frequency)],
        ["Tendência", item.trendRisk == null ? null : clamp3(item.trendRisk)]
      ].filter(([, value2]) => value2 != null);
      const strongest = factors.sort((a, b) => b[1] - a[1])[0];
      return strongest ? { ...item, severity: item.risk?.value ?? Math.round(strongest[1]), factor: strongest[0], reason: `${strongest[0]} requer atenção` } : null;
    }).filter(Boolean).filter((item) => item.severity >= 35).sort((a, b) => b.severity - a.severity);
    const opportunityWeights = { examImpact: 0.4, improvementPotential: 0.35, effortEfficiency: 0.25 };
    const opportunities = valid.map((item) => {
      let weighted = 0, availableWeight = 0;
      const factors = {}, missingFactors = [];
      Object.entries(opportunityWeights).forEach(([key, weight]) => {
        if (item[key] == null) {
          missingFactors.push(key);
          return;
        }
        factors[key] = clamp3(item[key]);
        weighted += factors[key] * weight;
        availableWeight += weight;
      });
      const opportunityScore = availableWeight ? Math.round(weighted / availableWeight) : null;
      const confidence = Math.round(availableWeight * 100) / 100;
      return { ...item, opportunityScore, opportunityFactors: factors, missingFactors, confidence, confidenceLabel: confidence >= 0.8 ? "Alta" : confidence >= 0.5 ? "Média" : "Baixa" };
    }).filter((item) => item.opportunityScore != null && item.opportunityScore >= 30).sort((a, b) => b.opportunityScore - a.opportunityScore);
    const criticalReviews = valid.filter((item) => item.reviewUrgency > 0).sort((a, b) => b.reviewUrgency - a.reviewUrgency);
    const topicsAtRisk = valid.filter((item) => item.retention != null && item.retention < 60 || (item.daysSinceContact || 0) >= 10).sort((a, b) => (b.daysSinceContact || 0) - (a.daysSinceContact || 0));
    const subjectScores = /* @__PURE__ */ new Map();
    opportunities.forEach((item) => subjectScores.set(item.subjectName, (subjectScores.get(item.subjectName) || 0) + item.opportunityScore));
    const total = [...subjectScores.values()].reduce((sum3, value2) => sum3 + value2, 0);
    const weeklyFocus = [...subjectScores].map(([subjectName, value2]) => ({ subjectName, percentage: total ? Math.round(value2 / total * 100) : 0 })).sort((a, b) => b.percentage - a.percentage).slice(0, 4);
    return { bottlenecks, opportunities, criticalReviews, topicsAtRisk, weeklyFocus, state: valid.length ? "estimated" : "insufficient" };
  }

  // src/domain/analytics/priority-score.js
  var PRIORITY_ALGORITHM_VERSION = 3;
  var PRIORITY_WEIGHTS = Object.freeze({ examImpact: 0.25, retentionRisk: 0.2, masteryGap: 0.2, reviewUrgency: 0.1, reviewHealthRisk: 0.1, planAlignment: 0.075, recencyRisk: 0.075 });
  function calculatePriorityScore(candidate = {}) {
    const result = calculateFactorScore({ ...candidate, retentionRisk: candidate.retentionRisk ?? candidate.retentionNeed }, PRIORITY_WEIGHTS);
    const reasons = [];
    if (result.factors.reviewUrgency >= 40) reasons.push("revisão atrasada ou prevista para agora");
    if (result.factors.reviewHealthRisk >= 40) reasons.push("saúde da revisão requer atenção");
    if (result.factors.retentionRisk >= 40) reasons.push("retenção estimada pede reforço");
    if (result.factors.masteryGap >= 40) reasons.push("há margem relevante para melhorar o domínio");
    if (result.factors.examImpact >= 60) reasons.push("alto impacto configurado na prova");
    if (result.factors.recencyRisk >= 40) reasons.push("tempo elevado sem contato");
    const evidence = describeScoreEvidence({ completeness: result.completeness, evidenceStrength: candidate.evidenceStrength ?? result.completeness });
    const finalReasons = reasons.length ? reasons : ["prioridade calculada pelos fatores disponíveis"];
    return {
      ...result,
      ...createScoreResult({
        value: result.value,
        state: result.value === null ? "empty" : result.completeness < 0.5 ? "insufficient" : "estimated",
        evidence,
        confidence: evidence.evidenceStrength,
        factors: result.factors,
        reasons: finalReasons,
        algorithmVersion: PRIORITY_ALGORITHM_VERSION
      }),
      score: result.value ?? 0,
      confidenceLabel: evidence.evidenceLabel
    };
  }

  // src/domain/study-eligibility.js
  var MIN_SESSION_MINUTES = 15;
  function needsMaintenance(item) {
    return item.masteryGap != null && item.masteryGap > 40 || (item.retentionRisk ?? item.retentionNeed) != null && (item.retentionRisk ?? item.retentionNeed) > 40 || item.reviewHealthRisk != null && item.reviewHealthRisk > 40 || item.reviewUrgency >= 40;
  }
  function canStudy(item, { ignoreToday = false } = {}) {
    return Boolean(item && !item.archived && !item.blockedPrerequisites?.length && (ignoreToday || !item.completed) && (!item.covered || needsMaintenance(item)));
  }
  function sessionMinutes(item, availableMinutes) {
    const available = Math.floor(Number(availableMinutes) || 0);
    if (available < MIN_SESSION_MINUTES) return 0;
    const desired = Number(item.sessionMinutes ?? item.estimatedMinutes) || 30;
    return Math.min(available, 60, Math.max(MIN_SESSION_MINUTES, Math.round(desired)));
  }
  function prerequisiteBlockers(topic, topics = []) {
    const byId = new Map(topics.map((item) => [item.id, item]));
    const blockers = /* @__PURE__ */ new Set();
    const visit = (id, path) => {
      if (path.has(id)) {
        blockers.add(id);
        return;
      }
      const base = byId.get(id);
      if (!base || base.archived) {
        blockers.add(id);
        return;
      }
      const known = base.mastery != null && Number.isFinite(Number(base.mastery));
      if (known ? base.mastery < 60 : !(base.covered || base.status === "Concluído")) blockers.add(id);
      const next = new Set(path);
      next.add(id);
      for (const parent of base.prerequisites || []) visit(parent, next);
    };
    for (const id of topic.prerequisites || []) visit(id, /* @__PURE__ */ new Set([topic.id]));
    return [...blockers];
  }
  function withPrerequisiteEligibility(candidates, topics = candidates) {
    return candidates.map((item) => ({ ...item, blockedPrerequisites: prerequisiteBlockers(item, topics) }));
  }
  function resolveStudyEligibility(candidates, topics) {
    return candidates.filter(Boolean).map((item) => ({ ...item, blockedPrerequisites: topics ? prerequisiteBlockers(item, topics) : item.blockedPrerequisites ?? prerequisiteBlockers(item, candidates.filter(Boolean)) }));
  }

  // src/application/recommend-study.js
  function recommendStudy(candidates = [], options = {}) {
    const availableMinutes = Math.max(0, Number(options.availableMinutes) || 0);
    const excluded = new Set(options.excludedIds || []);
    const eligible = resolveStudyEligibility(candidates, options.topics);
    return eligible.filter((item) => canStudy(item) && !excluded.has(item.id)).map((item) => ({ ...item, ...calculatePriorityScore(item), estimatedMinutes: sessionMinutes(item, availableMinutes) })).filter((item) => item.estimatedMinutes > 0 && Object.keys(item.factors).length).sort((a, b) => b.score - a.score || a.estimatedMinutes - b.estimatedMinutes || String(a.id).localeCompare(String(b.id)));
  }

  // src/domain/diagnostics/risk-score.js
  var RISK_ALGORITHM_VERSION = 1;
  var RISK_WEIGHTS = Object.freeze({ masteryRisk: 0.25, retentionRisk: 0.25, trendRisk: 0.15, recencyRisk: 0.15, examImpact: 0.15, examProximity: 0.05 });
  function calculateRiskScore(factors = {}, weights = RISK_WEIGHTS, { evidenceStrength = null } = {}) {
    const result = calculateFactorScore(factors, weights);
    const evidence = describeScoreEvidence({ completeness: result.completeness, evidenceStrength: evidenceStrength ?? result.completeness });
    const value2 = result.value;
    const reasons = Object.entries(result.contributions).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key]) => key);
    return {
      ...result,
      ...createScoreResult({
        value: value2,
        state: value2 === null ? "empty" : "estimated",
        evidence,
        confidence: evidence.evidenceStrength,
        factors: result.factors,
        reasons,
        algorithmVersion: RISK_ALGORITHM_VERSION
      }),
      level: value2 === null ? "insufficient" : value2 >= 70 ? "high" : value2 >= 40 ? "medium" : "low",
      completeness: result.completeness,
      confidenceLabel: evidence.evidenceLabel
    };
  }

  // src/application/build-study-candidates.js
  function buildStudyCandidates({ priorities = [], topics = [], retentions = {}, reviewHealths = {}, blueprint = [], sessions = [], today, examProximity = null } = {}) {
    const catalog = new Map(topics.map((topic) => [topic.id, topic]));
    const candidates = priorities.map((priority) => {
      const topic = catalog.get(priority.topicId), diagnosis = priority.diagnosis;
      const retention = retentions[priority.topicId];
      const reviewHealth = reviewHealths[priority.topicId];
      const exam = blueprint.find((item) => item.subjectId === priority.subjectId);
      const examImpact = topic?.examImportance != null ? topic.examImportance * 100 : exam ? Math.min(100, (Number(exam.expectedQuestions) || 0) * 4 * (Number(exam.questionWeight) || 1)) : null;
      const mastery = diagnosis?.mastery?.confidence > 0 ? diagnosis.mastery.score : null;
      const daysSinceContact = diagnosis?.lastActivity ? Math.max(0, Number(priority.diasSemEstudar) || 0) : null;
      const covered = topic?.status === "Concluído";
      const reviewUrgency = priority.tipo === "revisão" ? Math.min(100, 40 + Math.max(0, Number(priority.diasAtrasado) || 0) * 12) : 0;
      const sessionMinutes2 = Math.max(15, Math.min(60, Number(priority.estimatedMinutes) || 30));
      const trend = diagnosis?.trend;
      const trendRisk = !trend || trend.key === "insufficient" ? null : trend.key === "down" ? Math.min(100, 40 + Math.abs(trend.delta || 0) * 6) : 0;
      const evidenceStrength = ((diagnosis?.mastery?.confidence || 0) + (retention?.confidence || 0)) / 2;
      const recencyRisk = daysSinceContact === null ? null : Math.min(100, daysSinceContact * 5);
      const retentionRisk = retention?.available ? 100 - retention.score : null;
      const reviewHealthRisk = reviewHealth?.value == null ? null : 100 - reviewHealth.value;
      const masteryGap = mastery === null ? null : 100 - mastery;
      const studiedMinutes = sessions.filter((session) => session.topicId === priority.topicId && session.date <= today && session.type === "study").reduce((sum3, session) => sum3 + Math.max(0, Number(session.durationSeconds) || 0) / 60, 0);
      const remainingMinutes = topic?.estimatedStudyMinutes == null ? null : Math.max(0, Math.ceil(topic.estimatedStudyMinutes - studiedMinutes));
      const risk = calculateRiskScore({ masteryRisk: masteryGap, retentionRisk, trendRisk, recencyRisk, examImpact, examProximity }, void 0, { evidenceStrength });
      const candidate = {
        ...priority,
        id: priority.topicId || priority.id,
        archived: Boolean(topic?.topicArchived || topic?.subjectArchived || topic?.archived),
        covered,
        completed: sessions.some((session) => session.date === today && session.topicId === priority.topicId && (!priority.topicId ? session.subjectId === priority.subjectId : true) && Number(session.durationSeconds) > 0),
        prerequisites: topic?.prerequisites || [],
        remainingMinutes,
        totalEstimatedMinutes: topic?.estimatedStudyMinutes ?? null,
        estimatedMinutes: sessionMinutes2,
        sessionMinutes: sessionMinutes2,
        action: priority.recommendedAction,
        risk,
        examImpact,
        mastery,
        masteryGap,
        retention: retention?.available ? retention.score : null,
        retentionRisk,
        retentionNeed: retentionRisk,
        reviewHealth,
        reviewHealthRisk,
        reviewUrgency,
        coverage: covered ? 100 : topic?.status === "Em andamento" ? 50 : 0,
        frequency: daysSinceContact === null ? null : Math.max(0, 100 - daysSinceContact * 5),
        daysSinceContact,
        recencyRisk,
        planAlignment: priority.tipo === "continuar" ? 90 : priority.tipo === "revisão" ? 80 : 55,
        trendRisk,
        improvementPotential: masteryGap,
        effortEfficiency: Math.max(10, 100 - sessionMinutes2),
        evidenceStrength
      };
      return { ...candidate, ...calculatePriorityScore(candidate) };
    });
    const prerequisites = topics.map((topic) => ({ ...topic, covered: topic.status === "Concluído", archived: topic.archived || topic.topicArchived || topic.subjectArchived, mastery: candidates.find((item) => item.topicId === topic.id)?.mastery ?? null }));
    return withPrerequisiteEligibility(candidates, prerequisites);
  }

  // src/domain/analytics/topic-metrics.js
  var clamp4 = (value2) => Math.max(0, Math.min(100, Math.round(Number(value2) || 0)));
  function calculateTopicMastery({ topic = {}, performance = { resolved: 0, accuracy: null }, trend = { key: "insufficient" }, reviews = [], recentSessions = [], periodStart = null, periodEnd = null } = {}) {
    const questionConfidence = Math.min(1, performance.resolved / 50);
    const performanceScore = performance.accuracy === null ? 0 : performance.accuracy * questionConfidence + 40 * (1 - questionConfidence);
    let trendScore = 50;
    if (trend.key === "up") trendScore = Math.min(100, 70 + Math.max(0, trend.delta || 0) * 2);
    else if (trend.key === "down") trendScore = Math.max(0, 40 - Math.abs(trend.delta || 0) * 2);
    else if (trend.key === "stable") trendScore = 60;
    const completedReviews = reviews.filter((review) => review.status === "Concluído").length;
    const reviewScore = reviews.length ? completedReviews / reviews.length * 100 : topic.status === "Concluído" ? 50 : 20;
    const recentSeconds = recentSessions.reduce((sum3, item) => sum3 + (Number(item.durationSeconds) || 0), 0);
    const studyScore = Math.min(100, recentSeconds / 7200 * 100);
    const confidence = Math.min(1, questionConfidence * 0.6 + Math.min(1, reviews.length / 4) * 0.2 + Math.min(1, recentSessions.length / 4) * 0.2);
    const available = performance.resolved > 0 || reviews.length > 0 || recentSeconds > 0;
    const score = available ? clamp4(performanceScore * 0.4 + trendScore * 0.2 + reviewScore * 0.15 + studyScore * 0.15 + confidence * 10) : 0;
    const classification2 = !available ? "Sem dados" : score >= 80 ? "Dominado" : score >= 60 ? "Em consolidação" : score >= 40 ? "Em desenvolvimento" : "Inicial";
    const completeness = [performance.resolved > 0, trend.key !== "insufficient", reviews.length > 0, recentSeconds > 0].filter(Boolean).length / 4;
    return {
      value: available ? score : null,
      state: available ? "estimated" : "empty",
      score,
      available,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      classification: classification2,
      performanceScore,
      trendScore,
      reviewScore,
      studyScore,
      trend,
      factors: { performance: performanceScore, trend: trendScore, reviews: reviewScore, study: studyScore },
      reasons: available ? [classification2] : ["sem evidências do tópico"],
      algorithmVersion: 1,
      evidence: { ...createMetricEvidence({ sampleSize: performance.resolved, periodStart, periodEnd, confidence, sources: [performance.resolved ? "questions" : null, reviews.length ? "reviews" : null, recentSeconds ? "sessions" : null] }), ...describeScoreEvidence({ completeness, evidenceStrength: confidence }) }
    };
  }
  function calculateTopicRetention({ due = [], resolved = 0, correct = 0, lastReview = null, daysSince = null, onTime = 0, periodStart = null, periodEnd = null } = {}) {
    const reviewRate = due.length ? onTime / due.length * 100 : 50;
    const accuracy2 = resolved ? correct / resolved * 100 : 50;
    const recency = daysSince === null ? 50 : Math.max(0, 100 - Math.max(0, daysSince - 1) * 2.7);
    const confidence = Math.min(1, Math.min(1, due.length / 4) * 0.4 + Math.min(1, resolved / 50) * 0.4 + (lastReview ? 1 : 0) * 0.2);
    const available = Boolean(due.length || resolved || lastReview);
    const completeness = [due.length > 0, resolved > 0, Boolean(lastReview)].filter(Boolean).length / 3;
    const evidence = { ...createMetricEvidence({ sampleSize: resolved, periodStart, periodEnd, confidence, sources: [due.length ? "reviews" : null, resolved ? "questions" : null] }), ...describeScoreEvidence({ completeness, evidenceStrength: confidence }) };
    if (!available) return { value: null, state: "empty", score: 0, raw: null, confidence: 0, confidenceLabel: "Baixa", available: false, detail: "Sem revisões ou questões vinculadas", evidence, factors: {}, reasons: ["sem revisões ou questões vinculadas"], algorithmVersion: 1 };
    const raw = reviewRate * 0.45 + accuracy2 * 0.35 + recency * 0.2, score = clamp4(50 + (raw - 50) * (0.35 + confidence * 0.65));
    const detail = (due.length ? onTime + " de " + due.length + " revisões no prazo" : "sem revisões vencidas") + " · " + (resolved ? Math.round(accuracy2) + "% em " + resolved + " questões recentes" : "sem questões recentes") + " · " + (daysSince === null ? "sem revisão registrada" : daysSince + "d desde a última revisão");
    return {
      value: score,
      state: completeness < 0.5 ? "insufficient" : "estimated",
      score,
      raw,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      available: true,
      detail,
      evidence,
      factors: { reviewRate, accuracy: accuracy2, recency },
      reasons: [detail],
      algorithmVersion: 1
    };
  }

  // src/domain/analytics/review-health.js
  var REVIEW_HEALTH_ALGORITHM_VERSION = 1;
  var REVIEW_HEALTH_WEIGHTS = Object.freeze({ recency: 0.25, retention: 0.3, mastery: 0.25, recentPerformance: 0.15, examResilience: 0.05 });
  var clamp5 = (value2) => Math.max(0, Math.min(100, Number(value2) || 0));
  function calculateReviewHealth({ daysSinceReview = null, hasPriorStudy = false, retention = null, mastery = null, recentPerformance = null, examImpact = null, evidenceStrength = null } = {}) {
    const knowledge = [retention, mastery, recentPerformance].filter((value2) => value2 != null && Number.isFinite(Number(value2)));
    const knowledgeFloor = knowledge.length ? Math.min(...knowledge.map(clamp5)) : null;
    const factors = {
      recency: daysSinceReview == null ? hasPriorStudy ? 0 : null : clamp5(100 - Math.max(0, Number(daysSinceReview)) * 4),
      retention,
      mastery,
      recentPerformance,
      examResilience: examImpact == null || knowledgeFloor == null ? null : clamp5(100 - clamp5(examImpact) * (100 - knowledgeFloor) / 100)
    };
    const scored = calculateFactorScore(factors, REVIEW_HEALTH_WEIGHTS);
    const reasons = [];
    if (daysSinceReview == null && hasPriorStudy) reasons.push("nenhuma revisão registrada");
    else if (factors.recency != null && factors.recency < 60) reasons.push("muito tempo desde a última revisão");
    if (factors.retention != null && factors.retention < 60) reasons.push("retenção pede reforço");
    if (factors.mastery != null && factors.mastery < 60) reasons.push("domínio ainda frágil");
    if (factors.recentPerformance != null && factors.recentPerformance < 60) reasons.push("desempenho recente abaixo do esperado");
    if (factors.examResilience != null && factors.examResilience < 60) reasons.push("fragilidade relevante para a prova");
    const strength = evidenceStrength == null ? scored.completeness : Math.max(0, Math.min(1, Number(evidenceStrength) || 0));
    const evidence = describeScoreEvidence({ completeness: scored.completeness, evidenceStrength: strength });
    return createScoreResult({
      value: scored.value,
      state: scored.value === null ? "empty" : scored.completeness < 0.5 ? "insufficient" : "estimated",
      evidence,
      confidence: strength,
      factors: scored.factors,
      reasons: reasons.length ? reasons : ["revisão em condição estável"],
      algorithmVersion: REVIEW_HEALTH_ALGORITHM_VERSION,
      missingFactors: scored.missingFactors,
      contributions: scored.contributions,
      level: scored.value === null ? "unknown" : scored.value >= 70 ? "healthy" : scored.value >= 45 ? "attention" : "critical"
    });
  }

  // src/application/recommendations/recommendation-feedback.js
  var asBoolean = (value2) => value2 === true;
  function createRecommendationPresentation(recommendation, { id, shownAt, algorithmVersion = 1 } = {}) {
    if (!recommendation || !id || !shownAt) throw new Error("Recomendação, identidade e instante são obrigatórios.");
    return { ...recommendation, recommendationId: id, shownAt, algorithmVersion };
  }
  function recordRecommendationDecision(feedbackList, recommendation, { accepted, reasonSkipped = null, baseline = null, snapshot = null, now, idGenerator } = {}) {
    const existing = feedbackList.find((item) => item.recommendationId === recommendation.recommendationId);
    if (existing) return existing;
    const feedback = {
      id: idGenerator("recommendation-feedback"),
      recommendationId: recommendation.recommendationId,
      date: String(recommendation.shownAt).slice(0, 10),
      subjectId: recommendation.subjectId || null,
      topicId: recommendation.topicId || null,
      accepted: asBoolean(accepted),
      completed: false,
      useful: null,
      reasonSkipped,
      resultingSessionId: null,
      score: Number(recommendation.score) || 0,
      confidence: Number.isFinite(Number(recommendation.confidence)) ? Number(recommendation.confidence) : null,
      confidenceLabel: recommendation.confidenceLabel || recommendation.evidence?.evidenceLabel || null,
      algorithmVersion: Number(recommendation.algorithmVersion) || 1,
      snapshot: snapshot ? structuredClone(snapshot) : null,
      baseline: baseline ? structuredClone(baseline) : null,
      outcome: null,
      shownAt: recommendation.shownAt,
      createdAt: now,
      completedAt: null,
      ratedAt: null
    };
    feedbackList.push(feedback);
    return feedback;
  }
  function completeRecommendationFeedback(feedbackList, recommendationId, { sessionId, completedAt } = {}) {
    const feedback = feedbackList.find((item) => item.recommendationId === recommendationId && item.accepted);
    if (!feedback) return null;
    feedback.completed = true;
    feedback.completedAt = completedAt;
    feedback.resultingSessionId = sessionId || null;
    return feedback;
  }
  function rateRecommendationFeedback(feedbackList, recommendationId, { useful, ratedAt } = {}) {
    const feedback = feedbackList.find((item) => item.recommendationId === recommendationId && item.completed);
    if (!feedback) return null;
    feedback.useful = asBoolean(useful);
    feedback.ratedAt = ratedAt;
    return feedback;
  }
  function summarizeRecommendationFeedback(feedbackList = []) {
    const decisions = feedbackList.filter((item) => typeof item.accepted === "boolean");
    const accepted = decisions.filter((item) => item.accepted);
    const completed = accepted.filter((item) => item.completed);
    const rated = completed.filter((item) => typeof item.useful === "boolean");
    const pct = (part, total) => total ? Math.round(part / total * 100) : null;
    return { shown: decisions.length, accepted: accepted.length, completed: completed.length, rated: rated.length, acceptanceRate: pct(accepted.length, decisions.length), completionRate: pct(completed.length, accepted.length), usefulnessRate: pct(rated.filter((item) => item.useful).length, rated.length) };
  }

  // src/domain/recommendations/recommendation-outcome.js
  var RECOMMENDATION_OUTCOME_VERSION = 1;
  var METRICS = ["mastery", "retention", "reviewHealth", "accuracy", "risk"];
  var numeric = (value2) => value2 == null || value2 === "" || !Number.isFinite(Number(value2)) ? null : Math.max(0, Math.min(100, Number(value2)));
  var round2 = (value2) => Math.round(value2 * 10) / 10;
  function normalizeRecommendationMetrics(value2 = {}) {
    return Object.fromEntries(METRICS.map((key) => [key, numeric(value2?.[key])]));
  }
  function evaluateRecommendationOutcome({ before = {}, after = {}, questionVolume = 0, daysElapsed = 0, otherActivities = 0, measuredAt = null } = {}) {
    const normalizedBefore = normalizeRecommendationMetrics(before), normalizedAfter = normalizeRecommendationMetrics(after);
    const delta = Object.fromEntries(METRICS.map((key) => {
      const start = normalizedBefore[key], end = normalizedAfter[key];
      return [key, start == null || end == null ? null : round2(key === "risk" ? start - end : end - start)];
    }));
    const comparable = Object.values(delta).filter((value2) => value2 !== null);
    const volume = Math.max(0, Math.floor(Number(questionVolume) || 0)), elapsed = Math.max(0, Number(daysElapsed) || 0), activities = Math.max(0, Math.floor(Number(otherActivities) || 0));
    const reasons = [];
    if (elapsed < 1) reasons.push("Aguardando ao menos 1 dia após a recomendação");
    if (volume < 20) reasons.push(`Aguardando ${20 - volume} questão(ões) adicional(is)`);
    if (comparable.length < 2) reasons.push("Menos de 2 indicadores comparáveis");
    if (activities > 3) reasons.push("Muitas outras atividades no tópico para atribuir o resultado");
    const state2 = elapsed < 1 ? "pending" : reasons.length ? "insufficient" : round2(comparable.reduce((sum3, value2) => sum3 + value2, 0) / comparable.length) >= 3 ? "positive" : round2(comparable.reduce((sum3, value2) => sum3 + value2, 0) / comparable.length) <= -3 ? "negative" : "neutral";
    const confidence = Math.min(1, volume / 50 * 0.55 + Math.min(1, elapsed / 7) * 0.2 + comparable.length / METRICS.length * 0.25);
    const evidence = describeScoreEvidence({ completeness: comparable.length / METRICS.length, evidenceStrength: confidence });
    return {
      state: state2,
      outcome: state2,
      before: normalizedBefore,
      after: normalizedAfter,
      delta,
      averageDelta: comparable.length ? round2(comparable.reduce((sum3, value2) => sum3 + value2, 0) / comparable.length) : null,
      questionVolume: volume,
      daysElapsed: round2(elapsed),
      otherActivities: activities,
      attributionEligible: ["positive", "negative", "neutral"].includes(state2),
      confidence: round2(confidence),
      evidence,
      reasons,
      measuredAt,
      algorithmVersion: RECOMMENDATION_OUTCOME_VERSION
    };
  }

  // src/application/recommendations/outcome-service.js
  function recommendationOutcomeConfidence(questionVolume = 0) {
    const volume = Math.max(0, Number(questionVolume) || 0);
    return volume < 1 ? "Aguardando" : volume < 20 ? "Amostra inicial" : volume < 50 ? "Estimativa" : "Mais confiável";
  }
  function captureRecommendationBaseline({ mastery = null, accuracy: accuracy2 = null, questionVolume = 0, retention = null, retentionScore = null, reviewHealth = null, risk = null, trend = null, evidence = null, daysSinceContact = null, measuredAt } = {}) {
    const metrics = normalizeRecommendationMetrics({ mastery, accuracy: accuracy2, retention: retention ?? retentionScore, reviewHealth, risk });
    return { ...metrics, retentionScore: metrics.retention, accuracy: metrics.accuracy, questionVolume: Math.max(0, Number(questionVolume) || 0), daysSinceContact: Number.isFinite(Number(daysSinceContact)) ? Math.max(0, Number(daysSinceContact)) : null, trend: trend ? structuredClone(trend) : null, evidence: evidence ? structuredClone(evidence) : null, measuredAt };
  }
  function captureRecommendationSnapshot(recommendation, { baseline = null, createdAt = null } = {}) {
    const before = baseline || captureRecommendationBaseline({ measuredAt: createdAt });
    return Object.freeze({
      recommendationId: recommendation.recommendationId,
      algorithmVersion: Number(recommendation.algorithmVersion) || 1,
      subjectId: recommendation.subjectId || null,
      topicId: recommendation.topicId || null,
      priorityScore: Number.isFinite(Number(recommendation.score)) ? Number(recommendation.score) : null,
      riskScore: Number.isFinite(Number(recommendation.risk?.value)) ? Number(recommendation.risk.value) : null,
      recommendedMinutes: Math.max(0, Number(recommendation.estimatedMinutes) || 0),
      recommendedQuestions: Math.max(0, Number(recommendation.recommendedQuestions) || 0),
      masteryBefore: before.mastery ?? null,
      retentionBefore: before.retention ?? null,
      reviewHealthBefore: before.reviewHealth ?? null,
      evidenceBefore: before.evidence ? structuredClone(before.evidence) : null,
      before: structuredClone(before),
      createdAt: createdAt || recommendation.shownAt || null
    });
  }
  function measureRecommendationOutcome(feedback, { masteryAfter = null, accuracyAfter = null, questionVolumeAfter = 0, nextReviewRating = null, retentionAfter = null, reviewHealthAfter = null, riskAfter = null, measuredAt, daysElapsed = 0, otherActivities = 0 } = {}) {
    if (!feedback) return null;
    const before = feedback.snapshot?.before || feedback.baseline || {};
    const evaluated = evaluateRecommendationOutcome({ before, after: { mastery: masteryAfter, accuracy: accuracyAfter, retention: retentionAfter, reviewHealth: reviewHealthAfter, risk: riskAfter }, questionVolume: questionVolumeAfter, measuredAt, daysElapsed, otherActivities });
    const outcome = { ...evaluated, accuracyAfter: evaluated.after.accuracy, questionVolumeAfter: evaluated.questionVolume, nextReviewRating: nextReviewRating || null, retentionAfter: evaluated.after.retention, confidenceLabel: recommendationOutcomeConfidence(evaluated.questionVolume) };
    feedback.outcome = outcome;
    return outcome;
  }

  // src/application/recommendations/build-recommendation-outcome-view-model.js
  var LABELS = Object.freeze({ mastery: "Domínio", retention: "Retenção", reviewHealth: "Saúde da revisão", accuracy: "Acerto", risk: "Risco" });
  var STATE_MAP = Object.freeze({ positive: "improved", negative: "worsened", improved: "improved", worsened: "worsened", neutral: "neutral", pending: "pending", insufficient: "insufficient" });
  var STATE_LABELS = Object.freeze({ improved: "A recomendação ajudou", worsened: "O resultado piorou", neutral: "Resultado estável", pending: "Resultado em acompanhamento", insufficient: "Evidência insuficiente" });
  var numeric2 = (value2) => value2 == null || value2 === "" || !Number.isFinite(Number(value2)) ? null : Number(value2);
  function buildRecommendationOutcomeViewModel(feedbackList = []) {
    const measured = (Array.isArray(feedbackList) ? feedbackList : []).filter((item) => item?.completed && item?.outcome).sort((a, b) => String(b.outcome.measuredAt || b.completedAt || "").localeCompare(String(a.outcome.measuredAt || a.completedAt || "")));
    const feedback = measured[0];
    if (!feedback) return { state: "empty", available: false, metrics: [] };
    const outcome = feedback.outcome, before = outcome.before || feedback.snapshot?.before || feedback.baseline || {}, after = outcome.after || {}, deltas = outcome.delta || {};
    const metrics = Object.keys(LABELS).map((key) => {
      const start = numeric2(before[key]), end = numeric2(after[key] ?? outcome[key + "After"]), delta = numeric2(deltas[key]);
      return { key, label: LABELS[key], before: start, after: end, delta, available: start !== null && end !== null };
    }).filter((item) => item.available);
    const state2 = STATE_MAP[outcome.state] || "insufficient", confidence = numeric2(outcome.confidence);
    return { state: state2, available: true, title: STATE_LABELS[state2], metrics, confidence, confidenceLabel: outcome.confidenceLabel || outcome.evidence?.evidenceLabel || null, evidenceLabel: outcome.evidence?.evidenceLabel || null, reasons: Array.isArray(outcome.reasons) ? outcome.reasons : [], questionVolume: Math.max(0, Number(outcome.questionVolumeAfter ?? outcome.questionVolume) || 0), measuredAt: outcome.measuredAt || null, recommendationId: feedback.recommendationId, algorithmVersion: Number(outcome.algorithmVersion) || 1 };
  }

  // src/application/analytics/build-analytics-view-model.js
  function buildHeatmapViewModel({ summaries = [], metric = "hours", selectedDate = null } = {}) {
    const normalizedMetric = HEATMAP_METRICS.includes(metric) ? metric : "hours";
    const cells = summaries.map((summary) => ({ ...summary, level: heatmapMetricLevel(summary, normalizedMetric), selected: summary.date === selectedDate }));
    return { metric: normalizedMetric, cells, hasActivity: cells.some((item) => item.level > 0), selected: cells.find((item) => item.selected) || null };
  }
  function buildDiagnosisViewModel(diagnosis, { limit = 4 } = {}) {
    if (!diagnosis || diagnosis.state === "insufficient") return { state: "insufficient", sections: [] };
    return { state: "estimated", sections: [
      { key: "bottlenecks", title: "Gargalos", items: (diagnosis.bottlenecks || []).slice(0, limit) },
      { key: "opportunities", title: "Oportunidades", items: (diagnosis.opportunities || []).slice(0, limit) },
      { key: "risk", title: "Revisões críticas e risco", items: ((diagnosis.criticalReviews || []).length ? diagnosis.criticalReviews : diagnosis.topicsAtRisk || []).slice(0, limit) },
      { key: "focus", title: "Foco da semana", items: (diagnosis.weeklyFocus || []).slice(0, limit) }
    ] };
  }
  function buildApprovalSignals(metrics, { target = 70 } = {}) {
    const signals = [];
    if (metrics.simulados?.available && metrics.simulados.raw >= 75) signals.push({ level: "positive", text: "Boa média nos simulados" });
    if (metrics.revisoes?.available && metrics.revisoes.raw >= 90) signals.push({ level: "positive", text: "Revisões em dia" });
    if (metrics.tendencia?.available && metrics.tendencia.score >= 60) signals.push({ level: "positive", text: "Evolução positiva recente" });
    if (metrics.edital?.available && metrics.edital.raw < 60) signals.push({ level: "warning", text: "Edital com baixa cobertura" });
    if (metrics.dominio?.available && metrics.dominio.raw < 50) signals.push({ level: "warning", text: "Domínio médio dos tópicos ainda baixo" });
    if (metrics.dominio?.available && metrics.dominio.raw >= 75) signals.push({ level: "positive", text: "Bom domínio médio dos tópicos" });
    if (metrics.acertos?.available && metrics.acertos.raw < target) signals.push({ level: "warning", text: `Taxa de acerto abaixo da meta (${target}%)` });
    if (metrics.prazo?.available && metrics.prazo.score < 60) signals.push({ level: "warning", text: "Ritmo atual abaixo do necessário até a prova" });
    if (!metrics.simulados?.available) signals.push({ level: "info", text: "Registre simulados para aumentar a confiança do índice" });
    if ((metrics.acertos?.confidence || 0) < 0.34) signals.push({ level: "info", text: "Ainda há poucas questões para uma estimativa estável" });
    return signals.length ? signals : [{ level: "positive", text: "Indicadores equilibrados no momento" }];
  }

  // src/application/build-study-plan.js
  var positive = (value2) => Number.isFinite(Number(value2)) && Number(value2) > 0 ? Math.round(Number(value2)) : 0;
  function buildStudyPlan({ topics = [], weeklyAvailableMinutes = 0, weeksUntilExam = 0, prerequisiteTopics } = {}) {
    const candidates = resolveStudyEligibility(topics, prerequisiteTopics);
    const active = candidates.filter((item) => item && !item.archived && (!item.completed || item.covered) && (!item.covered || needsMaintenance(item)));
    const blockedTopics = active.filter((item) => item.blockedPrerequisites?.length).map((item) => ({ id: item.id, topicName: item.topicName, prerequisites: item.blockedPrerequisites }));
    const effort = (item) => item.covered ? sessionMinutes(item, 60) : positive(item.remainingMinutes ?? item.estimatedMinutes);
    const missingEffort = active.filter((item) => !item.covered && (item.remainingMinutes ?? item.estimatedMinutes) == null).map((item) => item.id);
    const configured = active.filter((item) => effort(item) > 0 && canStudy(item, { ignoreToday: true }));
    const availability = positive(weeklyAvailableMinutes), weeks = Math.max(0, Math.ceil(Number(weeksUntilExam) || 0));
    const remainingMinutes = active.filter((item) => !item.covered).reduce((sum3, item) => sum3 + effort(item), 0);
    const maintenanceMinutes = configured.filter((item) => item.covered).reduce((sum3, item) => sum3 + effort(item), 0);
    const base = { weeklyAvailableMinutes: availability, weeksUntilExam: weeks, remainingMinutes, maintenanceMinutes, missingEffort, blockedTopics };
    if (!configured.length || availability <= 0 || weeks <= 0) return { ...base, state: "insufficient", items: [], subjects: [], activityMix: { theory: 0, questions: 0, reviews: 0 }, confidence: 0 };
    const weeklyBudget = Math.min(availability, Math.ceil(remainingMinutes / weeks) + maintenanceMinutes);
    const scored = configured.map((item) => ({ ...item, ...calculatePriorityScore(item), capacityMinutes: effort(item) })).sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
    const totalScore = scored.reduce((sum3, item) => sum3 + Math.max(1, item.score), 0);
    const allocations = new Map(scored.map((item) => [item.id, Math.min(item.capacityMinutes, Math.floor(weeklyBudget * Math.max(1, item.score) / totalScore))]));
    let unallocated = weeklyBudget - [...allocations.values()].reduce((sum3, value2) => sum3 + value2, 0);
    for (const item of scored) {
      if (unallocated <= 0) break;
      const current = allocations.get(item.id), extra = Math.min(item.capacityMinutes - current, unallocated);
      allocations.set(item.id, current + extra);
      unallocated -= extra;
    }
    const items = scored.map((item) => {
      const minutes = allocations.get(item.id) || 0;
      const retentionNeed = item.retentionRisk ?? item.retentionNeed;
      const reviewShare = item.covered ? retentionNeed >= 40 || item.reviewUrgency >= 40 ? 0.6 : 0.3 : retentionNeed >= 60 ? 0.35 : 0.2;
      const reviews = item.covered && minutes >= 30 ? Math.max(15, Math.min(minutes - 15, Math.round(minutes * reviewShare))) : Math.round(minutes * reviewShare);
      const questions = item.covered ? minutes - reviews : Math.min(minutes - reviews, Math.round(minutes * (item.masteryGap >= 60 ? 0.4 : 0.3)));
      const activityMix2 = { theory: minutes - reviews - questions, questions, reviews };
      const largest = Object.keys(activityMix2).sort((a, b) => activityMix2[b] - activityMix2[a])[0];
      for (const key of Object.keys(activityMix2)) if (key !== largest && activityMix2[key] > 0 && activityMix2[key] < 15) {
        activityMix2[largest] += activityMix2[key];
        activityMix2[key] = 0;
      }
      return { ...item, minutes, activityMix: activityMix2 };
    }).filter((item) => item.minutes > 0);
    const subjectMap = /* @__PURE__ */ new Map();
    items.forEach((item) => {
      const current = subjectMap.get(item.subjectId) || { subjectId: item.subjectId, subjectName: item.subjectName, minutes: 0 };
      current.minutes += item.minutes;
      subjectMap.set(item.subjectId, current);
    });
    const activityMix = items.reduce((sum3, item) => ({ theory: sum3.theory + item.activityMix.theory, questions: sum3.questions + item.activityMix.questions, reviews: sum3.reviews + item.activityMix.reviews }), { theory: 0, questions: 0, reviews: 0 });
    const coverage = active.length ? configured.length / active.length : 0;
    const strategicCoverage = configured.filter((item) => item.examImpact != null).length / configured.length;
    const confidence = Math.round((coverage * 0.65 + strategicCoverage * 0.35) * 100) / 100;
    const measured = configured.filter((item) => item.evidenceStrength != null);
    const evidence = describeScoreEvidence({ completeness: confidence, evidenceStrength: measured.length ? measured.reduce((sum3, item) => sum3 + item.evidenceStrength, 0) / configured.length : null });
    return { ...base, maintenanceMinutes: items.filter((item) => item.covered).reduce((sum3, item) => sum3 + item.minutes, 0), state: confidence >= 0.75 ? "ready" : "estimated", weeklyPlannedMinutes: items.reduce((sum3, item) => sum3 + item.minutes, 0), items, subjects: [...subjectMap.values()].sort((a, b) => b.minutes - a.minutes), activityMix, confidence, confidenceLabel: evidence.completenessLabel, evidence };
  }

  // src/application/replan-study.js
  function buildReplanProposal({ plans = [], periodStart, periodEnd, futureDays = [] } = {}) {
    const inPeriod2 = plans.filter((plan) => plan.date >= periodStart && plan.date <= periodEnd);
    const plannedMinutes = inPeriod2.reduce((sum3, plan) => sum3 + (plan.items || []).filter((item) => !["skipped", "replaced"].includes(item.status)).reduce((n, item) => n + (Number(item.plannedMinutes) || 0), 0), 0);
    const executedMinutes = Math.round(inPeriod2.reduce((sum3, plan) => sum3 + (plan.items || []).reduce((n, item) => n + (Number(item.executedSeconds) || 0) / 60, 0), 0));
    const pendingItems = inPeriod2.flatMap((plan) => (plan.items || []).filter((item) => !["completed", "skipped", "replaced", "deferred"].includes(item.status)).map((item) => ({ sourcePlanId: plan.id, sourceItemId: item.id, subjectId: item.subjectId || null, topicId: item.topicId || null, remainingMinutes: Math.max(0, Math.round((Number(item.plannedMinutes) || 0) - (Number(item.executedSeconds) || 0) / 60)), priority: Number(item.score) || 0 }))).filter((item) => item.remainingMinutes > 0).sort((a, b) => b.priority - a.priority);
    const deficitMinutes = pendingItems.reduce((sum3, item) => sum3 + item.remainingMinutes, 0);
    const capacities = (futureDays || []).map((day) => ({ date: day.date, remaining: Math.max(0, Math.round(Number(day.availableMinutes) || 0)) }));
    const allocations = [];
    let remaining = deficitMinutes;
    pendingItems.forEach((item) => {
      let itemRemaining = item.remainingMinutes;
      capacities.forEach((day) => {
        if (itemRemaining <= 0 || day.remaining <= 0) return;
        const minutes = Math.min(itemRemaining, day.remaining);
        allocations.push({ ...item, date: day.date, minutes });
        itemRemaining -= minutes;
        day.remaining -= minutes;
        remaining -= minutes;
      });
    });
    const redistributedMinutes = allocations.reduce((sum3, item) => sum3 + item.minutes, 0);
    return { state: deficitMinutes ? "proposal" : "balanced", periodStart, periodEnd, plannedMinutes, executedMinutes, deficitMinutes, redistributedMinutes, discardedMinutes: Math.max(0, remaining), pendingItems, allocations, reasons: deficitMinutes ? ["execução abaixo do planejado no período"] : [] };
  }
  function applyReplan({ dailyPlans = [], proposal, operationId, now, idGenerator } = {}) {
    if (proposal?.state !== "proposal" || !operationId || typeof idGenerator !== "function") return { changes: [], createdItems: 0 };
    const changes = [], originalStatuses = /* @__PURE__ */ new Map();
    for (const allocation of proposal.allocations) {
      const sourcePlan = dailyPlans.find((plan) => plan.id === allocation.sourcePlanId), sourceItem = sourcePlan?.items?.find((item) => item.id === allocation.sourceItemId);
      if (!sourceItem) continue;
      if (dailyPlans.some((plan) => (plan.items || []).some((item) => item.rescheduleOperationId === operationId && item.rescheduledFromId === sourceItem.id && item.currentDate === allocation.date))) continue;
      let destination = dailyPlans.find((plan) => plan.date === allocation.date);
      if (!destination) {
        destination = { id: idGenerator("plan"), date: allocation.date, availableMinutes: allocation.minutes, plannedMinutes: 0, flexMinutes: 0, createdAt: now, updatedAt: now, items: [] };
        dailyPlans.push(destination);
      }
      const sourceKey = `${sourcePlan.id}:${sourceItem.id}`;
      if (!originalStatuses.has(sourceKey)) originalStatuses.set(sourceKey, sourceItem.status);
      sourceItem.status = "deferred";
      sourceItem.skippedReason = `Redistribuída para ${allocation.date}`;
      sourcePlan.updatedAt = now;
      const created = { ...sourceItem, id: idGenerator("plan-item"), plannedMinutes: allocation.minutes, executedSeconds: 0, status: "planned", sessionIds: [], originalDate: sourceItem.originalDate || sourcePlan.date, currentDate: allocation.date, rescheduleCount: (Number(sourceItem.rescheduleCount) || 0) + 1, skippedReason: null, rescheduledFromId: sourceItem.id, rescheduleOperationId: operationId, createdAt: now, lastExecutedAt: null };
      destination.items.push(created);
      destination.plannedMinutes = (destination.items || []).filter((item) => !["skipped", "replaced"].includes(item.status)).reduce((sum3, item) => sum3 + (Number(item.plannedMinutes) || 0), 0);
      destination.flexMinutes = Math.max(0, (Number(destination.availableMinutes) || 0) - destination.plannedMinutes);
      destination.updatedAt = now;
      changes.push({ sourcePlanId: sourcePlan.id, sourceItemId: sourceItem.id, sourcePreviousStatus: originalStatuses.get(sourceKey), destinationPlanId: destination.id, destinationItemId: created.id, date: allocation.date, minutes: allocation.minutes });
    }
    return { changes, createdItems: changes.length, operationId };
  }
  function undoReplan({ dailyPlans = [], adjustment } = {}) {
    const protectedItems = [], undoneChanges = [], protectedSources = /* @__PURE__ */ new Set(), sourceKey = (change) => `${change.sourcePlanId}:${change.sourceItemId}`;
    for (const change of adjustment?.changes || []) {
      const destination = dailyPlans.find((plan) => plan.id === change.destinationPlanId), item = destination?.items?.find((candidate) => candidate.id === change.destinationItemId);
      if (!item) continue;
      const executed = Number(item.executedSeconds) > 0 || (item.sessionIds || []).length > 0 || ["in_progress", "partial", "completed"].includes(item.status);
      if (executed) {
        protectedItems.push(item.id);
        protectedSources.add(sourceKey(change));
        continue;
      }
      destination.items = destination.items.filter((candidate) => candidate.id !== item.id);
      destination.plannedMinutes = destination.items.filter((candidate) => !["skipped", "replaced"].includes(candidate.status)).reduce((sum3, candidate) => sum3 + (Number(candidate.plannedMinutes) || 0), 0);
      destination.flexMinutes = Math.max(0, (Number(destination.availableMinutes) || 0) - destination.plannedMinutes);
      undoneChanges.push(change);
    }
    undoneChanges.filter((change) => !protectedSources.has(sourceKey(change))).forEach((change) => {
      const source = dailyPlans.find((plan) => plan.id === change.sourcePlanId)?.items?.find((candidate) => candidate.id === change.sourceItemId);
      if (source) {
        source.status = change.sourcePreviousStatus || "planned";
        source.skippedReason = null;
      }
    });
    for (let index = dailyPlans.length - 1; index >= 0; index--) if (!dailyPlans[index].items?.length) dailyPlans.splice(index, 1);
    return { undoneChanges, protectedItems, complete: protectedItems.length === 0 };
  }

  // src/application/planning/distribute-study-plan.js
  var ACTIVE_STATUSES = /* @__PURE__ */ new Set(["planned", "in_progress", "partial", "completed", "deferred"]);
  var clampMinutes = (value2) => Math.max(0, Math.round(Number(value2) || 0));
  function existingSourceKeys(plans, studyPlanId) {
    return new Set((plans || []).flatMap((plan) => (plan.items || []).filter((item) => item.studyPlanId === studyPlanId && item.studyPlanItemId && ACTIVE_STATUSES.has(item.status)).map((item) => item.studyPlanItemId)));
  }
  function buildDailyPlanProposal({ studyPlan, existingPlans = [], days = [], dueReviews = [], reserveRatio = 0.1, eligibleTopicIds = null } = {}) {
    if (!studyPlan?.id || !Array.isArray(studyPlan.items)) return { state: "insufficient", reason: "Plano semanal ausente.", days: [], plannedMinutes: 0, unallocatedMinutes: 0 };
    const existingKeys = existingSourceKeys(existingPlans, studyPlan.id), ratio = Math.max(0, Math.min(0.4, Number(reserveRatio) || 0));
    const slots = (days || []).map((day) => {
      const existing = existingPlans.filter((plan) => plan.date === day.date).flatMap((plan) => plan.items || []).filter((item) => !["skipped", "replaced"].includes(item.status)).reduce((sum3, item) => sum3 + clampMinutes(item.plannedMinutes), 0);
      const available = clampMinutes(day.availableMinutes), reserve = Math.round(available * ratio), capacity = Math.max(0, available - reserve - existing);
      return { date: day.date, availableMinutes: available, reserveMinutes: reserve, existingMinutes: existing, remaining: capacity, items: [] };
    });
    const candidates = [];
    const allowed = (topicId) => eligibleTopicIds === null || eligibleTopicIds.includes(topicId);
    (dueReviews || []).filter((review) => review?.topicId && review?.date && allowed(review.topicId) && !existingKeys.has(`review:${review.id}`)).forEach((review, index) => candidates.push({ studyPlanItemId: `review:${review.id || index}`, subjectId: review.subjectId || null, topicId: review.topicId, subjectName: review.subjectName || "", topicName: review.topicName || "", type: "review", minutes: clampMinutes(review.minutes || 25), dueDate: review.date, origin: "review" }));
    studyPlan.items.filter((item) => allowed(item.topicId || item.id) && !existingKeys.has(item.id)).forEach((item) => {
      const mixes = [["review", item.activityMix?.reviews], ["questions", item.activityMix?.questions], ["study", item.activityMix?.theory]].filter(([, minutes]) => clampMinutes(minutes) > 0);
      (mixes.length ? mixes : [["study", item.minutes]]).forEach(([type, minutes]) => candidates.push({ studyPlanItemId: item.id, subjectId: item.subjectId || null, topicId: item.topicId || item.id || null, subjectName: item.subjectName || "", topicName: item.topicName || "", type, minutes: clampMinutes(minutes), dueDate: null, origin: "study-plan" }));
    });
    let unallocatedMinutes = 0;
    for (const candidate of candidates) {
      let remaining = candidate.minutes;
      const ordered = candidate.dueDate ? [...slots].sort((a, b) => Math.abs(a.date.localeCompare(candidate.dueDate)) - Math.abs(b.date.localeCompare(candidate.dueDate))) : slots;
      for (const slot of ordered) {
        while (remaining > 0 && slot.remaining >= 15) {
          const chunk = Math.min(60, remaining, slot.remaining), minutes = chunk < 15 ? 0 : chunk;
          if (!minutes) break;
          slot.items.push({ ...candidate, minutes });
          slot.remaining -= minutes;
          remaining -= minutes;
        }
        if (remaining <= 0) break;
      }
      unallocatedMinutes += remaining;
    }
    const proposalDays = slots.filter((slot) => slot.items.length).map((slot) => ({ ...slot, plannedMinutes: slot.items.reduce((sum3, item) => sum3 + item.minutes, 0), flexMinutes: slot.reserveMinutes + slot.remaining }));
    const plannedMinutes = proposalDays.reduce((sum3, day) => sum3 + day.plannedMinutes, 0);
    return { state: plannedMinutes ? "proposal" : "insufficient", studyPlanId: studyPlan.id, days: proposalDays, plannedMinutes, unallocatedMinutes, existingLinkedItems: existingKeys.size, reserveRatio: ratio, reason: plannedMinutes ? null : "Não há capacidade ou itens novos para distribuir." };
  }
  function applyDailyPlanProposal({ dailyPlans = [], proposal, operationId, now, idGenerator } = {}) {
    if (proposal?.state !== "proposal" || !operationId || typeof idGenerator !== "function") return { createdItems: 0, createdPlans: 0 };
    const existing = new Set(dailyPlans.flatMap((plan) => (plan.items || []).filter((item) => item.studyPlanId === proposal.studyPlanId && item.studyPlanItemId).map((item) => `${item.studyPlanItemId}:${item.type}:${item.currentDate || plan.date}`)));
    let createdItems = 0, createdPlans = 0;
    proposal.days.forEach((day) => {
      let plan = dailyPlans.find((item) => item.date === day.date);
      if (!plan) {
        plan = { id: idGenerator("plan"), date: day.date, availableMinutes: day.availableMinutes, plannedMinutes: 0, flexMinutes: day.availableMinutes, createdAt: now, updatedAt: now, studyPlanId: proposal.studyPlanId, generationOperationId: operationId, items: [] };
        dailyPlans.push(plan);
        createdPlans++;
      }
      day.items.forEach((source, index) => {
        const key = `${source.studyPlanItemId}:${source.type}:${day.date}`;
        if (existing.has(key)) return;
        existing.add(key);
        plan.items.push({ id: idGenerator("plan-item"), subjectId: source.subjectId, topicId: source.topicId, subjectName: source.subjectName, topicName: source.topicName, type: source.type, plannedMinutes: source.minutes, executedSeconds: 0, status: "planned", sessionIds: [], position: plan.items.length + 1, statusIcon: "📅", statusLabel: "Plano semanal", reason: source.origin === "review" ? "Revisão prevista para o período" : "Distribuição confirmada do plano semanal", action: source.type === "questions" ? "Resolver questões" : source.type === "review" ? "Revisar o tópico" : "Estudar o tópico", recommendedQuestions: 0, originalDate: day.date, currentDate: day.date, rescheduleCount: 0, skippedReason: null, recommendationId: null, studyPlanId: proposal.studyPlanId, studyPlanItemId: source.studyPlanItemId, generationOperationId: operationId, createdAt: now });
        createdItems++;
      });
      plan.plannedMinutes = (plan.items || []).filter((item) => !["skipped", "replaced"].includes(item.status)).reduce((sum3, item) => sum3 + clampMinutes(item.plannedMinutes), 0);
      plan.flexMinutes = Math.max(0, plan.availableMinutes - plan.plannedMinutes);
      plan.updatedAt = now;
    });
    return { createdItems, createdPlans, operationId };
  }
  function undoDailyPlanGeneration({ dailyPlans = [], operationId } = {}) {
    let removedItems = 0;
    const protectedItems = [];
    for (let index = dailyPlans.length - 1; index >= 0; index--) {
      const plan = dailyPlans[index];
      plan.items = (plan.items || []).filter((item) => {
        if (item.generationOperationId !== operationId) return true;
        const executed = Number(item.executedSeconds) > 0 || (item.sessionIds || []).length > 0 || ["in_progress", "partial", "completed"].includes(item.status);
        if (executed) {
          protectedItems.push(item.id);
          return true;
        }
        removedItems++;
        return false;
      });
      plan.plannedMinutes = plan.items.filter((item) => !["skipped", "replaced"].includes(item.status)).reduce((sum3, item) => sum3 + clampMinutes(item.plannedMinutes), 0);
      plan.flexMinutes = Math.max(0, (Number(plan.availableMinutes) || 0) - plan.plannedMinutes);
      if (!plan.items.length && plan.generationOperationId === operationId) dailyPlans.splice(index, 1);
    }
    return { removedItems, protectedItems, complete: protectedItems.length === 0 };
  }

  // src/application/planning/study-plan-service.js
  function createStudyPlanService({ repository, calculate, clock, idGenerator, algorithmVersion = () => 1 } = {}) {
    if (!repository || typeof repository.saveStudyPlan !== "function") throw new TypeError("Serviço de plano requer repositório.");
    return Object.freeze({ calculate: (input) => calculate(input), confirm: (proposal) => {
      if (!proposal || proposal.state === "insufficient" || !proposal.items?.length) return null;
      const id = idGenerator("study-plan"), confirmedAt = clock.nowISO(), plan = { ...structuredClone(proposal), id, confirmedAt, algorithmVersion: algorithmVersion(), dailyPlanOperations: [], items: proposal.items.map((item) => ({ ...item, id: idGenerator("study-plan-item"), topicId: item.topicId || item.id, studyPlanId: id })) };
      return repository.saveStudyPlan(plan);
    }, getActive: () => repository.getActiveStudyPlan(), listVersions: () => [...repository.getStudyPlans()].sort((a, b) => String(b.confirmedAt || "").localeCompare(String(a.confirmedAt || ""))) });
  }

  // src/application/planning/daily-plan-service.js
  function createDailyPlanService({ repository, buildProposal, applyProposal, undoGeneration, clock, idGenerator } = {}) {
    if (!repository || typeof repository.getDailyPlans !== "function") throw new TypeError("Serviço diário requer repositório.");
    return Object.freeze({ calculate: (input) => buildProposal({ ...input, existingPlans: repository.getDailyPlans() }), confirm: (proposal, studyPlan) => {
      const operationId = idGenerator("daily-plan-operation"), createdAt = clock.nowISO(), result = applyProposal({ dailyPlans: repository.getDailyPlans(), proposal, operationId, now: createdAt, idGenerator });
      studyPlan.dailyPlanOperations = Array.isArray(studyPlan.dailyPlanOperations) ? studyPlan.dailyPlanOperations : [];
      studyPlan.dailyPlanOperations.push({ id: operationId, createdAt, createdItems: result.createdItems, undoneAt: null });
      return result;
    }, undo: (operation, studyPlan) => {
      const result = undoGeneration({ dailyPlans: repository.getDailyPlans(), operationId: operation.id });
      operation.undoneAt = result.complete ? clock.nowISO() : null;
      operation.protectedItems = result.protectedItems;
      repository.saveStudyPlan(studyPlan);
      return result;
    } });
  }

  // src/application/planning/replan-service.js
  function createReplanService({ repository, buildProposal, applyProposal, undoProposal, clock, idGenerator } = {}) {
    if (!repository || typeof repository.saveAdjustment !== "function") throw new TypeError("Serviço de replanejamento requer repositório.");
    return Object.freeze({
      calculate: (input) => buildProposal({ ...input, plans: input.plans || repository.getDailyPlans() }),
      confirm: (proposal) => {
        if (proposal?.state !== "proposal") return null;
        const operationId = idGenerator("replan-operation"), appliedAt = clock.nowISO();
        const result = applyProposal({ dailyPlans: repository.getDailyPlans(), proposal, operationId, now: appliedAt, idGenerator });
        const adjustment = { ...structuredClone(proposal), id: idGenerator("plan-adjustment"), operationId, confirmedAt: appliedAt, appliedAt, status: "applied", changes: result.changes, undoneAt: null };
        repository.saveAdjustment(adjustment);
        return { result, adjustment };
      },
      undo: (id) => {
        const adjustment = repository.findAdjustment(id);
        if (!adjustment || adjustment.undoneAt) return null;
        const result = undoProposal({ dailyPlans: repository.getDailyPlans(), adjustment });
        repository.saveAdjustment({ ...adjustment, status: result.complete ? "undone" : "partially_undone", undoneAt: result.complete ? clock.nowISO() : null, protectedItems: result.protectedItems });
        return result;
      }
    });
  }

  // src/domain/sessions/study-session.js
  var STUDY_SESSION_TYPES = Object.freeze(["study", "review", "questions", "simulation"]);
  var STUDY_SESSION_SOURCES = Object.freeze(["manual", "plan", "recommendation", "import"]);
  var nullable = (value2) => value2 == null || value2 === "" ? null : String(value2);
  var nonNegative = (value2) => Math.max(0, Number(value2) || 0);
  var nonNegativeInteger = (value2) => Math.floor(nonNegative(value2));
  var finiteOrNull = (value2) => value2 == null || value2 === "" || !Number.isFinite(Number(value2)) ? null : Number(value2);
  var isLocalDate = (value2) => typeof value2 === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value2);
  function localDateFromTimestamp(value2) {
    if (!value2) return null;
    const parsed = new Date(value2);
    if (Number.isNaN(parsed.getTime())) return null;
    const year = parsed.getFullYear(), month = String(parsed.getMonth() + 1).padStart(2, "0"), day = String(parsed.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }
  function normalizeStudySession(rawSession = {}, options = {}) {
    const input = rawSession && typeof rawSession === "object" ? rawSession : {}, questionsResolved = nonNegativeInteger(input.questionsResolved), inferredDate = localDateFromTimestamp(input.endedAt || input.startedAt || input.createdAt), fallbackDate = typeof options.today === "function" ? options.today() : options.today, type = STUDY_SESSION_TYPES.includes(input.type) ? input.type : "study", source = STUDY_SESSION_SOURCES.includes(input.source) ? input.source : input.recommendationId ? "recommendation" : input.planItemId ? "plan" : "manual";
    return { ...input, id: nullable(input.id), date: isLocalDate(input.date) ? input.date : inferredDate || (isLocalDate(fallbackDate) ? fallbackDate : null), createdAt: nullable(input.createdAt), startedAt: nullable(input.startedAt), endedAt: nullable(input.endedAt), durationSeconds: nonNegative(input.durationSeconds), subjectId: nullable(input.subjectId), topicId: nullable(input.topicId), planItemId: nullable(input.planItemId), recommendationId: nullable(input.recommendationId), type, source, questionsResolved, correctAnswers: Math.min(questionsResolved, nonNegativeInteger(input.correctAnswers)), prioritySnapshot: finiteOrNull(input.prioritySnapshot), notes: typeof input.notes === "string" ? input.notes : "" };
  }

  // src/application/sessions/session-service.js
  function createSessionService({ repository, questionsRepository, historyRepository, planningRepository: planningRepository2, recommendationsRepository, clock, idGenerator, normalizeSession = normalizeStudySession, normalizeQuestion = () => {
  }, completeRecommendation = () => {
  }, onCompleted = () => {
  } } = {}) {
    if (!repository || typeof repository.add !== "function") throw new TypeError("Serviço de sessões requer repositório.");
    if (!questionsRepository || !planningRepository2 || !clock || typeof idGenerator !== "function") throw new TypeError("Serviço de sessões requer dependências de aplicação.");
    const normalize = (input) => normalizeSession(input, { today: () => clock.today() });
    const findPlanItem = (id) => {
      if (!id) return null;
      for (const plan of planningRepository2.getDailyPlans()) {
        const item = (plan.items || []).find((candidate) => candidate.id === id);
        if (item) return { plan, item };
      }
      return null;
    };
    const syncPlan = (planItemId) => {
      const found = findPlanItem(planItemId);
      if (!found) return null;
      const linked = repository.listByPlanItem(planItemId), latest = [...linked].sort((a, b) => String(a.endedAt || "").localeCompare(String(b.endedAt || ""))).pop();
      found.item.sessionIds = linked.map((item) => item.id);
      found.item.executedSeconds = linked.reduce((sum3, item) => sum3 + Math.max(0, Number(item.durationSeconds) || 0), 0);
      found.item.status = !linked.length ? "planned" : found.item.plannedMinutes > 0 && found.item.executedSeconds >= found.item.plannedMinutes * 60 ? "completed" : "partial";
      found.item.lastExecutedAt = latest?.endedAt || null;
      found.plan.updatedAt = clock.nowISO();
      if (latest && found.item.recommendationId && found.item.status === "completed") completeRecommendation(recommendationsRepository?.all?.() || [], found.item.recommendationId, { sessionId: latest.id, completedAt: found.item.lastExecutedAt });
      return found.item;
    };
    const syncQuestion = (session) => {
      const linked = questionsRepository.all().filter((item) => item.studySessionId === session.id), existing = linked[0] || null;
      linked.slice(1).forEach((item) => questionsRepository.remove(item.id));
      if (session.questionsResolved <= 0) {
        if (existing) questionsRepository.remove(existing.id);
        return null;
      }
      const values = { date: session.date, subjectId: session.subjectId || null, topicId: session.topicId || null, resolved: session.questionsResolved, correct: session.correctAnswers, studySessionId: session.id };
      const question = existing ? questionsRepository.update(existing.id, values) : questionsRepository.add({ id: idGenerator("question"), createdAt: clock.nowISO(), ...values });
      normalizeQuestion(question);
      return question;
    };
    return Object.freeze({
      complete: (input) => {
        const linkedItem = findPlanItem(input.planItemId)?.item || null, recommendationId = input.recommendationId || linkedItem?.recommendationId || null;
        const session = normalize({
          id: idGenerator("session"),
          createdAt: clock.nowISO(),
          ...input,
          source: input.source || (recommendationId ? "recommendation" : linkedItem ? "plan" : "manual"),
          recommendationId,
          prioritySnapshot: input.prioritySnapshot ?? (Number.isFinite(Number(linkedItem?.score)) ? Number(linkedItem.score) : null)
        });
        const saved = repository.add(session);
        syncQuestion(saved);
        syncPlan(saved.planItemId);
        const occurredAt = clock.nowISO();
        historyRepository?.add?.({ id: idGenerator("history"), date: occurredAt, occurredAt, localDate: saved.date || clock.today(), type: "study_session", subjectId: saved.subjectId || null, topicId: saved.topicId || null, metadata: { sessionId: saved.id, durationSeconds: saved.durationSeconds, recommendationId: saved.recommendationId || null } });
        onCompleted(saved);
        return saved;
      },
      edit: (id, changes) => {
        const current = repository.findById(id);
        if (!current) return null;
        const oldPlanItemId = current.planItemId || null, saved = repository.update(id, normalize({ ...current, ...changes }));
        syncQuestion(saved);
        if (oldPlanItemId && oldPlanItemId !== saved.planItemId) syncPlan(oldPlanItemId);
        syncPlan(saved.planItemId);
        return saved;
      },
      remove: (id) => {
        const session = repository.remove(id);
        if (!session) return null;
        questionsRepository.all().filter((item) => item.studySessionId === id).forEach((item) => questionsRepository.remove(item.id));
        historyRepository?.all?.().filter((item) => item.type === "study_session" && item.metadata?.sessionId === id).forEach((item) => historyRepository.remove(item.id));
        syncPlan(session.planItemId);
        return session;
      },
      syncPlanItem: syncPlan
    });
  }

  // src/application/records/record-service.js
  function createRecordService({ repository, clock, idGenerator, prefix, normalize = (value2) => value2 } = {}) {
    if (!repository || !clock || typeof idGenerator !== "function") throw new TypeError("Serviço de registros requer dependências.");
    return Object.freeze({ list: () => repository.all(), find: (id) => repository.findById(id), create: (input) => repository.add(normalize({ id: idGenerator(prefix), createdAt: clock.nowISO(), ...input })), update: (id, changes) => {
      const current = repository.findById(id);
      return current ? repository.update(id, normalize({ ...current, ...changes })) : null;
    }, remove: (id) => repository.remove(id) });
  }

  // src/application/subjects/subject-service.js
  var DEFAULT_SUBJECT_NAMES = Object.freeze(["Português", "Matemática", "Matemática Financeira", "Conhecimentos Bancários", "Atualidades do Mercado Financeiro", "Informática", "Vendas e Negociação"]);
  var cleanName = (value2) => String(value2 || "").trim() || "Disciplina sem nome";
  function createSubjectService({ repository, clock, idGenerator, onEvent = () => {
  } } = {}) {
    if (!repository || !clock || typeof idGenerator !== "function") throw new TypeError("Serviço de disciplinas requer dependências.");
    const newSubject = (name) => ({ id: idGenerator("subject"), name: cleanName(name), collapsed: false, archived: false, archivedAt: null, createdAt: clock.nowISO(), topics: [] });
    const newTopic = (input) => ({ id: idGenerator("topic"), name: "", link: "", status: "Não iniciado", archived: false, archivedAt: null, notes: "", tags: [], difficulty: "Médio", createdAt: clock.nowISO(), firstCompletedAt: null, lastCompletedAt: null, completionCount: 0, lastReviewedAt: null, reviewCount: 0, examImportance: null, estimatedStudyMinutes: null, prerequisites: [], ...input });
    return Object.freeze({
      create: (name) => repository.add(newSubject(name)),
      rename: (id, name) => repository.update(id, { name: cleanName(name) }),
      toggle: (id) => {
        const item = repository.findById(id);
        return item ? repository.update(id, { collapsed: !item.collapsed }) : null;
      },
      addDefaults: (names = DEFAULT_SUBJECT_NAMES) => names.filter((name) => !repository.all().some((item) => item.name === name)).map((name) => repository.add(newSubject(name))),
      archive: (id) => {
        const item = repository.update(id, { archived: true, archivedAt: clock.nowISO() });
        if (item) onEvent("subject_archived", id, null, { name: item.name });
        return item;
      },
      restore: (id) => {
        const item = repository.update(id, { archived: false, archivedAt: null });
        if (item) onEvent("subject_restored", id, null, { name: item.name });
        return item;
      },
      remove: (id) => repository.remove(id),
      addTopic: (subjectId, input = {}) => repository.addTopic(subjectId, newTopic(input)),
      updateTopic: (subjectId, topicId, changes) => repository.updateTopic(subjectId, topicId, changes),
      archiveTopic: (subjectId, topicId) => {
        const item = repository.updateTopic(subjectId, topicId, { archived: true, archivedAt: clock.nowISO() });
        if (item) onEvent("topic_archived", subjectId, topicId, { name: item.name });
        return item;
      },
      restoreTopic: (subjectId, topicId) => {
        const item = repository.updateTopic(subjectId, topicId, { archived: false, archivedAt: null });
        if (item) onEvent("topic_restored", subjectId, topicId, { name: item.name });
        return item;
      },
      removeTopic: (subjectId, topicId) => repository.removeTopic(subjectId, topicId),
      findTopic: repository.findTopic
    });
  }

  // src/ui/controllers/navigation-controller.js
  var MAIN_TABS = Object.freeze(["dashboard", "hoje", "disciplinas", "calendario", "agenda", "questoes", "metas"]);
  function nextNavigationIndex(current, length, key) {
    if (!length) return -1;
    if (key === "Home") return 0;
    if (key === "End") return length - 1;
    const delta = ["ArrowRight", "ArrowDown"].includes(key) ? 1 : -1;
    return (current + delta + length) % length;
  }
  function createNavigationController({ document: document2, window: window2, render: render2 = () => {
  }, trapModalTab: trapModalTab2 = () => {
  }, closeReview = () => {
  } } = {}) {
    if (!document2 || !window2) throw new TypeError("Controlador de navegação requer documento e janela.");
    const moreButton = document2.getElementById("moreTabButton"), moreMenu = document2.getElementById("mobileMoreMenu");
    const syncMore = (tabName) => {
      const secondary = ["agenda", "questoes", "metas"].includes(tabName);
      moreButton?.classList.toggle("active", secondary);
      moreMenu?.querySelectorAll("[data-more-tab]").forEach((item) => item.classList.toggle("active", item.dataset.moreTab === tabName));
    };
    const closeMore = ({ restoreFocus = false } = {}) => {
      if (!moreMenu) return;
      moreMenu.hidden = true;
      moreButton?.setAttribute("aria-expanded", "false");
      if (restoreFocus) moreButton?.focus();
    };
    const activate = (tabName, updateHash = true) => {
      const button = document2.querySelector(`.tab-btn[data-tab="${tabName}"]`), panel = document2.getElementById(`panel-${tabName}`);
      if (!button || !panel) return false;
      document2.querySelectorAll(".tab-btn").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
      });
      document2.querySelectorAll(".panel").forEach((item) => item.classList.toggle("active", item === panel));
      document2.querySelector(".statement")?.classList.toggle("statement--compact", tabName !== "dashboard");
      document2.querySelector(".global-search-row")?.classList.toggle("global-search-row--compact", tabName !== "dashboard");
      syncMore(tabName);
      button.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
      render2(tabName);
      if (updateHash) window2.history.replaceState(null, "", `#${tabName}`);
      return true;
    };
    moreButton?.addEventListener("click", () => {
      const open = moreMenu?.hidden;
      if (!moreMenu) return;
      moreMenu.hidden = !open;
      moreButton.setAttribute("aria-expanded", String(open));
      if (open) moreMenu.querySelector('[role="menuitem"]')?.focus();
    });
    moreMenu?.addEventListener("click", (event) => {
      const item = event.target.closest("[data-more-tab]");
      if (item) {
        activate(item.dataset.moreTab);
        closeMore();
      }
    });
    moreMenu?.addEventListener("keydown", (event) => {
      const items = [...moreMenu.querySelectorAll('[role="menuitem"]')], index = items.indexOf(document2.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        closeMore({ restoreFocus: true });
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      items[nextNavigationIndex(index, items.length, event.key)]?.focus();
    });
    document2.addEventListener("click", (event) => {
      if (!moreMenu?.hidden && !moreMenu.contains(event.target) && event.target !== moreButton) closeMore();
    });
    document2.querySelectorAll(".tab-btn[data-tab]").forEach((button) => {
      button.addEventListener("click", () => activate(button.dataset.tab));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const tabs = [...document2.querySelectorAll(".tab-btn[data-tab]")].filter((item) => window2.getComputedStyle(item).display !== "none"), next = nextNavigationIndex(tabs.indexOf(button), tabs.length, event.key);
        tabs[next]?.focus();
        activate(tabs[next]?.dataset.tab);
      });
    });
    const registerShortcuts = () => document2.addEventListener("keydown", (event) => {
      trapModalTab2(event);
      const modifier = window2.navigator.platform.toUpperCase().includes("MAC") ? event.metaKey : event.ctrlKey, active = document2.activeElement, typing = ["INPUT", "TEXTAREA", "SELECT"].includes(active?.tagName) || active?.isContentEditable;
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document2.getElementById("globalSearchInput")?.focus();
        return;
      }
      if (event.key === "Escape") {
        document2.getElementById("globalSearchInput")?.blur();
        document2.getElementById("globalSearchResults")?.classList.remove("show");
        if (document2.getElementById("reviewRatingOverlay")?.classList.contains("show")) {
          event.preventDefault();
          closeReview();
          return;
        }
        if (document2.getElementById("sessionModalOverlay")?.classList.contains("show")) {
          event.preventDefault();
          document2.getElementById("sessionModalSkipBtn")?.click();
          return;
        }
        if (document2.getElementById("modalOverlay")?.classList.contains("show")) {
          event.preventDefault();
          document2.getElementById("modalCancelBtn")?.click();
        }
        return;
      }
      if (!typing && /^[1-7]$/.test(event.key)) activate(MAIN_TABS[Number(event.key) - 1]);
    });
    return Object.freeze({ activate, closeMore, registerShortcuts });
  }

  // src/ui/controllers/modal-controller.js
  function createModalController({ document: document2, window: window2 } = {}) {
    if (!document2 || !window2) throw new TypeError("Controlador de modal requer documento e janela.");
    let activeCleanup = null;
    const confirm = (message, onConfirm = () => {
    }, onCancel, options = {}) => {
      const overlay = document2.getElementById("modalOverlay");
      if (activeCleanup) activeCleanup(false);
      const previous = document2.activeElement, messageNode = document2.getElementById("modalMessage"), group = document2.getElementById("modalPromptGroup"), input = document2.getElementById("modalPromptInput"), label = document2.getElementById("modalPromptLabel"), error = document2.getElementById("modalPromptError"), confirmButton = document2.getElementById("modalConfirmBtn"), cancelButton = document2.getElementById("modalCancelBtn"), hasPrompt = Boolean(options.prompt), originalLabel = confirmButton.textContent;
      messageNode.textContent = message;
      group.hidden = !hasPrompt;
      error.textContent = "";
      if (hasPrompt) {
        label.textContent = options.prompt.label || "Nome";
        input.value = options.prompt.value || "";
        input.placeholder = options.prompt.placeholder || "";
      }
      if (options.confirmLabel) confirmButton.textContent = options.confirmLabel;
      overlay.classList.add("show");
      let frame = 0;
      const cleanup = (restore = true) => {
        if (frame) window2.cancelAnimationFrame(frame);
        overlay.classList.remove("show");
        confirmButton.removeEventListener("click", accept);
        cancelButton.removeEventListener("click", cancel);
        overlay.removeEventListener("click", outside);
        input.removeEventListener("keydown", enter);
        confirmButton.textContent = originalLabel;
        activeCleanup = null;
        if (restore && previous?.isConnected) previous.focus();
      };
      const accept = () => {
        const value2 = hasPrompt ? input.value.trim() : void 0, validation = hasPrompt && typeof options.prompt.validate === "function" ? options.prompt.validate(value2) : "";
        if (validation) {
          error.textContent = validation;
          input.focus();
          return;
        }
        cleanup();
        onConfirm(value2);
      };
      const cancel = () => {
        cleanup();
        if (typeof onCancel === "function") onCancel();
      };
      const outside = (event) => {
        if (event.target === overlay) cancel();
      };
      const enter = (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          accept();
        }
      };
      confirmButton.addEventListener("click", accept);
      cancelButton.addEventListener("click", cancel);
      overlay.addEventListener("click", outside);
      if (hasPrompt) input.addEventListener("keydown", enter);
      activeCleanup = cleanup;
      frame = window2.requestAnimationFrame(() => {
        frame = 0;
        (hasPrompt ? input : cancelButton).focus();
      });
    };
    return Object.freeze({ confirm, prompt: (message, options, onConfirm, onCancel) => confirm(message, onConfirm, onCancel, { confirmLabel: options.confirmLabel || "Criar", prompt: options }), close: () => activeCleanup?.() });
  }

  // src/ui/controllers/editable-collection-controller.js
  function createEditableCollectionController({ service, clone = (value2) => structuredClone(value2), render: render2 = () => {
  }, normalize = (value2) => value2, onSaved = () => {
  }, initialState = {} } = {}) {
    if (!service || typeof service.find !== "function") throw new TypeError("Controlador de edição requer serviço de coleção.");
    const state2 = { editingId: null, editingIsNew: false, draft: null, ...initialState };
    const reset = () => Object.assign(state2, { editingId: null, editingIsNew: false, draft: null });
    return Object.freeze({ state: state2, begin: (id, { isNew = false } = {}) => {
      if (state2.editingIsNew && state2.editingId !== id) service.remove(state2.editingId);
      const item = service.find(id);
      if (!item) return null;
      Object.assign(state2, { editingId: id, editingIsNew: isNew, draft: clone(item) });
      render2();
      return state2.draft;
    }, update: (field, value2) => {
      if (!state2.draft) return null;
      state2.draft[field] = value2;
      return state2.draft;
    }, cancel: () => {
      if (state2.editingIsNew && state2.editingId) service.remove(state2.editingId);
      reset();
      render2();
    }, save: () => {
      if (!state2.draft || !service.find(state2.editingId)) return null;
      const saved = service.update(state2.editingId, normalize(clone(state2.draft)));
      reset();
      onSaved(saved);
      return saved;
    }, reset });
  }

  // src/ui/controllers/preferences-controller.js
  function createPreferencesController({ document: document2, storage, key = "bb-premium-theme" } = {}) {
    if (!document2) throw new TypeError("Controlador de preferências requer documento.");
    const current = () => document2.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const sync = () => {
      const dark = current() === "dark", icon = document2.getElementById("themeToggleIcon"), button = document2.getElementById("themeToggleBtn");
      if (icon) icon.textContent = dark ? "☀️" : "🌙";
      if (button) button.setAttribute("aria-label", dark ? "Mudar para modo claro" : "Mudar para modo escuro");
      return current();
    };
    const set = (theme) => {
      const normalized = theme === "dark" ? "dark" : "light";
      document2.documentElement.setAttribute("data-theme", normalized);
      try {
        storage?.setItem(key, normalized);
      } catch (error) {
      }
      sync();
      return normalized;
    };
    return Object.freeze({ current, set, toggle: () => set(current() === "dark" ? "light" : "dark"), sync });
  }

  // src/ui/controllers/backup-controller.js
  function createBackupController({ document: document2, window: window2, serialize, fileName, validate, onImport, notify, isDisabled = () => false, maxBytes = 10 * 1024 * 1024 } = {}) {
    if (!document2 || !window2 || typeof serialize !== "function") throw new TypeError("Controlador de backup requer dependências do navegador.");
    const download = (raw, name) => {
      const blob = new window2.Blob([raw], { type: "application/json" }), url = window2.URL.createObjectURL(blob), anchor = document2.createElement("a");
      anchor.href = url;
      anchor.download = name;
      document2.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window2.URL.revokeObjectURL(url);
    };
    const exportState = (state2, date2) => {
      if (isDisabled()) {
        notify("Backups ficam indisponíveis durante a demonstração.");
        return false;
      }
      download(serialize(state2), fileName(date2));
      notify("Backup exportado.");
      return true;
    };
    const importFile = (file) => {
      if (isDisabled()) {
        notify("A importação fica indisponível durante a demonstração.");
        return;
      }
      if (!file) return;
      if (file.size > maxBytes) {
        notify("O arquivo excede o limite de 10 MB para importação.");
        return;
      }
      const reader = new window2.FileReader();
      reader.onload = () => {
        let parsed;
        try {
          parsed = JSON.parse(reader.result);
        } catch (error) {
          notify("Arquivo inválido — não parece um backup deste extrato.");
          return;
        }
        const result = validate(parsed);
        if (!result.valid) {
          notify(result.message);
          return;
        }
        onImport(result);
      };
      reader.onerror = () => notify("Não foi possível ler o arquivo selecionado.");
      reader.readAsText(file);
    };
    return Object.freeze({ download, exportState, importFile });
  }

  // src/ui/controllers/delegated-events-controller.js
  function splitArguments(source) {
    const values = [];
    let current = "", quote = null, escaped = false, depth = 0;
    for (const char of source) {
      if (escaped) {
        current += char;
        escaped = false;
        continue;
      }
      if (char === "\\") {
        current += char;
        escaped = true;
        continue;
      }
      if (quote) {
        current += char;
        if (char === quote) quote = null;
        continue;
      }
      if (char === "'" || char === '"') {
        quote = char;
        current += char;
        continue;
      }
      if (char === "(") {
        depth++;
        current += char;
        continue;
      }
      if (char === ")") {
        depth--;
        current += char;
        continue;
      }
      if (char === "," && depth === 0) {
        values.push(current.trim());
        current = "";
        continue;
      }
      current += char;
    }
    if (current.trim()) values.push(current.trim());
    return values;
  }
  function defaultArgument(expression, element) {
    const value2 = expression.trim();
    if (value2 === "this.value") return element.value;
    if (value2 === "this.value||null") return element.value || null;
    if (value2 === "this.textContent") return element.textContent;
    if (value2 === "this") return element;
    if (value2 === "true") return true;
    if (value2 === "false") return false;
    if (value2 === "null") return null;
    if (/^-?\d+(?:\.\d+)?$/.test(value2)) return Number(value2);
    if (value2.startsWith("'") && value2.endsWith("'") || value2.startsWith('"') && value2.endsWith('"')) return value2.slice(1, -1).replace(/\\(['"\\])/g, "$1");
    throw new Error("Argumento de evento não permitido: " + value2);
  }
  function createDelegatedEventsController({ document: document2, handlers = {}, parseArgument = defaultArgument, resolveSpecial = () => false, onError = () => {
  }, eventTypes = ["click", "change", "input", "blur"] } = {}) {
    if (!document2) throw new TypeError("Controlador de eventos requer documento.");
    const dispatch = (code, event, element) => {
      const normalized = String(code || "").trim();
      if (!normalized) return;
      if (normalized === "event.stopPropagation()") {
        event.stopPropagation();
        return;
      }
      if (normalized.startsWith("event.stopPropagation();")) {
        event.stopPropagation();
        return dispatch(normalized.slice(24), event, element);
      }
      if (resolveSpecial(normalized, event, element)) return;
      const match = normalized.match(/^([A-Za-z_$][\w$]*)\((.*)\)$/s), fn = match && handlers[match[1]];
      if (!match || typeof fn !== "function") throw new Error("Ação de evento não permitida: " + normalized);
      fn(...match[2].trim() ? splitArguments(match[2]).map((argument) => parseArgument(argument, element)) : []);
    };
    const listeners = [];
    const register = () => {
      eventTypes.forEach((type) => {
        const listener = (event) => {
          const key = `delegated${type[0].toUpperCase() + type.slice(1)}`, attribute = `data-${key.replace(/[A-Z]/g, (char) => "-" + char.toLowerCase())}`, element = event.target?.closest?.(`[${attribute}]`);
          if (!element) return;
          try {
            dispatch(element.dataset[key], event, element);
          } catch (error) {
            onError(error, event, element);
          }
        };
        document2.addEventListener(type, listener, type === "blur");
        listeners.push([type, listener]);
      });
      return api;
    };
    const destroy = () => listeners.splice(0).forEach(([type, listener]) => document2.removeEventListener(type, listener, type === "blur"));
    const api = Object.freeze({ dispatch, register, destroy });
    return api;
  }

  // src/ui/renderers/application-renderer.js
  function createApplicationRenderer({ sections = [], scopes = {}, globalSections = [], getActiveScope = () => null, afterRender = () => {
  }, onError = () => {
  } } = {}) {
    const globals = new Set(globalSections);
    const render2 = (scope = "all") => {
      const selected = scope === "all" ? null : scopes[scope === "active" ? getActiveScope() : scope];
      sections.filter(([name]) => !selected || globals.has(name) || selected.has(name)).forEach(([name, renderer]) => {
        try {
          renderer();
        } catch (error) {
          onError(error, name);
        }
      });
      afterRender();
      return scope;
    };
    return Object.freeze({ render: render2 });
  }

  // src/application/goals/goal-service.js
  var clamp6 = (value2, min = 0, max = Infinity) => Math.max(min, Math.min(max, Number(value2) || 0));
  function createGoalService({ repository, getDayOfWeek } = {}) {
    if (!repository || typeof repository.getGoals !== "function") throw new TypeError("Serviço de metas requer repositório.");
    return Object.freeze({
      hoursForDay: (day) => clamp6(repository.getGoals()?.horasPorDia?.[String(day)] ?? repository.getGoals()?.horasDiarias, 0, 24),
      hoursForDate: (date2) => clamp6(repository.getGoals()?.horasPorDia?.[String(getDayOfWeek(date2))] ?? repository.getGoals()?.horasDiarias, 0, 24),
      updateDailyHours: (day, value2, { isToday = false } = {}) => {
        const hours = clamp6(value2, 0, 24);
        repository.updateDailyHours(day, hours);
        if (isToday) repository.updateGoal("horasDiarias", hours);
        return hours;
      },
      applyHoursToEveryDay: (value2) => {
        const hours = clamp6(value2, 0, 24);
        for (let day = 0; day < 7; day++) repository.updateDailyHours(day, hours);
        repository.updateGoal("horasDiarias", hours);
        return hours;
      },
      clearWeekend: () => {
        repository.updateDailyHours(0, 0);
        repository.updateDailyHours(6, 0);
      },
      update: (key, value2) => repository.updateGoal(key, key === "metaAprovacao" ? clamp6(value2, 0, 100) : clamp6(value2))
    });
  }

  // src/application/goals/weekly-availability.js
  var clampHours = (value2) => Math.max(0, Math.min(24, Number(value2) || 0));
  function buildWeeklyAvailability(hoursByDay = {}) {
    const days = Array.from({ length: 7 }, (_, day) => ({ day, hours: clampHours(hoursByDay[String(day)] ?? hoursByDay[day]) }));
    const totalHours = Math.round(days.reduce((sum3, item) => sum3 + item.hours, 0) * 100) / 100;
    const activeDays = days.filter((item) => item.hours > 0).length;
    const averageHours = activeDays ? Math.round(totalHours / activeDays * 100) / 100 : 0;
    const peakHours = Math.max(0, ...days.map((item) => item.hours));
    return { days, totalHours, totalMinutes: Math.round(totalHours * 60), activeDays, averageHours, peakHours, state: totalHours ? "configured" : "empty" };
  }

  // src/ui/view-models/priority-view-model.js
  var PRIORITY_FACTOR_LABELS = Object.freeze({
    examImpact: "Impacto na prova",
    retentionRisk: "Risco de retenção",
    masteryGap: "Lacuna de domínio",
    reviewUrgency: "Urgência da revisão",
    reviewHealthRisk: "Saúde da revisão",
    planAlignment: "Alinhamento com o plano",
    recencyRisk: "Tempo sem contato"
  });
  function buildPriorityViewModel(item = {}, position = 1) {
    const score = item.score == null || item.score === "" ? null : Number.isFinite(Number(item.score)) ? Math.max(0, Math.min(100, Math.round(Number(item.score)))) : null;
    const evidenceStrength = Number(item.evidence?.evidenceStrength) || 0;
    const state2 = item.blockedPrerequisites?.length ? "blocked" : item.reviewHealth?.level === "critical" ? "review" : evidenceStrength < 0.35 ? "limited" : score >= 70 ? "high" : "calculated";
    const stateLabels = { blocked: "Bloqueado por pré-requisito", review: "Revisão recomendada", limited: "Poucos dados", high: "Prioridade elevada", calculated: "Prioridade calculada" };
    const contributionRows = Object.entries(item.contributions || {}).map(([key, value2]) => ({
      key,
      label: PRIORITY_FACTOR_LABELS[key] || key,
      value: Math.max(0, Math.round(Number(value2) || 0)),
      factor: item.factors?.[key] ?? null
    })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
    return {
      position,
      score,
      state: state2,
      stateLabel: stateLabels[state2],
      contributionRows,
      completeness: Math.round((Number(item.evidence?.completeness) || 0) * 100),
      evidenceLabel: item.evidence?.evidenceLabel || "Não avaliada",
      reasons: (item.reasons || []).filter(Boolean)
    };
  }

  // src/application/analytics/build-overview-view-model.js
  var sum = (items, selector) => items.reduce((total, item) => total + (Number(selector(item)) || 0), 0);
  function buildStudyTimeViewModel({ sessions = [], today, weekStart, monthStart, hoursForDate, addDays: addDays2 } = {}) {
    const dated = sessions.filter((item) => item.date), totalSeconds = sum(dated, (item) => item.durationSeconds), todaySeconds = sum(dated.filter((item) => item.date === today), (item) => item.durationSeconds), weekSeconds = sum(dated.filter((item) => item.date >= weekStart && item.date <= today), (item) => item.durationSeconds), monthSeconds = sum(dated.filter((item) => item.date >= monthStart && item.date <= today), (item) => item.durationSeconds);
    const firstRecent = dated.filter((item) => item.date >= addDays2(today, -29) && item.date <= today).map((item) => item.date).sort()[0] || null;
    const days = firstRecent ? Math.floor((/* @__PURE__ */ new Date(today + "T00:00:00") - /* @__PURE__ */ new Date(firstRecent + "T00:00:00")) / 864e5) + 1 : 0, recent = firstRecent ? dated.filter((item) => item.date >= firstRecent && item.date <= today) : [], realized = sum(recent, (item) => item.durationSeconds);
    let planned = 0;
    for (let index = 0; index < days; index++) planned += hoursForDate(addDays2(firstRecent, index)) * 3600;
    const elapsed = Math.floor((/* @__PURE__ */ new Date(today + "T00:00:00") - /* @__PURE__ */ new Date(weekStart + "T00:00:00")) / 864e5) + 1, byDate = Object.groupBy ? Object.groupBy(dated.filter((item) => item.date >= weekStart && item.date <= today), (item) => item.date) : dated.filter((item) => item.date >= weekStart && item.date <= today).reduce((map, item) => {
      var _a;
      return (map[_a = item.date] ?? (map[_a] = [])).push(item), map;
    }, {});
    let achieved = 0;
    for (let index = 0; index < elapsed; index++) {
      const date2 = addDays2(weekStart, index), target = hoursForDate(date2) * 3600, actual = sum(byDate[date2] || [], (item) => item.durationSeconds);
      if (target > 0 && actual >= target) achieved++;
    }
    const targetSeconds = hoursForDate(today) * 3600;
    return { todaySeconds, weekSeconds, monthSeconds, totalSeconds, targetSeconds, todayGoalPct: targetSeconds > 0 ? Math.round(todaySeconds / targetSeconds * 100) : 0, consistency: { achieved, elapsed }, pace: { secondsPerDay: days ? realized / days : 0, days }, dedication: { score: planned > 0 ? Math.min(100, Math.round(realized / planned * 100)) : 0, realized, planned, days } };
  }

  // src/application/alert-lifecycle.js
  var severityOrder = { high: 3, medium: 2, low: 1, ok: 0 };
  function reconcileAlerts(alerts = [], states = [], today, addDays2) {
    const activeIds = new Set(alerts.map((item) => item.id)), stateMap = new Map(states.map((item) => [item.alertId, item]));
    alerts.forEach((alert) => {
      const current = stateMap.get(alert.id) || { alertId: alert.id, dismissedUntil: null, resolvedAt: null };
      current.resolvedAt = null;
      stateMap.set(alert.id, current);
    });
    stateMap.forEach((state2, id) => {
      if (!activeIds.has(id) && !state2.resolvedAt) state2.resolvedAt = today;
    });
    const nextStates = [...stateMap.values()];
    const visible = alerts.filter((alert) => {
      const state2 = stateMap.get(alert.id);
      return !state2?.dismissedUntil || state2.dismissedUntil < today;
    }).sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)).slice(0, 5);
    return { visible, states: nextStates };
  }
  function dismissAlert(states = [], alertId, today, addDays2, days = 7) {
    const next = states.map((item) => ({ ...item }));
    let state2 = next.find((item) => item.alertId === alertId);
    if (!state2) {
      state2 = { alertId, resolvedAt: null, dismissedUntil: null };
      next.push(state2);
    }
    state2.dismissedUntil = addDays2(today, days);
    return next;
  }

  // src/domain/forecasts/performance-forecast.js
  var clamp7 = (value2, min = 0, max = 100) => Math.max(min, Math.min(max, value2));
  function confidenceLabel2(value2) {
    return value2 >= 0.7 ? "Alta" : value2 >= 0.35 ? "Média" : "Baixa";
  }
  function dayNumber(date2) {
    const timestamp2 = Date.parse(`${date2}T00:00:00Z`);
    return Number.isFinite(timestamp2) ? timestamp2 / 864e5 : null;
  }
  function normalizeObservations(observations) {
    return (Array.isArray(observations) ? observations : []).map((item) => ({ date: item?.date, value: Number(item?.value), sampleSize: Number(item?.sampleSize) })).filter((item) => dayNumber(item.date) !== null && Number.isFinite(item.value) && item.value >= 0 && item.value <= 100 && Number.isFinite(item.sampleSize) && item.sampleSize > 0).sort((a, b) => a.date.localeCompare(b.date));
  }
  function buildPerformanceForecast({ currentValue = null, currentConfidence = 0, targetScore = 80, observations = [] } = {}) {
    const current = currentValue === null || currentValue === void 0 ? NaN : Number(currentValue), confidence = clamp7(Number(currentConfidence) || 0, 0, 1), target = clamp7(Number(targetScore) || 80);
    const normalized = normalizeObservations(observations);
    const sampleSize = normalized.reduce((sum3, item) => sum3 + item.sampleSize, 0);
    const observationCount = normalized.length;
    const periodStart = normalized[0]?.date || null, periodEnd = normalized.at(-1)?.date || null;
    const spanDays = periodStart && periodEnd ? Math.round(dayNumber(periodEnd) - dayNumber(periodStart)) : 0;
    const evidence = { sampleSize, observationCount, periodStart, periodEnd, spanDays, ...describeScoreEvidence({ completeness: Number.isFinite(current) ? 1 : 0, evidenceStrength: Number.isFinite(current) ? confidence : null }) };
    if (!Number.isFinite(current) || current < 0 || current > 100) {
      return { available: false, currentBand: null, gap: null, movingAverage: null, forecast30: { available: false, reason: "A faixa atual ainda não possui dados suficientes." }, evidence };
    }
    const margin = Math.max(4, Math.round(18 * (1 - confidence)));
    const currentBand = { central: Math.round(current), low: Math.round(clamp7(current - margin)), high: Math.round(clamp7(current + margin)), confidence, confidenceLabel: confidenceLabel2(confidence) };
    const gap = { minimum: Math.max(0, Math.round(target - currentBand.high)), maximum: Math.max(0, Math.round(target - currentBand.low)), target };
    const recent = normalized.slice(-3), recentSample = recent.reduce((sum3, item) => sum3 + item.sampleSize, 0);
    const movingAverage = recentSample ? Math.round(recent.reduce((sum3, item) => sum3 + item.value * item.sampleSize, 0) / recentSample) : null;
    if (observationCount < 4 || sampleSize < 120 || spanDays < 21) {
      const needs = [];
      if (observationCount < 4) needs.push(`${4 - observationCount} semana(s) adicional(is)`);
      if (sampleSize < 120) needs.push(`${120 - sampleSize} questão(ões) adicional(is)`);
      if (spanDays < 21) needs.push("ao menos 21 dias de histórico");
      return { available: true, currentBand, gap, movingAverage, forecast30: { available: false, reason: `Aguardando ${needs.join(", ")}.` }, evidence };
    }
    const origin = dayNumber(periodStart), points = normalized.map((item) => ({ x: dayNumber(item.date) - origin, y: item.value, w: item.sampleSize }));
    const weight = points.reduce((sum3, item) => sum3 + item.w, 0);
    const meanX = points.reduce((sum3, item) => sum3 + item.x * item.w, 0) / weight, meanY = points.reduce((sum3, item) => sum3 + item.y * item.w, 0) / weight;
    const denominator = points.reduce((sum3, item) => sum3 + item.w * (item.x - meanX) ** 2, 0);
    const rawSlope = denominator ? points.reduce((sum3, item) => sum3 + item.w * (item.x - meanX) * (item.y - meanY), 0) / denominator : 0;
    const forecastConfidence = clamp7(Math.min(1, observationCount / 8) * 0.35 + Math.min(1, sampleSize / 300) * 0.4 + Math.min(1, spanDays / 56) * 0.25);
    const slopePerDay = clamp7(rawSlope, -1, 1) * (0.35 + forecastConfidence * 0.35);
    const projected = clamp7(normalized.at(-1).value + slopePerDay * 30);
    const forecastMargin = Math.max(margin, Math.round(16 * (1 - forecastConfidence)));
    const forecast30 = { available: true, central: Math.round(projected), low: Math.round(clamp7(projected - forecastMargin)), high: Math.round(clamp7(projected + forecastMargin)), confidence: forecastConfidence, confidenceLabel: confidenceLabel2(forecastConfidence), slopePerWeek: Math.round(slopePerDay * 70) / 10, reason: null, evidence: describeScoreEvidence({ completeness: 1, evidenceStrength: forecastConfidence }) };
    return { available: true, currentBand, gap, movingAverage, forecast30, evidence };
  }

  // src/application/demo/demo-mode.js
  var APP_MODES = Object.freeze({ REAL: "real", DEMO: "demo" });
  function readAppMode(storage) {
    try {
      return storage?.getItem("bb-premium-mode") === APP_MODES.DEMO ? APP_MODES.DEMO : APP_MODES.REAL;
    } catch (error) {
      return APP_MODES.REAL;
    }
  }
  function enterDemoMode(storage) {
    storage?.setItem("bb-premium-mode", APP_MODES.DEMO);
    return APP_MODES.DEMO;
  }
  function exitDemoMode(storage, demoKey = "bb-premium-study-demo") {
    storage?.removeItem(demoKey);
    storage?.setItem("bb-premium-mode", APP_MODES.REAL);
    return APP_MODES.REAL;
  }
  function resetDemoMode(storage, demoKey = "bb-premium-study-demo") {
    storage?.removeItem(demoKey);
    storage?.setItem("bb-premium-mode", APP_MODES.DEMO);
    return APP_MODES.DEMO;
  }

  // src/demo/demo-generator.js
  var SUBJECTS = [
    ["Português", ["Interpretação de texto", "Gramática", "Concordância", "Regência", "Crase", "Pontuação", "Redação oficial", "Semântica"]],
    ["Matemática", ["Razões e proporções", "Porcentagem", "Equações", "Funções", "Probabilidade", "Estatística", "Geometria", "Matemática financeira"]],
    ["Direito Constitucional", ["Princípios fundamentais", "Direitos fundamentais", "Organização do Estado", "Poder Legislativo", "Poder Executivo", "Poder Judiciário", "Controle de constitucionalidade", "Administração pública"]],
    ["Direito Administrativo", ["Atos administrativos", "Poderes administrativos", "Agentes públicos", "Licitações", "Contratos", "Serviços públicos", "Responsabilidade civil", "Improbidade"]],
    ["Informática", ["Sistemas operacionais", "Editores de texto", "Planilhas", "Internet", "Segurança da informação", "Redes", "Banco de dados", "Computação em nuvem"]],
    ["Conhecimentos Bancários", ["Sistema financeiro", "Produtos bancários", "Mercado financeiro", "Câmbio", "Garantias", "Prevenção à fraude", "Atendimento", "Atualidades financeiras"]]
  ];
  var ERROR_KEYS = ["naoSabia", "esqueci", "interpretacao", "calculo", "desatencao", "chute"];
  var TYPES = ["questions", "study", "questions", "review", "questions"];
  var DEMO_SCENARIO = Object.freeze({ days: 90, subjects: 6, sessions: 120, simulations: 9, seed: "studytrack-demo-v2" });
  function hashSeed(value2) {
    let hash = 2166136261;
    for (const char of String(value2)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function randomFactory(seed) {
    let value2 = hashSeed(seed) || 1;
    return () => {
      value2 += 1831565813;
      let next = value2;
      next = Math.imul(next ^ next >>> 15, next | 1);
      next ^= next + Math.imul(next ^ next >>> 7, next | 61);
      return ((next ^ next >>> 14) >>> 0) / 4294967296;
    };
  }
  function shiftDate(iso, days) {
    const [year, month, day] = iso.split("-").map(Number), date2 = new Date(Date.UTC(year, month - 1, day + days));
    return date2.toISOString().slice(0, 10);
  }
  function timestamp(date2, hour = 12) {
    return `${date2}T${String(hour).padStart(2, "0")}:00:00.000Z`;
  }
  function distributeErrors(errors, random) {
    const result = Object.fromEntries(ERROR_KEYS.map((key) => [key, 0]));
    let remaining = errors;
    ERROR_KEYS.forEach((key, index) => {
      const count = index === ERROR_KEYS.length - 1 ? remaining : Math.min(remaining, Math.floor(random() * Math.max(1, errors * 0.32)));
      result[key] = count;
      remaining -= count;
    });
    return result;
  }
  function generateDemoData({ seed = DEMO_SCENARIO.seed, today } = {}) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today || "")) throw new TypeError("A demonstração requer a data local atual.");
    const random = randomFactory(`${seed}:${today}`), state2 = createDefaultState(), createdAt = timestamp(shiftDate(today, -89));
    state2.subjects = SUBJECTS.map(([name, topicNames], subjectIndex) => ({
      id: `demo-subject-${subjectIndex + 1}`,
      name,
      collapsed: false,
      archived: false,
      archivedAt: null,
      createdAt,
      topics: topicNames.map((topicName, topicIndex) => {
        const archived = topicIndex === 7 && subjectIndex === 4, status = topicIndex % 5 === 0 ? "Não iniciado" : topicIndex % 4 === 0 ? "Revisão" : topicIndex % 3 === 0 ? "Concluído" : "Em andamento";
        const lastDate = shiftDate(today, -Math.min(80, topicIndex * 6 + subjectIndex * 2));
        return { id: `demo-topic-${subjectIndex + 1}-${topicIndex + 1}`, name: topicName, link: "", status, archived, archivedAt: archived ? timestamp(shiftDate(today, -12)) : null, notes: topicIndex % 3 === 0 ? "Revisar pontos marcados no material principal." : "", tags: topicIndex % 2 ? ["edital"] : ["prioridade"], difficulty: ["Fácil", "Médio", "Difícil"][(topicIndex + subjectIndex) % 3], createdAt, firstCompletedAt: status === "Concluído" ? timestamp(shiftDate(today, -50)) : null, lastCompletedAt: status === "Concluído" ? timestamp(lastDate) : null, completionCount: status === "Concluído" ? 2 : 0, lastReviewedAt: status === "Revisão" || status === "Concluído" ? timestamp(lastDate) : null, reviewCount: status === "Revisão" || status === "Concluído" ? 1 + topicIndex % 3 : 0, examImportance: Math.round((0.45 + random() * 0.5) * 100) / 100, estimatedStudyMinutes: 120 + Math.floor(random() * 300), prerequisites: topicIndex === 0 ? [] : [`demo-topic-${subjectIndex + 1}-${topicIndex}`] };
      })
    }));
    const activeTopics2 = state2.subjects.flatMap((subject) => subject.topics.filter((topic) => !topic.archived).map((topic) => ({ subject, topic })));
    state2.studySessions = [];
    state2.questoes = [];
    const activeAges = Array.from({ length: 90 }, (_, age) => age).filter((age) => age % 7 !== 0 && age % 11 !== 0);
    for (let index = 0; index < 120; index++) {
      const age = activeAges[index % activeAges.length], date2 = shiftDate(today, -age), entry = activeTopics2[index % activeTopics2.length], type = TYPES[index % TYPES.length], durationMinutes = 25 + Math.floor(random() * 66);
      const session = { id: `demo-session-${index + 1}`, date: date2, startedAt: timestamp(date2, 8 + index % 11), endedAt: timestamp(date2, 9 + index % 11), durationSeconds: durationMinutes * 60, subjectId: entry.subject.id, topicId: entry.topic.id, planItemId: null, type, questionsResolved: 0, correctAnswers: 0, notes: index % 9 === 0 ? "Sessão demonstrativa com observação de progresso." : "", createdAt: timestamp(date2) };
      if (type === "questions") {
        const resolved = 22 + Math.floor(random() * 15), progress = (89 - age) / 89, subjectPenalty = entry.subject.id === "demo-subject-4" && age < 28 ? -10 : 0, rate = Math.max(42, Math.min(88, 54 + progress * 24 + subjectPenalty + (random() - 0.5) * 10)), correct = Math.round(resolved * rate / 100), errors = resolved - correct;
        session.questionsResolved = resolved;
        session.correctAnswers = correct;
        state2.questoes.push({ id: `demo-question-${state2.questoes.length + 1}`, date: date2, subjectId: entry.subject.id, topicId: entry.topic.id, resolved, correct, errorBreakdown: distributeErrors(errors, random), studySessionId: session.id, createdAt: timestamp(date2) });
      }
      state2.studySessions.push(session);
    }
    const simulationRates = [61, 64, 63, 67, 69, 72, 74, 76, 70];
    state2.simulados = simulationRates.map((rate, index) => {
      const date2 = shiftDate(today, -(80 - index * 10)), total = 100, correct = rate;
      return { id: `demo-simulation-${index + 1}`, date: date2, nome: `Simulado ${index + 1}`, total, correct, breakdown: state2.subjects.map((subject, subjectIndex) => {
        const rowTotal = subjectIndex < 4 ? 17 : 16, rowCorrect = Math.max(0, Math.min(rowTotal, Math.round(rowTotal * (rate + (subjectIndex - 2) * 2) / 100)));
        return { id: `demo-simulation-row-${index + 1}-${subjectIndex + 1}`, subjectId: subject.id, total: rowTotal, correct: rowCorrect };
      }), createdAt: timestamp(date2) };
    });
    state2.reviewAgenda = Array.from({ length: 42 }, (_, index) => {
      const entry = activeTopics2[index % activeTopics2.length], offset = index < 8 ? -(8 - index) : index - 8, date2 = shiftDate(today, offset), completed = index % 4 === 0;
      return { id: `demo-review-${index + 1}`, date: date2, subjectId: entry.subject.id, topicId: entry.topic.id, topicRef: entry.topic.id, topic: entry.topic.name, tipo: ["Revisão 24h", "Revisão 7 dias", "Revisão 30 dias"][index % 3], difficulty: ["Fácil", "Médio", "Difícil"][index % 3], status: completed ? "Concluído" : "Não iniciado", completedAt: completed ? timestamp(shiftDate(date2, index % 3 === 0 ? 2 : 0)) : null, manualDate: false, adaptive: true, adaptiveReason: "Intervalo ajustado pelo histórico demonstrativo.", suggestedDate: date2, baseIntervalDays: [1, 7, 30][index % 3], createdAt: timestamp(shiftDate(date2, -7)) };
    });
    state2.calendar = Array.from({ length: 24 }, (_, index) => {
      const entry = activeTopics2[index * 3 % activeTopics2.length], date2 = shiftDate(today, index - 6);
      return { id: `demo-calendar-${index + 1}`, date: date2, week: "", subjectId: entry.subject.id, topicId: entry.topic.id, subject: entry.subject.name, topic: entry.topic.name, status: index < 4 ? "Concluído" : "Não iniciado", reviewType: index % 2 ? "Questões" : "Revisão rápida", createdAt: timestamp(shiftDate(date2, -5)) };
    });
    state2.progressHistory = Array.from({ length: 90 }, (_, index) => ({ date: shiftDate(today, index - 89), pct: Math.min(82, 18 + Math.floor(index * 0.65)) }));
    state2.metas = { semanal: 12, mensal: 48, questoesSemanal: 220, simuladosSemanal: 1, metaAprovacao: 80, horasDiarias: 2.2, horasPorDia: { "0": 0, "1": 2.5, "2": 2.5, "3": 2, "4": 2.5, "5": 2, "6": 1 } };
    state2.examDate = shiftDate(today, 90);
    state2.examBlueprint = { examDate: state2.examDate, targetScore: 80, configuredAt: timestamp(today), subjects: state2.subjects.map((subject, index) => ({ subjectId: subject.id, expectedQuestions: index < 4 ? 18 : 14, questionWeight: index === 2 ? 1.5 : 1, priority: index < 2 ? "high" : index === 5 ? "low" : "normal" })) };
    state2.metasPorDisciplina = state2.subjects.map((subject, index) => ({ id: `demo-subject-goal-${index + 1}`, subjectId: subject.id, meta: 30 + index * 5, createdAt }));
    state2.dailyPlans = Array.from({ length: 14 }, (_, index) => {
      const date2 = shiftDate(today, index - 6), entryA = activeTopics2[index * 2 % activeTopics2.length], entryB = activeTopics2[(index * 2 + 1) % activeTopics2.length], past = index < 6;
      const items = [entryA, entryB].map((entry, itemIndex) => ({ id: `demo-plan-item-${index + 1}-${itemIndex + 1}`, subjectId: entry.subject.id, topicId: entry.topic.id, type: itemIndex ? "questions" : "study", plannedMinutes: itemIndex ? 35 : 45, executedSeconds: past ? itemIndex ? 2100 : 1800 : 0, status: past ? itemIndex ? "completed" : "partial" : "planned", originalDate: date2, currentDate: date2, rescheduleCount: index === 5 && itemIndex === 0 ? 1 : 0, skippedReason: null, recommendationId: null, lastExecutedAt: past ? timestamp(date2) : null }));
      return { id: `demo-daily-plan-${index + 1}`, date: date2, availableMinutes: 120, plannedMinutes: 80, flexMinutes: 40, createdAt: timestamp(date2), updatedAt: timestamp(date2), items };
    });
    const planItems = activeTopics2.slice(0, 12).map((entry, index) => ({ id: `demo-study-plan-topic-${index + 1}`, subjectId: entry.subject.id, subjectName: entry.subject.name, topicId: entry.topic.id, topicName: entry.topic.name, minutes: 45 + index % 3 * 15, estimatedMinutes: entry.topic.estimatedStudyMinutes, activityMix: { theory: 20, questions: 20, reviews: 5 } }));
    state2.studyPlans = [{ id: "demo-study-plan-1", state: "ready", confirmedAt: timestamp(shiftDate(today, -9)), examDate: state2.examDate, weeklyAvailableMinutes: 900, weeklyPlannedMinutes: planItems.reduce((sum3, item) => sum3 + item.minutes, 0), weeksUntilExam: 13, remainingMinutes: 6200, missingEffort: [], items: planItems, subjects: state2.subjects.map((subject) => ({ subjectId: subject.id, subjectName: subject.name, minutes: 120 })), activityMix: { theory: 300, questions: 300, reviews: 120 }, confidence: 0.84, confidenceLabel: "Alta", algorithmVersion: 1 }];
    state2.planAdjustments = [{ id: "demo-adjustment-1", periodStart: shiftDate(today, -7), periodEnd: shiftDate(today, 7), plannedMinutes: 480, executedMinutes: 350, deficitMinutes: 130, redistributedMinutes: 100, discardedMinutes: 30, allocations: [{ date: shiftDate(today, 1), minutes: 50 }, { date: shiftDate(today, 2), minutes: 50 }], confirmedAt: timestamp(shiftDate(today, -1)), status: "confirmed" }];
    state2.recommendationFeedback = Array.from({ length: 6 }, (_, index) => ({ id: `demo-feedback-${index + 1}`, recommendationId: `demo-recommendation-${index + 1}`, date: shiftDate(today, -index * 5), subjectId: state2.subjects[index % state2.subjects.length].id, topicId: activeTopics2[index].topic.id, accepted: index !== 4, completed: index < 3, useful: index < 3 ? index !== 2 : null, reasonSkipped: index === 4 ? "Preferiu outra disciplina" : null, resultingSessionId: index < 3 ? state2.studySessions[index].id : null, baseline: { accuracy: 52 + index * 3, questionVolume: 24 + index * 4, retentionScore: 45 + index * 2, daysSinceContact: 8 - index, measuredAt: timestamp(shiftDate(today, -index * 5)) }, outcome: index < 3 ? { accuracyAfter: 64 + index * 3, questionVolumeAfter: 22 + index * 12, nextReviewRating: index === 0 ? "Bom" : null, retentionAfter: 54 + index * 3, measuredAt: timestamp(shiftDate(today, -index * 5 + 2)), confidence: index === 0 ? "Estimativa" : "Mais confiável", attributionEligible: true, reasons: [] } : null, createdAt: timestamp(shiftDate(today, -index * 5)), completedAt: index < 3 ? timestamp(shiftDate(today, -index * 5)) : null }));
    state2.topicHistory = activeTopics2.flatMap((entry, index) => [{ id: `demo-history-start-${index + 1}`, type: "topic_created", date: shiftDate(today, -89 + index % 15), subjectId: entry.subject.id, topicId: entry.topic.id, createdAt: timestamp(shiftDate(today, -89 + index % 15)) }, ...entry.topic.status === "Concluído" ? [{ id: `demo-history-done-${index + 1}`, type: "topic_completed", date: shiftDate(today, -30 - index % 20), subjectId: entry.subject.id, topicId: entry.topic.id, createdAt: timestamp(shiftDate(today, -30 - index % 20)) }] : []]);
    state2.alertStates = [];
    state2.achievementsUnlocked = { primeira_sessao: timestamp(shiftDate(today, -88)), cem_questoes: timestamp(shiftDate(today, -70)) };
    state2.lastBackupAt = timestamp(today);
    state2.updatedAt = timestamp(today);
    return state2;
  }

  // src/storage/migration-service.js
  function runStateMigrations(data, { currentVersion, migrations } = {}) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new TypeError("Estado inválido para migração.");
    let version = Number(data.schemaVersion || 1);
    if (!Number.isInteger(version) || version < 1) throw new TypeError("Versão de estado inválida.");
    if (version > currentVersion) throw new RangeError(`Schema ${version} não suportado; máximo ${currentVersion}.`);
    while (version < currentVersion) {
      const migrate = migrations[version];
      if (typeof migrate !== "function") throw new Error(`Migração ausente: v${version} para v${version + 1}.`);
      data = migrate(data) || data;
      version += 1;
      data.schemaVersion = version;
    }
    data.schemaVersion = currentVersion;
    return data;
  }
  function validateBackupEnvelope(data, { currentVersion, arrayFields = [] } = {}) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return { valid: false, message: "O arquivo não contém um objeto de backup válido." };
    if (!Array.isArray(data.subjects)) return { valid: false, message: "O backup não contém uma lista válida de disciplinas." };
    const version = Number(data.schemaVersion || 1);
    if (!Number.isInteger(version) || version < 1) return { valid: false, message: "A versão do backup é inválida." };
    if (version > currentVersion) return { valid: false, message: `Este backup usa a versão ${version}, mas este aplicativo aceita até a versão ${currentVersion}. Abra-o em uma versão mais recente do aplicativo.` };
    const invalidField = arrayFields.find((field) => field in data && !Array.isArray(data[field]));
    if (invalidField) return { valid: false, message: `O campo "${invalidField}" está em um formato incompatível.` };
    if (data.subjects.some((subject) => !subject || typeof subject !== "object" || "topics" in subject && !Array.isArray(subject.topics))) return { valid: false, message: "Uma ou mais disciplinas do backup estão em formato incompatível." };
    if ("metas" in data && (!data.metas || typeof data.metas !== "object" || Array.isArray(data.metas))) return { valid: false, message: "As metas do backup estão em formato incompatível." };
    return { valid: true, version };
  }

  // src/storage/backup-service.js
  function serializeBackup(state2, { space = 2 } = {}) {
    if (!state2 || typeof state2 !== "object") throw new TypeError("Estado inválido para backup.");
    return JSON.stringify(state2, null, space);
  }
  function backupFileName(date2, { recovery = false } = {}) {
    return `${recovery ? "recuperacao" : "backup"}-extrato-estudos-${date2}.json`;
  }

  // src/repositories/reviews-repository.js
  function createReviewsRepository({ getState } = {}) {
    if (typeof getState !== "function") throw new TypeError("Repositório de revisões requer acesso ao estado.");
    const items = () => Array.isArray(getState()?.reviewAgenda) ? getState().reviewAgenda : [];
    return Object.freeze({
      all: () => items(),
      findById: (id) => items().find((item) => item.id === id) || null,
      listPending: () => items().filter((item) => item.status !== "Concluído"),
      add: (review) => {
        items().push(review);
        return review;
      },
      update: (id, changes) => {
        const review = items().find((item) => item.id === id);
        if (!review) return null;
        Object.assign(review, changes);
        return review;
      },
      remove: (id) => {
        const list = items(), index = list.findIndex((item) => item.id === id);
        return index < 0 ? null : list.splice(index, 1)[0];
      },
      hasPendingForTopic: (topicId, date2, { exceptId = null } = {}) => items().some((item) => item.id !== exceptId && (item.topicId || item.topicRef) === topicId && item.status !== "Concluído" && (!date2 || item.date === date2))
    });
  }

  // src/repositories/planning-repository.js
  function createPlanningRepository({ getState } = {}) {
    if (typeof getState !== "function") throw new TypeError("Repositório de planejamento requer acesso ao estado.");
    const state2 = () => getState(), plans = () => state2().studyPlans || [], daily = () => state2().dailyPlans || [], adjustments = () => state2().planAdjustments || [];
    const save = (list) => (item) => {
      const current = list().find((entry) => entry.id === item.id);
      if (current) {
        Object.assign(current, item);
        return current;
      }
      list().push(item);
      return item;
    };
    return Object.freeze({ getStudyPlans: () => plans(), getActiveStudyPlan: () => [...plans()].sort((a, b) => String(b.confirmedAt || "").localeCompare(String(a.confirmedAt || "")))[0] || null, saveStudyPlan: save(plans), getDailyPlans: () => daily(), getDailyPlan: (date2) => daily().find((plan) => plan.date === date2) || null, saveDailyPlan: save(daily), getAdjustments: () => adjustments(), findAdjustment: (id) => adjustments().find((item) => item.id === id) || null, saveAdjustment: save(adjustments) });
  }

  // src/repositories/sessions-repository.js
  function createSessionsRepository({ getState, normalize = normalizeStudySession } = {}) {
    if (typeof getState !== "function") throw new TypeError("Repositório de sessões requer acesso ao estado.");
    const items = () => {
      const sessions = Array.isArray(getState()?.studySessions) ? getState().studySessions : [];
      sessions.forEach((session, index) => {
        sessions[index] = normalize(session);
      });
      return sessions;
    };
    return Object.freeze({
      all: () => items(),
      findById: (id) => items().find((item) => item.id === id) || null,
      add: (session) => {
        const normalized = normalize(session);
        if (items().some((item) => item.id === normalized.id)) return items().find((item) => item.id === normalized.id);
        items().push(normalized);
        return normalized;
      },
      update: (id, changes) => {
        const list = items(), index = list.findIndex((item) => item.id === id);
        if (index < 0) return null;
        list[index] = normalize({ ...list[index], ...changes, id });
        return list[index];
      },
      remove: (id) => {
        const list = items(), index = list.findIndex((item) => item.id === id);
        return index < 0 ? null : list.splice(index, 1)[0];
      },
      listByPeriod: ({ start = null, end = null } = {}) => items().filter((item) => (!start || item.date >= start) && (!end || item.date <= end)),
      listByTopic: (topicId) => items().filter((item) => item.topicId === topicId),
      listByPlanItem: (planItemId) => items().filter((item) => item.planItemId === planItemId)
    });
  }

  // src/repositories/subjects-repository.js
  function createSubjectsRepository({ getState } = {}) {
    if (typeof getState !== "function") throw new TypeError("Repositório de disciplinas requer acesso ao estado.");
    const subjects = () => Array.isArray(getState()?.subjects) ? getState().subjects : [];
    const findTopic = (topicId) => {
      for (const subject of subjects()) {
        const topic = (subject.topics || []).find((item) => item.id === topicId);
        if (topic) return { subject, topic };
      }
      return null;
    };
    return Object.freeze({ all: () => subjects(), findById: (id) => subjects().find((item) => item.id === id) || null, findTopic, add: (subject) => {
      subjects().push(subject);
      return subject;
    }, insertAfter: (afterId, subject) => {
      const index = subjects().findIndex((item) => item.id === afterId);
      subjects().splice(index < 0 ? subjects().length : index + 1, 0, subject);
      return subject;
    }, update: (id, changes) => {
      const subject = subjects().find((item) => item.id === id);
      if (!subject) return null;
      Object.assign(subject, changes);
      return subject;
    }, remove: (id) => {
      const list = subjects(), index = list.findIndex((item) => item.id === id);
      return index < 0 ? null : list.splice(index, 1)[0];
    }, addTopic: (subjectId, topic) => {
      const subject = subjects().find((item) => item.id === subjectId);
      if (!subject) return null;
      (subject.topics || (subject.topics = [])).push(topic);
      return topic;
    }, updateTopic: (subjectId, topicId, changes) => {
      const found = findTopic(topicId);
      if (!found || found.subject.id !== subjectId) return null;
      Object.assign(found.topic, changes);
      return found.topic;
    }, removeTopic: (subjectId, topicId) => {
      const subject = subjects().find((item) => item.id === subjectId);
      if (!subject) return null;
      const index = (subject.topics || []).findIndex((item) => item.id === topicId);
      return index < 0 ? null : subject.topics.splice(index, 1)[0];
    }, swap: (firstId, secondId) => {
      const list = subjects(), first = list.findIndex((item) => item.id === firstId), second = list.findIndex((item) => item.id === secondId);
      if (first < 0 || second < 0) return false;
      [list[first], list[second]] = [list[second], list[first]];
      return true;
    } });
  }

  // src/repositories/settings-repository.js
  function createSettingsRepository({ getState } = {}) {
    if (typeof getState !== "function") throw new TypeError("Repositório de configurações requer estado.");
    const state2 = () => getState();
    return Object.freeze({
      getGoals: () => state2().metas,
      updateGoal: (key, value2) => {
        state2().metas[key] = value2;
        return state2().metas;
      },
      updateDailyHours: (day, value2) => {
        state2().metas.horasPorDia[String(day)] = value2;
        return state2().metas;
      },
      getSubjectGoals: () => state2().metasPorDisciplina
    });
  }

  // src/repositories/collection-repository.js
  function createCollectionRepository({ getState, field } = {}) {
    if (typeof getState !== "function" || !field) throw new TypeError("Repositório requer estado e coleção.");
    const collection = () => {
      const value2 = getState()?.[field];
      return Array.isArray(value2) ? value2 : [];
    };
    return Object.freeze({
      all: () => collection(),
      findById: (id) => collection().find((item) => item.id === id) || null,
      add: (item) => {
        collection().push(item);
        return item;
      },
      remove: (id) => {
        const items = collection(), index = items.findIndex((item) => item.id === id);
        return index < 0 ? null : items.splice(index, 1)[0];
      },
      update: (id, changes) => {
        const item = collection().find((entry) => entry.id === id);
        if (!item) return null;
        Object.assign(item, changes);
        return item;
      }
    });
  }
  function createAppRepositories(getState) {
    const repositories = Object.fromEntries(["calendar", "questoes", "simulados", "dailyPlans", "studyPlans", "recommendationFeedback", "topicHistory", "metasPorDisciplina"].map((field) => [field, createCollectionRepository({ getState, field })]));
    repositories.subjects = createSubjectsRepository({ getState });
    repositories.studySessions = createSessionsRepository({ getState });
    repositories.reviewAgenda = createReviewsRepository({ getState });
    repositories.planning = createPlanningRepository({ getState });
    repositories.settings = createSettingsRepository({ getState });
    return Object.freeze(repositories);
  }

  // src/application/reviews/review-service.js
  var REVIEW_TYPES = Object.freeze({ 1: "Revisão 24h", 3: "Revisão 3 dias", 7: "Revisão 7 dias", 14: "Revisão 14 dias", 15: "Revisão 15 dias", 30: "Revisão 30 dias" });
  function reviewTypeForDays(days) {
    return REVIEW_TYPES[Number(days)] || "Revisão livre";
  }
  function createReviewService({ repository, clock, idGenerator, findTopic = () => null, calculateAdaptiveState, algorithmVersion = () => 1, onEvent = () => {
  }, onTopicChanged = () => {
  } } = {}) {
    if (!repository || typeof repository.findById !== "function") throw new TypeError("Serviço de revisões requer repositório.");
    if (!clock || typeof clock.today !== "function" || typeof clock.nowISO !== "function") throw new TypeError("Serviço de revisões requer relógio.");
    if (typeof idGenerator !== "function") throw new TypeError("Serviço de revisões requer gerador de IDs.");
    const topicIdOf = (review) => review?.topicId || review?.topicRef || null;
    const complete = (review, completedAt = clock.nowISO()) => {
      if (!review || review.status === "Concluído") return review || null;
      repository.update(review.id, { status: "Concluído", completedAt });
      onEvent("review_completed", review, { reviewId: review.id, reviewType: review.tipo });
      if (topicIdOf(review)) onTopicChanged(topicIdOf(review));
      return review;
    };
    return Object.freeze({
      completeReview: (id) => complete(repository.findById(id)),
      createManualReview: (input) => repository.add({ id: idGenerator("review"), topicId: null, date: clock.today(), subjectId: null, topic: "", tipo: "Revisão livre", status: "Não iniciado", adaptive: false, manualDate: true, adaptiveReason: null, suggestedDate: null, baseIntervalDays: 7, createdAt: clock.nowISO(), completedAt: null, ...input }),
      removeReview: (id) => repository.remove(id),
      rescheduleReview: (id, date2) => repository.update(id, { date: date2, manualDate: true, adaptive: false }),
      restoreAdaptiveSchedule: (id, suggestion) => repository.update(id, { date: suggestion.date, suggestedDate: suggestion.date, adaptiveReason: suggestion.reason, manualDate: false, adaptive: true }),
      rateReview: (id, rating, { label = "adaptativa" } = {}) => {
        const review = repository.findById(id), topicId = topicIdOf(review), topic = topicId ? findTopic(topicId) : null;
        if (!review || !topicId || !topic || typeof calculateAdaptiveState !== "function") return null;
        const adaptiveState = calculateAdaptiveState(topic.adaptiveReview, rating, { reviewDate: clock.today(), algorithmVersion: algorithmVersion() });
        topic.adaptiveReview = adaptiveState;
        repository.update(id, { lastRating: rating, adaptiveState: structuredClone(adaptiveState), adaptiveReason: `Avaliação: ${label} · próximo intervalo: ${adaptiveState.intervalDays} dia${adaptiveState.intervalDays === 1 ? "" : "s"}` });
        complete(review);
        let next = null;
        if (!repository.hasPendingForTopic(topicId, adaptiveState.nextReviewDate, { exceptId: id })) next = repository.add({ id: idGenerator("review"), subjectId: review.subjectId || null, topicId, topicRef: topicId, topic: topic.name || review.topic || "", date: adaptiveState.nextReviewDate, suggestedDate: adaptiveState.nextReviewDate, baseIntervalDays: adaptiveState.intervalDays, adaptive: true, manualDate: false, adaptiveReason: `Agendada após avaliação ${label}.`, tipo: reviewTypeForDays(adaptiveState.intervalDays), status: "Não iniciado", lastRating: null, adaptiveState: structuredClone(adaptiveState), createdAt: clock.nowISO(), completedAt: null });
        onEvent("adaptive_review_rated", review, { reviewId: id, rating, intervalDays: adaptiveState.intervalDays, nextReviewDate: adaptiveState.nextReviewDate, algorithmVersion: adaptiveState.algorithmVersion });
        onTopicChanged(topicId);
        return { review, next, adaptiveState };
      }
    });
  }

  // src/ui/controllers/reviews-controller.js
  function createReviewsController({ root = document, actions } = {}) {
    if (!root || !actions) throw new TypeError("Controlador de revisões requer interface e ações.");
    const listen = (selector, event, handler) => root.querySelector(selector)?.addEventListener(event, handler);
    return Object.freeze({
      register() {
        root.querySelectorAll("[data-review-rating]").forEach((button) => button.addEventListener("click", () => actions.rate(button.dataset.reviewRating)));
        listen("#reviewRatingCancelBtn", "click", actions.cancelRating);
        for (const id of ["#agendaFilterSubject", "#agendaFilterStatus", "#agendaFilterMes", "#agendaFilterTipo"]) listen(id, "change", actions.filtersChanged);
        listen("#addAgendaRowBtn", "click", actions.createManual);
        listen("#autoGenBtn", "click", actions.generateAutomatic);
      }
    });
  }

  // src/ui/view-models/review-view-model.js
  function createReviewViewModel(review, { subjectName = "", topicName = "", difficulty = "Médio", formatDate = (value2) => value2 } = {}) {
    return Object.freeze({ id: review.id, date: review.date ? formatDate(review.date) : "Sem data", subject: subjectName || "Sem disciplina", topic: topicName || review.topic || "Sem tópico", type: review.tipo || "Revisão livre", difficulty, status: review.status || "Não iniciado", pending: review.status !== "Concluído", manualDate: Boolean(review.manualDate), lastRating: review.lastRating || null });
  }

  // src/ui/renderers/reviews-renderer.js
  function renderReviewRead({ item, view, mobile, escapeHtml: escapeHtml2, escapeAttr: escapeAttr2, daysPill, difficultyClass, statusClass, ratingLabel, today }) {
    if (mobile) return `<tr class="mobile-history-row" data-id="${item.id}"><td colspan="8"><article class="mobile-history-card review-mobile-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml2(view.date)} · ${escapeHtml2(view.status)}</div><div class="mobile-card-title">${escapeHtml2(view.subject)}</div><div class="mobile-card-subtitle">${escapeHtml2(view.topic)}</div></div><button class="btn ghost small" data-delegated-click="editAgenda('${item.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${escapeHtml2(view.type)}</span><span>${escapeHtml2(view.difficulty)}</span><span>${daysPill}</span></div><div class="mobile-card-actions">${view.pending ? `<button class="btn small history-primary-action" data-delegated-click="completeAgendaReview('${item.id}')">Concluir</button>` : ""}</div></article></td></tr>`;
    const mode = view.manualDate ? "Manual" : "Adaptativa", rating = view.lastRating ? ` · ${escapeHtml2(ratingLabel(view.lastRating))}` : "";
    const restore = view.manualDate && item.topicId ? ` · <button type="button" data-delegated-click="resetAdaptiveReviewDate('${item.id}')">usar sugestão</button>` : "";
    return `<tr class="history-read-row history-desktop-row ${item.date === today ? "today" : ""}" data-id="${item.id}"><td>${escapeHtml2(view.date)}<div class="review-date-mode" title="${escapeAttr2(item.adaptiveReason || "")}">${mode}${rating}${restore}</div></td><td><div class="row-primary">${escapeHtml2(view.subject)}</div></td><td><div class="row-secondary">${escapeHtml2(view.topic)}</div></td><td>${escapeHtml2(view.type)}</td><td><span class="dias-pill ${difficultyClass[view.difficulty] || ""}">${escapeHtml2(view.difficulty)}</span></td><td><span class="history-status ${statusClass[item.status] || ""}">${escapeHtml2(view.status)}</span></td><td>${daysPill}</td><td><div class="row-actions">${view.pending ? `<button class="btn small history-primary-action" data-delegated-click="completeAgendaReview('${item.id}')">Concluir</button>` : ""}<button class="btn ghost small" data-delegated-click="editAgenda('${item.id}')">Editar</button></div></td></tr>`;
  }
  function renderReviewEdit({ item, draft, subjectOptions, topicName, typeOptions, statusOptions, escapeAttr: escapeAttr2 }) {
    if (!draft) return "";
    return `<tr class="row-editing" data-id="${item.id}"><td colspan="8"><div class="inline-edit-form"><label>Data<input type="date" value="${draft.date || ""}" data-delegated-change="updateAgendaDraft('date',this.value)"></label><label>Disciplina<select ${draft.topicId ? 'disabled title="Definida pelo tópico vinculado"' : ""} data-delegated-change="updateAgendaDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectOptions}</select></label><label>Tópico<input type="text" value="${escapeAttr2(topicName)}" ${draft.topicId ? "readonly" : ""} data-delegated-input="updateAgendaDraft('topic',this.value)"></label><label>Tipo<select data-delegated-change="updateAgendaDraft('tipo',this.value)">${typeOptions}</select></label><label>Status<select data-delegated-change="updateAgendaDraft('status',this.value)">${statusOptions}</select></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelAgendaEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveAgendaEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteAgendaRow('${item.id}')">Excluir</button></div></div></td></tr>`;
  }

  // src/reports/report-data.js
  var sum2 = (items, selector) => items.reduce((total, item) => total + (Number(selector(item)) || 0), 0);
  var shiftDate2 = (iso, days) => {
    const [year, month, day] = iso.split("-").map(Number), date2 = new Date(Date.UTC(year, month - 1, day + days));
    return date2.toISOString().slice(0, 10);
  };
  var inPeriod = (item, start, end) => {
    const date2 = item.date || String(item.endedAt || item.createdAt || "").slice(0, 10);
    return Boolean(date2 && date2 >= start && date2 <= end);
  };
  function resolveReportPeriod({ preset = "30", start = null, end = null, generatedAt } = {}) {
    const today = String(generatedAt || (/* @__PURE__ */ new Date()).toISOString()).slice(0, 10);
    if (preset === "custom" && start && end && start <= end) return { preset, start, end, label: `${start} a ${end}` };
    const days = Math.max(1, Number(preset) || 30);
    return { preset: String(days), start: shiftDate2(today, -(days - 1)), end: today, label: `Últimos ${days} dias` };
  }
  function buildStrategicReport({ state: state2, generatedAt, isDemo = false, readiness = null, diagnosis = null, forecast = null, period } = {}) {
    const range = resolveReportPeriod({ ...period, generatedAt }), subjects = (state2.subjects || []).filter((item) => !item.archived), topics = subjects.flatMap((subject) => (subject.topics || []).filter((item) => !item.archived));
    const sessions = (state2.studySessions || []).filter((item) => inPeriod(item, range.start, range.end)), questions = (state2.questoes || []).filter((item) => inPeriod(item, range.start, range.end)), simulations = (state2.simulados || []).filter((item) => inPeriod(item, range.start, range.end)), reviews = (state2.reviewAgenda || []).filter((item) => inPeriod(item, range.start, range.end));
    const resolved = sum2(questions, (item) => item.resolved), correct = sum2(questions, (item) => item.correct), studySeconds = sum2(sessions, (item) => item.durationSeconds), simulationTotal = sum2(simulations, (item) => item.total), simulationCorrect = sum2(simulations, (item) => item.correct), activePlan = [...state2.studyPlans || []].reverse().find((item) => !item.undoneAt) || null, adjustments = (state2.planAdjustments || []).filter((item) => inPeriod(item, range.start, range.end)), feedback = (state2.recommendationFeedback || []).filter((item) => inPeriod(item, range.start, range.end));
    const bySubject = subjects.map((subject) => {
      const subjectSessions = sessions.filter((item) => item.subjectId === subject.id), subjectQuestions = questions.filter((item) => item.subjectId === subject.id), volume = sum2(subjectQuestions, (item) => item.resolved), hits = sum2(subjectQuestions, (item) => item.correct);
      return { id: subject.id, name: subject.name, studySeconds: sum2(subjectSessions, (item) => item.durationSeconds), questions: volume, accuracy: volume ? Math.round(hits / volume * 100) : null, completed: (subject.topics || []).filter((item) => !item.archived && item.status === "Concluído").length, total: (subject.topics || []).filter((item) => !item.archived).length };
    }).sort((a, b) => b.studySeconds - a.studySeconds), planned = sum2(state2.dailyPlans || [], (plan) => inPeriod(plan, range.start, range.end) ? sum2(plan.items || [], (item) => item.plannedMinutes) : 0), executed = Math.round(studySeconds / 60);
    return { title: isDemo ? "Relatório estratégico de demonstração" : "Relatório estratégico", isDemo, generatedAt, period: range, exam: { date: state2.examDate || state2.examBlueprint?.examDate || null, target: state2.examBlueprint?.targetScore ?? state2.metas?.metaAprovacao ?? null }, overview: { subjects: subjects.length, topics: topics.length, completedTopics: topics.filter((item) => item.status === "Concluído").length, studySeconds, resolved, accuracy: resolved ? Math.round(correct / resolved * 100) : null, simulations: simulations.length, simulationAverage: simulationTotal ? Math.round(simulationCorrect / simulationTotal * 100) : null, pendingReviews: reviews.filter((item) => item.status !== "Concluído").length, completedReviews: reviews.filter((item) => item.status === "Concluído").length }, readiness, forecast, activePlan, bySubject, simulations: simulations.map((item) => ({ date: item.date, name: item.nome || "Simulado", score: item.total ? Math.round(item.correct / item.total * 100) : null })), execution: { plannedMinutes: planned, executedMinutes: executed, adherence: planned ? Math.round(executed / planned * 100) : null, dailyPlans: (state2.dailyPlans || []).filter((item) => inPeriod(item, range.start, range.end)).length, replans: adjustments.filter((item) => ["applied", "confirmed"].includes(item.status)).length, undoneReplans: adjustments.filter((item) => item.status === "undone").length }, risks: (diagnosis?.bottlenecks || []).slice(0, 5), opportunities: (diagnosis?.opportunities || []).slice(0, 5), priorities: [...diagnosis?.bottlenecks || [], ...diagnosis?.opportunities || []].slice(0, 5), recommendations: { decisions: feedback.length, accepted: feedback.filter((item) => item.accepted).length, completed: feedback.filter((item) => item.completed).length, useful: feedback.filter((item) => item.useful === true).length, measured: feedback.filter((item) => item.outcome).length }, errors: Object.entries(questions.reduce((totals, item) => {
      Object.entries(item.errorBreakdown || {}).forEach(([key, value2]) => totals[key] = (totals[key] || 0) + (Number(value2) || 0));
      return totals;
    }, {})).sort((a, b) => b[1] - a[1]) };
  }

  // src/reports/report-template.js
  var escape = (value2) => String(value2 ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  var duration = (seconds) => `${Math.floor((seconds || 0) / 3600)}h ${Math.round((seconds || 0) % 3600 / 60)}min`;
  var value = (value2) => value2 == null ? "Dados insuficientes" : escape(value2);
  var date = (value2) => value2 ? String(value2).split("-").reverse().join("/") : "Não configurada";
  var bars = (items, getValue, getLabel) => {
    const max = Math.max(1, ...items.map(getValue));
    return items.length ? `<div class="report-bars">${items.map((item) => `<div><span>${escape(getLabel(item))}</span><i><b style="width:${Math.round(getValue(item) / max * 100)}%"></b></i><strong>${escape(getValue(item))}</strong></div>`).join("")}</div>` : "<p>Sem dados no período.</p>";
  };
  function renderStrategicReport(report) {
    const readiness = report.readiness?.value ?? report.readiness?.score ?? null, forecast = report.forecast?.forecast30, list = (items, formatter, empty) => items.length ? items.map(formatter).join("") : `<li>${empty}</li>`;
    return `<header><p class="report-kicker">STUDYTRACK</p><h1>${escape(report.title)}</h1><p>${escape(report.period.label)} · ${date(report.period.start)} a ${date(report.period.end)} · Gerado em ${escape(new Date(report.generatedAt).toLocaleString("pt-BR"))}${report.isDemo ? " · DADOS FICTÍCIOS" : ""}</p></header><div class="report-page-meta">${report.isDemo ? "DEMONSTRAÇÃO · " : ""}${escape(report.period.label)}</div>
<section><h2>Identificação da prova e resumo executivo</h2><p>Prova: <strong>${date(report.exam.date)}</strong> · Meta: <strong>${value(report.exam.target == null ? null : report.exam.target + "%")}</strong></p><div class="report-kpis"><div><strong>${report.overview.completedTopics}/${report.overview.topics}</strong><span>Tópicos concluídos</span></div><div><strong>${duration(report.overview.studySeconds)}</strong><span>Tempo estudado</span></div><div><strong>${value(report.overview.accuracy == null ? null : report.overview.accuracy + "%")}</strong><span>Taxa de acerto</span></div><div><strong>${value(readiness == null ? null : Math.round(readiness) + "/100")}</strong><span>Prontidão</span></div></div></section>
<section><h2>Planejamento versus execução</h2><div class="report-kpis report-kpis--three"><div><strong>${report.execution.plannedMinutes} min</strong><span>Planejado</span></div><div><strong>${report.execution.executedMinutes} min</strong><span>Executado</span></div><div><strong>${value(report.execution.adherence == null ? null : report.execution.adherence + "%")}</strong><span>Aderência</span></div></div></section>
<section><h2>Evolução e distribuição por disciplina</h2>${bars(report.bySubject, (item) => Math.round(item.studySeconds / 60), (item) => item.name)}<table><thead><tr><th>Disciplina</th><th>Conteúdo</th><th>Questões</th><th>Acerto</th></tr></thead><tbody>${report.bySubject.map((item) => `<tr><td>${escape(item.name)}</td><td>${item.completed}/${item.total}</td><td>${item.questions}</td><td>${value(item.accuracy == null ? null : item.accuracy + "%")}</td></tr>`).join("")}</tbody></table></section>
<section class="report-columns"><div><h2>Simulados</h2><ul>${list(report.simulations, (item) => `<li><strong>${escape(item.name)} · ${value(item.score == null ? null : item.score + "%")}</strong><span>${date(item.date)}</span></li>`, "Nenhum simulado no período.")}</ul></div><div><h2>Retenção e revisões</h2><p>${report.overview.completedReviews} concluídas · ${report.overview.pendingReviews} pendentes.</p><p>${forecast ? `Projeção em 30 dias: ${forecast.low}–${forecast.high}% (centro ${forecast.central}%).` : "Projeção ainda sem amostra suficiente."}</p></div></section>
<section class="report-columns"><div><h2>Riscos</h2><ul>${list(report.risks, (item) => `<li><strong>${escape(item.subjectName)} — ${escape(item.topicName)}</strong><span>${escape(item.reason || "Requer atenção")}</span></li>`, "Nenhum risco relevante.")}</ul></div><div><h2>Oportunidades</h2><ul>${list(report.opportunities, (item) => `<li><strong>${escape(item.subjectName)} — ${escape(item.topicName)}</strong><span>Retorno ${value(item.opportunityScore)}/100</span></li>`, "Nenhuma oportunidade calculada.")}</ul></div></section>
<section><h2>Erros e recomendações concluídas</h2><p>${report.recommendations.accepted}/${report.recommendations.decisions} recomendações aceitas · ${report.recommendations.completed} concluídas · ${report.recommendations.measured} com resultado medido.</p><p>${report.errors.length ? `Erros predominantes: ${report.errors.slice(0, 5).map(([key, count]) => `${escape(key)} (${count})`).join(", ")}.` : "Nenhuma categoria de erro no período."}</p></section><section><h2>Prioridades do próximo período</h2><ol>${list(report.priorities, (item) => `<li>${escape(item.subjectName)} — ${escape(item.topicName)}</li>`, "Mantenha o plano atual e gere novas evidências.")}</ol></section>`;
  }

  // src/reports/print-report.js
  function printStrategicReport({ document: document2, window: window2, report, render: render2 } = {}) {
    const container = document2?.getElementById("strategicPrintReport");
    if (!container || typeof render2 !== "function" || typeof window2?.print !== "function") throw new Error("Ambiente de impressão indisponível.");
    container.innerHTML = render2(report);
    container.dataset.ready = "true";
    window2.requestAnimationFrame(() => window2.print());
    return container;
  }

  // src/app.js
  var THEME_STORAGE_KEY = "bb-premium-theme";
  var MODE_FLASH_KEY = "bb-premium-mode-message";
  var TEST_MODE = new URLSearchParams(location.search).get("test") === "1";
  var APP_MODE = TEST_MODE ? APP_MODES.REAL : readAppMode(globalThis.sessionStorage);
  var IS_DEMO_MODE = APP_MODE === APP_MODES.DEMO;
  var suppressBeforeUnloadSave = false;
  var appClock = createClock();
  function nowISO2() {
    return appClock.nowISO();
  }
  var preferencesController = createPreferencesController({ document, storage: localStorage, key: THEME_STORAGE_KEY });
  function toggleTheme() {
    return preferencesController.toggle();
  }
  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);
  preferencesController.sync();
  document.getElementById("exportReportBtn")?.addEventListener("click", () => {
    const preset = document.getElementById("reportPeriodSelect")?.value || "30", period = { preset, start: document.getElementById("reportPeriodStart")?.value || null, end: document.getElementById("reportPeriodEnd")?.value || null };
    const diagnosis = generateDiagnosis(intelligenceCandidates()), report = buildStrategicReport({ state, generatedAt: nowISO2(), isDemo: IS_DEMO_MODE, readiness: readinessResult(computeApprovalMetrics()), diagnosis, forecast: projectPerformance(), period });
    printStrategicReport({ document, window, report, render: renderStrategicReport });
  });
  document.getElementById("reportPeriodSelect")?.addEventListener("change", (event) => {
    const custom = event.target.value === "custom";
    document.getElementById("reportPeriodStart").hidden = !custom;
    document.getElementById("reportPeriodEnd").hidden = !custom;
  });
  var ERROR_CATEGORIES = {
    naoSabia: { label: "Não sabia", icon: "📚" },
    esqueci: { label: "Esqueci", icon: "🧠" },
    interpretacao: { label: "Interpretação", icon: "📖" },
    calculo: { label: "Cálculo", icon: "➗" },
    desatencao: { label: "Desatenção", icon: "⚠️" },
    chute: { label: "Chute", icon: "🎲" }
  };
  var MIN_WEEKLY_QUESTIONS = 10;
  var MIN_TREND_WINDOW_QUESTIONS = 30;
  var MIN_TOPIC_TREND_WINDOW_QUESTIONS = 20;
  var MIN_ERROR_RECOMMENDATION_COUNT = 10;
  var MIN_ERROR_RECOMMENDATION_COVERAGE = 60;
  var DEFAULT_STREAK_WEEKS = 12;
  var streakView = { expanded: false, onlyActiveDays: false, metric: "hours", subjectId: "", selectedDate: null };
  var ERROR_RECOMMENDATIONS = {
    naoSabia: { action: "Revisar a teoria e os conceitos-base", studyType: "study", estimatedMinutes: 35, questions: 10 },
    esqueci: { action: "Fazer uma revisão curta e recuperar de memória", studyType: "review", estimatedMinutes: 25, questions: 15 },
    interpretacao: { action: "Resolver questões comentadas de interpretação", studyType: "questions", estimatedMinutes: 40, questions: 15 },
    calculo: { action: "Treinar exercícios de cálculo passo a passo", studyType: "questions", estimatedMinutes: 45, questions: 15 },
    desatencao: { action: "Resolver questões com conferência obrigatória", studyType: "questions", estimatedMinutes: 35, questions: 20 },
    chute: { action: "Reforçar conceitos antes de voltar às questões", studyType: "study", estimatedMinutes: 30, questions: 10 }
  };
  var DIAGNOSIS_STATUS_ICON = { "Crítico": "🔴", "Atenção": "🟠", "Acompanhamento": "🟡", "Em dia": "🟢" };
  var state = createDefaultState();
  function getSubjectById(subjectId) {
    return state.subjects.find((s) => s.id === subjectId) || null;
  }
  function getTopicById(topicId) {
    for (const subject of state.subjects) {
      const topic = subject.topics.find((t) => t.id === topicId);
      if (topic) return { subject, topic };
    }
    return null;
  }
  function getSubjectName(subjectId) {
    return getSubjectById(subjectId)?.name || "Disciplina removida";
  }
  function getTopicName(topicId) {
    return getTopicById(topicId)?.topic?.name || "Tópico removido";
  }
  function entitySubjectId(item) {
    if (item?.subjectId) return item.subjectId;
    return state.subjects.find((s) => s.name === item?.subject)?.id || null;
  }
  function entitySubjectName(item) {
    const id = entitySubjectId(item);
    return id ? getSubjectName(id) : item?.subject || "—";
  }
  function historicalLocalDate(value2) {
    if (typeof value2 === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value2)) return value2;
    return timestampToLocalDateISO(value2) || todayISO();
  }
  function normalizeHistoryEvent(event) {
    if (!event.id) event.id = uid("history");
    if (!event.occurredAt) event.occurredAt = event.date || nowISO2();
    if (!event.date) event.date = event.occurredAt;
    if (!event.localDate) event.localDate = historicalLocalDate(event.occurredAt || event.date);
    if (!event.metadata || typeof event.metadata !== "object") event.metadata = {};
    event.subjectId = event.subjectId || null;
    event.topicId = event.topicId || null;
    return event;
  }
  function migrateV1toV2(data) {
    const subjectIdByName = /* @__PURE__ */ new Map();
    (data.subjects || []).forEach((subject) => {
      if (!subject.id) subject.id = uid("subject");
      subject.archived = Boolean(subject.archived);
      subject.createdAt = subject.createdAt || nowISO2();
      if (!Array.isArray(subject.topics)) subject.topics = [];
      subjectIdByName.set(subject.name, subject.id);
      subject.topics.forEach((topic) => {
        if (!topic.id) topic.id = uid("topic");
        topic.createdAt = topic.createdAt || nowISO2();
      });
    });
    (data.questoes || []).forEach((q) => {
      q.id = q.id || uid("question");
      q.subjectId = q.subjectId || subjectIdByName.get(q.subject) || null;
      q.topicId = q.topicId || null;
      q.createdAt = q.createdAt || nowISO2();
    });
    (data.calendar || []).forEach((item) => {
      item.id = item.id || uid("calendar");
      item.subjectId = item.subjectId || subjectIdByName.get(item.subject) || null;
      item.topicId = item.topicId || null;
      item.createdAt = item.createdAt || nowISO2();
    });
    (data.reviewAgenda || []).forEach((item) => {
      item.id = item.id || uid("review");
      item.subjectId = item.subjectId || subjectIdByName.get(item.subject) || null;
      item.topicId = item.topicId || item.topicRef || null;
      item.createdAt = item.createdAt || nowISO2();
      item.completedAt = item.completedAt || null;
    });
    (data.simulados || []).forEach((sim) => {
      sim.id = sim.id || uid("simulado");
      sim.createdAt = sim.createdAt || nowISO2();
      (sim.breakdown || []).forEach((b) => {
        b.id = b.id || uid("breakdown");
        b.subjectId = b.subjectId || subjectIdByName.get(b.subject) || null;
      });
    });
    (data.metasPorDisciplina || []).forEach((meta) => {
      meta.id = meta.id || uid("goal");
      meta.subjectId = meta.subjectId || subjectIdByName.get(meta.subject) || null;
    });
    (data.studySessions || []).forEach((session) => {
      session.id = session.id || uid("session");
      session.subjectId = session.subjectId || subjectIdByName.get(session.subject) || null;
      session.topicId = session.topicId || null;
    });
    data.schemaVersion = 2;
    return data;
  }
  function migrateV2toV3(data) {
    (data.subjects || []).forEach((subject) => (subject.topics || []).forEach((topic) => {
      topic.firstCompletedAt = topic.firstCompletedAt || (topic.completedAt ? `${topic.completedAt}T12:00:00.000Z` : null);
      topic.lastCompletedAt = topic.lastCompletedAt || topic.firstCompletedAt || null;
      topic.completionCount = Number(topic.completionCount) || (topic.completedAt ? 1 : 0);
      topic.lastReviewedAt = topic.lastReviewedAt || null;
      topic.reviewCount = Number(topic.reviewCount) || 0;
    }));
    if (!Array.isArray(data.topicHistory)) data.topicHistory = [];
    data.topicHistory.forEach((event) => {
      if (!event.id) event.id = uid("history");
      if (!event.occurredAt) event.occurredAt = event.date || nowISO2();
      if (!event.date) event.date = event.occurredAt;
    });
    (data.subjects || []).forEach((subject) => (subject.topics || []).forEach((topic) => {
      if (topic.completedAt && !data.topicHistory.some((event) => event.type === "topic_completed" && event.topicId === topic.id)) {
        const occurredAt = topic.lastCompletedAt || `${topic.completedAt}T12:00:00.000Z`;
        data.topicHistory.push({ id: uid("history"), date: occurredAt, occurredAt, type: "topic_completed", subjectId: subject.id, topicId: topic.id, metadata: { migrated: true } });
      }
    }));
    (data.reviewAgenda || []).forEach((review) => {
      const topicId = review.topicId || review.topicRef || null;
      if (review.completedAt && !data.topicHistory.some((event) => event.type === "review_completed" && event.metadata?.reviewId === review.id)) {
        data.topicHistory.push({ id: uid("history"), date: review.completedAt, occurredAt: review.completedAt, type: "review_completed", subjectId: review.subjectId || null, topicId, metadata: { reviewId: review.id, reviewType: review.tipo, migrated: true } });
      }
    });
    data.schemaVersion = 3;
    return data;
  }
  function migrateV3toV4(data) {
    (data.subjects || []).forEach((subject) => {
      if (!("archived" in subject)) subject.archived = false;
      if (!("archivedAt" in subject)) subject.archivedAt = null;
      (subject.topics || []).forEach((topic) => {
        if (!("archived" in topic)) topic.archived = false;
        if (!("archivedAt" in topic)) topic.archivedAt = null;
      });
    });
    data.schemaVersion = 4;
    return data;
  }
  function migrateV4toV5(data) {
    (data.questoes || []).forEach((question) => {
      question.topicId = question.topicId || null;
      const source = question.errorBreakdown || {};
      question.errorBreakdown = {};
      Object.keys(ERROR_CATEGORIES).forEach((key) => {
        question.errorBreakdown[key] = Math.max(0, Math.floor(Number(source[key]) || 0));
      });
    });
    data.schemaVersion = 5;
    return data;
  }
  function migrateV5toV6(data) {
    if (!Array.isArray(data.topicHistory)) data.topicHistory = [];
    data.topicHistory.forEach(normalizeHistoryEvent);
    data.schemaVersion = 6;
    return data;
  }
  function migrateV6toV7(data) {
    if (!data.metas || typeof data.metas !== "object") data.metas = {};
    const legacyHours = Number(data.metas.horasDiarias);
    const base = Number.isFinite(legacyHours) ? Math.max(0, legacyHours) : 2.5;
    const source = data.metas.horasPorDia && typeof data.metas.horasPorDia === "object" ? data.metas.horasPorDia : {};
    data.metas.horasPorDia = {};
    for (let day = 0; day < 7; day++) data.metas.horasPorDia[String(day)] = Math.max(0, Number(source[String(day)] ?? base) || 0);
    (data.reviewAgenda || []).forEach((review) => {
      review.manualDate = Boolean(review.manualDate);
      review.adaptive = review.adaptive !== false;
      review.adaptiveReason = review.adaptiveReason || null;
      review.suggestedDate = review.suggestedDate || null;
      review.baseIntervalDays = Math.max(1, Number(review.baseIntervalDays) || reviewBaseDaysFromType(review.tipo));
    });
    data.schemaVersion = 7;
    return data;
  }
  function migrateV7toV8(data) {
    if (!Array.isArray(data.dailyPlans)) data.dailyPlans = [];
    if (!data.activeTimer || typeof data.activeTimer !== "object") data.activeTimer = {};
    data.activeTimer.planItemId = data.activeTimer.planItemId || null;
    data.activeTimer.targetMinutes = Number(data.activeTimer.targetMinutes) || null;
    data.schemaVersion = 8;
    return data;
  }
  function migrateV8toV9(data) {
    data.examBlueprint = normalizeExamBlueprint(data.examBlueprint, data.examDate);
    data.algorithmVersions = normalizeAlgorithmVersions(data.algorithmVersions);
    (data.subjects || []).forEach((subject) => (subject.topics || []).forEach(normalizeTopicStrategy));
    data.schemaVersion = 9;
    return data;
  }
  function migrateV9toV10(data) {
    if (!Array.isArray(data.studyPlans)) data.studyPlans = [];
    data.schemaVersion = 10;
    return data;
  }
  function migrateV10toV11(data) {
    if (!Array.isArray(data.planAdjustments)) data.planAdjustments = [];
    if (!Array.isArray(data.recommendationFeedback)) data.recommendationFeedback = [];
    (data.dailyPlans || []).forEach((plan) => (plan.items || []).forEach((item) => {
      item.originalDate = item.originalDate || plan.date;
      item.currentDate = item.currentDate || plan.date;
      item.rescheduleCount = Math.max(0, Number(item.rescheduleCount) || 0);
      item.skippedReason = item.skippedReason || null;
      item.recommendationId = item.recommendationId || null;
    }));
    data.schemaVersion = 11;
    return data;
  }
  function migrateV11toV12(data) {
    if (!Array.isArray(data.alertStates)) data.alertStates = [];
    data.schemaVersion = 12;
    return data;
  }
  function migrateV12toV13(data) {
    (data.dailyPlans || []).forEach((plan) => {
      plan.studyPlanId = plan.studyPlanId || null;
      plan.generationOperationId = plan.generationOperationId || null;
      (plan.items || []).forEach((item) => {
        item.studyPlanId = item.studyPlanId || null;
        item.studyPlanItemId = item.studyPlanItemId || null;
        item.generationOperationId = item.generationOperationId || null;
        item.rescheduledFromId = item.rescheduledFromId || null;
        item.rescheduleOperationId = item.rescheduleOperationId || null;
      });
    });
    (data.studyPlans || []).forEach((plan) => {
      if (!Array.isArray(plan.dailyPlanOperations)) plan.dailyPlanOperations = [];
    });
    (data.planAdjustments || []).forEach((item) => {
      item.operationId = item.operationId || null;
      item.changes = Array.isArray(item.changes) ? item.changes : [];
      item.undoneAt = item.undoneAt || null;
    });
    data.schemaVersion = 13;
    return data;
  }
  function migrateV13toV14(data) {
    (data.recommendationFeedback || []).forEach((item) => {
      item.shownAt = item.shownAt || item.createdAt || null;
      item.ratedAt = item.ratedAt || null;
      item.algorithmVersion = Math.max(1, Number(item.algorithmVersion) || 1);
      item.score = Number.isFinite(Number(item.score)) ? Number(item.score) : null;
      item.confidence = item.confidence || null;
    });
    data.schemaVersion = 14;
    return data;
  }
  function migrateV14toV15(data) {
    data.algorithmVersions = normalizeAlgorithmVersions(data.algorithmVersions);
    data.algorithmVersions.adaptiveReview = Math.max(2, Number(data.algorithmVersions.adaptiveReview) || 2);
    (data.subjects || []).forEach((subject) => (subject.topics || []).forEach((topic) => {
      topic.adaptiveReview = topic.adaptiveReview ? createAdaptiveReviewState(topic.adaptiveReview) : null;
    }));
    (data.reviewAgenda || []).forEach((review) => {
      review.lastRating = REVIEW_RATINGS[review.lastRating] ? review.lastRating : null;
      review.adaptiveState = review.adaptiveState ? createAdaptiveReviewState(review.adaptiveState) : null;
    });
    data.schemaVersion = 15;
    return data;
  }
  function migrateV15toV16(data) {
    (data.studySessions || []).forEach((session) => {
      session.source = session.source || "manual";
      session.recommendationId = session.recommendationId || null;
      session.prioritySnapshot = session.prioritySnapshot == null || session.prioritySnapshot === "" ? null : Number.isFinite(Number(session.prioritySnapshot)) ? Number(session.prioritySnapshot) : null;
    });
    (data.recommendationFeedback || []).forEach((item) => {
      item.snapshot = item.snapshot || null;
      if (item.outcome && !item.outcome.state) item.outcome.state = item.outcome.attributionEligible ? "neutral" : "insufficient";
    });
    data.schemaVersion = 16;
    return data;
  }
  function migrateV16toV17(data) {
    data.studySessions = (data.studySessions || []).map((session) => normalizeStudySession(session));
    data.schemaVersion = 17;
    return data;
  }
  function migrateState(data) {
    return runStateMigrations(data, { currentVersion: CURRENT_SCHEMA_VERSION, migrations: { 1: migrateV1toV2, 2: migrateV2toV3, 3: migrateV3toV4, 4: migrateV4toV5, 5: migrateV5toV6, 6: migrateV6toV7, 7: migrateV7toV8, 8: migrateV8toV9, 9: migrateV9toV10, 10: migrateV10toV11, 11: migrateV11toV12, 12: migrateV12toV13, 13: migrateV13toV14, 14: migrateV14toV15, 15: migrateV15toV16, 16: migrateV16toV17 } });
  }
  function ensureStateDefaults() {
    if (!state || typeof state !== "object") state = {};
    if (!Array.isArray(state.subjects)) state.subjects = [];
    if (!Array.isArray(state.calendar)) state.calendar = [];
    if (!Array.isArray(state.reviewAgenda)) state.reviewAgenda = [];
    if (!Array.isArray(state.questoes)) state.questoes = [];
    if (!Array.isArray(state.simulados)) state.simulados = [];
    const metaDefaults = { semanal: 5, mensal: 20, questoesSemanal: 150, simuladosSemanal: 1, metaAprovacao: 70, horasDiarias: 2.5 };
    if (!state.metas || typeof state.metas !== "object") state.metas = {};
    Object.entries(metaDefaults).forEach(([key, value2]) => {
      if (!Number.isFinite(Number(state.metas[key]))) state.metas[key] = value2;
      else state.metas[key] = Number(state.metas[key]);
    });
    const hoursSource = state.metas.horasPorDia && typeof state.metas.horasPorDia === "object" ? state.metas.horasPorDia : {};
    state.metas.horasPorDia = {};
    for (let day = 0; day < 7; day++) {
      const value2 = Number(hoursSource[String(day)] ?? state.metas.horasDiarias);
      state.metas.horasPorDia[String(day)] = Number.isFinite(value2) ? Math.max(0, value2) : state.metas.horasDiarias;
    }
    if (typeof state.examDate !== "string") state.examDate = "";
    state.examBlueprint = normalizeExamBlueprint(state.examBlueprint, state.examDate);
    state.algorithmVersions = normalizeAlgorithmVersions(state.algorithmVersions);
    state.algorithmVersions.recommendations = PRIORITY_ALGORITHM_VERSION;
    state.algorithmVersions.adaptiveReview = Math.max(2, Number(state.algorithmVersions.adaptiveReview) || 2);
    if (!state.examDate && state.examBlueprint.examDate) state.examDate = state.examBlueprint.examDate;
    if (state.examDate !== state.examBlueprint.examDate) state.examBlueprint.examDate = state.examDate || null;
    if (!Array.isArray(state.progressHistory)) state.progressHistory = [];
    if (!state.achievementsUnlocked || typeof state.achievementsUnlocked !== "object") state.achievementsUnlocked = {};
    if (!Array.isArray(state.metasPorDisciplina)) state.metasPorDisciplina = [];
    if (!Array.isArray(state.studySessions)) state.studySessions = [];
    if (!Array.isArray(state.dailyPlans)) state.dailyPlans = [];
    if (!Array.isArray(state.studyPlans)) state.studyPlans = [];
    if (!Array.isArray(state.planAdjustments)) state.planAdjustments = [];
    if (!Array.isArray(state.recommendationFeedback)) state.recommendationFeedback = [];
    state.recommendationFeedback.forEach((item) => {
      item.shownAt = item.shownAt || item.createdAt || null;
      item.ratedAt = item.ratedAt || null;
      item.algorithmVersion = Math.max(1, Number(item.algorithmVersion) || 1);
      item.score = Number.isFinite(Number(item.score)) ? Number(item.score) : null;
      item.confidence = item.confidence || null;
      item.snapshot = item.snapshot || null;
      item.baseline = item.baseline || null;
      item.outcome = item.outcome || null;
    });
    if (!Array.isArray(state.alertStates)) state.alertStates = [];
    if (!state.activeTimer || typeof state.activeTimer !== "object") state.activeTimer = {};
    state.activeTimer.startedAt = state.activeTimer.startedAt || null;
    state.activeTimer.runStartedAt = state.activeTimer.runStartedAt || null;
    state.activeTimer.accumulatedSeconds = Math.max(0, Number(state.activeTimer.accumulatedSeconds) || 0);
    state.activeTimer.isRunning = Boolean(state.activeTimer.isRunning && state.activeTimer.runStartedAt);
    state.activeTimer.subjectId = state.activeTimer.subjectId || null;
    state.activeTimer.topicId = state.activeTimer.topicId || null;
    if (!["study", "review", "questions", "simulation"].includes(state.activeTimer.type)) state.activeTimer.type = "study";
    state.activeTimer.hiddenAt = state.activeTimer.hiddenAt || null;
    state.activeTimer.planItemId = state.activeTimer.planItemId || null;
    state.activeTimer.targetMinutes = Number(state.activeTimer.targetMinutes) || null;
    state.dailyPlans.forEach((plan) => {
      if (!plan.id) plan.id = uid("plan");
      if (typeof plan.date !== "string") plan.date = todayISO();
      plan.availableMinutes = Math.max(0, Number(plan.availableMinutes) || 0);
      plan.studyPlanId = plan.studyPlanId || null;
      plan.generationOperationId = plan.generationOperationId || null;
      if (!Array.isArray(plan.items)) plan.items = [];
      plan.items.forEach((item) => {
        if (!item.id) item.id = uid("plan-item");
        item.subjectId = item.subjectId || null;
        item.topicId = item.topicId || null;
        if (!["study", "review", "questions", "simulation"].includes(item.type)) item.type = "study";
        item.plannedMinutes = Math.max(0, Number(item.plannedMinutes) || 0);
        item.executedSeconds = Math.max(0, Number(item.executedSeconds) || 0);
        if (!["planned", "in_progress", "partial", "completed", "deferred", "replaced", "skipped"].includes(item.status)) item.status = "planned";
        if (!Array.isArray(item.sessionIds)) item.sessionIds = [];
        item.originalDate = item.originalDate || plan.date;
        item.currentDate = item.currentDate || plan.date;
        item.rescheduleCount = Math.max(0, Number(item.rescheduleCount) || 0);
        item.skippedReason = item.skippedReason || null;
        item.recommendationId = item.recommendationId || null;
        item.studyPlanId = item.studyPlanId || null;
        item.studyPlanItemId = item.studyPlanItemId || null;
        item.generationOperationId = item.generationOperationId || null;
        item.rescheduledFromId = item.rescheduledFromId || null;
        item.rescheduleOperationId = item.rescheduleOperationId || null;
      });
    });
    state.studyPlans.forEach((plan) => {
      if (!Array.isArray(plan.dailyPlanOperations)) plan.dailyPlanOperations = [];
    });
    if (!Array.isArray(state.topicHistory)) state.topicHistory = [];
    state.topicHistory.forEach(normalizeHistoryEvent);
    state.schemaVersion = CURRENT_SCHEMA_VERSION;
    state.subjects.forEach((s) => {
      if (!Array.isArray(s.topics)) s.topics = [];
      if (typeof s.collapsed !== "boolean") s.collapsed = false;
      if (typeof s.archived !== "boolean") s.archived = false;
      if (!("archivedAt" in s)) s.archivedAt = null;
      if (typeof s.createdAt !== "string") s.createdAt = nowISO2();
      s.topics.forEach((t) => {
        if (typeof t.notes !== "string") t.notes = "";
        if (!Array.isArray(t.tags)) t.tags = [];
        if (!DIFFICULTY_OPTIONS.includes(t.difficulty)) t.difficulty = "Médio";
        if (typeof t.createdAt !== "string") t.createdAt = nowISO2();
        if (typeof t.archived !== "boolean") t.archived = false;
        if (!("archivedAt" in t)) t.archivedAt = null;
        if (!("firstCompletedAt" in t)) t.firstCompletedAt = null;
        if (!("lastCompletedAt" in t)) t.lastCompletedAt = null;
        t.completionCount = Number(t.completionCount) || 0;
        if (!("lastReviewedAt" in t)) t.lastReviewedAt = null;
        t.reviewCount = Number(t.reviewCount) || 0;
        t.adaptiveReview = t.adaptiveReview ? createAdaptiveReviewState(t.adaptiveReview) : null;
        normalizeTopicStrategy(t);
      });
    });
    state.questoes.forEach((question) => {
      question.topicId = question.topicId || null;
      normalizeErrorBreakdown(question);
    });
    state.simulados.forEach((sim) => {
      if (!Array.isArray(sim.breakdown)) sim.breakdown = [];
    });
    state.studySessions = state.studySessions.map((session) => {
      const normalized = normalizeStudySession(session, { today: todayISO });
      if (!normalized.id) normalized.id = uid("session");
      return normalized;
    });
    state.reviewAgenda.forEach((review) => {
      review.topicId = review.topicId || review.topicRef || null;
      if (!("completedAt" in review)) review.completedAt = null;
      review.manualDate = Boolean(review.manualDate);
      review.adaptive = review.adaptive !== false;
      review.adaptiveReason = review.adaptiveReason || null;
      review.suggestedDate = review.suggestedDate || null;
      review.lastRating = REVIEW_RATINGS[review.lastRating] ? review.lastRating : null;
      review.adaptiveState = review.adaptiveState ? createAdaptiveReviewState(review.adaptiveState) : null;
    });
    refreshAllTopicReviewStats();
  }
  var persistentStorageManager = createStorageManager({ dbName: DB_NAME, dbVersion: DB_VERSION, storeName: STORE_NAME });
  var realStorageProvider = createRealStorageProvider({ manager: persistentStorageManager, readLocal: repositoryReadLocalState, writeLocal: repositoryWriteLocalState, removeLocal: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
    }
  } });
  var demoStorageProvider = IS_DEMO_MODE ? createDemoStorageProvider({ storage: sessionStorage, stateKey: STORAGE_KEY, demoKey: DEMO_STORAGE_KEY, generate: () => generateDemoData({ today: appClock.today() }) }) : null;
  var appContext = createAppContext({ storage: demoStorageProvider || realStorageProvider, clock: appClock, idGenerator: uid, repositories: createAppRepositories(() => state) });
  var reviewService = createReviewService({
    repository: appContext.repositories.reviewAgenda,
    clock: appClock,
    idGenerator: uid,
    findTopic: (topicId) => getTopicById(topicId)?.topic || null,
    calculateAdaptiveState: (current, rating, options) => applyAdaptiveReviewRating(current, rating, options),
    algorithmVersion: () => state.algorithmVersions.adaptiveReview,
    onEvent: (type, review, details) => addHistoryEvent(type, entitySubjectId(review), review.topicId || review.topicRef || null, details),
    onTopicChanged: (topicId) => refreshTopicReviewStats(topicId)
  });
  var planningRepository = appContext.repositories.planning;
  var studyPlanService = createStudyPlanService({ repository: planningRepository, calculate: buildStudyPlan, clock: appClock, idGenerator: uid, algorithmVersion: () => state.algorithmVersions.recommendations });
  var dailyPlanService = createDailyPlanService({ repository: planningRepository, buildProposal: buildDailyPlanProposal, applyProposal: applyDailyPlanProposal, undoGeneration: undoDailyPlanGeneration, clock: appClock, idGenerator: uid });
  var replanService = createReplanService({ repository: planningRepository, buildProposal: buildReplanProposal, applyProposal: applyReplan, undoProposal: undoReplan, clock: appClock, idGenerator: uid });
  var sessionService = createSessionService({ repository: appContext.repositories.studySessions, questionsRepository: appContext.repositories.questoes, historyRepository: appContext.repositories.topicHistory, planningRepository, recommendationsRepository: appContext.repositories.recommendationFeedback, clock: appClock, idGenerator: uid, normalizeQuestion: normalizeErrorBreakdown, completeRecommendation: completeRecommendationFeedback, onCompleted: measureRecommendationResults });
  var calendarService = createRecordService({ repository: appContext.repositories.calendar, clock: appClock, idGenerator: uid, prefix: "calendar" });
  var questionService = createRecordService({ repository: appContext.repositories.questoes, clock: appClock, idGenerator: uid, prefix: "question", normalize: (item) => {
    item.resolved = Math.max(0, Math.floor(Number(item.resolved) || 0));
    item.correct = Math.min(item.resolved, Math.max(0, Math.floor(Number(item.correct) || 0)));
    normalizeErrorBreakdown(item);
    return item;
  } });
  var simulationService = createRecordService({ repository: appContext.repositories.simulados, clock: appClock, idGenerator: uid, prefix: "simulado", normalize: (item) => {
    item.total = Math.max(0, Math.floor(Number(item.total) || 0));
    item.correct = Math.min(item.total, Math.max(0, Math.floor(Number(item.correct) || 0)));
    return item;
  } });
  var subjectGoalService = createRecordService({ repository: appContext.repositories.metasPorDisciplina, clock: appClock, idGenerator: uid, prefix: "goal" });
  var goalsService = createGoalService({ repository: appContext.repositories.settings, getDayOfWeek: (date2) => parseLocalDate(date2)?.getDay() ?? (/* @__PURE__ */ new Date()).getDay() });
  var subjectService = createSubjectService({ repository: appContext.repositories.subjects, clock: appClock, idGenerator: uid, onEvent: addHistoryEvent });
  var StorageManager = appContext.storage;
  var INSTANCE_ID = uid("instance");
  var STATE_CHANNEL = !IS_DEMO_MODE && typeof BroadcastChannel === "function" ? new BroadcastChannel("extrato-estudos-state") : null;
  var applyingRemoteState = false;
  function readLocalState(key = STORAGE_KEY) {
    return appContext.storage.readLocal(key);
  }
  function writeLocalState(value2, key = STORAGE_KEY) {
    return appContext.storage.writeLocal(key, value2);
  }
  function normalizeAndValidateState(raw) {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : structuredCloneSafe(raw);
    const validation = validateBackupData(parsed);
    if (!validation.valid) throw new Error(validation.message);
    return validation.normalized;
  }
  async function readLatestValidSnapshot() {
    const rawIndex = await StorageManager.get(BACKUP_INDEX_KEY);
    if (!rawIndex) return null;
    const index = JSON.parse(rawIndex);
    const snapshots = Array.isArray(index.snapshots) ? index.snapshots.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) : [];
    for (const snapshot of snapshots) {
      try {
        const raw = await StorageManager.get(snapshot.key);
        if (!raw) continue;
        if (snapshot.checksum && await sha256(raw) !== snapshot.checksum) continue;
        return { raw, state: normalizeAndValidateState(raw) };
      } catch (error) {
        console.warn("Snapshot de recuperacao ignorado", error);
      }
    }
    return null;
  }
  async function loadState() {
    let loadWarning = "";
    try {
      const raw = await StorageManager.get(STORAGE_KEY);
      if (raw) {
        try {
          state = normalizeAndValidateState(raw);
        } catch (error) {
          const recovered = await readLatestValidSnapshot();
          if (recovered) {
            state = recovered.state;
            await StorageManager.set(STORAGE_KEY, JSON.stringify(state));
            loadWarning = "Os dados principais estavam inválidos e foram recuperados do backup automático mais recente.";
          } else throw error;
        }
      }
    } catch (e) {
      console.error("Erro ao carregar estado salvo", e);
      loadWarning = "Não foi possível carregar os dados salvos. O aplicativo iniciou com os dados padrão; importe um backup se necessário.";
    }
    ensureStateDefaults();
    restoreTimerFromState();
    render();
    let modeMessage = "";
    try {
      modeMessage = sessionStorage.getItem(MODE_FLASH_KEY) || "";
      sessionStorage.removeItem(MODE_FLASH_KEY);
    } catch (error) {
    }
    if (loadWarning) showToast(loadWarning);
    else if (modeMessage) showToast(modeMessage);
  }
  var saveTimeout;
  var saveQueue = Promise.resolve();
  var pendingSave = null;
  async function sha256(value2) {
    if (!window.crypto?.subtle) return null;
    const bytes = new TextEncoder().encode(value2);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  async function rotateAutomaticBackup(previousRaw, options = {}) {
    if (!previousRaw) return true;
    const backupKey = options.backupKey || BACKUP_KEY;
    const indexKey = options.indexKey || BACKUP_INDEX_KEY;
    const slotCount = Math.max(1, Number(options.slotCount) || AUTOMATIC_BACKUP_SLOTS);
    let previous;
    try {
      previous = JSON.parse(previousRaw);
    } catch (e) {
      return false;
    }
    if (!previous || !Array.isArray(previous.subjects)) return false;
    let index = { nextSlot: 0, snapshots: [] };
    try {
      const rawIndex = await StorageManager.get(indexKey);
      if (rawIndex) {
        const parsed = JSON.parse(rawIndex);
        if (isPlainObject(parsed) && Array.isArray(parsed.snapshots)) index = parsed;
      }
    } catch (e) {
      console.warn("Índice de backups inválido; iniciando um novo.", e);
    }
    const slot = Math.max(0, Number(index.nextSlot) || 0) % slotCount;
    const key = `${backupKey}-${slot}`;
    const checksum = await sha256(previousRaw);
    const saved = await StorageManager.set(key, previousRaw);
    if (!saved) return false;
    const verification = await StorageManager.get(key);
    if (verification !== previousRaw || checksum && await sha256(verification) !== checksum) return false;
    const snapshot = { slot, key, createdAt: nowISO2(), stateUpdatedAt: previous.updatedAt || null, checksum, bytes: new Blob([previousRaw]).size };
    index.snapshots = index.snapshots.filter((item) => item && item.slot !== slot).concat(snapshot).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    index.nextSlot = (slot + 1) % slotCount;
    index.version = 1;
    index.updatedAt = nowISO2();
    return StorageManager.set(indexKey, JSON.stringify(index));
  }
  function enqueueSave(serialized, previousRaw) {
    pendingSave = { serialized, previousRaw };
    saveQueue = saveQueue.then(async () => {
      while (pendingSave) {
        const job = pendingSave;
        pendingSave = null;
        await saveState(job.serialized, job.previousRaw);
      }
    }).catch((error) => {
      console.error("Falha na fila de gravação", error);
      showToast("Não foi possível concluir a gravação. Exporte um backup para proteger seus dados.");
    });
    return saveQueue;
  }
  function scheduleSave() {
    const previousRaw = readLocalState(STORAGE_KEY);
    state.updatedAt = nowISO2();
    const serialized = JSON.stringify(state);
    writeLocalState(serialized);
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => enqueueSave(serialized, previousRaw), 350);
  }
  async function saveState(serialized = JSON.stringify(state), previousRaw = null) {
    try {
      let backupWarning = false;
      const lastBackup = state.lastBackupAt ? Date.parse(state.lastBackupAt) : 0;
      if (!IS_DEMO_MODE && previousRaw && Date.now() - lastBackup >= 24 * 60 * 60 * 1e3) {
        const backupSuccess = await rotateAutomaticBackup(previousRaw);
        if (backupSuccess) {
          state.lastBackupAt = nowISO2();
          const parsed = JSON.parse(serialized);
          parsed.lastBackupAt = state.lastBackupAt;
          parsed.updatedAt = state.updatedAt;
          serialized = JSON.stringify(parsed);
          writeLocalState(serialized);
        } else backupWarning = true;
      }
      const success = await StorageManager.set(STORAGE_KEY, serialized);
      if (success) {
        if (!applyingRemoteState) STATE_CHANNEL?.postMessage({ source: INSTANCE_ID, serialized, updatedAt: JSON.parse(serialized).updatedAt || null });
        flashSaved();
        if (backupWarning) showToast("Os dados atuais foram salvos, mas o backup automático não pôde ser atualizado. Exporte um backup manual.");
      } else showToast("Não foi possível salvar. Exporte um backup para proteger seus dados.");
    } catch (e) {
      console.error("Erro ao salvar estado", e);
      showToast("Não foi possível salvar. Exporte um backup para proteger seus dados.");
    }
  }
  STATE_CHANNEL?.addEventListener("message", (event) => {
    const message = event.data;
    if (!message || message.source === INSTANCE_ID || typeof message.serialized !== "string") return;
    const remoteTime = Date.parse(message.updatedAt || 0) || 0;
    const localTime = Date.parse(state.updatedAt || 0) || 0;
    if (remoteTime <= localTime) return;
    try {
      applyingRemoteState = true;
      state = normalizeAndValidateState(message.serialized);
      writeLocalState(message.serialized);
      render();
      showToast("Dados atualizados por outra aba.");
    } catch (error) {
      console.warn("Atualizacao de outra aba ignorada", error);
    } finally {
      applyingRemoteState = false;
    }
  });
  function flashSaved() {
    const el = document.getElementById("saveIndicator");
    el.classList.add("show");
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => el.classList.remove("show"), 1200);
  }
  function showToast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2600);
  }
  var modalController = createModalController({ document, window });
  function showConfirm(message, onConfirm, onCancel, options = {}) {
    return modalController.confirm(message, onConfirm, onCancel, options);
  }
  function showPrompt(message, options, onConfirm, onCancel) {
    return modalController.prompt(message, options, onConfirm, onCancel);
  }
  var navigationController = createNavigationController({ document, window, render: (tab) => render(tab), trapModalTab: (event) => trapModalTab(event, [document.getElementById("reviewRatingOverlay"), document.getElementById("sessionModalOverlay"), document.getElementById("modalOverlay")]), closeReview: closeReviewRating });
  function activateTab(tabName, updateHash = true) {
    return navigationController.activate(tabName, updateHash);
  }
  function allTopics() {
    return state.subjects.flatMap((s) => s.topics.map((t) => ({ ...t, subjectName: s.name, subjectId: s.id, subjectArchived: Boolean(s.archived), topicArchived: Boolean(t.archived) })));
  }
  function activeSubjects() {
    return state.subjects.filter((subject) => !subject.archived);
  }
  function archivedSubjects() {
    return state.subjects.filter((subject) => subject.archived);
  }
  function topicsForSelection(subjectOrId, selectedTopicId) {
    const subject = subjectOrId && typeof subjectOrId === "object" ? subjectOrId : getSubjectById(subjectOrId);
    if (!subject || !Array.isArray(subject.topics)) return [];
    return subject.topics.filter((topic) => !topic.archived || topic.id === selectedTopicId);
  }
  function isActiveSubjectId(subjectId) {
    const subject = getSubjectById(subjectId);
    return Boolean(subject && !subject.archived);
  }
  function isActiveTopicId(topicId) {
    const found = getTopicById(topicId);
    return Boolean(found && !found.subject.archived && !found.topic.archived);
  }
  function isActiveStudyReference(subjectId, topicId = null) {
    if (!isActiveSubjectId(subjectId)) return false;
    return !topicId || isActiveTopicId(topicId);
  }
  function subjectsForSelection(selectedId = null) {
    return state.subjects.filter((subject) => !subject.archived || subject.id === selectedId);
  }
  function activeTopics() {
    return allTopics().filter((topic) => !topic.subjectArchived && !topic.topicArchived);
  }
  function subjectProgress(subject) {
    return calculateTopicCoverage(subject.topics).value;
  }
  function localDateISO(value2) {
    if (arguments.length === 0) value2 = /* @__PURE__ */ new Date();
    if (value2 === null || value2 === void 0 || value2 === "") return "";
    const d = value2 instanceof Date ? value2 : new Date(value2);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function localDateFromTimestamp2(value2) {
    return localDateISO(value2);
  }
  function timestampToLocalDateISO(value2) {
    return localDateISO(value2);
  }
  function parseLocalDate(iso) {
    if (!iso || typeof iso !== "string") return null;
    const [year, month, day] = iso.split("-").map(Number);
    if (!year || !month || !day) return null;
    const date2 = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(date2.getTime()) ? null : date2;
  }
  function todayISO() {
    return appContext.clock.today();
  }
  function formatDatePt(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  var MESES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  function monthKey(iso) {
    if (!iso) return null;
    return iso.slice(0, 7);
  }
  function monthLabel(key) {
    if (!key) return "";
    const [y, m] = key.split("-");
    return `${MESES_PT[parseInt(m, 10) - 1]} de ${y}`;
  }
  function collectMonthKeys(...arrays) {
    const set = /* @__PURE__ */ new Set();
    arrays.forEach((arr) => arr.forEach((item) => {
      const k = monthKey(item.date);
      if (k) set.add(k);
    }));
    return [...set].sort();
  }
  function startOfWeek(d) {
    const date2 = parseLocalDate(d);
    if (!date2) return "";
    const day = date2.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date2.setDate(date2.getDate() + diff);
    return localDateISO(date2);
  }
  function isSameWeek(iso) {
    if (!iso) return false;
    return startOfWeek(iso) === startOfWeek(todayISO());
  }
  function isSameMonth(iso) {
    if (!iso) return false;
    return monthKey(iso) === monthKey(todayISO());
  }
  function diasParaRevisao(iso) {
    const alvo = parseLocalDate(iso);
    const hoje = parseLocalDate(todayISO());
    if (!alvo || !hoje) return null;
    return Math.round((alvo - hoje) / 864e5);
  }
  function diasParaRevisaoPill(iso, status) {
    const dias = diasParaRevisao(iso);
    if (dias === null) return `<span class="dias-pill dias-futura">—</span>`;
    if (status === "Concluído") {
      return `<span class="dias-pill dias-proxima">✓ feita</span>`;
    }
    if (dias < 0) return `<span class="dias-pill dias-atrasada">${dias}d · atrasada</span>`;
    if (dias === 0) return `<span class="dias-pill dias-hoje">hoje</span>`;
    if (dias <= 7) return `<span class="dias-pill dias-proxima">em ${dias}d</span>`;
    return `<span class="dias-pill dias-futura">em ${dias}d</span>`;
  }
  document.getElementById("examDateInput").addEventListener("change", function() {
    state.examDate = this.value;
    state.examBlueprint.examDate = this.value || null;
    state.examBlueprint.configuredAt = nowISO2();
    persistAndRender();
  });
  function getDailyStudySummary(date2, options = {}) {
    const subjectId = options.subjectId || "";
    const matchesSubject = (item) => !subjectId || entitySubjectId(item) === subjectId;
    const sessions = state.studySessions.filter((s) => s.date === date2 && matchesSubject(s));
    const allSessionIds = new Set(state.studySessions.map((s) => s.id));
    const independentQuestions = state.questoes.filter((q) => q.date === date2 && matchesSubject(q) && (!q.studySessionId || !allSessionIds.has(q.studySessionId)));
    const simulations = state.simulados.filter((sim) => sim.date === date2 && (!subjectId || (sim.breakdown || []).some((row) => entitySubjectId(row) === subjectId)));
    const reviews = state.reviewAgenda.filter((review) => review.status === "Concluído" && localDateFromTimestamp2(review.completedAt) === date2 && matchesSubject(review));
    const metrics = summarizeStudyRecords({ sessions, questions: independentQuestions, simulations });
    const { seconds, questions, correct, accuracy: accuracy2 } = metrics;
    const subjectNames = /* @__PURE__ */ new Set();
    sessions.forEach((s) => {
      const id = entitySubjectId(s);
      if (id) subjectNames.add(getSubjectName(id));
    });
    independentQuestions.forEach((q) => {
      const id = entitySubjectId(q);
      if (id) subjectNames.add(getSubjectName(id));
    });
    const targetSeconds = metaHoursForDate(date2) * 3600;
    const goalPct = targetSeconds > 0 ? Math.round(seconds / targetSeconds * 100) : 0;
    return {
      date: date2,
      sessions,
      seconds,
      questions,
      correct,
      reviews: reviews.length,
      simulations: metrics.simulations,
      targetSeconds,
      goalPct,
      accuracy: accuracy2,
      subjectNames: [...subjectNames],
      meaningful: seconds >= 300 || independentQuestions.some((q) => (Number(q.resolved) || 0) > 0) || metrics.simulations > 0,
      goalAchieved: targetSeconds > 0 && seconds >= targetSeconds
    };
  }
  function getActivityDates() {
    const set = /* @__PURE__ */ new Set();
    const sessionIds = new Set(state.studySessions.map((s) => s.id));
    const dates = new Set([
      ...state.studySessions.map((s) => s.date),
      ...state.questoes.filter((q) => !q.studySessionId || !sessionIds.has(q.studySessionId)).map((q) => q.date),
      ...state.simulados.map((s) => s.date)
    ].filter(Boolean));
    dates.forEach((date2) => {
      if (getDailyStudySummary(date2).meaningful) set.add(date2);
    });
    return set;
  }
  function getGoalDates() {
    const set = /* @__PURE__ */ new Set();
    new Set(state.studySessions.map((s) => s.date).filter(Boolean)).forEach((date2) => {
      if (getDailyStudySummary(date2).goalAchieved) set.add(date2);
    });
    return set;
  }
  function computeStreak(activityDates) {
    return calculateActivityStreak(activityDates, { today: todayISO(), addDays });
  }
  function toggleStreakExpanded() {
    streakView.expanded = !streakView.expanded;
    renderHeatmap();
  }
  function toggleStreakActiveDays() {
    streakView.onlyActiveDays = !streakView.onlyActiveDays;
    renderHeatmap();
  }
  function focusStudyTimer() {
    activateTab("dashboard");
    document.getElementById("timerStartBtn")?.focus();
  }
  function recordProgressSnapshot(pct) {
    const today = todayISO();
    const existing = state.progressHistory.find((p) => p.date === today);
    if (existing) {
      existing.pct = pct;
    } else {
      state.progressHistory.push({ date: today, pct });
    }
    state.progressHistory.sort((a, b) => a.date.localeCompare(b.date));
    if (state.progressHistory.length > 90) {
      state.progressHistory = state.progressHistory.slice(-90);
    }
  }
  function renderProgressChart() {
    const container = document.getElementById("progressChart");
    const data = state.progressHistory;
    if (data.length < 2) {
      container.innerHTML = `<div class="progress-chart-empty">Continue estudando — o gráfico aparece a partir do segundo dia com dados.</div>`;
      return;
    }
    const W = 640, H = 160, padL = 30, padR = 12, padT = 12, padB = 22;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = data.length;
    const xFor = (i) => padL + (n === 1 ? 0 : i / (n - 1) * plotW);
    const yFor = (pct) => padT + plotH - pct / 100 * plotH;
    const points = data.map((d, i) => `${xFor(i)},${yFor(d.pct)}`).join(" ");
    const areaPoints = `${padL},${padT + plotH} ${points} ${xFor(n - 1)},${padT + plotH}`;
    const gridLines = [0, 25, 50, 75, 100].map((v) => `
    <line class="chart-grid" x1="${padL}" y1="${yFor(v)}" x2="${W - padR}" y2="${yFor(v)}"></line>
    <text x="2" y="${yFor(v) + 3}">${v}%</text>
  `).join("");
    const stepLabels = n <= 6 ? n : 6;
    const labelIdxs = Array.from({ length: stepLabels }, (_, k) => Math.round(k * (n - 1) / (stepLabels - 1 || 1)));
    const uniqueLabelIdxs = [...new Set(labelIdxs)];
    const dateLabels = uniqueLabelIdxs.map((i) => `<text x="${xFor(i)}" y="${H - 4}" text-anchor="middle">${formatDatePt(data[i].date).slice(0, 5)}</text>`).join("");
    const dots = data.map((d, i) => `<circle class="chart-dot" cx="${xFor(i)}" cy="${yFor(d.pct)}" r="3"><title>${formatDatePt(d.date)}: ${d.pct}%</title></circle>`).join("");
    container.innerHTML = `
    <svg class="progress-chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">
      ${gridLines}
      <polygon class="chart-area" points="${areaPoints}"></polygon>
      <polyline class="chart-line" points="${points}"></polyline>
      ${dots}
      ${dateLabels}
    </svg>
  `;
  }
  var backupController = createBackupController({ document, window, serialize: serializeBackup, fileName: backupFileName, validate: validateBackupData, notify: showToast, isDisabled: () => IS_DEMO_MODE, maxBytes: MAX_BACKUP_FILE_SIZE, onImport: ({ normalized, version }) => {
    const summary = backupSummary(normalized, version);
    showConfirm(`${summary} Importar vai substituir todos os dados atuais. Continuar?`, () => applyImportedBackup(normalized));
  } });
  function exportBackup() {
    backupController.exportState(state, todayISO());
  }
  function downloadJsonBackup(raw, name) {
    backupController.download(raw, name);
  }
  async function exportLatestAutomaticBackup() {
    if (IS_DEMO_MODE) {
      showToast("A recuperação real fica indisponível durante a demonstração.");
      return;
    }
    try {
      const rawIndex = await StorageManager.get(BACKUP_INDEX_KEY);
      if (!rawIndex) {
        showToast("Ainda não existe um snapshot automático de recuperação.");
        return;
      }
      const index = JSON.parse(rawIndex), snapshot = Array.isArray(index.snapshots) ? index.snapshots.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] : null;
      if (!snapshot?.key) {
        showToast("O índice de recuperação está vazio.");
        return;
      }
      const raw = await StorageManager.get(snapshot.key);
      const checksum = raw ? await sha256(raw) : null;
      if (!raw || snapshot.checksum && checksum !== snapshot.checksum) {
        showToast("O snapshot automático falhou na verificação de integridade.");
        return;
      }
      const validation = validateBackupData(JSON.parse(raw));
      if (!validation.valid) {
        showToast("O snapshot automático não contém um estado restaurável.");
        return;
      }
      downloadJsonBackup(raw, `recuperacao-extrato-estudos-${String(snapshot.createdAt || todayISO()).slice(0, 10)}.json`);
      showToast("Snapshot verificado e exportado. Use “Importar backup” para restaurá-lo.");
    } catch (error) {
      console.error("Falha ao exportar snapshot automático", error);
      showToast("Não foi possível exportar o snapshot automático.");
    }
  }
  function validateBackupData(data) {
    const arrayFields = ["calendar", "reviewAgenda", "questoes", "simulados", "progressHistory", "studySessions", "dailyPlans", "studyPlans", "planAdjustments", "recommendationFeedback", "alertStates", "topicHistory", "metasPorDisciplina"];
    const envelope = validateBackupEnvelope(data, { currentVersion: CURRENT_SCHEMA_VERSION, arrayFields });
    if (!envelope.valid) return envelope;
    const { version } = envelope;
    try {
      const normalized = migrateState(structuredCloneSafe(data));
      ensureBackupStateDefaults(normalized);
      const deepValidation = validateNormalizedBackup(normalized);
      if (!deepValidation.valid) return deepValidation;
      return { valid: true, version, normalized };
    } catch (error) {
      console.error("Falha ao normalizar backup para validação", error);
      return { valid: false, message: "O backup contém dados que não puderam ser normalizados com segurança." };
    }
  }
  function ensureBackupStateDefaults(candidate) {
    const previous = state;
    try {
      state = candidate;
      ensureStateDefaults();
    } finally {
      state = previous;
    }
  }
  function validateNormalizedBackup(data) {
    const fail = (message) => ({ valid: false, message });
    const collections = ["subjects", "calendar", "reviewAgenda", "questoes", "simulados", "progressHistory", "studySessions", "dailyPlans", "studyPlans", "planAdjustments", "recommendationFeedback", "alertStates", "topicHistory", "metasPorDisciplina"];
    for (const field of collections) {
      if (!Array.isArray(data[field])) return fail(`O campo "${field}" deve ser uma lista.`);
      if (data[field].length > 5e4) return fail(`O campo "${field}" excede o limite seguro de 50.000 registros.`);
    }
    const ids = /* @__PURE__ */ new Set(), subjectIds = /* @__PURE__ */ new Set(), topicIds = /* @__PURE__ */ new Set(), sessionIds = /* @__PURE__ */ new Set(), planItemIds = /* @__PURE__ */ new Set();
    const registerId = (id, label) => {
      if (!isSafeId(id)) return `${label} possui um identificador inválido.`;
      if (ids.has(id)) return `O identificador "${id}" aparece mais de uma vez no backup.`;
      ids.add(id);
      return "";
    };
    const textOk = (value2, max = 5e3) => typeof value2 === "string" && value2.length <= max;
    for (const subject of data.subjects) {
      if (!isPlainObject(subject)) return fail("Uma disciplina não é um objeto válido.");
      const idError = registerId(subject.id, "Uma disciplina");
      if (idError) return fail(idError);
      subjectIds.add(subject.id);
      if (!textOk(subject.name, 300) || !Array.isArray(subject.topics) || subject.topics.length > 1e4) return fail("Uma disciplina possui nome ou lista de tópicos inválida.");
      for (const topic of subject.topics) {
        if (!isPlainObject(topic)) return fail("Um tópico não é um objeto válido.");
        const topicIdError = registerId(topic.id, "Um tópico");
        if (topicIdError) return fail(topicIdError);
        topicIds.add(topic.id);
        if (!textOk(topic.name, 500) || !textOk(topic.link || "", 2e3) || !textOk(topic.notes || "", 2e4)) return fail("Um tópico excede os limites de texto permitidos.");
        if (!STATUS_OPTIONS.includes(topic.status) || !DIFFICULTY_OPTIONS.includes(topic.difficulty)) return fail("Um tópico possui status ou dificuldade inválida.");
        if (!Array.isArray(topic.tags) || topic.tags.length > 100 || topic.tags.some((tag) => !textOk(tag, 100))) return fail("Um tópico possui tags inválidas.");
        if (topic.examImportance !== null && (!Number.isFinite(Number(topic.examImportance)) || Number(topic.examImportance) < 0 || Number(topic.examImportance) > 1)) return fail("Um tópico possui importância de prova inválida.");
        if (topic.estimatedStudyMinutes !== null && (!isFiniteNonNegative(topic.estimatedStudyMinutes) || Number(topic.estimatedStudyMinutes) <= 0)) return fail("Um tópico possui esforço estimado inválido.");
        if (!Array.isArray(topic.prerequisites) || topic.prerequisites.length > 100 || topic.prerequisites.some((id) => !isSafeId(id))) return fail("Um tópico possui pré-requisitos inválidos.");
      }
    }
    const validateEntity = (item, label) => {
      if (!isPlainObject(item)) return `${label} não é um objeto válido.`;
      return registerId(item.id, label);
    };
    for (const item of data.calendar) {
      const error = validateEntity(item, "Um item do calendário");
      if (error) return fail(error);
      if (!isISODate(item.date) || !STATUS_OPTIONS.includes(item.status) || !REVIEW_OPTIONS.includes(item.reviewType)) return fail("Um item do calendário possui data, status ou tipo inválido.");
    }
    for (const item of data.reviewAgenda) {
      const error = validateEntity(item, "Uma revisão");
      if (error) return fail(error);
      if (!isISODate(item.date) || !STATUS_OPTIONS.includes(item.status) || !TIPO_AGENDA_OPTIONS.includes(item.tipo) || !isOptionalTimestamp(item.completedAt)) return fail("Uma revisão possui data, status ou tipo inválido.");
    }
    for (const item of data.questoes) {
      const error = validateEntity(item, "Um registro de questões");
      if (error) return fail(error);
      if (!isISODate(item.date) || !isFiniteNonNegative(item.resolved) || !isFiniteNonNegative(item.correct) || Number(item.correct) > Number(item.resolved)) return fail("Um registro de questões possui data ou totais inválidos.");
    }
    for (const item of data.simulados) {
      const error = validateEntity(item, "Um simulado");
      if (error) return fail(error);
      if (!isISODate(item.date) || !textOk(item.nome || "", 500) || !isFiniteNonNegative(item.total) || !isFiniteNonNegative(item.correct) || Number(item.correct) > Number(item.total) || !Array.isArray(item.breakdown)) return fail("Um simulado possui dados inválidos.");
      for (const row of item.breakdown) {
        const rowError = validateEntity(row, "Uma linha de simulado");
        if (rowError) return fail(rowError);
        if (!isFiniteNonNegative(row.total) || !isFiniteNonNegative(row.correct) || Number(row.correct) > Number(row.total)) return fail("Uma linha de simulado possui totais inválidos.");
      }
    }
    for (const item of data.studySessions) {
      const error = validateEntity(item, "Uma sessão");
      if (error) return fail(error);
      sessionIds.add(item.id);
      if (!isISODate(item.date) || !isFiniteNonNegative(item.durationSeconds) || !isFiniteNonNegative(item.questionsResolved) || !isFiniteNonNegative(item.correctAnswers) || Number(item.correctAnswers) > Number(item.questionsResolved) || !["study", "review", "questions", "simulation"].includes(item.type) || !textOk(item.notes || "", 2e4)) return fail("Uma sessão de estudo possui dados inválidos.");
    }
    for (const plan of data.dailyPlans) {
      const error = validateEntity(plan, "Um plano diário");
      if (error) return fail(error);
      if (!isISODate(plan.date) || !isFiniteNonNegative(plan.availableMinutes) || !Array.isArray(plan.items)) return fail("Um plano diário possui dados inválidos.");
      for (const item of plan.items) {
        const itemError = validateEntity(item, "Um item de plano");
        if (itemError) return fail(itemError);
        planItemIds.add(item.id);
        if (!isFiniteNonNegative(item.plannedMinutes) || !isFiniteNonNegative(item.executedSeconds) || !["study", "review", "questions", "simulation"].includes(item.type) || !["planned", "in_progress", "partial", "completed", "deferred", "replaced", "skipped"].includes(item.status)) return fail("Um item de plano possui dados inválidos.");
      }
    }
    for (const plan of data.studyPlans) {
      const error = validateEntity(plan, "Um plano até a prova");
      if (error) return fail(error);
      if (!isOptionalTimestamp(plan.confirmedAt) || !isFiniteNonNegative(plan.weeklyAvailableMinutes) || !isFiniteNonNegative(plan.weeklyPlannedMinutes) || !Array.isArray(plan.subjects) || !Array.isArray(plan.items)) return fail("Um plano até a prova possui dados inválidos.");
    }
    for (const item of data.planAdjustments) {
      const error = validateEntity(item, "Um ajuste de plano");
      if (error) return fail(error);
      if (!isISODate(item.periodStart) || !isISODate(item.periodEnd) || !isOptionalTimestamp(item.confirmedAt) || !isFiniteNonNegative(item.deficitMinutes) || !isFiniteNonNegative(item.redistributedMinutes) || !Array.isArray(item.allocations)) return fail("Um ajuste de plano possui dados inválidos.");
    }
    for (const item of data.recommendationFeedback) {
      const error = validateEntity(item, "Um feedback de recomendação");
      if (error) return fail(error);
      if (!isISODate(item.date) || typeof item.accepted !== "boolean" || typeof item.completed !== "boolean" || !isOptionalTimestamp(item.createdAt) || !isOptionalTimestamp(item.completedAt)) return fail("Um feedback de recomendação possui dados inválidos.");
    }
    for (const item of data.alertStates) {
      if (!isPlainObject(item) || !isSafeId(item.alertId) || !(item.dismissedUntil === null || isISODate(item.dismissedUntil)) || !(item.resolvedAt === null || isISODate(item.resolvedAt))) return fail("Um estado de alerta possui dados inválidos.");
    }
    for (const item of data.topicHistory) {
      const error = validateEntity(item, "Um evento histórico");
      if (error) return fail(error);
    }
    for (const item of data.metasPorDisciplina) {
      const error = validateEntity(item, "Uma meta por disciplina");
      if (error) return fail(error);
      if (!isFiniteNonNegative(item.meta)) return fail("Uma meta por disciplina possui valor inválido.");
    }
    const validRef = (value2, set) => value2 == null || isSafeId(value2) && set.has(value2);
    if (data.subjects.some((subject) => subject.topics.some((topic) => topic.prerequisites.some((id) => !topicIds.has(id) || id === topic.id)))) return fail("O backup contém pré-requisito de tópico inexistente ou circular direto.");
    const referenceCollections = [...data.calendar, ...data.reviewAgenda, ...data.questoes, ...data.studySessions, ...data.metasPorDisciplina];
    if (referenceCollections.some((item) => !validRef(item.subjectId, subjectIds) || !validRef(item.topicId, topicIds))) return fail("O backup contém referência para disciplina ou tópico inexistente.");
    if (data.simulados.some((sim) => sim.breakdown.some((item) => !validRef(item.subjectId, subjectIds)))) return fail("O backup contém detalhamento de simulado para uma disciplina inexistente.");
    if (data.dailyPlans.some((plan) => plan.items.some((item) => !validRef(item.subjectId, subjectIds) || !validRef(item.topicId, topicIds)))) return fail("O backup contém item de plano com referência inexistente.");
    if (data.topicHistory.some((item) => item.subjectId != null && !isSafeId(item.subjectId) || item.topicId != null && !isSafeId(item.topicId))) return fail("O backup contém histórico com identificador inseguro.");
    if (data.questoes.some((item) => item.studySessionId != null && !validRef(item.studySessionId, sessionIds))) return fail("O backup contém questões vinculadas a uma sessão inexistente.");
    if (data.studySessions.some((item) => item.planItemId != null && !validRef(item.planItemId, planItemIds))) return fail("O backup contém sessão vinculada a um item de plano inexistente.");
    if (!isPlainObject(data.metas) || Object.entries(data.metas).some(([key, value2]) => key !== "horasPorDia" && !isFiniteNonNegative(value2)) || !isPlainObject(data.metas.horasPorDia) || Object.values(data.metas.horasPorDia).some((value2) => !isFiniteNonNegative(value2))) return fail("O backup contém metas globais inválidas.");
    if (!isPlainObject(data.activeTimer) || !isFiniteNonNegative(data.activeTimer.accumulatedSeconds) || !validRef(data.activeTimer.subjectId, subjectIds) || !validRef(data.activeTimer.topicId, topicIds) || !validRef(data.activeTimer.planItemId, planItemIds)) return fail("O backup contém um cronômetro ativo inválido.");
    if (!isPlainObject(data.examBlueprint) || !(data.examBlueprint.examDate === null || isISODate(data.examBlueprint.examDate)) || !Number.isFinite(Number(data.examBlueprint.targetScore)) || Number(data.examBlueprint.targetScore) < 0 || Number(data.examBlueprint.targetScore) > 100 || !isOptionalTimestamp(data.examBlueprint.configuredAt) || !Array.isArray(data.examBlueprint.subjects) || data.examBlueprint.subjects.length > 1e3) return fail("O backup contém configuração de prova inválida.");
    if (data.examBlueprint.subjects.some((item) => !isPlainObject(item) || !validRef(item.subjectId, subjectIds) || !isFiniteNonNegative(item.expectedQuestions) || !isFiniteNonNegative(item.questionWeight) || !EXAM_PRIORITIES.includes(item.priority))) return fail("O backup contém peso de disciplina inválido.");
    if (!isPlainObject(data.algorithmVersions) || Object.values(data.algorithmVersions).some((value2) => !Number.isInteger(Number(value2)) || Number(value2) < 1)) return fail("O backup contém versões de algoritmos inválidas.");
    if (data.progressHistory.some((item) => !isPlainObject(item) || !isISODate(item.date) || !isFiniteNonNegative(item.pct) || Number(item.pct) > 100)) return fail("O backup contém histórico de progresso inválido.");
    return { valid: true };
  }
  function backupSummary(data, version) {
    const subjectCount = data.subjects.length;
    const topicCount = data.subjects.reduce((sum3, subject) => sum3 + (Array.isArray(subject.topics) ? subject.topics.length : 0), 0);
    const sessionCount = Array.isArray(data.studySessions) ? data.studySessions.length : 0;
    const questionCount = Array.isArray(data.questoes) ? data.questoes.length : 0;
    const updated = Date.parse(data.updatedAt || "");
    const updatedLabel = Number.isFinite(updated) ? new Date(updated).toLocaleString("pt-BR") : "data não informada";
    return `Backup v${version}: ${pluralize(subjectCount, "disciplina")}, ${pluralize(topicCount, "tópico")}, ${pluralize(sessionCount, "sessão", "sessões")} e ${pluralize(questionCount, "registro")} de questões. Última atualização: ${updatedLabel}.`;
  }
  function applyImportedBackup(importedState) {
    const previousState = state;
    try {
      state = importedState;
      ensureStateDefaults();
      restoreTimerFromState();
      persistAndRender();
      showToast("Backup importado com sucesso.");
    } catch (error) {
      state = previousState;
      restoreTimerFromState();
      render();
      console.error("Erro ao importar backup", error);
      showToast("O backup passou pela validação inicial, mas não pôde ser convertido. Seus dados atuais foram preservados.");
    }
  }
  function importBackupFromFile(file) {
    backupController.importFile(file);
  }
  document.getElementById("exportBackupBtn").addEventListener("click", exportBackup);
  document.getElementById("exportAutomaticBackupBtn").addEventListener("click", exportLatestAutomaticBackup);
  document.getElementById("importBackupBtn").addEventListener("click", () => {
    document.getElementById("importBackupFile").click();
  });
  document.getElementById("importBackupFile").addEventListener("change", function() {
    if (this.files && this.files[0]) {
      importBackupFromFile(this.files[0]);
      this.value = "";
    }
  });
  function reloadWithModeChange() {
    suppressBeforeUnloadSave = true;
    if (saveTimeout) clearTimeout(saveTimeout);
    pendingSave = null;
    location.reload();
  }
  function configureDemoModeUi() {
    const banner = document.getElementById("demoBanner"), enterButton = document.getElementById("enterDemoBtn"), emptyCta = document.getElementById("demoEmptyCta");
    banner.hidden = !IS_DEMO_MODE;
    enterButton.hidden = IS_DEMO_MODE;
    if (emptyCta) emptyCta.hidden = IS_DEMO_MODE || state.subjects.length > 0 || state.studySessions.length > 0;
    document.querySelectorAll("[data-demo-protected]").forEach((button) => {
      button.disabled = IS_DEMO_MODE;
      button.title = IS_DEMO_MODE ? "Indisponível para proteger seus dados reais." : "";
    });
  }
  document.getElementById("enterDemoBtn").addEventListener("click", () => showConfirm("Explorar a demonstração com três meses de estudos, questões, simulados e planejamento? Seus dados atuais não serão alterados.", () => {
    enterDemoMode(sessionStorage);
    reloadWithModeChange();
  }));
  document.getElementById("enterDemoEmptyBtn").addEventListener("click", () => document.getElementById("enterDemoBtn").click());
  document.querySelectorAll("[data-demo-target]").forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.demoTarget)));
  document.getElementById("demoReportShortcut").addEventListener("click", () => document.getElementById("exportReportBtn").click());
  document.getElementById("resetDemoBtn").addEventListener("click", () => showConfirm("Reiniciar todos os dados fictícios da demonstração?", () => {
    resetDemoMode(sessionStorage, DEMO_STORAGE_KEY);
    reloadWithModeChange();
  }));
  document.getElementById("exitDemoBtn").addEventListener("click", () => {
    exitDemoMode(sessionStorage, DEMO_STORAGE_KEY);
    sessionStorage.setItem(MODE_FLASH_KEY, "Demonstração encerrada. Seus dados pessoais foram restaurados.");
    reloadWithModeChange();
  });
  configureDemoModeUi();
  var timerSeconds = 0;
  var timerRunning = false;
  var timerIntervalId = null;
  var timerStartedAt = null;
  function formatTimer(totalSeconds) {
    const total = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor(total % 3600 / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return h > 0 ? `${String(h).padStart(2, "0")}:${m}:${s}` : `${m}:${s}`;
  }
  function findDailyPlanItem(itemId) {
    if (!itemId) return null;
    for (const plan of state.dailyPlans) {
      const item = plan.items.find((candidate) => candidate.id === itemId);
      if (item) return { plan, item };
    }
    return null;
  }
  function releaseActivePlanItem() {
    const found = findDailyPlanItem(state.activeTimer?.planItemId);
    if (found && found.item.status === "in_progress") {
      found.item.status = found.item.executedSeconds > 0 ? "partial" : "planned";
      found.plan.updatedAt = nowISO2();
    }
  }
  function startPlannedActivity(itemId) {
    const found = findDailyPlanItem(itemId);
    if (!found) {
      showToast("Esta atividade não está mais disponível no plano.");
      return;
    }
    if (["completed", "deferred", "replaced", "skipped"].includes(found.item.status)) {
      showToast("Esta atividade não está disponível para iniciar.");
      return;
    }
    if (timerSeconds > 0) {
      showToast("Finalize ou zere a sessão atual antes de iniciar outra atividade.");
      return;
    }
    const { plan, item } = found;
    if (item.topicId) {
      const candidate = intelligenceCandidates().find((candidate2) => candidate2.topicId === item.topicId);
      if (!candidate || candidate.archived || candidate.blockedPrerequisites.length) {
        showToast("Esta atividade aguarda pré-requisitos ou possui um tópico arquivado. Recalcule o plano.");
        return;
      }
    }
    Object.assign(state.activeTimer, {
      subjectId: item.subjectId || null,
      topicId: item.topicId || null,
      type: item.type || "study",
      planItemId: item.id,
      targetMinutes: item.plannedMinutes
    });
    item.status = "in_progress";
    item.startedAt = item.startedAt || nowISO2();
    plan.updatedAt = nowISO2();
    populateTimerContextControls();
    startTimer();
    renderPlanoHoje();
    activateTab("dashboard");
    document.getElementById("studyTimerDisplay")?.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast(`Atividade iniciada · meta de ${formatPlanMinutes(item.plannedMinutes)}.`);
  }
  function currentTimerSeconds() {
    const active = state.activeTimer || {};
    let seconds = Math.max(0, Number(active.accumulatedSeconds) || 0);
    if (active.isRunning && active.runStartedAt) {
      const runStart = Date.parse(active.runStartedAt);
      if (Number.isFinite(runStart)) seconds += Math.max(0, Math.floor((Date.now() - runStart) / 1e3));
    }
    return seconds;
  }
  function updateTimerDisplay() {
    const el = document.getElementById("studyTimerDisplay");
    if (el) el.textContent = formatTimer(timerSeconds);
    const targetEl = document.getElementById("studyTimerTarget");
    if (targetEl) {
      const targetMinutes = Math.max(0, Number(state.activeTimer?.targetMinutes) || 0);
      if (targetMinutes > 0) {
        const targetSeconds = targetMinutes * 60;
        const difference = targetSeconds - timerSeconds;
        const planItem = findDailyPlanItem(state.activeTimer.planItemId)?.item;
        const context = planItem ? `${planItem.subjectName} — ${planItem.topicName} · ` : "";
        targetEl.textContent = context + `meta ${formatPlanMinutes(targetMinutes)} · ${difference >= 0 ? formatDuration(difference) + " restantes" : formatDuration(Math.abs(difference)) + " além da meta"}`;
        targetEl.style.display = "block";
      } else {
        targetEl.textContent = "";
        targetEl.style.display = "none";
      }
    }
  }
  function updateTimerControls() {
    const hasTime = timerSeconds > 0;
    document.getElementById("timerStartBtn").style.display = timerRunning ? "none" : "inline-block";
    document.getElementById("timerPauseBtn").style.display = timerRunning ? "inline-block" : "none";
    ["timerSubjectSelect", "timerTopicSelect", "timerTypeSelect"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = hasTime;
    });
  }
  function populateTimerTopicSelect(subjectId, selectedTopicId) {
    const select = document.getElementById("timerTopicSelect");
    if (!select) return;
    const subject = getSubjectById(subjectId);
    select.innerHTML = `<option value="">Sem tópico específico</option>` + (subject ? topicsForSelection(subject, selectedTopicId).map((topic) => `<option value="${escapeAttr(topic.id)}">${escapeHtml(topic.name || "(tópico sem nome)")}</option>`).join("") : "");
    select.value = selectedTopicId || "";
    if (select.value !== (selectedTopicId || "")) state.activeTimer.topicId = null;
  }
  function populateTimerContextControls() {
    const subjectSelect = document.getElementById("timerSubjectSelect");
    const typeSelect = document.getElementById("timerTypeSelect");
    if (!subjectSelect || !typeSelect) return;
    subjectSelect.innerHTML = `<option value="">Sem disciplina específica</option>` + subjectsForSelection(state.activeTimer.subjectId).map((subject) => `<option value="${escapeAttr(subject.id)}">${escapeHtml(subject.name)}${subject.archived ? " (arquivada)" : ""}</option>`).join("");
    subjectSelect.value = state.activeTimer.subjectId || "";
    if (subjectSelect.value !== (state.activeTimer.subjectId || "")) state.activeTimer.subjectId = null;
    populateTimerTopicSelect(state.activeTimer.subjectId, state.activeTimer.topicId);
    typeSelect.value = state.activeTimer.type || "study";
    updateTimerControls();
  }
  function timerTick() {
    timerSeconds = currentTimerSeconds();
    updateTimerDisplay();
  }
  function startTimer() {
    if (timerRunning) return;
    const active = state.activeTimer;
    if (timerSeconds === 0) {
      active.startedAt = nowISO2();
      active.accumulatedSeconds = 0;
    }
    active.subjectId = document.getElementById("timerSubjectSelect").value || null;
    active.topicId = document.getElementById("timerTopicSelect").value || null;
    active.type = document.getElementById("timerTypeSelect").value || "study";
    active.runStartedAt = nowISO2();
    active.isRunning = true;
    active.hiddenAt = null;
    timerStartedAt = active.startedAt;
    timerRunning = true;
    clearInterval(timerIntervalId);
    timerIntervalId = setInterval(timerTick, 1e3);
    timerTick();
    updateTimerControls();
    scheduleSave();
  }
  function pauseTimer(shouldSave = true) {
    timerSeconds = currentTimerSeconds();
    state.activeTimer.accumulatedSeconds = timerSeconds;
    state.activeTimer.runStartedAt = null;
    state.activeTimer.isRunning = false;
    state.activeTimer.hiddenAt = null;
    timerRunning = false;
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    updateTimerDisplay();
    updateTimerControls();
    if (shouldSave) scheduleSave();
  }
  function resetTimer() {
    pauseTimer(false);
    releaseActivePlanItem();
    timerSeconds = 0;
    timerStartedAt = null;
    Object.assign(state.activeTimer, { startedAt: null, runStartedAt: null, accumulatedSeconds: 0, isRunning: false, hiddenAt: null, planItemId: null, targetMinutes: null });
    updateTimerDisplay();
    updateTimerControls();
    scheduleSave();
  }
  function restoreTimerFromState() {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    timerSeconds = currentTimerSeconds();
    timerStartedAt = state.activeTimer.startedAt || null;
    timerRunning = Boolean(state.activeTimer.isRunning);
    const runStart = state.activeTimer.runStartedAt ? Date.parse(state.activeTimer.runStartedAt) : 0;
    const recoveredLongRun = timerRunning && runStart && Date.now() - runStart > 4 * 60 * 60 * 1e3;
    if (recoveredLongRun) {
      pauseTimer(false);
      scheduleSave();
      setTimeout(() => showConfirm(
        `Uma sessão longa foi recuperada com ${formatDuration(timerSeconds)}. Manter esse tempo e continuar com o cronômetro pausado?`,
        () => showToast("Tempo recuperado. Você pode continuar ou finalizar a sessão."),
        () => {
          resetTimer();
          showToast("Intervalo recuperado descartado.");
        }
      ), 0);
    } else if (timerRunning) {
      timerIntervalId = setInterval(timerTick, 1e3);
    }
    updateTimerDisplay();
    populateTimerContextControls();
    updateTimerControls();
  }
  function populateSessionTopicSelect(subjectId, selectedTopicId = null) {
    const select = document.getElementById("sessionModalTopic");
    const subject = getSubjectById(subjectId);
    select.innerHTML = `<option value="">Sem tópico específico</option>` + (subject ? topicsForSelection(subject, selectedTopicId).map((topic) => `<option value="${escapeAttr(topic.id)}">${escapeHtml(topic.name || "(tópico sem nome)")}</option>`).join("") : "");
  }
  function showSessionModal() {
    const overlay = document.getElementById("sessionModalOverlay");
    document.getElementById("sessionModalDuration").textContent = formatTimer(timerSeconds);
    const sel = document.getElementById("sessionModalSubject");
    sel.innerHTML = `<option value="">Sem disciplina específica</option>` + subjectsForSelection(state.activeTimer.subjectId).map((s) => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}${s.archived ? " (arquivada)" : ""}</option>`).join("");
    sel.value = state.activeTimer.subjectId || "";
    populateSessionTopicSelect(sel.value, state.activeTimer.topicId);
    document.getElementById("sessionModalTopic").value = state.activeTimer.topicId || "";
    document.getElementById("sessionModalType").value = state.activeTimer.type || "study";
    document.getElementById("sessionModalResolved").value = "";
    document.getElementById("sessionModalCorrect").value = "";
    document.getElementById("sessionModalNotes").value = "";
    overlay.classList.add("show");
  }
  function closeSessionModal() {
    document.getElementById("sessionModalOverlay").classList.remove("show");
    resetTimer();
  }
  document.getElementById("timerStartBtn").addEventListener("click", startTimer);
  document.getElementById("timerPauseBtn").addEventListener("click", pauseTimer);
  document.getElementById("timerSubjectSelect").addEventListener("change", function() {
    state.activeTimer.subjectId = this.value || null;
    state.activeTimer.topicId = null;
    populateTimerTopicSelect(state.activeTimer.subjectId, null);
    scheduleSave();
  });
  document.getElementById("timerTopicSelect").addEventListener("change", function() {
    state.activeTimer.topicId = this.value || null;
    scheduleSave();
  });
  document.getElementById("timerTypeSelect").addEventListener("change", function() {
    state.activeTimer.type = this.value || "study";
    scheduleSave();
  });
  document.getElementById("timerResetBtn").addEventListener("click", () => {
    if (timerSeconds === 0) {
      return;
    }
    showConfirm("Zerar o cronômetro? O tempo desta sessão será perdido.", resetTimer);
  });
  document.getElementById("timerFinishBtn").addEventListener("click", () => {
    if (timerSeconds === 0) {
      showToast("O cronômetro ainda não começou.");
      return;
    }
    pauseTimer();
    showSessionModal();
  });
  document.getElementById("sessionModalSkipBtn").addEventListener("click", closeSessionModal);
  document.getElementById("sessionModalSubject").addEventListener("change", function() {
    populateSessionTopicSelect(this.value);
  });
  document.getElementById("sessionModalSaveBtn").addEventListener("click", () => {
    const subjectId = document.getElementById("sessionModalSubject").value || null;
    const topicId = document.getElementById("sessionModalTopic").value || null;
    const type = document.getElementById("sessionModalType").value || "study";
    const resolved = Number(document.getElementById("sessionModalResolved").value) || 0;
    const correct = Number(document.getElementById("sessionModalCorrect").value) || 0;
    const notes = document.getElementById("sessionModalNotes").value.trim();
    const session = {
      id: uid("session"),
      startedAt: timerStartedAt || nowISO2(),
      endedAt: nowISO2(),
      date: localDateFromTimestamp2(timerStartedAt || nowISO2()),
      durationSeconds: timerSeconds,
      subjectId,
      topicId,
      type,
      questionsResolved: resolved,
      correctAnswers: Math.min(correct, resolved),
      notes,
      planItemId: state.activeTimer.planItemId || null
    };
    sessionService.complete(session);
    persistAndRender();
    showToast(resolved > 0 ? "Sessão e questões registradas." : "Sessão de estudo registrada.");
    closeSessionModal();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (state.activeTimer.isRunning) {
        state.activeTimer.hiddenAt = nowISO2();
        scheduleSave();
      }
      return;
    }
    const hiddenAt = state.activeTimer.hiddenAt ? Date.parse(state.activeTimer.hiddenAt) : 0;
    if (!state.activeTimer.isRunning || !hiddenAt) return;
    const awaySeconds = Math.max(0, Math.floor((Date.now() - hiddenAt) / 1e3));
    if (awaySeconds >= 2 * 60 * 60) {
      pauseTimer();
      showConfirm(
        `O cronômetro ficou em segundo plano por ${formatDuration(awaySeconds)}. Manter o intervalo no tempo da sessão?`,
        () => showToast("Intervalo mantido. O cronômetro ficou pausado."),
        () => {
          resetTimer();
          showToast("Intervalo descartado.");
        }
      );
    } else {
      state.activeTimer.hiddenAt = null;
      scheduleSave();
    }
  });
  var BADGES = [
    { id: "streak7", icon: "🔥", name: "Uma semana de foco", desc: "7 dias seguidos estudando", check: () => computeStreak(getActivityDates()) >= 7 },
    { id: "streak30", icon: "🏆", name: "Mês de ferro", desc: "30 dias seguidos estudando", check: () => computeStreak(getActivityDates()) >= 30 },
    { id: "subject100", icon: "🎯", name: "Disciplina dominada", desc: "Uma disciplina 100% concluída", check: () => state.subjects.some((s) => s.topics.length > 0 && subjectProgress(s) === 100) },
    { id: "allsubjects", icon: "🗂️", name: "Plano completo", desc: "Todas as disciplinas 100%", check: () => activeSubjects().length > 0 && activeSubjects().every((s) => s.topics.some((t) => !t.archived) && subjectProgress(s) === 100) },
    { id: "topics10", icon: "✅", name: "Dez tópicos", desc: "10 tópicos concluídos", check: () => allTopics().filter((t) => t.status === "Concluído").length >= 10 },
    { id: "topics50", icon: "📚", name: "Cinquenta tópicos", desc: "50 tópicos concluídos", check: () => allTopics().filter((t) => t.status === "Concluído").length >= 50 },
    { id: "q100", icon: "✍️", name: "Cem questões", desc: "100 questões resolvidas", check: () => state.questoes.reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0) >= 100 },
    { id: "q500", icon: "🧠", name: "Quinhentas questões", desc: "500 questões resolvidas", check: () => state.questoes.reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0) >= 500 },
    { id: "sim1", icon: "📝", name: "Primeiro simulado", desc: "Completou o primeiro simulado", check: () => state.simulados.length >= 1 },
    { id: "sim5", icon: "🏅", name: "Cinco simulados", desc: "Completou 5 simulados", check: () => state.simulados.length >= 5 }
  ];
  function renderBadges() {
    const grid = document.getElementById("badgesGrid");
    grid.innerHTML = BADGES.map((b) => {
      const unlocked = b.check();
      return `<div class="badge-card ${unlocked ? "unlocked" : ""}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
    </div>`;
    }).join("");
  }
  function heatmapTooltip(summary) {
    const parts = [formatDatePt(summary.date), formatDuration(summary.seconds), pluralize(summary.sessions.length, "sessão", "sessões")];
    if (summary.targetSeconds > 0) parts.push(`${summary.goalPct}% da meta`);
    if (summary.questions > 0) parts.push(`${summary.questions} questões · ${summary.accuracy}% de acerto`);
    if (summary.reviews > 0) parts.push(pluralize(summary.reviews, "revisão", "revisões"));
    if (summary.simulations > 0) parts.push(pluralize(summary.simulations, "simulado"));
    if (summary.subjectNames.length) parts.push(summary.subjectNames.join(", "));
    return parts.join(" · ");
  }
  function renderHeatmap() {
    const activityDates = getActivityDates();
    const earliest = [...activityDates].sort()[0];
    const historyDays = earliest ? Math.max(1, Math.round((parseLocalDate(todayISO()) - parseLocalDate(earliest)) / 864e5) + 1) : DEFAULT_STREAK_WEEKS * 7;
    const days = streakView.expanded ? historyDays : DEFAULT_STREAK_WEEKS * 7;
    const today = todayISO();
    const cells = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const summary = getDailyStudySummary(d, { subjectId: streakView.subjectId });
      const active = heatmapMetricLevel(summary, streakView.metric) > 0;
      if (!streakView.onlyActiveDays || active) cells.push(summary);
    }
    const heatmapModel = buildHeatmapViewModel({ summaries: cells, metric: streakView.metric, selectedDate: streakView.selectedDate });
    const cellsHtml = heatmapModel.cells.map((summary) => {
      const level = summary.level;
      const tooltip = heatmapTooltip(summary);
      const selected = streakView.selectedDate === summary.date ? "selected" : "";
      return `<button type="button" class="heatmap-cell ${level > 0 ? "heat-" + level : ""} ${selected}" title="${escapeAttr(tooltip)}" aria-label="${escapeAttr(tooltip)}" data-delegated-click="selectHeatmapDay('${summary.date}')"></button>`;
    }).join("");
    const hasMetricActivity = heatmapModel.hasActivity;
    const activityStreak = computeStreak(activityDates);
    const goalStreak = computeStreak(getGoalDates());
    document.getElementById("heatmapContainer").innerHTML = `
    <div class="heatmap-toolbar" aria-label="Período da sequência">
      <select aria-label="Métrica do heatmap" data-delegated-change="setHeatmapFilter('metric',this.value)"><option value="hours" ${streakView.metric === "hours" ? "selected" : ""}>Horas</option><option value="questions" ${streakView.metric === "questions" ? "selected" : ""}>Questões</option><option value="reviews" ${streakView.metric === "reviews" ? "selected" : ""}>Revisões</option><option value="simulations" ${streakView.metric === "simulations" ? "selected" : ""}>Simulados</option></select>
      <select aria-label="Disciplina do heatmap" data-delegated-change="setHeatmapFilter('subjectId',this.value)"><option value="">Todas as disciplinas</option>${activeSubjects().map((subject) => `<option value="${escapeAttr(subject.id)}" ${streakView.subjectId === subject.id ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join("")}</select>
      <span>${streakView.expanded ? "Período completo" : `Últimas ${DEFAULT_STREAK_WEEKS} semanas`}</span>
      <button class="btn ghost small" data-delegated-click="toggleStreakExpanded()">${streakView.expanded ? "Mostrar menos" : "Ver período completo"}</button>
      <button class="btn ghost small" aria-pressed="${streakView.onlyActiveDays}" data-delegated-click="toggleStreakActiveDays()">${streakView.onlyActiveDays ? "Mostrar todos os dias" : "Apenas dias com atividade"}</button>
    </div>
    <div class="heatmap-grid">${cellsHtml}</div>
    ${hasMetricActivity ? "" : `<div class="empty-inline heatmap-empty"><p>Nenhuma atividade encontrada para este indicador e disciplina.</p><button class="btn small" data-delegated-click="focusStudyTimer()">Iniciar estudo</button></div>`}
    <div class="heatmap-legend">
      0%
      <span class="heatmap-cell"></span>
      <span class="heatmap-cell heat-1"></span>
      <span class="heatmap-cell heat-2"></span>
      <span class="heatmap-cell heat-3"></span>
      meta atingida
    </div>
    <div class="heatmap-summary">
      <span>🔥 Atividade: ${pluralize(activityStreak, "dia")}</span>
      <span>🎯 Meta atingida: ${pluralize(goalStreak, "dia")}</span>
      <span>${streakView.metric === "hours" ? "Cores: <50% · 50–99% · ≥100% da meta diária" : "Intensidade relativa da atividade selecionada"}</span>
    </div>
    ${streakView.selectedDate ? `<div class="heatmap-detail" role="status">${escapeHtml(heatmapTooltip(getDailyStudySummary(streakView.selectedDate, { subjectId: streakView.subjectId })))} <button class="btn ghost small" data-delegated-click="viewSelectedHeatmapSessions()">Ver sessões deste dia</button></div>` : ""}
  `;
  }
  function setHeatmapFilter(field, value2) {
    if (field === "metric" && HEATMAP_METRICS.includes(value2)) streakView.metric = value2;
    if (field === "subjectId") streakView.subjectId = value2;
    streakView.selectedDate = null;
    renderHeatmap();
  }
  function selectHeatmapDay(date2) {
    streakView.selectedDate = date2;
    renderHeatmap();
  }
  function viewSelectedHeatmapSessions() {
    if (streakView.selectedDate) selectSessionHistoryDate(streakView.selectedDate);
  }
  function getMetricDataState(metric, minimumConfidence = 0.35) {
    if (!metric?.available || metric.raw === null) return "empty";
    if ((Number(metric.confidence) || 0) < minimumConfidence) return "insufficient";
    return "ready";
  }
  function metricStateLabel(metric, minimumConfidence = 0.35) {
    const status = getMetricDataState(metric, minimumConfidence);
    if (status === "empty") return "Aguardando dados";
    if (status === "insufficient") return "Estimativa inicial";
    return "Resultado calculado";
  }
  function renderSimuladosChart() {
    const card = document.getElementById("simuladosChartCard");
    const container = document.getElementById("simuladosChart");
    const data = [...state.simulados].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (data.length < 2) {
      card.style.display = "none";
      return;
    }
    card.style.display = "block";
    const W = 640, H = 160, padL = 30, padR = 12, padT = 12, padB = 26;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = data.length;
    const xFor = (i) => padL + (n === 1 ? 0 : i / (n - 1) * plotW);
    const yFor = (pct) => padT + plotH - pct / 100 * plotH;
    const notas = data.map((s) => simuladoNota(s));
    const points = notas.map((pct, i) => `${xFor(i)},${yFor(pct)}`).join(" ");
    const gridLines = [0, 25, 50, 75, 100].map((v) => `
    <line class="chart-grid" x1="${padL}" y1="${yFor(v)}" x2="${W - padR}" y2="${yFor(v)}"></line>
    <text x="2" y="${yFor(v) + 3}">${v}%</text>
  `).join("");
    const dots = data.map((s, i) => `<circle class="chart-dot" cx="${xFor(i)}" cy="${yFor(notas[i])}" r="3"><title>${escapeHtml(s.nome || "Simulado")} (${formatDatePt(s.date)}): ${notas[i]}%</title></circle>`).join("");
    const labels = data.map((s, i) => `<text x="${xFor(i)}" y="${H - 6}" text-anchor="middle">${i + 1}</text>`).join("");
    container.innerHTML = `
    <svg class="progress-chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">
      ${gridLines}
      <polyline class="chart-line" points="${points}"></polyline>
      ${dots}
      ${labels}
    </svg>
  `;
  }
  function getSubjectQuestionRecords(subjectId) {
    const records = [];
    state.questoes.filter((q) => entitySubjectId(q) === subjectId).forEach((q) => {
      records.push({ date: q.date, correct: Number(q.correct) || 0, total: Number(q.resolved) || 0 });
    });
    state.simulados.forEach((sim) => {
      (sim.breakdown || []).filter((b) => entitySubjectId(b) === subjectId).forEach((b) => {
        records.push({ date: sim.date, correct: Number(b.correct) || 0, total: Number(b.total) || 0 });
      });
    });
    return records.filter((r) => r.total > 0).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }
  function computeSubjectPerformance() {
    const subjectIds = /* @__PURE__ */ new Set();
    state.questoes.forEach((q) => {
      const id = entitySubjectId(q);
      if (id) subjectIds.add(id);
    });
    state.simulados.forEach((sim) => (sim.breakdown || []).forEach((b) => {
      const id = entitySubjectId(b);
      if (id) subjectIds.add(id);
    }));
    const results = [];
    subjectIds.forEach((subjectId) => {
      const records = getSubjectQuestionRecords(subjectId);
      const total = records.reduce((s, r) => s + r.total, 0);
      const correct = records.reduce((s, r) => s + r.correct, 0);
      if (total === 0) return;
      const acerto = calcAcertoPct(correct, total);
      let trend = "→";
      if (records.length >= 2) {
        const mid = Math.ceil(records.length / 2);
        const first = records.slice(0, mid);
        const second = records.slice(mid);
        const firstTotal = first.reduce((s, r) => s + r.total, 0);
        const secondTotal = second.reduce((s, r) => s + r.total, 0);
        if (firstTotal > 0 && secondTotal > 0) {
          const firstPct = calcAcertoPct(first.reduce((s, r) => s + r.correct, 0), firstTotal);
          const secondPct = calcAcertoPct(second.reduce((s, r) => s + r.correct, 0), secondTotal);
          if (secondPct - firstPct >= 3) trend = "↑";
          else if (firstPct - secondPct >= 3) trend = "↓";
        }
      }
      results.push({ subjectId, subject: getSubjectName(subjectId), acerto, total, trend });
    });
    return results.sort((a, b) => a.acerto - b.acerto);
  }
  function renderDesempenhoDisciplina() {
    const card = document.getElementById("desempenhoDisciplinaCard");
    const container = document.getElementById("desempenhoDisciplinaBars");
    const perf = computeSubjectPerformance();
    if (perf.length === 0) {
      card.style.display = "none";
      return;
    }
    card.style.display = "block";
    const rows = perf.map((p) => {
      const trend = calculateWeightedTrend(getSubjectWeeklyTrend(p.subjectId));
      const color = trend.key === "up" ? "var(--green)" : trend.key === "down" ? "var(--red)" : "var(--ink-soft)";
      const comparison = trend.key === "insufficient" ? "Amostra insuficiente" : `${trend.previousAccuracy}% → ${trend.recentAccuracy}% (${trend.delta >= 0 ? "+" : ""}${trend.delta} p.p.)`;
      return `
    <tr>
      <td>${escapeHtml(p.subject)}</td>
      <td style="text-align:right;">${p.acerto}%</td>
      <td style="text-align:right;">${p.total}</td>
      <td style="text-align:right;color:${color};font-weight:600;">${trend.icon} ${escapeHtml(trend.label)}<small class="trend-comparison">${escapeHtml(comparison)}</small></td>
    </tr>
  `;
    }).join("");
    const fracos = perf.filter((p) => p.acerto < 70 && p.total >= 5);
    const alertasHtml = fracos.length ? fracos.map((p) => `<div class="desempenho-alerta">🔴 ${escapeHtml(p.subject)} precisa de atenção.</div>`).join("") : "";
    container.innerHTML = `
    <table class="weekly-history-table" style="margin-bottom:${fracos.length ? "12px" : "0"};">
      <thead>
        <tr><th>Disciplina</th><th style="text-align:right;">Acerto</th><th style="text-align:right;">Questões</th><th style="text-align:right;">Tendência · 4 semanas × 4 anteriores</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${alertasHtml}
  `;
  }
  function performGlobalSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    state.subjects.forEach((s) => {
      s.topics.forEach((t) => {
        const hay = [t.name || "", t.notes || "", ...t.tags || []].join(" ").toLowerCase();
        if (hay.includes(q)) {
          results.push({ subjectId: s.id, subjectName: s.name, topicId: t.id, topicName: t.name || "(sem nome)" });
        }
      });
    });
    return results.slice(0, 8);
  }
  function renderGlobalSearchResults() {
    const input = document.getElementById("globalSearchInput");
    const panel = document.getElementById("globalSearchResults");
    const q = input.value;
    if (!q.trim()) {
      panel.classList.remove("show");
      panel.innerHTML = "";
      return;
    }
    const results = performGlobalSearch(q);
    if (results.length === 0) {
      panel.innerHTML = `<div class="search-result-empty">Nada encontrado pra "${escapeHtml(q)}"</div>`;
    } else {
      panel.innerHTML = results.map((r) => `
      <div class="search-result-item" onmousedown="jumpToTopic('${r.subjectId}','${r.topicId}')">
        <strong>${escapeHtml(r.topicName)}</strong>
        <span>${escapeHtml(r.subjectName)}</span>
      </div>
    `).join("");
    }
    panel.classList.add("show");
  }
  document.getElementById("globalSearchInput").addEventListener("input", renderGlobalSearchResults);
  document.getElementById("globalSearchInput").addEventListener("focus", renderGlobalSearchResults);
  document.getElementById("globalSearchInput").addEventListener("blur", () => {
    setTimeout(() => document.getElementById("globalSearchResults").classList.remove("show"), 150);
  });
  function renderHeader() {
    const topics = activeTopics();
    const total = topics.length;
    const done = topics.filter((t) => t.status === "Concluído").length;
    const andamento = topics.filter((t) => t.status === "Em andamento").length;
    const pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById("balanceFigure").innerHTML = `${pct}<span>%</span>`;
    document.getElementById("balanceSub").textContent = `${done} de ${total} tópicos concluídos`;
    document.getElementById("statSubjects").textContent = activeSubjects().length;
    document.getElementById("statAndamento").textContent = andamento;
    document.getElementById("statConcluido").textContent = done;
    const revisoesPrevistas = state.calendar.filter((c) => c.date >= todayISO()).length + state.reviewAgenda.filter((a) => a.date >= todayISO() && a.status !== "Concluído").length;
    document.getElementById("statRevisoes").textContent = revisoesPrevistas;
    document.getElementById("statStreak").textContent = computeStreak(getActivityDates());
    recordProgressSnapshot(pct);
    renderExamCountdown();
  }
  var upcomingVisible = 5;
  function changeUpcomingLimit(delta) {
    upcomingVisible += Number(delta || 0);
    renderDashboard();
  }
  function showAllUpcoming() {
    upcomingVisible = Number.MAX_SAFE_INTEGER;
    renderDashboard();
  }
  function resetUpcomingLimit() {
    upcomingVisible = 5;
    renderDashboard();
  }
  function renderDashboard() {
    const topics = activeTopics();
    const total = topics.length;
    const done = topics.filter((t) => t.status === "Concluído").length;
    const andamento = topics.filter((t) => t.status === "Em andamento").length;
    const naoIniciado = topics.filter((t) => t.status === "Não iniciado").length;
    const qs = document.getElementById("quickStats");
    qs.innerHTML = `
    <div class="stat-cell"><div class="n">${total}</div><div class="l">Tópicos totais</div></div>
    <div class="stat-cell"><div class="n">${naoIniciado}</div><div class="l">Não iniciados</div></div>
    <div class="stat-cell"><div class="n">${andamento}</div><div class="l">Em andamento</div></div>
    <div class="stat-cell"><div class="n">${done}</div><div class="l">Concluídos</div></div>
  `;
    const bars2 = document.getElementById("progressBars");
    if (activeSubjects().length === 0) {
      bars2.innerHTML = `<div class="upcoming-empty">Adicione disciplinas na aba "Disciplinas" para ver o progresso aqui.</div>`;
    } else {
      bars2.innerHTML = activeSubjects().map((s) => {
        const pct = subjectProgress(s);
        return `<div class="bar-row">
        <div class="bar-label" title="${escapeAttr(s.name)}">${escapeHtml(s.name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-pct">${pct}%</div>
      </div>`;
      }).join("");
    }
    const calItems = state.calendar.filter((c) => c.date >= todayISO()).map((c) => ({ date: c.date, subject: entitySubjectName(c), label: c.reviewType && c.reviewType !== "—" ? c.reviewType : "Revisão", status: c.status, origem: "Calendário" }));
    const agendaItems = state.reviewAgenda.filter((a) => a.date >= todayISO()).map((a) => ({ date: a.date, subject: entitySubjectName(a), label: `${a.topicId ? getTopicName(a.topicId) : a.topic || "Tópico"} · ${a.tipo}`, status: a.status, origem: "Agenda de Revisões" }));
    const allUpcoming = [...calItems, ...agendaItems].sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = allUpcoming.slice(0, upcomingVisible);
    const ul = document.getElementById("upcomingList");
    const title = document.getElementById("upcomingTitle"), footer = document.getElementById("upcomingFooter");
    if (title) title.textContent = `Próximas revisões · ${allUpcoming.length}`;
    if (upcoming.length === 0) {
      ul.innerHTML = `<li class="upcoming-empty">Nenhuma revisão futura cadastrada. Adicione datas no Calendário ou gere a Agenda de Revisões.</li>`;
      if (footer) footer.innerHTML = "";
    } else {
      ul.innerHTML = upcoming.map((c) => `
      <li>
        <span class="upcoming-date">${formatDatePt(c.date)}</span>
        <span style="flex:1;"><strong>${escapeHtml(c.subject || "—")}</strong> — ${escapeHtml(unifiedItemLabel(c))}<span class="item-origin">${escapeHtml(c.origem)}</span></span>
        <span class="subject-progress-pill">${escapeHtml(c.status || "Não iniciado")}</span>
      </li>
    `).join("");
      if (footer) footer.innerHTML = renderCollectionFooter({ variant: "block", total: allUpcoming.length, visible: upcoming.length, step: 5, label: "revisões", showMoreAction: "changeUpcomingLimit(5)", showAllAction: "showAllUpcoming()", showLessAction: upcomingVisible > 5 ? "resetUpcomingLimit()" : "" }) + `<button class="btn ghost small upcoming-calendar-link" data-delegated-click="navigateKpi('calendario')">Ver todas no calendário</button>`;
    }
  }
  function renderSubjects() {
    const container = document.getElementById("subjectsContainer");
    const subjects = activeSubjects();
    const archived = archivedSubjects();
    if (subjects.length === 0 && archived.length === 0) {
      container.innerHTML = `<div class="empty-state">
      <p>Nenhuma disciplina cadastrada ainda.</p>
      <button class="btn" data-delegated-click="addSubject()">+ Adicionar primeira disciplina</button>
    </div>`;
      return;
    }
    const activeHtml = subjects.length === 0 ? `<div class="empty-state"><p>Nenhuma disciplina ativa.</p><button class="btn" data-delegated-click="addSubject()">+ Adicionar disciplina</button></div>` : subjects.map((s, idx) => {
      const pct = subjectProgress(s);
      const subjectTopics = s.topics.filter((t) => !t.archived);
      const topicFilter = subjectTopicFilters.get(s.id) || { status: "", difficulty: "" };
      const allVisibleTopics = subjectTopics.filter((topic) => (!topicFilter.status || topic.status === topicFilter.status) && (!topicFilter.difficulty || topic.difficulty === topicFilter.difficulty));
      const topicLimit = subjectTopicLimits.get(s.id) || 10;
      const visibleTopics = allVisibleTopics.slice(0, topicLimit);
      const archivedTopics = s.topics.filter((t) => t.archived);
      return `
    <div class="subject-block" data-subject-id="${s.id}">
      <div class="subject-header" data-delegated-click="toggleSubject('${s.id}')">
        <div class="subject-header-left">
          <div class="subject-order-btns" data-delegated-click="event.stopPropagation()">
            <button class="icon-btn-nav" data-delegated-click="moveSubject('${s.id}', -1)" ${idx === 0 ? "disabled" : ""} title="Mover pra cima">▲</button>
            <button class="icon-btn-nav" data-delegated-click="moveSubject('${s.id}', 1)" ${idx === subjects.length - 1 ? "disabled" : ""} title="Mover pra baixo">▼</button>
          </div>
          <span class="subject-toggle">${s.collapsed ? "▸" : "▾"}</span>
          <span class="subject-name" contenteditable="true"
                data-delegated-click="event.stopPropagation()"
                data-delegated-blur="renameSubject('${s.id}', this.textContent)">${escapeHtml(s.name)}</span>
        </div>
        <div class="subject-header-actions">
          <span class="subject-progress-pill">${pct}% · ${subjectTopics.length} tópico${subjectTopics.length === 1 ? "" : "s"}</span>
          <button class="btn ghost small" data-delegated-click="event.stopPropagation();duplicateSubject('${s.id}')">Duplicar</button>
          <button class="btn ghost small" data-delegated-click="event.stopPropagation();archiveSubject('${s.id}')">Arquivar</button>
        </div>
      </div>
      <div class="subject-body ${s.collapsed ? "collapsed" : ""}">
        <div class="subject-topic-filters"><select aria-label="Filtrar tópicos de ${escapeAttr(s.name)} por status" data-delegated-change="setSubjectTopicFilter('${s.id}','status',this.value)"><option value="">Todos os status</option>${STATUS_OPTIONS.map((option) => `<option value="${option}" ${topicFilter.status === option ? "selected" : ""}>${option}</option>`).join("")}</select><select aria-label="Filtrar tópicos de ${escapeAttr(s.name)} por dificuldade" data-delegated-change="setSubjectTopicFilter('${s.id}','difficulty',this.value)"><option value="">Todas as dificuldades</option>${DIFFICULTY_OPTIONS.map((option) => `<option value="${option}" ${topicFilter.difficulty === option ? "selected" : ""}>${option}</option>`).join("")}</select></div>
        <div class="ledger-scroll">
        <table class="ledger">
          <thead>
            <tr>
              <th style="width:22%;">Tópico</th>
              <th style="width:15%;">Link / material</th>
              <th style="width:13%;">Status</th>
              <th style="width:13%;">Dificuldade</th>
              <th style="width:9%;">Notas</th>
              <th style="width:6%;"></th>
            </tr>
          </thead>
          <tbody>
            ${visibleTopics.map((t) => `
              <tr data-status="${t.status}" id="topic-row-${t.id}">
                <td>
                  <input type="text" value="${escapeAttr(t.name)}" placeholder="Nome do tópico"
                     data-delegated-blur="updateTopic('${s.id}','${t.id}','name', this.value)">
                  ${t.tags && t.tags.length ? `<div class="tag-chips">${t.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
                </td>
                <td>
                  <input type="url" value="${escapeAttr(t.link || "")}" placeholder="https://..."
                     data-delegated-blur="updateTopic('${s.id}','${t.id}','link', this.value)">
                </td>
                <td>
                  <select class="status-select ${STATUS_CLASS[t.status] || "st-nao"}"
                     data-delegated-change="updateTopicStatus('${s.id}','${t.id}', this)">
                    ${STATUS_OPTIONS.map((o) => `<option value="${o}" ${o === t.status ? "selected" : ""}>${o}</option>`).join("")}
                  </select>
                  <span class="stamp">✓ ok</span>
                </td>
                <td>
                  <select class="status-select ${DIFFICULTY_CLASS[t.difficulty] || "diff-medio"}"
                     data-delegated-change="updateTopic('${s.id}','${t.id}','difficulty', this.value)">
                    ${DIFFICULTY_OPTIONS.map((o) => `<option value="${o}" ${o === t.difficulty ? "selected" : ""}>${o}</option>`).join("")}
                  </select>
                </td>
                <td>
                  <button class="btn ghost small notes-toggle-btn ${t.notes || t.tags && t.tags.length ? "has-notes" : ""}" data-delegated-click="toggleNotes('${t.id}')">${t.notes || t.tags && t.tags.length ? "📝 ver" : "📝 add"}</button>
                </td>
                <td><button class="icon-btn" data-delegated-click="archiveTopic('${s.id}','${t.id}')" title="Arquivar tópico">✕</button></td>
              </tr>
              ${openNotesIds.has(t.id) ? `
              <tr class="notes-row">
                <td colspan="6">
                  ${renderTopicAnalyticsState(s, t)}
                  <div class="topic-strategy-fields">
                    <label>Importância na prova (%)<input type="number" min="0" max="100" step="1" placeholder="Não definida" value="${t.examImportance == null ? "" : Math.round(t.examImportance * 100)}" data-delegated-blur="updateTopicStrategy('${s.id}','${t.id}','examImportance',this.value)"></label>
                    <label>Esforço total estimado (min)<input type="number" min="1" step="5" placeholder="Não definido" value="${t.estimatedStudyMinutes == null ? "" : t.estimatedStudyMinutes}" data-delegated-blur="updateTopicStrategy('${s.id}','${t.id}','estimatedStudyMinutes',this.value)"></label>
                  </div>
                  <input type="text" class="topic-tags-input" placeholder="Tags separadas por vírgula (ex: cai muito, revisar antes da prova)"
                    value="${escapeAttr((t.tags || []).join(", "))}"
                    data-delegated-blur="updateTopicTags('${s.id}','${t.id}', this.value)">
                  <textarea class="topic-notes-textarea" placeholder="Resumo, pegadinha da prova, dúvida pra revisar depois..."
                    data-delegated-blur="updateTopic('${s.id}','${t.id}','notes', this.value)">${escapeHtml(t.notes || "")}</textarea>
                </td>
              </tr>` : ""}
            `).join("")}
          </tbody>
        </table>
        </div>
        ${renderCollectionFooter({ variant: "block", total: allVisibleTopics.length, visible: visibleTopics.length, step: 10, label: `tópicos filtrados · ${subjectTopics.length} no total`, showMoreAction: `changeSubjectTopicLimit('${s.id}',10)`, showAllAction: `showAllSubjectTopics('${s.id}')`, showLessAction: topicLimit > 10 ? `resetSubjectTopicLimit('${s.id}')` : "" })}
        <div class="add-topic-row">
          <button class="btn ghost small" data-delegated-click="addTopic('${s.id}')">+ Adicionar tópico</button>
        </div>
        ${archivedTopics.length ? `<div class="archived-section">
          <div class="archived-section-title">Tópicos arquivados</div>
          ${archivedTopics.map((t) => `<div class="archived-item">
            <div><div class="archived-item-name">${escapeHtml(t.name || "Tópico sem nome")}</div><div class="archived-item-date">Arquivado em ${t.archivedAt ? new Date(t.archivedAt).toLocaleDateString("pt-BR") : "—"}</div></div>
            <div class="archived-item-actions"><button class="btn ghost small" data-delegated-click="restoreTopic('${s.id}','${t.id}')">Restaurar</button><button class="btn danger" data-delegated-click="requestPermanentTopicDelete('${s.id}','${t.id}')">Excluir definitivamente</button></div>
          </div>`).join("")}
        </div>` : ""}
      </div>
    </div>`;
    }).join("");
    const archivedHtml = archived.length ? `<div class="archived-section">
    <div class="archived-section-title">Disciplinas arquivadas</div>
    ${archived.map((s) => `<div class="archived-item">
      <div><div class="archived-item-name">${escapeHtml(s.name)}</div><div class="archived-item-date">Arquivada em ${s.archivedAt ? new Date(s.archivedAt).toLocaleDateString("pt-BR") : "—"} · ${pluralize(s.topics.length, "tópico")}</div></div>
      <div class="archived-item-actions"><button class="btn ghost small" data-delegated-click="restoreSubject('${s.id}')">Restaurar</button><button class="btn danger" data-delegated-click="requestPermanentSubjectDelete('${s.id}')">Excluir definitivamente</button></div>
    </div>`).join("")}
  </div>` : "";
    container.innerHTML = activeHtml + archivedHtml;
  }
  var openNotesIds = /* @__PURE__ */ new Set();
  var subjectTopicLimits = /* @__PURE__ */ new Map();
  var subjectTopicFilters = /* @__PURE__ */ new Map();
  function toggleNotes(topicId) {
    if (openNotesIds.has(topicId)) openNotesIds.clear();
    else {
      openNotesIds.clear();
      openNotesIds.add(topicId);
    }
    renderSubjects();
  }
  function changeSubjectTopicLimit(subjectId, delta) {
    subjectTopicLimits.set(subjectId, (subjectTopicLimits.get(subjectId) || 10) + Number(delta || 0));
    renderSubjects();
  }
  function showAllSubjectTopics(subjectId) {
    subjectTopicLimits.set(subjectId, Number.MAX_SAFE_INTEGER);
    renderSubjects();
  }
  function resetSubjectTopicLimit(subjectId) {
    subjectTopicLimits.set(subjectId, 10);
    renderSubjects();
  }
  function setSubjectTopicFilter(subjectId, field, value2) {
    const current = subjectTopicFilters.get(subjectId) || { status: "", difficulty: "" };
    if (field === "status" || field === "difficulty") current[field] = value2;
    subjectTopicFilters.set(subjectId, current);
    subjectTopicLimits.set(subjectId, 10);
    renderSubjects();
  }
  function updateTopicTags(subjectId, topicId, value2) {
    subjectService.updateTopic(subjectId, topicId, { tags: value2.split(",").map((tag) => tag.trim()).filter(Boolean) });
    persistAndRender();
  }
  function updateTopicStrategy(subjectId, topicId, field, value2) {
    studyPlanPreview = null;
    const found = getTopicById(topicId);
    if (!found || found.subject.id !== subjectId) return;
    const changes = {};
    if (field === "examImportance") changes.examImportance = value2 === "" ? null : Number(value2) / 100;
    if (field === "estimatedStudyMinutes") changes.estimatedStudyMinutes = value2 === "" ? null : Number(value2);
    Object.assign(found.topic, changes);
    normalizeTopicStrategy(found.topic);
    subjectService.updateTopic(subjectId, topicId, found.topic);
    persistAndRender();
  }
  function renderTopicAnalyticsState(subject, topic) {
    const coverage = topic.status === "Concluído" ? 100 : topic.status === "Em andamento" || topic.status === "Revisão" ? 50 : 0;
    const masteryResult = topicMasteryIndex(subject.id, topic.id), retentionResult = topicRetentionScore(subject.id, topic.id);
    const mastery = masteryResult.confidence > 0 ? masteryResult.score : null, retention = retentionResult.available ? retentionResult.score : null;
    const diagnosis = diagnoseTopic(subject.id, topic.id), reviewHealth = topicReviewHealthScore(topic, masteryResult, retentionResult, diagnosis);
    const lastContact = diagnosis?.lastActivity ? Math.max(0, -(diasParaRevisao(diagnosis.lastActivity) ?? 0)) : null;
    const lastReviewDate = localDateFromTimestamp2(topic.lastReviewedAt);
    const lastReview = lastReviewDate ? Math.max(0, -(diasParaRevisao(lastReviewDate) ?? 0)) : null;
    const performance = diagnosis?.performance?.accuracy ?? null, trend = diagnosis?.trend;
    const blockers = prerequisiteBlockers({ ...topic, mastery, covered: coverage === 100 }, allTopics().map((item) => ({ ...item, covered: item.status === "Concluído", mastery: topicMasteryIndex(item.subjectId, item.id).confidence > 0 ? topicMasteryIndex(item.subjectId, item.id).score : null })));
    let label = "Não iniciado";
    if (coverage > 0 && mastery === null) label = "Em estudo · aguardando questões";
    else if (coverage === 100 && mastery < 50) label = "Coberto, não consolidado";
    else if (coverage === 100 && retention !== null && retention < 60) label = "Domínio em risco";
    else if (coverage === 100 && mastery >= 75) label = "Consolidado";
    else if (coverage === 100) label = "Em consolidação";
    else if (coverage > 0) label = "Em estudo";
    if (blockers.length) label = "Bloqueado por pré-requisito";
    else if (coverage === 100 && needsMaintenance({ covered: true, masteryGap: mastery === null ? null : 100 - mastery, retentionRisk: retention === null ? null : 100 - retention, reviewHealthRisk: reviewHealth.value === null ? null : 100 - reviewHealth.value })) label = "Estudado, mas precisa consolidação";
    const pctMetric = (name, value2, detail = "") => `<div class="topic-metric"><span>${name}</span><strong>${value2 === null ? "Aguardando dados" : Math.round(value2) + "%"}</strong><div class="topic-metric-track"><i style="width:${value2 === null ? 0 : Math.round(value2)}%"></i></div>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</div>`;
    const textMetric = (name, value2, detail = "") => `<div class="topic-metric"><span>${name}</span><strong>${escapeHtml(value2)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</div>`;
    const trendText = !trend || trend.key === "insufficient" ? "Aguardando dados" : `${trend.icon} ${trend.label}`;
    const eligibility = blockers.length ? `🔒 Aguarda ${blockers.map((id) => getTopicName(id) || id).join(", ")}` : coverage === 100 && !needsMaintenance({ covered: true, masteryGap: mastery === null ? null : 100 - mastery, retentionRisk: retention === null ? null : 100 - retention, reviewHealthRisk: reviewHealth.value === null ? null : 100 - reviewHealth.value }) ? "✓ Consolidado" : reviewHealth.level === "critical" ? "↻ Revisão recomendada" : masteryResult.evidence?.evidenceStrength < 0.35 ? "⚠ Poucos dados" : "★ Elegível para priorização";
    return `<div class="topic-analytics-state"><div class="topic-analytics-title">Estado analítico <strong>${escapeHtml(label)}</strong><small>${escapeHtml(eligibility)}</small></div><div class="topic-analytics-metrics">${pctMetric("Cobertura", coverage)}${pctMetric("Domínio", mastery, mastery === null ? "Registre questões deste tópico" : "Evidência " + masteryResult.evidence.evidenceLabel.toLowerCase())}${pctMetric("Retenção", retention, retention === null ? "Conclua revisões vinculadas" : "Evidência " + retentionResult.evidence.evidenceLabel.toLowerCase())}${pctMetric("Saúde da revisão", reviewHealth.value, reviewHealth.reasons[0])}${textMetric("Último contato", lastContact === null ? "Sem registro" : lastContact === 0 ? "Hoje" : lastContact + " dias")}${textMetric("Última revisão", lastReview === null ? "Sem registro" : lastReview === 0 ? "Hoje" : lastReview + " dias")}${pctMetric("Desempenho recente", performance, diagnosis?.performance?.resolved ? diagnosis.performance.resolved + " questões" : "Sem questões")}${textMetric("Tendência", trendText, trend?.delta == null ? "" : (trend.delta >= 0 ? "+" : "") + trend.delta + " p.p.")}</div></div>`;
  }
  function moveSubject(id, direction) {
    const active = activeSubjects();
    const activeIdx = active.findIndex((s) => s.id === id);
    const target = active[activeIdx + direction];
    if (activeIdx === -1 || !target) return;
    const idx = state.subjects.findIndex((s) => s.id === id);
    const targetIdx = state.subjects.findIndex((s) => s.id === target.id);
    [state.subjects[idx], state.subjects[targetIdx]] = [state.subjects[targetIdx], state.subjects[idx]];
    persistAndRender();
  }
  function duplicateSubject(id) {
    const idx = state.subjects.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const original = state.subjects[idx];
    const copy = {
      id: uid("subject"),
      name: original.name + " (cópia)",
      collapsed: false,
      archived: false,
      archivedAt: null,
      createdAt: nowISO2(),
      topics: original.topics.map((t) => ({
        id: uid("topic"),
        name: t.name,
        link: t.link || "",
        status: "Não iniciado",
        archived: false,
        archivedAt: null,
        notes: "",
        tags: [...t.tags || []],
        difficulty: t.difficulty || "Médio",
        createdAt: nowISO2(),
        firstCompletedAt: null,
        lastCompletedAt: null,
        completionCount: 0,
        lastReviewedAt: null,
        reviewCount: 0,
        examImportance: t.examImportance ?? null,
        estimatedStudyMinutes: t.estimatedStudyMinutes ?? null,
        prerequisites: []
      }))
    };
    state.subjects.splice(idx + 1, 0, copy);
    persistAndRender();
    showToast(`"${copy.name}" criada com os mesmos tópicos (progresso zerado).`);
  }
  function toggleSubject(id) {
    subjectService.toggle(id);
    renderSubjects();
  }
  function renameSubject(id, name) {
    const clean = name.trim() || "Disciplina sem nome";
    const s = appContext.repositories.subjects.findById(id);
    if (s?.name !== clean) {
      subjectService.rename(id, clean);
      persistAndRender();
    } else {
      renderAll();
    }
  }
  function addSubject() {
    showPrompt("Criar uma nova disciplina", { label: "Nome da disciplina", placeholder: "Ex.: Conhecimentos Bancários", confirmLabel: "Criar", validate: (name) => {
      if (!name) return "Informe o nome da disciplina.";
      if (state.subjects.some((subject) => subject.name.trim().toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) return "Já existe uma disciplina com esse nome.";
      return "";
    } }, (name) => {
      subjectService.create(name);
      persistAndRender();
      showToast(`Disciplina "${name}" criada.`);
    });
  }
  function carregarDisciplinasPadrao() {
    const adicionadas = subjectService.addDefaults().length;
    persistAndRender();
    if (adicionadas > 0) {
      showToast(`${pluralize(adicionadas, "disciplina")} do edital ${adicionadas === 1 ? "adicionada" : "adicionadas"}.`);
    } else {
      showToast("Todas as disciplinas do edital já estão na sua lista.");
    }
  }
  document.getElementById("loadDefaultSubjectsBtn").addEventListener("click", carregarDisciplinasPadrao);
  function archiveSubject(id) {
    const subject = getSubjectById(id);
    if (!subject) return showToast("Disciplina não encontrada.");
    subjectService.archive(id);
    persistAndRender();
    showToast(`"${subject.name}" foi arquivada.`);
  }
  function restoreSubject(id) {
    const subject = getSubjectById(id);
    if (!subject) return;
    subjectService.restore(id);
    persistAndRender();
    showToast(`"${subject.name}" foi restaurada.`);
  }
  function getSubjectDependencies(subjectId) {
    const subject = getSubjectById(subjectId);
    const topicIds = new Set((subject?.topics || []).map((t) => t.id));
    return {
      questoes: state.questoes.filter((item) => entitySubjectId(item) === subjectId || topicIds.has(item.topicId)).length,
      sessions: state.studySessions.filter((item) => entitySubjectId(item) === subjectId || topicIds.has(item.topicId)).length,
      calendar: state.calendar.filter((item) => entitySubjectId(item) === subjectId || topicIds.has(item.topicId)).length,
      reviews: state.reviewAgenda.filter((item) => entitySubjectId(item) === subjectId || topicIds.has(item.topicId || item.topicRef)).length,
      goals: state.metasPorDisciplina.filter((item) => entitySubjectId(item) === subjectId).length,
      history: state.topicHistory.filter((item) => (item.subjectId === subjectId || topicIds.has(item.topicId)) && !["subject_archived", "subject_restored"].includes(item.type)).length,
      simulatedBreakdowns: state.simulados.reduce((sum3, sim) => sum3 + (sim.breakdown || []).filter((item) => entitySubjectId(item) === subjectId).length, 0),
      activeTimer: state.activeTimer.subjectId === subjectId || topicIds.has(state.activeTimer.topicId) ? 1 : 0
    };
  }
  function dependencyTotal(dependencies) {
    return Object.values(dependencies).reduce((sum3, value2) => sum3 + (Number(value2) || 0), 0);
  }
  function requestPermanentSubjectDelete(id) {
    const subject = getSubjectById(id);
    if (!subject) return;
    if (!subject.archived) return showToast("Arquive a disciplina antes de solicitar a exclusão definitiva.");
    const total = dependencyTotal(getSubjectDependencies(id));
    if (total > 0) return showToast(`A disciplina possui ${pluralize(total, "registro")} ${total === 1 ? "vinculado" : "vinculados"} e não pode ser excluída.`);
    showConfirm(`Excluir definitivamente "${subject.name}"? Esta ação não pode ser desfeita.`, () => {
      subjectService.remove(id);
      persistAndRender();
      showToast("Disciplina excluída definitivamente.");
    });
  }
  function addTopic(subjectId) {
    subjectService.addTopic(subjectId);
    persistAndRender();
  }
  function archiveTopic(subjectId, topicId) {
    const found = getTopicById(topicId);
    if (!found || found.subject.id !== subjectId) return;
    subjectService.archiveTopic(subjectId, topicId);
    persistAndRender();
    showToast("Tópico arquivado.");
  }
  function restoreTopic(subjectId, topicId) {
    const found = getTopicById(topicId);
    if (!found || found.subject.id !== subjectId) return;
    subjectService.restoreTopic(subjectId, topicId);
    persistAndRender();
    showToast("Tópico restaurado.");
  }
  function getTopicDependencies(topicId) {
    return {
      questions: state.questoes.filter((item) => item.topicId === topicId).length,
      sessions: state.studySessions.filter((item) => item.topicId === topicId).length,
      reviews: state.reviewAgenda.filter((item) => item.topicId === topicId || item.topicRef === topicId).length,
      calendar: state.calendar.filter((item) => item.topicId === topicId).length,
      history: state.topicHistory.filter((item) => item.topicId === topicId && !["topic_archived", "topic_restored"].includes(item.type)).length,
      activeTimer: state.activeTimer.topicId === topicId ? 1 : 0
    };
  }
  function requestPermanentTopicDelete(subjectId, topicId) {
    const found = getTopicById(topicId);
    if (!found || found.subject.id !== subjectId) return;
    if (!found.topic.archived) return showToast("Arquive o tópico antes de solicitar a exclusão definitiva.");
    const total = dependencyTotal(getTopicDependencies(topicId));
    if (total > 0) return showToast(`O tópico possui ${pluralize(total, "registro")} ${total === 1 ? "vinculado" : "vinculados"} e não pode ser excluído.`);
    showConfirm(`Excluir definitivamente "${found.topic.name || "este tópico"}"?`, () => {
      subjectService.removeTopic(subjectId, topicId);
      persistAndRender();
      showToast("Tópico excluído definitivamente.");
    });
  }
  function updateTopic(subjectId, topicId, field, value2) {
    subjectService.updateTopic(subjectId, topicId, { [field]: value2 });
    persistAndRender();
  }
  function addHistoryEvent(type, subjectId, topicId = null, metadata = {}) {
    if (!Array.isArray(state.topicHistory)) state.topicHistory = [];
    const occurredAt = nowISO2();
    const event = { id: uid("history"), date: occurredAt, occurredAt, localDate: todayISO(), type, subjectId: subjectId || null, topicId: topicId || null, metadata };
    state.topicHistory.push(event);
    return event;
  }
  function historyEvents(type) {
    return state.topicHistory.filter((event) => event.type === type);
  }
  function eventLocalDate(event) {
    return event.localDate || historicalLocalDate(event.occurredAt || event.date);
  }
  function topicCompletionEvents() {
    return historyEvents("topic_completed");
  }
  function uniqueTopicsCompletedBetween(startDate, endDate) {
    const ids = /* @__PURE__ */ new Set();
    topicCompletionEvents().forEach((event) => {
      const date2 = eventLocalDate(event);
      if (date2 && date2 >= startDate && date2 <= endDate && event.topicId) ids.add(event.topicId);
    });
    return ids.size;
  }
  function completedReviewsForTopic(topicId) {
    return state.reviewAgenda.filter((review) => (review.topicId || review.topicRef) === topicId && review.status === "Concluído");
  }
  function refreshTopicReviewStats(topicId) {
    const found = getTopicById(topicId);
    if (!found) return;
    const completed = completedReviewsForTopic(topicId);
    const dates = completed.map((review) => review.completedAt).filter(Boolean).sort();
    found.topic.reviewCount = completed.length;
    found.topic.lastReviewedAt = dates.length ? dates[dates.length - 1] : null;
  }
  function refreshAllTopicReviewStats() {
    state.subjects.forEach((subject) => subject.topics.forEach((topic) => refreshTopicReviewStats(topic.id)));
  }
  function markTopicCompleted(topic) {
    const now = nowISO2();
    if (!topic.firstCompletedAt) topic.firstCompletedAt = now;
    topic.lastCompletedAt = now;
    topic.completedAt = todayISO();
    topic.completionCount = (Number(topic.completionCount) || 0) + 1;
  }
  function updateTopicStatus(subjectId, topicId, selectEl) {
    const s = getSubjectById(subjectId);
    const t = s?.topics.find((x) => x.id === topicId);
    if (!t) return;
    const oldStatus = t.status;
    const newStatus = selectEl.value;
    if (oldStatus === newStatus) return;
    t.status = newStatus;
    if (newStatus === "Concluído") {
      markTopicCompleted(t);
      addHistoryEvent("topic_completed", subjectId, topicId);
    } else if (oldStatus === "Concluído") {
      t.completedAt = null;
      addHistoryEvent("topic_reopened", subjectId, topicId, { newStatus });
    } else if (newStatus === "Em andamento" && oldStatus === "Não iniciado") {
      addHistoryEvent("topic_started", subjectId, topicId);
    }
    persistAndRender();
  }
  function getRevisoesUnificadas() {
    const doCalendario = state.calendar.map((c) => ({
      id: c.id,
      date: c.date,
      subjectId: entitySubjectId(c),
      subject: entitySubjectName(c),
      label: c.reviewType && c.reviewType !== "—" ? c.reviewType : "Revisão",
      status: c.status || "Não iniciado",
      origem: "Calendário"
    }));
    const daAgenda = state.reviewAgenda.map((a) => ({
      id: a.id,
      date: a.date,
      subjectId: entitySubjectId(a),
      subject: entitySubjectName(a),
      label: `${a.topicId ? getTopicName(a.topicId) : a.topic || "Tópico"} · ${a.tipo || ""}`,
      status: a.status || "Não iniciado",
      origem: "Agenda de Revisões"
    }));
    return [...doCalendario, ...daAgenda];
  }
  function unifiedItemLabel(item) {
    const subject = String(item?.subject || "").trim(), label = String(item?.label || "").trim();
    if (!subject || !label) return label || "Revisão";
    const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return label.replace(new RegExp(`^${escaped}\\s*[·•—-]\\s*`, "i"), "").trim() || "Revisão";
  }
  var overdueGroupLimits = { calAtrasadas: 3, hojeAtrasadas: 3 };
  var overdueExpandedDates = { calAtrasadas: /* @__PURE__ */ new Set(), hojeAtrasadas: /* @__PURE__ */ new Set() };
  var overdueExpansionInitialized = /* @__PURE__ */ new Set();
  function changeOverdueGroupLimit(elId, delta) {
    overdueGroupLimits[elId] = (overdueGroupLimits[elId] || 3) + Number(delta || 0);
    renderCalAtrasadas(elId);
  }
  function showAllOverdueGroups(elId) {
    overdueGroupLimits[elId] = Number.MAX_SAFE_INTEGER;
    renderCalAtrasadas(elId);
  }
  function resetOverdueGroupLimit(elId) {
    overdueGroupLimits[elId] = 3;
    renderCalAtrasadas(elId);
  }
  function toggleOverdueDate(elId, date2) {
    const dates = overdueExpandedDates[elId] || (overdueExpandedDates[elId] = /* @__PURE__ */ new Set());
    if (dates.has(date2)) dates.delete(date2);
    else dates.add(date2);
    renderCalAtrasadas(elId);
  }
  function renderCalIndicadores() {
    const todas = getRevisoesUnificadas();
    const today = todayISO();
    const total = todas.length;
    const atrasadas = todas.filter((r) => r.date && r.date < today && r.status !== "Concluído").length;
    const hoje = todas.filter((r) => r.date === today).length;
    const proximos7 = todas.filter((r) => {
      const d = diasParaRevisao(r.date);
      return d !== null && d > 0 && d <= 7;
    }).length;
    document.getElementById("calIndicadores").innerHTML = `
    <div class="kpi-cell"><div class="n">${total}</div><div class="l">Itens no total</div></div>
    <div class="kpi-cell ${atrasadas > 0 ? "warn" : ""}"><div class="n">${atrasadas}</div><div class="l">Atrasadas</div></div>
    <div class="kpi-cell ${hoje > 0 ? "ok" : ""}"><div class="n">${hoje}</div><div class="l">Hoje</div></div>
    <div class="kpi-cell"><div class="n">${proximos7}</div><div class="l">Próximos 7 dias</div></div>
  `;
  }
  var currentMonthDate = /* @__PURE__ */ new Date();
  var MONTH_MAX_EVENTS_PER_DAY = 3;
  function renderMonthCalendar() {
    const container = document.getElementById("monthCalendar");
    if (!container) return;
    const filterSubject = document.getElementById("calFilterSubject").value;
    const filterStatus = document.getElementById("calFilterStatus").value;
    const events = getRevisoesUnificadas().filter((e) => !filterSubject || e.subjectId === filterSubject).filter((e) => !filterStatus || e.status === filterStatus);
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    document.getElementById("calendarMonthTitle").textContent = (() => {
      const label = currentMonthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      return label.charAt(0).toUpperCase() + label.slice(1);
    })();
    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());
    let html = `<div class="month-grid-wrap"><div class="month-grid">`;
    ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach((day) => {
      html += `<div class="month-header">${day}</div>`;
    });
    const cursor = new Date(start);
    for (let i = 0; i < 42; i++) {
      const iso = localDateISO(cursor);
      const dayEvents = events.filter((e) => e.date === iso);
      const isToday = iso === todayISO();
      const outside = cursor.getMonth() !== month;
      html += `<div class="month-day ${outside ? "outside" : ""} ${isToday ? "today" : ""}">
      <div class="day-number">${cursor.getDate()}</div>`;
      dayEvents.slice(0, MONTH_MAX_EVENTS_PER_DAY).forEach((evt) => {
        let cls = "event-futura";
        if (evt.status === "Concluído") {
          cls = "event-concluida";
        } else {
          const dias = diasParaRevisao(evt.date);
          if (dias !== null && dias < 0) cls = "event-atrasada";
          else if (dias === 0) cls = "event-hoje";
        }
        const tooltip = `${evt.subject || "—"} · ${evt.label} (${evt.origem})`;
        html += `<div class="cal-event ${cls}" title="${escapeAttr(tooltip)}">${escapeHtml(evt.subject || evt.label)}</div>`;
      });
      if (dayEvents.length > MONTH_MAX_EVENTS_PER_DAY) {
        html += `<div class="cal-event-more">+${dayEvents.length - MONTH_MAX_EVENTS_PER_DAY} mais</div>`;
      }
      html += `</div>`;
      cursor.setDate(cursor.getDate() + 1);
    }
    html += `</div></div>`;
    container.innerHTML = html;
  }
  document.getElementById("monthPrevBtn").addEventListener("click", () => {
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    renderMonthCalendar();
  });
  document.getElementById("monthNextBtn").addEventListener("click", () => {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    renderMonthCalendar();
  });
  document.getElementById("monthTodayBtn").addEventListener("click", () => {
    currentMonthDate = /* @__PURE__ */ new Date();
    renderMonthCalendar();
  });
  function renderCalendarFilters() {
    const sel = document.getElementById("calFilterSubject");
    const current = sel.value;
    sel.innerHTML = `<option value="">Todas as disciplinas</option>` + state.subjects.map((s) => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join("");
    sel.value = current;
    const selMes = document.getElementById("calFilterMes");
    const currentMes = selMes.value;
    const meses = collectMonthKeys(state.calendar);
    selMes.innerHTML = `<option value="">Todos os meses</option>` + meses.map((k) => `<option value="${k}">${monthLabel(k)}</option>`).join("");
    selMes.value = currentMes;
    const selTipo = document.getElementById("calFilterTipo");
    const currentTipo = selTipo.value;
    selTipo.innerHTML = `<option value="">Todos os tipos de revisão</option>` + REVIEW_OPTIONS.filter((o) => o !== "—").map((o) => `<option value="${o}">${o}</option>`).join("");
    selTipo.value = currentTipo;
  }
  function toggleFilterPanel(scope) {
    const id = scope === "agenda" ? "agendaFilters" : scope === "sessions" ? "studySessionsFilters" : "calendarFilters";
    const panel = document.getElementById(id), button = document.querySelector(`[aria-controls="${id}"]`);
    if (!panel) return;
    const expanded = !panel.classList.contains("show");
    panel.classList.toggle("show", expanded);
    button?.setAttribute("aria-expanded", String(expanded));
    if (scope === "sessions") renderSessionHistoryFilterControls();
  }
  function setCalendarMobileView(view) {
    const normalized = view === "agenda" ? "agenda" : "month";
    document.getElementById("panel-calendario")?.setAttribute("data-calendar-view", normalized);
    document.querySelectorAll(".calendar-view-btn").forEach((button) => {
      const active = button.dataset.calendarView === normalized;
      button.classList.toggle("active", active);
      button.classList.toggle("ghost", !active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  document.querySelectorAll(".calendar-view-btn").forEach((button) => button.addEventListener("click", () => setCalendarMobileView(button.dataset.calendarView)));
  var calendarEditController = createEditableCollectionController({ service: calendarService, clone: cloneRecord, render: renderCalendar, onSaved: () => {
    persistAndRender();
    showToast("Item do calendário atualizado.");
  }, initialState: { visible: 10 } });
  var calendarUiState = calendarEditController.state;
  function calendarViewModel(item) {
    return { date: item.date ? formatDatePt(item.date) : "Sem data", week: item.week || "—", subject: getSubjectName(entitySubjectId(item)), status: item.status || "Não iniciado", reviewType: item.reviewType && item.reviewType !== "—" ? item.reviewType : "Sem revisão" };
  }
  function changeCalendarLimit(delta) {
    calendarUiState.visible = Math.max(10, calendarUiState.visible + Number(delta || 0));
    renderCalendar();
  }
  function resetCalendarLimit() {
    calendarUiState.visible = 10;
    renderCalendar();
  }
  function editCalendarItem(id) {
    calendarEditController.begin(id);
  }
  function cancelCalendarEdit() {
    calendarEditController.cancel();
  }
  function updateCalendarDraft(field, value2) {
    calendarEditController.update(field, value2);
  }
  function saveCalendarEdit() {
    if (!calendarEditController.save()) cancelCalendarEdit();
  }
  function completeCalendarItem(id) {
    const item = state.calendar.find((entry) => entry.id === id);
    if (!item || item.status === "Concluído") return;
    item.status = "Concluído";
    persistAndRender();
    showToast("Item concluído.");
  }
  function renderCalendarReadRow(item) {
    const vm = calendarViewModel(item), pending = item.status !== "Concluído";
    if (isMobileHistoryLayout()) return `<tr class="mobile-history-row" data-id="${item.id}"><td colspan="7"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)} · ${escapeHtml(vm.week)}</div><div class="mobile-card-title">${escapeHtml(vm.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(vm.reviewType)}</div></div><button class="btn ghost small" data-delegated-click="editCalendarItem('${item.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${escapeHtml(vm.status)}</span><span>${diasParaRevisaoPill(item.date, item.status)}</span></div><div class="mobile-card-actions">${pending ? `<button class="btn small history-primary-action" data-delegated-click="completeCalendarItem('${item.id}')">Concluir</button>` : ""}</div></article></td></tr>`;
    return `<tr class="history-read-row history-desktop-row ${item.date === todayISO() ? "today" : ""}" data-id="${item.id}"><td>${escapeHtml(vm.date)}</td><td>${escapeHtml(vm.week)}</td><td><div class="row-primary">${escapeHtml(vm.subject)}</div></td><td><span class="history-status ${STATUS_CLASS[item.status] || ""}">${escapeHtml(vm.status)}</span></td><td>${escapeHtml(vm.reviewType)}</td><td>${diasParaRevisaoPill(item.date, item.status)}</td><td><div class="row-actions">${pending ? `<button class="btn small" data-delegated-click="completeCalendarItem('${item.id}')">Concluir</button>` : ""}<button class="btn ghost small" data-delegated-click="editCalendarItem('${item.id}')">Editar</button></div></td></tr>`;
  }
  function renderCalendarEditRow(item) {
    const draft = calendarUiState.draft, subjectId = entitySubjectId(draft);
    if (!draft) return "";
    return `<tr class="row-editing" data-id="${item.id}"><td colspan="7"><div class="inline-edit-form"><label>Data<input type="date" value="${draft.date || ""}" data-delegated-change="updateCalendarDraft('date',this.value)"></label><label>Semana<input type="text" value="${escapeAttr(draft.week || "")}" data-delegated-input="updateCalendarDraft('week',this.value)"></label><label>Disciplina<select data-delegated-change="updateCalendarDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectsForSelection(subjectId).map((subject) => `<option value="${escapeAttr(subject.id)}" ${subject.id === subjectId ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join("")}</select></label><label>Status<select data-delegated-change="updateCalendarDraft('status',this.value)">${STATUS_OPTIONS.map((option) => `<option value="${option}" ${option === draft.status ? "selected" : ""}>${option}</option>`).join("")}</select></label><label>Tipo de revisão<select data-delegated-change="updateCalendarDraft('reviewType',this.value)">${REVIEW_OPTIONS.map((option) => `<option value="${option}" ${option === draft.reviewType ? "selected" : ""}>${option}</option>`).join("")}</select></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelCalendarEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveCalendarEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteCalRow('${item.id}')">Excluir</button></div></div></td></tr>`;
  }
  function renderCalendar() {
    const body = document.getElementById("calBody");
    const filterSubject = document.getElementById("calFilterSubject").value;
    const filterStatus = document.getElementById("calFilterStatus").value;
    const filterMes = document.getElementById("calFilterMes").value;
    const filterTipo = document.getElementById("calFilterTipo").value;
    const rows = state.calendar.filter((c) => !filterSubject || entitySubjectId(c) === filterSubject).filter((c) => !filterStatus || c.status === filterStatus).filter((c) => !filterMes || monthKey(c.date) === filterMes).filter((c) => !filterTipo || c.reviewType === filterTipo).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="border:none;">
      <p>Nenhum item encontrado com esses filtros.</p>
      <button class="btn" data-delegated-click="addCalRow()">+ Adicionar item</button>
    </div></td></tr>`;
      return;
    }
    const visible = rows.slice(0, calendarUiState.visible);
    body.innerHTML = visible.map((item) => calendarUiState.editingId === item.id ? renderCalendarEditRow(item) : renderCalendarReadRow(item)).join("") + renderCollectionFooter({ total: rows.length, visible: calendarUiState.visible, showMoreAction: "changeCalendarLimit(10)", showLessAction: calendarUiState.visible > 10 ? "resetCalendarLimit()" : "", colspan: 7, label: "itens" });
  }
  function addCalRow() {
    const item = calendarService.create({ date: todayISO(), week: "", subjectId: activeSubjects()[0]?.id || null, topicId: null, status: "Não iniciado", reviewType: "—" });
    calendarEditController.begin(item.id, { isNew: true });
  }
  function deleteCalRow(id) {
    showConfirm("Excluir este item do calendário?", () => {
      calendarService.remove(id);
      calendarEditController.reset();
      persistAndRender();
      showToast("Item excluído.");
    });
  }
  function updateCal(id, field, value2) {
    const c = state.calendar.find((x) => x.id === id);
    c[field] = value2;
    persistAndRender();
  }
  document.getElementById("calFilterSubject").addEventListener("change", () => {
    calendarUiState.visible = 10;
    renderCalendar();
    renderMonthCalendar();
  });
  document.getElementById("calFilterStatus").addEventListener("change", () => {
    calendarUiState.visible = 10;
    renderCalendar();
    renderMonthCalendar();
  });
  document.getElementById("calFilterMes").addEventListener("change", () => {
    calendarUiState.visible = 10;
    renderCalendar();
  });
  document.getElementById("calFilterTipo").addEventListener("change", () => {
    calendarUiState.visible = 10;
    renderCalendar();
  });
  document.getElementById("addSubjectBtn").addEventListener("click", addSubject);
  document.getElementById("addCalRowBtn").addEventListener("click", addCalRow);
  function addDays(iso, days) {
    const d = parseLocalDate(iso);
    if (!d) return "";
    d.setDate(d.getDate() + Number(days || 0));
    return localDateISO(d);
  }
  function reviewBaseDaysFromType(type) {
    if (type === "Revisão 24h") return 1;
    const match = String(type || "").match(/(\d+)/);
    return match ? Math.max(1, Number(match[1])) : 7;
  }
  function adaptiveReviewSuggestion(topicId, baseDays, baseDate) {
    const found = getTopicById(topicId);
    const diagnosis = found ? diagnoseTopic(found.subject.id, topicId) : null;
    const result = calculateAdaptiveInterval({
      baseDays,
      accuracy: diagnosis?.performance?.accuracy,
      volume: diagnosis?.performance?.resolved || 0,
      target: Number(state.metas.metaAprovacao) || 70,
      trendKey: diagnosis?.trend?.key,
      dominantErrorKey: diagnosis?.dominantError?.key,
      reviews: Number(found?.topic?.reviewCount) || 0
    });
    return { ...result, date: addDays(baseDate, result.days) };
  }
  function resetAdaptiveReviewDate(id) {
    const review = appContext.repositories.reviewAgenda.findById(id);
    if (!review || !review.topicId) return;
    const found = getTopicById(review.topicId);
    const baseDate = found?.topic?.completedAt || todayISO();
    const suggestion = adaptiveReviewSuggestion(review.topicId, review.baseIntervalDays || reviewBaseDaysFromType(review.tipo), baseDate);
    reviewService.restoreAdaptiveSchedule(id, suggestion);
    persistAndRender();
  }
  function gerarAgendaAutomatica() {
    const concluidos = activeTopics().filter((t) => t.status === "Concluído" && t.completedAt);
    if (concluidos.length === 0) {
      showToast('Nenhum tópico concluído com data registrada ainda. Marque tópicos como "Concluído" na aba Disciplinas primeiro.');
      return;
    }
    let adicionados = 0;
    concluidos.forEach((t) => {
      const intervalos = DIFFICULTY_INTERVALS[t.difficulty] || AGENDA_INTERVALS;
      intervalos.forEach((intervalo) => {
        const jaExiste = state.reviewAgenda.some(
          (a) => (a.topicId || a.topicRef) === t.id && a.tipo === intervalo.tipo
        );
        if (!jaExiste) {
          const suggestion = adaptiveReviewSuggestion(t.id, intervalo.dias, t.completedAt);
          state.reviewAgenda.push({
            id: uid("review"),
            subjectId: t.subjectId,
            topicId: t.id,
            date: suggestion.date,
            suggestedDate: suggestion.date,
            baseIntervalDays: intervalo.dias,
            adaptive: true,
            manualDate: false,
            adaptiveReason: suggestion.reason,
            tipo: intervalo.tipo,
            status: "Não iniciado",
            createdAt: nowISO2(),
            completedAt: null
          });
          adicionados++;
        }
      });
    });
    persistAndRender();
    if (adicionados > 0) {
      showToast(`${pluralize(adicionados, "revisão", "revisões")} ${adicionados === 1 ? "adicionada" : "adicionadas"} à agenda — tópicos difíceis ganham revisões mais próximas.`);
    } else {
      showToast("A agenda já está atualizada — nenhuma revisão nova para gerar.");
    }
  }
  function getTopicDifficulty(topicId) {
    if (!topicId) return "Médio";
    for (const s of state.subjects) {
      const t = s.topics.find((x) => x.id === topicId);
      if (t) return t.difficulty || "Médio";
    }
    return "Médio";
  }
  function renderAgendaFilters() {
    const sel = document.getElementById("agendaFilterSubject");
    const current = sel.value;
    sel.innerHTML = `<option value="">Todas as disciplinas</option>` + state.subjects.map((s) => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join("");
    sel.value = current;
    const selMes = document.getElementById("agendaFilterMes");
    const currentMes = selMes.value;
    const meses = collectMonthKeys(state.reviewAgenda);
    selMes.innerHTML = `<option value="">Todos os meses</option>` + meses.map((k) => `<option value="${k}">${monthLabel(k)}</option>`).join("");
    selMes.value = currentMes;
    const selTipo = document.getElementById("agendaFilterTipo");
    const currentTipo = selTipo.value;
    selTipo.innerHTML = `<option value="">Todos os tipos</option>` + TIPO_AGENDA_OPTIONS.map((o) => `<option value="${o}">${o}</option>`).join("");
    selTipo.value = currentTipo;
  }
  var agendaUiState = { upcomingVisible: 5, completedVisible: 10, completedExpanded: false, editingId: null, editingIsNew: false, draft: null };
  function agendaViewModel(item) {
    const topicId = item.topicId || item.topicRef;
    return createReviewViewModel(item, { subjectName: getSubjectName(entitySubjectId(item)), topicName: topicId ? getTopicName(topicId) : "", difficulty: getTopicDifficulty(topicId), formatDate: formatDatePt });
  }
  function toggleCompletedReviews() {
    agendaUiState.completedExpanded = !agendaUiState.completedExpanded;
    renderAgenda();
  }
  function changeAgendaLimit(group, delta) {
    const key = `${group}Visible`, minimum = group === "completed" ? 10 : 5;
    agendaUiState[key] = Math.max(minimum, agendaUiState[key] + Number(delta || 0));
    renderAgenda();
  }
  function resetAgendaLimit(group) {
    agendaUiState[`${group}Visible`] = group === "completed" ? 10 : 5;
    renderAgenda();
  }
  function editAgenda(id) {
    if (agendaUiState.editingIsNew && agendaUiState.editingId !== id) state.reviewAgenda = state.reviewAgenda.filter((item2) => item2.id !== agendaUiState.editingId);
    const item = state.reviewAgenda.find((entry) => entry.id === id);
    if (!item) return;
    agendaUiState.editingId = id;
    agendaUiState.editingIsNew = false;
    agendaUiState.draft = cloneRecord(item);
    renderAgenda();
  }
  function cancelAgendaEdit() {
    if (agendaUiState.editingIsNew) state.reviewAgenda = state.reviewAgenda.filter((item) => item.id !== agendaUiState.editingId);
    agendaUiState.editingId = null;
    agendaUiState.editingIsNew = false;
    agendaUiState.draft = null;
    renderAgenda();
  }
  function updateAgendaDraft(field, value2) {
    const draft = agendaUiState.draft;
    if (!draft) return;
    draft[field] = value2;
    if (field === "subjectId" && draft.topicId && !topicsForSelection(value2, draft.topicId).some((topic) => topic.id === draft.topicId)) draft.topicId = null;
  }
  function applyAgendaField(item, field, value2) {
    const oldStatus = item.status, oldValue = item[field];
    item[field] = value2;
    if (field === "date" && value2 !== oldValue) {
      item.manualDate = true;
      item.adaptive = false;
    }
    if (field === "status" && value2 === "Concluído" && oldStatus !== "Concluído") {
      item.completedAt = nowISO2();
      const topicId = item.topicId || item.topicRef || null;
      addHistoryEvent("review_completed", entitySubjectId(item), topicId, { reviewId: item.id, reviewType: item.tipo });
      if (topicId) refreshTopicReviewStats(topicId);
    } else if (field === "status" && value2 !== "Concluído" && oldStatus === "Concluído") {
      const topicId = item.topicId || item.topicRef || null;
      item.completedAt = null;
      addHistoryEvent("review_reopened", entitySubjectId(item), topicId, { reviewId: item.id, newStatus: value2 });
      if (topicId) refreshTopicReviewStats(topicId);
    }
  }
  function saveAgendaEdit() {
    const draft = agendaUiState.draft, item = state.reviewAgenda.find((entry) => entry.id === agendaUiState.editingId);
    if (!draft || !item) return cancelAgendaEdit();
    ["date", "subjectId", "topic", "tipo", "status"].forEach((field) => {
      if (item[field] !== draft[field]) applyAgendaField(item, field, draft[field]);
    });
    agendaUiState.editingId = null;
    agendaUiState.editingIsNew = false;
    agendaUiState.draft = null;
    persistAndRender();
    showToast("Revisão atualizada.");
  }
  var pendingReviewRatingId = null;
  function closeReviewRating() {
    pendingReviewRatingId = null;
    const overlay = document.getElementById("reviewRatingOverlay");
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }
  function completeAgendaReview(id) {
    const item = appContext.repositories.reviewAgenda.findById(id);
    if (!item || item.status === "Concluído") return;
    if (!(item.topicId || item.topicRef)) {
      reviewService.completeReview(id);
      persistAndRender();
      showToast("Revisão concluída.");
      return;
    }
    pendingReviewRatingId = id;
    const overlay = document.getElementById("reviewRatingOverlay");
    overlay.classList.add("show");
    overlay.removeAttribute("aria-hidden");
    overlay.querySelector('[data-review-rating="good"]')?.focus();
  }
  function rateCompletedReview(rating) {
    if (!REVIEW_RATINGS[rating]) return closeReviewRating();
    const result = reviewService.rateReview(pendingReviewRatingId, rating, { label: REVIEW_RATINGS[rating].label });
    if (!result) return closeReviewRating();
    closeReviewRating();
    persistAndRender();
    showToast(`Revisão concluída. Próxima em ${formatDatePt(result.adaptiveState.nextReviewDate)}.`);
  }
  function renderAgendaReadRow(item) {
    return renderReviewRead({ item, view: agendaViewModel(item), mobile: isMobileHistoryLayout(), escapeHtml, escapeAttr, daysPill: diasParaRevisaoPill(item.date, item.status), difficultyClass: DIFFICULTY_CLASS, statusClass: STATUS_CLASS, ratingLabel: (key) => REVIEW_RATINGS[key]?.label || key, today: todayISO() });
  }
  function renderAgendaEditRow(item) {
    const draft = agendaUiState.draft, subjectId = entitySubjectId(draft);
    if (!draft) return "";
    return renderReviewEdit({ item, draft, subjectOptions: subjectsForSelection(subjectId).map((subject) => `<option value="${escapeAttr(subject.id)}" ${subject.id === subjectId ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join(""), topicName: draft.topicId ? getTopicName(draft.topicId) : draft.topic || "", typeOptions: TIPO_AGENDA_OPTIONS.map((option) => `<option value="${option}" ${option === draft.tipo ? "selected" : ""}>${option}</option>`).join(""), statusOptions: STATUS_OPTIONS.map((option) => `<option value="${option}" ${option === draft.status ? "selected" : ""}>${option}</option>`).join(""), escapeAttr });
  }
  function renderAgenda() {
    const body = document.getElementById("agendaBody");
    const filterSubject = document.getElementById("agendaFilterSubject").value;
    const filterStatus = document.getElementById("agendaFilterStatus").value;
    const filterMes = document.getElementById("agendaFilterMes").value;
    const filterTipo = document.getElementById("agendaFilterTipo").value;
    const rows = state.reviewAgenda.filter((a) => !filterSubject || entitySubjectId(a) === filterSubject).filter((a) => !filterStatus || (filterStatus === "Atrasadas" ? Boolean(a.date && a.date < todayISO() && a.status !== "Concluído") : a.status === filterStatus)).filter((a) => !filterMes || monthKey(a.date) === filterMes).filter((a) => !filterTipo || a.tipo === filterTipo).sort((a, b) => {
      const dateCompare = (a.date || "").localeCompare(b.date || "");
      if (dateCompare !== 0) return dateCompare;
      const wA = DIFFICULTY_WEIGHT[getTopicDifficulty(a.topicId || a.topicRef)] || 2;
      const wB = DIFFICULTY_WEIGHT[getTopicDifficulty(b.topicId || b.topicRef)] || 2;
      return wB - wA;
    });
    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="8"><div class="empty-state" style="border:none;">
      <p>Nenhuma revisão encontrada com esses filtros.</p>
      <button class="btn ghost small" data-delegated-click="gerarAgendaAutomatica()">⟳ Gerar a partir dos concluídos</button>
      <button class="btn small" data-delegated-click="addAgendaRow()">+ Adicionar manualmente</button>
    </div></td></tr>`;
      return;
    }
    const today = todayISO();
    const groups = { overdue: rows.filter((item) => item.status !== "Concluído" && item.date && item.date < today), today: rows.filter((item) => item.status !== "Concluído" && item.date === today), upcoming: rows.filter((item) => item.status !== "Concluído" && (!item.date || item.date > today)), completed: rows.filter((item) => item.status === "Concluído").sort((a, b) => String(b.completedAt || b.date || "").localeCompare(String(a.completedAt || a.date || ""))) };
    const html = [];
    const renderItems = (items) => items.map((item) => agendaUiState.editingId === item.id ? renderAgendaEditRow(item) : renderAgendaReadRow(item)).join("");
    if (groups.overdue.length) {
      html.push(renderGroupHeader({ title: "🔴 Atrasadas", count: groups.overdue.length, tone: "overdue" }), renderItems(groups.overdue));
    }
    if (groups.today.length) {
      html.push(renderGroupHeader({ title: "🟡 Hoje", count: groups.today.length, tone: "today" }), renderItems(groups.today));
    }
    if (groups.upcoming.length) {
      const visible = groups.upcoming.slice(0, agendaUiState.upcomingVisible);
      html.push(renderGroupHeader({ title: "🔵 Próximas", count: groups.upcoming.length, tone: "upcoming" }), renderItems(visible), renderCollectionFooter({ total: groups.upcoming.length, visible: agendaUiState.upcomingVisible, showMoreAction: "changeAgendaLimit('upcoming',5)", showLessAction: agendaUiState.upcomingVisible > 5 ? "resetAgendaLimit('upcoming')" : "", colspan: 8, label: "revisões" }));
    }
    if (groups.completed.length) {
      html.push(renderGroupHeader({ title: "✓ Concluídas", count: groups.completed.length, tone: "completed", expanded: agendaUiState.completedExpanded, toggleAction: "toggleCompletedReviews()" }));
      if (agendaUiState.completedExpanded) {
        const visible = groups.completed.slice(0, agendaUiState.completedVisible);
        html.push(renderItems(visible), renderCollectionFooter({ total: groups.completed.length, visible: agendaUiState.completedVisible, showMoreAction: "changeAgendaLimit('completed',10)", showLessAction: agendaUiState.completedVisible > 10 ? "resetAgendaLimit('completed')" : "", colspan: 8, label: "revisões" }));
      }
    }
    body.innerHTML = html.join("");
  }
  function addAgendaRow() {
    const item = reviewService.createManualReview({ subjectId: activeSubjects()[0]?.id || null });
    agendaUiState.editingId = item.id;
    agendaUiState.editingIsNew = true;
    agendaUiState.draft = cloneRecord(item);
    renderAgenda();
  }
  function deleteAgendaRow(id) {
    showConfirm("Excluir esta revisão?", () => {
      reviewService.removeReview(id);
      agendaUiState.editingId = null;
      agendaUiState.editingIsNew = false;
      agendaUiState.draft = null;
      persistAndRender();
      showToast("Revisão excluída.");
    });
  }
  function updateAgenda(id, field, value2) {
    const a = state.reviewAgenda.find((x) => x.id === id);
    if (!a) return;
    applyAgendaField(a, field, value2);
    persistAndRender();
  }
  createReviewsController({ actions: {
    rate: rateCompletedReview,
    cancelRating: closeReviewRating,
    filtersChanged: () => {
      agendaUiState.upcomingVisible = 5;
      agendaUiState.completedVisible = 10;
      renderAgenda();
    },
    createManual: addAgendaRow,
    generateAutomatic: gerarAgendaAutomatica
  } }).register();
  function calcAcertoPct(correct, resolved) {
    const r = Number(resolved) || 0;
    const c = Number(correct) || 0;
    if (r <= 0) return 0;
    return Math.round(c / r * 1e3) / 10;
  }
  var openQuestionErrorIds = /* @__PURE__ */ new Set();
  var performanceSubjectId = null;
  var performanceViewMode = "with-data";
  var errorAnalysisView = { days: 30, topicId: "" };
  var performanceVisible = 8;
  var retentionShowAll = false;
  var retentionView = { subjectId: "", order: "asc", confidence: "all" };
  function setPerformanceViewMode(mode) {
    performanceViewMode = ["with-data", "insufficient", "without-data", "all"].includes(mode) ? mode : "with-data";
    performanceVisible = 8;
    renderQuestionAnalytics();
  }
  function setErrorAnalysisFilter(field, value2) {
    if (field === "days" && [7, 30, 60, 90].includes(Number(value2))) errorAnalysisView.days = Number(value2);
    if (field === "topicId") errorAnalysisView.topicId = value2 || "";
    renderQuestionAnalytics();
  }
  function changePerformanceLimit(delta) {
    performanceVisible += Number(delta || 0);
    renderQuestionAnalytics();
  }
  function showAllPerformance() {
    performanceVisible = Number.MAX_SAFE_INTEGER;
    renderQuestionAnalytics();
  }
  function resetPerformanceLimit() {
    performanceVisible = 8;
    renderQuestionAnalytics();
  }
  function showAllRetention() {
    retentionShowAll = true;
    renderTopicRetentionDashboard();
  }
  function resetRetentionLimit() {
    retentionShowAll = false;
    renderTopicRetentionDashboard();
  }
  function setRetentionFilter(field, value2) {
    if (field in retentionView) retentionView[field] = value2;
    retentionShowAll = false;
    renderTopicRetentionDashboard();
  }
  var listViewState = { questionsVisible: 10, simulationsVisible: 5, sessionDaysVisible: 5 };
  var LIST_VIEW_STEPS = { questions: 10, simulations: 5, sessionDays: 5 };
  var historyEditState = { sessionId: null };
  var historyEditDraft = { session: null };
  var questionEditController = createEditableCollectionController({ service: questionService, clone: cloneRecord, render: renderQuestoes, normalize: (draft) => {
    draft.resolved = Math.max(0, Math.floor(Number(draft.resolved) || 0));
    draft.correct = Math.max(0, Math.min(Math.floor(Number(draft.correct) || 0), draft.resolved));
    normalizeErrorBreakdown(draft);
    return draft;
  }, onSaved: () => {
    persistAndRender();
    showToast("Registro atualizado.");
  } });
  var simulationEditController = createEditableCollectionController({ service: simulationService, clone: cloneRecord, render: renderSimulados, normalize: (draft) => {
    draft.total = Math.max(0, Math.floor(Number(draft.total) || 0));
    draft.correct = Math.max(0, Math.min(Math.floor(Number(draft.correct) || 0), draft.total));
    return draft;
  }, onSaved: () => {
    persistAndRender();
    showToast("Simulado atualizado.");
  } });
  function cloneRecord(record) {
    return record ? JSON.parse(JSON.stringify(record)) : null;
  }
  function isMobileHistoryLayout() {
    return window.matchMedia("(max-width:760px)").matches;
  }
  function renderListViewFooter(total, visible, step, showMoreAction, showLessAction, colspan, label) {
    if (total <= step) return "";
    return `<tr class="list-view-footer"><td colspan="${colspan}"><div class="list-view-controls">
    <span class="list-view-count">Exibindo ${Math.min(visible, total)} de ${total} ${label}</span>
    ${visible < total ? `<button class="btn ghost small" type="button" data-delegated-click="${showMoreAction}">Mostrar mais</button>` : ""}
    ${visible > step ? `<button class="btn ghost small" type="button" data-delegated-click="${showLessAction}">Mostrar menos</button>` : ""}
  </div></td></tr>`;
  }
  function changeListLimit(key, delta, renderFn) {
    const minimum = LIST_VIEW_STEPS[key];
    listViewState[`${key}Visible`] = Math.max(minimum, listViewState[`${key}Visible`] + delta);
    renderFn();
  }
  function emptyErrorBreakdown() {
    return Object.fromEntries(Object.keys(ERROR_CATEGORIES).map((key) => [key, 0]));
  }
  function normalizeErrorBreakdown(question) {
    const normalized = emptyErrorBreakdown();
    Object.keys(normalized).forEach((key) => {
      normalized[key] = Math.max(0, Math.floor(Number(question?.errorBreakdown?.[key]) || 0));
    });
    const realErrors = Math.max(0, (Number(question?.resolved) || 0) - (Number(question?.correct) || 0));
    let excess = Object.values(normalized).reduce((sum3, value2) => sum3 + value2, 0) - realErrors;
    [...Object.keys(normalized)].reverse().forEach((key) => {
      if (excess <= 0) return;
      const cut = Math.min(normalized[key], excess);
      normalized[key] -= cut;
      excess -= cut;
    });
    question.errorBreakdown = normalized;
    return normalized;
  }
  function validQuestionRecords() {
    return state.questoes.filter((q) => q.date && (Number(q.resolved) || 0) > 0);
  }
  function accuracyFromCounts(correct, total) {
    return total > 0 ? Math.round(correct / total * 1e3) / 10 : null;
  }
  function toggleQuestionErrors(id) {
    if (openQuestionErrorIds.has(id)) openQuestionErrorIds.delete(id);
    else openQuestionErrorIds.add(id);
    renderQuestoes();
    renderQuestionAnalytics();
  }
  function questionCategorizedErrors(question) {
    return Object.values(normalizeErrorBreakdown(question)).reduce((sum3, value2) => sum3 + value2, 0);
  }
  function renderQuestionErrorFields(question) {
    const realErrors = Math.max(0, (Number(question.resolved) || 0) - (Number(question.correct) || 0));
    const categorized = questionCategorizedErrors(question);
    return `
    <tr class="error-breakdown-row">
      <td colspan="8">
        <div class="error-breakdown-box">
          <div class="error-breakdown-head">
            <strong>Categorização opcional dos erros</strong>
            <span>${categorized} de ${realErrors} erros categorizados</span>
          </div>
          <div class="error-breakdown-grid">
            ${Object.entries(ERROR_CATEGORIES).map(([key, meta]) => `
              <label class="error-breakdown-field">
                <span>${meta.icon} ${meta.label}</span>
                <input type="number" min="0" max="${realErrors}" value="${question.errorBreakdown[key] || 0}"
                  data-delegated-blur="updateQuestionError('${question.id}','${key}',this.value)">
              </label>
            `).join("")}
          </div>
          <small>As categorias não alteram a taxa de acerto; servem para diagnosticar a origem dos erros.</small>
        </div>
      </td>
    </tr>
  `;
  }
  function questionViewModel(q) {
    const subjectId = entitySubjectId(q);
    return { date: q.date ? formatDatePt(q.date) : "Sem data", subject: getSubjectName(subjectId) || "Sem disciplina", topic: q.topicId ? getTopicName(q.topicId) : "Sem tópico", resolved: Number(q.resolved) || 0, correct: Number(q.correct) || 0, accuracy: calcAcertoPct(q.correct, q.resolved) };
  }
  function editQuestion(id) {
    questionEditController.begin(id);
  }
  function cancelQuestionEdit() {
    questionEditController.cancel();
  }
  function updateQuestionDraft(field, value2) {
    const draft = questionEditController.state.draft;
    if (!draft) return;
    questionEditController.update(field, field === "resolved" || field === "correct" ? Math.max(0, Math.floor(Number(value2) || 0)) : value2);
    if (field === "subjectId" && draft.topicId && !topicsForSelection(value2, draft.topicId).some((t) => t.id === draft.topicId)) draft.topicId = null;
    if (field === "subjectId") renderQuestoes();
  }
  function saveQuestionEdit() {
    if (!questionEditController.save()) cancelQuestionEdit();
  }
  function renderQuestionReadRow(q) {
    const vm = questionViewModel(q);
    const realErrors = Math.max(0, vm.resolved - vm.correct);
    const categorized = questionCategorizedErrors(q);
    if (isMobileHistoryLayout()) return `<tr class="mobile-history-row" data-id="${q.id}"><td colspan="8"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)}</div><div class="mobile-card-title">${escapeHtml(vm.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(vm.topic)}</div></div><button class="btn ghost small" data-delegated-click="editQuestion('${q.id}')" aria-label="Editar registro">Editar</button></div><div class="mobile-card-metrics"><span>${vm.resolved} questões</span><span>${vm.correct} acertos</span><strong>${vm.accuracy}%</strong><button class="error-toggle-btn" data-delegated-click="toggleQuestionErrors('${q.id}')">Erros ${categorized}/${realErrors}</button></div></article></td></tr>${openQuestionErrorIds.has(q.id) ? renderQuestionErrorFields(q) : ""}`;
    return `<tr class="history-read-row history-desktop-row" data-id="${q.id}"><td>${escapeHtml(vm.date)}</td><td><div class="row-primary">${escapeHtml(vm.subject)}</div></td><td><div class="row-secondary">${escapeHtml(vm.topic)}</div></td><td class="number-cell">${vm.resolved}</td><td class="number-cell">${vm.correct}</td><td class="number-cell">${vm.accuracy}%</td><td><button class="error-toggle-btn" data-delegated-click="toggleQuestionErrors('${q.id}')">${categorized}/${realErrors}</button></td><td><div class="row-actions"><button class="btn ghost small" data-delegated-click="editQuestion('${q.id}')">Editar</button></div></td></tr>${openQuestionErrorIds.has(q.id) ? renderQuestionErrorFields(q) : ""}`;
  }
  function renderQuestionEditRow(q) {
    const d = questionEditController.state.draft;
    const subjectId = entitySubjectId(d);
    const topics = topicsForSelection(subjectId, d.topicId);
    return `<tr class="row-editing" data-id="${q.id}"><td colspan="8"><div class="inline-edit-form"><label>Data<input type="date" value="${d.date || ""}" data-delegated-change="updateQuestionDraft('date',this.value)"></label><label>Disciplina<select data-delegated-change="updateQuestionDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectsForSelection(subjectId).map((s) => `<option value="${escapeAttr(s.id)}" ${s.id === subjectId ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}</select></label><label>Tópico<select data-delegated-change="updateQuestionDraft('topicId',this.value||null)"><option value="">Sem tópico</option>${topics.map((t) => `<option value="${escapeAttr(t.id)}" ${t.id === d.topicId ? "selected" : ""}>${escapeHtml(t.name)}</option>`).join("")}</select></label><label>Resolvidas<input type="number" min="0" value="${Number(d.resolved) || 0}" data-delegated-input="updateQuestionDraft('resolved',this.value)"></label><label>Acertos<input type="number" min="0" value="${Number(d.correct) || 0}" data-delegated-input="updateQuestionDraft('correct',this.value)"></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelQuestionEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveQuestionEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteQuestaoRow('${q.id}')">Excluir</button></div></div></td></tr>`;
  }
  function renderQuestoes() {
    const body = document.getElementById("questoesBody");
    const rows = [...state.questoes].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="8"><div class="empty-state" style="border:none;">
      <p>Nenhuma sessão de questões registrada ainda.</p>
      <button class="btn small" data-delegated-click="addQuestaoRow()">+ Registrar sessão</button>
    </div></td></tr>`;
      return;
    }
    const visibleRows = rows.slice(0, listViewState.questionsVisible);
    body.innerHTML = visibleRows.map((q) => {
      normalizeErrorBreakdown(q);
      return questionEditController.state.editingId === q.id ? renderQuestionEditRow(q) : renderQuestionReadRow(q);
    }).join("") + renderListViewFooter(
      rows.length,
      listViewState.questionsVisible,
      LIST_VIEW_STEPS.questions,
      "changeListLimit('questions',LIST_VIEW_STEPS.questions,renderQuestoes)",
      "changeListLimit('questions',-listViewState.questionsVisible,renderQuestoes)",
      8,
      "registros"
    );
  }
  function addQuestaoRow() {
    listViewState.questionsVisible = LIST_VIEW_STEPS.questions;
    const question = { id: uid("question"), date: todayISO(), subjectId: activeSubjects()[0]?.id || null, topicId: null, resolved: 0, correct: 0, errorBreakdown: emptyErrorBreakdown(), createdAt: nowISO2() };
    questionService.create(question);
    questionEditController.begin(question.id, { isNew: true });
  }
  function deleteQuestaoRow(id) {
    showConfirm("Excluir este registro de questões?", () => {
      questionService.remove(id);
      openQuestionErrorIds.delete(id);
      questionEditController.reset();
      persistAndRender();
      showToast("Registro excluído.");
    });
  }
  function updateQuestionError(id, key, value2) {
    const question = state.questoes.find((q) => q.id === id);
    if (!question || !ERROR_CATEGORIES[key]) return;
    normalizeErrorBreakdown(question);
    const realErrors = Math.max(0, (Number(question.resolved) || 0) - (Number(question.correct) || 0));
    const others = Object.entries(question.errorBreakdown).reduce((sum3, [category, count]) => category === key ? sum3 : sum3 + count, 0);
    const requested = Math.max(0, Math.floor(Number(value2) || 0));
    const allowed = Math.max(0, realErrors - others);
    question.errorBreakdown[key] = Math.min(requested, allowed);
    if (requested > allowed) showToast("A categorização foi limitada ao total real de erros.");
    persistAndRender();
  }
  function performanceConfidence(total) {
    if (total < MIN_WEEKLY_QUESTIONS) return { key: "insufficient", label: "Amostra insuficiente" };
    if (total < 20) return { key: "low", label: "Confiança baixa" };
    if (total < 50) return { key: "medium", label: "Confiança média" };
    return { key: "high", label: "Confiança alta" };
  }
  function classifyAccuracy(accuracy2) {
    if (accuracy2 === null) return { key: "none", icon: "⚪", label: "Sem dados" };
    const target = Math.max(0, Math.min(100, Number(state.metas?.metaAprovacao) || 70));
    if (accuracy2 >= target) return { key: "strong", icon: "🟢", label: "Na meta" };
    if (accuracy2 >= target - 10) return { key: "attention", icon: "🟡", label: "Atenção" };
    return { key: "weak", icon: "🔴", label: "Prioritário" };
  }
  function getTopicPerformance(topicId) {
    const records = validQuestionRecords().filter((q) => q.topicId === topicId);
    const resolved = records.reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
    const correct = records.reduce((sum3, q) => sum3 + (Number(q.correct) || 0), 0);
    return { resolved, correct, accuracy: accuracyFromCounts(correct, resolved) };
  }
  function getSubjectTopicPerformance(subjectId) {
    const subject = state.subjects.find((item) => item.id === subjectId);
    if (!subject) return [];
    return subject.topics.filter((topic) => !topic.archived).map((topic) => {
      const performance = getTopicPerformance(topic.id);
      return { ...topic, ...performance, confidence: performanceConfidence(performance.resolved), classification: classifyAccuracy(performance.accuracy) };
    }).sort((a, b) => {
      if (a.accuracy === null) return 1;
      if (b.accuracy === null) return -1;
      return a.accuracy - b.accuracy;
    });
  }
  function buildErrorProfile(records) {
    records.forEach(normalizeErrorBreakdown);
    return buildCognitiveProfile(records, Object.keys(ERROR_CATEGORIES));
  }
  function getTopicErrorProfile(topicId) {
    return buildErrorProfile(validQuestionRecords().filter((question) => question.topicId === topicId));
  }
  function getSubjectPerformanceCounts(subjectId) {
    let resolved = 0, correct = 0;
    state.questoes.filter((question) => entitySubjectId(question) === subjectId).forEach((question) => {
      resolved += Number(question.resolved) || 0;
      correct += Number(question.correct) || 0;
    });
    state.simulados.forEach((simulado) => (simulado.breakdown || []).filter((item) => entitySubjectId(item) === subjectId).forEach((item) => {
      resolved += Number(item.total) || 0;
      correct += Number(item.correct) || 0;
    }));
    return { resolved, correct, accuracy: accuracyFromCounts(correct, resolved) };
  }
  function topicErrorRate(topicId, subjectId) {
    const topicPerformance = getTopicPerformance(topicId);
    const subjectPerformance = getSubjectPerformanceCounts(subjectId);
    const topicRate = topicPerformance.accuracy === null ? null : 100 - topicPerformance.accuracy;
    const subjectRate = subjectPerformance.accuracy === null ? null : 100 - subjectPerformance.accuracy;
    if (topicRate === null || topicPerformance.resolved < 10) {
      return { rate: subjectRate, source: subjectRate === null ? "none" : "subject", topicWeight: 0, topicPerformance, subjectPerformance };
    }
    if (subjectRate === null) {
      return { rate: Math.round(topicRate * 10) / 10, source: "topic", topicWeight: 1, topicPerformance, subjectPerformance };
    }
    const topicWeight = topicPerformance.resolved >= 50 ? 1 : 0.2 + (topicPerformance.resolved - 10) / 40 * 0.8;
    const rate = Math.round((topicRate * topicWeight + subjectRate * (1 - topicWeight)) * 10) / 10;
    return { rate, source: topicWeight === 1 ? "topic" : "blended", topicWeight, topicPerformance, subjectPerformance };
  }
  function getWeekRange(weeksAgo) {
    const currentStart = startOfWeek(todayISO());
    const start = addDays(currentStart, -7 * weeksAgo);
    return { start, end: addDays(start, 6) };
  }
  function getSubjectPerformanceBetween(subjectId, start, end) {
    const records = validQuestionRecords().filter((question) => entitySubjectId(question) === subjectId && question.date >= start && question.date <= end);
    const resolved = records.reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
    const correct = records.reduce((sum3, q) => sum3 + (Number(q.correct) || 0), 0);
    return { start, end, resolved, correct, accuracy: accuracyFromCounts(correct, resolved), insufficientData: resolved < MIN_WEEKLY_QUESTIONS };
  }
  function getSubjectWeeklyTrend(subjectId, weeks = 8) {
    return Array.from({ length: weeks }, (_, index) => {
      const range = getWeekRange(weeks - 1 - index);
      return getSubjectPerformanceBetween(subjectId, range.start, range.end);
    });
  }
  function getTopicPerformanceBetween(topicId, start, end) {
    const records = validQuestionRecords().filter((question) => question.topicId === topicId && question.date >= start && question.date <= end);
    const resolved = records.reduce((sum3, question) => sum3 + (Number(question.resolved) || 0), 0);
    const correct = records.reduce((sum3, question) => sum3 + (Number(question.correct) || 0), 0);
    return { start, end, resolved, correct, accuracy: accuracyFromCounts(correct, resolved), insufficientData: resolved < MIN_WEEKLY_QUESTIONS };
  }
  function getTopicWeeklyTrend(topicId, weeks = 8) {
    return Array.from({ length: weeks }, (_, index) => {
      const range = getWeekRange(weeks - 1 - index);
      return getTopicPerformanceBetween(topicId, range.start, range.end);
    });
  }
  function calculateWeightedTrend(weeklyData, minWindow = MIN_TREND_WINDOW_QUESTIONS) {
    return calculateWindowTrend(weeklyData, minWindow);
  }
  function topicLastActivityDate(topicId) {
    let last = null;
    const bump = (date2) => {
      if (date2 && (!last || date2 > last)) last = date2;
    };
    state.topicHistory.filter((event) => event.topicId === topicId && !["topic_archived", "topic_restored"].includes(event.type)).forEach((event) => bump(eventLocalDate(event)));
    state.questoes.filter((question) => question.topicId === topicId).forEach((question) => bump(question.date));
    state.studySessions.filter((session) => session.topicId === topicId).forEach((session) => bump(session.date));
    state.calendar.filter((item) => item.topicId === topicId && item.status === "Concluído").forEach((item) => bump(item.date));
    state.reviewAgenda.filter((item) => (item.topicId || item.topicRef) === topicId && item.status === "Concluído").forEach((item) => bump(item.date));
    return last;
  }
  function pendingReviewForTopic(topicId) {
    return state.reviewAgenda.filter((review) => (review.topicId || review.topicRef) === topicId && review.status !== "Concluído").sort((a, b) => (a.date || "").localeCompare(b.date || ""))[0] || null;
  }
  function dominantTopicError(profile) {
    if (profile.categorizedErrors < MIN_ERROR_RECOMMENDATION_COUNT || profile.coverage < MIN_ERROR_RECOMMENDATION_COVERAGE) return null;
    const entries = Object.entries(profile.categories).sort((a, b) => b[1] - a[1]);
    const top = entries[0];
    if (!top || top[1] <= 0) return null;
    const share = Math.round(top[1] / profile.categorizedErrors * 100);
    if (share < 30) return null;
    return { key: top[0], count: top[1], share, meta: ERROR_CATEGORIES[top[0]], recommendation: ERROR_RECOMMENDATIONS[top[0]] };
  }
  function topicMasteryIndex(subjectId, topicId) {
    const found = getTopicById(topicId);
    if (!found) return calculateTopicMastery();
    const today = todayISO(), cutoff = addDays(today, -29);
    return calculateTopicMastery({
      topic: found.topic,
      performance: getTopicPerformance(topicId),
      trend: calculateWeightedTrend(getTopicWeeklyTrend(topicId), MIN_TOPIC_TREND_WINDOW_QUESTIONS),
      reviews: state.reviewAgenda.filter((review) => (review.topicId || review.topicRef) === topicId && review.date && review.date <= today),
      recentSessions: state.studySessions.filter((session) => session.topicId === topicId && session.date >= cutoff && session.date <= today),
      periodStart: null,
      periodEnd: today
    });
  }
  function diagnoseTopic(subjectId, topicId) {
    const found = getTopicById(topicId);
    if (!found) return null;
    const performance = getTopicPerformance(topicId);
    const mastery = topicMasteryIndex(subjectId, topicId);
    const effectiveError = topicErrorRate(topicId, subjectId);
    const trend = calculateWeightedTrend(getTopicWeeklyTrend(topicId), MIN_TOPIC_TREND_WINDOW_QUESTIONS);
    const errorProfile = getTopicErrorProfile(topicId);
    const dominantError = dominantTopicError(errorProfile);
    const lastActivity = topicLastActivityDate(topicId);
    const dateDistance = lastActivity ? diasParaRevisao(lastActivity) : null;
    const daysSinceStudy = dateDistance === null ? 0 : Math.max(0, -dateDistance);
    const pendingReview = pendingReviewForTopic(topicId);
    const reviewDistance = pendingReview?.date ? diasParaRevisao(pendingReview.date) : null;
    const overdueDays = reviewDistance === null ? 0 : Math.max(0, -reviewDistance);
    const target = Math.max(0, Math.min(100, Number(state.metas?.metaAprovacao) || 70));
    const reliablePerformance = performance.resolved >= 10 && performance.accuracy !== null;
    let status = "Em dia";
    if (overdueDays >= 7 || reliablePerformance && performance.accuracy < target - 15 || trend.key === "down" && reliablePerformance && performance.accuracy < target) status = "Crítico";
    else if (overdueDays > 0 || reliablePerformance && performance.accuracy < target || trend.key === "down" || daysSinceStudy >= 7) status = "Atenção";
    else if (!reliablePerformance || daysSinceStudy >= 4) status = "Acompanhamento";
    let recommendation = dominantError?.recommendation || null;
    if (!recommendation && pendingReview && reviewDistance !== null && reviewDistance <= 0) recommendation = { action: "Concluir a revisão programada", studyType: "review", estimatedMinutes: 25, questions: 10 };
    if (!recommendation && found.topic.status === "Não iniciado") recommendation = { action: "Estudar a teoria e registrar os pontos principais", studyType: "study", estimatedMinutes: 35, questions: 10 };
    if (!recommendation && reliablePerformance && performance.accuracy < target) recommendation = { action: "Resolver questões comentadas e revisar os erros", studyType: "questions", estimatedMinutes: 40, questions: 15 };
    if (!recommendation) recommendation = { action: found.topic.status === "Em andamento" ? "Continuar o estudo do tópico" : "Fazer uma revisão de manutenção", studyType: found.topic.status === "Em andamento" ? "study" : "review", estimatedMinutes: 30, questions: 10 };
    const reasons = [];
    if (overdueDays > 0) reasons.push("revisão atrasada " + overdueDays + "d");
    if (reliablePerformance && performance.accuracy < target) reasons.push(performance.accuracy + "% de acerto");
    if (trend.key === "down") reasons.push("tendência em queda");
    if (daysSinceStudy >= 7) reasons.push(daysSinceStudy + "d sem atividade");
    if (dominantError) reasons.push(dominantError.meta.label.toLowerCase() + " em " + dominantError.share + "% dos erros categorizados");
    if (reasons.length === 0) reasons.push(reliablePerformance ? "desempenho dentro do esperado" : "amostra ainda pequena");
    return {
      subjectId,
      topicId,
      status,
      statusIcon: DIAGNOSIS_STATUS_ICON[status],
      performance,
      mastery,
      effectiveErrorRate: effectiveError.rate,
      performanceSource: effectiveError.source,
      trend,
      errorProfile,
      dominantError,
      lastActivity,
      daysSinceStudy,
      studySeconds: studyTimeByTopic(topicId),
      pendingReview,
      overdueDays,
      recommendation,
      reasons,
      summary: reasons.join(" · ")
    };
  }
  function renderQuestionAnalytics() {
    const select = document.getElementById("performanceSubjectSelect");
    if (!select) return;
    const subjects = activeSubjects();
    if (!subjects.some((subject) => subject.id === performanceSubjectId)) {
      performanceSubjectId = subjects.find((subject) => validQuestionRecords().some((question) => entitySubjectId(question) === subject.id))?.id || subjects[0]?.id || null;
    }
    select.innerHTML = subjects.map((subject) => `<option value="${escapeAttr(subject.id)}" ${subject.id === performanceSubjectId ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join("");
    const summary = document.getElementById("questionAnalyticsSummary");
    const bars2 = document.getElementById("topicPerformanceBars");
    const weeklyEl = document.getElementById("subjectWeeklyTrend");
    const profileEl = document.getElementById("subjectErrorProfile");
    const coverageEl = document.getElementById("questionDataCoverage");
    if (!performanceSubjectId) {
      summary.innerHTML = "";
      bars2.innerHTML = weeklyEl.innerHTML = profileEl.innerHTML = '<div class="empty-state"><p>Cadastre uma disciplina para iniciar a análise.</p></div>';
      coverageEl.textContent = "0% identificadas";
      return;
    }
    const records = validQuestionRecords().filter((question) => entitySubjectId(question) === performanceSubjectId);
    const resolved = records.reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
    const correct = records.reduce((sum3, q) => sum3 + (Number(q.correct) || 0), 0);
    const identified = records.filter((q) => q.topicId).reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
    const coverage = resolved ? Math.round(identified / resolved * 100) : 0;
    const accuracy2 = accuracyFromCounts(correct, resolved);
    const weekly = getSubjectWeeklyTrend(performanceSubjectId);
    const trend = calculateWeightedTrend(weekly);
    coverageEl.textContent = `${coverage}% identificadas`;
    summary.innerHTML = [
      ["Questões analisadas", resolved],
      ["Taxa de acerto", accuracy2 === null ? "—" : `${accuracy2}%`],
      ["Cobertura por tópico", `${coverage}%`],
      ["Tendência", `${trend.icon} ${trend.label}`]
    ].map(([label, value2]) => `<div class="stat-cell"><div class="n">${value2}</div><div class="l">${label}</div></div>`).join("");
    const topicPerformance = getSubjectTopicPerformance(performanceSubjectId);
    const mature = topicPerformance.filter((topic) => topic.resolved >= 30), insufficient = topicPerformance.filter((topic) => topic.resolved > 0 && topic.resolved < 30);
    if (performanceViewMode === "with-data" && !mature.length && insufficient.length) performanceViewMode = "insufficient";
    const filteredPerformance = performanceViewMode === "all" ? topicPerformance : topicPerformance.filter((topic) => performanceViewMode === "without-data" ? topic.resolved === 0 : performanceViewMode === "insufficient" ? topic.resolved > 0 && topic.resolved < 30 : topic.resolved >= 30);
    const visiblePerformance = filteredPerformance.slice(0, performanceVisible);
    const performanceTabs = `<div class="analytics-view-tabs" role="group" aria-label="Filtrar desempenho por dados"><button class="btn small ${performanceViewMode === "with-data" ? "" : "ghost"}" data-delegated-click="setPerformanceViewMode('with-data')">Com dados</button><button class="btn small ${performanceViewMode === "insufficient" ? "" : "ghost"}" data-delegated-click="setPerformanceViewMode('insufficient')">Amostra insuficiente</button><button class="btn small ${performanceViewMode === "without-data" ? "" : "ghost"}" data-delegated-click="setPerformanceViewMode('without-data')">Sem dados</button><button class="btn small ${performanceViewMode === "all" ? "" : "ghost"}" data-delegated-click="setPerformanceViewMode('all')">Todos</button></div>`;
    bars2.innerHTML = performanceTabs + (filteredPerformance.length ? visiblePerformance.map((topic) => {
      const width = topic.accuracy === null ? 0 : topic.accuracy;
      return `<div class="performance-row">
      <div class="performance-name">${escapeHtml(topic.name)}<div class="performance-meta">${topic.resolved} questões · ${topic.confidence.label} · domínio ${topicMasteryIndex(performanceSubjectId, topic.id).score}/100</div></div>
      <div class="performance-track"><div class="performance-fill ${topic.classification.key}" style="width:${width}%"></div></div>
      <div class="performance-value">${topic.classification.icon} ${topic.accuracy === null ? "—" : topic.accuracy + "%"}</div>
    </div>`;
    }).join("") + renderCollectionFooter({ variant: "block", total: filteredPerformance.length, visible: visiblePerformance.length, step: 8, label: "tópicos", showMoreAction: "changePerformanceLimit(8)", showAllAction: "showAllPerformance()", showLessAction: performanceVisible > 8 ? "resetPerformanceLimit()" : "" }) : `<div class="empty-state empty-state--compact"><strong>${performanceViewMode === "with-data" ? "Nenhum tópico possui amostra suficiente" : "Nenhum tópico nesta categoria"}</strong><p>${performanceViewMode === "with-data" ? "São necessárias pelo menos 30 questões por tópico para esta visualização." : "Altere o filtro para visualizar os demais tópicos."}</p></div>`);
    weeklyEl.innerHTML = `<div class="trend-grid">${weekly.map((week) => `
    <div class="trend-week ${week.insufficientData ? "insufficient" : ""}">
      <span>${formatDatePt(week.start).slice(0, 5)}</span>
      <strong>${week.insufficientData ? "—" : week.accuracy + "%"}</strong>
      <small>${week.resolved} questões</small>
    </div>`).join("")}</div>
    <div class="trend-summary ${trend.key}">${trend.icon} ${trend.label}${trend.delta === null ? "" : ` · ${trend.delta > 0 ? "+" : ""}${trend.delta.toFixed(1)} p.p.`}</div>`;
    const subjectTopics = activeTopics().filter((topic) => topic.subjectId === performanceSubjectId);
    if (errorAnalysisView.topicId && !subjectTopics.some((topic) => topic.id === errorAnalysisView.topicId)) errorAnalysisView.topicId = "";
    const currentStart = addDays(todayISO(), -(errorAnalysisView.days - 1)), previousEnd = addDays(currentStart, -1), previousStart = addDays(previousEnd, -(errorAnalysisView.days - 1));
    const scopedRecords = validQuestionRecords().filter((question) => entitySubjectId(question) === performanceSubjectId && (!errorAnalysisView.topicId || question.topicId === errorAnalysisView.topicId));
    const profile = buildErrorProfile(scopedRecords.filter((question) => question.date >= currentStart && question.date <= todayISO()));
    const previousProfile = buildErrorProfile(scopedRecords.filter((question) => question.date >= previousStart && question.date <= previousEnd));
    const errorToolbar = `<div class="error-analysis-toolbar"><select aria-label="Período do perfil de erros" data-delegated-change="setErrorAnalysisFilter('days',this.value)">${[7, 30, 60, 90].map((days) => `<option value="${days}" ${errorAnalysisView.days === days ? "selected" : ""}>Últimos ${days} dias</option>`).join("")}</select><select aria-label="Tópico do perfil de erros" data-delegated-change="setErrorAnalysisFilter('topicId',this.value)"><option value="">Todos os tópicos</option>${subjectTopics.map((topic) => `<option value="${escapeAttr(topic.id)}" ${errorAnalysisView.topicId === topic.id ? "selected" : ""}>${escapeHtml(topic.name)}</option>`).join("")}</select></div>`;
    if (profile.totalErrors === 0) {
      profileEl.innerHTML = errorToolbar + '<div class="empty-state"><p>Nenhum erro registrado neste recorte.</p></div>';
    } else {
      const items = [...Object.entries(ERROR_CATEGORIES).map(([key, meta]) => ({ label: `${meta.icon} ${meta.label}`, value: profile.categories[key], previous: previousProfile.categories[key] })), { label: "Sem categoria", value: profile.uncategorized, previous: previousProfile.uncategorized }];
      profileEl.innerHTML = errorToolbar + `<div class="error-profile-grid">${items.map((item) => {
        const delta = item.value - item.previous;
        return `<div class="error-profile-item"><span>${item.label}</span><strong>${item.value}</strong><small>${previousProfile.totalErrors ? `${delta >= 0 ? "+" : ""}${delta} vs. período anterior` : "Sem período anterior"}</small></div>`;
      }).join("")}</div>
      <div class="analytics-note">${profile.coverage}% dos ${profile.totalErrors} erros estão categorizados · confiança ${profile.confidence.label.toLowerCase()} · ${formatDatePt(currentStart)} a ${formatDatePt(todayISO())}.</div>`;
    }
  }
  function simuladoEffectiveCounts(sim) {
    if (sim.breakdown && sim.breakdown.length > 0) {
      const correct = sim.breakdown.reduce((s, b) => s + (Number(b.correct) || 0), 0);
      const total = sim.breakdown.reduce((s, b) => s + (Number(b.total) || 0), 0);
      return { correct, total };
    }
    return { correct: Number(sim.correct) || 0, total: Number(sim.total) || 0 };
  }
  function simuladoNota(sim) {
    const { correct, total } = simuladoEffectiveCounts(sim);
    return calcAcertoPct(correct, total);
  }
  var openBreakdownIds = /* @__PURE__ */ new Set();
  function toggleBreakdown(simuladoId) {
    if (openBreakdownIds.has(simuladoId)) openBreakdownIds.delete(simuladoId);
    else openBreakdownIds.add(simuladoId);
    renderSimulados();
  }
  function addBreakdownRow(simuladoId) {
    const sim = state.simulados.find((s) => s.id === simuladoId);
    if (!sim.breakdown) sim.breakdown = [];
    sim.breakdown.push({ id: uid("breakdown"), subjectId: activeSubjects()[0]?.id || null, correct: 0, total: 0 });
    persistAndRender();
  }
  function updateBreakdownRow(simuladoId, breakdownId, field, value2) {
    const sim = state.simulados.find((s) => s.id === simuladoId);
    const b = sim.breakdown.find((x) => x.id === breakdownId);
    b[field] = field === "correct" || field === "total" ? Number(value2) || 0 : value2;
    b.total = Math.max(0, Number(b.total) || 0);
    if ((Number(b.correct) || 0) > b.total) showToast("Os acertos foram limitados ao total de questões.");
    b.correct = Math.max(0, Math.min(Number(b.correct) || 0, b.total));
    persistAndRender();
  }
  function deleteBreakdownRow(simuladoId, breakdownId) {
    const sim = state.simulados.find((s) => s.id === simuladoId);
    sim.breakdown = sim.breakdown.filter((x) => x.id !== breakdownId);
    persistAndRender();
  }
  function simulationViewModel(sim) {
    const counts = simuladoEffectiveCounts(sim);
    return { date: sim.date ? formatDatePt(sim.date) : "Sem data", name: sim.nome || "Simulado sem nome", correct: counts.correct, total: counts.total, score: simuladoNota(sim) };
  }
  function editSimulation(id) {
    simulationEditController.begin(id);
  }
  function cancelSimulationEdit() {
    simulationEditController.cancel();
  }
  function updateSimulationDraft(field, value2) {
    simulationEditController.update(field, field === "correct" || field === "total" ? Math.max(0, Math.floor(Number(value2) || 0)) : value2);
  }
  function saveSimulationEdit() {
    if (!simulationEditController.save()) cancelSimulationEdit();
  }
  function renderSimulationReadRow(sim) {
    const vm = simulationViewModel(sim);
    const hasBreakdown = sim.breakdown && sim.breakdown.length > 0;
    const details = `<button class="btn ghost small ${hasBreakdown ? "has-notes" : ""}" data-delegated-click="toggleBreakdown('${sim.id}')">${openBreakdownIds.has(sim.id) ? "Ocultar detalhes" : "Ver desempenho"}</button>`;
    if (isMobileHistoryLayout()) return `<tr class="mobile-history-row" data-id="${sim.id}"><td colspan="7"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)}</div><div class="mobile-card-title">${escapeHtml(vm.name)}</div></div><button class="btn ghost small" data-delegated-click="editSimulation('${sim.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${vm.correct} / ${vm.total}</span><strong>Nota ${vm.score}%</strong>${details}</div></article></td></tr>${openBreakdownIds.has(sim.id) ? renderSimulationBreakdown(sim) : ""}`;
    return `<tr class="history-read-row history-desktop-row" data-id="${sim.id}"><td>${escapeHtml(vm.date)}</td><td><div class="row-primary">${escapeHtml(vm.name)}</div></td><td class="number-cell">${vm.correct}</td><td class="number-cell">${vm.total}</td><td class="number-cell">${vm.score}%</td><td>${details}</td><td><button class="btn ghost small" data-delegated-click="editSimulation('${sim.id}')">Editar</button></td></tr>${openBreakdownIds.has(sim.id) ? renderSimulationBreakdown(sim) : ""}`;
  }
  function renderSimulationBreakdown(sim) {
    return `<tr class="breakdown-row"><td colspan="7"><div class="breakdown-box"><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink-soft);margin-bottom:8px;">Nota por disciplina neste simulado — a nota geral é calculada automaticamente por aqui.</div>${(sim.breakdown || []).map((b) => `<div class="breakdown-line"><select data-delegated-change="updateBreakdownRow('${sim.id}','${b.id}','subjectId',this.value)"><option value="">—</option>${subjectsForSelection(entitySubjectId(b)).map((s) => `<option value="${escapeAttr(s.id)}" ${s.id === entitySubjectId(b) ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}</select><input type="number" min="0" value="${b.correct || 0}" placeholder="Acertos" data-delegated-blur="updateBreakdownRow('${sim.id}','${b.id}','correct',this.value)"><input type="number" min="0" value="${b.total || 0}" placeholder="Total" data-delegated-blur="updateBreakdownRow('${sim.id}','${b.id}','total',this.value)"><button class="icon-btn" data-delegated-click="deleteBreakdownRow('${sim.id}','${b.id}')">✕</button></div>`).join("")}<button class="btn ghost small breakdown-add-btn" data-delegated-click="addBreakdownRow('${sim.id}')">+ Adicionar disciplina</button></div></td></tr>`;
  }
  function renderSimulationEditRow(sim) {
    const d = simulationEditController.state.draft;
    const hasBreakdown = d.breakdown && d.breakdown.length > 0;
    return `<tr class="row-editing" data-id="${sim.id}"><td colspan="7"><div class="inline-edit-form"><label>Data<input type="date" value="${d.date || ""}" data-delegated-change="updateSimulationDraft('date',this.value)"></label><label>Nome<input type="text" value="${escapeAttr(d.nome || "")}" data-delegated-input="updateSimulationDraft('nome',this.value)"></label><label>Acertos<input type="number" min="0" value="${Number(d.correct) || 0}" ${hasBreakdown ? "disabled" : ""} data-delegated-input="updateSimulationDraft('correct',this.value)"></label><label>Total<input type="number" min="0" value="${Number(d.total) || 0}" ${hasBreakdown ? "disabled" : ""} data-delegated-input="updateSimulationDraft('total',this.value)"></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelSimulationEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveSimulationEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteSimuladoRow('${sim.id}')">Excluir</button></div></div></td></tr>`;
  }
  function renderSimulados() {
    const body = document.getElementById("simuladosBody");
    const rows = [...state.simulados].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="border:none;">
      <p>Nenhum simulado registrado ainda.</p>
      <button class="btn small" data-delegated-click="addSimuladoRow()">+ Registrar simulado</button>
    </div></td></tr>`;
      return;
    }
    const visibleRows = rows.slice(0, listViewState.simulationsVisible);
    body.innerHTML = visibleRows.map((sim) => simulationEditController.state.editingId === sim.id ? renderSimulationEditRow(sim) : renderSimulationReadRow(sim)).join("") + renderListViewFooter(
      rows.length,
      listViewState.simulationsVisible,
      LIST_VIEW_STEPS.simulations,
      "changeListLimit('simulations',LIST_VIEW_STEPS.simulations,renderSimulados)",
      "changeListLimit('simulations',-listViewState.simulationsVisible,renderSimulados)",
      7,
      "simulados"
    );
  }
  function addSimuladoRow() {
    listViewState.simulationsVisible = LIST_VIEW_STEPS.simulations;
    const sim = simulationService.create({ date: todayISO(), nome: "", correct: 0, total: 0, breakdown: [] });
    simulationEditController.begin(sim.id, { isNew: true });
  }
  function deleteSimuladoRow(id) {
    showConfirm("Excluir este simulado?", () => {
      simulationService.remove(id);
      openBreakdownIds.delete(id);
      simulationEditController.reset();
      persistAndRender();
      showToast("Simulado excluído.");
    });
  }
  document.getElementById("addQuestaoRowBtn").addEventListener("click", addQuestaoRow);
  document.getElementById("addSimuladoRowBtn").addEventListener("click", addSimuladoRow);
  var WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  function metaHoursForDate(date2 = todayISO()) {
    return goalsService.hoursForDate(date2);
  }
  function metaHoursToday() {
    return metaHoursForDate(todayISO());
  }
  function updateMetaHoursDay(day, value2) {
    studyPlanPreview = null;
    goalsService.updateDailyHours(day, value2, { isToday: Number(day) === parseLocalDate(todayISO()).getDay() });
    persistAndRender();
  }
  function applyTodayGoalToAllDays() {
    const value2 = metaHoursToday();
    goalsService.applyHoursToEveryDay(value2);
    persistAndRender();
    showToast(`Meta de ${value2}h aplicada a todos os dias.`);
  }
  function clearWeekendGoals() {
    goalsService.clearWeekend();
    persistAndRender();
    showToast("Metas do fim de semana removidas.");
  }
  function renderWeeklyHoursGoals() {
    const container = document.getElementById("weeklyHoursGoals");
    if (!container) return;
    const todayDay = parseLocalDate(todayISO()).getDay();
    const availability = buildWeeklyAvailability(state.metas.horasPorDia);
    container.innerHTML = `<div class="weekly-availability-summary"><div><strong>${formatPlanMinutes(availability.totalMinutes)}</strong><span>disponíveis por semana</span></div><div><strong>${availability.activeDays}</strong><span>dias com estudo</span></div><div><strong>${formatPlanMinutes(Math.round(availability.averageHours * 60))}</strong><span>média por dia ativo</span></div><div><strong>${formatPlanMinutes(Math.round(metaHoursToday() * 60))}</strong><span>disponíveis hoje</span></div></div>${availability.state === "empty" ? '<p class="availability-warning">Defina ao menos um dia para habilitar recomendações e planejamento.</p>' : ""}<div class="weekday-goal-actions"><button class="btn ghost small" data-delegated-click="applyTodayGoalToAllDays()">Aplicar hoje a todos</button><button class="btn ghost small" data-delegated-click="clearWeekendGoals()">Limpar fim de semana</button></div><div class="weekday-goals">${WEEKDAY_LABELS.map(
      (label, day) => `<label class="weekday-goal ${day === todayDay ? "today" : ""}"><span>${label}${day === todayDay ? " · hoje" : ""}</span><div><input type="number" min="0" max="24" step="0.25" value="${metaHoursForDate(addDays(startOfWeek(todayISO()), day === 0 ? 6 : day - 1))}" data-delegated-blur="updateMetaHoursDay(${day},this.value)" aria-label="Disponibilidade em horas de ${label}"><small>h</small></div></label>`
    ).join("")}</div>`;
  }
  function contarTopicosConcluidosNoPeriodo(pred) {
    const ids = /* @__PURE__ */ new Set();
    topicCompletionEvents().forEach((event) => {
      const date2 = eventLocalDate(event);
      if (date2 && pred(date2) && event.topicId) ids.add(event.topicId);
    });
    return ids.size;
  }
  function somarQuestoesNaSemana() {
    return state.questoes.filter((q) => isSameWeek(q.date)).reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
  }
  function contarSimuladosNaSemana() {
    return state.simulados.filter((s) => isSameWeek(s.date)).length;
  }
  function renderMetas() {
    const m = state.metas;
    const atingidoSemanal = contarTopicosConcluidosNoPeriodo(isSameWeek);
    const atingidoMensal = contarTopicosConcluidosNoPeriodo(isSameMonth);
    const atingidoQuestoes = somarQuestoesNaSemana();
    const atingidoSimulados = contarSimuladosNaSemana();
    const cards = [
      { key: "semanal", label: "Meta Semanal", desc: "Tópicos concluídos esta semana", atingido: atingidoSemanal, meta: m.semanal },
      { key: "mensal", label: "Meta Mensal", desc: "Tópicos concluídos este mês", atingido: atingidoMensal, meta: m.mensal },
      { key: "questoesSemanal", label: "Meta de Questões", desc: "Questões resolvidas esta semana", atingido: atingidoQuestoes, meta: m.questoesSemanal },
      { key: "simuladosSemanal", label: "Meta de Simulados", desc: "Simulados feitos esta semana", atingido: atingidoSimulados, meta: m.simuladosSemanal }
    ];
    document.getElementById("metasContainer").innerHTML = cards.map((c) => {
      const pct = c.meta > 0 ? Math.round(c.atingido / c.meta * 100) : 0;
      const pctDisplay = Math.min(pct, 100);
      return `
    <div class="meta-card">
      <div class="meta-info">
        <div class="meta-name">${c.label}</div>
        <div class="meta-formula">=Atingido/Meta · ${escapeHtml(c.desc)}</div>
      </div>
      <div class="meta-progress-block">
        <div class="meta-progress-track">
          <div class="meta-progress-fill ${pct >= 100 ? "over" : ""}" style="width:${pctDisplay}%"></div>
        </div>
        <div class="meta-progress-label">
          <span>${c.atingido} / ${c.meta}</span>
          <span>${pct}%</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="0" value="${c.meta}" data-delegated-blur="updateMeta('${c.key}', this.value)">
      </div>
    </div>`;
    }).join("") + `
    <div class="meta-card">
      <div class="meta-info">
        <div class="meta-name">Meta de Aprovação</div>
        <div class="meta-formula">Taxa de acerto alvo em questões e simulados</div>
      </div>
      <div class="meta-progress-block">
        <div class="meta-progress-track">
          <div class="meta-progress-fill ${taxaAcertoGeral() >= state.metas.metaAprovacao ? "over" : ""}" style="width:${Math.min(taxaAcertoGeral(), 100)}%"></div>
        </div>
        <div class="meta-progress-label">
          <span>Atual: ${taxaAcertoGeral()}%</span>
          <span>Meta: ${state.metas.metaAprovacao}%</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="0" max="100" value="${state.metas.metaAprovacao}" data-delegated-blur="updateMeta('metaAprovacao', this.value)">%
      </div>
    </div>`;
  }
  function updateMeta(key, value2) {
    goalsService.update(key, value2);
    persistAndRender();
  }
  function renderExamBlueprintConfig() {
    const container = document.getElementById("examBlueprintConfig");
    if (!container) return;
    const blueprint = state.examBlueprint;
    const rows = activeSubjects().map((subject) => {
      const config = blueprint.subjects.find((item) => item.subjectId === subject.id);
      return `<div class="exam-subject-row"><strong>${escapeHtml(subject.name)}</strong><label>Questões esperadas<input type="number" min="0" step="1" value="${config?.expectedQuestions ?? ""}" placeholder="Não definido" data-delegated-blur="updateExamSubject('${subject.id}','expectedQuestions',this.value)"></label><label>Peso por questão<input type="number" min="0.1" step="0.1" value="${config?.questionWeight ?? ""}" placeholder="1" data-delegated-blur="updateExamSubject('${subject.id}','questionWeight',this.value)"></label><label>Prioridade<select data-delegated-change="updateExamSubject('${subject.id}','priority',this.value)"><option value="normal" ${!config || config.priority === "normal" ? "selected" : ""}>Normal</option><option value="high" ${config?.priority === "high" ? "selected" : ""}>Alta</option><option value="low" ${config?.priority === "low" ? "selected" : ""}>Baixa</option></select></label></div>`;
    }).join("");
    container.innerHTML = `<div class="exam-blueprint-main"><label>Data da prova<input type="date" value="${escapeAttr(blueprint.examDate || "")}" data-delegated-change="updateExamBlueprint('examDate',this.value)"></label><label>Nota-alvo (%)<input type="number" min="0" max="100" value="${blueprint.targetScore}" data-delegated-blur="updateExamBlueprint('targetScore',this.value)"></label></div><div class="exam-subject-list">${rows || '<p class="diagnosis-empty">Cadastre disciplinas para configurar o peso no edital.</p>'}</div>`;
  }
  var studyPlanPreview = null;
  var dailyPlanPreview = null;
  function studyPlanCandidates() {
    return intelligenceCandidates().filter((item) => item.topicId).map((item) => ({ ...item, completed: false, estimatedMinutes: item.remainingMinutes }));
  }
  function calculateStudyPlanPreview() {
    const days = state.examDate ? diasParaRevisao(state.examDate) : null;
    const weeklyAvailableMinutes = Object.values(state.metas.horasPorDia).reduce((sum3, hours) => sum3 + Math.max(0, Number(hours) || 0) * 60, 0);
    studyPlanPreview = studyPlanService.calculate({ topics: studyPlanCandidates(), weeklyAvailableMinutes, weeksUntilExam: days === null ? 0 : Math.max(0, days / 7) });
    renderStudyPlanBuilder();
  }
  function clearStudyPlanPreview() {
    studyPlanPreview = null;
    renderStudyPlanBuilder();
  }
  function confirmStudyPlan() {
    if (!studyPlanPreview || studyPlanPreview.state === "insufficient" || !studyPlanPreview.items.length) return;
    studyPlanService.confirm({ ...studyPlanPreview, examDate: state.examDate || null });
    studyPlanPreview = null;
    dailyPlanPreview = null;
    scheduleSave();
    renderStudyPlanBuilder();
    showToast("Plano semanal confirmado e salvo.");
  }
  function latestStudyPlan() {
    return studyPlanService.getActive();
  }
  function calculateDailyPlanPreview() {
    const studyPlan = latestStudyPlan();
    if (!studyPlan) return;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date2 = addDays(todayISO(), index);
      return { date: date2, availableMinutes: Math.round(metaHoursForDate(date2) * 60) };
    }), end = days.at(-1).date;
    const dueReviews = state.reviewAgenda.filter((review) => review.status !== "Concluído" && review.topicId && review.date >= todayISO() && review.date <= end).map((review) => ({ id: review.id, date: review.date, subjectId: review.subjectId, topicId: review.topicId, subjectName: getSubjectName(review.subjectId), topicName: getTopicName(review.topicId), minutes: 25 }));
    dailyPlanPreview = dailyPlanService.calculate({ studyPlan, days, dueReviews, reserveRatio: 0.1, eligibleTopicIds: intelligenceCandidates().filter((item) => !item.archived && !item.blockedPrerequisites.length).map((item) => item.topicId) });
    renderStudyPlanBuilder();
  }
  function clearDailyPlanPreview() {
    dailyPlanPreview = null;
    renderStudyPlanBuilder();
  }
  function confirmDailyPlanPreview() {
    if (dailyPlanPreview?.state !== "proposal") return;
    const studyPlan = latestStudyPlan(), result = dailyPlanService.confirm(dailyPlanPreview, studyPlan);
    dailyPlanPreview = null;
    scheduleSave();
    renderStudyPlanBuilder();
    showToast(`${pluralize(result.createdItems, "atividade")} criada${result.createdItems === 1 ? "" : "s"} no plano diário.`);
  }
  function undoLatestDailyPlanGeneration() {
    const studyPlan = latestStudyPlan(), operation = [...studyPlan?.dailyPlanOperations || []].reverse().find((item) => !item.undoneAt);
    if (!operation) return;
    const result = dailyPlanService.undo(operation, studyPlan);
    scheduleSave();
    renderStudyPlanBuilder();
    renderPlanoHoje();
    showToast(result.protectedItems.length ? `${pluralize(result.removedItems, "atividade")} removida${result.removedItems === 1 ? "" : "s"}; itens executados foram preservados.` : "Criação dos planos diários desfeita.");
  }
  function renderStudyPlanBuilder() {
    const container = document.getElementById("examStudyPlan");
    if (!container) return;
    const latest = latestStudyPlan();
    if (!studyPlanPreview) {
      if (dailyPlanPreview) {
        const proposal = dailyPlanPreview, rows = proposal.days.map((day) => `<div><strong>${formatDatePt(day.date)}</strong><span>${formatPlanMinutes(day.plannedMinutes)} planejados · ${formatPlanMinutes(day.flexMinutes)} livres · ${day.items.length} atividades</span></div>`).join("");
        container.innerHTML = `<div class="study-plan-summary"><div><strong>${formatPlanMinutes(proposal.plannedMinutes)}</strong><span>Distribuição proposta</span></div><div><strong>${proposal.days.length}</strong><span>Dias utilizados</span></div><div><strong>${formatPlanMinutes(proposal.unallocatedMinutes)}</strong><span>Não alocados</span></div><div><strong>10%</strong><span>Reserva mínima</span></div></div>${proposal.state === "proposal" ? `<div class="replan-allocations">${rows}</div><div class="study-plan-actions"><button class="btn" data-delegated-click="confirmDailyPlanPreview()">Confirmar planos diários</button><button class="btn ghost" data-delegated-click="clearDailyPlanPreview()">Cancelar</button></div>` : `<div class="upcoming-empty">${escapeHtml(proposal.reason)}</div><button class="btn ghost small" data-delegated-click="clearDailyPlanPreview()">Fechar</button>`}`;
        return;
      }
      const activeOperation = [...latest?.dailyPlanOperations || []].reverse().find((item) => !item.undoneAt);
      container.innerHTML = `${latest ? `<div class="confirmed-plan-note"><strong>Plano confirmado</strong><span>${new Date(latest.confirmedAt).toLocaleString("pt-BR")} · ${formatPlanMinutes(latest.weeklyPlannedMinutes)} por semana · prova em ${latest.examDate ? formatDatePt(latest.examDate) : "data não definida"}</span></div>` : ""}<div class="study-plan-actions"><button class="btn" data-delegated-click="calculateStudyPlanPreview()">Calcular proposta semanal</button>${latest ? '<button class="btn ghost" data-delegated-click="calculateDailyPlanPreview()">Distribuir nos próximos 7 dias</button>' : ""}${activeOperation ? '<button class="btn ghost" data-delegated-click="undoLatestDailyPlanGeneration()">Desfazer última distribuição</button>' : ""}</div>`;
      return;
    }
    const plan = studyPlanPreview;
    const blockedNote = plan.blockedTopics?.length ? `<p class="confidence-note">Aguardando pré-requisitos: ${plan.blockedTopics.map((item) => escapeHtml(item.topicName || item.id) + " (" + item.prerequisites.map((id) => escapeHtml(getTopicName(id) || id)).join(", ") + ")").join("; ")}. Conclua a base ou reforce seu domínio e recalcule a proposta.</p>` : "";
    if (plan.state === "insufficient") {
      container.innerHTML = `<div class="upcoming-empty">Não foi possível montar o plano. Confira a data da prova, disponibilidade e carga restante dos tópicos elegíveis.</div>${blockedNote}<button class="btn ghost small" data-delegated-click="clearStudyPlanPreview()">Fechar</button>`;
      return;
    }
    const subjectRows = plan.subjects.map((item) => `<div><strong>${escapeHtml(item.subjectName)}</strong><span>${formatPlanMinutes(item.minutes)} por semana</span></div>`).join("");
    const topicRows = plan.items.slice(0, 8).map((item) => `<div class="study-plan-topic"><span><strong>${escapeHtml(item.subjectName)}</strong> — ${escapeHtml(item.topicName)}</span><span>${formatPlanMinutes(item.minutes)} · prioridade ${item.score}/100${item.covered ? " · manutenção" : ""} · teoria ${formatPlanMinutes(item.activityMix.theory)} · questões ${formatPlanMinutes(item.activityMix.questions)} · revisões ${formatPlanMinutes(item.activityMix.reviews)}</span></div>`).join("");
    container.innerHTML = `<div class="study-plan-summary"><div><strong>${formatPlanMinutes(plan.weeklyAvailableMinutes)}</strong><span>Disponibilidade semanal</span></div><div><strong>${formatPlanMinutes(plan.remainingMinutes)}</strong><span>Carga pendente configurada</span></div><div><strong>${plan.weeksUntilExam}</strong><span>Semanas até a prova</span></div><div><strong>${formatPlanMinutes(plan.weeklyPlannedMinutes)}</strong><span>Proposta semanal</span></div></div><div class="study-plan-confidence">Dados disponíveis: ${Math.round(plan.confidence * 100)}% · força da evidência: ${plan.evidence?.evidenceLabel?.toLowerCase() || "não avaliada"}${plan.missingEffort.length ? ` · ${plan.missingEffort.length} tópico${plan.missingEffort.length === 1 ? "" : "s"} sem esforço estimado` : ""}</div>${blockedNote}<p class="confidence-note">Manutenção prevista: ${formatPlanMinutes(plan.maintenanceMinutes || 0)} nesta semana. Tópicos cobertos recebem questões e revisões. A prioridade usa os mesmos fatores da recomendação de estudo.</p><div class="study-plan-subjects">${subjectRows}</div><details class="study-plan-details"><summary>Ver divisão por tópico e atividade</summary>${topicRows}</details><div class="study-plan-actions"><button class="btn" data-delegated-click="confirmStudyPlan()">Confirmar e salvar plano</button><button class="btn ghost" data-delegated-click="clearStudyPlanPreview()">Descartar proposta</button></div>`;
  }
  function updateExamBlueprint(field, value2) {
    studyPlanPreview = null;
    if (field === "examDate") {
      state.examBlueprint.examDate = value2 || null;
      state.examDate = value2 || "";
    }
    if (field === "targetScore") {
      const target = Math.max(0, Math.min(100, Number(value2) || 0));
      state.examBlueprint.targetScore = target;
      goalsService.update("metaAprovacao", target);
    }
    state.examBlueprint.configuredAt = nowISO2();
    persistAndRender();
  }
  function updateExamSubject(subjectId, field, value2) {
    studyPlanPreview = null;
    let config = state.examBlueprint.subjects.find((item) => item.subjectId === subjectId);
    if (!config) {
      config = { subjectId, expectedQuestions: 0, questionWeight: 1, priority: "normal" };
      state.examBlueprint.subjects.push(config);
    }
    if (field === "expectedQuestions") config.expectedQuestions = Math.max(0, Math.round(Number(value2) || 0));
    if (field === "questionWeight") config.questionWeight = Math.max(0.1, Number(value2) || 1);
    if (field === "priority" && EXAM_PRIORITIES.includes(value2)) config.priority = value2;
    state.examBlueprint.configuredAt = nowISO2();
    persistAndRender();
  }
  function somarQuestoesDisciplinaNaSemana(subjectId) {
    return state.questoes.filter((q) => entitySubjectId(q) === subjectId && isSameWeek(q.date)).reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
  }
  function renderMetasPorDisciplina() {
    const sel = document.getElementById("novaMetaDisciplinaSelect");
    const current = sel.value;
    sel.innerHTML = activeSubjects().map((s) => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join("") || `<option value="">Nenhuma disciplina cadastrada</option>`;
    if (current) sel.value = current;
    const container = document.getElementById("metasPorDisciplinaContainer");
    if (state.metasPorDisciplina.length === 0) {
      container.innerHTML = `<div class="upcoming-empty">Nenhuma meta por disciplina ainda. Escolha uma disciplina acima e adicione.</div>`;
      return;
    }
    container.innerHTML = state.metasPorDisciplina.map((md) => {
      const subjectId = entitySubjectId(md);
      const atingido = somarQuestoesDisciplinaNaSemana(subjectId);
      const pct = md.meta > 0 ? Math.round(atingido / md.meta * 100) : 0;
      const pctDisplay = Math.min(pct, 100);
      return `
    <div class="meta-card">
      <div class="meta-info">
        <div class="meta-name">${escapeHtml(subjectId ? getSubjectName(subjectId) : "(sem disciplina)")}</div>
        <div class="meta-formula">Questões resolvidas nesta semana</div>
      </div>
      <div class="meta-progress-block">
        <div class="meta-progress-track">
          <div class="meta-progress-fill ${pct >= 100 ? "over" : ""}" style="width:${pctDisplay}%"></div>
        </div>
        <div class="meta-progress-label">
          <span>${atingido} / ${md.meta}</span>
          <span>${pct}%</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="1" value="${md.meta}" data-delegated-blur="updateMetaDisciplina('${md.id}', this.value)">
        <button class="icon-btn" data-delegated-click="deleteMetaDisciplina('${md.id}')" title="Remover">✕</button>
      </div>
    </div>`;
    }).join("");
  }
  function addMetaDisciplina() {
    const subjectId = document.getElementById("novaMetaDisciplinaSelect").value;
    const meta = Number(document.getElementById("novaMetaDisciplinaValor").value) || 20;
    if (!subjectId) {
      showToast("Cadastre uma disciplina primeiro.");
      return;
    }
    if (state.metasPorDisciplina.some((md) => entitySubjectId(md) === subjectId)) {
      showToast("Já existe uma meta pra essa disciplina.");
      return;
    }
    subjectGoalService.create({ subjectId, meta });
    persistAndRender();
  }
  function updateMetaDisciplina(id, value2) {
    subjectGoalService.update(id, { meta: Number(value2) || 1 });
    persistAndRender();
  }
  function deleteMetaDisciplina(id) {
    subjectGoalService.remove(id);
    persistAndRender();
  }
  document.getElementById("addMetaDisciplinaBtn").addEventListener("click", addMetaDisciplina);
  function getWeekStartMinus(weeksAgo) {
    const currentWeekStart = startOfWeek(todayISO());
    return addDays(currentWeekStart, -7 * weeksAgo);
  }
  function computeWeeklyHistory(numWeeks) {
    const weeks = [];
    for (let i = 0; i < numWeeks; i++) {
      const weekStart = getWeekStartMinus(i);
      const weekEnd = addDays(weekStart, 6);
      const topicsConcl = uniqueTopicsCompletedBetween(weekStart, weekEnd);
      const questoesResolved = state.questoes.filter((q) => q.date >= weekStart && q.date <= weekEnd).reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
      const simuladosCount = state.simulados.filter((s) => s.date >= weekStart && s.date <= weekEnd).length;
      weeks.push({
        weekStart,
        weekEnd,
        current: i === 0,
        topicsConcl,
        questoesResolved,
        simuladosCount,
        semanalOk: topicsConcl >= state.metas.semanal,
        questoesOk: questoesResolved >= state.metas.questoesSemanal,
        simuladosOk: simuladosCount >= state.metas.simuladosSemanal
      });
    }
    return weeks;
  }
  function renderHistoricoMetas() {
    const weeks = computeWeeklyHistory(8);
    const container = document.getElementById("historicoMetasContainer");
    const badge = (ok, current) => current ? `<span class="wk-current">em andamento</span>` : ok ? `<span class="wk-ok">✓ cumprida</span>` : `<span class="wk-fail">✗ não cumprida</span>`;
    container.innerHTML = `
    <div class="weekly-history-table-wrap">
    <table class="weekly-history-table">
      <thead>
        <tr>
          <th>Semana</th>
          <th>Tópicos</th>
          <th>Questões</th>
          <th>Simulados</th>
        </tr>
      </thead>
      <tbody>
        ${weeks.map((w) => `
          <tr>
            <td>${formatDatePt(w.weekStart)} – ${formatDatePt(w.weekEnd)}</td>
            <td>${w.topicsConcl}/${state.metas.semanal} ${badge(w.semanalOk, w.current)}</td>
            <td>${w.questoesResolved}/${state.metas.questoesSemanal} ${badge(w.questoesOk, w.current)}</td>
            <td>${w.simuladosCount}/${state.metas.simuladosSemanal} ${badge(w.simuladosOk, w.current)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    </div>
  `;
  }
  function computeRitmo() {
    const allT = activeTopics();
    const total = allT.length;
    const done = allT.filter((t) => t.status === "Concluído").length;
    const remaining = total - done;
    if (total === 0) return { status: "sem-topicos" };
    if (remaining <= 0) return { status: "completo" };
    const cutoff = addDays(todayISO(), -13);
    const recentDone = uniqueTopicsCompletedBetween(cutoff, todayISO());
    const ratePerDay = recentDone / 14;
    if (ratePerDay <= 0) return { status: "sem-dados", remaining };
    const daysNeeded = Math.ceil(remaining / ratePerDay);
    const finishDate = addDays(todayISO(), daysNeeded);
    let comparativo = null, daysToExam = null;
    if (state.examDate) {
      daysToExam = diasParaRevisao(state.examDate);
      if (daysToExam !== null) {
        comparativo = daysNeeded <= daysToExam ? "no-prazo" : "atrasado";
      }
    }
    return { status: "ok", remaining, ratePerDay, daysNeeded, finishDate, comparativo, daysToExam };
  }
  function renderRitmo() {
    const r = computeRitmo();
    const container = document.getElementById("ritmoContainer");
    if (r.status === "sem-topicos") {
      container.innerHTML = `<div class="upcoming-empty">Adicione disciplinas e tópicos pra ver a estimativa de ritmo aqui.</div>`;
      return;
    }
    if (r.status === "completo") {
      container.innerHTML = `<div class="pace-block"><div class="pace-status ok">🎉 Todos os tópicos cadastrados já foram concluídos!</div></div>`;
      return;
    }
    if (r.status === "sem-dados") {
      container.innerHTML = `<div class="pace-block">
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining === 1 ? "" : "s"} pra concluir o plano.</div>
      <div class="pace-status neutral">Ainda sem tópicos concluídos nos últimos 14 dias — sem dados suficientes pra estimar o ritmo ainda.</div>
    </div>`;
      return;
    }
    const ritmoTxt = r.ratePerDay >= 1 ? `${r.ratePerDay.toFixed(1)} tópicos por dia` : `${(r.ratePerDay * 7).toFixed(1)} tópicos por semana`;
    let statusHtml = "";
    if (r.comparativo === "no-prazo") {
      const folga = r.daysToExam - r.daysNeeded;
      statusHtml = `<div class="pace-status ok">🟢 No ritmo atual, você termina com ${folga} dia${folga === 1 ? "" : "s"} de folga antes da prova.</div>`;
    } else if (r.comparativo === "atrasado") {
      const atraso = r.daysNeeded - r.daysToExam;
      statusHtml = `<div class="pace-status warn">🔴 No ritmo atual, você terminaria ${atraso} dia${atraso === 1 ? "" : "s"} depois da prova. Considere acelerar ou rever o plano.</div>`;
    } else {
      statusHtml = `<div class="pace-status neutral">Defina a data da prova na Visão Geral pra comparar com o prazo.</div>`;
    }
    container.innerHTML = `
    <div class="pace-block">
      <div class="pace-line">Nos últimos 14 dias você concluiu em média <strong>${ritmoTxt}</strong>.</div>
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining === 1 ? "" : "s"} — no ritmo atual, você termina em <strong>${r.daysNeeded} dia${r.daysNeeded === 1 ? "" : "s"}</strong> (${formatDatePt(r.finishDate)}).</div>
      ${statusHtml}
    </div>
  `;
  }
  function taxaAcertoGeral() {
    const simCounts = state.simulados.map((s) => simuladoEffectiveCounts(s));
    const totalResolvidas = state.questoes.reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0) + simCounts.reduce((sum3, c) => sum3 + c.total, 0);
    const totalCorretas = state.questoes.reduce((sum3, q) => sum3 + (Number(q.correct) || 0), 0) + simCounts.reduce((sum3, c) => sum3 + c.correct, 0);
    if (totalResolvidas <= 0) return 0;
    return Math.round(totalCorretas / totalResolvidas * 1e3) / 10;
  }
  function mediaSimulados() {
    if (state.simulados.length === 0) return 0;
    const soma = state.simulados.reduce((sum3, s) => sum3 + simuladoNota(s), 0);
    return Math.round(soma / state.simulados.length * 10) / 10;
  }
  function revisoesAtrasadas() {
    const today = todayISO();
    const isCurrent = (item) => isActiveStudyReference(entitySubjectId(item), item.topicId || item.topicRef || null);
    const doCalendario = state.calendar.filter((c) => c.date && c.date < today && c.status !== "Concluído" && isCurrent(c)).length;
    const daAgenda = state.reviewAgenda.filter((a) => a.date && a.date < today && a.status !== "Concluído" && isCurrent(a)).length;
    return doCalendario + daAgenda;
  }
  function taxaErroDisciplina(subjectId) {
    let correct = 0, total = 0;
    state.questoes.filter((q) => entitySubjectId(q) === subjectId).forEach((q) => {
      total += Number(q.resolved) || 0;
      correct += Number(q.correct) || 0;
    });
    state.simulados.forEach((sim) => {
      (sim.breakdown || []).filter((b) => entitySubjectId(b) === subjectId).forEach((b) => {
        total += Number(b.total) || 0;
        correct += Number(b.correct) || 0;
      });
    });
    if (total === 0) return 0;
    return Math.round((1 - correct / total) * 1e3) / 10;
  }
  function ultimaAtividadeDisciplina(subjectId) {
    let last = null;
    const bump = (d) => {
      if (d && (!last || d > last)) last = d;
    };
    state.topicHistory.filter((event) => event.subjectId === subjectId).forEach((event) => bump(eventLocalDate(event)));
    state.questoes.filter((q) => entitySubjectId(q) === subjectId).forEach((q) => bump(q.date));
    state.calendar.filter((c) => entitySubjectId(c) === subjectId && c.status === "Concluído").forEach((c) => bump(c.date));
    state.reviewAgenda.filter((a) => entitySubjectId(a) === subjectId && a.status === "Concluído").forEach((a) => bump(a.date));
    state.studySessions.filter((session) => entitySubjectId(session) === subjectId).forEach((session) => bump(session.date));
    return last;
  }
  function diasSemEstudarDisciplina(subjectId) {
    const last = ultimaAtividadeDisciplina(subjectId);
    if (!last) return 0;
    const d = diasParaRevisao(last);
    return d !== null ? Math.max(0, -d) : 21;
  }
  var PRIORITY_TIER_EMOJI = { "Alta": "🔴", "Média": "🟠", "Baixa": "🟡" };
  function proximidadeProvaScore() {
    if (!state.examDate) return 0;
    const dias = diasParaRevisao(state.examDate);
    if (dias === null) return 0;
    return Math.max(0, Math.min(100, 100 - dias));
  }
  function collectStudyCandidates() {
    const today = todayISO();
    const candidateMap = /* @__PURE__ */ new Map();
    const addCandidate = (key, candidate) => {
      const current = candidateMap.get(key);
      if (!current || candidate.diasAtrasado > current.diasAtrasado || candidate.tipo === "revisão" && current.tipo !== "revisão") candidateMap.set(key, candidate);
    };
    state.reviewAgenda.filter((review) => {
      const subjectId = entitySubjectId(review);
      const topicId = review.topicId || review.topicRef || null;
      return review.status !== "Concluído" && review.date && review.date <= today && isActiveStudyReference(subjectId, topicId);
    }).forEach((review) => {
      const subjectId = entitySubjectId(review);
      const topicId = review.topicId || review.topicRef || null;
      const diagnosis = topicId ? diagnoseTopic(subjectId, topicId) : null;
      addCandidate(topicId || "review:" + review.id, {
        id: "review-" + review.id,
        subjectId,
        topicId,
        subjectName: entitySubjectName(review),
        topicName: topicId ? getTopicName(topicId) : review.topic || review.tipo || "Revisão",
        tipo: "revisão",
        dificuldade: getTopicDifficulty(topicId),
        diasAtrasado: Math.max(0, -(diasParaRevisao(review.date) ?? 0)),
        erroQuestoes: diagnosis?.effectiveErrorRate ?? taxaErroDisciplina(subjectId),
        diasSemEstudar: diagnosis?.daysSinceStudy ?? diasSemEstudarDisciplina(subjectId),
        diagnosis
      });
    });
    activeTopics().filter((topic) => (topic.name || "").trim() !== "").forEach((topic) => {
      if (candidateMap.has(topic.id)) return;
      const diagnosis = diagnoseTopic(topic.subjectId, topic.id);
      addCandidate(topic.id, {
        subjectId: topic.subjectId,
        topicId: topic.id,
        subjectName: topic.subjectName,
        topicName: topic.name,
        tipo: topic.status === "Concluído" ? "manutenção" : topic.status === "Em andamento" ? "continuar" : "novo tópico",
        dificuldade: topic.difficulty || "Médio",
        diasAtrasado: 0,
        erroQuestoes: diagnosis?.effectiveErrorRate ?? taxaErroDisciplina(topic.subjectId),
        diasSemEstudar: diagnosis?.daysSinceStudy ?? diasSemEstudarDisciplina(topic.subjectId),
        diagnosis
      });
    });
    const candidates = [...candidateMap.values()];
    candidates.forEach((candidate) => {
      candidate.recommendedAction = candidate.diagnosis?.recommendation?.action || (candidate.tipo === "revisão" ? "Concluir a revisão programada" : "Estudar o tópico");
      candidate.studyType = candidate.diagnosis?.recommendation?.studyType || (candidate.tipo === "revisão" ? "review" : "study");
      candidate.estimatedMinutes = candidate.diagnosis?.recommendation?.estimatedMinutes || (candidate.tipo === "revisão" ? 25 : 35);
      candidate.recommendedQuestions = candidate.diagnosis?.recommendation?.questions || 0;
    });
    return candidates;
  }
  function computeStudyPriorities() {
    return recommendStudy(intelligenceCandidates(), { availableMinutes: Math.round(metaHoursToday() * 60) }).map((item) => ({ ...item, tier: item.score >= 70 ? "Alta" : item.score >= 40 ? "Média" : "Baixa" }));
  }
  function motivoPrioridade(priority) {
    if (priority.reasons?.length) return priority.reasons.join(" · ");
    if (priority.diasAtrasado > 0) return "Revisão atrasada (" + priority.diasAtrasado + "d)";
    const diagnosis = priority.diagnosis;
    if (diagnosis?.trend?.key === "down") return "Tendência em queda (" + diagnosis.trend.delta.toFixed(1) + " p.p.)";
    if (diagnosis?.performance?.resolved >= 10 && diagnosis.performance.accuracy !== null && diagnosis.performance.accuracy < state.metas.metaAprovacao) {
      return "Baixo desempenho no tópico (" + diagnosis.performance.accuracy + "% de acerto)";
    }
    if (diagnosis?.dominantError) return "Erro predominante: " + diagnosis.dominantError.meta.label;
    if (priority.dificuldade === "Difícil") return "Tópico difícil";
    if (priority.tipo === "continuar") return "Em andamento";
    if (priority.diasSemEstudar >= 7) return priority.diasSemEstudar + "d sem atividade no tópico";
    return priority.tipo === "revisão" ? "Revisão de hoje" : "Tópico novo";
  }
  var radarView = { subjectIds: [] };
  function subjectRadarModel(subject) {
    const topics = subject.topics.filter((topic) => !topic.archived), coverage = topics.length ? subjectProgress(subject) : null;
    const masteryValues = topics.map((topic) => topicMasteryIndex(subject.id, topic.id)).filter((item) => item.confidence > 0);
    const retentionValues = topics.map((topic) => topicRetentionScore(subject.id, topic.id)).filter((item) => item.available);
    const mastery = masteryValues.length ? masteryValues.reduce((sum3, item) => sum3 + item.score, 0) / masteryValues.length : null;
    const retention = retentionValues.length ? retentionValues.reduce((sum3, item) => sum3 + item.score, 0) / retentionValues.length : null;
    const last = ultimaAtividadeDisciplina(subject.id), distance = last ? diasParaRevisao(last) : null, daysSinceContact = distance === null ? null : Math.max(0, -distance);
    const cutoff = addDays(todayISO(), -27), activeDates = /* @__PURE__ */ new Set();
    state.studySessions.filter((item) => entitySubjectId(item) === subject.id && item.date >= cutoff).forEach((item) => activeDates.add(item.date));
    state.questoes.filter((item) => entitySubjectId(item) === subject.id && item.date >= cutoff).forEach((item) => activeDates.add(item.date));
    const result = calculateSubjectRadar({ coverage, mastery, retention, daysSinceContact, activeDays: activeDates.size || null });
    return { ...result, id: subject.id, name: subject.name };
  }
  function setRadarSubject(slot, value2) {
    const index = Math.max(0, Math.min(1, Number(slot) || 0));
    radarView.subjectIds[index] = value2 || "";
    if (value2) radarView.subjectIds = radarView.subjectIds.map((id, i) => i !== index && id === value2 ? "" : id);
    renderRadarDisciplinas();
  }
  function renderRadarDisciplinas() {
    const container = document.getElementById("radarChart");
    if (!container) return;
    const subjects = activeSubjects().filter((s) => s.topics.some((t) => !t.archived));
    if (!subjects.length) {
      container.innerHTML = `<div class="radar-empty">Cadastre uma disciplina com tópicos para ver o radar.</div>`;
      return;
    }
    if (!radarView.subjectIds[0] || !subjects.some((subject) => subject.id === radarView.subjectIds[0])) radarView.subjectIds[0] = subjects[0].id;
    radarView.subjectIds = radarView.subjectIds.slice(0, 2);
    const selected = radarView.subjectIds.map((id) => subjects.find((subject) => subject.id === id)).filter(Boolean).map(subjectRadarModel);
    const axisMeta = [["coverage", "Cobertura"], ["mastery", "Domínio"], ["retention", "Retenção"], ["frequency", "Frequência"], ["consistency", "Consistência"]];
    const N = axisMeta.length, W = 560, H = 430, cx = W / 2, cy = 190, maxR = 125;
    const angleFor = (i) => Math.PI * 2 * i / N - Math.PI / 2;
    const gridRings = [0.25, 0.5, 0.75, 1].map((frac) => {
      const pts = axisMeta.map((_, i) => {
        const a = angleFor(i);
        const r = maxR * frac;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ");
      return `<polygon class="radar-grid" points="${pts}"></polygon>`;
    }).join("");
    const axes = axisMeta.map((_, i) => {
      const a = angleFor(i);
      return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(a)}" y2="${cy + maxR * Math.sin(a)}"></line>`;
    }).join("");
    const labels = axisMeta.map(([, label], i) => {
      const a = angleFor(i);
      const labelR = maxR + 28;
      const x = cx + labelR * Math.cos(a);
      const y = cy + labelR * Math.sin(a);
      const anchor = Math.abs(Math.cos(a)) < 0.3 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
      return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle">${label}</text>`;
    }).join("");
    const series = selected.map((model, seriesIndex) => {
      const values = axisMeta.map(([key]) => model.axes[key]);
      const complete = values.every((value2) => value2 !== null);
      const points = values.map((value2, index) => {
        if (value2 === null) return "";
        const a = angleFor(index), r = maxR * (value2 / 100);
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).filter(Boolean);
      const shape = complete ? `<polygon class="radar-shape radar-series-${seriesIndex + 1}" points="${points.join(" ")}"></polygon>` : "";
      const dots = values.map((value2, index) => {
        if (value2 === null) return "";
        const a = angleFor(index), r = maxR * (value2 / 100);
        return `<circle class="radar-dot radar-series-${seriesIndex + 1}" cx="${cx + r * Math.cos(a)}" cy="${cy + r * Math.sin(a)}" r="4"><title>${escapeHtml(model.name)} · ${axisMeta[index][1]}: ${value2}/100</title></circle>`;
      }).join("");
      return shape + dots;
    }).join("");
    const options = (selectedId = "") => `<option value="">Nenhuma</option>` + subjects.map((subject) => `<option value="${escapeAttr(subject.id)}" ${subject.id === selectedId ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join("");
    container.innerHTML = `
    <div class="radar-toolbar"><label>Disciplina 1<select data-delegated-change="setRadarSubject(0,this.value)">${options(radarView.subjectIds[0])}</select></label><label>Comparar com<select data-delegated-change="setRadarSubject(1,this.value)">${options(radarView.subjectIds[1])}</select></label></div>
    <svg class="radar-svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:460px;height:auto;display:block;margin:0 auto;">
      ${gridRings}
      ${axes}
      ${series}
      ${labels}
    </svg>
    <div class="radar-analysis">${selected.map((model, index) => `<section><h4><span class="radar-key radar-key-${index + 1}"></span>${escapeHtml(model.name)}</h4><p>${escapeHtml(model.interpretation)}</p><small>${model.availableAxes} de 5 eixos · confiança ${model.confidenceLabel.toLowerCase()}</small><dl>${axisMeta.map(([key, label]) => `<div><dt>${label}</dt><dd>${model.axes[key] === null ? "Aguardando dados" : model.axes[key] + "/100"}</dd></div>`).join("")}</dl></section>`).join("")}</div>
  `;
  }
  function renderSimuladosPlanejados() {
    const ul = document.getElementById("hojeSimuladosPlanejados");
    if (!ul) return;
    const today = todayISO();
    const planejados = state.simulados.filter((s) => s.date >= today && (Number(s.correct) || 0) === 0 && (Number(s.total) || 0) === 0 && (!s.breakdown || s.breakdown.length === 0)).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (planejados.length === 0) {
      ul.innerHTML = `<li class="upcoming-empty">Nenhum simulado planejado. Registre um com data futura na aba Questões &amp; Simulados pra ele aparecer aqui.</li>`;
    } else {
      ul.innerHTML = planejados.map((s) => `
      <li>
        <span class="upcoming-date">${formatDatePt(s.date)}</span>
        <span style="flex:1;">${escapeHtml(s.nome || "Simulado sem nome")}</span>
        <span class="subject-progress-pill">${s.date === today ? "hoje" : "planejado"}</span>
      </li>
    `).join("");
    }
  }
  function formatHoras(decimalHoras) {
    const totalMin = Math.round(decimalHoras * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
  }
  function formatDuration(seconds) {
    const minutes = Math.floor((Number(seconds) || 0) / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours <= 0) return `${mins}min`;
    return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, "0")}`;
  }
  function totalStudySeconds(filterFn) {
    const fn = filterFn || (() => true);
    return state.studySessions.filter(fn).reduce((sum3, s) => sum3 + (Number(s.durationSeconds) || 0), 0);
  }
  function segundosEstudadosHoje() {
    return totalStudySeconds((s) => s.date === todayISO());
  }
  function studyTimeByTopic(topicId) {
    return totalStudySeconds((s) => s.topicId === topicId);
  }
  function questionsPerHour() {
    const sessions = state.studySessions.filter((s) => (Number(s.durationSeconds) || 0) >= 300 && (Number(s.questionsResolved) || 0) > 0);
    const seconds = sessions.reduce((sum3, s) => sum3 + (Number(s.durationSeconds) || 0), 0);
    const questions = sessions.reduce((sum3, s) => sum3 + (Number(s.questionsResolved) || 0), 0);
    return seconds > 0 ? Math.round(questions / (seconds / 3600)) : 0;
  }
  function studySecondsByDate(sessions = state.studySessions) {
    const map = {};
    sessions.forEach((s) => {
      if (!s.date) return;
      map[s.date] = (map[s.date] || 0) + (Number(s.durationSeconds) || 0);
    });
    return map;
  }
  function renderStudyHoursDashboard() {
    const container = document.getElementById("studyTimeStats");
    if (!container) return;
    const model = buildStudyTimeViewModel({ sessions: state.studySessions, today: todayISO(), weekStart: startOfWeek(todayISO()), monthStart: todayISO().slice(0, 7) + "-01", hoursForDate: metaHoursForDate, addDays });
    const { todaySeconds: today, weekSeconds: week, monthSeconds: month, totalSeconds: total, targetSeconds: metaSeconds, consistency, pace, dedication, todayGoalPct } = model;
    const remaining = Math.max(0, metaSeconds - today);
    const metaLabel = metaSeconds > 0 ? `${todayGoalPct}% · faltam ${formatDuration(remaining)}` : "meta não definida";
    container.innerHTML = `
    <div class="stat-cell" title="${escapeAttr(metaLabel)}"><div class="n">${formatDuration(today)}</div><div class="l">Estudo hoje</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(week)}</div><div class="l">Estudo na semana</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(month)}</div><div class="l">Estudo no mês</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(total)}</div><div class="l">Total acumulado</div></div>
    <div class="stat-cell"><div class="n">${metaSeconds > 0 ? todayGoalPct + "%" : "—"}</div><div class="l">Meta de hoje</div></div>
    <div class="stat-cell"><div class="n">${metaSeconds > 0 ? consistency.achieved + "/" + consistency.elapsed : "—"}</div><div class="l">Consistência semanal</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(pace.secondsPerDay)}</div><div class="l">Ritmo médio diário</div></div>
    <div class="stat-cell" title="${dedication.days ? `Últimos ${dedication.days} dias observados` : ""}"><div class="n">${dedication.score}/100</div><div class="l">Score de dedicação</div></div>
    <div class="stat-cell"><div class="n">${questionsPerHour()}</div><div class="l">Questões por hora</div></div>
  `;
    renderStudyHoursChart();
    renderSubjectHoursBars();
  }
  function renderStudyHoursChart() {
    const container = document.getElementById("studyHoursChart");
    if (!container) return;
    const byDate = studySecondsByDate();
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const date2 = addDays(todayISO(), -i);
      data.push({ date: date2, seconds: byDate[date2] || 0 });
    }
    const total = data.reduce((sum3, d) => sum3 + d.seconds, 0);
    if (total <= 0) {
      container.innerHTML = `<div class="progress-chart-empty">Registre sessões para visualizar a evolução das horas.</div>`;
      return;
    }
    const W = 640, H = 180, padL = 36, padR = 12, padT = 16, padB = 26;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const target = metaHoursToday() * 3600;
    const maxSeconds = Math.max(target, ...data.map((d) => d.seconds), 3600);
    const xFor = (i) => padL + i / (data.length - 1) * plotW;
    const yFor = (seconds) => padT + plotH - seconds / maxSeconds * plotH;
    const points = data.map((d, i) => `${xFor(i)},${yFor(d.seconds)}`).join(" ");
    const gridValues = [0, maxSeconds / 2, maxSeconds];
    const grid = gridValues.map((seconds) => `<line class="chart-grid" x1="${padL}" y1="${yFor(seconds)}" x2="${W - padR}" y2="${yFor(seconds)}"></line><text x="2" y="${yFor(seconds) + 3}">${(seconds / 3600).toFixed(seconds % 3600 ? 1 : 0)}h</text>`).join("");
    const labels = [0, 4, 9, 13].map((i) => `<text x="${xFor(i)}" y="${H - 5}" text-anchor="middle">${formatDatePt(data[i].date).slice(0, 5)}</text>`).join("");
    const dots = data.map((d, i) => `<circle class="chart-dot" cx="${xFor(i)}" cy="${yFor(d.seconds)}" r="3"><title>${formatDatePt(d.date)} · ${formatDuration(d.seconds)}</title></circle>`).join("");
    const targetLine = target > 0 ? `<line x1="${padL}" y1="${yFor(target)}" x2="${W - padR}" y2="${yFor(target)}" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="5 4"><title>Meta diária: ${formatDuration(target)}</title></line>` : "";
    container.innerHTML = `<svg class="progress-chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">${grid}${targetLine}<polyline class="chart-line" points="${points}"></polyline>${dots}${labels}</svg>`;
  }
  function renderSubjectHoursBars() {
    const container = document.getElementById("subjectHoursBars");
    if (!container) return;
    const map = {};
    state.studySessions.forEach((session) => {
      const key = entitySubjectId(session) || "__none";
      map[key] = (map[key] || 0) + (Number(session.durationSeconds) || 0);
    });
    const rows = Object.entries(map).filter(([, seconds]) => seconds > 0).sort((a, b) => b[1] - a[1]);
    if (rows.length === 0) {
      container.innerHTML = `<div class="upcoming-empty">Nenhuma sessão registrada.</div>`;
      return;
    }
    const total = rows.reduce((sum3, row) => sum3 + row[1], 0);
    container.innerHTML = rows.map(([subjectId, seconds]) => {
      const name = subjectId === "__none" ? "Sem disciplina" : getSubjectName(subjectId);
      const pct = total > 0 ? Math.round(seconds / total * 100) : 0;
      return `<div class="bar-row"><div class="bar-label" title="${escapeAttr(name)}">${escapeHtml(name)}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-pct" title="${pct}% do tempo total">${formatDuration(seconds)}</div></div>`;
    }).join("");
  }
  var SESSION_TYPES = { study: "Estudo teórico", review: "Revisão", questions: "Questões", simulation: "Simulado" };
  var sessionHistoryFilters = { period: "30", subjectId: "", type: "", date: "" };
  var expandedSessionDays = /* @__PURE__ */ new Set();
  var expandedSessionDetails = /* @__PURE__ */ new Set();
  var sessionHistoryExpansionInitialized = false;
  function sessionTypeLabel(type) {
    return SESSION_TYPES[type] || SESSION_TYPES.study;
  }
  function sessionTypeOptions(selected) {
    return Object.entries(SESSION_TYPES).map(([value2, label]) => `<option value="${value2}" ${value2 === selected ? "selected" : ""}>${label}</option>`).join("");
  }
  function updateSessionHistoryFilter(field, value2) {
    sessionHistoryFilters[field] = value2;
    if (field === "period") sessionHistoryFilters.date = "";
    listViewState.sessionDaysVisible = LIST_VIEW_STEPS.sessionDays;
    expandedSessionDays.clear();
    sessionHistoryExpansionInitialized = false;
    renderStudySessionsHistory();
    renderHeatmap();
  }
  function clearSessionHistoryFilters() {
    sessionHistoryFilters = { period: "30", subjectId: "", type: "", date: "" };
    listViewState.sessionDaysVisible = LIST_VIEW_STEPS.sessionDays;
    expandedSessionDays.clear();
    sessionHistoryExpansionInitialized = false;
    renderStudySessionsHistory();
    renderHeatmap();
  }
  function selectSessionHistoryDate(date2) {
    sessionHistoryFilters.date = date2;
    sessionHistoryFilters.period = "all";
    listViewState.sessionDaysVisible = LIST_VIEW_STEPS.sessionDays;
    expandedSessionDays = /* @__PURE__ */ new Set([date2]);
    sessionHistoryExpansionInitialized = true;
    renderStudySessionsHistory();
    renderHeatmap();
    document.getElementById("studySessionsCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function toggleSessionDay(date2) {
    sessionHistoryExpansionInitialized = true;
    if (expandedSessionDays.has(date2)) expandedSessionDays.delete(date2);
    else expandedSessionDays.add(date2);
    renderStudySessionsHistory();
  }
  function toggleSessionDetails(id) {
    if (expandedSessionDetails.has(id)) expandedSessionDetails.delete(id);
    else expandedSessionDetails = /* @__PURE__ */ new Set([id]);
    renderStudySessionsHistory();
  }
  function renderSessionHistoryFilterControls() {
    const period = document.getElementById("studySessionsPeriod");
    const subject = document.getElementById("studySessionsSubjectFilter");
    const type = document.getElementById("studySessionsTypeFilter");
    if (!period || !subject || !type) return;
    period.value = sessionHistoryFilters.period;
    subject.innerHTML = `<option value="">Todas as disciplinas</option>` + state.subjects.map((s) => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join("");
    subject.value = sessionHistoryFilters.subjectId;
    type.value = sessionHistoryFilters.type;
    const active = countActiveFilters(sessionHistoryFilters, { period: "30", subjectId: "", type: "", date: "" });
    const toggle = document.getElementById("studySessionsFilterToggle");
    if (toggle) toggle.textContent = filterPanelLabel(active) + (toggle.getAttribute("aria-expanded") === "true" ? " ▴" : " ▾");
  }
  function filteredStudySessions() {
    return filterStudySessions(state.studySessions, sessionHistoryFilters, { today: todayISO(), addDays, subjectIdOf: entitySubjectId });
  }
  function sessionStartTime(session) {
    if (!session.startedAt) return "—";
    const date2 = new Date(session.startedAt);
    return Number.isNaN(date2.getTime()) ? "—" : date2.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  function syncQuestionFromStudySession(session) {
    return sessionService.edit(session.id, session);
  }
  function deleteStudySession(id) {
    showConfirm("Excluir esta sessão e as questões vinculadas a ela?", () => {
      sessionService.remove(id);
      persistAndRender();
      showToast("Sessão excluída.");
    });
  }
  function sessionViewModel(session) {
    const resolved = Number(session.questionsResolved) || 0, correct = Number(session.correctAnswers) || 0;
    return { date: session.date ? formatDatePt(session.date) : "Sem data", time: sessionStartTime(session), subject: getSubjectName(entitySubjectId(session)) || "Sem disciplina", topic: session.topicId ? getTopicName(session.topicId) : "Sem tópico", type: sessionTypeLabel(session.type || "study"), duration: formatDuration(Number(session.durationSeconds) || 0), questions: resolved, correct, accuracy: resolved ? Math.round(correct / resolved * 100) : null, notes: session.notes || "" };
  }
  function editStudySession(id) {
    const session = state.studySessions.find((s) => s.id === id);
    if (!session) return;
    historyEditState.sessionId = id;
    historyEditDraft.session = cloneRecord(session);
    renderStudySessionsHistory();
  }
  function cancelStudySessionEdit() {
    historyEditState.sessionId = null;
    historyEditDraft.session = null;
    renderStudySessionsHistory();
  }
  function updateStudySessionDraft(field, value2) {
    const d = historyEditDraft.session;
    if (!d) return;
    if (field === "durationMinutes") d.durationSeconds = Math.max(0, Number(value2) || 0) * 60;
    else if (field === "questionsResolved" || field === "correctAnswers") d[field] = Math.max(0, Math.floor(Number(value2) || 0));
    else d[field] = value2;
    if (field === "subjectId") {
      const selected = d.topicId ? getTopicById(d.topicId) : null;
      if (selected?.subject.id !== d.subjectId) d.topicId = null;
      renderStudySessionsHistory();
    }
  }
  function saveStudySessionEdit() {
    const d = historyEditDraft.session;
    if (!d) return;
    d.durationSeconds = Math.max(0, Number(d.durationSeconds) || 0);
    d.questionsResolved = Math.max(0, Math.floor(Number(d.questionsResolved) || 0));
    d.correctAnswers = Math.max(0, Math.min(Math.floor(Number(d.correctAnswers) || 0), d.questionsResolved));
    const index = state.studySessions.findIndex((s) => s.id === d.id);
    if (index < 0) return cancelStudySessionEdit();
    sessionService.edit(d.id, d);
    historyEditState.sessionId = null;
    historyEditDraft.session = null;
    persistAndRender();
    showToast("Sessão atualizada.");
  }
  function renderStudySessionReadRow(session) {
    const vm = sessionViewModel(session);
    const detailsId = `session-details-${session.id}`, expanded = expandedSessionDetails.has(session.id);
    if (isMobileHistoryLayout()) return `<tr class="mobile-history-row" data-id="${session.id}"><td colspan="5"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)} · ${escapeHtml(vm.time)}</div><div class="mobile-card-title">${escapeHtml(vm.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(vm.topic)}</div></div><button class="btn ghost small" data-delegated-click="editStudySession('${session.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${escapeHtml(vm.type)}</span><span>⏱ ${escapeHtml(vm.duration)}</span>${vm.questions ? `<span>${pluralize(vm.questions, "questão", "questões")}</span><strong>${vm.accuracy}%</strong>` : ""}${vm.notes ? `<span title="${escapeAttr(vm.notes)}">📝 ${escapeHtml(vm.notes)}</span>` : ""}</div></article></td></tr>`;
    return `<tr class="history-read-row history-desktop-row" data-id="${session.id}"><td><div class="row-primary">${escapeHtml(vm.date)}</div><div class="row-secondary">${escapeHtml(vm.time)}</div></td><td class="number-cell">${escapeHtml(vm.duration)}</td><td><div class="row-primary">${escapeHtml(vm.subject)}</div><div class="row-secondary">${escapeHtml(vm.topic)}</div></td><td><div class="row-primary">${vm.questions ? pluralize(vm.questions, "questão", "questões") : "Sem questões"}</div><div class="row-secondary">${vm.accuracy === null ? "—" : vm.accuracy + "% de acerto"}</div></td><td class="session-actions"><button class="btn ghost small" aria-expanded="${expanded}" aria-controls="${detailsId}" data-delegated-click="toggleSessionDetails('${session.id}')">Detalhes</button><button class="btn ghost small" data-delegated-click="editStudySession('${session.id}')">Editar</button></td></tr>${expanded ? `<tr class="session-details-row" id="${detailsId}"><td colspan="5"><dl><div><dt>Tipo</dt><dd>${escapeHtml(vm.type)}</dd></div><div><dt>Observação</dt><dd>${escapeHtml(vm.notes || "Sem observação")}</dd></div><div><dt>Atividade do plano</dt><dd>${session.planItemId ? "Vinculada ao plano diário" : "Sem vínculo"}</dd></div></dl></td></tr>` : ""}`;
  }
  function renderStudySessionEditRow(session) {
    const d = historyEditDraft.session;
    const subjectId = entitySubjectId(d);
    const subject = getSubjectById(subjectId);
    const topics = subject ? subject.topics : [];
    return `<tr class="row-editing" data-id="${session.id}"><td colspan="10"><div class="inline-edit-form"><label>Data<input type="date" value="${d.date || ""}" data-delegated-change="updateStudySessionDraft('date',this.value)"></label><label>Duração (min)<input type="number" min="0" value="${Math.floor((Number(d.durationSeconds) || 0) / 60)}" data-delegated-input="updateStudySessionDraft('durationMinutes',this.value)"></label><label>Tipo<select data-delegated-change="updateStudySessionDraft('type',this.value)">${sessionTypeOptions(d.type || "study")}</select></label><label>Disciplina<select data-delegated-change="updateStudySessionDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectsForSelection(subjectId).map((s) => `<option value="${escapeAttr(s.id)}" ${s.id === subjectId ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}</select></label><label>Tópico<select data-delegated-change="updateStudySessionDraft('topicId',this.value||null)"><option value="">Sem tópico</option>${topics.map((t) => `<option value="${escapeAttr(t.id)}" ${t.id === d.topicId ? "selected" : ""}>${escapeHtml(t.name)}</option>`).join("")}</select></label><label>Questões<input type="number" min="0" value="${Number(d.questionsResolved) || 0}" data-delegated-input="updateStudySessionDraft('questionsResolved',this.value)"></label><label>Acertos<input type="number" min="0" value="${Number(d.correctAnswers) || 0}" data-delegated-input="updateStudySessionDraft('correctAnswers',this.value)"></label><label class="edit-notes-field">Observação<textarea data-delegated-input="updateStudySessionDraft('notes',this.value)">${escapeHtml(d.notes || "")}</textarea></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelStudySessionEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveStudySessionEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteStudySession('${session.id}')">Excluir</button></div></div></td></tr>`;
  }
  function renderStudySessionsHistory() {
    const body = document.getElementById("studySessionsBody");
    const count = document.getElementById("studySessionsCount");
    const summary = document.getElementById("studySessionsFilterSummary");
    const tableWrap = document.getElementById("studySessionsTableWrap");
    const emptyState = document.getElementById("studySessionsEmpty");
    if (!body || !count) return;
    renderSessionHistoryFilterControls();
    const rows = filteredStudySessions();
    count.textContent = rows.length === state.studySessions.length ? `${rows.length} sess${rows.length === 1 ? "ão" : "ões"}` : `${rows.length} de ${state.studySessions.length}`;
    if (summary) {
      summary.textContent = sessionHistoryFilters.date ? `Dia selecionado: ${formatDatePt(sessionHistoryFilters.date)}` : `${pluralize(rows.length, "sessão", "sessões")} no filtro atual`;
    }
    if (rows.length === 0) {
      body.innerHTML = "";
      if (tableWrap) tableWrap.hidden = true;
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (tableWrap) tableWrap.hidden = false;
    if (emptyState) emptyState.hidden = true;
    const groupedDays = groupStudySessionsByDate(rows);
    const visibleGroups = groupedDays.slice(0, listViewState.sessionDaysVisible);
    if (!sessionHistoryExpansionInitialized && visibleGroups.length) {
      expandedSessionDays.add(visibleGroups[0][0]);
      sessionHistoryExpansionInitialized = true;
    }
    const html = [];
    visibleGroups.forEach(([date2, sessions]) => {
      const seconds = sessions.reduce((sum3, s) => sum3 + (Number(s.durationSeconds) || 0), 0);
      const questions = sessions.reduce((sum3, s) => sum3 + (Number(s.questionsResolved) || 0), 0);
      const correct = sessions.reduce((sum3, s) => sum3 + (Number(s.correctAnswers) || 0), 0);
      const accuracy2 = questions > 0 ? ` · ${Math.round(correct / questions * 100)}% de acerto` : "";
      const expanded = expandedSessionDays.has(date2);
      html.push(`<tr class="session-day-row"><td colspan="5"><button type="button" class="session-day-toggle" aria-expanded="${expanded}" data-delegated-click="toggleSessionDay('${escapeAttr(date2)}')"><span>${date2 === "Sem data" ? date2 : formatDatePt(date2)} · ${pluralize(sessions.length, "sessão", "sessões")} · ${formatDuration(seconds)} · ${pluralize(questions, "questão", "questões")}${accuracy2}</span><span class="session-day-chevron" aria-hidden="true">›</span></button></td></tr>`);
      if (!expanded) return;
      sessions.forEach((session) => html.push(historyEditState.sessionId === session.id ? renderStudySessionEditRow(session) : renderStudySessionReadRow(session)));
    });
    html.push(renderListViewFooter(
      groupedDays.length,
      listViewState.sessionDaysVisible,
      LIST_VIEW_STEPS.sessionDays,
      "changeListLimit('sessionDays',LIST_VIEW_STEPS.sessionDays,renderStudySessionsHistory)",
      "changeListLimit('sessionDays',-listViewState.sessionDaysVisible,renderStudySessionsHistory)",
      10,
      "dias"
    ));
    body.innerHTML = html.join("");
  }
  function computeAlertasInteligentes() {
    const alertas = [];
    const today = todayISO();
    const atrasadas = revisoesAtrasadas();
    if (atrasadas > 0) {
      alertas.push({ id: "reviews-overdue", severity: "high", nivel: "alta", icon: "🔴", texto: `${pluralize(atrasadas, "revisão", "revisões")} atrasada${atrasadas === 1 ? "" : "s"}` });
    }
    computeSubjectPerformance().filter((p) => isActiveSubjectId(p.subjectId) && p.acerto < 65 && p.total >= 5).forEach((p) => {
      alertas.push({ id: `accuracy-${p.subjectId}`, subjectId: p.subjectId, severity: "high", nivel: "alta", icon: "🔴", texto: `${p.subject} abaixo de 65% de acerto (${p.acerto}%)` });
    });
    activeSubjects().forEach((subject) => {
      const trend = calculateWeightedTrend(getSubjectWeeklyTrend(subject.id));
      if (trend.key === "down") {
        const high = Math.abs(trend.delta) >= 8;
        alertas.push({ id: `trend-${subject.id}`, subjectId: subject.id, severity: high ? "high" : "medium", nivel: high ? "alta" : "media", icon: "↘", texto: `${subject.name} caiu ${Math.abs(trend.delta)} pontos nas últimas quatro semanas (${trend.previousAccuracy}% para ${trend.recentAccuracy}%)` });
      }
    });
    const diaSemana = (/* @__PURE__ */ new Date(today + "T00:00:00")).getDay();
    const diasDecorridos = diaSemana === 0 ? 7 : diaSemana;
    const expectedFrac = diasDecorridos / 7;
    const inicioSemana = startOfWeek(today);
    const atingidoSemanal = uniqueTopicsCompletedBetween(inicioSemana, addDays(inicioSemana, 6));
    const semanalFrac = state.metas.semanal > 0 ? atingidoSemanal / state.metas.semanal : 1;
    if (expectedFrac >= 0.5 && semanalFrac < expectedFrac - 0.15) {
      const gap = Math.round((expectedFrac - semanalFrac) * 100);
      alertas.push({ id: "weekly-goal-risk", severity: "medium", nivel: "media", icon: "🟠", texto: `Meta semanal ${gap}% abaixo do esperado pro dia da semana` });
    }
    const difSemRevisao = activeTopics().filter(
      (t) => t.difficulty === "Difícil" && t.status !== "Concluído" && !state.reviewAgenda.some((a) => (a.topicId || a.topicRef) === t.id && a.status !== "Concluído")
    ).length;
    if (difSemRevisao > 0) {
      alertas.push({ id: "hard-topics-no-review", severity: "low", nivel: "baixa", icon: "🟡", texto: `${pluralize(difSemRevisao, "tópico")} ${difSemRevisao === 1 ? "difícil" : "difíceis"} sem revisão agendada` });
    }
    const ritmo = computeRitmo();
    if (ritmo.status === "ok" && ritmo.comparativo === "no-prazo") {
      const folga = ritmo.daysToExam - ritmo.daysNeeded;
      alertas.push({ id: "pace-ahead", severity: "ok", nivel: "ok", icon: "🟢", texto: `Ritmo atual permite terminar ${folga} dia${folga === 1 ? "" : "s"} antes da prova` });
    } else if (ritmo.status === "ok" && ritmo.comparativo === "atrasado") {
      const atraso = ritmo.daysNeeded - ritmo.daysToExam;
      alertas.push({ id: "pace-behind", severity: "high", nivel: "alta", icon: "🔴", texto: `No ritmo atual você terminaria ${atraso} dia${atraso === 1 ? "" : "s"} depois da prova` });
    }
    return alertas;
  }
  function renderAlertasInteligentes() {
    const container = document.getElementById("alertasInteligentesList");
    if (!container) return;
    const reconciliation = reconcileAlerts(computeAlertasInteligentes(), state.alertStates, todayISO(), addDays);
    if (JSON.stringify(reconciliation.states) !== JSON.stringify(state.alertStates)) {
      state.alertStates = reconciliation.states;
      scheduleSave();
    }
    const alertas = reconciliation.visible;
    if (alertas.length === 0) {
      container.innerHTML = `<div class="upcoming-empty">Nenhum alerta no momento — tudo sob controle. 🎉</div>`;
      return;
    }
    container.innerHTML = alertas.map((a) => `
    <div class="alerta-item alerta-${a.nivel}">
      <span class="alerta-icon">${a.icon}</span>
      <span>${escapeHtml(a.texto)}</span>${a.severity !== "ok" ? `<button class="btn ghost small alert-dismiss" data-delegated-click="dismissIntelligentAlert('${escapeAttr(a.id)}')">Dispensar 7 dias</button>` : ""}
    </div>
  `).join("");
  }
  function dismissIntelligentAlert(id) {
    state.alertStates = dismissAlert(state.alertStates, id, todayISO(), addDays, 7);
    scheduleSave();
    renderAlertasInteligentes();
  }
  function renderExecutiveSummary() {
    const container = document.getElementById("executiveSummary");
    if (!container) return;
    const metrics = computeApprovalMetrics(), readiness = readinessResult(metrics), pace = computeRitmo(), priorities = computeStudyPriorities();
    const topPriority = priorities[0] ? { ...priorities[0], reason: motivoPrioridade(priorities[0]) } : null;
    const risks = computeAlertasInteligentes().filter((alert) => alert.nivel !== "ok");
    const configuredTopics = activeTopics().filter((topic) => topic.examImportance !== null && topic.estimatedStudyMinutes !== null);
    const opportunityCount = configuredTopics.filter((topic) => priorities.some((priority) => priority.topicId === topic.id)).length;
    const weekStart = startOfWeek(todayISO()), weeklyGoal = { achieved: uniqueTopicsCompletedBetween(weekStart, addDays(weekStart, 6)), target: state.metas.semanal };
    const summary = buildExecutiveSummary({ readiness, daysToExam: state.examDate ? diasParaRevisao(state.examDate) ?? null : null, pace, topPriority, riskCount: risks.length, weeklyGoal, opportunityCount });
    container.innerHTML = `<div class="executive-kpis">${summary.cards.map((card) => `<div class="executive-kpi"><strong>${escapeHtml(card.value)}</strong><span>${escapeHtml(card.label)}</span><small>${escapeHtml(card.detail)}</small></div>`).join("")}</div>
    <div class="executive-decision-grid"><section><h4>Prioridade principal</h4>${summary.primaryAction ? `<strong>${escapeHtml(summary.primaryAction.title)}</strong><p>${escapeHtml(summary.primaryAction.subject || "")} · ${escapeHtml(summary.primaryAction.topic || "")} · ${formatPlanMinutes(summary.primaryAction.duration)}</p><small>${escapeHtml(summary.primaryAction.reason)}</small>` : "<p>Ainda não há uma prioridade confiável. Cadastre tópicos ou revisões pendentes.</p>"}</section>
    <section><h4>Riscos e oportunidades</h4><p><strong>${summary.riskCount}</strong> risco${summary.riskCount === 1 ? "" : "s"} com evidência atual.</p><small>${escapeHtml(summary.opportunityMessage)}</small></section></div>`;
  }
  var dismissedRecommendationIds = /* @__PURE__ */ new Set();
  var currentStudyRecommendations = [];
  function intelligenceCandidates() {
    const priorities = collectStudyCandidates(), topics = allTopics();
    const retentions = Object.fromEntries(topics.map((topic) => [topic.id, topicRetentionScore(topic.subjectId, topic.id)]));
    const reviewHealths = Object.fromEntries(topics.map((topic) => [topic.id, topicReviewHealthScore(topic, topicMasteryIndex(topic.subjectId, topic.id), retentions[topic.id])]));
    return buildStudyCandidates({
      priorities,
      topics,
      retentions,
      reviewHealths,
      blueprint: state.examBlueprint.subjects,
      sessions: state.studySessions,
      today: todayISO(),
      examProximity: state.examDate ? proximidadeProvaScore() : null
    });
  }
  function renderDiagnosisCenter() {
    const container = document.getElementById("diagnosisCenter");
    if (!container) return;
    const result = generateDiagnosis(intelligenceCandidates()), model = buildDiagnosisViewModel(result);
    if (model.state === "insufficient") {
      container.innerHTML = '<div class="upcoming-empty">Ainda não há dados suficientes. Cadastre tópicos e registre atividades para gerar o diagnóstico.</div>';
      return;
    }
    const list = (items, empty, formatter) => items.length ? items.slice(0, 4).map(formatter).join("") : `<p class="diagnosis-empty">${empty}</p>`;
    const section = (key) => model.sections.find((item) => item.key === key)?.items || [];
    container.innerHTML = `<div class="diagnosis-summary">
    <section><h4>Gargalos</h4>${list(section("bottlenecks"), "Nenhum gargalo relevante agora.", (item) => `<article><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><span>Risco ${item.risk?.value ?? item.severity}/100 · dados disponíveis ${Math.round((item.risk?.evidence?.completeness || 0) * 100)}% · evidência ${(item.risk?.evidence?.evidenceLabel || "Não avaliada").toLowerCase()} · ${escapeHtml(item.reason)}${item.risk?.missingFactors?.length ? " · " + item.risk.missingFactors.length + " fatores ausentes" : ""}</span></article>`)}</section>
    <section><h4>Oportunidades</h4>${list(section("opportunities"), "Configure pesos e esforço para revelar oportunidades.", (item) => `<article><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><span>Retorno estimado ${item.opportunityScore}/100 · dados disponíveis ${Math.round(item.confidence * 100)}% · ${formatPlanMinutes(item.estimatedMinutes)}${item.missingFactors.includes("examImpact") ? " · peso da prova ausente" : ""}</span></article>`)}</section>
    <section><h4>Revisões críticas e risco</h4>${list(section("risk"), "Nenhuma revisão crítica identificada.", (item) => `<article><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><span>${item.reviewUrgency > 0 ? "Urgência " + Math.round(item.reviewUrgency) + "/100" : item.daysSinceContact + " dias sem contato"}</span></article>`)}</section>
    <section><h4>Foco da semana</h4>${list(section("focus"), "Sem distribuição confiável.", (item) => `<article><strong>${escapeHtml(item.subjectName)}</strong><span>${item.percentage}% do foco recomendado</span></article>`)}</section>
  </div><p class="confidence-note">Diagnóstico estimado a partir dos registros disponíveis; não representa certeza de resultado.</p>`;
  }
  function renderRecommendationImpact(model) {
    if (!model.available) return "";
    const metrics = model.metrics.map((metric) => `<div><span>${escapeHtml(metric.label)}</span><strong>${metric.before} → ${metric.after}</strong><small class="${metric.delta >= 0 ? "positive" : "negative"}">${metric.delta >= 0 ? "+" : ""}${metric.delta} ${metric.key === "risk" ? "de melhora" : "p.p."}</small></div>`).join("");
    const reasons = model.reasons.length ? `<small class="recommendation-impact-reasons">${escapeHtml(model.reasons.join(" · "))}</small>` : "";
    return `<section class="recommendation-impact ${escapeAttr(model.state)}"><header><span>Resultado da recomendação</span><strong>${escapeHtml(model.title)}</strong><small>Confiança ${escapeHtml((model.confidenceLabel || "não calculada").toLowerCase())} · ${model.questionVolume} questões</small></header><div class="recommendation-impact-metrics">${metrics || "<p>Indicadores comparáveis ainda indisponíveis.</p>"}</div>${reasons}</section>`;
  }
  function renderStudyRecommendation() {
    const container = document.getElementById("studyRecommendation");
    if (!container) return;
    const availableMinutes = Math.max(0, Math.round(metaHoursToday() * 60));
    const candidates = intelligenceCandidates();
    const previous = new Map(currentStudyRecommendations.map((item) => [item.id, item]));
    currentStudyRecommendations = recommendStudy(candidates, { availableMinutes, excludedIds: [...dismissedRecommendationIds] }).map((item) => {
      const old = previous.get(item.id);
      return old && old.score === item.score && old.estimatedMinutes === item.estimatedMinutes && JSON.stringify(old.factors) === JSON.stringify(item.factors) ? { ...item, recommendationId: old.recommendationId, shownAt: old.shownAt, algorithmVersion: PRIORITY_ALGORITHM_VERSION } : createRecommendationPresentation(item, { id: uid("recommendation"), shownAt: nowISO2(), algorithmVersion: PRIORITY_ALGORITHM_VERSION });
    });
    const visible = currentStudyRecommendations.slice(0, 3);
    const pending = state.recommendationFeedback.find((feedback) => feedback.completed && feedback.useful === null), summary = summarizeRecommendationFeedback(state.recommendationFeedback), impact = renderRecommendationImpact(buildRecommendationOutcomeViewModel(state.recommendationFeedback));
    const outcome = impact + (pending ? `<div class="recommendation-outcome"><strong>Esta recomendação ajudou?</strong><button class="btn small" data-delegated-click="rateRecommendationOutcome('${escapeAttr(pending.recommendationId)}',true)">Sim</button><button class="btn ghost small" data-delegated-click="rateRecommendationOutcome('${escapeAttr(pending.recommendationId)}',false)">Não</button></div>` : "");
    const history = summary.shown ? `<small class="recommendation-history">Histórico: ${summary.acceptanceRate}% aceitas · ${summary.completionRate ?? 0}% concluídas${summary.rated ? ` · ${summary.usefulnessRate}% úteis` : ""}</small>` : "";
    const visibleIds = new Set(visible.map((item) => item.id));
    const excluded = candidates.filter((item) => !visibleIds.has(item.id)).map((item) => {
      if (item.blockedPrerequisites?.length) return { ...item, stateIcon: "🔒", stateText: "Aguarda " + item.blockedPrerequisites.map((id) => getTopicName(id) || id).join(", ") };
      if (item.completed) return { ...item, stateIcon: "✓", stateText: "Atividade já realizada hoje" };
      if (item.covered && !needsMaintenance(item)) return { ...item, stateIcon: "✓", stateText: "Concluído e consolidado" };
      if (item.remainingMinutes === null && !item.covered) return { ...item, stateIcon: "○", stateText: "Carga de estudo ainda não configurada" };
      if (dismissedRecommendationIds.has(item.id)) return { ...item, stateIcon: "○", stateText: "Ocultado nesta sessão" };
      return { ...item, stateIcon: item.examImpact != null && item.examImpact < 30 ? "○" : "★", stateText: item.examImpact != null && item.examImpact < 30 ? "Baixa relevância configurada para a prova" : "Prioridade inferior às três recomendações atuais" };
    }).filter(Boolean).slice(0, 6);
    const excludedHtml = excluded.length ? `<details class="recommendation-exclusions"><summary>Por que outros tópicos não aparecem?</summary>${excluded.map((item) => `<div><span>${item.stateIcon}</span><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><small>${escapeHtml(item.stateText)}</small></div>`).join("")}</details>` : "";
    if (!visible.length) {
      container.innerHTML = `${outcome}<div class="upcoming-empty">${availableMinutes < 15 ? "Defina pelo menos 15 minutos na meta de hoje." : "Nenhuma atividade está elegível neste momento."}</div>${excludedHtml}${history}`;
      return;
    }
    const cards = visible.map((item, index) => {
      const model = buildPriorityViewModel(item, index + 1);
      const contributionRows = model.contributionRows.map((row) => `<div><span>${escapeHtml(row.label)}</span><span class="contribution-track"><i style="width:${Math.min(100, row.value * 4)}%"></i></span><strong>+${row.value}</strong></div>`).join("");
      const stateIcon = { review: "↻", limited: "⚠", high: "★", calculated: "○", blocked: "🔒" }[model.state] || "○";
      return `<article class="study-recommendation ${index === 0 ? "is-primary" : ""}"><div class="priority-score-gauge" style="--priority:${model.score}"><strong>${model.score}</strong><span>/100</span></div><div class="recommendation-content"><span class="recommendation-rank">#${model.position} na fila de estudo</span><h4>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</h4><strong>${escapeHtml(item.action || "Estudar agora")}</strong><p>${formatPlanMinutes(item.estimatedMinutes)}${item.recommendedQuestions ? ` · ${pluralize(item.recommendedQuestions, "questão", "questões")}` : ""} · ${stateIcon} ${escapeHtml(model.stateLabel)}</p><div class="priority-reasons">${model.reasons.slice(0, 4).map((reason) => `<span>+ ${escapeHtml(reason)}</span>`).join("")}</div><details class="recommendation-explanation"><summary>Ver composição da prioridade</summary><p>Dados disponíveis: ${model.completeness}% · força da evidência: ${escapeHtml(model.evidenceLabel.toLowerCase())}. Algoritmo v${item.algorithmVersion}.</p><div class="recommendation-contributions">${contributionRows}<div class="recommendation-total"><span>Prioridade final</span><strong>${model.score}/100</strong></div></div>${item.missingFactors.length ? `<small>${item.missingFactors.length} fator${item.missingFactors.length === 1 ? "" : "es"} sem dados; os pesos disponíveis foram redistribuídos.</small>` : ""}</details></div><div class="recommendation-actions"><button class="btn" data-delegated-click="startStudyRecommendation('${escapeAttr(item.id)}')">▶ Iniciar estudo</button><button class="btn ghost" data-delegated-click="dismissStudyRecommendation('${escapeAttr(item.id)}')">Trocar</button><button class="btn ghost" data-delegated-click="markRecommendationNotUseful('${escapeAttr(item.id)}')">Não foi útil</button></div></article>`;
    }).join("");
    container.innerHTML = `${outcome}<div class="recommendation-capacity"><strong>${formatPlanMinutes(availableMinutes)}</strong><span> disponíveis hoje · mostrando ${visible.length} ${visible.length === 1 ? "prioridade elegível" : "prioridades elegíveis"}</span></div><div class="study-recommendation-list">${cards}</div>${excludedHtml}${history}`;
  }
  function recommendationBaseline(recommendation) {
    const topicId = recommendation.topicId, performance = getTopicPerformance(topicId), found = getTopicById(topicId), last = found?.topic?.lastReviewedAt || found?.topic?.lastCompletedAt || null;
    return captureRecommendationBaseline({
      mastery: recommendation.mastery,
      accuracy: performance.accuracy,
      questionVolume: performance.resolved,
      retention: recommendation.retention,
      reviewHealth: recommendation.reviewHealth?.value,
      risk: recommendation.risk?.value,
      trend: recommendation.diagnosis?.trend || null,
      evidence: recommendation.evidence || null,
      daysSinceContact: last ? Math.max(0, -(diasParaRevisao(localDateFromTimestamp2(last)) ?? 0)) : null,
      measuredAt: nowISO2()
    });
  }
  function recordRecommendationFeedback(recommendation, { accepted, reasonSkipped = null } = {}) {
    const baseline = recommendationBaseline(recommendation), createdAt = nowISO2();
    return recordRecommendationDecision(state.recommendationFeedback, recommendation, { accepted, reasonSkipped, baseline, snapshot: captureRecommendationSnapshot(recommendation, { baseline, createdAt }), now: createdAt, idGenerator: uid });
  }
  function measureRecommendationResults(session) {
    if (!session?.topicId) return;
    const measuredAt = nowISO2();
    state.recommendationFeedback.filter((item) => item.accepted && item.completed && item.topicId === session.topicId && item.baseline && (!item.outcome || ["pending", "insufficient"].includes(item.outcome.state))).forEach((feedback) => {
      const since = Date.parse(feedback.baseline.measuredAt) || 0, records = validQuestionRecords().filter((item) => item.topicId === session.topicId && Date.parse(item.createdAt || `${item.date}T23:59:59Z`) >= since), volume = records.reduce((sum3, item) => sum3 + (Number(item.resolved) || 0), 0), correct = records.reduce((sum3, item) => sum3 + (Number(item.correct) || 0), 0), activities = state.studySessions.filter((item) => item.topicId === session.topicId && item.id !== session.id && Date.parse(item.createdAt || item.startedAt || 0) >= since).length, candidate = intelligenceCandidates().find((item) => item.topicId === session.topicId);
      measureRecommendationOutcome(feedback, { masteryAfter: candidate?.mastery, accuracyAfter: volume ? Math.round(correct / volume * 1e3) / 10 : null, questionVolumeAfter: volume, retentionAfter: candidate?.retention, reviewHealthAfter: candidate?.reviewHealth?.value, riskAfter: candidate?.risk?.value, measuredAt, daysElapsed: Math.max(0, (Date.parse(measuredAt) - since) / 864e5), otherActivities: activities });
    });
  }
  function dismissStudyRecommendation(id) {
    const recommendation = currentStudyRecommendations.find((item) => item.id === id);
    if (recommendation) {
      recordRecommendationFeedback(recommendation, { accepted: false, reasonSkipped: "swapped" });
      scheduleSave();
    }
    dismissedRecommendationIds.add(id);
    renderStudyRecommendation();
  }
  function markRecommendationNotUseful(id) {
    const recommendation = currentStudyRecommendations.find((item) => item.id === id);
    if (recommendation) {
      const feedback = recordRecommendationFeedback(recommendation, { accepted: false, reasonSkipped: "not_useful" });
      feedback.useful = false;
      scheduleSave();
    }
    dismissedRecommendationIds.add(id);
    renderStudyRecommendation();
  }
  function rateRecommendationOutcome(recommendationId, useful) {
    if (rateRecommendationFeedback(state.recommendationFeedback, recommendationId, { useful, ratedAt: nowISO2() })) {
      scheduleSave();
      renderStudyRecommendation();
      showToast("Obrigado. Esse retorno melhora a avaliação das recomendações.");
    }
  }
  function startStudyRecommendation(id) {
    const recommendation = currentStudyRecommendations.find((item2) => item2.id === id);
    if (!recommendation) return;
    const fresh = recommendStudy(intelligenceCandidates(), { availableMinutes: Math.round(metaHoursToday() * 60) }).find((item2) => item2.id === id);
    if (!fresh) {
      renderStudyRecommendation();
      showToast("As condições mudaram. Confira a recomendação atual.");
      return;
    }
    Object.assign(recommendation, fresh);
    recordRecommendationFeedback(recommendation, { accepted: true });
    let plan = todayDailyStudyPlan();
    if (!plan) {
      plan = { id: uid("plan"), date: todayISO(), availableMinutes: Math.round(metaHoursToday() * 60), plannedMinutes: 0, flexMinutes: 0, createdAt: nowISO2(), updatedAt: nowISO2(), items: [] };
      state.dailyPlans.push(plan);
    }
    let item = plan.items.find((candidate) => candidate.topicId === recommendation.topicId && !["completed", "skipped"].includes(candidate.status));
    if (item) item.recommendationId = recommendation.recommendationId;
    if (!item) {
      item = { id: uid("plan-item"), subjectId: recommendation.subjectId, topicId: recommendation.topicId, subjectName: recommendation.subjectName, topicName: recommendation.topicName, type: recommendation.studyType || "study", plannedMinutes: recommendation.estimatedMinutes, executedSeconds: 0, status: "planned", sessionIds: [], score: recommendation.score, tier: recommendation.score >= 70 ? "Alta" : recommendation.score >= 40 ? "Média" : "Baixa", position: plan.items.length + 1, statusIcon: "🎯", statusLabel: "Recomendação inteligente", reason: recommendation.reasons.join(" · "), action: recommendation.action, recommendedQuestions: 0, originalDate: todayISO(), currentDate: todayISO(), rescheduleCount: 0, skippedReason: null, recommendationId: recommendation.recommendationId, createdAt: nowISO2() };
      plan.items.push(item);
      plan.plannedMinutes += item.plannedMinutes;
      plan.updatedAt = nowISO2();
      scheduleSave();
    }
    startPlannedActivity(item.id);
  }
  var replanPreview = null;
  function calculateReplanPreview() {
    const start = startOfWeek(todayISO()), end = addDays(start, 6), futureDays = [];
    for (let date2 = addDays(todayISO(), 1); date2 <= end; date2 = addDays(date2, 1)) {
      const capacity = metaHoursForDate(date2) * 60;
      const planned = state.dailyPlans.filter((plan) => plan.date === date2).reduce((sum3, plan) => sum3 + (plan.items || []).reduce((n, item) => n + (Number(item.plannedMinutes) || 0), 0), 0);
      futureDays.push({ date: date2, availableMinutes: Math.max(0, capacity - planned) });
    }
    replanPreview = replanService.calculate({ plans: planningRepository.getDailyPlans().filter((plan) => plan.date >= start && plan.date <= todayISO()), periodStart: start, periodEnd: end, futureDays });
    renderWeeklyReplan();
  }
  function clearReplanPreview() {
    replanPreview = null;
    renderWeeklyReplan();
  }
  function confirmReplan() {
    if (!replanPreview || replanPreview.state !== "proposal") return;
    const { result } = replanService.confirm(replanPreview);
    replanPreview = null;
    scheduleSave();
    renderWeeklyReplan();
    renderPlanoHoje();
    showToast(`${pluralize(result.createdItems, "atividade")} redistribuída${result.createdItems === 1 ? "" : "s"} para os próximos dias.`);
  }
  function undoPlanAdjustment(id) {
    const result = replanService.undo(id);
    if (!result) return;
    scheduleSave();
    renderWeeklyReplan();
    renderPlanoHoje();
    showToast(result.protectedItems.length ? "Itens já executados foram preservados; os demais retornaram à origem." : "Redistribuição desfeita com segurança.");
  }
  function renderWeeklyReplan() {
    const container = document.getElementById("weeklyReplan");
    if (!container) return;
    const latest = [...state.planAdjustments].sort((a, b) => (b.confirmedAt || "").localeCompare(a.confirmedAt || ""))[0];
    if (!replanPreview) {
      container.innerHTML = `${latest ? `<div class="confirmed-plan-note"><strong>Último ajuste ${latest.undoneAt ? "desfeito" : "aplicado"}</strong><span>${formatPlanMinutes(latest.redistributedMinutes)} redistribuídos · ${formatPlanMinutes(latest.discardedMinutes)} sem capacidade</span></div>` : ""}<div class="study-plan-actions"><button class="btn" data-delegated-click="calculateReplanPreview()">Analisar execução da semana</button>${latest && !latest.undoneAt && latest.status !== "undone" && latest.changes?.length ? `<button class="btn ghost" data-delegated-click="undoPlanAdjustment('${latest.id}')">Desfazer redistribuição</button>` : ""}</div>`;
      return;
    }
    if (replanPreview.state === "balanced") {
      container.innerHTML = '<div class="upcoming-empty">Não há déficit de execução nos planos registrados nesta semana.</div><button class="btn ghost small" data-delegated-click="clearReplanPreview()">Fechar</button>';
      return;
    }
    const allocationByDate = /* @__PURE__ */ new Map();
    replanPreview.allocations.forEach((item) => allocationByDate.set(item.date, (allocationByDate.get(item.date) || 0) + item.minutes));
    const allocations = [...allocationByDate].map(([date2, minutes]) => `<div><strong>${formatDatePt(date2)}</strong><span>+ ${formatPlanMinutes(minutes)}</span></div>`).join("");
    container.innerHTML = `<div class="study-plan-summary"><div><strong>${formatPlanMinutes(replanPreview.plannedMinutes)}</strong><span>Planejado</span></div><div><strong>${formatPlanMinutes(replanPreview.executedMinutes)}</strong><span>Executado</span></div><div><strong>${formatPlanMinutes(replanPreview.deficitMinutes)}</strong><span>Déficit</span></div><div><strong>${formatPlanMinutes(replanPreview.redistributedMinutes)}</strong><span>Redistribuição possível</span></div></div><div class="replan-allocations">${allocations || "<span>Sem capacidade restante nesta semana.</span>"}</div>${replanPreview.discardedMinutes ? `<p class="confidence-note">${formatPlanMinutes(replanPreview.discardedMinutes)} não cabem na disponibilidade restante e não serão acumulados automaticamente.</p>` : ""}<div class="study-plan-actions"><button class="btn" data-delegated-click="confirmReplan()">Confirmar redistribuição</button><button class="btn ghost" data-delegated-click="clearReplanPreview()">Cancelar</button></div>`;
  }
  function formatPlanMinutes(minutes) {
    const value2 = Math.max(0, Math.round(Number(minutes) || 0));
    if (value2 < 60) return value2 + "min";
    const hours = Math.floor(value2 / 60);
    const rest = value2 % 60;
    return hours + "h" + (rest ? String(rest).padStart(2, "0") : "");
  }
  function buildDailyStudyPlan(priorities, availableMinutes) {
    let remaining = Math.max(0, Math.round(Number(availableMinutes) || 0));
    const items = [];
    for (const priority of priorities.slice(0, 5)) {
      if (remaining < 15) break;
      const desired = Math.max(15, Math.min(60, Math.round(Number(priority.estimatedMinutes) || 30)));
      let minutes = Math.min(desired, remaining);
      if (remaining - minutes > 0 && remaining - minutes < 15) minutes = remaining;
      items.push({ ...priority, minutes });
      remaining -= minutes;
      if (remaining <= 0) break;
    }
    return { items, plannedMinutes: items.reduce((sum3, item) => sum3 + item.minutes, 0), flexMinutes: remaining };
  }
  function materializeDailyStudyPlan(priorities, availableMinutes) {
    const calculated = buildDailyStudyPlan(priorities, availableMinutes);
    if (!calculated.items.length) return null;
    const createdAt = nowISO2();
    const plan = {
      id: uid("plan"),
      date: todayISO(),
      availableMinutes,
      plannedMinutes: calculated.plannedMinutes,
      flexMinutes: calculated.flexMinutes,
      createdAt,
      updatedAt: createdAt,
      items: calculated.items.map((item, index) => ({
        id: uid("plan-item"),
        subjectId: item.subjectId || null,
        topicId: item.topicId || null,
        subjectName: item.subjectName || getSubjectName(item.subjectId),
        topicName: item.topicName || getTopicName(item.topicId),
        type: item.studyType || "study",
        plannedMinutes: item.minutes,
        executedSeconds: 0,
        status: "planned",
        sessionIds: [],
        score: Number(item.score) || 0,
        tier: item.tier || "Baixa",
        position: index + 1,
        statusIcon: item.diagnosis?.statusIcon || PRIORITY_TIER_EMOJI[item.tier] || "📌",
        statusLabel: item.diagnosis?.status || "Prioridade " + (index + 1),
        reason: motivoPrioridade(item),
        action: item.recommendedAction || "Estudar o tópico",
        recommendedQuestions: Number(item.recommendedQuestions) || 0,
        originalDate: todayISO(),
        currentDate: todayISO(),
        rescheduleCount: 0,
        skippedReason: null,
        recommendationId: null,
        createdAt
      }))
    };
    state.dailyPlans.push(plan);
    scheduleSave();
    return plan;
  }
  function todayDailyStudyPlan() {
    return state.dailyPlans.find((plan) => plan.date === todayISO()) || null;
  }
  function ensureTodayDailyStudyPlan(priorities, availableMinutes) {
    return todayDailyStudyPlan() || materializeDailyStudyPlan(priorities, availableMinutes);
  }
  function planItemStatusLabel(status) {
    return { planned: "Planejada", in_progress: "Em andamento", partial: "Parcial", completed: "Concluída", deferred: "Adiada", replaced: "Substituída", skipped: "Ignorada" }[status] || "Planejada";
  }
  function renderPlanoHoje() {
    const container = document.getElementById("planoHojeContent");
    if (!container) return;
    const priorities = computeStudyPriorities();
    const availableMinutes = Math.max(0, Math.round(metaHoursToday() * 60));
    const plan = ensureTodayDailyStudyPlan(priorities, availableMinutes);
    if (!plan && priorities.length === 0) {
      container.innerHTML = '<div class="upcoming-empty">Nenhuma atividade elegível para o tempo disponível. Confira os pré-requisitos e a meta de hoje.</div>';
      return;
    }
    if (!plan) {
      container.innerHTML = '<div class="upcoming-empty">Defina uma meta diária de pelo menos 15 minutos para montar o plano.</div>';
      return;
    }
    const listaHtml = plan.items.map((item) => {
      const progress = item.plannedMinutes > 0 ? Math.min(100, Math.round(item.executedSeconds / (item.plannedMinutes * 60) * 100)) : 0;
      const active = state.activeTimer.planItemId === item.id && state.activeTimer.isRunning;
      const canStart = !["completed", "deferred", "replaced", "skipped"].includes(item.status) && !active;
      return `
    <div class="plano-item ${active ? "is-active" : ""} ${item.status === "completed" ? "is-completed" : ""}">
      <div class="plano-item-head">${escapeHtml(item.statusIcon || "📌")} ${escapeHtml(item.statusLabel || planItemStatusLabel(item.status))} · ${Number.isFinite(Number(item.score)) ? Math.round(Number(item.score)) + "/100" : "prioridade não calculada"}</div>
      <div class="plano-item-title">${escapeHtml(item.subjectName || getSubjectName(item.subjectId) || "Disciplina")} — ${escapeHtml(item.topicName || getTopicName(item.topicId) || "Tópico")}</div>
      <div class="plano-item-reason">${escapeHtml(item.reason)}</div>
      <div class="plano-item-reason">⏱️ ${formatPlanMinutes(item.plannedMinutes)} · ${escapeHtml(item.action)}${item.recommendedQuestions ? " · " + item.recommendedQuestions + " questões" : ""}</div>
      <div class="plano-item-progress" title="${progress}% executado"><span style="width:${progress}%"></span></div>
      <div class="plano-item-actions">
        ${canStart ? `<button type="button" class="btn small" data-delegated-click="startPlannedActivity('${escapeAttr(item.id)}')">${item.executedSeconds > 0 ? "▶ Continuar" : "▶ Iniciar"}</button>` : ""}
        <span class="plano-item-status">${active ? "Cronômetro ativo" : escapeHtml(planItemStatusLabel(item.status))} · ${formatDuration(item.executedSeconds)} executado</span>
      </div>
    </div>
  `;
    }).join("");
    const executedSeconds = plan.items.reduce((sum3, item) => sum3 + (Number(item.executedSeconds) || 0), 0);
    const executionPct = plan.plannedMinutes > 0 ? Math.min(100, Math.round(executedSeconds / (plan.plannedMinutes * 60) * 100)) : 0;
    container.innerHTML = `
    ${listaHtml}
    ${plan.flexMinutes > 0 ? `<div class="plano-depois"><div class="plano-depois-label">Tempo flexível:</div><div class="plano-depois-item">⏱️ ${formatPlanMinutes(plan.flexMinutes)} para pausas, correção ou continuidade</div></div>` : ""}
    <div class="plano-meta">
      <div class="plano-depois-label">Planejamento:</div>
      <div class="plano-depois-item">⏱️ ${formatPlanMinutes(plan.plannedMinutes)} planejados · ${formatDuration(executedSeconds)} executado (${executionPct}%)</div>
    </div>
  `;
  }
  function renderMetasHoje() {
    const container = document.getElementById("hojeMetas");
    if (!container) return;
    const today = todayISO();
    const topicosHoje = uniqueTopicsCompletedBetween(today, today);
    const metaTopicosHoje = Math.max(1, Math.round(state.metas.semanal / 7));
    const questoesHoje = state.questoes.filter((q) => q.date === today).reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
    const metaQuestoesHoje = Math.max(1, Math.round(state.metas.questoesSemanal / 7));
    const revisoesHoje = getRevisoesUnificadas().filter((r) => r.date === today);
    const revisoesConcluidasHoje = revisoesHoje.filter((r) => r.status === "Concluído").length;
    const tempoHoje = segundosEstudadosHoje();
    const metaTempo = metaHoursToday() * 3600;
    const pctTempo = metaTempo > 0 ? Math.round(tempoHoje / metaTempo * 100) : 0;
    container.innerHTML = `
    <div class="metas-hoje-grid">
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Tópicos concluídos hoje</div>
        <div class="meta-hoje-value">${topicosHoje} <span>/ ${metaTopicosHoje}</span></div>
      </div>
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Questões resolvidas hoje</div>
        <div class="meta-hoje-value">${questoesHoje} <span>/ ${metaQuestoesHoje}</span></div>
      </div>
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Revisões de hoje concluídas</div>
        <div class="meta-hoje-value">${revisoesConcluidasHoje} <span>/ ${revisoesHoje.length}</span></div>
      </div>
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">⏱️ Tempo estudado hoje</div>
        <div class="meta-hoje-time">
          <div class="meta-hoje-time-main">
            <div class="meta-hoje-time-value">${formatDuration(tempoHoje)}</div>
            <div class="meta-hoje-time-target">de ${formatHoras(metaHoursToday())} · ${pctTempo}%</div>
          </div>
          <label class="meta-hoje-time-goal">
            <span>Meta diária</span>
            <input type="number" min="0" step="0.25" value="${metaHoursToday()}"
              data-delegated-blur="updateMetaHoursDay(parseLocalDate(todayISO()).getDay(),this.value)" title="Editar a meta de hoje" aria-label="Meta de horas de hoje">
          </label>
        </div>
      </div>
    </div>
  `;
  }
  function clampScore(value2) {
    return Math.max(0, Math.min(100, Math.round(Number(value2) || 0)));
  }
  function average(values) {
    return values.length ? values.reduce((sum3, n) => sum3 + n, 0) / values.length : 0;
  }
  function approvalSimuladosMetric() {
    const completed = state.simulados.filter((sim) => simuladoEffectiveCounts(sim).total > 0).sort((a, b) => (a.date || "").localeCompare(b.date || "")).slice(-5);
    if (completed.length === 0) return { score: 50, confidence: 0, available: false, raw: null, detail: "Sem simulados concluídos" };
    let weighted = 0, weights = 0, totalQuestions = 0;
    completed.forEach((sim, index) => {
      const weight = index + 1;
      weighted += simuladoNota(sim) * weight;
      weights += weight;
      totalQuestions += simuladoEffectiveCounts(sim).total;
    });
    const raw = weighted / weights;
    const confidence = Math.min(1, completed.length / 4 * 0.7 + totalQuestions / 300 * 0.3);
    return { score: clampScore(50 + (raw - 50) * confidence), confidence, available: true, raw, detail: `${completed.length} simulado${completed.length === 1 ? "" : "s"} · média recente ${Math.round(raw)}%` };
  }
  function approvalAcertosMetric() {
    const total = state.questoes.reduce((sum3, q) => sum3 + (Number(q.resolved) || 0), 0);
    const correct = state.questoes.reduce((sum3, q) => sum3 + (Number(q.correct) || 0), 0);
    if (total === 0) return { score: 50, confidence: 0, available: false, raw: null, detail: "Sem questões registradas" };
    const raw = correct / total * 100;
    const confidence = Math.min(1, total / 300);
    return { score: clampScore(50 + (raw - 50) * confidence), confidence, available: true, raw, detail: `${total} questões · acerto bruto ${Math.round(raw)}%` };
  }
  function approvalEditalMetric() {
    const topics = activeTopics();
    if (topics.length === 0) return { score: 50, confidence: 0, available: false, raw: null, detail: "Sem tópicos cadastrados" };
    const concluded = topics.filter((t) => t.status === "Concluído").length;
    const raw = concluded / topics.length * 100;
    const subjectsWithTopics = activeSubjects().filter((s) => s.topics.some((t) => !t.archived)).length;
    const confidence = Math.min(1, topics.length / 40 * 0.55 + subjectsWithTopics / 5 * 0.45);
    return { score: clampScore(50 + (raw - 50) * confidence), confidence, available: true, raw, detail: `${concluded} de ${topics.length} tópicos concluídos` };
  }
  function approvalDominioMetric() {
    const topics = activeTopics();
    if (topics.length === 0) return { score: 50, confidence: 0, available: false, raw: null, detail: "Sem tópicos ativos" };
    const values = topics.map((topic) => topicMasteryIndex(topic.subjectId, topic.id));
    const evidenced = values.filter((item) => item.confidence > 0);
    if (evidenced.length === 0) return { score: 50, confidence: 0, available: false, raw: null, detail: "Ainda não há evidências de domínio" };
    const weightTotal = evidenced.reduce((sum3, item) => sum3 + Math.max(0.15, item.confidence), 0);
    const raw = evidenced.reduce((sum3, item) => sum3 + item.score * Math.max(0.15, item.confidence), 0) / weightTotal;
    const coverage = evidenced.length / topics.length;
    const evidence = evidenced.reduce((sum3, item) => sum3 + item.confidence, 0) / evidenced.length;
    const confidence = Math.min(1, coverage * 0.55 + evidence * 0.45);
    return { score: clampScore(50 + (raw - 50) * confidence), confidence, available: true, raw, detail: Math.round(raw) + "/100 em " + evidenced.length + " de " + topics.length + " tópicos" };
  }
  function approvalRevisoesMetric() {
    const today = todayISO();
    const due = getRevisoesUnificadas().filter((r) => r.date && r.date <= today);
    if (due.length === 0) return { score: 50, confidence: 0, available: false, raw: null, detail: "Sem revisões vencidas até hoje" };
    const completed = due.filter((r) => r.status === "Concluído").length;
    const pending = due.filter((r) => r.status !== "Concluído");
    const severity = pending.reduce((sum3, r) => {
      const daysLate = Math.max(0, -(diasParaRevisao(r.date) || 0));
      return sum3 + Math.min(1, daysLate / 14);
    }, 0);
    const raw = Math.max(0, completed / due.length * 100 - severity / due.length * 20);
    const confidence = Math.min(1, due.length / 10);
    const evidence = Math.max(0.4, confidence);
    return { score: clampScore(50 + (raw - 50) * evidence), confidence, available: true, raw, detail: `${completed} de ${due.length} revisões em dia` };
  }
  function approvalTendenciaMetric() {
    const simulations = state.simulados.filter((sim) => simuladoEffectiveCounts(sim).total > 0).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (simulations.length < 2) return { score: 50, confidence: 0, available: false, raw: null, detail: "São necessários pelo menos 2 simulados" };
    const windowSize = Math.min(3, Math.floor(simulations.length / 2));
    const previous = simulations.slice(-(windowSize * 2), -windowSize).map(simuladoNota);
    const recent = simulations.slice(-windowSize).map(simuladoNota);
    const variation = average(recent) - average(previous);
    const raw = clampScore(50 + variation * 2);
    const confidence = Math.min(1, (simulations.length - 1) / 5);
    return { score: clampScore(50 + (raw - 50) * confidence), confidence, available: true, raw, detail: `Variação recente ${variation >= 0 ? "+" : ""}${Math.round(variation * 10) / 10} p.p.` };
  }
  function approvalPrazoMetric() {
    const ritmo = computeRitmo();
    if (!state.examDate) return { score: 50, confidence: 0, available: false, raw: null, detail: "Data da prova não definida" };
    if (ritmo.status === "completo") return { score: 100, confidence: 1, available: true, raw: 100, detail: "Cobertura cadastrada concluída" };
    if (ritmo.status !== "ok" || !ritmo.comparativo) return { score: 50, confidence: 0.2, available: false, raw: null, detail: "Ritmo recente insuficiente para estimar" };
    if (ritmo.comparativo === "no-prazo") {
      const slack = ritmo.daysToExam - ritmo.daysNeeded;
      const raw2 = clampScore(70 + Math.min(30, Math.max(0, slack)));
      return { score: raw2, confidence: 1, available: true, raw: raw2, detail: `Previsão com ${slack} dia${slack === 1 ? "" : "s"} de folga` };
    }
    const delay = ritmo.daysNeeded - ritmo.daysToExam;
    const raw = clampScore(60 - Math.min(60, Math.max(0, delay) * 2));
    return { score: raw, confidence: 1, available: true, raw, detail: `Previsão ${delay} dia${delay === 1 ? "" : "s"} após a prova` };
  }
  function readinessFactors(metrics) {
    const m = metrics || computeApprovalMetrics();
    return { coverage: m.edital, mastery: m.dominio, retention: m.retencao, consistency: m.consistencia, simulations: m.simulados };
  }
  function readinessResult(metrics) {
    return calculateReadinessScore(readinessFactors(metrics), READINESS_WEIGHTS);
  }
  function indiceProntidao(metrics) {
    return readinessResult(metrics).value ?? 0;
  }
  function projectPerformance(metrics) {
    const m = metrics || computeApprovalMetrics();
    const sources = [
      { metric: m.simulados, weight: 0.45, label: "simulados" },
      { metric: m.acertos, weight: 0.25, label: "questões" },
      { metric: m.dominio, weight: 0.3, label: "domínio" }
    ].filter((source) => source.metric.available && source.metric.raw !== null);
    if (sources.length === 0) return { available: false, low: null, high: null, central: null, confidence: 0, confidenceLabel: "Baixa", detail: "Registre questões, simulados e sessões para gerar uma faixa.", forecast30: { available: false, reason: "A faixa atual ainda não possui dados suficientes." } };
    let weighted = 0, totalWeight = 0;
    sources.forEach((source) => {
      const evidenceWeight = source.weight * Math.max(0.2, source.metric.confidence);
      weighted += source.metric.raw * evidenceWeight;
      totalWeight += evidenceWeight;
    });
    let central = weighted / totalWeight;
    if (m.tendencia.available) central += (m.tendencia.score - 50) * 0.08;
    central = Math.max(0, Math.min(100, central));
    const sourceCoverage = sources.reduce((sum3, source) => sum3 + source.weight, 0);
    const evidence = sources.reduce((sum3, source) => sum3 + source.metric.confidence * source.weight, 0) / sourceCoverage;
    const confidence = Math.min(1, evidence * 0.75 + sourceCoverage * 0.25);
    const result = buildPerformanceForecast({ currentValue: central, currentConfidence: confidence, targetScore: state.metas.metaAprovacao, observations: performanceForecastObservations() });
    const { low, high } = result.currentBand;
    return {
      available: true,
      low,
      high,
      central: result.currentBand.central,
      confidence,
      confidenceLabel: result.currentBand.confidenceLabel,
      gap: result.gap,
      movingAverage: result.movingAverage,
      forecast30: result.forecast30,
      evidence: result.evidence,
      detail: "Base: " + sources.map((source) => source.label).join(", ") + " · margem ajustada pela confiança"
    };
  }
  function performanceForecastObservations() {
    return Array.from({ length: 12 }, (_, index) => getWeekRange(11 - index)).map(({ start, end }) => {
      const questions = validQuestionRecords().filter((item) => item.date >= start && item.date <= end);
      let total = questions.reduce((sum3, item) => sum3 + (Number(item.resolved) || 0), 0);
      let correct = questions.reduce((sum3, item) => sum3 + (Number(item.correct) || 0), 0);
      state.simulados.filter((item) => item.date >= start && item.date <= end).forEach((item) => {
        const counts = simuladoEffectiveCounts(item);
        total += counts.total;
        correct += counts.correct;
      });
      return { date: end, value: accuracyFromCounts(correct, total), sampleSize: total };
    });
  }
  function gerarDiagnosticoAprovacao(metrics) {
    const m = metrics || computeApprovalMetrics();
    const icons = { positive: "✅", warning: "⚠️", info: "ℹ️" };
    return buildApprovalSignals(m, { target: state.metas.metaAprovacao }).map((item) => `${icons[item.level]} ${item.text}`);
  }
  function topicRetentionScore(subjectId, topicId) {
    const found = getTopicById(topicId);
    if (!found) return { score: 0, raw: null, confidence: 0, confidenceLabel: "Baixa", available: false, detail: "Tópico não encontrado" };
    const today = todayISO(), due = state.reviewAgenda.filter((r) => (r.topicId || r.topicRef) === topicId && r.date && r.date <= today);
    const done = due.filter((r) => r.status === "Concluído" && r.completedAt);
    const onTime = done.filter((r) => localDateFromTimestamp2(r.completedAt) <= addDays(r.date, 1)).length;
    const cutoff = addDays(today, -59);
    const questions = validQuestionRecords().filter((q) => q.topicId === topicId && q.date >= cutoff && q.date <= today);
    const resolved = questions.reduce((n, q) => n + (Number(q.resolved) || 0), 0), correct = questions.reduce((n, q) => n + (Number(q.correct) || 0), 0);
    const dates = done.map((r) => localDateFromTimestamp2(r.completedAt)).filter(Boolean).sort();
    const lastReview = dates[dates.length - 1] || localDateFromTimestamp2(found.topic.lastReviewedAt) || null;
    const daysSince = lastReview ? Math.max(0, -(diasParaRevisao(lastReview) ?? 0)) : null;
    return calculateTopicRetention({ due, resolved, correct, lastReview, daysSince, onTime, periodStart: cutoff, periodEnd: today });
  }
  function topicReviewHealthScore(topic, masteryResult = topicMasteryIndex(topic.subjectId, topic.id), retentionResult = topicRetentionScore(topic.subjectId, topic.id), diagnosis = diagnoseTopic(topic.subjectId, topic.id)) {
    const lastReviewDate = localDateFromTimestamp2(topic.lastReviewedAt);
    const daysSinceReview = lastReviewDate ? Math.max(0, -(diasParaRevisao(lastReviewDate) ?? 0)) : null;
    const evidenceValues = [masteryResult?.confidence, retentionResult?.confidence].filter((value2) => Number.isFinite(Number(value2)));
    const evidenceStrength = evidenceValues.length ? evidenceValues.reduce((sum3, value2) => sum3 + Number(value2), 0) / evidenceValues.length : null;
    return calculateReviewHealth({
      daysSinceReview,
      hasPriorStudy: topic.status !== "Não iniciado" || Boolean(diagnosis?.performance?.resolved) || Boolean(diagnosis?.studySeconds),
      retention: retentionResult?.available ? retentionResult.score : null,
      mastery: masteryResult?.confidence > 0 ? masteryResult.score : null,
      recentPerformance: diagnosis?.performance?.accuracy ?? null,
      examImpact: topic.examImportance == null ? null : Number(topic.examImportance) * 100,
      evidenceStrength
    });
  }
  function approvalRetencaoMetric() {
    const topics = activeTopics(), values = topics.map((t) => topicRetentionScore(t.subjectId, t.id)).filter((x) => x.available);
    if (!values.length) return { score: 50, confidence: 0, available: false, raw: null, detail: "Sem evidências de retenção por tópico" };
    const weight = values.reduce((n, x) => n + Math.max(0.15, x.confidence), 0), raw = values.reduce((n, x) => n + x.score * Math.max(0.15, x.confidence), 0) / weight;
    const confidence = Math.min(1, values.reduce((n, x) => n + x.confidence, 0) / values.length * 0.65 + values.length / topics.length * 0.35);
    return { score: clampScore(50 + (raw - 50) * Math.max(0.35, confidence)), confidence, available: true, raw, detail: Math.round(raw) + "% em " + values.length + " de " + topics.length + " tópicos" };
  }
  function approvalConhecimentoMetric(base) {
    const parts = [];
    if (base.dominio.available) parts.push({ v: base.dominio.raw ?? base.dominio.score, c: base.dominio.confidence, w: 0.65 });
    if (base.edital.available) parts.push({ v: base.edital.raw ?? base.edital.score, c: base.edital.confidence, w: 0.35 });
    if (!parts.length) return { score: 50, confidence: 0, available: false, raw: null, detail: "Sem evidências suficientes de conhecimento" };
    const w = parts.reduce((n, x) => n + x.w, 0), raw = parts.reduce((n, x) => n + x.v * x.w, 0) / w, confidence = parts.reduce((n, x) => n + x.c * x.w, 0) / w;
    return { score: clampScore(50 + (raw - 50) * Math.max(0.25, confidence)), confidence, available: true, raw, detail: "Domínio dos tópicos (65%) + cobertura do edital (35%)" };
  }
  function approvalConsistenciaMetric() {
    const today = todayISO(), byDate = studySecondsByDate(state.studySessions);
    const days = [];
    for (let n = 27; n >= 0; n--) {
      const date2 = addDays(today, -n);
      days.push({ targetSeconds: metaHoursForDate(date2) * 3600, studiedSeconds: byDate[date2] || 0 });
    }
    const result = calculateGoalConsistency(days);
    if (!result.applicable) return { score: 50, confidence: 0, available: false, raw: null, detail: "Defina metas de horas para medir consistência" };
    const raw = result.value, confidence = Math.min(1, result.studiedDays / 14);
    return { score: clampScore(50 + (raw - 50) * Math.max(0.2, confidence)), confidence, available: result.available, raw, detail: result.achieved + " de " + result.applicable + " metas diárias atingidas nos últimos 28 dias" };
  }
  function computeApprovalMetrics() {
    const base = { simulados: approvalSimuladosMetric(), acertos: approvalAcertosMetric(), edital: approvalEditalMetric(), dominio: approvalDominioMetric(), revisoes: approvalRevisoesMetric(), tendencia: approvalTendenciaMetric(), prazo: approvalPrazoMetric() };
    return { ...base, conhecimento: approvalConhecimentoMetric(base), retencao: approvalRetencaoMetric(), questoes: base.acertos, consistencia: approvalConsistenciaMetric() };
  }
  function classificacaoAprovacao(score) {
    if (score >= 85) return { nivel: "🏆 Excelente preparação", cor: "ok", faixa: "85–100" };
    if (score >= 70) return { nivel: "🟢 Preparação avançada", cor: "ok", faixa: "70–84" };
    if (score >= 50) return { nivel: "🟠 Em desenvolvimento", cor: "warn", faixa: "50–69" };
    return { nivel: "🔴 Preparação inicial", cor: "danger", faixa: "0–49" };
  }
  function renderApprovalDashboard() {
    const el = document.getElementById("approvalDashboard");
    if (!el) return;
    const m = computeApprovalMetrics(), readiness = readinessResult(m), score = readiness.value ?? 0, level = classificacaoAprovacao(score), confidence = { value: readiness.confidence, nivel: readiness.confidenceLabel }, projection = projectPerformance(m);
    const factors = [["Cobertura · 30%", m.edital, "coverage"], ["Domínio · 25%", m.dominio, "mastery"], ["Retenção · 20%", m.retencao, "retention"], ["Consistência · 15%", m.consistencia, "consistency"], ["Simulados · 10%", m.simulados, "simulations"]];
    const approvalState = readiness.state === "empty" ? "empty" : readiness.state === "insufficient" || confidence.value < 0.35 ? "insufficient" : "ready";
    const approvalLabel = approvalState === "empty" ? "Aguardando dados" : approvalState === "insufficient" ? "Estimativa inicial" : "Estimativa calculada";
    el.innerHTML = `<div class="metric-state metric-state--${approvalState}">${approvalLabel}${approvalState !== "ready" ? "<span>Registre mais atividades para liberar uma classificação definitiva.</span>" : ""}</div><div class="kpi-grid">
    <div class="kpi-cell ${approvalState === "ready" ? level.cor === "danger" ? "warn" : level.cor : "neutral"}"><div class="n">${approvalState === "empty" ? "—" : score + "/100"}</div><div class="l">Índice de Prontidão</div></div>
    <div class="kpi-cell ${approvalState === "ready" ? level.cor === "danger" ? "warn" : level.cor : "neutral"}"><div class="n" style="font-size:18px">${approvalState === "ready" ? level.nivel : approvalLabel}</div><div class="l">${approvalState === "ready" ? "Nível de preparação · " + level.faixa : "Sem classificação definitiva"}</div></div>
    <div class="kpi-cell"><div class="n">${confidence.nivel}</div><div class="l">Confiança · ${Math.round(confidence.value * 100)}%</div></div>
    <div class="kpi-cell"><div class="n">${m.retencao.available ? Math.round(m.retencao.raw) + "%" : "—"}</div><div class="l">Retenção média</div></div>
    <div class="kpi-cell"><div class="n">${projection.available ? projection.low + "–" + projection.high + "%" : "—"}</div><div class="l">Faixa estimada atual</div></div>
  </div>
  ${factors.map(([label, item]) => {
      const dataState = getMetricDataState(item);
      return `<div class="bar-row metric-row metric-row--${dataState}" title="${escapeAttr(item.detail)}"><div class="bar-label">${label}<small>${metricStateLabel(item)}</small></div><div class="bar-track"><div class="bar-fill" style="width:${dataState === "empty" ? 0 : item.score}%"></div></div><div class="bar-pct">${dataState === "empty" ? "—" : item.score + "%"}</div></div>`;
    }).join("")}
  ${projection.available ? `<section class="performance-forecast" aria-label="Projeção de desempenho"><div><span class="section-eyebrow">PROJEÇÃO DE DESEMPENHO</span><strong>Faixa atual: ${projection.low}–${projection.high}%</strong><small>${projection.gap.minimum === 0 ? "A meta de " + projection.gap.target + "% está dentro da faixa atual." : "Gap estimado até a meta: " + projection.gap.minimum + "–" + projection.gap.maximum + " p.p."}</small></div><div><strong>${projection.forecast30.available ? "Em 30 dias: " + projection.forecast30.low + "–" + projection.forecast30.high + "%" : "Projeção de 30 dias aguardando dados"}</strong><small>${projection.forecast30.available ? "Média móvel: " + projection.movingAverage + "% · tendência " + (projection.forecast30.slopePerWeek >= 0 ? "+" : "") + projection.forecast30.slopePerWeek + " p.p./semana · confiança " + projection.forecast30.confidenceLabel : escapeHtml(projection.forecast30.reason)}</small></div><p>${projection.evidence.observationCount} semanas · ${projection.evidence.sampleSize} questões/simulações na amostra. Estimativa baseada no histórico; não representa garantia nem efeito causal de mais horas.</p></section>` : ""}
  <details class="readiness-explanation"><summary>Como este índice foi calculado?</summary><p>Os pesos são redistribuídos somente entre fatores com dados. Fatores ausentes reduzem a confiança e nunca recebem nota zero.</p><ul>${factors.map(([label, item, key]) => `<li><strong>${label}</strong>: ${item.available ? item.score + "/100 · confiança " + Math.round(item.confidence * 100) + "%" : "aguardando dados"}${item.detail ? " · " + escapeHtml(item.detail) : ""}</li>`).join("")}</ul></details>
  <div class="approval-scale"><span class="approval-scale-danger">🔴 0–49</span><span class="approval-scale-warn">🟠 50–69</span><span class="approval-scale-good">🟢 70–84</span><span class="approval-scale-great">🏆 85+</span></div>
  <ul class="upcoming-list" style="margin-top:14px">${gerarDiagnosticoAprovacao(m).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
    renderTopicRetentionDashboard();
  }
  function renderTopicRetentionDashboard() {
    const el = document.getElementById("topicRetentionDashboard");
    if (!el) return;
    const baseRows = activeTopics().map((t) => {
      const r = topicRetentionScore(t.subjectId, t.id);
      return { ...t, r, h: topicReviewHealthScore(t, topicMasteryIndex(t.subjectId, t.id), r) };
    }).filter((x) => x.r.available || x.h.value !== null);
    const confidenceMatch = (row) => retentionView.confidence === "all" || row.r.confidenceLabel.toLowerCase() === retentionView.confidence;
    const rows = baseRows.filter((row) => (!retentionView.subjectId || row.subjectId === retentionView.subjectId) && confidenceMatch(row)).sort((a, b) => {
      const av = a.r.available ? a.r.score : a.h.value, bv = b.r.available ? b.r.score : b.h.value;
      const score = retentionView.order === "desc" ? bv - av : av - bv;
      return score || a.r.confidence - b.r.confidence || a.subjectName.localeCompare(b.subjectName) || a.name.localeCompare(b.name);
    });
    const toolbar = `<div class="retention-toolbar"><select aria-label="Filtrar retenção por disciplina" data-delegated-change="setRetentionFilter('subjectId',this.value)"><option value="">Todas as disciplinas</option>${activeSubjects().map((subject) => `<option value="${escapeAttr(subject.id)}" ${retentionView.subjectId === subject.id ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join("")}</select><select aria-label="Ordenar retenção" data-delegated-change="setRetentionFilter('order',this.value)"><option value="asc" ${retentionView.order === "asc" ? "selected" : ""}>Menor retenção</option><option value="desc" ${retentionView.order === "desc" ? "selected" : ""}>Maior retenção</option></select><select aria-label="Filtrar retenção por confiança" data-delegated-change="setRetentionFilter('confidence',this.value)"><option value="all">Todas as confianças</option><option value="alta" ${retentionView.confidence === "alta" ? "selected" : ""}>Confiança alta</option><option value="média" ${retentionView.confidence === "média" ? "selected" : ""}>Confiança média</option><option value="baixa" ${retentionView.confidence === "baixa" ? "selected" : ""}>Confiança baixa</option></select></div>`;
    if (!rows.length) {
      el.innerHTML = toolbar + '<div class="upcoming-empty">Nenhum tópico corresponde aos filtros atuais.</div>';
      return;
    }
    const visible = retentionShowAll ? rows : rows.slice(0, 8);
    const scoreCounts = /* @__PURE__ */ new Map();
    rows.forEach((row) => {
      const score = row.r.available ? row.r.score : row.h.value;
      scoreCounts.set(score, (scoreCounts.get(score) || 0) + 1);
    });
    const repeated = [...scoreCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const repeatedSummary = repeated && repeated[1] >= 4 ? `<div class="retention-pattern-note">${repeated[1]} tópicos apresentam retenção estimada em ${repeated[0]}%. Compare a confiança antes de interpretar o resultado como definitivo.</div>` : "";
    el.innerHTML = toolbar + repeatedSummary + visible.map((x) => {
      const score = x.r.available ? x.r.score : x.h.value, c = score >= 70 ? "ok" : score >= 50 ? "warn" : "";
      return `<div class="retention-row" title="${escapeAttr(x.r.detail || x.h.reasons[0])}"><div class="retention-topic"><strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.subjectName)} · retenção ${x.r.available ? x.r.score + "%" : "—"} · saúde ${x.h.value === null ? "—" : x.h.value + "%"}</span></div><div class="retention-track"><div class="retention-fill ${c}" style="width:${score}%"></div></div><div class="retention-value">${score}%</div></div>`;
    }).join("") + renderCollectionFooter({ variant: "block", total: rows.length, visible: visible.length, step: 8, label: "tópicos", showMoreAction: "showAllRetention()", showAllAction: "showAllRetention()", showLessAction: retentionShowAll ? "resetRetentionLimit()" : "" });
  }
  function planStartDate() {
    const dates = [];
    state.studySessions.forEach((x) => {
      if (x.date) dates.push(x.date);
    });
    state.questoes.forEach((x) => {
      if (x.date) dates.push(x.date);
    });
    state.simulados.forEach((x) => {
      if (x.date) dates.push(x.date);
    });
    state.topicHistory.forEach((x) => {
      const d = eventLocalDate(x);
      if (d) dates.push(d);
    });
    state.subjects.forEach((subject) => {
      const d = localDateFromTimestamp2(subject.createdAt);
      if (d) dates.push(d);
    });
    const valid = dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && (!state.examDate || d <= state.examDate)).sort();
    return valid[0] || todayISO();
  }
  function renderExamProgress() {
    const el = document.getElementById("examProgress");
    if (!el) return;
    if (!state.examDate) {
      el.style.display = "none";
      return;
    }
    el.style.display = "grid";
    const today = todayISO(), start = planStartDate(), exam = state.examDate;
    const diff = (a, b) => Math.max(0, Math.round((parseLocalDate(b) - parseLocalDate(a)) / 864e5));
    const total = Math.max(1, diff(start, exam)), elapsed = Math.min(total, diff(start, today)), remaining = Math.max(0, diasParaRevisao(exam) ?? 0), pct = Math.max(0, Math.min(100, Math.round(elapsed / total * 100)));
    el.innerHTML = `<span class="exam-progress-label">Hoje</span><div class="exam-progress-track" role="progressbar" aria-label="Progresso até a prova" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="exam-progress-fill" style="width:${pct}%"></div></div><strong>${pct}%</strong><span class="exam-progress-days">${total} dias totais · ${elapsed} passaram · ${remaining} faltam</span>`;
  }
  function renderExamCountdown() {
    const input = document.getElementById("examDateInput");
    if (document.activeElement !== input) input.value = state.examDate || "";
    const fig = document.getElementById("examCountdownFigure");
    renderExamProgress();
    if (!state.examDate) {
      fig.textContent = "defina a data ao lado";
      fig.classList.remove("urgent");
      return;
    }
    const dias = diasParaRevisao(state.examDate);
    fig.classList.toggle("urgent", dias !== null && dias <= 7);
    if (dias === null) fig.textContent = "";
    else if (dias < 0) fig.textContent = "prova foi há " + pluralize(Math.abs(dias), "dia");
    else if (dias === 0) fig.textContent = "a prova é hoje!";
    else fig.textContent = "faltam " + pluralize(dias, "dia") + " para a prova";
  }
  function navigateKpi(tab, filter) {
    activateTab(tab);
    if (tab === "agenda" && filter === "overdue") {
      const select = document.getElementById("agendaFilterStatus");
      select.value = "Atrasadas";
      renderAgenda();
    }
    document.getElementById("panel-" + tab)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function completeUnifiedReview(id, origin) {
    if (origin === "Agenda de Revisões") {
      completeAgendaReview(id);
    } else {
      const item = state.calendar.find((x) => x.id === id);
      if (!item || item.status === "Concluído") return;
      updateCal(id, "status", "Concluído");
    }
    showToast("Revisão concluída e indicadores atualizados.");
  }
  function quickReviewButton(item, elId) {
    if (!String(elId || "").startsWith("hoje") || item.status === "Concluído") return "";
    return `<button type="button" class="btn small quick-review-btn" data-delegated-click="completeUnifiedReview('${escapeAttr(item.id)}','${escapeAttr(item.origem)}')">✓ Revisar</button>`;
  }
  function renderCalTarefasHoje(elId) {
    elId = elId || "calTarefasHoje";
    const today = todayISO(), items = getRevisoesUnificadas().filter((r) => r.date === today).sort((a, b) => (a.subject || "").localeCompare(b.subject || ""));
    const ul = document.getElementById(elId);
    if (!ul) return;
    if (!items.length) {
      ul.innerHTML = '<li class="upcoming-empty">Nenhuma tarefa para hoje. 🎉</li>';
      return;
    }
    ul.innerHTML = items.map((x) => `<li><span class="dias-pill dias-hoje" style="margin-right:6px">hoje</span><span style="flex:1">${escapeHtml(x.subject || "—")} · ${escapeHtml(unifiedItemLabel(x))} <span class="item-origin">(${x.origem})</span></span><span class="subject-progress-pill">${escapeHtml(x.status)}</span>${quickReviewButton(x, elId)}</li>`).join("");
  }
  function renderCalAtrasadas(elId) {
    elId = elId || "calAtrasadas";
    const today = todayISO(), items = getRevisoesUnificadas().filter((r) => r.date && r.date < today && r.status !== "Concluído").sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const ul = document.getElementById(elId);
    if (!ul) return;
    if (!items.length) {
      ul.innerHTML = '<li class="upcoming-empty">Nenhuma revisão atrasada. Tudo em dia!</li>';
      return;
    }
    const groups = /* @__PURE__ */ new Map();
    items.forEach((item) => {
      if (!groups.has(item.date)) groups.set(item.date, []);
      groups.get(item.date).push(item);
    });
    const entries = [...groups.entries()], limit = overdueGroupLimits[elId] || 3, visible = entries.slice(0, limit);
    if (!overdueExpansionInitialized.has(elId)) {
      overdueExpandedDates[elId].add(entries[0][0]);
      overdueExpansionInitialized.add(elId);
    }
    ul.innerHTML = `<li class="overdue-summary"><strong>${items.length} revisões atrasadas</strong><span>${entries.length} datas · mais antiga em ${formatDatePt(entries[0][0])}</span></li>` + visible.map(([date2, dateItems]) => {
      const expanded = overdueExpandedDates[elId].has(date2);
      return `<li class="overdue-group"><button type="button" class="overdue-group-title" aria-expanded="${expanded}" data-delegated-click="toggleOverdueDate('${elId}','${date2}')"><span><strong>${formatDatePt(date2)}</strong><small>${dateItems.length} revisão(ões) · ${Math.abs(diasParaRevisao(date2) || 0)} dias de atraso</small></span><span class="overdue-chevron" aria-hidden="true">›</span></button><ul ${expanded ? "" : "hidden"}>${dateItems.map((x) => `<li><span style="flex:1">${escapeHtml(x.subject || "—")} — ${escapeHtml(unifiedItemLabel(x))}<span class="item-origin">${x.origem}</span></span>${quickReviewButton(x, elId)}</li>`).join("")}</ul></li>`;
    }).join("") + `<li class="overdue-list-footer">${renderCollectionFooter({ variant: "block", total: entries.length, visible: visible.length, step: 3, label: "datas", showMoreAction: `changeOverdueGroupLimit('${elId}',3)`, showAllAction: `showAllOverdueGroups('${elId}')`, showLessAction: limit > 3 ? `resetOverdueGroupLimit('${elId}')` : "" })}</li>`;
  }
  function renderKPIs() {
    const resolved = state.questoes.reduce((n, q) => n + (Number(q.resolved) || 0), 0), accuracy2 = taxaAcertoGeral(), average2 = mediaSimulados(), late = revisoesAtrasadas(), target = state.metas.metaAprovacao;
    const hasResults = state.questoes.length + state.simulados.length > 0;
    document.getElementById("kpiGrid").innerHTML = `
    <button type="button" class="kpi-cell kpi-link" data-delegated-click="navigateKpi('questoes')"><div class="n">${resolved}</div><div class="l">Questões resolvidas</div></button>
    <button type="button" class="kpi-cell kpi-link ${hasResults ? accuracy2 >= target ? "ok" : "warn" : ""}" data-delegated-click="navigateKpi('questoes')"><div class="n">${accuracy2}%</div><div class="l">Taxa de acerto</div></button>
    <button type="button" class="kpi-cell kpi-link" data-delegated-click="navigateKpi('questoes')"><div class="n">${average2}%</div><div class="l">Média simulados</div></button>
    <button type="button" class="kpi-cell kpi-link ${late > 0 ? "warn" : ""}" data-delegated-click="navigateKpi('agenda','overdue')"><div class="n">${late}</div><div class="l">Revisões atrasadas</div></button>
    <button type="button" class="kpi-cell kpi-link ${hasResults ? accuracy2 >= target ? "ok" : "warn" : ""}" data-delegated-click="navigateKpi('metas')"><div class="n">${target}%</div><div class="l">Meta de aprovação</div></button>`;
  }
  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }
  var DELEGATED_ACTION_HANDLERS = {
    addAgendaRow,
    addBreakdownRow,
    addCalRow,
    addQuestaoRow,
    addSimuladoRow,
    addSubject,
    addTopic,
    applyTodayGoalToAllDays,
    archiveSubject,
    archiveTopic,
    clearWeekendGoals,
    calculateStudyPlanPreview,
    clearStudyPlanPreview,
    confirmStudyPlan,
    calculateDailyPlanPreview,
    clearDailyPlanPreview,
    confirmDailyPlanPreview,
    undoLatestDailyPlanGeneration,
    calculateReplanPreview,
    clearReplanPreview,
    confirmReplan,
    undoPlanAdjustment,
    cancelAgendaEdit,
    cancelCalendarEdit,
    cancelQuestionEdit,
    cancelSimulationEdit,
    cancelStudySessionEdit,
    changeAgendaLimit,
    changeCalendarLimit,
    changeOverdueGroupLimit,
    changePerformanceLimit,
    changeSubjectTopicLimit,
    changeUpcomingLimit,
    clearSessionHistoryFilters,
    completeAgendaReview,
    completeCalendarItem,
    completeUnifiedReview,
    deleteAgendaRow,
    deleteBreakdownRow,
    deleteCalRow,
    deleteMetaDisciplina,
    deleteQuestaoRow,
    deleteSimuladoRow,
    deleteStudySession,
    duplicateSubject,
    editAgenda,
    editCalendarItem,
    editQuestion,
    editSimulation,
    editStudySession,
    focusStudyTimer,
    gerarAgendaAutomatica,
    moveSubject,
    navigateKpi,
    renameSubject,
    selectHeatmapDay,
    setHeatmapFilter,
    viewSelectedHeatmapSessions,
    dismissIntelligentAlert,
    dismissStudyRecommendation,
    markRecommendationNotUseful,
    rateRecommendationOutcome,
    startStudyRecommendation,
    requestPermanentSubjectDelete,
    requestPermanentTopicDelete,
    resetAdaptiveReviewDate,
    resetAgendaLimit,
    resetCalendarLimit,
    resetOverdueGroupLimit,
    resetPerformanceLimit,
    resetRetentionLimit,
    resetSubjectTopicLimit,
    resetUpcomingLimit,
    restoreSubject,
    restoreTopic,
    saveAgendaEdit,
    saveCalendarEdit,
    saveQuestionEdit,
    setPerformanceViewMode,
    setRadarSubject,
    setRetentionFilter,
    setSubjectTopicFilter,
    saveSimulationEdit,
    saveStudySessionEdit,
    selectSessionHistoryDate,
    showAllOverdueGroups,
    showAllPerformance,
    showAllRetention,
    showAllSubjectTopics,
    showAllUpcoming,
    startPlannedActivity,
    toggleBreakdown,
    toggleNotes,
    toggleCompletedReviews,
    toggleFilterPanel,
    toggleOverdueDate,
    toggleQuestionErrors,
    toggleSessionDay,
    toggleSessionDetails,
    toggleStreakActiveDays,
    toggleStreakExpanded,
    toggleSubject,
    updateAgenda,
    updateAgendaDraft,
    updateBreakdownRow,
    updateCal,
    updateCalendarDraft,
    updateMeta,
    updateMetaDisciplina,
    updateMetaHoursDay,
    updateQuestionDraft,
    updateQuestionError,
    updateSessionHistoryFilter,
    setErrorAnalysisFilter,
    updateSimulationDraft,
    updateStudySessionDraft,
    updateTopic,
    updateTopicStatus,
    updateTopicTags,
    updateTopicStrategy,
    updateExamBlueprint,
    updateExamSubject
  };
  function delegatedArgument(expression, element) {
    const value2 = expression.trim();
    if (value2 === "this.value") return element.value;
    if (value2 === "this.value||null") return element.value || null;
    if (value2 === "this.textContent") return element.textContent;
    if (value2 === "this") return element;
    if (value2 === "true") return true;
    if (value2 === "false") return false;
    if (value2 === "null") return null;
    if (value2 === "parseLocalDate(todayISO()).getDay()") return parseLocalDate(todayISO()).getDay();
    if (/^-?\d+(?:\.\d+)?$/.test(value2)) return Number(value2);
    if (value2.startsWith("'") && value2.endsWith("'") || value2.startsWith('"') && value2.endsWith('"')) return value2.slice(1, -1).replace(/\\(['"\\])/g, "$1");
    throw new Error("Argumento de evento não permitido: " + value2);
  }
  function resolveDelegatedSpecial(normalized, event, element) {
    if (normalized === "performanceSubjectId=this.value;renderQuestionAnalytics()") {
      performanceSubjectId = element.value;
      renderQuestionAnalytics();
      return true;
    }
    const listMatch = normalized.match(/^changeListLimit\('(questions|simulations|sessionDays)',(-?)(?:LIST_VIEW_STEPS\.\1|listViewState\.\1Visible),(renderQuestoes|renderSimulados|renderStudySessionsHistory)\)$/);
    if (listMatch) {
      const delta = listMatch[2] ? -listViewState[`${listMatch[1]}Visible`] : LIST_VIEW_STEPS[listMatch[1]];
      const renderers = { renderQuestoes, renderSimulados, renderStudySessionsHistory };
      changeListLimit(listMatch[1], delta, renderers[listMatch[3]]);
      return true;
    }
    return false;
  }
  createDelegatedEventsController({ document, handlers: DELEGATED_ACTION_HANDLERS, parseArgument: delegatedArgument, resolveSpecial: resolveDelegatedSpecial, onError: (error) => {
    console.error("Evento delegado bloqueado", error);
    showToast("Uma ação inválida foi bloqueada por segurança.");
  } }).register();
  var RENDER_SCOPE_SECTIONS = {
    dashboard: /* @__PURE__ */ new Set(["dashboard de aprovação", "controles do cronômetro", "evolução do progresso", "heatmap", "conquistas", "radar", "visão geral", "horas estudadas", "histórico de sessões"]),
    disciplinas: /* @__PURE__ */ new Set(["disciplinas"]),
    calendario: /* @__PURE__ */ new Set(["indicadores do calendário", "tarefas de hoje", "tarefas atrasadas", "filtros do calendário", "calendário", "calendário mensal"]),
    agenda: /* @__PURE__ */ new Set(["filtros da agenda", "agenda"]),
    questoes: /* @__PURE__ */ new Set(["questões", "análise de questões", "simulados", "gráfico de simulados", "desempenho por disciplina"]),
    metas: /* @__PURE__ */ new Set(["metas", "configuração estratégica", "plano até a prova", "metas de horas por dia", "metas por disciplina", "histórico de metas", "ritmo"]),
    hoje: /* @__PURE__ */ new Set(["resumo executivo", "central de diagnóstico", "recomendação de estudo", "replanejamento", "tarefas da aba hoje", "atrasos da aba hoje", "simulados planejados", "metas de hoje", "alertas", "plano de hoje"])
  };
  function activeTabName() {
    return document.querySelector(".tab-btn.active")?.dataset.tab || "dashboard";
  }
  var applicationRenderer = createApplicationRenderer({
    sections: [
      ["indicadores", renderKPIs],
      ["dashboard de aprovação", renderApprovalDashboard],
      ["controles do cronômetro", populateTimerContextControls],
      ["cabeçalho", renderHeader],
      ["evolução do progresso", renderProgressChart],
      ["heatmap", renderHeatmap],
      ["conquistas", renderBadges],
      ["radar", renderRadarDisciplinas],
      ["visão geral", renderDashboard],
      ["horas estudadas", renderStudyHoursDashboard],
      ["histórico de sessões", renderStudySessionsHistory],
      ["disciplinas", renderSubjects],
      ["indicadores do calendário", renderCalIndicadores],
      ["tarefas de hoje", renderCalTarefasHoje],
      ["tarefas atrasadas", renderCalAtrasadas],
      ["filtros do calendário", renderCalendarFilters],
      ["calendário", renderCalendar],
      ["calendário mensal", renderMonthCalendar],
      ["filtros da agenda", renderAgendaFilters],
      ["agenda", renderAgenda],
      ["questões", renderQuestoes],
      ["análise de questões", renderQuestionAnalytics],
      ["simulados", renderSimulados],
      ["gráfico de simulados", renderSimuladosChart],
      ["desempenho por disciplina", renderDesempenhoDisciplina],
      ["metas", renderMetas],
      ["configuração estratégica", renderExamBlueprintConfig],
      ["plano até a prova", renderStudyPlanBuilder],
      ["metas de horas por dia", renderWeeklyHoursGoals],
      ["metas por disciplina", renderMetasPorDisciplina],
      ["histórico de metas", renderHistoricoMetas],
      ["ritmo", renderRitmo],
      ["resumo executivo", renderExecutiveSummary],
      ["central de diagnóstico", renderDiagnosisCenter],
      ["recomendação de estudo", renderStudyRecommendation],
      ["replanejamento", renderWeeklyReplan],
      ["tarefas da aba hoje", () => renderCalTarefasHoje("hojeTarefasHoje")],
      ["atrasos da aba hoje", () => renderCalAtrasadas("hojeAtrasadas")],
      ["simulados planejados", renderSimuladosPlanejados],
      ["metas de hoje", renderMetasHoje],
      ["alertas", renderAlertasInteligentes],
      ["plano de hoje", renderPlanoHoje]
    ],
    scopes: RENDER_SCOPE_SECTIONS,
    globalSections: ["indicadores", "cabeçalho"],
    getActiveScope: activeTabName,
    afterRender: labelDynamicControls,
    onError: (error, name) => console.error("Falha ao renderizar " + name, error)
  });
  function render(scope = "all") {
    return applicationRenderer.render(scope);
  }
  function persistAndRender() {
    render("active");
    scheduleSave();
  }
  function renderAll() {
    render();
  }
  navigationController.registerShortcuts();
  registerApplicationLifecycle({ window, onBeforeUnload: () => {
    if (!TEST_MODE && !suppressBeforeUnloadSave) writeLocalState(JSON.stringify(state));
  }, onResponsiveChange: () => {
    renderQuestoes();
    renderSimulados();
    renderStudySessionsHistory();
    renderAgenda();
    renderCalendar();
  } });
  setCalendarMobileView("month");
  var initialTab = location.hash.replace("#", "");
  if (document.querySelector(`.tab-btn[data-tab="${initialTab}"]`)) activateTab(initialTab, false);
  if (TEST_MODE) {
    const pristineTestState = structuredCloneSafe(state);
    window.__EXTRATO_TEST__ = {
      CURRENT_SCHEMA_VERSION,
      STATUS_OPTIONS,
      DIFFICULTY_OPTIONS,
      APP_MODE,
      IS_DEMO_MODE,
      getState: () => state,
      setState: (value2) => {
        state = migrateState(structuredCloneSafe(value2));
        ensureStateDefaults();
        return state;
      },
      resetState: () => {
        state = structuredCloneSafe(pristineTestState);
        ensureStateDefaults();
        return state;
      },
      migrateState: (value2) => migrateState(structuredCloneSafe(value2)),
      validateBackupData,
      validateNormalizedBackup,
      startOfWeek,
      isSameWeek,
      addDays,
      diasParaRevisao,
      parseLocalDate,
      todayISO,
      localDateFromTimestamp: localDateFromTimestamp2,
      calculateAdaptiveInterval,
      adaptiveReviewSuggestion,
      syncQuestionFromStudySession,
      getSubjectDependencies,
      getTopicDependencies,
      computeApprovalMetrics,
      indiceProntidao,
      readinessResult,
      calculateReadinessScore,
      computeStudyPriorities,
      topicRetentionScore,
      topicMasteryIndex,
      intelligenceCandidates,
      studyPlanCandidates,
      buildStudyPlan,
      renderAll,
      sha256,
      rotateAutomaticBackup,
      StorageManager,
      structuredCloneSafe
    };
    ensureStateDefaults();
    restoreTimerFromState();
    render();
    const testScript = document.createElement("script");
    testScript.src = "tests/tests.js";
    document.body.appendChild(testScript);
  } else {
    bootstrapApplication({ context: appContext, start: loadState, onError: (error) => console.error("Falha na inicialização do aplicativo", error) });
  }
})();
