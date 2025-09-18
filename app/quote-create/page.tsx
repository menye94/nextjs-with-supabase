"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Step Components
import { ClientTripStep } from "@/components/quote-steps/ClientTripStep";
import { ParksStep } from "@/components/quote-steps/ParksStep";
import { AccommodationStep } from "@/components/quote-steps/AccommodationStep";
import { EquipmentStep } from "@/components/quote-steps/EquipmentStep";
import { TransportStep } from "@/components/quote-steps/TransportStep";
import { AdditionalServicesStep } from "@/components/quote-steps/AdditionalServicesStep";
import { ReviewStep } from "@/components/quote-steps/ReviewStep";
import { QuoteSummary } from "@/components/quote-steps/QuoteSummary";

// Types
export interface QuoteData {
  // Step 1: Client & Trip
  clientId?: string;
  clientName: string;
  clientCountry: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  childAges: number[];
  tripType: string;
  offerId?: string; // Store the created offer ID
  
  // Step 2: Parks
  selectedParks: ParkSelection[];
  
  // Step 3: Accommodation
  selectedHotels: HotelSelection[];
  
  // Step 4: Equipment
  selectedEquipment: EquipmentSelection[];
  
  // Step 5: Transport
  selectedTransport: TransportSelection[];
  
  // Step 6: Additional Services
  additionalServices: AdditionalService[];
  
