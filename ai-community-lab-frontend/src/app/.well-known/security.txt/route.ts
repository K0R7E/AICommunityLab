import { getSiteMetadataBase } from "@/lib/site-metadata-base";

function asAbsoluteUrlOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed).toString();
  } catch {
    return undefined;
  }
}

function securityTxtBody() {
  const base = getSiteMetadataBase();
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const expiresIso = expires.toISOString();
  const canonical = `${base}/.well-known/security.txt`;
  const contact =
    asAbsoluteUrlOrUndefined(process.env.SECURITY_TXT_CONTACT) ??
    "mailto:security@aicommunitylab.com";
  const policy =
    asAbsoluteUrlOrUndefined(process.env.SECURITY_TXT_POLICY_URL) ??
    `${base}/security-policy`;
  const acknowledgments = asAbsoluteUrlOrUndefined(
    process.env.SECURITY_TXT_ACKNOWLEDGMENTS_URL,
  );
  const hiring = asAbsoluteUrlOrUndefined(process.env.SECURITY_TXT_HIRING_URL);
  const languages = process.env.SECURITY_TXT_LANGUAGES?.trim() || "en";

  const lines = [
    `Contact: ${contact}`,
    `Canonical: ${canonical}`,
    `Policy: ${policy}`,
    `Preferred-Languages: ${languages}`,
    `Expires: ${expiresIso}`,
  ];

  if (acknowledgments) {
    lines.push(`Acknowledgments: ${acknowledgments}`);
  }
  if (hiring) {
    lines.push(`Hiring: ${hiring}`);
  }

  return lines.join("\n");
}

export async function GET() {
  return new Response(`${securityTxtBody()}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
