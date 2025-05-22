import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Layout from '@/components/layout/Layout';
import ClientProviders from '@/components/wrappers/ClientProviders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PAUL CO | Premium E-Store',
  description: 'Premium shopping experience from PAUL CO',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
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
        </ClientProviders>
      </body>
    </html>
  );
}
