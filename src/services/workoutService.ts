import { supabase } from '../lib/supabase';
import type { WorkoutDB, WorkoutFormData } from '../types';

export const workoutService = {
  // Get today's workout
  async getTodaysWorkout(): Promise<WorkoutDB | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('date', today)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is normal
        return null;
      }
      console.error('Error fetching today\'s workout:', error);
      return null;
    }

    return this.mapDbToWorkout(data);
  },

  // Get workout by date
  async getWorkoutByDate(date: string): Promise<WorkoutDB | null> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is normal
        return null;
      }
      console.error('Error fetching workout:', error);
      return null;
    }

    return this.mapDbToWorkout(data);
  },

  // Get all workouts (for coach dashboard)
  async getAllWorkouts(limit = 30): Promise<WorkoutDB[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }

    return data.map(this.mapDbToWorkout);
  },

  // Create new workout
  async createWorkout(workout: WorkoutFormData): Promise<WorkoutDB | null> {
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        date: workout.date,
        title: workout.title,
        description: workout.description,
        workout_type: workout.workoutType,
        duration: workout.duration,
        rounds: workout.rounds,
        warmup: workout.warmup,
        strength: workout.strength,
        metcon: workout.metcon,
        cooldown: workout.cooldown,
        movements: workout.movements,
        coach_notes: workout.coachNotes,
        scaling_notes: workout.scalingNotes,
        status: workout.status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout:', error);
      throw new Error(error.message);
    }

    return this.mapDbToWorkout(data);
  },

  // Update workout
  async updateWorkout(id: string, workout: Partial<WorkoutFormData>): Promise<WorkoutDB | null> {
    const updates: Record<string, unknown> = {};

    if (workout.date) updates.date = workout.date;
    if (workout.title) updates.title = workout.title;
    if (workout.description !== undefined) updates.description = workout.description;
    if (workout.workoutType) updates.workout_type = workout.workoutType;
    if (workout.duration !== undefined) updates.duration = workout.duration;
    if (workout.rounds !== undefined) updates.rounds = workout.rounds;
    if (workout.warmup) updates.warmup = workout.warmup;
    if (workout.strength) updates.strength = workout.strength;
    if (workout.metcon) updates.metcon = workout.metcon;
    if (workout.cooldown) updates.cooldown = workout.cooldown;
    if (workout.movements) updates.movements = workout.movements;
    if (workout.coachNotes !== undefined) updates.coach_notes = workout.coachNotes;
    if (workout.scalingNotes !== undefined) updates.scaling_notes = workout.scalingNotes;
    if (workout.status) updates.status = workout.status;

    const { data, error } = await supabase
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout:', error);
      throw new Error(error.message);
    }

    return this.mapDbToWorkout(data);
  },

  // Delete workout
  async deleteWorkout(id: string): Promise<void> {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting workout:', error);
      throw new Error(error.message);
    }
  },

  // Map database row to WorkoutDB type
  mapDbToWorkout(data: any): WorkoutDB {
    return {
      id: data.id,
      date: data.date,
      title: data.title,
      description: data.description || '',
      type: data.workout_type,
      duration: data.duration,
      rounds: data.rounds,
      movements: data.movements || [],
      warmup: data.warmup || [],
      strength: data.strength || [],
      metcon: data.metcon || [],
      cooldown: data.cooldown || [],
      coachNotes: data.coach_notes,
      scalingNotes: data.scaling_notes,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      status: data.status,
    };
  },
};