/**
 * Readiness Widget — version contract.
 *
 * PROTOTYPE_VERSION identifies the exact review surface a finding belongs
 * to. Bump the suffix every time the prototype under review changes in a
 * way that could invalidate prior answers (new screens, changed rules,
 * reworded flows). Findings are forever tied to the version they were
 * recorded against — never rewritten onto a newer version.
 */
export const PROJECT_ID = 'nexaccred';
export const PROTOTYPE_VERSION = '1.0.0-pilot.1';
export const WIDGET_VERSION = '0.1.0';
