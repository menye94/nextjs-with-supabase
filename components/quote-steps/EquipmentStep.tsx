"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteData } from "@/app/quote-create/page";

interface EquipmentStepProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

export function EquipmentStep({ quoteData, updateQuoteData, errors, setErrors }: EquipmentStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipment & Gear</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Equipment rental and gear selection will be implemented here.</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              This step will include:
            </p>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• Equipment categories (binoculars, cameras, etc.)</li>
              <li>• Rental vs purchase options</li>
              <li>• Equipment company selection</li>
              <li>• Duration and quantities</li>
              <li>• Special equipment needs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
