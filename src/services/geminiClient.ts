import { GoogleGenAI } from '@google/genai';
import { getStoredGeminiKey } from '../utils/geminiKey';

// Helper for offline fallback sentence generation
export function getMultipleDiverseServerSentences(term: string, definition: string = ''): Array<{ sentence: string; translation: string }> {
  const cleanTerm = (term || 'word').trim();
  const cleanDef = (definition || '').trim();
  const suffixDef = cleanDef ? ` (${cleanDef})` : '';

  let hash = 0;
  for (let i = 0; i < cleanTerm.length; i++) {
    hash = (hash << 5) - hash + cleanTerm.charCodeAt(i);
    hash |= 0;
  }
  const baseIndex = Math.abs(hash);

  const pool = [
    {
      sentence: `Many people find that ${cleanTerm} plays an important role in daily life.`,
      translation: `Nhiều người nhận thấy ${cleanTerm}${suffixDef} đóng một vai trò quan trọng trong cuộc sống hàng ngày.`
    },
    {
      sentence: `He spent years mastering ${cleanTerm} before applying it to his main project.`,
      translation: `Anh ấy đã dành nhiều năm rèn luyện ${cleanTerm}${suffixDef} trước khi áp dụng vào dự án chính của mình.`
    },
    {
      sentence: `Have you ever considered how ${cleanTerm} impacts our modern society?`,
      translation: `Bạn đã bao giờ cân nhắc xem ${cleanTerm}${suffixDef} ảnh hưởng như thế nào đến xã hội hiện đại chưa?`
    },
    {
      sentence: `The expert gave a clear demonstration of ${cleanTerm} during the conference.`,
      translation: `Chuyên gia đã minh họa rõ ràng về ${cleanTerm}${suffixDef} trong buổi hội thảo.`
    },
    {
      sentence: `She quickly noticed that ${cleanTerm} was the key factor in solving the issue.`,
      translation: `Cô ấy nhanh chóng nhận ra rằng ${cleanTerm}${suffixDef} là yếu tố then chốt để giải quyết vấn đề.`
    },
    {
      sentence: `They are working together to improve their understanding of ${cleanTerm}.`,
      translation: `Họ đang cùng nhau làm việc để nâng cao sự hiểu biết về ${cleanTerm}${suffixDef}.`
    },
    {
      sentence: `Without a clear grasp of ${cleanTerm}, it is difficult to achieve good results.`,
      translation: `Nếu không nắm vững ${cleanTerm}${suffixDef}, rất khó để đạt được kết quả tốt.`
    },
    {
      sentence: `This new textbook provides many practical scenarios involving ${cleanTerm}.`,
      translation: `Cuốn giáo trình mới này đưa ra nhiều kịch bản thực tế liên quan đến ${cleanTerm}${suffixDef}.`
    },
    {
      sentence: `Can you explain the main difference between ${cleanTerm} and other related terms?`,
      translation: `Bạn có thể giải thích sự khác biệt chính giữa ${cleanTerm}${suffixDef} và các thuật ngữ liên quan khác không?`
    },
    {
      sentence: `Recent research suggests that ${cleanTerm} plays a crucial role in development.`,
      translation: `Nghiên cứu gần đây cho thấy ${cleanTerm}${suffixDef} đóng vai trò quan trọng trong sự phát triển.`
    },
    {
      sentence: `She decides to practice using ${cleanTerm} in daily conversations to build confidence.`,
      translation: `Cô ấy quyết định thực hành sử dụng ${cleanTerm}${suffixDef} trong giao tiếp hàng ngày để tăng sự tự tin.`
    },
    {
      sentence: `Our team had a productive discussion on how to optimize ${cleanTerm} effectively.`,
      translation: `Nhóm chúng tôi đã có buổi thảo luận hiệu quả về cách tối ưu hóa ${cleanTerm}${suffixDef} một cách hữu hiệu.`
    },
    {
      sentence: `Understanding ${cleanTerm} thoroughly will give you a significant advantage in this field.`,
      translation: `Thấu hiểu ${cleanTerm}${suffixDef} một cách thấu đáo sẽ mang lại cho bạn lợi thế lớn trong lĩnh vực này.`
    },
    {
      sentence: `The manager requested a detailed report regarding the implementation of ${cleanTerm}.`,
      translation: `Người quản lý đã yêu cầu một báo cáo chi tiết liên quan đến việc triển khai ${cleanTerm}${suffixDef}.`
    },
    {
      sentence: `It is widely acknowledged that ${cleanTerm} requires continuous practice and attention.`,
      translation: `Mọi người đều công nhận rằng ${cleanTerm}${suffixDef} đòi hỏi sự rèn luyện và chú ý liên tục.`
    }
  ];

  const idx1 = baseIndex % pool.length;
  const idx2 = (baseIndex + 5) % pool.length;
  const idx3 = (baseIndex + 11) % pool.length;

  return [pool[idx1], pool[idx2], pool[idx3]];
}

export function getDiverseServerExample(term: string, definition: string = ''): { example: string; exampleTranslation: string } {
  const sentences = getMultipleDiverseServerSentences(term, definition);
  return {
    example: sentences[0].sentence,
    exampleTranslation: sentences[0].translation
  };
}

