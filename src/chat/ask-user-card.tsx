/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.
*/

import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Button, TextField, Chip, Stack } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useAskUserStore } from "../store/askUserStore";

/**
 * Renders the interactive prompt raised by the model's `ask_user` tool: one or
 * more questions, each with selectable options and (optionally) a free-text
 * answer. Submitting resolves the awaiting tool call so the model continues.
 */
const AskUserCard: React.FC = () => {
  const theme = useTheme();
  const { pending, submit, cancel } = useAskUserStore();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [freeform, setFreeform] = useState<Record<string, string>>({});

  // Reset + pre-select any "(Recommended)" option whenever a new prompt opens.
  useEffect(() => {
    if (!pending) return;
    const preselected: Record<string, string> = {};
    pending.questions.forEach((q) => {
      const rec = q.options?.find((o) => /\(recommended\)/i.test(o.label));
      if (rec) preselected[q.id] = rec.label;
    });
    setSelected(preselected);
    setFreeform({});
  }, [pending]);

  if (!pending) return null;

  const answerFor = (qid: string) => (freeform[qid]?.trim() ? freeform[qid].trim() : selected[qid] ?? "");
  const allAnswered = pending.questions.every((q) => answerFor(q.id).length > 0);

  const handleSubmit = () => {
    const final: Record<string, string> = {};
    pending.questions.forEach((q) => {
      final[q.id] = answerFor(q.id);
    });
    submit(final);
  };

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center", px: { xs: 1, sm: 2 }, mb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 760,
          p: { xs: 1.75, sm: 2.25 },
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.45)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.06),
        }}
      >
        <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, letterSpacing: 0.4 }}>
          BANDIT NEEDS A QUICK DECISION
        </Typography>

        {pending.questions.map((q) => (
          <Box key={q.id} sx={{ mt: 1.5 }}>
            {q.header && (
              <Chip label={q.header} size="small" sx={{ mb: 0.75, fontWeight: 600 }} color="primary" variant="outlined" />
            )}
            <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>{q.question}</Typography>

            {q.options && q.options.length > 0 && (
              <Stack spacing={1}>
                {q.options.map((opt) => {
                  const isSel = selected[q.id] === opt.label && !freeform[q.id]?.trim();
                  return (
                    <Button
                      key={opt.label}
                      onClick={() => {
                        setSelected((p) => ({ ...p, [q.id]: opt.label }));
                        setFreeform((p) => ({ ...p, [q.id]: "" }));
                      }}
                      variant={isSel ? "contained" : "outlined"}
                      color="primary"
                      sx={{
                        justifyContent: "flex-start",
                        textAlign: "left",
                        textTransform: "none",
                        py: 1,
                        px: 1.5,
                        borderColor: alpha(theme.palette.primary.main, 0.4),
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 600, lineHeight: 1.3 }}>{opt.label}</Typography>
                        {opt.description && (
                          <Typography
                            variant="caption"
                            sx={{ color: isSel ? alpha("#fff", 0.85) : theme.palette.text.secondary, display: "block" }}
                          >
                            {opt.description}
                          </Typography>
                        )}
                      </Box>
                    </Button>
                  );
                })}
              </Stack>
            )}

            {q.allowFreeform !== false && (
              <TextField
                fullWidth
                size="small"
                placeholder={q.options && q.options.length ? "Or type your own answer…" : "Type your answer…"}
                value={freeform[q.id] ?? ""}
                onChange={(e) => setFreeform((p) => ({ ...p, [q.id]: e.target.value }))}
                sx={{ mt: q.options && q.options.length ? 1.25 : 0 }}
              />
            )}
          </Box>
        ))}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
          <Button onClick={cancel} color="inherit" sx={{ textTransform: "none", color: theme.palette.text.secondary }}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={!allAnswered} variant="contained" sx={{ textTransform: "none" }}>
            Submit
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AskUserCard;
