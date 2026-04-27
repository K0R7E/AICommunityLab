import { getSiteMetadataBase } from "@/lib/site-metadata-base";

function securityTxtBody() {
  const base = getSiteMetadataBase();
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const expiresIso = expires.toISOString();

  return [
    "Contact: mailto:security@placeholder.invalid",
    `Canonical: ${base}/.well-known/security.txt`,
    `Policy: ${base}/security`,
    "Preferred-Languages: en",
    `Expires: ${expiresIso}`,
  ].join("\n");
}

export async function GET() {
  return new Response(`${securityTxtBody()}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
