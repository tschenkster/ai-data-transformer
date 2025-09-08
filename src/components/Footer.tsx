import React from 'react';
import { useUITranslations } from '@/hooks/useUITranslations';

const Footer = () => {
  const { t } = useUITranslations();
  return (
    <footer className="mt-auto py-4 text-center">
      <p className="text-xs text-muted-foreground">
        {t('FOOTER_CREATED_BY', 'created with ❤️ by')}{" "}
        <a
          href="https://www.linkedin.com/in/thomas-schenkelberg/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors underline"
        >
          Thomas Schenkelberg
        </a>
      </p>
    </footer>
  );
};

export default Footer;