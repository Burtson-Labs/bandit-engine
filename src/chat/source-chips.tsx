import { useMemo, useState } from "react";
import { Box, Tooltip } from "@mui/material";

interface WebSource {
  title: string;
  url: string;
}

/**
 * Parse the structured web sources out of an answer's trailing "**Sources**"
 * list (the format appended by the chat tool loop). Returns [] while a message
 * is still streaming or has no sources, so chips only appear once they exist.
 */
export const parseWebSources = (content: string): WebSource[] => {
  if (!content) return [];
  const idx = content.lastIndexOf("**Sources**");
  if (idx === -1) return [];
  const section = content.slice(idx);
  const out: WebSource[] = [];
  const re = /^\s*[-*]\s*\[([^\]]+)\]\(([^)\s]+)\)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    const url = m[2].trim();
    if (/^https?:\/\//i.test(url)) {
      out.push({ title: m[1].trim(), url });
    }
  }
  // De-dupe by URL, keep order.
  const seen = new Set<string>();
  return out.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
};

const domainOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const SourceChip = ({ source }: { source: WebSource }) => {
  const [failed, setFailed] = useState(false);
  const domain = domainOf(source.url);
  const label = source.title?.trim() || domain;

  return (
    <Tooltip title={`${label} · ${domain}`} arrow>
      <Box
        component="a"
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          maxWidth: 240,
          px: 1,
          py: 0.4,
          borderRadius: 999,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
          textDecoration: "none",
          color: "text.primary",
          fontSize: 12.5,
          lineHeight: 1.4,
          transition: "border-color 0.15s ease, background-color 0.15s ease",
          "&:hover": { borderColor: "primary.main", bgcolor: "action.selected" },
        }}
      >
        {failed ? (
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: "4px",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "grid",
              placeItems: "center",
              fontSize: 9,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {domain.charAt(0).toUpperCase()}
          </Box>
        ) : (
          <Box
            component="img"
            src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            sx={{ width: 16, height: 16, borderRadius: "4px", flexShrink: 0 }}
          />
        )}
        <Box
          component="span"
          sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {label}
        </Box>
      </Box>
    </Tooltip>
  );
};

/**
 * A row of favicon + title chips for the answer's web sources. A visual,
 * trust-building complement to the existing textual "Sources" list.
 */
const SourceChips = ({ content }: { content: string }) => {
  const sources = useMemo(() => parseWebSources(content), [content]);
  if (sources.length === 0) return null;

  return (
    <Box
      sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}
      aria-label="Sources"
    >
      {sources.map((s, i) => (
        <SourceChip key={`${s.url}-${i}`} source={s} />
      ))}
    </Box>
  );
};

export default SourceChips;
