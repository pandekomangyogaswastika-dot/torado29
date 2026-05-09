import { useState } from "react";
import { Calendar, CheckCircle2, AlertTriangle, ArrowRight, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClosingWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: "validation",
      title: "Sales Validation",
      description: "Validate all pending daily sales for the period",
      icon: CheckCircle2,
      status: "pending",
    },
    {
      id: "recon",
      title: "Bank Reconciliation",
      description: "Ensure all bank transactions are reconciled",
      icon: CheckCircle2,
      status: "pending",
    },
    {
      id: "review",
      title: "GL Review",
      description: "Review trial balance and journal entries",
      icon: AlertTriangle,
      status: "pending",
    },
    {
      id: "lock",
      title: "Lock Period",
      description: "Lock period to prevent further modifications",
      icon: Lock,
      status: "pending",
    },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="finance-closing-wizard">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Period Closing Wizard</h1>
        <p className="text-sm text-muted-foreground">
          Step-by-step guide untuk menutup periode accounting dengan checklist compliance
        </p>
      </div>

      {/* Coming Soon Alert */}
      <Alert className="border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>🚧 Coming Soon:</strong> Full period closing wizard dengan automated validations sedang dalam development.
          Untuk saat ini, gunakan manual checklist di bawah.
        </AlertDescription>
      </Alert>

      {/* Wizard Steps */}
      <div className="grid gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <Card
              key={step.id}
              className={`p-4 transition-all ${
                isActive ? "ring-2 ring-primary" : ""
              } ${isCompleted ? "opacity-75" : ""}`}
              data-testid={`closing-step-${step.id}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-full p-3 ${
                    isCompleted
                      ? "bg-green-500/15 text-green-600"
                      : isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">
                      {index + 1}. {step.title}
                    </h3>
                    {isCompleted && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-300">
                        Completed
                      </span>
                    )}
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {isActive && (
                  <Button size="sm" variant="outline" disabled>
                    Start Check
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Manual Checklist */}
      <Card className="p-6 mt-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Manual Closing Checklist
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" id="check-1" />
            <label htmlFor="check-1" className="cursor-pointer">
              Semua Daily Sales sudah divalidasi dan tidak ada status "draft" atau "submitted"
            </label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" id="check-2" />
            <label htmlFor="check-2" className="cursor-pointer">
              Bank Reconciliation selesai untuk semua akun bank
            </label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" id="check-3" />
            <label htmlFor="check-3" className="cursor-pointer">
              Trial Balance balance (Debit = Credit)
            </label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" id="check-4" />
            <label htmlFor="check-4" className="cursor-pointer">
              Tidak ada anomaly critical di Anomaly Feed
            </label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" id="check-5" />
            <label htmlFor="check-5" className="cursor-pointer">
              P&L dan Balance Sheet sudah direview oleh Finance Manager
            </label>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" disabled>
            <Lock className="h-4 w-4 mr-2" />
            Lock Period (Manual)
          </Button>
          <Button variant="ghost" asChild>
            <a href="/finance/periods">
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Periods
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