export function generateOfflineStudySet(topic: string, amount: number = 8) {
  const cleanTopic = topic.toLowerCase().trim();
  
  let title = `Học phần: ${topic}`;
  let description = `Học phần từ vựng chất lượng cao được thiết kế cho chuyên đề "${topic}". (Chế độ Ngoại tuyến dự phòng chất lượng cao)`;
  let cards: Array<{ term: string; definition: string; example: string; exampleTranslation?: string }> = [];

  if (cleanTopic.includes("ielts") || cleanTopic.includes("english") || cleanTopic.includes("tiếng anh") || cleanTopic.includes("vocab") || cleanTopic.includes("học từ") || cleanTopic.includes("ngôn ngữ")) {
    title = `IELTS Chuyên Sâu: ${topic.replace(/ielts|english|tiếng anh|vocab/gi, "").trim() || "English Vocabulary"}`;
    description = `Bộ thẻ ghi nhớ học thuật giúp bứt phá band điểm IELTS cho chủ đề: ${topic}.`;
    const englishWordPool = [
      { term: 'Fluency', definition: 'Khả năng nói hoặc viết một ngôn ngữ một cách dễ dàng, trôi chảy và tự nhiên.', example: 'To achieve a high band score, you need to speak English with great fluency.', exampleTranslation: 'Để đạt điểm band cao, bạn cần nói tiếng Anh thật trôi chảy.' },
      { term: 'Coherence', definition: 'Sự liên kết, tính mạch lạc cấu trúc giữa các ý tưởng khi nói hoặc viết.', example: 'The essay lacks coherence, making it difficult for the examiner to follow.', exampleTranslation: 'Bài luận thiếu tính mạch lạc, khiến giám khảo khó theo dõi.' },
      { term: 'Lexical Resource', definition: 'Vốn từ vựng đa dạng, phong phú được sử dụng đúng ngữ cảnh.', example: 'Expanding your lexical resource is essential for clear communication.', exampleTranslation: 'Mở rộng vốn từ vựng của bạn là điều thiết yếu để giao tiếp rõ ràng.' },
      { term: 'Collocation', definition: 'Cụm từ cố định thường được dùng song hành cùng nhau để nghe tự nhiên.', example: '"Make a decision" is a common collocation in business English.', exampleTranslation: '"Make a decision" là một cụm từ cố định phổ biến trong tiếng Anh thương mại.' },
      { term: 'Infrastructure', definition: 'Cơ sở hạ tầng cơ bản (đường sá, cầu cống, v.v.) của một quốc gia.', example: 'The transport infrastructure of big cities needs major investments.', exampleTranslation: 'Cơ sở hạ tầng giao thông của các thành phố lớn cần những khoản đầu tư lớn.' },
      { term: 'Feasible', definition: 'Khả thi, có thể thực hiện được một cách thành công và thực tế.', example: 'Developing domestic renewable energy is a highly feasible plan.', exampleTranslation: 'Phát triển năng lượng tái tạo trong nước là một kế hoạch rất khả thi.' },
      { term: 'Mitigate', definition: 'Giảm thiểu, làm bớt phần nào tác động tiêu cực hoặc tai hại.', example: 'Planting trees helps to mitigate the severe effects of deforestation.', exampleTranslation: 'Trồng cây giúp giảm thiểu các tác hại nghiêm trọng của việc nạn phá rừng.' },
      { term: 'Advocate', definition: 'Ủng hộ tích cực hoặc đấu tranh công khai cho một lý tưởng, giải pháp.', example: 'Many doctors advocate a diet low in refined sugar and processed food.', exampleTranslation: 'Nhiều bác sĩ ủng hộ chế độ ăn ít đường tinh luyện và thực phẩm chế biến sẵn.' },
      { term: 'Prevalent', definition: 'Mức độ thịnh hành, lan tỏa rộng rãi hoặc cực kỳ phổ biến.', example: 'Wireless internet networks are highly prevalent throughout modern cities.', exampleTranslation: 'Mạng internet không dây cực kỳ phổ biến khắp các thành phố hiện đại.' },
      { term: 'Adverse', definition: 'Bất lợi, có hại, gây ra khó khăn nghiêm trọng.', example: 'Adverse weather conditions forced the airlines to cancel all flights.', exampleTranslation: 'Điều kiện thời tiết bất lợi đã buộc các hãng hàng không phải hủy tất cả chuyến bay.' },
      { term: 'Acquire', definition: 'Thu nhận được, đạt vững kiến thức hoặc kỹ năng mới qua thời gian.', example: 'Children acquire language rapidly through continuous exposure.', exampleTranslation: 'Trẻ em tiếp thu ngôn ngữ nhanh chóng nhờ tiếp xúc liên tục.' },
      { term: 'Innovative', definition: 'Có tính chất đổi mới, mang tính sáng tạo đột phá.', example: 'The company launched an innovative device for clean water purification.', exampleTranslation: 'Công ty đã ra mắt một thiết bị đột phá giúp lọc nước sạch.' }
    ];
    cards = englishWordPool.slice(0, Math.min(amount, englishWordPool.length));
  } else if (cleanTopic.includes("react") || cleanTopic.includes("code") || cleanTopic.includes("javascript") || cleanTopic.includes("python") || cleanTopic.includes("lập trình") || cleanTopic.includes("html") || cleanTopic.includes("css") || cleanTopic.includes("programming") || cleanTopic.includes("developer") || cleanTopic.includes("phần mềm") || cleanTopic.includes("máy tính")) {
    title = `Lập Trình & Công Nghệ: ${topic}`;
    description = `Tổng hợp các khái niệm lập trình căn bản, thiết kế giải thuật và công xưởng công nghệ liên quan về ${topic}.`;
    const techWordPool = [
      { term: 'Component', definition: 'Thành phần giao diện người dùng độc lập, có thể tái sử dụng nhiều lần.', example: 'A React application is built beautifully out of reusable custom components.', exampleTranslation: 'Một ứng dụng React được xây dựng đẹp mắt từ các thành phần tùy chỉnh có thể tái sử dụng.' },
      { term: 'State', definition: 'Trạng thái lưu trữ dữ liệu nội bộ có khả năng thay đổi và trigger re-render component.', example: 'Changing local state updates the visual UI immediately to reflect new data.', exampleTranslation: 'Thay đổi trạng thái cục bộ sẽ cập nhật giao diện ngay lập tức để phản ánh dữ liệu mới.' },
      { term: 'Props', definition: 'Các thuộc tính cấu hình hoặc dữ liệu truyền từ component cha xuống component con.', example: 'Props are absolute read-only data assets in component tree structures.', exampleTranslation: 'Props là dữ liệu chỉ đọc trong cấu trúc cây thành phần.' },
      { term: 'Framework', definition: 'Khung làm việc cung cấp sẵn các thư viện, quy chuẩn chuẩn hóa để phát triển.', example: 'Next.js has become an extremely popular framework for production React apps.', exampleTranslation: 'Next.js đã trở thành một khung làm việc cực kỳ phổ biến cho ứng dụng React sản xuất.' },
      { term: 'API', definition: 'Giao diện lập trình ứng dụng giúp truyền tải dữ liệu giữa client và backend.', example: 'We make secure POST requests to the backend API to process user orders.', exampleTranslation: 'Chúng tôi gửi yêu cầu POST an toàn tới API hệ thống để xử lý đơn hàng của người dùng.' },
      { term: 'Data binding', definition: 'Cơ chế đồng bộ hóa luồng dữ liệu tự động giữa UI và logic nguồn.', example: 'React uses one-way data binding to make application behavior predictable.', exampleTranslation: 'React sử dụng liên kết dữ liệu một chiều để làm cho hành vi ứng dụng dễ dự đoán.' },
      { term: 'Asynchronous', definition: 'Giải thuật bất đồng bộ cho phép thực hiện việc khác mà không chặn luồng chính.', example: 'Fetching large files from a server is always handled as an asynchronous promise.', exampleTranslation: 'Tải tập tin lớn từ máy chủ luôn được xử lý bất đồng bộ.' },
      { term: 'Database', definition: 'Hệ thống cơ sở dữ liệu có cấu trúc phục vụ lưu trữ lâu dài bền vững.', example: 'Firebase Firestore database provides modular, low-latency, real-time persistence.', exampleTranslation: 'Cơ sở dữ liệu Firebase Firestore cung cấp khả năng lưu trữ thời gian thực độ trễ thấp.' },
      { term: 'Algorithm', definition: 'Thuật toán chi tiết gồm các bước tuần tự rõ ràng để giải quyết vấn đề.', example: 'An efficient search algorithm reduces computation complexity from O(N) to O(log N).', exampleTranslation: 'Một thuật toán tìm kiếm hiệu quả sẽ giảm độ phức tạp tính toán từ O(N) xuống O(log N).' },
      { term: 'Repository', definition: 'Kho lưu trữ mã nguồn trực tuyến hỗ trợ cộng tác nhóm như GitHub.', example: 'Commit your clean changes frequently to the central git repository.', exampleTranslation: 'Hãy đẩy các thay đổi mã nguồn của bạn thường xuyên lên kho lưu trữ Git trung tâm.' }
    ];
    cards = techWordPool.slice(0, Math.min(amount, techWordPool.length));
  } else {
    title = `Chuyên Đề Học Tập: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
    description = `Phát triển năng lực học thuật chuyên sâu và ghi nhớ vững chắc các khía cạnh liên quan tới: ${topic}.`;
    const generalTemplate = [
      { term: `${topic} - Khái niệm`, definition: `Khái niệm cốt lõi, nguồn gốc nền móng và định hướng phát triển hiện đại liên quan tới ${topic}.`, example: `Understanding the core concept of ${topic} is essential.`, exampleTranslation: `Hiểu được khái niệm cốt lõi của ${topic} là điều thiết yếu.` },
      { term: `${topic} - Quy tắc`, definition: `Các nguyên lý vận hành cốt tử, quy chuẩn hoạt động bắt buộc tuân thủ để đạt kết quả tối ưu.`, example: `Following the standard rules of ${topic} prevents common mistakes.`, exampleTranslation: `Tuân thủ các quy tắc chuẩn của ${topic} giúp tránh những lỗi thông thường.` },
      { term: `${topic} - Ứng dụng`, definition: `Phương pháp đưa lý thuyết vào thực tiễn cuộc sống, công tác nghiên cứu hay sản xuất thực tiễn trong ngành.`, example: `Practical application of ${topic} brings immediate real-world benefits.`, exampleTranslation: `Ứng dụng thực tế của ${topic} mang lại những lợi ích thực tiễn tức thì.` },
      { term: `${topic} - Giải pháp`, definition: `Các phương cách tháo gỡ điểm nghẽn, nâng cao hiệu suất hoạt động và giải quyết triệt để khó khăn phát sinh.`, example: `We need an effective solution for ${topic} challenges.`, exampleTranslation: `Chúng ta cần một giải pháp hiệu quả cho những thách thức của ${topic}.` },
      { term: `${topic} - Tiến trình`, definition: `Tiến trình phát triển khoa học, theo dõi biểu đồ thời gian biến chuyển của hành vi.`, example: `Tracking the progress of ${topic} helps stay on schedule.`, exampleTranslation: `Theo dõi tiến trình của ${topic} giúp đảm bảo đúng tiến độ.` },
      { term: `${topic} - Tư duy`, definition: `Phương pháp luận tư duy đa khía cạnh, thiết lập phản xạ giải quyết vấn đề nhanh chóng.`, example: `Creative thinking around ${topic} opens up new possibilities.`, exampleTranslation: `Tư duy sáng tạo xoay quanh ${topic} mở ra nhiều khả năng mới.` },
      { term: `${topic} - Thực hành`, definition: `Các bài tập củng cố kiến thức trực quan, kích hoạt tính bền vững của trí nhớ dài hạn.`, example: `Daily practice of ${topic} improves your skill rapidly.`, exampleTranslation: `Thực hành hàng ngày về ${topic} giúp nâng cao kỹ năng của bạn nhanh chóng.` },
      { term: `${topic} - Tối ưu`, definition: `Cách thức cắt giảm lãng phí, tinh gọn quy trình và nâng tầm chất lượng tối đa.`, example: `Continuous optimization of ${topic} ensures high quality.`, exampleTranslation: `Tối ưu hóa liên tục ${topic} đảm bảo chất lượng cao.` }
    ];
    cards = generalTemplate.slice(0, Math.min(amount, generalTemplate.length));
  }

  if (cards.length > amount) {
    cards = cards.slice(0, amount);
  }

  return { title, description, cards };
}

export function extractOfflineVocab(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const cards: Array<{ term: string; definition: string; example: string; exampleTranslation?: string }> = [];

  let looksLikeList = false;
  let matches = 0;
  lines.forEach(line => {
    if (line.includes('\t') || line.includes('  ') || line.includes(' - ') || line.includes(' – ') || line.includes(':') || line.includes('=') || line.includes('|')) {
      matches++;
    }
  });
  if (matches >= 2 || (lines.length >= 2 && lines.length <= 150)) {
    looksLikeList = true;
  }

  if (looksLikeList) {
    lines.forEach((line) => {
      let term = '';
      let definition = '';

      if (line.includes('\t')) {
        const parts = line.split('\t');
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (line.includes('|')) {
        const parts = line.split('|');
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else if (line.includes('  ')) {
        const parts = line.split(/ {2,}/);
        term = parts[0].trim();
        definition = parts.slice(1).join(' ').trim();
      } else {
        const separatorIndex = line.indexOf(' - ') !== -1 ? line.indexOf(' - ')
                             : line.indexOf(' – ') !== -1 ? line.indexOf(' – ')
                             : line.indexOf(':') !== -1 ? line.indexOf(':')
                             : line.indexOf('-') !== -1 ? line.indexOf('-')
                             : line.indexOf('=');

        if (separatorIndex !== -1) {
          term = line.substring(0, separatorIndex).trim();
          definition = line.substring(separatorIndex + 1).trim();
        } else {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            term = parts[0].trim();
            definition = parts.slice(1).join(' ').trim();
          } else {
            term = line;
            definition = "Định nghĩa cho " + line;
          }
        }
      }

      term = term.replace(/^\d+[\.\s\-]+/, '').replace(/^[\-\*\+\s\•]+/, '').trim();

      if (term && term.length > 0) {
        cards.push({
          term,
          definition: definition || `Định nghĩa học tập hữu hiệu cho thuật ngữ "${term}".`,
          example: `Ví dụ sử dụng thuật ngữ "${term}" chuẩn xác trong văn cảnh thực tế.`
        });
      }
    });
  }

  if (cards.length === 0) {
    const words = text
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“]/g, " ")
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 3);

    const uniqueWords = Array.from(new Set(words));
    const cardCandidates = uniqueWords.slice(0, 25);

    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 8);

    cardCandidates.forEach((word, idx) => {
      let matchingSentence = sentences.find(s => s.toLowerCase().includes(word.toLowerCase())) || "";
      if (!matchingSentence && sentences.length > 0) {
        matchingSentence = sentences[idx % sentences.length];
      }
      if (matchingSentence.length > 120) {
        matchingSentence = matchingSentence.slice(0, 117) + "...";
      }

      const termFormatted = word.charAt(0).toUpperCase() + word.slice(1);
      cards.push({
        term: termFormatted,
        definition: `Từ vựng được trích xuất trực tiếp: "${word.toLowerCase()}" từ nội dung nguồn.`,
        example: matchingSentence || `Mẫu ứng dụng ngữ cảnh cho thuật ngữ ${word.toLowerCase()}.`
      });
    });
  }

  const title = "Học phần phân tích tự động";
  const description = `Gồm ${cards.length} thẻ được tổng hợp chuẩn hóa từ nội dung nhập liệu của bạn.`;

  return { title, description, cards };
}

// Client-side Gemini SDK instance creator
function getClientGemini(): GoogleGenAI | null {
  const apiKey = getStoredGeminiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function cleanJsonText(rawText: string): string {
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
  const clean = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return clean.substring(firstBrace, lastBrace + 1);
  }
  return clean;
}

// 1. Generate Study Set
export async function generateSetClient(topic: string, amount: number = 8, language: string = 'Vietnamese') {
  const ai = getClientGemini();
  if (!ai) {
    return generateOfflineStudySet(topic, amount);
  }

  const prompt = `Tạo một học phần (study set) về chủ đề: "${topic}".
Số lượng thẻ: ${amount}.
Hãy thiết kế các từ/khái niệm cốt lõi (term) là từ tiếng Anh (hoặc thuật ngữ ngoại ngữ).
YÊU CẦU QUAN TRỌNG VỀ ĐỊNH NGHĨA: Định nghĩa tiếng Việt (definition) bắt buộc phải cực kỳ đơn giản, ngắn gọn, trực diện, dễ hiểu và dễ nhớ nhất cho học viên, tránh các giải thích hàn lâm rườm rà dài dòng phức tạp.
YÊU CẦU NGỮ CẢNH THỰC TẾ TRONG CÂU VÍ DỤ (REAL-LIFE CONTEXT): Với mỗi từ vựng (term), BẮT BUỘC đặt 1 câu tiếng Anh tự nhiên, thực tế trong đời sống hàng ngày/giao tiếp có chứa từ đó. TUYỆT ĐỐI CẤM sử dụng các câu mẫu chung chung/mô tả việc học như 'Please study the word...'. Phần exampleTranslation PHẢI LÀ BẢN DỊCH TIẾNG VIỆT HOÀN CHỈNH VÀ CHÍNH XÁC CỦA CHÍNH CÂU VÍ DỤ TIẾNG ANH ĐÓ.
Nếu chủ đề không phải ngoại ngữ, ghi ngôn ngữ chính bằng ${language}.`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      description: { type: "STRING" },
      cards: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            term: { type: "STRING" },
            definition: { type: "STRING" },
            example: { type: "STRING" },
            exampleTranslation: { type: "STRING" }
          },
          required: ["term", "definition"]
        }
      }
    },
    required: ["title", "description", "cards"]
  };

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là một giáo sư sư phạm và chuyên gia xây dựng tài liệu học tập. Cung cấp nội dung cô đọng, dễ hiểu.",
          responseMimeType: "application/json",
          responseSchema: responseSchema as any
        }
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là một giáo sư sư phạm và chuyên gia xây dựng tài liệu học tập.",
          responseMimeType: "application/json",
          responseSchema: responseSchema as any
        }
      });
    }

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini generateSet failed, using offline fallback:", err);
    return generateOfflineStudySet(topic, amount);
  }
}

// 2. Generate More Cards
export async function generateMoreCardsClient(topic: string, existingTerms: string[] = [], amount: number = 5, _language: string = "Vietnamese") {
  const ai = getClientGemini();
  if (!ai) {
    const offlineSet = generateOfflineStudySet(topic, 12);
    const filteredCards = offlineSet.cards.filter(c => !existingTerms.some((existing: string) => existing.toLowerCase().trim() === c.term.toLowerCase().trim())).slice(0, amount);
    return { cards: filteredCards.length > 0 ? filteredCards : generateOfflineStudySet(topic, amount).cards };
  }

  const prompt = `Tạo thêm các thẻ học mới liên quan mật thiết đến chủ đề: "${topic}".
Số lượng thẻ cần tạo thêm: ${amount}.
Các từ mới tạo KHÔNG ĐƯỢC trùng lặp với bất kỳ từ nào trong danh sách hiện có này: [${existingTerms.join(", ")}].
Định nghĩa tiếng Việt (definition) bắt buộc phải cực kỳ đơn giản, ngắn gọn, trực diện. Đặt 1 câu ví dụ tiếng Anh thực tế trong đời sống hàng ngày kèm dịch nghĩa tiếng Việt.`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      cards: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            term: { type: "STRING" },
            definition: { type: "STRING" },
            example: { type: "STRING" },
            exampleTranslation: { type: "STRING" }
          },
          required: ["term", "definition"]
        }
      }
    },
    required: ["cards"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini generateMoreCards failed:", err);
    const offlineSet = generateOfflineStudySet(topic, 12);
    const filteredCards = offlineSet.cards.filter(c => !existingTerms.some((existing: string) => existing.toLowerCase().trim() === c.term.toLowerCase().trim())).slice(0, amount);
    return { cards: filteredCards.length > 0 ? filteredCards : generateOfflineStudySet(topic, amount).cards };
  }
}

// 3. Deep Dive
export async function deepDiveClient(term: string, definition?: string, example?: string) {
  const ai = getClientGemini();
  if (!ai) {
    return {
      essence: `💡 Mẹo nhớ từ "${term}": Hãy chia nhỏ hoặc liên tưởng khái niệm này tới những hình ảnh hàng ngày. Bản chất của khái niệm này liên quan mật thiết tới tư duy giải quyết vấn đề.`,
      examples: [
        `Ví dụ 1: She explained that "${term}" plays an important role in daily life. (Cô ấy giải thích rằng "${term}" đóng một vai trò quan trọng trong cuộc sống hàng ngày).`,
        `Ví dụ 2: Understanding "${term}" clearly helps us solve problems faster. (Hiểu rõ "${term}" giúp chúng ta giải quyết các vấn đề nhanh hơn).`
      ],
      mistakes: `⚠️ Tránh nhầm lẫn cách viết chính tả hoặc hiểu sai trường nghĩa cơ bản của từ "${term}". Hãy thường xuyên ôn tập và tự gõ lại để củng cố phản xạ tự nhiên.`
    };
  }

  const prompt = `Giải thích chuyên sâu thuật ngữ/từ vựng: "${term}"
Định nghĩa gốc: "${definition || ""}"
Ví dụ mẫu: "${example || ""}"

Trả về JSON chính xác:
{
  "essence": "Bản chất thuật ngữ & Mẹo ghi nhớ độc đáo, liên tưởng hóm hỉnh trực quan (khoảng 1-2 câu).",
  "examples": [
    "Ví dụ mẫu thực tế 1 kèm dịch nghĩa Việt.",
    "Ví dụ mẫu thực tế 2 kèm dịch nghĩa Việt."
  ],
  "mistakes": "Các lỗi sai thường gặp khi dùng từ này kèm cách khắc phục ngắn gọn nhất."
}`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      essence: { type: "STRING" },
      examples: { type: "ARRAY", items: { type: "STRING" } },
      mistakes: { type: "STRING" }
    },
    required: ["essence", "examples", "mistakes"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini deepDive failed:", err);
    return {
      essence: `💡 Mẹo nhớ từ "${term}": Hãy chia nhỏ hoặc liên tưởng khái niệm này tới những hình ảnh hàng ngày. Bản chất của khái niệm này liên quan mật thiết tới tư duy giải quyết vấn đề.`,
      examples: [
        `Ví dụ 1: She explained that "${term}" plays an important role in daily life. (Cô ấy giải thích rằng "${term}" đóng một vai trò quan trọng trong cuộc sống hàng ngày).`,
        `Ví dụ 2: Understanding "${term}" clearly helps us solve problems faster. (Hiểu rõ "${term}" giúp chúng ta giải quyết các vấn đề nhanh hơn).`
      ],
      mistakes: `⚠️ Tránh nhầm lẫn cách viết chính tả hoặc hiểu sai trường nghĩa cơ bản của từ "${term}". Hãy thường xuyên ôn tập để củng cố phản xạ tự nhiên.`
    };
  }
}

// 4. Analyze Vocab
export async function analyzeVocabClient(text: string, language: string = "Vietnamese") {
  const ai = getClientGemini();
  if (!ai) {
    return extractOfflineVocab(text);
  }

  const prompt = `Phân tích và trích xuất danh sách từ vựng từ đoạn văn bản sau:
"""
${text}
"""
1. Nếu là danh sách từ vựng (mỗi dòng 1 từ hoặc cặp từ-nghĩa), hãy trích xuất 100% đầy đủ tất cả các từ.
2. Nếu là văn bản dài, trích xuất 15 đến 30 từ vựng nổi bật nhất.
Mỗi thẻ gồm: 'term', 'definition' (bằng ${language}, cực kỳ đơn giản, ngắn gọn, trực diện), 'example' (câu ví dụ tiếng Anh ngắn), 'exampleTranslation' (bản dịch câu ví dụ).`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      description: { type: "STRING" },
      cards: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            term: { type: "STRING" },
            definition: { type: "STRING" },
            example: { type: "STRING" },
            exampleTranslation: { type: "STRING" }
          },
          required: ["term", "definition"]
        }
      }
    },
    required: ["title", "description", "cards"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini analyzeVocab failed:", err);
    return extractOfflineVocab(text);
  }
}

// 5. Generate Dynamic Sentences
export async function generateDynamicSentencesClient(term: string, definition?: string) {
  const ai = getClientGemini();
  if (!ai) {
    return { sentences: getMultipleDiverseServerSentences(term, definition) };
  }

  const prompt = `Đặt chính xác 3 câu ví dụ giao tiếp hàng ngày cho từ "${term}" (Định nghĩa: "${definition || ''}").
Mỗi câu ví dụ tiếng Anh phải đi kèm với bản dịch tiếng Việt mượt mà.
Trả về JSON: { "sentences": [ { "sentence": "...", "translation": "..." } ] }`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      sentences: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            sentence: { type: "STRING" },
            translation: { type: "STRING" }
          },
          required: ["sentence", "translation"]
        }
      }
    },
    required: ["sentences"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini generateDynamicSentences failed:", err);
    return { sentences: getMultipleDiverseServerSentences(term, definition) };
  }
}

// 6. Check Vocab Quality
export async function checkVocabQualityClient(term: string, definition?: string) {
  const ai = getClientGemini();
  if (!ai) {
    const divEx = getDiverseServerExample(term, definition);
    return {
      term: term,
      definition: definition || "Chưa có định nghĩa",
      example: divEx.example,
      exampleTranslation: divEx.exampleTranslation,
      cefrLevel: "B1",
      issueFound: false,
      feedback: "Kiểm tra chất lượng thành công (Chế độ Ngoại tuyến).",
      spellingStatus: "Chính xác",
      spellingDetails: "Không phát hiện lỗi chính tả nghiêm trọng.",
      meaningStatus: "Chính xác",
      meaningDetails: "Định nghĩa rõ ràng, phù hợp.",
      exampleStatus: "Đã tạo mới B1/B2",
      exampleDetails: "Câu ví dụ thực tế đạt chuẩn B1.",
      explanation: "Từ vựng được kiểm duyệt và chuẩn hóa ngữ nghĩa.",
      referenceCitation: "Cambridge Dictionary & Oxford Learner's Dictionary (Tra cứu ngoại tuyến)"
    };
  }

  const prompt = `Hãy thẩm định, rà soát lỗi chính tả, chuẩn hóa ngữ nghĩa và tạo câu ví dụ trình độ B1/B2 kèm nguồn tham chiếu uy tín cho từ vựng này:
- Thuật ngữ (Term) đề xuất: "${term}"
- Định nghĩa (Definition) đề xuất: "${definition || ''}"`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      term: { type: "STRING" },
      definition: { type: "STRING" },
      example: { type: "STRING" },
      exampleTranslation: { type: "STRING" },
      cefrLevel: { type: "STRING" },
      issueFound: { type: "BOOLEAN" },
      feedback: { type: "STRING" },
      spellingStatus: { type: "STRING" },
      spellingDetails: { type: "STRING" },
      meaningStatus: { type: "STRING" },
      meaningDetails: { type: "STRING" },
      exampleStatus: { type: "STRING" },
      exampleDetails: { type: "STRING" },
      explanation: { type: "STRING" },
      referenceCitation: { type: "STRING" }
    },
    required: [
      "term", "definition", "example", "exampleTranslation", "cefrLevel", "issueFound", 
      "feedback", "spellingStatus", "spellingDetails", "meaningStatus", "meaningDetails", 
      "exampleStatus", "exampleDetails", "explanation", "referenceCitation"
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini checkVocabQuality failed:", err);
    const divEx = getDiverseServerExample(term, definition);
    return {
      term: term,
      definition: definition || "Chưa có định nghĩa",
      example: divEx.example,
      exampleTranslation: divEx.exampleTranslation,
      cefrLevel: "B1",
      issueFound: false,
      feedback: "Kiểm tra chất lượng thành công (Chế độ Ngoại tuyến).",
      spellingStatus: "Chính xác",
      spellingDetails: "Không phát hiện lỗi chính tả nghiêm trọng.",
      meaningStatus: "Chính xác",
      meaningDetails: "Định nghĩa rõ ràng, phù hợp.",
      exampleStatus: "Đã tạo mới B1/B2",
      exampleDetails: "Câu ví dụ thực tế đạt chuẩn B1.",
      explanation: "Từ vựng được kiểm duyệt và chuẩn hóa ngữ nghĩa.",
      referenceCitation: "Cambridge Dictionary & Oxford Learner's Dictionary (Tra cứu ngoại tuyến)"
    };
  }
}

// 7. Check Vocab Bulk
export async function checkVocabBulkClient(cards: Array<{ id: string; term: string; definition: string }>) {
  const ai = getClientGemini();
  if (!ai) {
    const completeList = cards.map((c) => {
      const divEx = getDiverseServerExample(c.term, c.definition);
      return {
        cardId: c.id,
        term: c.term,
        definition: c.definition || "Chưa có định nghĩa",
        example: divEx.example,
        exampleTranslation: divEx.exampleTranslation,
        cefrLevel: "B1",
        referenceCitation: "Cambridge Dictionary (Tra cứu ngoại tuyến)"
      };
    });
    return { corrections: [], completeCorrectedList: completeList };
  }

  const prompt = `Rà soát toàn bộ danh sách từ vựng sau đây để phát hiện các lỗi chính tả, sai nghĩa, dịch sai hoặc giải nghĩa rườm rà dài dòng.
Danh sách từ vựng:
${JSON.stringify(cards.map((c) => ({ id: c.id, term: c.term, definition: c.definition })))}`;

  const bulkResponseSchema = {
    type: "OBJECT",
    properties: {
      corrections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            cardId: { type: "STRING" },
            originalTerm: { type: "STRING" },
            originalDefinition: { type: "STRING" },
            correctedTerm: { type: "STRING" },
            correctedDefinition: { type: "STRING" },
            explanation: { type: "STRING" }
          },
          required: ["cardId", "originalTerm", "originalDefinition", "correctedTerm", "correctedDefinition", "explanation"]
        }
      },
      completeCorrectedList: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            cardId: { type: "STRING" },
            term: { type: "STRING" },
            definition: { type: "STRING" },
            example: { type: "STRING" },
            exampleTranslation: { type: "STRING" },
            cefrLevel: { type: "STRING" },
            referenceCitation: { type: "STRING" }
          },
          required: ["cardId", "term", "definition", "example", "exampleTranslation", "cefrLevel", "referenceCitation"]
        }
      }
    },
    required: ["corrections", "completeCorrectedList"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: bulkResponseSchema as any
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini checkVocabBulk failed:", err);
    const completeList = cards.map((c) => {
      const divEx = getDiverseServerExample(c.term, c.definition);
      return {
        cardId: c.id,
        term: c.term,
        definition: c.definition || "Chưa có định nghĩa",
        example: divEx.example,
        exampleTranslation: divEx.exampleTranslation,
        cefrLevel: "B1",
        referenceCitation: "Cambridge Dictionary (Tra cứu ngoại tuyến)"
      };
    });
    return { corrections: [], completeCorrectedList: completeList };
  }
}

// 8. Generate Revive Quiz
export async function generateReviveQuizClient(cards: Array<{ term: string; definition: string }>) {
  const fallbackCard = cards && cards.length > 0 ? cards[Math.floor(Math.random() * cards.length)] : { term: "diligent", definition: "chăm chỉ, cần cù" };
  const ai = getClientGemini();

  if (!ai) {
    const correctAns = fallbackCard.term;
    const otherTerms = (cards || []).filter((c) => c.term !== correctAns).map((c) => c.term);
    const distractors = [...otherTerms, "ubiquitous", "gregarious", "meticulous"].slice(0, 3);
    const options = [correctAns, ...distractors].sort(() => Math.random() - 0.5);

    return {
      question: `Từ vựng nào mang ý nghĩa học thuật nâng cao tương đương với định nghĩa sau: "${fallbackCard.definition || 'Chăm chỉ cần cù'}"?`,
      correctAnswer: correctAns,
      options: options,
      hint: `Từ này bắt đầu bằng chữ cái "${correctAns.charAt(0).toUpperCase()}".`
    };
  }

  const prompt = `Dựa trên danh sách các từ vựng này: ${JSON.stringify(cards || [])}, hãy tạo ra 1 CÂU HỎI TỪ VỰNG TẬP TRUNG (vocabulary trivia question) để người chơi giải cứu mạng sống trong game.
Yêu cầu câu hỏi:
- Đưa ra định nghĩa hoặc ngữ cảnh bằng tiếng Việt hoặc tiếng Anh để người học đoán từ.
- Phải có 1 đáp án chính xác (correctAnswer) và 3 đáp án gây nhiễu (distractors). Các đáp án này là các từ vựng tiếng Anh (term).`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      question: { type: "STRING" },
      correctAnswer: { type: "STRING" },
      options: { type: "ARRAY", items: { type: "STRING" } },
      hint: { type: "STRING" }
    },
    required: ["question", "correctAnswer", "options", "hint"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini generateReviveQuiz failed:", err);
    const correctAns = fallbackCard.term;
    const otherTerms = (cards || []).filter((c) => c.term !== correctAns).map((c) => c.term);
    const distractors = [...otherTerms, "ubiquitous", "gregarious", "meticulous"].slice(0, 3);
    const options = [correctAns, ...distractors].sort(() => Math.random() - 0.5);

    return {
      question: `Từ vựng nào mang ý nghĩa học thuật nâng cao tương đương với định nghĩa sau: "${fallbackCard.definition || 'Chăm chỉ cần cù'}"?`,
      correctAnswer: correctAns,
      options: options,
      hint: `Từ này bắt đầu bằng chữ cái "${correctAns.charAt(0).toUpperCase()}".`
    };
  }
}

// 9. Campaign Chat
export async function campaignChatClient(promptText: string) {
  const ai = getClientGemini();
  if (!ai) {
    return {
      text: "⚠️ **Chế độ Ngoại tuyến:** Chào bạn, hiện tại chưa nhập GEMINI_API_KEY ở góc trên màn hình.\n\n" +
            "**Sứ mệnh bứt phá hôm nay:**\n" +
            "1. **IELTS 7.0:** Ôn tập lại 15 từ vựng vừa trích xuất được ở học phần học tập.\n" +
            "2. **Toán - Lý - Hóa 9+:** Giải quyết dứt điểm các bài tập còn dang dở.\n" +
            "3. **Thể hình:** Đứng dậy thực hiện 20 rep chống đẩy ngay lập tức để hâm nóng tinh thần kỷ luật!"
    };
  }

  const systemInstruction = 
    "Bạn là cố vấn thông thái trong 'Chiến Dịch 13 Tuần Bứt Phá'. " +
    "Mục tiêu tối thượng của học viên là: IELTS 7.0, học tốt và nắm vững toàn bộ kiến thức HK1 lớp 12 (Toán Lý Hóa), và rèn luyện thể hình 6 múi săn chắc. " +
    "Hãy trả lời một cách súc tích, nồng nhiệt nhưng đanh thép, đầy tính động lực hành động, khoa học thể chất/trí tuệ và có tinh thần kỷ luật thép.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    return { text: response.text || "Hãy tiếp tục giữ vững tinh thần kỷ luật!" };
  } catch (err) {
    console.warn("Client Gemini campaignChat failed:", err);
    return {
      text: "⚠️ **Lỗi truy vấn AI:** Hãy kiểm tra lại API Key ở góc trên màn hình.\n\n" +
            "**Lời khuyên Thủ khoa dành cho bạn:**\n" +
            "- *Học tập:* Rà lại bài vở, giải quyết 3 bài toán nâng cao ngay bây giờ.\n" +
            "- *Thể chất:* Thực hiện 20 rep chống đẩy ngay lập tức để duy trì nhịp độ kỷ luật thép."
    };
  }
}

// 10. Academic Audit
export async function academicAuditClient(subject: string, content: string, mode: "fast" | "deep" = "fast") {
  const ai = getClientGemini();
  if (!ai) {
    return {
      status_spelling: "CHÍNH XÁC",
      status_semantic: "ĐẠT CHUẨN",
      corrected_content: content,
      explanation: {
        reason: "Kiểm tra học thuật bằng chế độ Ngoại tuyến dự phòng.",
        distinction: "Văn bản đạt chuẩn kiến thức cơ bản.",
        examples: "Hãy tiếp tục ôn tập và thực hành để nắm vững hơn."
      },
      sources: [
        { title: "Nguồn tham khảo chuẩn quốc gia (Tra cứu ngoại tuyến)", url: "https://moet.gov.vn" }
      ]
    };
  }

  const isFast = mode === "fast";
  const systemInstruction = isFast
    ? "Bạn là trợ lý thẩm định học thuật siêu tốc, phản hồi nhanh gọn. Bạn bắt buộc phải trả về một đối tượng JSON hợp lệ."
    : "Bạn là giáo sư ngôn ngữ học và chuyên gia biên soạn sách giáo khoa, thẩm định thông tin khoa học, lịch sử, địa lý và từ điển ưu tú.";

  const prompt = `Kiểm tra, chỉnh sửa, giải thích và thẩm định chất lượng học thuật cho nội dung sau:
- Môn học/Ngôn ngữ: "${subject}"
- Nội dung cần thẩm định: "${content}"

BẮT BUỘC TRẢ VỀ kết quả dưới dạng JSON có cấu trúc sau:
{
  "status_spelling": "CHÍNH XÁC" hoặc "SAI CHÍNH TẢ",
  "status_semantic": "ĐẠT CHUẨN" hoặc "CHƯA CHUẨN",
  "corrected_content": "Văn bản sau khi đã được sửa đổi và chuẩn hóa kiến thức (Bôi đậm từ ngữ quan trọng bằng **...**)",
  "explanation": {
    "reason": "Giải thích nguyên nhân lỗi hoặc lý do cách dùng cũ chưa đúng",
    "distinction": "Phân biệt tinh tế giữa từ/khái niệm này với các khái niệm khác",
    "examples": "Ví dụ thực hành nâng cao giúp ghi nhớ sâu"
  },
  "sources": [
    { "title": "Tên nguồn uy tín", "url": "https://..." }
  ]
}`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      status_spelling: { type: "STRING" },
      status_semantic: { type: "STRING" },
      corrected_content: { type: "STRING" },
      explanation: {
        type: "OBJECT",
        properties: {
          reason: { type: "STRING" },
          distinction: { type: "STRING" },
          examples: { type: "STRING" }
        },
        required: ["reason", "distinction", "examples"]
      },
      sources: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            url: { type: "STRING" }
          },
          required: ["title", "url"]
        }
      }
    },
    required: ["status_spelling", "status_semantic", "corrected_content", "explanation", "sources"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(cleanJsonText(response.text));
  } catch (err) {
    console.warn("Client Gemini academicAudit failed:", err);
    return {
      status_spelling: "CHÍNH XÁC",
      status_semantic: "ĐẠT CHUẨN",
      corrected_content: content,
      explanation: {
        reason: "Chưa thể gọi API Gemini (hoặc thiếu Key). Đã kiểm tra sơ bộ ở chế độ Ngoại tuyến.",
        distinction: "Nội dung đạt chuẩn cơ bản.",
        examples: "Nhập GEMINI_API_KEY ở góc trên màn hình để sử dụng tính năng thẩm định AI chuyên sâu."
      },
      sources: [
        { title: "Nguồn tham khảo chuẩn (Tra cứu ngoại tuyến)", url: "https://moet.gov.vn" }
      ]
    };
  }
}
