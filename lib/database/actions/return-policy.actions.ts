"use server";

import { connectToDatabase } from "@/lib/database/connect";
import ReturnPolicy from "@/lib/database/models/return-policy.model";

// Get the active return policy for the website
export const getActiveReturnPolicy = async () => {
  try {
    await connectToDatabase();
    
    const policy = await ReturnPolicy.findOne({ isActive: true }).lean();
    
    if (!policy) {
      // Return a default policy if none exists
      return {
        success: true,
        policy: {
          title: "Return & Exchange Policy",
          subtitle: "We've got your back—on and off the track.",
          heroIcon: "🏃‍♂️",
          sections: [
            {
              title: "You've Got 15 Days",
              content: "<p>Changed your mind? Need a different size? No problem. You can request a return or exchange within 15 days of your purchase.</p>",
              icon: "⏱️",
              order: 0,
              isActive: true
            },
            {
              title: "To Qualify for a Return or Exchange",
              content: "<p>Make sure your gear is:</p><ul><li><strong>Fresh outta the box</strong> – That means unworn, unwashed, and looking just like when it left our shelves.</li><li><strong>Fully loaded</strong> – Keep all the original packaging, tags, and accessories intact and in good shape.</li></ul>",
              icon: "✅",
              order: 1,
              isActive: true
            },
            {
              title: "How to Make a Return",
              content: "<p>It's simple:</p><ol><li>Log in to your PEEDS account.</li><li>Head to Order History.</li><li>Pick the item you want to return and follow the steps.</li><li>Once we receive and inspect your return, we'll process your refund or exchange right away.</li></ol>",
              icon: "📦",
              order: 2,
              isActive: true
            }
          ],
          metaTitle: "Return Policy - PEEDS",
          metaDescription: "Learn about our return and exchange policy. We've got your back with easy returns within 15 days.",
          customCSS: ""
        }
      };
    }
    
    return {
      success: true,
      policy: JSON.parse(JSON.stringify(policy))
    };
  } catch (error: any) {
    console.error("Error fetching return policy:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch return policy",
      policy: null
    };
  }
};