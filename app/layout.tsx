import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Layout from '@/components/layout/Layout';
import ClientProviders from '@/components/wrappers/ClientProviders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { generateDynamicMetadata } from '@/lib/metadata';
import DynamicThemeProvider from '@/components/providers/DynamicThemeProvider';

const inter = Inter({ subsets: ['latin'] });

// Generate metadata dynamically from your website settings
export async function generateMetadata(): Promise<Metadata> {
  return await generateDynamicMetadata({
    // No specific page title - will use the default from admin settings
    type: 'website'
  });
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          <DynamicThemeProvider>
            <Layout>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
              {children}
            </Layout>
          </DynamicThemeProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
