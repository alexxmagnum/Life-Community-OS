# Life Community OS
# Current Information Architecture

> Document status: **descriptive inventory of the running product as implemented in the repository.**  
> Scope: Life Community OS web app + Life Panoramica tenant pack (current sole tenant).  
> Generated from source inspection. Does **not** describe target architecture, redesigns, or decisions.

Sources of truth inspected:

- `apps/web/src/app/**/page.tsx` (routes)
- `apps/web/src/screens/**` (screens)
- `apps/web/src/components/MemberShell.tsx` (bottom nav + create sheet wiring)
- `tenants/life-panoramica/src/navigation-projector.ts` (hamburger)
- `tenants/life-panoramica/src/community-hub.ts` (community area model + deep links)
- `tenants/life-panoramica/src/explorer-nav.ts` (activities)
- `tenants/life-panoramica/src/service-near-hubs.ts` (services + near categories)
- `tenants/life-panoramica/src/official-entities.ts` (official entities)
- `packages/ui/src/conversation/ConversationExperience.tsx` (shared chat shell)

---

## Estado actual

- Routing: Next.js App Router under `apps/web/src/app`.
- Member product routes live in the `(member)` route group and share `MemberShell` (header + bottom nav + sheets).
- One development-only route exists outside member chrome: `/dev/assets`.
- Product copy and navigation labels are Spanish.
- Tenant navigation is projected from Life Panoramica configuration (`projectMemberNavigation`).
- Community Hub canonical areas are defined in `community-hub.ts`; the Community screen renders them as a **vertical scroll of sections**, not as a persistent tab bar.
- Almost all product content and conversations are demo/session data from the tenant pack (not part of this IA document’s focus, but relevant to “what the UI currently does”).

---

## Navegación actual

### Bottom Navigation

Defined in `MemberShell.buildNav` and rendered by `BottomNavigation`.

| Order | Label | Icon (implementation) | Target | Destination screen |
|------:|-------|------------------------|--------|--------------------|
| 1 | Inicio | SVG house | `/` | `HomeScreen` |
| 2 | Comunidad | SVG people | `/community` | `CommunityHubScreen` (`CommunityScreen.tsx`) |
| 3 | Crear | literal `"+"` | `#create` (opens sheet; not a route) | `CreateSheet` |
| 4 | Servicios | SVG wrench/key | `/services` | `ServicesHubScreen` |
| 5 | Perfil | SVG person | `/me` | `ProfileScreen` |

Notes as implemented:

- **Crear** is an action control: it opens `CreateSheet`; it does not navigate to a page.
- **Servicios** is omitted from the bar when module `services` is disabled.
- **Crear** is omitted when there are zero eligible create actions.
- Active tab mapping (`activeFromPath`):
  - `/services*`, `/marketplace*`, `/resources*` → Servicios
  - `/calendar`, `/reservations` → Perfil
  - `/community*` → Comunidad
  - `/me` → Perfil
  - everything else (including `/`, `/experiences*`, `/discover`, `/near*`, `/official*`, `/activities*`, `/notifications`, `/report`) → Inicio

#### Bottom nav — item detail

### Inicio

- **Ruta:** `/`
- **Pantalla:** `HomeScreen`
- **Responsabilidad actual:** Premium home stage — hero, “Hoy en {territorio}” moments, “La comunidad se mueve”, “¿Qué te apetece hacer?” intents, optional “Cerca de ti”.

### Comunidad

- **Ruta:** `/community`
- **Pantalla:** `CommunityHubScreen`
- **Responsabilidad actual:** Community plaza scroll — alerts, neighbour feed, groups, proposals, official info, explore tiles.

### +

- **Acción:** Opens `CreateSheet` (and can open `CreatePostSheet` for community posts).
- **Opciones actuales** (gated by modules/capabilities; only actions with a real flow are included):

  | Section title | Action title | Destination |
  |---------------|--------------|-------------|
  | Crear vida de comunidad | Crear experiencia | `/experiences/create` |
  | Compartir valor | Compartir en la comunidad | opens `CreatePostSheet` |
  | Compartir valor | Publicar en Trabajo | `/services/work/create` |
  | Compartir valor | Pedir u ofrecer ayuda | `/marketplace/create?kind=request` |
  | Acciones prácticas | Compra y venta | `/marketplace/create` |
  | Acciones prácticas | Reservar un espacio | `/resources` |
  | Acciones prácticas | Avisar de un problema | `/report` |

