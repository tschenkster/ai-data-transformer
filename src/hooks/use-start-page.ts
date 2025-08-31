import { useState, useEffect, useCallback } from 'react';
import startPageContent from '@/data/start-page-content.json';

export interface StartPageItem {
  content_uuid: string;
  week_cycle: number;
  variant_key: string;
  type: 'joke' | 'quote' | 'meme' | 'illustration' | 'animation';
  title_en?: string;
  title_de?: string;
  body_en: string;
  body_de: string;
  asset_url?: string;
  alt_en?: string;
  alt_de?: string;
  weight: number;
  is_active: boolean;
}

type StartPageState = 'loading' | 'ready' | 'error' | 'quiet_mode';

// Simple hash function for deterministic selection
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function getISOWeek(date: Date): number {
  const temp = new Date(date.getTime());
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 3 - (temp.getDay() + 6) % 7);
  const week1 = new Date(temp.getFullYear(), 0, 4);
  return 1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem('start_page_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('start_page_device_id', deviceId);
  }
  return deviceId;
}

export function useStartPage() {
  const [state, setState] = useState<StartPageState>('loading');
  const [items, setItems] = useState<StartPageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [locale] = useState<'en' | 'de'>('en'); // Default to EN for now
  const [quietMode, setQuietMode] = useState(false);

  const currentItem = items[currentIndex];

  useEffect(() => {
    // Check quiet mode preference
    const quietPreference = localStorage.getItem('start_page_quiet_mode');
    if (quietPreference === 'true') {
      setQuietMode(true);
      setState('quiet_mode');
      return;
    }

    try {
      // Get current week and device ID for deterministic selection
      const currentWeek = getISOWeek(new Date());
      const deviceId = getDeviceId();
      
      // Filter active items for current week cycle and cast to proper type
      const availableItems = startPageContent.content.filter(item => 
        item.is_active && (item.week_cycle === (currentWeek % 4) + 1 || item.week_cycle <= 4)
      ) as StartPageItem[];

      if (availableItems.length === 0) {
        setState('error');
        return;
      }

      // Deterministic shuffle based on week and device
      const seed = simpleHash(`${deviceId}_${currentWeek}`);
      const shuffledItems = [...availableItems].sort((a, b) => {
        const hashA = simpleHash(a.variant_key + seed);
        const hashB = simpleHash(b.variant_key + seed);
        return hashA - hashB;
      });

      setItems(shuffledItems);
      setState('ready');
    } catch (error) {
      console.error('Error loading start page content:', error);
      setState('error');
    }
  }, []);

  const onShuffle = useCallback(() => {
    if (items.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
  }, [items.length]);

  const onQuietToggle = useCallback(() => {
    const newQuietMode = !quietMode;
    setQuietMode(newQuietMode);
    localStorage.setItem('start_page_quiet_mode', newQuietMode.toString());
    setState(newQuietMode ? 'quiet_mode' : 'ready');
  }, [quietMode]);

  const getLocalizedContent = useCallback((item: StartPageItem) => {
    return {
      title: locale === 'de' ? item.title_de : item.title_en,
      body: locale === 'de' ? item.body_de : item.body_en,
      alt: locale === 'de' ? item.alt_de : item.alt_en,
    };
  }, [locale]);

  return {
    state,
    items,
    currentItem,
    currentIndex,
    locale,
    quietMode,
    onShuffle,
    onQuietToggle,
    getLocalizedContent,
    fallback: locale === 'de' ? startPageContent.fallback.body_de : startPageContent.fallback.body_en
  };
}