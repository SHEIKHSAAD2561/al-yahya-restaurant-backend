export function invitationEmailEn(name: string, inviteUrl: string) {
  return {
    subject: "You've been invited to Al-Yahya Restaurant",
    html: `
      <p>Hi ${name},</p>
      <p>You've been invited to join the Al-Yahya Restaurant team portal. Click the link below to set your password and activate your account:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p>This link will expire soon. If you weren't expecting this invitation, you can ignore this email.</p>
    `,
  };
}
