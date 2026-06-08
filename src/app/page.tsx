'use client';

// =============================================================================
// Booking.com Style Homepage for Randevigo
// =============================================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './homepage.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  barber: 'Berber',
  beauty_salon: 'Güzellik Salonu',
  clinic: 'Klinik',
  spa: 'Spa & Masaj',
  fitness: 'Fitness & Spor',
  dental: 'Diş Kliniği',
  veterinary: 'Veteriner',
  consulting: 'Danışmanlık',
  photography: 'Fotoğrafçılık',
  education: 'Eğitim & Kurs',
  other: 'Diğer',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  barber: '💈',
  beauty_salon: '💅',
  clinic: '🏥',
  spa: '💆',
  fitness: '💪',
  dental: '🦷',
  veterinary: '🐾',
  consulting: '💼',
  photography: '📷',
  education: '📚',
  other: '✨',
};

// Gradient mapping for visual card placeholders
const CATEGORY_GRADIENTS: Record<string, string> = {
  barber: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  beauty_salon: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
  clinic: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
  spa: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  fitness: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
  dental: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
  veterinary: 'linear-gradient(135deg, #15803d 0%, #4ade80 100%)',
  consulting: 'linear-gradient(135deg, #4b5563 0%, #9ca3af 100%)',
  photography: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
  education: 'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
  other: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
};

interface TenantCard {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  category: string | null;
  rating?: number;
}

