import { Schema, model, models, Document, default as mongoose } from "mongoose"; // Import Document and mongoose
import bcrypt from "bcryptjs";

// Define an interface representing a document in MongoDB.
export interface IUser extends Document {
  firstName: string; // Changed from name
  lastName: string; // Added
  email: string;
  username: string;
  password?: string; // Password is optional as it might not exist for OAuth users
  role: string;
  image?: string;
  provider: 'credentials' | 'google' | 'phone' | string; // Added 'phone' as a provider
  emailVerified?: Date | null;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  signInToken?: string; // Added for sign-in link
  signInTokenExpires?: Date; // Added for sign-in link
  
  // Phone verification fields
  phone?: string; // User's phone number
  phoneVerified?: Date | null; // Date when phone was verified
  phoneVerificationCode?: string; // Hashed verification code (deprecated, use phoneOTP instead)
  phoneVerificationExpires?: Date; // Expiration time for verification code (deprecated)
  
  // Phone OTP fields (new)
  phoneOTP?: string; // Hashed OTP code
  phoneOTPExpires?: Date; // Expiration time for OTP
  
  address?: IEmbeddedAddress[]; // Use IEmbeddedAddress
  // Add other fields as needed
  createdAt: Date;
  updatedAt: Date;
  // Method declaration
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface for the address subdocument (embedded)
export interface IEmbeddedAddress {
  _id?: mongoose.Types.ObjectId; // Mongoose will auto-generate this
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface IAddress extends Document { // This interface might be for a separate Address collection, if ever needed.
    user: mongoose.Schema.Types.ObjectId; 
    address1: string; 
    address2?: string; 
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault?: boolean;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}

const UserSchema = new Schema<IUser>( // Use the interface
  {
    firstName: { type: String, required: true }, // Changed from name
    lastName: { type: String, required: true }, // Added
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, select: false }, // Select false to hide by default
    role: { type: String, default: "user" },
    image: { type: String },
    provider: { type: String, default: "credentials", enum: ["credentials", "google", "phone"] }, // Added "phone" to enum
    emailVerified: { type: Date, default: null },

    // Password Reset Fields
    resetPasswordToken: { type: String, select: false }, // Hide by default
    resetPasswordExpires: { type: Date, select: false }, // Hide by default

    // Email Verification Fields
    verificationToken: { type: String, select: false }, // Hide by default
    verificationTokenExpires: { type: Date, select: false }, // Hide by default

    // Sign-In Token Fields
    signInToken: { type: String, select: false }, // Hide by default
    signInTokenExpires: { type: Date, select: false }, // Hide by default
    
    // Phone Fields
    phone: { type: String, trim: true, sparse: true }, // Not requiring by default, sparse: true allows multiple null values
    phoneVerified: { type: Date, default: null },
    phoneVerificationCode: { type: String, select: false }, // Legacy field, kept for backward compatibility
    phoneVerificationExpires: { type: Date, select: false }, // Legacy field, kept for backward compatibility
    
    // Phone OTP Fields (new)
    phoneOTP: { type: String, select: false }, // Hide by default
    phoneOTPExpires: { type: Date, select: false }, // Hide by default

    // Address - Embedded subdocuments
    address: [
        new Schema<IEmbeddedAddress>({ // Define sub-schema explicitly
            address1: { type: String, required: true },
            address2: { type: String },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true },
            isDefault: { type: Boolean, default: false },
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            phoneNumber: { type: String, required: true },
        }, { _id: true, timestamps: false }) // _id: true is default for subschemas, Mongoose adds it. timestamps: false for subdocs unless needed.
    ],
  },
  { timestamps: true }
);

// Hash password before saving ONLY if it's modified and provider is 'credentials'
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash the password if it has been modified (or is new) and provider is credentials
  if (!this.isModified("password") || this.provider !== 'credentials' || !this.password) {
     return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    // Ensure Mongoose 5+ error handling
    next(err instanceof Error ? err : new Error('Password hashing failed'));
  }
});

// Ensure Google users always have emailVerified set to a Date and role is maintained
UserSchema.pre<IUser>("save", function (next) {
  // If this is a Google user and emailVerified is null or undefined, set it to current date
  if (this.provider === 'google' && !this.emailVerified) {
    this.emailVerified = new Date();
    console.log(`[User Model] Auto-verified email for Google user: ${this.email}`);
  }
  
  // Ensure all users have a role
  if (!this.role) {
    this.role = 'user';
    console.log(`[User Model] Setting default role 'user' for: ${this.email}`);
  }
  
  // If the user is trying to add an address and has an incomplete name, fill it in
  if (this.address && this.address.length > 0) {
    this.address.forEach(addr => {
      // If the address is missing first name or last name, use the user's name
      if (!addr.firstName && this.firstName) {
        addr.firstName = this.firstName;
      }
      if (!addr.lastName && this.lastName) {
        addr.lastName = this.lastName;
      }
    });
  }
  
  next();
});

// Method to compare password for login (ensure 'this' context is correct)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // Need to explicitly select the password field if it's `select: false`
  // This method is usually called on a document retrieved with the password selected.
  // If called on a document where password wasn't selected, this.password will be undefined.
  if (!this.password || this.provider !== 'credentials') {
    return false;
  }
  // 'this' refers to the document instance
  return bcrypt.compare(candidatePassword, this.password);
};


// Ensure the model is created only once
const User = models.User || model<IUser>("User", UserSchema);

export default User;
