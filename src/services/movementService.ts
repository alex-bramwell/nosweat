/**
 * Movement Service
 * Provides database operations for CrossFit movements
 */

import { supabase } from '../lib/supabase';
import type { CrossFitMovement, MovementCategory, MovementDifficulty, MuscleGroup } from '../types';

class MovementService {
  private readonly table = 'crossfit_movements';

  /**
   * Get all movements from the database
   */
  async getAllMovements(): Promise<CrossFitMovement[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching movements:', error);
      throw new Error('Failed to fetch movements');
    }

    return data || [];
  }

  /**
   * Get movements by category
   */
  async getMovementsByCategory(category: MovementCategory): Promise<CrossFitMovement[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) {
      console.error('Error fetching movements by category:', error);
      throw new Error(`Failed to fetch ${category} movements`);
    }

    return data || [];
  }

  /**
   * Get movements by muscle group (primary or secondary)
   */
  async getMovementsByMuscleGroup(muscleGroup: MuscleGroup): Promise<CrossFitMovement[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .or(`primary_muscle_groups.cs.{${muscleGroup}},secondary_muscle_groups.cs.{${muscleGroup}}`)
      .order('name');

    if (error) {
      console.error('Error fetching movements by muscle group:', error);
      throw new Error(`Failed to fetch movements for ${muscleGroup}`);
    }

    return data || [];
  }

  /**
   * Get movements by difficulty level
   */
  async getMovementsByDifficulty(difficulty: MovementDifficulty): Promise<CrossFitMovement[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('difficulty', difficulty)
      .order('name');

    if (error) {
      console.error('Error fetching movements by difficulty:', error);
      throw new Error(`Failed to fetch ${difficulty} movements`);
    }

    return data || [];
  }

  /**
   * Search movements by name (case-insensitive)
   */
  async searchMovements(query: string): Promise<CrossFitMovement[]> {
    if (!query.trim()) {
      return this.getAllMovements();
    }

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name');

    if (error) {
      console.error('Error searching movements:', error);
      throw new Error('Failed to search movements');
    }

    return data || [];
  }

  /**
   * Get a single movement by ID
   */
  async getMovementById(id: string): Promise<CrossFitMovement | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching movement by ID:', error);
      return null;
    }

    return data;
  }

  /**
   * Get movements grouped by primary muscle group
   * Useful for filtering UI
   */
  async getMovementsGroupedByMuscleGroup(): Promise<Record<MuscleGroup, CrossFitMovement[]>> {
    const movements = await this.getAllMovements();

    const grouped: Record<string, CrossFitMovement[]> = {
      shoulders: [],
      back: [],
      chest: [],
      arms: [],
      legs: [],
      core: []
    };

    movements.forEach(movement => {
      movement.primary_muscle_groups.forEach(muscleGroup => {
        if (grouped[muscleGroup]) {
          grouped[muscleGroup].push(movement);
        }
      });
    });

    return grouped as Record<MuscleGroup, CrossFitMovement[]>;
  }

  /**
   * Create a new movement (coach/admin only)
   */
  async createMovement(movement: Omit<CrossFitMovement, 'id' | 'created_at' | 'updated_at'>): Promise<CrossFitMovement> {
    const { data, error } = await supabase
      .from(this.table)
      .insert([movement])
      .select()
      .single();

    if (error) {
      console.error('Error creating movement:', error);
      throw new Error('Failed to create movement');
    }

    return data;
  }

  /**
   * Update an existing movement (coach/admin only)
   */
  async updateMovement(id: string, updates: Partial<CrossFitMovement>): Promise<CrossFitMovement> {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating movement:', error);
      throw new Error('Failed to update movement');
    }

    return data;
  }

  /**
   * Delete a movement (admin only)
   */
  async deleteMovement(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting movement:', error);
      throw new Error('Failed to delete movement');
    }
  }
}

// Export singleton instance
export const movementService = new MovementService();
