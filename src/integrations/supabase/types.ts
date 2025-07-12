export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      add_ons: {
        Row: {
          add_on_of: number | null
          add_on_sn: number | null
          colors: Json | null
          created_at: string
          created_by: string | null
          group_name: string | null
          has_colour: boolean | null
          id: string
          image_url: string | null
          name: string
          options: Json | null
          price: number | null
          select_type: string
          sort_order: number | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          add_on_of?: number | null
          add_on_sn?: number | null
          colors?: Json | null
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          has_colour?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          options?: Json | null
          price?: number | null
          select_type: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          add_on_of?: number | null
          add_on_sn?: number | null
          colors?: Json | null
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          has_colour?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          options?: Json | null
          price?: number | null
          select_type?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_assets: {
        Row: {
          asset: string | null
          asset_height_resp_to_box: number
          created_at: string
          created_by: string | null
          dx: number
          dy: number
          id: string
          mirror_dx: number
          name: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          asset?: string | null
          asset_height_resp_to_box?: number
          created_at?: string
          created_by?: string | null
          dx?: number
          dy?: number
          id?: string
          mirror_dx?: number
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          asset?: string | null
          asset_height_resp_to_box?: number
          created_at?: string
          created_by?: string | null
          dx?: number
          dy?: number
          id?: string
          mirror_dx?: number
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          sort_order: number | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          sort_order: number | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          color_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          gst_rate: number | null
          id: string
          images: Json | null
          monthly_stock_levels: Json | null
          name: string
          overall_max_stock: number | null
          overall_min_stock: number | null
          primary_image_url: string | null
          selected_sizes: Json | null
          size_group_id: string | null
          size_ratios: Json | null
          sort_order: number | null
          status: string
          stock_management_type: string | null
          style_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          gst_rate?: number | null
          id?: string
          images?: Json | null
          monthly_stock_levels?: Json | null
          name: string
          overall_max_stock?: number | null
          overall_min_stock?: number | null
          primary_image_url?: string | null
          selected_sizes?: Json | null
          size_group_id?: string | null
          size_ratios?: Json | null
          sort_order?: number | null
          status?: string
          stock_management_type?: string | null
          style_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          gst_rate?: number | null
          id?: string
          images?: Json | null
          monthly_stock_levels?: Json | null
          name?: string
          overall_max_stock?: number | null
          overall_min_stock?: number | null
          primary_image_url?: string | null
          selected_sizes?: Json | null
          size_group_id?: string | null
          size_ratios?: Json | null
          sort_order?: number | null
          status?: string
          stock_management_type?: string | null
          style_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_size_group_id_fkey"
            columns: ["size_group_id"]
            isOneToOne: false
            referencedRelation: "size_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_style_id_fkey"
            columns: ["style_id"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      colors: {
        Row: {
          created_at: string
          created_by: string | null
          hex_code: string
          id: string
          name: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hex_code: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hex_code?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      fabrics: {
        Row: {
          color_id: string | null
          created_at: string
          created_by: string | null
          fabric_type: string
          gsm: number
          id: string
          image_url: string | null
          name: string
          price: number
          status: string
          uom: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          created_by?: string | null
          fabric_type: string
          gsm: number
          id?: string
          image_url?: string | null
          name: string
          price: number
          status?: string
          uom: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color_id?: string | null
          created_at?: string
          created_by?: string | null
          fabric_type?: string
          gsm?: number
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          status?: string
          uom?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fabrics_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
        ]
      }
      indian_cities: {
        Row: {
          created_at: string
          id: string
          name: string
          state_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          state_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indian_cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "indian_states"
            referencedColumns: ["id"]
          },
        ]
      }
      indian_states: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      media_folders: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          path: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          path: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          path?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          file_size: number | null
          file_url: string
          folder_id: string | null
          height: number | null
          id: string
          mime_type: string | null
          name: string
          original_name: string
          status: string
          tags: string[] | null
          updated_at: string
          updated_by: string | null
          usage_count: number | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url: string
          folder_id?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          name: string
          original_name: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          updated_by?: string | null
          usage_count?: number | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          file_url?: string
          folder_id?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          original_name?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          updated_by?: string | null
          usage_count?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          order_criteria: boolean | null
          selected_add_ons: Json | null
          selected_colors: Json | null
          sort_position: number | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          order_criteria?: boolean | null
          selected_add_ons?: Json | null
          selected_colors?: Json | null
          sort_position?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          order_criteria?: boolean | null
          selected_add_ons?: Json | null
          selected_colors?: Json | null
          sort_position?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: Database["public"]["Enums"]["permission_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["permission_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["permission_type"]
        }
        Relationships: []
      }
      price_types: {
        Row: {
          category: Database["public"]["Enums"]["price_type_category"] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["price_type_category"] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["price_type_category"] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: Database["public"]["Enums"]["department_type"] | null
          designation: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["department_type"] | null
          designation?: string | null
          email: string
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["department_type"] | null
          designation?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profit_margins: {
        Row: {
          branding_embroidery: number
          branding_print: number
          created_at: string
          created_by: string | null
          id: string
          margin_percentage: number
          max_range: number
          min_range: number
          name: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          branding_embroidery: number
          branding_print: number
          created_at?: string
          created_by?: string | null
          id?: string
          margin_percentage: number
          max_range: number
          min_range: number
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          branding_embroidery?: number
          branding_print?: number
          created_at?: string
          created_by?: string | null
          id?: string
          margin_percentage?: number
          max_range?: number
          min_range?: number
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_warehouse_admin: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_warehouse_admin?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_warehouse_admin?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      size_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sizes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          size_group_id: string
          sort_order: number | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          size_group_id: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          size_group_id?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sizes_size_group_id_fkey"
            columns: ["size_group_id"]
            isOneToOne: false
            referencedRelation: "size_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      skus: {
        Row: {
          base_mrp: number | null
          breadth_cm: number | null
          class_id: string
          cost_price: number | null
          created_at: string
          created_by: string | null
          description: string | null
          gst_rate: number | null
          height_cm: number | null
          hsn_code: string | null
          id: string
          length_cm: number | null
          price_type_prices: Json | null
          size_id: string
          sku_code: string
          status: string
          updated_at: string
          updated_by: string | null
          weight_grams: number | null
        }
        Insert: {
          base_mrp?: number | null
          breadth_cm?: number | null
          class_id: string
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          gst_rate?: number | null
          height_cm?: number | null
          hsn_code?: string | null
          id?: string
          length_cm?: number | null
          price_type_prices?: Json | null
          size_id: string
          sku_code: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          weight_grams?: number | null
        }
        Update: {
          base_mrp?: number | null
          breadth_cm?: number | null
          class_id?: string
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          gst_rate?: number | null
          height_cm?: number | null
          hsn_code?: string | null
          id?: string
          length_cm?: number | null
          price_type_prices?: Json | null
          size_id?: string
          sku_code?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skus_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skus_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      styles: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "styles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "styles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          created_by: string | null
          credit_terms: string | null
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          tax_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          credit_terms?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          credit_terms?: string | null
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      zone_locations: {
        Row: {
          city: string
          created_at: string
          created_by: string | null
          id: string
          state: string
          updated_at: string
          updated_by: string | null
          zone_id: string
        }
        Insert: {
          city: string
          created_at?: string
          created_by?: string | null
          id?: string
          state: string
          updated_at?: string
          updated_by?: string | null
          zone_id: string
        }
        Update: {
          city?: string
          created_at?: string
          created_by?: string | null
          id?: string
          state?: string
          updated_at?: string
          updated_by?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_locations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: string
          updated_at: string
          updated_by: string | null
          warehouse_assignments: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_assignments?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_assignments?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_permission: {
        Args: {
          _user_id: string
          _permission: Database["public"]["Enums"]["permission_type"]
        }
        Returns: boolean
      }
      user_is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      department_type:
        | "operations"
        | "logistics"
        | "warehouse"
        | "customer_service"
        | "administration"
        | "finance"
        | "it"
        | "human_resources"
      permission_type:
        | "view_clients"
        | "edit_clients"
        | "delete_clients"
        | "manage_clients"
        | "view_inventory"
        | "edit_inventory"
        | "delete_inventory"
        | "manage_inventory"
        | "view_warehouses"
        | "edit_warehouses"
        | "delete_warehouses"
        | "manage_warehouses"
        | "view_orders"
        | "edit_orders"
        | "delete_orders"
        | "process_orders"
        | "view_users"
        | "edit_users"
        | "delete_users"
        | "manage_users"
        | "view_roles"
        | "edit_roles"
        | "delete_roles"
        | "manage_roles"
        | "admin_access"
      price_type_category: "zone" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      department_type: [
        "operations",
        "logistics",
        "warehouse",
        "customer_service",
        "administration",
        "finance",
        "it",
        "human_resources",
      ],
      permission_type: [
        "view_clients",
        "edit_clients",
        "delete_clients",
        "manage_clients",
        "view_inventory",
        "edit_inventory",
        "delete_inventory",
        "manage_inventory",
        "view_warehouses",
        "edit_warehouses",
        "delete_warehouses",
        "manage_warehouses",
        "view_orders",
        "edit_orders",
        "delete_orders",
        "process_orders",
        "view_users",
        "edit_users",
        "delete_users",
        "manage_users",
        "view_roles",
        "edit_roles",
        "delete_roles",
        "manage_roles",
        "admin_access",
      ],
      price_type_category: ["zone", "customer"],
    },
  },
} as const
