import { Router } from 'express';

const router = Router();

// Basic input sanitization
function sanitize(value: string): string {
  return String(value || '').replace(/<[^>]*>/g, '').trim().slice(0, 2000);
}

const RECIPIENTS = [
  'alex@nosweat.fitness',
  'billie@nosweat.fitness',
];

router.post('/send', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanMessage = sanitize(message);

    // Use Resend if API key is available, otherwise log locally
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'No Sweat <noreply@nosweat.fitness>',
        to: RECIPIENTS,
        replyTo: cleanEmail,
        subject: `New enquiry from ${cleanName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #1a1a2e; margin-bottom: 1.5rem;">New website enquiry</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
              <tr>
                <td style="padding: 0.5rem 0; color: #666; width: 80px; vertical-align: top;">Name</td>
                <td style="padding: 0.5rem 0; color: #1a1a2e; font-weight: 500;">${cleanName}</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem 0; color: #666; vertical-align: top;">Email</td>
                <td style="padding: 0.5rem 0; color: #1a1a2e; font-weight: 500;">
                  <a href="mailto:${cleanEmail}" style="color: #2563eb;">${cleanEmail}</a>
                </td>
              </tr>
            </table>
            <div style="background: #f5f5f7; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem;">
              <p style="margin: 0; color: #1a1a2e; line-height: 1.6; white-space: pre-wrap;">${cleanMessage}</p>
            </div>
            <p style="color: #999; font-size: 0.8rem; margin-top: 1.5rem;">Sent from nosweat.fitness contact form</p>
          </div>
        `,
      });
    } else {
      console.log('--- Contact Form Submission (RESEND_API_KEY not set) ---');
      console.log(`From: ${cleanName} <${cleanEmail}>`);
      console.log(`To: ${RECIPIENTS.join(', ')}`);
      console.log(`Message: ${cleanMessage}`);
      console.log('-------------------------------------------------------');
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact send error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
