export default function SecurityPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-sm leading-6">
      <h1 className="text-2xl font-semibold mb-6">Security Policy</h1>

      <p className="mb-6 text-zinc-400">
        AICommunityLab is a free, non-commercial community project. We take
        security seriously and welcome responsible disclosure from the security
        community.
      </p>

      <h2 className="font-semibold mt-6 mb-2">Reporting a Vulnerability</h2>
      <p className="mb-4">
        If you discover a security vulnerability, please report it by email to{" "}
        <a
          href="mailto:aicommunitylab@gmail.com"
          className="underline text-accent"
        >
          aicommunitylab@gmail.com
        </a>
        . Do not disclose vulnerabilities publicly before we have had a
        reasonable opportunity to address them.
      </p>
      <p className="mb-4">
        Please include the following in your report:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-zinc-300">
        <li>A description of the vulnerability and its potential impact</li>
        <li>Step-by-step reproduction instructions</li>
        <li>Any relevant URLs, request/response samples, or screenshots</li>
        <li>Your suggested fix or mitigation, if any</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">What We Ask</h2>
      <ul className="list-disc list-inside mb-4 space-y-1 text-zinc-300">
        <li>Do not access, modify, or delete data that does not belong to you</li>
        <li>Do not disrupt the availability of the service</li>
        <li>Do not perform social engineering against users or staff</li>
        <li>Act in good faith and give us reasonable time to respond</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">Response Timeline</h2>
      <p className="mb-4">
        We aim to acknowledge reports within 3 business days and to provide a
        resolution timeline within 10 business days. As a non-commercial
        project we do not offer a bug bounty, but we will credit researchers
        who responsibly disclose issues (unless you prefer to remain anonymous).
      </p>

      <h2 className="font-semibold mt-6 mb-2">Scope</h2>
      <p className="mb-2">In scope:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-zinc-300">
        <li>
          <span className="font-mono">https://aicommunitylab.com</span> and all
          subdomains
        </li>
      </ul>
      <p className="mb-2">Out of scope:</p>
      <ul className="list-disc list-inside mb-4 space-y-1 text-zinc-300">
        <li>Denial-of-service attacks</li>
        <li>Physical security</li>
        <li>Social engineering</li>
        <li>Issues in third-party services (Supabase, Vercel, Google OAuth)</li>
      </ul>

      <p className="mt-8 text-zinc-500 text-xs">
        This policy was last updated on April 29, 2026.
      </p>
    </main>
  );
}
