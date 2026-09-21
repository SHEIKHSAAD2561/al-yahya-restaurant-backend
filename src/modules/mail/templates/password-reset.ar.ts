export function passwordResetEmailAr(name: string, resetUrl: string) {
  return {
    subject: 'إعادة تعيين كلمة مرور مطعم اليحيى',
    html: `
      <div dir="rtl">
        <p>مرحبًا ${name}،</p>
        <p>تلقينا طلبًا لإعادة تعيين كلمة مرورك. يرجى الضغط على الرابط أدناه لاختيار كلمة مرور جديدة:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>سينتهي هذا الرابط قريبًا. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان — ستبقى كلمة مرورك كما هي.</p>
      </div>
    `,
  };
}
