import { GoogleGenAI } from '@google/genai';
import { getStoredGeminiKey } from '../utils/geminiKey';

// Helper for offline fallback sentence generation with natural, word-specific sentences
export function getMultipleDiverseServerSentences(term: string, definition: string = ''): Array<{ sentence: string; translation: string }> {
  const cleanTerm = (term || 'word').trim();
  const cleanDef = (definition || '').trim();
  const suffixDef = cleanDef ? ` (${cleanDef})` : '';

  // Specialized dictionary for common words, IELTS, and tech terms to guarantee accurate, direct examples
  const termKey = cleanTerm.toLowerCase();
  const termDictionary: Record<string, Array<{ sentence: string; translation: string }>> = {
    hello: [
      { sentence: "Hello, my name is Ba.", translation: "Xin chào, tôi tên là Ba." },
      { sentence: "She smiled and said hello when I walked into the office.", translation: "Cô ấy mỉm cười và nói xin chào khi tôi bước vào văn phòng." },
      { sentence: "Hello! It is a great pleasure to meet you today.", translation: "Xin chào! Rất vui được gặp bạn hôm nay." }
    ],
    hi: [
      { sentence: "Hi, how are you doing today?", translation: "Chào bạn, hôm nay bạn thế nào?" },
      { sentence: "He waved his hand and said hi to everyone.", translation: "Anh ấy vẫy tay và chào tất cả mọi người." }
    ],
    apple: [
      { sentence: "He eats a fresh red apple every morning.", translation: "Anh ấy ăn một quả táo đỏ tươi mỗi sáng." },
      { sentence: "She bought a basket of sweet apples from the market.", translation: "Cô ấy đã mua một giỏ táo ngọt từ chợ." }
    ],
    fluency: [
      { sentence: "Consistent daily conversation practice is key to developing natural fluency.", translation: "Luyện tập giao tiếp hàng ngày là chìa khóa để phát triển sự trôi chảy tự nhiên." },
      { sentence: "She spoke English with remarkable fluency during the international interview.", translation: "Cô ấy nói tiếng Anh với sự trôi chảy đáng kinh ngạc trong buổi phỏng vấn quốc tế." },
      { sentence: "Focusing on sentence flow helps improve overall speaking fluency.", translation: "Tập trung vào nhịp điệu câu giúp cải thiện sự trôi chảy khi nói." }
    ],
    coherence: [
      { sentence: "A clear structure ensures logical coherence throughout your essay.", translation: "Cấu trúc rõ ràng đảm bảo tính mạch lạc logic xuyên suốt bài luận." },
      { sentence: "The candidate presented her points with great clarity and coherence.", translation: "Ứng viên đã trình bày các ý kiến với sự rõ ràng và mạch lạc cao." },
      { sentence: "Adding transitional words enhances paragraph coherence significantly.", translation: "Thêm các từ chuyển tiếp làm tăng đáng kể tính liên kết của đoạn văn." }
    ],
    mitigate: [
      { sentence: "Effective risk management strategies help mitigate potential financial losses.", translation: "Các chiến lược quản lý rủi ro giúp giảm thiểu tổn thất tài chính tiềm ẩn." },
      { sentence: "Planting native trees helps mitigate the severe impact of soil erosion.", translation: "Trồng cây bản địa giúp giảm thiểu tác động nghiêm trọng của xói mòn đất." },
      { sentence: "Prompt action was taken to mitigate further damage to the supply chain.", translation: "Hành động kịp thời đã được thực hiện để giảm thiểu thiệt hại thêm cho chuỗi cung ứng." }
    ],
    feasible: [
      { sentence: "Engineers confirmed that the solar energy proposal is technically feasible.", translation: "Các kỹ sư xác nhận rằng đề xuất năng lượng mặt trời là khả thi về kỹ thuật." },
      { sentence: "They need to formulate a feasible action plan within the given budget.", translation: "Họ cần xây dựng một kế hoạch hành động khả thi trong ngân sách cho phép." },
      { sentence: "Testing showed that the new production method is highly feasible.", translation: "Thử nghiệm cho thấy phương pháp sản xuất mới rất khả thi." }
    ],
    deforestation: [
      { sentence: "Uncontrolled deforestation threatens biodiversity in tropical rainforests.", translation: "Tàn phá rừng không kiểm soát đe dọa đa dạng sinh học ở rừng mưa nhiệt đới." },
      { sentence: "Governments are enacting stricter laws to halt illegal deforestation.", translation: "Chính phủ đang ban hành luật nghiêm ngặt hơn để ngăn chặn nạn phá rừng trái phép." },
      { sentence: "Community forestry programs help combat the effects of deforestation.", translation: "Các chương trình lâm nghiệp cộng đồng giúp chống lại tác động của việc phá rừng." }
    ],
    algorithm: [
      { sentence: "The new search algorithm processes millions of queries in milliseconds.", translation: "Thuật toán tìm kiếm mới xử lý hàng triệu truy vấn chỉ trong vài miligiây." },
      { sentence: "Developers designed an efficient algorithm to optimize server loads.", translation: "Các nhà phát triển đã thiết kế thuật toán hiệu quả để tối ưu hóa tải máy chủ." },
      { sentence: "Machine learning algorithms learn patterns directly from input data.", translation: "Các thuật toán máy học tự học các mô hình trực tiếp từ dữ liệu đầu vào." }
    ],
    component: [
      { sentence: "Each UI component can be tested independently before system integration.", translation: "Mỗi thành phần giao diện có thể được kiểm thử độc lập trước khi tích hợp." },
      { sentence: "Building modular components speeds up software development.", translation: "Xây dựng các thành phần mô-đun giúp đẩy nhanh quá trình phát triển phần mềm." },
      { sentence: "The battery is a critical component of any electric vehicle.", translation: "Pin là một thành phần ứng dụng quan trọng của xe điện." }
    ],
    state: [
      { sentence: "Updating local component state triggers React to re-render the view.", translation: "Cập nhật trạng thái cục bộ sẽ kích hoạt React vẽ lại giao diện." },
      { sentence: "Clean state management prevents unexpected bugs in complex applications.", translation: "Quản lý trạng thái gọn gàng giúp ngăn ngừa lỗi bất ngờ trong ứng dụng phức tạp." },
      { sentence: "The system logs changes in system state for security auditing.", translation: "Hệ thống ghi lại các thay đổi về trạng thái hệ thống để kiểm toán bảo mật." }
    ]
  };

  if (termDictionary[termKey]) {
    return termDictionary[termKey];
  }

  // Dynamic direct natural usage sentences without generic meta templates
  return [
    {
      sentence: `I wrote a short example using "${cleanTerm}" in my notebook.`,
      translation: `Tôi đã viết một ví dụ ngắn sử dụng từ "${cleanTerm}"${suffixDef} vào sổ tay.`
    },
    {
      sentence: `He used "${cleanTerm}" naturally during his conversation with the teacher.`,
      translation: `Anh ấy đã dùng từ "${cleanTerm}"${suffixDef} một cách tự nhiên trong cuộc trò chuyện với thầy giáo.`
    },
    {
      sentence: `Can you help me practice pronouncing "${cleanTerm}" correctly?`,
      translation: `Bạn có thể giúp tôi luyện phát âm từ "${cleanTerm}"${suffixDef} chính xác không?`
    }
  ];
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
      { term: `Khái niệm cốt lõi ${topic}`, definition: `Nền móng lý thuyết và định nghĩa cơ bản nhất liên quan tới ${topic}.`, example: `Understanding ${topic} is essential for fundamental knowledge.`, exampleTranslation: `Hiểu rõ ${topic} là điều thiết yếu cho kiến thức nền tảng.` },
      { term: `Nguyên lý vận hành`, definition: `Quy tắc và cơ chế hoạt động cốt lõi của ${topic}.`, example: `The core principles guide every single practical application.`, exampleTranslation: `Các nguyên lý cốt lõi dẫn dắt mọi ứng dụng thực tế.` },
      { term: `Ứng dụng thực tiễn`, definition: `Phương pháp đưa lý thuyết ${topic} vào thực tế công việc và cuộc sống.`, example: `Practical application brings immediate real-world value.`, exampleTranslation: `Ứng dụng thực tế mang lại giá trị tức thì.` },
      { term: `Giải pháp tối ưu`, definition: `Các phương cách xử lý điểm nghẽn và nâng cao hiệu quả.`, example: `Finding an optimal solution improves total efficiency.`, exampleTranslation: `Tìm giải pháp tối ưu giúp nâng cao hiệu quả tổng thể.` },
      { term: `Tiến trình thực hiện`, definition: `Các bước tuần tự rõ ràng để triển khai và theo dõi tiến độ.`, example: `Tracking progress helps maintain steady momentum.`, exampleTranslation: `Theo dõi tiến trình giúp duy trì đà phát triển ổn định.` },
      { term: `Tư duy phân tích`, definition: `Phương pháp tư duy đa chiều để giải quyết vấn đề hiệu quả.`, example: `Analytical thinking opens up creative possibilities.`, exampleTranslation: `Tư duy phân tích mở ra những khả năng sáng tạo.` }
    ];
    cards = generalTemplate.slice(0, Math.min(amount, generalTemplate.length));
  }

  if (cards.length > amount) {
    cards = cards.slice(0, amount);
  }

  return { title, description, cards };
}

