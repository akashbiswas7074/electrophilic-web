"use  server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import HomeScreenOffer from "../models/home.screen.offers";
import { unstable_cache } from "next/cache";

// Get all offers for home screen
export const getAllSpecialComboOffers = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const offers = await HomeScreenOffer.find({
        offerType: "specialCombo",
      }).sort({ updatedAt: -1 });
      return {
        offers: JSON.parse(JSON.stringify(offers)),
        message: "Successfully fetched specialCombo offers.",
        success: true,
      };
    } catch (error) {
      handleError(error); // Existing error handler
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching special combo offers.";
      return {
        offers: [],
        message: errorMessage,
        success: false,
      };
    }
  },
  ["special_combos"],
  {
    revalidate: 600,
  }
);

// Get all offers for home screen
export const getAllHomeScreenOffers = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      // Fetch all offers without filtering by offerType
      const offers = await HomeScreenOffer.find({}).sort({ updatedAt: -1 });
      return {
        offers: JSON.parse(JSON.stringify(offers)),
        message: "Successfully fetched all home screen offers.",
        success: true,
      };
    } catch (error) {
      handleError(error); // Existing error handler
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while fetching all home screen offers.";
      return {
        offers: [],
        message: errorMessage,
        success: false,
      };
    }
  },
  ["all_home_screen_offers"], // Unique cache key
  {
    revalidate: 600, // Revalidate every 10 minutes
  }
);

// Get all offers for home screen
export const getAllCrazyDealOffers = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const offers = await HomeScreenOffer.find({
        offerType: "crazyDeal",
      }).sort({ updatedAt: -1 });
      return {
        offers: JSON.parse(JSON.stringify(offers)),
        message: "Successfully fetched crazyDeal offers.",
        success: true,
      };
    } catch (error) {
      handleError(error); // Existing error handler
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching crazy deal offers.";
      return {
        offers: [],
        message: errorMessage,
        success: false,
      };
    }
  },
  ["crazy_deals"],
  {
    revalidate: 600,
  }
);
