
import React, { useState } from 'react';
import { Post, PostStatus } from '../types';
import { ICONS, POST_STATUS_NAMES } from '../constants';

interface CalendarViewProps {
  posts: Post[];
  onDateClick: (date: Date) => void;
  onPostClick: (post: Post) => void;
}

const STATUS_STYLES: { [key in PostStatus]?: string } = {
  [PostStatus.Scheduled]: 'bg-blue-500/20 text-blue-300 border-blue-500',
  [PostStatus.Approved]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500',
  [PostStatus.Posted]: 'bg-green-500/20 text-green-300 border-green-500',
  [PostStatus.Failed]: 'bg-red-500/20 text-red-300 border-red-500',
  [PostStatus.Review]: 'bg-indigo-500/20 text-indigo-300 border-indigo-500'
};

const CalendarView: React.FC<CalendarViewProps> = ({ posts, onDateClick, onPostClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const postsByDate: { [key: string]: Post[] } = {};
  posts.forEach(post => {
    if (post.scheduledAt) {
      const dateKey = post.scheduledAt.toDateString();
      if (!postsByDate[dateKey]) {
        postsByDate[dateKey] = [];
      }
      postsByDate[dateKey].push(post);
    }
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const isToday = (date: Date) => new Date().toDateString() === date.toDateString();

  return (
    <div className="p-6 bg-gray-800/50 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          {currentDate.toLocaleString('ja-JP', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">
            <ICONS.ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">
            <ICONS.ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-700 flex-grow rounded-md overflow-hidden">
        {['日', '月', '火', '水', '木', '金', '土'].map(dayName => (
          <div key={dayName} className="text-center font-medium text-xs text-gray-400 py-2 bg-gray-800">
            {dayName}
          </div>
        ))}
        {days.map((d) => {
          const dateKey = d.toDateString();
          const postsForDay = postsByDate[dateKey] || [];
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          return (
            <div
              key={d.toString()}
              className={`p-2 bg-gray-800 flex flex-col min-h-[120px] transition-colors hover:bg-gray-700/70 ${!isCurrentMonth ? 'opacity-40' : ''}`}
              onClick={() => onDateClick(d)}
            >
              <span className={`font-semibold mb-1 ${isToday(d) ? 'text-purple-400 bg-purple-500/20 rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-300'}`}>
                {d.getDate()}
              </span>
              <div className="flex-grow space-y-1 overflow-y-auto">
                {postsForDay.map(post => (
                  <div
                    key={post.id}
                    onClick={(e) => { e.stopPropagation(); onPostClick(post); }}
                    className={`text-xs p-1.5 rounded-md border-l-4 cursor-pointer truncate ${STATUS_STYLES[post.status] || 'bg-gray-600/50 text-gray-400 border-gray-500'}`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={post.mediaUrl} className="w-5 h-5 rounded object-cover" alt="media thumbnail"/>
                      <span className="font-medium">{POST_STATUS_NAMES[post.status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
