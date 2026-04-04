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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      caseManagementConferences: {
        Row: {
          caseId: string
          conferenceClosedDate: string | null
          conferenceClosedTimer: Json | null
          createdBy: string
          form17And18Date: string | null
          form17And18DateTimer: Json | null
          hasClosed: boolean | null
          hasForm17And18BeingFilled: boolean | null
          id: string
          issuesDate: string | null
          issuesDateTimer: Json | null
        }
        Insert: {
          caseId: string
          conferenceClosedDate?: string | null
          conferenceClosedTimer?: Json | null
          createdBy: string
          form17And18Date?: string | null
          form17And18DateTimer?: Json | null
          hasClosed?: boolean | null
          hasForm17And18BeingFilled?: boolean | null
          id: string
          issuesDate?: string | null
          issuesDateTimer?: Json | null
        }
        Update: {
          caseId?: string
          conferenceClosedDate?: string | null
          conferenceClosedTimer?: Json | null
          createdBy?: string
          form17And18Date?: string | null
          form17And18DateTimer?: Json | null
          hasClosed?: boolean | null
          hasForm17And18BeingFilled?: boolean | null
          id?: string
          issuesDate?: string | null
          issuesDateTimer?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "caseManagementConferences_caseId_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caseManagementConferences_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          bailiffName: string | null
          caseType: string | null
          clientId: string | null
          commencementForm: string | null
          courtType: string | null
          createdAt: string
          createdBy: string
          dateOfCommencement: string | null
          dateOfFilling: string
          endDate: string | null
          id: string
          isArchived: boolean | null
          judgeName: string | null
          representingParty: string | null
          startDate: string | null
          status: string | null
          suitAppealNumber: string | null
          title: string
          updatedAt: string
          updatedBy: Json | null
        }
        Insert: {
          bailiffName?: string | null
          caseType?: string | null
          clientId?: string | null
          commencementForm?: string | null
          courtType?: string | null
          createdAt?: string
          createdBy: string
          dateOfCommencement?: string | null
          dateOfFilling: string
          endDate?: string | null
          id: string
          isArchived?: boolean | null
          judgeName?: string | null
          representingParty?: string | null
          startDate?: string | null
          status?: string | null
          suitAppealNumber?: string | null
          title: string
          updatedAt?: string
          updatedBy?: Json | null
        }
        Update: {
          bailiffName?: string | null
          caseType?: string | null
          clientId?: string | null
          commencementForm?: string | null
          courtType?: string | null
          createdAt?: string
          createdBy?: string
          dateOfCommencement?: string | null
          dateOfFilling?: string
          endDate?: string | null
          id?: string
          isArchived?: boolean | null
          judgeName?: string | null
          representingParty?: string | null
          startDate?: string | null
          status?: string | null
          suitAppealNumber?: string | null
          title?: string
          updatedAt?: string
          updatedBy?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_clientId_fkey"
            columns: ["clientId"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      caseStages: {
        Row: {
          caseId: string
          createdBy: string
          endDate: string | null
          id: string
          isCompleted: boolean | null
          percentageComplete: number
          stageName: string
          stageOrder: number
          startDate: string
        }
        Insert: {
          caseId: string
          createdBy: string
          endDate?: string | null
          id: string
          isCompleted?: boolean | null
          percentageComplete?: number
          stageName: string
          stageOrder: number
          startDate: string
        }
        Update: {
          caseId?: string
          createdBy?: string
          endDate?: string | null
          id?: string
          isCompleted?: boolean | null
          percentageComplete?: number
          stageName?: string
          stageOrder?: number
          startDate?: string
        }
        Relationships: [
          {
            foreignKeyName: "caseStages_caseId_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caseStages_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      caseTimers: {
        Row: {
          caseId: string
          createdBy: string
          daysRemaining: number
          dueDate: string
          durationDays: number
          id: string
          isExpired: boolean
          isPaused: boolean | null
          isSuspended: boolean | null
          name: string
          pausedAt: string | null
          refId: string | null
          resumedAt: string | null
          stage: string | null
          startDate: string
          timerDuration: string | null
          type: string
        }
        Insert: {
          caseId: string
          createdBy: string
          daysRemaining?: number
          dueDate: string
          durationDays: number
          id: string
          isExpired?: boolean
          isPaused?: boolean | null
          isSuspended?: boolean | null
          name: string
          pausedAt?: string | null
          refId?: string | null
          resumedAt?: string | null
          stage?: string | null
          startDate: string
          timerDuration?: string | null
          type?: string
        }
        Update: {
          caseId?: string
          createdBy?: string
          daysRemaining?: number
          dueDate?: string
          durationDays?: number
          id?: string
          isExpired?: boolean
          isPaused?: boolean | null
          isSuspended?: boolean | null
          name?: string
          pausedAt?: string | null
          refId?: string | null
          resumedAt?: string | null
          stage?: string | null
          startDate?: string
          timerDuration?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "caseTimers_caseId_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caseTimers_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          caseId: string | null
          clientType: string | null
          createdAt: string
          createdBy: string
          dob: string | null
          email: string | null
          id: string
          isArchived: boolean | null
          name: string | null
          nationality: string | null
          phoneNumber: string | null
          state: string | null
          updatedAt: string
          updatedBy: Json | null
        }
        Insert: {
          address?: string | null
          caseId?: string | null
          clientType?: string | null
          createdAt?: string
          createdBy: string
          dob?: string | null
          email?: string | null
          id: string
          isArchived?: boolean | null
          name?: string | null
          nationality?: string | null
          phoneNumber?: string | null
          state?: string | null
          updatedAt?: string
          updatedBy?: Json | null
        }
        Update: {
          address?: string | null
          caseId?: string | null
          clientType?: string | null
          createdAt?: string
          createdBy?: string
          dob?: string | null
          email?: string | null
          id?: string
          isArchived?: boolean | null
          name?: string | null
          nationality?: string | null
          phoneNumber?: string | null
          state?: string | null
          updatedAt?: string
          updatedBy?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_caseId_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notificationPreferences: {
        Row: {
          allActivities: boolean
          createdAt: string
          criticalActivities: boolean
          id: string
          stageMovement: boolean
          updatedAt: string
          userId: string
        }
        Insert: {
          allActivities?: boolean
          createdAt?: string
          criticalActivities?: boolean
          id: string
          stageMovement?: boolean
          updatedAt?: string
          userId: string
        }
        Update: {
          allActivities?: boolean
          createdAt?: string
          criticalActivities?: boolean
          id?: string
          stageMovement?: boolean
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificationPreferences_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      passwordResetTokens: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          tokenHash: string
          used: boolean | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          tokenHash: string
          used?: boolean | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          tokenHash?: string
          used?: boolean | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "passwordResetTokens_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pleadings: {
        Row: {
          caseId: string
          counterClaimResp: string | null
          counterClaimRespTimer: Json | null
          createdBy: string
          hasClosed: boolean | null
          id: string
          originatingRespTimer: Json | null
          originatingRespType: string | null
          pleadingsClosedDate: string | null
          pleadingsClosedTimer: Json | null
          replyDate: string | null
          replyDateTimer: Json | null
          responseType: string | null
          serviceDate: string | null
          serviceDateTimer: Json | null
        }
        Insert: {
          caseId: string
          counterClaimResp?: string | null
          counterClaimRespTimer?: Json | null
          createdBy: string
          hasClosed?: boolean | null
          id: string
          originatingRespTimer?: Json | null
          originatingRespType?: string | null
          pleadingsClosedDate?: string | null
          pleadingsClosedTimer?: Json | null
          replyDate?: string | null
          replyDateTimer?: Json | null
          responseType?: string | null
          serviceDate?: string | null
          serviceDateTimer?: Json | null
        }
        Update: {
          caseId?: string
          counterClaimResp?: string | null
          counterClaimRespTimer?: Json | null
          createdBy?: string
          hasClosed?: boolean | null
          id?: string
          originatingRespTimer?: Json | null
          originatingRespType?: string | null
          pleadingsClosedDate?: string | null
          pleadingsClosedTimer?: Json | null
          replyDate?: string | null
          replyDateTimer?: Json | null
          responseType?: string | null
          serviceDate?: string | null
          serviceDateTimer?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pleadings_caseId_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pleadings_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refreshTokens: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          token: string
          userId: string | null
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          token: string
          userId?: string | null
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          token?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refreshTokens_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          createdAt: string
          createdBy: string | null
          description: string | null
          id: string
          name: string
          updatedAt: string
          updatedBy: string | null
        }
        Insert: {
          createdAt?: string
          createdBy?: string | null
          description?: string | null
          id: string
          name: string
          updatedAt?: string
          updatedBy?: string | null
        }
        Update: {
          createdAt?: string
          createdBy?: string | null
          description?: string | null
          id?: string
          name?: string
          updatedAt?: string
          updatedBy?: string | null
        }
        Relationships: []
      }
      stageEvents: {
        Row: {
          caseId: string
          createdBy: string
          description: string | null
          dueDate: string | null
          eventDate: string
          eventType: string
          id: string
          stageName: string
          timerDays: number
        }
        Insert: {
          caseId: string
          createdBy: string
          description?: string | null
          dueDate?: string | null
          eventDate: string
          eventType: string
          id: string
          stageName: string
          timerDays: number
        }
        Update: {
          caseId?: string
          createdBy?: string
          description?: string | null
          dueDate?: string | null
          eventDate?: string
          eventType?: string
          id?: string
          stageName?: string
          timerDays?: number
        }
        Relationships: [
          {
            foreignKeyName: "stageEvents_caseId_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stageEvents_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trials: {
        Row: {
          caseId: string
          createdBy: string
          defendantGaveEvidence: boolean | null
          firstFinalAddressBy: Database["public"]["Enums"]["party_role"] | null
          firstFinalAddressDate: string | null
          firstFinalAddressTimer: Json | null
          id: string
          judgementDate: string | null
          opposingFinalAddressBy:
            | Database["public"]["Enums"]["party_role"]
            | null
          opposingFinalAddressDate: string | null
          opposingFinalAddressTimer: Json | null
          replyAddressDate: string | null
          replyBy: Database["public"]["Enums"]["party_role"] | null
          replyTimer: Json | null
          trialEndDate: string | null
          trialEndDateTimer: Json | null
          trialStartDate: string | null
          whoWritesFirst: string | null
        }
        Insert: {
          caseId: string
          createdBy: string
          defendantGaveEvidence?: boolean | null
          firstFinalAddressBy?: Database["public"]["Enums"]["party_role"] | null
          firstFinalAddressDate?: string | null
          firstFinalAddressTimer?: Json | null
          id: string
          judgementDate?: string | null
          opposingFinalAddressBy?:
            | Database["public"]["Enums"]["party_role"]
            | null
          opposingFinalAddressDate?: string | null
          opposingFinalAddressTimer?: Json | null
          replyAddressDate?: string | null
          replyBy?: Database["public"]["Enums"]["party_role"] | null
          replyTimer?: Json | null
          trialEndDate?: string | null
          trialEndDateTimer?: Json | null
          trialStartDate?: string | null
          whoWritesFirst?: string | null
        }
        Update: {
          caseId?: string
          createdBy?: string
          defendantGaveEvidence?: boolean | null
          firstFinalAddressBy?: Database["public"]["Enums"]["party_role"] | null
          firstFinalAddressDate?: string | null
          firstFinalAddressTimer?: Json | null
          id?: string
          judgementDate?: string | null
          opposingFinalAddressBy?:
            | Database["public"]["Enums"]["party_role"]
            | null
          opposingFinalAddressDate?: string | null
          opposingFinalAddressTimer?: Json | null
          replyAddressDate?: string | null
          replyBy?: Database["public"]["Enums"]["party_role"] | null
          replyTimer?: Json | null
          trialEndDate?: string | null
          trialEndDateTimer?: Json | null
          trialStartDate?: string | null
          whoWritesFirst?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trials_caseId_fkey"
            columns: ["caseId"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trials_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          createdAt: string
          createdBy: string | null
          email: string
          emailOtp: string | null
          emailOtpExpires: string | null
          firstName: string
          googleId: string | null
          hasAcceptedTerms: boolean
          id: string
          isArchived: boolean | null
          isVerified: boolean
          lastLogin: string | null
          lastName: string
          nationality: string | null
          password: string | null
          picture: string | null
          provider: string
          resetToken: string | null
          resetTokenExpiry: string | null
          roleId: string | null
          state: string | null
          updatedAt: string
          updatedBy: string | null
        }
        Insert: {
          createdAt?: string
          createdBy?: string | null
          email: string
          emailOtp?: string | null
          emailOtpExpires?: string | null
          firstName: string
          googleId?: string | null
          hasAcceptedTerms?: boolean
          id: string
          isArchived?: boolean | null
          isVerified?: boolean
          lastLogin?: string | null
          lastName: string
          nationality?: string | null
          password?: string | null
          picture?: string | null
          provider?: string
          resetToken?: string | null
          resetTokenExpiry?: string | null
          roleId?: string | null
          state?: string | null
          updatedAt?: string
          updatedBy?: string | null
        }
        Update: {
          createdAt?: string
          createdBy?: string | null
          email?: string
          emailOtp?: string | null
          emailOtpExpires?: string | null
          firstName?: string
          googleId?: string | null
          hasAcceptedTerms?: boolean
          id?: string
          isArchived?: boolean | null
          isVerified?: boolean
          lastLogin?: string | null
          lastName?: string
          nationality?: string | null
          password?: string | null
          picture?: string | null
          provider?: string
          resetToken?: string | null
          resetTokenExpiry?: string | null
          roleId?: string | null
          state?: string | null
          updatedAt?: string
          updatedBy?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_roleId_fkey"
            columns: ["roleId"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      party_role: "Claimant" | "Defendant"
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
      party_role: ["Claimant", "Defendant"],
    },
  },
} as const
