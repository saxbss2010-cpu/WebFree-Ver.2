
import React, { useContext } from 'react';
import { HeartIcon } from './icons';
import { AppContext } from '../contexts/AppContext';

const Support: React.FC = () => {
  const { showToast } = useContext(AppContext);

  const handleCryptoDonation = () => {
    const btcAddress = "bc1qruv8200hh3rrdghjaq5djwwzrsvsv9phvnkl2c";
    navigator.clipboard.writeText(btcAddress)
      .then(() => {
        showToast(`BTC Address copied: ${btcAddress}`, 'success');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy BTC address.', 'error');
      });
  };

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

            <div className="flex flex-col gap-4 items-center w-full max-w-md mx-auto">
                <button 
                    onClick={handleCryptoDonation}
                    className="w-full py-4 px-10 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-[#F7931A] to-[#d67b0e] hover:from-[#d67b0e] hover:to-[#b86608] shadow-lg shadow-[#F7931A]/20 transition-all transform hover:scale-[1.02]"
                >
                    Donate in Crypto - BTC
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
