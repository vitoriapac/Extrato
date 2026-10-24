// Ratios preserve the existing strategy; mocks remain independently scheduled.
export const PHASE_ACTIVITY_RATIOS = Object.freeze({
  construction: Object.freeze([0.6, 0.25, 0.15]),
  consolidation: Object.freeze([0.35, 0.4, 0.25]),
  final_stretch: Object.freeze([0.2, 0.5, 0.3]),
  final_review: Object.freeze([0.1, 0.4, 0.5]),
});
export const PHASE_ACTIVITY_KEYS = Object.freeze(['theory', 'questions', 'reviews']);
