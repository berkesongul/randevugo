'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import { createClient } from '@/lib/supabase/client';
import type {
  CustomerAppointment,
  Database,
  FavoriteTenant,
} from '@/types/types';
import styles from './customer.module.css';

type Tab = 'profile' | 'appointments' | 'favorites' | 'contact';
type AppSupabaseClient = SupabaseClient<Database>;

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

const TABS: Array<{ id: Tab; icon: string; label: string; detail: string }> = [
  { id: 'profile', icon: 'K', label: 'Genel bakış', detail: 'Hesap özetin' },
  { id: 'appointments', icon: 'R', label: 'Randevularım', detail: 'Taleplerini yönet' },
  { id: 'favorites', icon: 'F', label: 'Favorilerim', detail: 'Kaydettiğin işletmeler' },
  { id: 'contact', icon: 'İ', label: 'İletişim', detail: 'Bilgilerini güncelle' },
];

const STATUS_LABELS: Record<CustomerAppointment['status'], string> = {
  pending: 'Onay bekliyor',
  confirmed: 'Onaylandı',
  cancelled: 'İptal edildi',
  completed: 'Tamamlandı',
};

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
        router.push('/login?redirect=/customer');
        return;
      }

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

    void checkAuth();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadingMark} aria-hidden="true" />
        <p>Hesabın hazırlanıyor...</p>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main className={styles.shell}>
        <section className={styles.welcome}>
          <div>
            <span className={styles.eyebrow}>Müşteri paneli</span>
            <h1>Merhaba, {user?.full_name.split(' ')[0]}</h1>
            <p>Randevularını, favorilerini ve kişisel bilgilerini tek yerden yönet.</p>
          </div>
          <div className={styles.welcomeActions}>
            <Link href="/explore" className={styles.primaryAction}>
              Yeni randevu al <span aria-hidden="true">→</span>
            </Link>
            <Link href="/profile/edit" className={styles.secondaryAction}>
              Profili düzenle
            </Link>
          </div>
        </section>

        <section className={styles.accountGrid}>
          <aside className={styles.sidebar}>
            <div className={styles.identity}>
              <span className={styles.avatar} aria-hidden="true">
                {user?.full_name.charAt(0).toLocaleUpperCase('tr-TR') || 'K'}
              </span>
              <div>
                <strong>{user?.full_name}</strong>
                <small>{user?.email}</small>
              </div>
            </div>

            <div className={styles.tabList} role="tablist" aria-label="Müşteri hesabı bölümleri">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={styles.tabIcon} aria-hidden="true">{tab.icon}</span>
                  <span>
                    <strong>{tab.label}</strong>
                    <small>{tab.detail}</small>
                  </span>
                  <span className={styles.tabArrow} aria-hidden="true">›</span>
                </button>
              ))}
            </div>

            <div className={styles.sidebarNote}>
              <span aria-hidden="true">✓</span>
              <p><strong>Güvenli hesap</strong> Bilgilerin yalnızca randevu oluşturduğun işletmeyle paylaşılır.</p>
            </div>
          </aside>

          <div className={styles.panel} role="tabpanel">
            {activeTab === 'profile' && <ProfileTab user={user} />}
            {activeTab === 'appointments' && (
              <AppointmentsTab supabase={supabase} userId={user?.id} />
            )}
            {activeTab === 'favorites' && (
              <FavoritesTab supabase={supabase} userId={user?.id} />
            )}
            {activeTab === 'contact' && (
              <ContactTab supabase={supabase} userId={user?.id} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function PanelHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className={styles.panelHeading}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function ProfileTab({ user }: { user: UserProfile | null }) {
  return (
    <>
      <PanelHeading
        eyebrow="Hesap özeti"
        title="Bilgilerin bir bakışta"
        description="Randevu oluştururken kullanılan temel hesap bilgilerini buradan kontrol edebilirsin."
      />
      <div className={styles.infoGrid}>
        <article className={styles.infoCard}>
          <span>Ad soyad</span>
          <strong>{user?.full_name}</strong>
          <small>Randevularında görünen isim</small>
        </article>
        <article className={styles.infoCard}>
          <span>E-posta</span>
          <strong>{user?.email}</strong>
          <small>Hesabına bağlı iletişim adresi</small>
        </article>
      </div>
      <div className={styles.profileCallout}>
        <div>
          <strong>Bilgilerin güncel mi?</strong>
          <p>Telefon, şehir ve profil bilgilerini düzenleyerek randevu sürecini hızlandır.</p>
        </div>
        <Link href="/profile/edit">Bilgileri düzenle</Link>
      </div>
    </>
  );
}

function AppointmentsTab({
  supabase,
  userId,
}: {
  supabase: AppSupabaseClient;
  userId?: string;
}) {
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchAppointments() {
      if (!userId) return;
      const { data, error } = await supabase.rpc('get_my_appointments');
      if (!isActive) return;
      setActionError(error?.message || null);
      setAppointments(data || []);
      setIsLoading(false);
    }

    void fetchAppointments();
    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  async function handleCancel(id: string) {
    if (!window.confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;

    const { error } = await supabase.rpc('cancel_my_appointment', {
      p_appointment_id: id,
    });

    if (error) {
      setActionError(error.message);
      return;
    }

    setActionError(null);
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status: 'cancelled' }
          : appointment
      )
    );
  }

  return (
    <>
      <PanelHeading
        eyebrow="Randevu geçmişi"
        title="Randevularım"
        description="Aktif taleplerini takip et, geçmiş randevularını görüntüle."
      />
      {actionError && <p className={styles.errorMessage}>{actionError}</p>}
      {isLoading ? (
        <div className={styles.panelLoading}>Randevuların yükleniyor...</div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="R"
          title="Henüz randevun yok"
          description="İhtiyacına uygun işletmeyi keşfet ve ilk randevunu birkaç adımda oluştur."
          href="/explore"
          action="İşletmeleri keşfet"
        />
      ) : (
        <div className={styles.appointmentsList}>
          {appointments.map((appointment) => {
            const date = new Date(appointment.start_time);
            return (
              <article key={appointment.id} className={styles.appointmentCard}>
                <div className={styles.dateBlock}>
                  <strong>{date.toLocaleDateString('tr-TR', { day: '2-digit' })}</strong>
                  <span>{date.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                </div>
                <div className={styles.appointmentBody}>
                  <div className={styles.appointmentTitle}>
                    <div>
                      <span>{appointment.service_name}</span>
                      <h3>{appointment.tenant_name}</h3>
                    </div>
                    <span className={`${styles.status} ${styles[appointment.status]}`}>
                      {STATUS_LABELS[appointment.status]}
                    </span>
                  </div>
                  <div className={styles.appointmentMeta}>
                    <span>{date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{appointment.staff_name || 'Personel seçilmedi'}</span>
                  </div>
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => handleCancel(appointment.id)}
                    >
                      Randevuyu iptal et
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function FavoritesTab({
  supabase,
  userId,
}: {
  supabase: AppSupabaseClient;
  userId?: string;
}) {
  const [favorites, setFavorites] = useState<FavoriteTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (!userId) return;
      const { data } = await supabase.rpc('get_my_favorites');
      setFavorites(data || []);
      setIsLoading(false);
    }

    void fetchFavorites();
  }, [supabase, userId]);

  return (
    <>
      <PanelHeading
        eyebrow="Kaydedilenler"
        title="Favori işletmelerim"
        description="Beğendiğin işletmelere yeniden ulaş ve uygun saatlerini hızlıca kontrol et."
      />
      {isLoading ? (
        <div className={styles.panelLoading}>Favorilerin yükleniyor...</div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon="F"
          title="Favori listen henüz boş"
          description="Daha sonra kolayca bulmak istediğin işletmeleri kalp simgesiyle kaydet."
          href="/explore"
          action="Keşfetmeye başla"
        />
      ) : (
        <div className={styles.favoritesList}>
          {favorites.map((favorite) => (
            <article key={favorite.id} className={styles.favoriteCard}>
              <div className={styles.favoriteVisual}>
                <span aria-hidden="true">♡</span>
              </div>
              <div>
                <span>{favorite.city || 'Online randevu'}</span>
                <h3>{favorite.name}</h3>
                <Link href={`/${favorite.slug}`}>
                  İşletmeyi görüntüle <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function ContactTab({
  supabase,
  userId,
}: {
  supabase: AppSupabaseClient;
  userId?: string;
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    void fetchContactInfo();
  }, [supabase, userId]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from('profiles')
      .update({ phone: phoneNumber, city })
      .eq('id', userId);

    setMessage(
      error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: 'İletişim bilgilerin güncellendi.' }
    );
    setIsSaving(false);
  }

  return (
    <>
      <PanelHeading
        eyebrow="İletişim bilgileri"
        title="Sana nasıl ulaşalım?"
        description="Randevu iletişiminde kullanılacak telefon ve şehir bilgilerini güncel tut."
      />
      {message && (
        <p className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
          {message.text}
        </p>
      )}
      <form className={styles.contactForm} onSubmit={handleSave}>
        <label>
          <span>Telefon numarası</span>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="05xx xxx xx xx"
            autoComplete="tel"
          />
        </label>
        <label>
          <span>Şehir</span>
          <input
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Örn. İstanbul"
            autoComplete="address-level2"
          />
        </label>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Kaydediliyor...' : 'Bilgileri kaydet'}
        </button>
      </form>
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className={styles.emptyState}>
      <span aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={href}>{action}</Link>
    </div>
  );
}
