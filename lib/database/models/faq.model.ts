import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema: Schema = new Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      default: "General",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  { timestamps: true }
);

// Create indexes for better query performance
FAQSchema.index({ category: 1, order: 1 });
FAQSchema.index({ isActive: 1 });
FAQSchema.index({ question: "text", answer: "text", tags: "text" });

const FAQ: mongoose.Model<IFAQ> = models.FAQ || model<IFAQ>("FAQ", FAQSchema);

export default FAQ;