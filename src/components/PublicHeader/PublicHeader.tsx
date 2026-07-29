'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/types';
import styles from './PublicHeader.module.css';

type HeaderUser = {
  name: string;
  email: string;
  role: UserRole;
};

const NAV_ITEMS = [
  { href: '/explore', label: 'İşletmeleri Keşfet' },
  { href: '/kurumsal', label: 'Kurumsal' },
  { href: '/fiyatlandirma', label: 'Fiyatlandırma' },
];

export default function PublicHeader() {
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!active || !authUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', authUser.id)
        .single();

      if (!active) return;
      setUser({
        name: profile?.full_name || 'Kullanıcı',
        email: authUser.email || '',
        role: profile?.role || 'client',
      });
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setAccountOpen(false);
    setMobileOpen(false);
    router.refresh();
  }

  const accountHref = user?.role === 'owner' ? '/dashboard' : '/customer';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Randevigo ana sayfa">
          <Image
            src="/images/randevigo-logo.svg"
            alt="Randevigo"
            width={168}
            height={45}
            priority
          />
        </Link>

        <nav className={styles.desktopNav} aria-label="Ana navigasyon">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? styles.activeLink : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          {user ? (
            <div className={styles.account} ref={accountRef}>
              <button
                type="button"
                className={styles.accountButton}
                onClick={() => setAccountOpen((current) => !current)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className={styles.avatar}>
                  {user.name.charAt(0).toLocaleUpperCase('tr-TR')}
                </span>
                <span className={styles.accountName}>{user.name}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m7 10 5 5 5-5" />
                </svg>
              </button>

              {accountOpen && (
                <div className={styles.accountMenu} role="menu">
                  <div className={styles.accountHeader}>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link href={accountHref} role="menuitem">
                    Hesabıma git
                  </Link>
                  <Link href="/profile/edit" role="menuitem">
                    Profilimi düzenle
                  </Link>
                  <button type="button" onClick={handleLogout} role="menuitem">
                    Çıkış yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.guestActions}>
              <Link href="/login" className={styles.loginLink}>
                Giriş yap
              </Link>
              <Link href="/signup" className={styles.signupLink}>
                Ücretsiz başla
              </Link>
            </div>
          )}

          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMobileOpen((current) => !current)}
            aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className={styles.mobileNav} aria-label="Mobil navigasyon">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {!user && (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Giriş yap
              </Link>
              <Link
                href="/signup?role=owner"
                onClick={() => setMobileOpen(false)}
              >
                İşletmeni ekle
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
