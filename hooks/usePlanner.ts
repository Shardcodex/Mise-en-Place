"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlannerAssignment, Profile, DayName, MealType } from "@/lib/types";

export function usePlanner(weekStartDate: string) {
  const [assignments, setAssignments] = useState<PlannerAssignment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [
      { data: assignmentsData, error: assignErr },
      { data: profileData, error: profileErr },
    ] = await Promise.all([
      supabase
        .from("planner_assignments")
        .select(
          `
            *,
            recipe:recipes (
              *,
              ingredients ( * ),
              steps ( * )
            )
          `
        )
        .eq("user_id", user.id)
        .eq("week_start_date", weekStartDate)
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);

    if (assignErr || profileErr) {
      setError("Failed to load planner. Please try again.");
    } else {
      if (assignmentsData) setAssignments(assignmentsData);
      if (profileData) setProfile(profileData);
    }
    setLoading(false);
  }, [supabase, weekStartDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addAssignment(
    recipe_id: string,
    day: DayName,
    meal_type: MealType,
    scale: number
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("planner_assignments").insert({
      user_id: user.id,
      recipe_id,
      day,
      meal_type,
      scale,
      week_start_date: weekStartDate,
      leftover_of_id: null,
    });
    if (error) {
      console.error("addAssignment error:", error);
      return false;
    }
    await fetchData();
    return true;
  }

  /**
   * Add a "leftovers" slot pointing back to an existing assignment.
   * The new slot gets the same recipe_id and scale as the source, but a
   * different day/meal_type. Shopping aggregation will skip it.
   */
  async function addLeftover(
    sourceAssignment: PlannerAssignment,
    day: DayName,
    meal_type: MealType
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("planner_assignments").insert({
      user_id: user.id,
      recipe_id: sourceAssignment.recipe_id,
      day,
      meal_type,
      scale: sourceAssignment.scale,
      week_start_date: weekStartDate,
      leftover_of_id: sourceAssignment.id,
    });
    if (error) {
      console.error("addLeftover error:", JSON.stringify(error, null, 2));
      console.error("addLeftover payload:", {
        user_id: user.id,
        recipe_id: sourceAssignment.recipe_id,
        day,
        meal_type,
        scale: sourceAssignment.scale,
        week_start_date: weekStartDate,
        leftover_of_id: sourceAssignment.id,
      });
      return false;
    }
    await fetchData();
    return true;
  }

  async function updateAssignment(
    id: string,
    changes: { scale?: number; day?: DayName; meal_type?: MealType }
  ): Promise<boolean> {
    const { error } = await supabase
      .from("planner_assignments")
      .update(changes)
      .eq("id", id);
    if (error) {
      console.error("updateAssignment error:", error);
      return false;
    }
    await fetchData();
    return true;
  }

  async function removeAssignment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("planner_assignments")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("removeAssignment error:", error);
      return false;
    }
    await fetchData();
    return true;
  }

  return {
    assignments,
    profile,
    loading,
    error,
    fetchData,
    addAssignment,
    addLeftover,
    updateAssignment,
    removeAssignment,
  };
}
