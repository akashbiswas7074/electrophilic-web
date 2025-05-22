import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for embedded image schema
export interface IImageEmbedded extends Document {
  url?: string;
  public_id?: string;
}

const ImageEmbeddedSchema = new Schema<IImageEmbedded>({
  url: { type: String },
  public_id: { type: String },
});

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  images?: IImageEmbedded[];
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters long."],
      maxlength: [100, "Category name cannot exceed 100 characters."]
    },
    slug: {
      type: String,
      required: [true, "Category slug is required."],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters."]
    },
    images: [ImageEmbeddedSchema],
  },
  { timestamps: true }
);

const Category: Model<ICategory> = models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
