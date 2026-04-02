// Placeholder for AI utilities
export const extractKeyPhrases = (text) => {
  // Future: Implement with NLP library
  return [];
};

export const summarizeText = (text, maxLength = 200) => {
  // Simple truncate for now
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};