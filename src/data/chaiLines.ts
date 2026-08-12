/**
 * Chai Ki Chuski — little thoughts from the bethak.
 *
 * A small curated, local list. Never generated, never fetched, never stored.
 */

/** The very first sip always says the same thing. */
export const CHAI_FIRST_LINE = "कुछ देर और बैठिए।";

export const CHAI_LINES: string[] = [
  "चाय ठंडी हो सकती है, बातें नहीं।",
  "आज कहीं जाने की जल्दी नहीं।",
  "बेसाख्ता बैठना भी एक हुनर है।",
  "गीत पूरा होने दीजिए।",
  "कुछ शामें बस बैठने के लिए होती हैं।",
  "एक चुस्की और, फिर सोचेंगे।",
  "इस कमरे को आपकी आदत हो चली है।",
  "बाहर की दुनिया थोड़ी देर रुक सकती है।",
  "धीरे पीजिए, रात लंबी है।",
];

/** Picks a line, never the same one twice in a row. */
export function nextChaiLine(previous: string | null): string {
  const pool = CHAI_LINES.filter((l) => l !== previous);
  return pool[Math.floor(Math.random() * pool.length)] ?? CHAI_LINES[0];
}
