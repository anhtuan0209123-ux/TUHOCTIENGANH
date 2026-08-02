export interface GuideStep {
  title: string;
  detail: string;
  tip?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  codeSnippet?: string;
  tag?: string;
}

export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  badge?: string;
  summary: string;
  highlights?: string[];
  steps?: GuideStep[];
  faqs?: FAQItem[];
  proTip?: string;
}

export interface UserGuideData {
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  lastUpdated: string;
  version: string;
  sections: GuideSection[];
}

export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  
  let videoId = '';
  const youTuBeShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youTuBeShort && youTuBeShort[1]) {
    videoId = youTuBeShort[1];
  } else {
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) {
      videoId = watchMatch[1];
    }
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=0` : url;
}

export const userGuideData: UserGuideData = {
  videoUrl: "https://youtu.be/0aaPbBLhM1Q?si=oXGHvbTXCc_jDNtZ",
  videoTitle: "Video Hướng Dẫn Trực Tiếp - Sử Dụng Ứng Dụng Học Thuộc Thông Minh",
  videoDescription: "Xem video hướng dẫn chi tiết từng bước cách cấu hình API Key, bóc tách tài liệu bài giảng bằng AI, sử dụng các chế độ ôn tập Spaced Repetition và tham gia trò chơi tương tác.",
  lastUpdated: "Tháng 8, 2026",
  version: "v2.5.0",
  sections: [
    {
      id: "overview",
      title: "Tổng quan & Phương pháp luận",
      icon: "BookOpen",
      description: "Giới thiệu nguyên lý ghi nhớ dài hạn, Spaced Repetition vàActive Recall",
      badge: "Nền tảng",
      summary: "Ứng dụng Học Thuộc Thông Minh được thiết kế dựa trên các công trình nghiên cứu khoa học thần kinh về trí nhớ dài hạn (Long-term Memory) và đường cong quên Ebbinghaus (Forgetting Curve).",
      highlights: [
        "Chủ động gợi nhớ (Active Recall): Yêu cầu não bộ tự truy xuất thông tin thay vì đọc thụ động, tăng khả năng khắc sâu kiến thức đến 200%.",
        "Lặp lại ngắt quãng (Spaced Repetition): Tự động tính toán chu kỳ ôn tập để nhắc nhở đúng thời điểm trước khi bạn bắt đầu quên.",
        "Học qua trò chơi (Gamification): Kết hợp các mini-game trí tuệ (Khủng Long Vượt Ải, Sút Penalty, Xếp Gạch) để duy trì động lực học mỗi ngày.",
        "Đa phương thức (Multimodal Learning): Kết hợp phát âm chuẩn (Text-to-Speech), hình ảnh minh họa, ví dụ ngữ cảnh và bài kiểm tra trắc nghiệm."
      ],
      steps: [
        {
          title: "1. Bóc tách & Tạo thẻ bài học",
          detail: "Sử dụng AI để chuyển đổi tài liệu bài giảng, sách giáo khoa hoặc dán văn bản thô thành các thẻ ghi nhớ (Flashcards) có thuật ngữ và định nghĩa chuẩn xác.",
          tip: "Bắt đầu với bộ thẻ từ 10 - 20 thuật ngữ để đạt hiệu quả ghi nhớ cao nhất."
        },
        {
          title: "2. Ôn tập hàng ngày với Chế độ Thẻ ghi nhớ & Học tập",
          detail: "Lật thẻ kiểm tra kiến thức, lắng nghe phát âm và đánh giá mức độ ghi nhớ (Nhớ rõ / Cần ôn lại). Hệ thống sẽ tự ghi nhận tiến độ vào Nhật ký ôn tập.",
          tip: "Sử dụng phím tắt Mũi tên (← →) hoặc Phím Cách (Space) để lật thẻ nhanh chóng trên máy tính."
        },
        {
          title: "3. Thử thách bản thân với Kiểm tra & Trò chơi",
          detail: "Đánh giá trình độ qua các bài thi trắc nghiệm bấm giờ hoặc giải trí lành mạnh với trò chơi Khủng Long Vượt Ải và Sút Penalty Trí Tuệ.",
          tip: "Duy trì Chuỗi Ngày Học (Streak) mỗi ngày để kích hoạt Huy hiệu Phong độ 🔥!"
        }
      ],
      proTip: "Bí quyết học nhanh: Hãy đọc to thuật ngữ và câu ví dụ khi lật thẻ flashcard. Sự kết hợp giữa thị giác và thính giác giúp kích hoạt nhiều vùng não cùng lúc!"
    },
    {
      id: "api-config",
      title: "Hướng dẫn Cấu hình Hệ thống (API Config)",
      icon: "Key",
      description: "Kết nối Google Gemini API Key cá nhân, lưu trữ an toàn & bảo mật",
      badge: "Cấu hình",
      summary: "Ứng dụng hỗ trợ kết nối trực tiếp với Google Gemini AI thông qua API Key cá nhân của bạn, giúp bạn tận hưởng tốc độ xử lý nhanh nhất, không bị giới hạn lưu lượng dùng chung.",
      highlights: [
        "Bảo mật tuyệt đối: Khóa API của bạn được lưu trữ hoàn toàn cục bộ trong trình duyệt (localStorage). Không gửi về bất kỳ máy chủ trung gian nào.",
        "Miễn phí 100%: Google cấp hạn mức miễn phí (Free Tier) rất lớn cho tài khoản Gmail cá nhân.",
        "Linh hoạt: Bạn có thể thay đổi hoặc xóa API Key bất kỳ lúc nào ngay trên thanh công cụ phía trên cùng."
      ],
      steps: [
        {
          title: "Bước 1: Truy cập Google AI Studio",
          detail: "Mở liên kết https://aistudio.google.com/app/apikey trong trình duyệt và đăng nhập bằng tài khoản Gmail cá nhân của bạn.",
          tip: "Nên sử dụng tài khoản Gmail cá nhân thay vì email công ty/trường học để tránh bị giới hạn quyền truy cập từ quản trị viên."
        },
        {
          title: "Bước 2: Tạo API Key mới",
          detail: "Nhấn vào nút 'Create API Key' (Tạo khóa API), chọn dự án mặc định hoặc tạo dự án mới, sau đó sao chép dãy ký tự Key (bắt đầu bằng AIzaSy...)",
          tip: "Hãy giữ kín dãy Key này và không chia sẻ công khai."
        },
        {
          title: "Bước 3: Nhập Key vào ứng dụng",
          detail: "Nhấp vào ô 'Cấu hình API Key' màu xám ở thanh trên cùng của ứng dụng, dán dãy Key vừa sao chép vào và nhấn 'Lưu Key'. Hệ thống sẽ lập tức kiểm tra và kích hoạt biểu tượng Đã kết nối màu xanh.",
          tip: "Nếu bạn chọn xóa Key khỏi trình duyệt, ứng dụng sẽ tự động chuyển sang chế độ AI Server dự phòng."
        }
      ],
      proTip: "Kiểm tra quyền Key: Nếu gặp thông báo 'Permission Denied', hãy tạo một Key mới từ một dự án Google Cloud hoàn toàn mới trên Google AI Studio."
    },
    {
      id: "ai-workflow",
      title: "Quy trình Bóc tách Tài liệu AI (AI Extraction Workflow)",
      icon: "Sparkles",
      description: "Định dạng tài liệu nguồn tối ưu để AI phân tích chính xác 100%",
      badge: "AI Công nghệ",
      summary: "Tính năng Bóc tách Tài liệu AI sử dụng mô hình trí tuệ nhân tạo Gemini 1.5 Flash cao cấp để tự động đọc hiểu văn bản dài, slide thuyết trình hay danh sách ghi chú và bóc tách thành học phần chuẩn.",
      highlights: [
        "Phân tích cụm thuật ngữ ghép: Tự động giữ nguyên các cụm từ chuyên ngành phức tạp (ví dụ: 'Phản ứng xà phòng hóa', 'Deep Neural Network').",
        "Tự động dịch nghĩa & Đặt ví dụ: Tạo định nghĩa tiếng Việt cô đọng, đi kèm câu ví dụ thực tế và bản dịch tương ứng.",
        "Hỗ trợ đa ngôn ngữ & môn học: Dễ dàng bóc tách từ vựng Tiếng Anh, Tiếng Nhật, Tiếng Hàn, Lập trình CNTT, Lịch sử, Địa lý, Luật, Hóa học..."
      ],
      steps: [
        {
          title: "1. Chuẩn bị tài liệu đầu vào",
          detail: "Sao chép đoạn văn bản bài học, danh sách từ vựng thô, nội dung slide hoặc tóm tắt chương sách mà bạn muốn học.",
          tip: "Văn bản càng rõ ràng, các ý được xuống dòng rõ ràng thì AI phân tích càng chính xác."
        },
        {
          title: "2. Chọn Chế độ & Nhập ngữ cảnh",
          detail: "Vào mục 'Bóc tách tài liệu AI'. Dán tài liệu vào ô nội dung, chọn Chuyên ngành/Môn học (Ngoại ngữ, CNTT, Khoa học Tự nhiên, Xã hội) và số lượng thẻ mong muốn (từ 5 đến 30 thẻ).",
          tip: "Bạn cũng có thể chỉ cần nhập tên chủ đề (ví dụ: '30 từ vựng IELTS chủ đề Environment') nếu không có tài liệu thô sẵn."
        },
        {
          title: "3. Duyệt & Tinh chỉnh kết quả",
          detail: "Sau khi AI bóc tách xong, bạn có thể xem trước danh sách thẻ, chỉnh sửa thuật ngữ hoặc định nghĩa chưa vừa ý trước khi nhấn 'Tạo học phần ngay'.",
          tip: "Nhấn nút 'Tạo thêm thẻ bằng AI' nếu bạn muốn bổ sung thêm thuật ngữ vào học phần hiện tại."
        }
      ],
      proTip: "Mẫu dán văn bản hiệu quả: Hãy dùng định dạng dạng danh sách như 'Từ/Thuật ngữ - Định nghĩa' hoặc dán trực tiếp toàn bộ đoạn văn bài báo, AI sẽ tự tìm thuật ngữ quan trọng nhất!"
    },
    {
      id: "features-guide",
      title: "Cẩm nang Tính năng Chuyên sâu",
      icon: "Layers",
      description: "Quản lý Kho bài học, Thư mục, Xuất PDF in ấn & Trò chơi trí tuệ",
      badge: "Tính năng",
      summary: "Khám phá bộ công cụ học tập toàn diện giúp bạn tổ chức tài liệu khoa học, in ấn đề ôn tập và rèn luyện qua các mini-game tương tác.",
      highlights: [
        "Thư mục phân loại thông minh: Gom nhóm các học phần theo Môn học, Học kỳ hoặc Dự án cá nhân.",
        "Xuất PDF & In ấn tiện lợi: Tự động dàn trang in khổ A4 đẹp mắt dạng Danh sách, Bảng từ vựng hoặc Phiếu kiểm tra.",
        "Nhật ký ôn tập (Review Logs): Tự động lưu lịch sử lật thẻ, số câu trả lời đúng/sai để phân tích thuật ngữ khó.",
        "3 Chế độ Trò chơi Độc đáo: Xếp Gạch Hồi Sinh (Block Game), Khủng Long Vượt Ải (Dino Runner), Sút Penalty Trí Tuệ (Soccer Shootout)."
      ],
      steps: [
        {
          title: "Tạo Thư mục & Phân loại bài học",
          detail: "Chuyển sang tab 'Thư mục phân loại', nhấn 'Tạo thư mục mới' và thêm các học phần tương ứng vào thư mục. Giúp trang chủ luôn gọn gàng ngăn nắp.",
          tip: "Bạn có thể ghim các học phần quan trọng vào danh sách 'Yêu thích' bằng biểu tượng Ngôi sao ⭐."
        },
        {
          title: "Xuất file PDF đề in",
          detail: "Mở một học phần bất kỳ, chọn 'Xuất PDF (In ấn)'. Bạn có thể tùy chọn ẩn định nghĩa để tự điền bằng tay hoặc in kèm câu ví dụ.",
          tip: "Rất phù hợp để mang theo học tranh thủ khi không có kết nối internet."
        },
        {
          title: "Luyện tập với Mini-game Trí tuệ",
          detail: "Chuyển sang các chế độ trò chơi trực tiếp từ thẻ học phần. Mọi câu trả lời đúng đều giúp bạn ghi điểm và mở khóa các chặng đua mới.",
          tip: "Trong game Khủng Long Vượt Ải, khi gặp câu trả lời sai bạn sẽ được thử thách bài thi hồi sinh để tiếp tục cuộc hành trình!"
        }
      ],
      proTip: "Theo dõi Chuỗi Ngày (Streak): Học ít nhất 1 bài mỗi ngày để giữ vững ngọn lửa phong độ. Biểu tượng ngọn lửa 🔥 trên thanh tiêu đề sẽ đổi màu sáng rực rỡ!"
    },
    {
      id: "troubleshooting",
      title: "Biện pháp Xử lý Sự cố & FAQs",
      icon: "AlertTriangle",
      description: "Tra cứu lỗi kỹ thuật phổ biến, sửa lỗi API Key & cách khắc phục",
      badge: "Trợ giúp",
      summary: "Tổng hợp các câu hỏi thường gặp và giải pháp xử lý sự cố kỹ thuật giúp trải nghiệm học tập của bạn không bị gián đoạn.",
      highlights: [
        "Tra cứu mã lỗi nhanh chóng bằng thanh tìm kiếm.",
        "Hướng dẫn khôi phục dữ liệu mẫu ban đầu nếu gặp sự cố giao diện.",
        "Giải thích chi tiết các mã lỗi API Google Gemini."
      ],
      faqs: [
        {
          question: "Lỗi 'Permission Denied' hoặc 'API Key không hợp lệ' là gì và khắc phục thế nào?",
          answer: "Lỗi này xuất hiện khi API Key bị sai ký tự, bị vô hiệu hóa hoặc dự án trên Google AI Studio chưa bật API. Khắc phục: Vào aistudio.google.com/app/apikey, tạo một Key mới từ một Gmail cá nhân khác, sau đó dán lại vào ứng dụng.",
          tag: "API Error"
        },
        {
          question: "Lỗi 'GEMINI_QUOTA_EXCEEDED' hoặc '429 Too Many Requests' xử lý ra sao?",
          answer: "Đây là lỗi vượt quá giới hạn số lượt gọi API trong 1 phút của Google. Giải pháp: Đợi khoảng 30 - 60 giây rồi thử lại, hoặc nhập API Key cá nhân của bạn vào thanh cấu hình ở trên cùng để sử dụng hạn mức riêng biệt.",
          tag: "Quota Limit"
        },
        {
          question: "Dữ liệu học phần của tôi được lưu ở đâu? Có bị mất khi tắt trình duyệt không?",
          answer: "Toàn bộ học phần, thư mục và tiến độ học được lưu an toàn trong Bộ nhớ cục bộ (localStorage) của trình duyệt. Dữ liệu sẽ giữ nguyên khi bạn tắt máy hay đóng trình duyệt. Tuy nhiên, nếu bạn xóa bộ nhớ tạm (Clear Browsing Data) trình duyệt, dữ liệu có thể bị xóa.",
          tag: "Data Storage"
        },
        {
          question: "Làm sao để khôi phục lại các bài học mẫu ban đầu của ứng dụng?",
          answer: "Ở thanh tiêu đề góc trên bên phải, nhấn nút 'Đặt lại mẫu mặc định'. Ứng dụng sẽ tái tạo lại đầy đủ các học phần từ vựng Tiếng Anh, Lập trình, Lịch sử, Hóa học mẫu ban đầu.",
          tag: "Reset App"
        },
        {
          question: "Ứng dụng có chạy được trên điện thoại di động và máy tính bảng không?",
          answer: "Có! Giao diện được thiết kế Responsive tối ưu cho mọi kích thước màn hình từ điện thoại, máy tính bảng đến laptop/PC. Trên di động bạn có thể vuốt ngón tay để lật thẻ flashcard dễ dàng.",
          tag: "Mobile UI"
        }
      ],
      proTip: "Cần hỗ trợ thêm? Bạn có thể gửi phản hồi trực tiếp cho đội ngũ phát triển hoặc tải lại trang nếu ứng dụng có hiện tượng không phản hồi."
    }
  ]
};
