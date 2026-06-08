'use client';

import { useState } from 'react';
import { useTenant } from '@/hooks/useTenant';
import Sidebar from '@/components/dashboard/Sidebar';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, error } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Hata: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className={styles.sidebarOverlay} 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.sidebarVisible : ''}`}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className={styles.main}>
        {/* Mobile top bar with hamburger */}
        <div className={styles.mobileHeader}>
          <button 
            className={styles.hamburger} 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menü aç/kapa"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <span className={styles.mobileTitle}>Dashboard</span>
        </div>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
