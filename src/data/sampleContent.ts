/**
 * Sample content used for empty state previews in the site builder.
 * This data is never persisted — it only renders as greyed-out ghost content
 * so gym owners can see what populated sections will look like.
 */

import type { GymProgram, GymScheduleEntry, GymStat } from '../types/tenant';
import type { WorkoutDB, WorkoutAnalytics } from '../types';
import type { CoachProfile } from '../services/coachProfileService';

// ── Programs ──

export const SAMPLE_PROGRAMS: GymProgram[] = [
  {
    id: 'sample-1',
    gym_id: '',
    slug: 'crossfit',
    title: 'CrossFit',
    description: 'High-intensity functional fitness for all levels. Build strength, endurance, and flexibility.',
    tagline: null,
    overview: null,
    features: ['Expert coaching', 'Scalable workouts', 'Community support', 'Progress tracking'],
    benefits: [],
    who_is_it_for: [],
    level: 'all',
    price_pence: 9900,
    price_unit: '/month',
    price_note: null,
    schedule_info: '5 weekly sessions',
    sort_order: 0,
    is_active: true,
  },
  {
    id: 'sample-2',
    gym_id: '',
    slug: 'strength',
    title: 'Strength & Conditioning',
    description: 'Focused strength training with progressive overload programming.',
    tagline: null,
    overview: null,
    features: ['Personalised programming', 'Technique coaching', 'Strength benchmarks'],
    benefits: [],
    who_is_it_for: [],
    level: 'intermediate',
    price_pence: 7900,
    price_unit: '/month',
    price_note: null,
    schedule_info: '3 weekly sessions',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'sample-3',
    gym_id: '',
    slug: 'open-gym',
    title: 'Open Gym',
    description: 'Flexible access to train on your own schedule with full equipment availability.',
    tagline: null,
    overview: null,
    features: ['Full equipment access', 'Flexible hours', 'Self-guided training'],
    benefits: [],
    who_is_it_for: [],
    level: 'all',
    price_pence: 4900,
    price_unit: '/month',
    price_note: null,
    schedule_info: '7 days a week',
    sort_order: 2,
    is_active: true,
  },
];

// ── Workout of the Day ──

export const SAMPLE_WORKOUT: WorkoutDB = {
  id: 'sample-wod',
  date: new Date().toISOString().split('T')[0],
  title: 'Fran',
  description: 'Classic CrossFit benchmark workout. Push for a fast time with good form.',
  movements: ['Thrusters (43/30 kg)', 'Pull-Ups'],
  type: 'fortime',
  duration: '10 min cap',
  metcon: ['21 Thrusters (43/30 kg)', '21 Pull-Ups', '15 Thrusters', '15 Pull-Ups', '9 Thrusters', '9 Pull-Ups'],
  warmup: ['400m Row', 'PVC Pass-Throughs x 10', 'Air Squats x 15'],
  strength: [],
  cooldown: [],
  coachNotes: '',
  scalingNotes: '',
  status: 'published',
};

// ── Schedule ──

