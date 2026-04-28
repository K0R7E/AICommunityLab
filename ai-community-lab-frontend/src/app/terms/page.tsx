import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Általános Szerződési Feltételek · AICommunityLab",
  description:
    "Az AICommunityLab Általános Szerződési Feltételei — a magyar Polgári Törvénykönyv és az EU fogyasztóvédelmi jogszabályok alapján.",
  robots: { index: true, follow: false },
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 first:mt-0 scroll-mt-20">
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

const TOC = [
  ["#scope", "1. Hatály és elfogadás"],
  ["#service", "2. A Szolgáltatás leírása"],
  ["#registration", "3. Regisztráció és fiók"],
  ["#content", "4. Felhasználói tartalom"],
  ["#conduct", "5. Magatartási szabályok"],
  ["#ip", "6. Szellemi tulajdon"],
  ["#liability", "7. Felelősség korlátozása"],
  ["#availability", "8. Rendelkezésre állás"],
  ["#termination", "9. Fióktörlés és megszüntetés"],
  ["#changes", "10. Az ÁSZF módosítása"],
  ["#law", "11. Alkalmazandó jog és vitarendezés"],
  ["#contact", "12. Kapcsolat"],
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
          Általános Szerződési Feltételek
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Hatályos: <time dateTime="2026-04-28">2026. április 28.</time> &middot; Verzió: 1.0
        </p>
        <p className="mt-4 rounded-xl border border-zinc-800 bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-400">
          Jelen Általános Szerződési Feltételek (a továbbiakban: <strong className="text-zinc-200">ÁSZF</strong>) a{" "}
          <strong className="text-zinc-200">[CÉGNÉV]</strong> (székhely: [CÍM], Magyarország; a továbbiakban:{" "}
          <strong className="text-zinc-200">Szolgáltató</strong>) és az AICommunityLab platformot
          (aicommunitylab.com) igénybe vevő természetes vagy jogi személy (a továbbiakban:{" "}
          <strong className="text-zinc-200">Felhasználó</strong>) között létrejövő jogviszony feltételeit
          tartalmazzák, a <strong className="text-zinc-200">2013. évi V. törvény (Ptk.)</strong>,{" "}
          az <strong className="text-zinc-200">EKRTV (2001. évi CVIII. törvény)</strong> és az{" "}
          <strong className="text-zinc-200">EU 2019/770 irányelv</strong> rendelkezései alapján.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="mb-10 rounded-xl border border-zinc-800 bg-[#1a1a1a] px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Tartalom</p>
        <ol className="grid gap-1 sm:grid-cols-2">
          {TOC.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-xs text-zinc-400 hover:text-[#00ff9f] hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 1 */}
      <Section id="scope" title="1. Hatály és elfogadás">
        <p>
          A Szolgáltatás használatának megkezdésével a Felhasználó kijelenti, hogy az ÁSZF-et és az
          Adatkezelési Tájékoztatót elolvasta, megértette és magára nézve kötelezőnek fogadja el.
        </p>
        <p>
          Az ÁSZF elfogadása nélkül a Szolgáltatás nem vehető igénybe. A regisztráció ingyenes;
          a Szolgáltatás jelenlegi formájában díjmentes.
        </p>
        <p>
          <strong className="text-zinc-300">Életkor:</strong> A Szolgáltatás kizárólag{" "}
          <strong>16. életévét betöltött</strong> személyek számára elérhető (GDPR 8. cikk).
          Regisztrációval a Felhasználó igazolja, hogy betöltötte a 16. életévét.
        </p>
      </Section>

      {/* 2 */}
      <Section id="service" title="2. A Szolgáltatás leírása">
        <p>
          Az AICommunityLab egy közösségi platform, amelyen a Felhasználók mesterséges intelligencia
          eszközöket és modelleket oszthatnak meg, értékelhetnek és vitathatnak meg.
        </p>
        <p>A Szolgáltatás főbb funkciói:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>AI-eszközök és -modellek beküldése és böngészése</li>
          <li>Csillag-alapú értékelési rendszer (1–5)</li>
          <li>Moderált hozzászólások</li>
          <li>Aggregált AI-hírfolyam (külső forrásokból)</li>
          <li>Google-fiókkal való bejelentkezés</li>
        </ul>
        <p>
          A Szolgáltatás <strong>„ahogy van"</strong> (as-is) alapon kerül nyújtásra; a Szolgáltató
          nem garantálja a folyamatos, hibamentes működést.
        </p>
      </Section>

      {/* 3 */}
      <Section id="registration" title="3. Regisztráció és fiók">
        <Sub title="3.1 Fiók létrehozása">
          <p>
            A regisztráció kizárólag Google-fiókkal lehetséges. A Felhasználó felelős azért, hogy
            Google-fiókjához való hozzáférést megőrizze és illetékteleneknek ne tegye lehetővé.
          </p>
        </Sub>
        <Sub title="3.2 Felhasználónév">
          <p>
            Regisztrációkor felhasználónevet kell választani. A felhasználónév nem tartalmazhat
            mások nevét, védjegyét vagy félrevezető adatot; és meg kell felelnie a 4. pontban
            foglalt tartalmi szabályoknak.
          </p>
        </Sub>
        <Sub title="3.3 Felelősség">
          <p>
            A Felhasználó felelős a fiókja alatt végzett valamennyi tevékenységért. Biztonsági
            incidens esetén haladéktalanul értesítse a Szolgáltatót a{" "}
            <a href="mailto:security@aicommunitylab.com" className="text-[#00ff9f] hover:underline">
              security@aicommunitylab.com
            </a>{" "}
            címen.
          </p>
        </Sub>
      </Section>

      {/* 4 */}
      <Section id="content" title="4. Felhasználói tartalom">
        <Sub title="4.1 Beküldött tartalom">
          <p>
            A Felhasználó által beküldött bejegyzések, hozzászólások és értékelések (a továbbiakban:
            Tartalom) tekintetében a Felhasználó szavatol azért, hogy:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>jogosult a Tartalom beküldésére és közzétételére;</li>
            <li>a Tartalom nem sérti harmadik személy szerzői jogát, védjegyét vagy más szellemi tulajdonjogát;</li>
            <li>a Tartalom valós, nem megtévesztő információt tartalmaz.</li>
          </ul>
        </Sub>
        <Sub title="4.2 Licenc a Szolgáltatónak">
          <p>
            A Tartalom közzétételével a Felhasználó nem kizárólagos, területileg korlátlan, díjmentes
            licencet ad a Szolgáltatónak a Tartalom tárolására, megjelenítésére, kereshetővé tételére
            és technikai célú másolására a Szolgáltatás keretében. A licenc a Tartalom törlésekor
            megszűnik.
          </p>
        </Sub>
        <Sub title="4.3 Moderálás">
          <p>
            Minden beküldött bejegyzés moderálási folyamaton esik át, mielőtt a nyilvános feedben
            megjelenik. A Szolgáltató indokolás nélkül visszautasíthatja vagy eltávolíthatja azokat a
            tartalmakat, amelyek az ÁSZF-be ütköznek.
          </p>
        </Sub>
      </Section>

      {/* 5 */}
      <Section id="conduct" title="5. Magatartási szabályok — tiltott tevékenységek">
        <p>A Felhasználó a Szolgáltatás használata során nem tehet közzé és nem küldhet:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Jogellenes, sértő, obszcén vagy gyűlöletkeltő tartalmat",
            "Spam, reklám vagy nem kívánt kereskedelmi üzenetet",
            "Más személy személyes adatát hozzájárulása nélkül",
            "Vírust, kártevőt vagy egyéb rosszindulatú kódot",
            "Félrevezető vagy hamis eszköz-adatokat",
            "Szerzői jogi oltalom alatt álló tartalmat engedély nélkül",
            "Automatizált kéréseket (scrapereket) a Szolgáltatás felé",
            "A platform biztonsági rendszerét megkerülő kísérleteket",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-lg border border-zinc-800/60 bg-[#1a1a1a] px-3 py-2">
              <span className="mt-0.5 text-red-400 shrink-0">✕</span>
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-4">
          A fenti szabályok megsértése a fiók azonnali felfüggesztéséhez vagy törléséhez vezethet,
          és — súlyos esetben — polgári jogi vagy büntetőjogi felelősséget vonhat maga után.
        </p>
      </Section>

      {/* 6 */}
      <Section id="ip" title="6. Szellemi tulajdon">
        <p>
          Az AICommunityLab platform forráskódja, dizájnja, logója, neve és egyéb elemei a
          Szolgáltató szellemi tulajdonát képezik, és szerzői jogi védelem alatt állnak (Szjt.,
          1999. évi LXXVI. törvény).
        </p>
        <p>
          A Felhasználó a Szolgáltatást kizárólag személyes, nem kereskedelmi célra használhatja.
          A platform bármely elemének másolása, terjesztése, módosítása vagy visszafejtése tilos a
          Szolgáltató előzetes írásos hozzájárulása nélkül.
        </p>
        <p>
          A Felhasználók által hivatkozott külső AI-eszközök (pl. Cursor, Claude, Gemini) névjegyei
          és védjegyei az adott jogosultaké — azok az AICommunityLab platformmal semmilyen
          kereskedelmi kapcsolatban nem állnak, hacsak ezt kifejezetten nem jelöljük.
        </p>
      </Section>

      {/* 7 */}
      <Section id="liability" title="7. Felelősség korlátozása">
        <Sub title="7.1 A Szolgáltató felelőssége">
          <p>
            A Szolgáltató nem vállal felelősséget:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>a Felhasználók által közzétett tartalmak valóságtartalmáért;</li>
            <li>a platform ideiglenes elérhetetlenségéből eredő károkért;</li>
            <li>a hivatkozott külső weboldalak tartalmáért és adatkezelési gyakorlatáért;</li>
            <li>a Felhasználó gondatlanságából eredő fiókbiztonsági incidensekért;</li>
            <li>
              olyan közvetett, következményes vagy elmaradt haszonból eredő károkért, amelyeket a
              Ptk. 6:142. §-a szerint vis maior vagy a Szolgáltató érdekkörén kívüli esemény okoz.
            </li>
          </ul>
        </Sub>
        <Sub title="7.2 Fogyasztói jogok">
          <p>
            Jelen felelősség-korlátozás nem érinti a fogyasztókat megillető, jogszabályban biztosított
            és le nem mondható jogokat (Fgytv., 1997. évi CLV. törvény; EU 2019/770 irányelv).
            Különösen: a Szolgáltatónak felelősséggel kell tartoznia a szándékosan okozott és a
            testi sértésből eredő károkért.
          </p>
        </Sub>
        <Sub title="7.3 Felelősség mértéke">
          <p>
            Amennyiben a Szolgáltató felelőssége mégis megállapítható, annak maximuma az érintett
            Felhasználó által az adott naptári évben a Szolgáltatásért esetlegesen fizetett összeg,
            de legfeljebb <strong>50 000 HUF</strong>.
          </p>
        </Sub>
      </Section>

      {/* 8 */}
      <Section id="availability" title="8. Rendelkezésre állás és módosítás">
        <p>
          A Szolgáltató törekszik a Szolgáltatás folyamatos elérhetőségének biztosítására, de nem
          garantálja az <strong>évi 99,9%-os</strong> SLA-t. Tervezett karbantartásról lehetőség
          szerint előzetesen értesítjük a Felhasználókat.
        </p>
        <p>
          A Szolgáltató fenntartja a jogot a Szolgáltatás bármely funkciójának módosítására,
          szüneteltetésére vagy megszüntetésére. Lényeges változás esetén a Felhasználókat legalább{" "}
          <strong>15 nappal</strong> előzetesen értesítjük.
        </p>
      </Section>

      {/* 9 */}
      <Section id="termination" title="9. Fióktörlés és megszüntetés">
        <Sub title="9.1 Felhasználó által">
          <p>
            A Felhasználó bármikor, indokolás nélkül törölheti fiókját a Beállítások oldalon.
            A törlés visszavonhatatlan; az adatok kezelése az Adatkezelési Tájékoztatóban leírtak
            szerint szűnik meg.
          </p>
        </Sub>
        <Sub title="9.2 Szolgáltató által">
          <p>
            A Szolgáltató jogosult a fiókot azonnali hatállyal felfüggeszteni vagy törölni, ha a
            Felhasználó az ÁSZF-et súlyosan vagy ismételten megszegi. Kisebb szabálysértés esetén
            előzetesen figyelmeztetést küldünk.
          </p>
        </Sub>
        <Sub title="9.3 A platform megszüntetése">
          <p>
            Ha a Szolgáltató a platformot véglegesen bezárja, a Felhasználókat legalább{" "}
            <strong>30 nappal</strong> előzetesen értesíti, és lehetőséget biztosít a saját tartalom
            exportálására (GDPR adathordozhatósági jog).
          </p>
        </Sub>
      </Section>

      {/* 10 */}
      <Section id="changes" title="10. Az ÁSZF módosítása">
        <p>
          A Szolgáltató jogosult az ÁSZF-et egyoldalúan módosítani. A módosításokról a Felhasználókat
          a hatálybalépés előtt legalább <strong>15 nappal</strong> értesítjük (e-mailben és/vagy a
          platformon megjelenő értesítés útján).
        </p>
        <p>
          Ha a Felhasználó a módosítással nem ért egyet, a hatálybalépés előtt jogosult felmondani
          és törölni fiókját. A hatálybalépést követő további használat a módosított ÁSZF
          elfogadásának minősül.
        </p>
      </Section>

      {/* 11 */}
      <Section id="law" title="11. Alkalmazandó jog és vitarendezés">
        <Sub title="11.1 Irányadó jog">
          <p>
            Jelen ÁSZF-re és a felek jogviszonyára a <strong>magyar jog</strong> az irányadó,
            különösen a Ptk. (2013. évi V. törvény), az EKRTV (2001. évi CVIII. törvény) és
            az Fgytv. (1997. évi CLV. törvény) rendelkezései.
          </p>
        </Sub>
        <Sub title="11.2 Békéltető testület (fogyasztók részére)">
          <p>
            Fogyasztónak minősülő Felhasználó panaszával a területileg illetékes Békéltető
            Testülethez fordulhat. Online vitarendezési platform (ODR):{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff9f] hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>
          </p>
        </Sub>
        <Sub title="11.3 Bíróság">
          <p>
            Peren kívüli megoldás sikertelensége esetén az illetékes magyar bíróság jár el.
            Fogyasztói jogvita esetén a Felhasználó lakóhelye szerinti bíróság illetékes;
            vállalkozások közötti jogvitában a Szolgáltató székhelye szerint illetékes törvényszék.
          </p>
        </Sub>
      </Section>

      {/* 12 */}
      <Section id="contact" title="12. Kapcsolat">
        <div className="rounded-lg border border-zinc-800 bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-300">
          <p><strong>Általános megkeresés:</strong>{" "}
            <a href="mailto:hello@aicommunitylab.com" className="text-[#00ff9f] hover:underline">
              hello@aicommunitylab.com
            </a>
          </p>
          <p className="mt-1"><strong>Adatvédelmi kérdések:</strong>{" "}
            <a href="mailto:privacy@aicommunitylab.com" className="text-[#00ff9f] hover:underline">
              privacy@aicommunitylab.com
            </a>
          </p>
          <p className="mt-1"><strong>Biztonsági incidensek:</strong>{" "}
            <a href="mailto:security@aicommunitylab.com" className="text-[#00ff9f] hover:underline">
              security@aicommunitylab.com
            </a>
          </p>
          <p className="mt-1"><strong>Tartalom-moderálás / visszaélés-bejelentés:</strong>{" "}
            <a href="mailto:moderation@aicommunitylab.com" className="text-[#00ff9f] hover:underline">
              moderation@aicommunitylab.com
            </a>
          </p>
        </div>
        <p className="text-xs text-zinc-500">
          Levelezési cím: [IRÁNYÍTÓSZÁM] [VÁROS], [CÍM], Magyarország
        </p>
      </Section>

      {/* Footer nav */}
      <div className="mt-12 flex flex-wrap gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
        <Link href="/privacy" className="hover:text-[#00ff9f] hover:underline">
          Adatkezelési Tájékoztató →
        </Link>
        <Link href="/" className="hover:text-[#00ff9f] hover:underline">
          ← Vissza a főoldalra
        </Link>
      </div>
    </article>
  );
}
