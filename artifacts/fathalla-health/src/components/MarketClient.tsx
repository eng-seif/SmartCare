'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { evaluate, type Product } from '@/lib/health'
import HealthChat from '@/components/HealthChat'

    export default function MarketClient({ rows, conditions, monitor, lang = "en" }: { lang?: "en" | "ar"; rows: Product[]; conditions: string[]; monitor: { loggedIn: boolean; level: "empty" | "safe" | "caution" | "over"; unsafe: number; items: number; rows: { label: string; value: number; max: number; unit: string }[] } }) {
      const [diabeticOnly, setDiabeticOnly] = useState(false);
      const [activeCategory, setActiveCategory] = useState("All");
      const router = useRouter();
      const [toast, setToast] = useState<string | null>(null);
      async function addToCart(id: string, title: string) {
        const sb = supabaseBrowser();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { router.push("/register"); return; }
        const { data: row } = await sb.from("cart_items").select("qty").eq("product_id", id).maybeSingle();
        const { error } = await sb.from("cart_items").upsert(
          { user_id: user.id, product_id: id, qty: (row?.qty ?? 0) + 1 }, { onConflict: "user_id,product_id" });
        if (error) { console.error(error); setToast(`Could not add to cart: ${error.message}`); setTimeout(() => setToast(null), 6000); return; }
        setToast(`Added "${title}" to your smart cart`);
        setTimeout(() => setToast(null), 3000);
        router.refresh();
      }

      const ar = lang === "ar";
      const L = ar ? {
        within: "ضمن قواعد الفحص", caution: "استخدم بحذر", avoid: "غير مناسب", incomplete: "بيانات ناقصة",
        title: "الاختيارات الأقل تأثيراً", sub: "استخدم قواعد فحص السكري، وليست ضماناً للسلامة",
        sw: "اختيارات أقل تأثيراً", swNote: "يستخدم قواعد فحص السكري، وليس ضماناً للسلامة",
        showing: (a: number, b: number) => `عرض ${a} من ${b} منتج`, empty: "لا توجد منتجات مطابقة", reset: "إعادة ضبط الفلاتر", all: "الكل",
      } : {
        within: "Within screening rules", caution: "Use Caution", avoid: "Not Recommended", incomplete: "Data incomplete",
        title: "Health-Aware Groceries", sub: "Rated against screening rules, not a guarantee of safety",
        sw: "Lower-impact choices", swNote: "Uses diabetes screening rules, not guaranteed safety",
        showing: (a: number, b: number) => `Showing ${a} of ${b} Foods`, empty: "No products match these filters", reset: "Reset filters", all: "All",
      };
      const BADGE = {
        safe: "bg-tertiary-fixed text-on-tertiary-fixed",
        caution: "bg-primary-fixed text-on-primary-fixed-variant",
        avoid: "bg-error-container text-on-error-container",
        incomplete: "bg-surface-container-high text-on-surface-variant"
      };
      const conds = diabeticOnly ? Array.from(new Set([...conditions, "t2d"])) : conditions;
      const products = rows.map(r => {
        const ev = evaluate(r, conds);
        const complete = ev.dataComplete;
        const v = ev.verdict;
        const key = !complete && v === "safe" ? "incomplete" : v;
        return {
          id: r.id, name: r.title, detail: r.category ?? "", price: Number(r.price).toFixed(2),
          tag: key === "safe" ? L.within : key === "caution" ? L.caution : key === "avoid" ? L.avoid : L.incomplete,
          badge: BADGE[key], gi: `GI: ${r.glycemic_index == null ? "—" : r.glycemic_index}`, img: r.image_url || undefined,
          category: r.category ?? "", diabeticSafe: key === "safe", reasons: ev.reasons
        };
      });
      const categories = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).filter(c => !/^(pantry|مؤن)$/i.test(c.trim()))];
      const filteredProducts = products.filter(p =>
        (!diabeticOnly || p.diabeticSafe) && (activeCategory === "All" || p.category === activeCategory));
      return (
        <div className="flex flex-col w-full">
          {toast && <div className="fixed top-24 end-3 sm:end-6 max-w-[calc(100vw-1.5rem)] bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-xl z-50 font-title-md text-sm">{toast}</div>}
          {/* Top Intro & Hero Zone */}
          <section className="w-full bg-surface-container-lowest shadow-sm border-b border-surface-variant/40">
            <div className="max-w-[1440px] mx-auto px-4 md:px-margin-tablet lg:px-margin-desktop py-space-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                {/* Left Content */}
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-tertiary/10 text-tertiary w-fit">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span className="font-label-md text-label-md font-bold tracking-wide uppercase">Built for Diabetic &amp; Chronic-Condition Shoppers</span>
                  </div>
                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight">
                    Simple &amp; Healthy Grocery Shopping at Fathalla
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                    Compare available nutrition labels, see why a product is flagged, and use your health profile for personalized screening. Missing data is clearly marked.
                  </p>
                  <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                    <button 
                      onClick={() => router.push("/scanner")}
                      className="inline-flex items-center gap-space-sm px-space-lg py-space-md bg-primary-container hover:bg-primary-container/90 text-on-secondary rounded-xl font-title-md text-title-md transition-all shadow-md active:scale-95 group" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">barcode_scanner</span>
                      <span>Scan Barcode In-Store</span>
                    </button>
                    <div className="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl bg-surface-container-low border border-surface-variant/60 text-on-surface">
                      <span className="material-symbols-outlined text-tertiary text-2xl">support_agent</span>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Medical Disclaimer</span>
                        <span className="font-title-md text-title-md font-bold text-on-surface">Ask your doctor</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Nutrition chat */}
                <div className="lg:col-span-5 min-w-0">
                  <HealthChat lang={lang} profileAvailable={monitor.loggedIn} />
                </div>
              </div>
            </div>
          </section>

          {/* Filter & Quick Action Toolbar */}
          <section className="w-full bg-surface sticky top-20 z-40 shadow-sm backdrop-blur-md bg-surface/95 border-b border-surface-variant/40">
            <div className="max-w-[1440px] mx-auto px-4 md:px-margin-tablet lg:px-margin-desktop py-space-md">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
                {/* Category Pills */}
                <div className="flex items-center gap-space-xs overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-space-md py-space-sm rounded-full font-title-md text-title-md whitespace-nowrap transition-colors border ${
                        activeCategory === cat 
                          ? 'bg-inverse-surface text-inverse-on-surface border-inverse-surface shadow-sm'
                          : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border-surface-variant/60'
                      }`}
                      type="button"
                    >
                      {cat === "All" ? L.all : cat}
                    </button>
                  ))}
                </div>

                {/* Safe Filter Switch */}
                <div className="flex items-center justify-between sm:justify-end gap-space-md bg-surface-container-low px-space-md py-space-xs rounded-xl border border-surface-variant/60 shadow-sm shrink-0">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md font-bold text-on-surface leading-tight flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span> {L.sw}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{L.swNote}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      checked={diabeticOnly} 
                      onChange={(e) => setDiabeticOnly(e.target.checked)} 
                      className="sr-only peer" 
                      type="checkbox"
                    />
                    <div className="w-14 h-8 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-tertiary shadow-inner"></div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Curated Product Catalog Section */}
          <section className="w-full py-space-xl">
            <div className="max-w-[1440px] mx-auto px-4 md:px-margin-tablet lg:px-margin-desktop flex flex-col gap-space-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">{L.title}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant pt-0.5">{L.sub}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant bg-surface-container-high px-space-md py-1 rounded-full w-fit border border-surface-variant/40">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  {L.showing(filteredProducts.length, products.length)}
                </span>
              </div>

              {/* 4 Columns Grid */}
              {filteredProducts.length === 0 && (<div className="flex flex-col items-center gap-space-md py-space-xl text-center"><p className="font-title-md text-title-md text-on-surface-variant">{L.empty}</p><button type="button" onClick={() => { setDiabeticOnly(false); setActiveCategory("All"); }} className="px-space-md py-space-sm rounded-xl bg-primary-container text-on-secondary font-title-md text-title-md">{L.reset}</button></div>)}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
                {filteredProducts.map(p => (
                  <article key={p.id} className="bg-surface-container-lowest rounded-xl border border-surface-variant/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col overflow-hidden group">
                    <Link href={`/product/${p.id}`} className="relative w-full h-52 bg-surface-container-low overflow-hidden block">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={p.img} alt={p.name} />
                      <div className="absolute top-space-sm left-space-sm">
                        <span className={`inline-flex items-center gap-1 px-space-sm py-1 rounded-full ${p.badge} font-label-sm text-label-sm font-bold shadow-sm backdrop-blur-sm`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          {p.tag}
                        </span>
                      </div>
                      <div className="absolute bottom-space-xs right-space-xs bg-surface-container-lowest/95 backdrop-blur-sm px-space-xs py-0.5 rounded font-metric-label text-metric-label text-on-surface font-bold border border-surface-variant/60 shadow-sm">
                        {p.gi}
                      </div>
                    </Link>
                    <div className="p-space-md flex-1 flex flex-col justify-between gap-space-md">
                      <div>
                        <Link href={`/product/${p.id}`}>
                          <h3 className="font-title-lg text-title-lg text-on-surface font-bold leading-snug group-hover:text-primary transition-colors">{p.name}</h3>
                        </Link>
                        <p className="font-body-md text-body-md text-on-surface-variant pt-0.5">{p.detail}</p>
                        {p.reasons.length > 0 && <p className="font-body-sm text-body-sm text-on-surface-variant pt-1" title={p.reasons.join(", ")}>{p.reasons.slice(0, 2).join(" · ")}</p>}
                      </div>
                      <div className="flex items-center justify-between pt-space-xs border-t border-surface-variant/30">
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Price</span>
                          <span className="font-metric-display text-metric-display text-on-surface font-bold">{p.price} <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">EGP</span></span>
                        </div>
                        <button 
                          onClick={() => addToCart(p.id, p.name)}
                          className="h-11 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-secondary rounded-lg font-title-md text-title-md flex items-center gap-space-xs active:scale-95 transition-all shadow-sm" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom Value Proposition Cards */}
          <section className="w-full bg-surface-container-low/70 py-space-xl border-t border-surface-variant/50">
            <div className="max-w-[1440px] mx-auto px-4 md:px-margin-tablet lg:px-margin-desktop">
              <div className="text-center max-w-xl mx-auto mb-space-lg">
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">How We Rate Every Product</h2>
                <p className="font-body-md text-body-md text-on-surface-variant pt-1">Label-based screening, not a diagnosis or a guarantee of safety.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
                <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-variant/60 shadow-sm flex flex-col gap-space-sm items-start hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">science</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Transparent Nutrition Data</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Nutrition is shown per catalog serving. Missing values are marked —, never assumed to be zero. Check the package and portion size.
                  </p>
                  <div className="mt-auto pt-space-md flex items-center gap-1.5 text-tertiary font-title-md text-title-md font-semibold">
                    <span>Per-serving values</span>
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-variant/60 shadow-sm flex flex-col gap-space-sm items-start hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">ssid_chart</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Glycemic Index &amp; Load</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    GI: low up to 55, moderate 56–69, high from 70. GL: low up to 10, moderate above 10 and below 20, high from 20. The stricter diabetes screen uses both.
                  </p>
                  <div className="mt-auto pt-space-md flex items-center gap-1.5 text-primary-container font-title-md text-title-md font-semibold">
                    <span>Understand the screening rules</span>
                    <span className="material-symbols-outlined text-xl">health_and_safety</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-variant/60 shadow-sm flex flex-col gap-space-sm items-start hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed-dim/30 text-on-surface flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">In-Branch Smart Scan</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Use your phone's camera in any Fathalla aisle to scan physical packaging barcodes for an instantaneous glycemic green light and safe swap suggestions.
                  </p>
                  <div className="mt-auto pt-space-md flex items-center gap-1.5 text-on-surface font-title-md text-title-md font-semibold">
                    <span>Works with any catalog barcode</span>
                    <span className="material-symbols-outlined text-xl">storefront</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      );
    }

