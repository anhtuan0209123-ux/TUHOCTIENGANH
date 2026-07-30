import { StudySet } from './types';

export const presetStudySets: StudySet[] = [
  {
    id: 'preset-chemistry-basic',
    title: '📐 Hóa Học Cơ Bản & Khái Niệm Tự Nhiên',
    description: 'Nắm vững các phản ứng và khái niệm hóa học cốt lõi trong chương trình phổ thông và đại học.',
    createdAt: new Date('2026-06-01').toISOString(),
    favorite: true,
    isGenerated: false,
    category: 'stem',
    cards: [
      {
        id: 'chem-1',
        term: 'Phản ứng xà phòng hóa',
        definition: 'Phản ứng thủy phân chất béo trong môi trường kiềm (dung dịch NaOH hoặc KOH) tạo ra xà phòng và glycerol.',
        example: 'Saponification of fats creates soap molecules with hydrophilic and hydrophobic ends.',
        exampleTranslation: 'Phản ứng xà phòng hóa chất béo tạo ra các phân tử xà phòng có đầu ưa nước và đầu kỵ nước.'
      },
      {
        id: 'chem-2',
        term: 'Cân bằng hóa học',
        definition: 'Trạng thái của phản ứng thuận nghịch khi tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch.',
        example: 'Chemical equilibrium changes when temperature or pressure is altered.',
        exampleTranslation: 'Cân bằng hóa học thay đổi khi nhiệt độ hoặc áp suất biến đổi.'
      },
      {
        id: 'chem-3',
        term: 'Liên kết cộng hóa trị',
        definition: 'Liên kết hóa học được hình thành giữa các nguyên tử bằng một hay nhiều cặp electron dùng chung.',
        example: 'Covalent bonds hold hydrogen and oxygen atoms together in water molecules.',
        exampleTranslation: 'Liên kết cộng hóa trị gắn kết các nguyên tử hydro và oxy trong phân tử nước.'
      },
      {
        id: 'chem-4',
        term: 'Phản ứng trùng hợp',
        definition: 'Quá trình kết hợp nhiều phân tử nhỏ (monome) giống nhau hay tương tự nhau thành phân tử lớn (polime).',
        example: 'Polymerization of ethylene produces polyethylene plastics.',
        exampleTranslation: 'Trùng hợp etylen tạo ra nhựa phế thải polyetylen.'
      }
    ]
  },
  {
    id: 'preset-ai-programming',
    title: '💻 Khái Niệm AI & Lập Trình CNTT',
    description: 'Bộ thẻ khái niệm cốt lõi về Machine Learning, Deep Learning, React Hooks và thuật toán CNTT.',
    createdAt: new Date('2026-06-02').toISOString(),
    favorite: true,
    isGenerated: false,
    category: 'tech',
    cards: [
      {
        id: 'ai-1',
        term: 'Deep Learning',
        definition: 'Học sâu - Nhánh của Machine Learning dựa trên mạng thần kinh nhân tạo (Neural Networks) nhiều lớp.',
        example: 'Deep Learning powers modern image recognition and natural language models.',
        exampleTranslation: 'Học sâu vận hành các mô hình nhận diện hình ảnh và xử lý ngôn ngữ hiện đại.'
      },
      {
        id: 'ai-2',
        term: 'Computer Vision',
        definition: 'Thị giác máy tính - Lĩnh vực giúp máy tính thu nhận, phân tích và xử lý thông tin từ hình ảnh/video.',
        example: 'Self-driving cars rely heavily on Computer Vision to detect obstacles.',
        exampleTranslation: 'Xe tự lái phụ thuộc rất lớn vào Thị giác máy tính để phát hiện chướng ngại vật.'
      },
      {
        id: 'ai-3',
        term: 'Natural Language Processing',
        definition: 'Xử lý ngôn ngữ tự nhiên (NLP) - Công nghệ giúp máy tính thấu hiểu, phân tích và tương tác bằng ngôn ngữ con người.',
        example: 'Chatbots use Natural Language Processing to converse with users naturally.',
        exampleTranslation: 'Trợ lý ảo sử dụng Xử lý ngôn ngữ tự nhiên để trò chuyện tự nhiên với người dùng.'
      },
      {
        id: 'ai-4',
        term: 'React Hooks',
        definition: 'Các hàm đặc biệt trong React cho phép sử dụng state và các tính năng lifecycle mà không cần viết class.',
        example: 'useState and useEffect are the most common React Hooks.',
        exampleTranslation: 'useState và useEffect là những React Hooks phổ biến nhất.'
      }
    ]
  },
  {
    id: 'preset-vietnam-history',
    title: '📖 Lịch Sử Việt Nam & Cột Mốc Mới',
    description: 'Các mốc lịch sử hào hùng và sự kiện trọng đại trong lịch sử dựng nước và giữ nước.',
    createdAt: new Date('2026-06-03').toISOString(),
    favorite: true,
    isGenerated: false,
    category: 'social',
    cards: [
      {
        id: 'hist-1',
        term: 'Chiến thắng Bạch Đằng 938',
        definition: 'Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng, chấm dứt hơn 1000 năm Bắc thuộc mở ra kỷ nguyên độc lập.',
        example: 'The Battle of Bach Dang River in 938 ended centuries of Chinese domination.',
        exampleTranslation: 'Trận chiến sông Bạch Đằng năm 938 đã chấm dứt nhiều thế kỷ Bắc thuộc.'
      },
      {
        id: 'hist-2',
        term: 'Chiến dịch Hồ Chí Minh',
        definition: 'Chiến dịch quân sự đỉnh cao giải phóng hoàn toàn miền Nam, thống nhất đất nước ngày 30/4/1975.',
        example: 'The Ho Chi Minh Campaign reunited the nation in April 1975.',
        exampleTranslation: 'Chiến dịch Hồ Chí Minh đã thống nhất đất nước vào tháng 4 năm 1975.'
      },
      {
        id: 'hist-3',
        term: 'Chiến thắng Điện Biên Phủ 1954',
        definition: 'Chiến thắng lừng lẫy năm châu, chấn động địa cầu, buộc thực dân Pháp ký Hiệp định Giơ-ne-vơ.',
        example: 'Dien Bien Phu victory led directly to the Geneva Accords in 1954.',
        exampleTranslation: 'Chiến thắng Điện Biên Phủ trực tiếp dẫn đến Hiệp định Giơ-ne-vơ năm 1954.'
      },
      {
        id: 'hist-4',
        term: 'Cách mạng Tháng Tám 1945',
        definition: 'Cuộc tổng khởi nghĩa giành chính quyền thành công, dẫn tới Lễ Tuyên ngôn Độc lập Khai sinh nước VNDCCH ngày 2/9/1945.',
        example: 'The August Revolution paved the way for the founding of the modern Republic.',
        exampleTranslation: 'Cách mạng Tháng Tám đã mở đường cho sự ra đời của nước Cộng hòa hiện đại.'
      }
    ]
  },
  {
    id: 'preset-ielts-vocab',
    title: '🇬🇧 Từ Vựng IELTS Môi Trường',
    description: 'Các cụm từ vựng nâng cao chuyên dùng cho bài đọc và viết chủ đề Môi trường & Khí hậu.',
    createdAt: new Date('2026-06-04').toISOString(),
    favorite: false,
    isGenerated: false,
    category: 'languages',
    cards: [
      {
        id: 'ielts-1',
        term: 'Deforestation',
        definition: 'Sự phá rừng, tàn phá rừng diện rộng mở đường cho canh tác hoặc phát triển đô thị.',
        example: 'Deforestation is a major contributor to global climate change.',
        exampleTranslation: 'Sự tàn phá rừng là một nguyên nhân chính dẫn đến biến đổi khí hậu toàn cầu.'
      },
      {
        id: 'ielts-2',
        term: 'Biodiversity',
        definition: 'Đa dạng sinh học, sự phong phú và đa dạng của các loài sinh vật trong một hệ sinh thái.',
        example: 'The rain forest has a high level of biodiversity.',
        exampleTranslation: 'Rừng mưa nhiệt đới có mức độ đa dạng sinh học rất cao.'
      },
      {
        id: 'ielts-3',
        term: 'Greenhouse gas',
        definition: 'Khí nhà kính (ví dụ: CO2, methane) giữ nhiệt lượng của mặt trời lại trong khí quyển làm trái đất nóng lên.',
        example: 'Governments are trying to limit greenhouse gas emissions.',
        exampleTranslation: 'Các chính phủ đang cố gắng hạn chế lượng phát thải khí nhà kính.'
      }
    ]
  }
];
