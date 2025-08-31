import React from 'react';
import { Header } from '@/components/Header';

const Register = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-20">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Register
          </h1>
          <p className="text-lg text-muted-foreground">
            Registration form coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;