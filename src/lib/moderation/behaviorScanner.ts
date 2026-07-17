/**
 * Behavior-based moderation scanner.
 * Does NOT censor normal profanity (damn, hell, shit, fuck, etc.).
 * Flags personal attacks, harassment, hate speech, threats, and spam patterns.
 */

export type ScanCategory =
  | "personal_attack"
  | "harassment"
  | "hate_speech"
  | "threat"
  | "spam"
  | "repeated_abuse";

export type ScanResult = {
  flagged: boolean;
  category?: ScanCategory;
  score: number;
  excerpt?: string;
};

const ALLOWED_PROFANITY =
  /\b(damn|dammit|hell|shit|shitty|fuck|fucking|fucked|ass|asshole|bastard|crap|piss|bollocks|bugger)\b/gi;

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(ALLOWED_PROFANITY, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const THREAT_PATTERNS = [
  /\b(i('ll| will)?\s*(kill|murder|shoot|stab|hurt|beat)\s*(you|u)\b)/i,
  /\b(rape\s+you|end\s+you|hunt\s+you\s+down)\b/i,
  /\b(bomb\s+your|burn\s+your\s+house)\b/i,
];

const HATE_PATTERNS = [
  /\b(nigg(?:er|a)|kike|spic|chink|faggot|tranny|retard(?:ed)?)\b/i,
  /\b(gas\s+the|kill\s+all\s+(jews|muslims|gays|blacks|immigrants))\b/i,
  /\b(white\s+power|heil\s+hitler)\b/i,
];

const ATTACK_PATTERNS = [
  /\b(you('re| are)\s+(a\s+)?(worthless|pathetic|disgusting|ugly|stupid)\b)/i,
  /\b(kill\s+yourself|kys|go\s+die|hope\s+you\s+die)\b/i,
  /\b(nobody\s+likes\s+you|everyone\s+hates\s+you)\b/i,
];

const HARASS_PATTERNS = [
  /\b(i\s+know\s+where\s+you\s+live)\b/i,
  /\b(dox(?:x|xing)?|swat(?:ting)?)\b/i,
  /\b(send(?:ing)?\s+nudes?\s+or)\b/i,
  /\b(i('ll| will)\s+find\s+you)\b/i,
];

const SPAM_LINK =
  /(https?:\/\/|www\.)[^\s]{8,}/gi;

export function scanUserContent(
  raw: string,
  opts?: { recentIdenticalCount?: number; recentFlagCount?: number },
): ScanResult {
  const text = (raw ?? "").trim();
  if (!text) return { flagged: false, score: 0 };

  const cleaned = normalize(text);
  const excerpt = text.slice(0, 180);

  for (const re of THREAT_PATTERNS) {
    if (re.test(cleaned) || re.test(text)) {
      return { flagged: true, category: "threat", score: 10, excerpt };
    }
  }
  for (const re of HATE_PATTERNS) {
    if (re.test(cleaned) || re.test(text)) {
      return { flagged: true, category: "hate_speech", score: 9, excerpt };
    }
  }
  for (const re of HARASS_PATTERNS) {
    if (re.test(cleaned) || re.test(text)) {
      return { flagged: true, category: "harassment", score: 8, excerpt };
    }
  }
  for (const re of ATTACK_PATTERNS) {
    if (re.test(cleaned) || re.test(text)) {
      return { flagged: true, category: "personal_attack", score: 6, excerpt };
    }
  }

  const links = text.match(SPAM_LINK) ?? [];
  if (links.length >= 4) {
    return { flagged: true, category: "spam", score: 5, excerpt };
  }

  if ((opts?.recentIdenticalCount ?? 0) >= 4) {
    return { flagged: true, category: "spam", score: 5, excerpt };
  }

  if ((opts?.recentFlagCount ?? 0) >= 3) {
    return { flagged: true, category: "repeated_abuse", score: 7, excerpt };
  }

  return { flagged: false, score: 0 };
}

/** Persist a flag when content is suspicious. Never auto-deletes. */
export async function flagContentIfNeeded(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  input: {
    sourceType: string;
    sourceId: string;
    userId: string;
    body: string;
    recentIdenticalCount?: number;
    recentFlagCount?: number;
  },
): Promise<ScanResult> {
  const result = scanUserContent(input.body, {
    recentIdenticalCount: input.recentIdenticalCount,
    recentFlagCount: input.recentFlagCount,
  });
  if (!result.flagged || !result.category) return result;

  await supabase.from("moderation_flags").insert({
    source_type: input.sourceType,
    source_id: input.sourceId,
    user_id: input.userId,
    category: result.category,
    excerpt: result.excerpt ?? null,
    score: result.score,
    status: "open",
  });

  return result;
}
