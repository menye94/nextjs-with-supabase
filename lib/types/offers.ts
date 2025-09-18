export interface Offer {
  id: number;
  offer_code: string;
  offer_name: string;
  active_from: string;
  active_to: string;
  time_accepted?: string;
  accepted?: boolean;
  promo_offer_id?: number;
  client_id: number; // Changed from agent_id and customer_id
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface OfferWithRelations extends Offer {
  client?: {
    id: number;
    cus_first_name: string;
    cus_last_name: string;
    cus_email_address: string;
  };
  promo_offer?: PromoOffer;
  owner?: {
    id: string;
    company_name: string;
  };
}

export interface PromoOffer {
  id: number;
  promo_offer_code: string;
  promo_offer_name: string;
  active_from: string;
  active_to?: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount?: number;
  min_order_amount: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface OfferService {
  id: number;
  offer_id: number;
  price: number;
  discount_percent: number;
  final_service_price: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OfferCrewService extends OfferService {
  crew_product_id: number;
  crew_product?: {
    id: number;
    name?: string;
    price: number;
    category?: {
      id: number;
      name: string;
    };
  };
}

export interface OfferHotelService extends OfferService {
  hotel_rate_id: number;
  hotel_rate?: {
    id: number;
    rate: number;
    hotel?: {
      id: number;
      hotel_name: string;
    };
    room?: {
      id: number;
      room_name: string;
    };
  };
}

export interface OfferTransportService extends OfferService {
  transport_service_id: number;
  transport_service?: {
    id: number;
    price: number;
    from_location?: {
      id: number;
      city_name: string;
    };
    to_location?: {
      id: number;
      city_name: string;
    };
  };
}

export interface OfferParkService extends OfferService {
  park_product_price_id: number;
  park_product_price?: {
    id: number;
    unit_amount: number;
    park_product?: {
      id: number;
      product_name: string;
      national_park?: {
        id: number;
        national_park_name: string;
      };
    };
  };
}

export interface OfferCampingService extends OfferService {
  camping_product_price_id: number;
  camping_product_price?: {
    id: number;
    unit_amount: number;
    camping_product?: {
      id: number;
      product_name: string;
      national_park?: {
        id: number;
        national_park_name: string;
      };
    };
  };
}

export interface OfferMotorVehicleService extends OfferService {
  motor_vehicle_product_price_id: number;
  motor_vehicle_product_price?: {
    id: number;
    unit_amount: number;
    motor_vehicle_product?: {
      id: number;
      park?: {
        id: number;
        national_park_name: string;
      };
    };
  };
}

export interface OfferEquipmentService extends OfferService {
  equipment_id: number;
  equipment?: {
    id: number;
    name: string;
    price: number;
    category?: {
      id: number;
      name: string;
    };
  };
}

export interface Contract {
  id: number;
  contract_code: string;
  customer_id: number;
  agent_id: number;
  offer_id: number;
  time_signed: string;
  total_price: number;
  payment_date?: string;
  paid: boolean;
  payment_time?: string;
  payment_amount?: number;
  refunded: boolean;
  refunded_time?: string;
  refunded_amount?: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContractWithRelations extends Contract {
  customer?: {
    id: number;
    cus_first_name?: string;
    cus_last_name?: string;
    cus_email_address?: string;
  };
  agent?: {
    id: number;
    agent_name: string;
    agent_code: string;
  };
  offer?: {
    id: number;
    offer_name: string;
    offer_code: string;
  };
}

export interface ContractService {
  id: number;
  contract_id: number;
  service_type: 'crew' | 'hotel' | 'transport' | 'park' | 'camping' | 'motor_vehicle' | 'equipment';
  service_id: number;
  original_price: number;
  final_price: number;
  discount_applied: number;
  quantity: number;
  total_amount: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Request/Response types
export interface CreateOfferRequest {
  offer_code: string;
  offer_name: string;
  active_from: string;
  active_to: string;
  time_accepted?: string;
  accepted?: boolean;
  promo_offer_id?: number;
  client_id: number; // Changed from agent_id and customer_id
  owner_id: string;
}

export interface UpdateOfferRequest {
  offer_code?: string;
  offer_name?: string;
  active_from?: string;
  active_to?: string;
  time_accepted?: string;
  accepted?: boolean;
  promo_offer_id?: number;
  client_id?: number; // Changed from agent_id and customer_id
  owner_id?: string;
}

export interface CreatePromoOfferRequest {
  promo_offer_name: string;
  active_from: string;
  active_to?: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount?: number;
  min_order_amount?: number;
  usage_limit?: number;
}

export interface UpdatePromoOfferRequest {
  promo_offer_name?: string;
  active_from?: string;
  active_to?: string;
  description?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  max_discount?: number;
  min_order_amount?: number;
  usage_limit?: number;
  is_active?: boolean;
}

export interface CreateContractRequest {
  customer_id: number;
  agent_id: number;
  offer_id: number;
  payment_date?: string;
  notes?: string;
}

export interface UpdateContractRequest {
  payment_date?: string;
  paid?: boolean;
  payment_amount?: number;
  status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
}

// Service addition types
export interface AddServiceToOfferRequest {
  service_type: 'crew' | 'hotel' | 'transport' | 'park' | 'camping' | 'motor_vehicle' | 'equipment';
  service_id: number;
  price: number;
  discount_percent?: number;
  description?: string;
}

export interface AddServiceToPromoOfferRequest {
  service_type: 'crew' | 'hotel' | 'transport';
  service_id: number;
  price: number;
  discount_percent?: number;
  description?: string;
}
