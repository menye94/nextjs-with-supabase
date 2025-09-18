import { createClient } from "@/lib/supabase/client";
import { QuoteData, ParkSelection, HotelSelection, EquipmentSelection, TransportSelection, AdditionalService } from "@/app/quote-create/page";

export interface SaveOfferResult {
  success: boolean;
  offerId?: number;
  offerCode?: string;
  error?: string;
}

export async function saveQuoteAsOffer(quoteData: QuoteData): Promise<SaveOfferResult> {
  const supabase = createClient();

  try {
    // Get current user and company
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (companyError || !company) {
      return { success: false, error: 'User company not found' };
    }

    // Generate offer code
    const { data: offerCode, error: codeError } = await supabase
      .rpc('generate_offer_code');

    if (codeError || !offerCode) {
      return { success: false, error: 'Failed to generate offer code' };
    }

    // Create offer name
    const offerName = `${quoteData.clientName} - ${quoteData.tripType.charAt(0).toUpperCase() + quoteData.tripType.slice(1)} Safari (${quoteData.startDate} to ${quoteData.endDate})`;

    // Create the main offer record
    const { data: offer, error: offerError } = await supabase
      .from('offer')
      .insert({
        offer_code: offerCode,
        offer_name: offerName,
        client_id: parseInt(quoteData.clientId || '0'),
        active_from: quoteData.startDate,
        active_to: quoteData.endDate,
        owner_id: company.id,
        accepted: false,
      })
      .select()
      .single();

    if (offerError || !offer) {
      return { success: false, error: `Failed to create offer: ${offerError?.message}` };
    }

    const offerId = offer.id;

    // Save park services
    if (quoteData.selectedParks.length > 0) {
      await saveParkServices(supabase, offerId, quoteData.selectedParks);
    }

    // Save hotel services
    if (quoteData.selectedHotels.length > 0) {
      await saveHotelServices(supabase, offerId, quoteData.selectedHotels);
    }

    // Save equipment services
    if (quoteData.selectedEquipment.length > 0) {
      await saveEquipmentServices(supabase, offerId, quoteData.selectedEquipment);
    }

    // Save transport services
    if (quoteData.selectedTransport.length > 0) {
      await saveTransportServices(supabase, offerId, quoteData.selectedTransport);
    }

    // Save additional services (these might need to be mapped to existing service types)
    if (quoteData.additionalServices.length > 0) {
      await saveAdditionalServices(supabase, offerId, quoteData.additionalServices);
    }

    return {
      success: true,
      offerId,
      offerCode,
    };

  } catch (error) {
    console.error('Error saving quote as offer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

async function saveParkServices(supabase: any, offerId: number, parks: ParkSelection[]) {
  for (const park of parks) {
    // For now, we'll need to find the corresponding park_product_price_id
    // This is a simplified version - in reality, you'd need to match based on:
    // - parkId (national_park_id)
    // - category (park_category_id) 
    // - entryType (entry_type_id)
    // - age group, season, etc.
    
    const { data: parkProductPrice, error } = await supabase
      .from('park_product_price')
      .select('id')
      .eq('park_product_id', park.parkId) // This is simplified
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
}

async function saveHotelServices(supabase: any, offerId: number, hotels: HotelSelection[]) {
  for (const hotel of hotels) {
    // Find corresponding hotel_rate_id
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
}

async function saveEquipmentServices(supabase: any, offerId: number, equipment: EquipmentSelection[]) {
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
}

async function saveTransportServices(supabase: any, offerId: number, transport: TransportSelection[]) {
  for (const item of transport) {
    // Find corresponding transport_service_id
    const { data: transportService, error } = await supabase
      .from('transport_services')
      .select('id')
      .eq('id', item.vehicleId) // This is simplified
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
}

async function saveAdditionalServices(supabase: any, offerId: number, services: AdditionalService[]) {
  // For additional services, we might need to create a generic service table
  // or map them to existing service types
  // For now, we'll skip this or create a custom solution
  console.log('Additional services not yet implemented:', services);
}
