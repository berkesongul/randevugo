'use client';

// =============================================================================
// Login Page
// =============================================================================

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getSafeRedirectPath } from '@/lib/navigation';
import styles from './login.module.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = getSafeRedirectPath(searchParams.get('redirect'));
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
      router.push('/');
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
            src="/images/randevigo-logo.svg"
            alt="Randevigo Logo"
            width={220}
            height={120}
            priority
            style={{ objectFit: 'contain', height: 'auto' }}
          />
          <p>Randevu Yönetim Sistemi</p>
        </div>

        <Suspense fallback={<div>Yükleniyor...</div>}>
          <LoginForm />
        </Suspense>

        <div className={styles.footer}>
          <p style={{ marginBottom: '1rem' }}>
            Hesabınız yok mu?{' '}
            <Link href="/signup">Kayıt Ol</Link>
          </p>
          <div style={{ opacity: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
             <Image src="/images/randevigo-logo.svg" alt="Randevigo Logo" width={80} height={44} style={{ objectFit: 'contain', height: 'auto' }} />
             <span>© 2026</span>
          </div>
        </div>
      </div>
    </main>
  );
}
