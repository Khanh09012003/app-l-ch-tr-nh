/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Bell, 
  BellOff, 
  Calendar as CalendarIcon,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  time: string; // HH:mm format
  completed: boolean;
  notified: boolean;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('daily-flow-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);
  const [activeAlarm, setActiveAlarm] = useState<Task | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle first interaction for audio on mobile
  const handleFirstInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      // Play and immediately pause to "unlock" audio on iOS/Android
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
        }).catch(e => console.log("Audio unlock failed:", e));
      }
    }
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkAlarms(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [tasks, isAlarmEnabled]);

  // Save tasks to local storage
  useEffect(() => {
    localStorage.setItem('daily-flow-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const checkAlarms = (now: Date) => {
    if (!isAlarmEnabled) return;

    const currentHHmm = now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    const upcomingTask = tasks.find(t => 
      !t.completed && 
      !t.notified && 
      t.time === currentHHmm
    );

    if (upcomingTask) {
      triggerAlarm(upcomingTask);
    }
  };

  const triggerAlarm = (task: Task) => {
    setActiveAlarm(task);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked:", e));
    }
    
    // Mark as notified so it doesn't trigger again in the same minute
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, notified: true } : t
    ));
  };

  const stopAlarm = () => {
    setActiveAlarm(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskTime) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      time: newTaskTime,
      completed: false,
      notified: false,
    };

    setTasks(prev => [...prev, newTask].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTaskTitle('');
    setNewTaskTime('');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div 
      className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100 pb-safe"
      onClick={handleFirstInteraction}
      onTouchStart={handleFirstInteraction}
    >
      {/* Hidden Audio Element for Alarm */}
      <audio 
        ref={audioRef} 
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" 
        loop 
      />

      {/* Alarm Overlay */}
      <AnimatePresence>
        {activeAlarm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-blue-100"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <Bell className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-2">Đến giờ rồi!</h2>
              <p className="text-3xl font-light mb-8 text-gray-800">"{activeAlarm.title}"</p>
              <button 
                onClick={stopAlarm}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
              >
                Đã hiểu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-light tracking-tight mb-2">Daily Flow</h1>
              <p className="text-gray-500 font-medium">{formatDate(currentTime)}</p>
            </div>
            <button 
              onClick={() => setIsAlarmEnabled(!isAlarmEnabled)}
              className={`p-3 rounded-2xl transition-all ${isAlarmEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
              title={isAlarmEnabled ? "Tắt thông báo" : "Bật thông báo"}
            >
              {isAlarmEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Clock className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thời gian hiện tại</p>
                <p className="text-2xl font-mono font-medium">{formatTime(currentTime)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Công việc còn lại</p>
              <p className="text-2xl font-medium">{tasks.filter(t => !t.completed).length}</p>
            </div>
          </div>
        </header>

        {/* Add Task Form */}
        <section className="mb-12">
          {!hasInteracted && (
            <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-2xl text-sm flex items-center gap-3 animate-pulse">
              <AlertCircle size={18} />
              <span>Chạm vào bất kỳ đâu để kích hoạt âm thanh báo thức.</span>
            </div>
          )}
          <form onSubmit={addTask} className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Bạn định làm gì tiếp theo?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-base"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 md:w-40 relative">
                  <input 
                    type="time" 
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none text-base"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Task List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Lịch trình hôm nay</h2>
            <div className="h-[1px] flex-1 bg-gray-100 mx-4"></div>
            <CalendarIcon size={20} className="text-gray-300" />
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tasks.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="text-gray-300" />
                  </div>
                  <p className="text-gray-400">Chưa có lịch trình nào. Hãy thêm việc cần làm!</p>
                </motion.div>
              ) : (
                tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group flex items-center gap-4 p-5 rounded-3xl border transition-all ${
                      task.completed 
                        ? 'bg-gray-50 border-transparent opacity-60' 
                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100'
                    }`}
                  >
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={`transition-colors ${task.completed ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}
                    >
                      {task.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`text-lg font-medium transition-all ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{task.time}</span>
                        {task.notified && !task.completed && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-wider ml-2">
                            <AlertCircle size={10} /> Đã nhắc
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-6 py-12 text-center">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">
          Stay focused • Stay productive
        </p>
      </footer>
    </div>
  );
}
