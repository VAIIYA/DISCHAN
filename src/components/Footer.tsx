import React from 'react';
import { SyncButton } from './SyncButton';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 mb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white border border-orange-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Board Rules</h2>
          <ul className="text-gray-600 space-y-2">
            <li>• Be respectful to other users</li>
            <li>• Stay on topic for each board</li>
            <li>• No spam or duplicate threads</li>
            <li>• No underage images</li>
          </ul>

          <hr className="border-gray-300 my-6" />

          <p className="text-gray-600 text-sm leading-relaxed">
            By using this website (the "site"), you agree that you'll follow these rules, and understand that if we reasonably think you haven't followed these rules, we may (at our own discretion) terminate your access to the site:
          </p>
        </div>

        <div className="text-center mt-6 space-y-4">
          <p className="text-gray-600 text-sm">
            HashHouse - Anonymous discussion platform powered by Solana
          </p>
          <p className="text-gray-600 text-sm">
            All posts are anonymous. Connect your Solana wallet to create threads and post replies.
          </p>

          <div className="pt-4 border-t border-gray-100">
            <SyncButton />
            <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-black">
              Powered by HASHCUBE
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
