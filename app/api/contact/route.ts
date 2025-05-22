import { NextRequest, NextResponse } from 'next/server';
import { sendGenericEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ 
        success: false, 
        message: "All fields are required" 
      }, { status: 400 });
    }    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid email format" 
      }, { status: 400 });
    }

    // Get the admin email from environment variable, fallback to a default
    // Make sure this is different from EMAIL_SERVER_USER to avoid emails being sent to yourself
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@vibecart.com';
    
    // Format the email subject
    const emailSubject = `Contact Form: ${subject}`;
    
    // Format the HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Contact Form Submission</h2>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #555;">Message:</h3>
          <p style="margin-bottom: 0;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="font-size: 0.9em; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          <p>This message was sent from the contact form on the VibeCart website.</p>
          <p>Replied-to email: ${email}</p>
        </div>
      </div>
    `;
    
    // Format the plain text email body (for email clients that don't support HTML)
    const textBody = `
      New Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      Subject: ${subject}
      
      Message:
      ${message}
      
      This message was sent from the contact form on the VibeCart website.
    `;
      // Send the email to admin
    console.log(`Attempting to send email to admin: ${adminEmail}`);
    const result = await sendGenericEmail(adminEmail, emailSubject, htmlBody, textBody);
    
    if (result.success) {
      console.log(`Successfully sent email to admin: ${adminEmail}`);
      // Send an acknowledgement email to the user
      const userEmailSubject = 'Thank you for contacting VibeCart';
      const userHtmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="margin-top: 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Thank You for Contacting Us</h2>
          
          <p>Dear ${name},</p>
          
          <p>Thank you for reaching out to VibeCart. We have received your message regarding "${subject}" and will get back to you as soon as possible.</p>
          
          <p>For your reference, here's a copy of your message:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <p>If your matter is urgent, please don't hesitate to call our customer service team at +1 (800) 123-4567.</p>
          
          <p>Best regards,<br>The VibeCart Team</p>
          
          <div style="font-size: 0.8em; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; text-align: center;">
            <p>This is an automated response. Please do not reply to this email.</p>
          </div>
        </div>
      `;
      
      const userTextBody = `
        Thank You for Contacting Us
        
        Dear ${name},
        
        Thank you for reaching out to VibeCart. We have received your message regarding "${subject}" and will get back to you as soon as possible.
        
        For your reference, here's a copy of your message:
        
        "${message}"
        
        If your matter is urgent, please don't hesitate to call our customer service team at +1 (800) 123-4567.
        
        Best regards,
        The VibeCart Team
        
        This is an automated response. Please do not reply to this email.
      `;
        console.log(`Attempting to send confirmation email to user: ${email}`);
      const userEmailResult = await sendGenericEmail(email, userEmailSubject, userHtmlBody, userTextBody);
      
      if (userEmailResult.success) {
        console.log(`Successfully sent confirmation email to user: ${email}`);
      } else {
        console.warn(`Failed to send confirmation email to user: ${email}, but continuing with success response`);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Your message has been sent successfully. We'll get back to you soon!" 
      }, { status: 200 });
    } else {
      throw new Error(result.message || 'Failed to send email');
    }
    
  } catch (error: any) {
    console.error("Error in contact form submission:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to send your message. Please try again later." 
    }, { status: 500 });
  }
}
