// Core data types for CrossFit Comet

export interface Program {
  id: string;
  title: string;
  description: string;
  features: string[];
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  image?: string;
  price?: number;
  priceUnit?: string;
  priceNote?: string;
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  bio: string;
  certifications: string[];
  specialties: string[];
  image?: string;
}

export interface Stat {
  id: string;
  value: string | number;
  label: string;
  suffix?: string;
}

export interface WOD {
  id: string;
  date: string;
  title: string;
  description: string;
  movements: string[];
  type: 'amrap' | 'fortime' | 'emom' | 'tabata' | 'strength' | 'endurance';
  duration?: string;
  rounds?: number;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'week' | 'day';
  features: string[];
  popular?: boolean;
  dropIn?: boolean;
}

export interface ClassSchedule {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  time: string;
  className: string;
  coach?: string;
  capacity?: number;
}

export interface Booking {
  id: string;
  userId: string;
  classId: string;
  classDay: string;
  classTime: string;
  className: string;
  coachName?: string;
  bookingType: 'day-pass' | 'trial' | 'membership';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookedAt: string;
  classDate: string;
  paymentId?: string;
}

export interface Payment {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentType: 'day-pass' | 'trial-setup' | 'membership';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface TrialMembership {
  id: string;
  userId: string;
  stripeSetupIntentId?: string;
  stripePaymentMethodId?: string;
  trialStartDate: string;
  trialEndDate: string;
  status: 'active' | 'converted' | 'cancelled' | 'expired';
  autoConvertEnabled: boolean;
  createdAt: string;
}

export interface RegistrationIntent {
  type: 'day-pass' | 'trial' | null;
  selectedClass?: {
    id: string;
    day: string;
    time: string;
    className: string;
    coach?: string;
  };
  timestamp: number;
  step: 'intent' | 'auth' | 'payment' | 'class-selection' | 'complete';
}

// Extended WOD type with database fields
export interface WorkoutDB extends WOD {
  warmup?: string[];
  strength?: string[];
  metcon?: string[];
  cooldown?: string[];
  coachNotes?: string;
  scalingNotes?: string;
  loading_focus?: LoadingFocus;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  status: 'draft' | 'published';
}

// Workout form data for creating/editing
export interface WorkoutFormData {
  date: string;
  title: string;
  description: string;
  workoutType: 'amrap' | 'fortime' | 'emom' | 'tabata' | 'strength' | 'endurance';
  duration?: string;
  rounds?: number;
  warmup?: string[];
  strength?: string[];
  metcon?: string[];
  cooldown?: string[];
  movements: string[];
  coachNotes?: string;
  scalingNotes?: string;
  status: 'draft' | 'published';
}

// Role-based permission helper type
export interface UserPermissions {
  canViewCoachDashboard: boolean;
  canCreateWorkouts: boolean;
  canEditWorkouts: boolean;
  canDeleteWorkouts: boolean;
  canManageUsers: boolean;
  canInviteUsers: boolean;
  isAdmin: boolean;
  isCoach: boolean;
  isStaff: boolean;
}

// CrossFit Movement types
export type MuscleGroup = 'shoulders' | 'back' | 'chest' | 'arms' | 'legs' | 'core' | 'full body';

export type MovementCategory = 'gymnastic' | 'weightlifting' | 'metabolic' | 'skill';
export type MovementSubcategory = 'Olympic' | 'Powerlifting' | 'Bodybuilding' | 'Gymnastic Strength' | 'Gymnastic Skill' | 'Cardio' | 'Accessory';
export type WorkoutSection = 'warmup' | 'strength' | 'metcon' | 'cooldown';
export type MovementDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type FunctionalPattern = 'squat' | 'hinge' | 'push' | 'pull' | 'lunge' | 'carry' | 'core' | 'monostructural' | 'other';
export type LoadingFocus = 'light' | 'moderate' | 'heavy';

export interface CrossFitMovement {
  id: string;
  name: string;
  category: MovementCategory;
  subcategory?: MovementSubcategory;
  primary_muscle_groups: MuscleGroup[];
  secondary_muscle_groups: MuscleGroup[];
  functional_pattern?: FunctionalPattern;
  equipment: string[];
  difficulty: MovementDifficulty;
  description?: string;
  scaling_options: string[];
  recommended_sections?: WorkoutSection[]; // Which sections this movement is appropriate for
  created_at?: string;
  updated_at?: string;
}

// Movement selection in workout builder
export interface MovementSelection {
  movement: CrossFitMovement;
  reps?: string;
  weight?: string;
  distance?: string;
  duration?: string;
  notes?: string;
}

// Analytics types
export interface MuscleGroupStats {
  muscleGroup: MuscleGroup;
  hitCount: number; // Primary = 1.0, Secondary = 0.5
  percentage: number;
}

export interface WorkoutTypeStats {
  type: 'amrap' | 'fortime' | 'emom' | 'tabata' | 'strength' | 'endurance';
  count: number;
  percentage: number;
}

export interface MovementUsageStats {
  movementName: string;
  count: number;
  rank: number;
}

export interface MuscleGroupBias {
  muscleGroup: MuscleGroup;
  hitCount: number;
  percentage: number;
  status: 'balanced' | 'underused' | 'overused';
  recommendation: string;
}

export interface DailyMuscleGroupData {
  date: string;
  dayLabel: string; // e.g., "Mon", "Tue"
  muscleGroups: {
    muscleGroup: MuscleGroup;
    hitCount: number;
  }[];
}

export interface WorkoutAnalytics {
  dateRange: {
    start: string;
    end: string;
  };
  totalWorkouts: number;
  muscleGroupDistribution: MuscleGroupStats[];
  dailyMuscleData: DailyMuscleGroupData[];
  workoutTypeBreakdown: WorkoutTypeStats[];
  topMovements: MovementUsageStats[];
  detectedBiases: MuscleGroupBias[];
  recommendations: string[];
  modalityDistribution: { modality: 'Monostructural' | 'Gymnastics' | 'Weightlifting'; percentage: number; count: number }[];
  functionalPatternBreakdown: { pattern: FunctionalPattern; count: number; percentage: number }[];
  heavyDaysCount: number;
  timeDomainBreakdown: TimeDomainStats[];
}

export interface TimeDomainStats {
  domain: 'Sprint' | 'Short' | 'Medium' | 'Long';
  count: number;
  percentage: number;
}

export type AnalyticsPeriod = '7days' | '30days' | '1year';
