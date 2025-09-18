"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteData } from "@/app/quote-create/page";

interface TransportStepProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

export function TransportStep({ quoteData, updateQuoteData, errors, setErrors }: TransportStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transport & Logistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Vehicle selection and transport logistics will be implemented here.</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              This step will include:
            </p>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>• Vehicle selection (4x4, minibus, etc.)</li>
              <li>• Driver/guide services</li>
              <li>• Airport transfers</li>
              <li>• Inter-park transportation</li>
              <li>• Route planning</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
