import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';

// GET: Fetch the count of orders for the logged-in user
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const orderCount = await Order.countDocuments({ user: userId });

    return NextResponse.json({ count: orderCount }, { status: 200 });

  } catch (error) {
    console.error('[API/ORDERS/COUNT GET] Error fetching order count:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error fetching order count', error: errorMessage }, { status: 500 });
  }
}
