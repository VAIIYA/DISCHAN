'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Hash,
    Settings,
    User,
    TrendingUp,
    PlusSquare,
    LayoutDashboard,
    Bell,
    Search
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { ApiService } from '@/services/api';
import { Channel } from '@/types';

export const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { wallet } = useWallet();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const result = await ApiService.getChannels();
                if (result.success) {
                    setChannels(result.channels);
                }
            } catch (error) {
                console.error('Failed to load channels:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChannels();
    }, []);

    const NavItem = ({
        icon: Icon,
        label,
        href,
        active = false,
        isChannel = false
    }: {
        icon: any,
        label: string,
        href: string,
        active?: boolean,
        isChannel?: boolean
    }) => (
        <button
            onClick={() => router.push(href)}
            className={`
        w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group
        ${active
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
      `}
        >
            <Icon size={18} className={`${active ? 'text-white' : 'group-hover:text-orange-400'}`} />
            <span className="font-medium truncate">{isChannel ? label.toLowerCase() : label}</span>
        </button>
    );

    return (
        <aside className="w-64 bg-black h-screen flex flex-col border-r border-gray-800 text-gray-300 overflow-hidden">
            {/* App Logo/Branding */}
            <div className="p-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">D</span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">HashHouse</h1>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto px-4 space-y-8 py-2 custom-scrollbar">
                {/* Discovery Section */}
                <section>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Discovery</h3>
                    <div className="space-y-1">
                        <NavItem
                            icon={LayoutDashboard}
                            label="Feed"
                            href="/"
                            active={pathname === '/'}
                        />
                        <NavItem
                            icon={TrendingUp}
                            label="Trending"
                            href="/catalog"
                            active={pathname === '/catalog'}
                        />
                        <NavItem
                            icon={Search}
                            label="Search"
                            href="/search"
                            active={pathname === '/search'}
                        />
                    </div>
                </section>

                {/* Channels Section */}
                <section>
                    <div className="flex items-center justify-between px-3 mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels</h3>
                        <button className="text-gray-500 hover:text-orange-400 transition-colors">
                            <PlusSquare size={14} />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {loading ? (
                            <div className="px-3 py-2 text-xs text-gray-600 animate-pulse">Loading channels...</div>
                        ) : channels.length > 0 ? (
                            channels.map(channel => (
                                <NavItem
                                    key={channel.id}
                                    icon={Hash}
                                    label={channel.name}
                                    href={`/channel/${channel.slug}`}
                                    active={pathname === `/channel/${channel.slug}`}
                                    isChannel
                                />
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-gray-600 italic">No channels yet</div>
                        )}
                    </div>
                </section>

                {/* Community Section */}
                <section>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Community</h3>
                    <div className="space-y-1">
                        <NavItem
                            icon={User}
                            label="Profile"
                            href="/profile"
                            active={pathname === '/profile'}
                        />
                        <NavItem
                            icon={Bell}
                            label="Notifications"
                            href="/notifications"
                            active={pathname === '/notifications'}
                        />
                    </div>
                </section>
            </div>

            {/* Bottom Profile Section */}
            <div className="p-4 border-t border-gray-800 bg-zinc-900/50">
                {wallet.connected && wallet.publicKey ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-amber-600 border border-orange-500/50 flex items-center justify-center flex-shrink-0">
                                <User size={20} className="text-white" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">
                                    {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
                                </p>
                                <p className="text-[10px] text-gray-500 font-mono uppercase">Online</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/settings')}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex items-center justify-center space-x-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 px-4 py-2 rounded-lg border border-orange-500/20 transition-all font-medium text-sm"
                    >
                        <span>Connect Wallet</span>
                    </button>
                )}
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
        </aside>
    );
};
