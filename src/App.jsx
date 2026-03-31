import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudOff,
  Coffee,
  Edit2,
  History,
  Lightbulb,
  ListTodo,
  LogIn,
  LogOut,
  Moon,
  Palette,
  PieChart,
  Plus,
  Receipt,
  Rocket,
  Search,
  ShieldCheck,
  Sun,
  Tag,
  Target,
  Trash2,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getFirestore, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

const APP_NAME = 'Dory 2.0';
const APP_TAGLINE = 'Dory se souvient pour toi';

const LOGO_OPTIONS = [
  { id: 'rocket', icon: Rocket },
  { id: 'zap', icon: Zap },
  { id: 'lightbulb', icon: Lightbulb },
  { id: 'target', icon: Target },
  { id: 'coffee', icon: Coffee },
];

const TAG_COLORS = [
  'bg-pink-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-fuchsia-500',
];

const COLUMNS = [
  {
    id: 'todo',
    color: 'bg-violet-600',
    accent: 'border-violet-500',
    light: 'bg-violet-50/60',
    badge: 'bg-violet-500/30 border-violet-300/30',
  },
  {
    id: 'inprogress',
    color: 'bg-blue-600',
    accent: 'border-blue-500',
    light: 'bg-blue-50/60',
    badge: 'bg-blue-500/30 border-blue-300/30',
  },
  {
    id: 'waiting',
    color: 'bg-amber-500',
    accent: 'border-amber-500',
    light: 'bg-amber-50/60',
    badge: 'bg-amber-500/30 border-amber-300/30',
  },
  {
    id: 'done',
    color: 'bg-emerald-600',
    accent: 'border-emerald-500',
    light: 'bg-emerald-50/60',
    badge: 'bg-emerald-500/30 border-emerald-300/30',
  },
];

const DEFAULT_TAGS = [
  { id: '1', name: 'Général', color: 'bg-slate-500' },
  { id: '2', name: 'Travail', color: 'bg-indigo-500' },
  { id: '3', name: 'Perso', color: 'bg-emerald-500' },
  { id: '4', name: 'Urgent', color: 'bg-red-500' },
];

const DEFAULT_COLUMN_NAMES = {
  todo: '🧩 À faire',
  inprogress: '🔄 En cours',
  waiting: '👀 Attente',
  done: '✅ Terminé',
};

const DEFAULT_TASKS = [
  {
    id: 1,
    text: 'Finaliser le rapport mensuel',
    category: 'todo',
    priority: 3,
    tag: 'Travail',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2))
      .toISOString()
      .split('T')[0],
    note: 'Vérifier les chiffres du Q1.',
    subtasks: [
      { id: 's1', text: 'Rassembler les chiffres', done: true },
      { id: 's2', text: 'Relire la synthèse', done: false },
      { id: 's3', text: 'Envoyer au manager', done: false },
    ],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_TIMESHEET_ENTRIES = [
  {
    id: 'ts1',
    date: new Date().toISOString().split('T')[0],
    taskId: 1,
    project: 'Travail',
    description: 'Analyse du rapport mensuel',
    hours: 2.5,
  },
  {
    id: 'ts2',
    date: new Date().toISOString().split('T')[0],
    taskId: null,
    project: 'Admin',
    description: 'Emails et suivi',
    hours: 1.0,
  },
];

const DEFAULT_TASK_FORM = {
  text: '',
  note: '',
  priority: '2',
  tag: 'Général',
  dueDate: '',
};

const DEFAULT_TIMESHEET_FORM = {
  date: new Date().toISOString().split('T')[0],
  taskId: '',
  project: 'Travail',
  description: '',
  hours: '1',
};

const viteEnv = typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: viteEnv.VITE_FIREBASE_API_KEY || '',
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: viteEnv.VITE_FIREBASE_APP_ID || '',
};

const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

const firebaseApp = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const googleProvider = firebaseApp ? new GoogleAuthProvider() : null;

const getPriorityStyles = (priority, darkMode) =>
  priority === 1
    ? {
        card: darkMode ? 'border-emerald-500/30 bg-slate-900/90' : 'border-emerald-200 bg-white',
        bar: 'bg-emerald-500',
        badge: darkMode ? 'bg-emerald-950/60 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
        label: 'Basse',
      }
    : priority === 2
      ? {
          card: darkMode ? 'border-amber-500/30 bg-slate-900/90' : 'border-amber-200 bg-white',
          bar: 'bg-amber-500',
          badge: darkMode ? 'bg-amber-950/60 text-amber-300' : 'bg-amber-100 text-amber-700',
          label: 'Moyenne',
        }
      : {
          card: darkMode ? 'border-red-500/30 bg-slate-900/90' : 'border-red-200 bg-white',
          bar: 'bg-red-500',
          badge: darkMode ? 'bg-red-950/60 text-red-300' : 'bg-red-100 text-red-700',
          label: 'Haute',
        };

