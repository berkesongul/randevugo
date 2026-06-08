// =============================================================================
// Randevigo — TypeScript Types
// =============================================================================
// Database types mirroring the Supabase/PostgreSQL schema.
// Keep in sync with supabase/migrations/*.sql
// =============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Profile-level role (owner, staff, or client) */
export type UserRole = 'owner' | 'staff' | 'client';

/** Tenant membership role */
export type MemberRole = 'owner' | 'staff';

/** Appointment lifecycle status */
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// ---------------------------------------------------------------------------
// Table Row Types
// ---------------------------------------------------------------------------

/** profiles — linked 1:1 to auth.users */
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/** tenants — business accounts */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  settings: TenantSettings;
  created_at: string;
  updated_at: string;
}

/** Typed tenant settings (extensible) */
export interface TenantSettings {
  timezone?: string;
  working_hours?: {
    [day: string]: { start: string; end: string } | null;
  };
  locale?: string;
  [key: string]: unknown;
}

/** tenant_members — bridge between profiles and tenants */
export interface TenantMember {
  id: string;
  tenant_id: string;
  profile_id: string;
  role: MemberRole;
  created_at: string;
}

/** services — bookable services offered by a tenant */
export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** staff — service providers within a tenant */
export interface Staff {
  id: string;
  tenant_id: string;
  profile_id: string;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** appointments — client bookings */
export interface Appointment {
  id: string;
  tenant_id: string;
  service_id: string;
  staff_id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Insert / Update helper types
// ---------------------------------------------------------------------------

/** Fields required to create a new tenant */
export type TenantInsert = Pick<Tenant, 'name' | 'slug'> &
  Partial<Pick<Tenant, 'settings'>>;

/** Fields required to create a new service */
export type ServiceInsert = Pick<Service, 'tenant_id' | 'name' | 'duration_minutes'> &
  Partial<Pick<Service, 'price' | 'is_active'>>;

/** Fields allowed when updating a service */
export type ServiceUpdate = Partial<
  Pick<Service, 'name' | 'duration_minutes' | 'price' | 'is_active'>
>;

/** Fields required to create a new staff member */
export type StaffInsert = Pick<Staff, 'tenant_id' | 'profile_id'> &
  Partial<Pick<Staff, 'bio' | 'is_active'>>;

/** Fields allowed when updating a staff member */
export type StaffUpdate = Partial<
  Pick<Staff, 'bio' | 'is_active'>
>;

/** Fields for booking an appointment */
export type AppointmentInsert = Pick<
  Appointment,
  'tenant_id' | 'service_id' | 'staff_id' | 'client_name' | 'start_time'
> &
  Partial<Pick<Appointment, 'client_phone' | 'client_email' | 'notes'>>;

/** Fields allowed when updating an appointment */
export type AppointmentUpdate = Partial<
  Pick<Appointment, 'start_time' | 'end_time' | 'status' | 'notes'>
>;

// ---------------------------------------------------------------------------
// Supabase Database type (for generic client typing)
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: Tenant;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          settings?: TenantSettings;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          owner_id?: string;
          settings?: TenantSettings;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenants_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      tenant_members: {
        Row: TenantMember;
        Insert: {
          id?: string;
          tenant_id: string;
          profile_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          tenant_id?: string;
          profile_id?: string;
          role?: MemberRole;
        };
        Relationships: [];
      };
      services: {
        Row: Service;
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          duration_minutes: number;
          price?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          name?: string;
          duration_minutes?: number;
          price?: number | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff: {
        Row: Staff;
        Insert: {
          id?: string;
          tenant_id: string;
          profile_id: string;
          bio?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          profile_id?: string;
          bio?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: Appointment;
        Insert: {
          id?: string;
          tenant_id: string;
          service_id: string;
          staff_id: string;
          client_name: string;
          client_phone?: string | null;
          client_email?: string | null;
          start_time: string;
          end_time: string;
          status?: AppointmentStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          service_id?: string;
          staff_id?: string;
          client_name?: string;
          client_phone?: string | null;
          client_email?: string | null;
          start_time?: string;
          end_time?: string;
          status?: AppointmentStatus;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_user_tenant_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      book_appointment: {
        Args: {
          p_tenant_id: string;
          p_service_id: string;
          p_staff_id: string;
          p_client_name: string;
          p_client_phone?: string;
          p_client_email?: string;
          p_start_time: string;
          p_notes?: string;
        };
        Returns: string;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
