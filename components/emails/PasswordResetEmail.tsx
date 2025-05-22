
import React from 'react';

interface PasswordResetEmailProps {
  resetLink: string;
}

const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ resetLink }) => {
  return (
    <div>
      <h1>Reset Your VibeCart Password</h1>
      <p>You requested a password reset for your VibeCart account. Click the link below to set a new password:</p>
      <a href={resetLink} target="_blank" rel="noopener noreferrer">
        Reset Password
      </a>
      <p>If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>
      <p>This link will expire in 1 hour.</p>
      <hr />
      <p>Thanks,</p>
      <p>The VibeCart Team</p>
    </div>
  );
};

export default PasswordResetEmail;
