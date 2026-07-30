import React, { useState, useEffect } from 'react';
import { StudySet, Card } from '../types';
import { 
  Trophy, ArrowLeft, RotateCcw, AlertCircle, Check, X, Shield, Goal, 
  HelpCircle, ChevronRight, Compass, Maximize2, Sparkles, User, Info, AlertTriangle
} from 'lucide-react';
import { Confetti } from './Confetti';
import { audioSynth } from '../utils/audio';

interface SoccerPenaltyProps {
  set: StudySet;
  onBack: () => void;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  emoji: string;
  stadium: string;
  category: 'EPL' | 'UCL-champ';
}

const TEAMS: Team[] = [
  // 19 EPL Teams
  { id: 'mci', name: 'Manchester City', shortName: 'MCI', primaryColor: '#6CABDD', secondaryColor: '#FFFFFF', emoji: '🩵', stadium: 'Etihad Stadium', category: 'EPL' },
  { id: 'ars', name: 'Arsenal', shortName: 'ARS', primaryColor: '#EF0107', secondaryColor: '#FFFFFF', emoji: '❤️', stadium: 'Emirates Stadium', category: 'EPL' },
  { id: 'liv', name: 'Liverpool', shortName: 'LIV', primaryColor: '#C8102E', secondaryColor: '#F6EB61', emoji: '🔴', stadium: 'Anfield', category: 'EPL' },
  { id: 'avl', name: 'Aston Villa', shortName: 'AVL', primaryColor: '#95BFE5', secondaryColor: '#670E36', emoji: '🦁', stadium: 'Villa Park', category: 'EPL' },
  { id: 'tot', name: 'Tottenham Hotspur', shortName: 'TOT', primaryColor: '#132257', secondaryColor: '#FFFFFF', emoji: '⚪', stadium: 'Tottenham Hotspur Stadium', category: 'EPL' },
  { id: 'che', name: 'Chelsea', shortName: 'CHE', primaryColor: '#034694', secondaryColor: '#FFFFFF', emoji: '🔵', stadium: 'Stamford Bridge', category: 'EPL' },
  { id: 'mun', name: 'Manchester United', shortName: 'MUN', primaryColor: '#DA291C', secondaryColor: '#000000', emoji: '👹', stadium: 'Old Trafford', category: 'EPL' },
  { id: 'new', name: 'Newcastle United', shortName: 'NEW', primaryColor: '#241F20', secondaryColor: '#FFFFFF', emoji: '🦓', stadium: "St James' Park", category: 'EPL' },
  { id: 'whu', name: 'West Ham United', shortName: 'WHU', primaryColor: '#7A263A', secondaryColor: '#1BB1E7', emoji: '⚒️', stadium: 'London Stadium', category: 'EPL' },
  { id: 'bha', name: 'Brighton', shortName: 'BHA', primaryColor: '#0057B8', secondaryColor: '#FFFFFF', emoji: '🦅', stadium: 'Amex Stadium', category: 'EPL' },
  { id: 'bou', name: 'Bournemouth', shortName: 'BOU', primaryColor: '#B50E12', secondaryColor: '#000000', emoji: '🍒', stadium: 'Vitality Stadium', category: 'EPL' },
  { id: 'cry', name: 'Crystal Palace', shortName: 'CRY', primaryColor: '#1B458F', secondaryColor: '#C4122E', emoji: '🦅', stadium: 'Selhurst Park', category: 'EPL' },
  { id: 'wol', name: 'Wolverhampton', shortName: 'WOL', primaryColor: '#FDB913', secondaryColor: '#231F20', emoji: '🐺', stadium: 'Molineux Stadium', category: 'EPL' },
  { id: 'ful', name: 'Fulham', shortName: 'FUL', primaryColor: '#FFFFFF', secondaryColor: '#000000', emoji: '🏳️', stadium: 'Craven Cottage', category: 'EPL' },
  { id: 'eve', name: 'Everton', shortName: 'EVE', primaryColor: '#003399', secondaryColor: '#FFFFFF', emoji: '🍬', stadium: 'Goodison Park', category: 'EPL' },
  { id: 'bre', name: 'Brentford', shortName: 'BRE', primaryColor: '#E30613', secondaryColor: '#FFFFFF', emoji: '🐝', stadium: 'Gtech Community Stadium', category: 'EPL' },
  { id: 'nfo', name: 'Nottingham Forest', shortName: 'NFO', primaryColor: '#DD0000', secondaryColor: '#FFFFFF', emoji: '🌳', stadium: 'The City Ground', category: 'EPL' },
  { id: 'lei', name: 'Leicester City', shortName: 'LEI', primaryColor: '#003090', secondaryColor: '#FDBE11', emoji: '🦊', stadium: 'King Power Stadium', category: 'EPL' },
  { id: 'ips', name: 'Ipswich Town', shortName: 'IPS', primaryColor: '#0000FF', secondaryColor: '#FFFFFF', emoji: '🚜', stadium: 'Portman Road', category: 'EPL' },

  // Famous Champions League Winners (Not in EPL)
  { id: 'rma', name: 'Real Madrid', shortName: 'RMA', primaryColor: '#FFFFFF', secondaryColor: '#FEBE10', emoji: '👑', stadium: 'Santiago Bernabéu', category: 'UCL-champ' },
  { id: 'fcb', name: 'Barcelona', shortName: 'FCB', primaryColor: '#004D98', secondaryColor: '#A50044', emoji: '🔵🔴', stadium: 'Camp Nou', category: 'UCL-champ' },
  { id: 'bay', name: 'Bayern Munich', shortName: 'BAY', primaryColor: '#DC052D', secondaryColor: '#0066B2', emoji: '🍻', stadium: 'Allianz Arena', category: 'UCL-champ' },
  { id: 'mil', name: 'AC Milan', shortName: 'ACM', primaryColor: '#E30613', secondaryColor: '#000000', emoji: '🔴⚫', stadium: 'San Siro', category: 'UCL-champ' },
  { id: 'int', name: 'Inter Milan', shortName: 'INT', primaryColor: '#0066B2', secondaryColor: '#000000', emoji: '🔵⚫', stadium: 'Giuseppe Meazza', category: 'UCL-champ' },
  { id: 'juv', name: 'Juventus', shortName: 'JUV', primaryColor: '#000000', secondaryColor: '#FFFFFF', emoji: '🦓', stadium: 'Allianz Stadium', category: 'UCL-champ' },
  { id: 'bvb', name: 'Borussia Dortmund', shortName: 'BVB', primaryColor: '#FDE100', secondaryColor: '#000000', emoji: '🐝', stadium: 'Signal Iduna Park', category: 'UCL-champ' },
  { id: 'por', name: 'FC Porto', shortName: 'POR', primaryColor: '#005CA9', secondaryColor: '#FFFFFF', emoji: '🐉', stadium: 'Estádio do Dragão', category: 'UCL-champ' },
  { id: 'ajx', name: 'Ajax', shortName: 'AJX', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', emoji: '❌❌❌', stadium: 'Johan Cruyff ArenA', category: 'UCL-champ' },
];

type TargetDirection = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';

interface ShotResult {
  round: number;
  isPlayerShooter: boolean;
  quizCorrect: boolean | null;
  playerSelection: TargetDirection;
  aiSelection: TargetDirection;
  scored: boolean;
  commentary: string;
}

export const SoccerPenalty: React.FC<SoccerPenaltyProps> = ({ set, onBack }) => {
  // Game screens: 'select-teams' | 'match' | 'game-over'
  const [gameStage, setGameStage] = useState<'select-teams' | 'match' | 'game-over'>('select-teams');

  // Selected teams
  const [playerTeam, setPlayerTeam] = useState<Team>(TEAMS[0]); // Man City
  const [opponentTeam, setOpponentTeam] = useState<Team>(TEAMS[19]); // Real Madrid

  // Match state
  const [currentRound, setCurrentRound] = useState(1);
  const [turnStage, setTurnStage] = useState<'quiz-shoot' | 'shoot' | 'quiz-dive' | 'dive' | 'result'>('quiz-shoot');
  
  // Season tracking state
  const [seasonMatch, setSeasonMatch] = useState(1);
  const [seasonWins, setSeasonWins] = useState(0);
  const [seasonLosses, setSeasonLosses] = useState(0);

  // Quiz variables
  const [quizCard, setQuizCard] = useState<Card | null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState(false);

  // Shoot / Dive variables
  const [playerShotDir, setPlayerShotDir] = useState<TargetDirection | null>(null);
  const [playerDiveDir, setPlayerDiveDir] = useState<TargetDirection | null>(null);
  const [lastShotResult, setLastShotResult] = useState<ShotResult | null>(null);
  
  // History lists
  const [playerShootHistory, setPlayerShootHistory] = useState<(boolean | null)[]>([null, null, null, null, null]);
  const [opponentShootHistory, setOpponentShootHistory] = useState<(boolean | null)[]>([null, null, null, null, null]);
  
  // Real time score
  const [playerGoals, setPlayerGoals] = useState(0);
  const [opponentGoals, setOpponentGoals] = useState(0);
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null);

  // Statistics tracker
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0);

  // Animate status hook
  const [animatingBall, setAnimatingBall] = useState(false);
  const [gateKeeperState, setGateKeeperState] = useState<'idle' | 'dive-left' | 'dive-right' | 'jump-center' | 'bottom-left' | 'bottom-right'>('idle');
  const [keeperPatrolX, setKeeperPatrolX] = useState(0);

  const getSide = (dir: TargetDirection): 'left' | 'right' | 'center' => {
    if (dir === 'top-left' || dir === 'bottom-left') return 'left';
    if (dir === 'top-right' || dir === 'bottom-right') return 'right';
    return 'center';
  };

  useEffect(() => {
    let animationFrameId: number;
    let direction = 1;
    let currentX = 0;
    const speed = 1.2; // Continuous horizontal movement back & forth

    const updatePatrol = () => {
      if (gateKeeperState === 'idle') {
        currentX += speed * direction;
        if (currentX > 80) {
          currentX = 80;
          direction = -1;
        } else if (currentX < -80) {
          currentX = -80;
          direction = 1;
        }
        setKeeperPatrolX(currentX);
      } else {
        setKeeperPatrolX(0);
      }
      animationFrameId = requestAnimationFrame(updatePatrol);
    };

    animationFrameId = requestAnimationFrame(updatePatrol);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gateKeeperState]);
  
  // Custom interactive animations states
  const [kickerAction, setKickerAction] = useState<'idle' | 'run' | 'kick' | 'celebrate' | 'miss'>('idle');
  const [netShaking, setNetShaking] = useState(false);
  const [aiActiveShotDir, setAiActiveShotDir] = useState<TargetDirection | null>(null);
  const [shotResultType, setShotResultType] = useState<'goal' | 'saved' | 'miss' | 'hit-post' | 'idle'>('idle');
  const [postCollided, setPostCollided] = useState(false);

  // Confetti trigger states
  const [quizConfettiTrigger, setQuizConfettiTrigger] = useState(0);
  const [goalConfettiTrigger, setGoalConfettiTrigger] = useState(0);

  // Gamification extensions
  const [correctStreak, setCorrectStreak] = useState<number>(0);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [lastWrongQuiz, setLastWrongQuiz] = useState<Card | null>(null);

  // Game countdown timer (8 seconds limit)
  const [timeLeft, setTimeLeft] = useState<number>(8);

  useEffect(() => {
    // Only run timer when a quiz is active and not checked yet
    const isQuizActive = (turnStage === 'quiz-shoot' || turnStage === 'quiz-dive') && quizCard && !quizChecked && gameStage === 'match';
    if (!isQuizActive) {
      return;
    }

    setTimeLeft(8); // Reset timer on active quiz entrance

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(interval);
          // Timeout trigger! Set answer checked, incorrect is true, and progress to next step
          setQuizIsCorrect(false);
          setQuizChecked(true);
          setTotalQuestionsAsked(p => p + 1);
          setCorrectStreak(0);
          setLastWrongQuiz(quizCard);
          audioSynth.playIncorrect();

          // Auto trigger failed shootout/defend sequence after 1.5 seconds of timeout notification
          setTimeout(() => {
            const directions: TargetDirection[] = ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];
            if (turnStage === 'quiz-shoot') {
              setTurnStage('shoot');
              handlePlayerShoot(randomDirection, true);
            } else if (turnStage === 'quiz-dive') {
              setTurnStage('dive');
              handlePlayerDefend(randomDirection, true);
            }
          }, 1500);

          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [turnStage, quizCard, quizChecked, gameStage]);

  // Match History list loaded from localStorage
  const [matchHistory, setMatchHistory] = useState<Array<{
    opponent: Team;
    playerScore: number;
    opponentScore: number;
    winnerName: string;
    isPlayerWinner: boolean;
    date: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('soccer_penalty_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Trigger random opponent automatically
  const assignRandomOpponent = () => {
    const pool = TEAMS.filter(t => t.id !== playerTeam.id);
    const randomCopy = pool[Math.floor(Math.random() * pool.length)];
    setOpponentTeam(randomCopy);
    return randomCopy;
  };

  const handleStartMatch = () => {
    // Auto assign random opponent, no manual choosing needed
    const opponent = assignRandomOpponent();

    setGameStage('match');
    setCurrentRound(1);
    setTurnStage('quiz-shoot');
    setPlayerGoals(0);
    setOpponentGoals(0);
    setPlayerShootHistory([null, null, null, null, null]);
    setOpponentShootHistory([null, null, null, null, null]);
    setWinnerTeam(null);
    setLastShotResult(null);
    setCorrectStreak(0);
    setLastWrongQuiz(null);
    triggerNextQuiz();
  };

  const handleNextSeasonMatch = () => {
    setSeasonMatch(prev => prev + 1);
    
    // Auto select different random opponent
    const pool = TEAMS.filter(t => t.id !== playerTeam.id);
    const randomCopy = pool[Math.floor(Math.random() * pool.length)];
    setOpponentTeam(randomCopy);

    setGameStage('match');
    setCurrentRound(1);
    setTurnStage('quiz-shoot');
    setPlayerGoals(0);
    setOpponentGoals(0);
    setPlayerShootHistory([null, null, null, null, null]);
    setOpponentShootHistory([null, null, null, null, null]);
    setWinnerTeam(null);
    setLastShotResult(null);
    setCorrectStreak(0);
    setLastWrongQuiz(null);
    triggerNextQuiz();
  };

  const handleResetSeasonAndTeams = () => {
    setSeasonMatch(1);
    setSeasonWins(0);
    setSeasonLosses(0);
    setGameStage('select-teams');
  };

  // Generate word quiz corresponding with card set
  const triggerNextQuiz = () => {
    if (set.cards.length === 0) return;
    
    // Choose a random card
    const randomCard = set.cards[Math.floor(Math.random() * set.cards.length)];
    const correctAns = randomCard.term;

    const otherCards = set.cards.filter(c => c.id !== randomCard.id);
    const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 2).map(c => c.term);

    const options = [correctAns, ...distractors].sort(() => Math.random() - 0.5);

    setQuizCard(randomCard);
    setQuizOptions(options);
    setSelectedAns(null);
    setQuizChecked(false);
    setQuizIsCorrect(false);
  };

  const handleVerifyAnswer = () => {
    if (!quizCard || !selectedAns || quizChecked) return;

    const isCorrect = selectedAns === quizCard.term;
    setQuizIsCorrect(isCorrect);
    setQuizChecked(true);
    setTotalQuestionsAsked(prev => prev + 1);

    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1);
      setCorrectStreak(prev => prev + 1);
      // Play reward synthesized chime
      audioSynth.playCorrect();
      // Burst mini confetti!
      setQuizConfettiTrigger(prev => prev + 1);
      setLastWrongQuiz(null);
    } else {
      setCorrectStreak(0);
      setLastWrongQuiz(quizCard);
      // Play incorrect low-pitch buzz
      audioSynth.playIncorrect();
    }
  };

  // Proceed to the shooting field after answering
  const handleGoToShoot = () => {
    setTurnStage('shoot');
    setPlayerShotDir(null);
    setGateKeeperState('idle');
  };

  const handleGoToDive = () => {
    setTurnStage('dive');
    setPlayerDiveDir(null);
    setGateKeeperState('idle');
  };

  const mapDirectionToGKState = (dir: TargetDirection) => {
    switch (dir) {
      case 'top-left': return 'dive-left';
      case 'bottom-left': return 'bottom-left';
      case 'top-right': return 'dive-right';
      case 'bottom-right': return 'bottom-right';
      case 'center': return 'jump-center';
      default: return 'idle';
    }
  };

  // Handle player Kicking the penalty
  const handlePlayerShoot = (direction: TargetDirection, forceQuizIncorrect = false) => {
    if (animatingBall || kickerAction === 'run') return;
    const isQuizCorrectActual = forceQuizIncorrect ? false : quizIsCorrect;

    setPlayerShotDir(direction);
    setAiActiveShotDir(null);
    setNetShaking(false);
    setShotResultType('idle');
    
    // Step 1: Kicker starts the run-up!
    setKickerAction('run');
    setGateKeeperState('idle');

    // AI Goalkeeper randomly decides a direction
    const directions: TargetDirection[] = ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];
    let aiGKSelection = directions[Math.floor(Math.random() * directions.length)];

    // Calculate goals and specific physics trajectories
    let isGoal = false;
    let commentary = '';
    let shotResultTemp: 'goal' | 'saved' | 'miss' | 'hit-post' = 'saved';

    // Check side of the shot and the goalkeeper dive
    const playerSide = getSide(direction);

    // Roll for automatic misses if incorrect quiz
    let willMissCompletely = false;
    let willHitPost = false;

    if (!isQuizCorrectActual) {
      // Player answered INCORRECTLY: guaranteed to be saved or miss or hit post!
      const roll = Math.random();
      if (roll < 0.40) {
        // 40% shoot wide
        willMissCompletely = true;
      } else if (roll < 0.70) {
        // 30% hit post
        willHitPost = true;
      } else {
        // 30% on-target but goalkeeper is forced to save it!
        aiGKSelection = direction; // Forced match save
      }
    }

    if (willMissCompletely) {
      shotResultTemp = 'miss';
      const missModes = [
        'SÚT RA NGOÀI! Chân sút bị áp lực do trả lời sai nên dứt điểm lệch hoàn toàn cột dọc bay ra hết đường biên ngang!',
        'CÚ SÚT QUÁ THIẾU CHÍNH XÁC! Bóng bay vọt thẳng lên khán đài trong sự tiếc nuối tột cùng của khán giả.',
        'BÓNG ĐI CHỆCH CỘT! Bạn cứa lòng thiếu chuẩn xác khiến bóng lượn vòng ra ngoài biên ngang.'
      ];
      commentary = missModes[Math.floor(Math.random() * missModes.length)];
      // GK dives randomly to a different side to match the wide shot
      const otherDirections = directions.filter(d => getSide(d) !== playerSide);
      if (otherDirections.length > 0) {
        aiGKSelection = otherDirections[Math.floor(Math.random() * otherDirections.length)];
      }
    } else if (willHitPost) {
      shotResultTemp = 'hit-post';
      const postModes = [
        'ĐẬP CỘT DỌC BẬT RA! Cú sút sấm sét của bạn dội trúng cột dọc nảy ngược ra sân, thủ môn đã đổ người bất lực!',
        'ĐẬP XÀ NGANG BẬT RA! Bạn sút hơi bổng khiến bóng đập trực diện dội mạnh vào xà ngang kêu "coong" đanh thép rồi nảy ra ngoài!',
        'XÀ NGANG CỨU THUA! Quả bóng chạm mép dưới xà ngang rồi dội ngược về phía sau cực kỳ kịch tính!'
      ];
      commentary = postModes[Math.floor(Math.random() * postModes.length)];
      // GK dives randomly but fails to reach
      const otherDirections = directions.filter(d => getSide(d) !== playerSide);
      if (otherDirections.length > 0) {
        aiGKSelection = otherDirections[Math.floor(Math.random() * otherDirections.length)];
      }
    } else {
      // On-target shot! Compare Goalkeeper direction side vs player shot side
      const gkSide = getSide(aiGKSelection);

      if (gkSide === playerSide) {
        // Same Side = Save! (As they are on the same side)
        isGoal = false;
        shotResultTemp = 'saved';

        // Fireball bonus: reduce AI goalkeeper save chance by 30%!
        if (correctStreak >= 3 && Math.random() < 0.30) {
          isGoal = true;
          shotResultTemp = 'goal';
          commentary = `SIÊU PHẨM BÓNG LỬA BẮT BÀI THỦ MÔN! Quả bóng lửa 🔥⚽ găm thẳng vào góc ${translateDirection(direction)} với vận tốc cực đại xé toạc đôi bàn tay của thủ môn dù đoán đúng hướng đổ! VÀOOOO!`;
        } else if (direction === aiGKSelection) {
          // Exact spot match - perfect save
          if (isQuizCorrectActual && correctStreak >= 3 && Math.random() < 0.45) {
            // Hot streak exception: even if guessed correctly, might slip in
            isGoal = true;
            shotResultTemp = 'goal';
            commentary = `ÁP LỰC ĐÈ BẸP ĐỐI THỦ! Dù thủ môn đoán đúng góc ${translateDirection(direction)} nhưng do áp lực tâm lý từ chuỗi trả lời đúng của bạn, thủ môn lúng túng đẩy bóng thẳng vào lưới! VÀOOOO!`;
          } else {
            commentary = `THỦ MÔN BẮT BÀI ĐẲNG CẤP! Thủ môn đối phương đoán chính xác góc sút hiểm góc ${translateDirection(direction)} và dễ dàng ôm gọn bóng!`;
          }
        } else {
          // Same side but different height (e.g. top-left vs bottom-left) - pushes it away
          aiGKSelection = direction; // Visual adjustment to make goalkeeper reach the same corner
          commentary = `THỦ MÔN ĐẨY BANH XUẤT SẮC! Thủ môn nhảy đúng hướng ${playerSide === 'left' ? 'bên trái' : playerSide === 'right' ? 'bên phải' : 'chính giữa'} và bay người rướn tay đẩy quả bóng nảy vọt ra ngoài biên ngang chịu phạt góc!`;
        }
      } else {
        // Different Side = Goal!
        if (isQuizCorrectActual && correctStreak === 0 && Math.random() < 0.15) {
          isGoal = false;
          shotResultTemp = 'saved';
          aiGKSelection = direction; // Make goalkeeper visually dive to the correct spot
          commentary = `THỦ MÔN HÓA RỒNG! Đối phương phản xạ xuất thần, thủ môn bay người cản phá không tưởng cú sút hiểm hóc vào góc ${translateDirection(direction)} dù bị đổ người ban đầu!`;
        } else {
          isGoal = true;
          shotResultTemp = 'goal';
          const scorerSentences = [
            `VÀOOOOOO! Cú dứt điểm cực kỳ hiểm hóc găm bóng vào ${translateDirection(direction)} đánh lừa hoàn toàn hướng đổ của thủ thành đối thủ!`,
            `VÀOOO! Thủ môn đã bay sai hướng sang bên ${gkSide === 'left' ? 'trái' : gkSide === 'right' ? 'phải' : 'chính giữa'}, mành lưới rung lên bần bật trong tiếng reo hò!`,
            `GHI BÀN TUYỆT ĐỈNH! Pha dứt điểm gọn gàng vào góc ${translateDirection(direction)} lượn hình vòng cung không thể cản phá!`
          ];
          commentary = scorerSentences[Math.floor(Math.random() * scorerSentences.length)];
        }
      }
    }

    const outcomeRecord: ShotResult = {
      round: currentRound,
      isPlayerShooter: true,
      quizCorrect: isQuizCorrectActual,
      playerSelection: direction,
      aiSelection: aiGKSelection,
      scored: isGoal,
      commentary
    };

    // Determine dynamic durations based on fireball streak (duration halved)
    const isFireball = correctStreak >= 3;
    const impactDuration = isFireball ? 250 : 500;
    const hitPostDuration = isFireball ? 220 : 450;
    const resolutionDuration = isFireball ? 500 : 1000;

    // Step 2: 600ms Run-up, then strike the ball!
    setTimeout(() => {
      setKickerAction('kick');
      audioSynth.playKick(); // Play synthesized ball kick sound
      setAnimatingBall(true);
      setGateKeeperState(mapDirectionToGKState(aiGKSelection));

      // Determine dynamic physics outcome style
      setShotResultType(shotResultTemp);

      // Step 3: Trigger goal or collision events
      if (isGoal) {
        setTimeout(() => {
          setNetShaking(true);
          // Trigger screen shake on goal impact!
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 400);

          // Play referee whistle and ecstatic audience cheers!
          audioSynth.playGoalCelebration();
          // Burst beautiful fireworks of confetti!
          setGoalConfettiTrigger(prev => prev + 1);
        }, impactDuration);
      } else {
        // If saved by AI keeper of direct save
        if (shotResultTemp === 'saved' && direction === aiGKSelection) {
          setTimeout(() => {
            audioSynth.playSave(); // Glove touch thud sound
          }, impactDuration);
        } else if (shotResultTemp === 'hit-post') {
          setTimeout(() => {
            audioSynth.playPostHit(); // Metallic collision impact sound!
            
            // Trigger screen shake on mechanical post hits!
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 400);

            setPostCollided(true);
            setTimeout(() => setPostCollided(false), 200);
          }, hitPostDuration); // post hit collision timing
        }
      }

      // Step 4: Complete shot resolution
      setTimeout(() => {
        setKickerAction(isGoal ? 'celebrate' : 'miss');
        setLastShotResult(outcomeRecord);

        // Update scorecard
        if (isGoal) {
          setPlayerGoals(prev => prev + 1);
        }

        // Record visual history
        const nextHistory = [...playerShootHistory];
        if (currentRound <= 5) {
          nextHistory[currentRound - 1] = isGoal;
          setPlayerShootHistory(nextHistory);
        } else {
          setPlayerShootHistory(prev => [...prev, isGoal]);
        }

        // Keep target result visible for a brief moment, then advance to GK quiz!
        setTimeout(() => {
          setAnimatingBall(false);
          setPlayerDiveDir(null);
          setGateKeeperState('idle');
          setNetShaking(false);
          setKickerAction('idle');
          setShotResultType('idle');

          setTurnStage('quiz-dive');
          triggerNextQuiz();
        }, 1500);

      }, resolutionDuration);

    }, 600);
  };

  // Handle player defending as the Goalkeeper
  const handlePlayerDefend = (direction: TargetDirection, forceQuizIncorrect = false) => {
    if (animatingBall || kickerAction === 'run') return;
    const isQuizCorrectActual = forceQuizIncorrect ? false : quizIsCorrect;

    setPlayerDiveDir(direction);
    setAiActiveShotDir(null);
    setNetShaking(false);
    setShotResultType('idle');

    // AI shooter decides direction
    const directions: TargetDirection[] = ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];
    let aiShooterSelection = directions[Math.floor(Math.random() * directions.length)];

    if (!isQuizCorrectActual) {
      // If quiz is incorrect, force the shooter direction to go to a different side, assuring dive is visually wrong!
      const playerGKSide = getSide(direction);
      const otherDirections = directions.filter(d => getSide(d) !== playerGKSide);
      if (otherDirections.length > 0) {
        aiShooterSelection = otherDirections[Math.floor(Math.random() * otherDirections.length)];
      }
    }

    // Calculate save and specific physics trajectories
    let isGoal = false;
    let commentary = '';
    let shotResultTemp: 'goal' | 'saved' | 'miss' | 'hit-post' = 'goal';

    if (!isQuizCorrectActual) {
      // Answered incorrectly: goalkeeper fails to dive correctly!
      isGoal = true;
      shotResultTemp = 'goal';
      const failModes = [
        'ĐỐI THỦ GHI BÀN DỄ DÀNG! Bạn phân tâm do trả lời sai từ vựng, thủ môn đứng chôn chân nhìn bóng bay vào lưới.',
        'BÀN THẮNG CHO ĐỐI PHƯƠNG! Bạn bay người sai hướng hoàn toàn do phán đoán sai nghĩa từ vựng.',
        'RẤT ĐÁNG TIẾC! Cú sút không quá hiểm hóc nhưng bạn đổ người chậm chạp vì mất tập trung ở câu hỏi từ vựng.'
      ];
      commentary = failModes[Math.floor(Math.random() * failModes.length)];
    } else {
      // Answered correctly
      const playerGKSide = getSide(direction);
      const aiShooterSide = getSide(aiShooterSelection);

      if (playerGKSide === aiShooterSide) {
        // Correct side guessed! Saved!
        isGoal = false;
        shotResultTemp = 'saved';
        
        if (direction === aiShooterSelection) {
          // Exact spot match
          commentary = `BẮT BÓNG ĐẲNG CẤP! Bạn đã phản xạ xuất thần bay người ôm gọn cú sút căng thẳng vào góc ${translateDirection(direction)}!`;
        } else {
          // Same side but different corner (e.g. top vs bottom) - push ball away
          commentary = `CỨU THUA XUẤT SẮC! Bạn phán đoán đúng hướng bên ${playerGKSide === 'left' ? 'trái' : playerGKSide === 'right' ? 'phải' : 'chính giữa'}, rướn người đẩy bóng dứt khoát ra ngoài biên ngang chịu phạt góc!`;
        }
      } else {
        // Goal scored by AI, but if player answered correctly, there is default 20% chance of AI missing.
        // If they have correctStreak >= 3, AI under extreme panic pressure! We add a bonus miss chance of 45% (total 65% chance of missing/hitting post!)
        const aiMissRoll = Math.random();
        const bonusMissChance = correctStreak >= 3 ? 0.45 : 0.0;
        
        if (aiMissRoll < (0.1 + bonusMissChance / 2)) {
          isGoal = false;
          shotResultTemp = 'miss'; // Scenario 1: AI shoots wide
          commentary = `BÓNG BAY RA NGOÀI BIÊN! Bạn đoán sai hướng đổ người sang ${translateDirection(direction)}, nhưng chân sút đối phương chịu áp lực từ chuỗi thắng của bạn đã sút chệch cột dọc đi thẳng ra đường biên ngang!`;
        } else if (aiMissRoll < (0.2 + bonusMissChance)) {
          isGoal = false;
          shotResultTemp = 'hit-post'; // Scenario 2: AI hits post and rebounds
          commentary = `CỘT DỌC CỨU THUA NGOẠN MỤC! Quả bóng đập trúng cột dọc nảy ngược lại phía sân đấu dưới áp lực từ bạn, khi bạn đổ người sang ${translateDirection(direction)} sai hướng!`;
        } else {
          isGoal = true;
          shotResultTemp = 'goal';
          commentary = `BÀN THẮNG CHO ĐỐI PHƯƠNG! Đối thủ sút bóng hiểm vào góc ${translateDirection(aiShooterSelection)}, trong khi bạn bay người sang ${translateDirection(direction)} bất lực.`;
        }
      }
    }

    const outcomeRecord: ShotResult = {
      round: currentRound,
      isPlayerShooter: false,
      quizCorrect: isQuizCorrectActual,
      playerSelection: direction,
      aiSelection: aiShooterSelection,
      scored: isGoal,
      commentary
    };

    // Step 2: 600ms Run-up, then strike the ball!
    setTimeout(() => {
      // AI kicker strikes!
      setAiActiveShotDir(aiShooterSelection);
      setKickerAction('kick');
      audioSynth.playKick(); // Play ball kick sound
      setAnimatingBall(true);
      setGateKeeperState(mapDirectionToGKState(direction));

      // Determine dynamic physics outcome style
      setShotResultType(shotResultTemp);

      // Step 3: Trigger goal, save or collision events (450ms-500ms after kick)
      if (isGoal) {
        setTimeout(() => {
          setNetShaking(true);
          // Trigger screen shake on goal impact!
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 400);

          // Play opponent goal confirmation whistle + cheering
          audioSynth.playGoalCelebration();
        }, 500);
      } else {
        // If saved by player
        if (shotResultTemp === 'saved' && direction === aiShooterSelection) {
          setTimeout(() => {
            audioSynth.playSave(); // glove crash thud
            // Play crowd chant cheering for the keeper
            audioSynth.playCheer();
            // Trigger spectacular save confetti reward!
            setGoalConfettiTrigger(prev => prev + 1);
          }, 500);
        } else if (shotResultTemp === 'hit-post') {
          setTimeout(() => {
            audioSynth.playPostHit(); // Metallic collision clank sound!
            
            // Trigger screen shake on post hits!
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 400);

            setPostCollided(true);
            setTimeout(() => setPostCollided(false), 200);
          }, 450); // collision timing
        }
      }

      // Step 4: Resolve
      setTimeout(() => {
        setKickerAction(isGoal ? 'celebrate' : 'miss');
        setLastShotResult(outcomeRecord);

        // Score record
        if (isGoal) {
          setOpponentGoals(prev => prev + 1);
        }

        // Update historic charts
        const nextHistory = [...opponentShootHistory];
        if (currentRound <= 5) {
          nextHistory[currentRound - 1] = isGoal;
          setOpponentShootHistory(nextHistory);
        } else {
          setOpponentShootHistory(prev => [...prev, isGoal]);
        }

        // Display results recap panel
        setTimeout(() => {
          setAnimatingBall(false);
          setNetShaking(false);
          setKickerAction('idle');
          setAiActiveShotDir(null);
          setShotResultType('idle');
          setTurnStage('result');
        }, 1500);

      }, 1000);

    }, 600);
  };

  // Close Round Result stage and step to the next round or end the match
  const handleNextTurn = () => {
    // Check if match has finished
    const playerPlayedCount = playerShootHistory.filter(h => h !== null).length;
    const opponentPlayedCount = opponentShootHistory.filter(h => h !== null).length;

    // Standard best of 5 shootout logic
    let playerWonMatch = false;
    let opponentWonMatch = false;
    let isGameOver = false;

    // Remaining shots
    const playerShotsRemaining = Math.max(0, 5 - playerPlayedCount);
    const opponentShotsRemaining = Math.max(0, 5 - opponentPlayedCount);

    if (playerPlayedCount <= 5 && opponentPlayedCount <= 5) {
      // Can anyone win early?
      if (playerGoals > opponentGoals + opponentShotsRemaining) {
        playerWonMatch = true;
        isGameOver = true;
      } else if (opponentGoals > playerGoals + playerShotsRemaining) {
        opponentWonMatch = true;
        isGameOver = true;
      } else if (playerPlayedCount === 5 && opponentPlayedCount === 5) {
        if (playerGoals > opponentGoals) {
          playerWonMatch = true;
          isGameOver = true;
        } else if (opponentGoals > playerGoals) {
          opponentWonMatch = true;
          isGameOver = true;
        } else {
          // ENTER SUDDEN DEATH
          setCurrentRound(prev => prev + 1);
          setTurnStage('quiz-shoot');
          triggerNextQuiz();
        }
      } else {
        // Play next standard round
        setCurrentRound(prev => playerPlayedCount === opponentPlayedCount ? prev + 1 : prev); // match index logic
        setTurnStage('quiz-shoot');
        triggerNextQuiz();
      }
    } else {
      // SUDDEN DEATH state (both shot counts are identical and >= 5)
      // Play finishes whenever round count is matching and one has more goals
      if (playerPlayedCount === opponentPlayedCount) {
        if (playerGoals > opponentGoals) {
          playerWonMatch = true;
          isGameOver = true;
        } else if (opponentGoals > playerGoals) {
          opponentWonMatch = true;
          isGameOver = true;
        } else {
          // Keep sudden death going
          setCurrentRound(prev => prev + 1);
          setTurnStage('quiz-shoot');
          triggerNextQuiz();
        }
      } else {
        // Player shot has completed but Opponent has one remaining in sudden death
        // Do not verify winner until both finished equivalent turns
        setCurrentRound(prev => prev); // keep round
        setTurnStage('quiz-shoot');
        triggerNextQuiz();
      }
    }

    if (isGameOver) {
      const playerWon = playerWonMatch;
      setWinnerTeam(playerWon ? playerTeam : opponentTeam);

      // Record this match to the session database
      const newHistoryItem = {
        opponent: opponentTeam,
        playerScore: playerGoals,
        opponentScore: opponentGoals,
        winnerName: playerWon ? playerTeam.name : opponentTeam.name,
        isPlayerWinner: playerWon,
        date: new Date().toLocaleDateString('vi-VN')
      };

      setMatchHistory(prev => {
        const nextHist = [newHistoryItem, ...prev].slice(0, 15); // keep last 15 matches
        try {
          localStorage.setItem('soccer_penalty_history', JSON.stringify(nextHist));
        } catch (e) {
          console.error(e);
        }
        return nextHist;
      });

      if (playerWon) {
        setSeasonWins(prev => prev + 1);
        // Play epic stadium championship celebration music/ref Whistle and crowd cheer!
        audioSynth.playGoalCelebration();
        // Trigger multi-stage championship confetti showers
        setGoalConfettiTrigger(prev => prev + 1);
        setTimeout(() => setGoalConfettiTrigger(prev => prev + 1), 400);
        setTimeout(() => setGoalConfettiTrigger(prev => prev + 1), 800);
      } else {
        setSeasonLosses(prev => prev + 1);
        // Match lost: play a quick referee end whistle
        audioSynth.playWhistle();
      }
      setGameStage('over');
    }
  };

  const translateDirection = (dir: TargetDirection) => {
    switch (dir) {
      case 'top-left': return 'Góc Cao Bên Trái';
      case 'top-right': return 'Góc Cao Bên Phải';
      case 'center': return 'Chính Giữa Khung Thành';
      case 'bottom-left': return 'Góc Dưới Bên Trái';
      case 'bottom-right': return 'Góc Dưới Bên Phải';
    }
  };

  return (
    <div className="bg-[#0f172a] text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 min-h-[580px] flex flex-col md:flex-row animate-fade-in relative">
      
      {/* High-fidelity Confetti Particle overlays */}
      <Confetti triggerId={quizConfettiTrigger} count={50} origin="center" />
      <Confetti triggerId={goalConfettiTrigger} count={130} origin="sides" />
      
      {/* LEFT OR UPPER GAMEPLAY CONTROL BAR */}
      <div className="md:w-[320px] bg-[#1e293b] border-b md:border-b-0 md:border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Header Back option */}
          <div className="flex items-center gap-2 mb-6">
            <button
              id="penalty-soccer-back"
              onClick={onBack}
              className="p-2 hover:bg-slate-700/60 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Trò chơi tương tác</span>
              <h1 className="text-sm font-extrabold tracking-tight uppercase text-white flex items-center gap-1">
                🏟️ Sút Penalty Trí Tuệ
              </h1>
            </div>
          </div>

          {/* Current select setup overview */}
          {gameStage === 'select-teams' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-450 uppercase mb-3 flex items-center gap-1.5">
                  <User size={13} className="text-brand" /> Đội của bạn
                </h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-sm border-2 shadow-inner"
                    style={{ backgroundColor: playerTeam.primaryColor, borderColor: playerTeam.secondaryColor }}
                  >
                    {playerTeam.shortName}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white">{playerTeam.name}</p>
                    <p className="text-[10px] text-slate-400">Sân: {playerTeam.stadium}</p>
                  </div>
                </div>
              </div>

              {/* Season Stats Summary */}
              <div className="p-4 bg-indigo-950/30 border border-indigo-900/40 rounded-xl">
                <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">📊 Tiến độ mùa giải</h4>
                <p className="text-xs text-slate-350">
                  Bạn đang chuẩn bị bước vào <strong>Vòng đấu {seasonMatch}</strong> trong chiến dịch Penalty Cup Championship.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                  <div className="bg-[#0f172a]/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block">Thắng</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">{seasonWins}</span>
                  </div>
                  <div className="bg-[#0f172a]/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase block">Thua</span>
                    <span className="text-lg font-bold text-rose-400 font-mono">{seasonLosses}</span>
                  </div>
                </div>
              </div>

              {/* Tips banner Box */}
              <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 rounded-xl flex items-start gap-2 text-xs">
                <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-slate-350 leading-relaxed text-[11px] font-medium">
                  <strong>Luật penalty:</strong> Sút & Đỡ luân phiên 5 lượt. Bạn phải trả lời đúng từ vựng trước khi sút & đỡ bóng. <span className="font-bold text-rose-300">Nếu trả lời sai, bóng sút sụt lệch bên ngoài và đối phương ghi bàn dễ dàng!</span>
                </p>
              </div>
            </div>
          ) : (
            /* ACTIVE SCOREBOARD COLUMN */
            <div className="space-y-4">
              {/* Season banner badge */}
              <div className="bg-[#1e293b] p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[8px] font-extrabold tracking-widest text-[#6CABDD] uppercase block">MÙA GIẢI PENALTY</span>
                  <span className="font-extrabold text-white text-sm">Vòng đấu {seasonMatch}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">THÀNH TÍCH</span>
                  <span className="text-xs font-bold font-mono">
                    <span className="text-emerald-400">{seasonWins} T</span> - <span className="text-rose-400">{seasonLosses} B</span>
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-xl text-center relative overflow-hidden transition-all duration-300 ${
                correctStreak >= 3 
                  ? 'border-orange-500 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.18),transparent)] shadow-[0_0_15px_rgba(249,115,22,0.3)] bg-slate-900 border' 
                  : 'bg-[#0f172a] border border-slate-850'
              }`}>
                {correctStreak >= 3 ? (
                  <div className="absolute top-0 left-0 right-0 py-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-[8px] font-black text-white uppercase tracking-widest block text-center animate-pulse">
                    🔥 ĐANG CHÁY LƯỚI (STREAK FIRE) 🔥
                  </div>
                ) : currentRound > 5 && (
                  <div className="absolute top-0 left-0 right-0 py-0.5 bg-rose-600 text-[9px] font-bold text-white uppercase tracking-widest block text-center">
                    Cái Chết Bất Tử (Sudden Death) ⚡
                  </div>
                )}
                
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Loạt Luân Lưu {currentRound}/5</p>
                
                {/* Score panel digits */}
                <div className="flex items-center justify-around my-3">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{playerTeam.shortName}</span>
                    <span className="text-3xl font-extrabold text-[#6CABDD] font-mono leading-none">{playerGoals}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-600">-</span>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{opponentTeam.shortName}</span>
                    <span className="text-3xl font-extrabold text-rose-500 font-mono leading-none">{opponentGoals}</span>
                  </div>
                </div>

                {/* Scoreboard visual lights */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[9px] font-bold uppercase text-slate-400">{playerTeam.shortName}:</span>
                    <div className="flex items-center gap-1">
                      {playerShootHistory.map((scored, i) => (
                        <span 
                          key={i} 
                          className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold ${
                            scored === null ? 'bg-slate-800 text-transparent border border-slate-700' :
                            scored ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {scored !== null && (scored ? '✓' : '✗')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[9px] font-bold uppercase text-slate-400">{opponentTeam.shortName}:</span>
                    <div className="flex items-center gap-1">
                      {opponentShootHistory.map((scored, i) => (
                        <span 
                          key={i} 
                          className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold ${
                            scored === null ? 'bg-slate-800 text-transparent border border-slate-700' :
                            scored ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {scored !== null && (scored ? '✓' : '✗')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status helper text block */}
              <div className="p-3 bg-slate-800 border border-slate-700/50 rounded-xl relative">
                <span className="text-[9px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full mb-1 inline-block">Báo cáo lượt sút</span>
                {lastShotResult ? (
                  <div className="text-[11px] leading-relaxed text-slate-300">
                    <p className="font-bold text-white mb-0.5">
                      {lastShotResult.isPlayerShooter 
                        ? `${playerTeam.shortName} sút vào ${translateDirection(lastShotResult.playerSelection)}` 
                        : `${opponentTeam.shortName} dứt điểm, bạn đổ bóng`
                      }
                    </p>
                    <p className="text-slate-400">{lastShotResult.commentary}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Trận đấu chuẩn bị diễn ra. Hãy khởi đầu bằng cách vượt câu hỏi để nhận lượt sút căng!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Foot stats list */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Thống kê buổi tập</p>
          <div className="flex items-center justify-around mt-2 text-xs">
            <div>
              <span className="block text-slate-400 text-[10px]">Tỉ lệ trả lời</span>
              <span className="font-bold font-mono text-indigo-400">
                {totalQuestionsAsked > 0 ? `${Math.round((correctAnswersCount / totalQuestionsAsked) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="border-r border-slate-800 h-6" />
            <div>
              <span className="block text-slate-400 text-[10px]">Số câu chính xác</span>
              <span className="font-bold text-emerald-400">{correctAnswersCount} / {totalQuestionsAsked}</span>
            </div>
          </div>
        </div>

        {/* Match History scoreboard ticker */}
        {matchHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-left space-y-1.5">
            <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
              🏆 BẢNG VÀNG LỊCH SỬ ĐẤU ({matchHistory.length})
            </p>
            <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
              {matchHistory.map((item, hi) => (
                <div key={hi} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-800/40 last:border-0 font-medium">
                  <span className="truncate max-w-[120px] text-slate-350">
                    {item.opponent.emoji} {item.opponent.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-1 rounded-[3px] text-[8px] font-black tracking-tight ${
                      item.isPlayerWinner 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                    }`}>
                      {item.isPlayerWinner ? 'THẮNG' : 'THUA'}
                    </span>
                    <span className="font-mono text-white font-extrabold text-[11px]">{item.playerScore} - {item.opponentScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MAIN GAME SCREEN BODY (FIELD, SELECTORS, OR RESULTS) */}
      <div className="flex-1 bg-gradient-to-b from-[#111827] to-[#1e293b] p-6 sm:p-8 flex flex-col justify-center relative min-h-[460px]">
        
        {/* ============================================== */}
        {/* STAGE 1: CLUB CHANGER / TEAM CHOSEN MENU */}
        {gameStage === 'select-teams' && (
          <div className="space-y-6 text-left animate-fade-in max-w-4xl mx-auto w-full">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">CÚP PENALTY NGOẠI HẠNG & CÚP C1 🏆</h2>
              <p className="text-xs text-slate-400 mt-1">Lựa chọn câu lạc bộ yêu thích của bạn để bắt đầu mùa giải đá luân lưu đầy thách thức. Bạn chỉ cần chọn một đội bóng duy nhất của mình, các đối thủ trong mùa giải sẽ được bốc thăm ngẫu nhiên tự động!</p>
            </div>

            {/* Step 1: Select Player Team */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Chọn Đội Bóng Của Bạn để thi đấu suốt mùa giải
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-1">
                {TEAMS.map((team) => {
                  const isSelected = playerTeam.id === team.id;
                  return (
                    <button
                      id={`choose-player-team-${team.id}`}
                      key={team.id}
                      onClick={() => {
                        setPlayerTeam(team);
                      }}
                      className={`p-3 text-xs font-bold rounded-xl flex items-center gap-3 text-left border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-500' 
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-350 hover:bg-slate-800/80 hover:border-slate-600'
                      }`}
                    >
                      <span 
                        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-extrabold text-white text-[10px] border border-white/20"
                        style={{ backgroundColor: team.primaryColor }}
                      >
                        {team.shortName}
                      </span>
                      <div className="truncate">
                        <p className="truncate leading-tight font-extrabold">{team.name}</p>
                        <span className="text-[8px] opacity-60 text-slate-400">{team.category === 'EPL' ? 'Premier League' : 'UCL Winner'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch Match Trigger */}
            <div className="pt-4 flex items-center justify-end">
              <button
                id="penalty-start-match-btn"
                onClick={handleStartMatch}
                className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-extrabold uppercase tracking-widest cursor-pointer shadow-lg hover:shadow-indigo-500/20 duration-200 flex items-center justify-center gap-2"
              >
                ⚽ KHỞI TRANH MÙA GIẢI PENALTY CUP
              </button>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* STAGE 2: THE RUNNING SHOOTOUT MATCH SCENARIO */}
        {gameStage === 'match' && (
          <div className="space-y-6 animate-fade-in w-full max-w-2xl mx-auto flex flex-col justify-between h-full">
            
            {/* IN-GAME NOTIFICATIONS VIEW HEADER */}
            <div className="flex items-center justify-between text-left">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6CABDD] bg-blue-500/10 px-3 py-1 rounded-full">
                  {turnStage === 'quiz-shoot' ? 'Lượt 1: Học từ vựng trước khi sút' :
                   turnStage === 'shoot' ? 'Lượt 2: Chấm 11m sút bóng' :
                   turnStage === 'quiz-dive' ? 'Lượt 3: Học từ vựng trước khi đỡ' :
                   turnStage === 'dive' ? 'Lượt 4: Làm thủ môn bay người cản phá' : 'Kết Quả lượt sút'}
                </span>
                <p className="text-sm font-extrabold text-slate-300 mt-1">{playerTeam.shortName} vs {opponentTeam.shortName} • Vòng {currentRound}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Địa điểm diễn ra</span>
                <span className="text-xs font-extrabold text-white">{playerTeam.stadium} 🏟️</span>
              </div>
            </div>

            {/* PSYCHOLOGICAL HUD CONTROLLER */}
            <div className="bg-[#1e293b]/70 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs animate-fade-in">
              {/* Correct Streak Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chuỗi chính xác:</span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const isActive = correctStreak > i;
                    const isFlame = i === 2 && correctStreak >= 3;
                    return (
                      <span 
                        key={i} 
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                          isActive 
                            ? isFlame 
                              ? 'bg-amber-500 text-white shadow-[0_0_12px_#f59e0b] animate-bounce' 
                              : 'bg-indigo-500 text-white shadow'
                            : 'bg-slate-700 text-slate-550'
                        }`}
                      >
                        {isFlame ? '🔥' : isActive ? '✓' : ''}
                      </span>
                    );
                  })}
                  {correctStreak >= 3 && (
                    <span className="text-[10px] font-bold text-amber-400 animate-pulse uppercase tracking-tight">
                      🔥 BÓNG LỬA CHÁY LƯỚI!
                    </span>
                  )}
                </div>
              </div>

              {/* Psychological Pressure Gauge */}
              <div className="flex-1 w-full space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="uppercase tracking-wider">Áp lực đối phương (AI):</span>
                  <span className={`font-mono text-xs font-bold ${correctStreak >= 3 ? 'text-amber-400' : 'text-indigo-400'}`}>
                    {Math.min(100, correctStreak * 25)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-850 rounded-full overflow-hidden border border-slate-700 p-[1px]">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      correctStreak >= 3 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_8px_#f97316]' 
                        : correctStreak > 0 
                          ? 'bg-indigo-500' 
                          : 'bg-emerald-500/80'
                    }`}
                    style={{ width: `${Math.max(8, Math.min(100, correctStreak * 25))}%` }}
                  />
                </div>
                {correctStreak === 0 && (
                  <p className="text-[9px] text-emerald-400 font-medium italic">
                    🛡️ AI Thủ môn đang "HÓA RỒNG" (Bắt siêu dính!) • Hãy tích chuỗi trả lời đúng để đè bẹp tâm lý!
                  </p>
                )}
              </div>
            </div>
            {(turnStage === 'quiz-shoot' || turnStage === 'quiz-dive') && quizCard && (
              <div className="bg-[#1e293b]/90 border border-indigo-900/40 p-6 rounded-2xl shadow-xl w-full text-left space-y-6 animate-scale-in">
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-extrabold text-white text-base tracking-tight">
                      {turnStage === 'quiz-shoot' ? '🧠 TRÍ TUỆ ĐỊNH ĐOẠT LỰC SÚT PENALTY' : '🛡️ TRÍ TUỆ QUYẾT ĐỊNH PHẢN XẠ THỦ MÔN'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {turnStage === 'quiz-shoot'
                        ? 'Trả lời chính xác thuật ngữ từ vựng để sẵn sút bóng hiểm hóc vào lưới!'
                        : 'Trả lời chính xác thuật ngữ để thủ môn có phán đoán bay người cản phá chuẩn xác!'
                      }
                    </p>
                  </div>
                  <HelpCircle className="text-indigo-400 animate-bounce scale-110" />
                </div>

                {/* Countdown Timer Bar */}
                {!quizChecked && (
                  <div className="space-y-1.5 p-3.5 bg-[#151f32] rounded-xl border border-indigo-950/50">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className="text-sm">⏱️</span> Thời gian suy nghĩ: 
                        <span className={`font-mono font-bold ${timeLeft <= 2 ? 'text-rose-500 text-sm animate-pulse' : timeLeft <= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {timeLeft.toFixed(1)}s
                        </span>
                      </span>
                      {timeLeft <= 2 && (
                        <span className="text-rose-500 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                          ⚠️ SẮP HẾT GIỜ!
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-[1px] border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-100 ease-linear ${
                          timeLeft > 4 
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                            : timeLeft > 2 
                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                              : 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.8)] animate-pulse'
                        }`}
                        style={{ width: `${(timeLeft / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Question formulation */}
                <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 text-center relative">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Dựa vào định nghĩa bên dưới:</span>
                  <p className="text-base sm:text-lg font-bold text-slate-200 italic leading-relaxed">
                    "{quizCard.definition}"
                  </p>
                  {quizCard.example && (
                    <p className="text-xs text-slate-400 mt-2.5 italic">Ví dụ: "{quizCard.example}"</p>
                  )}
                </div>

                {/* Multiple choices options selection */}
                <div className="space-y-3">
                  {quizOptions.map((option, idx) => {
                    const isSelected = selectedAns === option;
                    let itemStyle = 'border-slate-800 hover:bg-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-650';

                    if (quizChecked) {
                      if (option === quizCard.term) {
                        itemStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold';
                      } else if (isSelected) {
                        itemStyle = 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold';
                      } else {
                        itemStyle = 'opacity-30 bg-transparent border-slate-900 text-slate-600';
                      }
                    } else if (isSelected) {
                      itemStyle = 'bg-indigo-600/20 border-indigo-500 text-[#6CABDD] font-bold';
                    }

                    return (
                      <button
                        id={`soccer-quiz-option-${idx}`}
                        key={idx}
                        disabled={quizChecked}
                        onClick={() => setSelectedAns(option)}
                        className={`w-full p-4 border rounded-xl text-left text-sm font-bold flex items-center justify-between cursor-pointer focus:outline-none transition-all ${itemStyle}`}
                      >
                        <span>{option}</span>
                        {quizChecked && option === quizCard.term && (
                          <Check size={16} className="text-emerald-500 font-black" />
                        )}
                        {quizChecked && isSelected && option !== quizCard.term && (
                          <X size={16} className="text-rose-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Correct feedback alerts */}
                {quizChecked && (
                  <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs ${
                    quizIsCorrect 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  }`}>
                    {quizIsCorrect ? (
                      <>
                        <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-white text-sm">Chính xác xuất sắc! 🎉</p>
                          <p className="mt-0.5">
                            {turnStage === 'quiz-shoot' 
                              ? 'Đôi chân vững chãi và cực kỳ thăng bằng! Hãy bước lên chấm 11m và dứt điểm ghi bàn cực hiểm.'
                              : 'Tâm lý thủ môn vô cùng tự tin, vững vàng! Hãy sẵn sàng bước vào cản phá cú sút nguy hiểm!'
                            }
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-white text-sm">Chưa chính xác! ⚠️</p>
                          <p className="mt-0.5">
                            Áp lực học thuật làm bạn lo lắng. Thuật ngữ đúng là <span className="font-extrabold text-white">"{quizCard.term}"</span>.{' '}
                            {turnStage === 'quiz-shoot' ? (
                              <span className="font-extrabold text-rose-300">Cú sút lần này của bạn chắc chắn sẽ lệch hướng ra ngoài cột dọc!</span>
                            ) : (
                              <span className="font-extrabold text-rose-300">Bạn sẽ đổ người chậm hoàn toàn, và đối phương sẽ dễ dàng sút tung lưới!</span>
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Verify navigation controls */}
                <div className="flex items-center justify-end pt-2">
                  {!quizChecked ? (
                    <button
                      id="soccer-verify-ans-btn"
                      onClick={handleVerifyAnswer}
                      disabled={!selectedAns}
                      className={`px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        selectedAns 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Xác Nhận Đáp Án
                    </button>
                  ) : (
                    <button
                      id="soccer-go-shoot"
                      onClick={turnStage === 'quiz-shoot' ? handleGoToShoot : handleGoToDive}
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-widest cursor-pointer shadow-md flex items-center gap-1 transition"
                    >
                      <span>
                        {turnStage === 'quiz-shoot' ? 'Lên Sút Penalty Chấm 11m →' : 'Bước Vào Khung Gỗ Cản Phá →'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PART B & C: THE PITCH STADIUM INTERACTIVE WITH GOALPOST KICKS & DIVE CONTROLS */}
            {(turnStage === 'shoot' || turnStage === 'dive') && (
              <div className="flex flex-col items-center justify-between space-y-6 flex-1 w-full">
                
                {/* Visual Stylesheet injection */}
                <style>{`
                  @keyframes grass-wind {
                    0% { transform: skewX(0deg); }
                    50% { transform: skewX(1deg); }
                    100% { transform: skewX(0deg); }
                  }
                  @keyframes keeper-breath {
                    0%, 100% { transform: scaleY(1) translateY(0); }
                    50% { transform: scaleY(0.95) translateY(2px); }
                  }
                  @keyframes hand-bounce {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-4px) rotate(3deg); }
                  }
                  @keyframes ball-shadow-move {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(0.3); opacity: 0.1; }
                    100% { transform: scale(0.1); opacity: 0; }
                  }
                  @keyframes net-shake-anim {
                    0%, 100% { transform: scale(1) rotate(0); }
                    15% { transform: scaleY(1.05) skewX(-2deg) translateY(-2px); }
                    30% { transform: scaleY(0.96) skewX(2deg) translateY(1px); }
                    50% { transform: scaleY(1.02) skewX(-1deg); }
                    70% { transform: scaleY(0.99); }
                  }
                  @keyframes stadium-glimmer {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                  }
                  @keyframes float-sweat {
                    0% { transform: translateY(0) opacity: 1; }
                    100% { transform: translateY(-10px) opacity: 0; }
                  }
                  @keyframes screen-shake-anim {
                    0%, 100% { transform: translate(0, 0); }
                    10%, 30%, 50%, 70%, 90% { transform: translate(-3px, -2px); }
                    20%, 40%, 60%, 80% { transform: translate(3px, 2px); }
                  }
                  .animate-shake {
                    animation: screen-shake-anim 0.4s ease-in-out;
                  }
                  .animate-net-shake {
                    animation: net-shake-anim 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
                  }
                  .animate-stadium-flash {
                    animation: stadium-glimmer 2s infinite ease-in-out;
                   }
                  .fireball-mode {
                    animation-duration: 0.55s !important;
                  }

                  /* === PHYSICS TRAJECTORIES & BALL FLIGHT ARCHITECTURES === */
                  
                  /* TOP LEFT BALL SELECTIONS */
                  @keyframes ball-anim-top-left-goal {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); filter: blur(0px); }
                    60% { transform: translate(-140px, -210px) scale(0.38) rotate(432deg); filter: blur(0.5px); }
                    75% { transform: translate(-130px, -195px) scale(0.36) rotate(540deg); }
                    100% { transform: translate(-126px, -175px) scale(0.36) rotate(580deg); }
                  }
                  @keyframes ball-anim-top-left-saved {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(-125px, -170px) scale(0.42) rotate(324deg); }
                    50% { transform: translate(-110px, -150px) scale(0.45) rotate(360deg); }
                    75% { transform: translate(-45px, -70px) scale(0.52) rotate(540deg); }
                    100% { transform: translate(25px, 20px) scale(0.65) rotate(720deg); }
                  }
                  @keyframes ball-anim-top-left-miss {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    55% { transform: translate(-205px, -240px) scale(0.32) rotate(270deg); }
                    100% { transform: translate(-270px, -280px) scale(0.2) opacity: 0; rotate(540deg); }
                  }

                  /* TOP RIGHT BALL SELECTIONS */
                  @keyframes ball-anim-top-right-goal {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); filter: blur(0px); }
                    60% { transform: translate(140px, -210px) scale(0.38) rotate(-432deg); filter: blur(0.5px); }
                    75% { transform: translate(130px, -195px) scale(0.36) rotate(-540deg); }
                    100% { transform: translate(126px, -175px) scale(0.36) rotate(-580deg); }
                  }
                  @keyframes ball-anim-top-right-saved {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(125px, -170px) scale(0.42) rotate(-324deg); }
                    50% { transform: translate(110px, -150px) scale(0.45) rotate(-360deg); }
                    75% { transform: translate(45px, -70px) scale(0.52) rotate(-540deg); }
                    100% { transform: translate(-25px, 20px) scale(0.65) rotate(-720deg); }
                  }
                  @keyframes ball-anim-top-right-miss {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    55% { transform: translate(205px, -240px) scale(0.32) rotate(-270deg); }
                    100% { transform: translate(270px, -280px) scale(0.2) opacity: 0; rotate(-540deg); }
                  }

                  /* CENTER BALL SELECTIONS */
                  @keyframes ball-anim-center-goal {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); filter: blur(0px); }
                    60% { transform: translate(0px, -210px) scale(0.34) rotate(432deg); filter: blur(0.5px); }
                    75% { transform: translate(-4px, -195px) scale(0.32) rotate(540deg); }
                    100% { transform: translate(0px, -175px) scale(0.32) rotate(580deg); }
                  }
                  @keyframes ball-anim-center-saved {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(0px, -170px) scale(0.38) rotate(324deg); }
                    50% { transform: translate(10px, -135px) scale(0.42) rotate(360deg); }
                    75% { transform: translate(45px, -65px) scale(0.52) rotate(540deg); }
                    100% { transform: translate(75px, 25px) scale(0.65) rotate(720deg); }
                  }
                  @keyframes ball-anim-center-miss {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    55% { transform: translate(0px, -260px) scale(0.28) rotate(270deg); }
                    100% { transform: translate(0px, -310px) scale(0.18) opacity: 0; rotate(540deg); }
                  }

                  /* BOTTOM LEFT BALL SELECTIONS */
                  @keyframes ball-anim-bottom-left-goal {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    60% { transform: translate(-125px, -145px) scale(0.43) rotate(432deg); }
                    75% { transform: translate(-118px, -135px) scale(0.41) rotate(540deg); }
                    100% { transform: translate(-114px, -125px) scale(0.41) rotate(580deg); }
                  }
                  @keyframes ball-anim-bottom-left-saved {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(-115px, -125px) scale(0.45) rotate(324deg); }
                    50% { transform: translate(-95px, -105px) scale(0.48) rotate(360deg); }
                    75% { transform: translate(-35px, -45px) scale(0.58) rotate(540deg); }
                    100% { transform: translate(20px, 20px) scale(0.68) rotate(720deg); }
                  }
                  @keyframes ball-anim-bottom-left-miss {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    55% { transform: translate(-195px, -135px) scale(0.38) rotate(270deg); }
                    100% { transform: translate(-245px, -125px) scale(0.25) opacity: 0; rotate(540deg); }
                  }

                  /* BOTTOM RIGHT BALL SELECTIONS */
                  @keyframes ball-anim-bottom-right-goal {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    60% { transform: translate(125px, -145px) scale(0.43) rotate(-432deg); }
                    75% { transform: translate(118px, -135px) scale(0.41) rotate(-540deg); }
                    100% { transform: translate(114px, -125px) scale(0.41) rotate(-580deg); }
                  }
                  @keyframes ball-anim-bottom-right-saved {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(120px, -125px) scale(0.45) rotate(-324deg); }
                    50% { transform: translate(100px, -105px) scale(0.48) rotate(-360deg); }
                    75% { transform: translate(40px, -45px) scale(0.58) rotate(-540deg); }
                    100% { transform: translate(-20px, 20px) scale(0.68) rotate(-720deg); }
                  }
                  @keyframes ball-anim-bottom-right-miss {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    55% { transform: translate(195px, -135px) scale(0.38) rotate(-270deg); }
                    100% { transform: translate(245px, -125px) scale(0.25) opacity: 0; rotate(-540deg); }
                  }

                  /* POST/CROSSBAR HITS & BOUNCE BACK PHYSICS ANIMATIONS */
                  @keyframes ball-anim-top-left-hit-post {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(-126px, -172px) scale(0.36) rotate(320deg); }/* Collision! */
                    48% { transform: translate(-120px, -165px) scale(0.37) rotate(340deg); }/* Back bend */
                    75% { transform: translate(-60px, -20px) scale(0.55) rotate(540deg); }/* Field bounce */
                    100% { transform: translate(-40px, 45px) scale(0.68) rotate(720deg); }/* Idle on grass */
                  }
                  @keyframes ball-anim-top-right-hit-post {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(126px, -172px) scale(0.36) rotate(-320deg); }
                    48% { transform: translate(120px, -165px) scale(0.37) rotate(-340deg); }
                    75% { transform: translate(60px, -20px) scale(0.55) rotate(-540deg); }
                    100% { transform: translate(40px, 45px) scale(0.68) rotate(-720deg); }
                  }
                  @keyframes ball-anim-center-hit-post {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(0px, -176px) scale(0.32) rotate(320deg); }/* Crossbar hit! */
                    48% { transform: translate(0px, -168px) scale(0.33) rotate(340deg); }
                    75% { transform: translate(0px, -50px) scale(0.5) rotate(540deg); }
                    100% { transform: translate(0px, 45px) scale(0.68) rotate(720deg); }
                  }
                  @keyframes ball-anim-bottom-left-hit-post {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(-128px, -120px) scale(0.42) rotate(320deg); }/* Left post hit! */
                    48% { transform: translate(-122px, -114px) scale(0.43) rotate(340deg); }
                    75% { transform: translate(-40px, -65px) scale(0.55) rotate(540deg); }
                    100% { transform: translate(25px, 35px) scale(0.68) rotate(720deg); }
                  }
                  @keyframes ball-anim-bottom-right-hit-post {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    45% { transform: translate(128px, -120px) scale(0.42) rotate(-320deg); }/* Right post hit! */
                    48% { transform: translate(122px, -114px) scale(0.43) rotate(-340deg); }
                    75% { transform: translate(40px, -65px) scale(0.55) rotate(-540deg); }
                    100% { transform: translate(-25px, 35px) scale(0.68) rotate(-720deg); }
                  }

                  /* ACTIVE COMBINATIONS */
                  .ball-run-top-left-goal { animation: ball-anim-top-left-goal 1.1s cubic-bezier(0.18, 0.89, 0.32, 1.1) forwards; }
                  .ball-run-top-left-saved { animation: ball-anim-top-left-saved 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
                  .ball-run-top-left-miss { animation: ball-anim-top-left-miss 1.1s cubic-bezier(0.25, 0.25, 0.5, 1.25) forwards; }
                  .ball-run-top-left-hit-post { animation: ball-anim-top-left-hit-post 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

                  .ball-run-top-right-goal { animation: ball-anim-top-right-goal 1.1s cubic-bezier(0.18, 0.89, 0.32, 1.1) forwards; }
                  .ball-run-top-right-saved { animation: ball-anim-top-right-saved 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
                  .ball-run-top-right-miss { animation: ball-anim-top-right-miss 1.1s cubic-bezier(0.25, 0.25, 0.5, 1.25) forwards; }
                  .ball-run-top-right-hit-post { animation: ball-anim-top-right-hit-post 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

                  .ball-run-center-goal { animation: ball-anim-center-goal 1.1s cubic-bezier(0.18, 0.89, 0.32, 1.1) forwards; }
                  .ball-run-center-saved { animation: ball-anim-center-saved 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
                  .ball-run-center-miss { animation: ball-anim-center-miss 1.1s cubic-bezier(0.25, 0.25, 0.5, 1.25) forwards; }
                  .ball-run-center-hit-post { animation: ball-anim-center-hit-post 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

                  .ball-run-bottom-left-goal { animation: ball-anim-bottom-left-goal 1.1s cubic-bezier(0.18, 0.89, 0.32, 1.1) forwards; }
                  .ball-run-bottom-left-saved { animation: ball-anim-bottom-left-saved 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
                  .ball-run-bottom-left-miss { animation: ball-anim-bottom-left-miss 1.1s cubic-bezier(0.25, 0.25, 0.5, 1.25) forwards; }
                  .ball-run-bottom-left-hit-post { animation: ball-anim-bottom-left-hit-post 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

                  .ball-run-bottom-right-goal { animation: ball-anim-bottom-right-goal 1.1s cubic-bezier(0.18, 0.89, 0.32, 1.1) forwards; }
                  .ball-run-bottom-right-saved { animation: ball-anim-bottom-right-saved 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
                  .ball-run-bottom-right-miss { animation: ball-anim-bottom-right-miss 1.1s cubic-bezier(0.25, 0.25, 0.5, 1.25) forwards; }
                  .ball-run-bottom-right-hit-post { animation: ball-anim-bottom-right-hit-post 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }

                `}</style>

                {/* Arena status banner */}
                <div className="text-center">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center justify-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
                    {turnStage === 'shoot' 
                      ? `🎯 BẠN ĐANG SÚT PHẠT ĐỀN CHO ${playerTeam.name.toUpperCase()}` 
                      : `🛡️ BẠN ĐANG LÀM THỦ MÔN CỦA ${playerTeam.name.toUpperCase()}`
                    }
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {turnStage === 'shoot' 
                      ? 'Chọn góc sút hiểm hóc để đánh bại thủ môn.'
                      : 'Phán đoán hướng bay người để cản phá cú sút đối phương.'
                    }
                  </p>
                </div>

                {/* THE 11M SHOOTOUT COURT FIELD (STYLIZED SOCCER FRAME WITH HEIGHT AND 3D PERSPECTIVE) */}
                <div className={`w-full h-80 sm:h-96 bg-gradient-to-b from-emerald-950 via-emerald-800 to-emerald-900 rounded-2xl border-4 border-slate-750 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-transform duration-75 ${screenShake ? 'animate-shake' : ''}`}>
                  
                  {/* Soccer goal net grid line markers */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  {/* Grass cut lawn strip marks */}
                  <div className="absolute inset-x-0 top-0 h-[20%] bg-emerald-950/25 pointer-events-none" />
                  <div className="absolute inset-x-0 top-[40%] h-[20%] bg-emerald-950/25 pointer-events-none" />
                  <div className="absolute inset-x-0 top-[85%] h-[15%] bg-emerald-950/25 pointer-events-none" />

                  {/* Penalty Box Line (White paint boundary) */}
                  <div className="absolute top-[50%] left-[-20%] right-[-20%] h-full border-t border-dashed border-white/25 rounded-t-full pointer-events-none" />
                  <div className="absolute top-24 left-1/2 -translate-x-1/2 w-4/5 h-24 border border-white/15 pointer-events-none" />

                  {/* Stadium glow lights */}
                  <div className="absolute top-0 left-8 w-32 h-14 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none animate-stadium-flash" />
                  <div className="absolute top-0 right-8 w-32 h-14 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none animate-stadium-flash" />

                  {/* DETAILED GOAL STRUCTURE (3D Cage Frame) */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[85%] max-w-[440px] h-36 relative z-10">
                    {/* The 3D back support net frames (gray poles extending back) */}
                    <div className="absolute inset-x-3 top-0 -bottom-1 border-t border-x border-white/10 bg-black/35 rounded-t pointer-events-none" />
                    
                    {/* Left triangle braces */}
                    <div className="absolute left-[-2px] bottom-0 top-0 w-8 border-r border-b border-t border-slate-600/35 origin-left skew-y-12 pointer-events-none" />
                    {/* Right triangle braces */}
                    <div className="absolute right-[-2px] bottom-0 top-0 w-8 border-l border-b border-t border-slate-600/35 origin-right -skew-y-12 pointer-events-none" />

                    {/* MAIN GOAL NET MESH CONTAINER */}
                    <div 
                      className={`absolute inset-0 border-4 border-[#064e3b]/15 rounded-t bg-[#064e3b]/15 shadow-[inset_0_4px_16px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-300 ${
                        netShaking 
                          ? 'animate-net-shake border-t-amber-400 border-x-amber-400 bg-amber-500/10 shadow-[inset_0_8px_48px_rgba(245,158,11,0.6),0_0_35px_rgba(245,158,11,0.4)]' 
                          : 'border-t-white border-x-white shadow-[inset_0_4px_16px_rgba(0,0,0,0.65)]'
                      }`}
                      style={{
                        backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 10px)`,
                      }}
                    >
                      {/* Deep shadows inside net */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent pointer-events-none" />
                      {/* White shiny line on the poles */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-white/25 blur-[1px]" />
                    </div>

                    {/* Highly polished White Steel Tubes */}
                    {/* Left Post */}
                    <div className={`absolute left-[-5px] top-0 bottom-0 w-2 bg-gradient-to-r from-slate-300 via-white to-slate-450 rounded-b shadow z-20 pointer-events-none transition-all duration-75 ${
                      postCollided && (playerShotDir?.includes('left') || aiActiveShotDir?.includes('left')) ? 'brightness-200 scale-x-150 shadow-[0_0_15px_#f59e0b]' : ''
                    } ${netShaking ? 'shadow-[0_0_20px_rgba(245,158,11,0.9)] scale-x-125 brightness-150' : ''}`} />
                    {/* Right Post */}
                    <div className={`absolute right-[-5px] top-0 bottom-0 w-2 bg-gradient-to-r from-slate-300 via-white to-slate-450 rounded-b shadow z-20 pointer-events-none transition-all duration-75 ${
                      postCollided && (playerShotDir?.includes('right') || aiActiveShotDir?.includes('right')) ? 'brightness-200 scale-x-150 shadow-[0_0_15px_#f59e0b]' : ''
                    } ${netShaking ? 'shadow-[0_0_20px_rgba(245,158,11,0.9)] scale-x-125 brightness-150' : ''}`} />
                    {/* Crossbar */}
                    <div className={`absolute left-[-5px] right-[-5px] top-[-5px] h-2 bg-gradient-to-b from-slate-200 via-white to-slate-350 rounded-t-sm shadow z-20 pointer-events-none transition-all duration-75 ${
                      postCollided && (playerShotDir === 'center' || aiActiveShotDir === 'center' || playerShotDir?.includes('top') || aiActiveShotDir?.includes('top')) ? 'brightness-200 scale-y-150 shadow-[0_0_15px_#f59e0b]' : ''
                    } ${netShaking ? 'shadow-[0_0_20px_rgba(245,158,11,0.9)] scale-y-125 brightness-150' : ''}`} />

                    {/* GOAL KEEPER STRUCTURE (HUMAN GOALIE MODEL) */}
                    <div 
                      id="stadium-goalkeeper"
                      className={`absolute h-24 flex flex-col items-center justify-end duration-500 ease-out transition-all z-20 ${
                        gateKeeperState === 'idle' ? 'bottom-0 left-1/2 -translate-x-1/2 scale-100' :
                        gateKeeperState === 'dive-left' ? 'bottom-8 left-6 rotate-[-55deg] scale-105' :
                        gateKeeperState === 'bottom-left' ? 'bottom-1 left-10 rotate-[-35deg] scale-100' :
                        gateKeeperState === 'dive-right' ? 'bottom-8 right-6 rotate-[55deg] scale-105' :
                        gateKeeperState === 'bottom-right' ? 'bottom-1 right-10 rotate-[35deg] scale-100' :
                        'bottom-12 left-1/2 -translate-x-1/2 rotate-0 scale-110 translate-y-[-8px]' /* jump-center */
                      }`}
                      style={{
                        transform: gateKeeperState === 'idle' 
                          ? `translateX(calc(-50% + ${keeperPatrolX}px)) scale(1)` 
                          : undefined,
                        animation: gateKeeperState === 'idle' ? 'keeper-breath 2s infinite ease-in-out' : 'none'
                      }}
                    >
                      {/* Head with skin coloring, hair and styled goalie caps */}
                      <div className="relative w-7 h-7 rounded-full bg-[#fed7aa] border border-slate-900 shadow-md flex items-center justify-center bg-[radial-gradient(circle_at_top,#ffedad_30%,#fed7aa_100%)]">
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5.5 h-3 bg-slate-800 rounded-t-full" />
                        
                        {/* Eyes / Face and game emotional eyes */}
                        <div className="flex flex-col items-center gap-[2px] mt-1 z-10">
                          <div className="flex gap-1.5">
                            <span className="w-1 h-1 bg-slate-900 rounded-full" />
                            <span className="w-1 h-1 bg-slate-900 rounded-full" />
                          </div>
                          {gateKeeperState !== 'idle' ? (
                            <div className="w-1.5 h-1.5 border-t border-x border-slate-950 rounded-b bg-red-400" />
                          ) : (
                            <div className="w-2.5 h-0.5 bg-slate-900" />
                          )}
                        </div>

                        {/* Sweat drop effects */}
                        {gateKeeperState !== 'idle' && (
                          <span className="absolute -right-1.5 top-1 text-[8px] animate-bounce">💦</span>
                        )}

                        {/* Goalkeeper's Team Emoji */}
                        <span className="absolute -bottom-1 -left-1 text-[10px] drop-shadow">
                          {turnStage === 'shoot' ? opponentTeam.emoji : playerTeam.emoji}
                        </span>
                      </div>

                      {/* Goaltender Jersey torso */}
                      <div 
                        className="w-10 h-10 mt-[-2px] rounded-t-xl flex flex-col items-center justify-start relative shadow-md overflow-hidden"
                        style={{ 
                          backgroundColor: turnStage === 'shoot' ? opponentTeam.secondaryColor : playerTeam.secondaryColor,
                          border: `2px solid ${turnStage === 'shoot' ? opponentTeam.primaryColor : playerTeam.primaryColor}`
                        }}
                      >
                        {/* Trim colar overlay */}
                        <div 
                          className="w-4 h-2 rounded-b-md"
                          style={{ backgroundColor: turnStage === 'shoot' ? opponentTeam.primaryColor : playerTeam.primaryColor }}
                        />
                        <span className="text-[11px] font-black leading-none mt-1" style={{ color: turnStage === 'shoot' ? opponentTeam.primaryColor : playerTeam.primaryColor }}>
                          GK
                        </span>
                      </div>

                      {/* Big protective neon-green goalie gloves */}
                      <div 
                        className="absolute -left-3 top-[34px] w-4 h-4 rounded-full bg-lime-400 border border-slate-900 shadow flex items-center justify-center"
                        style={{
                          animation: gateKeeperState === 'idle' ? 'hand-bounce 1.6s infinite ease-in-out' : 'none'
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-lime-700/40" />
                      </div>
                      <div 
                        className="absolute -right-3 top-[34px] w-4 h-4 rounded-full bg-lime-400 border border-slate-900 shadow flex items-center justify-center"
                        style={{
                          animation: gateKeeperState === 'idle' ? 'hand-bounce 1.6s infinite 0.8s ease-in-out' : 'none'
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-lime-700/40" />
                      </div>

                      {/* Goalkeeper Sporty Shorts */}
                      <div className="w-8 h-4 bg-slate-900 rounded-b-sm border-t border-slate-700 shadow-inner" />
                      
                      {/* Goalkeeper Legwear & soccer socks */}
                      <div className="flex gap-2.5 w-7 h-4">
                        <div className="w-2 h-full bg-slate-100 flex flex-col justify-between">
                          <div className="h-2 bg-slate-400" />
                          <div className="h-1 bg-amber-600 rounded-b" />
                        </div>
                        <div className="w-2 h-full bg-slate-100 flex flex-col justify-between">
                          <div className="h-2 bg-slate-400" />
                          <div className="h-1 bg-amber-600 rounded-b" />
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE HOT SPOTS FOR PENALTY AIM AND TARGETING */}
                    {!animatingBall && (
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 p-1 gap-2 z-30">
                        
                        {/* 1. TOP-LEFT TARGET */}
                        <button
                          id="aim-top-left"
                          disabled={animatingBall}
                          onClick={() => turnStage === 'shoot' ? handlePlayerShoot('top-left') : handlePlayerDefend('top-left')}
                          className="border border-white/5 bg-transparent hover:bg-rose-500/15 hover:border-rose-400/50 rounded flex items-center justify-center group cursor-pointer transition-all duration-200"
                        >
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-white opacity-45 group-hover:opacity-100 bg-black/80 px-1.5 py-0.5 rounded shadow-lg border border-white/10 uppercase tracking-tight">1. Góc Cao Trái</span>
                        </button>

                        {/* 3. CENTER TARGET */}
                        <button
                          id="aim-center"
                          disabled={animatingBall}
                          onClick={() => turnStage === 'shoot' ? handlePlayerShoot('center') : handlePlayerDefend('center')}
                          className="border border-white/5 bg-transparent hover:bg-amber-500/15 hover:border-amber-400/50 rounded flex items-center justify-center group cursor-pointer transition-all duration-200 row-span-2"
                        >
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-white opacity-45 group-hover:opacity-100 bg-black/80 px-1.5 py-0.5 rounded shadow-lg border border-white/10 uppercase tracking-tight">3. Chính Giữa</span>
                        </button>

                        {/* 2. TOP-RIGHT TARGET */}
                        <button
                          id="aim-top-right"
                          disabled={animatingBall}
                          onClick={() => turnStage === 'shoot' ? handlePlayerShoot('top-right') : handlePlayerDefend('top-right')}
                          className="border border-white/5 bg-transparent hover:bg-rose-500/15 hover:border-rose-400/50 rounded flex items-center justify-center group cursor-pointer transition-all duration-200"
                        >
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-white opacity-45 group-hover:opacity-100 bg-black/80 px-1.5 py-0.5 rounded shadow-lg border border-white/10 uppercase tracking-tight">2. Góc Cao Phải</span>
                        </button>

                        {/* 4. BOTTOM-LEFT TARGET */}
                        <button
                          id="aim-bottom-left"
                          disabled={animatingBall}
                          onClick={() => turnStage === 'shoot' ? handlePlayerShoot('bottom-left') : handlePlayerDefend('bottom-left')}
                          className="border border-white/5 bg-transparent hover:bg-blue-500/15 hover:border-blue-400/50 rounded flex items-center justify-center group cursor-pointer transition-all duration-200"
                        >
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-white opacity-45 group-hover:opacity-100 bg-black/80 px-1.5 py-0.5 rounded shadow-lg border border-white/10 uppercase tracking-tight">4. Góc Dưới Trái</span>
                        </button>

                        {/* 5. BOTTOM-RIGHT TARGET */}
                        <button
                          id="aim-bottom-right"
                          disabled={animatingBall}
                          onClick={() => turnStage === 'shoot' ? handlePlayerShoot('bottom-right') : handlePlayerDefend('bottom-right')}
                          className="border border-white/5 bg-transparent hover:bg-blue-500/15 hover:border-blue-400/50 rounded flex items-center justify-center group cursor-pointer transition-all duration-200"
                        >
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-white opacity-45 group-hover:opacity-100 bg-black/80 px-1.5 py-0.5 rounded shadow-lg border border-white/10 uppercase tracking-tight">5. Góc Dưới Phải</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* INTERACTIVE KICKER/SHOOTER CHARACTER (SÚT PHẠT ĐỀN) */}
                  <div 
                    className={`absolute h-24 flex flex-col items-center justify-end duration-[450ms] transition-all z-20 ${
                      kickerAction === 'idle' ? 'bottom-4 left-[35%] opacity-100 scale-100' :
                      kickerAction === 'run' ? 'bottom-11 left-[45%] opacity-100 scale-105' :
                      kickerAction === 'kick' ? 'bottom-[42px] left-[45%] opacity-100 scale-[1.08] duration-[120ms]' :
                      kickerAction === 'celebrate' ? 'bottom-5 left-[48%] opacity-100 scale-105' :
                      'bottom-4 left-[38%] opacity-100 scale-95' /* miss / disappointed */
                    }`}
                  >
                    {/* Head contour with dynamic expressions */}
                    <div className="relative w-6 h-6 rounded-full bg-[#fbd38d] border border-slate-900 shadow-sm flex items-center justify-center bg-[radial-gradient(circle_at_top,#ffebd3_20%,#fbd38d_100%)]">
                      <div className="absolute -top-1 left-0 right-0 h-2 bg-slate-950 rounded-t-full" />
                      <div className="flex flex-col items-center gap-[1px] mt-0.5 z-10">
                        <div className="flex gap-1">
                          <span className="w-0.5 h-0.5 bg-slate-950 rounded-full" />
                          <span className="w-0.5 h-0.5 bg-slate-950 rounded-full" />
                        </div>
                        {kickerAction === 'celebrate' ? (
                          <div className="w-2.5 h-1.5 bg-red-550 rounded-b-md border-t border-slate-900" />
                        ) : kickerAction === 'miss' ? (
                          <div className="w-2 h-1 border-t border-slate-950 rounded-b bg-amber-200" />
                        ) : (
                          <div className="w-1.5 h-0.5 bg-slate-950" />
                        )}
                      </div>

                      {/* Sweet sweat/tears drops */}
                      {kickerAction === 'miss' && (
                        <span className="absolute -left-1 bottom-1 text-[8px]">😢</span>
                      )}
                      {kickerAction === 'celebrate' && (
                        <span className="absolute -top-3.5 text-[8px] animate-bounce">⚽⚡</span>
                      )}

                      {/* Shooter's Team Logo Emoji */}
                      <span className="absolute -bottom-1 -right-1 text-[10px] drop-shadow">
                        {turnStage === 'shoot' ? playerTeam.emoji : opponentTeam.emoji}
                      </span>
                    </div>

                    {/* Team Color Kicking Jersey */}
                    <div 
                      className="w-8 h-9 mt-[-1px] rounded-t-lg flex flex-col items-center justify-start relative shadow border"
                      style={{ 
                        backgroundColor: turnStage === 'shoot' ? playerTeam.primaryColor : opponentTeam.primaryColor,
                        borderColor: turnStage === 'shoot' ? playerTeam.secondaryColor : opponentTeam.secondaryColor,
                        color: turnStage === 'shoot' ? playerTeam.secondaryColor : opponentTeam.secondaryColor
                      }}
                    >
                      <div 
                        className="w-3.5 h-1.5 rounded-b"
                        style={{ backgroundColor: turnStage === 'shoot' ? playerTeam.secondaryColor : opponentTeam.secondaryColor }}
                      />
                      <span className="text-[10px] font-black leading-none mt-1">
                        {turnStage === 'shoot' ? '10' : '9'}
                      </span>
                    </div>

                    {/* Kicker shorts */}
                    <div 
                      className="w-6 h-3 bg-slate-900 border-t border-slate-800"
                      style={{
                        transform: kickerAction === 'kick' ? 'rotate(-15deg)' : 'none'
                      }}
                    />

                    {/* Leg Swing animations */}
                    {kickerAction === 'kick' ? (
                      <div className="flex gap-1 w-6 h-4 transform origin-top rotate-[-25deg]">
                        <div className="w-1.5 h-full bg-slate-200 rounded-b border-b-2 border-red-500" /> 
                        <div className="w-1.5 h-4.5 bg-slate-100 mt-[-1px] rounded-b border-b-2 border-red-500 transform origin-top rotate-[65deg]" /> 
                      </div>
                    ) : kickerAction === 'run' ? (
                      <div className="flex gap-1.5 w-5 h-4">
                        <div className="w-1.5 h-full bg-slate-100 rounded-b mt-[-1px] transform rotate-[15deg]" style={{ backgroundColor: turnStage === 'shoot' ? playerTeam.secondaryColor : opponentTeam.secondaryColor }} />
                        <div className="w-1.5 h-full bg-slate-100 rounded-b mt-[1px] transform rotate-[-20deg]" style={{ backgroundColor: turnStage === 'shoot' ? playerTeam.secondaryColor : opponentTeam.secondaryColor }} />
                      </div>
                    ) : kickerAction === 'celebrate' ? (
                      <div className="flex gap-1.5 w-6 h-2">
                        <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> 
                        <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                      </div>
                    ) : (
                      <div className="flex gap-1.5 w-5 h-4">
                        <div className="w-1.5 h-full bg-slate-200 rounded-b" style={{ backgroundColor: turnStage === 'shoot' ? playerTeam.secondaryColor : opponentTeam.secondaryColor }} />
                        <div className="w-1.5 h-full bg-slate-200 rounded-b" style={{ backgroundColor: turnStage === 'shoot' ? playerTeam.secondaryColor : opponentTeam.secondaryColor }} />
                      </div>
                    )}
                  </div>

                  {/* 11M PENALTY MARKER AND FOOTBALL */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-10 flex items-center justify-center">
                    
                    {/* White circle penalty spot */}
                    <div className="w-3 h-3 bg-slate-100/90 border border-slate-350 rounded-full shadow-inner relative z-0" />

                    {/* ANIMATED HIGH-FIDELITY FOOTBALL WITH SHADOW PARALLAX */}
                    <div 
                      id="soccer-ball"
                      className={`absolute w-7 h-7 bg-white rounded-full border border-slate-950 flex items-center justify-center shadow-lg font-bold text-[8px] text-slate-900 z-30 transition-all ${
                        animatingBall 
                          ? (playerShotDir || aiActiveShotDir) && shotResultType !== 'idle'
                            ? `ball-run-${playerShotDir || aiActiveShotDir}-${shotResultType}` 
                            : 'opacity-100 scale-100 bottom-1'
                          : 'opacity-100 scale-100 bottom-1 shadow-[0_4px_6px_rgba(0,0,0,0.5)]'
                      } ${correctStreak >= 3 ? 'fireball-mode shadow-[0_0_20px_#f97316] border-orange-500 animate-pulse' : ''}`}
                      style={{
                        backgroundImage: correctStreak >= 3
                          ? `radial-gradient(circle at 35% 35%, #ffedd5 0%, #f97316 50%, #ea580c 75%, #762305 100%)`
                          : `radial-gradient(circle at 35% 35%, #ffffff 0%, #f0f0f0 40%, #c0c0c0 75%, #333333 100%)`,
                        boxShadow: animatingBall ? '0 12px 24px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      {correctStreak >= 3 ? '🔥' : '⚽'}
                    </div>
                  </div>
                </div>

                {/* Submitting instructions */}
                <div className="bg-slate-800/40 p-4 border border-slate-700/60 rounded-xl max-w-md text-center text-xs">
                  {turnStage === 'shoot' ? (
                    <p className="text-slate-300 leading-relaxed">
                      👉 Lượt sút: Hãy chọn góc sút và nhấp trực tiếp vào một trong 5 ô trên lưới để cầu thủ tiến hành lấy đà sút căng xé lưới! {!quizIsCorrect && <span className="font-bold text-rose-400">Do đáp án trước trả lời sai, bóng sẽ sút lệch ra ngoài!</span>}
                    </p>
                  ) : (
                    <p className="text-slate-300 leading-relaxed">
                      👉 Lượt đỡ: Hãy nhấp vào một góc bất kỳ trên lưới để điều khiển thủ môn bay người cản phá quả sút cực mạnh của đối thủ!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* PART D: IMMEDIATE KICK RECAP PANEL */}
            {turnStage === 'result' && lastShotResult && (
              <div className="bg-[#1e293b]/90 border border-slate-800 p-6 sm:p-8 rounded-2xl w-full text-center space-y-6 animate-scale-in">
                
                {/* Result header icon */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-4 rounded-full ${lastShotResult.scored ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {lastShotResult.scored ? (
                      <Goal size={48} className="animate-bounce" />
                    ) : (
                      <Shield size={48} className="animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-wider text-white">
                    {lastShotResult.scored ? '⚽ VÀOOOOOOO!!!' : '❌ KHÔNG VÀO!!!'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Sự kiện diễn ra ở lượt thứ {lastShotResult.round}</p>
                </div>

                {/* Detailed description and commentary log */}
                <div className="p-5 bg-slate-900/55 rounded-xl border border-slate-800 tracking-tight leading-relaxed max-w-sm mx-auto">
                  <p className="text-sm font-bold text-slate-200">
                    "{lastShotResult.commentary}"
                  </p>
                </div>

                {/* Compare target spots */}
                <div className="flex items-center justify-around text-xs max-w-xs mx-auto text-slate-400 pt-2 border-t border-slate-800">
                  <div className="text-left w-2/5">
                    <span className="block text-[10px] text-indigo-400 font-extrabold uppercase">
                      {lastShotResult.isPlayerShooter ? 'Góc Sút (Bạn)' : 'Góc Sút (Đối Thủ)'}
                    </span>
                    <strong className="text-white font-extrabold leading-normal mt-0.5 block">
                      {translateDirection(lastShotResult.isPlayerShooter ? lastShotResult.playerSelection : lastShotResult.aiSelection)}
                    </strong>
                  </div>
                  <div className="border-r border-slate-800 h-8 self-center" />
                  <div className="text-right w-2/5">
                    <span className="block text-[10px] text-rose-400 font-extrabold uppercase">
                      {lastShotResult.isPlayerShooter ? 'Thủ Môn Đỡ (AI)' : 'Thủ Môn Đỡ (Bạn)'}
                    </span>
                    <strong className="text-white font-extrabold leading-normal mt-0.5 block">
                      {translateDirection(lastShotResult.isPlayerShooter ? lastShotResult.aiSelection : lastShotResult.playerSelection)}
                    </strong>
                  </div>
                </div>

                {/* TACTICAL GOAL MINI-GRID MAP */}
                <div className="space-y-2 pt-4 border-t border-slate-800 max-w-sm mx-auto">
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest text-center">
                    📊 BẢN ĐỒ CHIẾN THUẬT GÓC BÓNG (GOAL CHART)
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-850 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:6px_6px] pointer-events-none" />
                    
                    {[
                      { key: 'top-left', label: 'Cao Trái ↖' },
                      { key: 'top-center-net', label: 'XÀ NGANG', dummy: true },
                      { key: 'top-right', label: 'Cao Phải ↗' },
                      { key: 'bottom-left', label: 'Thấp Trái ↙' },
                      { key: 'center', label: 'Chính Giữa ⏺' },
                      { key: 'bottom-right', label: 'Thấp Phải ↘' }
                    ].map((spot, idx) => {
                      if (spot.dummy) {
                        return (
                          <div key={idx} className="border border-dashed border-slate-800/40 rounded flex items-center justify-center opacity-30 text-[8px] text-slate-600 min-h-[44px]">
                            Lưới Goal
                          </div>
                        );
                      }

                      // Ball destination corner
                      const ballDir = lastShotResult.isPlayerShooter ? lastShotResult.playerSelection : lastShotResult.aiSelection;
                      // Guard dive corner
                      const diveDir = lastShotResult.isPlayerShooter ? lastShotResult.aiSelection : lastShotResult.playerSelection;

                      const isBall = ballDir === spot.key;
                      const isDive = diveDir === spot.key;
                      
                      let colorClass = 'bg-slate-900/60 border-slate-800 text-slate-500';
                      let markerText = '';
                      
                      if (isBall && isDive) {
                        colorClass = 'bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.45)]';
                        markerText = '🧤 CẢN TRÚNG';
                      } else if (isBall) {
                        colorClass = 'bg-indigo-600/85 border-indigo-400 text-white shadow-[0_0_8px_rgba(99,102,241,0.45)]';
                        markerText = '⚽ BÀN THẮNG';
                      } else if (isDive) {
                        colorClass = 'bg-rose-600/85 border-rose-400 text-white shadow-[0_0_8px_rgba(239,68,68,0.45)]';
                        markerText = '🕴️ GK BAY';
                      }
                      
                      return (
                        <div key={idx} className={`p-1 px-1.5 rounded border text-[9px] flex flex-col items-center justify-center min-h-[44px] font-extrabold transition-all duration-300 ${colorClass}`}>
                          <span>{spot.label}</span>
                          {markerText && <span className="text-[7px] mt-0.5 px-0.5 py-0.2 bg-black/40 rounded uppercase text-white tracking-tighter leading-none">{markerText}</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center gap-3 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded bg-indigo-600 border border-indigo-400 inline-block" /> Hướng sút
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded bg-rose-605 border border-rose-450 inline-block" /> GK bay người
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded bg-emerald-650 border border-emerald-400 inline-block" /> Cản phá trùng
                    </span>
                  </div>
                </div>

                {/* REVIEW LAST WRONG QUIZ CARD FOR QUICK LEARNING CORRECTION */}
                {lastWrongQuiz && (
                  <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl max-w-sm mx-auto text-left space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-extrabold uppercase bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full inline-block">
                        ⚠️ CẦN KHẮC PHỤC KIẾN THỨC
                      </span>
                      <span className="text-[9px] text-slate-450 font-mono font-bold uppercase">{lastWrongQuiz.topic}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight">Định nghĩa câu hỏi vừa sai:</p>
                      <p className="text-xs text-slate-200 italic leading-snug">"{lastWrongQuiz.definition}"</p>
                    </div>
                    <div className="pt-2 border-t border-rose-900/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] text-slate-450 uppercase block font-semibold">Thuật ngữ chính xác:</span>
                        <span className="font-extrabold text-amber-300 text-sm tracking-wide">"{lastWrongQuiz.term}"</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-450 uppercase block font-semibold">Loại từ:</span>
                        <span className="font-bold text-white text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{lastWrongQuiz.partOfSpeech}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation trigger button */}
                <div className="pt-2 flex justify-center">
                  <button
                    id="soccer-round-continue-btn"
                    onClick={handleNextTurn}
                    className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition duration-200"
                  >
                    Tiếp tụ̣c loạt sút tiếp theo ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================== */}
        {/* STAGE 3: MATCH COMPLETED / FINAL WINNER REVEALS */}
        {gameStage === 'over' && winnerTeam && (
          <div className="space-y-6 text-center animate-scale-in max-w-lg mx-auto w-full">
            
            {/* Visual celebration banner */}
            <div className="flex flex-col items-center">
              <div className="p-5 bg-amber-500/10 text-amber-500 rounded-full mb-3 animate-bounce">
                <Trophy size={64} className="fill-amber-500/20" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Trận đấu kết thúc</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mt-1">🏆 CHÚC MỪNG NHÀ VÔ ĐỊCH</h2>
            </div>

            {/* Winning team highlight */}
            <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl">
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center font-extrabold text-white text-lg border-2 shadow-inner mb-3"
                style={{ backgroundColor: winnerTeam.primaryColor, borderColor: winnerTeam.secondaryColor }}
              >
                {winnerTeam.shortName}
              </div>
              <h3 className="text-lg font-black text-white">{winnerTeam.name}</h3>
              <p className="text-slate-400 text-xs mt-1">đã giành chiến thắng vang dội với tỉ số chung cuộc: </p>
              
              <div className="text-3xl font-mono font-black text-indigo-400 mt-3 leading-none">
                {playerGoals} - {opponentGoals}
              </div>

              {/* Personal achievements logs */}
              <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 text-xs text-slate-300">
                <div className="border-r border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase">Độ chính xác từ vựng</p>
                  <strong className="text-emerald-400 text-base font-mono">
                    {totalQuestionsAsked > 0 ? `${Math.round((correctAnswersCount / totalQuestionsAsked) * 100)}%` : '0%'}
                  </strong>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Loạt đá kéo dài</p>
                  <strong className="text-white text-base font-mono">{playerShootHistory.length} lượt</strong>
                </div>
              </div>
            </div>

            {/* Game Options controls buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="soccer-next-season-btn"
                onClick={handleNextSeasonMatch}
                className="w-full sm:flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest cursor-pointer transition shadow-lg flex items-center justify-center gap-1.5"
              >
                ⏩ VÒNG TIẾP THEO (VÒNG {seasonMatch + 1}) ⚽
              </button>
              <button
                id="soccer-reset-season-btn"
                onClick={handleResetSeasonAndTeams}
                className="w-full sm:flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold rounded-xl text-xs uppercase tracking-widest cursor-pointer border border-slate-700 transition"
              >
                🔄 Reset Mùa Giải & Chọn Lại Đội
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
