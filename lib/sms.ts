import { connectToDatabase } from "./database/connect";
import User from "./database/models/user.model";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Interface for OTP verification results
 */
interface OTPVerificationResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Interface for OTP sending results
 */
interface OTPSendResult {
  success: boolean;
  message: string;
  otpId?: string;
}

/**
 * Interface for Fast2SMS API response
 */
interface Fast2SMSResponse {
  return: boolean;
  request_id: string;
  message: string[];
  data?: any;
}

/**
 * Send OTP via SMS using Fast2SMS OTP API
 * @param phone Phone number to send OTP to
 * @param otp The OTP code to send
 * @returns Promise resolving to success status and message
 */
async function sendSMSOTP(phone: string, otp: string): Promise<OTPSendResult> {
  try {
    // Fast2SMS API settings
    const apiKey = process.env.FAST2SMS_API_KEY;
    
    if (!apiKey) {
      console.error("FAST2SMS_API_KEY is not configured in environment variables");
      return { success: false, message: "SMS service is not properly configured" };
    }

    console.log(`Using API key starting with: ${apiKey.substring(0, 5)}...`);
    
    // Clean the API key (remove quotes if present)
    const cleanApiKey = apiKey.replace(/['"]+/g, '');
    
    // Using OTP route for Fast2SMS
    const route = 'otp'; // OTP route for Fast2SMS
    const url = "https://www.fast2sms.com/dev/bulkV2";
    
    // Prepare the request options with proper headers
    const options = {
      method: 'GET',
      headers: {
        'Authorization': cleanApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Build the URL with query parameters for OTP API
    const queryParams = new URLSearchParams({
      authorization: cleanApiKey,
      route,
      variables_values: otp,
      flash: '0',
      numbers: phone
    });

    const fullUrl = `${url}?${queryParams.toString()}`;
    
    console.log(`Sending SMS OTP to: ${phone} using OTP API`);
    
    // Make the API request
    const response = await fetch(fullUrl, options);
    console.log(`SMS API Response status: ${response.status}`);
    
    const data = await response.json();
    console.log("SMS API Response data:", JSON.stringify(data));
    
    if (data.return) {
      console.log(`SMS OTP sent successfully to ${phone}, request_id: ${data.request_id}`);
      return { success: true, message: "OTP sent successfully via SMS", otpId: data.request_id };
    } else {
      // Handle different message formats (string or array)
      let errorMessage = "Failed to send OTP via SMS";
      if (data.message) {
        if (Array.isArray(data.message)) {
          errorMessage = `Failed to send SMS OTP: ${data.message.join(', ')}`;
        } else if (typeof data.message === 'string') {
          errorMessage = `Failed to send SMS OTP: ${data.message}`;
        } else {
          errorMessage = `Failed to send SMS OTP: ${JSON.stringify(data.message)}`;
        }
      }
      
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  } catch (error: any) {
    console.error("Error sending SMS OTP:", error);
    return { success: false, message: error.message || "Failed to send OTP via SMS" };
  }
}

/**
 * Send OTP via WhatsApp using Fast2SMS API
 * @param phone Phone number to send WhatsApp OTP to
 * @param otp The OTP code to send
 * @returns Promise resolving to success status and message
 */
async function sendWhatsAppOTP(phone: string, otp: string): Promise<OTPSendResult> {
  try {
    // Fast2SMS API settings for WhatsApp
    const apiKey = process.env.FAST2SMS_API_KEY;
    
    if (!apiKey) {
      console.error("FAST2SMS_API_KEY is not configured in environment variables");
      return { success: false, message: "WhatsApp service is not properly configured" };
    }
    
    console.log(`Using API key starting with: ${apiKey.substring(0, 5)}...`);
    
    // Clean the API key (remove quotes if present)
    const cleanApiKey = apiKey.replace(/['"]+/g, '');

    // Use Fast2SMS WhatsApp API endpoint
    const url = "https://www.fast2sms.com/dev/waSms";
    
    // Prepare the message template for WhatsApp
    const messageText = `Your VibeCart verification code is: ${otp}. This code will expire in 10 minutes.`;
    
    // Build the request body for WhatsApp API
    const requestBody = {
      authorization: cleanApiKey,
      numbers: phone,
      message: messageText
    };
    
    // Prepare the request options with proper headers
    const options = {
      method: 'POST',
      headers: {
        'Authorization': cleanApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };
    
    console.log(`Sending WhatsApp OTP to: ${phone}`);
    console.log("WhatsApp request body:", JSON.stringify(requestBody));
    
    // Make the API request
    const response = await fetch(url, options);
    console.log(`WhatsApp API Response status: ${response.status}`);
    
    const data = await response.json();
    console.log("WhatsApp API Response data:", JSON.stringify(data));
    
    if (data.return) {
      console.log(`WhatsApp OTP sent successfully to ${phone}, request_id: ${data.request_id}`);
      return { success: true, message: "OTP sent successfully via WhatsApp", otpId: data.request_id };
    } else {
      // Handle different message formats (string or array)
      let errorMessage = "Failed to send OTP via WhatsApp";
      if (data.message) {
        if (Array.isArray(data.message)) {
          errorMessage = `Failed to send WhatsApp OTP: ${data.message.join(', ')}`;
        } else if (typeof data.message === 'string') {
          errorMessage = `Failed to send WhatsApp OTP: ${data.message}`;
        } else {
          errorMessage = `Failed to send WhatsApp OTP: ${JSON.stringify(data.message)}`;
        }
      }
      console.error(errorMessage);
      
      // If WhatsApp fails, try sending via SMS as fallback
      console.log("WhatsApp delivery failed, attempting fallback to SMS");
      return await sendSMSOTP(phone, otp);
    }
  } catch (error: any) {
    console.error("Error sending WhatsApp OTP:", error);
    // Try SMS as fallback
    console.log("WhatsApp error occurred, attempting fallback to SMS");
    return await sendSMSOTP(phone, otp);
  }
}

/**
 * Generate a random 6-digit OTP code
 * @returns 6-digit OTP string
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format a phone number for consistent processing
 * Removes spaces, dashes, etc. and adds country code if missing
 * @param phone Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let formattedPhone = phone.replace(/\D/g, '');
  
  // If the number doesn't start with country code, assume India (+91)
  if (formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }
  
  return formattedPhone;
}

/**
 * Send phone verification OTP via specified channel (SMS or WhatsApp)
 * @param phone Phone number to verify
 * @param channel Channel to use for sending OTP ('sms' or 'whatsapp')
 * @param userId Optional user ID if already exists
 * @returns Promise resolving to OTP send result
 */
export async function sendPhoneOTP(
  phone: string, 
  channel: 'sms' | 'whatsapp' = 'sms',
  userId?: string
): Promise<OTPSendResult> {
  try {
    if (!phone) {
      return { success: false, message: "Phone number is required" };
    }
    
    // Format the phone number - remove spaces, dashes, etc.
    const formattedPhone = phone.trim().replace(/\s+/g, '');
    
    // Generate OTP
    const otp = generateOTP();
    // Increased to 30 minutes to give users more time
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    console.log(`[sendPhoneOTP] Generated new OTP for ${formattedPhone}`);
    console.log(`[sendPhoneOTP] OTP expiry set to: ${otpExpiry.toISOString()}`);
    
    // Hash OTP before storing
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);
    
    // Connect to database
    await connectToDatabase();
    
    // Debug: Log actual OTP for testing (remove in production)
    console.log(`[sendPhoneOTP] DEBUG - Generated OTP for ${formattedPhone}: ${otp}`);
    
    try {
      // If userId is provided, update the user record
      if (userId) {
        console.log(`[sendPhoneOTP] Updating existing user with ID ${userId}`);
        
        // Find user by ID
        const user = await User.findById(userId);
        
        if (!user) {
          console.log(`[sendPhoneOTP] ERROR: User with ID ${userId} not found`);
          return { success: false, message: "User not found" };
        }
        
        // Update user with phone and OTP details
        user.phone = formattedPhone;
        user.phoneOTP = hashedOTP;
        user.phoneOTPExpires = otpExpiry;
        
        // Save changes and force Mongoose to write all fields
        await user.save();
        
        // Verify OTP was saved by re-fetching the user with explicit field selection
        const updatedUser = await User.findById(userId).select('+phoneOTP +phoneOTPExpires');
        if (!updatedUser?.phoneOTP) {
          console.log(`[sendPhoneOTP] WARNING: OTP was not saved properly for user ${userId}`);
        } else {
          console.log(`[sendPhoneOTP] Successfully updated user ${userId} with new OTP`);
        }
      } else {
        // Check if phone number exists
        console.log(`[sendPhoneOTP] Checking for existing user with phone ${formattedPhone}`);
        const existingUser = await User.findOne({ phone: formattedPhone });
        
        if (existingUser) {
          console.log(`[sendPhoneOTP] Found existing user with ID ${existingUser._id} for phone ${formattedPhone}`);
          // Update the existing user with new OTP
          existingUser.phoneOTP = hashedOTP;
          existingUser.phoneOTPExpires = otpExpiry;
          
          // Save changes and force Mongoose to write all fields
          await existingUser.save();
          
          // Verify OTP was saved
          const updatedUser = await User.findById(existingUser._id).select('+phoneOTP +phoneOTPExpires');
          if (!updatedUser?.phoneOTP) {
            console.log(`[sendPhoneOTP] WARNING: OTP was not saved properly for user ${existingUser._id}`);
          } else {
            console.log(`[sendPhoneOTP] Successfully updated user ${existingUser._id} with new OTP`);
          }
        } else {
          console.log(`[sendPhoneOTP] No existing user found for phone ${formattedPhone}, creating new user`);
          // Create a temporary user record with phone number and OTP
          const tempUser = new User({
            phone: formattedPhone,
            phoneOTP: hashedOTP,
            phoneOTPExpires: otpExpiry,
            provider: 'phone',
            username: `user_${crypto.randomBytes(4).toString('hex')}`,
            firstName: 'Guest',
            lastName: 'User',
            email: `${formattedPhone}@temp.vibecart.com`, // Temporary email
          });
          
          // Save new user
          const newUser = await tempUser.save();
          console.log(`[sendPhoneOTP] Created new user with ID ${newUser._id} for phone ${formattedPhone}`);
          
          // Verify user was created with OTP
          const savedUser = await User.findById(newUser._id).select('+phoneOTP +phoneOTPExpires');
          if (!savedUser?.phoneOTP) {
            console.log(`[sendPhoneOTP] WARNING: OTP was not saved properly for new user ${newUser._id}`);
          }
        }
      }
      
      // Send OTP through the selected channel
      if (channel === 'whatsapp') {
        console.log(`[sendPhoneOTP] Sending OTP via WhatsApp to ${formattedPhone}`);
        return await sendWhatsAppOTP(formattedPhone, otp);
      } else {
        console.log(`[sendPhoneOTP] Sending OTP via SMS to ${formattedPhone}`);
        return await sendSMSOTP(formattedPhone, otp);
      }
    } catch (dbError: any) {
      console.error(`[sendPhoneOTP] Database error:`, dbError);
      return { success: false, message: "Failed to save verification code to database" };
    }
  } catch (error: any) {
    console.error("[sendPhoneOTP] Error:", error);
    return { success: false, message: error.message || "Failed to process OTP request" };
  }
}

/**
 * Verify phone OTP code
 * @param phone Phone number to verify
 * @param code OTP code entered by user
 * @param userId Optional user ID if already exists
 * @returns Promise resolving to verification result
 */
export async function verifyPhoneOTP(
  phone: string,
  code: string,
  userId?: string
): Promise<OTPVerificationResult> {
  try {
    if (!phone || !code) {
      return { success: false, message: "Phone number and verification code are required" };
    }
    
    // Format the phone number
    const formattedPhone = phone.trim().replace(/\s+/g, '');
    console.log(`[verifyPhoneOTP] Attempting to verify OTP for phone: ${formattedPhone}`);
    
    await connectToDatabase();
    
    // Debug: Check if any user exists with this phone number regardless of OTP
    const anyUserWithPhone = await User.findOne({ phone: formattedPhone });
    if (!anyUserWithPhone) {
      console.log(`[verifyPhoneOTP] ERROR: No user found with phone number ${formattedPhone} in the database`);
    } else {
      console.log(`[verifyPhoneOTP] Found user with this phone: ${anyUserWithPhone._id}, checking for valid OTP...`);
    }
    
    // Find user by userId if provided, otherwise by phone
    let user;
    if (userId) {
      console.log(`[verifyPhoneOTP] Looking up user by ID: ${userId}`);
      user = await User.findById(userId).select('+phoneOTP +phoneOTPExpires');
      
      if (user && user.phone !== formattedPhone) {
        console.log(`[verifyPhoneOTP] WARNING: User ${userId} exists but has different phone: ${user.phone} vs ${formattedPhone}`);
      }
    } else {
      console.log(`[verifyPhoneOTP] Looking up user by phone: ${formattedPhone}`);
      user = await User.findOne({ phone: formattedPhone }).select('+phoneOTP +phoneOTPExpires');
    }
    
    if (!user) {
      console.log(`[verifyPhoneOTP] ERROR: No user found matching search criteria`);
      
      // Check if OTP might have been sent recently but not saved properly
      if (anyUserWithPhone) {
        console.log(`[verifyPhoneOTP] User exists but doesn't have active OTP. Try requesting a new code.`);
        return { 
          success: false, 
          message: "No active verification code found. Please request a new code."
        };
      }
      
      return { 
        success: false, 
        message: "No verification code found for this phone number. Please check your number or request a new code."
      };
    }
    
    console.log(`[verifyPhoneOTP] User found: ${user._id}`);
    console.log(`[verifyPhoneOTP] OTP status: ${user.phoneOTP ? 'Set' : 'Not set'}`);
    console.log(`[verifyPhoneOTP] OTP expiry: ${user.phoneOTPExpires ? user.phoneOTPExpires.toISOString() : 'Not set'}`);
    
    // Check if OTP exists
    if (!user.phoneOTP) {
      console.log(`[verifyPhoneOTP] ERROR: User found but has no OTP set`);
      return { 
        success: false, 
        message: "No active verification code found. Please request a new code."
      };
    }
    
    // Check if OTP has expired
    const now = new Date();
    if (!user.phoneOTPExpires) {
      console.log(`[verifyPhoneOTP] ERROR: No OTP expiration time set for user`);
      return { 
        success: false, 
        message: "Verification code is invalid. Please request a new one."
      };
    }
    
    if (user.phoneOTPExpires < now) {
      console.log(`[verifyPhoneOTP] ERROR: OTP expired. Current time: ${now.toISOString()}, Expiry time: ${user.phoneOTPExpires.toISOString()}`);
      
      // Calculate how long ago it expired
      const expiredMinutes = Math.floor((now.getTime() - user.phoneOTPExpires.getTime()) / (60 * 1000));
      return { 
        success: false, 
        message: `Verification code expired ${expiredMinutes} minutes ago. Please request a new code.` 
      };
    }
    
    // Verify OTP
    console.log(`[verifyPhoneOTP] Verifying OTP code for user ${user._id}`);
    const isValidOTP = await bcrypt.compare(code, user.phoneOTP);
    
    if (!isValidOTP) {
      console.log(`[verifyPhoneOTP] ERROR: Invalid OTP code provided for user ${user._id}`);
      return { success: false, message: "Invalid verification code. Please try again." };
    }
    
    console.log(`[verifyPhoneOTP] OTP verified successfully for user ${user._id}`);
    
    // Clear OTP fields after successful verification
    user.phoneOTP = undefined;
    user.phoneOTPExpires = undefined;
    
    // Mark phone as verified
    user.phoneVerified = new Date();
    
    await user.save();
    console.log(`[verifyPhoneOTP] Updated user ${user._id} - phone marked as verified`);
    
    return { 
      success: true, 
      message: "Phone number verified successfully", 
      userId: user._id.toString() 
    };
  } catch (error: any) {
    console.error("[verifyPhoneOTP] Error:", error);
    return { success: false, message: error.message || "Failed to verify code" };
  }
}

/**
 * Send OTP via Fast2SMS service
 * @param phone Phone number to send OTP to
 * @param otp The OTP code to send
 * @returns Promise resolving to OTP send result
 */
export function sendOTPviaFast2SMS(phone: string, otp: string): Promise<OTPSendResult> {
  // This is a wrapper around the sendSMSOTP function for backward compatibility
  return sendSMSOTP(phone, otp);
}