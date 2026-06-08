'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './IntroScreen.module.css';

export default function IntroScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the intro this session
    const hasSeenIntro = sessionStorage.getItem('randevigo_intro_seen');

    if (hasSeenIntro) {
      setIsVisible(false);
      setIsMounted(true);
      return;
    }

    setIsMounted(true);

    // Hide intro after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('randevigo_intro_seen', 'true');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Avoid rendering anything on the server until mounted to prevent hydration mismatches
  if (!isMounted) return null;

  // Output nothing if not visible (saves DOM nodes) after transition
  // We use CSS for the smooth fade-out, so we wait until it's completely hidden
  const displayClass = isVisible ? styles.container : `${styles.container} ${styles.hidden}`;

  return (
    <div className={displayClass}>
      <div className={styles.logoContainer}>
        <div className={styles.glow} />
        <Image
          src="/images/randevigo-logo.png"
          alt="Randevigo Logo"
          width={400}
          height={150}
          priority
          className={styles.logo}
        />
      </div>
    </div>
  );
}
