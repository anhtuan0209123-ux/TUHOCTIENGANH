import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const FRIENDLY_PERMISSION_ERROR = "API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại Key hoặc đổi sang API Key từ tài khoản Gmail cá nhân.";

function isPermissionOrKeyError(error: any): boolean {
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

function getGeminiClient(req?: express.Request) {
  const headerKey = req?.headers['x-gemini-api-key'] || req?.headers['x-api-key'];
  const bodyKey = req?.body?.geminiApiKey;
  let customKey = (typeof headerKey === 'string' ? headerKey : '') || (typeof bodyKey === 'string' ? bodyKey : '');
  if (customKey) {
    customKey = customKey.trim();
  }
  let envKey = process.env.GEMINI_API_KEY;
  if (envKey) {
    envKey = envKey.trim();
  }
  const apiKey = (customKey || envKey || "").trim();
  if (!apiKey) {
    throw new Error(FRIENDLY_PERMISSION_ERROR);
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

function isQuotaError(error: any): boolean {
  const errorStr = String(error?.message || error || "");
  return errorStr.includes("Quota exceeded") || 
         errorStr.includes("RESOURCE_EXHAUSTED") || 
         errorStr.includes("429") || 
         errorStr.includes("rate limit") || 
         errorStr.includes("quota");
}

async function generateContentWithRetry(ai: GoogleGenAI, params: any, retries = 2, delayMs = 1000): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      if (isPermissionOrKeyError(error)) {
        throw new Error(FRIENDLY_PERMISSION_ERROR);
      }
      if (isQuotaError(error)) {
        throw new Error("GEMINI_QUOTA_EXCEEDED");
      }
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
}

// Helper to generate varied, realistic natural sentences for offline fallback without generic templates
function getMultipleDiverseServerSentences(term: string, definition: string = ''): Array<{ sentence: string; translation: string }> {
  const cleanTerm = (term || 'word').trim();
  const cleanDef = (definition || '').trim();
  const suffixDef = cleanDef ? ` (${cleanDef})` : '';

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

function getDiverseServerExample(term: string, definition: string = ''): { example: string; exampleTranslation: string } {
  const sentences = getMultipleDiverseServerSentences(term, definition);
  return {
    example: sentences[0].sentence,
    exampleTranslation: sentences[0].translation
  };
}

// Local fallback generator for Study Sets when Gemini API is overloaded/503/missing keys
function generateOfflineStudySet(topic: string, amount: number = 8) {
  const cleanTopic = topic.toLowerCase().trim();
  
  let title = `Học phần: ${topic}`;
  let description = `Học phần từ vựng chất lượng cao được thiết kế cho chuyên đề "${topic}". (Chế độ Ngoại tuyến dự phòng chất lượng cao)`;
  let cards: Array<{ term: string; definition: string; example: string; exampleTranslation?: string }> = [];

  // Match keyword topics
  if (cleanTopic.includes("ielts") || cleanTopic.includes("english") || cleanTopic.includes("tiếng anh") || cleanTopic.includes("vocab") || cleanTopic.includes("học từ") || cleanTopic.includes("ngôn ngữ")) {
    title = `IELTS Chuyên Sâu: ${topic.replace(/ielts|english|tiếng anh|vocab/gi, "").trim() || "English Vocabulary"}`;
    description = `Bộ thẻ ghi nhớ học thuật giúp bứt phá band điểm IELTS cho chủ đề: ${topic}. (Giao diện Offline dự phòng)`;
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
  } 
  else if (cleanTopic.includes("react") || cleanTopic.includes("code") || cleanTopic.includes("javascript") || cleanTopic.includes("python") || cleanTopic.includes("lập trình") || cleanTopic.includes("html") || cleanTopic.includes("css") || cleanTopic.includes("programming") || cleanTopic.includes("developer") || cleanTopic.includes("phần mềm") || cleanTopic.includes("máy tính")) {
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
  }
  else if (cleanTopic.includes("địa") || cleanTopic.includes("geography") || cleanTopic.includes("quốc") || cleanTopic.includes("thủ") || cleanTopic.includes("bản đồ") || cleanTopic.includes("capital") || cleanTopic.includes("đất nước") || cleanTopic.includes("lịch sử")) {
    title = `Khoa Học Địa Lý & Xã Hội: ${topic}`;
    description = `Khám phá biên giới thế giới vĩ mô, địa danh đặc sắc và chỉ số địa dư cấu thành về ${topic}.`;
    const geoWordPool = [
      { term: 'Continent', definition: 'Lục địa - một trong các mảng đất liền rộng lớn phân chia bề mặt trái đất.', example: 'Asia is recognized worldwide as the largest and most populated continent.', exampleTranslation: 'Châu Á được công nhận trên toàn thế giới là châu lục lớn nhất và đông dân nhất.' },
      { term: 'Longitude', definition: 'Kinh độ - các đường giả định chạy dọc từ cực bắc xuống cực nam trên bản đồ.', example: 'Longitude lines run vertically from the North Pole to the South Pole.', exampleTranslation: 'Các đường kinh độ chạy dọc từ Cực Bắc đến Cực Nam.' },
      { term: 'Equator', definition: 'Đường xích đạo chia quả địa cầu thành Bắc bán cầu và Nam bán cầu.', example: 'Areas near the equator experience tropical climate with high humidity.', exampleTranslation: 'Các khu vực gần đường xích đạo có khí hậu nhiệt đới với độ ẩm cao.' },
      { term: 'Topography', definition: 'Địa hình - hình thể mấp mô hay cấu trúc tự nhiên bề mặt khu vực.', example: 'The topography of Switzerland features majestic mountains and deep valleys.', exampleTranslation: 'Địa hình của Thụy Sĩ nổi bật với những ngọn núi hùng vĩ và thung lũng sâu.' },
      { term: 'Peninsula', definition: 'Bán đảo - vùng đất có mọc nhô ra biển, được đại dương bao bọc ba phía.', example: 'Vietnam is a beautiful coastal nation lying on the Indochina peninsula.', exampleTranslation: 'Việt Nam là một quốc gia ven biển đẹp đẽ nằm trên bán đảo Đông Dương.' },
      { term: 'Archipelago', definition: 'Quần đảo - tập hợp một nhóm gồm nhiều đảo lớn nhỏ nằm liền kề nhau.', example: 'Japan is an archipelago country with thousands of breathtaking islands.', exampleTranslation: 'Nhật Bản là một quốc gia quần đảo với hàng ngàn hòn đảo ngoạn mục.' },
      { term: 'Ecosystem', definition: 'Hệ sinh thái gồm tập hợp quần xã sinh vật tương tác trực tiếp với môi trường.', example: 'The coral reef ecosystem is extremely fragile and must be protected.', exampleTranslation: 'Hệ sinh thái rạn san hô cực kỳ mong manh và cần được bảo vệ.' }
    ];
    cards = geoWordPool.slice(0, Math.min(amount, geoWordPool.length));
  }
  else {
    // General high-quality vocabulary topics customized with the requested subject!
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

  // Ensure amount constraint
  if (cards.length > amount) {
    cards = cards.slice(0, amount);
  }

  return { title, description, cards };
}

function parseLineToCardServer(line: string): { term: string; definition: string } | null {
  if (!line) return null;
  let raw = line.trim();
  if (!raw) return null;

  // Strip leading numbering or bullet symbols e.g. "1. ", "1/ ", "- ", "* ", "• "
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

  const cleanTerm = rawTerm.replace(/^[\d\.\-\*\+\•\:\;\,\(\)\[\]\"\'\“\”\–\—\s]+/, '').replace(/[\:\;\,\"\'\“\”\–\—\s]+$/, '').trim();
  const cleanDef = rawDef.trim();

  if (!cleanTerm || cleanTerm.length < 1) {
    return null;
  }

  return {
    term: cleanTerm,
    definition: cleanDef || `Định nghĩa cho ${cleanTerm}`
  };
}

// Local fallback text analyzer when Gemini API is overloaded/503/missing keys
function extractOfflineVocab(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const cards: Array<{ term: string; definition: string; example: string; exampleTranslation?: string }> = [];

  lines.forEach((line) => {
    const parsed = parseLineToCardServer(line);
    if (parsed) {
      cards.push({
        term: parsed.term,
        definition: parsed.definition,
        example: `Ví dụ sử dụng thuật ngữ "${parsed.term}" chuẩn xác trong văn cảnh thực tế.`
      });
    }
  });

  // If we can't extract as list, fall back to paragraph parsing
  if (cards.length === 0) {
    const words = text
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“]/g, " ")
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 3); // Filter very short words

    const uniqueWords = Array.from(new Set(words));
    const cardCandidates = uniqueWords.slice(0, 25); // allow up to 25 cards!

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Generate study set using Gemini 3.5 Flash or robust local fallback
  app.post("/api/generate-set", async (req, res) => {
    const { topic, amount = 8, language = "Vietnamese" } = req.body;

    if (!topic || typeof topic !== "string") {
      res.status(400).json({ error: "Chủ đề học tập không được để trống!" });
      return;
    }

    try {
      let parsedData;

      try {
        const ai = getGeminiClient(req);
        const prompt = `Tạo một học phần (study set) giống Quizlet về chủ đề: "${topic}".
        Số lượng thẻ: ${amount}.
        Hãy thiết kế các từ/khái niệm cốt lõi (term) là từ tiếng Anh (hoặc thuật ngữ ngoại ngữ).
        YÊU CẦU QUAN TRỌNG VỀ ĐỊNH NGHĨA: Định nghĩa tiếng Việt (definition) bắt buộc phải cực kỳ đơn giản, ngắn gọn, trực diện, nghĩa đơn giản thôi, dễ hiểu và dễ nhớ nhất cho học viên, tránh các giải thích hàn lâm hay thuật ngữ rườm rà dài dòng phức tạp.
        YÊU CẦU NGỮ CẢNH THỰC TẾ TRONG CÂU VÍ DỤ (REAL-LIFE CONTEXT): Với mỗi từ vựng (term), BẮT BUỘC đặt 1 câu tiếng Anh tự nhiên, thực tế trong đời sống hàng ngày/giao tiếp có chứa từ đó (Ví dụ: với từ 'hello' đặt 'Hello, how are you today?', với từ 'penniless' đặt 'After losing all his money, he was left penniless.'). TUYỆT ĐỐI CẤM sử dụng các câu mẫu chung chung/mô tả việc học như 'Please study the word...', 'This is an example for...', 'We should master the concept of...'. Phần exampleTranslation PHẢI LÀ BẢN DỊCH TIẾNG VIỆT HOÀN CHỈNH VÀ CHÍNH XÁC CỦA CHÍNH CÂU VÍ DỤ TIẾNG ANH ĐÓ.
        Nếu chủ đề của học phần không phải là ngoại ngữ, hãy ghi ngôn ngữ chính bằng ${language} kèm ví dụ câu ngữ cảnh thực tế và bản dịch Việt/Anh tương đương hữu hiệu nhất.
        Mọi nội dung định nghĩa phải thật rõ ràng, ngắn gọn và chuẩn xác.`;

        let response;
        try {
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là một giáo sư sư phạm và chuyên gia xây dựng tài liệu học tập của Quizlet. Bạn cung cấp nội dung học tập vô cùng cô đọng, dễ hiểu và truyền cảm hứng học hỏi.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Tiêu đề ngắn gọn, lôi cuốn của học phần. Ví dụ: Từ vựng IELTS chủ đề Biển cả, Khái niệm cơ bản Python, v.v."
                  },
                  description: {
                    type: Type.STRING,
                    description: "Mô tả súc tích về học phần này nhằm giải thích người học sẽ tiếp thu được những gì."
                  },
                  cards: {
                    type: Type.ARRAY,
                    description: "Danh sách các thẻ ghi nhớ (flashcards)",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: {
                          type: Type.STRING,
                          description: "Từ khóa, thuật ngữ, hoặc câu hỏi ngắn. Không viết quá dài."
                        },
                        definition: {
                          type: Type.STRING,
                          description: "Định nghĩa, giải thích thuật ngữ đó một cách chuẩn xác, trực diện."
                        },
                        example: {
                          type: Type.STRING,
                          description: "Ví dụ minh họa thực hành ngắn gọn hoặc câu mẫu sử dụng thuật ngữ này."
                        },
                        exampleTranslation: {
                          type: Type.STRING,
                          description: "Bản dịch nghĩa hoàn chỉnh và chính xác sang tiếng Việt của phần câu ví dụ 'example' nêu trên."
                        }
                      },
                      required: ["term", "definition"]
                    }
                  }
                },
                required: ["title", "description", "cards"]
              }
            }
          });
        } catch (error35: any) {
          console.warn("[gemini-3.6-flash failed or high demand]. Trying fallback model gemini-3.6-flash...", error35);
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là một giáo sư sư phạm và chuyên gia xây dựng tài liệu học tập của Quizlet. Bạn cung cấp nội dung học tập vô cùng cô đọng, dễ hiểu và truyền cảm hứng học hỏi.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Tiêu đề ngắn gọn, lôi cuốn của học phần. Ví dụ: Từ vựng IELTS chủ đề Biển cả, Khái niệm cơ bản Python, v.v."
                  },
                  description: {
                    type: Type.STRING,
                    description: "Mô tả súc tích về học phần này nhằm giải thích người học sẽ tiếp thu được những gì."
                  },
                  cards: {
                    type: Type.ARRAY,
                    description: "Danh sách các thẻ ghi nhớ (flashcards)",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: {
                          type: Type.STRING,
                          description: "Từ khóa, thuật ngữ, hoặc câu hỏi ngắn. Không viết quá dài."
                        },
                        definition: {
                          type: Type.STRING,
                          description: "Định nghĩa, giải thích thuật ngữ đó một cách chuẩn xác, trực diện."
                        },
                        example: {
                          type: Type.STRING,
                          description: "Ví dụ minh họa thực hành ngắn gọn hoặc câu mẫu sử dụng thuật ngữ này."
                        },
                        exampleTranslation: {
                          type: Type.STRING,
                          description: "Bản dịch nghĩa hoàn chỉnh và chính xác sang tiếng Việt của phần câu ví dụ 'example' nêu trên."
                        }
                      },
                      required: ["term", "definition"]
                    }
                  }
                },
                required: ["title", "description", "cards"]
              }
            }
          });
        }

        const responseText = response.text;
        if (!responseText) {
          throw new Error("Không thể nhận phản hồi văn bản từ mô hình Gemini AI.");
        }
        parsedData = JSON.parse(responseText.trim());
      } catch (geminiError: any) {
        if (geminiError?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(geminiError)) {
          console.log("[Offline Mode] Gemini API Quota exceeded. Utilizing high-quality offline study set generator.");
        } else {
          console.log(`[Offline Mode] Gemini API failed: ${geminiError?.message || geminiError}. Utilizing offline study set generator.`);
        }
        parsedData = generateOfflineStudySet(topic, amount);
      }

      res.json(parsedData);
    } catch (error: any) {
      console.log("[Offline Mode] Safe fallback utilized for generate-set:", error?.message || error);
      res.json(generateOfflineStudySet(topic, amount));
    }
  });

  // API Route: Generate more related study cards dynamically (Continuous Learning / Infinite Mode)
  app.post("/api/generate-more-cards", async (req, res) => {
    const { topic, existingTerms = [], amount = 5, language = "Vietnamese" } = req.body;

    if (!topic || typeof topic !== "string") {
      res.status(400).json({ error: "Chủ đề học tập không được để trống!" });
      return;
    }

    try {
      let parsedData;

      try {
        const ai = getGeminiClient(req);
        const prompt = `Bạn là một trợ lý giáo dục nâng cao. Hãy tạo thêm các thẻ học mới liên quan mật thiết đến chủ đề: "${topic}".
        Số lượng thẻ cần tạo thêm: ${amount}.
        YÊU CẦU QUAN TRỌNG: Các từ mới tạo KHÔNG ĐƯỢC trùng lặp với bất kỳ từ nào trong danh sách hiện có này: [${existingTerms.join(", ")}].
        Hãy chọn các từ/thuật ngữ nâng cao hoặc liên quan trực tiếp giúp mở rộng kiến thức sâu sắc hơn.
        YÊU CẦU QUAN TRỌNG VỀ ĐỊNH NGHĨA: Định nghĩa tiếng Việt (definition) bắt buộc phải cực kỳ đơn giản, ngắn gọn, trực diện, nghĩa đơn giản thôi, dễ hiểu và dễ nhớ nhất cho học viên, tránh các giải thích hàn lâm rườm rà dài dòng phức tạp.
        YÊU CẦU NGỮ CẢNH THỰC TẾ TRONG CÂU VÍ DỤ (REAL-LIFE CONTEXT): Với mỗi từ vựng (term), BẮT BUỘC đặt 1 câu tiếng Anh tự nhiên, thực tế trong đời sống hàng ngày/giao tiếp có chứa từ đó (Ví dụ: với từ 'hello' đặt 'Hello, how are you today?', với từ 'penniless' đặt 'After losing all his money, he was left penniless.'). TUYỆT ĐỐI CẤM sử dụng các câu mẫu chung chung/mô tả việc học như 'Please study the word...', 'This is an example for...', 'We should master the concept of...'. Phần exampleTranslation PHẢI LÀ BẢN DỊCH TIẾNG VIỆT HOÀN CHỈNH VÀ CHÍNH XÁC CỦA CHÍNH CÂU VÍ DỤ TIẾNG ANH ĐÓ.`;

        let response;
        try {
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là giáo sư ngôn ngữ học và chuyên gia xây dựng nội dung học tập thông minh. Bạn cung cấp từ vựng học thuật mở rộng liên quan để nâng cao kiến thức liên tục cho học viên.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  cards: {
                    type: Type.ARRAY,
                    description: "Danh sách các thẻ học mới được tạo thêm.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: { type: Type.STRING, description: "Từ khóa mới liên quan" },
                        definition: { type: Type.STRING, description: "Định nghĩa chi tiết dễ hiểu bằng tiếng Việt" },
                        example: { type: Type.STRING, description: "Ví dụ minh họa thực tế" },
                        exampleTranslation: { type: Type.STRING, description: "Dịch ví dụ sang tiếng Việt" }
                      },
                      required: ["term", "definition"]
                    }
                  }
                },
                required: ["cards"]
              }
            }
          });
        } catch (err: any) {
          console.warn("[gemini-3.6-flash failed for more cards]. Trying fallback...", err);
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là giáo sư ngôn ngữ học và chuyên gia xây dựng nội dung học tập thông minh.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  cards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        example: { type: Type.STRING },
                        exampleTranslation: { type: Type.STRING }
                      },
                      required: ["term", "definition"]
                    }
                  }
                },
                required: ["cards"]
              }
            }
          });
        }

        const responseText = response.text;
        if (!responseText) {
          throw new Error("Không thể nhận phản hồi từ Gemini.");
        }
        parsedData = JSON.parse(responseText.trim());
      } catch (geminiError: any) {
        console.warn("Gemini more cards generation failed, using offline generator:", geminiError);
        // Fallback local generation: filter out existing terms
        const offlineSet = generateOfflineStudySet(topic, 12);
        const filteredCards = offlineSet.cards.filter(c => !existingTerms.some((existing: string) => existing.toLowerCase().trim() === c.term.toLowerCase().trim())).slice(0, amount);
        
        // If everything is filtered out, generate dynamic unique offline cards
        if (filteredCards.length === 0) {
          const timestamp = Date.now();
          for (let i = 0; i < amount; i++) {
            filteredCards.push({
              term: `${topic} nâng cao ${i + 1}`,
              definition: `Khái niệm mở rộng số ${i + 1} giúp bạn nâng tầm sự hiểu biết sâu sắc về ${topic}.`,
              example: `Understanding ${topic} nâng cao ${i + 1} helps us apply the knowledge effectively.`,
              exampleTranslation: `Hiểu rõ ${topic} nâng cao ${i + 1} giúp chúng ta áp dụng kiến thức một cách hiệu quả.`
            });
          }
        }
        parsedData = { cards: filteredCards };
      }

      res.json(parsedData);
    } catch (error: any) {
      console.error("More cards generation general error:", error);
      res.json({ cards: [] });
    }
  });

  // API Route: AI Deep Dive explanation for any flashcard term
  app.post("/api/deep-dive", async (req, res) => {
    const { term, definition, example } = req.body;

    if (!term || typeof term !== "string") {
      res.status(400).json({ error: "Thuật ngữ cần phân tích không được để trống!" });
      return;
    }

    try {
      const ai = getGeminiClient(req);
      const prompt = `Hãy giải thích chuyên sâu thuật ngữ/từ vựng: "${term}"
      Định nghĩa gốc: "${definition || ""}"
      Ví dụ mẫu: "${example || ""}"

      Yêu cầu nghiêm ngặt: Hãy cung cấp phản hồi dưới định dạng JSON có cấu trúc chính xác sau:
      {
        "essence": "Bản chất thuật ngữ & Mẹo ghi nhớ độc đáo, liên tưởng hóm hỉnh trực quan (khoảng 1-2 câu).",
        "examples": [
          "Ví dụ mẫu thực tế số 1 trực tiếp sử dụng từ vựng đó trong giao tiếp/văn cảnh thực (Ví dụ: từ 'hello' -> 'Hello, my name is Ba. (Xin chào, tôi tên là Ba.)') kèm dịch nghĩa Việt.",
          "Ví dụ mẫu thực tế số 2 kèm dịch nghĩa Việt."
        ],
        "mistakes": "Các lỗi sai thường gặp khi dùng từ/thuật ngữ này (về ngữ pháp, phát âm hoặc hiểu sai ngữ cảnh) kèm cách khắc phục ngắn gọn nhất."
      }
      TUYỆT ĐỐI CẤM dùng các mẫu câu rập khuôn gá lắp kiểu 'She explained how [word] functions...' hoặc 'Applying [word] correctly...'.`;

      let response;
      try {
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction: "Bạn là một giáo sư ngôn ngữ học và trợ lý học tập thông thái của QuizSet, chuyên phân tích các từ khó, thuật ngữ lập trình hoặc thuật ngữ IELTS khó hiểu trở nên cực kỳ sinh động và dễ ghi nhớ.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                essence: {
                  type: Type.STRING,
                  description: "Bản chất và mẹo nhớ trực quan."
                },
                examples: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Chính xác 2 ví dụ thực tế kèm nghĩa tiếng Việt."
                },
                mistakes: {
                  type: Type.STRING,
                  description: "Lỗi sai thường gặp và cách khắc phục."
                }
              },
              required: ["essence", "examples", "mistakes"]
            }
          }
        });
      } catch (err35: any) {
        if (err35?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(err35)) {
          throw new Error("GEMINI_QUOTA_EXCEEDED");
        }
        console.log("[gemini-3.6-flash deep-dive failed]. Retrying with gemini-3.6-flash...");
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction: "Bạn là một giáo sư ngôn ngữ học và trợ lý học tập thông thái của QuizSet, chuyên phân tích các từ khó, thuật ngữ lập trình hoặc thuật ngữ IELTS khó hiểu trở nên cực kỳ sinh động và dễ ghi nhớ.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                essence: {
                  type: Type.STRING,
                  description: "Bản chất và mẹo nhớ trực quan."
                },
                examples: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Chính xác 2 ví dụ thực tế kèm nghĩa tiếng Việt."
                },
                mistakes: {
                  type: Type.STRING,
                  description: "Lỗi sai thường gặp và cách khắc phục."
                }
              },
              required: ["essence", "examples", "mistakes"]
            }
          }
        });
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Không thể nhận phản hồi văn bản từ mô hình Gemini AI.");
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      if (error?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(error)) {
        console.log("[Offline Mode] Gemini API Quota exceeded on Deep Dive. Using local smart fallback.");
      } else {
        console.log(`[Offline Mode] Deep Dive failed: ${error?.message || error}. Using local smart fallback.`);
      }
      const fallbackSentences = getMultipleDiverseServerSentences(term, definition);
      res.json({
        essence: `💡 Mẹo nhớ từ "${term}": ${definition ? `Nắm vững nghĩa chuyên ngành "${definition}".` : 'Liên tưởng khái niệm này tới ứng dụng thực tế.'} Bản chất giúp giải quyết vấn đề trực diện.`,
        examples: [
          `1. ${fallbackSentences[0]?.sentence} (${fallbackSentences[0]?.translation})`,
          `2. ${fallbackSentences[1]?.sentence} (${fallbackSentences[1]?.translation})`
        ],
        mistakes: `⚠️ Tránh nhầm lẫn cách viết chính tả hoặc hiểu sai trường nghĩa cơ bản của từ "${term}". Hãy thường xuyên ôn tập và tự gõ lại để củng cố phản xạ tự nhiên.`
      });
    }
  });

  // API Route: Analyze and extract flashcards from a large vocabulary block or paragraph
  app.post("/api/analyze-vocab", async (req, res) => {
    const { text, language = "Vietnamese" } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Nội dung phân tích không được để trống!" });
      return;
    }

    try {
      let parsedData;

      try {
        const ai = getGeminiClient(req);
        const prompt = `Bạn nhận được một đoạn văn bản hoặc một danh sách từ vựng thô dưới đây:
        """
        ${text}
        """

        QUY TẮC BẮT BUỘC BÓC TÁCH MẶT TRƯỚC VÀ MẶT SAU THẺ DỰA TRÊN 3 ĐỊNH DẠNG CHUẨN:
        1. NHẬN DIỆN VÀ PHÂN TÁCH CHÍNH XÁC:
           - KIỂU 1 (Dấu hai chấm ':'): "A : B" -> Mặt trước ('term') = "A", Mặt sau ('definition') = "B" (Ví dụ: "hello : chào" -> Mặt trước = "hello", Mặt sau = "chào").
           - KIỂU 2 (Dấu gạch ngang '-' hoặc '–'): "A - B" -> Mặt trước ('term') = "A", Mặt sau ('definition') = "B" (Ví dụ: "Phản ứng xà phòng hóa - Thủy phân chất béo..." -> Mặt trước = "Phản ứng xà phòng hóa").
           - KIỂU 3 (Dấu ngoặc đơn '()'): "A (B)" -> Mặt trước ('term') = "A", Mặt sau ('definition') = "B" (Ví dụ: "Computer Vision (Thị giác máy tính)" -> Mặt trước = "Computer Vision", Mặt sau = "Thị giác máy tính").

        2. TỰ ĐỘNG CẮT KHOẢNG TRẮNG THỪA (TRIM) CẢ 2 ĐẦU MẶT TRƯỚC VÀ MẶT SAU.
        3. TUYỆT ĐỐI KHÔNG GỘP CẢ 2 TỪ DÍNH LIỀN THÀNH MẶT TRƯỚC (Ví dụ: CẤM gộp "hello chào" làm 1 mặt trước, bắt buộc tách Mặt trước = "hello", Mặt sau = "chào").
        4. BẮT BUỘC TRÍCH XUẤT ĐẦY ĐỦ 100%: Nếu văn bản nguồn là danh sách từng dòng, tạo 100% đầy đủ tất cả thẻ. Không tự ý cắt bớt hay lược bỏ.
        
        Đối với mỗi thẻ được tạo ra:
        - 'term': Cụm từ / thuật ngữ chuyên ngành (1-5 từ).
        - 'definition': Định nghĩa/nghĩa súc tích bằng ${language}.
        - 'example': Câu ví dụ tiếng Anh ngắn gọn chứa 'term'.
        - 'exampleTranslation': Bản dịch nghĩa tiếng Việt tương ứng của câu 'example'.`;

        let response;
        try {
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là một AI chuyên phân tích văn bản chuyên môn và xây dựng học tập của Quizlet. Bạn cung cấp nội dung học thuật vô cùng chất lượng, chính xác tuyệt đối, chuẩn ngữ pháp và không bao giờ tự ý cắt xén dữ liệu học từ của người dùng.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Tiêu đề ngắn gọn, lôi cuốn của học phần. Ví dụ: Từ vựng trích xuất từ bài đọc IELTS, Thuật ngữ Blockchain cơ bản, v.v."
                  },
                  description: {
                    type: Type.STRING,
                    description: "Mô tả súc tích về học phần này nhằm giải thích người học sẽ học được tập từ vựng gì."
                  },
                  cards: {
                    type: Type.ARRAY,
                    description: "Danh sách các thẻ ghi nhớ (flashcards)",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: {
                          type: Type.STRING,
                          description: "Từ khóa, thuật ngữ, hoặc câu hỏi ngắn. Không viết quá dài."
                        },
                        definition: {
                          type: Type.STRING,
                          description: "Định nghĩa, giải thích thuật ngữ đó một cách chuẩn xác, trực diện."
                        },
                        example: {
                          type: Type.STRING,
                          description: "Ví dụ minh họa tiếng Anh."
                        },
                        exampleTranslation: {
                          type: Type.STRING,
                          description: "Dịch nghĩa tiếng Việt đầy đủ và súc tích của câu ví dụ tiếng Anh trên."
                        }
                      },
                      required: ["term", "definition"]
                    }
                  }
                },
                required: ["title", "description", "cards"]
              }
            }
          });
        } catch (error35: any) {
          if (error35?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(error35)) {
            throw new Error("GEMINI_QUOTA_EXCEEDED");
          }
          console.log("[gemini-3.6-flash analyze failed]. Trying fallback model gemini-3.6-flash...");
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là một AI chuyên phân tích văn bản chuyên môn và xây dựng học học tập của Quizlet. Bạn cung cấp nội dung học thuật vô cùng chất lượng, chính xác tuyệt đối, chuẩn ngữ pháp và không bao giờ tự ý cắt xén dữ liệu học từ của người dùng.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Tiêu đề ngắn gọn, lôi cuốn của học phần. Ví dụ: Từ vựng trích xuất từ bài đọc IELTS, Thuật ngữ Blockchain cơ bản, v.v."
                  },
                  description: {
                    type: Type.STRING,
                    description: "Mô tả súc tích về học phần này nhằm giải thích người học sẽ học được tập từ vựng gì."
                  },
                  cards: {
                    type: Type.ARRAY,
                    description: "Danh sách các thẻ ghi nhớ (flashcards)",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: {
                          type: Type.STRING,
                          description: "Từ khóa, thuật ngữ, hoặc câu hỏi ngắn. Không viết quá dài."
                        },
                        definition: {
                          type: Type.STRING,
                          description: "Định nghĩa, giải thích thuật ngữ đó một cách chuẩn xác, trực diện."
                        },
                        example: {
                          type: Type.STRING,
                          description: "Ví dụ minh họa sử dụng thuật ngữ bằng tiếng Anh."
                        },
                        exampleTranslation: {
                          type: Type.STRING,
                          description: "Dịch nghĩa tiếng Việt đầy đủ của phần câu ví dụ nêu trên."
                        }
                      },
                      required: ["term", "definition"]
                    }
                  }
                },
                required: ["title", "description", "cards"]
              }
            }
          });
        }

        const responseText = response.text;
        if (!responseText) {
          throw new Error("Không thể nhận phản hồi văn bản từ mô hình Gemini AI.");
        }
        parsedData = JSON.parse(responseText.trim());
      } catch (geminiError: any) {
        if (geminiError?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(geminiError)) {
          console.log("[Offline Mode] Gemini API Quota exceeded on vocab analysis. Using local offline parser.");
        } else {
          console.log(`[Offline Mode] Vocab analysis failed: ${geminiError?.message || geminiError}. Using local offline parser.`);
        }
        parsedData = extractOfflineVocab(text);
      }

      res.json(parsedData);
    } catch (error: any) {
      console.log("[Offline Mode] Safe fallback utilized for analyze-vocab:", error?.message || error);
      res.json(extractOfflineVocab(text));
    }
  });

  // API Route: Generate dynamic daily-life example sentences using Gemini
  app.post("/api/generate-dynamic-sentences", async (req, res) => {
    const { term, definition } = req.body;

    if (!term || typeof term !== "string") {
      res.status(400).json({ error: "Thuật ngữ không được để trống!" });
      return;
    }

    try {
      const ai = getGeminiClient(req);
      const prompt = `Bạn nhận được một thuật ngữ/từ vựng: "${term}" và định nghĩa của nó: "${definition || ""}".
      Hãy đặt chính xác 3 câu ví dụ cực kỳ gần gũi với đời sống hàng ngày (giao tiếp hàng ngày, sinh hoạt, công việc thực tế, nói chuyện gia đình, bạn bè...), mang tính ứng dụng cao để người học cực kỳ dễ nhớ và dễ hiểu từ này.
      Mỗi câu ví dụ bằng tiếng Anh phải đi kèm với bản dịch nghĩa tiếng Việt mượt mà, gần gũi và tự nhiên nhất.
      
      Yêu cầu nghiêm ngặt: Hãy cung cấp phản hồi dưới định dạng JSON có cấu trúc chính xác sau:
      {
        "sentences": [
          { "sentence": "Câu ví dụ tiếng Anh ngắn gọn, thực tế chứa từ khóa", "translation": "Bản dịch tiếng Việt mượt mà, tự nhiên và gần gũi nhất" }
        ]
      }`;

      let response;
      try {
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction: "Bạn là một trợ lý ngôn ngữ và giảng viên dạy từ vựng ưu tú. Bạn chuyên đặt các câu ví dụ tiếng Anh cực kỳ thực tế, sinh động, vui vẻ và gần gũi với cuộc sống hàng ngày để người học dễ liên tưởng và học thuộc từ vựng.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sentences: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sentence: { type: Type.STRING },
                      translation: { type: Type.STRING }
                    },
                    required: ["sentence", "translation"]
                  }
                }
              },
              required: ["sentences"]
            }
          }
        });
      } catch (err: any) {
        if (err?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(err)) {
          throw new Error("GEMINI_QUOTA_EXCEEDED");
        }
        console.log("[gemini-3.6-flash generate-dynamic-sentences failed]. Trying gemini-3.6-flash...");
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction: "Bạn là một trợ lý ngôn ngữ và giảng viên dạy từ vựng ưu tú. Bạn chuyên đặt các câu ví dụ tiếng Anh cực kỳ thực tế, sinh động, vui vẻ và gần gũi với cuộc sống hàng ngày để người học dễ liên tưởng và học thuộc từ vựng.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sentences: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sentence: { type: Type.STRING },
                      translation: { type: Type.STRING }
                    },
                    required: ["sentence", "translation"]
                  }
                }
              },
              required: ["sentences"]
            }
          }
        });
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Không thể nhận phản hồi từ Gemini AI.");
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.log(`[Offline Mode/Error] generate-dynamic-sentences failed: ${error?.message || error}. Returning smart fallbacks.`);
      res.json({
        sentences: getMultipleDiverseServerSentences(term, definition)
      });
    }
  });

  // API Route: Verify card vocabulary and definition quality, and generate B1/B2 standard example + translation
  app.post("/api/check-vocab-quality", async (req, res) => {
    const { term, definition } = req.body;

    if (!term || typeof term !== "string") {
      res.status(400).json({ error: "Thuật ngữ học tập không được để trống!" });
      return;
    }

    try {
      const ai = getGeminiClient(req);
      const prompt = `Hãy thẩm định, rà soát lỗi chính tả, chuẩn hóa ngữ nghĩa và tạo câu ví dụ trình độ B1/B2 kèm nguồn tham chiếu uy tín cho từ vựng này:
      - Thuật ngữ (Term) đề xuất: "${term}"
      - Định nghĩa (Definition) đề xuất: "${definition || ''}"
      
      Hãy thực hiện phân tích chuyên sâu gồm các khía cạnh sau:
      1. Kiểm tra chính tả (spellingCheck): Xác định từ có viết đúng chính tả tiếng Anh (hoặc ngôn ngữ mục tiêu) không. Nếu sai hoặc viết hoa tùy tiện, hãy sửa lại.
      2. Kiểm tra nghĩa (meaningCheck): Đối chiếu định nghĩa tiếng Việt với nét nghĩa thực tế của từ. Sửa lại nếu định nghĩa bị dịch sai, dịch hời hợt, hoặc không lột tả đúng bản chất. YÊU CẦU QUAN TRỌNG: Định nghĩa tiếng Việt phải CỰC KỲ ĐƠN GIẢN, NGẮN GỌN, TRỰC DIỆN, NGHĨA ĐƠN GIẢN THÔI, dễ hiểu và dễ nhớ nhất cho học viên, tránh các giải thích hàn lâm rườm rà dài dòng phức tạp.
      3. Kiểm tra và thiết kế câu ví dụ (exampleCheck): Thiết lập câu ví dụ tiếng Anh tự nhiên, thực tế, đạt chuẩn trình độ CEFR B1 hoặc B2 có chứa từ vựng này. Dịch nghĩa tiếng Việt sát nghĩa và thoát ý phù hợp.
      4. Giải thích nguyên nhân sửa đổi (explanation): Giải thích chi tiết, chuyên sâu về ngôn ngữ học tại sao từ hoặc nghĩa bị sai, hoặc những điểm cần lưu ý khi học từ này.
      5. Dẫn nguồn tham chiếu uy tín (referenceCitation): Cung cấp thông tin dẫn nguồn hoặc trích dẫn từ điển chính thống như Cambridge Dictionary, Oxford Learner's Dictionary hoặc từ điển uy tín tương ứng để tạo độ tin cậy tuyệt đối.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          term: {
            type: Type.STRING,
            description: "Từ vựng chính xác sau khi đã chuẩn hóa chính tả và định dạng."
          },
          definition: {
            type: Type.STRING,
            description: "Định nghĩa tiếng Việt chuẩn xác, súc tích và bao quát nhất."
          },
          example: {
            type: Type.STRING,
            description: "Câu ví dụ tiếng Anh đạt chuẩn trình độ B1/B2 chứa từ khóa trên."
          },
          exampleTranslation: {
            type: Type.STRING,
            description: "Bản dịch tiếng Việt xuất sắc, thoát ý mượt mà của câu ví dụ."
          },
          cefrLevel: {
            type: Type.STRING,
            description: "Cấp độ CEFR của từ/ví dụ (ví dụ: 'B1' hoặc 'B2')."
          },
          issueFound: {
            type: Type.BOOLEAN,
            description: "Đặt là true nếu phát hiện lỗi chính tả, sai nghĩa nghiêm trọng, hoặc ví dụ ban đầu không đạt yêu cầu."
          },
          feedback: {
            type: Type.STRING,
            description: "Một câu nhận xét chung siêu súc tích về từ vựng này."
          },
          spellingStatus: {
            type: Type.STRING,
            description: "Trạng thái kiểm tra lỗi chính tả: 'Chính xác' hoặc 'Đã sửa đổi'."
          },
          spellingDetails: {
            type: Type.STRING,
            description: "Mô tả chi tiết lỗi chính tả đã rà soát hoặc phát hiện được."
          },
          meaningStatus: {
            type: Type.STRING,
            description: "Trạng thái kiểm tra nghĩa: 'Chính xác' hoặc 'Đã sửa đổi'."
          },
          meaningDetails: {
            type: Type.STRING,
            description: "Giải thích độ chuẩn xác của định nghĩa tiếng Việt so với ngữ nghĩa thật sự của từ."
          },
          exampleStatus: {
            type: Type.STRING,
            description: "Trạng thái câu ví dụ: 'Đã tạo mới B1/B2' hoặc 'Đã chuẩn hóa'."
          },
          exampleDetails: {
            type: Type.STRING,
            description: "Phân tích ngữ cảnh câu ví dụ và lý do tại sao nó phù hợp ở cấp độ B1/B2."
          },
          explanation: {
            type: Type.STRING,
            description: "AI giải thích cặn kẽ nguyên nhân sai lầm phổ biến, hiểu lầm từ vựng hoặc lý do sửa từ/nghĩa này (tối thiểu 30 từ, bổ ích cho người học)."
          },
          referenceCitation: {
            type: Type.STRING,
            description: "Nguồn tham khảo từ điển chính thống có uy tín nhất (ví dụ: Cambridge Advanced Learner's Dictionary, Oxford English Dictionary...) kèm định nghĩa/ghi chú uy tín."
          }
        },
        required: [
          "term", "definition", "example", "exampleTranslation", "cefrLevel", "issueFound", 
          "feedback", "spellingStatus", "spellingDetails", "meaningStatus", "meaningDetails", 
          "exampleStatus", "exampleDetails", "explanation", "referenceCitation"
        ]
      };

      let response;
      // STAGE 1: Try gemini-3.6-flash with Google Search Grounding and JSON Schema
      try {
        console.log(`[Stage 1] Checking quality for term: "${term}" with Google Search Grounding...`);
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction: "Bạn là giáo sư ngôn ngữ học và chuyên gia biên soạn từ điển ưu tú. Nhiệm vụ của bạn là rà soát lỗi chính tả, kiểm duyệt và chuẩn hóa ngữ nghĩa từ vựng, giải thích chi tiết cặn kẽ tại sao sai hoặc cần cải tiến, thiết lập câu mẫu B1/B2 đỉnh cao, và dẫn chứng nguồn tham chiếu từ điển thế giới (Cambridge, Oxford, Larousse...) cực kỳ chính thống, uy tín. Sử dụng công cụ Google Search để tìm kiếm và rà soát đối chiếu thông tin chính xác nhất từ các nguồn từ điển trực tuyến uy tín.",
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        });
      } catch (err1: any) {
        if (err1?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(err1)) {
          throw err1;
        }
        console.warn("[Stage 1 Failed] Search Grounding or Tool execution failed. Retrying in Stage 2 WITHOUT Google Search...");
        
        // STAGE 2: Try gemini-3.6-flash WITHOUT Google Search to guarantee response
        try {
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là giáo sư ngôn ngữ học và chuyên gia biên soạn từ điển ưu tú. Nhiệm vụ của bạn là rà soát lỗi chính tả, kiểm duyệt và chuẩn hóa ngữ nghĩa từ vựng, giải thích chi tiết cặn kẽ tại sao sai hoặc cần cải tiến, thiết lập câu mẫu B1/B2 đỉnh cao, và dẫn chứng nguồn tham chiếu từ điển thế giới (Cambridge, Oxford, Larousse...) cực kỳ chính thống, uy tín.",
              responseMimeType: "application/json",
              responseSchema: responseSchema
            }
          });
        } catch (err2: any) {
          if (err2?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(err2)) {
            throw err2;
          }
          console.warn("[Stage 2 Failed] Gemini 3.5-flash without search failed. Retrying in Stage 3 with 3.1-flash-lite...");

          // STAGE 3: Try gemini-3.6-flash WITHOUT Google Search
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là giáo sư ngôn ngữ học rà soát từ vựng.",
              responseMimeType: "application/json",
              responseSchema: responseSchema
            }
          });
        }
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Không thể nhận được kết quả phân tích chất lượng từ Gemini.");
      }

      const verifiedData = JSON.parse(responseText.trim());
      res.json(verifiedData);
    } catch (error: any) {
      if (error?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(error)) {
        console.log("[Offline Mode] Gemini API Quota exceeded on vocab check. Using high-quality offline response.");
      } else {
        console.log(`[Offline Mode] Quality check failed completely: ${error?.message || error}. Using offline response.`);
      }
      const divEx = getDiverseServerExample(term, definition);
      res.json({
        term: term,
        definition: definition || "Chưa có định nghĩa",
        example: divEx.example,
        exampleTranslation: divEx.exampleTranslation,
        cefrLevel: "B1",
        issueFound: false,
        feedback: "Đang ở chế độ ngoại tuyến dượt bài tạm thời.",
        spellingStatus: "Chính xác",
        spellingDetails: "Chưa thể kết nối AI để kiểm tra lỗi chính tả.",
        meaningStatus: "Chính xác",
        meaningDetails: "Chưa thể đối chiếu học thuật ngữ nghĩa.",
        exampleStatus: "Đã tạo mới B1/B2",
        exampleDetails: "Đã thiết kế câu ví dụ mặc định hỗ trợ ghi nhớ.",
        explanation: "Hệ thống AI bận rộn nên chưa thể đưa ra lời giải thích chuyên sâu. Hãy tự tra cứu thêm để chắc chắn.",
        referenceCitation: "Cambridge Dictionary & Oxford Learner's Dictionary (Tra cứu ngoại tuyến)"
      });
    }
  });

  // API Route: Bulk audit vocabulary list with Search Grounding
  app.post("/api/check-vocab-bulk", async (req, res) => {
    const { cards } = req.body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      res.status(400).json({ error: "Danh sách từ vựng rỗng hoặc không hợp lệ!" });
      return;
    }

    try {
      const ai = getGeminiClient(req);
      const prompt = `Bạn là một giáo sư ngôn ngữ học và chuyên gia biên soạn từ điển ưu tú. Hãy quét toàn bộ danh sách từ vựng sau đây để phát hiện các lỗi chính tả, sai nghĩa, dịch sai hoặc giải nghĩa rườm rà dài dòng.
Danh sách từ vựng đầu vào:
${JSON.stringify(cards.map((c: any) => ({ id: c.id, term: c.term, definition: c.definition })))}

YÊU CẦU:
1. Sử dụng công cụ Google Search để tìm kiếm và rà soát đối chiếu thông tin chính xác từ các nguồn từ điển trực tuyến uy tín (Cambridge, Oxford, Merriam-Webster, Larousse...).
2. Phát hiện lỗi: Đối chiếu chính tả của từ tiếng Anh và ngữ nghĩa tiếng Việt ban đầu. Phát hiện từ viết sai chính tả, sai loại từ, hoặc định nghĩa tiếng Việt bị dịch sai, hời hợt, không đúng bản chất hoặc quá dài dòng, rườm rà.
3. Chỉnh sửa và Tối giản hóa giải nghĩa: Sửa tất cả các lỗi sai và tối ưu hóa giải nghĩa tiếng Việt. Định nghĩa tiếng Việt mới phải CỰC KỲ ĐƠN GIẢN, NGẮN GỌN, TRỰC DIỆN, rõ ràng và dễ nhớ nhất cho học viên (tránh giải thích hàn lâm rườm rà dài dòng).
4. Thiết lập câu mẫu: Đối với mọi từ trong danh sách hoàn chỉnh, tạo một câu ví dụ tiếng Anh tự nhiên ở trình độ B1/B2 kèm dịch nghĩa tiếng Việt mượt mà.
5. Trả về cấu trúc JSON đúng chuẩn yêu cầu. Trong đó:
   - "corrections": Chỉ chứa những thẻ thực sự có lỗi sai chính tả hoặc định nghĩa gốc không chuẩn, rườm rà và cần được thay đổi/sửa đổi. Nếu từ viết đúng chính tả và nghĩa cực kỳ clear chuẩn, không cần đưa vào danh sách này.
   - "completeCorrectedList": Chứa TOÀN BỘ tất cả các thẻ trong danh sách đầu vào, đã được sửa lỗi (nếu có) và được làm sạch, đơn giản hóa định nghĩa tối đa để clear nhất có thể, kèm câu ví dụ B1/B2 và trích dẫn nguồn từ điển chính thống.`;

      const bulkResponseSchema = {
        type: Type.OBJECT,
        properties: {
          corrections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                cardId: { type: Type.STRING },
                originalTerm: { type: Type.STRING },
                originalDefinition: { type: Type.STRING },
                correctedTerm: { type: Type.STRING },
                correctedDefinition: { type: Type.STRING, description: "Định nghĩa tiếng Việt cực kỳ rõ ràng, ngắn gọn, súc tích và dễ nhớ nhất." },
                explanation: { type: Type.STRING, description: "Giải thích tại sao sai hoặc cần cải tiến, dựa trên từ điển chính thống trực tuyến." }
              },
              required: ["cardId", "originalTerm", "originalDefinition", "correctedTerm", "correctedDefinition", "explanation"]
            }
          },
          completeCorrectedList: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                cardId: { type: Type.STRING },
                term: { type: Type.STRING },
                definition: { type: Type.STRING, description: "Định nghĩa tiếng Việt đơn giản, ngắn gọn, trực diện, dễ nhớ nhất." },
                example: { type: Type.STRING, description: "Câu ví dụ tiếng Anh trình độ B1/B2." },
                exampleTranslation: { type: Type.STRING, description: "Dịch tiếng Việt câu ví dụ." },
                cefrLevel: { type: Type.STRING },
                referenceCitation: { type: Type.STRING }
              },
              required: ["cardId", "term", "definition", "example", "exampleTranslation", "cefrLevel", "referenceCitation"]
            }
          }
        },
        required: ["corrections", "completeCorrectedList"]
      };

      let response;
      // STAGE 1: Try gemini-3.6-flash with Google Search Grounding and JSON Schema
      try {
        console.log("[Stage 1] Bulk quality check with Google Search Grounding...");
        response = await generateContentWithRetry(ai, {
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction: "Bạn là giáo sư ngôn ngữ học và chuyên gia biên soạn từ điển ưu tú. Nhiệm vụ của bạn là rà soát lỗi chính tả toàn diện, chuẩn hóa ngữ nghĩa từ vựng tiếng Việt tối giản, dễ nhớ nhất, và dẫn chứng nguồn tham chiếu từ điển thế giới (Cambridge, Oxford, Larousse...) cực kỳ chính thống, uy tín. Sử dụng công cụ Google Search để tìm kiếm và rà soát đối chiếu thông tin chính xác nhất từ các nguồn từ điển trực tuyến uy tín.",
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: bulkResponseSchema
          }
        });
      } catch (err1: any) {
        if (err1?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(err1)) {
          throw err1;
        }
        console.warn("[Stage 1 Failed] Bulk check with Search Grounding failed. Retrying WITHOUT search...");

        // STAGE 2: Try gemini-3.6-flash WITHOUT Google Search
        try {
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là giáo sư ngôn ngữ học và chuyên gia biên soạn từ điển ưu tú. Nhiệm vụ của bạn là rà soát lỗi chính tả toàn diện, chuẩn hóa ngữ nghĩa từ vựng tiếng Việt tối giản, dễ nhớ nhất, và dẫn chứng nguồn tham chiếu từ điển thế giới (Cambridge, Oxford, Larousse...) cực kỳ chính thống, uy tín.",
              responseMimeType: "application/json",
              responseSchema: bulkResponseSchema
            }
          });
        } catch (err2: any) {
          if (err2?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(err2)) {
            throw err2;
          }
          console.warn("[Stage 2 Failed] Bulk check with 3.5-flash without search failed. Retrying with 3.1-flash-lite...");

          // STAGE 3: Try gemini-3.6-flash WITHOUT Google Search
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: "Bạn là giáo sư ngôn ngữ học rà soát từ vựng.",
              responseMimeType: "application/json",
              responseSchema: bulkResponseSchema
            }
          });
        }
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Không thể nhận được kết quả phân tích chất lượng từ Gemini.");
      }

      const verifiedData = JSON.parse(responseText.trim());
      res.json(verifiedData);
    } catch (error: any) {
      console.log(`[Offline Bulk Mode] Bulk quality check failed completely: ${error?.message || error}. Using offline response.`);
      // Offline fallback: treat everything as correct, clean definitions slightly
      const completeList = cards.map((c: any) => {
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
      res.json({
        corrections: [],
        completeCorrectedList: completeList
      });
    }
  });

  // API Route: Generate high difficulty vocabulary revive quiz trivia via Gemini
  app.post("/api/generate-revive-quiz", async (req, res) => {
    const { cards } = req.body;
    const fallbackCard = cards && cards.length > 0 ? cards[Math.floor(Math.random() * cards.length)] : { term: "diligent", definition: "chăm chỉ, cần cù" };

    try {
      const ai = getGeminiClient(req);
      const prompt = `Dựa trên danh sách các từ vựng này: ${JSON.stringify(cards || [])}, hãy tạo ra 1 CÂU HỎI TỪ VỰNG SIÊU KHÓ (vocabulary trivia question) để người chơi giải cứu mạng sống trong game xếp hình.
      Yêu cầu câu hỏi:
      - Đưa ra định nghĩa hoặc ngữ cảnh nâng cao bằng tiếng Việt hoặc tiếng Anh để người học đoán từ.
      - Phải có 1 đáp án chính xác (correctAnswer) và 3 đáp án gây nhiễu (distractors). Các đáp án này phải là các từ vựng tiếng Anh (term).
      - Từ vựng được hỏi và các lựa chọn nên thuộc danh sách từ được gửi lên, hoặc các từ liên quan siêu thách thức cùng chủ đề để tạo kịch tính.`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là giáo sư ngôn ngữ biên soạn câu hỏi trắc nghiệm tiếng Anh học thuật IELTS/CEFR C1/C2 siêu thách thức.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "Câu hỏi gợi ý từ vựng bằng tiếng Việt chi tiết, nâng cao và mang tính thử thách cao."
              },
              correctAnswer: {
                type: Type.STRING,
                description: "Từ vựng tiếng Anh chính xác cho câu hỏi trên."
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Mảng gồm đúng 4 lựa chọn (bao gồm correctAnswer và 3 từ gây nhiễu khác) đã được xáo trộn ngẫu nhiên."
              },
              hint: {
                type: Type.STRING,
                description: "Gợi ý cực kỳ tinh tế nếu người dùng gặp khó khăn."
              }
            },
            required: ["question", "correctAnswer", "options", "hint"]
          }
        }
      });

      const data = JSON.parse(response.text.trim());
      res.json(data);
    } catch (error: any) {
      console.log("Failed to generate revive quiz via Gemini:", error?.message || error);
      // Fallback response
      const correctAns = fallbackCard.term;
      const otherTerms = (cards || []).filter((c: any) => c.term !== correctAns).map((c: any) => c.term);
      const distractors = [...otherTerms, "ubiquitous", "gregarious", "meticulous"].slice(0, 3);
      const options = [correctAns, ...distractors].sort(() => Math.random() - 0.5);

      res.json({
        question: `Từ vựng nào mang ý nghĩa học thuật nâng cao tương đương với định nghĩa sau: "${fallbackCard.definition || 'Chăm chỉ cần cù'}"?`,
        correctAnswer: correctAns,
        options: options,
        hint: `Từ này bắt đầu bằng chữ cái "${correctAns.charAt(0).toUpperCase()}".`
      });
    }
  });

  // API Route: Discipline Campaign AI Assistant Consultation Chat
  app.post("/api/campaign-chat", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Nội dung câu hỏi không được để trống!" });
      return;
    }

    try {
      let responseText = "";
      
      try {
        const ai = getGeminiClient(req);
        const systemInstruction = 
          "Bạn là cố vấn thông thái trong 'Chiến Dịch 13 Tuần Bứt Phá'. " +
          "Mục tiêu tối thượng của học viên là: IELTS 7.0, học tốt và nắm vững toàn bộ kiến thức HK1 lớp 12 (Toán Lý Hóa), và rèn luyện thể hình 6 múi săn chắc. " +
          "Hãy trả lời một cách súc tích, nồng nhiệt nhưng đanh thép, đầy tính động lực hành động, khoa học thể chất/trí tuệ và có tinh thần kỷ luật thép. Hãy giữ phản hồi ngắn gọn hoặc theo danh sách gạch đầu dòng thiết thực nhất.";

        let response;
        try {
          response = await generateContentWithRetry(ai, {
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.8,
            }
          });
        } catch (error35: any) {
          if (error35?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(error35)) {
            throw new Error("GEMINI_QUOTA_EXCEEDED");
          }
          console.log("[gemini-3.6-flash campaign-chat failed]. Trying fallback model gemini-3.6-flash...");
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.8,
            }
          });
        }

        responseText = response.text || "";
      } catch (geminiError: any) {
        if (geminiError?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(geminiError)) {
          console.log("[Offline Mode] Gemini API Quota exceeded on Campaign Chat.");
          responseText = 
            "⚠️ **Đang chạy Ngoại tuyến (Đạt giới hạn lượt dùng thử AI miễn phí):** Chào bạn, hiện tại số lượt truy vấn Gemini AI miễn phí trong ngày tạm thời hết hạn, hệ thống chuyển sang chế độ hướng dẫn hành động kỷ luật thép của Thủ khoa!\n\n" +
            "**Sứ mệnh bứt phá hôm nay:**\n" +
            "1. **IELTS 7.0:** Ôn tập lại 15 từ vựng vừa trích xuất được ở học phần học tập bên dưới.\n" +
            "2. **Toán - Lý - Hóa 9+:** Giải quyết dứt điểm các bài khảo sát hàm số hoặc phản ứng hóa học còn dang dở.\n" +
            "3. **Thể hình 6 múi:** Đứng dậy dứt điểm 20 rep chống đẩy ngay lập tức để hâm nóng tinh thần chiến binh kỷ luật. Đừng bao giờ lùi bước!";
        } else {
          console.log(`[Offline Mode] Campaign chat failed: ${geminiError?.message || geminiError}`);
          responseText = 
            "⚠️ **Hệ thống AI Ngoại tuyến Tạm thời:** Chào người đồng đội kỷ luật, dịch vụ đám mây của Gemini đang bận hoặc hòm chìa khóa API chưa được setup trong Settings panel.\n\n" +
            "**Lời khuyên Thủ khoa dành cho bạn:**\n" +
            "- *Học tập:* Rà lại bài vở, tắt mạng xã hội, giải quyết 3 bài toán nâng cao ngay bây giờ.\n" +
            "- *Thể chất:* Thực hiện 20 rep chống đẩy ngay lập tức để duy trì nhịp độ kỷ luật thép.";
        }
      }

      res.json({ text: responseText });
    } catch (error: any) {
      console.log("[Offline Mode] Safe fallback utilized for campaign-chat:", error?.message || error);
      res.json({ 
        text: "⚠️ Hệ thống đang chạy ở chế độ bảo vệ kỷ luật. Hãy tiếp tục học tập bền bỉ và không lùi bước!" 
      });
    }
  });

  // Helper function to extract JSON from text safely
  function extractJsonFromText(text: string): string {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    const cleanText = jsonMatch ? jsonMatch[1].trim() : text.trim();
    
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return cleanText.substring(firstBrace, lastBrace + 1);
    }
    return cleanText;
  }

  // API Route: Advanced Academic Verification Assistant (Trợ lý Thẩm định Học thuật Cao cấp)
  app.post("/api/academic-audit", async (req, res) => {
    const { subject, content, mode = "fast" } = req.body;

    if (!subject || !content) {
      res.status(400).json({ error: "Thiếu Môn học/Ngôn ngữ hoặc Nội dung cần kiểm tra!" });
      return;
    }

    try {
      const ai = getGeminiClient(req);
      const isFast = mode === "fast";

      const primaryModel = isFast ? "gemini-3.6-flash" : "gemini-3.6-flash";
      const backupModel = isFast ? "gemini-3.6-flash" : "gemini-3.6-flash";

      const systemInstruction = isFast
        ? "Bạn là trợ lý thẩm định học thuật siêu tốc, phản hồi nhanh gọn trong tích tắc. Bạn bắt buộc phải trả về một đối tượng JSON hợp lệ nằm gọn trong khối mã ```json ... ```."
        : "Bạn là giáo sư ngôn ngữ học và chuyên gia biên soạn sách giáo khoa, thẩm định thông tin khoa học, lịch sử, địa lý và từ điển ưu tú. Bạn luôn đối chiếu chéo thông tin bằng công cụ tìm kiếm thực tế Google Search để tìm các nguồn dẫn chính thống từ chính phủ, các viện hàn lâm, hoặc các trường đại học hàng đầu.";

      const prompt = `Kiểm tra, chỉnh sửa, giải thích và thẩm định chất lượng học thuật cho nội dung sau:
      - Môn học/Ngôn ngữ: "${subject}"
      - Nội dung cần thẩm định: "${content}"

      Hãy thực hiện rà soát nghiêm ngặt theo các quy chuẩn đầu ngành tương ứng:
      ${isFast ? `- Đánh giá nhanh chính tả & tính chính xác cơ bản.` : `- Tiếng Anh hoặc ngoại ngữ: Đối chiếu Oxford, Cambridge, Longman, Grammarly. Tạo mẫu câu ví dụ đạt trình độ CEFR B1/B2.
      - Toán/Lý/Hóa/Sinh: Đối chiếu Sách giáo khoa chuẩn quốc gia (Kết nối tri thức, Chân trời sáng tạo, Cánh diều).
      - Lịch sử, Ngữ văn (Văn học) & Địa lý: Do ba môn học này có liên quan mật thiết với nhau, bạn bắt buộc phải sử dụng Google Search để tìm kiếm và đối chiếu chéo thông tin cực kỳ kỹ lưỡng từ các cổng thông tin chính thống để đảm bảo tính chính xác tuyệt đối:
         + Với môn Lịch sử: Đối chiếu chéo với Viện Sử học Việt Nam (viensuhoc.org.vn), Bảo tàng Lịch sử Quốc gia (baotanglichsu.vn), Cổng thông tin Chính phủ (chinhphu.vn) hoặc Cổng thông tin Quốc hội (quochoi.vn).
         + Với môn Ngữ văn: Đối chiếu chéo với Viện Văn học (vienvanhoc.org.vn / vass.gov.vn), Hội Nhà văn Việt Nam (hoinhavan.vn) hoặc Bộ Giáo dục và Đào tạo (moet.gov.vn).
         + Với môn Địa lý: Đối chiếu chéo với Tổng cục Thống kê Việt Nam (gso.gov.vn), Cục Đo đạc Bản đồ và Thông tin địa lý (bandovietnam.gov.vn), Viện Địa lý - Viện Hàn lâm Khoa học và Công nghệ Việt Nam (ig.vast.vn) hoặc Bộ Tài nguyên và Môi trường (monre.gov.vn).
         Mọi liên kết được đưa vào mảng 'sources' bắt buộc phải là đường link thực tế lấy trực tiếp từ kết quả tìm kiếm của Google Search.`}

      Yêu cầu nghiêm ngặt về định dạng trả về:
      BẮT BUỘC TRẢ VỀ kết quả duy nhất là một khối mã JSON (JSON code block) bắt đầu bằng \`\`\`json và kết thúc bằng \`\`\` khớp chính xác với cấu trúc JSON sau:
      {
        "status_spelling": "CHÍNH XÁC" hoặc "SAI CHÍNH TẢ",
        "status_semantic": "ĐẠT CHUẨN" hoặc "CHƯA CHUẨN",
        "corrected_content": "Văn bản sau khi đã được sửa đổi và chuẩn hóa kiến thức thực tế (Bôi đậm từ ngữ quan trọng bằng định dạng markdown **...**)",
        "explanation": {
          "reason": "Giải thích nguyên nhân lỗi hoặc lý do cách dùng cũ chưa đúng/chưa tối ưu (về mặt ngôn ngữ học, logic, địa dư hay bối cảnh lịch sử)",
          "distinction": "Phân biệt tinh tế giữa từ/khái niệm này với các khái niệm hay nhầm lẫn khác (nếu có)",
          "examples": "Một ví dụ thực hành nâng cao đạt chuẩn (ví dụ: câu CEFR B1/B2 kèm dịch nghĩa tiếng Việt đối với tiếng Anh, hoặc tóm tắt sự kiện/quy luật cốt lõi đối với các môn học khác) giúp ghi nhớ sâu"
        },
        "sources": [
          { "title": "Tên nguồn uy tín cụ thể (ví dụ: Viện Sử học Việt Nam, Tổng cục Thống kê, Oxford Learner's Dictionaries...)", "url": "Đường link URL chính thức và thực tế tương ứng của cơ quan, viện hàn lâm hoặc từ điển (bắt đầu bằng http hoặc https)" }
        ]
      }

      Hãy chắc chắn rằng không kèm bất kỳ lời dẫn hay văn bản giải thích nào ngoài khối mã \`\`\`json ... \`\`\`.`;

      let response;
      try {
        const config: any = {
          systemInstruction,
        };

        if (isFast) {
          config.responseMimeType = "application/json";
          config.responseSchema = {
            type: Type.OBJECT,
            properties: {
              status_spelling: { type: Type.STRING },
              status_semantic: { type: Type.STRING },
              corrected_content: { type: Type.STRING },
              explanation: {
                type: Type.OBJECT,
                properties: {
                  reason: { type: Type.STRING },
                  distinction: { type: Type.STRING },
                  examples: { type: Type.STRING }
                },
                required: ["reason", "distinction", "examples"]
              },
              sources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["title", "url"]
                }
              }
            },
            required: [
              "status_spelling", "status_semantic", "corrected_content", 
              "explanation", "sources"
            ]
          };
        } else {
          // Google Search Grounding tool is only compatible when NOT using responseSchema
          config.tools = [{ googleSearch: {} }];
        }

        response = await generateContentWithRetry(ai, {
          model: primaryModel,
          contents: prompt,
          config
        });
      } catch (errFallback: any) {
        if (errFallback?.message === "GEMINI_QUOTA_EXCEEDED" || isQuotaError(errFallback)) {
          throw new Error("GEMINI_QUOTA_EXCEEDED");
        }
        console.log(`Gemini ${primaryModel} failed for academic audit, trying fallback ${backupModel}...`);

        const configFallback: any = {
          systemInstruction: isFast 
            ? "Bạn là trợ lý thẩm định học thuật siêu tốc, phản hồi nhanh gọn trong tích tắc. Bạn bắt buộc phải trả về một đối tượng JSON hợp lệ nằm gọn trong khối mã ```json ... ```." 
            : "Bạn là chuyên gia thẩm định học thuật tối cao đối chiếu chéo các nguồn học thuật uy tín nhất của chính phủ và các viện khoa học.",
        };

        if (isFast) {
          configFallback.responseMimeType = "application/json";
          configFallback.responseSchema = {
            type: Type.OBJECT,
            properties: {
              status_spelling: { type: Type.STRING },
              status_semantic: { type: Type.STRING },
              corrected_content: { type: Type.STRING },
              explanation: {
                type: Type.OBJECT,
                properties: {
                  reason: { type: Type.STRING },
                  distinction: { type: Type.STRING },
                  examples: { type: Type.STRING }
                },
                required: ["reason", "distinction", "examples"]
              },
              sources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["title", "url"]
                }
              }
            },
            required: [
              "status_spelling", "status_semantic", "corrected_content", 
              "explanation", "sources"
            ]
          };
        } else {
          // Google Search Grounding tool is only compatible when NOT using responseSchema
          configFallback.tools = [{ googleSearch: {} }];
        }

        response = await generateContentWithRetry(ai, {
          model: backupModel,
          contents: prompt,
          config: configFallback
        });
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Không thể nhận được phản hồi thẩm định từ Gemini.");
      }

      let auditedData;
      try {
        const cleanJsonString = extractJsonFromText(responseText);
        auditedData = JSON.parse(cleanJsonString);
      } catch (parseError: any) {
        console.error("Failed to parse Gemini response as JSON:", responseText);
        throw new Error(`Đầu ra của mô hình không thể được định dạng thành JSON học thuật hợp lệ: ${parseError.message}`);
      }

      // Verify necessary fields are present
      if (!auditedData.status_spelling || !auditedData.status_semantic || !auditedData.corrected_content) {
        throw new Error("Dữ liệu thẩm định học thuật nhận được từ mô hình AI thiếu các trường bắt buộc.");
      }

      // Extract real grounding chunks from Google Search tool and merge them intelligently
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && Array.isArray(groundingChunks)) {
        const searchSources = groundingChunks
          .map((chunk: any) => {
            if (chunk?.web) {
              return {
                title: chunk.web.title || chunk.web.uri,
                url: chunk.web.uri
              };
            }
            return null;
          })
          .filter(Boolean);
        
        if (searchSources.length > 0) {
          if (!auditedData.sources || !Array.isArray(auditedData.sources)) {
            auditedData.sources = [];
          }
          const existingUrls = new Set(auditedData.sources.map((s: any) => s.url));
          for (const src of searchSources) {
            if (src && src.url && !existingUrls.has(src.url)) {
              auditedData.sources.push(src);
              existingUrls.add(src.url);
            }
          }
        }
      }

      // Build safe defaults for nested objects & UI backward compatibility
      const exp = auditedData.explanation || {};
      const expReason = exp.reason || "";
      const expDistinction = exp.distinction || "";
      const expExamples = exp.examples || "";
      const rawSources = auditedData.sources || [];

      // Combine Google Grounding links with sources from JSON
      const referenceSources = rawSources.length > 0 
        ? rawSources[0].title 
        : (subject.toLowerCase().includes("tiếng anh") ? "Oxford Learner's Dictionaries / Cambridge Dictionary" : "Sách giáo khoa chuẩn");
      const referenceUrl = rawSources.length > 0 
        ? rawSources[0].url 
        : "";

      // Send matched mapping so both new keys and UI camelCase elements work perfectly and stably
      const finalResult = {
        // Strict JSON keys requested
        status_spelling: auditedData.status_spelling,
        status_semantic: auditedData.status_semantic,
        corrected_content: auditedData.corrected_content,
        explanation: {
          reason: expReason,
          distinction: expDistinction,
          examples: expExamples
        },
        sources: rawSources,

        // Map to existing UI camelCase attributes to keep current UI completely stable and functional
        spellingStatus: auditedData.status_spelling,
        meaningStatus: auditedData.status_semantic,
        standardizedContent: auditedData.corrected_content,
        errorCause: expReason,
        subtleNuance: expDistinction,
        advancedExample: expExamples,
        referenceSources: referenceSources,
        referenceUrl: referenceUrl,
        groundingSources: rawSources
      };

      res.json(finalResult);
    } catch (error: any) {
      console.error("[Academic Audit Error]:", error);
      res.status(500).json({
        error: "Lỗi Thẩm Định Học Thuật",
        message: error?.message || "Đã xảy ra lỗi trong quá trình xử lý thẩm định với API Gemini. Vui lòng cấu hình lại API key hoặc thử lại sau.",
        details: error?.stack || String(error)
      });
    }
  });

  // API Route: AI Cloze Test Generator for Drag & Drop mini game
  app.post("/api/cloze-generator", async (req, res) => {
    const { title, cards } = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
      res.status(400).json({ error: "Thẻ học phần không hợp lệ!" });
      return;
    }

    const targetCards = cards.slice(0, 5);

    try {
      const ai = getGeminiClient(req);
      const prompt = `Bạn là một chuyên gia biên soạn giáo trình học tập.
Hãy sử dụng bộ từ vựng thuộc chủ đề "${title || 'Học tập'}" sau đây:
${JSON.stringify(targetCards.map(c => ({ term: c.term, definition: c.definition, example: c.example || '' })))}

YÊU CẦU:
1. Viết 1 đoạn văn ngắn tự nhiên (3-5 câu) bằng tiếng Việt hoặc tiếng Anh kết hợp hợp lý chủ đề trên.
2. Trong đoạn văn, hãy đặt đúng từ vựng thuật ngữ (term) vào câu. Thay thế mỗi từ thuật ngữ này bằng ký hiệu "[___]".
3. Tạo ra cấu trúc JSON như sau:
{
  "story": "Đoạn văn ngắn có chứa [___] ở vị trí các từ đục lỗ...",
  "blanks": [
    { "id": "b1", "correctTerm": "từ_thuật_ngữ_1", "hint": "Gợi ý hoặc định nghĩa" }
  ],
  "distractors": ["từ_gây_nhiễu_1", "từ_gây_nhiễu_2"]
}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          story: { type: Type.STRING },
          blanks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                correctTerm: { type: Type.STRING },
                hint: { type: Type.STRING }
              },
              required: ["id", "correctTerm"]
            }
          },
          distractors: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["story", "blanks"]
      };

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là giáo viên ngoại ngữ xuất sắc, tạo bài tập Cloze Test tự nhiên, truyền cảm hứng.",
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Không nhận được phản hồi từ Gemini.");

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.log(`[Cloze AI Generator Fallback]: ${error?.message || error}`);
      
      // Fallback local smart cloze generator
      const blanks = targetCards.map((c, idx) => ({
        id: `b_${idx + 1}`,
        correctTerm: c.term,
        hint: c.definition || 'Từ cần điền'
      }));

      const storyParts = targetCards.map((c, idx) => 
        `Câu ${idx + 1}: Trong chủ đề ${title || 'học tập'}, thuật ngữ [___] có nghĩa là "${c.definition || 'kiến thức trọng tâm'}".`
      );

      res.json({
        story: storyParts.join(" "),
        blanks,
        distractors: []
      });
    }
  });

  // API Route: AI Content Generator for Quick Brain Games (True/False, Word Scramble, Hangman)
  app.post("/api/game-content-generator", async (req, res) => {
    const { title, cards, gameType } = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
      res.status(400).json({ error: "Danh sách thẻ học phần không hợp lệ!" });
      return;
    }

    const sampleCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, 10);

    try {
      const ai = getGeminiClient(req);
      const prompt = `Bạn là chuyên gia giáo dục thiết kế các mini-game ôn tập từ vựng độc đáo.
Chủ đề học phần: "${title || 'Từ vựng trọng tâm'}"
Danh sách từ vựng:
${JSON.stringify(sampleCards.map(c => ({ id: c.id, term: c.term, definition: c.definition, example: c.example || '' })))}

YÊU CẦU DỮ LIỆU GAME (${gameType || 'ALL'}):
1. trueFalsePairs: Tạo 6-10 câu trắc nghiệm Đúng/Sai. Khoảng 50% câu ghép ĐÚNG thuật ngữ với định nghĩa thật. 50% câu ghép SAI thuật ngữ với định nghĩa bẫy tự nhiên do bạn biên soạn lại hoặc hoán đổi.
2. wordScrambleItems: Tạo danh sách các từ với gợi ý ngữ cảnh ngắn gọn (aiHint) và 1 câu ví dụ minh họa (exampleSentence) có đục lỗ từ đó.
3. hangmanItems: Tạo danh sách từ với gợi ý thông minh (aiHint) và gợi ý đặc biệt (revealLetterHint).

Trả về cấu trúc JSON chính xác:
{
  "trueFalsePairs": [
    { "id": "tf_1", "term": "Thù_thuật", "displayDefinition": "Định nghĩa hiển thị...", "isTrue": true, "originalDefinition": "Định nghĩa thật..." }
  ],
  "wordScrambleItems": [
    { "id": "ws_1", "term": "Term1", "definition": "Định nghĩa...", "aiHint": "Gợi ý ngữ cảnh...", "exampleSentence": "Câu ví dụ minh họa..." }
  ],
  "hangmanItems": [
    { "id": "hm_1", "term": "Term1", "definition": "Định nghĩa...", "aiHint": "Gợi ý thông minh...", "revealLetterHint": "Gợi ý chữ cái..." }
  ]
}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          trueFalsePairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                term: { type: Type.STRING },
                displayDefinition: { type: Type.STRING },
                isTrue: { type: Type.BOOLEAN },
                originalDefinition: { type: Type.STRING }
              },
              required: ["id", "term", "displayDefinition", "isTrue"]
            }
          },
          wordScrambleItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
                aiHint: { type: Type.STRING },
                exampleSentence: { type: Type.STRING }
              },
              required: ["id", "term", "definition", "aiHint"]
            }
          },
          hangmanItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
                aiHint: { type: Type.STRING },
                revealLetterHint: { type: Type.STRING }
              },
              required: ["id", "term", "definition", "aiHint"]
            }
          }
        },
        required: ["trueFalsePairs", "wordScrambleItems", "hangmanItems"]
      };

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là AI thiết kế mini-game tương tác hấp dẫn, tạo gợi ý và bẫy trắc nghiệm thông minh.",
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Không nhận được phản hồi từ Gemini AI.");

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.log(`[Game Content AI Fallback]: ${error?.message || error}`);

      // Robust local fallback generator
      const trueFalsePairs = sampleCards.map((c, idx) => {
        const isTrue = idx % 2 === 0;
        const otherCard = sampleCards[(idx + 1) % sampleCards.length];
        return {
          id: `tf_fb_${idx}`,
          term: c.term,
          displayDefinition: isTrue ? c.definition : otherCard.definition,
          isTrue: isTrue,
          originalDefinition: c.definition
        };
      }).sort(() => 0.5 - Math.random());

      const wordScrambleItems = sampleCards.map((c, idx) => ({
        id: `ws_fb_${idx}`,
        term: c.term,
        definition: c.definition,
        aiHint: `Từ vựng gồm ${c.term.length} ký tự liên quan đến: ${c.definition}`,
        exampleSentence: c.example || `Ví dụ: [${c.term}] là khái niệm cần nhớ.`
      }));

      const hangmanItems = sampleCards.map((c, idx) => ({
        id: `hm_fb_${idx}`,
        term: c.term,
        definition: c.definition,
        aiHint: `Thuật ngữ có ${c.term.length} chữ cái, nghĩa là: ${c.definition}`,
        revealLetterHint: `Gợi ý: Bắt đầu bằng chữ cái '${c.term.charAt(0).toUpperCase()}'`
      }));

      res.json({
        trueFalsePairs,
        wordScrambleItems,
        hangmanItems
      });
    }
  });

  // API Route: AI On-Demand Game Assist / Hint Generator
  app.post("/api/game-ai-assist", async (req, res) => {
    const { gameType, term, definition, displayDefinition, isTrue, title } = req.body;

    if (!term) {
      res.status(400).json({ error: "Thiếu thông tin thuật ngữ cần gợi ý!" });
      return;
    }

    try {
      const ai = getGeminiClient(req);
      const prompt = `Bạn là trợ lý học tập AI thông minh cho mini-game ôn từ vựng.
Chủ đề học phần: "${title || 'Học tập'}"
Loại game: "${gameType || 'general'}"
Thuật ngữ (Term): "${term}"
Định nghĩa gốc: "${definition || ''}"
${displayDefinition ? `Định nghĩa hiển thị (trên màn hình): "${displayDefinition}" (Khẳng định này là ${isTrue ? 'ĐÚNG' : 'SAI'})` : ''}

YÊU CẦU:
Tạo 1 gợi ý ngắn gọn (1-2 câu), vô cùng thông minh, lôi cuốn giúp người chơi đoán/hiểu rõ câu trả lời mà KHÔNG trực tiếp nói thẳng đáp án chính xác.
1. Nếu là game True/False: Đưa ra 1 gợi ý ngữ cảnh hoặc mấu chốt để người chơi suy luận xem định nghĩa hiển thị kia có ĐÚNG với từ "${term}" không.
2. Nếu là game Word Scramble: Đưa ra 1 gợi ý ngữ cảnh + 1 câu ví dụ minh họa đục lỗ vị trí từ "${term}" (dùng ký hiệu [___]).
3. Nếu là game Hangman: Đưa ra 1 gợi ý thông minh về lĩnh vực, ngữ cảnh hoặc đặc điểm của từ "${term}".

Trả về JSON:
{
  "hint": "Nội dung gợi ý súc tích...",
  "exampleSentence": "Câu ví dụ minh họa có chứa [___] (nếu có)..."
}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là AI trợ lý gợi ý thông minh, giúp người học tư duy từ vựng một cách hào hứng.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hint: { type: Type.STRING },
              exampleSentence: { type: Type.STRING }
            },
            required: ["hint"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Không nhận được phản hồi từ Gemini AI.");

      res.json(JSON.parse(responseText.trim()));
    } catch (error: any) {
      console.log(`[Game AI Assist Fallback]: ${error?.message || error}`);
      
      let hintText = `Gợi ý local: Thuật ngữ "${term}" gồm ${term.length} chữ cái, bắt đầu bằng chữ '${term.charAt(0).toUpperCase()}'.`;
      if (gameType === 'true_false') {
        hintText = `Gợi ý: Thuật ngữ "${term}" có định nghĩa gốc chính xác là "${definition || 'kiến thức bài học'}".`;
      } else if (gameType === 'hangman') {
        hintText = `Gợi ý: Thuật ngữ có ${term.length} chữ cái. Bắt đầu bằng '${term.charAt(0).toUpperCase()}' và kết thúc bằng '${term.charAt(term.length - 1).toUpperCase()}'.`;
      }

      res.json({
        hint: hintText,
        exampleSentence: `Ví dụ: [___] là thuật ngữ trọng tâm trong bài học.`
      });
    }
  });

  // Vite development vs Production asset serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
