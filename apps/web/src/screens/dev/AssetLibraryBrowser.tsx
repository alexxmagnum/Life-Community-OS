"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  getAssetConceptId,
  getAssetVariants,
  getRelatedAssets,
  getRegistryStats,
  listAssets,
  type AssetMetadata,
  type AssetScope,
  type AssetType,
} from "@life-community-os/assets";

type SortMode = "default" | "key" | "domain" | "type";
type ScopeFilter = "all" | AssetScope;
type TypeFilter = "all" | AssetType;

const TYPE_ORDER: AssetType[] = [
  "symbol",
  "card",
  "object",
  "scene",
  "hero",
  "branding",
];

const TYPE_LABELS: Record<AssetType, string> = {
  symbol: "Symbols",
  card: "Cards",
  object: "Objects",
  scene: "Scenes",
  hero: "Heroes",
  branding: "Branding",
};

const CHECKER: CSSProperties = {
  backgroundColor: "#1a1d24",
  backgroundImage:
    "linear-gradient(45deg, #252932 25%, transparent 25%), linear-gradient(-45deg, #252932 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #252932 75%), linear-gradient(-45deg, transparent 75%, #252932 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
};

function previewMinHeight(type: AssetType): string {
  switch (type) {
    case "symbol":
      return "88px";
    case "branding":
      return "112px";
    case "scene":
      return "168px";
    default:
      return "132px";
  }
}

function aspectLabel(width: number, height: number): string {
  if (!(width > 0) || !(height > 0)) return "—";
  const g = gcd(width, height);
  return `${width / g}:${height / g} (${width}×${height})`;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function matchesSearch(asset: AssetMetadata, q: string): boolean {
  if (!q) return true;
  const hay = [
    asset.key,
    asset.domain,
    asset.type,
    asset.variant,
    asset.tenant ?? "",
    asset.scope,
    asset.path,
    getAssetConceptId(asset),
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => hay.includes(token));
}

function sortAssets(list: AssetMetadata[], mode: SortMode): AssetMetadata[] {
  const copy = [...list];
  copy.sort((a, b) => {
    if (mode === "key") return a.key.localeCompare(b.key);
    if (mode === "type") {
      const td = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
      if (td !== 0) return td;
      return a.key.localeCompare(b.key);
    }
    if (mode === "domain") {
      const dd = a.domain.localeCompare(b.domain);
      if (dd !== 0) return dd;
      return a.key.localeCompare(b.key);
    }
    // default: domain + assetKey
    const dd = a.domain.localeCompare(b.domain);
    if (dd !== 0) return dd;
    return a.key.localeCompare(b.key);
  });
  return copy;
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#b8bec8]">
      <span className="uppercase text-[#7d8696]">{label}</span>
      <span className="tabular-nums text-[#e8eaed]">{value}</span>
    </span>
  );
}

function ScopeBadge({ asset }: { asset: AssetMetadata }) {
  if (asset.scope === "tenant") {
    return (
      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
        Tenant · {asset.tenant}
      </span>
    );
  }
  return (
    <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
      Global
    </span>
  );
}

function AssetPreview({
  asset,
  className,
  minHeight,
  onBroken,
}: {
  asset: AssetMetadata;
  className?: string;
  minHeight: string;
  onBroken?: () => void;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-md ${className ?? ""}`}
      style={{ ...CHECKER, minHeight }}
    >
      {broken ? (
        <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
          <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">
            Broken asset
          </span>
          <span className="font-mono text-[10px] text-[#9aa3b2] break-all">{asset.key}</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.path}
          alt={`3D asset ${asset.key}`}
          loading="lazy"
          className="max-h-full max-w-full object-contain p-3"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={() => {
            setBroken(true);
            onBroken?.();
          }}
        />
      )}
    </div>
  );
}

function CopyButton({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="rounded-md border border-white/12 bg-white/[0.06] px-3 py-2 text-left text-[12px] font-medium text-[#e8eaed] transition hover:bg-white/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      onClick={async () => {
        const ok = await copyText(value);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        }
      }}
    >
      <span className="block text-[10px] uppercase tracking-wider text-[#8b93a3]">
        {copied ? "Copied" : label}
      </span>
      <span className="mt-0.5 block font-mono text-[11px] text-[#c5cad4] break-all">
        {value}
      </span>
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
        active
          ? "bg-[#e8eaed] text-[#0f1115]"
          : "bg-white/[0.06] text-[#b8bec8] hover:bg-white/[0.1]"
      }`}
    >
      {children}
    </button>
  );
}