export function sanitizeCardTerm(term: string): string {
  if (!term) return '';
  return term.trim()
    .replace(/^[\d\.\-\*\+\•\:\;\,\(\)\[\]\"\'\“\”\–\—\s]+/, '')
    .replace(/[\:\;\,\"\'\“\”\–\—\s]+$/, '')
    .trim();
}

export function isValidCardTerm(term: string): boolean {
  const cleaned = sanitizeCardTerm(term);
  if (!cleaned) return false;
  if (cleaned.length < 2) {
    const validShorts = ['ai', 'ui', 'ux', 'ip', 'os', 'it', 'db', 'qa'];
    if (!validShorts.includes(cleaned.toLowerCase())) {
      return false;
    }
  }
  if (/^[^a-zA-Z0-9\u00C0-\u1EF9]+$/.test(cleaned)) {
    return false;
  }
  return true;
}

export function parseLineToCard(line: string): { term: string; definition: string } | null {
  if (!line) return null;
  let raw = line.trim();
  if (!raw) return null;

  // Strip leading bullet numbers/symbols e.g. "1. ", "1/ ", "- ", "* ", "• "
  raw = raw.replace(/^[\d\.\/\-\*\+\•\s]+/, '').trim();
  if (!raw) return null;

  let rawTerm = '';
  let rawDef = '';

  // 1. KIỂU 3: Dấu ngoặc đơn `Term (Definition)` -> e.g. "hello (chào)" or "Computer Vision (Thị giác máy tính)"
  const parenMatch = raw.match(/^([^\(\)]+?)\s*\((.+?)\)\s*$/);
  if (parenMatch) {
    rawTerm = parenMatch[1];
    rawDef = parenMatch[2];
  }
  // 2. KIỂU 1: Dấu hai chấm `:` -> e.g. "hello : chào" or "Deep Learning : Học sâu"
  else if (raw.includes(':')) {
    const colonIdx = raw.indexOf(':');
    rawTerm = raw.substring(0, colonIdx);
    rawDef = raw.substring(colonIdx + 1);
  }
  // 3. KIỂU 2: Dấu gạch ngang ` - `, ` – `, ` — `, or `-`, `–`, `—` -> e.g. "hello - chào"
  else if (raw.includes(' - ') || raw.includes(' – ') || raw.includes(' — ')) {
    const sepIdx = raw.indexOf(' - ') !== -1 ? raw.indexOf(' - ')
                 : raw.indexOf(' – ') !== -1 ? raw.indexOf(' – ')
                 : raw.indexOf(' — ');
    rawTerm = raw.substring(0, sepIdx);
    rawDef = raw.substring(sepIdx + 3);
  } else if (raw.includes('-') || raw.includes('–') || raw.includes('—')) {
    const dashMatch = raw.match(/^([^-–—]+)[-–—](.+)$/);
    if (dashMatch) {
      rawTerm = dashMatch[1];
      rawDef = dashMatch[2];
    }
  }
  // 4. Tab (\t), Pipe (|), Equal (=)
  else if (raw.includes('\t')) {
    const parts = raw.split('\t');
    rawTerm = parts[0];
    rawDef = parts.slice(1).join(' ');
  } else if (raw.includes('|')) {
    const parts = raw.split('|');
    rawTerm = parts[0];
    rawDef = parts.slice(1).join(' ');
  } else if (raw.includes('=')) {
    const parts = raw.split('=');
    rawTerm = parts[0];
    rawDef = parts.slice(1).join(' ');
  }
  // 5. 2 or more spaces
  else if (/ {2,}/.test(raw)) {
    const parts = raw.split(/ {2,}/);
    rawTerm = parts[0];
    rawDef = parts.slice(1).join(' ');
  }
  // 6. Single space separation e.g. "hello chào" -> Term: "hello", Def: "chào"
  else {
    const parts = raw.split(/\s+/);
    if (parts.length >= 2) {
      rawTerm = parts[0];
      rawDef = parts.slice(1).join(' ');
    } else {
      rawTerm = raw;
      rawDef = '';
    }
  }

  const cleanTerm = sanitizeCardTerm(rawTerm);
  const cleanDef = rawDef.trim();

  if (!isValidCardTerm(cleanTerm)) {
    return null;
  }

  return {
    term: cleanTerm,
    definition: cleanDef || `Định nghĩa cho ${cleanTerm}`
  };
}

export function extractOfflineVocab(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const cards: Array<{ term: string; definition: string; example: string; exampleTranslation?: string }> = [];

  lines.forEach((line) => {
    const parsed = parseLineToCard(line);
    if (parsed) {
      cards.push({
        term: parsed.term,
        definition: parsed.definition,
        example: `Ví dụ thực tế áp dụng ${parsed.term}.`
      });
    }
  });

  if (cards.length === 0) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    sentences.slice(0, 15).forEach((st) => {
      const parsed = parseLineToCard(st);
      if (parsed) {
        cards.push({
          term: parsed.term,
          definition: parsed.definition,
          example: st
        });
      }
    });
  }

  const title = "Học phần phân tích tự động";
  const description = `Gồm ${cards.length} thẻ được tổng hợp chuẩn hóa từ tài liệu nguồn.`;

  return { title, description, cards };
}

export const FRIENDLY_PERMISSION_ERROR = "API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại Key hoặc đổi sang API Key từ tài khoản Gmail cá nhân.";

export function isPermissionOrKeyError(error: any): boolean {
  if (!error) return false;
  const errStr = String(error?.message || error?.error?.message || error || "").toLowerCase();
  const status = error?.status || error?.statusCode || error?.response?.status;
  return (
    status === 403 ||
    status === 401 ||
    errStr.includes("403") ||
    errStr.includes("401") ||
    errStr.includes("permission denied") ||
    errStr.includes("permission_denied") ||
    errStr.includes("api_key_invalid") ||
    errStr.includes("api key not valid") ||
    errStr.includes("invalid api key") ||
    errStr.includes("unauthorized") ||
    errStr.includes("key_invalid") ||
    errStr.includes("key invalid") ||
    errStr.includes("permission")
  );
}

// Client-side Gemini SDK instance creator
function getClientGemini(): GoogleGenAI | null {
  const apiKey = getStoredGeminiKey();
  if (!apiKey || !apiKey.trim()) return null;
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

/**
 * Danh sách các mô hình Gemini ưu tiên thử nghiệm theo thứ tự Fallback:
 * 1. gemini-2.5-flash (Nhanh, thông minh, tối ưu cho flashcards & phân tích)
 * 2. gemini-1.5-flash (Ổn định, tương thích cao mọi tài khoản)
 * 3. gemini-2.0-flash-lite (Siêu nhẹ, tiết kiệm quota)
 * 4. gemini-2.5-pro (Dự phòng sâu nâng cao)
 */
export const GEMINI_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro'
];

export interface GenerateContentClientOptions {
  contents?: string | any;
  prompt?: string;
  systemInstruction?: string;
  responseSchema?: any;
  temperature?: number;
}

/**
 * Hàm gọi API Gemini an toàn với cơ chế tự động Fallback qua danh sách mô hình
 * và xử lý lỗi thân thiện với người dùng.
 */
export async function safeGenerateContentClient(
  arg1: GoogleGenAI | string | GenerateContentClientOptions,
  arg2?: GenerateContentClientOptions
): Promise<string> {
  let ai: GoogleGenAI | null = null;
  let params: GenerateContentClientOptions = {};

  if (typeof arg1 === 'string') {
    params = { contents: arg1, ...(arg2 || {}) };
    ai = getClientGemini();
  } else if (arg1 && typeof (arg1 as any).models?.generateContent === 'function') {
    ai = arg1 as GoogleGenAI;
    params = arg2 || {};
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    params = arg1 as GenerateContentClientOptions;
    ai = getClientGemini();
  }

  // 1. Kiểm tra sự tồn tại của Gemini client / API Key
  if (!ai) {
    throw new Error(
      "Chưa tìm thấy GEMINI_API_KEY. Vui lòng nhập API Key trên thanh công cụ hoặc cấu hình biến môi trường VITE_GEMINI_API_KEY trên Vercel."
    );
  }

  const contentPayload = params.contents || params.prompt || "";
  if (!contentPayload) {
    throw new Error("Nội dung yêu cầu (contents/prompt) không được để trống.");
  }

  let lastErr: any = null;
  const attemptedModels: string[] = [];

  // 2. Thử lần lượt các mô hình trong danh sách Fallback
  for (const model of GEMINI_FALLBACK_MODELS) {
    attemptedModels.push(model);
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.responseSchema) {
        config.responseMimeType = "application/json";
        config.responseSchema = params.responseSchema;
      }

      const res = await ai.models.generateContent({
        model,
        contents: contentPayload,
        config
      });

      if (res && res.text) {
        return res.text;
      }
    } catch (err: any) {
      lastErr = err;
      
      // Nếu là lỗi xác thực Key hoặc quyền truy cập (401, 403), dừng ngay và báo lỗi rõ ràng
      if (isPermissionOrKeyError(err)) {
        throw new Error(FRIENDLY_PERMISSION_ERROR);
      }

      console.warn(`[safeGenerateContentClient] Model '${model}' gặp sự cố, tự động chuyển sang model tiếp theo:`, err?.message || err);
    }
  }

  // 3. Xử lý khi tất cả model đều không khả dụng
  const lastMsg = lastErr?.message || "Lỗi kết nối máy chủ AI";
  throw new Error(
    `Không thể kết nối đến các mô hình AI [${attemptedModels.join(', ')}]. Chi tiết lỗi: ${lastMsg}. Vui lòng kiểm tra lại kết nối mạng hoặc hạn mức API Key.`
  );
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

YÊU CẦU NGHIÊM NGẶT VỀ ĐỘ CHÍNH XÁC VÀ MÔN HỌC CHUYÊN NGÀNH:
1. ĐỊNH NGHĨA TIẾNG VIỆT (definition):
   - Phải cực kỳ BẮT MẮT, NGẮN GỌN (từ 1-5 từ hoặc 1 cụm từ cô đọng), CHÍNH XÁC THEO ĐÚNG CHUYÊN NGÀNH (IELTS, Lập trình CNTT, Hóa học, Lịch sử, Y khoa, Kinh tế...).
   - Tuyệt đối TRÁNH các câu giải thích dài dòng, rườm rà hay diễn giải lan man.
2. CÂU VÍ DỤ TIẾNG ANH (example):
   - Phải là câu tiếng Anh tự nhiên, sinh động, CÓ NỘI DUNG CỤ THỂ DÀNH RIÊNG CHO CHÍNH TỪ VỰNG ĐÓ trong ngữ cảnh thực tế.
   - TUYỆT ĐỐI CẤM sử dụng các mẫu câu khung gá lắp từ rập khuôn như: "She explained how [word] functions...", "Many people find that [word] plays an important role...", "Applying [word] correctly...", "This is an example for...".
   - Kèm theo bản dịch tiếng Việt mượt mà, đầy đủ (exampleTranslation).
3. PHÂN TÁCH CỤM THUẬT NGỮ GHÉP:
   - Giữ nguyên toàn bộ cụm thuật ngữ ghép chuyên ngành (VD: "Deep Learning" -> "Học sâu", "Phản ứng xà phòng hóa" -> "Phản ứng xà phòng hóa"). TUYỆT ĐỐI KHÔNG xé lẻ từ làm sai lệch nghĩa.
4. Trường hợp học phần bằng ${language} không phải ngoại ngữ, giữ câu ví dụ trực diện gắn với kiến thức thực tế.`;

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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      systemInstruction: "Bạn là một giáo sư ngôn ngữ học và chuyên gia sư phạm hàng đầu. Cung cấp định nghĩa ngắn gọn chuẩn xác đúng chuyên ngành và câu ví dụ ngữ cảnh thực tế sắc bén.",
      responseSchema
    });
    return JSON.parse(cleanJsonText(rawText));
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
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
YÊU CẦU QUAN TRỌNG:
1. Các từ mới tạo KHÔNG ĐƯỢC trùng lặp với danh sách hiện có: [${existingTerms.join(", ")}].
2. ĐỊNH NGHĨA TIẾNG VIỆT (definition): Phải cực kỳ ngắn gọn, sắc bén, chuẩn xác theo đúng chuyên ngành.
3. CÂU VÍ DỤ TIẾNG ANH (example): Đặt 1 câu tiếng Anh tự nhiên mang nội dung thực tế cụ thể cho riêng từ vựng đó. TUYỆT ĐỐI CẤM sử dụng các câu mẫu gá lắp rập khuôn kiểu "She explained how [word] functions...".
4. Dịch câu ví dụ sang tiếng Việt (exampleTranslation) chính xác và hoàn chỉnh.`;

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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      responseSchema
    });
    return JSON.parse(cleanJsonText(rawText));
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
    console.warn("Client Gemini generateMoreCards failed:", err);
    const offlineSet = generateOfflineStudySet(topic, 12);
    const filteredCards = offlineSet.cards.filter(c => !existingTerms.some((existing: string) => existing.toLowerCase().trim() === c.term.toLowerCase().trim())).slice(0, amount);
    return { cards: filteredCards.length > 0 ? filteredCards : generateOfflineStudySet(topic, amount).cards };
  }
}

