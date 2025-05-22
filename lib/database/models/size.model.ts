import { Schema, model, models } from "mongoose";

const sizeSchema = new Schema({
  size: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, default: 0 },
});

const Size = models.Size || model("Size", sizeSchema);

export default Size;
