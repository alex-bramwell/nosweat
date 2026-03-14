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

// ── Sample month of workouts (for site builder preview) ──

const WORKOUT_TEMPLATES: Pick<WorkoutDB, 'title' | 'type' | 'description' | 'movements' | 'metcon' | 'warmup' | 'strength' | 'duration'>[] = [
  { title: 'Fran', type: 'fortime', description: 'Classic benchmark. Fast and intense.', movements: ['Thrusters', 'Pull-Ups'], metcon: ['21 Thrusters (43/30 kg)', '21 Pull-Ups', '15 Thrusters', '15 Pull-Ups', '9 Thrusters', '9 Pull-Ups'], warmup: ['400m Row', 'PVC Pass-Throughs x 10'], strength: [], duration: '10 min cap' },
  { title: 'Back Squat Day', type: 'strength', description: 'Heavy back squats with accessory work.', movements: ['Back Squat', 'GHD Sit-Ups'], metcon: [], warmup: ['3 min Bike', 'Leg Swings x 10/side'], strength: ['Back Squat 5-5-5-5-5', 'GHD Sit-Ups 3x15'], duration: '45 min' },
  { title: 'Murph Prep', type: 'fortime', description: 'Partition the reps however you like.', movements: ['Run', 'Pull-Ups', 'Push-Ups', 'Squats'], metcon: ['800m Run', '50 Pull-Ups', '100 Push-Ups', '150 Squats', '800m Run'], warmup: ['200m Jog', 'Arm Circles'], strength: [], duration: '40 min cap' },
  { title: 'EMOM Conditioning', type: 'emom', description: 'Every minute on the minute for 20 minutes.', movements: ['Kettlebell Swings', 'Box Jumps', 'Burpees', 'Rowing'], metcon: ['Min 1: 15 KB Swings', 'Min 2: 12 Box Jumps', 'Min 3: 10 Burpees', 'Min 4: 15 Cal Row'], warmup: ['500m Row', 'KB Deadlifts x 10'], strength: [], duration: '20 min' },
  { title: 'Deadlift & Metcon', type: 'strength', description: 'Build to a heavy set then hit a short metcon.', movements: ['Deadlift', 'Wall Balls', 'Double-Unders'], metcon: ['3 Rounds:', '12 Wall Balls (9/6 kg)', '30 Double-Unders'], warmup: ['Good Mornings x 10', 'Banded Walks x 20'], strength: ['Deadlift 3-3-3-3-3'], duration: '50 min' },
  { title: 'Tabata Burnout', type: 'tabata', description: '8 rounds of 20s on / 10s off per movement.', movements: ['Air Squats', 'Push-Ups', 'Sit-Ups', 'Burpees'], metcon: ['Tabata Air Squats', 'Tabata Push-Ups', 'Tabata Sit-Ups', 'Tabata Burpees'], warmup: ['200m Run', 'Inch Worms x 5'], strength: [], duration: '20 min' },
  { title: 'Clean Complex', type: 'strength', description: 'Hang clean + clean + front squat + jerk.', movements: ['Hang Clean', 'Clean', 'Front Squat', 'Jerk'], metcon: [], warmup: ['Barbell Warm-Up Complex', 'Muscle Cleans x 5'], strength: ['Complex: 1 HC + 1 Clean + 1 FS + 1 Jerk — build to heavy'], duration: '40 min' },
  { title: 'Cindy', type: 'amrap', description: '20 min AMRAP — classic bodyweight benchmark.', movements: ['Pull-Ups', 'Push-Ups', 'Air Squats'], metcon: ['5 Pull-Ups', '10 Push-Ups', '15 Air Squats'], warmup: ['400m Run', 'Kip Swings x 10'], strength: [], duration: '20 min' },
  { title: 'Row & Thruster', type: 'fortime', description: 'Couplet grind. Pace the row, push the thrusters.', movements: ['Row', 'Thrusters'], metcon: ['5 Rounds:', '500m Row', '12 Thrusters (43/30 kg)'], warmup: ['2 min Row', 'Barbell Front Squats x 8'], strength: [], duration: '25 min cap' },
  { title: 'Overhead Squat Focus', type: 'strength', description: 'Skill work and strength in the overhead squat.', movements: ['Overhead Squat', 'Snatch Balance'], metcon: ['3 Rounds: 8 OHS + 200m Run'], warmup: ['Snatch Grip Push Press x 8', 'OHS with PVC x 10'], strength: ['Overhead Squat 3-3-3-3'], duration: '45 min' },
  { title: '5K Row', type: 'endurance', description: 'Endurance piece. Set a consistent split.', movements: ['Row'], metcon: ['5,000m Row for Time'], warmup: ['1,000m Easy Row', 'Leg Swings'], strength: [], duration: '25 min' },
  { title: 'Grace', type: 'fortime', description: '30 clean and jerks for time.', movements: ['Clean & Jerk'], metcon: ['30 Clean & Jerks (61/43 kg)'], warmup: ['Barbell Complex x 2 sets', 'Hang Cleans x 5'], strength: [], duration: '10 min cap' },
];

/** Generate a full month of sample workouts for the current month (weekdays only, skip Sun) */
export function generateSampleMonth(): { workouts: WorkoutDB[]; muscleGroups: Record<string, string[]> } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const muscleMap: Record<string, string[]> = {
    'Thrusters': ['legs', 'shoulders'],
    'Pull-Ups': ['back', 'arms'],
    'Back Squat': ['legs', 'core'],
    'Run': ['legs'],
    'Kettlebell Swings': ['back', 'legs'],
    'Box Jumps': ['legs'],
    'Burpees': ['full body'],
    'Rowing': ['back', 'legs'],
    'Deadlift': ['back', 'legs'],
    'Wall Balls': ['legs', 'shoulders'],
    'Air Squats': ['legs'],
    'Push-Ups': ['chest', 'arms'],
    'Sit-Ups': ['core'],
    'Hang Clean': ['legs', 'shoulders'],
    'Clean': ['legs', 'back'],
    'Front Squat': ['legs', 'core'],
    'Jerk': ['shoulders', 'legs'],
    'Row': ['back', 'legs'],
    'Overhead Squat': ['legs', 'shoulders'],
    'Clean & Jerk': ['legs', 'shoulders', 'back'],
  };

  const workouts: WorkoutDB[] = [];
  const workoutMuscleGroups: Record<string, string[]> = {};
  let templateIdx = 0;

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    const dow = date.getDay();
    if (dow === 0) continue; // skip Sunday

    const tpl = WORKOUT_TEMPLATES[templateIdx % WORKOUT_TEMPLATES.length];
    templateIdx++;

    const id = `sample-month-${day}`;
    const dateStr = date.toISOString().split('T')[0];
    const isDraft = day > lastDay - 3; // last few days are drafts

    workouts.push({
      id,
      date: dateStr,
      title: tpl.title,
      description: tpl.description,
      movements: tpl.movements,
      type: tpl.type as WorkoutDB['type'],
      duration: tpl.duration,
      metcon: tpl.metcon,
      warmup: tpl.warmup,
      strength: tpl.strength,
      cooldown: [],
      coachNotes: '',
      scalingNotes: '',
      status: isDraft ? 'draft' : 'published',
    });

    // Derive muscle groups from first 2 movements
    const muscles = tpl.movements
      .slice(0, 3)
      .flatMap((m) => muscleMap[m] || ['full body'])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);
    workoutMuscleGroups[id] = muscles;
  }

  return { workouts, muscleGroups: workoutMuscleGroups };
}

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
