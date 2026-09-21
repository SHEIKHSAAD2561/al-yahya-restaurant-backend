export function invitationEmailAr(name: string, inviteUrl: string) {
  return {
    subject: 'لقد تمت دعوتك إلى مطعم اليحيى',
    html: `
      <div dir="rtl">
        <p>مرحبًا ${name}،</p>
        <p>لقد تمت دعوتك للانضمام إلى بوابة فريق مطعم اليحيى. يرجى الضغط على الرابط أدناه لتعيين كلمة المرور وتفعيل حسابك:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>سينتهي هذا الرابط قريبًا. إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة.</p>
      </div>
    `,
  };
}
