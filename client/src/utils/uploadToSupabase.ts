import { supabase } from "@/supabaseClient";

export const uploadToSupabase = async (file: File): Promise<string | null> => {
  const filePath = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase
    .storage
    .from("meal-photos") // ✅ Make sure this bucket exists in Supabase
    .upload(filePath, file);

  if (error) {
    console.error("Upload failed:", error.message);
    return null;
  }

  const { data: publicUrlData } = supabase
    .storage
    .from("meal-photos")
    .getPublicUrl(filePath);

  return publicUrlData?.publicUrl || null;
};
