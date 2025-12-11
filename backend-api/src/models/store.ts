export interface Store {
  id: string
  name: string
  slug: string
  website_url: string | null
  logo_url: string | null
  description: string | null
  verified: boolean
  active: boolean
  delivery_available: boolean
  delivery_fee: number | null
  min_order_amount: number | null
  created_at: Date
  updated_at: Date
}

export interface ProductPrice {
  id: string
  product_id: string
  store_id: string
  package_id: string | null
  price: number
  currency: string
  discount_price: number | null
  discount_percentage: number | null
  in_stock: boolean
  stock_quantity: number | null
  last_checked_at: Date
  created_at: Date
  updated_at: Date
}

export interface ProductPackage {
  id: string
  product_id: string
  weight_grams: number | null
  servings: number | null
  package_type: string | null
  barcode: string | null
  created_at: Date
  updated_at: Date
}

export interface PriceComparison {
  store: Store
  price: ProductPrice
  package: ProductPackage | null
  total_cost: number
  delivery_cost: number
  final_cost: number
}

export interface ShoppingList {
  id: string
  user_id: string
  plan_id: string | null
  name: string | null
  total_cost: number | null
  estimated_duration_days: number | null
  created_at: Date
  updated_at: Date
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  product_id: string
  package_id: string | null
  store_id: string | null
  required_quantity: number
  package_quantity: number
  daily_dosage: number | null
  frequency_per_week: number | null
  duration_days: number | null
  unit_price: number | null
  total_price: number | null
  created_at: Date
}

