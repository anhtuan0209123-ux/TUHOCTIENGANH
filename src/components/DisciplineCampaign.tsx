import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Sparkles, Flame, Clock, Award, Shield, 
  Gamepad2, Calendar, BookOpen, User, Zap, Send, Play, Square, 
  RotateCcw, Activity, Key, CheckCircle2, ChevronRight, MessageSquare, BrainCircuit,
  Plus, Trash, Edit3, ExternalLink, LogOut, RefreshCw
} from 'lucide-react';
import { 
  initCalendarAuth, 
  googleSignIn, 
  logoutCalendar, 
  syncTasksToGoogleCalendar,
} from '../utils/googleCalendar';
import { User as FirebaseUser } from 'firebase/auth';

interface Task {
  id: string;
  time: string;
  task: string;
}

const weeklyScheduleRaw: Record<number, Omit<Task, 'id'>[]> = {
  1: [
    { time: "05:00 - 06:15", task: "Thức dậy, uống nước, học 30 từ vựng IELTS (Chủ đề Education)" },
    { time: "06:45 - 11:30", task: "Học trên lớp: Tập trung nghe giảng Toán Hình giải tích không gian" },
    { time: "14:00 - 16:30", task: "Tự học Lý Chương 1: Giải 20 bài tập con lắc lò xo nâng cao" },
    { time: "17:15 - 18:30", task: "Gym: Tập Ngực - Tay sau + Cardio 15 phút đốt mỡ" },
    { time: "20:00 - 22:30", task: "Luyện đề IELTS Listening & Reading (Cam 18 Test 1) + Sửa chi tiết" }
  ],
  2: [
    { time: "05:00 - 06:15", task: "Học từ vựng IELTS & Đọc 1 bài báo trên The Economist" },
    { time: "06:45 - 11:30", task: "Học trên lớp + Tranh thủ làm bài tập Hóa học polime" },
    { time: "14:00 - 16:30", task: "Tự học Toán Đơn điệu hàm số chứa tham số m" },
    { time: "17:15 - 18:30", task: "Calisthenics: Kéo xà đơn (Pull-up), chống đẩy (Push-up) cơ bụng" },
    { time: "20:00 - 22:30", task: "Viết 1 bài IELTS Writing Task 2 + Tự sửa theo bài mẫu 8.0" }
  ],
  3: [
    { time: "05:00 - 06:15", task: "Nghe Podcast BBC 30 phút + Ôn tập từ vựng cũ" },
    { time: "06:45 - 11:30", task: "Học trên lớp: Chú ý ghi nhớ phần phản ứng este hóa" },
    { time: "14:00 - 16:30", task: "Tự học Lý: Dòng điện xoay chiều bài toán đồ thị" },
    { time: "17:15 - 18:30", task: "Gym: Tập Lưng - Xô - Tay trước (Thúc đẩy cơ v-taper)" },
    { time: "20:00 - 22:30", task: "Học ngữ pháp nâng cao (Inversion, Cleft sentences) áp dụng vào viết" }
  ],
  4: [
    { time: "05:00 - 06:15", task: "Học từ vựng IELTS (Chủ đề Environment & Technology)" },
    { time: "06:45 - 11:30", task: "Học trên lớp + Ôn tập công thức Logarit" },
    { time: "14:00 - 16:30", task: "Tự học Hóa: Hoàn thành chuỗi phản ứng Cacbohidrat" },
    { time: "17:15 - 18:30", task: "Chạy bộ công viên 5km cải thiện sức bền tim mạch" },
    { time: "20:00 - 22:30", task: "Luyện Nói IELTS Speaking Part 1 & 2 trước gương + Ghi âm" }
  ],
  5: [
    { time: "05:00 - 06:15", task: "Đọc tài liệu IELTS Ideas bổ sung luận điểm cho Writing" },
    { time: "06:45 - 11:30", task: "Học trên lớp + Hoàn thành hết bài tập trong tuần" },
    { time: "14:00 - 16:30", task: "Tổng ôn kiến thức Toán Lý Hóa mục tiêu đạt 9+ trên lớp" },
    { time: "17:15 - 18:30", task: "Gym: Tập Chân - Vai + Gập bụng HIIT" },
    { time: "20:00 - 22:30", task: "Luyện đề thi thử Đọc - Nghe nâng cao tính thời gian" }
  ],
  6: [
    { time: "06:00 - 07:30", task: "Thức dậy muộn hơn một chút, thiền 15 phút, đọc sách phát triển bản thân" },
    { time: "08:30 - 11:30", task: "Luyện đề thi thử IELTS Full Test (Nghe, Đọc, Viết) áp lực phòng thi" },
    { time: "14:30 - 17:00", task: "Phân tích lỗi sai đề IELTS buổi sáng, tra từ vựng lạ" },
    { time: "17:30 - 19:00", task: "Đạp xe thư giãn hoặc bơi lội thả lỏng cơ bắp" },
    { time: "20:00 - 22:00", task: "Xem phim tiếng Anh phụ đề Anh ngữ để học tiếng Anh thực tế" }
  ],
  7: [
    { time: "06:30 - 08:00", task: "Chạy bộ nhẹ nhàng, tận hưởng không khí sáng Chủ Nhật" },
    { time: "09:00 - 11:30", task: "Dọn dẹp không gian phòng học, sắp xếp sách vở ngăn nắp" },
    { time: "14:30 - 16:30", task: "Sơ đồ tư duy lại toàn bộ kiến thức Toán Lý Hóa đã nạp trong tuần" },
    { time: "17:00 - 18:30", task: "Chuẩn bị đồ ăn lành mạnh (Eat clean) sẵn cho tuần mới" },
    { time: "19:30 - 21:00", task: "Review lại hiệu suất tuần cũ, lên dây cót tinh thần tuần mới" }
  ]
};

const roadmaps = {
  ielts: [
    { week: "Tuần 1 - 3", detail: "Cày nát 4000 từ vựng cốt lõi, làm quen mọi dạng đề Cam 15-16." },
    { week: "Tuần 4 - 6", detail: "Nâng cao kỹ năng Skimming/Scanning Reading, xử lý Task 1 Line & Bar." },
    { week: "Tuần 7 - 9", detail: "Phản xạ Speaking trôi chảy không ngắc ngứ, làm chủ Task 2 Essay." },
    { week: "Tuần 10 - 13", detail: "Giải đề liên tục áp lực thời gian, đi thi thực tế ẵm trọn 7.0+." }
  ],
  hoc_tap: [
    { week: "Tuần 1 - 3", detail: "Học chắc Hàm số (Toán), Con lắc (Lý), Este-Lipit (Hóa)." },
    { week: "Tuần 4 - 6", detail: "Xong Mũ-Logarit, Sóng cơ học, Cacbohidrat và Amin." },
    { week: "Tuần 7 - 9", detail: "Học Khối đa diện, Điện xoay chiều, Polime & Vật liệu." },
    { week: "Tuần 10 - 13", detail: "Giải full bộ đề học kì 1 của các trường chuyên cả nước." }
  ],
  the_hinh: [
    { week: "Tuần 1 - 3", detail: "Làm quen lịch tập 4 buổi/tuần, cắt hoàn toàn nước ngọt và đồ dầu mỡ." },
    { week: "Tuần 4 - 6", detail: "Tăng tạ lũy tiến (Overload), nạp protein chuẩn 1.5g/kg trọng lượng." },
    { week: "Tuần 7 - 9", detail: "Bổ sung Cardio cường độ cao (HIIT) sau tập để kích hoạt đốt mỡ bụng." },
    { week: "Tuần 10 - 13", detail: "Siết cơ sâu (Cutting), giữ cơ nách bụng lộ rõ rãnh múi." }
  ]
};

