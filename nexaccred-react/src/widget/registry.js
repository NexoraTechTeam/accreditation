/**
 * Widget host registry — lets script-tag / vanilla hosts drive the mounted
 * React widget without importing React (reference API parity:
 * RequirementReadiness.open/ask/reset).
 */
import { PROJECT_ID } from './version';

const handles = {};

export function registerWidget(project, handle) {
  handles[project || PROJECT_ID] = handle;
}

export function widgetHandle(project) {
  return handles[project || PROJECT_ID] || Object.values(handles)[0] || null;
}
