import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Calendar, 
  BookOpen, 
  Clock, 
  TrendingUp,
  LayoutDashboard,
  Timer,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Task {
  id: string;
  subject: string;
  description: string;
  deadline: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

type Filter = 'all' | 'pending' | 'completed';
type TimerMode = 'focus' | 'break';

// --- Constants ---
const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export default function App() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('study_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [filter, setFilter] = useState<Filter>('all');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [showNotification, setShowNotification] = useState(false);

  // New task form
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('study_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- Timer Logic ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleTimerComplete = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {}); // Play sound if allowed
    
    if (timerMode === 'focus') {
      setTimerMode('break');
      setTimeLeft(BREAK_TIME);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    } else {
      setTimerMode('focus');
      setTimeLeft(FOCUS_TIME);
    }
  }, [timerMode]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerMode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Task Actions ---
  const addTask = (e: FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newDesc) return;

    const task: Task = {
      id: crypto.randomUUID(),
      subject: newSubject,
      description: newDesc,
      deadline: newDeadline || 'Sem data',
      completed: false,
      createdAt: Date.now(),
    };

    setTasks([task, ...tasks]);
    setNewSubject('');
    setNewDesc('');
    setNewDeadline('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id 
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } 
        : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // --- Computed Data ---
  const filteredTasks = useMemo(() => {
    if (filter === 'pending') return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }, [tasks, filter]);

  const completedToday = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return tasks.filter(t => t.completed && t.completedAt && t.completedAt >= today).length;
  }, [tasks]);

  const progressPercentage = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto">
      {/* Header */}
      <header className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-blue-500" />
            Agenda de Estudos
          </h1>
          <p className="text-zinc-500 mt-1">Organize seu conhecimento, um passo de cada vez.</p>
        </div>
        
        {/* Productivity Widget */}
        <div className="glass-card px-6 py-4 flex items-center gap-6 shadow-2xl shadow-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Hoje</p>
              <p className="text-xl font-bold">{completedToday} concluídas</p>
            </div>
          </div>
          <div className="w-[1px] h-10 bg-zinc-800" />
          <div className="flex flex-col items-end">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Geral</p>
            <p className="text-xl font-bold text-zinc-300">{Math.round(progressPercentage)}%</p>
          </div>
        </div>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar: Timer & New Task */}
        <div className="lg:col-span-4 space-y-8 flex flex-col h-full">
          {/* Pomodoro Timer */}
          <section className="glass-card p-8 border-blue-500/20 relative group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
                  {timerMode === 'focus' ? 'Foco' : 'Pausa'}
                </span>
              </div>
              {timerMode === 'break' && (
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>

            <div className="text-center mb-8">
              <span className="text-7xl font-light font-mono tracking-tighter text-white">
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={toggleTimer}
                className={`flex-1 ${isTimerRunning ? 'btn-secondary' : 'btn-primary'} h-12`}
              >
                {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isTimerRunning ? 'Pausar' : 'Iniciar'}
              </button>
              <button 
                onClick={resetTimer}
                className="btn-secondary w-12 h-12 p-0 flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </section>

          {/* New Task Form */}
          <section className="glass-card p-6 border-zinc-800">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Tarefa
            </h3>
            <form onSubmit={addTask} className="space-y-4">
              <input 
                type="text" 
                placeholder="Matéria (ex: Programação)" 
                className="input-field w-full"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <textarea 
                placeholder="Descrição da tarefa..." 
                className="input-field w-full min-h-[100px] resize-none"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 group focus-within:ring-2 focus-within:ring-blue-500/50">
                <Calendar className="w-4 h-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                <input 
                  type="date" 
                  className="bg-transparent w-full text-zinc-300 focus:outline-hidden"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary w-full h-12 mt-2">
                Adicionar Agenda
              </button>
            </form>
          </section>
        </div>

        {/* Task List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setFilter('all')}
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${filter === 'all' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-100'}`}
              >
                Todas
              </button>
              <button 
                onClick={() => setFilter('pending')}
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${filter === 'pending' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-100'}`}
              >
                Pendentes
              </button>
              <button 
                onClick={() => setFilter('completed')}
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${filter === 'completed' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-100'}`}
              >
                Concluídas
              </button>
            </div>
            <p className="text-sm text-zinc-500 font-mono">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}
            </p>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`glass-card p-5 group flex items-start gap-4 transition-all duration-300 ${task.completed ? 'opacity-60 grayscale-[0.3]' : 'hover:border-zinc-700'}`}
                >
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className="mt-1 transition-transform active:scale-90"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-zinc-700 group-hover:text-blue-500 transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" />
                        {task.subject}
                      </span>
                      {task.deadline && (
                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Até {new Date(task.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <h4 className={`text-lg font-semibold leading-tight mb-1 truncate transition-all duration-300 ${task.completed ? 'line-through text-zinc-500 translate-x-1' : 'text-zinc-200'}`}>
                      {task.description}
                    </h4>
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTasks.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-zinc-900/30 rounded-xl border-2 border-dashed border-zinc-800"
              >
                <div className="p-4 bg-zinc-800 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500 font-medium">Nenhuma tarefa por aqui ainda.</p>
                <p className="text-zinc-600 text-sm">Foque nos seus estudos e relaxe!</p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50 glass-card p-4 border-green-500 shadow-2xl shadow-green-500/20 bg-green-950/20 backdrop-blur-xl flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-zinc-950 ml-1" />
            </div>
            <div>
              <p className="font-bold text-green-400">Tempo Esgotado!</p>
              <p className="text-sm text-zinc-400">Hora de uma pausa merecida.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-20 py-8 border-t border-zinc-900 w-full text-center">
        <p className="text-zinc-600 text-sm flex items-center justify-center gap-2">
          Desenvolvido com <span className="text-xs text-zinc-500">◆</span> 2026
        </p>
      </footer>
    </div>
  );
}

