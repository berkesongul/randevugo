'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import styles from '@/app/dashboard/layout.module.css';

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { tenant, membership } = useTenant();

  const navItems = [
    { name: 'Genel Bakış', path: '/dashboard', icon: '📊' },
    { name: 'Randevular', path: '/dashboard/appointments', icon: '📅' },
    { name: 'Hizmetler', path: '/dashboard/services', icon: '💇' },
    { name: 'Personel', path: '/dashboard/staff', icon: '👥' },
    { name: 'Ayarlar', path: '/dashboard/settings', icon: '⚙️' },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Link href="/" onClick={onNavigate}>
          <Image
            src="/images/randevigo-logo.png"
            alt="Randevigo Logo"
            width={160}
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>
      </div>

      <div className={styles.tenantInfo}>
        <div className={styles.tenantName}>{tenant?.name || 'Yükleniyor...'}</div>
        {membership && (
          <span className={styles.userRole}>{membership.role}</span>
        )}
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={onNavigate}
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <span className={styles.icon}>🚪</span> Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
