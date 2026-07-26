import React, { useState, useEffect } from 'react';
import { GetActivityLog } from '../services/api';

type DayData = { date: string, level: number, pages: number };

const Heatmap = () => {
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    GetActivityLog().then(res => {
      if (res) {
        setActivityMap(res);
        // Calculate streak
        let currentStreak = 0;
        let d = new Date();
        while (true) {
          const dateStr = formatDate(d);
          if (res[dateStr] && res[dateStr] > 0) {
            currentStreak++;
            d.setDate(d.getDate() - 1);
          } else {
            // Check yesterday if today has 0
            if (currentStreak === 0 && d.toDateString() === new Date().toDateString()) {
              d.setDate(d.getDate() - 1);
              const yestStr = formatDate(d);
              if (res[yestStr] && res[yestStr] > 0) {
                currentStreak++;
                d.setDate(d.getDate() - 1);
                continue;
              }
            }
            break;
          }
        }
        setStreak(currentStreak);
      }
    });
  }, []);

  const weeks = 52;
  const daysInWeek = 7;
  
  const generateData = () => {
    const data: DayData[][] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeks * daysInWeek - 1));
    
    let currentDay = new Date(startDate);
    let currentWeek: DayData[] = [];
    
    while (currentDay <= endDate) {
      const dateStr = formatDate(currentDay);
      const pages = activityMap[dateStr] || 0;
      let level = 0;
      if (pages > 0 && pages <= 10) level = 1;
      else if (pages > 10 && pages <= 30) level = 2;
      else if (pages > 30 && pages <= 50) level = 3;
      else if (pages > 50) level = 4;
      
      currentWeek.push({ date: dateStr, level, pages });
      
      if (currentWeek.length === daysInWeek) {
        data.push(currentWeek);
        currentWeek = [];
      }
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      data.push(currentWeek);
    }
    return data;
  };

  const gridData = React.useMemo(() => generateData(), [activityMap]);

  const getColor = (level: number) => {
    switch (level) {
      case 1: return '#9be9a8';
      case 2: return '#40c463';
      case 3: return '#30a14e';
      case 4: return '#216e39';
      default: return 'var(--card-border)';
    }
  };

  return (
    <div className="heatmap-container" style={{ 
      padding: '24px', 
      background: 'var(--card-bg)', 
      borderRadius: '16px', 
      border: '1px solid var(--card-border)',
      marginBottom: '32px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Reading Activity</h3>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{streak} Day Streak! 🔥</span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 0 2px 0', fontSize: '10px', color: 'var(--text-secondary)' }}>
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Month Labels */}
          <div style={{ display: 'flex', position: 'relative', height: '16px' }}>
            {gridData.map((week, weekIndex) => {
              if (weekIndex === 0) return null;
              const prevWeekDate = new Date(gridData[weekIndex - 1][0].date);
              const currWeekDate = new Date(week[0].date);
              if (currWeekDate.getMonth() !== prevWeekDate.getMonth()) {
                return (
                  <span
                    key={weekIndex}
                    style={{
                      position: 'absolute',
                      left: `${weekIndex * 16}px`,
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {currWeekDate.toLocaleString('default', { month: 'short' })}
                  </span>
                );
              }
              return null;
            })}
          </div>
          {/* Grid */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {gridData.map((week, weekIndex) => (
              <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {week.map((dayData, dayIndex) => (
                  <div 
                    key={dayIndex}
                    className="heatmap-cell"
                    title={`${dayData.date}: ${dayData.pages} pages read`}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: getColor(dayData.level),
                      transition: 'transform 0.1s, box-shadow 0.1s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span>Less</span>
        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getColor(0) }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getColor(1) }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getColor(2) }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getColor(3) }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getColor(4) }} />
        <span>More</span>
      </div>
    </div>
  );
};

export default Heatmap;
