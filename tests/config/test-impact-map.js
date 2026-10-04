export const impactMapVersion=1;
export const globalImpactSources=[
  'src/app.js','src/state/**','src/storage/**','src/repositories/**','src/core/**',
  'src/domain/planning/plan-execution-snapshot.js','src/domain/planning/plan-priority-snapshot.js',
  'src/domain/planning/execution-contract.js','src/application/exams/evidence-scope-migration.js',
  'scripts/**','tests/config/**','tests/e2e/helpers/**','tests/e2e/helpers.js',
  '.github/**','playwright*.config.js','package.json','package-lock.json',
  'index.html','manifest.webmanifest','service-worker.js','service-worker.template.js'
];
export const impactAreas=[
  {id:'recovery',sources:['src/application/recovery/**','src/ui/controllers/recovery-controller.js','src/ui/performance/recovery-plan-renderer.js'],units:['recovery*.test.js','adaptive-planning.test.js','planning-services.test.js'],journeys:['achievement-projection.spec.js']},
  {id:'adherence',sources:['src/application/adherence/**','src/application/planning-sustainability/**','src/domain/planning/sustainability-policy.js','src/ui/controllers/sustainability-controller.js','src/ui/renderers/*adherence*.js','src/ui/renderers/sustainability-renderer.js'],units:['*adherence*.test.js','*sustainability*.test.js','capacity-review-preview.test.js','execution-contract.test.js','daily-session-reconciliation.test.js'],journeys:['weekly-adherence.spec.js','daily-execution.spec.js']},
  {id:'planning',sources:['src/application/planning/**','src/domain/planning/**','src/application/replan-study.js'],units:['*planning*.test.js','*plan*.test.js','weekly-availability.test.js','daily-session-reconciliation.test.js'],journeys:['strategic-cycle.spec.js','daily-execution.spec.js']},
  {id:'performance',sources:['src/application/performance/**','src/ui/performance/**','src/ui/controllers/performance-controller.js'],units:['performance*.test.js','*comparison*.test.js','*adherence*.test.js','*projection*.test.js'],journeys:['strategic-cycle.spec.js','sessions.spec.js']},
  {id:'projection',sources:['src/application/projection/**','src/domain/forecasts/**','src/ui/controllers/projection-controller.js'],units:['*projection*.test.js','performance-forecast.test.js','recovery*.test.js'],journeys:['achievement-projection.spec.js','strategic-cycle.spec.js']},
  {id:'exam',sources:['src/application/exam-intelligence/**','src/application/exams/**','src/domain/exam-intelligence/**','src/domain/exams/**','src/application/subjects/*import*.js'],units:['*exam*.test.js','*incidence*.test.js','intelligence-integration.test.js','import-exam-json.test.js'],journeys:['exam-json-import.spec.js','strategic-cycle.spec.js']},
  {id:'sessions',sources:['src/application/sessions/**','src/domain/sessions/**','src/application/questions/**','src/application/simulations/**'],units:['*session*.test.js','execution-contract.test.js','*adherence*.test.js','*simulation*.test.js'],journeys:['daily-execution.spec.js','sessions.spec.js']},
  {id:'demo',sources:['src/demo/**'],units:['demo*.test.js'],journeys:['achievement-projection.spec.js','strategic-cycle.spec.js','responsive-smoke.spec.js']},
  {id:'visual',sources:['styles/**','icons/**'],units:[],journeys:['responsive-smoke.spec.js']}
];
