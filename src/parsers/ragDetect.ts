/**
 * Kullanıcı mesajı içinde RAG (Retrieval-Augmented Generation) veya bağlam belgeleri bulunup bulunmadığını sezgisel olarak tespit eder.
 */
export function detectRag(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // XML benzeri etiketler veya özel RAG belirteçleri
  const ragKeywords = [
    '<document>',
    '</document>',
    '<documents>',
    '</documents>',
    '<context>',
    '</context>',
    '<source>',
    '</source>',
    '<retrieved>',
    '</retrieved>',
    'context:',
    'kaynak:',
    'sources:',
    'retrieved:',
  ];

  const lowerText = text.toLowerCase();
  for (const keyword of ragKeywords) {
    if (lowerText.includes(keyword)) {
      return true;
    }
  }

  // --- veya === ile ayrılmış 2'den fazla uzun blok var mı?
  const dashBlocks = text.split(/(?:---|\=\=\=)/);
  if (dashBlocks.length >= 3) {
    const longSubBlocks = dashBlocks.filter((b) => b.trim().length > 100);
    if (longSubBlocks.length >= 2) {
      return true;
    }
  }

  return false;
}
