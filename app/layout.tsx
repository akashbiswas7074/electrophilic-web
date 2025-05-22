import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Layout from '@/components/layout/Layout';
import ClientProviders from '@/components/wrappers/ClientProviders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Electrophilic',
  description: 'Welcome to Electrophilic.in – Where Innovation Begins!Step into the world of electronics with the ultimate destination for makers, tinkerers, and tech enthusiasts. At Electrophicil.in, we bring you everything from microcontrollers and sensors to transistors, ICs, resistors, modules, and more—all in one place.Whether youre building your first DIY project or developing complex electronic systems, weve got the components you need to power your imagination. From on-board computers to the tiniest resistor, every part is carefully selected to help you create, experiment, and innovate without limits. Fast shipping, reliable quality, and unbeatable prices—this is more than a store, it’s your partner in every project. Dive into the world of electronics today with Electrophilic.in and bring your ideas to life!',
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
