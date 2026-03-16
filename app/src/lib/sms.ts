/**
 * SMS sending stub. Logs to console for now.
 * Wire up Twilio when ready by replacing the body of this function.
 *
 * Environment variables needed for Twilio:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */
export async function sendSms(to: string, body: string): Promise<void> {
  console.log(`[SMS STUB] To: ${to}, Body: ${body}`)
  // TODO: Uncomment when Twilio is set up
  // const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  // await twilio.messages.create({ to, from: process.env.TWILIO_PHONE_NUMBER, body })
}
