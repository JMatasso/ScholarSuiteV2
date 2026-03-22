import twilio from "twilio"

const getClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  return twilio(sid, token)
}

/**
 * Send an SMS via Twilio. Silently no-ops if Twilio credentials are not configured.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const client = getClient()
  if (!client) {
    console.log(`[SMS] Twilio not configured — skipping SMS to ${to}`)
    return false
  }

  const from = process.env.TWILIO_PHONE_NUMBER
  if (!from) {
    console.log("[SMS] TWILIO_PHONE_NUMBER not set — skipping")
    return false
  }

  try {
    await client.messages.create({ to, from, body })
    return true
  } catch (err) {
    console.error("[SMS] Failed to send:", err)
    return false
  }
}
