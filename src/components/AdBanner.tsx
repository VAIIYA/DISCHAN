'use client'

import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  position: 'header' | 'footer';
  className?: string;
  // boardId is no longer used for targeting but might be passed by parent, ignore it
  boardId?: string;
}

interface AdData {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  placement: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  position,
  className = ''
}) => {
  const [currentAd, setCurrentAd] = useState<AdData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAd = async () => {
      setIsLoading(true);
      try {
        // Fetch active ad for this placement
        // Map 'header'/'footer' to API expected values if needed, but schema uses 'header'/'footer' directly now
        // The AdvertisePage uses 'header' / 'footer' as IDs.
        const res = await fetch(`/api/ads/active?placement=${position}`);
        const data = await res.json();

        if (data.ad) {
          setCurrentAd(data.ad);
        } else {
          setCurrentAd(null);
        }
      } catch (error) {
        console.error('Failed to fetch ad:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveAd();

    // Refresh ads every 5 minutes
    const interval = setInterval(fetchActiveAd, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [position]);

  const handleAdClick = () => {
    if (currentAd) {
      // Open link in new tab
      window.open(currentAd.link, '_blank');
    }
  };

  const handleCloseAd = () => {
    setIsVisible(false);
  };

  if (!isVisible || !currentAd) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className}`}>
        <div className="h-[90px] w-full"></div>
      </div>
    );
  }

  return (
    <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {/* Ad Label */}
      <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded z-10 transition-opacity opacity-75 hover:opacity-100">
        Ad
      </div>

      {/* Close Button */}
      <button
        onClick={handleCloseAd}
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all z-10"
        title="Close ad"
      >
        <X size={12} />
      </button>

      {/* Ad Content */}
      <div
        className="cursor-pointer hover:opacity-90 transition-opacity group"
        onClick={handleAdClick}
      >
        <img
          src={currentAd.imageUrl}
          alt={currentAd.title}
          className="w-full h-[90px] object-cover"
        />

        {/* Ad Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-white text-xs">
            <div className="font-medium truncate">{currentAd.title}</div>
            <div className="flex items-center space-x-1 text-xs opacity-80">
              <span>Sponsored</span>
              <ExternalLink size={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Ad Banner Component - Reusing logic or just simplifying
// We'll keep it separate if mobile styling differs significantly, 
// but for now the logic is identical, just maybe dimensions differ in CSS
export const MobileAdBanner: React.FC<AdBannerProps> = ({
  position,
  className = ''
}) => {
  const [currentAd, setCurrentAd] = useState<AdData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAd = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/ads/active?placement=${position}`);
        const data = await res.json();
        if (data.ad) {
          setCurrentAd(data.ad);
        } else {
          setCurrentAd(null);
        }
      } catch (error) {
        console.error('Failed to fetch mobile ad:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveAd();
    const interval = setInterval(fetchActiveAd, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [position]);

  const handleAdClick = () => {
    if (currentAd) {
      window.open(currentAd.link, '_blank');
    }
  };

  const handleCloseAd = () => {
    setIsVisible(false);
  };

  if (!isVisible || !currentAd) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className}`}>
        <div className="h-[250px] w-full"></div>
      </div>
    );
  }

  return (
    <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {/* Ad Label */}
      <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded z-10">
        Ad
      </div>

      {/* Close Button */}
      <button
        onClick={handleCloseAd}
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all z-10"
        title="Close ad"
      >
        <X size={12} />
      </button>

      {/* Ad Content */}
      <div
        className="cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleAdClick}
      >
        <img
          src={currentAd.imageUrl}
          alt={currentAd.title}
          className="w-full h-[250px] object-cover"
        />

        {/* Ad Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="text-white">
            <div className="font-medium text-sm mb-1">{currentAd.title}</div>
            <div className="flex items-center space-x-1 text-xs opacity-80">
              <span>Sponsored</span>
              <ExternalLink size={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
