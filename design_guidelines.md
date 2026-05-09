{
  "project": {
    "name": "Aurora F&B — Torado Rewards + Hidden ERP",
    "goal": "Make Customer Loyalty the primary, premium compro-like entry point (dark espresso glassmorphism). Make ERP login subtle/hidden utility. Improve all loyalty portal pages with desktop-first layouts (split, bento, spacious).",
    "non_negotiables": [
      "Keep all existing API/auth logic untouched (axios, contexts).",
      "Preserve and/or add data-testid on ALL interactive + key informational elements.",
      "Use shadcn/ui components from /app/frontend/src/components/ui (JS files).",
      "Loyalty portal uses explicit dark backgrounds (no transparent page backgrounds).",
      "Cormorant Garamond for headings (match compro)."
    ]
  },

  "brand_personality": {
    "attributes": [
      "premium F&B",
      "warm-luxury (espresso + gold)",
      "quiet confidence",
      "high-contrast readability",
      "glassmorphism with restraint"
    ],
    "anti_attributes": [
      "ERP-looking customer pages",
      "cold neon/teal/blue gradients",
      "busy gradients covering reading areas",
      "centered-everything layouts"
    ]
  },

  "inspiration_refs": {
    "reference_style": "Stampy-like dark glass cards + bento feature gradients",
    "dribbble_queries": [
      "https://dribbble.com/search/bento-dark",
      "https://dribbble.com/search/glass-effect-dashboard",
      "https://dribbble.com/search/glassmorphism-ui"
    ],
    "layout_principles": [
      "Split-screen login (brand/benefits left, form right)",
      "Wide bento grids on desktop (2–4 columns)",
      "Cards with frosted borders + subtle inner highlight line",
      "Hero spacing: generous top padding, calm typography"
    ]
  },

  "typography": {
    "font_pairing": {
      "heading": {
        "family": "Cormorant Garamond",
        "source": "Google Fonts",
        "weights": [400, 500, 600]
      },
      "body": {
        "family": "Manrope",
        "fallback": "Inter",
        "source": "Google Fonts",
        "weights": [400, 500, 600]
      },
      "numbers_optional": {
        "family": "IBM Plex Mono",
        "use": "points, tier thresholds, transaction IDs"
      }
    },
    "scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.02em]",
      "h2": "text-2xl sm:text-3xl font-semibold tracking-[-0.015em]",
      "h3": "text-xl sm:text-2xl font-semibold",
      "subheading": "text-base md:text-lg text-muted-foreground",
      "body": "text-sm sm:text-base leading-relaxed",
      "small": "text-xs sm:text-sm"
    },
    "usage_rules": [
      "Headings always serif (Cormorant Garamond).",
      "Body + UI labels always sans (Manrope/Inter).",
      "Avoid all-caps paragraphs; allow all-caps only for tiny badges/overlines with tracking.",
      "Use tabular-nums for points and balances (Tailwind: tabular-nums)."
    ]
  },

  "color_system": {
    "mode_strategy": {
      "public_site": {
        "bg": "#F8F5EF",
        "text": "#1C1510",
        "note": "Keep compro light theme intact. Add Torado Rewards CTA in header; ERP link becomes subtle footer/menu text only."
      },
      "loyalty_portal": {
        "bg": "#0D0B07",
        "surface": "rgba(255,255,255,0.05)",
        "border": "rgba(255,255,255,0.08)",
        "text": "#F0EAE0",
        "muted_text": "rgba(240,234,224,0.72)",
        "accent": "#C9A876",
        "danger": "#E06B5A",
        "success": "#7FAE7A",
        "warning": "#D6B36A"
      }
    },
    "semantic_tokens": {
      "--tr-bg": "#0D0B07",
      "--tr-bg-2": "#14100B",
      "--tr-surface": "rgba(255,255,255,0.05)",
      "--tr-surface-2": "rgba(255,255,255,0.035)",
      "--tr-border": "rgba(255,255,255,0.08)",
      "--tr-border-strong": "rgba(201,168,118,0.28)",
      "--tr-text": "#F0EAE0",
      "--tr-muted": "rgba(240,234,224,0.72)",
      "--tr-gold": "#C9A876",
      "--tr-gold-2": "#E0C28A",
      "--tr-espresso": "#1C1510",
      "--tr-wine": "#5A1F2B",
      "--tr-forest": "#1E3A2B",
      "--tr-caramel": "#8A5A3C",
      "--tr-focus": "rgba(201,168,118,0.45)"
    },
    "gradients_allowed_decorative_only": {
      "feature_cards": {
        "digital_card": "linear-gradient(135deg, rgba(201,168,118,0.35), rgba(214,179,106,0.18))",
        "rewards": "linear-gradient(135deg, rgba(90,31,43,0.42), rgba(176,92,104,0.18))",
        "history": "linear-gradient(135deg, rgba(30,58,43,0.45), rgba(63,122,86,0.18))",
        "profile": "linear-gradient(135deg, rgba(28,21,16,0.55), rgba(138,90,60,0.18))"
      },
      "hero_backdrop": "radial-gradient(900px 500px at 15% 10%, rgba(201,168,118,0.12), transparent 60%), radial-gradient(700px 420px at 85% 30%, rgba(90,31,43,0.10), transparent 55%)"
    }
  },

  "design_tokens_css": {
    "where": "/app/frontend/src/index.css",
    "instructions": [
      "Add a loyalty theme scope class on body or root wrapper: .loyalty-theme (do NOT rely on .dark alone).",
      "Override shadcn HSL tokens inside .loyalty-theme to warm espresso palette.",
      "Keep existing public-site tokens intact; only apply loyalty overrides within loyalty routes/layout.",
      "Do not use transition: all anywhere."
    ],
    "css_scaffold": "/* Loyalty theme overrides (scoped) */\n.loyalty-theme {\n  --background: 30 22% 4%; /* espresso */\n  --foreground: 36 33% 92%;\n  --card: 30 22% 7%;\n  --card-foreground: 36 33% 92%;\n  --popover: 30 22% 7%;\n  --popover-foreground: 36 33% 92%;\n  --primary: 38 45% 62%; /* warm gold */\n  --primary-foreground: 30 22% 8%;\n  --secondary: 30 18% 12%;\n  --secondary-foreground: 36 33% 92%;\n  --muted: 30 18% 12%;\n  --muted-foreground: 36 18% 72%;\n  --accent: 38 45% 62%;\n  --accent-foreground: 30 22% 8%;\n  --border: 36 10% 22%;\n  --input: 36 10% 22%;\n  --ring: 38 55% 62%;\n  --radius: 1rem;\n}\n\n/* Loyalty background: explicit solid + subtle decorative radials (<=20% viewport impact) */\n.loyalty-theme body {\n  background: #0D0B07;\n}\n\n/* Optional: add a single overlay element in LoyaltyLayout instead of body gradients */\n"
  },

  "layout_system": {
    "grid": {
      "page_container": "max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
      "desktop_shell": "grid grid-cols-12 gap-6",
      "bento": {
        "desktop": "grid grid-cols-12 gap-4 lg:gap-6",
        "card_span_examples": [
          "Points/Tier hero: col-span-12 lg:col-span-7",
          "Quick actions bento: col-span-12 lg:col-span-5",
          "Recent transactions: col-span-12 lg:col-span-8",
          "Referral: col-span-12 lg:col-span-4"
        ]
      }
    },
    "desktop_not_stretched_rules": [
      "Never let forms exceed max-w-md on desktop; use split layout instead.",
      "Use left brand panel with max-w-xl text; right panel centered form card.",
      "Use generous vertical rhythm: section py-10 sm:py-14."
    ]
  },

  "components": {
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "label": "/app/frontend/src/components/ui/label.jsx",
      "form": "/app/frontend/src/components/ui/form.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "progress": "/app/frontend/src/components/ui/progress.jsx",
      "sonner_toast": "/app/frontend/src/components/ui/sonner.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx"
    },
    "loyalty_primitives": {
      "glass_card_class": "glass-card (existing utility in index.css)",
      "recommended_card_classes": [
        "glass-card rounded-2xl",
        "border border-white/10",
        "shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
      ],
      "feature_card": {
        "base": "relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-6",
        "overlay": "after:content-[''] after:absolute after:inset-0 after:bg-[radial-gradient(600px_240px_at_20%_0%,rgba(255,255,255,0.10),transparent_60%)] after:pointer-events-none",
        "title": "font-[Cormorant_Garamond] text-xl sm:text-2xl text-[var(--tr-text)]",
        "meta": "text-sm text-[var(--tr-muted)]"
      }
    },
    "buttons": {
      "style": "Luxury / Elegant",
      "tokens": {
        "--btn-radius": "14px",
        "--btn-shadow": "0 18px 40px rgba(0,0,0,0.45)",
        "--btn-shadow-hover": "0 22px 55px rgba(0,0,0,0.55)",
        "--btn-press-scale": "0.98"
      },
      "variants": {
        "primary_gold": "bg-[var(--tr-gold)] text-[#1C1510] hover:bg-[var(--tr-gold-2)] focus-visible:ring-2 focus-visible:ring-[var(--tr-focus)]",
        "secondary_glass": "bg-white/5 text-[var(--tr-text)] border border-white/10 hover:bg-white/7",
        "ghost": "bg-transparent text-[var(--tr-text)] hover:bg-white/5"
      },
      "micro_interactions": [
        "Hover: translateY(-1px) on primary CTAs only (transition-transform 200ms).",
        "Active: scale(0.98).",
        "Add subtle shimmer on primary button using pseudo-element on hover (only for large CTAs)."
      ]
    },
    "forms": {
      "input_style": "Use shadcn Input with className='glass-input text-[var(--tr-text)] placeholder:text-[var(--tr-muted)] border-white/10 focus-visible:ring-[var(--tr-focus)]'",
      "floating_label_optional": "If implementing floating labels, keep label readable; otherwise use standard Label above Input for clarity.",
      "validation": "Errors in warm coral (danger) with small text-xs and icon (lucide)."
    },
    "navigation": {
      "public_header": {
        "loyalty_cta": "Add a prominent pill button 'Torado Rewards' (primary gold) in header nav.",
        "erp_link": "Remove from primary nav. Put as subtle text link in footer or inside mobile menu bottom: 'Staff Access'."
      },
      "loyalty_shell": {
        "desktop": "Left vertical nav (glass) + main content. Use icons + labels. Active item uses pill-active but recolored to gold.",
        "mobile": "Use Sheet for nav drawer; keep top bar minimal with points chip."
      }
    },
    "data_display": {
      "points_kpi": "Use Card + Progress for tier progress. Numbers in tabular-nums.",
      "transactions": "Use Table on desktop; enable responsive cards using existing data-responsive-table helper.",
      "reward_catalog": "Use Card grid with Dialog for reward details + redeem confirmation."
    }
  },

  "page_blueprints": {
    "loyalty_login": {
      "route": "/loyalty/login",
      "desktop_layout": "Split-screen: left brand panel (atmospheric image + benefits), right centered glass form card (max-w-md).",
      "left_panel": [
        "Background: moody restaurant image with dark overlay.",
        "Logo/Title: 'Torado Rewards' (Cormorant).",
        "Benefits list (3 items) with small icon orbs.",
        "Optional: tier teaser chips (Bronze/Silver/Gold) as badges."
      ],
      "right_panel": [
        "Glass Card: email/phone + password, primary CTA.",
        "Secondary links: Register, Forgot password.",
        "Tiny 'Staff Access' link at bottom (routes to /login)."
      ],
      "mobile_layout": "Single column: background image header (max 20% viewport) + glass card overlay.",
      "testids": [
        "loyalty-login-email-input",
        "loyalty-login-password-input",
        "loyalty-login-submit-button",
        "loyalty-login-register-link",
        "loyalty-login-staff-access-link"
      ]
    },

    "loyalty_register": {
      "route": "/loyalty/register",
      "layout": "Same split-shell as login for consistency. Form is longer; use ScrollArea inside card on desktop to avoid stretching.",
      "components": ["Form", "Input", "Checkbox", "Button", "ScrollArea"],
      "testids": [
        "loyalty-register-name-input",
        "loyalty-register-phone-input",
        "loyalty-register-email-input",
        "loyalty-register-password-input",
        "loyalty-register-submit-button"
      ]
    },

    "loyalty_dashboard": {
      "route": "/loyalty",
      "hero": "Top section: Points balance + tier + progress bar + next reward hint.",
      "bento_quick_actions": [
        "Kartu Digital (gold/amber gradient)",
        "Rewards (wine/rose gradient)",
        "History (forest/emerald gradient)",
        "Profile (espresso/caramel gradient)"
      ],
      "secondary_sections": [
        "Recent transactions table",
        "Referral card with copy link",
        "Optional: 'Recommended rewards' carousel"
      ],
      "testids": [
        "loyalty-dashboard-points-value",
        "loyalty-dashboard-tier-label",
        "loyalty-dashboard-tier-progress",
        "loyalty-dashboard-quick-action-card",
        "loyalty-dashboard-recent-transactions"
      ]
    },

    "loyalty_card": {
      "route": "/loyalty/card",
      "layout": "Center a large digital card preview (glass) with QRCodeSVG; right side details on desktop (split 7/5).",
      "qr": "Use QRCodeSVG with quiet zone; place on lightened glass panel for scan reliability.",
      "testids": [
        "loyalty-card-qr",
        "loyalty-card-member-id",
        "loyalty-card-download-button"
      ]
    },

    "loyalty_rewards": {
      "route": "/loyalty/rewards",
      "layout": "Catalog grid (2 cols mobile, 3 cols lg). Filters as Tabs or Select on mobile.",
      "redeem_flow": "Reward Card -> Dialog details -> confirm redeem -> sonner toast success/error.",
      "testids": [
        "loyalty-rewards-filter-tabs",
        "loyalty-rewards-reward-card",
        "loyalty-rewards-redeem-button",
        "loyalty-rewards-redeem-confirm-button"
      ]
    },

    "loyalty_history": {
      "route": "/loyalty/history",
      "layout": "Desktop: Table with date, outlet, points +/- and status Badge. Mobile: responsive table cards (data-responsive-table).",
      "filters": "Date range uses shadcn Calendar in Popover; status uses Select.",
      "testids": [
        "loyalty-history-date-filter",
        "loyalty-history-status-filter",
        "loyalty-history-table"
      ]
    },

    "loyalty_profile": {
      "route": "/loyalty/profile",
      "layout": "Two cards side-by-side on desktop: Profile details + Security (change password).",
      "testids": [
        "loyalty-profile-save-button",
        "loyalty-profile-change-password-button"
      ]
    },

    "erp_login_hidden": {
      "route": "/login",
      "intent": "Back-office utility. Minimal, compact, not visually competing with loyalty.",
      "layout": "Small centered card on neutral background (public light theme). No hero imagery. Title: 'Aurora ERP — Staff Portal'.",
      "cta": "Primary button is neutral dark (not gold).",
      "testids": [
        "erp-login-username-input",
        "erp-login-password-input",
        "erp-login-submit-button"
      ]
    }
  },

  "motion_and_microinteractions": {
    "library": "framer-motion (already installed)",
    "principles": [
      "Entrance: fade + slight y (8–12px) for cards and sections.",
      "Hover: only on cards/buttons; avoid animating layout-affecting properties.",
      "Use reduced-motion media query fallback (already in index.css)."
    ],
    "recommended_variants": {
      "card": "{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }",
      "stagger": "{ show: { transition: { staggerChildren: 0.06 } } }"
    }
  },

  "imagery_and_assets": {
    "image_urls": [
      {
        "category": "loyalty-login-left-panel-background",
        "description": "Moody restaurant interior with warm lighting; apply dark overlay for readability.",
        "urls": [
          "https://images.unsplash.com/photo-1715607349483-e90d709d8a52?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
          "https://images.unsplash.com/photo-1579708776106-eeb62aa0af7b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
        ]
      },
      {
        "category": "subtle-texture-overlay",
        "description": "Optional gold foil texture used VERY subtly (opacity 0.04–0.07) as a masked corner accent, not full background.",
        "urls": [
          "https://images.unsplash.com/photo-1656055449419-9db540f8f1e2?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
        ]
      }
    ],
    "usage_rules": [
      "Never place text directly on busy photos; always add overlay: bg-black/55 + backdrop blur if needed.",
      "Gradients/textures must remain decorative and under 20% viewport coverage."
    ]
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast: gold text only on dark backgrounds; avoid gold on white.",
      "Focus-visible ring must be warm gold and clearly visible.",
      "Touch targets >= 44px on mobile (use .touch-target helper).",
      "Use semantic headings and labels; never rely on placeholder-only inputs."
    ]
  },

  "instructions_to_main_agent": [
    "Implement a LoyaltyLayout wrapper that adds className='loyalty-theme' on a top-level div (or body via effect) for all /loyalty/* routes.",
    "Update PublicLayout header: add prominent 'Torado Rewards' pill CTA (routes to /loyalty/login). Move ERP login link to subtle footer/mobile menu bottom as 'Staff Access'.",
    "Refactor loyalty pages to use desktop bento grids and glass cards; avoid stretched single-column desktop layouts.",
    "Use shadcn components only (Button, Card, Tabs, Table, Dialog, Sheet, Calendar, Sonner).",
    "Ensure every button/link/input and key info (points, tier, errors) has stable data-testid in kebab-case.",
    "Do not change API calls/auth logic; only adjust layout/styling and component composition.",
    "ERP login page: reduce prominence—compact card, neutral styling, no hero imagery, no gold gradients."
  ]
}

---

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
