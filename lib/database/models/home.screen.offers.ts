import mongoose from 'mongoose';

const HomeScreenOffersSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  images: [
    {
      url: String,
      public_id: String,
    },
  ],
  offerType: {
    type: String,
    enum: ["specialCombo", "crazyDeal"],
    required: true,
  },
}, { timestamps: true });

const HomeScreenOffer =
  mongoose.models.HomeScreenOffer ||
  mongoose.model("HomeScreenOffer", HomeScreenOffersSchema);
export default HomeScreenOffer;
