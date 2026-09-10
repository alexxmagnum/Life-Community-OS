/**
 * Home V2 visual structure isolation — Phase 4.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(HERE, "..", "..");
const REPO_ROOT = path.join(HERE, "..", "..", "..", "..", "..");

function readWeb(rel: string): string {
  return readFileSync(path.join(WEB_ROOT, rel), "utf8");
}

describe("Home V2 structure isolation", () => {
  it("evolves HomeScreen without a second Home surface", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    const page = readWeb("app/(member)/page.tsx");
    assert.match(page, /HomeScreen/);
    assert.doesNotMatch(home, /HomeV2|NewHomeScreen|PanoramicaHome|PremiumHome2/);
    assert.match(home, /Home V2/);
  });

  it("keeps section order Hero → Hoy → Haz que pase → Participa → Descubre", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    const hero = home.indexOf("<HomeHeroStage");
    const hoy = home.indexOf('{/* HOY */}');
    const make = home.indexOf("{/* HAZ QUE PASE */}");
    const partic = home.indexOf("{/* PARTICIPA */}");
    const discover = home.indexOf("{/* DESCUBRE */}");
    assert.ok(hero >= 0 && hoy > hero);
    assert.ok(make > hoy && partic > make && discover > partic);
  });

  it("does not hardcode Panorámica / Alex / Cala Argilaga as content", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.doesNotMatch(home, /"Panorámica"/);
    // Alex only via non-production visual harness (?heroVisual=alex), never as product data.
    assert.match(home, /heroVisualHarness \? "Alex" : heroPersonName/);
    assert.match(home, /NODE_ENV === "production"/);
    assert.doesNotMatch(home, /Cala Argilaga/);
    assert.doesNotMatch(home, /24 apoyos/);
    assert.match(home, /territoryName|placeName|displayName/);
    assert.doesNotMatch(
      home,
      /heroPersonName[\s\S]{0,80}placeName|isVisitor\s*\?\s*placeName/,
    );
  });

  it("wires Haz que pase actions to composer intents by kind", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /plan_create/);
    assert.match(home, /experience_create/);
    assert.match(home, /event_create/);
    assert.match(home, /announcement_create/);
    assert.match(home, /marketplace_listing/);
    assert.match(home, /openActionComposer\(/);
    assert.doesNotMatch(home, /createCommunityEvent/);
  });

  it("does not invent Project or fake Participa filler", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.doesNotMatch(home, /Proyecto|EN MARCHA|HomeParticipateCard[\s\S]*project/i);
    assert.doesNotMatch(home, /listParticipacionContent|listCommunityDiscussionContent/);
    assert.match(home, /postToHubContent/);
    assert.match(home, /fetchCommunityFeed/);
    assert.match(home, /Apoyar/);
    assert.match(home, /Participar/);
    assert.match(home, /type === "proposal"/);
    assert.match(home, /type === "discussion"/);
  });

  it("removes legacy Home blocks from the composition", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.doesNotMatch(home, /Necesito ayuda/);
    assert.doesNotMatch(home, /Necesito un profesional/);
    assert.doesNotMatch(home, /Comprar algo/);
    assert.doesNotMatch(home, /Cómo puedo aportar/);
    assert.doesNotMatch(home, /La comunidad/);
    assert.doesNotMatch(home, /Mis lugares/);
    assert.doesNotMatch(home, /HOME_SERVICES_EMPTY_TITLE/);
    assert.doesNotMatch(home, /CommunityActivationPanel/);
    assert.doesNotMatch(home, /VISITOR_JOIN_HEADLINE|Únete a LIFE/);
    assert.doesNotMatch(home, /Bienvenido a/);
    assert.doesNotMatch(home, /EmptyState|COMMUNITY_EMPTY_GLYPH/);
  });

  it("uses Home V2 chrome and segmented Hoy tabs", () => {
    const shell = readWeb("components/MemberShell.tsx");
    const premium = readFileSync(
      path.join(REPO_ROOT, "packages", "ui", "src", "home", "HomePremium.tsx"),
      "utf8",
    );
    const chrome = readFileSync(
      path.join(
        REPO_ROOT,
        "packages",
        "ui",
        "src",
        "layout",
        "CommunityAppChrome.tsx",
      ),
      "utf8",
    );
    const nav = readFileSync(
      path.join(REPO_ROOT, "packages", "ui", "src", "navigation", "Navigation.tsx"),
      "utf8",
    );
    assert.match(shell, /homeChrome=\{isHome\}/);
    assert.match(chrome, /homeChrome/);
    assert.match(chrome, /onTerritoryClick/);
    // Territory control must not call onMenuOpen (cross-trigger root cause).
    assert.doesNotMatch(
      chrome,
      /onClick=\{\(\) => onMenuOpen\?\.\(\)\}[\s\S]{0,120}uppercase tracking-\[0\.14em\]/,
    );
    assert.doesNotMatch(
      chrome,
      /uppercase tracking-\[0\.14em\][\s\S]{0,200}onMenuOpen/,
    );
    // Home chrome third control is hamburger (menu lines), not avatar.
    assert.match(chrome, /M5 7\.5h14M5 12h14M5 16\.5h14/);
    assert.match(shell, /onProfileClick=\{isHome \? undefined/);
    assert.match(shell, /onTerritoryClick=\{undefined\}/);
    assert.match(shell, /label: "Perfil"/);
    assert.match(premium, /role="tablist"/);
    assert.match(premium, /min-h-\[48px\] flex-1/);
    assert.match(premium, /data-dev-placeholder="hoy-primary"/);
    assert.match(premium, /data-dev-placeholder="hoy-secondary"/);
    assert.match(nav, /rounded-t-\[28px\]/);
    assert.match(nav, /onCreate/);
  });

  it("Hoy always keeps primary + two secondary slots; never Descubre empty substitute", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    const hoyStart = home.indexOf("{/* HOY */}");
    const makeStart = home.indexOf("{/* HAZ QUE PASE */}");
    assert.ok(hoyStart >= 0 && makeStart > hoyStart);
    const hoy = home.slice(hoyStart, makeStart);
    assert.doesNotMatch(hoy, /Descubre tu territorio/);
    assert.doesNotMatch(hoy, /VISITOR_HOME_EMPTY/);
    assert.doesNotMatch(hoy, /LIVING_EMPTY_/);
    assert.doesNotMatch(hoy, /router\.push\("\/discover"\)/);
    assert.match(hoy, /minmax\(0,\s*1\.4fr\) minmax\(0,\s*1fr\)/);
    assert.match(hoy, /h-\[214px\]/);
    assert.match(hoy, /HomeTodayFeaturedCard/);
    assert.match(hoy, /HomeTodaySideCard/);
    assert.match(hoy, /devPlaceholder/);
    assert.match(hoy, /todayVisualHarness/);
    assert.match(hoy, /router\.push\("\/experiences"\)/);
    assert.match(hoy, /hero-afternoon\.png/);
    assert.match(hoy, /bg-dining\.png/);
    assert.match(hoy, /hero-evening\.png/);
    // No period fallthrough that invents out-of-window content.
    assert.doesNotMatch(
      home,
      /Fall back to soonest|livingMoments\.slice\(0,\s*3\)/,
    );
  });

  it("Hoy visual harness is non-production only", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /todayVisual|homeVisual/);
    assert.match(
      home,
      /NODE_ENV === "production"[\s\S]{0,120}todayVisual|todayVisualHarness[\s\S]{0,200}NODE_ENV === "production"/,
    );
    assert.doesNotMatch(home, /Partido abierto|Cena especial|Música en la terraza|Pistas de pádel/);
  });

  it("ETAPA 1 Hero remains frozen (no HomeScreen hero chrome edits)", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    assert.match(home, /HomeHeroStage/);
    assert.match(home, /heroVisualHarness \? "Alex" : heroPersonName/);
    assert.doesNotMatch(home, /onMenuOpen/);
  });

  it("keeps global BottomNav ownership outside HomeScreen", () => {
    const home = readWeb("screens/HomeScreen.tsx");
    const shell = readWeb("components/MemberShell.tsx");
    assert.doesNotMatch(home, /BottomNavigation/);
    assert.match(shell, /BottomNavigation|buildNav/);
    assert.match(shell, /label: "Inicio"/);
    assert.match(shell, /label: "Servicios"/);
  });
});
