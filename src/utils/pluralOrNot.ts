import { replace } from "./replace";

/**
 * If abs of `numberToCheck` isn't 1, `word` is made plural and returned, otherwise `word` is returned untouched.
 * @param word - Word to pluralize.
 * @param numberToCheck - Number to check.
 * @param indicate - An indicator (this or that), in plural they become these or those.
 * @returns Pluralized (or not) string.
 */
export function pluralOrNot(
  word: string,
  numberToCheck: number,
  indicate?: "this" | "that",
): string {
  const isSingular = Math.abs(numberToCheck) == 1;
  const plural = isSingular
    ? word
    : replace(word, [
        {
          text: word,
          replacement: word.endsWith("y") ? `${word.replace("y", "")}ies` : `${word}s`,
        },
      ]);

  if (!indicate) return plural;

  return isSingular
    ? `${indicate} ${plural}`
    : `${{ this: "these", that: "those" }[indicate]} ${plural}`;
}
