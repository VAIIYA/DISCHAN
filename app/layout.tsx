import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../src/index.css'
import { WalletProvider } from '@/contexts/WalletContext'
import { Sidebar } from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dischan',
  description: 'Anonymous discussion platform powered by Solana',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f97316', // Orange theme color for mobile browsers
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 flex h-screen overflow-hidden`}>
        <WalletProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl relative z-10 overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </main>
        </WalletProvider>
        <style dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #bbb;
          }
        `}} />
      </body>
    </html>
  )
}

