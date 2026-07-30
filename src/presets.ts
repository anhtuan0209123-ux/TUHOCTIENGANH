import { StudySet } from './types';

export const presetStudySets: StudySet[] = [
  {
    id: 'preset-ielts-vocab',
    title: 'Từ vựng IELTS Chủ Đề Môi Trường',
    description: 'Các từ vựng nâng cao cực kỳ quan trọng cho phần thi Climate Change, Pollution & Conservation.',
    createdAt: new Date('2026-06-01').toISOString(),
    favorite: true,
    isGenerated: false,
    cards: [
      {
        id: 'ielts-1',
        term: 'Deforestation',
        definition: 'Sự phá rừng, tàn phá rừng diện rộng mở đường cho canh tác hoặc xây dựng.',
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
        term: 'Devastating',
        definition: 'Tàn phá, gây ra thiệt hại cực kỳ nghiêm trọng.',
        example: 'The hurricane had a devastating effect on the coastal defense system.',
        exampleTranslation: 'Cơn bão tàn khốc đã gây ra ảnh hưởng tàn phá đối với hệ thống phòng thủ ven biển.'
      },
      {
        id: 'ielts-4',
        term: 'Eco-friendly',
        definition: 'Thân thiện với môi trường, không làm hại môi trường tự nhiên.',
        example: 'Developing eco-friendly products is a high priority for modern brands.',
        exampleTranslation: 'Phát triển sản phẩm thân thiện với môi trường là ưu tiên hàng đầu của các thương hiệu hiện đại.'
      },
      {
        id: 'ielts-5',
        term: 'Greenhouse gas',
        definition: 'Khí nhà kính (ví dụ: CO2, methane) giữ nhiệt lượng của mặt trời lại trong khí quyển.',
        example: 'Governments are trying to limit greenhouse gas emissions from industrial zones.',
        exampleTranslation: 'Các chính phủ đang cố gắng hạn chế lượng phát thải khí nhà kính từ các khu công nghiệp.'
      },
      {
        id: 'ielts-6',
        term: 'Conservation',
        definition: 'Sự bảo tồn động thực vật hoang dã hay các nguồn tài nguyên thiên nhiên.',
        example: 'The charity is dedicated to the conservation of ancient wetlands.',
        exampleTranslation: 'Tổ chức từ thiện này tận tụy cho công cuộc bảo tồn các vùng đất ngập nước cổ xưa.'
      },
      {
        id: 'ielts-7',
        term: 'Mitigate',
        definition: 'Giảm thiểu, làm giảm bớt mức độ nghiêm trọng hay tác hại của một vấn đề.',
        example: 'We must plant more trees to mitigate emissions of carbon dioxide.',
        exampleTranslation: 'Chúng ta phải trồng nhiều cây hơn để giảm thiểu lượng khí thải carbon dioxide.'
      }
    ]
  },
  {
    id: 'preset-react-hooks',
    title: 'React Hooks Core Principles',
    description: 'Khái niệm và ứng dụng thực tiễn của React Hooks cơ bản trong phát triển frontend.',
    createdAt: new Date('2026-06-02').toISOString(),
    favorite: false,
    isGenerated: false,
    cards: [
      {
        id: 'react-1',
        term: 'useState',
        definition: 'Hook dùng để lưu trữ trạng thái cục bộ (local state) của một functional component.',
        example: 'const [count, setCount] = useState<number>(0);',
        exampleTranslation: 'Khai báo một biến trạng thái count có giá trị khởi tạo bằng 0.'
      },
      {
        id: 'react-2',
        term: 'useEffect',
        definition: 'Hook thực thi side-effects (lấy API, đăng ký event, v.v.). Chạy sau khi component render xong.',
        example: 'useEffect(() => { console.log("Mounted"); return () => cleanup(); }, []);',
        exampleTranslation: 'Thực thi hàm callback khi component vừa gắn (mount) vào cây DOM.'
      },
      {
        id: 'react-3',
        term: 'useContext',
        definition: 'Hook đọc dữ liệu từ một Context Object để chia sẻ dữ liệu toàn cục mà không cần truyền prop-drilling.',
        example: 'const theme = useContext(ThemeContext);',
        exampleTranslation: 'Lấy trực tiếp giá trị giao diện theme từ Context mà không cần truyền qua props.'
      },
      {
        id: 'react-4',
        term: 'useMemo',
        definition: 'Hook ghi nhớ một giá trị đã tính toán để tránh tính toán lại vô ích vào mỗi lần render.',
        example: 'const memoizedValue = useMemo(() => expensiveFunction(a), [a]);',
        exampleTranslation: 'Ghi nhớ kết quả tính toán phức tạp dựa trên biến phụ thuộc a.'
      },
      {
        id: 'react-5',
        term: 'useRef',
        definition: 'Hook lưu trữ một reference có thể thay đổi nhưng không trigger re-render component khi giá trị thay đổi.',
        example: 'const inputRef = useRef<HTMLInputElement>(null);',
        exampleTranslation: 'Tạo một tham chiếu đến phần tử ô nhập liệu input trong DOM.'
      }
    ]
  },
  {
    id: 'preset-capitals',
    title: 'Thủ Đô Các Quốc Gia Trực Quan',
    description: 'Kiểm tra nhanh kiến thức địa lý thế giới với danh sách thủ đô của các nước phát triển.',
    createdAt: new Date('2026-06-03').toISOString(),
    favorite: false,
    isGenerated: false,
    cards: [
      {
        id: 'cap-1',
        term: 'Việt Nam',
        definition: 'Thủ đô là Hà Nội (nổi tiếng với hồ Hoàn Kiếm, văn hóa ngàn năm văn hiến).',
        example: 'Hanoi is the historic and political capital of Vietnam.',
        exampleTranslation: 'Hà Nội là thủ đô lịch sử và chính trị của Việt Nam.'
      },
      {
        id: 'cap-2',
        term: 'Nhật Bản',
        definition: 'Thủ đô là Tokyo (một siêu đô thị nhộn nhịp, sự kết hợp giữa truyền thống và tương lai).',
        example: 'Tokyo is the heart of Japanese economy and culture.',
        exampleTranslation: 'Tokyo là trái tim của nền kinh tế và văn hóa Nhật Bản.'
      },
      {
        id: 'cap-3',
        term: 'Anh Quốc (United Kingdom)',
        definition: 'Thủ đô là London (có tháp Big Ben, sông Thames thơ mộng và lịch sử hoàng gia lâu đời).',
        example: 'London boasts magnificent historical landmarks.',
        exampleTranslation: 'London tự hào có nhiều danh lam thắng cảnh lịch sử tráng lệ.'
      },
      {
        id: 'cap-4',
        term: 'Pháp (France)',
        definition: 'Thủ đô là Paris (kinh đô ánh sáng, nổi tiếng với tháp Eiffel và bảo tàng Louvre).',
        example: 'Paris is synonymous with art, design, and romanticism.',
        exampleTranslation: 'Paris là biểu tượng của nghệ thuật, thiết kế và sự lãng mạn.'
      },
      {
        id: 'cap-5',
        term: 'Úc (Australia)',
        definition: 'Thủ đô là Canberra (Được chọn làm giải pháp trung hòa giữa mâu thuẫn tranh đoạt của Sydney và Melbourne).',
        example: 'Canberra was systematically planned as Australia’s federal capital.',
        exampleTranslation: 'Canberra được quy hoạch một cách hệ thống để làm thủ đô liên bang của Úc.'
      }
    ]
  }
];
