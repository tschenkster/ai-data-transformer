import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';

const Homepage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
    </div>
  );
};

export default Homepage;