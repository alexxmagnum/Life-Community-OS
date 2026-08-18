/**
 * Persistence row shapes for Foundation identity tables.
 * Snake_case mirrors PostgreSQL columns.
 * Domain types in @life-community-os/types remain camelCase.
 */

import type {
  MembershipStatus,
  TenantStatus,
} from "@life-community-os/types";

export type TenantRow = {
  id: string;
  public_slug: string;
  display_name: string;
  configuration: Record<string, unknown>;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
};

export type TerritoryRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonRow = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type IdentityRow = {
  id: string;
  provider_reference: string;
  person_id: string;
  created_at: string;
  updated_at: string;
};

export type MembershipRow = {
  id: string;
  person_id: string;
  territory_id: string;
  membership_type: string;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
};

export type LocationRow = {
  id: string;
  tenant_id: string;
  type: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  visibility: string;
  geocode_provider: string | null;
  geocode_source_ref: string | null;
  geocode_display_name: string | null;
  contact: string | null;
  summary: string | null;
  image_url: string | null;
  hours: string | null;
  area_label: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: TenantRow;
        Insert: {
          id?: string;
          public_slug: string;
          display_name: string;
          configuration?: Record<string, unknown>;
          status?: TenantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TenantRow>;
        Relationships: [];
      };
      territories: {
        Row: TerritoryRow;
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TerritoryRow>;
        Relationships: [
          {
            foreignKeyName: "territories_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      persons: {
        Row: PersonRow;
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<PersonRow>;
        Relationships: [];
      };
      identities: {
        Row: IdentityRow;
        Insert: {
          id?: string;
          provider_reference: string;
          person_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<IdentityRow>;
        Relationships: [
          {
            foreignKeyName: "identities_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: MembershipRow;
        Insert: {
          id?: string;
          person_id: string;
          territory_id: string;
          membership_type: string;
          status?: MembershipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<MembershipRow>;
        Relationships: [
          {
            foreignKeyName: "memberships_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_territory_id_fkey";
            columns: ["territory_id"];
            isOneToOne: false;
            referencedRelation: "territories";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: LocationRow;
        Insert: {
          id: string;
          tenant_id: string;
          type: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          category: string;
          visibility?: string;
          geocode_provider?: string | null;
          geocode_source_ref?: string | null;
          geocode_display_name?: string | null;
          contact?: string | null;
          summary?: string | null;
          image_url?: string | null;
          hours?: string | null;
          area_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<LocationRow>;
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
