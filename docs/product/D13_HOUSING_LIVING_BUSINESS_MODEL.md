# Housing / Living Business Model

> Document status: **product domain analysis only**.  
> Does **not** choose IA ownership (Operate / Life / own domain).  
> Does **not** authorize routes, data models, or implementation.  
> Sources: `D13_HOUSING_LIVING.md`, `IA_DECISION.md`, `IA_IMPLEMENTATION_PLAN.md`.

---

## Objetivo

Entender el dominio **Housing / Living** como posible capacidad SaaS de Life Community OS:

- qué problemas resuelve  
- para quién  
- qué tipo de actividad es  
- qué capacidades implicaría  
- cómo se relaciona (y se separa) de Comunidad, Servicios, Life/Discover y Marketplace vecinal  
- cómo debería activarse por tenant  

Ownership arquitectónico (A/B/C de D13) queda **fuera de alcance** de este documento.

---

## Usuarios

### Propietario

**Quién:** Particular o familia con un activo en el territorio (vivienda, local, terreno, segunda residencia).

**Necesidades:**

- publicar propiedad (alquiler o venta) con datos claros  
- gestionar interés (quién pregunta, estado del anuncio)  
- recibir contactos sin perder el contexto del territorio  

**Valor para el producto:** Oferta real ligada a la comunidad/territorio, no a un portal genérico anónimo.

---

### Comprador

**Quién:** Persona que quiere adquirir vivienda, local o terreno (dentro o hacia el territorio).

**Necesidades:**

- buscar y filtrar  
- comparar opciones  
- contactar propietario o agente  
- entender el territorio (no solo el inmueble)  

**Valor:** Decisión de compra anclada a “cómo se vive aquí”.

---

### Inquilino

**Quién:** Busca alquiler temporal o estable; puede ser nuevo residente o vecino que cambia de casa.

**Necesidades:**

- encontrar vivienda adecuada  
- comunicarse con quien alquila  
- gestionar estancia (preguntas, visitas, continuidad) — sin confundir esto aún con “reservas de espacios comunitarios”  

**Valor:** Entrada al territorio vía vivienda, con menor fricción que portales externos.

---

### Agente inmobiliario

**Quién:** Profesional o agencia con cartera en o cerca del territorio.

**Necesidades:**

- publicar cartera  
- gestionar leads  
- diferenciarse de anuncios particulares  
- operar bajo reglas del tenant (visibilidad, verificación)  

**Valor:** Canal B2B/B2C local; posible monetización premium.

---

### Promotor / empresa

**Quién:** Promotora, gestora de resorts, empresa con stock o fases de proyecto.

**Necesidades:**

- mostrar proyectos y promociones  
- captar interés por tipologías / fases  
- alinear comunicación con la marca del territorio  

**Valor:** Escala y contenido “proyecto”, distinto del listing 1–1 particular.

---

### Administración del territorio

**Quién:** Administración / entidad oficial del tenant (no el vecino).

**Necesidades:**

- información residencial agregada o institucional (cuando proceda)  
- apoyo al crecimiento ordenado del territorio  
- no mezclar aviso oficial con anuncio comercial privado  

**Valor:** Capa institucional; debe vivir cerca de Oficial/Belong en producto, no dentro del listing comercial — salvo contenidos informativos explícitos.

---

## Problema que resuelve

### Problema central

Hoy un territorio digital (como Life Panoramica) puede concentrar **vida comunitaria, servicios y planes**, pero la decisión de **dónde vivir / alquilar / comprar** suele salir a portales externos. Eso rompe el vínculo:

territorio → vivienda → vecinos → servicios → pertenencia.

### Problemas concretos

| Problema | Quién lo sufre |
|----------|----------------|
| Oferta residencial invisible dentro de la app de la comunidad | Comprador, inquilino, nuevo residente |
| Contactos inmobiliarios fuera de contexto (WhatsApp/portales) | Propietario, agente |
| Marketplace vecinal usado mal para viviendas (o ausencia total de canal) | Todos |
| El territorio no “explica” cómo vivir aquí al buscar casa | Comprador, administración |
| Servicios de instalación (mudanza, reforma) desconectados del momento residencial | Inquilino, comprador |

### Problema que **no** debe resolver Housing

- Feed social, grupos, propuestas (Comunidad / Belong)  
- Alquiler de pista/salón comunitario (`/resources` Operate actual)  
- Compra-venta de objetos entre vecinos (marketplace general)  
- Chat genérico tipo inbox (ConversationExperience sigue siendo capacidad transversal)

---

## Tipo de actividad (Fase 2)

¿Housing es principalmente…?

### A) Marketplace

**Patrón:** publicar → descubrir → contactar  

**Ventajas:** Familiar; reutiliza list/detail/contact; encaja propietarios y agentes.  
**Inconvenientes:** Fácil de confundir con marketplace vecinal; riesgo de “otro Idealista” sin valor territorial.

