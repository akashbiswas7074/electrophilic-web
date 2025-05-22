import nodemailer from 'nodemailer';
import { IUser } from '@/lib/database/models/user.model'; // Assuming IUser is in user.model.ts
import User from '@/lib/database/models/user.model'; // Import the User model
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/database/connect'; // Added import

// Helper function to get company name from environment variables
const getCompanyName = () => process.env.COMPANY_NAME || 'VibeCart';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Interface for COD verification email data
interface CodVerificationEmailData {
  userName: string;
  verificationCode: string;
  orderId: string;
  expiresInMinutes: number; // To inform the user how long the code is valid
  appUrl: string;
}

// Interface for order status update email data
interface OrderStatusUpdateData {
  orderId: string;
  userName: string;
  status: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  statusUpdateMessage: string;
}

// Interface for admin notification email data
interface AdminNotificationData {
  type: string; // Type of notification (e.g., 'cancellation_request')
  orderId: string;
  orderNumber: string;
  productName: string;
  userName: string;
  userEmail: string;
  reason?: string;
  timestamp: string;
}

// Configure the transporter
// It's highly recommended to use environment variables for sensitive data like email credentials.
// Ensure these are set in your .env.local file (for local development) or your hosting provider's environment settings.
// Example .env.local:
// EMAIL_SERVER_HOST=smtp.example.com
// EMAIL_SERVER_PORT=587
// EMAIL_SERVER_USER=your-email@example.com
// EMAIL_SERVER_PASSWORD=your-email-password
// EMAIL_FROM='Your App Name <noreply@example.com>'
// NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your production URL)

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10) === 465, // true for 465, false for other ports
});

