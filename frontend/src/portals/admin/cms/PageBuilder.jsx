/**
 * PageBuilder — Sprint L: Flexible content page builder
 * Block-based custom pages with multiple block types.
 */
import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Eye, EyeOff, Globe, Loader2, ChevronUp, ChevronDown,
  Save, Image, Type, Megaphone, Minus, LayoutTemplate, ExternalLink, Copy, RefreshCw, X,
  Images, UtensilsCrossed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import ImageUpload from "@/components/shared/ImageUpload";
import RichTextEditor from "@/components/shared/RichTextEditor";
import CMSSEOFields from "./CMSSEOFields";

const BLOCK_TYPES = [
  { id: "hero",          label: "Hero Banner",     icon: Megaphone,        desc: "Full-width hero section with title, subtitle, CTA button" },
  { id: "rich_text",     label: "Text / HTML",     icon: Type,             desc: "Rich text content block with formatting" },
  { id: "image",         label: "Image",           icon: Image,            desc: "Single image with optional caption" },
  { id: "gallery",       label: "Gallery",         icon: Images,           desc: "Image gallery with responsive grid layout" },
  { id: "menu_showcase", label: "Menu Showcase",   icon: UtensilsCrossed,  desc: "Featured menu items with images and descriptions" },
  { id: "cta_banner",    label: "CTA Banner",      icon: Megaphone,        desc: "Call-to-action banner with button" },
  { id: "divider",       label: "Divider",         icon: Minus,            desc: "Visual section separator" },
];

const EMPTY_PAGE = {
  title: "", slug: "", description: "", status: "draft",
  blocks: [],
  seo_title: "", seo_description: "", seo_og_image: "",
};

