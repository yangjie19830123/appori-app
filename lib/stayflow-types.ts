export type PropertyType = 'minpaku' | 'hotel' | 'apartment'
export type Ownership    = 'owned' | 'lease'
export type RoomStatus   = 'active' | 'maintenance' | 'inactive'
export type OrderStatus  = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
export type CleanStatus  = 'pending' | 'scheduled' | 'done'
export type Platform     = 'booking' | 'airbnb' | 'direct' | 'other'
export type ContractType = 'equipment_full' | 'cleaning' | 'lease' | 'other'
export type EquipStatus  = 'normal' | 'needs_check' | 'broken' | 'disposed'
export type ExpenseCategory = 'equipment' | 'cleaning' | 'supplies' | 'lease' | 'other'
export type SeasonType   = 'peak' | 'off_peak' | 'super_peak'

export interface Property {
  id: string
  name: string
  address: string
  prefecture: string
  district: string | null
  property_type: PropertyType
  ownership: Ownership
  platform: string[]
  total_rooms: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  property_id: string
  room_number: string
  floor_plan: string | null
  area_sqm: number | null
  capacity: number
  status: RoomStatus
  description: string | null
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  property_id: string
  room_id: string | null
  contract_id: string | null
  name: string
  brand: string | null
  model_number: string | null
  serial_number: string | null
  purchase_date: string | null
  warranty_expiry: string | null
  status: EquipStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplyInventory {
  id: string
  property_id: string
  item_name: string
  unit: string
  current_stock: number
  warning_level: number
  last_restocked_at: string | null
  updated_at: string
}

export interface Order {
  id: string
  property_id: string
  room_id: string
  external_id: string | null
  platform: Platform
  checkin_date: string
  checkout_date: string
  guests: number
  amount: number
  status: OrderStatus
  cleaning_status: CleanStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  contract_type: ContractType
  company_name: string
  property_id: string | null
  target_rooms: string | null
  monthly_fee: number | null
  per_visit_fee: number | null
  start_date: string
  end_date: string | null
  auto_renew: boolean
  alert_days: number
  status: string
  file_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface IncomeRecord {
  id: string
  order_id: string | null
  property_id: string
  room_id: string | null
  amount: number
  record_date: string
  platform: string | null
  notes: string | null
  created_at: string
}

export interface ExpenseRecord {
  id: string
  property_id: string | null
  contract_id: string | null
  category: ExpenseCategory
  amount: number
  record_date: string
  description: string | null
  created_at: string
}

export interface EventReminder {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string | null
  season_type: SeasonType | null
  alert_days: number
  is_recurring: boolean
  notes: string | null
  created_at: string
}