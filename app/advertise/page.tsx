'use client'

import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Target, Monitor, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Header } from '../../src/components/Header';
import { usePayment } from '@/hooks/usePayment';

interface AdPackage {
  id: string;
  duration: number;
  price: number;
  popular?: boolean;
}

interface AdPlacement {
  id: string;
  name: string;
  dimensions: string;
  description: string;
  icon: React.ReactNode;
}

const adPackages: AdPackage[] = [
  {
    id: '7days',
    duration: 7,
    price: 1500
  },
  {
    id: '14days',
    duration: 14,
    price: 2750,
    popular: true
  },
  {
    id: '30days',
    duration: 30,
    price: 5000
  }
];

const adPlacements: AdPlacement[] = [
  {
    id: 'header',
    name: 'Header',
    dimensions: '728x90 Leaderboard (Desktop) / 320x50 (Mobile)',
    description: 'Premium visibility at the very top of every page.',
    icon: <Monitor className="w-6 h-6" />
  },
  {
    id: 'footer',
    name: 'Footer',
    dimensions: '728x90 Leaderboard (Desktop) / 320x50 (Mobile)',
    description: ' Consistent visibility at the bottom of every page.',
    icon: <Monitor className="w-6 h-6" />
  }
];

export default function AdvertisePage() {
  const { wallet, connect } = useWallet();
  const { processPayment } = usePayment();

  const [selectedPackage, setSelectedPackage] = useState<string>('14days');
  const [selectedPlacement, setSelectedPlacement] = useState<string>('header');
  const [startDate, setStartDate] = useState<string>('');
  const [adImage, setAdImage] = useState<string>(''); // URL to uploaded image
  const [adUrl, setAdUrl] = useState<string>('');
  const [adTitle, setAdTitle] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch availability when placement or month changes
  useEffect(() => {
    const fetchAvailability = async () => {
      setIsCheckingAvailability(true);
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      try {
        const res = await fetch(`/api/ads/availability?placement=${selectedPlacement}&month=${monthStr}`);
        const data = await res.json();
        if (data.bookedDates) {
          setBookedDates(data.bookedDates);
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    fetchAvailability();
  }, [selectedPlacement]);

  const handlePlacementToggle = (placementId: string) => {
    setSelectedPlacement(placementId);
    setStartDate(''); // Reset date when placement changes to force re-check
  };

  const calculateTotalPrice = () => {
    const pkg = adPackages.find(p => p.id === selectedPackage);
    if (!pkg) return 0;

    let price = pkg.price;
    if (selectedPlacement === 'footer') {
      price = price * 0.5; // 50% discount for footer
    }
    return price;
  };

  const isDateBooked = (dateStr: string) => {
    return bookedDates.includes(dateStr);
  };

  const isRangeAvailable = (start: string, days: number) => {
    if (!start) return false;
    const date = new Date(start);
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(date);
      checkDate.setDate(date.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0] || '';
      if (dateStr && isDateBooked(dateStr)) return false;
    }
    return true;
  };

  const handlePurchase = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert('Please connect your Solana wallet to purchase advertising');
      return;
    }

    if (!adUrl || !adTitle || !startDate || !adImage || !email) {
      alert('Please fill in all required fields');
      return;
    }

    const pkg = adPackages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    if (!isRangeAvailable(startDate, pkg.duration)) {
      alert('Selected date range is not available. Please choose another start date.');
      return;
    }

    setIsProcessing(true);

    try {
      const amount = calculateTotalPrice();

      // 1. Create Ad Record (Pending)
      const createRes = await fetch('/api/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: adTitle,
          link: adUrl,
          imageUrl: adImage,
          placement: selectedPlacement,
          startDate,
          duration: pkg.duration,
          amount,
          advertiserWallet: wallet.publicKey,
          email
        })
      });

      const createData = await createRes.json();
      if (!createData.success) throw new Error(createData.error);
      const adId = createData.adId;

      // 2. Process Payment
      const paymentResult = await processPayment({
        amount,
        description: `Dischan Ad - ${pkg.duration} Days (${selectedPlacement})`,
        type: 'advertising',
      });

      if (!paymentResult.success || !paymentResult.transactionId) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // 3. Verify Payment & Activate Ad
      const verifyRes = await fetch('/api/ads/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId,
          signature: paymentResult.transactionId
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.error);

      alert('Ad purchased successfully! Your ad is now active for the selected dates.');

      // Reset form
      setStartDate('');
      setAdImage('');
      setAdUrl('');
      setAdTitle('');
      setEmail('');

    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPackageData = adPackages.find(p => p.id === selectedPackage);
  const totalPrice = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-100">
      <Header
        title="Advertise"
        showHomeLink={true}
        showAdvertiseLink={true}
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advertise on Dischan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            High-impact visibility on the premier anonymous discussion platform.
            Simple USDC pricing, transparent scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ad Packages */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-orange-500" />
                Ad Packages
              </h2>

              <div className="space-y-4">
                {adPackages.map((pkg) => {
                  const displayPrice = selectedPlacement === 'footer' ? pkg.price * 0.5 : pkg.price;
                  return (
                    <div
                      key={pkg.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedPackage === pkg.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                        } ${pkg.popular ? 'ring-2 ring-orange-300' : ''}`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      {pkg.popular && (
                        <div className="text-xs font-semibold text-orange-600 mb-2">
                          MOST POPULAR
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">
                          {pkg.duration} Days
                        </span>
                        <span className="text-2xl font-bold text-orange-600">
                          ${displayPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        ${(displayPrice / pkg.duration).toFixed(2)} per day
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ad Guidelines */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Images: JPG, PNG, GIF, WebP
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Work-safe content only
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  No misleading or deceptive content
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Ad Configuration */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-orange-500" />
                Ad Configuration
              </h2>

              {/* Ad Placements */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Placement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adPlacements.map((placement) => (
                    <div
                      key={placement.id}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${selectedPlacement === placement.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                        }`}
                      onClick={() => handlePlacementToggle(placement.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {placement.icon}
                        <div>
                          <div className="font-medium text-gray-900">{placement.name}</div>
                          <div className="text-sm text-gray-600">{placement.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Campaign Start Date</h3>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  {isCheckingAvailability && (
                    <div className="absolute right-3 top-2">
                      <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
                {startDate && selectedPackageData && (
                  <div className="mt-2 text-sm">
                    {isRangeAvailable(startDate, selectedPackageData.duration) ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" /> Date range available
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" /> Selected dates are partially or fully booked
                      </span>
                    )}
                  </div>
                )}
                {bookedDates.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    There are upcoming bookings for this slot. Please choose a date range that does not conflict.
                  </p>
                )}
              </div>

              {/* Ad Content */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ad Content</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Title *
                  </label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Enter your ad title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="For notifications about your ad"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image URL *
                  </label>
                  <input
                    type="url"
                    value={adImage}
                    onChange={(e) => setAdImage(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Direct link to your image file (JPG, PNG, GIF, WebP)
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landing Page URL *
                  </label>
                  <input
                    type="url"
                    value={adUrl}
                    onChange={(e) => setAdUrl(e.target.value)}
                    placeholder="https://your-website.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-orange-500" />
                Purchase Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span className="font-medium">
                    {selectedPackageData?.duration} Days ({selectedPlacement})
                  </span>
                </div>
                {selectedPlacement === 'footer' && (
                  <div className="flex justify-between text-green-600">
                    <span>Footer Discount:</span>
                    <span className="font-medium">-50%</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price:</span>
                    <span className="text-orange-600">${totalPrice.toLocaleString()} USDC</span>
                  </div>
                </div>
              </div>

              {!wallet.connected || !wallet.publicKey ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-orange-800 mb-3">
                    Please connect your Solana wallet to purchase advertising
                  </p>
                  <button
                    onClick={connect}
                    disabled={wallet.connecting}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-orange-300"
                  >
                    {wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={isProcessing || !adImage || !adUrl || !adTitle || !startDate || !email || !isRangeAvailable(startDate, selectedPackageData?.duration || 0)}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay ${totalPrice.toLocaleString()} USDC`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-orange-200 bg-white py-6 mt-12 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">
            Dischan - Anonymous discussion platform powered by Solana
          </p>
          <p className="text-gray-500 text-xs mt-2">
            For advertising inquiries, contact advertise@dischan.org
          </p>
        </div>
      </footer>
    </div>
  );
}