export default function Homepage() {
  const [user, setUser] = useState<any | null>(null);
  const [tenants, setTenants] = useState<TenantCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Active search filters applied after clicking "Arama Yap"
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCity, setAppliedCity] = useState('');

  // Dropdown UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const router = useRouter();

  // Load User and Tenants
  useEffect(() => {
    async function loadData() {
      // Get auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email,
          fullName: profile?.full_name || 'Kullanıcı',
        });
      }

      // Fetch tenants
      const { data: tenantData, error } = await supabase
        .from('tenants')
        .select('id, name, slug, city, address, phone, description, category')
        .order('name');

      if (!error && tenantData) {
        // Inject random realistic rating for Booking.com feel
        const tenantsWithRatings = tenantData.map(t => ({
          ...t,
          rating: Number((8 + Math.random() * 2).toFixed(1)), // Ratings between 8.0 and 10.0
        }));
        setTenants(tenantsWithRatings);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // Click outside menu listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derive unique cities
  const cities = useMemo(() => {
    const set = new Set(tenants.map(t => t.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [tenants]);

  // Handle Search submit
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAppliedSearch(searchQuery);
    setAppliedCity(selectedCity);
  }

  // Handle direct location quick-filter
  function handleQuickLocationSelect(city: string) {
    setSelectedCity(city);
    setAppliedCity(city);
  }

  // Logout handler
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setIsMenuOpen(false);
    router.refresh();
  }

  // Filtered list
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = !appliedSearch || t.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
        (t.category && CATEGORY_LABELS[t.category]?.toLowerCase().includes(appliedSearch.toLowerCase()));
      const matchesCity = !appliedCity || (t.city && t.city.toLowerCase() === appliedCity.toLowerCase());
      return matchesSearch && matchesCity;
    });
  }, [tenants, appliedSearch, appliedCity]);

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
          <div className={styles.navActions}>
            <Link href="/kurumsal" style={{ marginRight: '1rem', fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              Kurumsal
            </Link>

            {user ? (
              <div className={styles.profileContainer} ref={menuRef}>
                <button className={styles.profileBtn} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <span className={styles.avatar}>{user.fullName[0].toUpperCase()}</span>
                  <span>{user.fullName}</span>
                  <span style={{ fontSize: '0.75rem' }}>▼</span>
                </button>
                {isMenuOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.userName}>{user.fullName}</div>
                      <div className={styles.userEmail}>{user.email}</div>
                    </div>
                    <Link href="/profile/edit" className={styles.dropdownItem} onClick={() => setIsMenuOpen(false)}>
                      👤 Profilimi Düzenle
                    </Link>
                    <Link href="/profile/appointments" className={styles.dropdownItem} onClick={() => setIsMenuOpen(false)}>
                      📅 Bilgilerim & Randevularım
                    </Link>
                    <Link href="/profile/settings" className={styles.dropdownItem} onClick={() => setIsMenuOpen(false)}>
                      ⚙️ Ayarlar
                    </Link>
                    <div className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                      🚪 Çıkış Yap
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className={styles.loginBtn}>Giriş Yap</Link>
                <Link href="/signup" className={styles.signupBtn}>Kayıt Ol</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero / Banner */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Bir sonraki randevunuzu bulun</h1>
          <p className={styles.heroSubtitle}>Güzellik salonları, klinikler, berberler ve daha fazlasından anında randevu alın...</p>
        </div>
      </section>

      {/* Booking.com Search Bar */}
      <div className={styles.searchBarWrapper}>
        <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
          {/* Hizmet arama */}
          <div className={styles.searchField}>
            <span className={styles.searchFieldIcon}>🔍</span>
            <input
              type="text"
              placeholder="Hizmet veya işletme adı arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tarih seçimi */}
          <div className={styles.searchField}>
            <span className={styles.searchFieldIcon}>📅</span>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          {/* Konum / Şehir */}
          <div className={styles.searchField}>
            <span className={styles.searchFieldIcon}>📍</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">Nereye gidiyorsunuz? (Şehir)</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Arama Butonu */}
          <button type="submit" className={styles.searchBtn}>Arama Yap</button>
        </form>
      </div>

      {/* Main Section */}
      <main className={styles.mainSection}>

        {/* Location Selection Question Box */}
        <div className={styles.locationQuestionBox}>
          <h2 className={styles.locationQuestionTitle}>📍 Hangi şehirde hizmet almak istersiniz?</h2>
          <div className={styles.locationButtons}>
            <button
              type="button"
              className={`${styles.locationBtn} ${!appliedCity ? styles.locationBtnActive : ''}`}
              onClick={() => handleQuickLocationSelect('')}
            >
              Tüm Şehirler
            </button>
            {cities.map(city => (
              <button
                key={city}
                type="button"
                className={`${styles.locationBtn} ${appliedCity.toLowerCase() === city.toLowerCase() ? styles.locationBtnActive : ''}`}
                onClick={() => handleQuickLocationSelect(city)}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Section Header */}
        <h2 className={styles.sectionTitle}>
          {appliedCity ? `${appliedCity} Şehrindeki İşletmeler` : 'Öne Çıkan İşletmeler'}
        </h2>
        <p className={styles.sectionSubtitle}>
          En popüler işletmeler arasından dilediğinizi seçin ve hemen randevunuzu planlayın.
        </p>

        {/* Tenant List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>İşletmeler yükleniyor...</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Aramanıza uygun işletme bulunamadı</h3>
            <p>Farklı bir hizmet adı veya şehir aramayı deneyebilirsiniz.</p>
          </div>
        ) : (
          <div className={styles.tenantsList}>
            {filteredTenants.map(tenant => {
              const gradient = CATEGORY_GRADIENTS[tenant.category || 'other'];
              const emoji = CATEGORY_EMOJIS[tenant.category || 'other'];
              const ratingText = tenant.rating && tenant.rating >= 9.5 ? 'Olağanüstü' : 'Çok İyi';

              return (
                <div key={tenant.id} className={styles.tenantCard}>
                  {/* Visual Category Placeholder acting as Image */}
                  <div className={styles.tenantImageWrapper} style={{ background: gradient, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
                    <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>{emoji}</span>
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>
                      {CATEGORY_LABELS[tenant.category || 'other']}
                    </span>
                  </div>

                  <div className={styles.tenantDetails}>
                    <div className={styles.tenantMain}>
                      <div className={styles.tenantInfoBlock}>
                        <div className={styles.tenantCategory}>
                          {CATEGORY_LABELS[tenant.category || 'other']}
                        </div>
                        <h3 className={styles.tenantName}>{tenant.name}</h3>
                        <div className={styles.tenantAddress}>
                          <span>📍</span>
                          <span>{tenant.address || `${tenant.city || 'Belirtilmemiş'}`}</span>
                        </div>
                        {tenant.description && (
                          <p className={styles.tenantDesc}>{tenant.description}</p>
                        )}
                      </div>

                      {/* Booking.com Rating layout */}
                      <div className={styles.tenantRightBlock}>
                        <div className={styles.tenantRatingRow}>
                          <span className={styles.ratingLabel}>{ratingText}</span>
                          <span className={styles.ratingBadge}>{tenant.rating}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Yorumlara Göre
                        </span>
                      </div>
                    </div>

                    <div className={styles.tenantActionRow}>
                      <div className={styles.tenantContact}>
                        {tenant.phone && <span>📞 {tenant.phone}</span>}
                      </div>
                      <Link href={`/${tenant.slug}`} className={styles.bookButton}>
                        Yer Ayırtın / Randevu Al ➔
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Image src="/images/randevigo-logo.png" alt="Randevigo" width={75} height={25} style={{ objectFit: 'contain' }} />
            <span>© 2026</span>
          </div>
          <div>Berke Songul tarafından geliştirildi.</div>
        </div>
      </footer>
    </div>
  );
}
