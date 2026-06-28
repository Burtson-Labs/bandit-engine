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

/**
 * Strip the textual source apparatus from an answer for display, since the
 * favicon chips now render it: our appended "**Sources**" list, plus a trailing
 * horizontal-rule + inline-citation block (superscript numbers + links) the
 * model sometimes adds. Conservative — only removes a trailing block that
 * clearly contains citations. The chips still parse the original content.
 */
export const stripSourcesForDisplay = (content: string): string => {
  if (!content) return content;
  let c = content;
  const idx = c.lastIndexOf("**Sources**");
  if (idx !== -1) c = c.slice(0, idx);
  c = c.replace(/\n*(?:---|\*\*\*|___)[ \t]*\n[\s\S]*$/u, (m) =>
    /[¹²³⁴⁵⁶⁷⁸⁹⁰]/u.test(m) && /\]\(https?:/i.test(m) ? "" : m,
  );
  return c.replace(/\s+$/u, "");
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
    <Tooltip
      title={
        <>
          <Box sx={{ fontWeight: 600 }}>{label}</Box>
          <Box sx={{ opacity: 0.75, fontSize: 11, wordBreak: "break-all", mt: 0.25 }}>{source.url}</Box>
        </>
      }
      arrow
    >
      <Box
        component="a"
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="source-chip"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px solid",
          borderColor: "background.paper",
          bgcolor: "action.hover",
          color: "text.primary",
          textDecoration: "none",
          // Hover lifts the chip via transform/z-index only — no layout reflow,
          // so the overlapping stack can never jitter the way the expand did.
          transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: 3,
            borderColor: "primary.main",
            zIndex: 3,
          },
        }}
      >
        {failed ? (
          <Box component="span" sx={{ fontSize: 11, fontWeight: 700, color: "primary.main" }}>
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
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1.5, flexWrap: "wrap" }} aria-label="Sources">
      <Box
        component="span"
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          flexShrink: 0,
        }}
      >
        Sources
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          // Overlapping stack; each chip lifts on hover (no reflow → no jitter).
          "& .source-chip": { ml: "-9px" },
          "& .source-chip:first-of-type": { ml: 0 },
        }}
      >
        {sources.map((s, i) => (
          <SourceChip key={`${s.url}-${i}`} source={s} />
        ))}
      </Box>
    </Box>
  );
};

export default SourceChips;
