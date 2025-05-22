import { Schema, model, models, Document, Model } from "mongoose";

export interface ICategorySection extends Document {
  title: string;
  categoryId: Schema.Types.ObjectId;
  displayOrder: number;
  productLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySectionSchema = new Schema<ICategorySection>(
  {
    title: { type: String, required: true },
    categoryId: { 
      type: Schema.Types.ObjectId, 
      ref: "Category", 
      required: true 
    },
    displayOrder: { type: Number, default: 0 },
    productLimit: { type: Number, default: 8 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Create indexes to improve query performance
CategorySectionSchema.index({ displayOrder: 1 });
CategorySectionSchema.index({ isActive: 1 });

const CategorySection: Model<ICategorySection> = models.CategorySection || model<ICategorySection>("CategorySection", CategorySectionSchema);

export default CategorySection;