import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';
import User, { IEmbeddedAddress } from '@/lib/database/models/user.model';
import Product from '@/lib/database/models/product.model'; // Assuming you have a Product model

// POST: Create a new order
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { 
      orderItems, 
      deliveryAddressId, 
      paymentIntentId, 
      totalAmount, 
      paymentStatus 
    }: { 
      orderItems: any[], // Define a proper type for orderItems if available
      deliveryAddressId: string,
      paymentIntentId?: string,
      totalAmount: number,
      paymentStatus: 'pending' | 'paid' | 'failed' // Be specific with paymentStatus
    } = await req.json();

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ message: 'Order items cannot be empty' }, { status: 400 });
    }
    if (!deliveryAddressId) {
      return NextResponse.json({ message: 'Delivery address ID is required' }, { status: 400 });
    }
    if (totalAmount === undefined || totalAmount <= 0) {
      return NextResponse.json({ message: 'Total amount must be positive' }, { status: 400 });
    }
    if (!paymentStatus) {
      return NextResponse.json({ message: 'Payment status is required' }, { status: 400 });
    }

    const user = await User.findById(userId).select('address');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const selectedAddress = user.address?.find(
      (addr: IEmbeddedAddress) => addr._id?.toString() === deliveryAddressId
    );

    if (!selectedAddress) {
      return NextResponse.json({ message: 'Delivery address not found in user profile' }, { status: 404 });
    }

    // Explicitly map all required fields from selectedAddress to ensure everything is included.
    // This structure matches the deliveryAddress sub-schema in order.model.ts.
    const deliveryAddressToEmbed: Omit<IEmbeddedAddress, '_id' | 'isDefault'> = {
        address1: selectedAddress.address1,
        address2: selectedAddress.address2, // Will be undefined if not present, which is fine for an optional field
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        country: selectedAddress.country,
        firstName: selectedAddress.firstName,
        lastName: selectedAddress.lastName,
        phoneNumber: selectedAddress.phoneNumber, // Ensure this is correctly mapped
    };

    // Validate that all required fields for the order's deliveryAddress are present
    if (!deliveryAddressToEmbed.address1 || !deliveryAddressToEmbed.city || !deliveryAddressToEmbed.state || !deliveryAddressToEmbed.zipCode || !deliveryAddressToEmbed.country || !deliveryAddressToEmbed.firstName || !deliveryAddressToEmbed.lastName || !deliveryAddressToEmbed.phoneNumber) {
        console.error("Validation Error: Missing one or more required fields in selectedAddress for embedding.", selectedAddress);
        return NextResponse.json({ message: 'Selected delivery address is missing required fields.' }, { status: 400 });
    }

    const newOrder = new Order({
      user: userId,
      orderItems: orderItems.map((item: any) => ({
        product: item.productId, // Ensure client sends productId
        name: item.name,         // Ensure client sends name
        image: item.image,       // Ensure client sends image
        price: item.price,       // Ensure client sends price
        quantity: item.quantity,
      })),
      deliveryAddress: deliveryAddressToEmbed,
      totalAmount,
      paymentIntentId,
      paymentStatus,
      status: 'pending', // Initial order status
    });

    await newOrder.save();

    return NextResponse.json({ message: 'Order created successfully', order: newOrder }, { status: 201 });

  } catch (error) {
    console.error('[API/ORDERS POST] Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error creating order', error: errorMessage }, { status: 500 });
  }
}

// GET: Fetch all orders for the logged-in user
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const orders = await Order.find({ user: userId })
      .populate('orderItems.product', 'name images price') // Populate product details if needed
      .sort({ createdAt: -1 }); // Sort by newest first

    return NextResponse.json({ orders }, { status: 200 });

  } catch (error) {
    console.error('[API/ORDERS GET] Error fetching orders:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error fetching orders', error: errorMessage }, { status: 500 });
  }
}