export const SAMPLE_SCHEDULE: GymScheduleEntry[] = [
  { id: 's-1', gym_id: '', day_of_week: 'monday', start_time: '6:00 AM', end_time: null, class_name: 'CrossFit', coach_id: null, program_id: null, max_capacity: 20, is_active: true },
  { id: 's-2', gym_id: '', day_of_week: 'monday', start_time: '12:00 PM', end_time: null, class_name: 'Open Gym', coach_id: null, program_id: null, max_capacity: 15, is_active: true },
  { id: 's-3', gym_id: '', day_of_week: 'monday', start_time: '5:30 PM', end_time: null, class_name: 'CrossFit', coach_id: null, program_id: null, max_capacity: 20, is_active: true },
  { id: 's-4', gym_id: '', day_of_week: 'tuesday', start_time: '6:00 AM', end_time: null, class_name: 'CrossFit', coach_id: null, program_id: null, max_capacity: 20, is_active: true },
  { id: 's-5', gym_id: '', day_of_week: 'tuesday', start_time: '5:30 PM', end_time: null, class_name: 'Specialty', coach_id: null, program_id: null, max_capacity: 12, is_active: true },
  { id: 's-6', gym_id: '', day_of_week: 'wednesday', start_time: '6:00 AM', end_time: null, class_name: 'CrossFit', coach_id: null, program_id: null, max_capacity: 20, is_active: true },
  { id: 's-7', gym_id: '', day_of_week: 'wednesday', start_time: '12:00 PM', end_time: null, class_name: 'Open Gym', coach_id: null, program_id: null, max_capacity: 15, is_active: true },
  { id: 's-8', gym_id: '', day_of_week: 'wednesday', start_time: '5:30 PM', end_time: null, class_name: 'CrossFit', coach_id: null, program_id: null, max_capacity: 20, is_active: true },
  { id: 's-9', gym_id: '', day_of_week: 'thursday', start_time: '6:00 AM', end_time: null, class_name: 'CrossFit', coach_id: null, program_id: null, max_capacity: 20, is_active: true },
  { id: 's-10', gym_id: '', day_of_week: 'thursday', start_time: '5:30 PM', end_time: null, class_name: 'Specialty', coach_id: null, program_id: null, max_capacity: 12, is_active: true },
  { id: 's-11', gym_id: '', day_of_week: 'friday', start_time: '6:00 AM', end_time: null, class_name: 'CrossFit', coach_id: null, program_id: null, max_capacity: 20, is_active: true },
  { id: 's-12', gym_id: '', day_of_week: 'friday', start_time: '12:00 PM', end_time: null, class_name: 'Open Gym', coach_id: null, program_id: null, max_capacity: 15, is_active: true },
  { id: 's-13', gym_id: '', day_of_week: 'saturday', start_time: '9:00 AM', end_time: null, class_name: 'CrossFit', coach_id: null, program_id: null, max_capacity: 20, is_active: true },
];

// ── Coaches ──

export const SAMPLE_COACHES: CoachProfile[] = [
  {
    id: 'sample-coach-1',
    email: '',
    fullName: 'Alex Thompson',
    title: 'Head Coach',
    bio: 'CrossFit Level 3 trainer with 8 years of coaching experience. Passionate about helping athletes reach their potential.',
    certifications: ['CrossFit Level 3', 'USAW Sports Performance'],
    specialties: ['Olympic Lifting', 'Mobility'],
    coachId: 'sample-coach-1',
    avatarUrl: null,
    services: [],
  },
  {
    id: 'sample-coach-2',
    email: '',
    fullName: 'Sarah Mitchell',
    title: 'Strength Coach',
    bio: 'Certified strength and conditioning specialist focused on progressive programming and injury prevention.',
    certifications: ['CSCS', 'CrossFit Level 2'],
    specialties: ['Powerlifting', 'Nutrition'],
    coachId: 'sample-coach-2',
    avatarUrl: null,
    services: [],
  },
  {
    id: 'sample-coach-3',
    email: '',
    fullName: 'James Rivera',
    title: 'Fitness Coach',
    bio: 'Former competitive athlete turned coach. Specialises in metabolic conditioning and functional fitness.',
    certifications: ['CrossFit Level 2', 'Precision Nutrition'],
    specialties: ['Endurance', 'Competition Prep'],
    coachId: 'sample-coach-3',
    avatarUrl: null,
    services: [],
  },
];

// ── Stats ──

export const SAMPLE_STATS: GymStat[] = [
  { id: 'sample-stat-1', gym_id: '', label: 'Weekly Classes', value: 25, suffix: '+', sort_order: 0 },
  { id: 'sample-stat-2', gym_id: '', label: 'Certified Coaches', value: 5, suffix: null, sort_order: 1 },
  { id: 'sample-stat-3', gym_id: '', label: 'Active Members', value: 150, suffix: '+', sort_order: 2 },
];

// ── Analytics ──

const sampleDays = (() => {
  const days = [];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({ date: d.toISOString().split('T')[0], dayLabel: labels[i] });
  }
  return days;
})();

