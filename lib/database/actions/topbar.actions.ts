"use server";
import { connectToDatabase } from "../connect";
import { handleError } from "@/lib/utils";
import TopBar from "../models/topbar.model";
import { unstable_cache } from "next/cache";

// fetch all top bars for this project
export const getAllTopBars = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const topbars = await TopBar.find({}).sort({ updateAt: -1 }).lean();
      if (!topbars) {
        return {
          message: "No topbars found!",
          success: false,
          topabars: [],
        };
      }
      return {
        topbars: JSON.parse(JSON.stringify(topbars)),
        message: "Successfully fetched all topbars.",
        success: true,
      };
    } catch (error) {
      handleError(error);
    }
  },
  ["topbar"],
  {
    revalidate: 1800,
  }
);
