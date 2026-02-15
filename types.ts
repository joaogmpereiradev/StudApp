export interface Review {
  name: string;
  date: string;
  done: boolean;
}

export interface Lesson {
  id: string;
  subject: string;
  topic: string;
  date: string;
  revs: Review[];
}

export interface RoutineActivity {
  id: string;
  time: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  type: 'weekday' | 'weekend';
}

export interface UserSettings {
  isDarkMode: boolean;
}

export type ViewState = 'routine' | 'reviews';

// Color types for safety
export type ColorVariant = 'red' | 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate';

export interface ColorDefinition {
  value: ColorVariant;
  hex: string;
  style: string;
}
