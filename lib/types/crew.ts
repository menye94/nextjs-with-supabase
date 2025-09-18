export interface CrewCategory {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CrewProduct {
  id: number;
  category_id: number;
  currency_id: number;
  tax_behavior: number;
  price: number;
  pricing_type_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CrewProductWithRelations extends CrewProduct {
  category?: CrewCategory;
  currency?: {
    id: number;
    currency_name: string;
  };
  tax_behavior_info?: {
    id: number;
    tax_behavior_name: string;
  };
  pricing_type?: {
    id: number;
    pricing_type_name: string;
  };
}

export interface CreateCrewCategoryRequest {
  name: string;
}

export interface UpdateCrewCategoryRequest {
  name?: string;
}

export interface CreateCrewProductRequest {
  category_id: number;
  currency_id: number;
  tax_behavior: number;
  price: number;
  pricing_type_id: number;
}

export interface UpdateCrewProductRequest {
  category_id?: number;
  currency_id?: number;
  tax_behavior?: number;
  price?: number;
  pricing_type_id?: number;
}
