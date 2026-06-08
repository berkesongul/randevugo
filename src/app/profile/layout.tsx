'use client';

// =============================================================================
// Profile Pages Common Layout
// =============================================================================

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import styles from './profile.module.css';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login?redirect=' + encodeURIComponent(pathname));
        return;
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        fullName: profile?.full_name || 'Kullanıcı',
      });
      setLoading(false);
    }
    checkAuth();
  }, [supabase, router, pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <Link href="/">
            <Image
              src="/images/randevigo-logo.png"
              alt="Randevigo"
              width={130}
              height={45}
              style={{ objectFit: 'contain', cursor: 'pointer' }}
              priority
            />
          </Link>
          <button 
            onClick={handleLogout} 
            style={{
              background: 'transparent',
              border: '1px solid #fee2e2',
              color: '#dc2626',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Çıkış Yap
          </button>
        </div>
      </nav>

      {/* Main Grid */}
      <div className={styles.layoutGrid}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.userMetaSummary}>
            <div className={styles.metaAvatar}>{user?.fullName?.[0]?.toUpperCase()}</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
          
          <div className={styles.sidebarTitle}>Menü</div>
          
          <Link 
            href="/profile/edit" 
            className={`${styles.sidebarLink} ${pathname === '/profile/edit' ? styles.sidebarLinkActive : ''}`}
          >
            👤 Profilimi Düzenle
          </Link>
          <Link 
            href="/profile/appointments" 
            className={`${styles.sidebarLink} ${pathname === '/profile/appointments' ? styles.sidebarLinkActive : ''}`}
          >
            📅 Bilgilerim & Randevularım
          </Link>
          <Link 
            href="/profile/settings" 
            className={`${styles.sidebarLink} ${pathname === '/profile/settings' ? styles.sidebarLinkActive : ''}`}
          >
            ⚙️ Ayarlar
          </Link>
        </aside>

        {/* Panel Content */}
        <main className={styles.mainPanel}>
          {children}
        </main>
      </div>
    </div>
  );
}