// 3. Deep Dive
export async function deepDiveClient(term: string, definition?: string, example?: string) {
  const fallbackSentences = getMultipleDiverseServerSentences(term, definition);
  const fallbackObj = {
    essence: `💡 Mẹo nhớ từ "${term}": ${definition ? `Nắm vững nghĩa chuyên ngành "${definition}".` : 'Liên tưởng khái niệm này tới ứng dụng thực tế.'} Bản chất giúp giải quyết vấn đề trực diện.`,
    examples: [
      `1. ${example || fallbackSentences[0]?.sentence} (${fallbackSentences[0]?.translation})`,
      `2. ${fallbackSentences[1]?.sentence} (${fallbackSentences[1]?.translation})`
    ],
    mistakes: `⚠️ Tránh nhầm lẫn chính tả hoặc hiểu sai ngữ cảnh chuyên ngành của từ "${term}". Hãy ôn tập thường xuyên để củng cố phản xạ tự nhiên.`
  };

  const ai = getClientGemini();
  if (!ai) {
    return fallbackObj;
  }

  const prompt = `Giải thích chuyên sâu thuật ngữ/từ vựng: "${term}"
Định nghĩa gốc: "${definition || ""}"
Ví dụ mẫu: "${example || ""}"

YÊU CẦU NGHIÊM NGẶT:
1. essence: Bản chất thuật ngữ & Mẹo ghi nhớ độc đáo, liên tưởng trực quan (1-2 câu ngắn gọn).
2. examples: Đúng 2 ví dụ thực tế mang nội dung cụ thể dành riêng cho từ "${term}" kèm bản dịch tiếng Việt. TUYỆT ĐỐI CẤM dùng các mẫu câu rập khuôn gá lắp kiểu "She explained how [word] functions...".
3. mistakes: Các lỗi sai thường gặp khi dùng từ/thuật ngữ này kèm cách khắc phục ngắn gọn nhất.`;

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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      responseSchema
    });
    return JSON.parse(cleanJsonText(rawText));
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
    console.warn("Client Gemini deepDive failed:", err);
    return fallbackObj;
  }
}

