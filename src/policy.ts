/**
 * Runtime policy for write tools.
 * Copilot cloud agents invoke MCP tools without a confirmation UI —
 * prefer YABGU_READ_ONLY=1 there (and keep apply off the tools allowlist).
 */

/** True when env says this process must not expose / run yabgu_apply. */
export function isReadOnlyFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const v = env.YABGU_READ_ONLY?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