  // Metadata
  currency: 'USD' | 'TZS';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParkSelection {
  id: string;
  parkId: number;
  parkName: string;
  productName: string;
  category: string;
  entryType: string;
  duration: number;
  pax: number;
  price: number;
  currency: 'USD' | 'TZS';
}

export interface HotelSelection {
  id: string;
  hotelId: number;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pax: number;
  price: number;
  currency: 'USD' | 'TZS';
}

export interface EquipmentSelection {
  id: string;
  equipmentId: number;
  equipmentName: string;
  category: string;
  quantity: number;
  duration: number;
  price: number;
  currency: 'USD' | 'TZS';
}

export interface TransportSelection {
  id: string;
  vehicleId: number;
  vehicleName: string;
  from: string;
  to: string;
  date: string;
  pax: number;
  price: number;
  currency: 'USD' | 'TZS';
}

export interface AdditionalService {
  id: string;
  serviceName: string;
  description: string;
  price: number;
  currency: 'USD' | 'TZS';
}

const STEPS = [
  { id: 'client-trip', title: 'Client & Trip', description: 'Basic trip information' },
  { id: 'parks', title: 'Parks & Activities', description: 'National parks and activities' },
  { id: 'accommodation', title: 'Accommodation', description: 'Hotels and lodging' },
  { id: 'equipment', title: 'Equipment', description: 'Gear and equipment rental' },
  { id: 'transport', title: 'Transport', description: 'Vehicles and logistics' },
  { id: 'additional', title: 'Additional Services', description: 'Extra services and add-ons' },
  { id: 'review', title: 'Review & Confirm', description: 'Final review and confirmation' },
];

export default function QuoteCreatePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    clientName: '',
    clientCountry: '',
    startDate: '',
    endDate: '',
    adults: 1,
    children: 0,
    childAges: [],
    tripType: 'safari',
    selectedParks: [],
    selectedHotels: [],
    selectedEquipment: [],
    selectedTransport: [],
    additionalServices: [],
    currency: 'USD',
    totalAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          router.push('/auth/login');
          return;
        }
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/auth/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkUser();
  }, [supabase.auth, router]);

  // Load existing data if editing
  useEffect(() => {
    const loadExistingData = async () => {
      if (authLoading || !user) return;
      
      const editId = searchParams.get('edit');
      const draftId = searchParams.get('draft');
      
      if (editId || draftId) {
        setDataLoading(true);
        try {
          if (editId) {
            // Load existing offer
            const { data: offer, error: offerError } = await supabase
              .from('offer')
              .select(`
                *,
                client:customers(cus_first_name, cus_last_name, cus_email_address, country_id, countries(country_name))
              `)
              .eq('id', editId)
              .single();

            if (offerError) {
              console.error('Error loading offer:', offerError);
              return;
            }

            if (offer) {
              // Load offer services
              const [parkServices, hotelServices, equipmentServices, transportServices] = await Promise.all([
                supabase.from('offer_park_services').select('*').eq('offer_id', editId),
                supabase.from('offer_hotel_services').select('*').eq('offer_id', editId),
                supabase.from('offer_equipment_services').select('*').eq('offer_id', editId),
                supabase.from('offer_transport_services').select('*').eq('offer_id', editId)
              ]);

              // Transform offer data to quote data format
              const transformedData: QuoteData = {
                clientId: offer.client_id?.toString(),
                clientName: offer.client ? `${offer.client.cus_first_name} ${offer.client.cus_last_name}` : '',
                clientCountry: offer.client?.countries?.country_name || '',
                startDate: offer.active_from,
                endDate: offer.active_to || '',
                adults: 1, // Default, could be stored in offer
                children: 0, // Default, could be stored in offer
                childAges: [],
                tripType: 'safari',
                selectedParks: parkServices.data || [],
                selectedHotels: hotelServices.data || [],
                selectedEquipment: equipmentServices.data || [],
                selectedTransport: transportServices.data || [],
                additionalServices: [],
                currency: 'USD',
                totalAmount: 0,
                offerId: offer.id.toString(),
                createdAt: offer.time_created,
                updatedAt: offer.updated_at,
              };

              setQuoteData(transformedData);
            }
          } else if (draftId) {
            // Load existing draft
            const { data: draft, error: draftError } = await supabase
              .from('quote_drafts')
              .select('*')
              .eq('id', draftId)
              .single();

            if (draftError) {
              console.error('Error loading draft:', draftError);
              return;
            }

            if (draft && draft.data) {
              setQuoteData(draft.data as QuoteData);
            }
          }
        } catch (error) {
          console.error('Error loading existing data:', error);
        } finally {
          setDataLoading(false);
        }
      }
    };

    loadExistingData();
  }, [authLoading, user, searchParams, supabase]);

  // Auto-save functionality removed - offers are created immediately when moving to next step

  // Validate current step
  useEffect(() => {
    validateCurrentStep();
  }, [currentStep, quoteData]);

  const validateCurrentStep = () => {
    const stepErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0: // Client & Trip
        if (!quoteData.clientName) stepErrors.clientName = 'Client name is required';
        if (!quoteData.startDate) stepErrors.startDate = 'Start date is required';
        if (!quoteData.endDate) stepErrors.endDate = 'End date is required';
        if (!quoteData.clientCountry) stepErrors.clientCountry = 'Client country is required';
        if (quoteData.adults < 1) stepErrors.adults = 'At least 1 adult required';
        break;
      case 1: // Parks
        if (quoteData.selectedParks.length === 0) stepErrors.parks = 'At least one park selection is required';
        break;
      // Add validation for other steps as needed
    }
    
    setErrors(stepErrors);
    setIsValid(Object.keys(stepErrors).length === 0);
  };

  const addServicesToOffer = async (offerId: number) => {
    try {
      setIsLoading(true);
      
      // Clear existing services first (for updates)
      await clearExistingServices(offerId);
      
      // Add park services
      if (quoteData.selectedParks.length > 0) {
        await addParkServices(offerId, quoteData.selectedParks);
      }

      // Add hotel services
      if (quoteData.selectedHotels.length > 0) {
        await addHotelServices(offerId, quoteData.selectedHotels);
      }

      // Add equipment services
      if (quoteData.selectedEquipment.length > 0) {
        await addEquipmentServices(offerId, quoteData.selectedEquipment);
      }

      // Add transport services
      if (quoteData.selectedTransport.length > 0) {
        await addTransportServices(offerId, quoteData.selectedTransport);
      }

      // Add additional services
      if (quoteData.additionalServices.length > 0) {
        await addAdditionalServices(offerId, quoteData.additionalServices);
      }

    } catch (error) {
      console.error('Error adding services to offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearExistingServices = async (offerId: number) => {
    try {
      // Clear all existing services for this offer
      await Promise.all([
        supabase.from('offer_park_services').delete().eq('offer_id', offerId),
        supabase.from('offer_hotel_services').delete().eq('offer_id', offerId),
        supabase.from('offer_equipment_services').delete().eq('offer_id', offerId),
        supabase.from('offer_transport_services').delete().eq('offer_id', offerId),
        // Add additional services table when implemented
      ]);
      console.log('Cleared existing services for offer:', offerId);
    } catch (error) {
      console.error('Error clearing existing services:', error);
    }
  };

  const nextStep = async () => {
    if (isValid && currentStep < STEPS.length - 1) {
      // Create or update offer with basic information when moving to next step
      if (currentStep === 0) { // After client & trip step
        if (quoteData.offerId) {
          // Update existing offer
          await updateBasicOffer();
        } else {
          // Create new offer
          await createBasicOffer();
        }
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const createBasicOffer = async () => {
    try {
      setIsLoading(true);
      console.log('Starting offer creation...');
      
      // Get current user and company
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }
      console.log('User authenticated:', user.id);

      // Get user's company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (companyError || !company) {
        console.error('User company not found:', companyError);
        return;
      }
      console.log('Company found:', company.id);

      // Generate offer code
      const { data: offerCode, error: codeError } = await supabase
        .rpc('generate_offer_code');

      if (codeError || !offerCode) {
        console.error('Failed to generate offer code:', codeError);
        return;
      }
      console.log('Offer code generated:', offerCode);

      // Create offer name
      const offerName = `${quoteData.clientName} - ${quoteData.tripType.charAt(0).toUpperCase() + quoteData.tripType.slice(1)} Safari (${quoteData.startDate} to ${quoteData.endDate})`;
      console.log('Offer name:', offerName);

      // Create the basic offer record
      const offerData = {
        offer_code: offerCode,
        offer_name: offerName,
        client_id: parseInt(quoteData.clientId || '0'),
        active_from: quoteData.startDate,
        active_to: quoteData.endDate,
        owner_id: company.id,
        accepted: false,
      };
      console.log('Attempting to create offer with data:', offerData);

      const { data: offer, error: offerError } = await supabase
        .from('offer')
        .insert(offerData)
        .select()
        .single();

      if (offerError || !offer) {
        console.error('Failed to create offer:', offerError);
        console.error('Offer data attempted:', {
          offer_code: offerCode,
          offer_name: offerName,
          client_id: parseInt(quoteData.clientId || '0'),
          active_from: quoteData.startDate,
          active_to: quoteData.endDate,
          owner_id: company.id,
          accepted: false,
        });
        return;
      }

      // Store the offer ID in quote data for later use
      updateQuoteData({ offerId: offer.id.toString() });
      
      console.log(`Basic offer created: ${offerCode} (ID: ${offer.id})`);
      
    } catch (error) {
      console.error('Error creating basic offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBasicOffer = async () => {
    try {
      setIsLoading(true);
      console.log('Updating existing offer...');
      
      if (!quoteData.offerId) {
        console.error('No offer ID provided for update');
        return;
      }

      // Create updated offer name
      const offerName = `${quoteData.clientName} - ${quoteData.tripType.charAt(0).toUpperCase() + quoteData.tripType.slice(1)} Safari (${quoteData.startDate} to ${quoteData.endDate})`;
      console.log('Updated offer name:', offerName);

      // Update the offer record
      const offerData = {
        offer_name: offerName,
        client_id: parseInt(quoteData.clientId || '0'),
        active_from: quoteData.startDate,
        active_to: quoteData.endDate,
      };
      console.log('Attempting to update offer with data:', offerData);

      const { data: offer, error: offerError } = await supabase
        .from('offer')
        .update(offerData)
        .eq('id', parseInt(quoteData.offerId))
        .select()
        .single();

      if (offerError || !offer) {
        console.error('Failed to update offer:', offerError);
        return;
      }

      console.log(`Offer updated: ${offer.offer_code} (ID: ${offer.id})`);
      
    } catch (error) {
      console.error('Error updating basic offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Service addition functions
  const addParkServices = async (offerId: number, parks: ParkSelection[]) => {
    for (const park of parks) {
      const { data: parkProductPrice, error } = await supabase
        .from('park_product_price')
        .select('id')
        .eq('park_product_id', park.parkId)
        .limit(1)
        .single();

      if (!error && parkProductPrice) {
        await supabase
          .from('offer_park_services')
          .insert({
            offer_id: offerId,
            park_product_price_id: parkProductPrice.id,
            price: park.price,
            discount_percent: 0,
            final_service_price: park.price,
            description: `${park.parkName} - ${park.category} (${park.entryType}) for ${park.duration} days`,
          });
      }
    }
  };

  const addHotelServices = async (offerId: number, hotels: HotelSelection[]) => {
    for (const hotel of hotels) {
      const { data: hotelRate, error } = await supabase
        .from('hotel_rates')
        .select('id')
        .eq('hotel_id', hotel.hotelId)
        .limit(1)
        .single();

      if (!error && hotelRate) {
        await supabase
          .from('offer_hotel_services')
          .insert({
            offer_id: offerId,
            hotel_rate_id: hotelRate.id,
            price: hotel.price,
            discount_percent: 0,
            final_service_price: hotel.price,
            description: `${hotel.hotelName} - ${hotel.roomType} (${hotel.nights} nights)`,
          });
      }
    }
  };

  const addEquipmentServices = async (offerId: number, equipment: EquipmentSelection[]) => {
    for (const item of equipment) {
      await supabase
        .from('offer_equipment_services')
        .insert({
          offer_id: offerId,
          equipment_id: item.equipmentId,
          price: item.price,
          discount_percent: 0,
          final_service_price: item.price,
          description: `${item.equipmentName} - ${item.category} (${item.quantity}x for ${item.duration} days)`,
        });
    }
  };

  const addTransportServices = async (offerId: number, transport: TransportSelection[]) => {
    for (const item of transport) {
      const { data: transportService, error } = await supabase
        .from('transport_services')
        .select('id')
        .eq('id', item.vehicleId)
        .limit(1)
        .single();

      if (!error && transportService) {
        await supabase
          .from('offer_transport_services')
          .insert({
            offer_id: offerId,
            transport_service_id: transportService.id,
            price: item.price,
            discount_percent: 0,
            final_service_price: item.price,
            description: `${item.vehicleName} from ${item.from} to ${item.to} on ${item.date}`,
          });
      }
    }
  };

  const addAdditionalServices = async (offerId: number, services: AdditionalService[]) => {
    // For additional services, we might need to create a generic service table
    // or map them to existing service types
    console.log('Additional services not yet implemented:', services);
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex);
    }
  };

  const updateQuoteData = (updates: Partial<QuoteData>) => {
    setQuoteData(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const renderCurrentStep = () => {
    const stepProps = {
      quoteData,
      updateQuoteData,
      errors,
      setErrors,
    };

    switch (currentStep) {
      case 0:
        return <ClientTripStep {...stepProps} />;
      case 1:
        return <ParksStep {...stepProps} />;
      case 2:
        return <AccommodationStep {...stepProps} />;
      case 3:
        return <EquipmentStep {...stepProps} />;
      case 4:
        return <TransportStep {...stepProps} />;
      case 5:
        return <AdditionalServicesStep {...stepProps} />;
      case 6:
        return <ReviewStep {...stepProps} />;
      default:
        return <ClientTripStep {...stepProps} />;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Show loading state while checking authentication or loading data
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Quote</h1>
          <p className="text-gray-600 mt-2">Build a comprehensive quote for your safari adventure</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Navigation - Top */}
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={cn(
                  "text-center p-2 rounded-md transition-colors",
                  currentStep === index
                    ? "bg-blue-50 border border-blue-200 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700 border border-transparent"
                )}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    currentStep === index
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {index + 1}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-xs">{step.title}</div>
                    <div className="text-xs text-gray-500 hidden lg:block">{step.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Quote Summary */}
          <div className="lg:col-span-1 relative z-0">
            <QuoteSummary quoteData={quoteData} />
          </div>

          {/* Main Content - Right */}
          <div className="lg:col-span-3 relative z-10">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{STEPS[currentStep].title}</span>
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating offer...</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderCurrentStep()}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="flex space-x-2">
                {currentStep === STEPS.length - 1 ? (
                  <Button 
                    onClick={async () => {
                      // Add services to the existing offer
                      if (quoteData.offerId) {
                        await addServicesToOffer(parseInt(quoteData.offerId));
                        console.log(`Offer completed: ${quoteData.offerId}`);
                        router.push(`/offers/${quoteData.offerId}`);
                      }
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Complete Offer</span>
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    disabled={!isValid || isLoading}
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
