'use client'

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import WalletConnect from './WalletConnect';


const ADMIN_WALLET = '2Z9eW3nwa2GZUM1JzXdfBK1MN57RPA2PrhuTREEZ31VY';

interface HeaderProps {
  showHomeLink?: boolean;
  showAdvertiseLink?: boolean;
  title?: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showHomeLink = true,
  showAdvertiseLink = true,
  title = 'HashHouse',
  onBack
}) => {
  const { wallet } = useWallet();
  const router = useRouter();
  const isAdmin = wallet.connected && wallet.publicKey === ADMIN_WALLET;


  return (
    <header className="bg-white border-b border-orange-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            )}

            <a
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="HashHouse Logo"
                  className="w-8 h-8"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-orange-600">HashHouse</h1>
                {title && title !== 'HashHouse' && (
                  <span className="text-sm text-gray-600">{title}</span>
                )}
              </div>
            </a>

            {showHomeLink && (
              <a
                href="/"
                className="text-orange-600 hover:text-orange-700 transition-colors"
              >
                Home
              </a>
            )}

            <a
              href="/catalog"
              className="text-orange-600 hover:text-orange-700 transition-colors"
            >
              Catalog
            </a>

            <a
              href="/submit"
              className="text-orange-600 hover:text-orange-700 transition-colors"
            >
              Submit
            </a>

            <a
              href="/hashtags"
              className="text-orange-600 hover:text-orange-700 transition-colors"
            >
              Hashtags
            </a>

            {showAdvertiseLink && (
              <a
                href="/advertise"
                className="text-orange-600 hover:text-orange-700 transition-colors"
              >
                Advertise
              </a>
            )}

            {isAdmin && (
              <a
                href="/admin"
                className="text-orange-600 hover:text-orange-700 transition-colors font-semibold"
              >
                Admin
              </a>
            )}

            {wallet.connected && wallet.publicKey && (
              <a
                href="/profile"
                className="text-orange-600 hover:text-orange-700 transition-colors"
              >
                Profile
              </a>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get('q');
                if (query) router.push(`/search?q=${encodeURIComponent(query.toString())}`);
              }}
              className="relative hidden md:block"
            >

              <input
                type="text"
                name="q"
                placeholder="Search threads..."
                className="w-64 pl-4 pr-10 py-2 border border-orange-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            <WalletConnect />
          </div>

        </div>
      </div>
    </header>
  );
};