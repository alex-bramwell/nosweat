/**
 * Analytics Service
 * Provides workout analytics and programming insights for coaches
 */

import { supabase } from '../lib/supabase';
import { movementService } from './movementService';
import type {
  WorkoutDB,
  WorkoutAnalytics,
  MuscleGroupStats,
  WorkoutTypeStats,
  MovementUsageStats,
  MuscleGroupBias,
  AnalyticsPeriod,
  MuscleGroup,
  CrossFitMovement,
  DailyMuscleGroupData,
  FunctionalPattern,
  TimeDomainStats
} from '../types';

// Common CrossFit movement abbreviations
const MOVEMENT_ABBREVIATIONS: Record<string, string> = {
  'ctb': 'Chest-to-Bar Pull-Up',
  'c2b': 'Chest-to-Bar Pull-Up',
  'hspu': 'Handstand Push-Up',
  'ttb': 'Toes-to-Bar',
  't2b': 'Toes-to-Bar',
  'k2e': 'Knees-to-Elbow',
  'kte': 'Knees-to-Elbow',
  'du': 'Double-Under',
  'dus': 'Double-Under',
  'su': 'Single-Under',
  'sus': 'Single-Under',
  'mu': 'Muscle-Up',
  'mus': 'Muscle-Up',
  'bmu': 'Bar Muscle-Up',
  'rmu': 'Ring Muscle-Up',
  'kb': 'Kettlebell Swing',
  'kbs': 'Kettlebell Swing',
  'ghd': 'GHD Sit-Up',
  'ohp': 'Shoulder Press',
  'ohs': 'Overhead Squat',
  'sdhp': 'Sumo Deadlift High Pull',
  'c&j': 'Clean & Jerk',
  'cj': 'Clean & Jerk',
  's2oh': 'Shoulder to Overhead',
  'db': 'Dumbbell',
  'bb': 'Barbell',
  'wb': 'Wall Ball',
  'wbs': 'Wall Ball',
  'fs': 'Front Squat',
  'bs': 'Back Squat',
  'dl': 'Deadlift',
  'sdl': 'Sumo Deadlift',
  'rdl': 'Romanian Deadlift',
  'pc': 'Power Clean',
  'ps': 'Power Snatch',
  'hpc': 'Hang Power Clean',
  'hps': 'Hang Power Snatch',
  'pp': 'Push Press',
  'pj': 'Push Jerk',
  'sj': 'Split Jerk'
};

class AnalyticsService {
  private movements: CrossFitMovement[] = [];
  private movementsLoaded = false;

  /**
   * Load movements once and cache
   */
  private async ensureMovementsLoaded(): Promise<void> {
    if (!this.movementsLoaded) {
      this.movements = await movementService.getAllMovements();
      this.movementsLoaded = true;
    }
  }

  /**
   * Get date range for analysis period
   */
  getDateRange(period: AnalyticsPeriod, offset = 0): { start: Date; end: Date } {
    const today = new Date();
    if (period === '7days') {
      today.setDate(today.getDate() + (offset * 7));
    } else if (period === '30days') {
      today.setMonth(today.getMonth() + offset);
    } else if (period === '1year') {
      today.setFullYear(today.getFullYear() + offset);
    }

    let start: Date;
    let end: Date;

    switch (period) {
      case '7days': {
        start = new Date(today);
        const day = start.getDay(); // Sunday: 0, Monday: 1, ..., Saturday: 6
        const diffToMonday = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diffToMonday);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      }
      case '30days': {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      }
      case '1year': {
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      }
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get workouts in date range
   */
  async getWorkoutsInRange(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<WorkoutDB[]> {
    let query = supabase
      .from('workouts')
      .select('*')
      .eq('status', 'published')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (userId) {
      query = query.eq('createdBy', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workouts:', error);
      throw new Error('Failed to fetch workouts');
    }

    // Map database rows to WorkoutDB format
    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      title: row.title,
      description: row.description || '',
      type: row.workout_type,
      duration: row.duration,
      rounds: row.rounds,
      movements: row.movements || [],
      warmup: row.warmup || [],
      strength: row.strength || [],
      metcon: row.metcon || [],
      cooldown: row.cooldown || [],
      coachNotes: row.coach_notes,
      scalingNotes: row.scaling_notes,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
    }));
  }

