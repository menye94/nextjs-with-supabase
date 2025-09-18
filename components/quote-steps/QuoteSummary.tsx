"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Users, 
  MapPin, 
  Bed, 
  Wrench, 
  Car, 
  Plus,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { QuoteData } from "@/app/quote-create/page";

interface QuoteSummaryProps {
  quoteData: QuoteData;
}

export function QuoteSummary({ quoteData }: QuoteSummaryProps) {
  const calculateTotalsByCurrency = () => {
    let usdTotal = 0;
    let tzsTotal = 0;
    
    // Parks total by currency
    quoteData.selectedParks.forEach(park => {
      const amount = park.price * park.duration * park.pax;
      if (park.currency === 'USD') {
        usdTotal += amount;
      } else if (park.currency === 'TZS') {
        tzsTotal += amount;
      }
    });
    
    // Hotels total by currency
    quoteData.selectedHotels.forEach(hotel => {
      const amount = hotel.price * hotel.nights * hotel.pax;
      if (hotel.currency === 'USD') {
        usdTotal += amount;
      } else if (hotel.currency === 'TZS') {
        tzsTotal += amount;
      }
    });
    
    // Equipment total by currency
    quoteData.selectedEquipment.forEach(equipment => {
      const amount = equipment.price * equipment.quantity * equipment.duration;
      if (equipment.currency === 'USD') {
        usdTotal += amount;
      } else if (equipment.currency === 'TZS') {
        tzsTotal += amount;
      }
    });
    
    // Transport total by currency
    quoteData.selectedTransport.forEach(transport => {
      const amount = transport.price * transport.pax;
      if (transport.currency === 'USD') {
        usdTotal += amount;
      } else if (transport.currency === 'TZS') {
        tzsTotal += amount;
      }
    });
    
    // Additional services total by currency
    quoteData.additionalServices.forEach(service => {
      if (service.currency === 'USD') {
        usdTotal += service.price;
      } else if (service.currency === 'TZS') {
        tzsTotal += service.price;
      }
    });
    
    return { usdTotal, tzsTotal };
  };

  const formatCurrency = (amount: number) => {
    return quoteData.currency === 'USD' 
      ? `$${amount.toFixed(2)}`
      : `TZS ${amount.toLocaleString()}`;
  };

  const calculateTripDuration = () => {
    if (!quoteData.startDate || !quoteData.endDate) return 0;
    const start = new Date(quoteData.startDate);
    const end = new Date(quoteData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const { usdTotal, tzsTotal } = calculateTotalsByCurrency();

  return (
    <div className="space-y-2">
      {/* Quote Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {/* Client Info */}
          {quoteData.clientName && (
            <div className="space-y-1">
              <h4 className="font-medium text-xs text-gray-700">Client</h4>
              <p className="text-xs">{quoteData.clientName}</p>
              {quoteData.clientCountry && (
                <p className="text-xs text-gray-500">{quoteData.clientCountry}</p>
              )}
            </div>
          )}

          {/* Trip Details */}
          <div className="space-y-1">
            <h4 className="font-medium text-xs text-gray-700">Trip Details</h4>
            <div className="space-y-1 text-xs">
              {quoteData.startDate && quoteData.endDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span>
                    {new Date(quoteData.startDate).toLocaleDateString()} - {new Date(quoteData.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-400" />
                <span>{quoteData.adults + quoteData.children} travelers</span>
              </div>
              {calculateTripDuration() > 0 && (
                <div className="text-xs text-gray-500">
                  {calculateTripDuration()} days duration
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Breakdown */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs text-gray-700">Breakdown</h4>
            
            {/* Parks */}
            {quoteData.selectedParks.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span>Parks & Activities</span>
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {quoteData.selectedParks.length}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs ml-4">
                  {(() => {
                    const usdParks = quoteData.selectedParks.filter(park => park.currency === 'USD');
                    const tzsParks = quoteData.selectedParks.filter(park => park.currency === 'TZS');
                    const usdTotal = usdParks.reduce((sum, park) => sum + (park.price * park.duration * park.pax), 0);
                    const tzsTotal = tzsParks.reduce((sum, park) => sum + (park.price * park.duration * park.pax), 0);
                    
                    return (
                      <>
                        {usdTotal > 0 && <span className="text-green-600">USD: ${usdTotal.toFixed(2)}</span>}
                        {tzsTotal > 0 && <span className="text-blue-600">TZS: {tzsTotal.toLocaleString()}</span>}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Hotels */}
            {quoteData.selectedHotels.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <Bed className="h-3 w-3 text-gray-400" />
                    <span>Accommodation</span>
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {quoteData.selectedHotels.length}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs ml-4">
                  {(() => {
                    const usdHotels = quoteData.selectedHotels.filter(hotel => hotel.currency === 'USD');
                    const tzsHotels = quoteData.selectedHotels.filter(hotel => hotel.currency === 'TZS');
                    const usdTotal = usdHotels.reduce((sum, hotel) => sum + (hotel.price * hotel.nights * hotel.pax), 0);
                    const tzsTotal = tzsHotels.reduce((sum, hotel) => sum + (hotel.price * hotel.nights * hotel.pax), 0);
                    
                    return (
                      <>
                        {usdTotal > 0 && <span className="text-green-600">USD: ${usdTotal.toFixed(2)}</span>}
                        {tzsTotal > 0 && <span className="text-blue-600">TZS: {tzsTotal.toLocaleString()}</span>}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Equipment */}
            {quoteData.selectedEquipment.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-gray-400" />
                    <span>Equipment</span>
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {quoteData.selectedEquipment.length}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs ml-4">
                  {(() => {
                    const usdEquipment = quoteData.selectedEquipment.filter(equipment => equipment.currency === 'USD');
                    const tzsEquipment = quoteData.selectedEquipment.filter(equipment => equipment.currency === 'TZS');
                    const usdTotal = usdEquipment.reduce((sum, equipment) => sum + (equipment.price * equipment.quantity * equipment.duration), 0);
                    const tzsTotal = tzsEquipment.reduce((sum, equipment) => sum + (equipment.price * equipment.quantity * equipment.duration), 0);
                    
                    return (
                      <>
                        {usdTotal > 0 && <span className="text-green-600">USD: ${usdTotal.toFixed(2)}</span>}
                        {tzsTotal > 0 && <span className="text-blue-600">TZS: {tzsTotal.toLocaleString()}</span>}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Transport */}
            {quoteData.selectedTransport.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-gray-400" />
                    <span>Transport</span>
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {quoteData.selectedTransport.length}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs ml-4">
                  {(() => {
                    const usdTransport = quoteData.selectedTransport.filter(transport => transport.currency === 'USD');
                    const tzsTransport = quoteData.selectedTransport.filter(transport => transport.currency === 'TZS');
                    const usdTotal = usdTransport.reduce((sum, transport) => sum + (transport.price * transport.pax), 0);
                    const tzsTotal = tzsTransport.reduce((sum, transport) => sum + (transport.price * transport.pax), 0);
                    
                    return (
                      <>
                        {usdTotal > 0 && <span className="text-green-600">USD: ${usdTotal.toFixed(2)}</span>}
                        {tzsTotal > 0 && <span className="text-blue-600">TZS: {tzsTotal.toLocaleString()}</span>}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Additional Services */}
            {quoteData.additionalServices.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <Plus className="h-3 w-3 text-gray-400" />
                    <span>Additional Services</span>
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {quoteData.additionalServices.length}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs ml-4">
                  {(() => {
                    const usdServices = quoteData.additionalServices.filter(service => service.currency === 'USD');
                    const tzsServices = quoteData.additionalServices.filter(service => service.currency === 'TZS');
                    const usdTotal = usdServices.reduce((sum, service) => sum + service.price, 0);
                    const tzsTotal = tzsServices.reduce((sum, service) => sum + service.price, 0);
                    
                    return (
                      <>
                        {usdTotal > 0 && <span className="text-green-600">USD: ${usdTotal.toFixed(2)}</span>}
                        {tzsTotal > 0 && <span className="text-blue-600">TZS: {tzsTotal.toLocaleString()}</span>}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Total by Currency */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Total</span>
            </div>
            <div className="space-y-1 ml-2">
              {usdTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">USD Total:</span>
                  <span className="text-sm font-bold text-green-600">
                    ${usdTotal.toFixed(2)}
                  </span>
                </div>
              )}
              {tzsTotal > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">TZS Total:</span>
                  <span className="text-sm font-bold text-blue-600">
                    TZS {tzsTotal.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
