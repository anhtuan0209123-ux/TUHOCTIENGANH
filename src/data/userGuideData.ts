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
      id: "api-config",
      title: "Hướng dẫn Cấu hình Hệ thống (API Config)",
      icon: "Key",
      description: "Kết nối Google Gemini API Key cá nhân, lưu trữ an toàn & bảo mật",
      badge: "Cấu hình",
      videoUrl: "https://youtu.be/wPJW5DfC4RE",
      videoTitle: "Video Hướng Dẫn Cấu Hình Kết Nối Google Gemini API Key",
      videoDescription: "Xem video hướng dẫn từng bước chi tiết cách lấy Google Gemini API Key từ Google AI Studio và cấu hình kết nối an toàn trực tiếp trên ứng dụng.",
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
    }
  ]
};
