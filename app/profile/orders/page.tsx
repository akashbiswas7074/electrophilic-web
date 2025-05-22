'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IOrder } from '@/lib/database/models/order.model'; // Assuming this path is correct

interface OrderWithId extends IOrder {
  _id: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const response = await fetch('/api/orders');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.orders as OrderWithId[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) return <div className="container mx-auto p-4"><p className="text-center">Loading orders...</p></div>;
  if (error) return <div className="container mx-auto p-4"><p className="text-center text-red-500">Error: {error}</p></div>;
  if (orders.length === 0) return <div className="container mx-auto p-4"><p className="text-center">You have no orders yet.</p></div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="border p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Order ID: {order._id}</h2>
              <span className={`px-2 py-1 text-sm rounded-full ${order.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : order.status === 'delivered' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p className="text-sm text-gray-600 mb-3">Total: ${order.totalAmount?.toFixed(2) || '0.00'}</p>
            <Link href={`/profile/orders/${order._id}`}>
              <span className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">View Details</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
