import mongoose, { Document, Schema } from 'mongoose';

export interface IFeaturedVideo extends Document {
  youtubeLink: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeaturedVideoSchema: Schema = new Schema(
  {
    youtubeLink: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FeaturedVideo = mongoose.models.FeaturedVideo || mongoose.model<IFeaturedVideo>('FeaturedVideo', FeaturedVideoSchema);

export default FeaturedVideo;