import { useEffect } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { usePreferencesStore } from "../../store/preferencesStore";
import { TOPICS as STARTER_TOPICS } from "../../prompts/getStableQuestionPrompt";

export interface InterestsEditorProps {
  title?: string | null;
  description?: string | null;
}

/**
 * Topic picker for the user's interests. Self-contained — hydrates the
 * preferences store on mount so it works anywhere (e.g. the account profile
 * page, outside the chat). Edits persist to the same store the home-screen
 * conversation starters read from.
 */
const InterestsEditor = ({
  title = "Your interests",
  description = "Pick the topics you care about — your home-screen conversation starters lean toward them.",
}: InterestsEditorProps) => {
  const preferences = usePreferencesStore((s) => s.preferences);
  const updatePreference = usePreferencesStore((s) => s.updatePreference);
  const loadPreferences = usePreferencesStore((s) => s.loadPreferences);
  const isLoaded = usePreferencesStore((s) => s.isLoaded);

  useEffect(() => {
    if (!isLoaded) {
      void loadPreferences();
    }
  }, [isLoaded, loadPreferences]);

  const interests = preferences?.interests ?? [];

  return (
    <Box>
      {title && (
        <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {description}
        </Typography>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {STARTER_TOPICS.map((topic) => {
          const selected = interests.includes(topic);
          return (
            <Chip
              key={topic}
              label={topic}
              size="small"
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() => {
                const next = selected
                  ? interests.filter((t) => t !== topic)
                  : [...interests, topic];
                updatePreference("interests", next);
              }}
              sx={{ textTransform: "capitalize" }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default InterestsEditor;
