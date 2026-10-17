// Auto-generated from the live Supabase schema via `supabase gen types typescript`
// (here: the Supabase MCP generate_typescript_types tool). Do not hand-edit —
// regenerate after every migration instead.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      dashboard_filters: {
        Row: {
          applies_to_widget_ids: string[];
          created_at: string;
          dashboard_id: string;
          default_value: Json | null;
          field_id: string;
          filter_type: string;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          applies_to_widget_ids?: string[];
          created_at?: string;
          dashboard_id: string;
          default_value?: Json | null;
          field_id: string;
          filter_type: string;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          applies_to_widget_ids?: string[];
          created_at?: string;
          dashboard_id?: string;
          default_value?: Json | null;
          field_id?: string;
          filter_type?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dashboard_filters_dashboard_id_fkey';
            columns: ['dashboard_id'];
            isOneToOne: false;
            referencedRelation: 'dashboards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboard_filters_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'dataset_fields';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboard_filters_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      dashboard_widgets: {
        Row: {
          created_at: string;
          dashboard_id: string;
          dataset_id: string;
          id: string;
          layout: Json;
          organization_id: string;
          query_config: Json;
          title: string | null;
          updated_at: string;
          visual_config: Json;
          widget_type: string;
        };
        Insert: {
          created_at?: string;
          dashboard_id: string;
          dataset_id: string;
          id?: string;
          layout?: Json;
          organization_id: string;
          query_config?: Json;
          title?: string | null;
          updated_at?: string;
          visual_config?: Json;
          widget_type: string;
        };
        Update: {
          created_at?: string;
          dashboard_id?: string;
          dataset_id?: string;
          id?: string;
          layout?: Json;
          organization_id?: string;
          query_config?: Json;
          title?: string | null;
          updated_at?: string;
          visual_config?: Json;
          widget_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dashboard_widgets_dashboard_id_fkey';
            columns: ['dashboard_id'];
            isOneToOne: false;
            referencedRelation: 'dashboards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboard_widgets_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboard_widgets_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      dashboards: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          is_published: boolean;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_published?: boolean;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dashboards_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      data_sources: {
        Row: {
          connection_options: Json;
          created_at: string;
          created_by: string | null;
          credential_ref: string;
          database_name: string;
          host: string;
          id: string;
          last_test_error: string | null;
          last_tested_at: string | null;
          name: string;
          organization_id: string;
          port: number;
          ssl_mode: string;
          status: string;
          type: string;
          updated_at: string;
          username: string;
        };
        Insert: {
          connection_options?: Json;
          created_at?: string;
          created_by?: string | null;
          credential_ref: string;
          database_name: string;
          host: string;
          id?: string;
          last_test_error?: string | null;
          last_tested_at?: string | null;
          name: string;
          organization_id: string;
          port?: number;
          ssl_mode?: string;
          status?: string;
          type?: string;
          updated_at?: string;
          username: string;
        };
        Update: {
          connection_options?: Json;
          created_at?: string;
          created_by?: string | null;
          credential_ref?: string;
          database_name?: string;
          host?: string;
          id?: string;
          last_test_error?: string | null;
          last_tested_at?: string | null;
          name?: string;
          organization_id?: string;
          port?: number;
          ssl_mode?: string;
          status?: string;
          type?: string;
          updated_at?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'data_sources_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      dataset_fields: {
        Row: {
          created_at: string;
          data_type: string;
          dataset_id: string;
          id: string;
          organization_id: string;
          source_column: string;
        };
        Insert: {
          created_at?: string;
          data_type: string;
          dataset_id: string;
          id?: string;
          organization_id: string;
          source_column: string;
        };
        Update: {
          created_at?: string;
          data_type?: string;
          dataset_id?: string;
          id?: string;
          organization_id?: string;
          source_column?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dataset_fields_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dataset_fields_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      datasets: {
        Row: {
          columns_cache: Json | null;
          created_at: string;
          created_by: string | null;
          data_source_id: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          source_sql: string | null;
          source_table_name: string | null;
          source_table_schema: string | null;
          source_type: string;
          updated_at: string;
        };
        Insert: {
          columns_cache?: Json | null;
          created_at?: string;
          created_by?: string | null;
          data_source_id: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          source_sql?: string | null;
          source_table_name?: string | null;
          source_table_schema?: string | null;
          source_type: string;
          updated_at?: string;
        };
        Update: {
          columns_cache?: Json | null;
          created_at?: string;
          created_by?: string | null;
          data_source_id?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          source_sql?: string | null;
          source_table_name?: string | null;
          source_table_schema?: string | null;
          source_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'datasets_data_source_id_fkey';
            columns: ['data_source_id'];
            isOneToOne: false;
            referencedRelation: 'data_sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'datasets_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      dimensions: {
        Row: {
          created_at: string;
          dataset_id: string;
          field_id: string;
          id: string;
          label: string;
          name: string;
          organization_id: string;
          time_grain: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dataset_id: string;
          field_id: string;
          id?: string;
          label: string;
          name: string;
          organization_id: string;
          time_grain?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dataset_id?: string;
          field_id?: string;
          id?: string;
          label?: string;
          name?: string;
          organization_id?: string;
          time_grain?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dimensions_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dimensions_field_id_fkey';
            columns: ['field_id'];
            isOneToOne: false;
            referencedRelation: 'dataset_fields';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dimensions_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          id: string;
          invited_email: string | null;
          organization_id: string;
          role: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invited_email?: string | null;
          organization_id: string;
          role: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          invited_email?: string | null;
          organization_id?: string;
          role?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'memberships_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      metrics: {
        Row: {
          aggregation: string;
          created_at: string;
          dataset_id: string;
          description: string | null;
          expression: Json;
          format: string;
          id: string;
          label: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          aggregation: string;
          created_at?: string;
          dataset_id: string;
          description?: string | null;
          expression: Json;
          format?: string;
          id?: string;
          label: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          aggregation?: string;
          created_at?: string;
          dataset_id?: string;
          description?: string | null;
          expression?: Json;
          format?: string;
          id?: string;
          label?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'metrics_dataset_id_fkey';
            columns: ['dataset_id'];
            isOneToOne: false;
            referencedRelation: 'datasets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'metrics_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          plan: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          plan?: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          plan?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_data_source_secret: {
        Args: { secret_name?: string; secret_value: string };
        Returns: string;
      };
      get_data_source_secret: {
        Args: { data_source_row_id: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
