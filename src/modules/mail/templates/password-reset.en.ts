export function passwordResetEmailEn(name: string, resetUrl: string) {
  return {
    subject: 'Reset your Al-Yahya Restaurant password',
    html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to choose a new one:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire soon. If you didn't request this, you can safely ignore this email — your password will stay the same.</p>
    `,
  };
}
