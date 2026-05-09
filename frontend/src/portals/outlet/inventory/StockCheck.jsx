import { Package, AlertTriangle, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StockCheck() {
  return (
    <div className="p-6 space-y-6" data-testid="outlet-stock-check">
      <div>
        <h1 className="text-2xl font-bold mb-2">Stock Check</h1>
        <p className="text-sm text-muted-foreground">
          Check current stock levels dan lakukan stock opname
        </p>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>🚧 Coming Soon:</strong> Outlet Inventory module sedang dalam development. 
          Untuk saat ini, gunakan portal Inventory untuk stock management.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5" />
          <h3 className="font-semibold">Quick Stock Search</h3>
        </div>
        <div className="flex gap-3">
          <Input placeholder="Search item name or SKU..." disabled />
          <Button disabled>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Fitur yang akan tersedia:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Real-time stock level per outlet</li>
            <li>Barcode scanning untuk stock count</li>
            <li>Variance tracking dan adjustment</li>
            <li>Low stock alerts</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
