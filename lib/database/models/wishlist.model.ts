import mongoose, { Schema, Document, models, model } from "mongoose";

const WishlistItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  addedAt: { type: Date, default: Date.now },
});

const WishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [WishlistItemSchema], // <-- This is the key part!
  },
  { timestamps: true }
);

const Wishlist = models.Wishlist || model("Wishlist", WishlistSchema);

export default Wishlist;
