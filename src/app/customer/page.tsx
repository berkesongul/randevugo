'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './customer.module.css';

type Tab = 'profile' | 'appointments' | 'favorites' | 'contact';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile && profile.role !== 'client') {
        router.push('/dashboard');
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        full_name: profile?.full_name || 'Kullanıcı',
      });

      setIsLoading(false);
    }

    checkAuth();
  }, [supabase, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (isLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.loading}>Yükleniyor...</div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src="/images/randevigo-logo.png"
              alt="Randevigo"
              width={140}
              height={50}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Çıkış Yap
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.headerCard}>
          <div className={styles.headerContent}>
            <div className={styles.avatar}>👤</div>
            <div>
              <h1 className={styles.title}>Hoş geldiniz, {user?.full_name}!</h1>
              <p className={styles.email}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profil
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'appointments' ? styles.active : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              📅 Randevularım
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'favorites' ? styles.active : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              ❤️ Favori İşletmeler
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'contact' ? styles.active : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              📞 İletişim Bilgileri
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'profile' && (
              <ProfileTab user={user} supabase={supabase} />
            )}
            {activeTab === 'appointments' && <AppointmentsTab supabase={supabase} userId={user?.id} />}
            {activeTab === 'favorites' && <FavoritesTab supabase={supabase} userId={user?.id} />}
            {activeTab === 'contact' && (
              <ContactTab user={user} supabase={supabase} userId={user?.id} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Profile Tab Component
function ProfileTab({ user, supabase }: any) {
  return (
    <div className="card">
      <h2>Profil Bilgileri</h2>
      <div className="form-group">
        <label>Ad Soyad</label>
        <input type="text" value={user?.full_name} readOnly />
      </div>
      <div className="form-group">
        <label>E-mail</label>
        <input type="email" value={user?.email} readOnly />
      </div>
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Profil bilgilerinizi düzenlemek için ayarlar sayfasını ziyaret edin.
      </p>
    </div>
  );
}

// Appointments Tab Component
function AppointmentsTab({ supabase, userId }: any) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!userId) return;

      const { data } = await supabase
        .from('appointments')
        .select(
          `
          id,
          start_time,
          end_time,
          status,
          services (name),
          staff (name),
          tenants (name, slug)
        `
        )
        .eq('client_id', userId)
        .order('start_time', { ascending: false });

      setAppointments(data || []);
      setIsLoading(false);
    }

    fetchAppointments();
  }, [supabase, userId]);

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="card">
      <h2>Randevularım</h2>
      {appointments.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          Henüz randevu almamışsınız. <Link href="/explore">İşletmeleri keşfet</Link>
        </p>
      ) : (
        <div className={styles.appointmentsList}>
          {appointments.map((apt: any) => (
            <div key={apt.id} className={styles.appointmentCard}>
              <div className={styles.appointmentHeader}>
                <h3>{apt.tenants?.name}</h3>
                <span className={`${styles.status} ${styles[apt.status]}`}>{apt.status}</span>
              </div>
              <div className={styles.appointmentDetails}>
                <p>
                  <strong>Hizmet:</strong> {apt.services?.name}
                </p>
                <p>
                  <strong>Personel:</strong> {apt.staff?.name}
                </p>
                <p>
                  <strong>Tarih & Saat:</strong>{' '}
                  {new Date(apt.start_time).toLocaleString('tr-TR')}
                </p>
              </div>
              <div className={styles.appointmentActions}>
                <button className={styles.editBtn}>Düzenle</button>
                <button className={styles.cancelBtn}>İptal Et</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Favorites Tab Component
function FavoritesTab({ supabase, userId }: any) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (!userId) return;

      const { data } = await supabase
        .from('favorites')
        .select('tenants (id, name, slug, city)')
        .eq('profile_id', userId);

      setFavorites(data?.map((f: any) => f.tenants) || []);
      setIsLoading(false);
    }

    fetchFavorites();
  }, [supabase, userId]);

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="card">
      <h2>Favori İşletmeler</h2>
      {favorites.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          Henüz favori işletmeniz yok. <Link href="/explore">Keşfetmeye başlayın</Link>
        </p>
      ) : (
        <div className={styles.favoritesList}>
          {favorites.map((fav: any) => (
            <div key={fav.id} className={styles.favoriteCard}>
              <h3>{fav.name}</h3>
              {fav.city && <p>{fav.city}</p>}
              <Link href={`/${fav.slug}`} className={styles.visitBtn}>
                Ziyaret Et
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Contact Tab Component
function ContactTab({ user, supabase, userId }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchContactInfo() {
      if (!userId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, city')
        .eq('id', userId)
        .single();

      if (profile) {
        setPhoneNumber(profile.phone || '');
        setCity(profile.city || '');
      }
    }

    fetchContactInfo();
  }, [supabase, userId]);

  async function handleSave() {
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ phone: phoneNumber, city })
      .eq('id', userId);

    if (!error) {
      alert('İletişim bilgileri kaydedildi!');
    } else {
      alert('Hata: ' + error.message);
    }
    setIsSaving(false);
  }

  return (
    <div className="card">
      <h2>İletişim Bilgileri</h2>
      <div className="form-group">
        <label>Telefon Numarası</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Telefon numaranız"
        />
      </div>
      <div className="form-group">
        <label>Şehir</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Bulunduğunuz şehir"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={styles.saveBtn}
      >
        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}