### Servicios

- **Ruta:** `/services`
- **Pantalla:** `ServicesHubScreen`
- **Responsabilidad actual:** Hub “necesito resolver algo” with doors into service categories, marketplace, and spaces/reservations.

### Perfil

- **Ruta:** `/me`
- **Pantalla:** `ProfileScreen`
- **Responsabilidad actual:** Identity / residency presentation and shortcuts to calendar, groups, community, reservations, saved experiences, reports, notifications, discover. Dev-only persona/role switchers when `NODE_ENV === "development"`.

#### Bottom nav — observations (current state only)

- Names for the five controls match their primary destinations for Inicio, Comunidad, Servicios, Perfil.
- **Crear** is an action, not a section page.
- Several high-traffic routes (experiences, discover, near, official, activities) are **not** bottom-nav items; when opened, the bar still highlights **Inicio**.
- Marketplace and resources highlight **Servicios** even though they also appear under other entry points.

---

### Header chrome (MemberShell)

| Control | Visible label / role | Behaviour |
|---------|----------------------|-----------|
| Brand wordmark | Tenant wordmark | Navigate `/` |
| Hamburger | “Explorar comunidad” (aria) | Opens `AppMenuSheet` |
| Notifications | “Notificaciones” | Navigate `/notifications` |
| Profile avatar | “Mi perfil” | Navigate `/me` |
| Optional nav notice | Live community alert | Navigate alert `href` (often community) |

---

### Hamburger menu (real tree)

Projected by `projectMemberNavigation` → bound in `MemberShell`. Sign-out leaf is filtered out in the shell.

```
Menú (AppMenuSheet)
│
├── Comunidad
│   ├── Actualidad              → /community?tab=actualidad
│   ├── Grupos                  → /community?tab=grupos
│   ├── Conversaciones          → /community?tab=conversaciones
│   ├── Canales                 → /community?tab=canales
│   ├── Propuestas              → /community?tab=propuestas
│   ├── Participación           → /community?tab=participacion
│   ├── Espacios comunitarios   → /community?tab=espacios
│   └── Mascotas                → /community?tab=mascotas
│
├── Actividades
│   ├── Golf                    → /activities/golf
│   ├── Pádel                   → /activities/padel
│   ├── Tenis                   → /activities/tennis
│   ├── Naturaleza              → /activities/naturaleza
│   ├── Bienestar               → /activities/bienestar
│   ├── Clases y talleres       → /activities/clases
│   └── Ocio social             → /activities/ocio
│
├── Experiencias
│   ├── Próximas                → /experiences
│   └── Crear experiencia       → /experiences/create
│
├── Reservas
│   ├── Instalaciones           → /resources
│   └── Espacios comunes        → /resources
│
├── Servicios
│   ├── Profesionales           → /services/professionals
│   ├── Trabajo                 → /services/work
│   ├── Ayuda entre vecinos     → /services/neighbour-help
│   ├── Movilidad               → /services/mobility
│   ├── Recomendaciones         → /services/recommendations
│   └── Compra y venta          → /marketplace
│
├── Cerca de ti
│   ├── Restaurantes            → /near/restaurants
│   ├── Comercios               → /near/businesses
│   ├── Servicios               → /near/services
│   └── Lugares                 → /near/places
│
├── Oficial
│   ├── Administración          → /official/panoramica-administration
│   ├── Ayuntamiento            → /official/municipality
│   ├── Seguridad               → /official/seguridad
│   └── Servicios públicos      → /official/servicios-publicos
│
└── Mi perfil
    ├── Mi identidad            → /me
    ├── Mi hogar                → /me
    ├── Mis intereses           → /me
    ├── Mi actividad            → /calendar (or /me)
    ├── Mis reservas            → /reservations
    ├── Mis guardados           → /experiences (or /me)
    └── Configuración           → /me
```

