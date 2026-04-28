export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-sm leading-6">
      <h1 className="text-2xl font-semibold mb-6">
        Privacy Policy
      </h1>

      <p className="mb-6 text-zinc-400">
        This service is a free, non-commercial community project.
      </p>

      <h2 className="font-semibold mt-6 mb-2">1. Data Controller</h2>
      <p>
        Name: AICommunityLab (community project)<br />
        Contact: aicommunitylab@gmail.com
      </p>

      <p className="mt-2 text-zinc-400">
        This project is not a business entity and does not carry out commercial
        activity.
      </p>

      <h2 className="font-semibold mt-6 mb-2">2. Categories of Data Processed</h2>
      <ul className="list-disc ml-6">
        <li>Google account identifier (OAuth)</li>
        <li>Email address (from Google)</li>
        <li>Username (if provided)</li>
        <li>Technical data (IP, browser, session)</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">3. Purpose of Data Processing</h2>
      <ul className="list-disc ml-6">
        <li>Creating user accounts</li>
        <li>Providing sign-in</li>
        <li>Operating community features</li>
        <li>Security and abuse prevention</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">4. Legal Basis</h2>
      <ul className="list-disc ml-6">
        <li>GDPR Article 6(1)(b) - provision of the service</li>
        <li>GDPR Article 6(1)(f) - legitimate interest (security)</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">5. Data Processors</h2>
      <ul className="list-disc ml-6">
        <li>Supabase (EU - database and auth)</li>
        <li>Vercel (EU - hosting)</li>
        <li>Google (OAuth sign-in)</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">6. Data Retention Period</h2>
      <p>
        We store data until the account is deleted. After deletion, data is
        permanently removed.
      </p>

      <h2 className="font-semibold mt-6 mb-2">7. Data Subject Rights</h2>
      <ul className="list-disc ml-6">
        <li>Access</li>
        <li>Rectification</li>
        <li>Erasure</li>
        <li>Restriction</li>
        <li>Objection</li>
      </ul>

      <p className="mt-2">
        Contact for exercising rights: aicommunitylab@gmail.com
      </p>

      <h2 className="font-semibold mt-6 mb-2">8. Legal Remedies</h2>
      <p>
        Complaints can be submitted to the Hungarian National Authority for Data
        Protection and Freedom of Information (NAIH).
      </p>

      <h2 className="font-semibold mt-6 mb-2">9. Cookies</h2>
      <p>
        The service only uses cookies required for operation (for example,
        session and security tokens).
      </p>

      <h2 className="font-semibold mt-6 mb-2">10. Data Security</h2>
      <p>
        The application protects data through technical and organizational
        measures (HTTPS, access controls, logging).
      </p>

      <h2 className="font-semibold mt-6 mb-2">11. Changes</h2>
      <p>
        This policy may be updated. Changes are published on this page.
      </p>
    </main>
  );
}