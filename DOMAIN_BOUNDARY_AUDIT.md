# DOMAIN BOUNDARY AUDIT — Phase 18L-FIX-B

**Scope:** Help vs Services vs Marketplace routing and experience boundaries  
**Source:** `REAL_USER_JOURNEY_AUDIT.md` (S-01 and domain separation findings)

## Principle

| Intent | Domain | Route surface |
|--------|--------|---------------|
| Person helping person | **Help** | `/community`, `/help/create`, `/help/{id}` |
| Professional / local business | **Services** | `/services`, `/services/professionals`, `/business/register` |
| Job board (work category) | **Services (Work)** | `/services/work`, `/services/work/create`, `/services/work/{id}` |
| Buy / sell / give | **Marketplace** | `/marketplace`, `/marketplace/create`, `/marketplace/{id}` |
| Territory context | **Discover** | `/discover`, `/map`, `/locations/{id}` |

## Action → Domain mapping

| Acción | Dominio anterior (bug) | Dominio correcto |
|--------|------------------------|------------------|
| Pedir ayuda vecinal | `/services/neighbour-help`, `/services/work/{id}` | `/help/create`, `/help/{id}`, Community tab Ayudas |
| Ofrecer ayuda | `/services/neighbour-help` | `/help/create`, `/community` |
| Publicar trabajo | `/services/work/create` | `/services/work/create` ✓ |
| Ver anuncio trabajo | `/services/work/{id}` | `/services/work/{id}` ✓ |
| Electricista / fontanero | `/services/professionals` | `/services/professionals` ✓ |
| Vender bicicleta | `/marketplace/create` | `/marketplace/create` ✓ |
| Magic Plus → Ayuda | `/help/create` | `/help/create` ✓ |
| Magic Plus → Trabajo | `/services/work/create` | `/services/work/create` ✓ |
| Magic Plus → Comprar/vender | `/marketplace/create` | `/marketplace/create` ✓ |
| Discover neighbour help | API included help rows | **Removed** — Discover = territory only |
| Services hub → Ayuda vecinal | `/services/neighbour-help` | **Removed** — redirect to `/community` |

## Surface audit

### Magic Plus (`magic-plus-sections.ts`)

| Section | Routes |
|---------|--------|
| Experiencia | `/experiences/create`, `/community/events/create` |
| Aviso | `/community/announcements/create` |
| Comprar / vender | `/marketplace/create` |
| Trabajo y oficios | `/services/work/create`, `/business/register` |
| Ayuda | `/help/create` |
| Reserva | `/resources` |

### Community (`CommunityScreen`)

| Tab | Content | Domain |
|-----|---------|--------|
| Ayudas | Neighbour help feed | Help |
| Ahora / Próximamente | Experiences, events | Experience / Community |

### Services (`ServicesHubScreen`)

| Category | Domain |
|----------|--------|
| Profesionales | Services |
| Trabajo | Services (Work) |
| Movilidad | Marketplace mobility listings |
| Recomendaciones | Services |
| Compra y venta | Marketplace |
| ~~Ayuda entre vecinos~~ | **Removed** → Community |

### Home (`HomeScreen`)

| Block | Target |
|-------|--------|
| Necesito ayuda | `/community` |
| Necesito un profesional | `/services` |
| Comprar algo | `/marketplace` |

### Discover (`DiscoverScreen` + `discover-experience-service`)

| Shows | Does not show |
|-------|---------------|
| Lugares, comercios, negocios | Ayudas vecinales, solicitudes personales |

## Permissions (unchanged architecture)

| Actor | Help | Services public | Help participate |
|-------|------|---------------|------------------|
| Visitor | No private help API | Yes (businesses, places) | No |
| Registered | Explore only | Yes | No until active |
| Active member | Create / respond | Full | Yes |
| Business owner | — | Manage presence | — |

## Invariants

- Help ≠ Services  
- Person help ≠ Professional service  
- Marketplace ≠ Help  
- Community ≠ Social Network  
- Public ≠ Private  