### B) Servicio del territorio

**Patrón:** recursos → profesionales → gestión  

**Ventajas:** Encaja mudanzas, reformas, mantenimiento ligado a vivir aquí; Operate-friendly.  
**Inconvenientes:** Quedarse solo en “servicios” infravalora el listing inmobiliario; diluye el job “encontrar casa”.

### C) Descubrimiento residencial

**Patrón:** conocer zona → encontrar vivienda → instalarse  

**Ventajas:** Diferenciador SaaS: Housing + Life/territorio; atrae nuevos residentes.  
**Inconvenientes:** Flujos de oferta/lead/estado de anuncio siguen siendo marketplace-like; Discover solo no basta para agentes/promotores.

### D) Combinación (lectura de producto)

**Housing / Living, como dominio de negocio, es una combinación:**

| Capa | Naturaleza | Peso típico |
|------|------------|-------------|
| Núcleo de oferta | **Marketplace inmobiliario** (A) | Alto |
| Contexto de territorio | **Descubrimiento residencial** (C) | Alto para atracción / segunda residencia / resorts |
| Adyacencias | **Servicios asociados** (B) | Medio — no el núcleo |

**Ventajas de tratarlo como combinación:**

- Permite activar por tenant solo listing, o listing + discovery, o + servicios  
- Evita forzar un único “tipo” que no cubre actores reales  
- Diferencia claramente del mercadillo vecinal  

**Inconvenientes:**

- Si no se declara el núcleo (A) vs adyacencias (B/C), el diseño mezcla jobs  
- Más superficie de producto que un marketplace simple  

**Conclusión de análisis (no ownership):** el **núcleo transaccional** es marketplace inmobiliario; el **diferenciador Life Community OS** es el descubrimiento residencial anclado al territorio; los **servicios asociados** son adyacentes, no el centro.

---

## Capacidades

Capacidades posibles (producto). No son esquema técnico.

### Listings

Propiedades publicables:

- vivienda (alquiler / venta)  
- terreno  
- local comercial  
- segunda residencia / tipologías de proyecto (promotor)  

Atributos conceptuales: ubicación en territorio, precio, tipo, características, medios, actor publicante (particular / agente / promotor).

### Contacto

Comunicación interesada:

- propietario ↔ interesado  
- agente ↔ lead  
- (futuro) promotor ↔ lead  

**Patrón esperado en plataforma:** conversación **contextual** (mismo espíritu que ConversationExperience en otros dominios), no sección “chat inmobiliario” global.

### Filtros

Búsqueda:

- ubicación / zona del territorio  
- precio  
- tipo (alquiler, venta, terreno, local)  
- características (habitaciones, etc.)  

### Favoritos

Guardar propiedades (análogo a “guardados” de experiencias en Perfil — capacidad personal, no ownership de Housing).

### Estado

Ciclo del anuncio / activo (ejemplos):

- Disponible  
- Reservada  
- Vendida  
- Alquilada  
- (posible) Retirada / Borrador  

### Servicios asociados

Adyacentes al momento residencial:

- reformas  
- mantenimiento  
- mudanzas  
- otros profesionales del hogar  

**Nota de producto:** pueden **enlazarse** a Operate/Servicios existentes sin convertir Housing en el catálogo de profesionales.

---

## Relación con otros dominios

### Comunidad (Belong)

**Qué NO debería pertenecer aquí:**

- listados de venta/alquiler como feed de plaza  
- tile Explorar “Vivienda” como portal global dentro de Comunidad (ya descartado como peer en IA)  
- propuestas/grupos/oficial mezclados con leads inmobiliarios  

Comunidad puede **beneficiarse** de nuevos vecinos, pero no **poseer** el dominio comercial residencial.

### Servicios (Operate)

**Qué encaja como relación:**

- puerta hacia profesionales (reforma, mudanza)  
- posible entrada UX a Housing **si** ownership futuro fuera Operate (sin decidir aquí)  
- **no** confundir Housing con reservas de espacios comunitarios  

### Life / Discover

**Qué encaja como relación:**

- “cómo se vive aquí” + atracción residencial  
- descubrimiento de zona + listings cercanos  
- segunda residencia / resort narrative  

Life no debe absorber automáticamente todo el CRM inmobiliario.

### Marketplace

| | Marketplace vecinal (hoy) | Marketplace inmobiliario (Housing) |
|--|---------------------------|-------------------------------------|
| Objeto | Cosas, favores, anuncios ligeros | Inmuebles / derechos de uso o compra |
| Ticket / seriedad | Bajo–medio | Alto |
| Actores | Vecinos | Propietario, inquilino, comprador, agente, promotor |
| Ciclo | Rápido, informal | Largo, estados Disponable→Vendida/Alquilada |
| Confianza | Vecindad | Vecindad + posible verificación profesional |
| Módulo | `marketplace` (actual) | Capacidad **separada** (restricción D13) |

