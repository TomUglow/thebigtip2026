import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'

export { generateSecret as generateTOTPSecret }

export function verifyTOTP(secret: string, token: string): boolean {
  const result = verifySync({ secret, token })
  return result.valid
}

export function getTOTPUri(secret: string, email: string): string {
  return generateURI({ issuer: 'The Big Tip', label: email, secret })
}

export async function getTOTPQRCode(uri: string): Promise<string> {
  return QRCode.toDataURL(uri)
}
