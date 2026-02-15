import { ColorDefinition } from "./types";

export const APP_ID = "studapp-platform";

export const ICON_LIBRARY = [
  'fa-book', 'fa-bolt', 'fa-coffee', 'fa-dumbbell', 
  'fa-utensils', 'fa-language', 'fa-music', 'fa-users', 
  'fa-moon', 'fa-laptop', 'fa-graduation-cap', 'fa-clock'
];

export const COLOR_LIBRARY: ColorDefinition[] = [
  { 
      value: 'red', 
      hex: '#ef4444', 
      style: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' 
  },
  { 
      value: 'blue', 
      hex: '#3b82f6', 
      style: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' 
  },
  { 
      value: 'emerald', 
      hex: '#10b981', 
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
  },
  { 
      value: 'amber', 
      hex: '#f59e0b', 
      style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' 
  },
  { 
      value: 'indigo', 
      hex: '#6366f1', 
      style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' 
  },
  { 
      value: 'rose', 
      hex: '#f43f5e', 
      style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' 
  },
  { 
      value: 'slate', 
      hex: '#64748b', 
      style: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' 
  }
];

export const COLOR_STYLES: Record<string, string> = COLOR_LIBRARY.reduce((acc, curr) => {
    acc[curr.value] = curr.style;
    return acc;
}, {} as Record<string, string>);
