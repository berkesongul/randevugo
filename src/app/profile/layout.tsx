'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import { createClient } from '@/lib/supabase/client';
import styles from './profile.module.css';

interface ProfileUser {
  id: string;
  email: string;
  fullName: string;
}

const PROFILE_LINKS = [
  { href: '/customer', icon: 'G', label: 'Genel bakış', detail: 'Müşteri paneli' },
  { href: '/profile/edit', icon: 'P', label: 'Profil bilgilerim', detail: 'Kişisel bilgilerin' },
  { href: '/profile/appointments', icon: 'R', label: 'Randevularım', detail: 'Geçmiş ve aktif' },
  { href: '/profile/settings', icon: 'A', label: 'Hesap ayarları', detail: 'Şifre ve güvenlik' },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

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

    void checkAuth();
  }, [pathname, router, supabase]);

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <span className={styles.loadingMark} aria-hidden="true" />
        <p>Hesap bilgilerin yükleniyor...</p>
      </main>
    );
  }

  return (
    <div className={styles.container}>
      <PublicHeader />

      <div className={styles.accountShell}>
        <header className={styles.accountHero}>
          <div>
            <span>Hesap merkezi</span>
            <h1>Kişisel alanın</h1>
            <p>Profil bilgilerini, randevularını ve hesap güvenliğini buradan yönet.</p>
          </div>
          <Link href="/explore">
            Yeni randevu al <span aria-hidden="true">→</span>
          </Link>
        </header>

        <div className={styles.layoutGrid}>
          <aside className={styles.sidebar}>
            <div className={styles.userMetaSummary}>
              <div className={styles.metaAvatar}>
                {user?.fullName?.[0]?.toLocaleUpperCase('tr-TR') || 'K'}
              </div>
              <div>
                <strong>{user?.fullName}</strong>
                <small>{user?.email}</small>
              </div>
            </div>

            <nav className={styles.sidebarNav} aria-label="Hesap menüsü">
              {PROFILE_LINKS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`}
                  >
                    <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <span className={styles.navArrow} aria-hidden="true">›</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className={styles.mainPanel}>{children}</main>
        </div>
      </div>
    </div>
  );
}
