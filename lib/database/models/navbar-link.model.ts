import mongoose, { Document, Schema } from "mongoose";

export interface NavbarLinkChild {
  _id?: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
}

export interface INavbarLink {
  // Removed _id field to avoid conflict with Document interface
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  children?: NavbarLinkChild[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NavbarLinkDocument extends INavbarLink, Document {}

const NavbarLinkChildSchema = new Schema({
  label: { type: String, required: true },
  href: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isExternal: { type: Boolean, default: false },
});

const NavbarLinkSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isExternal: { type: Boolean, default: false },
    children: [NavbarLinkChildSchema],
  },
  { timestamps: true }
);

// Check if model exists before defining it (for Next.js hot reloading)
const NavbarLink = mongoose.models.NavbarLink || mongoose.model<NavbarLinkDocument>("NavbarLink", NavbarLinkSchema);

export default NavbarLink;