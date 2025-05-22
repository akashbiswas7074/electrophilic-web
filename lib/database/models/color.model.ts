import { Schema, model, models } from "mongoose";

const colorSchema = new Schema({
  color: { type: String, required: true },
  image: { type: String },
  name: { type: String, required: true },
});

const Color = models.Color || model("Color", colorSchema);

export default Color;