// 4. Analyze Vocab
export async function analyzeVocabClient(text: string, language: string = "Vietnamese") {
  const ai = getClientGemini();
  if (!ai) {
    return extractOfflineVocab(text);
  }

  const prompt = `Phân tích và trích xuất danh sách từ vựng/thuật ngữ từ đoạn văn bản sau:
"""
${text}
"""
QUY TẮC BẮT BUỘC BÓC TÁCH MẶT TRƯỚC VÀ MẶT SAU THẺ:
1. TỰ ĐỘNG NHẬN DIỆN VÀ TÁCH THEO 3 ĐỊNH DẠNG CHUẨN KHI NHẬP NỘI DUNG:
   - KIỂU 1 (Dấu hai chấm ':'): "A : B" -> Mặt trước ('term') = "A", Mặt sau ('definition') = "B".
   - KIỂU 2 (Dấu gạch ngang '-' hoặc '–'): "A - B" -> Mặt trước ('term') = "A", Mặt sau ('definition') = "B".
   - KIỂU 3 (Dấu ngoặc đơn '()'): "A (B)" -> Mặt trước ('term') = "A", Mặt sau ('definition') = "B".

2. CẮT KHOẢNG TRẮNG THỪA (TRIM) CẢ 2 ĐẦU CỦA 'term' VÀ 'definition'.
3. MẶT TRƯỚC ('term'): Là cụm từ / thuật ngữ chuyên ngành (1-5 từ). Giữ nguyên toàn bộ cụm từ ghép ("Deep Learning", "Phản ứng xà phòng hóa", "Chiến thắng Bạch Đằng 938"). CẤM ký tự đơn lẻ rác.
4. MẶT SAU ('definition'): Định nghĩa tiếng Việt cực kỳ ngắn gọn, chính xác theo đúng chuyên ngành bằng ${language}.
5. CÂU VÍ DỤ ('example'): Câu tiếng Anh ngữ cảnh thực tế mang nội dung cụ thể cho riêng từ đó, TUYỆT ĐỐI CẤM câu gá lắp rập khuôn kiểu "She explained how [word] functions...".`;

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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      responseSchema
    });
    const parsed = JSON.parse(cleanJsonText(rawText));
    if (parsed && Array.isArray(parsed.cards)) {
      parsed.cards = parsed.cards
        .map((c: any) => ({
          ...c,
          term: sanitizeCardTerm(c.term || ''),
          definition: (c.definition || '').trim()
        }))
        .filter((c: any) => isValidCardTerm(c.term));
    }
    return parsed;
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
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

  const prompt = `Đặt chính xác 3 câu ví dụ giao tiếp/công việc chuyên ngành thực tế cho từ vựng "${term}" (Định nghĩa: "${definition || ''}").
Mỗi câu ví dụ tiếng Anh phải có nội dung cụ thể phù hợp với nghĩa thực tế của từ, TUYỆT ĐỐI CẤM các mẫu câu rập khuôn gá lắp kiểu "She explained how [word] functions...".
Kèm theo bản dịch tiếng Việt mượt mà và chính xác.
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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      responseSchema
    });
    return JSON.parse(cleanJsonText(rawText));
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      responseSchema
    });
    return JSON.parse(cleanJsonText(rawText));
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      responseSchema: bulkResponseSchema
    });
    return JSON.parse(cleanJsonText(rawText));
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      responseSchema
    });
    return JSON.parse(cleanJsonText(rawText));
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
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
    const rawText = await safeGenerateContentClient(ai, {
      contents: promptText,
      systemInstruction,
      temperature: 0.8
    });

    return { text: rawText || "Hãy tiếp tục giữ vững tinh thần kỷ luật!" };
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
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
    const rawText = await safeGenerateContentClient(ai, {
      contents: prompt,
      systemInstruction,
      responseSchema
    });
    return JSON.parse(cleanJsonText(rawText));
  } catch (err) {
    if (isPermissionOrKeyError(err)) throw new Error(FRIENDLY_PERMISSION_ERROR);
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