export function DisciplineCampaign() {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>({});
  const [roadmapType, setRoadmapType] = useState<'ielts' | 'hoc_tap' | 'the_hinh'>('ielts');
  const [countdownText, setCountdownText] = useState("91 ngày 0 giờ");
  const [currentDateText, setCurrentDateText] = useState("");

  // Big Goal settings states
  const [bigGoalTitle, setBigGoalTitle] = useState(() => {
    return localStorage.getItem('campaign_big_goal_title') || "THỦ KHOA KỶ LUẬT";
  });
  const [bigGoalSubtitle, setBigGoalSubtitle] = useState(() => {
    return localStorage.getItem('campaign_big_goal_subtitle') || "(Lớp 12 - HK1)";
  });
  const [bigGoalDescription, setBigGoalDescription] = useState(() => {
    return localStorage.getItem('campaign_big_goal_desc') || "Chiến dịch bứt phá đỉnh cao: IELTS đạt 7.0 • Hoàn thiện toàn vẹn HK1 lớp 12 (Toán - Lý - Hóa 9+) • Kiến tạo thể hình 6 múi. Trì hoãn là kẻ thù, kỷ luật là tự do!";
  });
  const [isEditingBigGoals, setIsEditingBigGoals] = useState(false);
  const [tempBigGoalTitle, setTempBigGoalTitle] = useState("");
  const [tempBigGoalSubtitle, setTempBigGoalSubtitle] = useState("");
  const [tempBigGoalDescription, setTempBigGoalDescription] = useState("");

  const handleStartEditingBigGoals = () => {
    setTempBigGoalTitle(bigGoalTitle);
    setTempBigGoalSubtitle(bigGoalSubtitle);
    setTempBigGoalDescription(bigGoalDescription);
    setIsEditingBigGoals(true);
  };

  const handleSaveBigGoals = () => {
    const title = tempBigGoalTitle.trim();
    const subtitle = tempBigGoalSubtitle.trim();
    const desc = tempBigGoalDescription.trim();

    if (!title || !desc) {
      alert("Tiêu đề và nội dung chiến dịch lớn không được phép để trống!");
      return;
    }

    setBigGoalTitle(title);
    setBigGoalSubtitle(subtitle);
    setBigGoalDescription(desc);
    
    localStorage.setItem('campaign_big_goal_title', title);
    localStorage.setItem('campaign_big_goal_subtitle', subtitle);
    localStorage.setItem('campaign_big_goal_desc', desc);
    
    setIsEditingBigGoals(false);
    alert("🎉 Đã lưu mục tiêu chiến dịch lớn thành công!");
  };

  const handleResetBigGoals = () => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn khôi phục mục tiêu lớn mặc định ban đầu không?");
    if (!confirmed) return;

    const defaultTitle = "THỦ KHOA KỶ LUẬT";
    const defaultSubtitle = "(Lớp 12 - HK1)";
    const defaultDesc = "Chiến dịch bứt phá đỉnh cao: IELTS đạt 7.0 • Hoàn thiện toàn vẹn HK1 lớp 12 (Toán - Lý - Hóa 9+) • Kiến tạo thể hình 6 múi. Trì hoãn là kẻ thù, kỷ luật là tự do!";

    setBigGoalTitle(defaultTitle);
    setBigGoalSubtitle(defaultSubtitle);
    setBigGoalDescription(defaultDesc);

    localStorage.removeItem('campaign_big_goal_title');
    localStorage.removeItem('campaign_big_goal_subtitle');
    localStorage.removeItem('campaign_big_goal_desc');

    setIsEditingBigGoals(false);
    alert("🔄 Đã khôi phục mục tiêu lớn về mặc định!");
  };

  // Dynamic roadmap state
  const [customRoadmaps, setCustomRoadmaps] = useState<Record<string, { week: string; detail: string }[]>>(() => {
    const saved = localStorage.getItem('campaign_roadmaps_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return roadmaps;
  });
  const [isEditingRoadmap, setIsEditingRoadmap] = useState(false);
  const [editedRoadmapItems, setEditedRoadmapItems] = useState<{ week: string; detail: string }[]>([]);

  // Keep editedRoadmapItems in sync when starting edit or changing type
  useEffect(() => {
    if (customRoadmaps[roadmapType]) {
      setEditedRoadmapItems(customRoadmaps[roadmapType]);
    }
  }, [roadmapType, customRoadmaps]);

  const handleSaveRoadmap = () => {
    const updatedRoadmaps = { ...customRoadmaps, [roadmapType]: editedRoadmapItems };
    setCustomRoadmaps(updatedRoadmaps);
    localStorage.setItem('campaign_roadmaps_v2', JSON.stringify(updatedRoadmaps));
    setIsEditingRoadmap(false);
    alert("🎉 Đã lưu lộ trình chiến lược mới thành công!");
  };

  const handleRoadmapItemChange = (index: number, field: 'week' | 'detail', value: string) => {
    setEditedRoadmapItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Dynamic schedule state
  const [schedule, setSchedule] = useState<Record<number, Task[]>>(() => {
    const saved = localStorage.getItem('campaign_schedule_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updated: Record<number, Task[]> = {};
        for (const day in parsed) {
          const dNum = parseInt(day);
          updated[dNum] = parsed[day].map((t: any, idx: number) => ({
            id: t.id || `task-${dNum}-${idx}-${Date.now()}`,
            time: t.time || "08:00 - 09:00",
            task: t.task || ""
          }));
        }
        return updated;
      } catch (e) {
        console.error(e);
      }
    }
    
    const initial: Record<number, Task[]> = {};
    for (const day in weeklyScheduleRaw) {
      const dNum = parseInt(day);
      initial[dNum] = weeklyScheduleRaw[day].map((t, idx) => ({
        id: `task-${dNum}-${idx}`,
        time: t.time,
        task: t.task
      }));
    }
    return initial;
  });

  const saveSchedule = (newSchedule: Record<number, Task[]>) => {
    setSchedule(newSchedule);
    localStorage.setItem('campaign_schedule_v2', JSON.stringify(newSchedule));
  };

  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [showScheduleResetConfirm, setShowScheduleResetConfirm] = useState<boolean>(false);

  // Google Calendar integration states
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [syncDate, setSyncDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Custom task editor states
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Goal keeper states
  const [gkAnimating, setGkAnimating] = useState(false);
  const [ballPosition, setBallPosition] = useState({ left: '50%', top: '', bottom: '8px', scale: 1, rotate: 0 });
  const [gkPosition, setGkPosition] = useState({ left: '50%', bottom: '16px', rotate: 0, scale: 1 });
  const [leftArmRotate, setLeftArmRotate] = useState(-45);
  const [rightArmRotate, setRightArmRotate] = useState(45);
  const [leftArmScaleY, setLeftArmScaleY] = useState(1);
  const [rightArmScaleY, setRightArmScaleY] = useState(1);
  const [saveMessageVisible, setSaveMessageVisible] = useState(false);

  // Pomodoro states
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSeconds, setPomoSeconds] = useState(0);
  const [pomoRunning, setPomoRunning] = useState(false);
  const pomoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);

  // Gemini AI chat states
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiStatusText, setApiStatusText] = useState("Vui lòng nhập API Key để tối ưu hóa, hoặc dùng tự động qua server-side proxy.");
  const [apiStatusColor, setApiStatusColor] = useState("text-slate-400");
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { 
      sender: 'ai', 
      text: "👋 Chào người đồng đội kỷ luật! Tôi là cố vấn thông thái trong hòm chiến dịch 13 tuần. Hãy đặt bất kỳ câu hỏi Toán Lý Hóa hóc búa, thắc mắc ngữ pháp IELTS hay thực đơn tập gym, tôi sẵn sàng hỗ trợ bạn bứt phá đỉnh cao!" 
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Google Calendar Auth subscription listener
  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // Load task checkboxes & API keys
  useEffect(() => {
    // Current date setup
    setCurrentDateText(new Date().toLocaleDateString('vi-VN'));

    // Select dynamic day of the week on load
    const currentDayOfWeek = new Date().getDay();
    const mappedDay = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
    setActiveDay(mappedDay);

    // Load checkbox tasks from localStorage
    const savedStates: Record<string, boolean> = {};
    for (let day = 1; day <= 7; day++) {
      const dayTasks = schedule[day] || [];
      dayTasks.forEach((t) => {
        const key = `task-completed-id-${t.id}`;
        const saved = localStorage.getItem(key);
        if (saved === 'true') {
          savedStates[t.id] = true;
        } else {
          // Fallback backward compatibility for older idx index-based keys
          const legacyKey = `task-completed-${day}-${dayTasks.indexOf(t)}`;
          const legacySaved = localStorage.getItem(legacyKey);
          if (legacySaved === 'true') {
            savedStates[t.id] = true;
            // Upgrade to new ID key format
            localStorage.setItem(key, 'true');
          }
        }
      });
    }
    setTaskStates(savedStates);

    // Load API key from local cache
    const savedKey = localStorage.getItem('gemini_api_key') || "";
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySaved(true);
      setApiStatusText("🔑 Đã tìm thấy API Key lưu trữ. Đang dùng cấu hình cá nhân.");
      setApiStatusColor("text-amber-500 font-medium");
    }

    // Set countdown for 13 weeks (91 days)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 91);
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setCountdownText("HOÀN THÀNH CHIẾN DỊCH!");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setCountdownText(`${days} ngày ${hours} giờ`);
    }, 60000);

    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    setCountdownText(`${days} ngày ${hours} giờ`);

    return () => {
      clearInterval(interval);
      if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
    };
  }, [schedule]);

  // Sync state to localStorage
  const handleCheckboxChange = (taskId: string, isChecked: boolean) => {
    // Update local react state
    setTaskStates(prev => {
      const updated = { ...prev, [taskId]: isChecked };
      // Persist to localStorage
      localStorage.setItem(`task-completed-id-${taskId}`, isChecked ? 'true' : 'false');
      return updated;
    });

    // Trigger funny goalkeeper save reinforcement!
    if (isChecked) {
      triggerBallCatch();
    }
  };

  // Helper calculating stats
  const calculateTotalTasks = () => {
    let totals = 0;
    for (let day = 1; day <= 7; day++) {
      totals += (schedule[day] || []).length;
    }
    return totals;
  };

  const calculateCompletedTasks = () => {
    let completed = 0;
    for (let day = 1; day <= 7; day++) {
      const dayTasks = schedule[day] || [];
      dayTasks.forEach((t) => {
        if (taskStates[t.id]) completed++;
      });
    }
    return completed;
  };

  const totalTasks = calculateTotalTasks();
  const completedTasks = calculateCompletedTasks();
  const completionRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Render performance banner status
  const renderGoalStatusBadge = () => {
    if (completionRatio >= 80) {
      return (
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl block text-center animate-pulse">
          <Zap className="inline mr-1 w-3.5 h-3.5" /> Phong Độ Thủ Khoa
        </span>
      );
    } else if (completionRatio >= 50) {
      return (
        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-xl block text-center">
          <Flame className="inline mr-1 w-3.5 h-3.5" /> Đang Bứt Phá
        </span>
      );
    } else {
      return (
        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-xl block text-center">
          <Shield className="inline mr-1 w-3.5 h-3.5" /> Cần Kỷ Luật Hơn
        </span>
      );
    }
  };

  // Live simulation keeper: Bay người đón bắt pen cực kỳ sinh động
  const triggerBallCatch = () => {
    if (gkAnimating) return;
    setGkAnimating(true);

    // Initial reset
    setBallPosition({ left: '50%', top: '', bottom: '8px', scale: 1, rotate: 0 });
    setGkPosition({ left: '50%', bottom: '16px', rotate: 0, scale: 1 });
    setLeftArmRotate(-45);
    setRightArmRotate(45);
    setLeftArmScaleY(1);
    setRightArmScaleY(1);
    setSaveMessageVisible(false);

    // Sequence timer mechanics
    setTimeout(() => {
      // Get pitch elements width to accurately map fixed px offsets to percentage positions
      const pitchWidth = pitchRef.current?.offsetWidth || 340;

      // Calculate randomized penalty shootout parameters
      const targetLeft = Math.floor(Math.random() * 60) + 20; // 20% to 80%
      const targetTop = Math.floor(Math.random() * 45) + 24;  // 24px to 69px (matching HTML)
      const ballRotation = Math.floor(Math.random() * 540) + 360;

      // Ball kick-off flight
      setBallPosition({
        left: `${targetLeft}%`,
        top: `${targetTop}px`,
        bottom: '',
        scale: 0.85,
        rotate: ballRotation
      });

      // Synchronize Goalkeeper dive logic
      setTimeout(() => {
        let gkLeft = targetLeft;
        let calculatedBottom = 176 - targetTop - 40;
        let rotateAngle = 0;
        let scaleVal = 1;
        
        // Horizontal offset of hand in pixels (making sure hand and ball have exact same coordinate)
        const armOffsetPx = 34; // visual spacing for realistic stretch
        const armOffsetPercent = (armOffsetPx / pitchWidth) * 100;

        if (targetLeft < 46) {
          // Off-center left dive: goalkeeper positioned to the right of the ball so left arm meets ball exactly
          gkLeft = targetLeft + armOffsetPercent;
          calculatedBottom = 176 - targetTop - 62; // aligned height
          rotateAngle = -35;
          setLeftArmRotate(-110);
          setLeftArmScaleY(1.9); // Strained left arm reach
          setRightArmRotate(-20);
          setRightArmScaleY(1.0);
        } else if (targetLeft > 54) {
          // Off-center right dive: goalkeeper positioned to the left of the ball so right arm meets ball exactly
          gkLeft = targetLeft - armOffsetPercent;
          calculatedBottom = 176 - targetTop - 62; // aligned height
          rotateAngle = 35;
          setLeftArmRotate(20);
          setLeftArmScaleY(1.0);
          setRightArmRotate(110);
          setRightArmScaleY(1.9); // Strained right arm reach
        } else {
          // Centered jump: goalkeeper goes straight to ball, hands catch from above
          gkLeft = targetLeft;
          calculatedBottom = 176 - targetTop - 85; // aligned height
          rotateAngle = 0;
          scaleVal = 1.05;
          setLeftArmRotate(-85);
          setLeftArmScaleY(1.6);
          setRightArmRotate(85);
          setRightArmScaleY(1.6);
        }

        setGkPosition({
          left: `${gkLeft}%`,
          bottom: `${calculatedBottom}px`,
          rotate: rotateAngle,
          scale: scaleVal
        });
      }, 60);

      // Save collision splash
      setTimeout(() => {
        setSaveMessageVisible(true);

        // At the moment of interception, lock the ball position exactly to the glove center
        // so that there represents absolutely 100% pixel-perfect locking during the save duration!
        setBallPosition(prev => ({
          ...prev,
          left: `${targetLeft}%`,
          scale: 0.95
        }));

        // Restoring standard goalkeeper posture after successful display
        setTimeout(() => {
          setBallPosition({ left: '50%', top: '', bottom: '8px', scale: 1, rotate: 0 });
          setGkPosition({ left: '50%', bottom: '16px', rotate: 0, scale: 1 });
          setLeftArmRotate(-45);
          setRightArmRotate(45);
          setLeftArmScaleY(1);
          setRightArmScaleY(1);
          setSaveMessageVisible(false);
          setGkAnimating(false);
        }, 1500);

      }, 550);

    }, 40);
  };

  // Pomodoro logics
  const togglePomoTimer = () => {
    if (pomoRunning) {
      if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
      setPomoRunning(false);
    } else {
      setPomoRunning(true);
      pomoIntervalRef.current = setInterval(() => {
        setPomoSeconds(prevSec => {
          if (prevSec === 0) {
            setPomoMinutes(prevMin => {
              if (prevMin === 0) {
                if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
                setPomoRunning(false);
                alert("⏰ ĐÃ HẾT THỜI GIAN POMODORO! Hãy nghỉ ngơi, thả lỏng đầu óc 5 phút trước khi tiếp tục bứt phá.");
                return 25;
              }
              return prevMin - 1;
            });
            return 59;
          }
          return prevSec - 1;
        });
      }, 1000);
    }
  };

  const resetPomoTimer = () => {
    if (pomoIntervalRef.current) clearInterval(pomoIntervalRef.current);
    setPomoMinutes(25);
    setPomoSeconds(0);
    setPomoRunning(false);
  };

  // Activate API Key client-side credentials
  const handleActivateApiKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      alert("Vui lòng nhập API Key.");
      return;
    }

    setApiTesting(true);
    setApiStatusText("⏳ Đang xác minh dữ liệu khóa API...");
    setApiStatusColor("text-sky-500 font-medium");

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${trimmed}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('gemini_api_key', trimmed);
        setApiKeySaved(true);
        setApiStatusText("🚀 API Key được kích hoạt và lưu trữ thành công!");
        setApiStatusColor("text-emerald-500 font-bold");
        
        setAiChatMessages(prev => [
          ...prev, 
          { sender: 'ai', text: "🔑 **Khóa API Cá Nhân Kích Hoạt Thành Công!** Giờ đây tôi sẽ trực tiếp trả lời bạn với toàn bộ hiệu suất phân tích sâu rộng nhất từ tài khoản của bạn." }
        ]);
      } else {
        throw new Error(data.error?.message || "Khóa API không hợp lệ.");
      }
    } catch (e: any) {
      localStorage.removeItem('gemini_api_key');
      setApiKeySaved(false);
      setApiStatusText(`❌ Lỗi kết nối: ${e.message}`);
      setApiStatusColor("text-rose-500 font-semibold");
    } finally {
      setApiTesting(false);
    }
  };

  // Gemini chat submission using either API key or proxy server backup
  const handleSendChat = async () => {
    const prompt = userInput.trim();
    if (!prompt) return;

    // Append user side message
    const updatedMessages = [...aiChatMessages, { sender: 'user', text: prompt }];
    setAiChatMessages(updatedMessages);
    setUserInput("");
    setChatLoading(true);

    try {
      let aiText = "";

      // Prioritize client-side API direct call if user saved key, otherwise leverage secure server proxy
      if (apiKeySaved && apiKey) {
        const systemInstruction = 
          "Bạn là cố vấn thông thái trong 'Chiến Dịch 13 Tuần Bứt Phá'. " +
          "Mục tiêu tối thượng của học viên là: IELTS 7.0, học tốt và nắm vững toàn bộ kiến thức HK1 lớp 12 (Toán Lý Hóa), và rèn luyện thể hình 6 múi săn chắc. " +
          "Hãy trả lời một cách súc tích, nồng nhiệt nhưng đanh thép, đầy tính động lực hành động, khoa học thể chất/trí tuệ và có tinh thần kỷ luật thép.";

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemInstruction}\n\nHọc sinh hỏi: ${prompt}` }] }]
          })
        });

        const data = await res.json();
        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiText = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error(data.error?.message || "Không thể nhận phản hồi.");
        }
      } else {
        // Fallback to fully server-managed Secure API route proxy (doesn't expose key!)
        const res = await fetch("/api/campaign-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        if (res.ok) {
          aiText = data.text;
        } else {
          throw new Error(data.error || "Gặp sự cố giải quyết bài giảng.");
        }
      }

      setAiChatMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    } catch (err: any) {
      console.error(err);
      setAiChatMessages(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: `💥 **Gặp sự cố kết nối:** ${err.message}. Hãy kiểm tra xem bạn đã cấu hình internet hợp lệ, hoặc thử nhấn nút "RUN" cấu hình bên trên để phục hồi trạng thái nhé.` 
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- Google Calendar Actions ---
  const handleGoogleConnect = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        alert(`🎉 Kết nối thành công tài khoản Google: ${res.user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`❌ Kết nối thất bại: ${err.message}`);
    }
  };

  const handleGoogleDisconnect = async () => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn ngắt kết nối tài khoản Google không?");
    if (!confirmed) return;
    try {
      await logoutCalendar();
      setGoogleUser(null);
      setGoogleToken(null);
      alert("Đã ngắt kết nối tài khoản Google.");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSyncToGoogleCalendar = async () => {
    if (!googleToken) {
      alert("Vui lòng kết nối tài khoản Google trước.");
      return;
    }

    const dayTasks = schedule[activeDay] || [];
    if (dayTasks.length === 0) {
      alert("Không có nhiệm vụ nào trong ngày này để đồng bộ.");
      return;
    }

    // Explicit confirmation dialouge as required by instructions
    const confirmed = window.confirm(
      `Bạn có đồng ý đồng bộ ${dayTasks.length} nhiệm vụ của ngày thứ ${activeDay === 7 ? "Chủ Nhật" : activeDay + 1} lên Google Calendar vào ngày ${syncDate} không?`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await syncTasksToGoogleCalendar(googleToken, dayTasks, syncDate);
      if (res.failedCount === 0) {
        alert(`🎉 Đồng bộ thành công tất cả ${res.successCount} nhiệm vụ lên Google Calendar!`);
        setSyncResult(`Đã đồng bộ thành công ${res.successCount} nhiệm vụ.`);
      } else {
        alert(`Đồng bộ hoàn tất: ${res.successCount} thành công, ${res.failedCount} thất bại.`);
        setSyncResult(`Thành công: ${res.successCount}, Lỗi: ${res.failedCount}.\nChi tiết:\n${res.errors.join('\n')}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`❌ Đồng bộ gặp lỗi: ${err.message}`);
      setSyncResult(`Lỗi: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Custom Task Editor Actions ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const taskTitle = newTaskTitle.trim();
    if (!taskTitle) return;

    const timeRange = newTaskTime.trim() || "08:00 - 09:00";
    const newTask: Task = {
      id: `task-custom-${Date.now()}`,
      time: timeRange,
      task: taskTitle
    };

    const updatedTasks = [...(schedule[activeDay] || []), newTask];
    const updatedSchedule = { ...schedule, [activeDay]: updatedTasks };
    saveSchedule(updatedSchedule);

    setNewTaskTitle("");
    setNewTaskTime("");
    alert("Đã thêm nhiệm vụ mới!");
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDeleteId(taskId);
  };

  const executeDeleteTask = (taskId: string) => {
    const updatedTasks = (schedule[activeDay] || []).filter(t => t.id !== taskId);
    const updatedSchedule = { ...schedule, [activeDay]: updatedTasks };
    saveSchedule(updatedSchedule);

    // Also remove task completed state
    setTaskStates(prev => {
      const updated = { ...prev };
      delete updated[taskId];
      localStorage.removeItem(`task-completed-id-${taskId}`);
      return updated;
    });
    setTaskToDeleteId(null);
  };

  const handleStartEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskTime(task.time);
    setNewTaskTitle(task.task);
  };

  const handleSaveEditTask = () => {
    const taskTitle = newTaskTitle.trim();
    if (!taskTitle) return;

    const updatedTasks = (schedule[activeDay] || []).map(t => {
      if (t.id === editingTaskId) {
        return { ...t, time: newTaskTime || "08:00 - 09:00", task: taskTitle };
      }
      return t;
    });

    const updatedSchedule = { ...schedule, [activeDay]: updatedTasks };
    saveSchedule(updatedSchedule);

    setEditingTaskId(null);
    setNewTaskTime("");
    setNewTaskTitle("");
    alert("Đã cập nhật nhiệm vụ!");
  };

  const handleResetToDefaultSchedule = () => {
    setShowScheduleResetConfirm(true);
  };

  const executeResetToDefaultSchedule = () => {
    const initial: Record<number, Task[]> = {};
    for (const day in weeklyScheduleRaw) {
      const dNum = parseInt(day);
      initial[dNum] = weeklyScheduleRaw[day].map((t, idx) => ({
        id: `task-${dNum}-${idx}`,
        time: t.time,
        task: t.task
      }));
    }
    saveSchedule(initial);

    // Clear task completion status
    setTaskStates({});
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('task-completed-id-') || k.startsWith('task-completed-'))) {
        localStorage.removeItem(k);
        i--;
      }
    }
    setShowScheduleResetConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 13-Week Goal Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 pointer-events-none">
          <Trophy size={140} />
        </div>
        
        {isEditingBigGoals ? (
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center gap-1.5">
                <Edit3 size={15} className="text-amber-300" />
                <span>Chỉnh sửa mục tiêu chiến dịch lớn</span>
              </h3>
              <button 
                onClick={handleResetBigGoals}
                className="text-[10px] sm:text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1"
              >
                <RotateCcw size={11} />
                <span>Khôi phục mặc định</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-sky-200">Tiêu đề chiến dịch:</label>
                <input 
                  type="text"
                  value={tempBigGoalTitle}
                  onChange={(e) => setTempBigGoalTitle(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="VD: THỦ KHOA KỶ LUẬT"
                />
              </div>
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-sky-200">Phụ đề / Giai đoạn:</label>
                <input 
                  type="text"
                  value={tempBigGoalSubtitle}
                  onChange={(e) => setTempBigGoalSubtitle(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="VD: (Lớp 12 - HK1)"
                />
              </div>
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-sky-200">Nội dung chi tiết mục tiêu lớn:</label>
                <textarea 
                  rows={2}
                  value={tempBigGoalDescription}
                  onChange={(e) => setTempBigGoalDescription(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 leading-relaxed"
                  placeholder="Nhập các cột mốc mục tiêu lớn cách nhau bằng dấu chấm hoặc gạch đầu dòng..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-1">
              <button 
                onClick={() => setIsEditingBigGoals(false)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveBigGoals}
                className="px-5 py-1.5 bg-white text-blue-600 hover:bg-sky-50 rounded-xl text-xs font-black transition-all shadow-md active:scale-98"
              >
                Lưu mục tiêu
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full backdrop-blur-md">
                  <Sparkles size={11} className="animate-spin text-amber-200" />
                  <span>Chiến dịch 13 tuần tối thượng</span>
                </div>
                <button
                  onClick={handleStartEditingBigGoals}
                  className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold px-2.5 py-1 rounded-full transition-all backdrop-blur-md cursor-pointer border border-white/10 hover:border-white/20"
                  title="Chỉnh sửa mục tiêu lớn"
                >
                  <Edit3 size={10} />
                  <span>Sửa mục tiêu lớn 🛠️</span>
                </button>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-3 flex items-center gap-2">
                {bigGoalTitle} {bigGoalSubtitle && <span className="text-amber-300 font-bold text-sm sm:text-base bg-white/10 px-2 py-0.5 rounded-md">{bigGoalSubtitle}</span>}
              </h2>
              <p className="text-sm text-sky-100 mt-1.5 max-w-2xl leading-relaxed whitespace-pre-line">
                {bigGoalDescription}
              </p>
            </div>
            <div className="min-w-[170px] self-stretch md:self-auto flex items-center justify-center">
              {renderGoalStatusBadge()}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Days tracker & Roadmaps */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Calendar Selector */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/80">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1 flex items-center gap-1">
              <Calendar size={13} className="text-blue-500" />
              <span>Tiến trình ngày trong tuần</span>
            </h4>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {[
                { day: 1, label: "T2" },
                { day: 2, label: "T3" },
                { day: 3, label: "T4" },
                { day: 4, label: "T5" },
                { day: 5, label: "T6" },
                { day: 6, label: "T7" },
                { day: 7, label: "CN" }
              ].map((item) => (
                <button
                  key={item.day}
                  onClick={() => setActiveDay(item.day)}
                  className={`py-3 rounded-xl font-extrabold text-xs transition-all ${
                    activeDay === item.day
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-105'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:hover:bg-slate-900 dark:text-slate-300'
                  } ${item.day === 7 && activeDay !== 7 ? 'text-rose-500 dark:text-rose-400' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Google Calendar Sync Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar className="text-blue-500 w-5 h-5" />
                <span>Đồng bộ Google Calendar 📅</span>
              </h3>
              {googleUser && (
                <button 
                  onClick={handleGoogleDisconnect}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors"
                  title="Đăng xuất lịch Google"
                >
                  <LogOut size={13} />
                  <span>Ngắt kết nối</span>
                </button>
              )}
            </div>

            {!googleUser ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Đồng bộ các mục tiêu của bạn trực tiếp với Google Calendar của bạn để theo dõi tiến độ chính xác nhất, hợp nhất lịch sinh hoạt và học tập.
                </p>
                <button
                  onClick={handleGoogleConnect}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Kết nối Lịch Google</span>
                </button>
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 p-3 rounded-xl">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
                    💡 <strong>Mẹo nhỏ:</strong> Nếu bấm nút kết nối mà không thấy cửa sổ hiện ra, hãy kiểm tra góc trên thanh địa chỉ trình duyệt xem có thông báo chặn cửa sổ bật lên (Pop-up) hay không. Hãy cho phép pop-up và nhấn lại nút.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Tài khoản kết nối</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{googleUser.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-650 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-450 px-2 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đã liên kết
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Chọn ngày đồng bộ:</label>
                    <input 
                      type="date"
                      value={syncDate}
                      onChange={(e) => setSyncDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <button
                    onClick={handleSyncToGoogleCalendar}
                    disabled={isSyncing}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:scale-101 active:scale-98 shrink-0 cursor-pointer"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Đang đồng bộ...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink size={13} />
                        <span>Đồng bộ lịch lên Google Calendar</span>
                      </>
                    )}
                  </button>
                </div>

                {syncResult && (
                  <pre className="text-[10px] font-mono leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400 max-h-24 overflow-y-auto break-all whitespace-pre-wrap">
                    {syncResult}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Time Checklists */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                <span>Nhiệm Vụ Kỷ Luật</span>
                <span className="text-blue-500 text-xs font-semibold ml-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                  {activeDay === 7 ? "Chủ Nhật" : `Thứ ${activeDay + 1}`}
                </span>
              </h3>
              <button
                onClick={() => setIsEditingTasks(!isEditingTasks)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                  isEditingTasks 
                    ? 'bg-amber-500 text-white border-amber-500' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Edit3 size={12} />
                <span>{isEditingTasks ? "Đóng Chỉnh Sửa" : "Sửa Chỉ Tiêu / Thêm Mục Tiêu 🛠️"}</span>
              </button>
            </div>

            {isEditingTasks ? (
              /* TASK MANAGEMENT WRAPPER EDITOR */
              <div className="space-y-4 pt-1 animate-fadeIn">
                <form onSubmit={handleAddTask} className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                    {editingTaskId ? "⚡ CẬP NHẬT NHIỆM VỤ" : "➕ THÊM NHIỆM VỤ MỚI CHUYÊN BIỆT"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-1">
                      <input 
                        type="text"
                        placeholder="VD: 08:00 - 09:30"
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-white px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input 
                        type="text"
                        placeholder="Nhiệm vụ cụ thể (VD: Giải đề Toán Chuyên Lê Hồng Phong)"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-white px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    {editingTaskId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingTaskId(null);
                          setNewTaskTime("");
                          setNewTaskTitle("");
                        }}
                        className="px-3.5 py-1.5 bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-200"
                      >
                        Hủy
                      </button>
                    )}
                    <button 
                      type="submit"
                      onClick={editingTaskId ? (e) => { e.preventDefault(); handleSaveEditTask(); } : undefined}
                      className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      {editingTaskId ? "Cập Nhật" : "Thêm Nhiệm Vụ"}
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {(schedule[activeDay] || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">Không có nhiệm vụ nào cho ngày hôm nay. Hãy thêm mới!</p>
                  ) : (
                    (schedule[activeDay] || []).map((t) => (
                      <div 
                        key={t.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/60"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-blue-500 dark:text-blue-400 block">
                            ⏱️ {t.time}
                          </span>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {t.task}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleStartEditTask(t)}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-200 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-450 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-200 transition-all"
                            title="Xóa"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button 
                    onClick={handleResetToDefaultSchedule}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 px-3.5 py-1.5 rounded-xl transition-all"
                  >
                    <RotateCcw size={12} />
                    Khôi Phục Lịch Gốc Mặc Định
                  </button>
                  <button 
                    onClick={() => setIsEditingTasks(false)}
                    className="text-xs font-bold px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow"
                  >
                    Hoàn Tất Chỉnh Sửa
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD CHECKLIST DISPLAY */
              <div className="space-y-3">
                {(schedule[activeDay] || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">Không có nhiệm vụ nào cho ngày hôm nay. Hãy nhấn nút Chỉnh sửa chỉ tiêu để thêm mục tiêu!</p>
                ) : (
                  (schedule[activeDay] || []).map((item) => {
                    const isSelected = !!taskStates[item.id];
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-emerald-50/40 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-900/40' 
                            : 'bg-slate-50/70 border-slate-100/50 dark:bg-slate-900/20 dark:border-slate-800/40'
                        } hover:border-blue-500/30 group`}
                      >
                        <div className="flex items-start gap-3.5 flex-1">
                          <div className="relative flex items-center mt-0.5">
                            <input 
                              type="checkbox"
                              id={`task-check-${item.id}`}
                              checked={isSelected}
                              onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                              className="w-4.5 h-4.5 text-blue-500 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400 font-mono block">
                              ⏱️ {item.time}
                            </span>
                            <p className={`text-xs sm:text-sm font-medium ${
                              isSelected ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'
                            } leading-relaxed`}>
                              {item.task}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Core Roadmaps */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <Award className="text-amber-500 w-5 h-5" />
                <span>Chi Tiết Lộ Trình Chiến Lược</span>
              </h3>
              <div className="flex items-center gap-2">
                <select 
                  value={roadmapType}
                  onChange={(e) => setRoadmapType(e.target.value as any)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="ielts">🎯 Chứng chỉ IELTS 7.0</option>
                  <option value="hoc_tap">📚 Học thuật HK1 Khối 12</option>
                  <option value="the_hinh">💪 Thể chất 6 Múi săn chắc</option>
                </select>
                <button
                  onClick={() => {
                    if (!isEditingRoadmap) {
                      setEditedRoadmapItems(customRoadmaps[roadmapType] || []);
                    }
                    setIsEditingRoadmap(!isEditingRoadmap);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                    isEditingRoadmap 
                      ? 'bg-amber-500 text-white border-amber-500' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 size={12} />
                  <span>{isEditingRoadmap ? "Đóng" : "Sửa Lộ Trình 🛠️"}</span>
                </button>
              </div>
            </div>

            {isEditingRoadmap ? (
              /* ROADMAP EDITING INTERFACE */
              <div className="space-y-4 animate-fadeIn">
                <p className="text-xs text-slate-400">Bạn đang chỉnh sửa lộ trình cho chủ đề <strong>{roadmapType === 'ielts' ? 'IELTS' : roadmapType === 'hoc_tap' ? 'Học thuật' : 'Thể chất'}</strong>. Thay đổi sẽ được lưu trữ tự động.</p>
                <div className="grid grid-cols-1 gap-4">
                  {editedRoadmapItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-blue-500 font-mono w-16">Giai đoạn:</span>
                        <input 
                          type="text"
                          value={item.week}
                          onChange={(e) => handleRoadmapItemChange(idx, 'week', e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-extrabold text-blue-500 font-mono w-16 mt-1.5">Mục tiêu:</span>
                        <textarea 
                          rows={2}
                          value={item.detail}
                          onChange={(e) => handleRoadmapItemChange(idx, 'detail', e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-white px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                  <button 
                    onClick={() => {
                      const confirmed = window.confirm("Khôi phục lộ trình mặc định gốc cho mục này? Toàn bộ tùy chỉnh của bạn sẽ mất.");
                      if (confirmed) {
                        const updatedRoadmaps = { ...customRoadmaps, [roadmapType]: roadmaps[roadmapType] };
                        setCustomRoadmaps(updatedRoadmaps);
                        localStorage.setItem('campaign_roadmaps_v2', JSON.stringify(updatedRoadmaps));
                        setEditedRoadmapItems(roadmaps[roadmapType]);
                        setIsEditingRoadmap(false);
                        alert("Đã khôi phục lộ trình mặc định!");
                      }
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 px-3.5 py-1.5 rounded-xl transition-all"
                  >
                    <RotateCcw size={12} />
                    Khôi Phục Mặc Định
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingRoadmap(false)}
                      className="text-xs font-bold px-3.5 py-1.5 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleSaveRoadmap}
                      className="text-xs font-bold px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow"
                    >
                      Lưu Lộ Trình
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD ROADMAP VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(customRoadmaps[roadmapType] || []).map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-xs transition-shadow flex items-start gap-3"
                  >
                    <div className="w-2.5 h-2.5 mt-1 rounded-full bg-blue-500 shrink-0" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block font-mono">
                        {item.week}
                      </span>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Goalkeeper stats & Pomodoro & Chat consults */}
        <div className="space-y-6">
          
          {/* Performance Stats & Progress wheel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/80 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="text-blue-500 w-4 h-4" />
              <span>Hiệu Suất Ngày & Tuần</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Tổng chỉ tiêu</span>
                <span className="text-xl font-black text-slate-850 dark:text-white font-mono">{totalTasks}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Đã dứt điểm</span>
                <span className="text-xl font-black text-emerald-500 font-mono">{completedTasks}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-350">
                <span>Đạt chỉ tiêu:</span>
                <span className="text-blue-500 font-mono text-sm">{completionRatio}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-750" 
                  style={{ width: `${completionRatio}%` }}
                />
              </div>
            </div>
          </div>

          {/* SOCCER PENALTY DYNAMIC ANIMATOR (Thủ Môn Kỷ Luật) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Gamepad2 size={13} className="text-emerald-500 animate-pulse" />
                <span>MÔ PHỎNG TRÌ HOÃN</span>
              </h3>
              <button 
                onClick={triggerBallCatch}
                disabled={gkAnimating}
                className="text-[10px] bg-blue-500 hover:bg-blue-600 font-extrabold text-white px-3 py-1.5 rounded-xl disabled:bg-blue-350 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1 active:scale-95"
              >
                SÚT THỬ
              </button>
            </div>

            <div ref={pitchRef} className="relative w-full h-44 bg-gradient-to-b from-emerald-500 via-emerald-600 to-green-700 rounded-2xl overflow-hidden shadow-inner border border-emerald-400/20 flex items-center justify-center">
              {/* Soccer Netting grids */}
              <div 
                className="absolute top-2 w-[85%] h-36 border-4 border-b-0 border-white/60 rounded-t-xl" 
                style={{
                  backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
                  backgroundSize: "12px 12px"
                }}
              />
              <div className="absolute top-2 w-[85%] h-36 border border-b-0 border-white/40 rounded-t-xl" />

              {/* SAVE POPUP ACCENTS */}
              <div 
                className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-300 ${
                  saveMessageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
              >
                <span className="bg-yellow-400 text-slate-950 font-black px-4 py-2 rounded-2xl text-[10px] sm:text-xs uppercase tracking-widest shadow-2xl border-2 border-white animate-bounce">
                  ĐÃ CẢN PHÁ! 🔥
                </span>
              </div>

              {/* HANDLES GOALKEEPER CSS FRAMEWORK */}
              <div 
                className="absolute bottom-4 z-20 flex flex-col items-center"
                style={{
                  width: '60px',
                  height: '75px',
                  left: gkPosition.left,
                  bottom: gkPosition.bottom,
                  transform: `translateX(-50%) rotate(${gkPosition.rotate}deg) scale(${gkPosition.scale})`,
                  transition: gkAnimating ? 'all 0.45s cubic-bezier(0.15, 0.85, 0.4, 1)' : 'all 0.6s ease'
                }}
              >
                {/* Face head */}
                <div className="w-5 h-5 bg-amber-100 rounded-full border border-amber-200 shadow-xs z-10" />
                {/* Chest jersey */}
                <div className="w-6 h-9 bg-cyan-400 dark:bg-cyan-500 rounded-t-md relative shadow-md border-t border-white/20 flex justify-between">
                  {/* Left arm + Glove */}
                  <div 
                    className="w-2 h-7 bg-cyan-400 dark:bg-cyan-500 origin-top rounded-full absolute -left-2 top-0.5 flex flex-col justify-end items-center"
                    style={{
                      transform: `rotate(${leftArmRotate}deg) scaleY(${leftArmScaleY})`,
                      transition: gkAnimating ? 'all 0.3s ease-out' : 'all 0.6s ease'
                    }}
                  >
                    <div className="w-3 h-3 bg-rose-500 rounded-sm mb-[-2px] border border-white/35 shadow-xs" />
                  </div>
                  {/* Right arm + Glove */}
                  <div 
                    className="w-2 h-7 bg-cyan-400 dark:bg-cyan-500 origin-top rounded-full absolute -right-2 top-0.5 flex flex-col justify-end items-center"
                    style={{
                      transform: `rotate(${rightArmRotate}deg) scaleY(${rightArmScaleY})`,
                      transition: gkAnimating ? 'all 0.3s ease-out' : 'all 0.6s ease'
                    }}
                  >
                    <div className="w-3 h-3 bg-rose-500 rounded-sm mb-[-2px] border border-white/35 shadow-xs" />
                  </div>
                </div>
                {/* Shorts + Legs */}
                <div className="w-6 h-4 bg-slate-850 rounded-b-md flex justify-between px-1 shrink-0 z-10">
                  <div className="w-1.5 h-3 bg-amber-100 mt-2.5 rounded-b-sm" />
                  <div className="w-1.5 h-3 bg-amber-100 mt-2.5 rounded-b-sm" />
                </div>
              </div>

              {/* DYNAMIC FOOTBALL */}
              <div 
                className="absolute z-10 w-6 h-6 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-xl border border-slate-200"
                style={{
                  left: ballPosition.left,
                  bottom: ballPosition.bottom,
                  top: ballPosition.top,
                  transform: `translateX(-50%) rotate(${ballPosition.rotate}deg) scale(${ballPosition.scale})`,
                  transition: gkAnimating ? 'all 0.55s cubic-bezier(0.1, 0.8, 0.3, 1)' : 'all 0.6s ease'
                }}
              >
                <div className="w-full h-full flex items-center justify-center font-bold">⚽</div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center max-w-[280px] mx-auto">
              Thủ môn Kỷ luật đại bàng sút bách phát bách trúng cản dẹp thói quen trì lười rề rà của bạn!
            </p>
          </div>

          {/* POMODORO TIMER */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/80 text-center space-y-4">
            <h3 className="font-extrabold text-[10px] text-slate-400 dark:text-slate-500 tracking-widest uppercase flex items-center justify-center gap-1.5">
              <Clock size={12} className="text-rose-500" />
              <span>ĐỒNG HỒ TẬP TRUNG</span>
            </h3>

            <div className="text-4xl font-black font-mono text-slate-850 dark:text-white leading-none">
              {pomoMinutes.toString().padStart(2, '0')}:{pomoSeconds.toString().padStart(2, '0')}
            </div>

            <div className="flex justify-center gap-2">
              <button
                onClick={togglePomoTimer}
                className={`px-4 py-2 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 shadow-xs hover:scale-103 ${
                  pomoRunning 
                    ? 'bg-rose-500 text-white shadow-rose-500/10' 
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-500 hover:text-white'
                }`}
              >
                {pomoRunning ? <Square size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}
                <span>{pomoRunning ? "Tạm dừng" : "Bắt đầu"}</span>
              </button>
              <button 
                onClick={resetPomoTimer}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-200 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-450 p-2.5 rounded-xl transition-all"
                title="Đặt lại đồng hồ"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* GEMINI CHAT */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/80 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-secondary/15 dark:border-slate-700/55 pb-3">
              <span className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="text-blue-500 w-4 h-4" />
                <span>Trợ lý cố vấn</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450">
                Sẵn sàng 🟢
              </span>
            </div>

            {/* API Activation Key credentials input */}
            <div className="bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase block tracking-wider">
                Kết Nối Khóa Gemini API:
              </label>
              <div className="flex gap-1.5">
                <input 
                  type="password"
                  placeholder="Dán mã AIzaSy... (Tùy chọn)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none flex-1 font-mono text-slate-800 dark:text-white"
                />
                <button 
                  onClick={handleActivateApiKey}
                  disabled={apiTesting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  <Key size={10} /> RUN
                </button>
              </div>
              <p className={`text-[9px] leading-relaxed ${apiStatusColor}`}>
                {apiStatusText}
              </p>
            </div>

            {/* Chat Box histories */}
            <div className="h-44 overflow-y-auto space-y-2 text-xs p-2 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800/60 scrollbar-thin">
              {aiChatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed max-w-[85%] break-words ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none font-medium'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1.5 rounded-xl rounded-tl-none font-medium flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Inputs prompt triggers */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Hỏi Toán Lý Hóa 12, IELTS, gym..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                className="flex-1 bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-slate-700/50 dark:hover:bg-slate-700 dark:focus:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/15 outline-none transition-all text-slate-800 dark:text-white"
              />
              <button 
                onClick={handleSendChat}
                disabled={chatLoading || !userInput.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center disabled:cursor-not-allowed shrink-0"
              >
                <Send size={12} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL FOR DELETING TASK */}
      {taskToDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-xl animate-scale-up text-left">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-full">
                <Trash size={20} />
              </div>
              <h3 className="text-base font-bold dark:text-white">Xóa nhiệm vụ học tập</h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-6 font-medium">
              Bạn có chắc chắn muốn xóa nhiệm vụ này khỏi lịch trình học tập của ngày hôm nay không?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTaskToDeleteId(null)}
                className="px-3.5 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-650 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => executeDeleteTask(taskToDeleteId)}
                className="px-3.5 py-2 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL FOR RESETTING SCHEDULE */}
      {showScheduleResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-xl animate-scale-up text-left">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-full">
                <RefreshCw size={20} />
              </div>
              <h3 className="text-base font-bold dark:text-white">Khôi phục lịch gốc</h3>
            </div>
            
            <p className="text-slate-650 dark:text-slate-300 text-xs leading-relaxed mb-6 font-medium">
              Bạn có chắc chắn muốn khôi phục lịch học mặc định gốc không? Mọi thay đổi và tiến độ hoàn thành nhiệm vụ của bạn trên tất cả các ngày sẽ bị xóa sạch.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowScheduleResetConfirm(false)}
                className="px-3.5 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-650 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeResetToDefaultSchedule}
                className="px-3.5 py-2 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
