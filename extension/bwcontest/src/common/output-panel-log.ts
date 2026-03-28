import { window } from 'vscode';

/** Logs to the Output panel of a team's VS Code instance. Useful for diagnosing issues.
 *
 * Do NOT output anything secret here. */
export const outputPanelLog = window.createOutputChannel('BWContest Log', { log: true });
