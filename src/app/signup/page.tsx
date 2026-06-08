'use client';

// =============================================================================
// Signup Page
// =============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import styles from '../login/login.module.css';
import type { UserRole } from '@/types/types';

export default function SignupPage() {
  const [role, setRole] = useState<UserRole>('client'); // default to client
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    // Update the profile role immediately after signup
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', authData.user.id);
        
      if (profileError) {
        console.error("Profil rolü güncellenirken hata oluştu:", profileError);
      }
    }

    setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
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
            <p>Kayıt başarılı!</p>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.6 }}>
            E-posta adresinize bir doğrulama bağlantısı gönderildi.
            Lütfen e-postanızı kontrol edin ve hesabınızı doğrulayın.
          </p>
          <button
            className={styles.button}
            onClick={() => router.push('/login')}
            style={{ marginTop: '1.5rem' }}
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </main>
    );
  }

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
          <p>Yeni Hesap Oluşturun</p>
        </div>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', padding: '0.25rem', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => setRole('client')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: role === 'client' ? 'var(--accent-primary)' : 'transparent',
              color: role === 'client' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Ben Müşteriyim
          </button>
          <button
            type="button"
            onClick={() => setRole('owner')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: role === 'owner' ? 'var(--accent-primary)' : 'transparent',
              color: role === 'owner' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Ben İşletmeyim
          </button>
        </div>

        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="fullName">Ad Soyad</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adınız Soyadınız"
              required
              autoComplete="name"
            />
          </div>

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
              placeholder="En az 6 karakter"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className={styles.footer}>
          <p style={{ marginBottom: '1rem' }}>
            Zaten hesabınız var mı?{' '}
            <a href="/login">Giriş Yap</a>
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
