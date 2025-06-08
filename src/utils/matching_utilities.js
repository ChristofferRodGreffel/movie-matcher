import supabase from "../api/supabase";

export const checkForMatches = async (sessionId, movieId) => {
  try {
    const { data: likes, error } = await supabase
      .from("responses")
      .select("user_id")
      .eq("session_id", sessionId)
      .eq("tmdb_id", movieId)
      .eq("liked", true);

    if (error) {
      console.error("Error checking for matches:", error);
      return;
    }

    const { data: allResponses, error: usersError } = await supabase
      .from("responses")
      .select("user_id")
      .eq("session_id", sessionId);

    if (usersError) {
      console.error("Error getting session users:", usersError);
      return;
    }

    const uniqueUsers = [...new Set(allResponses.map((r) => r.user_id))];
    const totalUsers = uniqueUsers.length;
    const likesCount = likes.length;

    console.log(`Movie ${movieId}: ${likesCount} likes out of ${totalUsers} users`);

    if (likesCount >= 2 && likesCount === totalUsers) {
      console.log("🎉 MATCH FOUND!", movieId);
      await addMatchToSession(sessionId, movieId);
    }
  } catch (err) {
    console.error("Error in checkForMatches:", err);
  }
};

export const addMatchToSession = async (sessionId, movieId) => {
  try {
    const { data: session, error: fetchError } = await supabase
      .from("sessions")
      .select("matches")
      .eq("id", sessionId)
      .single();

    if (fetchError) {
      console.error("Error fetching session:", fetchError);
      return;
    }

    const currentMatches = session.matches || [];

    if (currentMatches.includes(movieId)) {
      console.log("Movie already in matches");
      return;
    }

    const updatedMatches = [...currentMatches, movieId];

    const { error: updateError } = await supabase
      .from("sessions")
      .update({ matches: updatedMatches })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Error updating session matches:", updateError);
      return;
    }

    console.log(`Match added! Total matches: ${updatedMatches.length}`);
  } catch (err) {
    console.error("Error adding match to session:", err);
  }
};
