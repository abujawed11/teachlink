// Collapses "Class N" names into compact labels: 1-6 and 8 -> ["Classes 1–6", "Class 8"].
// A run needs 3+ consecutive classes to become a range, so gaps (5, 8, 10) stay explicit.
// Names that aren't "Class N" are kept as they are, after the numbered ones.
const CLASS_PATTERN = /^class\s+(\d+)$/i;

export function formatGrades(names = []) {
  const numbers = [];
  const others = [];

  for (const name of names) {
    const match = CLASS_PATTERN.exec(name);
    if (match) numbers.push(Number(match[1]));
    else others.push(name);
  }

  numbers.sort((a, b) => a - b);

  const labels = [];
  for (let i = 0; i < numbers.length; ) {
    let j = i;
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++;

    if (j - i >= 2) {
      labels.push(`Classes ${numbers[i]}–${numbers[j]}`);
    } else {
      for (let k = i; k <= j; k++) labels.push(`Class ${numbers[k]}`);
    }
    i = j + 1;
  }

  return [...labels, ...others];
}
