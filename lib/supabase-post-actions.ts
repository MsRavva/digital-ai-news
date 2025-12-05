import { supabase } from "./supabase";

// Закрепление/открепление поста
export async function togglePinPost(postId: string): Promise<boolean> {
  try {
    // Получаем текущее состояние поста
    const { data: postData, error: fetchError } = await supabase
      .from("posts")
      .select("pinned")
      .eq("id", postId)
      .single();

    if (fetchError || !postData) {
      console.error("Error fetching post:", fetchError);
      return false;
    }

    const currentPinned = postData.pinned || false;

    // Обновляем состояние
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        pinned: !currentPinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      console.error("Error toggling pin:", updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error toggling pin:", error);
    return false;
  }
}

// Архивирование поста
export async function archivePost(postId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("posts")
      .update({
        archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      console.error("Error archiving post:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error archiving post:", error);
    return false;
  }
}

// Восстановление поста из архива
export async function unarchivePost(postId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("posts")
      .update({
        archived: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      console.error("Error unarchiving post:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error unarchiving post:", error);
    return false;
  }
}

// Удаление поста
export async function deletePost(postId: string): Promise<boolean> {
  try {
    // Удаляем пост (каскадное удаление удалит связанные записи)
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.error("Error deleting post:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

// Лайк публикации
export async function likePost(postId: string, userId: string): Promise<boolean> {
  try {
    // Проверяем, не лайкнул ли пользователь эту публикацию ранее
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    // Если ошибка при проверке (кроме "не найдено"), логируем
    if (checkError) {
      // PGRST116 - no rows returned, это нормально (лайка нет)
      if (checkError.code === "PGRST116") {
        // Продолжаем - лайка нет, нужно добавить
      } else if (checkError.code === "PGRST301" || checkError.message?.includes("406")) {
        // 406 может означать проблему с RLS, но попробуем продолжить
        console.warn("RLS policy issue when checking like:", checkError.message);
        // Продолжаем - попробуем добавить лайк
      } else {
        console.error("Error checking existing like:", checkError);
        return false;
      }
    }

    if (existingLike) {
      // Пользователь уже лайкнул - удаляем лайк
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error removing like:", deleteError);
        return false;
      }

      return false; // Возвращаем false, чтобы показать, что лайк был удален
    }

    // Добавляем лайк
    const { error: insertError } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: userId,
    });

    if (insertError) {
      // Ошибка 23505 (unique_violation) означает, что лайк уже существует
      if (
        insertError.code === "23505" ||
        insertError.message?.includes("duplicate") ||
        insertError.message?.includes("unique")
      ) {
        // Лайк уже существует, попробуем удалить его
        const { error: deleteError } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Error removing duplicate like:", deleteError);
          return false;
        }
        return false;
      }
      console.error("Error adding like:", insertError);
      return false;
    }

    return true; // Возвращаем true, чтобы показать, что лайк был добавлен
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    return false;
  }
}

// Проверка, лайкнул ли пользователь публикацию
export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    // Если ошибка и это не "не найдено", логируем
    if (error) {
      // PGRST116 - no rows returned, это нормально (пользователь не лайкнул)
      if (error.code === "PGRST116") {
        return false;
      }
      // 406 может означать проблему с RLS, но мы все равно возвращаем false
      if (error.code === "PGRST301" || error.message?.includes("406")) {
        console.warn("RLS policy issue when checking like:", error.message);
        return false;
      }
      console.error("Error checking like:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking if user liked post:", error);
    return false;
  }
}
