'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader/PublicHeader';
import styles from './fiyatlandirma.module.css';

type BillingPeriod = 'monthly' | 'yearly';
type PlanKey = 'free' | 'growth' | 'enterprise';

const PLANS: Record<
  PlanKey,
  {
    name: string;
    shortName: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: Array<{ text: string; available: boolean }>;
  }
> = {
  free: {
    name: 'Başlangıç',
    shortName: 'Başlangıç',
    description: 'Tek kişilik işletmelerin dijital randevuya geçmesi için.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: '1 personel', available: true },
      { text: 'Aylık 100 randevu', available: true },
      { text: 'Temel randevu yönetimi', available: true },
      { text: 'E-posta desteği', available: true },
      { text: 'SMS bildirimleri', available: false },
    ],
  },
  growth: {
    name: 'Büyüyen İşletme',
    shortName: 'Büyüyen',
    description: 'Ekibi ve randevu hacmi büyüyen işletmeler için.',
    monthlyPrice: 399,
    yearlyPrice: 299,
    features: [
      { text: '5 personele kadar', available: true },
      { text: 'Sınırsız randevu', available: true },
      { text: 'Özelleştirilmiş randevu sayfası', available: true },
      { text: 'Aylık 500 SMS bildirimi', available: true },
      { text: 'Müşteri raporları ve analitik', available: true },
    ],
  },
  enterprise: {
    name: 'Profesyonel',
    shortName: 'Profesyonel',
    description: 'Gelişmiş kontrol ve özel entegrasyon isteyen ekipler için.',
    monthlyPrice: 999,
    yearlyPrice: 799,
    features: [
      { text: 'Sınırsız personel', available: true },
      { text: 'Sınırsız randevu', available: true },
      { text: 'Gelişmiş finansal analitik', available: true },
      { text: 'WhatsApp entegrasyonu', available: true },
      { text: 'Öncelikli destek', available: true },
    ],
  },
};

