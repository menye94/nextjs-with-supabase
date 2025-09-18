"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Send, Edit } from "lucide-react";
import { QuoteData } from "@/app/quote-create/page";

interface ReviewStepProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

export function ReviewStep({ quoteData, updateQuoteData, errors, setErrors }: ReviewStepProps) {
  const calculateTotal = () => {
    let total = 0;
    
    total += quoteData.selectedParks.reduce((sum, park) => 
      sum + (park.price * park.duration * park.pax), 0
    );
    
    total += quoteData.selectedHotels.reduce((sum, hotel) => 
      sum + (hotel.price * hotel.nights * hotel.pax), 0
    );
    
    total += quoteData.selectedEquipment.reduce((sum, equipment) => 
      sum + (equipment.price * equipment.quantity * equipment.duration), 0
    );
    
    total += quoteData.selectedTransport.reduce((sum, transport) => 
      sum + (transport.price * transport.pax), 0
    );
    
    total += quoteData.additionalServices.reduce((sum, service) => 
      sum + service.price, 0
    );
    
    return total;
  };

  const formatCurrency = (amount: number) => {
    return quoteData.currency === 'USD' 
      ? `$${amount.toFixed(2)}`
      : `TZS ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quote Review & Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">Review your quote details and generate the final quote document.</p>
          
          <div className="space-y-4">
            {/* Client Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{quoteData.clientName || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Country:</span>
                  <span className="ml-2 font-medium">{quoteData.clientCountry || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Trip Dates:</span>
                  <span className="ml-2 font-medium">
                    {quoteData.startDate && quoteData.endDate 
                      ? `${new Date(quoteData.startDate).toLocaleDateString()} - ${new Date(quoteData.endDate).toLocaleDateString()}`
                      : 'Not specified'
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Travelers:</span>
                  <span className="ml-2 font-medium">
                    {quoteData.adults + quoteData.children} ({quoteData.adults} adults, {quoteData.children} children)
                  </span>
                </div>
              </div>
            </div>

            {/* Quote Summary */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Quote Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Parks & Activities:</span>
                  <span>{formatCurrency(quoteData.selectedParks.reduce((sum, park) => 
                    sum + (park.price * park.duration * park.pax), 0
                  ))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accommodation:</span>
                  <span>{formatCurrency(quoteData.selectedHotels.reduce((sum, hotel) => 
                    sum + (hotel.price * hotel.nights * hotel.pax), 0
                  ))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipment:</span>
                  <span>{formatCurrency(quoteData.selectedEquipment.reduce((sum, equipment) => 
                    sum + (equipment.price * equipment.quantity * equipment.duration), 0
                  ))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport:</span>
                  <span>{formatCurrency(quoteData.selectedTransport.reduce((sum, transport) => 
                    sum + (transport.price * transport.pax), 0
                  ))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Services:</span>
                  <span>{formatCurrency(quoteData.additionalServices.reduce((sum, service) => 
                    sum + service.price, 0
                  ))}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Generate PDF Quote
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Email Quote
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Quote
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
