export interface HabitTrackerPluginSettings {
  startOfWeek: string;
  monthFormat: string;
  displayHead: boolean;
  enableHTML: boolean;
  Sunday: string;
  Monday: string;
  Tuesday: string;
  Wednesday: string;
  Thursday: string;
  Friday: string;
  Saturday: string;
}

export const DEFAULT_SETTINGS: HabitTrackerPluginSettings = {
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
