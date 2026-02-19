/*
 * ============================================================
 *  VibeCode Waitlist API — /api/waitlist.js
 *  Powered by: Notion (store emails) + Resend (send welcome email)
 * ============================================================
 *
 *  SETUP GUIDE — follow these steps before deploying:
 *
 *  ── STEP 1: Create a Notion database ──────────────────────
 *  1. Go to notion.so and create a new page
 *  2. Add a Database (full page) — call it "VibeCode Waitlist"
 *  3. Add these columns:
 *       - "Email"      → type: Email
 *       - "Signed Up"  → type: Created time
 *       - "Status"     → type: Select (add option: "Waitlist")
 *  4. Copy the database ID from the URL:
 *     notion.so/YOUR-WORKSPACE/[THIS-LONG-ID]?v=...
 *     It's the 32-char string before the "?"
 *
 *  ── STEP 2: Create a Notion integration ───────────────────
 *  1. Go to https://www.notion.so/my-integrations
 *  2. Click "+ New integration"
 *  3. Name it "VibeCode Waitlist", select your workspace
 *  4. Copy the "Internal Integration Token" — this is your NOTION_TOKEN
 *  5. Back in your database page, click "..." → "Add connections"
 *     → find and connect your integration
 *
 *  ── STEP 3: Set up Resend ─────────────────────────────────
 *  1. Go to https://resend.com and create a free account
 *  2. Go to API Keys → Create API Key → copy it (RESEND_API_KEY)
 *  3. On the free plan you can send from: onboarding@resend.dev
 *     (or add your own domain later for a branded "from" address)
 *
 *  ── STEP 4: Add environment variables in Vercel ───────────
 *  1. In your Vercel project → Settings → Environment Variables
 *  2. Add these three:
 *       NOTION_TOKEN        → your Notion integration token
 *       NOTION_DATABASE_ID  → your 32-char database ID
 *       RESEND_API_KEY      → your Resend API key
 *  3. Redeploy after adding them (or they won't take effect)
 *
 * ============================================================
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  // Basic email validation
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Please provide a valid email address.' })
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    // ── 1. Save to Notion ──────────────────────────────────
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          Email: {
            email: normalizedEmail
          },
          Status: {
            select: { name: 'Waitlist' }
          }
        }
      })
    })

    if (!notionRes.ok) {
      const err = await notionRes.json()
      // Handle duplicate email (Notion doesn't enforce uniqueness, but good to log)
      console.error('Notion error:', err)
      // Continue anyway — don't block the welcome email
    }

    // ── 2. Send welcome email via Resend ───────────────────
    //    NOTE: Change "from" to your own domain once you add it in Resend.
    //    e.g. "Ayo from VibeCode <ayo@vibecode.dev>"
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ayo from VibeCode <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: "You're on the VibeCode waitlist 🚀",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>You're in!</title>
</head>
<body style="margin:0;padding:0;background:#080810;font-family:'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#11111e;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:100%">

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 28px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <span style="font-size:1.4rem;font-weight:800;color:#f0f0f8;letter-spacing:-0.03em">
                vibe<span style="color:#c6f135">code</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px">
              <p style="font-size:2rem;margin:0 0 8px;font-weight:800;color:#f0f0f8;letter-spacing:-0.03em;line-height:1.1">
                You're on the list. 🎉
              </p>
              <p style="font-size:0.95rem;color:#c6f135;font-family:monospace;margin:0 0 24px;letter-spacing:0.05em;text-transform:uppercase">
                Beta Waitlist Confirmed
              </p>

              <p style="font-size:0.95rem;color:#9999b0;line-height:1.75;margin:0 0 16px;font-family:monospace">
                Hey, it's Ayo — I built VibeCode because I know what it feels like to want to learn to code and have no idea where to start. The tools are confusing. The assumed knowledge is real. The overwhelm is real.
              </p>
              <p style="font-size:0.95rem;color:#9999b0;line-height:1.75;margin:0 0 28px;font-family:monospace">
                VibeCode is the platform I wish existed when I started. No setup. No jargon. An AI that actually explains things. And a community where no question is too basic.
              </p>

              <!-- What's next box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(198,241,53,0.05);border:1px solid rgba(198,241,53,0.15);border-radius:12px;margin-bottom:28px">
                <tr>
                  <td style="padding:20px 24px">
                    <p style="font-size:0.72rem;color:#c6f135;font-family:monospace;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 12px">What happens next</p>
                    <p style="font-size:0.85rem;color:#9999b0;font-family:monospace;line-height:1.7;margin:0">
                      → You'll get early access before anyone else<br>
                      → First 500 signups get <strong style="color:#f0f0f8">Pro — free for life</strong><br>
                      → I'll personally email you when we're ready to let you in
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:0.85rem;color:#9999b0;line-height:1.7;font-family:monospace;margin:0 0 28px">
                In the meantime — if you know someone who's been putting off learning to code, forward this to them. The more people we can help, the better. 🙏
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#c6f135;border-radius:100px;padding:12px 28px">
                    <a href="https://vibecode.vercel.app" style="color:#080810;font-size:0.9rem;font-weight:800;text-decoration:none;display:block">
                      View the site →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06)">
              <p style="font-size:0.72rem;color:#6b6b85;font-family:monospace;margin:0;line-height:1.6">
                You're receiving this because you signed up at vibecode.vercel.app.<br>
                Built by Ayo, with love. — <a href="#" style="color:#c6f135;text-decoration:none">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
      })
    })

    if (!emailRes.ok) {
      const err = await emailRes.json()
      console.error('Resend error:', err)
      // Email failed but Notion saved — still return success to user
    }

    return res.status(200).json({
      success: true,
      message: "You're on the list! Check your inbox for a welcome email."
    })

  } catch (error) {
    console.error('Waitlist error:', error)
    return res.status(500).json({
      error: 'Something went wrong. Please try again in a moment.'
    })
  }
}