#### Hamburger vs bottom nav (facts)

- **Overlaps bottom nav destinations:** Comunidad (`/community…`), Servicios (`/services…` + marketplace), Perfil (`/me` and related).
- **Adds destinations not in bottom nav:** Actividades, Experiencias, Reservas, Cerca de ti, Oficial, plus Community area deep links.
- **Account block** mixes profile shortcuts; several leaves resolve to the same `/me` screen.
- **Reservas** has two leaves with different labels that both navigate to `/resources`.

---

### Community Hub deep links

Canonical area ids (`COMMUNITY_HUB_AREA_IDS`):

`actualidad` · `grupos` · `conversaciones` · `canales` · `propuestas` · `participacion` · `espacios` · `mascotas`

Deep link form: `/community?tab={areaId}`

Legacy aliases still resolved (examples): `feed`→`actualidad`, `groups`→`grupos`, `talk`→`conversaciones`, `decide`→`propuestas`, `pets`→`mascotas`, etc.

On the Community screen, `?tab=` scrolls to a section layer (not a separate route). Mapping as coded:

| tab | Scroll target section id |
|-----|--------------------------|
| actualidad | `plaza-important` |
| conversaciones | `plaza-activity` |
| grupos | `plaza-people` |
| propuestas / participacion | `plaza-participate` |
| canales | `plaza-official` |
| espacios / mascotas | `plaza-explore` |

Community screen section titles as rendered:

1. Ahora mismo  
2. En la plaza  
3. Grupos  
4. Decidir juntos  
5. Información oficial  
6. Explorar (tiles: Experiencias, Espacios, Servicios, Mascotas, Vivienda)

Explore tile **Vivienda** navigates to `/housing` — **no matching `page.tsx` exists** in the app.

---

## Mapa de módulos

Inventory of what exists today, grouped by how the product currently exposes it. Not a target taxonomy.

### Comunidad

| Existing piece | How it appears today | Primary routes / surfaces |
|----------------|----------------------|---------------------------|
| Community Hub | Bottom nav + hamburger Comunidad | `/community` |
| Hub areas (8) | Hamburger leaves + `?tab=` | `/community?tab=…` |
| Feed / publications | “En la plaza”, actualidad content | `/community`, `/community/content/[id]` |
| Alerts | “Ahora mismo” + bottom nav notice | `/community` |
| Groups | Hub section + group detail | `/community/groups/[id]`, `…/conversation` |
| Discussions (content type) | Filtered as “Conversaciones” area data | `/community/content/[id]` |
| Channels | Official section / canales area | Linked toward `/official/{slug}` when matched |
| Proposals | “Decidir juntos” | `/community/content/[id]` |
| Participation framing | Same proposal-derived list as participación area | `/community?tab=participacion` |
| Neighbour conversation | Direct neighbour chat route | `/community/neighbours/[personId]/conversation` |
| Create community post | Create sheet / community CTA | `CreatePostSheet` (no dedicated route) |
| Pets surface | Explore tile + panel (places/work/groups filtered) | stays on `/community` or `/near/place/…` / work |

### Experiencias

| Existing piece | How it appears today | Primary routes |
|----------------|----------------------|----------------|
| Experience list | Hamburger Experiencias · Home intent “Planes” · Community Explorar · Discover section | `/experiences` |
| Experience detail / join / create | Product flows | `/experiences/[id]`, `/join`, `/create` |
| Experience conversation | Context chat | `/experiences/[id]/conversation` |
| Activity hubs | Hamburger Actividades | `/activities/[slug]` (golf, padel, tennis, naturaleza, bienestar, clases, ocio) |
| Calendar | Profile / hamburger “Mi actividad” | `/calendar` |
| Saved experiences | Profile shortcut | `/experiences?saved=1` |

Note: Activity hubs are documented in code as “permanent activities / not events”; they filter existing catalogs. Experiences are a separate module with list/create/join.

### Servicios

