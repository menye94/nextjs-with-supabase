'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Download, Calendar, User, Mail, MapPin, Receipt } from 'lucide-react';
import Link from 'next/link';
// Simple date formatting function to avoid date-fns dependency
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

interface Offer {
  id: number;
  offer_code: string;
  offer_name: string;
  time_created: string;
  active_from: string;
  active_to: string | null;
  accepted: boolean | null;
  client_id: number;
  client?: {
    cus_first_name: string;
    cus_last_name: string;
    cus_email_address: string;
    countries?: {
      country_name: string;
    };
  };
}

interface ParkService {
  id: number;
  park_name: string;
  entry_type: string;
  age_group: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface HotelService {
  id: number;
  hotel_name: string;
  room_type: string;
  meal_plan: string;
  nights: number;
  unit_price: number;
  total_price: number;
}

interface EquipmentService {
  id: number;
  equipment_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TransportService {
  id: number;
  transport_type: string;
  route: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function QuoteDetailPage() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [parkServices, setParkServices] = useState<ParkService[]>([]);
  const [hotelServices, setHotelServices] = useState<HotelService[]>([]);
  const [equipmentServices, setEquipmentServices] = useState<EquipmentService[]>([]);
  const [transportServices, setTransportServices] = useState<TransportService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      fetchOfferDetails(params.id as string);
    }
  }, [params.id]);

  const fetchOfferDetails = async (offerId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch offer details
      const { data: offerData, error: offerError } = await supabase
        .from('offer')
        .select(`
          *,
          client:customers(
            cus_first_name, 
            cus_last_name, 
            cus_email_address, 
            countries(country_name)
          )
        `)
        .eq('id', offerId)
        .single();

      if (offerError) {
        console.error('Error fetching offer:', offerError);
        setError('Failed to load offer details');
        return;
      }

      setOffer(offerData);

      // Fetch all services
      const [parkData, hotelData, equipmentData, transportData] = await Promise.all([
        supabase.from('offer_park_services').select('*').eq('offer_id', offerId),
        supabase.from('offer_hotel_services').select('*').eq('offer_id', offerId),
        supabase.from('offer_equipment_services').select('*').eq('offer_id', offerId),
        supabase.from('offer_transport_services').select('*').eq('offer_id', offerId)
      ]);

      setParkServices(parkData.data || []);
      setHotelServices(hotelData.data || []);
      setEquipmentServices(equipmentData.data || []);
      setTransportServices(transportData.data || []);

    } catch (error) {
      console.error('Error fetching offer details:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (offer: Offer) => {
    if (offer.accepted) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
    }
    
    const today = new Date();
    const activeFrom = new Date(offer.active_from);
    const activeTo = offer.active_to ? new Date(offer.active_to) : null;
    
    if (activeTo && today > activeTo) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Expired</Badge>;
    }
    
    if (today >= activeFrom) {
      return <Badge variant="outline" className="border-blue-200 text-blue-800">Active</Badge>;
    }
    
    return <Badge variant="outline" className="border-yellow-200 text-yellow-800">Pending</Badge>;
  };


  const calculateTotal = () => {
    const parkTotal = parkServices.reduce((sum, service) => sum + (service.total_price || 0), 0);
    const hotelTotal = hotelServices.reduce((sum, service) => sum + (service.total_price || 0), 0);
    const equipmentTotal = equipmentServices.reduce((sum, service) => sum + (service.total_price || 0), 0);
    const transportTotal = transportServices.reduce((sum, service) => sum + (service.total_price || 0), 0);
    
    return parkTotal + hotelTotal + equipmentTotal + transportTotal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Offer Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The offer you\'re looking for doesn\'t exist.'}</p>
          <Link href="/quotes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/quotes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{offer.offer_name}</h1>
              <p className="text-gray-600">Offer Code: {offer.offer_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(offer)}
            <Link href={`/quote-create?edit=${offer.id}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Client Name</label>
                    <p className="text-gray-900">{offer.client ? `${offer.client.cus_first_name} ${offer.client.cus_last_name}` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{offer.client?.cus_email_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="text-gray-900">{offer.client?.countries?.country_name || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Trip Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-gray-900">{formatDate(offer.active_from)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-gray-900">{offer.active_to ? formatDate(offer.active_to) : 'Open'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            {parkServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    National Parks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parkServices.map((service) => (
                      <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{service.park_name}</p>
                          <p className="text-sm text-gray-600">{service.entry_type} - {service.age_group}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${service.total_price?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-gray-600">Qty: {service.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hotelServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Accommodation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hotelServices.map((service) => (
                      <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{service.hotel_name}</p>
                          <p className="text-sm text-gray-600">{service.room_type} - {service.meal_plan}</p>
                          <p className="text-sm text-gray-600">{service.nights} nights</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${service.total_price?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {equipmentServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {equipmentServices.map((service) => (
                      <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{service.equipment_name}</p>
                          <p className="text-sm text-gray-600">Qty: {service.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${service.total_price?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {transportServices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Transport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transportServices.map((service) => (
                      <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{service.transport_type}</p>
                          <p className="text-sm text-gray-600">{service.route}</p>
                          <p className="text-sm text-gray-600">Qty: {service.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${service.total_price?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Parks</span>
                    <span>${parkServices.reduce((sum, s) => sum + (s.total_price || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accommodation</span>
                    <span>${hotelServices.reduce((sum, s) => sum + (s.total_price || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipment</span>
                    <span>${equipmentServices.reduce((sum, s) => sum + (s.total_price || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport</span>
                    <span>${transportServices.reduce((sum, s) => sum + (s.total_price || 0), 0).toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Offer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-gray-900">{formatDate(offer.time_created)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(offer)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
