'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppointments } from '@/hooks/useAppointments';
import type { AppointmentStatus } from '@/types/types';
import styles from './calendar.module.css';

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 64;
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  return start;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusTone(status: AppointmentStatus) {
  if (status === 'completed') return styles.completed;
  if (status === 'cancelled') return styles.cancelled;
  if (status === 'confirmed') return styles.confirmed;
  return styles.pending;
}

export default function CalendarPage() {
  const { appointments, isLoading, error } = useAppointments();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const today = new Date();
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
  const weekAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.start_time);
    return appointmentDate >= weekStart && appointmentDate < addDays(weekStart, 7);
  });
  const weekEnd = addDays(weekStart, 6);
  const rangeLabel = `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  if (isLoading) return <div className={styles.state}>Randevu takvimi yükleniyor...</div>;
  if (error) return <div className={`${styles.state} ${styles.error}`}>Takvim verileri alınamadı: {error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Planlama merkezi</span>
          <h1>Randevu Takvimi</h1>
          <p>Haftalık programınızı görün, gün içindeki randevuları saatlerine göre takip edin.</p>
        </div>
        <Link href="/dashboard/appointments" className={styles.createButton}>+ Yeni randevu</Link>
      </header>

      <section className={styles.calendarCard} aria-label="Haftalık randevu takvimi">
        <div className={styles.toolbar}>
          <div className={styles.navigation}>
            <button type="button" onClick={() => setWeekStart((current) => addDays(current, -7))} aria-label="Önceki hafta">‹</button>
            <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>Bugün</button>
            <button type="button" onClick={() => setWeekStart((current) => addDays(current, 7))} aria-label="Sonraki hafta">›</button>
          </div>
          <strong>{rangeLabel}</strong>
          <div className={styles.weekCount}><b>{weekAppointments.length}</b> randevu</div>
        </div>

        <div className={styles.calendarScroll}>
          <div className={styles.calendar}>
            <div className={styles.weekHeader}>
              <span className={styles.timeCorner}>Saat</span>
              {days.map((day, index) => (
                <div className={`${styles.dayHeader} ${isSameDay(day, today) ? styles.today : ''}`} key={day.toISOString()}>
                  <span>{DAY_NAMES[index]}</span>
                  <strong>{day.getDate()}</strong>
                </div>
              ))}
            </div>

            <div className={styles.calendarBody}>
              <div className={styles.timeLabels}>
                {hours.map((hour) => <span key={hour}>{String(hour).padStart(2, '0')}:00</span>)}
              </div>
              {days.map((day) => {
                const dayAppointments = weekAppointments
                  .filter((appointment) => isSameDay(new Date(appointment.start_time), day))
                  .sort((first, second) => new Date(first.start_time).getTime() - new Date(second.start_time).getTime());

                return (
                  <div className={`${styles.dayColumn} ${isSameDay(day, today) ? styles.todayColumn : ''}`} key={day.toISOString()}>
                    {dayAppointments.map((appointment) => {
                      const start = new Date(appointment.start_time);
                      const end = new Date(appointment.end_time);
                      const startMinutes = start.getHours() * 60 + start.getMinutes();
                      const endMinutes = end.getHours() * 60 + end.getMinutes();
                      const top = Math.max(0, ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT);
                      const height = Math.max(42, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT);
                      const isOutsideVisibleHours = startMinutes < START_HOUR * 60 || startMinutes >= END_HOUR * 60;

                      if (isOutsideVisibleHours) return null;

                      return (
                        <article
                          className={`${styles.appointment} ${getStatusTone(appointment.status)}`}
                          key={appointment.id}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          title={`${appointment.client_name} · ${appointment.services?.name || 'Hizmet'} · ${formatTime(start)}`}
                        >
                          <strong>{appointment.client_name}</strong>
                          <span>{appointment.services?.name || 'Hizmet'}</span>
                          <small>{formatTime(start)} – {formatTime(end)}</small>
                        </article>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className={styles.legend}>
          <span><i className={styles.pending} /> Bekliyor</span>
          <span><i className={styles.confirmed} /> Onaylandı</span>
          <span><i className={styles.completed} /> Tamamlandı</span>
          <span><i className={styles.cancelled} /> İptal</span>
        </footer>
      </section>
    </div>
  );
}
