import mongoose, { Schema, Model } from "mongoose";

// Define the interface for website footer
export interface IWebsiteFooter {
  _id?: string;
  name: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  companyLinks: Array<{
    title: string;
    url: string;
  }>;
  shopLinks: Array<{
    title: string;
    url: string;
  }>;
  helpLinks: Array<{
    title: string;
    url: string;
  }>;
  copyrightText: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema for Website Footer
const WebsiteFooterSchema = new Schema<IWebsiteFooter>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    contactInfo: {
      email: {
        type: String,
        required: [true, "Email is required"],
      },
      phone: {
        type: String,
        required: [true, "Phone number is required"],
      },
      address: {
        type: String,
        required: [true, "Address is required"],
      },
    },
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      youtube: String,
      linkedin: String,
    },
    companyLinks: [
      {
        title: String,
        url: String,
      },
    ],
    shopLinks: [
      {
        title: String,
        url: String,
      },
    ],
    helpLinks: [
      {
        title: String,
        url: String,
      },
    ],
    copyrightText: {
      type: String,
      required: [true, "Copyright text is required"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Only one footer can be active at a time
WebsiteFooterSchema.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    // Add type assertion to this.constructor
    await (this.constructor as Model<IWebsiteFooter>).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Create and export the model
const WebsiteFooter =
  mongoose.models.WebsiteFooter ||
  mongoose.model<IWebsiteFooter>("WebsiteFooter", WebsiteFooterSchema);

export default WebsiteFooter;