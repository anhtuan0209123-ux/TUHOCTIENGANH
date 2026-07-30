/**
 * Removes standard Vietnamese tone marks / diacritics.
 */
function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD') // Splits characters into base letters and separate diacritical accents
    .replace(/[\u0300-\u036f]/g, '') // Strips out all the parsed diacritical accent marks
    .replace(/[đđ]/g, 'd') // Standard replacement for đ
    .replace(/[ĐĐ]/g, 'd');
}

/**
 * Checks if the user's typed answer matches the correct answer using a flexible, smart matching algorithm.
 * Guarantees that minor spelling presentation discrepancies like trailing whitespace, extra spaces,
 * case sensitivity, punctuation, quotation styles, and slashes/commas/alternatives do not cause unfair failures.
 * This function also optionally matches Vietnamese words with or without tone marks/diacritics.
 */
export function checkAnswerSmart(typed: string, correct: string): boolean {
  if (!typed || !correct) return false;

  // Primary helper function to normalize individual words/strings
  const normalize = (str: string): string => {
    return str
      .trim()
      .toLowerCase()
      // Remove all quotation marks completely: double, single, curly quotes, backticks, chevron-style quotes
      .replace(/["'“”‘’`«»„]/g, '')
      // Remove all parentheses, brackets, braces
      .replace(/[()\[\]{}<>]/g, '')
      // Remove other non-alphanumeric punctuation commonly used (except spaces)
      .replace(/[.!?,;:\-_/\\|+=*@#$%^&~]/g, '')
      // Replace multiple consecutive white spaces/tabs/newlines with a single space
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normTyped = normalize(typed);

  // Identify potential alternative answers inside correct string (e.g. "organize / organise", "run, jog", "hello or hi")
  // We split by specific boundary delimiters: / ; or comma (,) or ' or ' or vertical bar
  const alternatives = correct
    .split(/\s*(?:\/|;|or|,|\|)\s*/i)
    .map(alt => normalize(alt))
    .filter(alt => alt.length > 0);

  // If no split/alternatives identified, normalize the original block as a single answer
  const normalizedCorrect = normalize(correct);

  // 1. Check exact normalized match with the singular correct answer
  if (normTyped === normalizedCorrect) {
    return true;
  }

  // 2. Check exact normalized match with any of the split alternatives
  if (alternatives.includes(normTyped)) {
    return true;
  }

  // 3. Fallback: Compare stripped Vietnamese diacritics / tone accents as well
  const noAccentTyped = removeVietnameseTones(normTyped);
  
  if (noAccentTyped === removeVietnameseTones(normalizedCorrect)) {
    return true;
  }

  const isMatchNoAccentAlternatives = alternatives.some(
    alt => removeVietnameseTones(alt) === noAccentTyped
  );

  return isMatchNoAccentAlternatives;
}

/**
 * Replaces the card term inside its context/example sentence with standard bracketed blanks [_______].
 * Returns a tuple containing the masked sentence, and whether the term was successfully found and replaced.
 */
export function maskTermInExample(example: string, term: string, definition: string = ''): { maskedText: string; success: boolean } {
  if (!term) return { maskedText: '', success: false };

  const cleanExample = (example || '').trim();
  if (!cleanExample) {
    // Elegant fallback sentence using definition
    const fallbackText = `Khái niệm nào sau đây có định nghĩa: "${definition}"?\n\nĐáp án: [_______]`;
    return { maskedText: fallbackText, success: true };
  }

  // Try replacing the full term case-insensitively:
  // We can use a regex. Escape term characters to prevent regex failures.
  const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
  
  let masked = cleanExample.replace(regex, '[_______]');
  let success = masked !== cleanExample;

  // If word boundaries failed (e.g. compound words or special characters), try substring:
  if (!success) {
    const regexSimple = new RegExp(escapedTerm, 'gi');
    masked = cleanExample.replace(regexSimple, '[_______]');
    success = masked !== cleanExample;
  }

  // If still not replaced, maybe because of verb tense variations or plurals,
  // let's try replacing similar word shapes or fall back to displaying the raw sentence with a placeholder line below it.
  if (!success && term.length > 3) {
    const prefix = term.substring(0, Math.min(term.length, 4));
    const escapedPrefix = prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regexPrefix = new RegExp(`\\b${escapedPrefix}\\w*\\b`, 'gi');
    masked = cleanExample.replace(regexPrefix, '[_______]');
    success = masked !== cleanExample;
  }

  // Ultimate fallback if the term wasn't replaced at all (just append block)
  if (!success) {
    masked = `${cleanExample}\n\n(Điền thuật ngữ tương đương cho từ bị thiếu: [_______])`;
    success = true;
  }

  return { maskedText: masked, success };
}

/**
 * Checks if a given term matches any other term case-insensitively.
 * Detects if it repeats in other study sets or even within the current set edits.
 */
export function checkIsRepeatedTerm(
  term: string,
  currentCardId: string,
  currentSetId: string | undefined,
  allSets: any[], // Type loosely to avoid circular compile paths, resolves to StudySet[]
  currentDeckCardsState: any[] // Resolves to Card[]
): { isRepeated: boolean; sourceSets: string[] } {
  const cleanTerm = (term || '').trim().toLowerCase();
  if (!cleanTerm) return { isRepeated: false, sourceSets: [] };

  const sourceSetsSet = new Set<string>();

  // 1. Check inside current draft deck (excluding this exact card)
  const isDuplicateInCurrentDeck = currentDeckCardsState.some(
    c => c.id !== currentCardId && (c.term || '').trim().toLowerCase() === cleanTerm
  );
  if (isDuplicateInCurrentDeck) {
    sourceSetsSet.add('Học phần hiện tại');
  }

  // 2. Check other saved decks
  allSets.forEach((set) => {
    // Skip checking the same set in storage if we are editing it
    if (currentSetId && set.id === currentSetId) return;

    const hasTerm = (set.cards || []).some(
      (c: any) => (c.term || '').trim().toLowerCase() === cleanTerm
    );
    if (hasTerm) {
      sourceSetsSet.add(set.title || 'Học phần khác');
    }
  });

  return {
    isRepeated: sourceSetsSet.size > 0,
    sourceSets: Array.from(sourceSetsSet)
  };
}

/**
 * Detects if a sentence is an artificial meta-sentence about learning/studying rather than a real contextual usage.
 */
export function isMetaSentence(sentence: string | undefined): boolean {
  if (!sentence) return true;
  const lower = sentence.toLowerCase().trim();
  return (
    lower.length < 5 ||
    lower.includes('please study the word') ||
    lower.includes('carefully to master') ||
    lower.includes('advanced practice instance') ||
    lower.includes('master the core concept') ||
    lower.includes('make it a habit') ||
    lower.includes('this sentence uses') ||
    lower.includes('everyday example of how') ||
    lower.includes('study set generator') ||
    lower.includes('vui lòng nghiên cứu kĩ lưỡng') ||
    lower.includes('this is an example') ||
    lower.includes('understanding the core concept')
  );
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates a varied, natural, contextual English sentence and Vietnamese translation
 * using a hash function on the term so that different terms get different sentence patterns.
 */
export function generateDiverseNaturalExample(term: string, definition: string = ''): { example: string; exampleTranslation: string } {
  const cleanTerm = (term || 'word').trim();
  const cleanDef = (definition || '').trim();
  const suffixDef = cleanDef ? ` (${cleanDef})` : '';

  const templates = [
    {
      example: `Many people find that ${cleanTerm} plays an important role in daily life.`,
      translation: `Nhiều người nhận thấy ${cleanTerm}${suffixDef} đóng một vai trò quan trọng trong cuộc sống hàng ngày.`
    },
    {
      example: `He spent years mastering ${cleanTerm} before applying it to his main project.`,
      translation: `Anh ấy đã dành nhiều năm rèn luyện ${cleanTerm}${suffixDef} trước khi áp dụng vào dự án chính của mình.`
    },
    {
      example: `Have you ever considered how ${cleanTerm} impacts our modern society?`,
      translation: `Bạn đã bao giờ cân nhắc xem ${cleanTerm}${suffixDef} ảnh hưởng như thế nào đến xã hội hiện đại chưa?`
    },
    {
      example: `The expert gave a clear demonstration of ${cleanTerm} during the conference.`,
      translation: `Chuyên gia đã minh họa rõ ràng về ${cleanTerm}${suffixDef} trong buổi hội thảo.`
    },
    {
      example: `She quickly noticed that ${cleanTerm} was the key factor in solving the issue.`,
      translation: `Cô ấy nhanh chóng nhận ra rằng ${cleanTerm}${suffixDef} là yếu tố then chốt để giải quyết vấn đề.`
    },
    {
      example: `They are working together to improve their understanding of ${cleanTerm}.`,
      translation: `Họ đang cùng nhau làm việc để nâng cao sự hiểu biết về ${cleanTerm}${suffixDef}.`
    },
    {
      example: `Without a clear grasp of ${cleanTerm}, it is difficult to achieve good results.`,
      translation: `Nếu không nắm vững ${cleanTerm}${suffixDef}, rất khó để đạt được kết quả tốt.`
    },
    {
      example: `This new textbook provides many practical scenarios involving ${cleanTerm}.`,
      translation: `Cuốn giáo trình mới này đưa ra nhiều kịch bản thực tế liên quan đến ${cleanTerm}${suffixDef}.`
    },
    {
      example: `Can you explain the main difference between ${cleanTerm} and other related terms?`,
      translation: `Bạn có thể giải thích sự khác biệt chính giữa ${cleanTerm}${suffixDef} và các thuật ngữ liên quan khác không?`
    },
    {
      example: `Recent research suggests that ${cleanTerm} plays a crucial role in development.`,
      translation: `Nghiên cứu gần đây cho thấy ${cleanTerm}${suffixDef} đóng vai trò quan trọng trong sự phát triển.`
    },
    {
      example: `I decided to practice using ${cleanTerm} every morning to build a strong habit.`,
      translation: `Tôi quyết định thực hành sử dụng ${cleanTerm}${suffixDef} mỗi sáng để tạo một thói quen tốt.`
    },
    {
      example: `The team had an intense debate about ${cleanTerm} before reaching a consensus.`,
      translation: `Cả đội đã có cuộc tranh luận sôi nổi về ${cleanTerm}${suffixDef} trước khi đạt được sự thống nhất.`
    },
    {
      example: `It is important to remember that ${cleanTerm} can vary depending on the context.`,
      translation: `Điều quan trọng là phải nhớ rằng ${cleanTerm}${suffixDef} có thể thay đổi tùy thuộc vào ngữ cảnh.`
    },
    {
      example: `His presentation on ${cleanTerm} received enthusiastic feedback from everyone.`,
      translation: `Bài thuyết trình của anh ấy về ${cleanTerm}${suffixDef} đã nhận được phản hồi hào hứng từ mọi người.`
    },
    {
      example: `We need more reliable information about ${cleanTerm} to make a wise choice.`,
      translation: `Chúng ta cần thêm thông tin đáng tin cậy về ${cleanTerm}${suffixDef} để đưa ra lựa chọn sáng suốt.`
    }
  ];

  const index = hashString(cleanTerm) % templates.length;
  const picked = templates[index];

  return {
    example: picked.example,
    exampleTranslation: picked.translation
  };
}

/**
 * Returns a clean, natural contextual example sentence and translation for a card,
 * replacing meta-sentences with natural sentences using the term and definition.
 */
export function getCleanExample(card: { term: string; definition: string; example?: string; exampleTranslation?: string }): { example: string; exampleTranslation: string } {
  const hasGoodExample = card && card.example && !isMetaSentence(card.example);
  const hasGoodTranslation = card && card.exampleTranslation && !isMetaSentence(card.exampleTranslation);

  if (hasGoodExample) {
    return {
      example: card.example!,
      exampleTranslation: hasGoodTranslation ? card.exampleTranslation! : (card.definition || '')
    };
  }

  return generateDiverseNaturalExample(card?.term || '', card?.definition || '');
}



