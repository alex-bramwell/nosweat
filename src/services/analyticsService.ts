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
  CrossFitMovement
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
  getDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '1year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

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
      core: 0
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
    userId?: string
  ): Promise<WorkoutAnalytics> {
    await this.ensureMovementsLoaded();

    const { start, end } = this.getDateRange(period);
    const workouts = await this.getWorkoutsInRange(start, end, userId);

    const muscleGroupDistribution = this.calculateMuscleGroupStats(workouts);
    const workoutTypeBreakdown = this.calculateWorkoutTypeStats(workouts);
    const topMovements = this.getTopMovements(workouts, 10);
    const detectedBiases = this.detectBiases(muscleGroupDistribution);
    const recommendations = this.generateRecommendations(
      detectedBiases,
      workoutTypeBreakdown,
      workouts.length
    );

    return {
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      totalWorkouts: workouts.length,
      muscleGroupDistribution,
      workoutTypeBreakdown,
      topMovements,
      detectedBiases,
      recommendations
    };
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
      core: 0
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
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