export function AssetLibraryBrowser() {
  const allAssets = useMemo(() => listAssets(), []);
  const stats = useMemo(() => getRegistryStats(), []);

  const domains = useMemo(
    () => [...new Set(allAssets.map((a) => a.domain))].sort((a, b) => a.localeCompare(b)),
    [allAssets],
  );
  const tenants = useMemo(
    () =>
      [...new Set(allAssets.map((a) => a.tenant).filter((t): t is string => Boolean(t)))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [allAssets],
  );

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selected = useMemo(
    () => allAssets.find((a) => a.key === selectedKey) ?? null,
    [allAssets, selectedKey],
  );

  const related = useMemo(
    () => (selected ? getRelatedAssets(selected.key) : []),
    [selected],
  );
  const variants = useMemo(
    () => (selected ? getAssetVariants(selected.key) : []),
    [selected],
  );

  const filtered = useMemo(() => {
    const list = allAssets.filter((a) => {
      if (!matchesSearch(a, query)) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (domainFilter !== "all" && a.domain !== domainFilter) return false;
      if (scopeFilter !== "all" && a.scope !== scopeFilter) return false;
      if (tenantFilter !== "all") {
        if (a.tenant !== tenantFilter) return false;
      }
      return true;
    });
    return sortAssets(list, sortMode);
  }, [allAssets, query, typeFilter, domainFilter, scopeFilter, tenantFilter, sortMode]);

  const closeInspector = useCallback(() => setSelectedKey(null), []);

  useEffect(() => {
    if (!selectedKey) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") closeInspector();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey, closeInspector]);

  const typeCounts = stats.byType;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b border-white/10 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7d8696]">
          Development · Internal
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Life 3D Asset Library
            </h1>
            <p className="mt-1 text-[15px] text-[#9aa3b2]">
              {stats.total} production assets · registry{" "}
              <code className="text-[#c5cad4]">@life-community-os/assets</code>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatPill label="Global" value={stats.global} />
            <StatPill label="Tenant" value={stats.tenant} />
            {TYPE_ORDER.map((t) => (
              <StatPill key={t} label={t} value={typeCounts[t] ?? 0} />
            ))}
          </div>
        </div>
      </header>

      <section className="sticky top-0 z-20 -mx-4 mt-5 space-y-3 border-b border-white/10 bg-[#0f1115]/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <label className="block">
          <span className="sr-only">Search assets</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search key, domain, type, variant, tenant…"
            className="w-full rounded-lg border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#6b7382] focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7382]">
            Type
          </span>
          <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
            All {stats.total}
          </FilterChip>
          {TYPE_ORDER.map((t) => (
            <FilterChip
              key={t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            >
              {TYPE_LABELS[t]} {typeCounts[t] ?? 0}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7382]">
            Domain
          </span>
          <FilterChip active={domainFilter === "all"} onClick={() => setDomainFilter("all")}>
            All
          </FilterChip>
          {domains.map((d) => (
            <FilterChip
              key={d}
              active={domainFilter === d}
              onClick={() => setDomainFilter(d)}
            >
              {d}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7382]">
              Scope
            </span>
            <FilterChip active={scopeFilter === "all"} onClick={() => setScopeFilter("all")}>
              All
            </FilterChip>
            <FilterChip
              active={scopeFilter === "global"}
              onClick={() => setScopeFilter("global")}
            >
              Global
            </FilterChip>
            <FilterChip
              active={scopeFilter === "tenant"}
              onClick={() => setScopeFilter("tenant")}
            >
              Tenant
            </FilterChip>
          </div>

          {tenants.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7382]">
                Tenant
              </span>
              <FilterChip
                active={tenantFilter === "all"}
                onClick={() => setTenantFilter("all")}
              >
                All tenants
              </FilterChip>
              {tenants.map((t) => (
                <FilterChip
                  key={t}
                  active={tenantFilter === t}
                  onClick={() => setTenantFilter(t)}
                >
                  {t}
                </FilterChip>
              ))}
            </div>
          ) : null}

          <label className="ml-auto flex items-center gap-2 text-[12px] text-[#9aa3b2]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7382]">
              Sort
            </span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-md border border-white/12 bg-[#161920] px-2 py-1.5 text-[12px] text-[#e8eaed] focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            >
              <option value="default">Domain + key</option>
              <option value="key">Asset key A–Z</option>
              <option value="domain">Domain</option>
              <option value="type">Type</option>
            </select>
          </label>
        </div>

        <p className="text-[12px] text-[#7d8696]">
          Showing <span className="tabular-nums text-[#c5cad4]">{filtered.length}</span> of{" "}
          <span className="tabular-nums text-[#c5cad4]">{stats.total}</span>
        </p>
      </section>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium text-[#e8eaed]">No assets match these filters.</p>
          <p className="mt-1 text-sm text-[#7d8696]">Clear search or widen type / domain / scope.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => (
            <button
              key={asset.key}
              type="button"
              onClick={() => setSelectedKey(asset.key)}
              onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedKey(asset.key);
                }
              }}
              className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#161920] text-left transition hover:border-white/25 hover:bg-[#1a1f2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <AssetPreview asset={asset} minHeight={previewMinHeight(asset.type)} />
              <div className="flex flex-1 flex-col gap-2 border-t border-white/8 p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <ScopeBadge asset={asset} />
                  {asset.variant && asset.variant !== "default" ? (
                    <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-medium text-[#9aa3b2]">
                      {asset.variant}
                    </span>
                  ) : null}
                </div>
                <p className="font-mono text-[12px] leading-snug text-[#e8eaed] break-all">
                  {asset.key}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-[#7d8696]">
                  {asset.type} · {asset.domain}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close inspector"
            onClick={closeInspector}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Asset inspector ${selected.key}`}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#12151c] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7d8696]">
                  Inspector
                </p>
                <h2 className="mt-1 font-mono text-[13px] leading-snug text-white break-all">
                  {selected.key}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeInspector}
                className="rounded-md border border-white/12 px-2.5 py-1.5 text-[12px] text-[#c5cad4] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <AssetPreview asset={selected} minHeight="220px" className="rounded-lg" />

              <div className="flex flex-wrap gap-2">
                <ScopeBadge asset={selected} />
                <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9aa3b2]">
                  {selected.type}
                </span>
                <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9aa3b2]">
                  {selected.domain}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <dt className="text-[#6b7382]">Variant</dt>
                  <dd className="mt-0.5 text-[#e8eaed]">{selected.variant}</dd>
                </div>
                <div>
                  <dt className="text-[#6b7382]">Aspect</dt>
                  <dd className="mt-0.5 text-[#e8eaed]">
                    {aspectLabel(selected.width, selected.height)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#6b7382]">Path</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-[#c5cad4] break-all">
                    {selected.path}
                  </dd>
                </div>
              </dl>

              <div className="grid gap-2">
                <CopyButton label="Copy asset key" value={selected.key} />
                <CopyButton label="Copy path" value={selected.path} />
                <CopyButton
                  label="Copy usage"
                  value={`asset("${selected.key}")`}
                />
                <CopyButton
                  label="Copy import"
                  value={`import { asset } from "@life-community-os/assets";`}
                />
              </div>

              {variants.length > 1 ? (
                <section>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#7d8696]">
                    Variants
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setSelectedKey(v.key)}
                        className={`rounded-md border px-2.5 py-1.5 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                          v.key === selected.key
                            ? "border-sky-400/50 bg-sky-400/10 text-sky-200"
                            : "border-white/12 text-[#c5cad4] hover:bg-white/5"
                        }`}
                      >
                        {v.variant}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#7d8696]">
                  Related representations
                </h3>
                <p className="mt-1 text-[11px] text-[#6b7382]">
                  Concept <code className="text-[#9aa3b2]">{getAssetConceptId(selected)}</code>
                </p>
                <ul className="mt-2 space-y-1.5">
                  {related.map((r) => (
                    <li key={r.key}>
                      <button
                        type="button"
                        onClick={() => setSelectedKey(r.key)}
                        className={`w-full rounded-md border px-2.5 py-2 text-left text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                          r.key === selected.key
                            ? "border-sky-400/40 bg-sky-400/10"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <span className="font-mono text-[11px] text-[#e8eaed] break-all">
                          {r.key}
                        </span>
                        <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-[#7d8696]">
                          {r.type} · {r.variant}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
