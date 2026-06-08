'use client';

// =============================================================================
// Login Page
// =============================================================================

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import styles from './login.module.css';

function LoginForm({ activeTab }: { activeTab: 'client' | 'owner' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    if (redirectUrl) {
      router.push(redirectUrl);
    } else if (authData.user) {
      // Fetch user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      const userRole = profile?.role || 'client';

      if (activeTab === 'client') {
        // Client tab: always go to customer dashboard
        if (userRole === 'owner') {
          // Owner trying to login from client tab — warn them
          setError('Bu hesap bir işletme hesabıdır. Lütfen "İşletme Girişi" sekmesini kullanın.');
          setIsLoading(false);
          // Sign out since we don't want them stuck
          await supabase.auth.signOut();
          return;
        }
        router.push('/customer');
      } else {
        // Owner tab: go to dashboard or setup
        if (userRole === 'client') {
          setError('Bu hesap bir müşteri hesabıdır. Lütfen "Müşteri Girişi" sekmesini kullanın.');
          setIsLoading(false);
          await supabase.auth.signOut();
          return;
        }

        // Check if owner has a tenant
        const { data: memberships } = await supabase
          .from('tenant_members')
          .select('id')
          .eq('profile_id', authData.user.id)
          .limit(1);

        if (memberships && memberships.length > 0) {
          router.push('/dashboard');
        } else {
          router.push('/setup');
        }
      }
    } else {
      router.push('/');
    }
    
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="email">E-posta</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@email.com"
          required
          autoComplete="email"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Şifre</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        type="submit"
        className={styles.button}
        disabled={isLoading}
      >
        {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'client' | 'owner'>('client');

  return (
    <main className={styles.container}>
      <div className={styles.bgWrapper}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
      </div>
      
      <div className={styles.card}>
        <div className={styles.logo}>
          <Image
            src="/images/randevigo-logo.png"
            alt="Randevigo Logo"
            width={220}
            height={80}
            priority
            style={{ objectFit: 'contain' }}
          />
          <p>Randevu Yönetim Sistemi</p>
        </div>

        <div className={styles.tabSwitcher}>
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`${styles.tabBtn} ${activeTab === 'client' ? styles.tabActive : ''}`}
          >
            👤 Müşteri Girişi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('owner')}
            className={`${styles.tabBtn} ${activeTab === 'owner' ? styles.tabActive : ''}`}
          >
            🏪 İşletme Girişi
          </button>
        </div>

        <Suspense fallback={<div>Yükleniyor...</div>}>
          <LoginForm activeTab={activeTab} />
        </Suspense>

        <div className={styles.footer}>
          <p style={{ marginBottom: '1rem' }}>
            Hesabınız yok mu?{' '}
            <a href="/signup">Kayıt Ol</a>
          </p>
          <div style={{ opacity: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
             <Image src="/images/randevigo-logo.png" alt="Randevigo Logo" width={80} height={30} style={{ objectFit: 'contain' }} />
             <span>© 2026</span>
          </div>
        </div>
      </div>
    </main>
  );
}
