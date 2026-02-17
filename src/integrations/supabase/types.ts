export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: number
          company_id: number | null
          actor_user_id: number | null
          action: string
          entity_type: string
          record_id: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id?: number | null
          actor_user_id?: number | null
          action: string
          entity_type: string
          record_id?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number | null
          actor_user_id?: number | null
          action?: string
          entity_type?: string
          record_id?: number | null
          created_at?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: number
          user_id: number | null
          message: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: number | null
          message?: string | null
          created_at?: string | null
        }
      }
      companies: {
        Row: {
          id: number
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          currency: string | null
          website: string | null
          logo_url: string | null
          primary_color: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          currency?: string | null
          website?: string | null
          logo_url?: string | null
          primary_color?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          currency?: string | null
          website?: string | null
          logo_url?: string | null
          primary_color?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      contacts: {
        Row: {
          id: number
          name: string | null
          email: string | null
          message: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          email?: string | null
          message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          email?: string | null
          message?: string | null
          created_at?: string | null
        }
      }
      credit_notes: {
        Row: {
          id: number
          company_id: number
          customer_id: number
          invoice_id: number | null
          credit_note_number: string
          total_amount: number | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          customer_id: number
          invoice_id?: number | null
          credit_note_number: string
          total_amount?: number | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          customer_id?: number
          invoice_id?: number | null
          credit_note_number?: string
          total_amount?: number | null
          status?: string | null
          created_at?: string | null
        }
      }
      credit_note_allocations: {
        Row: {
          id: number
          credit_note_id: number
          invoice_id: number
          allocated_amount: number | null
        }
        Insert: {
          id?: number
          credit_note_id: number
          invoice_id: number
          allocated_amount?: number | null
        }
        Update: {
          id?: number
          credit_note_id?: number
          invoice_id?: number
          allocated_amount?: number | null
        }
      }
      credit_note_items: {
        Row: {
          id: number
          credit_note_id: number
          product_id: number | null
          description: string
          quantity: number | null
          unit_price: number | null
          line_total: number | null
        }
        Insert: {
          id?: number
          credit_note_id: number
          product_id?: number | null
          description: string
          quantity?: number | null
          unit_price?: number | null
          line_total?: number | null
        }
        Update: {
          id?: number
          credit_note_id?: number
          product_id?: number | null
          description?: string
          quantity?: number | null
          unit_price?: number | null
          line_total?: number | null
        }
      }
      customers: {
        Row: {
          id: number
          company_id: number
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          tax_id: string | null
          customer_number: string | null
          status: string | null
          credit_limit: number | null
          is_supplier: number | null
          payment_terms: string | null
          is_active: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          tax_id?: string | null
          customer_number?: string | null
          status?: string | null
          credit_limit?: number | null
          is_supplier?: number | null
          payment_terms?: string | null
          is_active?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          tax_id?: string | null
          customer_number?: string | null
          status?: string | null
          credit_limit?: number | null
          is_supplier?: number | null
          payment_terms?: string | null
          is_active?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      delivery_notes: {
        Row: {
          id: number
          company_id: number
          customer_id: number
          invoice_id: number | null
          delivery_note_number: string
          delivery_date: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          customer_id: number
          invoice_id?: number | null
          delivery_note_number: string
          delivery_date?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          customer_id?: number
          invoice_id?: number | null
          delivery_note_number?: string
          delivery_date?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      delivery_note_items: {
        Row: {
          id: number
          delivery_note_id: number
          product_id: number | null
          description: string
          quantity: number
        }
        Insert: {
          id?: number
          delivery_note_id: number
          product_id?: number | null
          description: string
          quantity: number
        }
        Update: {
          id?: number
          delivery_note_id?: number
          product_id?: number | null
          description?: string
          quantity?: number
        }
      }
      invoices: {
        Row: {
          id: number
          company_id: number
          customer_id: number
          quotation_id: number | null
          invoice_number: string
          invoice_date: string | null
          due_date: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          paid_amount: number | null
          balance_due: number | null
          lpo_number: string | null
          status: string | null
          created_by: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          customer_id: number
          quotation_id?: number | null
          invoice_number: string
          invoice_date?: string | null
          due_date?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          paid_amount?: number | null
          balance_due?: number | null
          lpo_number?: string | null
          status?: string | null
          created_by?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          customer_id?: number
          quotation_id?: number | null
          invoice_number?: string
          invoice_date?: string | null
          due_date?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          paid_amount?: number | null
          balance_due?: number | null
          lpo_number?: string | null
          status?: string | null
          created_by?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: number
          invoice_id: number
          product_id: number | null
          description: string
          quantity: number
          unit_price: number
          tax_percentage: number | null
          tax_amount: number | null
          tax_inclusive: number | null
          tax_setting_id: number | null
          line_total: number
          sort_order: number | null
        }
        Insert: {
          id?: number
          invoice_id: number
          product_id?: number | null
          description: string
          quantity: number
          unit_price: number
          tax_percentage?: number | null
          tax_amount?: number | null
          tax_inclusive?: number | null
          tax_setting_id?: number | null
          line_total: number
          sort_order?: number | null
        }
        Update: {
          id?: number
          invoice_id?: number
          product_id?: number | null
          description?: string
          quantity?: number
          unit_price?: number
          tax_percentage?: number | null
          tax_amount?: number | null
          tax_inclusive?: number | null
          tax_setting_id?: number | null
          line_total?: number
          sort_order?: number | null
        }
      }
      logs: {
        Row: {
          id: number
          message: string | null
          level: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          message?: string | null
          level?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          message?: string | null
          level?: string | null
          created_at?: string | null
        }
      }
      lpos: {
        Row: {
          id: number
          company_id: number
          supplier_id: number | null
          lpo_number: string
          total_amount: number | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          supplier_id?: number | null
          lpo_number: string
          total_amount?: number | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          supplier_id?: number | null
          lpo_number?: string
          total_amount?: number | null
          status?: string | null
          created_at?: string | null
        }
      }
      lpo_items: {
        Row: {
          id: number
          lpo_id: number
          product_id: number | null
          description: string
          quantity: number
          unit_price: number
          line_total: number
        }
        Insert: {
          id?: number
          lpo_id: number
          product_id?: number | null
          description: string
          quantity: number
          unit_price: number
          line_total: number
        }
        Update: {
          id?: number
          lpo_id?: number
          product_id?: number | null
          description?: string
          quantity?: number
          unit_price?: number
          line_total?: number
        }
      }
      migration_logs: {
        Row: {
          id: number
          migration_name: string
          executed_at: string | null
        }
        Insert: {
          id?: number
          migration_name: string
          executed_at?: string | null
        }
        Update: {
          id?: number
          migration_name?: string
          executed_at?: string | null
        }
      }
      newsletter: {
        Row: {
          id: number
          email: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          email?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          email?: string | null
          created_at?: string | null
        }
      }
      payments: {
        Row: {
          id: number
          company_id: number
          invoice_id: number | null
          payment_date: string | null
          payment_method: string | null
          amount: number
          reference_number: string | null
          created_by: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          invoice_id?: number | null
          payment_date?: string | null
          payment_method?: string | null
          amount: number
          reference_number?: string | null
          created_by?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          invoice_id?: number | null
          payment_date?: string | null
          payment_method?: string | null
          amount?: number
          reference_number?: string | null
          created_by?: number | null
          created_at?: string | null
        }
      }
      payment_allocations: {
        Row: {
          id: number
          payment_id: number
          invoice_id: number
          amount: number
        }
        Insert: {
          id?: number
          payment_id: number
          invoice_id: number
          amount: number
        }
        Update: {
          id?: number
          payment_id?: number
          invoice_id?: number
          amount?: number
        }
      }
      payment_audit_log: {
        Row: {
          id: number
          action: string
          payment_id: number
          invoice_id: number
          payment_amount: number
          created_at: string | null
        }
        Insert: {
          id?: number
          action: string
          payment_id: number
          invoice_id: number
          payment_amount: number
          created_at?: string | null
        }
        Update: {
          id?: number
          action?: string
          payment_id?: number
          invoice_id?: number
          payment_amount?: number
          created_at?: string | null
        }
      }
      payment_methods: {
        Row: {
          id: number
          company_id: number
          name: string
          code: string
          is_active: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          name: string
          code: string
          is_active?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          name?: string
          code?: string
          is_active?: number | null
          created_at?: string | null
        }
      }
      portfolios: {
        Row: {
          id: number
          title: string | null
          website_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          title?: string | null
          website_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          title?: string | null
          website_url?: string | null
          created_at?: string | null
        }
      }
      products: {
        Row: {
          id: number
          company_id: number
          category_id: number | null
          name: string
          description: string | null
          sku: string | null
          unit_of_measure: string | null
          stock_quantity: number | null
          reorder_level: number | null
          unit_price: number
          cost_price: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          category_id?: number | null
          name: string
          description?: string | null
          sku?: string | null
          unit_of_measure?: string | null
          stock_quantity?: number | null
          reorder_level?: number | null
          unit_price: number
          cost_price?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          category_id?: number | null
          name?: string
          description?: string | null
          sku?: string | null
          unit_of_measure?: string | null
          stock_quantity?: number | null
          reorder_level?: number | null
          unit_price?: number
          cost_price?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      product_categories: {
        Row: {
          id: number
          company_id: number
          name: string
          description: string | null
          is_active: number | null
          product_code: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          name: string
          description?: string | null
          is_active?: number | null
          product_code?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          name?: string
          description?: string | null
          is_active?: number | null
          product_code?: string | null
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: number
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string | null
          status: string | null
          phone: string | null
          company_id: number | null
          department: string | null
          position: string | null
          invited_by: number | null
          invited_at: string | null
          last_login: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          status?: string | null
          phone?: string | null
          company_id?: number | null
          department?: string | null
          position?: string | null
          invited_by?: number | null
          invited_at?: string | null
          last_login?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          status?: string | null
          phone?: string | null
          company_id?: number | null
          department?: string | null
          position?: string | null
          invited_by?: number | null
          invited_at?: string | null
          last_login?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      proforma_invoices: {
        Row: {
          id: number
          company_id: number
          customer_id: number
          proforma_number: string
          proforma_date: string | null
          subtotal: number | null
          tax_percentage: number | null
          tax_amount: number | null
          total_amount: number | null
          notes: string | null
          valid_until: string | null
          terms_and_conditions: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          customer_id: number
          proforma_number: string
          proforma_date?: string | null
          subtotal?: number | null
          tax_percentage?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          notes?: string | null
          valid_until?: string | null
          terms_and_conditions?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          customer_id?: number
          proforma_number?: string
          proforma_date?: string | null
          subtotal?: number | null
          tax_percentage?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          notes?: string | null
          valid_until?: string | null
          terms_and_conditions?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      proforma_items: {
        Row: {
          id: number
          proforma_id: number
          product_id: number | null
          description: string
          quantity: number
          unit_price: number
          line_total: number
        }
        Insert: {
          id?: number
          proforma_id: number
          product_id?: number | null
          description: string
          quantity: number
          unit_price: number
          line_total: number
        }
        Update: {
          id?: number
          proforma_id?: number
          product_id?: number | null
          description?: string
          quantity?: number
          unit_price?: number
          line_total?: number
        }
      }
      quotations: {
        Row: {
          id: number
          company_id: number
          customer_id: number | null
          portfolio_id: number | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          quotation_number: string | null
          quotation_date: string | null
          valid_until: string | null
          project_description: string | null
          budget_range: string | null
          timeline: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          notes: string | null
          terms_and_conditions: string | null
          created_by: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          company_id?: number
          customer_id?: number | null
          portfolio_id?: number | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          quotation_number?: string | null
          quotation_date?: string | null
          valid_until?: string | null
          project_description?: string | null
          budget_range?: string | null
          timeline?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          notes?: string | null
          terms_and_conditions?: string | null
          created_by?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          customer_id?: number | null
          portfolio_id?: number | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          quotation_number?: string | null
          quotation_date?: string | null
          valid_until?: string | null
          project_description?: string | null
          budget_range?: string | null
          timeline?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          notes?: string | null
          terms_and_conditions?: string | null
          created_by?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      quotation_items: {
        Row: {
          id: number
          quotation_id: number
          product_id: number | null
          description: string
          quantity: number
          unit_price: number
          tax_percentage: number | null
          tax_amount: number | null
          tax_inclusive: number | null
          tax_setting_id: number | null
          line_total: number
          sort_order: number | null
        }
        Insert: {
          id?: number
          quotation_id: number
          product_id?: number | null
          description: string
          quantity: number
          unit_price: number
          tax_percentage?: number | null
          tax_amount?: number | null
          tax_inclusive?: number | null
          tax_setting_id?: number | null
          line_total: number
          sort_order?: number | null
        }
        Update: {
          id?: number
          quotation_id?: number
          product_id?: number | null
          description?: string
          quantity?: number
          unit_price?: number
          tax_percentage?: number | null
          tax_amount?: number | null
          tax_inclusive?: number | null
          tax_setting_id?: number | null
          line_total?: number
          sort_order?: number | null
        }
      }
      remittance_advice: {
        Row: {
          id: number
          company_id: number
          supplier_id: number | null
          remittance_number: string
          total_amount: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          supplier_id?: number | null
          remittance_number: string
          total_amount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          supplier_id?: number | null
          remittance_number?: string
          total_amount?: number | null
          created_at?: string | null
        }
      }
      remittance_advice_items: {
        Row: {
          id: number
          remittance_id: number
          invoice_number: string | null
          amount: number
        }
        Insert: {
          id?: number
          remittance_id: number
          invoice_number?: string | null
          amount: number
        }
        Update: {
          id?: number
          remittance_id?: number
          invoice_number?: string | null
          amount?: number
        }
      }
      roles: {
        Row: {
          id: number
          company_id: number
          name: string
          role_type: string
          description: string | null
          permissions: Json | null
          is_default: number | null
          is_active: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          name: string
          role_type: string
          description?: string | null
          permissions?: Json | null
          is_default?: number | null
          is_active?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          name?: string
          role_type?: string
          description?: string | null
          permissions?: Json | null
          is_default?: number | null
          is_active?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      stock_movements: {
        Row: {
          id: number
          company_id: number
          product_id: number
          movement_type: string
          reference_type: string | null
          reference_id: number | null
          quantity: number
          cost_per_unit: number | null
          notes: string | null
          movement_date: string | null
          created_by: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          product_id: number
          movement_type: string
          reference_type?: string | null
          reference_id?: number | null
          quantity: number
          cost_per_unit?: number | null
          notes?: string | null
          movement_date?: string | null
          created_by?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          product_id?: number
          movement_type?: string
          reference_type?: string | null
          reference_id?: number | null
          quantity?: number
          cost_per_unit?: number | null
          notes?: string | null
          movement_date?: string | null
          created_by?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      suppliers: {
        Row: {
          id: number
          company_id: number
          name: string
          email: string | null
          phone: string | null
          address: string | null
          contact_person: string | null
          payment_terms: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          contact_person?: string | null
          payment_terms?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          contact_person?: string | null
          payment_terms?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tax_settings: {
        Row: {
          id: number
          company_id: number
          name: string
          rate: number | null
          is_active: number | null
          is_default: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          company_id: number
          name: string
          rate?: number | null
          is_active?: number | null
          is_default?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          company_id?: number
          name?: string
          rate?: number | null
          is_active?: number | null
          is_default?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      users: {
        Row: {
          id: number
          email: string | null
          password: string | null
          role: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          email?: string | null
          password?: string | null
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          email?: string | null
          password?: string | null
          role?: string | null
          created_at?: string | null
        }
      }
      user_invitations: {
        Row: {
          id: number
          email: string
          role: string | null
          company_id: number
          invited_by: number | null
          invited_at: string | null
          expires_at: string | null
          accepted_at: string | null
          is_approved: number | null
          approved_by: number | null
          approved_at: string | null
          status: string | null
          invitation_token: string | null
        }
        Insert: {
          id?: number
          email: string
          role?: string | null
          company_id: number
          invited_by?: number | null
          invited_at?: string | null
          expires_at?: string | null
          accepted_at?: string | null
          is_approved?: number | null
          approved_by?: number | null
          approved_at?: string | null
          status?: string | null
          invitation_token?: string | null
        }
        Update: {
          id?: number
          email?: string
          role?: string | null
          company_id?: number
          invited_by?: number | null
          invited_at?: string | null
          expires_at?: string | null
          accepted_at?: string | null
          is_approved?: number | null
          approved_by?: number | null
          approved_at?: string | null
          status?: string | null
          invitation_token?: string | null
        }
      }
      user_permissions: {
        Row: {
          id: number
          user_id: number
          permission_name: string
          granted: number | null
          granted_by: number | null
          granted_at: string | null
        }
        Insert: {
          id?: number
          user_id: number
          permission_name: string
          granted?: number | null
          granted_by?: number | null
          granted_at?: string | null
        }
        Update: {
          id?: number
          user_id?: number
          permission_name?: string
          granted?: number | null
          granted_by?: number | null
          granted_at?: string | null
        }
      }
      web_app_leads: {
        Row: {
          id: number
          name: string | null
          email: string | null
          message: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          email?: string | null
          message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          email?: string | null
          message?: string | null
          created_at?: string | null
        }
      }
      web_categories: {
        Row: {
          id: number
          name: string
          slug: string
          is_active: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          slug: string
          is_active?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          is_active?: number | null
          created_at?: string | null
        }
      }
      web_variants: {
        Row: {
          id: number
          category_id: number
          name: string
          sku: string
          is_active: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          category_id: number
          name: string
          sku: string
          is_active?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          category_id?: number
          name?: string
          sku?: string
          is_active?: number | null
          created_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export const Constants = {
  public: {
    Enums: {},
  },
} as const
