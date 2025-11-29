
import React from 'react';
import { HeartIcon } from './icons';

const Support: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto pt-10 px-4">
      <div className="bg-glass-gradient backdrop-blur-xl rounded-3xl border border-glass-border p-8 text-center shadow-2xl relative overflow-hidden group">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-purple-500 to-accent"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/30 transition-colors duration-500"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/30 transition-colors duration-500"></div>

        <div className="relative z-10">
            <div className="inline-flex p-4 rounded-full bg-accent/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                <HeartIcon className="w-16 h-16 text-accent" />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-6 tracking-tight">Support WebFree</h1>
            
            <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
                We are dedicated to keeping WebFree an open, independent space for everyone to share and connect. 
                Your contribution helps us keep the servers running, develop new features, and stay ad-free.
            </p>

            <div className="space-y-4">
                <button className="w-full sm:w-auto py-4 px-10 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-accent to-red-600 hover:from-accent-hover hover:to-red-700 shadow-lg shadow-accent/20 transition-all transform hover:scale-[1.02]">
                    Donate via Patreon
                </button>
                <div className="block"></div>
                <button className="w-full sm:w-auto py-4 px-10 rounded-xl text-lg font-bold text-white bg-[#0070BA] hover:bg-[#003087] shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02]">
                    Donate via PayPal
                </button>
            </div>
            
            <p className="text-gray-500 text-sm mt-10">
                Every donation, no matter the size, makes a difference. Thank you for being part of our community! ❤️
            </p>
        </div>
      </div>
    </div>
  );
};

export default Support;
