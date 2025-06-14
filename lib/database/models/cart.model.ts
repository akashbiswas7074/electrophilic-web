import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const cartSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: ObjectId,
          ref: "Product",
          required: true
        },
        name: {
          type: String,
          required: true
        },
        vendor: {
          type: Object
        },
        image: {
          type: String,
          default: "/placeholder-product.png"
        },
        size: {
          type: String
        },
        qty: {
          type: Number,
          required: true,
          min: 1,
          default: 1
        },
        color: {
          color: String,
          image: String
        },
        price: {
          type: Number,
          required: true
        },
        user: {
          type: ObjectId,
          ref: "User",
          required: true
        }
      }
    ],
    cartTotal: {
      type: Number,
      required: true,
      default: 0
    },
    totalAfterDiscount: Number,
    user: {
      type: ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

cartSchema.index({ user: 1 });

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export default Cart;
