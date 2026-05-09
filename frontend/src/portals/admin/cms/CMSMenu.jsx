/**
 * CMS Menu Items — Sprint G Admin CMS
 */
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, UtensilsCrossed, Eye, EyeOff, Loader2, Copy, CheckSquare, Square } from "lucide-react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import ImageUpload from "@/components/shared/ImageUpload";
import CMSScheduleFields from "@/components/shared/CMSScheduleFields";

const EMPTY_FORM = {
  brand_id: "", code: "", category: "", name: "",
  description: "", price: "", image: "", tags: "",
  available: true, status: "published",
  publish_at: null, unpublish_at: null,
};

export default function CMSMenu() {
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [cloningId, setCloningId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [mR, bR] = await Promise.all([
        api.get("/admin/cms/menu"),
        api.get("/admin/cms/brands"),
      ]);
      setItems(mR.data?.data || []);
      setBrands(bR.data?.data || []);
    } catch { toast.error("Gagal memuat data"); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ ...item, tags: Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags || ""), price: item.price || "" });
    setFormOpen(true);
  };

  const handleClone = async (item) => {
    setCloningId(item.id);
    try {
      await api.post(`/admin/cms/menu/${item.id}/clone`);
      toast.success(`"${item.name}" berhasil di-clone sebagai Draft`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0]?.message || "Gagal clone menu");
    } finally {
      setCloningId(null);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nama menu wajib diisi"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await api.put(`/admin/cms/menu/${editing}`, payload);
        toast.success("Menu diperbarui");
      } else {
        await api.post("/admin/cms/menu", payload);
        toast.success("Menu ditambahkan");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0]?.message || "Gagal menyimpan");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/cms/menu/${deleteId}`);
      toast.success("Menu dihapus");
      setDeleteId(null);
      await load();
    } catch { toast.error("Gagal menghapus"); }
  };

  const handleBulkAction = async (action) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const r = await api.post("/admin/cms/menu/bulk-action", { action, ids: [...selected] });
      const res = r.data?.data;
      toast.success(`${res?.success?.length || 0} berhasil, ${res?.failed?.length || 0} gagal`);
      setSelected(new Set()); await load();
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0]?.message || "Bulk action gagal");
    } finally { setBulkLoading(false); }
  };

  const getBrandName = (id) => brands.find(b => b.id === id)?.name || id || "-";

  const filtered = items.filter(m => {
    const matchesBrand = filterBrand === "all" || m.brand_id === filterBrand;
    const matchesSearch = !searchQuery ||
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesBrand && matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(items.map(i => i.category))];

  // Group by brand then category
  const grouped = filtered.reduce((acc, item) => {
    const bName = getBrandName(item.brand_id);
    const key = `${bName} — ${item.category}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4" data-testid="cms-menu-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-xl font-bold">Menu Items</h3>
          <p className="text-sm text-muted-foreground">Kelola menu untuk setiap brand di halaman Menu website.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Semua Brand" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Brand</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} data-testid="create-menu-btn">
            <Plus className="h-4 w-4 mr-2" /> Tambah Menu
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <Input
          placeholder="Cari nama menu atau deskripsi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          data-testid="menu-search-input"
        />
        <div className="flex gap-2">
          <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Semua</Button>
          <Button variant={statusFilter === "published" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("published")}>Published</Button>
          <Button variant={statusFilter === "draft" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("draft")}>Draft</Button>
        </div>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Belum ada menu item.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupKey, groupItems]) => (
            <div key={groupKey}>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">{groupKey}</h4>
              <div className="border rounded-xl overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2">Nama</th>
                      <th className="text-left px-4 py-2 hidden sm:table-cell">Deskripsi</th>
                      <th className="text-right px-4 py-2">Harga</th>
                      <th className="text-center px-4 py-2">Tersedia</th>
                      <th className="text-center px-4 py-2">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupItems.map(item => (
                      <tr key={item.id} className="border-t hover:bg-muted/20"
                          data-testid={`menu-row-${item.id}`}>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell line-clamp-2">{item.description}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency ? formatCurrency(item.price) : `Rp ${(item.price||0).toLocaleString("id-ID")}`}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={item.available !== false ? "default" : "secondary"} className="text-xs">
                            {item.available !== false ? "Ya" : "Tidak"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-xs">
                            {item.status === "published" ? "Published" : "Draft"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7"
                              title="Clone sebagai Draft"
                              onClick={() => handleClone(item)}
                              disabled={cloningId === item.id}
                              data-testid={`clone-menu-${item.id}`}
                            >
                              {cloningId === item.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(item.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="menu-form-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Menu" : "Tambah Menu"}</DialogTitle>
            <DialogDescription>Item menu tampil di halaman Menu website compro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Brand *</Label>
                <Select value={form.brand_id} onValueChange={v => setForm(f=>({...f,brand_id:v}))}>
                  <SelectTrigger data-testid="menu-brand"><SelectValue placeholder="Pilih brand..." /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Kategori</Label>
                <Input value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} placeholder="Coffee, Brunch, Mains..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nama Menu *</Label>
              <Input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} data-testid="menu-name" />
            </div>
            <div className="space-y-1">
              <Label>Deskripsi</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Harga (Rp)</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} placeholder="65000" />
              </div>
            <div className="space-y-1">
              <Label>Tags</Label>
              <Input value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} placeholder="bestseller, signature" />
            </div>
            </div>
            <ImageUpload
              label="Foto Menu"
              value={form.image || ""}
              onChange={(url) => setForm(f => ({ ...f, image: url }))}
            />
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.available !== false}
                        onCheckedChange={v => setForm(f=>({...f,available:v}))} />
                <Label>Tersedia</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.status === "published"}
                        onCheckedChange={v => setForm(f=>({...f,status:v?"published":"draft"}))} />
                <Label>Published</Label>
              </div>
            </div>
            <Separator />
            <CMSScheduleFields
              form={form}
              onChange={(field, value) => setForm(f => ({ ...f, [field]: value }))}
              currentStatus={form.status}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-menu">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Menu Item?</AlertDialogTitle>
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
