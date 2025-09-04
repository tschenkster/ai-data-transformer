import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MultilingualSelector } from '@/components/MultilingualSelector';
import { Database } from 'lucide-react';

export function Header() {
  const [selectedLanguage, setSelectedLanguage] = useState('de');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Load language preference from localStorage
    const savedLang = localStorage.getItem('lang_preference');
    if (savedLang) {
      setSelectedLanguage(savedLang);
    }

    // Handle scroll for sticky header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    localStorage.setItem('lang_preference', value);
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-200 ${
        isScrolled ? 'shadow-sm' : ''
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">DATEV Converter</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <nav className="hidden sm:flex items-center gap-6" aria-label="Main navigation">
              <Link 
                to="/pricing" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link 
                to="/auth" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Register
              </Link>
            </nav>

            <MultilingualSelector
              currentLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
              size="sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
}