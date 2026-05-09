import { ClipboardList, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UsageLog() {
  return (
    <div className="p-6 space-y-6" data-testid="outlet-usage-log">
      <div>
        <h1 className="text-2xl font-bold mb-2">Usage Log</h1>
        <p className="text-sm text-muted-foreground">
          Track daily ingredient usage dan waste
        </p>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>🚧 Coming Soon:</strong> Usage tracking module sedang dalam development.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5" />
          <h3 className="font-semibold">Daily Usage Entry</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Fitur yang akan tersedia:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Log daily ingredient usage</li>
            <li>Track waste dan spoilage</li>
            <li>Usage variance analysis vs theoretical</li>
            <li>Cost tracking per dish/period</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