| Existing piece | How it appears today | Primary routes |
|----------------|----------------------|----------------|
| Services hub | Bottom nav Servicios | `/services` |
| Category hubs | Hamburger Servicios + hub doors | `/services/{professionals\|work\|neighbour-help\|mobility\|recommendations}` |
| Work board | Category + create + detail + chat | `/services/work/*` |
| Marketplace | Hamburger “Compra y venta” + hub card + create sheet | `/marketplace*` |
| Resources discovery | Hamburger Reservas + Services “Espacios” + Create “Reservar” + Community Explorar “Espacios” | `/resources*` |
| My reservations | Profile + hamburger | `/reservations` |
| Incident report | Create sheet | `/report` |

### Discover / Explorar / Cerca

| Existing piece | How it appears today | Primary routes |
|----------------|----------------------|----------------|
| Discover screen | Title “Descubrir”; Home intent; Profile “Lugares cerca” | `/discover` |
| Near categories | Hamburger “Cerca de ti” | `/near/{restaurants\|businesses\|services\|places}` |
| Place detail + chat | From near / discover / home nearby | `/near/place/[id]`, `…/conversation` |
| Home “Cerca de ti” rail | On `/` when local life enabled | navigates into place routes / Discover |
| Community Explorar tiles | Inside `/community` | jumps to experiences / resources / services / pets / housing |

Discover screen sections as coded: Cerca de ti · Recomendado por vecinos · Experiencias y actividades · Ayuda de confianza.

### Perfil

| Existing piece | How it appears today | Primary routes |
|----------------|----------------------|----------------|
| Profile screen | Bottom nav Perfil · header avatar · hamburger Mi perfil leaves | `/me` |
| Identity / hogar / interests / settings | Multiple hamburger leaves | all currently `/me` |
| Activity shortcut | “Experiencias” / “Mi actividad” | `/calendar` |
| Groups shortcut | Profile | `/community?tab=grupos` |
| Reservations shortcut | Profile / hamburger | `/reservations` |
| Saved | Profile / hamburger | `/experiences` |
| Reports / notifications | Profile | `/report?view=mine`, `/notifications` |
| Dev persona / role | Profile (development only) | stays on `/me` |

### Oficial / administración (as exposed)

| Existing piece | How it appears today | Primary routes |
|----------------|----------------------|----------------|
| Official entities | Hamburger Oficial · Community “Información oficial” | `/official/[slug]` |
| Official conversation | From entity | `/official/[slug]/conversation` |

### Comunicación (cross-cutting)

One shared UI shell: `ConversationExperience`, used by screens:

| Context | Route |
|---------|-------|
| Group | `/community/groups/[id]/conversation` |
| Neighbour | `/community/neighbours/[personId]/conversation` |
| Marketplace | `/marketplace/[id]/conversation` |
| Place | `/near/place/[id]/conversation` |
| Work | `/services/work/[id]/conversation` |
| Experience | `/experiences/[id]/conversation` |
| Official | `/official/[slug]/conversation` |

### Development tooling

| Route | Screen | Notes |
|-------|--------|-------|
| `/dev/assets` | `AssetLibraryBrowser` | Outside `MemberShell`; `notFound()` when `NODE_ENV === "production"` |

---

## Rutas existentes

