import mongoose, { Schema, Document, models, Model } from 'mongoose';
import { ICategory } from './category.model'; // Import ICategory for type safety

// Interface for SubCategory document
export interface ISubCategory extends Document {
  name: string;
  slug: string;
  parent: ICategory['_id']; // Reference to the parent Category's ID
  description?: string;
  // Add other fields as necessary
}

const SubCategorySchema: Schema<ISubCategory> = new Schema(
  {
    name: {
      type: String,
      required: [true, "SubCategory name is required."],
      trim: true,
      minlength: [2, "SubCategory name must be at least 2 characters long."],
      maxlength: [100, "SubCategory name cannot exceed 100 characters."],
    },
    slug: {
      type: String,
      required: [true, "SubCategory slug is required."],
      unique: true, // Ensure slugs are unique if necessary, or unique per parent
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category', // Correctly reference the Category model
      required: [true, "Parent category is required."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."]
    },
    // Define other fields here
  },
  { timestamps: true }
);

// Indexes for common queries
SubCategorySchema.index({ parent: 1 });
SubCategorySchema.index({ name: 1 }); // Index for name, possibly in conjunction with parent

// Ensure uniqueness for name within the same parent category if needed
// SubCategorySchema.index({ parent: 1, name: 1 }, { unique: true });

const SubCategory: Model<ISubCategory> = models.SubCategory || mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);

export default SubCategory;