function makeBlock(type) {
  const base = { id: `block_${Date.now()}_${Math.random().toString(36).slice(2)}`, type };
  switch (type) {
    case "hero":          return { ...base, title: "Selamat Datang", subtitle: "Tagline yang menginspirasi", cta_text: "Selengkapnya", cta_link: "/brands", bg_image: "", overlay_opacity: 60, text_color: "#ffffff" };
    case "rich_text":     return { ...base, content: "<p>Tulis konten Anda di sini...</p>" };
    case "image":         return { ...base, url: "", caption: "", size: "full", alt: "" };
    case "gallery":       return { ...base, images: [], layout: "grid", columns: 3 };
    case "menu_showcase": return { ...base, title: "Menu Pilihan", items: [], cta_text: "", cta_link: "" };
    case "cta_banner":    return { ...base, title: "Judul CTA", description: "Deskripsi singkat", btn_text: "Klik Di Sini", btn_link: "/", bg_color: "#1a1a2e", text_color: "#ffffff" };
    case "divider":       return { ...base, style: "line" };
    default:              return base;
  }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

// ── Block editors ──────────────────────────────────────────────────────────

function HeroBlockEditor({ block, onChange }) {
  const set = (k, v) => onChange({ ...block, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input value={block.title} onChange={e => set("title", e.target.value)} placeholder="Hero title" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Subtitle</Label>
          <Input value={block.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="Hero subtitle" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">CTA Text</Label>
          <Input value={block.cta_text} onChange={e => set("cta_text", e.target.value)} placeholder="Selengkapnya" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CTA Link</Label>
          <Input value={block.cta_link} onChange={e => set("cta_link", e.target.value)} placeholder="/brands" />
        </div>
      </div>
      <ImageUpload label="Background Image" value={block.bg_image} onChange={url => set("bg_image", url)} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Overlay Opacity %</Label>
          <Input type="number" min={0} max={100} value={block.overlay_opacity} onChange={e => set("overlay_opacity", +e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Text Color</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={block.text_color} onChange={e => set("text_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
            <Input value={block.text_color} onChange={e => set("text_color", e.target.value)} className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RichTextBlockEditor({ block, onChange }) {
  return (
    <RichTextEditor
      value={block.content}
      onChange={html => onChange({ ...block, content: html })}
      minHeight={160}
      placeholder="Tulis konten blok di sini..."
    />
  );
}

function ImageBlockEditor({ block, onChange }) {
  const set = (k, v) => onChange({ ...block, [k]: v });
  return (
    <div className="space-y-3">
      <ImageUpload label="Image" value={block.url} onChange={url => set("url", url)} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Caption</Label>
          <Input value={block.caption} onChange={e => set("caption", e.target.value)} placeholder="Keterangan gambar" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Alt Text</Label>
          <Input value={block.alt} onChange={e => set("alt", e.target.value)} placeholder="Alt text" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Size</Label>
        <Select value={block.size} onValueChange={v => set("size", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width</SelectItem>
            <SelectItem value="medium">Medium (75%)</SelectItem>
            <SelectItem value="small">Small (50%)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CTABlockEditor({ block, onChange }) {
  const set = (k, v) => onChange({ ...block, [k]: v });
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Title</Label>
        <Input value={block.title} onChange={e => set("title", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea rows={2} value={block.description} onChange={e => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Button Text</Label>
          <Input value={block.btn_text} onChange={e => set("btn_text", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Button Link</Label>
          <Input value={block.btn_link} onChange={e => set("btn_link", e.target.value)} placeholder="/brands" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Background Color</Label>
          <div className="flex gap-2">
            <input type="color" value={block.bg_color} onChange={e => set("bg_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
            <Input value={block.bg_color} onChange={e => set("bg_color", e.target.value)} className="flex-1" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Text Color</Label>
          <div className="flex gap-2">
            <input type="color" value={block.text_color} onChange={e => set("text_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
            <Input value={block.text_color} onChange={e => set("text_color", e.target.value)} className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DividerBlockEditor({ block, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Style</Label>
      <Select value={block.style} onValueChange={v => onChange({ ...block, style: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="line">Line</SelectItem>
          <SelectItem value="dots">Dots</SelectItem>
          <SelectItem value="spacer">Spacer (invisible)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function GalleryBlockEditor({ block, onChange }) {
  const set = (k, v) => onChange({ ...block, [k]: v });
  const images = block.images || [];
  
  const addImage = () => {
    set("images", [...images, { id: Date.now(), url: "", caption: "", alt: "" }]);
  };
  
  const updateImage = (idx, field, value) => {
    const updated = images.map((img, i) => i === idx ? { ...img, [field]: value } : img);
    set("images", updated);
  };
  
  const removeImage = (idx) => {
    set("images", images.filter((_, i) => i !== idx));
  };
  
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Layout Style</Label>
        <Select value={block.layout || "grid"} onValueChange={v => set("layout", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="masonry">Masonry</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-1">
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.columns || 3)} onValueChange={v => set("columns", parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Images ({images.length})</Label>
          <Button type="button" size="sm" variant="outline" onClick={addImage}>
            <Plus className="h-3 w-3 mr-1" /> Add Image
          </Button>
        </div>
        
        {images.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <Images className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground">No images yet. Click Add Image.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {images.map((img, idx) => (
              <div key={img.id || idx} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Image {idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" 
                          onClick={() => removeImage(idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <ImageUpload 
                  label="Image URL" 
                  value={img.url} 
                  onChange={url => updateImage(idx, "url", url)} 
                />
                <Input 
                  placeholder="Alt text" 
                  value={img.alt || ""} 
                  onChange={e => updateImage(idx, "alt", e.target.value)}
                  className="text-xs"
                />
                <Input 
                  placeholder="Caption (optional)" 
                  value={img.caption || ""} 
                  onChange={e => updateImage(idx, "caption", e.target.value)}
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuShowcaseBlockEditor({ block, onChange }) {
  const set = (k, v) => onChange({ ...block, [k]: v });
  const items = block.items || [];
  
  const addItem = () => {
    set("items", [...items, { 
      id: Date.now(), 
      name: "Menu Item", 
      description: "", 
      price: "", 
      image: "" 
    }]);
  };
  
  const updateItem = (idx, field, value) => {
    const updated = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    set("items", updated);
  };
  
  const removeItem = (idx) => {
    set("items", items.filter((_, i) => i !== idx));
  };
  
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Section Title</Label>
        <Input value={block.title || ""} onChange={e => set("title", e.target.value)} 
               placeholder="Menu Pilihan" />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">CTA Text (optional)</Label>
          <Input value={block.cta_text || ""} onChange={e => set("cta_text", e.target.value)} 
                 placeholder="View Full Menu" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CTA Link</Label>
          <Input value={block.cta_link || ""} onChange={e => set("cta_link", e.target.value)} 
                 placeholder="/menu" />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Menu Items ({items.length})</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>
        
        {items.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground">No menu items yet. Click Add Item.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Item {idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" 
                          onClick={() => removeItem(idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input 
                  placeholder="Menu item name" 
                  value={item.name || ""} 
                  onChange={e => updateItem(idx, "name", e.target.value)}
                  className="font-medium"
                />
                <Textarea 
                  placeholder="Description" 
                  rows={2}
                  value={item.description || ""} 
                  onChange={e => updateItem(idx, "description", e.target.value)}
                  className="text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Price (e.g., Rp 50.000)" 
                    value={item.price || ""} 
                    onChange={e => updateItem(idx, "price", e.target.value)}
                    className="text-xs"
                  />
                  <ImageUpload 
                    label="" 
                    value={item.image || ""} 
                    onChange={url => updateItem(idx, "image", url)} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const BLOCK_EDITORS = {
  hero: HeroBlockEditor,
  rich_text: RichTextBlockEditor,
  image: ImageBlockEditor,
  gallery: GalleryBlockEditor,
  menu_showcase: MenuShowcaseBlockEditor,
  cta_banner: CTABlockEditor,
  divider: DividerBlockEditor,
};

// ── Block card ──────────────────────────────────────────────────────────────
function BlockCard({ block, index, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = BLOCK_TYPES.find(b => b.id === block.type);
  const Icon = cfg?.icon || Type;
  const Editor = BLOCK_EDITORS[block.type];

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Block header */}
      <div className="flex items-center gap-2 p-3 bg-muted/30 border-b cursor-pointer"
           onClick={() => setExpanded(v => !v)}>
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium text-sm flex-1">{cfg?.label || block.type}</span>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMoveUp} disabled={index === 0}>
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMoveDown} disabled={index === total - 1}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Block editor */}
      {expanded && Editor && (
        <div className="p-4">
          <Editor block={block} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ── Main PageBuilder component ───────────────────────────────────────────────
export default function PageBuilder() {
  const [pages, setPages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PAGE);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "";

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/cms/pages");
      setPages(r.data?.data?.items || []);
      setTotal(r.data?.data?.total || 0);
    } catch { toast.error("Gagal memuat pages"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PAGE);
    setSlugManual(false);
    setFormOpen(true);
  };

  const openEdit = async (page) => {
    try {
      const r = await api.get(`/admin/cms/pages/${page.id}`);
      setEditing(page.id);
      setForm(r.data?.data || page);
      setSlugManual(true);
      setFormOpen(true);
    } catch { toast.error("Gagal memuat halaman"); }
  };

  const handleTitleChange = (title) => {
    setForm(f => ({
      ...f,
      title,
      slug: slugManual ? f.slug : slugify(title),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Judul halaman wajib diisi"); return; }
    if (!form.slug.trim()) { toast.error("Slug wajib diisi"); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/cms/pages/${editing}`, form);
        toast.success("Halaman diperbarui");
      } else {
        await api.post("/admin/cms/pages", form);
        toast.success("Halaman dibuat");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0]?.message || "Gagal menyimpan");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/cms/pages/${deleteId}`);
      toast.success("Halaman dihapus");
      setDeleteId(null);
      await load();
    } catch { toast.error("Gagal menghapus"); }
  };

  const handleToggleStatus = async (page) => {
    try {
      const ns = page.status === "published" ? "draft" : "published";
      await api.put(`/admin/cms/pages/${page.id}`, { ...page, status: ns });
      toast.success(ns === "published" ? "Halaman dipublish" : "Halaman dijadikan draft");
      await load();
    } catch { toast.error("Gagal mengubah status"); }
  };

  // Block management
  const addBlock = (type) => {
    setForm(f => ({ ...f, blocks: [...(f.blocks || []), makeBlock(type)] }));
    setAddBlockOpen(false);
  };

  const updateBlock = (idx, updated) => {
    setForm(f => ({ ...f, blocks: f.blocks.map((b, i) => i === idx ? updated : b) }));
  };

  const deleteBlock = (idx) => {
    setForm(f => ({ ...f, blocks: f.blocks.filter((_, i) => i !== idx) }));
  };

  const moveBlock = (idx, dir) => {
    setForm(f => {
      const arr = [...f.blocks];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return f;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...f, blocks: arr };
    });
  };

  const handleSEOChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const previewUrl = `${backendUrl.replace("/api", "").replace("8001", "3000")}/pages/${form.slug}`;

  return (
    <div className="space-y-5" data-testid="cms-page-builder">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-purple-600" />
            Page Builder
          </h3>
          <p className="text-sm text-muted-foreground">Buat halaman kustom dengan blok konten yang fleksibel.</p>
        </div>
        <Button onClick={openCreate} data-testid="create-page-btn">
          <Plus className="h-4 w-4 mr-2" /> Buat Halaman Baru
        </Button>
      </div>

      {/* Page list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16">
          <LayoutTemplate className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Belum ada halaman. Klik Buat Halaman Baru.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pages.map(page => (
            <div key={page.id}
                 className="border rounded-xl p-4 flex items-start gap-4 bg-white hover:shadow-md transition-shadow"
                 data-testid={`page-row-${page.id}`}>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <LayoutTemplate className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{page.title}</span>
                  <Badge variant={page.status === "published" ? "default" : "secondary"} className="text-xs">
                    {page.status === "published" ? "Published" : "Draft"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">/{page.slug}</span>
                </div>
                {page.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{page.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {(page.blocks?.length || 0)} blok &middot; Updated {page.updated_at ? new Date(page.updated_at).toLocaleString("id-ID", { dateStyle: "short" }) : "—"}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {page.status === "published" && (
                  <a href={`/pages/${page.slug}`} target="_blank" rel="noreferrer">
                    <Button size="icon" variant="ghost" title="Lihat di publik">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </a>
                )}
                <Button size="icon" variant="ghost" onClick={() => handleToggleStatus(page)}
                        title={page.status === "published" ? "Jadikan Draft" : "Publish"}>
                  {page.status === "published"
                    ? <Eye className="h-4 w-4 text-green-600" />
                    : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(page)}
                        data-testid={`edit-page-${page.id}`}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive"
                        onClick={() => setDeleteId(page.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>{editing ? "Edit Halaman" : "Buat Halaman Baru"}</span>
              <div className="flex items-center gap-2">
                {editing && form.status === "published" && (
                  <a href={`/pages/${form.slug}`} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" /> Preview
                    </Button>
                  </a>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="w-full px-6 pt-3 pb-0 h-auto bg-transparent border-b rounded-none justify-start gap-0">
                <TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Konten &amp; Blok</TabsTrigger>
                <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Pengaturan</TabsTrigger>
                <TabsTrigger value="seo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">SEO</TabsTrigger>
              </TabsList>

              {/* Content tab */}
              <TabsContent value="content" className="p-6 space-y-4 mt-0">
                <div className="space-y-1">
                  <Label>Judul Halaman *</Label>
                  <Input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                         placeholder="Halaman Promo Lebaran 2026" data-testid="page-title-input" />
                </div>
                <div className="space-y-1">
                  <Label>Deskripsi (opsional)</Label>
                  <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                            placeholder="Deskripsi singkat halaman..." />
                </div>

                <Separator />

                {/* Block list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Blok Konten ({(form.blocks || []).length})</Label>
                    <Button variant="outline" size="sm" onClick={() => setAddBlockOpen(true)}
                            data-testid="add-block-btn">
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Tambah Blok
                    </Button>
                  </div>

                  {(form.blocks || []).length === 0 && (
                    <div className="border-2 border-dashed rounded-xl p-8 text-center">
                      <LayoutTemplate className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                      <p className="text-sm text-muted-foreground">Belum ada blok. Klik Tambah Blok untuk mulai membangun halaman.</p>
                      <Button className="mt-3" variant="outline" size="sm" onClick={() => setAddBlockOpen(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Tambah Blok Pertama
                      </Button>
                    </div>
                  )}

                  {(form.blocks || []).map((block, idx) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      index={idx}
                      total={form.blocks.length}
                      onChange={updated => updateBlock(idx, updated)}
                      onDelete={() => deleteBlock(idx)}
                      onMoveUp={() => moveBlock(idx, -1)}
                      onMoveDown={() => moveBlock(idx, 1)}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Settings tab */}
              <TabsContent value="settings" className="p-6 space-y-4 mt-0">
                <div className="space-y-1">
                  <Label>Slug URL *</Label>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">/pages/</span>
                    <Input
                      value={form.slug}
                      onChange={e => { setSlugManual(true); setForm(f => ({...f, slug: e.target.value})); }}
                      placeholder="nama-halaman"
                      className="flex-1 font-mono text-sm"
                      data-testid="page-slug-input"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">URL publik: /pages/{form.slug || "..."}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Label>Status</Label>
                  <Switch checked={form.status === "published"}
                          onCheckedChange={v => setForm(f => ({...f, status: v ? "published" : "draft"}))} />
                  <span className="text-sm">{form.status === "published" ? "Published" : "Draft"}</span>
                </div>
              </TabsContent>

              {/* SEO tab */}
              <TabsContent value="seo" className="p-6 mt-0">
                <CMSSEOFields form={form} onChange={handleSEOChange} />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-page-btn">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Block Dialog */}
      <Dialog open={addBlockOpen} onOpenChange={setAddBlockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Tipe Blok</DialogTitle>
            <DialogDescription>Pilih jenis blok konten yang ingin ditambahkan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {BLOCK_TYPES.map(bt => {
              const Icon = bt.icon;
              return (
                <button key={bt.id}
                        onClick={() => addBlock(bt.id)}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 text-left transition-colors"
                        data-testid={`add-block-${bt.id}`}>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{bt.label}</div>
                    <div className="text-xs text-muted-foreground">{bt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Halaman?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
