# Admin Operations Center — Auditoría (Fase 13)

**Fecha:** 21 agosto 2026  
**Alcance:** consola tenant-scoped que consume dominios existentes. No se clonan Business, Housing ni Reservations.

---

## Qué existía

| Pieza | Estado |
|---|---|
| `/admin` | Una sola pantalla: switcher de tenant por cookie, miembros, cola de negocios, listado de lugares |
| `/api/admin/memberships` | GET/PATCH rol. Solo administrator. **Permitía member → admin** |
| `/api/admin/tenants` | Snapshots de packs (no overlay operativo) |
| Permisos | Roles reales en membership; staff en business/community/resources |
| Moderación | POST `/api/community/posts/:id/moderate` ya existía |
| Reserva cancel | PATCH `/api/reservations/:id` con `owner_immutable` |
| Dashboard | No había métricas reales |

### Demo / riesgo

- El switcher de cookie podía apuntar a otro slug; las APIs ya niegan cross-tenant, pero la UX sugería “administrar otro espacio”.
- Sin audit trail.
- Sin Territory Manager ni settings overlay.
- Member veía empty state (correcto) pero no había IA de operaciones.

## Qué falta (antes) y qué evoluciona ahora

- Operations Center con IA (Dashboard → Community → Members → … → Settings).
- Dashboard con métricas reales o vacío (incidencias = 0, sin dominio).
- Role policy: solo administrator eleva; **member → administrator DENIED**.
- Bloquear = `memberships.status = inactive` (ciclo existente).
- Invitar = `membership_invitations` (no crea Person fantasma).
- Audit log, territory SpatialAsset assignment, tenant overlay (locale/contacto/tagline).
- PATCH recurso (activar / mantenimiento) sobre Resource Domain.

## Qué no se toca

MapLibre, TerritoryObject contract, Location SoT, Tenant Factory, esquemas de Business/Housing/Reservations (solo se consumen).
