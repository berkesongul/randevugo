'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import styles from './explore.module.css';

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

interface TenantCard {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  category: string | null;
}

export default function ExplorePage() {
  const [tenants, setTenants] = useState<TenantCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchTenants() {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, city, address, phone, description, category')
        .order('name');

      if (!error && data) {
        setTenants(data);
      }
      setLoading(false);
    }
    fetchTenants();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Derive unique cities from data
  const cities = useMemo(() => {
    const set = new Set(tenants.map(t => t.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [tenants]);

  // Derive unique categories from data
  const categories = useMemo(() => {
    const set = new Set(tenants.map(t => t.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [tenants]);

  // Filtered tenants
  const filtered = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
      const matchesCity = !cityFilter || t.city === cityFilter;
      const matchesCategory = !categoryFilter || t.category === categoryFilter;
      return matchesSearch && matchesCity && matchesCategory;
    });
  }, [tenants, search, cityFilter, categoryFilter]);

  return (
    <div className={styles.container}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Image
            src="/images/randevigo-logo.png"
            alt="Randevigo"
            width={120}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className={styles.topbarRight}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="İşletme ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Tüm Şehirler</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {loading ? (
          <div className={styles.empty}>
            <p>Yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <h3>İşletme bulunamadı</h3>
            <p>Filtreleri değiştirerek tekrar deneyin.</p>
          </div>
        ) : (
          filtered.map(tenant => (
            <Link
              key={tenant.id}
              href={`/${tenant.slug}`}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardName}>{tenant.name}</h3>
                {tenant.category && (
                  <span className={styles.categoryBadge}>
                    {CATEGORY_LABELS[tenant.category] || tenant.category}
                  </span>
                )}
              </div>

              {tenant.description && (
                <p className={styles.cardDescription}>{tenant.description}</p>
              )}

              <div className={styles.cardMeta}>
                {tenant.city && (
                  <span className={styles.metaItem}>📍 {tenant.city}</span>
                )}
                {tenant.phone && (
                  <span className={styles.metaItem}>📞 {tenant.phone}</span>
                )}
                {tenant.address && (
                  <span className={styles.metaItem}>🏠 {tenant.address}</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
