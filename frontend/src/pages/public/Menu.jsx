import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Loader2 } from "lucide-react";
import PageSEO from "@/components/shared/PageSEO";
import api from "@/lib/api";

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

function formatPrice(p) { return `Rp ${p.toLocaleString("id-ID")}`; }

export default function Menu() {
  const [brands, setBrands] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [brandsRes, menuRes] = await Promise.all([
          api.get("/public/brands"),
          api.get("/public/menu"),
        ]);
        const brandsData = brandsRes.data?.data || [];
        setBrands(brandsData);
        setMenuItems(menuRes.data?.data || []);
        
        if (brandsData.length > 0 && !activeBrand) {
          setActiveBrand(brandsData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch menu data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5EF]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1C1510]/40" />
      </div>
    );
  }

  const currentBrand = brands.find((b) => b.id === activeBrand);
  const items = menuItems.filter((m) => m.brand_id === activeBrand);
  const categories = [...new Set(items.map((m) => m.category))];

  return (
    <div className="min-h-screen" data-testid="menu-page">
      <PageSEO
        title="Menu"
        description="Jelajahi menu dari 4 brand Torado Group. Dari specialty coffee Altero, masakan Latin De La Sol, European bistro Calluna, hingga artisan bakery Bakkies."
        path="/menu"
        keywords="menu Altero, menu De La Sol, menu Calluna, menu Bakkies, menu restoran Jakarta"
      />
      <div className="pt-32 pb-12 px-6 lg:px-12 border-b border-[#1C1510]/10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <p className="text-[#1C1510]/40 text-[10px] tracking-[0.3em] uppercase mb-3" style={{ fontFamily: "'Azeret Mono', monospace" }}>Menu Catalog</p>
          <h1 className="text-[#1C1510] leading-[0.88] tracking-[-0.03em]" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(52px, 7vw, 96px)", fontWeight: 600 }}>Our Menus</h1>
        </motion.div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-wrap gap-2 mb-14" data-testid="menu-brand-tabs">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setActiveBrand(brand.id)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeBrand === brand.id
                  ? "text-white bg-[#1C1510]"
                  : "text-[#1C1510]/55 border border-[#1C1510]/15 hover:border-[#1C1510]/30 hover:text-[#1C1510]"
              }`}
              data-testid={`menu-tab-${brand.code}`}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: brand.color }} />
              {brand.name}
            </button>
          ))}
        </div>

        {currentBrand && (
          <>
            <Reveal>
              <div className="mb-10 pb-8 border-b border-[#1C1510]/10">
                <h2 className="text-[#1C1510] leading-tight tracking-[-0.02em] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 600 }}>
                  {currentBrand?.name}
                </h2>
                <p className="text-[#1C1510]/45 text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{currentBrand?.tagline}</p>
              </div>
            </Reveal>

            {categories.length === 0 && (
              <Reveal>
                <div className="text-center py-12">
                  <p className="text-[#1C1510]/40 text-sm">No menu items available for this brand yet.</p>
                </div>
              </Reveal>
            )}

            {categories.map((cat, ci) => {
              const catItems = items.filter((m) => m.category === cat);
              return (
                <Reveal key={cat} delay={ci * 0.05}>
                  <div className="mb-10">
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className="text-[#1C1510]/70 text-base font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem" }}>{cat}</h3>
                      <div className="flex-1 h-px bg-[#1C1510]/10" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1C1510]/10">
                      {catItems.map((item) => (
                        <motion.div
                          key={item.id}
                          className="p-6 bg-[#F8F5EF] hover:bg-[#F0EAE0] transition-colors flex items-start justify-between gap-4"
                          whileHover={{ y: -1 }}
                          data-testid="menu-item-card"
                        >
                          <div className="flex-1">
                            <h4 className="text-[#1C1510]/85 text-sm font-semibold mb-1.5">{item.name}</h4>
                            <p className="text-[#1C1510]/40 text-xs leading-relaxed">{item.description}</p>
                          </div>
                          <p className="font-semibold text-sm whitespace-nowrap" style={{ color: currentBrand?.color }}>{formatPrice(item.price)}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </>
        )}

        <Reveal>
          <p className="text-[#1C1510]/30 text-xs mt-8 text-center">Harga adalah estimasi. Konfirmasi langsung ke outlet.</p>
        </Reveal>
      </div>
    </div>
  );
}
