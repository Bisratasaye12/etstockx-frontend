import { auth } from "@/auth";

/**
 * Like `auth()`, but never throws — bad/expired cookies or secret rotation
 * otherwise turn every server render into a 500.
 */
export async function safeAuth() {
  try {
    return await auth();
  } catch (err) {
    console.error("[auth] Session decode failed; treating as signed-out.", err);
    return null;
  }
}
