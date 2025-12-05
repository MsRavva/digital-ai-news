"use client";

import { useEffect, useState } from "react";
import { HeroHeader } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { data: teachersData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "teacher");

        if (error) {
          console.error("Error fetching teachers:", error);
          setError("Ошибка при загрузке данных");
          setLoading(false);
          return;
        }

        const teachersList = (teachersData || []).map((teacher) => ({
          id: teacher.id,
          username: teacher.username,
          email: teacher.email,
          role: teacher.role,
          created_at: teacher.created_at,
          updated_at: teacher.updated_at,
          bio: teacher.bio,
          location: teacher.location,
          website: teacher.website,
          social: teacher.social,
          avatar_url: teacher.avatar_url,
          preferredCategory: teacher.preferred_category,
        })) as Profile[];

        setTeachers(teachersList);
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setError("Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return (
    <>
      <HeroHeader />
      <div className="container mx-auto w-[90%] pt-24 pb-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Пользователи с ролью "Учитель"</CardTitle>
            <CardDescription>Всего найдено: {loading ? "..." : teachers.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : error ? (
              <div className="text-destructive text-center py-8">{error}</div>
            ) : teachers.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                Пользователи с ролью "Учитель" не найдены
              </div>
            ) : (
              <div className="space-y-4">
                {teachers.map((teacher) => (
                  <Card key={teacher.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{teacher.username}</h3>
                          <Badge variant="outline">Учитель</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            <strong>ID:</strong> {teacher.id}
                          </p>
                          <p>
                            <strong>Email:</strong>{" "}
                            {teacher.email || (
                              <span className="text-muted-foreground italic">не указан</span>
                            )}
                          </p>
                          <p>
                            <strong>Дата создания:</strong>{" "}
                            {new Date(teacher.created_at).toLocaleString("ru-RU")}
                          </p>
                          {teacher.updated_at && (
                            <p>
                              <strong>Обновлено:</strong>{" "}
                              {new Date(teacher.updated_at).toLocaleString("ru-RU")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