**Regla de producto (análisis):** Housing no es un `kind` más del mercadillo; es otro dominio de listados.

---

## Opciones de posicionamiento

Posicionamiento de **negocio/producto** (distinto de ownership A/B/C de D13, aunque se relacionen):

### P1 — “Idealista del territorio”

Solo listings + contacto.  
**Pros:** Simple. **Contras:** Poco diferenciador SaaS.

### P2 — “Vivir aquí” (discovery-led)

Territorio primero, vivienda después.  
**Pros:** Encaje Life. **Contras:** Débil para agentes/promotores si falta núcleo listing.

### P3 — “Residencial + instalación”

Listings + servicios asociados.  
**Pros:** Monetización Operate adyacente. **Contras:** Puede dispersar el job.

### P4 — Combinación modular (recomendable como marco de análisis)

Activar por tenant:

1. núcleo listings inmobiliarios  
2. capa discovery territorial (opcional)  
3. enlaces a servicios asociados (opcional)  
4. roles agente/promotor (opcional / premium)  

Encaja con SaaS opt-in y con la lectura “combinación A+C (+B adyacente)”.

---

## Modelo SaaS

### ¿Debe ser?

| Opción | Evaluación |
|--------|------------|
| **A) Siempre activo** | **No recomendable.** No todos los territorios necesitan inmobiliaria in-app; añade ruido y responsabilidad. |
| **B) Capacidad opcional por tenant** | **Sí, base correcta.** Module flag / pack enablement. |
| **C) Módulo premium** | **Compatible con B.** Agentes, promotores, leads, destacados = capas premium encima del opt-in. |

**Respuesta de análisis:** **B**, con **C** como capas comerciales opcionales — no A.

### ¿Qué territorios lo necesitarían?

| Tipo de territorio | Necesidad típica | Notas |
|--------------------|------------------|-------|
| Urbanizaciones residenciales | Media–alta | Rotación, alquiler, segunda mano |
| Pueblos / municipios | Media | Atracción de residentes; capa discovery útil |
| Resorts / segunda residencia | Alta | Promoción + alquiler temporal/estacional |
| Comunidades privadas | Media | Control de quién publica; confianza |
| Territorios solo “club / lifestyle” sin stock | Baja | Mantener módulo off |
| Ciudades grandes genéricas | Variable | Riesgo de competir con portales; valor solo si hay ancla territorial fuerte |

---

## Recomendación para revisión

**No es cierre de arquitectura ni de D13 ownership.**

Para revisión de producto:

1. Tratar Housing / Living como **dominio de negocio combinado**: núcleo **marketplace inmobiliario** + diferenciador **descubrimiento residencial** + **servicios asociados** como adyacencia.  
2. Activarlo como **capacidad opcional por tenant (B)**, con posible **premium (C)** para agentes/promotores.  
3. Mantener **separación estricta** del marketplace vecinal.  
4. Mantener **fuera de Comunidad** como portal Explorar.  
5. Reutilizar patrones de list/detail/contacto contextual; no inventar un segundo sistema de chat.  
6. Dejar la elección Operate vs Life vs dominio propio (**D13 A/B/C**) para una decisión posterior, informada por este modelo:  
   - si el tenant vende sobre todo **transacción** → presión hacia Operate o dominio propio  
   - si vende sobre todo **atracción / living** → presión hacia Life + dominio propio  
   - dominio propio sigue siendo la opción más limpia para no mezclar con mercadillo ni con Near genérico  

---

## Decisiones pendientes

| ID | Tema | Estado |
|----|------|--------|
| **D13** | Ownership IA (Operate / Life / dominio propio) | **PENDIENTE DE DECISIÓN** |
| H-BM1 | ¿Núcleo MVP = solo alquiler, solo venta, o ambos? | Pendiente producto |
| H-BM2 | ¿Particulares primero o agentes primero? | Pendiente producto |
| H-BM3 | ¿Alquiler turístico/estacional entra en v1? | Pendiente producto |
| H-BM4 | Límites de “servicios asociados” vs Operate profesionales | Pendiente producto |
| H-BM5 | Qué ve Administración (informativo vs comercial) | Pendiente producto |
| H-BM6 | Monetización: freemium listings vs solo premium agentes | Pendiente producto |
| D7 | Naming marketplace vecinal — no reutilizar para Housing | Abierto (IA) |
| D1 | Reservas de espacios comunitarios ≠ alquiler de vivienda | Mantener separación |

---

## Explicit non-outcomes

- No se elige D13-A / D13-B / D13-C  
- No se crea `/housing` ni modelos técnicos  
- No se implementa ni se autoriza FASE de ingeniería Housing  

---

*End of Housing / Living Business Model analysis.*
