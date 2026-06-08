// =============================================================================
// Landing Page — Public homepage for Randevigo (Moved to /kurumsal)
// =============================================================================

import Image from 'next/image';
import Link from 'next/link';
import styles from '../landing.module.css';

export default function KurumsalPage() {
  return (
    <main className={styles.container}>
      {/* Animated background */}
      <div className={styles.bgWrapper}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
      </div>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <Image
            src="/images/randevigo-logo.png"
            alt="Randevigo"
            width={140}
            height={50}
            style={{ objectFit: 'contain' }}
            priority
          />
          <div className={styles.navLinks}>
            <Link href="/login" className={styles.navLink}>Giriş Yap</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Randevularınızı <span className={styles.highlight}>Kolayca</span> Yönetin
        </h1>
        <p className={styles.heroSubtitle}>
          İşletmeniz için online randevu sistemi kurun veya müşteri olarak 
          en yakın işletmelerden hızlıca randevu alın.
        </p>
        <div className={styles.heroCtas}>
          <Link href="/signup" className={styles.ctaPrimary}>
            Hemen Başla
          </Link>
          <Link href="/explore" className={styles.ctaSecondary}>
            İşletmeleri Keşfet
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <h2>Bize Güvenen İşletmeler</h2>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <div className={styles.statNumber}>500+</div>
            <div className={styles.statLabel}>Aktif İşletme</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>50K+</div>
            <div className={styles.statLabel}>Başarılı Randevu</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>10K+</div>
            <div className={styles.statLabel}>Mutlu Müşteri</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Neden Randevigo?</h2>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🏪</div>
          <h3>İşletmeler İçin</h3>
          <p>Hizmetlerinizi tanımlayın, personelinizi yönetin ve randevularınızı tek panelden takip edin.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>📱</div>
          <h3>Müşteriler İçin</h3>
          <p>Bulunduğunuz şehirdeki işletmeleri keşfedin ve birkaç tıkla randevu alın.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🔒</div>
          <h3>Güvenli & Hızlı</h3>
          <p>Çift randevu koruması ile çakışma olmaz. Verileriniz güvende.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>⚡</div>
          <h3>Hızlı Kurulum</h3>
          <p>5 dakika içinde başlayın. Özel teknik bilgisine ihtiyaç yoktur.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>📊</div>
          <h3>Analitikler</h3>
          <p>Randevularınızı takip edin, raporlar alın ve işletmenizi büyütün.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🤝</div>
          <h3>7/24 Destek</h3>
          <p>Sorularınız mı var? Ekibimiz her zaman yardımcı olmaya hazır.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <h2>Nasıl Çalışır?</h2>
        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3>Hesap Oluştur</h3>
            <p>E-posta adresiniz ile hızlıca kayıt olun.</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3>Profilini Ayarla</h3>
            <p>İşletme bilgilerini ve hizmetlerinizi ekleyin.</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3>Randevu Al</h3>
            <p>Müşteriler sizi bulup randevu almaya başlasın.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <h2>Müşterilerimiz Diyor Ki</h2>
        <div className={styles.testimonialsGrid}>
          <div className={styles.testimonial}>
            <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
            <p>"Randevigo sayesinde müşteri yönetimi çok daha kolaylaştı. Çakışmaları tamamen ortadan kaldırdık."</p>
            <div className={styles.author}>- Ayşe Yıldız, Kuaför</div>
          </div>
          <div className={styles.testimonial}>
            <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
            <p>"Arayüzü çok basit buldum. Teknoloji bilgisi olmasa da rahat kullanabiliyor."</p>
            <div className={styles.author}>- Mehmet Karagöz, Berber</div>
          </div>
          <div className={styles.testimonial}>
            <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
            <p>"Müşteri memnuniyeti arttı, randevu saatlerinde boşluk kalmadı. Harika bir sistem!"</p>
            <div className={styles.author}>- Fatma Demir, Estetisyen</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <h2>Hadi Başlayalım!</h2>
        <p>İşletmenizi dijitalleştirin, müşteri deneyimini iyileştirin.</p>
        <div className={styles.ctaButtons}>
          <Link href="/login" className={styles.ctaSecondary}>
            Giriş Yap
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faq}>
        <h2>Sıkça Sorulan Sorular</h2>
        <div className={styles.faqContainer}>
          <details className={styles.faqItem}>
            <summary>Randevigo tamamen ücretsiz mi?</summary>
            <p>Evet, temel özellikleri tamamen ücretsiz olarak kullanabilirsiniz. Premium özellikleri ise çok uygun fiyatlarla sunuyoruz.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Verilerim güvende mi?</summary>
            <p>Evet, verileriniz 256-bit şifreleme ile korunmaktadır ve GDPR uyumludur.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Müşteri destek var mı?</summary>
            <p>Elbette! E-posta, chat ve telefon aracılığıyla 7/24 destek sağlıyoruz.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Başka sistemlerden veri aktarabilir miyim?</summary>
            <p>Evet, eski sisteminizden verilerinizi biz aktarabiliriz. Destek ekibimize yazın.</p>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div style={{ opacity: 0.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', cursor: 'pointer' }}>
              <Image src="/images/randevigo-logo.png" alt="Randevigo" width={80} height={30} style={{ objectFit: 'contain' }} loading="eager" />
            </span>
          </Link>
          <span>© 2026</span>
        </div>
      </footer>
    </main>
  );
}
