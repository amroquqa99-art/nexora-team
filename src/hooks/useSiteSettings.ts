import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSiteSettings = () => {
  const { data: teamVisible = true } = useQuery({
    queryKey: ["team_section_visible"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("value_en")
          .eq("key", "team_section_visible")
          .maybeSingle();

        if (error) return true;
        return data?.value_en !== "false";
      } catch (e) {
        return true;
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  const { data: joinTeamVisible = true } = useQuery({
    queryKey: ["join_team_visible"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("value_en")
          .eq("key", "join_team_visible")
          .maybeSingle();

        if (error) return true;
        return data?.value_en !== "false";
      } catch (e) {
        return true;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return { teamVisible, joinTeamVisible };
};
