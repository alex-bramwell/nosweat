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
  type: 'amrap' | 'fortime' | 'emom' | 'strength' | 'endurance';
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
  workoutType: 'amrap' | 'fortime' | 'emom' | 'strength' | 'endurance';
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
  isAdmin: boolean;
  isCoach: boolean;
}