| Ruta | Nombre visible (UI principal) | Pantalla | Función actual |
|------|-------------------------------|----------|----------------|
| `/` | Inicio | `HomeScreen` | Home premium / territory today |
| `/community` | Comunidad | `CommunityHubScreen` | Community plaza hub |
| `/community?tab=*` | (deep link into Comunidad areas) | same | Scroll to hub layer |
| `/community/content/[id]` | (content title) | `CommunityContentDetailScreen` | Content detail |
| `/community/groups/[id]` | (group name) | `GroupDetailScreen` | Group detail |
| `/community/groups/[id]/conversation` | (group chat) | `GroupConversationScreen` | Group conversation |
| `/community/neighbours/[personId]/conversation` | (neighbour chat) | `NeighbourConversationScreen` | Neighbour conversation |
| `/discover` | Descubrir | `DiscoverScreen` | Local explore aggregate |
| `/services` | Servicios | `ServicesHubScreen` | Services hub |
| `/services/[category]` | category label | `ServicesCategoryScreen` | Service category |
| `/services/work/create` | Publicar en Trabajo | `WorkPostComposerScreen` | Create work post |
| `/services/work/[id]` | (work post) | `WorkPostDetailScreen` | Work post detail |
| `/services/work/[id]/conversation` | (work chat) | `WorkConversationScreen` | Work conversation |
| `/marketplace` | Mercado / Compra y venta | `MarketplaceScreen` | Marketplace list |
| `/marketplace/create` | (composer) | `MarketplaceComposerScreen` | Create listing / help request |
| `/marketplace/[id]` | (listing) | `MarketplaceDetailScreen` | Listing detail |
| `/marketplace/[id]/conversation` | (listing chat) | `MarketplaceConversationScreen` | Listing conversation |
| `/resources` | Espacios compartidos / Reservas entry | `ResourceDiscoveryScreen` | Resource discovery |
| `/resources/[id]` | (resource) | `ResourceDetailScreen` | Resource detail |
| `/resources/[id]/availability` | (availability) | `ResourceAvailabilityScreen` | Availability |
| `/resources/[id]/reserve` | Reserva | `ReservationConfirmationScreen` | Confirm reservation |
| `/reservations` | Mis reservas | `MyReservationsScreen` | User reservations |
| `/experiences` | Experiencias / Próximas | `ExperienceListScreen` | Experience list |
| `/experiences/create` | Crear experiencia | `CreateExperienceScreen` | Create experience |
| `/experiences/[id]` | (experience) | `ExperienceDetailScreen` | Experience detail |
| `/experiences/[id]/join` | (join) | `ExperienceRegistrationScreen` | Join experience |
| `/experiences/[id]/conversation` | (experience chat) | `ExperienceConversationScreen` | Experience conversation |
| `/activities/[slug]` | activity hub label | `ActivityDetailScreen` | Activity hub |
| `/near/[category]` | near category label | `NearbyCategoryScreen` | Nearby category list |
| `/near/place/[id]` | (place) | `LocalPlaceDetailScreen` | Place detail |
| `/near/place/[id]/conversation` | (place chat) | `PlaceConversationScreen` | Place conversation |
| `/official/[slug]` | official entity label | `OfficialEntityDetailScreen` | Official entity |
| `/official/[slug]/conversation` | (official chat) | `OfficialConversationScreen` | Official conversation |
| `/me` | Mi perfil / Perfil | `ProfileScreen` | Profile |
| `/calendar` | (calendar) | `CalendarScreen` | Calendar / activity |
| `/notifications` | Notificaciones | `NotificationsScreen` | Notifications |
| `/report` | Avisar de un problema | `ReportScreen` | Incident report |
| `/dev/assets` | Life 3D Asset Library (dev) | `AssetLibraryBrowser` | Dev asset browser |

**Linked but missing route file:** `/housing` (from Community Explorar tile “Vivienda”).

Total member + dev `page.tsx` routes found: **37**.

---

## Duplicidades encontradas

Facts about overlapping entry points or labels (no ranking of “correct” owner):

1. **Community social signal** appears on Home (“La comunidad se mueve”) and on Community (“En la plaza”).
2. **Local / nearby** appears on Home “Cerca de ti”, `/discover`, hamburger “Cerca de ti” (`/near/*`), and Discover’s own “Cerca de ti” section.
3. **Experiences** reachable from Home intent “Planes”, hamburger Experiencias, Community Explorar “Experiencias”, Discover “Experiencias y actividades”, Profile saved/calendar paths.
4. **Services** reachable from bottom nav, hamburger Servicios, Community Explorar “Servicios”.
5. **Resources / reservations** reachable from hamburger Reservas (two leaves → same `/resources`), Services hub, Create “Reservar un espacio”, Community Explorar “Espacios”, Profile “Mis reservas” (`/reservations`).
6. **Official** reachable from hamburger Oficial and Community “Información oficial”.
7. **Profile** reachable from bottom nav, header avatar, and hamburger “Mi perfil” (multiple leaves → `/me`).
8. **Label “Servicios”** used both for bottom-nav/services hub and for near category `/near/services`.
9. **Marketplace naming:** screen/module language includes “Mercado”; services/create language uses “Compra y venta”.
10. **Actividades vs Experiencias:** both exist as separate nav categories and surfaces.
11. **Propuestas vs Participación:** two Community area ids; participation list is derived from proposal content.
12. **Conversaciones (Community area)** vs **ConversationExperience (chat product):** different concepts sharing conversational language — area filters discussion content; chat is contextual messaging across modules.
13. **Reservas vs Recursos:** user-facing “Reservas” / “Espacios” navigate primarily to `/resources` discovery; “Mis reservas” uses `/reservations`.

