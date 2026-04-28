import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Adatkezelési Tájékoztató · AICommunityLab",
  description:
    "Az AICommunityLab adatkezelési tájékoztatója — GDPR és a 2011. évi CXII. törvény alapján.",
  robots: { index: true, follow: false },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-medium text-zinc-300">{title}</h3>
      <div className="mt-1 space-y-2">{children}</div>
    </div>
  );
}

function Table({ rows }: { rows: [string, string, string, string][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/60 text-left text-zinc-400">
            <th className="px-3 py-2 font-medium">Adatkategória</th>
            <th className="px-3 py-2 font-medium">Cél</th>
            <th className="px-3 py-2 font-medium">Jogalap</th>
            <th className="px-3 py-2 font-medium">Megőrzés</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([cat, purpose, basis, retention], i) => (
            <tr
              key={i}
              className={`border-b border-zinc-800/60 ${i % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#141414]"}`}
            >
              <td className="px-3 py-2 text-zinc-300">{cat}</td>
              <td className="px-3 py-2">{purpose}</td>
              <td className="px-3 py-2">{basis}</td>
              <td className="px-3 py-2">{retention}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          Adatkezelési Tájékoztató
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Hatályos: <time dateTime="2026-04-28">2026. április 28.</time> &middot; Verzió: 1.0
        </p>
        <p className="mt-4 rounded-xl border border-[#00ff9f]/20 bg-[#00ff9f]/5 px-4 py-3 text-sm text-[#9fffd8]">
          Ez a tájékoztató a természetes személyek személyes adatainak kezeléséről szóló{" "}
          <strong>2016/679/EU rendelet (GDPR)</strong> és a{" "}
          <strong>2011. évi CXII. törvény (Infotv.)</strong> előírásainak megfelelően készült.
        </p>
      </div>

      {/* 1. Adatkezelő */}
      <Section title="1. Az adatkezelő adatai">
        <p>
          Az AICommunityLab platform (a továbbiakban: <strong>Szolgáltatás</strong>) adatkezelője:
        </p>
        <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] px-4 py-3 font-mono text-xs text-zinc-300">
          <p><strong>Név:</strong> [CÉGNÉV / EGYÉNI VÁLLALKOZÓ NEVE]</p>
          <p className="mt-1"><strong>Székhely:</strong> [IRÁNYÍTÓSZÁM] [VÁROS], [CÍM], Magyarország</p>
          <p className="mt-1"><strong>Cégjegyzékszám / Nyilvántartási szám:</strong> [SZÁM]</p>
          <p className="mt-1"><strong>Adószám:</strong> [ADÓSZÁM]</p>
          <p className="mt-1"><strong>E-mail:</strong> aicommunitylab@gmail.com</p>
          <p className="mt-1"><strong>Weboldal:</strong> https://aicommunitylab.com</p>
        </div>
        <p className="text-xs text-zinc-500">
          Az adatkezelő adatvédelmi kapcsolattartójának elérhetősége:{" "}
          <a href="mailto:aicommunitylab@gmail.com" className="text-[#00ff9f] hover:underline">
            aicommunitylab@gmail.com
          </a>
        </p>
      </Section>

      {/* 2. Kezelt adatok */}
      <Section title="2. A kezelt személyes adatok köre, célja és jogalapja">
        <p>
          Az alábbi táblázat összefoglalja, milyen adatokat kezelünk, milyen célból, és mi az adatkezelés
          GDPR szerinti jogalapja.
        </p>

        <Table
          rows={[
            [
              "Google-fiók adatok (e-mail, név, profilkép URL)",
              "Azonosítás, bejelentkezés (Google OAuth)",
              "Szerződés teljesítése – GDPR 6. cikk (1) b)",
              "Fiók törléséig",
            ],
            [
              "Felhasználónév (választott)",
              "Nyilvános profil megjelenítése",
              "Szerződés teljesítése – GDPR 6. cikk (1) b)",
              "Fiók törléséig",
            ],
            [
              "Beküldött bejegyzések (cím, URL, leírás, kategória)",
              "Tartalom megjelenítése a feedben",
              "Szerződés teljesítése – GDPR 6. cikk (1) b)",
              "Törlési kérelemig vagy fiók törléséig",
            ],
            [
              "Hozzászólások",
              "Közösségi értékelés, vita",
              "Szerződés teljesítése – GDPR 6. cikk (1) b)",
              "Törlési kérelemig vagy fiók törléséig",
            ],
            [
              "Értékelések (1–5 csillag)",
              "Eszközök rangsorolása",
              "Szerződés teljesítése – GDPR 6. cikk (1) b)",
              "Fiók törléséig",
            ],
            [
              "IP-cím, felhasználói ügynök (szerver napló)",
              "Biztonság, visszaélés-megelőzés",
              "Jogos érdek – GDPR 6. cikk (1) f)",
              "90 nap",
            ],
            [
              "Munkamenet-sütik (auth token)",
              "Bejelentkezési állapot megőrzése",
              "Szerződés teljesítése – GDPR 6. cikk (1) b)",
              "Munkamenet végéig / 7 nap",
            ],
            [
              "CSRF-token süti",
              "Biztonsági védelem (cross-site request forgery ellen)",
              "Jogos érdek – GDPR 6. cikk (1) f)",
              "Munkamenet végéig",
            ],
          ]}
        />

        <p className="mt-4">
          <strong className="text-zinc-300">Fontos:</strong> Különleges személyes adatokat (pl. egészségügyi
          adat, politikai vélemény, vallási meggyőződés) nem kezelünk és nem kérünk.
        </p>
      </Section>

      {/* 3. Google OAuth */}
      <Section title="3. Google-fiókkal való bejelentkezés">
        <p>
          A Szolgáltatás kizárólag <strong>Google OAuth 2.0</strong> protokollon keresztül teszi lehetővé a
          bejelentkezést. A Google-tól átvett adatok:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>E-mail-cím (azonosításhoz)</li>
          <li>Megjelenített név</li>
          <li>Profilkép URL-je</li>
        </ul>
        <p>
          Ezeket az adatokat a Supabase adatbázisunkban tároljuk. <strong>
          A Google-tól kapott adatokat harmadik félnek nem adjuk át és hirdetési célra nem használjuk.
          </strong> Az adatkezelés megfelel a{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00ff9f] hover:underline"
          >
            Google API Services User Data Policy
          </a>
          -nak.
        </p>
        <p>
          A Google adatvédelmi irányelvei elérhetők:{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00ff9f] hover:underline"
          >
            policies.google.com/privacy
          </a>
        </p>
      </Section>

      {/* 4. Adatfeldolgozók */}
      <Section title="4. Adatfeldolgozók és harmadik felek">
        <p>
          Az alábbi adatfeldolgozókat vesszük igénybe. Ezek a felek csak az utasításaink szerint
          kezelik az adatokat, és megfelelő adatvédelmi garanciákat nyújtanak.
        </p>

        <Sub title="4.1 Supabase Inc.">
          <p>
            <strong>Szerepe:</strong> Adatbázis és hitelesítési infrastruktúra (adatfeldolgozó).
          </p>
          <p>
            <strong>Adattárolás helye:</strong> EU régió (Frankfurt, Németország – AWS eu-central-1).
            Az adattovábbítás az EU/EGT területén belül történik, GDPR 44–49. cikk alkalmazása nem
            szükséges.
          </p>
          <p>
            <strong>Adatvédelmi tájékoztató:</strong>{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#00ff9f] hover:underline">
              supabase.com/privacy
            </a>
          </p>
        </Sub>

        <Sub title="4.2 Vercel Inc.">
          <p>
            <strong>Szerepe:</strong> Alkalmazás-tárhely és CDN (adatfeldolgozó).
          </p>
          <p>
            <strong>Adattárolás helye:</strong> Vercel EU régió (Frankfurt). Adattovábbítás az USA-ba{" "}
            <strong>nem</strong> történik kiszolgálói adatok tekintetében; edge-hálózati forgalom az EU-n
            belül kerül feldolgozásra.
          </p>
          <p>
            <strong>Adatvédelmi tájékoztató:</strong>{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#00ff9f] hover:underline">
              vercel.com/legal/privacy-policy
            </a>
          </p>
        </Sub>

        <Sub title="4.3 Google LLC">
          <p>
            <strong>Szerepe:</strong> OAuth-hitelesítési szolgáltató (önálló adatkezelő a saját
            platformján).
          </p>
          <p>
            A Google a bejelentkezési folyamat során önálló adatkezelőként jár el. Az általunk tárolt
            Google-adatok körét a 3. pont tartalmazza. Az USA-ba történő adattovábbításra a Google
            Standard Szerződéses Záradékai (SCC) érvényesek.
          </p>
        </Sub>

        <p className="mt-4 text-xs text-zinc-500">
          Más harmadik félnek (pl. reklámhálózatnak, közösségi médiának) személyes adatot nem
          továbbítunk és nem adunk el.
        </p>
      </Section>

      {/* 5. Érintetti jogok */}
      <Section title="5. Az érintett jogai">
        <p>
          A GDPR III. fejezete alapján Önt az alábbi jogok illetik meg. Jogait a{" "}
          <a href="mailto:aicommunitylab@gmail.com" className="text-[#00ff9f] hover:underline">
            aicommunitylab@gmail.com
          </a>{" "}
          címre küldött e-mailben gyakorolhatja. A kérelmeket <strong>30 napon belül</strong> teljesítjük
          (indokolt esetben további 60 nappal meghosszabbítható).
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Hozzáférési jog (15. cikk)", "Tájékoztatást kérhet arról, hogy milyen adatait kezeljük."],
            ["Helyesbítési jog (16. cikk)", "Kérheti a pontatlan adatok javítását."],
            ["Törlési jog (17. cikk – „elfeledtetés")", "Kérheti adatai törlését, ha az adatkezelés jogalapja megszűnt."],
            ["Adatkezelés korlátozása (18. cikk)", "Kérheti az adatkezelés felfüggesztését, pl. jogvita esetén."],
            ["Adathordozhatóság (20. cikk)", "Adatait géppel olvasható formátumban megkaphatja."],
            ["Tiltakozás joga (21. cikk)", "Tiltakozhat a jogos érdeken alapuló adatkezeléssel szemben."],
          ].map(([right, desc]) => (
            <div key={right} className="rounded-lg border border-zinc-800 bg-[#1a1a1a] p-3">
              <p className="font-medium text-zinc-300 text-xs">{right}</p>
              <p className="mt-1 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-4">
          <strong className="text-zinc-300">Fiók törlése:</strong> A Beállítások oldalon önállóan
          törölheti fiókját, amely után személyes adatait 30 napon belül véglegesen töröljük. A
          nyilvánosan közzétett tartalmak (bejegyzések, hozzászólások) anonimizálva megmaradhatnak,
          kivéve ha azok törlését is kéri.
        </p>
      </Section>

      {/* 6. Jogorvoslat */}
      <Section title="6. Jogorvoslat — NAIH és bíróság">
        <p>
          Ha úgy ítéli meg, hogy adatkezelésünk sérti a GDPR-t vagy az Infotv.-t, panaszt tehet a
          felügyeleti hatóságnál:
        </p>
        <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] px-4 py-3 text-xs text-zinc-300">
          <p className="font-semibold text-zinc-100">Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</p>
          <p className="mt-1">Cím: 1055 Budapest, Falk Miksa utca 9–11.</p>
          <p>Postacím: 1363 Budapest, Pf.: 9.</p>
          <p>E-mail: <a href="mailto:ugyfelszolgalat@naih.hu" className="text-[#00ff9f] hover:underline">ugyfelszolgalat@naih.hu</a></p>
          <p>Weboldal: <a href="https://naih.hu" target="_blank" rel="noopener noreferrer" className="text-[#00ff9f] hover:underline">naih.hu</a></p>
          <p>Telefon: +36 (1) 391-1400</p>
        </div>
        <p>
          Az érintett bíróság előtt is érvényesítheti jogait. Az illetékes törvényszék az érintett
          lakóhelye vagy tartózkodási helye szerint is meghatározható (Infotv. 23. §).
        </p>
      </Section>

      {/* 7. Sütik */}
      <Section title="7. Sütik (cookie-k)">
        <p>A Szolgáltatás kizárólag <strong>funkcionálisan szükséges sütiket</strong> alkalmaz:</p>
        <Table
          rows={[
            ["acl_csrf_token", "CSRF-támadás elleni védelem", "Jogos érdek", "Munkamenet végéig"],
            [
              "sb-[project]-auth-token",
              "Bejelentkezési munkamenet (Supabase auth)",
              "Szerződés teljesítése",
              "7 nap",
            ],
          ]}
        />
        <p>
          Harmadik féltől származó nyomkövető, analitikai vagy marketing sütiket <strong>nem</strong>{" "}
          alkalmazunk. Mivel kizárólag technikailag szükséges sütik kerülnek alkalmazásra, külön cookie-
          hozzájárulási ablak megjelenítése az e-Privacy irányelv és az NMHH értelmezése alapján nem
          kötelező — azonban Ön böngészője beállításaival bármikor törölheti ezeket a sütiket.
        </p>
      </Section>

      {/* 8. Adatbiztonság */}
      <Section title="8. Adatbiztonsági intézkedések">
        <p>Az adatok védelme érdekében az alábbi technikai és szervezési intézkedéseket alkalmazzuk:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Minden kommunikáció TLS 1.2+ titkosítással történik (HTTPS)</li>
          <li>Nonce-alapú Content Security Policy (CSP) az XSS-támadások ellen</li>
          <li>CSRF-tokenek minden módosító műveletnél</li>
          <li>Row-Level Security (RLS) az adatbázisban — minden felhasználó csak saját adatát érheti el</li>
          <li>HSTS fejléc (max-age=63072000, includeSubDomains, preload)</li>
          <li>Jelszót nem tárolunk (jelszó nélküli OAuth-bejelentkezés)</li>
          <li>Adminisztrátori hozzáférés minimalizálása és auditálása</li>
        </ul>
        <p>
          Adatvédelmi incidens esetén a GDPR 33. cikke szerint 72 órán belül értesítjük a NAIH-ot, és
          szükség esetén az érintetteket is (34. cikk).
        </p>
      </Section>

      {/* 9. Kiskorúak */}
      <Section title="9. Kiskorúak adatai">
        <p>
          A Szolgáltatás <strong>16 éven aluli személyek</strong> számára nem elérhető. Ha tudomásunkra
          jut, hogy 16 évesnél fiatalabb személy adatait kezeljük, azokat haladéktalanul töröljük. Ha
          ilyen esetet észlel, kérjük, jelezze a{" "}
          <a href="mailto:aicommunitylab@gmail.com" className="text-[#00ff9f] hover:underline">
            aicommunitylab@gmail.com
          </a>{" "}
          címen.
        </p>
      </Section>

      {/* 10. Módosítás */}
      <Section title="10. A tájékoztató módosítása">
        <p>
          Fenntartjuk a jogot a jelen tájékoztató módosítására. Lényeges változás esetén a
          felhasználókat e-mailben és/vagy a platformon tájékoztatjuk a hatályba lépést megelőző{" "}
          <strong>legalább 30 nappal</strong>. A módosítás után a Szolgáltatás további használata a
          frissített tájékoztató elfogadását jelenti.
        </p>
        <p>
          A korábbi verziók a{" "}
          <a href="mailto:aicommunitylab@gmail.com" className="text-[#00ff9f] hover:underline">
            aicommunitylab@gmail.com
          </a>{" "}
          címen kérhetők.
        </p>
      </Section>

      {/* Footer nav */}
      <div className="mt-12 flex flex-wrap gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
        <Link href="/terms" className="hover:text-[#00ff9f] hover:underline">
          Általános Szerződési Feltételek →
        </Link>
        <Link href="/" className="hover:text-[#00ff9f] hover:underline">
          ← Vissza a főoldalra
        </Link>
      </div>
    </article>
  );
}