  /**
   * Clean movement string for matching
   * Removes numbers, weights, and common words
   */
  private cleanMovementString(movementStr: string): string {
    return movementStr
      .toLowerCase()
      .replace(/\d+/g, '') // Remove numbers
      .replace(/\b(reps?|rounds?|lbs?|kg|meters?|m|cal|cals?|sec|min|minutes?)\b/gi, '') // Remove units
      .replace(/[^\w\s-]/g, '') // Remove special chars except dash
      .trim();
  }

  /**
   * Fuzzy match movement string to known movements
   */
  private matchMovement(movementStr: string): CrossFitMovement | null {
    const cleaned = this.cleanMovementString(movementStr);

    // Check abbreviations first
    const lowerStr = movementStr.toLowerCase().trim();
    for (const [abbr, fullName] of Object.entries(MOVEMENT_ABBREVIATIONS)) {
      if (lowerStr === abbr || lowerStr.includes(abbr)) {
        const match = this.movements.find(m => m.name === fullName);
        if (match) return match;
      }
    }

    // Try exact match
    const exactMatch = this.movements.find(
      m => m.name.toLowerCase() === cleaned
    );
    if (exactMatch) return exactMatch;

    // Try partial match (movement name contains cleaned string or vice versa)
    const partialMatch = this.movements.find(m => {
      const movementName = m.name.toLowerCase();
      return movementName.includes(cleaned) || cleaned.includes(movementName);
    });

    return partialMatch || null;
  }

  /**
   * Extract all movements from a workout
   */
  private extractWorkoutMovements(workout: WorkoutDB): CrossFitMovement[] {
    const movementStrings = [
      ...(workout.warmup || []),
      ...(workout.strength || []),
      ...(workout.metcon || []),
      ...(workout.cooldown || []),
      ...workout.movements
    ];

    const matchedMovements: CrossFitMovement[] = [];

    movementStrings.forEach(movementStr => {
      const matched = this.matchMovement(movementStr);
      if (matched) {
        matchedMovements.push(matched);
      }
    });

    return matchedMovements;
  }

