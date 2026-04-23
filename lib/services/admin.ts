import { getBackendProvider } from "@/lib/backend-provider";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export async function getTeachers(): Promise<Profile[]> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite admin-teachers flow is not connected yet.");
    default: {
      const { data, error } = await supabase.from("profiles").select("*").eq("role", "teacher");

      if (error || !data) {
        console.error("Error fetching teachers:", error);
        return [];
      }

      return data.map((teacher) => ({
        id: teacher.id,
        username: teacher.username,
        email: teacher.email || undefined,
        role: teacher.role as Profile["role"],
        created_at: teacher.created_at,
        updated_at: teacher.updated_at || undefined,
        bio: teacher.bio || undefined,
        location: teacher.location || undefined,
        website: teacher.website || undefined,
        social: teacher.social as Profile["social"] | undefined,
        avatar_url: teacher.avatar_url || undefined,
        preferredCategory: teacher.preferred_category || undefined,
      }));
    }
  }
}
