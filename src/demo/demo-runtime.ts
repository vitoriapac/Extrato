// Lazy bundle (F11): the demo scenario and its builders load only when the demonstration opens.
import { generateDemoData } from './demo-generator.js';

(globalThis as Record<string, any>).StudyTrackDemo = { generateDemoData };