  /**
   * Calculate muscle group statistics
   */
  private calculateMuscleGroupStats(workouts: WorkoutDB[]): MuscleGroupStats[] {
    const muscleGroupCounts: Record<MuscleGroup, number> = {
      shoulders: 0,
      back: 0,
      chest: 0,
      arms: 0,
      legs: 0,
      core: 0,
      'full body': 0
    };

    let totalHits = 0;

    workouts.forEach(workout => {
      const movements = this.extractWorkoutMovements(workout);

      movements.forEach(movement => {
        // Primary muscle groups count as 1.0
        movement.primary_muscle_groups.forEach(mg => {
          muscleGroupCounts[mg] += 1.0;
          totalHits += 1.0;
        });

        // Secondary muscle groups count as 0.5
        movement.secondary_muscle_groups.forEach(mg => {
          muscleGroupCounts[mg] += 0.5;
          totalHits += 0.5;
        });
      });
    });

    const stats: MuscleGroupStats[] = Object.entries(muscleGroupCounts).map(
      ([muscleGroup, hitCount]) => ({
        muscleGroup: muscleGroup as MuscleGroup,
        hitCount,
        percentage: totalHits > 0 ? (hitCount / totalHits) * 100 : 0
      })
    );

    return stats.sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Calculate workout type breakdown
   */
  private calculateWorkoutTypeStats(workouts: WorkoutDB[]): WorkoutTypeStats[] {
    const validTypes = ['amrap', 'fortime', 'emom', 'strength', 'endurance', 'tabata'] as const;
    const typeCounts: Record<string, number> = {
      amrap: 0,
      fortime: 0,
      emom: 0,
      strength: 0,
      endurance: 0,
      tabata: 0
    };

    workouts.forEach(workout => {
      // Handle undefined, null, or invalid types by skipping them
      const workoutType = workout.type?.toLowerCase();
      if (workoutType && validTypes.includes(workoutType as typeof validTypes[number])) {
        typeCounts[workoutType] = (typeCounts[workoutType] || 0) + 1;
      }
    });

    const total = workouts.length;

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type: type as WorkoutDB['type'],
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get top N most used movements
   */
  private getTopMovements(workouts: WorkoutDB[], limit = 10): MovementUsageStats[] {
    const movementCounts: Record<string, number> = {};

    workouts.forEach(workout => {
      const movements = this.extractWorkoutMovements(workout);
      movements.forEach(movement => {
        movementCounts[movement.name] = (movementCounts[movement.name] || 0) + 1;
      });
    });

    const sorted = Object.entries(movementCounts)
      .map(([movementName, count]) => ({
        movementName,
        count,
        rank: 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Assign ranks
    sorted.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    return sorted;
  }

  /**
   * Detect programming biases
   */
  private detectBiases(muscleGroupStats: MuscleGroupStats[]): MuscleGroupBias[] {
    const biases: MuscleGroupBias[] = [];

    muscleGroupStats.forEach(stat => {
      let status: MuscleGroupBias['status'];
      let recommendation: string;

      if (stat.percentage < 10) {
        status = 'underused';
        recommendation = `Consider increasing ${stat.muscleGroup} focused movements (currently only ${stat.percentage.toFixed(1)}% of workouts)`;
      } else if (stat.percentage > 25) {
        status = 'overused';
        recommendation = `Reduce ${stat.muscleGroup} focused movements (currently ${stat.percentage.toFixed(1)}% of workouts)`;
      } else {
        status = 'balanced';
        recommendation = `${stat.muscleGroup.charAt(0).toUpperCase() + stat.muscleGroup.slice(1)} programming is well-balanced`;
      }

      biases.push({
        muscleGroup: stat.muscleGroup,
        hitCount: stat.hitCount,
        percentage: stat.percentage,
        status,
        recommendation
      });
    });

    return biases;
  }

  /**
   * Generate recommendations based on analytics
   */
  private generateRecommendations(
    biases: MuscleGroupBias[],
    workoutTypeStats: WorkoutTypeStats[],
    totalWorkouts: number
  ): string[] {
    const recommendations: string[] = [];

    // Check for overused muscle groups
    const overused = biases.filter(b => b.status === 'overused');
    if (overused.length > 0) {
      overused.forEach(bias => {
        recommendations.push(bias.recommendation);
      });
    }

    // Check for underused muscle groups
    const underused = biases.filter(b => b.status === 'underused');
    if (underused.length > 0) {
      underused.forEach(bias => {
        recommendations.push(bias.recommendation);
      });
    }

    // Check for missing muscle groups
    const missing = biases.filter(b => b.hitCount === 0);
    if (missing.length > 0) {
      const muscleGroups = missing.map(b => b.muscleGroup).join(', ');
      recommendations.push(`Add ${muscleGroups} movements - currently not programmed`);
    }

    // Check workout type variety
    const activeTypes = workoutTypeStats.filter(t => t.count > 0);
    if (activeTypes.length < 3) {
      recommendations.push('Increase workout type variety - try mixing AMRAP, For Time, and EMOM workouts');
    }

    // Check if one type dominates
    const dominant = workoutTypeStats.find(t => t.percentage > 50);
    if (dominant) {
      recommendations.push(`Reduce ${dominant.type.toUpperCase()} workouts (currently ${dominant.percentage.toFixed(0)}% of programming)`);
    }

    // Positive feedback if balanced
    const balanced = biases.filter(b => b.status === 'balanced');
    if (balanced.length === biases.length && totalWorkouts > 5) {
      recommendations.push('Excellent muscle group balance! Keep up the well-rounded programming.');
    }

    return recommendations;
  }

  /**
   * Get comprehensive workout analytics
   */
  async getWorkoutAnalytics(
    period: AnalyticsPeriod,
    userId?: string,
    offset = 0
  ): Promise<WorkoutAnalytics> {
    await this.ensureMovementsLoaded();

    const { start, end } = this.getDateRange(period, offset);
    const workouts = await this.getWorkoutsInRange(start, end, userId);

    const muscleGroupDistribution = this.calculateMuscleGroupStats(workouts);
    const dailyMuscleData = this.calculateDailyMuscleData(workouts, start, end);
    const workoutTypeBreakdown = this.calculateWorkoutTypeStats(workouts);
    const topMovements = this.getTopMovements(workouts, 10);
    const detectedBiases = this.detectBiases(muscleGroupDistribution);

    // Calculate new CrossFit metrics
    const modalityDistribution = this.calculateModalityDistribution(workouts);
    const functionalPatternBreakdown = this.calculateFunctionalPatternBreakdown(workouts);
    const heavyDaysCount = this.calculateHeavyDays(workouts);
    const timeDomainBreakdown = this.calculateTimeDomainBreakdown(workouts);

    const recommendations = this.generateRecommendations(
      detectedBiases,
      workoutTypeBreakdown,
      workouts.length
    );

    return {
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      totalWorkouts: workouts.length,
      muscleGroupDistribution,
      dailyMuscleData,
      workoutTypeBreakdown,
      topMovements,
      detectedBiases,
      recommendations,
      modalityDistribution,
      functionalPatternBreakdown,
      heavyDaysCount,
      timeDomainBreakdown
    };
  }

  /**
   * Calculate Modality Distribution (M/G/W)
   */
  private calculateModalityDistribution(workouts: WorkoutDB[]) {
    const counts = {
      'Monostructural': 0,
      'Gymnastics': 0,
      'Weightlifting': 0
    };
    let total = 0;

    workouts.forEach(workout => {
      const movements = this.extractWorkoutMovements(workout);
      movements.forEach(m => {
        if (m.category === 'metabolic') counts['Monostructural']++;
        else if (m.category === 'gymnastic') counts['Gymnastics']++;
        else if (m.category === 'weightlifting') counts['Weightlifting']++;
        total++;
      });
    });

    return Object.entries(counts).map(([modality, count]) => ({
      modality: modality as 'Monostructural' | 'Gymnastics' | 'Weightlifting',
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  /**
   * Calculate Functional Pattern Breakdown
   */
  private calculateFunctionalPatternBreakdown(workouts: WorkoutDB[]) {
    const counts: Record<string, number> = {};
    let total = 0;

    workouts.forEach(workout => {
      const movements = this.extractWorkoutMovements(workout);
      movements.forEach(m => {
        if (m.functional_pattern) {
          counts[m.functional_pattern] = (counts[m.functional_pattern] || 0) + 1;
          total++;
        }
      });
    });

    return Object.entries(counts)
      .map(([pattern, count]) => ({
        pattern: pattern as FunctionalPattern,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate Heavy Days Count
   */
  private calculateHeavyDays(workouts: WorkoutDB[]): number {
    return workouts.filter(w => w.loading_focus === 'heavy').length;
  }

  /**
   * Parse duration string to minutes
   */
  private parseDurationToMinutes(durationStr?: string): number {
    if (!durationStr) return 0;

    // enhance cleaning to handle ranges like "10-15 min" -> takes average
    const cleanStr = durationStr.toLowerCase().trim();

    // Handle "XX:XX" format (e.g., "15:00")
    if (cleanStr.includes(':')) {
      const parts = cleanStr.split(':');
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      return minutes + (seconds / 60);
    }

    // Handle numbers with text (e.g., "15 min", "15 minutes")
    const match = cleanStr.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return 0;
  }

  /**
   * Calculate Time Domain Breakdown
   */
  private calculateTimeDomainBreakdown(workouts: WorkoutDB[]): TimeDomainStats[] {
    const counts = {
      'Sprint': 0,
      'Short': 0,
      'Medium': 0,
      'Long': 0
    };
    let total = 0;

    workouts.forEach(workout => {
      // Skip if no duration or workout type implies structure but no specific duration (e.g. strength)
      // However, for time domains we mostly care about metcons.
      // If type is 'strength' and no duration, ignore?
      // Let's rely on duration field being present.

      if (workout.duration) {
        const minutes = this.parseDurationToMinutes(workout.duration);
        if (minutes > 0) {
          if (minutes < 5) counts['Sprint']++;
          else if (minutes < 10) counts['Short']++;
          else if (minutes < 20) counts['Medium']++;
          else counts['Long']++;

          total++;
        }
      }
    });

    return Object.entries(counts).map(([domain, count]) => ({
      domain: domain as 'Sprint' | 'Short' | 'Medium' | 'Long',
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }

  /**
   * Calculate daily muscle group data for heatmap visualization
   */
  private calculateDailyMuscleData(
    workouts: WorkoutDB[],
    startDate: Date,
    endDate: Date
  ): DailyMuscleGroupData[] {
    const dailyData: DailyMuscleGroupData[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create a map of workouts by date
    const workoutsByDate = new Map<string, WorkoutDB[]>();
    workouts.forEach(workout => {
      const dateKey = workout.date;
      if (!workoutsByDate.has(dateKey)) {
        workoutsByDate.set(dateKey, []);
      }
      workoutsByDate.get(dateKey)!.push(workout);
    });

    // Iterate through each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayWorkouts = workoutsByDate.get(dateStr) || [];

      // Calculate muscle group hits for this day
      const muscleGroupHits: Record<MuscleGroup, number> = {
        shoulders: 0,
        back: 0,
        chest: 0,
        arms: 0,
        legs: 0,
        core: 0,
        'full body': 0
      };

      dayWorkouts.forEach(workout => {
        const movements = this.extractWorkoutMovements(workout);
        movements.forEach(movement => {
          movement.primary_muscle_groups.forEach(mg => {
            muscleGroupHits[mg] += 1.0;
          });
          movement.secondary_muscle_groups.forEach(mg => {
            muscleGroupHits[mg] += 0.5;
          });
        });
      });

      dailyData.push({
        date: dateStr,
        dayLabel: dayNames[currentDate.getDay()],
        muscleGroups: (Object.entries(muscleGroupHits) as [MuscleGroup, number][])
          .map(([muscleGroup, hitCount]) => ({ muscleGroup, hitCount }))
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyData;
  }

  /**
   * Get muscle groups hit by a single workout
   * Returns primary and secondary muscle groups with their weights
   */
  async getMuscleGroupsForWorkout(workout: WorkoutDB): Promise<Record<MuscleGroup, number>> {
    await this.ensureMovementsLoaded();

    const muscleGroupCounts: Record<MuscleGroup, number> = {
      shoulders: 0,
      back: 0,
      chest: 0,
      arms: 0,
      legs: 0,
      core: 0,
      'full body': 0
    };

    const movements = this.extractWorkoutMovements(workout);

    movements.forEach(movement => {
      // Primary muscle groups count as 1.0
      movement.primary_muscle_groups.forEach(mg => {
        muscleGroupCounts[mg] += 1.0;
      });

      // Secondary muscle groups count as 0.5
      movement.secondary_muscle_groups.forEach(mg => {
        muscleGroupCounts[mg] += 0.5;
      });
    });

    return muscleGroupCounts;
  }

  /**
   * Get the top muscle groups for a workout (those with hits > 0)
   */
  async getTopMuscleGroupsForWorkout(workout: WorkoutDB, limit = 3): Promise<MuscleGroup[]> {
    const muscleGroups = await this.getMuscleGroupsForWorkout(workout);

    return Object.entries(muscleGroups)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([mg]) => mg as MuscleGroup);
  }

  /**
   * Get exercises for a specific date and muscle group
   */
  async getExercisesForDateAndMuscle(
    date: string,
    muscleGroup: MuscleGroup
  ): Promise<{ name: string; isPrimary: boolean }[]> {
    await this.ensureMovementsLoaded();

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const workouts = await this.getWorkoutsInRange(startDate, endDate);
    const exercises: { name: string; isPrimary: boolean }[] = [];
    const seenMovements = new Set<string>();

    workouts.forEach(workout => {
      const movements = this.extractWorkoutMovements(workout);
      movements.forEach(movement => {
        if (seenMovements.has(movement.name)) return;

        const isPrimary = movement.primary_muscle_groups.includes(muscleGroup);
        const isSecondary = movement.secondary_muscle_groups.includes(muscleGroup);

        if (isPrimary || isSecondary) {
          exercises.push({ name: movement.name, isPrimary });
          seenMovements.add(movement.name);
        }
      });
    });

    // Sort by primary first, then alphabetically
    return exercises.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get movement usage count in a date range
   */
  async getMovementUsageInRange(movementName: string, days: number): Promise<number> {
    await this.ensureMovementsLoaded();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const workouts = await this.getWorkoutsInRange(startDate, endDate);
    let count = 0;

    workouts.forEach(workout => {
      const movements = this.extractWorkoutMovements(workout);
      movements.forEach(movement => {
        if (movement.name === movementName) {
          count++;
        }
      });
    });

    return count;
  }

  /**
   * Get exercises for a date and muscle group with 2-week usage
   */
  async getExercisesWithUsageForDateAndMuscle(
    date: string,
    muscleGroup: MuscleGroup
  ): Promise<{ name: string; isPrimary: boolean; twoWeekUsage: number }[]> {
    const exercises = await this.getExercisesForDateAndMuscle(date, muscleGroup);

    // Get 2-week usage for each exercise
    const exercisesWithUsage = await Promise.all(
      exercises.map(async exercise => ({
        ...exercise,
        twoWeekUsage: await this.getMovementUsageInRange(exercise.name, 14)
      }))
    );

    return exercisesWithUsage;
  }

  /**
   * Get upcoming WODs with movement analysis
   */
  async getUpcomingWODsWithAnalysis(days: number = 2): Promise<UpcomingWODAnalysis[]> {
    await this.ensureMovementsLoaded();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    // Get upcoming workouts
    const { data: upcomingWorkouts, error } = await supabase
      .from('workouts')
      .select('*')
      .gte('date', today.toISOString().split('T')[0])
      .lt('date', endDate.toISOString().split('T')[0])
      .eq('status', 'published')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming workouts:', error);
      return [];
    }

    const results: UpcomingWODAnalysis[] = [];

    for (const row of upcomingWorkouts || []) {
      const workout: WorkoutDB = {
        id: row.id,
        date: row.date,
        title: row.title,
        description: row.description || '',
        type: row.workout_type,
        duration: row.duration,
        rounds: row.rounds,
        movements: row.movements || [],
        warmup: row.warmup || [],
        strength: row.strength || [],
        metcon: row.metcon || [],
        cooldown: row.cooldown || [],
        coachNotes: row.coach_notes,
        scalingNotes: row.scaling_notes,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status,
      };

      const movements = this.extractWorkoutMovements(workout);
      const movementAnalysis: MovementWithAnalysis[] = [];

      for (const movement of movements) {
        const twoWeekUsage = await this.getMovementUsageInRange(movement.name, 14);
        const isHighUsage = twoWeekUsage >= 3;

        let suggestions: CrossFitMovement[] = [];
        if (isHighUsage) {
          suggestions = await this.getReplacementSuggestions(movement.name, movement.primary_muscle_groups);
        }

        movementAnalysis.push({
          name: movement.name,
          muscleGroups: movement.primary_muscle_groups,
          twoWeekUsage,
          isHighUsage,
          suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
        });
      }

      results.push({
        workout,
        movementAnalysis
      });
    }

    return results;
  }

  /**
   * Get replacement suggestions for a movement - suggests movements from
   * DIFFERENT/UNDERUSED muscle groups to help balance programming
   */
  async getReplacementSuggestions(
    currentMovementName: string,
    currentMuscleGroups: MuscleGroup[]
  ): Promise<CrossFitMovement[]> {
    await this.ensureMovementsLoaded();

    // Get recent analytics to find underused muscle groups
    const { start, end } = this.getDateRange('7days');
    const recentWorkouts = await this.getWorkoutsInRange(start, end);
    const muscleGroupStats = this.calculateMuscleGroupStats(recentWorkouts);

    // Find underused muscle groups (lowest usage, excluding current movement's muscle groups)
    const underusedGroups = muscleGroupStats
      .filter(stat => !currentMuscleGroups.includes(stat.muscleGroup))
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3) // Top 3 most underused
      .map(stat => stat.muscleGroup);

    // If no underused groups found, use muscle groups not in current movement
    const targetGroups = underusedGroups.length > 0
      ? underusedGroups
      : (['legs', 'shoulders', 'core', 'back', 'chest', 'arms'] as MuscleGroup[])
        .filter(mg => !currentMuscleGroups.includes(mg));

    // Find movements that primarily target the underused muscle groups
    const candidates = this.movements.filter(m => {
      if (m.name.toLowerCase() === currentMovementName.toLowerCase()) return false;

      // Check if it primarily targets one of the underused/different muscle groups
      const targetsDifferentMuscle = m.primary_muscle_groups.some(mg =>
        targetGroups.includes(mg)
      );
      return targetsDifferentMuscle;
    });

    // Get usage for each candidate and sort by lowest usage
    const candidatesWithUsage = await Promise.all(
      candidates.map(async c => ({
        movement: c,
        usage: await this.getMovementUsageInRange(c.name, 14),
        // Prioritize movements targeting the most underused groups
        underusedScore: c.primary_muscle_groups.reduce((score, mg) => {
          const idx = targetGroups.indexOf(mg);
          return idx >= 0 ? score + (targetGroups.length - idx) : score;
        }, 0)
      }))
    );

    // Sort by underused score (highest first), then by usage (lowest first)
    return candidatesWithUsage
      .sort((a, b) => {
        if (b.underusedScore !== a.underusedScore) {
          return b.underusedScore - a.underusedScore;
        }
        return a.usage - b.usage;
      })
      .map(c => c.movement);
  }

  /**
   * Get programming health metrics
   */
  async getProgrammingHealth(): Promise<ProgrammingHealth> {
    await this.ensureMovementsLoaded();

    // Get last 14 days of workouts
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 14);
    const workouts = await this.getWorkoutsInRange(start, end);

    // Calculate muscle group distribution
    const muscleStats = this.calculateMuscleGroupStats(workouts);

    // Calculate balance score (how evenly distributed are muscle groups)
    const percentages = muscleStats.map(s => s.percentage);
    const avgPercentage = 100 / 6; // ~16.67% each for 6 muscle groups
    const deviations = percentages.map(p => Math.abs(p - avgPercentage));
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    // Convert deviation to score (0 deviation = 100, 16.67 deviation = 0)
    const balanceScore = Math.max(0, Math.min(100, 100 - (avgDeviation * 6)));

    let balanceLabel: ProgrammingHealth['balanceLabel'];
    if (balanceScore >= 80) balanceLabel = 'Excellent';
    else if (balanceScore >= 60) balanceLabel = 'Good';
    else if (balanceScore >= 40) balanceLabel = 'Fair';
    else balanceLabel = 'Needs Work';

    // Calculate variety score
    const allMovementNames = new Set<string>();
    let totalSlots = 0;
    workouts.forEach(w => {
      const movements = this.extractWorkoutMovements(w);
      movements.forEach(m => allMovementNames.add(m.name));
      totalSlots += movements.length;
    });

    const uniqueMovements = allMovementNames.size;
    // Variety = unique movements / total slots (capped at 100%)
    const varietyScore = totalSlots > 0
      ? Math.min(100, (uniqueMovements / totalSlots) * 100 * 2) // Scale so 50% unique = 100
      : 0;

    let varietyLabel: string;
    if (varietyScore >= 80) varietyLabel = 'Excellent variety';
    else if (varietyScore >= 60) varietyLabel = 'Good variety';
    else if (varietyScore >= 40) varietyLabel = 'Moderate variety';
    else varietyLabel = 'Consider more variety';

    // Find neglected movements (common movements not used in 14 days)
    const commonMovements = this.movements
      .filter(m => m.difficulty === 'beginner' || m.difficulty === 'intermediate')
      .slice(0, 30); // Top 30 common movements

    const neglectedMovements = commonMovements
      .filter(m => !allMovementNames.has(m.name))
      .slice(0, 5)
      .map(m => m.name);

    // Find overused movements
    const movementCounts = new Map<string, number>();
    workouts.forEach(w => {
      const movements = this.extractWorkoutMovements(w);
      movements.forEach(m => {
        movementCounts.set(m.name, (movementCounts.get(m.name) || 0) + 1);
      });
    });

    const overusedMovements = Array.from(movementCounts.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      balanceScore: Math.round(balanceScore),
      balanceLabel,
      varietyScore: Math.round(varietyScore),
      varietyLabel,
      uniqueMovements,
      totalMovementSlots: totalSlots,
      neglectedMovements,
      overusedMovements
    };
  }

  /**
   * Get week-over-week comparison
   */
  async getWeekComparison(): Promise<WeekComparison> {
    await this.ensureMovementsLoaded();

    const now = new Date();

    // This week (last 7 days inclusive: Today - 6 days to Today)
    const thisWeekEnd = new Date(now);
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekEnd.getDate() - 6);

    // Last week (7 days prior: Start - 7 days to Start - 1 day)
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);

    const thisWeekWorkouts = await this.getWorkoutsInRange(thisWeekStart, thisWeekEnd);
    const lastWeekWorkouts = await this.getWorkoutsInRange(lastWeekStart, lastWeekEnd);

    const thisWeekStats = this.calculateMuscleGroupStats(thisWeekWorkouts);
    const lastWeekStats = this.calculateMuscleGroupStats(lastWeekWorkouts);

    // Count total movements
    const countMovements = (workouts: WorkoutDB[]) => {
      let count = 0;
      workouts.forEach(w => {
        count += this.extractWorkoutMovements(w).length;
      });
      return count;
    };

    const thisWeekMovements = countMovements(thisWeekWorkouts);
    const lastWeekMovements = countMovements(lastWeekWorkouts);

    // Calculate muscle group changes
    const muscleGroups: MuscleGroup[] = ['legs', 'shoulders', 'core', 'back', 'chest', 'arms'];
    const muscleGroupChanges = muscleGroups.map(mg => {
      const thisWeekHits = thisWeekStats.find(s => s.muscleGroup === mg)?.hitCount || 0;
      const lastWeekHits = lastWeekStats.find(s => s.muscleGroup === mg)?.hitCount || 0;
      return {
        muscleGroup: mg,
        change: thisWeekHits - lastWeekHits
      };
    });

    return {
      thisWeek: {
        workouts: thisWeekWorkouts.length,
        totalMovements: thisWeekMovements,
        muscleDistribution: thisWeekStats
      },
      lastWeek: {
        workouts: lastWeekWorkouts.length,
        totalMovements: lastWeekMovements,
        muscleDistribution: lastWeekStats
      },
      changes: {
        workouts: thisWeekWorkouts.length - lastWeekWorkouts.length,
        movements: thisWeekMovements - lastWeekMovements,
        muscleGroupChanges
      }
    };
  }
}

// Types for upcoming WOD analysis
export interface MovementWithAnalysis {
  name: string;
  muscleGroups: MuscleGroup[];
  twoWeekUsage: number;
  isHighUsage: boolean;
  suggestions: CrossFitMovement[];
}

export interface UpcomingWODAnalysis {
  workout: WorkoutDB;
  movementAnalysis: MovementWithAnalysis[];
}

// Types for programming health
export interface ProgrammingHealth {
  balanceScore: number; // 0-100
  balanceLabel: 'Excellent' | 'Good' | 'Fair' | 'Needs Work';
  varietyScore: number; // 0-100
  varietyLabel: string;
  uniqueMovements: number;
  totalMovementSlots: number;
  neglectedMovements: string[]; // Movements not used in 14+ days
  overusedMovements: { name: string; count: number }[];
}

// Types for week comparison
export interface WeekComparison {
  thisWeek: {
    workouts: number;
    totalMovements: number;
    muscleDistribution: MuscleGroupStats[];
  };
  lastWeek: {
    workouts: number;
    totalMovements: number;
    muscleDistribution: MuscleGroupStats[];
  };
  changes: {
    workouts: number;
    movements: number;
    muscleGroupChanges: { muscleGroup: MuscleGroup; change: number }[];
  };
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
