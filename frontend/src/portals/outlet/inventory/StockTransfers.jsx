import { ArrowLeftRight, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StockTransfers() {
  return (
    <div className="p-6 space-y-6" data-testid="outlet-stock-transfers">
      <div>
        <h1 className="text-2xl font-bold mb-2">Stock Transfers</h1>
        <p className="text-sm text-muted-foreground">
          Request dan track inter-outlet stock transfers
        </p>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>🚧 Coming Soon:</strong> Stock transfer workflow sedang dalam development.
          Untuk saat ini, hubungi warehouse team untuk transfer requests.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            <h3 className="font-semibold">Transfer Requests</h3>
          </div>
          <Button disabled>New Transfer Request</Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Fitur yang akan tersedia:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Create transfer request antar outlet</li>
            <li>Track transfer status (requested, approved, in-transit, received)</li>
            <li>Auto-update stock balance setelah received</li>
            <li>Transfer history dan audit trail</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
