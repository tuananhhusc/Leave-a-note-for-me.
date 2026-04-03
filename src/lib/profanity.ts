/**
 * Profanity Filter for YSOF Future Wall
 * Filters inappropriate Vietnamese and English words
 */

const BANNED_WORDS: string[] = [
  // Vietnamese profanity
  'đụ', 'địt', 'đéo', 'đ.m', 'dm', 'dcm', 'đcm', 'vcl', 'vkl', 'vãi',
  'lồn', 'buồi', 'cặc', 'đĩ', 'cave', 'dâm', 'chó', 'ngu',
  'khốn', 'khốn nạn', 'mẹ mày', 'bố mày', 'con mẹ', 'thằng ngu',
  'óc chó', 'nứng', 'chang', 'xạo', 'cứt',
  // English profanity
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'dick', 'pussy',
  'wtf', 'stfu', 'nigga', 'nigger', 'retard', 'slut', 'whore',
];

// Normalize Vietnamese text for comparison (remove diacritics variant tricks)
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.\-_*@#!0oO]/g, (ch) => {
      if (ch === '0' || ch === 'O' || ch === 'o') return 'o';
      return '';
    })
    .trim();
}

export function containsProfanity(text: string): boolean {
  const normalized = normalize(text);
  return BANNED_WORDS.some((word) => {
    const normalizedWord = normalize(word);
    return normalized.includes(normalizedWord);
  });
}

export function getProfanityWarning(): string {
  return 'Nội dung chứa từ ngữ không phù hợp. Hãy giữ bức tường luôn tích cực nhé! 💙';
}
