'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare, Users, Calendar as CalendarIcon } from 'lucide-react';
import { useAppContext } from '@/lib/context';

export default function CalendarPage() {
  const { tasks, leads, posts, socket } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const events = useMemo(() => {
    const formattedEvents: any[] = [];
    
    // Map tasks
    tasks?.forEach((task: any) => {
      if (task.dueDate) {
        formattedEvents.push({
          id: `task-due-${task.id}`,
          originalId: task.id,
          title: `Due: ${task.title}`,
          date: new Date(task.dueDate),
          type: 'task',
          status: task.status,
          dateField: 'dueDate'
        });
      }
      if (task.completedAt) {
        formattedEvents.push({
          id: `task-done-${task.id}`,
          originalId: task.id,
          title: `Done: ${task.title}`,
          date: new Date(task.completedAt),
          type: 'task-done',
          status: task.status,
          dateField: 'completedAt'
        });
      }
    });

    // Map leads
    leads?.forEach((lead: any) => {
      if (lead.createdAt) {
        formattedEvents.push({
          id: `lead-${lead.id}`,
          originalId: lead.id,
          title: `New Lead: ${lead.name}`,
          date: new Date(lead.createdAt),
          type: 'lead',
          status: lead.status,
          dateField: 'createdAt'
        });
      }
    });

    // Map posts
    posts?.forEach((post: any) => {
      if (post.scheduledFor) {
        formattedEvents.push({
          id: `post-sched-${post.id}`,
          originalId: post.id,
          title: `Post: ${post.title}`,
          date: new Date(post.scheduledFor),
          type: 'post',
          status: post.status,
          dateField: 'scheduledFor'
        });
      } else if (post.createdAt) {
        formattedEvents.push({
          id: `post-created-${post.id}`,
          originalId: post.id,
          title: `Post Created: ${post.title}`,
          date: new Date(post.createdAt),
          type: 'post',
          status: post.status,
          dateField: 'createdAt'
        });
      }
    });

    return formattedEvents;
  }, [tasks, leads, posts]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDrop = async (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const eventDataStr = e.dataTransfer.getData('application/json');
    if (!eventDataStr) return;
    
    const eventData = JSON.parse(eventDataStr);
    if (!eventData.dateField) return;

    const newDateStr = day.toISOString();
    
    if (eventData.type === 'task' || eventData.type === 'task-done') {
      const task = tasks.find(t => t.id === eventData.originalId);
      if (task) {
        socket.emit('update_task', { ...task, [eventData.dateField]: newDateStr });
      }
    } else if (eventData.type === 'lead') {
      const lead = leads.find(l => l.id === eventData.originalId);
      if (lead) {
        socket.emit('update_lead', { ...lead, [eventData.dateField]: newDateStr });
      }
    } else if (eventData.type === 'post') {
      const post = posts.find(p => p.id === eventData.originalId);
      if (post) {
        socket.emit('update_post', { ...post, [eventData.dateField]: newDateStr });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent, event: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(event));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="w-3 h-3 mr-1" />;
      case 'task-done': return <CheckSquare className="w-3 h-3 mr-1 text-emerald-400" />;
      case 'lead': return <Users className="w-3 h-3 mr-1 text-blue-400" />;
      case 'post': return <CalendarIcon className="w-3 h-3 mr-1 text-purple-400" />;
      default: return null;
    }
  };

  const getEventColor = (type: string, status: string) => {
    if (type === 'task-done' || status === 'completed') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (type === 'lead') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    if (type === 'post') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Calendar</h1>
          <p className="text-zinc-400 mt-1">Schedule tasks, content, and track leads</p>
        </div>
        <div className="flex items-center space-x-4 bg-white/5 rounded-xl p-1 border border-white/10">
          <button onClick={prevMonth} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium min-w-[120px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-3 text-center text-sm font-medium text-zinc-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
          {days.map((day, dayIdx) => {
            const dayEvents = events.filter(e => isSameDay(e.date, day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            return (
              <div
                key={day.toString()}
                onDrop={(e) => handleDrop(e, day)}
                onDragOver={handleDragOver}
                className={`
                  min-h-[120px] p-2 border-b border-r border-white/5 transition-colors
                  ${!isCurrentMonth ? 'bg-black/20 text-zinc-600' : 'bg-transparent text-zinc-300'}
                  ${dayIdx % 7 === 6 ? 'border-r-0' : ''}
                  hover:bg-white/[0.04]
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(52,211,153,0.5)]' : ''}`}>
                    {format(day, dateFormat)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      draggable={!!event.dateField}
                      onDragStart={(e) => handleDragStart(e, event)}
                      className={`
                        text-xs p-1.5 rounded-md border flex items-center cursor-pointer
                        ${getEventColor(event.type, event.status)}
                        ${event.dateField ? 'hover:opacity-80 active:scale-95 transition-transform' : 'opacity-70'}
                      `}
                      title={event.title}
                    >
                      {getEventIcon(event.type)}
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
