export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
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
          add_on_id: string | null
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
          add_on_id?: string | null
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
          add_on_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "app_assets_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["id"]
          },
        ]
      }
      base_products: {
        Row: {
          adult_consumption: number | null
          base_icon_url: string | null
          base_price: number | null
          base_sn: number | null
          branding_sides: Json | null
          calculator: number | null
          category_id: string | null
          created_at: string
          created_by: string | null
          fabric_id: string | null
          id: string
          image_url: string | null
          kids_consumption: number | null
          name: string
          overhead_percentage: number | null
          parts: Json | null
          sample_rate: number | null
          size_group_ids: Json | null
          size_type: string | null
          sort_order: number | null
          status: string | null
          trims_cost: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          adult_consumption?: number | null
          base_icon_url?: string | null
          base_price?: number | null
          base_sn?: number | null
          branding_sides?: Json | null
          calculator?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          fabric_id?: string | null
          id?: string
          image_url?: string | null
          kids_consumption?: number | null
          name: string
          overhead_percentage?: number | null
          parts?: Json | null
          sample_rate?: number | null
          size_group_ids?: Json | null
          size_type?: string | null
          sort_order?: number | null
          status?: string | null
          trims_cost?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          adult_consumption?: number | null
          base_icon_url?: string | null
          base_price?: number | null
          base_sn?: number | null
          branding_sides?: Json | null
          calculator?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          fabric_id?: string | null
          id?: string
          image_url?: string | null
          kids_consumption?: number | null
          name?: string
          overhead_percentage?: number | null
          parts?: Json | null
          sample_rate?: number | null
          size_group_ids?: Json | null
          size_type?: string | null
          sort_order?: number | null
          status?: string | null
          trims_cost?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_products_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
        ]
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
      customer_addresses: {
        Row: {
          address: string
          city_id: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          is_primary: boolean | null
          label: string
          postal_code: string
          state_id: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address: string
          city_id: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          is_primary?: boolean | null
          label: string
          postal_code: string
          state_id: string
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string
          city_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          is_primary?: boolean | null
          label?: string
          postal_code?: string
          state_id?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "indian_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "indian_states"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          avatar_url: string | null
          brand_ids: Json | null
          city: string | null
          company_name: string
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          customer_code: string
          customer_type: string | null
          email: string | null
          gst: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          price_type_id: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          brand_ids?: Json | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          customer_code: string
          customer_type?: string | null
          email?: string | null
          gst?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          price_type_id?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          brand_ids?: Json | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          customer_code?: string
          customer_type?: string | null
          email?: string | null
          gst?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          price_type_id?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_price_type_id_fkey"
            columns: ["price_type_id"]
            isOneToOne: false
            referencedRelation: "price_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrics: {
        Row: {
          color_ids: Json
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
          color_ids?: Json
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
          color_ids?: Json
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
        Relationships: []
      }
      grn_entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          grn_number: string | null
          id: string
          notes: string | null
          purchase_order_id: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          grn_number?: string | null
          id?: string
          notes?: string | null
          purchase_order_id: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          grn_number?: string | null
          id?: string
          notes?: string | null
          purchase_order_id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grn_entries_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: true
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      grn_receipts: {
        Row: {
          bad_quantity: number
          created_at: string | null
          created_by: string | null
          good_quantity: number
          grn_entry_id: string
          id: string
          is_saved: boolean | null
          item_type: string
          misc_name: string | null
          ordered_quantity: number
          session_name: string
          session_timestamp: string | null
          size_id: string | null
          sku_id: string | null
        }
        Insert: {
          bad_quantity?: number
          created_at?: string | null
          created_by?: string | null
          good_quantity?: number
          grn_entry_id: string
          id?: string
          is_saved?: boolean | null
          item_type: string
          misc_name?: string | null
          ordered_quantity?: number
          session_name: string
          session_timestamp?: string | null
          size_id?: string | null
          sku_id?: string | null
        }
        Update: {
          bad_quantity?: number
          created_at?: string | null
          created_by?: string | null
          good_quantity?: number
          grn_entry_id?: string
          id?: string
          is_saved?: boolean | null
          item_type?: string
          misc_name?: string | null
          ordered_quantity?: number
          session_name?: string
          session_timestamp?: string | null
          size_id?: string | null
          sku_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grn_receipts_grn_entry_id_fkey"
            columns: ["grn_entry_id"]
            isOneToOne: false
            referencedRelation: "grn_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_receipts_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_receipts_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
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
      order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          discount_percentage: number | null
          gst_amount: number | null
          gst_rate: number | null
          id: string
          item_type: string
          misc_name: string | null
          order_id: string
          price_type_id: string | null
          quantity: number
          size_id: string | null
          sku_id: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          gst_amount?: number | null
          gst_rate?: number | null
          id?: string
          item_type: string
          misc_name?: string | null
          order_id: string
          price_type_id?: string | null
          quantity?: number
          size_id?: string | null
          sku_id?: string | null
          subtotal?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          gst_amount?: number | null
          gst_rate?: number | null
          id?: string
          item_type?: string
          misc_name?: string | null
          order_id?: string
          price_type_id?: string | null
          quantity?: number
          size_id?: string | null
          sku_id?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_price_type_id_fkey"
            columns: ["price_type_id"]
            isOneToOne: false
            referencedRelation: "price_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          bill_to_address: Json
          created_at: string
          created_by: string | null
          customer_id: string
          discount_amount: number | null
          expected_delivery_date: string | null
          id: string
          order_number: string
          order_remarks: string | null
          payment_mode: string
          price_type_id: string | null
          ship_to_address: Json
          shipment_time: string | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bill_to_address: Json
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          order_number: string
          order_remarks?: string | null
          payment_mode: string
          price_type_id?: string | null
          ship_to_address: Json
          shipment_time?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bill_to_address?: Json
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          order_number?: string
          order_remarks?: string | null
          payment_mode?: string
          price_type_id?: string | null
          ship_to_address?: Json
          shipment_time?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_price_type_id_fkey"
            columns: ["price_type_id"]
            isOneToOne: false
            referencedRelation: "price_types"
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
      promotional_assets: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          link: string | null
          name: string
          status: string | null
          thumbnail: string | null
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          link?: string | null
          name: string
          status?: string | null
          thumbnail?: string | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          link?: string | null
          name?: string
          status?: string | null
          thumbnail?: string | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      promotional_banners: {
        Row: {
          banner_image: string | null
          brand_id: string
          category_id: string | null
          class_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          position: number | null
          status: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          banner_image?: string | null
          brand_id: string
          category_id?: string | null
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          position?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          banner_image?: string | null
          brand_id?: string
          category_id?: string | null
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          position?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotional_banners_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotional_banners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotional_banners_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          purchase_order_id: string
          quantity: number
          size_id: string | null
          sku_id: string | null
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          purchase_order_id: string
          quantity?: number
          size_id?: string | null
          sku_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          purchase_order_id?: string
          quantity?: number
          size_id?: string | null
          sku_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_misc_items: {
        Row: {
          created_at: string | null
          id: string
          name: string
          purchase_order_id: string
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          purchase_order_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          purchase_order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_misc_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          auto_generated: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          po_number: string
          related_sku_ids: string[] | null
          reorder_source: string | null
          reorder_trigger_type: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          total_amount: number | null
          updated_at: string | null
          updated_by: string | null
          vendor_id: string
        }
        Insert: {
          auto_generated?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          po_number: string
          related_sku_ids?: string[] | null
          reorder_source?: string | null
          reorder_trigger_type?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_id: string
        }
        Update: {
          auto_generated?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          related_sku_ids?: string[] | null
          reorder_source?: string | null
          reorder_trigger_type?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      putaway_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          floor_id: string
          id: string
          item_type: string
          lane_id: string
          location_notes: string | null
          misc_name: string | null
          putaway_session_id: string
          quantity: number | null
          rack_id: string
          size_id: string | null
          sku_id: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          floor_id: string
          id?: string
          item_type: string
          lane_id: string
          location_notes?: string | null
          misc_name?: string | null
          putaway_session_id: string
          quantity?: number | null
          rack_id: string
          size_id?: string | null
          sku_id?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          floor_id?: string
          id?: string
          item_type?: string
          lane_id?: string
          location_notes?: string | null
          misc_name?: string | null
          putaway_session_id?: string
          quantity?: number | null
          rack_id?: string
          size_id?: string | null
          sku_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "putaway_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_items_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "warehouse_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_items_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "warehouse_lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_items_putaway_session_id_fkey"
            columns: ["putaway_session_id"]
            isOneToOne: false
            referencedRelation: "putaway_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_items_rack_id_fkey"
            columns: ["rack_id"]
            isOneToOne: false
            referencedRelation: "warehouse_racks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      putaway_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          grn_entry_id: string
          id: string
          is_saved: boolean | null
          notes: string | null
          session_name: string
          session_timestamp: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          grn_entry_id: string
          id?: string
          is_saved?: boolean | null
          notes?: string | null
          session_name: string
          session_timestamp?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          grn_entry_id?: string
          id?: string
          is_saved?: boolean | null
          notes?: string | null
          session_name?: string
          session_timestamp?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "putaway_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_sessions_grn_entry_id_fkey"
            columns: ["grn_entry_id"]
            isOneToOne: false
            referencedRelation: "grn_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_sessions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qc_reports: {
        Row: {
          created_at: string
          created_by: string | null
          grn_id: string
          id: string
          item_type: string
          misc_name: string | null
          qc_percentage: number
          received_qty: number
          report_name: string
          report_timestamp: string
          samples_checked: number
          samples_not_ok: number
          samples_ok: number
          size_id: string | null
          sku_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          grn_id: string
          id?: string
          item_type: string
          misc_name?: string | null
          qc_percentage?: number
          received_qty?: number
          report_name: string
          report_timestamp?: string
          samples_checked?: number
          samples_not_ok?: number
          samples_ok?: number
          size_id?: string | null
          sku_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          grn_id?: string
          id?: string
          item_type?: string
          misc_name?: string | null
          qc_percentage?: number
          received_qty?: number
          report_name?: string
          report_timestamp?: string
          samples_checked?: number
          samples_not_ok?: number
          samples_ok?: number
          size_id?: string | null
          sku_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qc_reports_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grn_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_reports_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qc_reports_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      reorder_history: {
        Row: {
          created_at: string | null
          id: string
          inventory_level: number
          min_threshold: number
          notes: string | null
          optimal_threshold: number
          purchase_order_id: string | null
          reorder_quantity: number
          sku_id: string
          status: string | null
          trigger_timestamp: string | null
          trigger_type: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_level: number
          min_threshold: number
          notes?: string | null
          optimal_threshold: number
          purchase_order_id?: string | null
          reorder_quantity: number
          sku_id: string
          status?: string | null
          trigger_timestamp?: string | null
          trigger_type: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_level?: number
          min_threshold?: number
          notes?: string | null
          optimal_threshold?: number
          purchase_order_id?: string | null
          reorder_quantity?: number
          sku_id?: string
          status?: string | null
          trigger_timestamp?: string | null
          trigger_type?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reorder_history_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_history_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      return_entries: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reference_id: string
          reference_type: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id: string
          reference_type: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id?: string
          reference_type?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      return_items: {
        Row: {
          accept_condition: string | null
          accept_to_stock_qty: number | null
          condition: string
          created_at: string
          created_by: string | null
          customer_order_id: string | null
          floor_id: string | null
          id: string
          item_type: string
          lane_id: string | null
          misc_name: string | null
          notes: string | null
          quantity: number
          rack_id: string | null
          return_entry_id: string
          return_reason: string
          return_to_vendor_qty: number | null
          session_name: string
          size_id: string | null
          sku_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          accept_condition?: string | null
          accept_to_stock_qty?: number | null
          condition: string
          created_at?: string
          created_by?: string | null
          customer_order_id?: string | null
          floor_id?: string | null
          id?: string
          item_type: string
          lane_id?: string | null
          misc_name?: string | null
          notes?: string | null
          quantity?: number
          rack_id?: string | null
          return_entry_id: string
          return_reason: string
          return_to_vendor_qty?: number | null
          session_name: string
          size_id?: string | null
          sku_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          accept_condition?: string | null
          accept_to_stock_qty?: number | null
          condition?: string
          created_at?: string
          created_by?: string | null
          customer_order_id?: string | null
          floor_id?: string | null
          id?: string
          item_type?: string
          lane_id?: string | null
          misc_name?: string | null
          notes?: string | null
          quantity?: number
          rack_id?: string | null
          return_entry_id?: string
          return_reason?: string
          return_to_vendor_qty?: number | null
          session_name?: string
          size_id?: string | null
          sku_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "return_items_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "warehouse_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "warehouse_lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_rack_id_fkey"
            columns: ["rack_id"]
            isOneToOne: false
            referencedRelation: "warehouse_racks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_entry_id_fkey"
            columns: ["return_entry_id"]
            isOneToOne: false
            referencedRelation: "return_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      return_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_saved: boolean
          return_entry_id: string
          session_name: string
          session_timestamp: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_saved?: boolean
          return_entry_id: string
          session_name: string
          session_timestamp?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_saved?: boolean
          return_entry_id?: string
          session_name?: string
          session_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_sessions_return_entry_id_fkey"
            columns: ["return_entry_id"]
            isOneToOne: false
            referencedRelation: "return_entries"
            referencedColumns: ["id"]
          },
        ]
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
          auto_reorder_enabled: boolean | null
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
          preferred_vendor_id: string | null
          price_type_prices: Json | null
          size_id: string
          sku_code: string
          status: string
          updated_at: string
          updated_by: string | null
          weight_grams: number | null
        }
        Insert: {
          auto_reorder_enabled?: boolean | null
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
          preferred_vendor_id?: string | null
          price_type_prices?: Json | null
          size_id: string
          sku_code: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          weight_grams?: number | null
        }
        Update: {
          auto_reorder_enabled?: boolean | null
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
          preferred_vendor_id?: string | null
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
            foreignKeyName: "skus_preferred_vendor_id_fkey"
            columns: ["preferred_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
          city_id: string | null
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
          state_id: string | null
          status: string
          style_specializations: Json | null
          tax_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          city_id?: string | null
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
          state_id?: string | null
          status?: string
          style_specializations?: Json | null
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          city_id?: string | null
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
          state_id?: string | null
          status?: string
          style_specializations?: Json | null
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "indian_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "indian_states"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_floors: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          floor_number: number
          id: string
          name: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          floor_number: number
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          floor_number?: number
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_floors_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_inventory: {
        Row: {
          available_quantity: number | null
          created_at: string
          created_by: string | null
          damaged_quantity: number | null
          id: string
          reserved_quantity: number
          sku_id: string
          total_quantity: number
          updated_at: string
          updated_by: string | null
          warehouse_id: string
        }
        Insert: {
          available_quantity?: number | null
          created_at?: string
          created_by?: string | null
          damaged_quantity?: number | null
          id?: string
          reserved_quantity?: number
          sku_id: string
          total_quantity?: number
          updated_at?: string
          updated_by?: string | null
          warehouse_id: string
        }
        Update: {
          available_quantity?: number | null
          created_at?: string
          created_by?: string | null
          damaged_quantity?: number | null
          id?: string
          reserved_quantity?: number
          sku_id?: string
          total_quantity?: number
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_inventory_locations: {
        Row: {
          created_at: string
          created_by: string | null
          floor_id: string
          id: string
          lane_id: string
          quantity: number
          rack_id: string
          updated_at: string
          updated_by: string | null
          warehouse_inventory_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          floor_id: string
          id?: string
          lane_id: string
          quantity?: number
          rack_id: string
          updated_at?: string
          updated_by?: string | null
          warehouse_inventory_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          floor_id?: string
          id?: string
          lane_id?: string
          quantity?: number
          rack_id?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_inventory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_locations_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "warehouse_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_locations_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "warehouse_lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_locations_rack_id_fkey"
            columns: ["rack_id"]
            isOneToOne: false
            referencedRelation: "warehouse_racks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_locations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_locations_warehouse_inventory_id_fkey"
            columns: ["warehouse_inventory_id"]
            isOneToOne: false
            referencedRelation: "warehouse_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_inventory_reservations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          quantity: number
          reservation_type: string
          status: string
          updated_at: string
          updated_by: string | null
          warehouse_inventory_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          reservation_type?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_inventory_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          reservation_type?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_inventory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_reservations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_reservations_warehouse_inventory_id_fkey"
            columns: ["warehouse_inventory_id"]
            isOneToOne: false
            referencedRelation: "warehouse_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_lane_configs: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_direction: string | null
          default_left_racks: number | null
          default_right_racks: number | null
          id: string
          lane_id: string
          left_side_enabled: boolean | null
          right_side_enabled: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_direction?: string | null
          default_left_racks?: number | null
          default_right_racks?: number | null
          id?: string
          lane_id: string
          left_side_enabled?: boolean | null
          right_side_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_direction?: string | null
          default_left_racks?: number | null
          default_right_racks?: number | null
          id?: string
          lane_id?: string
          left_side_enabled?: boolean | null
          right_side_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_lane_configs_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: true
            referencedRelation: "warehouse_lanes"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_lanes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          floor_id: string
          id: string
          lane_number: number
          name: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          floor_id: string
          id?: string
          lane_number: number
          name: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          floor_id?: string
          id?: string
          lane_number?: number
          name?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_lanes_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "warehouse_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_lanes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_racks: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_enabled: boolean | null
          lane_id: string
          rack_name: string
          rack_number: number
          side: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          lane_id: string
          rack_name: string
          rack_number: number
          side: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          lane_id?: string
          rack_name?: string
          rack_number?: number
          side?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_racks_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "warehouse_lanes"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_primary: boolean | null
          name: string
          postal_code: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          warehouse_admin_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          postal_code?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_admin_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          postal_code?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_warehouse_admin_id_fkey"
            columns: ["warehouse_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      add_po_misc_items: {
        Args: { p_items: Json; p_po_id: string }
        Returns: undefined
      }
      add_po_sku_items: {
        Args: { p_items: Json; p_po_id: string }
        Returns: undefined
      }
      api_process_pending_reorders: { Args: never; Returns: Json }
      create_grn_entry: {
        Args: { p_notes?: string; p_po_id: string }
        Returns: string
      }
      create_purchase_order: {
        Args: { p_created_by?: string; p_notes?: string; p_vendor_id: string }
        Returns: string
      }
      delete_putaway_session: {
        Args: { p_grn_id: string; p_session_id: string }
        Returns: undefined
      }
      delete_qc_report: { Args: { p_report_id: string }; Returns: undefined }
      delete_return_session: {
        Args: { p_reference_id: string; p_session_name: string }
        Returns: undefined
      }
      delete_warehouse_cascade: {
        Args: { user_id: string; warehouse_id: string }
        Returns: undefined
      }
      generate_order_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      get_consolidated_sku_inventory: {
        Args: {
          page_number?: number
          page_size?: number
          search_query?: string
        }
        Returns: {
          available_quantity: number
          brand_name: string
          class_name: string
          color_name: string
          locations_count: number
          reserved_quantity: number
          size_name: string
          sku_code: string
          sku_id: string
          style_name: string
          total_quantity: number
          warehouse_count: number
        }[]
      }
      get_consolidated_sku_inventory_count: {
        Args: { search_query?: string }
        Returns: number
      }
      get_consolidated_sku_inventory_statistics: {
        Args: never
        Returns: {
          available_quantity: number
          reserved_quantity: number
          total_quantity: number
          total_skus: number
          total_warehouses: number
        }[]
      }
      get_filtered_consolidated_sku_inventory: {
        Args: {
          brand_name?: string
          category_name?: string
          color_name?: string
          has_reservations?: boolean
          max_quantity?: number
          min_quantity?: number
          page_number?: number
          page_size?: number
          search_query?: string
          size_name?: string
          stock_status?: string
          warehouse_id?: string
        }
        Returns: {
          available_quantity: number
          brand_name: string
          class_name: string
          color_name: string
          locations_count: number
          reserved_quantity: number
          size_name: string
          sku_code: string
          sku_id: string
          style_name: string
          total_quantity: number
          warehouse_count: number
        }[]
      }
      get_filtered_consolidated_sku_inventory_count: {
        Args: {
          brand_name?: string
          category_name?: string
          color_name?: string
          has_reservations?: boolean
          max_quantity?: number
          min_quantity?: number
          search_query?: string
          size_name?: string
          stock_status?: string
          warehouse_id?: string
        }
        Returns: number
      }
      get_global_class_inventory: {
        Args: {
          page_number?: number
          page_size?: number
          search_query?: string
        }
        Returns: {
          available_quantity: number
          brand_name: string
          class_id: string
          class_name: string
          color_name: string
          locations_count: number
          reserved_quantity: number
          size_group_name: string
          sku_count: number
          style_name: string
          total_quantity: number
          warehouse_count: number
        }[]
      }
      get_global_class_inventory_statistics: {
        Args: never
        Returns: {
          available_quantity: number
          reserved_quantity: number
          total_classes: number
          total_quantity: number
          total_skus: number
          total_warehouses: number
        }[]
      }
      get_global_inventory: {
        Args: {
          page_number?: number
          page_size?: number
          search_query?: string
        }
        Returns: {
          available_quantity: number
          brand_name: string
          class_name: string
          color_name: string
          created_at: string
          id: string
          location_count: number
          reserved_quantity: number
          size_name: string
          sku_code: string
          sku_id: string
          style_name: string
          total_quantity: number
          updated_at: string
          warehouse_city: string
          warehouse_id: string
          warehouse_name: string
          warehouse_state: string
        }[]
      }
      get_global_inventory_statistics: {
        Args: never
        Returns: {
          available_quantity: number
          reserved_quantity: number
          total_items: number
          total_quantity: number
        }[]
      }
      get_global_style_inventory: {
        Args: {
          page_number?: number
          page_size?: number
          search_query?: string
        }
        Returns: {
          available_quantity: number
          brand_name: string
          category_name: string
          class_count: number
          locations_count: number
          reserved_quantity: number
          sku_count: number
          style_id: string
          style_name: string
          total_quantity: number
          warehouse_count: number
        }[]
      }
      get_global_style_inventory_statistics: {
        Args: never
        Returns: {
          available_quantity: number
          reserved_quantity: number
          total_classes: number
          total_quantity: number
          total_skus: number
          total_styles: number
          total_warehouses: number
        }[]
      }
      get_grn_data_for_po: {
        Args: { p_po_id: string }
        Returns: {
          item_id: string
          item_type: string
          misc_name: string
          ordered_quantity: number
          size_code: string
          size_id: string
          size_name: string
          sku_code: string
          sku_id: string
          sku_name: string
        }[]
      }
      get_grn_metrics: {
        Args: { p_grn_id: string }
        Returns: {
          total_bad: number
          total_good: number
          total_ordered: number
          total_received: number
        }[]
      }
      get_grn_sessions: {
        Args: { p_po_id: string }
        Returns: {
          is_saved: boolean
          items: Json
          session_id: string
          session_name: string
          session_timestamp: string
        }[]
      }
      get_inventory_statistics_by_brand: {
        Args: never
        Returns: {
          available_quantity: number
          brand_id: string
          brand_name: string
          damaged_quantity: number
          reserved_quantity: number
          total_items: number
          total_quantity: number
        }[]
      }
      get_inventory_statistics_by_category: {
        Args: never
        Returns: {
          available_quantity: number
          category_id: string
          category_name: string
          damaged_quantity: number
          reserved_quantity: number
          total_items: number
          total_quantity: number
        }[]
      }
      get_inventory_statistics_by_class: {
        Args: never
        Returns: {
          available_quantity: number
          class_id: string
          class_name: string
          damaged_quantity: number
          reserved_quantity: number
          total_items: number
          total_quantity: number
        }[]
      }
      get_inventory_statistics_by_color: {
        Args: never
        Returns: {
          available_quantity: number
          color_id: string
          color_name: string
          damaged_quantity: number
          reserved_quantity: number
          total_items: number
          total_quantity: number
        }[]
      }
      get_inventory_statistics_by_size: {
        Args: never
        Returns: {
          available_quantity: number
          damaged_quantity: number
          reserved_quantity: number
          size_id: string
          size_name: string
          total_items: number
          total_quantity: number
        }[]
      }
      get_inventory_statistics_by_style: {
        Args: never
        Returns: {
          available_quantity: number
          damaged_quantity: number
          reserved_quantity: number
          style_id: string
          style_name: string
          total_items: number
          total_quantity: number
        }[]
      }
      get_inventory_statistics_by_warehouse: {
        Args: never
        Returns: {
          available_quantity: number
          damaged_quantity: number
          reserved_quantity: number
          total_items: number
          total_quantity: number
          warehouse_id: string
          warehouse_name: string
        }[]
      }
      get_purchase_order_balance_view: {
        Args: never
        Returns: {
          class_id: string
          class_name: string
          size_code: string
          size_id: string
          size_name: string
          total_quantity: number
          vendor_breakdown: Json
        }[]
      }
      get_purchase_order_details: { Args: { p_po_id: string }; Returns: Json }
      get_purchase_orders: {
        Args: {
          p_status?: Database["public"]["Enums"]["purchase_order_status"]
          p_vendor_id?: string
        }
        Returns: Json
      }
      get_putaway_items_for_grn: {
        Args: { p_grn_id: string }
        Returns: {
          good_quantity: number
          item_id: string
          item_type: string
          misc_name: string
          size_code: string
          size_id: string
          size_name: string
          sku_code: string
          sku_id: string
          sku_name: string
        }[]
      }
      get_putaway_metrics: {
        Args: { p_grn_id: string }
        Returns: {
          total_put_away: number
          total_received: number
        }[]
      }
      get_putaway_sessions: {
        Args: { p_grn_id: string }
        Returns: {
          is_saved: boolean
          items: Json
          session_id: string
          session_name: string
          session_timestamp: string
        }[]
      }
      get_qc_items_for_grn: {
        Args: { p_grn_id: string }
        Returns: {
          item_id: string
          item_type: string
          misc_name: string
          ordered_quantity: number
          received_quantity: number
          size_code: string
          size_id: string
          size_name: string
          sku_code: string
          sku_id: string
          sku_name: string
        }[]
      }
      get_qc_metrics: {
        Args: { p_grn_id: string }
        Returns: {
          total_samples_checked: number
          total_samples_ok: number
        }[]
      }
      get_qc_reports: {
        Args: { p_grn_id: string }
        Returns: {
          id: string
          item_type: string
          misc_name: string
          qc_percentage: number
          received_qty: number
          report_name: string
          report_timestamp: string
          samples_checked: number
          samples_not_ok: number
          samples_ok: number
          size_code: string
          size_id: string
          size_name: string
          sku_code: string
          sku_id: string
          sku_name: string
        }[]
      }
      get_return_items_for_reference: {
        Args: { p_reference_id: string }
        Returns: {
          available_quantity: number
          customer_order_id: string
          item_id: string
          item_type: string
          misc_name: string
          size_code: string
          size_id: string
          size_name: string
          sku_code: string
          sku_id: string
          sku_name: string
        }[]
      }
      get_return_metrics: {
        Args: { p_grn_id: string }
        Returns: {
          total_accept_to_stock: number
          total_return_to_vendor: number
        }[]
      }
      get_return_sessions: {
        Args: { p_reference_id: string }
        Returns: {
          is_saved: boolean
          items: Json
          session_id: string
          session_name: string
          session_timestamp: string
        }[]
      }
      get_sku_locations_by_warehouse: {
        Args: { sku_id_param: string }
        Returns: {
          available_quantity: number
          damaged_quantity: number
          locations: Json
          reserved_quantity: number
          total_quantity: number
          warehouse_id: string
          warehouse_name: string
        }[]
      }
      get_warehouse_admins: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          department: string
          designation: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone_number: string
          updated_at: string
        }[]
      }
      get_warehouse_statistics: {
        Args: { warehouse_id: string }
        Returns: {
          floors_count: number
          lanes_count: number
          racks_count: number
        }[]
      }
      process_pending_reorders: {
        Args: never
        Returns: {
          created_pos: string[]
          error_count: number
          processed_count: number
          success_count: number
        }[]
      }
      save_grn_session: {
        Args: {
          p_grn_entry_id: string
          p_session_data: Json
          p_session_name: string
        }
        Returns: string
      }
      save_putaway_session: {
        Args: { p_grn_id: string; p_session_data: Json; p_session_name: string }
        Returns: string
      }
      save_qc_report: {
        Args: { p_grn_id: string; p_report_data: Json; p_report_name: string }
        Returns: string
      }
      save_return_session: {
        Args: {
          p_reference_id: string
          p_session_data: Json
          p_session_name: string
        }
        Returns: string
      }
      search_warehouses: {
        Args: { search_term: string; status_filter?: string }
        Returns: {
          city: string
          country: string
          created_at: string
          description: string
          id: string
          name: string
          state: string
          status: string
        }[]
      }
      update_grn_putaway_status: {
        Args: { p_grn_id: string }
        Returns: undefined
      }
      update_po_status: {
        Args: {
          p_po_id: string
          p_status: Database["public"]["Enums"]["purchase_order_status"]
          p_updated_by?: string
        }
        Returns: boolean
      }
      update_reference_return_status: {
        Args: { p_reference_id: string }
        Returns: undefined
      }
      user_has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["permission_type"]
          _user_id: string
        }
        Returns: boolean
      }
      user_is_admin: { Args: { _user_id: string }; Returns: boolean }
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
      purchase_order_status:
        | "draft"
        | "sent_for_approval"
        | "approved"
        | "rejected"
        | "sent_to_vendor"
        | "partially_received"
        | "received"
        | "completed"
        | "cancelled"
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
      purchase_order_status: [
        "draft",
        "sent_for_approval",
        "approved",
        "rejected",
        "sent_to_vendor",
        "partially_received",
        "received",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
