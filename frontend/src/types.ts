/** Shared TypeScript types used across the frontend. */

export type Role = 'player' | 'field owner';
export type Condition = 'excellent' | 'good' | 'satisfactory' | 'poor';
export type TurfType = 'natural' | 'artificial';

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  city?: string;
}

export interface RegisterResponse {
  user_id: number;
  role: Role;
}

export interface Field {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  city: string;
  area_m2: number;
  construction_date: string;
  condition: Condition;
  turf_type: TurfType;
  turf_height_cm: number;
  photos: string[];
}

export interface BookingPayload {
  field_id: number;
  user_id: number;
  date: string;
}

export interface BookingResponse {
  id: number;
  field_id: number;
  user_id: number;
  date: string;
}