---

## Incoherencias encontradas

Observed mismatches between labels, destinations, and structure:

1. Community canonical model has **8 areas**; Community UI has **6 scroll sections**; several areas share one section.
2. Hamburger Community leaves imply distinct destinations; most resolve to the **same page** with scroll.
3. Bottom nav active state marks **Inicio** for experiences, discover, near, official, activities, notifications, and report.
4. Hamburger “Instalaciones” and “Espacios comunes” are different labels for the **same route**.
5. Several “Mi perfil” leaves (“Mi identidad”, “Mi hogar”, “Mis intereses”, “Configuración”) share **`/me`** without separate screens.
6. Community Explorar “Vivienda” points to **`/housing`**, which has no page.
7. Create sheet action “Pedir u ofrecer ayuda” routes to **marketplace create**, while “Ayuda entre vecinos” also exists as a **services category**.
8. Discover is a first-class screen titled “Descubrir” but is **absent** from bottom navigation.
9. Deprecated / alternate naming still present in code (e.g. Community screen export alias, legacy `?tab=` aliases, deprecated nav ids `discover` / `marketplace` in UI types for mapping).

---

## Puntos fuertes

As implemented today:

1. Stable **five-slot bottom nav** pattern (Inicio · Comunidad · Crear · Servicios · Perfil).
2. **Crear** is explicitly an action sheet, not a fake destination route.
3. **Single conversation UI composition** (`ConversationExperience`) reused across seven context screens.
4. Tenant **navigation projector** centralizes hamburger structure from modules/features/capabilities.
5. Community Hub has a **documented canonical area list** and deep-link resolver with legacy aliases.
6. Services vs Near hubs are **separately configured** in `service-near-hubs.ts` with distinct problem statements in code comments.
7. Dev tooling (`/dev/assets`) is isolated from member chrome and gated in production builds.

---

## Problemas a resolver posteriormente

This section only records current issues discovered by the audit. It does **not** prescribe solutions.

1. Multiple overlapping entry points to the same jobs (local life, experiences, services, spaces).
2. Community area model vs Community UI section model are not 1:1.
3. Bottom-nav active highlighting does not reflect many open secondary routes.
4. Hamburger both duplicates primary tabs and acts as full product directory.
5. Ambiguous or colliding labels (Servicios×2, Reservas/Recursos/Espacios, Actividades/Experiencias, Conversaciones/chat).
6. Dead navigation target: `/housing`.
7. Profile hamburger leaves without dedicated screens.
8. Duplicate Reservas leaves to `/resources`.
9. Discover / Experiences / Near / Official lack primary-nav ownership clarity in the current shell.
10. Community Hub “Explorar” embeds cross-module doors inside the community surface.

---

## Appendix — Create sheet vs hamburger ownership (current)

| Capability | Bottom + | Hamburger | Other |
|------------|----------|-----------|-------|
| Create experience | yes | Experiencias → Crear | — |
| Community post | yes | — | Community CTA |
| Work post | yes | Servicios → Trabajo | — |
| Marketplace / help request | yes | Servicios → Compra y venta | — |
| Reserve space | yes | Reservas | Community Explorar Espacios |
| Report problem | yes | — | Profile “Mis avisos” |
| Official entities | — | Oficial | Community oficial section |
| Activity hubs | — | Actividades | — |
| Discover aggregate | — | — | Home intent / Profile |

---

*End of current-state IA inventory. No redesign content included.*
