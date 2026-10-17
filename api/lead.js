// api/lead.js - Lead backup with email via Resend
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

const oneLine = (s) => String(s).replace(/[\r\n]+/g, ' ').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { name, phone, email, instagram } = req.body || {};
    if (!phone && !email) return res.status(200).json({ ok: true });

    const lead = {
      name: oneLine(String(name || '').slice(0, 100)),
      phone: oneLine(String(phone || '').slice(0, 30)),
      email: oneLine(String(email || '').slice(0, 100)),
      instagram: oneLine(String(instagram || '').slice(0, 100)),
      time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
    };

    console.log('NEW LEAD CAPTURED:', JSON.stringify(lead));

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Jagga Leads <onboarding@resend.dev>',
            to: ['jaggadigitalagency@gmail.com'],
            subject: `New Lead: ${lead.name} - ${lead.phone}`,
            html: `
              <h2>New Audit Lead</h2>
              <p><b>Name:</b> ${esc(lead.name)}</p>
              <p><b>Phone:</b> ${esc(lead.phone)}</p>
              <p><b>Email:</b> ${esc(lead.email)}</p>
              <p><b>IG:</b> ${esc(lead.instagram)}</p>
              <p><b>Time:</b> ${esc(lead.time)}</p>
            `,
          }),
        });
        if (!r.ok) console.error('Resend failed:', r.status, await r.text());
      } catch (err) {
        console.error('Resend error:', err);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Lead error:', e);
    return res.status(200).json({ ok: true }); // never block WhatsApp
  }
}