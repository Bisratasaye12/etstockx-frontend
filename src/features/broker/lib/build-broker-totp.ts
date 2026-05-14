import { Secret, TOTP } from "otpauth";

function secretFromBackendBase64(base64Secret: string): Secret {
  const b64 = base64Secret.trim();
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const buf = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  return new Secret({ buffer: buf });
}

/** Backend stores a 20-byte key as standard Base64; TOTP matches `OtpService` (SHA1, 30s, 6 digits). */
export function createBrokerTotp(
  base64Secret: string,
  accountLabel: string,
): TOTP {
  const secret = secretFromBackendBase64(base64Secret);
  return new TOTP({
    issuer: "ETStockX",
    label: accountLabel.trim() || "Broker",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
}
