/**
 * Configuration settings for the calendar plugin.
 * These settings control calendar appearance and behavior.
 * Modified through the settings tab and persisted to plugin data.
 */
export interface CalendarPluginSettings {
  /** Delay in milliseconds before updating calendar after vault changes */
  updateDelayms: number;
  /** Day the week starts on (0=Sunday, 1=Monday, etc.) */
  startOfWeek: string;
  /** Luxon format string for displaying month/year header (e.g., "YYYY-MM") */
  monthFormat: string;
  /** Whether to display the table header with day names */
  displayHead: boolean;
  /** Whether to allow HTML in event text (potential security risk) */
  enableHTML: boolean;
  /** Custom label for Sunday column */
  Sunday: string;
  /** Custom label for Monday column */
  Monday: string;
  /** Custom label for Tuesday column */
  Tuesday: string;
  /** Custom label for Wednesday column */
  Wednesday: string;
  /** Custom label for Thursday column */
  Thursday: string;
  /** Custom label for Friday column */
  Friday: string;
  /** Custom label for Saturday column */
  Saturday: string;
}

/**
 * Default settings for the calendar plugin.
 * Used when the plugin is first installed or when settings are reset.
 * Referenced by CalendarSettingTab when user clears custom values.
 */
export const DEFAULT_SETTINGS: CalendarPluginSettings = {
  updateDelayms: 3000,
  startOfWeek: '0',
  monthFormat: 'YYYY-MM',
  displayHead: true,
  enableHTML: false,
  Sunday: 'SUN',
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
  Saturday: 'SAT'
}
