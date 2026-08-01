'use client';

// =============================================================================
// Signup Page
// =============================================================================

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../login/login.module.css';

function SignupContent() {
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

    const { error: authError } = await supabase.auth.signUp({
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
              src="/images/randevigo-logo.svg"
              alt="Randevigo Logo"
              width={220}
              height={120}
              priority
              style={{ objectFit: 'contain', height: 'auto' }}
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
            src="/images/randevigo-logo.svg"
            alt="Randevigo Logo"
            width={220}
            height={120}
            priority
            style={{ objectFit: 'contain', height: 'auto' }}
          />
          <p>Yeni Hesap Oluşturun</p>
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
            <Link href="/login">Giriş Yap</Link>
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

export default function SignupPage() {
  return (
    <Suspense fallback={
      <main className={styles.container}>
        <div style={{ color: 'white', textAlign: 'center', padding: '4rem' }}>
          <h2>Yükleniyor...</h2>
        </div>
      </main>
    }>
      <SignupContent />
    </Suspense>
  );
}
