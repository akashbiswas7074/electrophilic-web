import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;
const reviewSchema = new mongoose.Schema({
  reviewBy: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  review: {
    type: String,
    required: true,
  },
  reviewCreatedAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
    required: true,
  },
});
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    longDescription: {
      type: String,
    },
    brand: {
      type: String,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: ObjectId,
      required: false,
      ref: "Category",
    },
    subCategories: {
      type: [
        {
          type: ObjectId,
          ref: "SubCategory",
        },
      ],
      required: false,
    },
    details: [
      {
        name: String,
        value: String,
      },
    ],
    benefits: [{ name: String }],
    ingredients: [{ name: String }],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    vendor: {
      type: Object,
    },
    subProducts: [
      {
        sku: String,
        images: [],
        description_images: [],
        sizes: [
          {
            size: String,
            qty: Number,
            price: Number, // This should be the FINAL price after discount
            originalPrice: Number, // Add original price field
            sold: {
              type: Number,
              default: 0,
            },
          },
        ],
        discount: {
          type: Number,
          default: 0,
        },
        sold: {
          type: Number,
          default: 0,
        },
      },
    ],
    featured: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