export const SAMPLE_ANALYTICS: WorkoutAnalytics = {
  dateRange: { start: sampleDays[0].date, end: sampleDays[6].date },
  totalWorkouts: 5,
  muscleGroupDistribution: [
    { muscleGroup: 'legs', hitCount: 8, percentage: 24 },
    { muscleGroup: 'shoulders', hitCount: 6, percentage: 18 },
    { muscleGroup: 'back', hitCount: 5.5, percentage: 17 },
    { muscleGroup: 'core', hitCount: 5, percentage: 15 },
    { muscleGroup: 'chest', hitCount: 4.5, percentage: 14 },
    { muscleGroup: 'arms', hitCount: 4, percentage: 12 },
  ],
  dailyMuscleData: [
    { ...sampleDays[0], muscleGroups: [{ muscleGroup: 'legs', hitCount: 3 }, { muscleGroup: 'shoulders', hitCount: 2 }, { muscleGroup: 'core', hitCount: 1.5 }] },
    { ...sampleDays[1], muscleGroups: [{ muscleGroup: 'chest', hitCount: 2.5 }, { muscleGroup: 'arms', hitCount: 2 }, { muscleGroup: 'back', hitCount: 1 }] },
    { ...sampleDays[2], muscleGroups: [{ muscleGroup: 'back', hitCount: 3 }, { muscleGroup: 'shoulders', hitCount: 1.5 }, { muscleGroup: 'core', hitCount: 2 }] },
    { ...sampleDays[3], muscleGroups: [{ muscleGroup: 'legs', hitCount: 2.5 }, { muscleGroup: 'chest', hitCount: 2 }, { muscleGroup: 'arms', hitCount: 1 }] },
    { ...sampleDays[4], muscleGroups: [{ muscleGroup: 'shoulders', hitCount: 2.5 }, { muscleGroup: 'back', hitCount: 1.5 }, { muscleGroup: 'core', hitCount: 1.5 }, { muscleGroup: 'legs', hitCount: 2.5 }] },
    { ...sampleDays[5], muscleGroups: [] },
    { ...sampleDays[6], muscleGroups: [] },
  ],
  workoutTypeBreakdown: [
    { type: 'amrap', count: 2, percentage: 40 },
    { type: 'fortime', count: 1, percentage: 20 },
    { type: 'emom', count: 1, percentage: 20 },
    { type: 'strength', count: 1, percentage: 20 },
  ],
  topMovements: [
    { movementName: 'Back Squat', count: 3, rank: 1 },
    { movementName: 'Pull-Up', count: 3, rank: 2 },
    { movementName: 'Clean & Jerk', count: 2, rank: 3 },
    { movementName: 'Deadlift', count: 2, rank: 4 },
    { movementName: 'Burpee', count: 2, rank: 5 },
    { movementName: 'Rowing', count: 2, rank: 6 },
    { movementName: 'Thruster', count: 1, rank: 7 },
    { movementName: 'Toes-to-Bar', count: 1, rank: 8 },
    { movementName: 'Box Jump', count: 1, rank: 9 },
    { movementName: 'Shoulder Press', count: 1, rank: 10 },
  ],
  detectedBiases: [
    { muscleGroup: 'legs', hitCount: 8, percentage: 24, status: 'balanced', recommendation: 'Good volume for legs.' },
    { muscleGroup: 'shoulders', hitCount: 6, percentage: 18, status: 'balanced', recommendation: 'Well-balanced shoulder work.' },
    { muscleGroup: 'back', hitCount: 5.5, percentage: 17, status: 'balanced', recommendation: 'Good back training volume.' },
    { muscleGroup: 'core', hitCount: 5, percentage: 15, status: 'balanced', recommendation: 'Core is being targeted.' },
    { muscleGroup: 'chest', hitCount: 4.5, percentage: 14, status: 'balanced', recommendation: 'Chest is adequately covered.' },
    { muscleGroup: 'arms', hitCount: 4, percentage: 12, status: 'underused', recommendation: 'Consider adding more arm isolation work.' },
  ],
  recommendations: [
    'Excellent variety of workout types this week.',
    'Well-balanced muscle group targeting across sessions.',
    'Consider adding more arm-focused accessories to round out programming.',
  ],
  modalityDistribution: [
    { modality: 'Weightlifting', percentage: 40, count: 2 },
    { modality: 'Gymnastics', percentage: 35, count: 2 },
    { modality: 'Monostructural', percentage: 25, count: 1 },
  ],
  functionalPatternBreakdown: [
    { pattern: 'squat', count: 3, percentage: 20 },
    { pattern: 'hinge', count: 2, percentage: 13 },
    { pattern: 'push', count: 3, percentage: 20 },
    { pattern: 'pull', count: 3, percentage: 20 },
    { pattern: 'core', count: 2, percentage: 13 },
    { pattern: 'monostructural', count: 2, percentage: 13 },
  ],
  heavyDaysCount: 2,
  timeDomainBreakdown: [
    { domain: 'Sprint', count: 1, percentage: 20 },
    { domain: 'Short', count: 2, percentage: 40 },
    { domain: 'Medium', count: 1, percentage: 20 },
    { domain: 'Long', count: 1, percentage: 20 },
  ],
};
