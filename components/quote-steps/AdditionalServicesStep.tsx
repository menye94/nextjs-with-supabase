"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteData } from "@/app/quote-create/page";

interface AdditionalServicesStepProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

export function AdditionalServicesStep({ quoteData, updateQuoteData, errors, setErrors }: AdditionalServicesStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Additional Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Extra services and add-ons will be implemented here.</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              This step will include:
            </p>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• Travel insurance</li>
              <li>• Visa assistance</li>
              <li>• Photography services</li>
              <li>• Special dietary requirements</li>
              <li>• Emergency contacts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
