/**
 * Matches `EtStockX.Modules.IAM.Infrastructure.Services.OtpService` (GenerateOtp / ValidateOtp)
 * so the setup wizard accepts the same codes as `POST /api/v1/auth/login`.
 */

export async function computeEtStockxTotp(
  secretBase64: string,
): Promise<string> {
  const binaryString = atob(secretBase64.trim());
  const secretBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    secretBytes[i] = binaryString.charCodeAt(i);
  }

  const timeStep = Math.floor(Date.now() / 1000 / 30);
  const counter = new Uint8Array(8);
  new DataView(counter.buffer).setBigUint64(0, BigInt(timeStep), false);

  const keyMaterial = secretBytes.buffer.slice(
    secretBytes.byteOffset,
    secretBytes.byteOffset + secretBytes.byteLength,
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const hash = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, counter),
  );

  const offset = hash[hash.length - 1] & 0x0f;
  const code =
    (((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)) %
    1_000_000;

  return code.toString().padStart(6, "0");
}

export async function validateEtStockxTotp(
  secretBase64: string,
  inputCode: string,
): Promise<boolean> {
  const expected = await computeEtStockxTotp(secretBase64);
  if (inputCode.length !== 6 || expected.length !== 6) return false;
  let diff = 0;
  for (let i = 0; i < 6; i++) {
    diff |= inputCode.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