const getDueDateMeta = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { shortLabel: 'Aujourd’hui', detailLabel: 'Échéance aujourd’hui', diffDays };
  }

  if (diffDays > 0) {
    return {
      shortLabel: `J+${diffDays}`,
      detailLabel: `${diffDays} jour${diffDays > 1 ? 's' : ''} de retard`,
      diffDays,
    };
  }

  const daysRemaining = Math.abs(diffDays);
  return {
    shortLabel: `J-${daysRemaining}`,
    detailLabel: `Dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
    diffDays,
  };
};

const getTaskStatus = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 3) return 'retard';
  if (diffDays >= 0) return 'urgent';
  return 'ok';
};

const getDeadlineBadgeClass = (status, darkMode) =>
  status === 'retard'
    ? darkMode
      ? 'bg-red-950/60 text-red-300'
      : 'bg-red-100 text-red-700'
    : status === 'urgent'
      ? darkMode
        ? 'bg-amber-950/60 text-amber-300'
        : 'bg-amber-100 text-amber-700'
      : darkMode
        ? 'bg-indigo-950/60 text-indigo-300'
        : 'bg-indigo-100 text-indigo-700';

const getPressureMeta = (load) =>
  load >= 70
    ? {
        label: 'Alerte',
        emoji: '🚨',
        bar: 'bg-red-400/90',
        glow: 'shadow-[0_0_18px_rgba(248,113,113,0.45)]',
        text: 'text-red-100',
      }
    : load >= 40
      ? {
          label: 'Soutenu',
          emoji: '⚠️',
          bar: 'bg-amber-300/90',
          glow: 'shadow-[0_0_14px_rgba(252,211,77,0.35)]',
          text: 'text-amber-50',
        }
      : {
          label: 'Stable',
          emoji: '✨',
          bar: 'bg-emerald-300/90',
          glow: 'shadow-[0_0_12px_rgba(110,231,183,0.28)]',
          text: 'text-emerald-50',
        };

const getSubtasksProgress = (subtasks = []) =>
  !subtasks.length
    ? 0
    : Math.round((subtasks.filter((subtask) => subtask.done).length / subtasks.length) * 100);

const formatHours = (hours) => `${Number(hours || 0).toFixed(1)} h`;

const readLocalPayload = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('dory2-data');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeLocalPayload = (payload) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('dory2-data', JSON.stringify(payload));
};

const clearLocalPayload = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('dory2-data');
};

const normalizeTagName = (value) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const parseQuickTaskInput = (rawText, availableTags) => {
  const source = rawText.trim();

  const tagMatches = [...source.matchAll(/(^|\s)#([^\s#@!]+)/g)].map((m) => m[2]);
  const hasHighPriority = /(^|\s)!+(?=\s|$)/.test(source);
  const hasToday = /(^|\s)@(aujourd'hui|aujourdhui|today)(?=\s|$)/i.test(source);
  const hasTomorrow = /(^|\s)@(demain|tomorrow)(?=\s|$)/i.test(source);

  const cleanedText = source
    .replace(/(^|\s)#([^\s#@!]+)/g, ' ')
    .replace(/(^|\s)!+(?=\s|$)/g, ' ')
    .replace(/(^|\s)@(aujourd'hui|aujourdhui|today|demain|tomorrow)(?=\s|$)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const detectedTagRaw = tagMatches.length ? tagMatches[tagMatches.length - 1] : '';
  const detectedTagNormalized = normalizeTagName(detectedTagRaw);

  const matchingTag = availableTags.find(
    (tag) => normalizeTagName(tag.name) === detectedTagNormalized,
  );

  const detectedTagName = matchingTag
    ? matchingTag.name
    : detectedTagRaw
      ? detectedTagRaw.charAt(0).toUpperCase() + detectedTagRaw.slice(1)
      : null;

  let dueDate = '';
  if (hasToday) {
    dueDate = new Date().toISOString().split('T')[0];
  } else if (hasTomorrow) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = tomorrow.toISOString().split('T')[0];
  }

  return {
    cleanedText,
    detectedTagName,
    shouldCreateTag: Boolean(detectedTagName && !matchingTag),
    priority: hasHighPriority ? '3' : null,
    dueDate: dueDate || null,
  };
};

const runDevAssertions = () => {
  if (typeof window === 'undefined') return;

  const parsed = parseQuickTaskInput('Appeler Julie #travail ! @demain', DEFAULT_TAGS);
  console.assert(parsed.cleanedText === 'Appeler Julie', 'Quick input should clean markers');
  console.assert(parsed.detectedTagName === 'Travail', 'Quick input should resolve tag');
  console.assert(parsed.priority === '3', 'Quick input should detect priority');
  console.assert(Boolean(parsed.dueDate), 'Quick input should detect due date');

  const progress = getSubtasksProgress([
    { id: '1', text: 'a', done: true },
    { id: '2', text: 'b', done: false },
  ]);
  console.assert(progress === 50, 'Subtask progress should be 50');
};

const DoryLogo = ({ compact = false }) => (
  <div className={`relative ${compact ? 'h-11 w-11' : 'h-14 w-14'}`}>
    <div className="absolute inset-0 rounded-[1.4rem] bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 shadow-[0_10px_30px_rgba(79,70,229,0.35)]" />
    <div className="absolute inset-[2px] rounded-[1.25rem] bg-slate-950/15 backdrop-blur-[2px]" />
    <div className="absolute inset-0 flex items-center justify-center text-white">
      <div className="relative flex items-center justify-center">
        <div className={`font-black leading-none ${compact ? 'text-xl' : 'text-2xl'}`}>D</div>
        <div
          className={`absolute -bottom-3 -right-4 rounded-full border border-white/30 bg-white/20 px-1.5 py-0.5 font-black tracking-[0.18em] text-white/95 ${compact ? 'text-[7px]' : 'text-[8px]'}`}
        >
          2.0
        </div>
      </div>
    </div>
    <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
  </div>
);

const ToastViewport = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`px-4 py-3 rounded-2xl text-sm shadow-lg transition-all flex items-center justify-between gap-3 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'
        }`}
      >
        <span>{toast.message}</span>
        <div className="flex items-center gap-2">
          {toast.actionLabel && toast.onAction && (
            <button onClick={toast.onAction} className="underline text-xs font-bold">
              {toast.actionLabel}
            </button>
          )}
          <button onClick={() => onDismiss(toast.id)} className="text-white/80 hover:text-white">
            <X size={14} />
          </button>
        </div>
      </div>
    ))}
  </div>
);

const TaskSubtasks = ({ task, darkMode, onToggle, onAddSubtask, archived = false }) => {
  const subtasks = task.subtasks || [];
  const [newSubtask, setNewSubtask] = useState('');

  const handleAddSubtask = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed || archived) return;
    onAddSubtask(task.id, trimmed);
    setNewSubtask('');
  };

  const subtasksProgress = getSubtasksProgress(subtasks);
  const doneCount = subtasks.filter((subtask) => subtask.done).length;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-brand uppercase text-slate-400">Sous-tâches</span>
        <span className="text-[10px] font-brand uppercase text-slate-500">
          {doneCount}/{subtasks.length}
        </span>
      </div>

      {subtasks.length > 0 && (
        <React.Fragment>
          <div
            className={`h-1.5 rounded-full overflow-hidden mb-3 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
          >
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${subtasksProgress}%` }} />
          </div>

          <div className="space-y-2 mb-3">
            {subtasks.map((subtask) => (
              <label
                key={subtask.id}
                className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 border ${
                  darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={subtask.done}
                  onChange={() => onToggle(task.id, subtask.id, archived)}
                  className="accent-indigo-600"
                />
                <span
                  className={
                    subtask.done
                      ? 'line-through text-slate-400'
                      : darkMode
                        ? 'text-slate-200'
                        : 'text-slate-700'
                  }
                >
                  {subtask.text}
                </span>
              </label>
            ))}
          </div>
        </React.Fragment>
      )}

      {!archived && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
            placeholder="Ajouter une sous-tâche..."
            className={`flex-1 px-3 py-2 rounded-xl outline-none text-xs ${
              darkMode
                ? 'bg-slate-800 text-white placeholder:text-slate-500'
                : 'bg-slate-50 text-slate-700 placeholder:text-slate-400'
            }`}
          />
          <button
            type="button"
            onClick={handleAddSubtask}
            className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-brand uppercase"
          >
            Ajouter
          </button>
        </div>
      )}
    </div>
  );
};

const Heatmap = ({ entries, darkMode, tags }) => {
  const projectColors = {
    Travail: darkMode ? 'rgba(99,102,241,VAR)' : 'rgba(79,70,229,VAR)',
    Perso: darkMode ? 'rgba(16,185,129,VAR)' : 'rgba(5,150,105,VAR)',
    Admin: darkMode ? 'rgba(148,163,184,VAR)' : 'rgba(100,116,139,VAR)',
    Général: darkMode ? 'rgba(168,85,247,VAR)' : 'rgba(147,51,234,VAR)',
    Urgent: darkMode ? 'rgba(239,68,68,VAR)' : 'rgba(220,38,38,VAR)',
  };

  const byDate = {};
  entries.forEach((entry) => {
    if (!byDate[entry.date]) {
      byDate[entry.date] = { total: 0, byProject: {} };
    }
    byDate[entry.date].total += Number(entry.hours || 0);
    byDate[entry.date].byProject[entry.project] =
      (byDate[entry.date].byProject[entry.project] || 0) + Number(entry.hours || 0);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 83);
  const dayOfWeek = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dayOfWeek);

  const cells = [];
  for (let i = 0; i < 84; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const key = current.toISOString().split('T')[0];
    const dayData = byDate[key] || { total: 0, byProject: {} };
    const topProjectEntry = Object.entries(dayData.byProject).sort((a, b) => b[1] - a[1])[0];
    const topProject = topProjectEntry ? topProjectEntry[0] : null;
    const intensity = Math.min(1, dayData.total / 6);
    const colorTemplate = projectColors[topProject] || (darkMode ? 'rgba(99,102,241,VAR)' : 'rgba(79,70,229,VAR)');
    const backgroundColor = dayData.total
      ? colorTemplate.replace('VAR', String(0.2 + intensity * 0.75))
      : darkMode
        ? 'rgba(30,41,59,0.45)'
        : 'rgba(226,232,240,0.7)';

    cells.push({
      key,
      hours: dayData.total,
      topProject,
      isCurrentMonth: current.getMonth() === today.getMonth(),
      backgroundColor,
    });
  }

  const months = [];
  let lastMonth = '';
  cells.forEach((cell, index) => {
    const d = new Date(cell.key);
    const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short' });
    if (monthLabel !== lastMonth) {
      months.push({ index, label: monthLabel });
      lastMonth = monthLabel;
    }
  });

  const weekRows = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div className="relative grid grid-cols-12 gap-2 flex-1">
          {months.map((month) => (
            <span
              key={`${month.label}-${month.index}`}
              className="text-[10px] font-brand uppercase tracking-[0.16em] text-slate-400"
              style={{ gridColumnStart: Math.floor(month.index / 7) + 1 }}
            >
              {month.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="grid grid-rows-7 gap-2 pt-0.5">
          {weekRows.map((day, index) => (
            <span key={`${day}-${index}`} className="h-4 text-[9px] font-brand uppercase text-slate-400 flex items-center">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-flow-col grid-rows-7 gap-2 overflow-x-auto pb-1">
          {cells.map((cell) => (
            <div
              key={cell.key}
              title={`${cell.key} — ${cell.hours.toFixed(1)}h${cell.topProject ? ` — ${cell.topProject}` : ''}`}
              className={`h-4 w-4 rounded-[5px] border transition-transform hover:scale-110 ${darkMode ? 'border-slate-800' : 'border-slate-200'} ${cell.isCurrentMonth ? '' : 'opacity-60'}`}
              style={{ backgroundColor: cell.backgroundColor }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-brand uppercase tracking-[0.14em] text-slate-400">
        <span>Moins</span>
        <div className="flex items-center gap-1.5">
          {[0.18, 0.35, 0.55, 0.75, 0.95].map((alpha, index) => (
            <span
              key={index}
              className={`h-3 w-3 rounded-[4px] border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
              style={{ backgroundColor: `rgba(79,70,229,${alpha})` }}
            />
          ))}
        </div>
        <span>Plus</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[...new Set(tags.map((tag) => tag.name).concat(['Admin']))].map((tagName) => {
          const colorTemplate = projectColors[tagName] || (darkMode ? 'rgba(99,102,241,0.75)' : 'rgba(79,70,229,0.75)');
          return (
            <span
              key={tagName}
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-brand uppercase ${darkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorTemplate.replace('VAR', '0.85') }} />
              {tagName}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const DORY_MOODS = [
    'Tu gères aujourd’hui 💪',
    'Petit pas, gros progrès ✨',
    'Dory est avec toi, on avance 🫶',
    'Encore une mission et ça roule 🚀',
    'Respire, priorise, puis fonce 🌈',
  ];

  const getDoryMessage = ({ tasks, lateTasks, urgentTasks, completionRate, activeView, focusMode }) => {
    if (focusMode) return 'Mode focus activé. Une chose à la fois 🎯';
    if (activeView === 'timesheet') return 'Chaque heure compte. Ton Timesheet raconte tes progrès ⏱️';
    if (lateTasks > 0) {
      return `On reprend la main : ${lateTasks} tâche${lateTasks > 1 ? 's' : ''} en retard, mais rien d’insurmontable 💥`;
    }
    if (urgentTasks > 0) {
      return `Priorité du jour : ${urgentTasks} tâche${urgentTasks > 1 ? 's' : ''} urgente${urgentTasks > 1 ? 's' : ''} ⏰`;
    }
    if (completionRate === 100 && tasks > 0) return 'Tout est terminé. Dory est super fière de toi 🏆';
    if (tasks === 0) return 'Page blanche. On crée une première mission ? ✍️';
    return DORY_MOODS[Math.floor(Math.random() * DORY_MOODS.length)];
  };

  const getDorySuggestions = ({
    tasks,
    doneTasks,
    lateTasks,
    urgentTasks,
    activeView,
    topProject,
    totalHours,
    focusMode,
  }) => {
    if (focusMode) {
      return [
        'Coupe les distractions pendant 10 minutes et termine une seule étape.',
        'Ajoute une sous-tâche si la mission te paraît trop grosse.',
      ];
    }

    if (activeView === 'timesheet') {
      return [
        totalHours === 0
          ? 'Ajoute une première entrée aujourd’hui pour démarrer ton historique.'
          : `Ton projet le plus actif est “${topProject || '—'}”. Vérifie s’il mérite plus de temps ou une priorité claire.`,
        'Lie tes entrées à une tâche pour mieux suivre ce qui avance vraiment.',
      ];
    }

    if (lateTasks > 0) {
      return [
        'Commence par la tâche la plus ancienne en retard, même 15 minutes suffisent pour relancer la machine.',
        'Déplace une tâche non essentielle en “Attente” pour alléger la pression.',
      ];
    }

    if (urgentTasks > 0) {
      return [
        'Choisis une seule tâche urgente comme mission principale du moment.',
        'Si une tâche urgente bloque, ajoute une note ou une sous-tâche pour clarifier le prochain pas.',
      ];
    }

    if (tasks > 0 && doneTasks === 0) {
      return [
        'Vise une petite victoire rapide : termine ou avance une tâche de moins de 10 minutes.',
        'Trie tes tâches par priorité et monte-en une en “En cours” pour lancer la journée.',
      ];
    }

    if (tasks >= 5) {
      return [
        'Tu as une belle charge : passe 1 ou 2 tâches en focus au lieu de tout garder en tête.',
        'Regroupe les tâches d’un même tag pour avancer par bloc d’énergie.',
      ];
    }

    if (tasks === 0) {
      return [
        'Ajoute ta prochaine action concrète, même minuscule.',
        'Tu peux aussi préparer ton Timesheet pour garder une trace de ta journée.',
      ];
    }

    return [
      'Ton board est plutôt sain : choisis la prochaine action la plus simple et avance sans te disperser.',
      'Pense à archiver ce qui est terminé pour garder un espace clair.',
    ];
  };

  const [focusMode, setFocusMode] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLogo, setCurrentLogo] = useState('rocket');
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [showNoteField, setShowNoteField] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskDraft, setEditingTaskDraft] = useState('');
  const [editingNoteDraft, setEditingNoteDraft] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [pendingLocalSync, setPendingLocalSync] = useState(false);
  const [dismissedReminderDate, setDismissedReminderDate] = useState('');

  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [newTagName, setNewTagName] = useState('');
  const [columnNames, setColumnNames] = useState(DEFAULT_COLUMN_NAMES);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [form, setForm] = useState(DEFAULT_TASK_FORM);
  const [timesheetEntries, setTimesheetEntries] = useState(DEFAULT_TIMESHEET_ENTRIES);
  const [timesheetForm, setTimesheetForm] = useState(DEFAULT_TIMESHEET_FORM);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseReady);
  const [dataHydrated, setDataHydrated] = useState(!firebaseReady);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [avatarError, setAvatarError] = useState(false);
  const [doryPulse, setDoryPulse] = useState(0);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [installSupported, setInstallSupported] = useState(false);

  const inputRef = useRef(null);
  const undoTimeoutsRef = useRef({});

  const removeToast = (toastId) => {
    if (undoTimeoutsRef.current[toastId]) {
      clearTimeout(undoTimeoutsRef.current[toastId]);
      delete undoTimeoutsRef.current[toastId];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  };

  const addToast = (message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration ?? 2500;
    const toast = {
      id,
      message,
      type,
      actionLabel: options.actionLabel || null,
      onAction: options.onAction || null,
    };

    setToasts((prev) => [...prev, toast]);
    const timeoutId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete undoTimeoutsRef.current[id];
    }, duration);
    undoTimeoutsRef.current[id] = timeoutId;
    return id;
  };

  const buildPayload = (overrides = {}) => ({
    darkMode,
    activeView,
    currentLogo,
    tags,
    columnNames,
    tasks,
    archivedTasks,
    timesheetEntries,
    ...overrides,
  });

  useEffect(() => {
    runDevAssertions();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = event.target?.tagName;
      const isTypingField = tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable;
      if (isTypingField) return;

      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
      if (event.key === 'Escape') {
        setShowSettings(false);
        setShowTagEditor(false);
        setShowStats(false);
        setShowArchive(false);
        setShowLogoPicker(false);
        if (focusMode) {
          setFocusMode(false);
          setFocusedTaskId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  useEffect(() => {
    return () => {
      Object.values(undoTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.photoURL]);

  useEffect(() => {
    if (user || localLoaded) return;
    const localPayload = readLocalPayload();
    if (localPayload) {
      setDarkMode(localPayload.darkMode ?? false);
      setActiveView(localPayload.activeView ?? 'board');
      setCurrentLogo(localPayload.currentLogo ?? 'rocket');
      setTags(localPayload.tags ?? DEFAULT_TAGS);
      setColumnNames(localPayload.columnNames ?? DEFAULT_COLUMN_NAMES);
      setTasks(localPayload.tasks ?? DEFAULT_TASKS);
      setArchivedTasks(localPayload.archivedTasks ?? []);
      setTimesheetEntries(localPayload.timesheetEntries ?? DEFAULT_TIMESHEET_ENTRIES);
      setPendingLocalSync(true);
    }
    setLocalLoaded(true);
    if (!firebaseReady) setDataHydrated(true);
  }, [user, localLoaded]);

  useEffect(() => {
    if (user || !localLoaded) return;
    writeLocalPayload(buildPayload());
  }, [
    user,
    localLoaded,
    darkMode,
    activeView,
    currentLogo,
    tags,
    columnNames,
    tasks,
    archivedTasks,
    timesheetEntries,
  ]);

  useEffect(() => {
    if (!db || !user) {
      setDataHydrated(true);
      return;
    }

    setDataHydrated(false);
    setSaveError('');
    const stateRef = doc(db, 'users', user.uid, 'app', 'state');

    return onSnapshot(
      stateRef,
      async (snapshot) => {
        const cloudPayload = snapshot.data()?.payload || null;
        let nextPayload = cloudPayload;

        if (pendingLocalSync) {
          const localPayload = readLocalPayload();
          if (localPayload) {
            nextPayload = { ...(cloudPayload || {}), ...localPayload };
            await setDoc(
              stateRef,
              {
                payload: nextPayload,
                updatedAt: serverTimestamp(),
                owner: {
                  uid: user.uid,
                  email: user.email || '',
                  name: user.displayName || '',
                },
              },
              { merge: true },
            );
            clearLocalPayload();
          }
          setPendingLocalSync(false);
        }

        if (nextPayload) {
          setDarkMode(nextPayload.darkMode ?? false);
          setActiveView(nextPayload.activeView ?? 'board');
          setCurrentLogo(nextPayload.currentLogo ?? 'rocket');
          setTags(nextPayload.tags ?? DEFAULT_TAGS);
          setColumnNames(nextPayload.columnNames ?? DEFAULT_COLUMN_NAMES);
          setTasks(nextPayload.tasks ?? DEFAULT_TASKS);
          setArchivedTasks(nextPayload.archivedTasks ?? []);
          setTimesheetEntries(nextPayload.timesheetEntries ?? DEFAULT_TIMESHEET_ENTRIES);
        }

        setDataHydrated(true);
        setSaveState('saved');
      },
      () => {
        setDataHydrated(true);
        setSaveError('Impossible de charger les données cloud.');
      },
    );
  }, [user, pendingLocalSync]);

  useEffect(() => {
    if (!db || !user || !dataHydrated) return;
    const payload = buildPayload();
    setSaveState('saving');

    const timeout = window.setTimeout(async () => {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'app', 'state'),
          {
            payload,
            updatedAt: serverTimestamp(),
            owner: {
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || '',
            },
          },
          { merge: true },
        );
        setSaveState('saved');
        setSaveError('');
      } catch {
        setSaveState('error');
        setSaveError('La sauvegarde automatique a échoué.');
      }
    }, 900);

    return () => clearTimeout(timeout);
  }, [
    user,
    dataHydrated,
    darkMode,
    activeView,
    currentLogo,
    tags,
    columnNames,
    tasks,
    archivedTasks,
    timesheetEntries,
  ]);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) return;
    try {
      setSaveError('');
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Firebase Google Sign-In error:', error);
      setSaveError(`${error.code || 'auth/error'} — ${error.message || 'Sync Google impossible.'}`);
    }
  };

  const signOutUser = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase sign-out error:', error);
      setSaveError('La déconnexion a échoué.');
    }
  };

  const addTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed || tags.some((tag) => tag.name.toLowerCase() === trimmed.toLowerCase())) return;
    const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    setTags((prev) => [...prev, { id: Date.now().toString(), name: trimmed, color: randomColor }]);
    setNewTagName('');
  };

  const removeTag = (id, name) => {
    if (name === 'Général') return;
    setTags((prev) => prev.filter((tag) => tag.id !== id));
    setTasks((prev) => prev.map((task) => (task.tag === name ? { ...task, tag: 'Général' } : task)));
    setArchivedTasks((prev) =>
      prev.map((task) => (task.tag === name ? { ...task, tag: 'Général' } : task)),
    );
    if (form.tag === name) setForm((prev) => ({ ...prev, tag: 'Général' }));
    if (timesheetForm.project === name) {
      setTimesheetForm((prev) => ({ ...prev, project: 'Général' }));
    }
    if (activeTagFilter === name) setActiveTagFilter(null);
  };

  const addTask = () => {
    if (!form.text.trim()) return;
    const parsed = parseQuickTaskInput(form.text, tags);
    const finalText = parsed.cleanedText || form.text.trim();
    const finalTag = parsed.detectedTagName || form.tag;
    const finalPriority = parsed.priority || form.priority;
    const finalDueDate = parsed.dueDate ?? form.dueDate;

    if (parsed.shouldCreateTag && parsed.detectedTagName) {
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      setTags((prev) => [
        ...prev,
        { id: Date.now().toString(), name: parsed.detectedTagName, color: randomColor },
      ]);
    }

    addToast('Tâche ajoutée 🚀');
    setTasks((prev) => [
      ...prev,
      {
        ...form,
        id: Date.now(),
        category: 'todo',
        createdAt: new Date().toISOString(),
        priority: Number.parseInt(finalPriority, 10),
        text: finalText,
        note: form.note.trim(),
        tag: finalTag,
        dueDate: finalDueDate,
        subtasks: [],
      },
    ]);

    setForm({ text: '', note: '', priority: '2', tag: tags[0]?.name || 'Général', dueDate: '' });
    setShowNoteField(false);
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 0);
  };

  const moveTask = (id, newCategory) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, category: newCategory } : task)));
  };

  const handleDragStart = (taskId) => setDraggedTaskId(taskId);
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };
  const handleDragOverColumn = (event, columnId) => {
    event.preventDefault();
    if (dragOverColumn !== columnId) setDragOverColumn(columnId);
  };
  const handleDropOnColumn = (event, columnId) => {
    event.preventDefault();
    if (draggedTaskId == null) return;
    moveTask(draggedTaskId, columnId);
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task.id);
    setEditingTaskDraft(task.text);
    setEditingNoteDraft(task.note || '');
  };
  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskDraft('');
  };

  const commitEditingTask = (taskId) => {
    const trimmed = editingTaskDraft.trim();
    const note = editingNoteDraft.trim();

    if (!trimmed) {
      cancelEditingTask();
      return;
    }

    const nextTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, text: trimmed, note } : task,
    );

    setTasks(nextTasks);
    writeLocalPayload(buildPayload({ tasks: nextTasks }));
    setEditingTaskId(null);
    setEditingTaskDraft('');
    setEditingNoteDraft('');
  };

  const saveEditingTaskIfLeavingCard = (event, taskId) => {
    const nextFocused = event.relatedTarget;
    if (nextFocused && event.currentTarget.contains(nextFocused)) return;
    commitEditingTask(taskId);
  };

  const deleteTask = (id) => {
    const deletedTask = tasks.find((task) => task.id === id);
    if (!deletedTask) return;

    setTasks((prev) => prev.filter((task) => task.id !== id));
    let toastId;
    toastId = addToast('Tâche supprimée 🗑️', 'error', {
      duration: 5000,
      actionLabel: 'Annuler',
      onAction: () => {
        setTasks((prev) =>
          prev.some((task) => task.id === deletedTask.id) ? prev : [...prev, deletedTask],
        );
        removeToast(toastId);
      },
    });
  };

  const archiveTask = (task) => {
    const archivedTask = { ...task, archivedAt: new Date().toISOString() };
    setArchivedTasks((prev) => [...prev, archivedTask]);
    setTasks((prev) => prev.filter((currentTask) => currentTask.id !== task.id));

    let toastId;
    toastId = addToast('Tâche archivée 📦', 'info', {
      duration: 5000,
      actionLabel: 'Annuler',
      onAction: () => {
        setArchivedTasks((prev) => prev.filter((currentTask) => currentTask.id !== task.id));
        setTasks((prev) =>
          prev.some((currentTask) => currentTask.id === task.id) ? prev : [...prev, task],
        );
        removeToast(toastId);
      },
    });
  };

  const restoreTask = (taskId) => {
    const taskToRestore = archivedTasks.find((task) => task.id === taskId);
    if (!taskToRestore) return;
    const { archivedAt, ...restoredTask } = taskToRestore;
    setTasks((prev) => [...prev, restoredTask]);
    setArchivedTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const deleteArchivedTask = (taskId) => {
    setArchivedTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const toggleSubtask = (taskId, subtaskId, archived = false) => {
    const updater = (prev) =>
      prev.map((task) =>
        task.id !== taskId
          ? task
          : {
              ...task,
              subtasks: (task.subtasks || []).map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
              ),
            },
      );

    if (archived) setArchivedTasks(updater);
    else setTasks(updater);
  };

  const addSubtaskToTask = (taskId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id !== taskId
          ? task
          : {
              ...task,
              subtasks: [
                ...(task.subtasks || []),
                {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  text: trimmed,
                  done: false,
                },
              ],
            },
      ),
    );
  };

  const promoteTaskToInProgress = (taskId) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, category: 'inprogress' } : t)));
  };

  const splitTaskSmart = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const base = task.text;
    const suggestions = [`Analyser : ${base}`, `Exécuter : ${base}`, `Finaliser : ${base}`];

    setTasks((prev) =>
      prev.map((t) =>
        t.id !== taskId
          ? t
          : {
              ...t,
              subtasks: [
                ...(t.subtasks || []),
                ...suggestions.map((s, index) => ({
                  id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
                  text: s,
                  done: false,
                })),
              ],
            },
      ),
    );
  };

  const addTimesheetEntry = () => {
    if (!timesheetForm.description.trim() || !timesheetForm.hours) return;
    const linkedTask = tasks.find((task) => String(task.id) === timesheetForm.taskId);
    addToast('Temps ajouté ⏱️');

    setTimesheetEntries((prev) => [
      {
        id: `ts-${Date.now()}`,
        date: timesheetForm.date,
        taskId: timesheetForm.taskId ? Number(timesheetForm.taskId) : null,
        project: linkedTask?.tag || timesheetForm.project,
        description: timesheetForm.description.trim(),
        hours: Number.parseFloat(timesheetForm.hours),
      },
      ...prev,
    ]);

    setTimesheetForm({
      date: new Date().toISOString().split('T')[0],
      taskId: '',
      project: tags[1]?.name || 'Travail',
      description: '',
      hours: '1',
    });
  };

  const deleteTimesheetEntry = (entryId) => {
    setTimesheetEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          task.text.toLowerCase().includes(search) ||
          task.tag.toLowerCase().includes(search) ||
          (task.note || '').toLowerCase().includes(search) ||
          (task.subtasks || []).some((subtask) => subtask.text.toLowerCase().includes(search));
        const matchesTag = !activeTagFilter || task.tag === activeTagFilter;
        return matchesSearch && matchesTag;
      }),
    [tasks, searchQuery, activeTagFilter],
  );

  const filteredArchivedTasks = useMemo(
    () =>
      archivedTasks.filter((task) => {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          task.text.toLowerCase().includes(search) ||
          task.tag.toLowerCase().includes(search) ||
          (task.note || '').toLowerCase().includes(search) ||
          (task.subtasks || []).some((subtask) => subtask.text.toLowerCase().includes(search));
        const matchesTag = !activeTagFilter || task.tag === activeTagFilter;
        return matchesSearch && matchesTag;
      }),
    [archivedTasks, searchQuery, activeTagFilter],
  );

  const filteredTimesheetEntries = useMemo(
    () =>
      timesheetEntries.filter((entry) => {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          entry.description.toLowerCase().includes(search) ||
          entry.project.toLowerCase().includes(search) ||
          entry.date.includes(search);
        const matchesTag = !activeTagFilter || entry.project === activeTagFilter;
        return matchesSearch && matchesTag;
      }),
    [timesheetEntries, searchQuery, activeTagFilter],
  );

  const timesheetStats = useMemo(() => {
    const totalHours = filteredTimesheetEntries.reduce((acc, entry) => acc + entry.hours, 0);
    const uniqueDays = new Set(filteredTimesheetEntries.map((entry) => entry.date)).size;
    const avgPerDay = uniqueDays ? totalHours / uniqueDays : 0;
    const byProject = filteredTimesheetEntries.reduce((acc, entry) => {
      acc[entry.project] = (acc[entry.project] || 0) + entry.hours;
      return acc;
    }, {});
    const topProject = Object.entries(byProject).sort((a, b) => b[1] - a[1])[0];
    return { totalHours, uniqueDays, avgPerDay, topProject: topProject ? topProject[0] : '—' };
  }, [filteredTimesheetEntries]);

  const stats = {
    total: tasks.length,
    done: tasks.filter((task) => task.category === 'done').length,
    retard: tasks.filter(
      (task) => getTaskStatus(task.dueDate) === 'retard' && task.category !== 'done',
    ).length,
    archived: archivedTasks.length,
  };

  const reminderTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.category !== 'done' && task.dueDate)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks],
  );

  const lateTasks = reminderTasks.filter((task) => getTaskStatus(task.dueDate) === 'retard');
  const urgentTasks = reminderTasks.filter((task) => getTaskStatus(task.dueDate) === 'urgent');
  const todayReminderKey = `${new Date().toISOString().split('T')[0]}-${lateTasks.length}-${urgentTasks.length}`;
  const showReminderBanner =
    (lateTasks.length > 0 || urgentTasks.length > 0) && dismissedReminderDate !== todayReminderKey;
  const topReminderTask = lateTasks[0] || urgentTasks[0] || null;

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const saveBadge = !firebaseReady
    ? { icon: CloudOff, label: 'Firebase non configuré', tone: 'text-amber-500' }
    : !user
      ? { icon: CloudOff, label: 'Mode local', tone: 'text-slate-400' }
      : saveState === 'saving'
        ? { icon: Cloud, label: 'Sauvegarde...', tone: 'text-indigo-500' }
        : saveState === 'error'
          ? { icon: CloudOff, label: 'Erreur cloud', tone: 'text-red-500' }
          : { icon: ShieldCheck, label: 'Sauvegardé', tone: 'text-emerald-500' };
  const SaveIcon = saveBadge.icon;

  const dismissReminderBanner = () => setDismissedReminderDate(todayReminderKey);

  const doryMessage = useMemo(
    () =>
      getDoryMessage({
        tasks: tasks.length,
        lateTasks: lateTasks.length,
        urgentTasks: urgentTasks.length,
        completionRate,
        activeView,
        focusMode,
      }),
    [
      tasks.length,
      lateTasks.length,
      urgentTasks.length,
      completionRate,
      activeView,
      focusMode,
      doryPulse,
    ],
  );

  const dorySuggestions = useMemo(
    () =>
      getDorySuggestions({
        tasks: tasks.length,
        doneTasks: stats.done,
        lateTasks: lateTasks.length,
        urgentTasks: urgentTasks.length,
        activeView,
        topProject: timesheetStats.topProject,
        totalHours: timesheetStats.totalHours,
        focusMode,
      }),
    [
      tasks.length,
      stats.done,
      lateTasks.length,
      urgentTasks.length,
      activeView,
      timesheetStats.topProject,
      timesheetStats.totalHours,
      focusMode,
    ],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDoryPulse((prev) => prev + 1);
    }, 20000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
      setInstallSupported(true);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setInstallSupported(false);
      addToast('Dory a été installée 🎉');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const focusedTask = tasks.find((task) => task.id === focusedTaskId) || null;

  const installApp = async () => {
    if (!deferredInstallPrompt) {
      addToast("L'installation n'est pas encore disponible sur cet appareil.", 'error');
      return;
    }

    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    if (result?.outcome === 'accepted') {
      addToast('Installation lancée 🚀');
    }
    setDeferredInstallPrompt(null);
    setInstallSupported(false);
  };

  const bestDayStat = useMemo(() => {
    if (!filteredTimesheetEntries.length) {
      return { label: '—', hours: 0, weekday: '—', project: '—' };
    }

    const byDate = filteredTimesheetEntries.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = { total: 0, byProject: {} };
      }
      acc[entry.date].total += Number(entry.hours || 0);
      acc[entry.date].byProject[entry.project] =
        (acc[entry.date].byProject[entry.project] || 0) + Number(entry.hours || 0);
      return acc;
    }, {});

    const winner = Object.entries(byDate).sort((a, b) => b[1].total - a[1].total)[0];
    const date = winner[0];
    const weekday = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' });
    const project = Object.entries(winner[1].byProject).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return {
      label: date,
      hours: winner[1].total,
      weekday,
      project,
    };
  }, [filteredTimesheetEntries]);

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-4 md:p-8`}
    >
      <ToastViewport toasts={toasts} onDismiss={removeToast} />

      <div className="max-w-[1600px] mx-auto font-body">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setShowLogoPicker((prev) => !prev)}
              className="rounded-[1.7rem] bg-transparent p-0 transition-transform active:scale-95"
              title="Personnaliser le style Dory"
            >
              <DoryLogo compact />
            </button>

            {showLogoPicker && (
              <div
                className={`absolute top-16 left-0 p-2 rounded-2xl shadow-2xl flex gap-1 z-[60] ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}
              >
                {LOGO_OPTIONS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setCurrentLogo(id);
                      setShowLogoPicker(false);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-indigo-500"
                  >
                    <Icon size={20} />
                  </button>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <DoryLogo />
                </div>
                <h1 className="text-3xl md:text-4xl font-brand uppercase tracking-tighter italic leading-none">
                  {APP_NAME.split(' ')[0]} <span className="text-indigo-600">2.0</span>
                </h1>
              </div>
              <p className="text-sm text-indigo-500 mt-1 font-medium">{APP_TAGLINE}</p>
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className={`w-40 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}
                  >
                    <div
                      className={`h-full ${completionRate === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-indigo-500 flex items-center gap-1">
                    {completionRate}% complété {completionRate === 100 && <Trophy size={12} />}
                  </span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${saveBadge.tone}`}>
                    <SaveIcon size={14} /> {saveBadge.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            <div
              className={`flex items-center px-4 py-3 rounded-2xl border min-w-[240px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <Search size={16} className="text-slate-400 mr-2" />
              <input
                id="global-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeView === 'timesheet'
                    ? 'Chercher un projet, une ligne de temps...'
                    : 'Chercher une tâche, un tag, une note...'
                }
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              {user ? (
                <React.Fragment>
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    {user.photoURL && !avatarError ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Avatar'}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                        onError={() => setAvatarError(true)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <User size={14} />
                      </div>
                    )}
                    <span className="max-w-[160px] truncate font-medium">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={signOutUser}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500"
                    title="Se déconnecter"
                  >
                    <LogOut size={16} />
                  </button>
                </React.Fragment>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-brand uppercase"
                >
                  <LogIn size={14} /> Sync Google
                </button>
              )}
            </div>

            <button
              onClick={() => setShowTagEditor((prev) => !prev)}
              className={`p-3 rounded-2xl border ${showTagEditor ? 'bg-indigo-600 text-white border-indigo-600' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <Tag size={18} />
            </button>
            <button
              onClick={() => setShowStats((prev) => !prev)}
              className={`p-3 rounded-2xl border ${showStats ? 'bg-indigo-600 text-white border-indigo-600' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <PieChart size={18} />
            </button>
            <button
              onClick={() => setShowArchive((prev) => !prev)}
              className={`p-3 rounded-2xl border ${showArchive ? 'bg-indigo-600 text-white border-indigo-600' : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className={`px-4 py-3 rounded-2xl border text-[10px] font-brand uppercase tracking-wider ${showSettings ? 'bg-indigo-600 text-white border-indigo-600' : darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              Dory Lab
            </button>
            {installSupported && (
              <button
                onClick={installApp}
                className="px-4 py-3 rounded-2xl border bg-emerald-600 text-white border-emerald-600 text-[10px] font-brand uppercase tracking-wider"
              >
                Installer l'app
              </button>
            )}

            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-yellow-400' : 'bg-white border-slate-200 text-slate-500'}`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {!installSupported && (
          <section
            className={`mb-6 p-4 rounded-[1.5rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <p className="text-sm font-semibold text-indigo-500">Installation de l'application</p>
            <p className="text-xs text-slate-400 mt-1">
              Le bouton d'installation apparaîtra ici quand la version PWA complète sera active et reconnue par le navigateur.
            </p>
          </section>
        )}

        <section
          className={`mb-8 p-4 md:p-5 rounded-[2rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 pt-0.5">
              <DoryLogo compact />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-brand uppercase tracking-[0.18em] text-indigo-500">
                  Humeur de Dory
                </span>
                <button
                  type="button"
                  onClick={() => setDoryPulse((prev) => prev + 1)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-brand uppercase tracking-wider ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}
                >
                  Nouveau message
                </button>
              </div>
              <p className={`text-sm md:text-base ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                {doryMessage}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {dorySuggestions.slice(0,1).map((suggestion, index) => (
              <div
                key={`${index}-${suggestion}`}
                className={`rounded-[1.25rem] border px-4 py-3 ${darkMode ? 'border-slate-800 bg-slate-950/70 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
              >
                <p className="text-[10px] font-brand uppercase tracking-[0.16em] text-indigo-500 mb-1">
                  Conseil Dory
                </p>
                <p className="text-sm leading-relaxed mb-3">{suggestion}</p>

                <div className="flex flex-wrap gap-2">
                  {urgentTasks.length > 0 && (
                    <button
                      onClick={() => setActiveView('board')}
                      className="text-[10px] px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold uppercase"
                    >
                      Voir urgentes
                    </button>
                  )}

                  {tasks.length > 0 && (
                    <button
                      onClick={() => {
                        const next = tasks.find((t) => t.category !== 'done');
                        if (next) promoteTaskToInProgress(next.id);
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold uppercase"
                    >
                      Faire maintenant
                    </button>
                  )}

                  

                  {!focusMode && tasks.length > 0 && (
                    <button
                      onClick={() => {
                        const nextTask = tasks.find((t) => t.category !== 'done');
                        if (nextTask) {
                          setFocusedTaskId(nextTask.id);
                          setFocusMode(true);
                        }
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold uppercase"
                    >
                      Mode focus
                    </button>
                  )}

                  
                </div>
              </div>
            ))}
          </div>
        </section>

        <div
          className={`mb-8 inline-flex p-1 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
        >
          <button
            onClick={() => setActiveView('board')}
            className={`px-4 py-2 rounded-xl text-xs font-brand uppercase tracking-wider flex items-center gap-2 ${activeView === 'board' ? 'bg-indigo-600 text-white' : darkMode ? 'text-slate-300' : 'text-slate-600'}`}
          >
            <ListTodo size={14} /> Board
          </button>
          <button
            onClick={() => setActiveView('timesheet')}
            className={`px-4 py-2 rounded-xl text-xs font-brand uppercase tracking-wider flex items-center gap-2 ${activeView === 'timesheet' ? 'bg-indigo-600 text-white' : darkMode ? 'text-slate-300' : 'text-slate-600'}`}
          >
            <Receipt size={14} /> Timesheet
          </button>
        </div>

        {showSettings && (
          <section
            className={`mb-8 p-6 rounded-[2rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-brand text-xs uppercase tracking-widest">Dory Lab</h3>
                <p className="text-xs text-slate-400 mt-1">Réglages, aide et mémoire rapide.</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-red-500">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-brand uppercase text-indigo-500 mb-3">🎯 Guide rapide</h4>
                <ul className="text-sm space-y-2">
                  <li>• Tape une tâche puis <b>Entrée</b></li>
                  <li>• Utilise <b>#tag</b> pour catégoriser</li>
                  <li>• Utilise <b>!</b> pour priorité haute</li>
                  <li>• Utilise <b>@demain</b> pour date rapide</li>
                  <li>• Double-clique une tâche pour le mode focus</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-brand uppercase text-indigo-500 mb-3">⌨️ Raccourcis</h4>
                <ul className="text-sm space-y-2">
                  <li><b>N</b> → Nouvelle tâche</li>
                  <li><b>/</b> → Recherche</li>
                  <li><b>Échap</b> → Fermer / quitter focus</li>
                  <li><b>Ctrl/Cmd + Entrée</b> → Valider une note</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeView === 'board' ? (
          <React.Fragment>
            {showTagEditor && (
              <section
                className={`mb-8 p-6 rounded-[2rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-brand text-xs uppercase tracking-widest flex items-center gap-2">
                    <Palette size={16} /> Tags & filtres
                  </h3>
                  <button onClick={() => setShowTagEditor(false)} className="text-slate-400 hover:text-red-500">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 mb-5">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold ${tag.color} ${activeTagFilter === tag.name ? 'ring-4 ring-indigo-500/40' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveTagFilter((prev) => (prev === tag.name ? null : tag.name))}
                      >
                        {tag.name}
                      </button>
                      {tag.name !== 'Général' && (
                        <button
                          type="button"
                          onClick={() => removeTag(tag.id, tag.name)}
                          className="hover:text-black/50"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}

                  {activeTagFilter && (
                    <button
                      onClick={() => setActiveTagFilter(null)}
                      className="text-xs text-indigo-500 font-bold uppercase"
                    >
                      Effacer le filtre
                    </button>
                  )}
                </div>

                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    placeholder="Nouveau tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    className={`flex-1 px-4 py-3 rounded-xl outline-none text-sm ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}
                  />
                  <button
                    onClick={addTag}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase"
                  >
                    Ajouter
                  </button>
                </div>
              </section>
            )}

            {showStats && (
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  ['Missions', stats.total],
                  ['Succès', stats.done],
                  ['Retards', stats.retard],
                  ['Archives', stats.archived],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className={`p-5 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                  >
                    <p className="text-[10px] font-brand uppercase text-slate-400 tracking-widest mb-1">
                      {label}
                    </p>
                    <p className="text-3xl font-brand text-indigo-600">{value}</p>
                  </div>
                ))}
              </section>
            )}

            {showArchive && (
              <section
                className={`mb-8 p-6 rounded-[2rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-brand text-xs uppercase tracking-widest flex items-center gap-2">
                    <Archive size={16} /> Archives
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {filteredArchivedTasks.length} tâche(s)
                  </span>
                </div>

                {filteredArchivedTasks.length === 0 ? (
                  <div className="text-sm italic text-slate-400">Aucune tâche archivée.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredArchivedTasks.map((task) => {
                      const tagStyle = tags.find((tag) => tag.name === task.tag);
                      return (
                        <div
                          key={task.id}
                          className={`p-5 rounded-[2rem] border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <span
                              className={`text-[9px] font-brand font-black uppercase px-2.5 py-1 rounded-xl text-white ${tagStyle?.color || 'bg-slate-500'}`}
                            >
                              {task.tag}
                            </span>
                            <button
                              onClick={() => deleteArchivedTask(task.id)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <h4 className="font-bold mb-2">{task.text}</h4>
                          {task.note && <p className="text-xs text-slate-400 italic mb-4">“{task.note}”</p>}

                          <TaskSubtasks
                            task={task}
                            darkMode={darkMode}
                            onToggle={toggleSubtask}
                            onAddSubtask={addSubtaskToTask}
                            archived
                          />

                          <div className="flex justify-between items-center pt-4 border-t dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">
                              {task.dueDate || 'Sans date'}
                            </span>
                            <button
                              onClick={() => restoreTask(task.id)}
                              className="text-indigo-600 px-3 py-2 rounded-2xl text-[10px] font-brand font-black uppercase hover:bg-indigo-50 dark:hover:bg-slate-800"
                            >
                              Restaurer
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {showReminderBanner && (
              <div
                className={`mb-8 p-4 rounded-[1.75rem] border flex items-start justify-between gap-4 ${lateTasks.length > 0 ? (darkMode ? 'bg-red-950/30 border-red-900 text-red-100' : 'bg-red-50 border-red-200 text-red-700') : (darkMode ? 'bg-amber-950/30 border-amber-900 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-800')}`}
              >
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <span>{lateTasks.length > 0 ? '🚨' : '⏰'}</span>
                    {lateTasks.length > 0
                      ? `${lateTasks.length} tâche${lateTasks.length > 1 ? 's' : ''} en retard`
                      : `${urgentTasks.length} tâche${urgentTasks.length > 1 ? 's' : ''} à traiter aujourd’hui`}
                  </p>
                  <p className="text-xs mt-1 opacity-90">
                    {topReminderTask
                      ? `Priorité à “${topReminderTask.text}” (${getDueDateMeta(topReminderTask.dueDate)?.detailLabel?.toLowerCase() || topReminderTask.dueDate}).`
                      : 'Dory t’invite à vérifier les échéances importantes.'}
                  </p>
                </div>
                <button
                  onClick={dismissReminderBanner}
                  className={`shrink-0 px-3 py-2 rounded-xl text-[10px] font-brand uppercase tracking-wider ${darkMode ? 'bg-slate-900/60 text-slate-200 hover:bg-slate-800' : 'bg-white/80 text-slate-600 hover:bg-white'}`}
                >
                  Masquer
                </button>
              </div>
            )}

            <section
              className={`max-w-4xl mx-auto mb-8 p-6 rounded-[2rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-6 lg:col-span-5">
                  <label className="text-[10px] font-brand uppercase text-indigo-500 mb-2 block ml-2">
                    Description
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Que doit retenir Dory ? (#tag ! @demain)"
                    value={form.text}
                    onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTask();
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-2xl outline-none font-bold text-base ${darkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-700 placeholder:text-slate-300'}`}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-brand uppercase text-slate-400 mb-2 block ml-2">
                    Échéance
                  </label>
                  <div className={`flex items-center px-4 py-3 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <Calendar size={18} className="text-slate-400 mr-2" />
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="bg-transparent outline-none text-xs font-bold w-full uppercase"
                    />
                  </div>
                </div>

                <div className="md:col-span-3 lg:col-span-2">
                  <label className="text-[10px] font-brand uppercase text-slate-400 mb-2 block ml-2">
                    Catégorie
                  </label>
                  <select
                    value={form.tag}
                    onChange={(e) => setForm((prev) => ({ ...prev, tag: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-2xl border-none font-bold text-xs uppercase outline-none appearance-none cursor-pointer ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}
                  >
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.name}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="text-[9px] font-brand uppercase text-slate-400 mb-1 block">
                        Priorité
                      </label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                        className="bg-transparent text-xs font-brand uppercase text-indigo-500 outline-none font-black"
                      >
                        <option value="1">Basse</option>
                        <option value="2">Moyenne</option>
                        <option value="3">Haute</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNoteField((prev) => !prev)}
                      className={`px-4 py-2 rounded-2xl text-[10px] font-brand uppercase tracking-wider border transition-all ${showNoteField ? 'bg-indigo-600 text-white border-indigo-600' : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      {showNoteField ? 'Masquer la note' : 'Ajouter une note'}
                    </button>
                  </div>

                  <button
                    onClick={addTask}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-brand text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Mémoriser
                  </button>
                </div>

                {showNoteField && (
                  <div className="md:col-span-12">
                    <div
                      className={`mt-1 p-4 rounded-[1.5rem] border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <label className="text-[10px] font-brand uppercase text-slate-400 mb-2 block ml-1">
                        Note
                      </label>
                      <textarea
                        placeholder="Ajouter un détail, un rappel ou un contexte..."
                        value={form.note}
                        onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                        rows={3}
                        className={`w-full px-4 py-3 rounded-2xl outline-none text-sm resize-none ${darkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-white text-slate-700 placeholder:text-slate-300'}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <main
              className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 ${focusMode ? 'opacity-30 pointer-events-none' : ''}`}
            >
              {COLUMNS.map((col, columnIndex) => {
                const colTasks = filteredTasks.filter((task) => task.category === col.id);
                return (
                  <section
                    key={col.id}
                    onDragOver={(event) => handleDragOverColumn(event, col.id)}
                    onDragLeave={() => setDragOverColumn((current) => (current === col.id ? null : current))}
                    onDrop={(event) => handleDropOnColumn(event, col.id)}
                    className={`flex flex-col min-h-[560px] rounded-[2.5rem] overflow-hidden border-2 transition-all ${dragOverColumn === col.id ? 'ring-2 ring-indigo-500/40 scale-[1.01]' : ''} ${darkMode ? 'border-slate-800 bg-slate-900/40' : `border-slate-100 ${col.light}`}`}
                  >
                    <div className={`${col.color} p-5 text-white relative overflow-hidden`}>
                      <div className="absolute -right-4 -top-4 opacity-10">
                        <Rocket size={50} />
                      </div>
                      <div className="flex items-center justify-between gap-3 relative z-10">
                        {editingColumn === col.id ? (
                          <input
                            autoFocus
                            value={columnNames[col.id]}
                            onChange={(e) =>
                              setColumnNames((prev) => ({ ...prev, [col.id]: e.target.value }))
                            }
                            onBlur={() => setEditingColumn(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingColumn(null)}
                            className="bg-white/20 text-white font-brand text-lg uppercase px-3 py-1.5 rounded-xl outline-none w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <h2
                              onClick={() => setEditingColumn(col.id)}
                              className="font-brand text-lg uppercase tracking-tight cursor-pointer flex items-center gap-2 min-w-0 hover:translate-x-0.5 transition-transform"
                            >
                              <span className="truncate">{columnNames[col.id]}</span>
                              <Edit2 size={14} className="opacity-60 shrink-0" />
                            </h2>
                          </div>
                        )}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-brand font-black uppercase tracking-[0.12em] border shadow-sm ${col.badge}`}
                          >
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-white/60 animate-ping" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                            </span>
                            {colTasks.length}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const avgProgress = colTasks.length
                          ? Math.round(
                              colTasks.reduce(
                                (acc, task) => acc + getSubtasksProgress(task.subtasks || []),
                                0,
                              ) / colTasks.length,
                            )
                          : 0;
                        const urgentCount = colTasks.filter(
                          (task) => getTaskStatus(task.dueDate) === 'urgent',
                        ).length;
                        const lateCount = colTasks.filter(
                          (task) => getTaskStatus(task.dueDate) === 'retard',
                        ).length;
                        const rawLoad = colTasks.length
                          ? Math.round(((urgentCount + lateCount * 2) / colTasks.length) * 100)
                          : 0;
                        const load = Math.min(100, rawLoad);
                        const meta = getPressureMeta(load);

                        return (
                          <div className="mt-3 space-y-2.5">
                            <div>
                              <div className="flex items-center justify-between text-[9px] font-brand uppercase opacity-80">
                                <span>Progression</span>
                                <span>{avgProgress}%</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden bg-white/20 mt-1">
                                <div
                                  className="h-full rounded-full bg-white/80 transition-all duration-500"
                                  style={{ width: `${avgProgress}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-[9px] font-brand uppercase opacity-90 mb-1">
                                <span className="flex items-center gap-1.5">
                                  <span>{meta.emoji}</span>
                                  <span>Pression</span>
                                </span>
                                <span className={`${meta.text} font-black`}>{load}%</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden bg-white/20">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${meta.bar} ${load >= 70 ? `${meta.glow} animate-pulse` : meta.glow}`}
                                  style={{ width: `${load}%` }}
                                />
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[8px] font-brand uppercase tracking-[0.12em] opacity-80">
                                <span>{meta.label}</span>
                                <span>
                                  {lateCount} retard · {urgentCount} urgent
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className={`flex-1 p-5 space-y-5 overflow-y-auto border-t-[6px] ${col.accent}`}>
                      {dragOverColumn === col.id && (
                        <div
                          className={`mb-2 rounded-2xl border-2 border-dashed px-4 py-3 text-center text-xs font-brand uppercase tracking-[0.18em] ${darkMode ? 'border-indigo-500/50 bg-slate-950/60 text-indigo-300' : 'border-indigo-300 bg-white/80 text-indigo-600'}`}
                        >
                          Dépose la tâche ici
                        </div>
                      )}

                      {colTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm py-16">
                          <ListTodo size={36} className="mb-2" />
                          <span>Vide</span>
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const taskTag = tags.find((tag) => tag.name === task.tag);
                          const status = getTaskStatus(task.dueDate);
                          const dueMeta = getDueDateMeta(task.dueDate);
                          const priorityStyle = getPriorityStyles(task.priority, darkMode);
                          return (
                            <article
                              key={task.id}
                              onDoubleClick={() => {
                                setFocusedTaskId(task.id);
                                setFocusMode(true);
                              }}
                              draggable
                              onDragStart={() => handleDragStart(task.id)}
                              onDragEnd={handleDragEnd}
                              style={{ transition: 'all 0.25s ease' }}
                              className={`p-5 rounded-[2rem] border-2 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-grab active:cursor-grabbing ${draggedTaskId === task.id ? 'opacity-50 scale-[0.98]' : ''} ${priorityStyle.card} ${status === 'retard' && task.category !== 'done' ? 'ring-2 ring-red-500/20' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex flex-wrap gap-2">
                                  <span
                                    className={`text-[9px] font-brand font-black uppercase px-2.5 py-1 rounded-xl text-white ${taskTag?.color || 'bg-slate-500'}`}
                                  >
                                    {task.tag}
                                  </span>
                                  <span
                                    className={`text-[9px] font-brand font-black uppercase px-2.5 py-1 rounded-xl ${priorityStyle.badge}`}
                                  >
                                    {priorityStyle.label}
                                  </span>
                                </div>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              <div className="mb-2">
                                {editingTaskId === task.id ? (
                                  <div
                                    className="space-y-3 mb-4"
                                    onBlur={(e) => saveEditingTaskIfLeavingCard(e, task.id)}
                                  >
                                    <input
                                      autoFocus
                                      value={editingTaskDraft}
                                      onChange={(e) => setEditingTaskDraft(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          commitEditingTask(task.id);
                                        }
                                        if (e.key === 'Escape') {
                                          cancelEditingTask();
                                        }
                                      }}
                                      className={`w-full px-2 py-2 rounded-xl text-sm font-bold outline-none ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'}`}
                                    />
                                    <textarea
                                      value={editingNoteDraft}
                                      onChange={(e) => setEditingNoteDraft(e.target.value)}
                                      onKeyDown={(e) => {
                                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                          commitEditingTask(task.id);
                                        }
                                        if (e.key === 'Escape') {
                                          cancelEditingTask();
                                        }
                                      }}
                                      rows={2}
                                      placeholder="Ajouter un détail, un rappel ou un contexte..."
                                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none resize-none ${darkMode ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-slate-100 text-slate-800 placeholder:text-slate-400'}`}
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={cancelEditingTask}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-brand uppercase ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                                      >
                                        Annuler
                                      </button>
                                      <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => commitEditingTask(task.id)}
                                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-brand uppercase"
                                      >
                                        Enregistrer
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <React.Fragment>
                                    <h3
                                      onClick={() => startEditingTask(task)}
                                      className={`text-base font-bold leading-tight cursor-pointer mb-3 ${task.category === 'done' ? 'line-through text-slate-400' : darkMode ? 'text-white' : 'text-slate-800'}`}
                                    >
                                      {task.text}
                                    </h3>

                                    {task.note ? (
                                      <div
                                        onClick={() => startEditingTask(task)}
                                        className="group flex items-start justify-between gap-2 text-xs text-slate-400 italic mb-4 cursor-pointer"
                                      >
                                        <span className="flex-1">“{task.note}”</span>
                                        <Edit2
                                          size={12}
                                          className="opacity-0 group-hover:opacity-70 transition-opacity shrink-0"
                                        />
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => startEditingTask(task)}
                                        className="mb-4 text-[11px] font-brand uppercase text-indigo-500 hover:underline"
                                      >
                                        + Ajouter une note
                                      </button>
                                    )}
                                  </React.Fragment>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                  type="button"
                                  onClick={() => splitTaskSmart(task.id)}
                                  className={`px-3 py-2 rounded-xl text-[10px] font-brand uppercase tracking-wider border ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}`}
                                >
                                  Découper la tâche
                                </button>
                              </div>

                              <TaskSubtasks
                                task={task}
                                darkMode={darkMode}
                                onToggle={toggleSubtask}
                                onAddSubtask={addSubtaskToTask}
                              />

                              {task.dueDate && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <span
                                    className={`text-[10px] font-brand font-black uppercase px-2.5 py-1 rounded-xl flex items-center gap-1 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                                  >
                                    <Clock size={10} /> {task.dueDate}
                                  </span>
                                  {dueMeta && (
                                    <span
                                      title={dueMeta.detailLabel}
                                      className={`text-[10px] font-brand font-black uppercase px-2.5 py-1 rounded-xl ${getDeadlineBadgeClass(status, darkMode)}`}
                                    >
                                      {dueMeta.shortLabel}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[9px] font-brand uppercase text-slate-400">
                                    Niveau
                                  </span>
                                  <span className="text-[9px] font-brand uppercase text-slate-500">
                                    {task.priority}/3
                                  </span>
                                </div>
                                <div
                                  className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
                                >
                                  <div
                                    className={`h-full rounded-full ${priorityStyle.bar}`}
                                    style={{ width: `${(task.priority / 3) * 100}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t dark:border-slate-800">
                                <div className="flex gap-2">
                                  {columnIndex > 0 && (
                                    <button
                                      onClick={() => moveTask(task.id, COLUMNS[columnIndex - 1].id)}
                                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"
                                    >
                                      <ChevronLeft size={16} />
                                    </button>
                                  )}
                                  {columnIndex < COLUMNS.length - 1 && (
                                    <button
                                      onClick={() => moveTask(task.id, COLUMNS[columnIndex + 1].id)}
                                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"
                                    >
                                      <ChevronRight size={16} />
                                    </button>
                                  )}
                                </div>
                                {col.id === 'done' && (
                                  <button
                                    onClick={() => archiveTask(task)}
                                    className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-brand font-black uppercase"
                                  >
                                    <Archive size={14} /> Archiver
                                  </button>
                                )}
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </section>
                );
              })}
            </main>

            {focusMode && focusedTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div
                  className={`p-8 rounded-3xl max-w-lg w-full ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                >
                  <h2 className="text-xl font-bold mb-4">{focusedTask.text}</h2>
                  {focusedTask.note && <p className="mb-4 text-sm opacity-70">{focusedTask.note}</p>}
                  {focusedTask.dueDate && (
                    <p className="mb-4 text-xs uppercase tracking-wider text-slate-400">
                      Échéance : {focusedTask.dueDate}
                    </p>
                  )}

                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => splitTaskSmart(focusedTask.id)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-brand uppercase tracking-wider border ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}`}
                    >
                      Découper la tâche
                    </button>
                  </div>

                  <TaskSubtasks
                    task={focusedTask}
                    darkMode={darkMode}
                    onToggle={toggleSubtask}
                    onAddSubtask={addSubtaskToTask}
                  />

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        moveTask(focusedTask.id, 'done');
                        setFocusMode(false);
                        setFocusedTaskId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs uppercase"
                    >
                      Terminer ✅
                    </button>

                    <button
                      onClick={() => {
                        setFocusMode(false);
                        setFocusedTaskId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs uppercase"
                    >
                      Quitter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ) : (
          <section className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div
                className={`xl:col-span-1 p-6 rounded-[2rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex items-center gap-2 mb-5">
                  <Receipt size={18} className="text-indigo-500" />
                  <h3 className="font-brand text-xs uppercase tracking-widest">
                    New Timesheet Entry
                  </h3>
                </div>
                <div className="mb-6">
                  <h4 className="text-xs font-brand uppercase text-indigo-500 mb-3">🔥 Heatmap activité</h4>
                  <Heatmap entries={filteredTimesheetEntries} darkMode={darkMode} tags={tags} />
                </div>

                <div className={`mb-5 grid grid-cols-1 md:grid-cols-3 gap-3`}>
                  <div className={`rounded-[1.25rem] border px-4 py-3 ${darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                    <p className="text-[10px] font-brand uppercase tracking-[0.16em] text-indigo-500 mb-1">Meilleur jour</p>
                    <p className="text-sm font-semibold">{bestDayStat.weekday} 🔥</p>
                    <p className="text-xs text-slate-400 mt-1">{bestDayStat.label} · {formatHours(bestDayStat.hours)}</p>
                  </div>
                  <div className={`rounded-[1.25rem] border px-4 py-3 ${darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                    <p className="text-[10px] font-brand uppercase tracking-[0.16em] text-indigo-500 mb-1">Projet dominant</p>
                    <p className="text-sm font-semibold">{bestDayStat.project}</p>
                    <p className="text-xs text-slate-400 mt-1">Le plus présent sur ta meilleure journée</p>
                  </div>
                  <div className={`rounded-[1.25rem] border px-4 py-3 ${darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                    <p className="text-[10px] font-brand uppercase tracking-[0.16em] text-indigo-500 mb-1">Insight Dory</p>
                    <p className="text-sm font-semibold">{bestDayStat.hours > 0 ? `Ton pic de forme est ${bestDayStat.weekday} 🔥` : 'Ajoute du temps pour révéler tes tendances'}</p>
                    <p className="text-xs text-slate-400 mt-1">Dory repère tes journées les plus productives</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-brand uppercase text-slate-400 mb-2 block ml-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={timesheetForm.date}
                      onChange={(e) => setTimesheetForm((prev) => ({ ...prev, date: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-2xl outline-none text-sm ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-brand uppercase text-slate-400 mb-2 block ml-2">
                      Linked Task
                    </label>
                    <select
                      value={timesheetForm.taskId}
                      onChange={(e) => {
                        const linkedTask = tasks.find((task) => String(task.id) === e.target.value);
                        setTimesheetForm((prev) => ({
                          ...prev,
                          taskId: e.target.value,
                          project: linkedTask?.tag || prev.project,
                          description: linkedTask && !prev.description ? linkedTask.text : prev.description,
                        }));
                      }}
                      className={`w-full px-4 py-3 rounded-2xl outline-none text-sm ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`}
                    >
                      <option value="">Aucune</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.text}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-brand uppercase text-slate-400 mb-2 block ml-2">
                      Project / Tag
                    </label>
                    <select
                      value={timesheetForm.project}
                      onChange={(e) => setTimesheetForm((prev) => ({ ...prev, project: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-2xl outline-none text-sm ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`}
                    >
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.name}>
                          {tag.name}
                        </option>
                      ))}
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-brand uppercase text-slate-400 mb-2 block ml-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={timesheetForm.description}
                      onChange={(e) =>
                        setTimesheetForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Ex: préparation du rapport, réunion, support..."
                      className={`w-full px-4 py-3 rounded-2xl outline-none text-sm resize-none ${darkMode ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-slate-50 text-slate-700 placeholder:text-slate-400'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-brand uppercase text-slate-400 mb-2 block ml-2">
                      Heures
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={timesheetForm.hours}
                      onChange={(e) => setTimesheetForm((prev) => ({ ...prev, hours: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-2xl outline-none text-sm ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`}
                    />
                  </div>
                  <button
                    onClick={addTimesheetEntry}
                    className="w-full bg-indigo-600 text-white px-4 py-3 rounded-2xl font-brand text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Entry
                  </button>
                </div>
              </div>

              <div
                className={`xl:col-span-2 p-6 rounded-[2rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="font-brand text-xs uppercase tracking-widest flex items-center gap-2">
                      <Receipt size={16} className="text-indigo-500" /> Timesheet
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Time tracked by Dory for your projects.
                    </p>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs font-brand uppercase ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {formatHours(timesheetStats.totalHours)} total
                  </div>
                </div>
                <div className="space-y-4">
                  {filteredTimesheetEntries.length === 0 ? (
                    <div className="py-16 text-center text-sm italic text-slate-400">
                      No timesheet entries.
                    </div>
                  ) : (
                    filteredTimesheetEntries.map((entry) => {
                      const linkedTask =
                        tasks.find((task) => task.id === entry.taskId) ||
                        archivedTasks.find((task) => task.id === entry.taskId);
                      const projectTag = tags.find((tag) => tag.name === entry.project);
                      return (
                        <div
                          key={entry.id}
                          className={`p-5 rounded-[1.75rem] border flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span
                                className={`text-[9px] font-brand font-black uppercase px-2.5 py-1 rounded-xl ${projectTag ? `${projectTag.color} text-white` : darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}
                              >
                                {entry.project}
                              </span>
                              <span
                                className={`text-[9px] font-brand font-black uppercase px-2.5 py-1 rounded-xl ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500'}`}
                              >
                                {entry.date}
                              </span>
                              <span className="text-[9px] font-brand font-black uppercase px-2.5 py-1 rounded-xl bg-indigo-600 text-white">
                                {formatHours(entry.hours)}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm mb-1">{entry.description}</h4>
                            {linkedTask && (
                              <p className="text-xs text-slate-400">Lié à : {linkedTask.text}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTimesheetEntry(entry.id)}
                            className="self-start md:self-center text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