const COMPARISON_ROWS = [
  ['Personel kapasitesi', '1', '5', 'Sınırsız'],
  ['Aylık randevu', '100', 'Sınırsız', 'Sınırsız'],
  ['SMS bildirimi', '—', '500 / ay', 'Sınırsız'],
  ['Müşteri analitiği', 'Temel', 'Gelişmiş', 'Gelişmiş'],
  ['Özel alan adı', '—', '—', 'Dahil'],
  ['Destek', 'E-posta', 'Öncelikli', 'Özel destek'],
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [staffCount, setStaffCount] = useState(3);

  function calculateRecommendation(staff: number) {
    if (staff === 1) {
      return { key: 'free' as const, price: 0 };
    }

    if (staff <= 5) {
      return {
        key: 'growth' as const,
        price: billingPeriod === 'yearly' ? PLANS.growth.yearlyPrice : PLANS.growth.monthlyPrice,
      };
    }

    const basePrice =
      billingPeriod === 'yearly' ? PLANS.enterprise.yearlyPrice : PLANS.enterprise.monthlyPrice;
    const extraStaff = Math.max(0, staff - 10);
    const extraPricePerStaff = billingPeriod === 'yearly' ? 40 : 50;
    return {
      key: 'enterprise' as const,
      price: basePrice + extraStaff * extraPricePerStaff,
    };
  }

  const recommendation = calculateRecommendation(staffCount);

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <span className={styles.eyebrow}>Basit ve şeffaf fiyatlandırma</span>
          <h1>
            İşletmen büyürken <em>planın da seninle büyüsün.</em>
          </h1>
          <p>
            Kurulum ücreti ve uzun süreli taahhüt olmadan randevularını yönetmeye başla.
            İhtiyacın değiştiğinde planını kolayca güncelle.
          </p>

          <div className={styles.billingToggle} aria-label="Faturalandırma dönemi">
            <button
              type="button"
              aria-pressed={billingPeriod === 'monthly'}
              className={billingPeriod === 'monthly' ? styles.active : ''}
              onClick={() => setBillingPeriod('monthly')}
            >
              Aylık
            </button>
            <button
              type="button"
              aria-pressed={billingPeriod === 'yearly'}
              className={billingPeriod === 'yearly' ? styles.active : ''}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yıllık <span>%20 avantaj</span>
            </button>
          </div>

          <div className={styles.heroNotes}>
            <span><b>✓</b> Kredi kartı gerekmez</span>
            <span><b>✓</b> İstediğin zaman iptal</span>
            <span><b>✓</b> 14 gün ücretsiz deneme</span>
          </div>
        </section>

        <section className={styles.pricingSection} aria-labelledby="plans-title">
          <div className={styles.sectionHeading}>
            <span>Planlar</span>
            <h2 id="plans-title">İhtiyacın kadarını seç</h2>
            <p>Temel özelliklerle başla, işin büyüdükçe daha fazla kontrol kazan.</p>
          </div>

          <div className={styles.pricingGrid}>
            {(Object.keys(PLANS) as PlanKey[]).map((key) => {
              const plan = PLANS[key];
              const isPopular = key === 'growth';
              const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
              return (
                <article
                  key={key}
                  className={`${styles.pricingCard} ${isPopular ? styles.popular : ''}`}
                >
                  {isPopular && <span className={styles.popularBadge}>En çok tercih edilen</span>}
                  <div className={styles.planHeader}>
                    <span>{key === 'free' ? 'Başlangıç için' : key === 'growth' ? 'Büyüyen ekipler için' : 'Yüksek hacim için'}</span>
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                  </div>
                  <div className={styles.price}>
                    <strong>{price.toLocaleString('tr-TR')}</strong>
                    <span>₺</span>
                    <small>/ ay</small>
                  </div>
                  {billingPeriod === 'yearly' && price > 0 && (
                    <p className={styles.yearlyNote}>Yıllık ödemede aylık karşılığı</p>
                  )}
                  <Link
                    href={`/signup?role=owner&plan=${key}&billing=${billingPeriod}`}
                    className={isPopular ? styles.primaryButton : styles.cardButton}
                  >
                    {key === 'free' ? 'Ücretsiz başla' : '14 gün ücretsiz dene'}
                  </Link>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature.text} className={!feature.available ? styles.unavailable : ''}>
                        <span aria-hidden="true">{feature.available ? '✓' : '–'}</span>
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.calculatorSection} aria-labelledby="calculator-title">
          <div className={styles.calculatorCopy}>
            <span className={styles.eyebrow}>Plan yardımcısı</span>
            <h2 id="calculator-title">Ekibine uygun planı birlikte bulalım.</h2>
            <p>
              Çalışan sayını seç; sana uygun planı ve tahmini aylık maliyeti anında gösterelim.
            </p>
          </div>
          <div className={styles.calculator}>
            <div className={styles.rangeHeader}>
              <label htmlFor="staff-count">Personel sayısı</label>
              <output htmlFor="staff-count">{staffCount}</output>
            </div>
            <input
              id="staff-count"
              type="range"
              min="1"
              max="50"
              value={staffCount}
              onChange={(event) => setStaffCount(Number(event.target.value))}
            />
            <div className={styles.rangeLabels}>
              <span>1</span>
              <span>10</span>
              <span>25</span>
              <span>50+</span>
            </div>
            <div className={styles.recommendation}>
              <div>
                <span>Önerilen plan</span>
                <strong>{PLANS[recommendation.key].name}</strong>
              </div>
              <div>
                <span>Tahmini aylık</span>
                <strong>
                  {recommendation.price === 0
                    ? 'Ücretsiz'
                    : `${recommendation.price.toLocaleString('tr-TR')} ₺`}
                </strong>
              </div>
              <Link
                href={`/signup?role=owner&plan=${recommendation.key}&staff=${staffCount}&billing=${billingPeriod}`}
              >
                Bu planla başla <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.comparisonSection} aria-labelledby="comparison-title">
          <div className={styles.sectionHeading}>
            <span>Karşılaştırma</span>
            <h2 id="comparison-title">Planların tüm detayları</h2>
            <p>İşletmenin bugün ve yarın ihtiyaç duyacağı özellikleri yan yana incele.</p>
          </div>
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Özellik</th>
                  <th>Başlangıç</th>
                  <th className={styles.featuredColumn}>Büyüyen</th>
                  <th>Profesyonel</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(([feature, free, growth, enterprise]) => (
                  <tr key={feature}>
                    <th scope="row">{feature}</th>
                    <td>{free}</td>
                    <td className={styles.featuredColumn}>{growth}</td>
                    <td>{enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.faqSection} aria-labelledby="pricing-faq">
          <div className={styles.sectionHeading}>
            <span>Merak edilenler</span>
            <h2 id="pricing-faq">Fiyatlandırma hakkında</h2>
          </div>
          <div className={styles.faqGrid}>
            <details>
              <summary>Kurulum veya gizli ücret var mı?</summary>
              <p>Hayır. Yalnızca seçtiğin planın aylık ya da yıllık abonelik bedelini ödersin.</p>
            </details>
            <details>
              <summary>Planımı daha sonra değiştirebilir miyim?</summary>
              <p>Evet. İhtiyacın değiştiğinde daha üst veya alt plana geçebilirsin.</p>
            </details>
            <details>
              <summary>Ücretsiz deneme nasıl çalışıyor?</summary>
              <p>Ücretli planları kredi kartı bilgisi girmeden 14 gün boyunca deneyebilirsin.</p>
            </details>
            <details>
              <summary>Ek personel ekleyebilir miyim?</summary>
              <p>Profesyonel planda ekibin büyüklüğüne göre kapasiteni artırabilirsin.</p>
            </details>
          </div>
        </section>

        <section className={styles.bottomCta}>
          <span>Başlamak için hazırsan</span>
          <h2>İlk randevu sayfanı bugün yayına al.</h2>
          <p>14 gün boyunca tüm temel özellikleri ücretsiz deneyebilirsin.</p>
          <Link href="/signup?role=owner">İşletmeni ücretsiz ekle</Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <strong>Randevigo</strong>
        <nav aria-label="Alt navigasyon">
          <Link href="/explore">İşletmeler</Link>
          <Link href="/kurumsal">Kurumsal</Link>
          <Link href="/login">Giriş yap</Link>
        </nav>
        <span>© 2026 Randevigo</span>
      </footer>
    </div>
  );
}
