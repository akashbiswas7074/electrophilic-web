"use client";

import { ReactNode } from 'react';
import Layout from '@/components/layout/Layout';
import ClientProviders from '@/components/wrappers/ClientProviders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  return (
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
  );
}