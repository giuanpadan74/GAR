export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          full_name: string | null
          phone_number: string | null
          role: 'admin' | 'agente' | 'operatore'
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          full_name?: string | null
          phone_number?: string | null
          role: 'admin' | 'agente' | 'operatore'
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          full_name?: string | null
          phone_number?: string | null
          role?: 'admin' | 'agente' | 'operatore'
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: number
          name: string
          phone: string
          email: string
          color: string
          user_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          phone: string
          email: string
          color: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          phone?: string
          email?: string
          color?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      agent_municipalities: {
        Row: {
          id: number
          agent_id: number
          municipality_code: number
          created_at: string
        }
        Insert: {
          id?: number
          agent_id: number
          municipality_code: number
          created_at?: string
        }
        Update: {
          id?: number
          agent_id?: number
          municipality_code?: number
          created_at?: string
        }
      }
      user_municipalities: {
        Row: {
          id: number
          user_id: string
          municipality_code: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          municipality_code: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          municipality_code?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'agente' | 'operatore'
    }
  }
}