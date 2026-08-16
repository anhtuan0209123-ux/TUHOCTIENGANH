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
  videoUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
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
  videoUrl: "https://youtu.be/Ou3o2sTXiEU",
  videoTitle: "Video Hướng Dẫn - Tổng Quan Trang Web",
  videoDescription: "Xem video hướng dẫn tổng quan giao diện và cách khai thác tối đa ứng dụng học thuộc thông minh.",
  lastUpdated: "Tháng 8, 2026",
  version: "v2.5.0",
  sections: [
    {
      id: "overview",
      title: "Tổng quan trang web",
      icon: "BookOpen",
      description: "Giới thiệu tổng quan giao diện, tính năng & phương pháp học tập",
      badge: "Nền tảng",
      videoUrl: "https://youtu.be/Ou3o2sTXiEU",
      videoTitle: "Video Hướng Dẫn - Tổng Quan Trang Web",
      videoDescription: "Xem video hướng dẫn tổng quan giao diện và cách khai thác tối đa ứng dụng học thuộc thông minh.",
      summary: "Ứng dụng Học Thuộc Thông Minh giúp bạn nâng cao hiệu quả ghi nhớ bằng phương pháp lặp lại ngắt quãng (Spaced Repetition), chủ động gợi nhớ (Active Recall) và bóc tách bài giảng bằng trí tuệ nhân tạo.",
      highlights: [
        "Chủ động gợi nhớ (Active Recall): Yêu cầu não bộ tự truy xuất thông tin thay vì đọc thụ động, tăng khả năng khắc sâu kiến thức.",
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
          detail: "Lật thẻ kiểm tra kiến thức, lắng nghe phát âm và đánh giá mức độ ghi nhớ. Hệ thống sẽ tự ghi nhận tiến độ vào Nhật ký ôn tập.",
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
      id: "ai-features",
      title: "Trí tuệ nhân tạo (Gemini AI)",
      icon: "Sparkles",
      description: "Khám phá các tính năng phân tích, giải thích lỗi sai & gợi ý thông minh từ Gemini AI",
      badge: "AI Tự động",
      videoUrl: "https://youtu.be/Ou3o2sTXiEU",
      videoTitle: "Video Hướng Dẫn Tính Năng AI Thông Minh",
      videoDescription: "Tìm hiểu cách hệ thống AI tự động bóc tách tài liệu bài giảng, đặt câu ví dụ và giải thích lỗi sai chi tiết.",
      summary: "Hệ thống tích hợp sẵn mô hình Google Gemini AI thế hệ mới trên máy chủ đám mây bảo mật cao, hoạt động 100% tự động mà không yêu cầu bạn phải cấu hình hay nhập mã API Key.",
      highlights: [
        "Tự động hoàn toàn: Máy chủ đám mây đã tích hợp sẵn Gemini AI tốc độ cao, sẵn sàng phục vụ học tập 24/7.",
        "Bóc tách thông minh: Chuyển đổi văn bản, tài liệu bài giảng thô thành bộ thẻ ghi nhớ hoàn chỉnh chỉ trong vài giây.",
        "Giải thích chuyên sâu: Tự động phân tích ngữ cảnh, giải thích khi bạn chọn sai đáp án và cung cấp 3 câu ví dụ thực tế.",
        "Bảo mật tuyệt đối: Dữ liệu cá nhân được phân tách an toàn theo tài khoản Gmail của bạn."
      ],
      steps: [
        {
          title: "1. Bóc tách tài liệu bài giảng với Smart Parser",
          detail: "Vào mục 'Bóc tách bài giảng AI' ở thanh trên cùng, dán đoạn văn bản hoặc ghi chú của bạn để AI tự động trích xuất các thuật ngữ và định nghĩa chuẩn xác.",
          tip: "AI tự động giữ nguyên vẹn cụm thuật ngữ ghép chuyên ngành (IELTS, CNTT, Hóa học, Lịch sử...)."
        },
        {
          title: "2. Học tập thích ứng & Giải thích lỗi sai",
          detail: "Khi làm bài kiểm tra hoặc luyện tập trắc nghiệm, nếu bạn trả lời sai, hệ thống AI sẽ ngay lập tức cung cấp phân tích sư phạm và 3 câu ví dụ thực tế.",
          tip: "Đọc kỹ phần giải thích chi tiết để nắm vững bản chất khái niệm và không lặp lại lỗi sai."
        },
        {
          title: "3. Tự động sinh thêm thẻ học liên quan",
          detail: "Trong chế độ Luyện tập liên tục, AI sẽ liên tục đề xuất các từ vựng mới có liên quan mật thiết để mở rộng vốn hiểu biết của bạn.",
          tip: "Ôn tập đều đặn mỗi ngày để duy trì chuỗi học tập (Streak 🔥) liên tục!"
        }
      ],
      proTip: "Bí quyết học tập: Tận dụng tính năng AI giải thích để hiểu sâu bản chất thay vì chỉ học vẹt định nghĩa ngắn!"
    }
  ]
};
