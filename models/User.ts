import mongoose, { Schema } from 'mongoose';

// Don't redefine the schema if it already exists
const UserSchema = mongoose.models.User 
  ? mongoose.models.User.schema 
  : new Schema({
      // Your user schema fields
      // ...

      // Remove the duplicate index definition
      // Either use this syntax:
      email: { type: String, required: true, unique: true },
      
      // Or this syntax, but not both:
      // email: { type: String, required: true },
      // Then: UserSchema.index({ email: 1 }, { unique: true });
    }, 
    { timestamps: true }
  );

// Only create the model if it doesn't already exist
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
