import { serializeData } from '@/lib/utils/serialization';
import { connectToDatabase } from '@/lib/database/connect';

export async function getAllTopBars() {
  try {
    await connectToDatabase();
    
    // For now, return an empty array since we don't have a TopBar model
    // This can be implemented later when the TopBar model is created
    const data: any[] = [];

    // Serialize the data before returning it
    return serializeData(data);
  } catch (error) {
    console.error('Error fetching top bars:', error);
    throw error;
  }
}