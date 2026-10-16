// Turns a free-text label into a safe SQL identifier (matches the
// query-compiler's IDENTIFIER_RE: starts with a letter/underscore, then
// letters/digits/underscores only).
export function toSqlIdentifier(input: string): string {
  let result = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!result) result = 'field';
  if (/^[0-9]/.test(result)) result = `_${result}`;

  return result;
}