async function sendEmail(options: EmailOptions) {
  try {
    const emailFrom = process.env.EMAIL_FROM || 'noreply@example.com';
    await transporter.sendMail({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log('Email sent successfully to:', options.to);
  } catch (error) {
    console.error('Error sending email:', error);
    // Depending on your error handling strategy, you might want to throw the error
    // or return a status indicating failure.
    throw new Error('Failed to send email');
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl}/auth/reset-password?token=${token}`;
  const companyName = getCompanyName();
  const subject = `Reset Your ${companyName} Password`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="color: #007bff; text-decoration: none;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <hr/>
      <p>Thanks,</p>
      <p>The ${companyName} Team</p>
    </div>
  `;
  await sendEmail({ to, subject, html });
}

export async function sendVerificationEmail(to: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationLink = `${appUrl}/auth/verify-email?token=${token}`;
  const companyName = getCompanyName();
  const subject = `Verify Your ${companyName} Email Address`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Welcome to ${companyName}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}" style="color: #007bff; text-decoration: none;">Verify Email</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not sign up for an account, please ignore this email.</p>
      <hr/>
      <p>Thanks,</p>
      <p>The ${companyName} Team</p>
    </div>
  `;
  await sendEmail({ to, subject, html });
}

// Function to send COD verification email
export async function sendCodVerificationEmail(to: string, data: CodVerificationEmailData) {
  const { userName, verificationCode, orderId, expiresInMinutes, appUrl } = data;
  const companyName = getCompanyName();
  const subject = `Verify Your ${companyName} COD Order`;

  // Basic HTML structure for the email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="text-align: center; color: #2B2B2B;">${companyName} - Verify Your Order</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for your Cash on Delivery (COD) order with ${companyName}!</p>
        <p>To confirm your order (ID: <strong>${orderId}</strong>), please use the following verification code:</p>
        <p style="font-size: 24px; font-weight: bold; text-align: center; color: #007bff; margin: 20px 0;">
          ${verificationCode}
        </p>
        <p>This code will expire in <strong>${expiresInMinutes} minutes</strong>.</p>
        <p>If you did not place this order, please ignore this email.</p>
        <p>Thanks,<br>The ${companyName} Team</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; font-size: 12px; color: #aaa;">
          &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          If you have any questions, please visit our <a href="${appUrl}/contact" style="color: #007bff;">contact page</a>.
        </p>
      </div>
    </div>
  `;

  // Plain text version
  const textContent = `
    Hi ${userName},

    Thank you for your Cash on Delivery (COD) order with ${companyName}!
    To confirm your order (ID: ${orderId}), please use the following verification code: ${verificationCode}
    This code will expire in ${expiresInMinutes} minutes.

    If you did not place this order, please ignore this email.

    Thanks,
    The ${companyName} Team

    ---
    © ${new Date().getFullYear()} ${companyName}. All rights reserved.
    If you have any questions, please visit our contact page: ${appUrl}/contact
  `;

  await sendEmail({
    to,
    subject,
    text: textContent,
    html: htmlContent,
  });
  console.log(`COD verification email sent to ${to} for order ${orderId}`);
}

// Example of an Order Confirmation Email structure (can be expanded)
export async function sendOrderConfirmationEmail(to: string, orderDetails: any) {
  const companyName = getCompanyName();
  const subject = `Your ${companyName} Order Confirmation (#${orderDetails.orderId || orderDetails.id})`;
  // Implement HTML generation based on orderDetails. You can use a templating engine or build HTML string.
  // For a complex email, consider using a library like react-email if you haven't already (based on your lib/emails/index.tsx).
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Order Confirmed!</h2>
      <p>Hi ${orderDetails.userName || 'Customer'},</p>
      <p>Thank you for your order #${orderDetails.orderId || orderDetails.id}. We're getting your order ready to be shipped. We will notify you when it has been sent.</p>
      
      <h3>Order Summary:</h3>
      <ul>
        ${orderDetails.items.map((item: any) => `<li>${item.name} (Qty: ${item.quantity}) - $${item.price}</li>`).join('')}
      </ul>
      <p><strong>Total: $${orderDetails.totalAmount}</strong></p>
      
      <p>You can view your order details here: <a href="${process.env.NEXT_PUBLIC_APP_URL}/order/${orderDetails.orderId || orderDetails.id}">View Order</a></p>
      
      <hr/>
      <p>Thanks for shopping with ${companyName}!</p>
    </div>
  `;
  await sendEmail({ to, subject, html });
}

export async function sendSignInLinkEmail(userEmail: string, token: string) {
  const signInLink = `${process.env.NEXTAUTH_URL}/api/auth/verify-signin-token?token=${token}`;
  const companyName = getCompanyName();
  const subject = `Sign In to ${companyName}`;
  const htmlContent = `
    <h1>Sign In to ${companyName}</h1>
    <p>Click the link below to sign in to your ${companyName} account:</p>
    <a href="${signInLink}" target="_blank">Sign In</a>
    <p>This link will expire in 15 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  const textContent = `
    Sign In to ${companyName}
    Copy and paste the following link into your browser to sign in to your ${companyName} account:
    ${signInLink}
    This link will expire in 15 minutes.
    If you didn't request this, please ignore this email.
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html: htmlContent,
    text: textContent,
  });
}

export async function createSignInToken(email: string): Promise<string | null> {
  try {
    await connectToDatabase(); // Ensure connectToDatabase is imported if not already
    const user = await User.findOne({ email });

    if (!user) {
      console.warn(`Attempt to create sign-in token for non-existent email: ${email}`);
      // Optionally, you might still generate a token to avoid revealing if an email exists,
      // but the verification step will fail anyway.
      return null; 
    }

    // Check if user is verified (optional, but good practice for passwordless sign-in)
    // if (!user.emailVerified) {
    //   console.warn(`Sign-in token requested for unverified email: ${email}`);
    //   return null; // Or trigger a new verification email
    // }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    // Shorter expiry for sign-in links compared to verification or password reset
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    user.signInToken = hashedToken;
    user.signInTokenExpires = expires;
    await user.save();

    return token; // Return the unhashed token to be sent in the email
  } catch (error) {
    console.error('Error creating sign-in token:', error);
    return null;
  }
}

// Function to send email notifications when order status changes
export async function sendOrderStatusUpdateEmail(to: string, orderDetails: OrderStatusUpdateData) {
  const { orderId, userName, status, statusUpdateMessage, orderItems, totalAmount } = orderDetails;
  const companyName = getCompanyName();
  const subject = `Your ${companyName} Order Status Update (#${orderId})`;
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const orderUrl = `${appUrl}/orders/${orderId}`;
  
  // Generate HTML for order items
  const itemsHtml = orderItems.map(item => 
    `<li style="margin-bottom: 8px;">${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}</li>`
  ).join('');
    const statusColorMap: Record<string, string> = {
    'Processing': '#ffa500', // Orange
    'Confirmed': '#00acc1',  // Cyan
    'Shipped': '#007bff',    // Blue
    'Delivered': '#28a745',  // Green
    'Cancelled': '#dc3545',  // Red
    'Not Processed': '#6c757d', // Gray 
    'Completed': '#28a745'   // Green
  };
  
  const statusColor = statusColorMap[status] || '#6c757d';
  
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #333;">Order Status Update</h1>
      </div>
      
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p>Hi ${userName},</p>
        <p><strong style="color: ${statusColor};">Order Status: ${status}</strong></p>
        <p>${statusUpdateMessage}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3>Order Summary (#${orderId}):</h3>
        <ul style="list-style-type: none; padding: 0;">
          ${itemsHtml}
        </ul>
        <p><strong>Total: $${totalAmount.toFixed(2)}</strong></p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${orderUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Order Details</a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
        <p>Thank you for shopping with ${companyName}!</p>
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </div>
  `;
  
  const text = `
    Order Status Update
    
    Hi ${userName},
    
    Order Status: ${status}
    ${statusUpdateMessage}
    
    Order Summary (#${orderId}):
    ${orderItems.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`).join('\n')}
    
    Total: $${totalAmount.toFixed(2)}
    
    View your order details: ${orderUrl}
    
    Thank you for shopping with ${companyName}!
  `;
  
  await sendEmail({ to, subject, html, text });
  console.log(`Order status update email sent to ${to} for order ${orderId}`);
}

// Function for sending generic emails (used by contact form and other general purpose emails)
export async function sendGenericEmail(to: string, subject: string, htmlBody: string, textBody?: string) {
  try {
    await sendEmail({
      to,
      subject,
      html: htmlBody,
      text: textBody,
    });
    console.log(`Generic email sent successfully to: ${to} with subject: ${subject}`);
    return { success: true, message: "Email sent successfully." };
  } catch (error: any) {
    console.error(`Error sending generic email to ${to}:`, error);
    return { success: false, message: error.message || "Failed to send email." };
  }
}

// Function to send notifications to admin
export async function sendAdminNotificationEmail(to: string, data: AdminNotificationData) {
  const { type, orderId, orderNumber, productName, userName, userEmail, reason, timestamp } = data;
  const companyName = getCompanyName();
  let subject = '';
  let html = '';
  let text = '';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const adminUrl = `${appUrl}/admin/dashboard/orders/view/${orderId}`;
  const formattedDate = new Date(timestamp).toLocaleString();

  // Template for cancellation request notification
  if (type === 'cancellation_request') {
    subject = `[ACTION REQUIRED] Cancellation Request - Order #${orderNumber}`;
    
    html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #856404;">New Cancellation Request</h2>
          <p>A customer has requested to cancel an item in their order.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Order ID:</strong> ${orderNumber}</p>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Customer:</strong> ${userName} (${userEmail})</p>
          <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
          <p><strong>Requested on:</strong> ${formattedDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Order Details
          </a>
        </div>
        
        <div style="font-size: 0.9em; color: #6c757d;">
          <p>You are receiving this email because you are listed as an administrator for ${companyName}.</p>
        </div>
      </div>
    `;
    
    text = `
      NEW CANCELLATION REQUEST
      
      A customer has requested to cancel an item in their order.
      
      Order ID: ${orderNumber}
      Product: ${productName}
      Customer: ${userName} (${userEmail})
      Reason: ${reason || 'No reason provided'}
      Requested on: ${formattedDate}
      
      View order details: ${adminUrl}
      
      You are receiving this email because you are listed as an administrator for ${companyName}.
    `;
  } else {
    // Default template for other notifications
    subject = `[${companyName} Admin] Notification - Order #${orderNumber}`;
    
    html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="margin-top: 0;">${companyName} Admin Notification</h2>
        <p>This is a notification related to Order #${orderNumber}.</p>
        <p>Please check the admin dashboard for more details.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Order Details
          </a>
        </div>
      </div>
    `;
    
    text = `
      ${companyName} Admin Notification
      
      This is a notification related to Order #${orderNumber}.
      Please check the admin dashboard for more details.
      
      View order details: ${adminUrl}
    `;
  }
  
  await sendEmail({ 
    to, 
    subject, 
    html, 
    text 
  });
  
  console.log(`Admin notification email sent to ${to} for order ${orderNumber}`);
}
