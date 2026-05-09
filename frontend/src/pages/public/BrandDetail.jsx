import { useRef, useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import PageSEO from "@/components/shared/PageSEO";
import { motion, useInView } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Phone, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DOMPurify from "dompurify";
import api from "@/lib/api";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

function trackView(contentType, contentId) {
  axios.post(`${BACKEND_URL}/api/public/analytics/track`, { content_type: contentType, content_id: contentId }).catch(() => {});
}

const BRAND_IMAGES = {
  altero: "https://images.unsplash.com/photo-1768675142660-949249bcd484?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
  "de-la-sol": "https://images.unsplash.com/photo-1557079604-d28080618be0?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
  calluna: "https://images.unsplash.com/photo-1766832255363-c9f060ade8b0?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
  bakkies: "https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
  "rucker-park": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800",
};

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SafeHTML({ html, className = "" }) {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  const isPlain = !/<[a-z][\s\S]*>/i.test(clean);
  if (isPlain) return <p className={className || "text-[#1C1510]/55 text-sm leading-relaxed mb-6"}>{html}</p>;
  return (
    <div
      className={className || "prose prose-sm prose-neutral max-w-none text-[#1C1510]/70 leading-relaxed mb-6"}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export default function BrandDetail() {
  const { brandId } = useParams();
  const [brand, setBrand] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [brandRes, outletsRes] = await Promise.all([
          api.get(`/public/brands/${brandId}`),
          api.get("/public/outlets", { params: { brand_id: brandId } }),
        ]);
        const brandData = brandRes.data?.data;
        setBrand(brandData);
        setOutlets(outletsRes.data?.data || []);
        // Track analytics
        if (brandData?.id) trackView("brand", brandData.id);
      } catch (error) {
        console.error("Failed to fetch brand:", error);
        if (error.response?.status === 404) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [brandId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5EF]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1C1510]/40" />
      </div>
    );
  }

  if (notFound || !brand) return <Navigate to="/brands" replace />;

  return (
    <div className="min-h-screen" data-testid="brand-detail-page">
      <PageSEO
        title={brand.seo_title || brand.name}
        description={brand.seo_description || brand.short_desc || brand.tagline || ""}
        image={brand.seo_og_image || brand.hero_image}
        path={`/brands/${brand.seo_slug || brand.code}`}
        type="website"
      />
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden" data-testid="brand-detail-hero">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${brand.hero_image || BRAND_IMAGES[brand.code]})` }}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,21,16,0.8) 0%, rgba(28,21,16,0.3) 50%, rgba(28,21,16,0.4) 100%)" }} />

        <div className="relative z-10 h-full flex flex-col justify-end px-6 sm:px-10 lg:px-16 pb-14 max-w-screen-xl mx-auto">
          <Link to="/brands" className="inline-flex items-center gap-2 text-white/55 text-sm hover:text-white transition-colors mb-8" data-testid="brand-detail-back-link">
            <ArrowLeft className="h-4 w-4" /> All Brands
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: brand.color }} />
            <span className="text-white/45 text-[10px] tracking-[0.25em] uppercase" style={{ fontFamily: "'Azeret Mono', monospace" }}>Est. {brand.established}</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-white leading-[0.88] tracking-[-0.03em] mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(56px, 8vw, 110px)", fontWeight: 600 }}
          >
            {brand.name}
          </motion.h1>
          <p className="text-white/55 text-base">{brand.tagline}</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 lg:py-28 px-6 sm:px-10 lg:px-16">
        <div className="max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="text-[#1C1510]/40 text-[10px] tracking-[0.3em] uppercase mb-4" style={{ fontFamily: "'Azeret Mono', monospace" }}>Our Story</p>
            <h2 className="text-[#1C1510] leading-tight tracking-[-0.025em] mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 600 }}>The {brand.name} Story</h2>
            <span className="compro-divider" />
            <SafeHTML html={brand.story} className="text-[#1C1510]/55 text-sm leading-relaxed mb-6" />
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {brand.tags.map((tag, ti) => (
                <span key={tag} className="text-[9px] text-[#1C1510]/40 tracking-[0.2em] uppercase" style={{ fontFamily: "'Azeret Mono', monospace" }}>
                  {ti > 0 && <span className="mr-3 text-[#C8A96E]">·</span>}{tag}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "4/3" }}>
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${brand.card_image})` }}
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Signature Dishes */}
      {brand.signature_dishes && brand.signature_dishes.length > 0 && (
        <section className="py-20 lg:py-24 px-6 sm:px-10 lg:px-16 border-t border-[#1C1510]/10" data-testid="brand-detail-signature-section">
          <div className="max-w-screen-xl mx-auto">
            <Reveal>
              <p className="text-[#1C1510]/40 text-[10px] tracking-[0.3em] uppercase mb-3" style={{ fontFamily: "'Azeret Mono', monospace" }}>Featured</p>
              <h2 className="text-[#1C1510] leading-tight tracking-[-0.025em] mb-12" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 600 }}>Signature Dishes</h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1C1510]/10">
              {brand.signature_dishes.map((dish, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <motion.div
                    className="p-8 bg-[#F8F5EF] hover:bg-[#F0EAE0] transition-colors"
                    whileHover={{ y: -1 }}
                  >
                    <span className="compro-divider" style={{ backgroundColor: brand.color }} />
                    <h3 className="text-[#1C1510]/90 font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem" }}>{dish.name}</h3>
                    <p className="text-[#1C1510]/45 text-xs leading-relaxed mb-4">{dish.desc}</p>
                    <p className="font-semibold text-sm" style={{ color: brand.color }}>{dish.price}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Outlets */}
      {outlets.length > 0 && (
        <section className="py-20 lg:py-24 px-6 sm:px-10 lg:px-16 border-t border-[#1C1510]/10" data-testid="brand-detail-outlets-accordion">
          <div className="max-w-screen-xl mx-auto">
            <Reveal>
              <p className="text-[#1C1510]/40 text-[10px] tracking-[0.3em] uppercase mb-3" style={{ fontFamily: "'Azeret Mono', monospace" }}>Where to Find Us</p>
              <h2 className="text-[#1C1510] leading-tight tracking-[-0.025em] mb-10" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 600 }}>Our Outlets</h2>
            </Reveal>
            <Accordion type="single" collapsible className="space-y-2">
              {outlets.map((outlet) => (
                <AccordionItem key={outlet.id} value={outlet.id} className="border border-[#1C1510]/15 rounded-xl px-6 data-[state=open]:border-[#1C1510]/30 bg-white hover:bg-[#F0EAE0] transition-colors">
                  <AccordionTrigger className="text-[#1C1510]/85 text-sm font-medium hover:no-underline hover:text-[#1C1510] py-5">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4" style={{ color: brand.color }} />
                      {outlet.name}
                      <span className="text-[#1C1510]/40 text-xs font-normal">{outlet.area}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-0 pb-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <p className="text-[#1C1510]/40 text-[9px] tracking-wider uppercase mb-2" style={{ fontFamily: "'Azeret Mono', monospace" }}>Address</p>
                        <p className="text-[#1C1510]/65 text-sm leading-relaxed">{outlet.address}</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[#1C1510]/40 text-[9px] tracking-wider uppercase mb-1" style={{ fontFamily: "'Azeret Mono', monospace" }}>Hours</p>
                          <p className="text-[#1C1510]/60 text-xs">Mon–Fri: {outlet.hours_weekday}</p>
                          <p className="text-[#1C1510]/60 text-xs mt-0.5">Sat–Sun: {outlet.hours_weekend}</p>
                        </div>
                        <a href={`tel:${outlet.phone}`} className="flex items-center gap-1.5 text-[#1C1510]/50 text-xs hover:text-[#1C1510] transition-colors">
                          <Phone className="h-3 w-3" />{outlet.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {outlet.features.map((f) => (
                        <span key={f} className="px-3 py-1 rounded-full text-[10px] border border-[#1C1510]/15 text-[#1C1510]/45">{f}</span>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Reveal delay={0.1}>
              <div className="flex flex-wrap gap-3 mt-10">
                <Link to="/menu" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#1C1510] rounded-full hover:bg-[#1C1510]/85 transition-colors">See Menu</Link>
                <Link to="/locations" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[#1C1510] border border-[#1C1510]/25 rounded-full hover:bg-[#1C1510]/5 transition-colors">All Locations</Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}
