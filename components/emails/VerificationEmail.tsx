
import React from 'react';

interface VerificationEmailProps {
  verificationLink: string;
}

const VerificationEmail: React.FC<VerificationEmailProps> = ({ verificationLink }) => {
  return (
    <div>
      <h1>Verify Your Email Address</h1>
      <p>Thank you for signing up for VibeCart! Please click the link below to verify your email address:</p>
      <a href={verificationLink} target="_blank" rel="noopener noreferrer">
        Verify Email
      </a>
      <p>If you did not sign up for this account, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <hr />
      <p>Thanks,</p>
      <p>The VibeCart Team</p>
    </div>
  );
};

export default VerificationEmail;
