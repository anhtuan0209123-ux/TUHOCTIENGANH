import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, StudySet } from '../types';
import { ArrowLeft, RefreshCw, Trophy, Heart, Smile, Sparkles, Check, X, ShieldAlert, GraduationCap } from 'lucide-react';

interface DinoGameProps {
  set: StudySet;
  onBack: () => void;
}

type GameState = 'idle' | 'running' | 'paused-collision' | 'game-over' | 'happy-ending';

interface HeartAnimation {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speedY: number;
  speedX: number;
}

export const DinoGame: React.FC<DinoGameProps> = ({ set, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game status
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Track obstacles & cards association
  const [passedCount, setPassedCount] = useState(0);
  const totalObstacles = set.cards.length;

  // Question overlay state
  const [collidedCardIndex, setCollidedCardIndex] = useState<number>(0);
  const [quizCard, setQuizCard] = useState<Card | null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAns, setSelectedAns] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState(false);

  // New strict states for quizlet prompts
  const [correctlyAnsweredCardIds, setCorrectlyAnsweredCardIds] = useState<string[]>([]);
  const [collisionStage, setCollisionStage] = useState<'choice' | 'quiz' | null>(null);
  const [autoRunningToFinish, setAutoRunningToFinish] = useState(false);

  // References to keep state values alive inside requestAnimationFrame loop
  const gameStateRef = useRef<GameState>('idle');
  const scoreRef = useRef<number>(0);
  const obstacleIndexRef = useRef<number>(0); // Current obstacle in progress
  const passCountRef = useRef<number>(0);
  const correctlyAnsweredCardIdsRef = useRef<string[]>([]);
  const autoRunningToFinishRef = useRef<boolean>(false);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    correctlyAnsweredCardIdsRef.current = correctlyAnsweredCardIds;
  }, [correctlyAnsweredCardIds]);

  useEffect(() => {
    autoRunningToFinishRef.current = autoRunningToFinish;
  }, [autoRunningToFinish]);

  // Load HighScore
  useEffect(() => {
    const saved = localStorage.getItem(`quizlet_dino_highscore_${set.id}`);
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, [set.id]);

  // Physical gameplay constants
  const canvasWidth = 800;
  const canvasHeight = 250;
  const gravity = 0.6;
  const dinoGroundY = canvasHeight - 40; // Dino baseline Y coordinate

  // Dino character properties
  const dinoRef = useRef({
    x: 100,
    y: dinoGroundY,
    width: 34,
    height: 40,
    vy: 0,
    isJumping: false,
    frame: 0,
    invincibleTimer: 0, // Blinking invincible timer
  });

  // Obstacle Class helper objects
  interface Obstacle {
    x: number;
    width: number;
    height: number;
    passed: boolean;
    cardIndex: number; // Linked card
    type: 'cactus' | 'bird' | 'double_cactus';
    y: number;
  }

  const obstaclesRef = useRef<Obstacle[]>([]);
  const scrollOffsetRef = useRef(0);
  const femaleDinoXRef = useRef<number | null>(null);
  const femaleDinoYRef = useRef<number>(dinoGroundY);
  const femaleDinoPlacedRef = useRef(false);
  const heartsArrRef = useRef<HeartAnimation[]>([]);

  // Jump key event trigger mechanism
  const triggerJump = useCallback(() => {
    const d = dinoRef.current;
    if (!d.isJumping && gameStateRef.current === 'running') {
      d.vy = -12; // Initial jump velocity thrust
      d.isJumping = true;
    }
  }, []);

  // Keyboard navigation shortcuts wrapper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameStateRef.current === 'idle') {
          startGame();
        } else if (gameStateRef.current === 'running') {
          triggerJump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerJump]);

  // Generate study obstacles sequentially with safe gap spacing
  const initObstacles = () => {
    const obsList: Obstacle[] = [];
    let currentX = 500; // Starting coordinate of first obstacle
    
    for (let i = 0; i < totalObstacles; i++) {
      // Pick dynamic types: single cactus, double cacti, bird
      let type: 'cactus' | 'bird' | 'double_cactus' = 'cactus';
      if (i % 3 === 1) type = 'double_cactus';
      else if (i % 3 === 2) type = 'bird';

      const obsWidth = type === 'double_cactus' ? 32 : (type === 'bird' ? 26 : 18);
      const obsHeight = type === 'bird' ? 22 : 36;
      const obsY = type === 'bird' ? dinoGroundY - 45 : dinoGroundY - obsHeight;

      obsList.push({
        x: currentX,
        y: obsY,
        width: obsWidth,
        height: obsHeight,
        passed: false,
        cardIndex: i,
        type,
      });

      // Increase spacing as they go to give player sufficient react time
      currentX += 340 + Math.random() * 120;
    }

    obstaclesRef.current = obsList;
    scrollOffsetRef.current = 0;
    femaleDinoXRef.current = null;
    femaleDinoPlacedRef.current = false;
    heartsArrRef.current = [];
    obstacleIndexRef.current = 0;
    passCountRef.current = 0;
    setPassedCount(0);
  };

  const startGame = () => {
    scoreRef.current = 0;
    setCurrentScore(0);
    dinoRef.current.y = dinoGroundY;
    dinoRef.current.vy = 0;
    dinoRef.current.isJumping = false;
    dinoRef.current.invincibleTimer = 0;
    
    setCorrectlyAnsweredCardIds([]);
    setAutoRunningToFinish(false);
    setCollisionStage(null);
    setQuizCard(null);
    
    initObstacles();
    setGameState('running');
  };

  // Run collision checking and animations loop inside ticking loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const gameLoop = (currentTime?: number) => {
      const now = currentTime || performance.now();
      const state = gameStateRef.current;

      // Calculate delta time
      let deltaTime = now - lastTime;
      // Cap deltaTime to avoid giant jumps when switching browser tabs (e.g., max 100ms)
      if (deltaTime > 100) deltaTime = 16.66;
      lastTime = now;

      // dtMultiplier is relative to a standard 60 FPS (16.66ms per frame)
      const dtMultiplier = deltaTime / 16.666;
      
      // Handle high precision device pixel ratio for smooth, crisp rendering on modern high-res devices
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== canvasWidth * dpr || canvas.height !== canvasHeight * dpr) {
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Clear Canvas Frame
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 2. Draw Decorative Background Horizon & Floor Track Grid Lines
      ctx.beginPath();
      ctx.moveTo(0, dinoGroundY);
      ctx.lineTo(canvasWidth, dinoGroundY);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Simple ground scrolling lines for motion effect
      if (state === 'running') {
        scrollOffsetRef.current = (scrollOffsetRef.current + 3.8 * dtMultiplier) % 40;
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let i = -40; i < canvasWidth + 40; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i - scrollOffsetRef.current, dinoGroundY);
        ctx.lineTo(i - scrollOffsetRef.current - 12, dinoGroundY + 12);
        ctx.stroke();
      }

      // Draw instruction indicator if idle
      if (state === 'idle') {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ẤN PHÍM SPACE HOẶC CLICK VÀO KHUNG NÀY ĐỂ BẮT ĐẦU CHẠY 🏃‍♂️', canvasWidth / 2, canvasHeight / 2 - 20);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Màn chơi gồm ${totalObstacles} chướng ngại vật tương đương ${totalObstacles} thẻ từ`, canvasWidth / 2, canvasHeight / 2 + 10);
      }

      // 3. Compute Dino Movement physics
      const d = dinoRef.current;
      if (state === 'running') {
        d.vy += gravity * dtMultiplier;
        d.y += d.vy * dtMultiplier;

        // Ground constraint checks
        if (d.y >= dinoGroundY) {
          d.y = dinoGroundY;
          d.vy = 0;
          d.isJumping = false;
        }

        // Animate running frame steps
        d.frame += 0.15 * dtMultiplier;
        
        // Decelerate invincibility countdown if active
        if (d.invincibleTimer > 0) {
          d.invincibleTimer = Math.max(0, d.invincibleTimer - dtMultiplier);
        }

        // Increment distance score gradually
        const oldScore = scoreRef.current;
        scoreRef.current += 1 * dtMultiplier;
        
        const oldScoreInt = Math.floor(oldScore / 10);
        const newScoreInt = Math.floor(scoreRef.current / 10);
        if (newScoreInt !== oldScoreInt) {
          setCurrentScore(newScoreInt);
        }
      }

      // 4. Render Dino
      let drawDino = true;
      if (d.invincibleTimer > 0) {
        // Toggle flashing/blinking state during invincibility shield
        drawDino = Math.floor(d.invincibleTimer / 4) % 2 === 0;
      }

      if (drawDino) {
        ctx.save();
        ctx.translate(d.x, d.y - d.height);
        
        // Draw Adorable stylized Green Dino
        ctx.fillStyle = '#22c55e'; // Green dinosaur body
        
        // Tail & Body core
        ctx.beginPath();
        ctx.moveTo(0, d.height - 10);
        ctx.quadraticCurveTo(-15, d.height - 20, -18, d.height - 22);
        ctx.lineTo(-14, d.height - 8);
        ctx.lineTo(24, d.height - 8);
        ctx.lineTo(24, 20);
        ctx.lineTo(8, 20);
        ctx.closePath();
        ctx.fill();
 
        // Main Head Block
        ctx.fillRect(8, 4, 26, 16);
        ctx.fillStyle = '#15803d'; // Darker scales
        ctx.fillRect(14, 8, 4, 4); // Eye
        
        // Cute tiny little arms
        ctx.fillStyle = '#166534';
        ctx.fillRect(24, 22, 6, 3);

        // Moving cute legs running cycle
        const runCycleFrame = Math.floor(d.frame) % 2;
        ctx.fillStyle = '#15803d';
        if (d.isJumping) {
          ctx.fillRect(4, d.height - 8, 4, 8);
          ctx.fillRect(18, d.height - 8, 4, 8);
        } else {
          // Alternative steps
          ctx.fillRect(4, d.height - 8, 4, runCycleFrame === 0 ? 8 : 4);
          ctx.fillRect(18, d.height - 8, 4, runCycleFrame === 1 ? 8 : 4);
        }

        ctx.restore();
      }

      // 5. Compute & Render Obstacles list
      const obstacles = obstaclesRef.current;
      obstacles.forEach((obs) => {
        if (state === 'running') {
          // move obstacles to the left
          obs.x -= 3.8 * dtMultiplier;
        }

        // Only draw visible obstacles
        if (obs.x + obs.width > 0 && obs.x < canvasWidth) {
          ctx.save();
          ctx.translate(obs.x, obs.y);

          // Draw custom themed obstacle vectors
          if (obs.type === 'cactus') {
            ctx.fillStyle = '#eab308'; // Cactus color: Gold/Yellow
            ctx.fillRect(5, 0, 8, obs.height); // Central stem
            ctx.fillRect(0, 10, 5, 4); // Left side arm
            ctx.fillRect(0, 6, 2, 8);
            ctx.fillRect(13, 15, 5, 4); // Right side arm
            ctx.fillRect(16, 11, 2, 8);
          } else if (obs.type === 'double_cactus') {
            ctx.fillStyle = '#ca8a04'; // Double cacti: dark gold
            // Cactus 1
            ctx.fillRect(3, 8, 6, obs.height - 8);
            ctx.fillRect(0, 15, 3, 3);
            ctx.fillRect(0, 11, 2, 6);
            // Cactus 2 (slightly offset)
            ctx.fillRect(18, 0, 8, obs.height);
            ctx.fillRect(26, 10, 4, 3);
            ctx.fillRect(29, 6, 2, 6);
          } else if (obs.type === 'bird') {
            // Draw pterodactyl bird shape
            ctx.fillStyle = '#f97316'; // Orange bird
            // Head and beak
            ctx.beginPath();
            ctx.ellipse(15, 10, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(18, 8, 8, 3); // beak

            // Wing animation cycle flap
            const wingFlap = Math.floor(d.frame) % 2 === 0;
            ctx.beginPath();
            ctx.moveTo(10, 10);
            if (wingFlap) {
              ctx.lineTo(14, 0); // flap up
              ctx.lineTo(8, 0);
            } else {
              ctx.lineTo(14, 18); // flap down
              ctx.lineTo(8, 18);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillRect(2, 9, 12, 3); // bird body tail
          }

          ctx.restore();
        }

        // Trigger safe score accumulation upon pass
        if (state === 'running' && !obs.passed && obs.x + obs.width < d.x) {
          obs.passed = true;
          passCountRef.current += 1;
          setPassedCount(passCountRef.current);
        }

        // Recycle obstacle if passed and scroll off-screen on the left, but only if we still need more correct answers
        if (state === 'running' && obs.x + obs.width < -50 && correctlyAnsweredCardIdsRef.current.length < set.cards.length) {
          const maxX = Math.max(...obstacles.map(o => o.x));
          obs.x = Math.max(maxX, canvasWidth) + 340 + Math.random() * 120;
          obs.passed = false;
        }

        // Check COLLISION threshold boundaries
        if (state === 'running' && d.invincibleTimer === 0 && !autoRunningToFinishRef.current) {
          // Simple standard AABB box intersect
          const dLeft = d.x + 3;
          const dRight = d.x + d.width - 3;
          const dTop = d.y - d.height + 4;
          const dBottom = d.y;

          const oLeft = obs.x;
          const oRight = obs.x + obs.width;
          const oTop = obs.y;
          const oBottom = obs.y + obs.height;

          if (dRight > oLeft && dLeft < oRight && dBottom > oTop && dTop < oBottom) {
            // Trigger crash pause!
            setGameState('paused-collision');
            obstacleIndexRef.current = obs.cardIndex;
            setCollidedCardIndex(obs.cardIndex);
            setCollisionStage('choice');

            // Choose a random unanswered card
            const unanswered = set.cards.filter(c => !correctlyAnsweredCardIdsRef.current.includes(c.id));
            if (unanswered.length > 0) {
              const randomCard = unanswered[Math.floor(Math.random() * unanswered.length)];
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
            } else {
              setGameState('running');
            }
          }
        }
      });

      // 6. Handle happy ending criteria when all questions answered correctly
      if (
        state === 'running' && 
        autoRunningToFinishRef.current && 
        !femaleDinoPlacedRef.current
      ) {
        femaleDinoPlacedRef.current = true;
        // Place female dino standing ahead
        femaleDinoXRef.current = canvasWidth + 200;
      }

      // Move Female Dino onto screen once spawned
      if (femaleDinoPlacedRef.current && femaleDinoXRef.current !== null) {
        if (state === 'running') {
          femaleDinoXRef.current -= 3.8 * dtMultiplier;
          
          // When Dino reaches the female dino near center-left, enter "Happy Ending Cutscene"!
          if (femaleDinoXRef.current <= d.x + d.width + 15) {
            setGameState('happy-ending');
          }
        } else if (state === 'happy-ending') {
          // Stand close to each other
          femaleDinoXRef.current = d.x + d.width + 8;
        }

        // Draw Female Pink Dino standing gracefully on right
        ctx.save();
        ctx.translate(femaleDinoXRef.current, femaleDinoYRef.current - d.height);
        
        ctx.fillStyle = '#ec4899'; // Pink dinosaur body
        ctx.beginPath();
        ctx.moveTo(20, d.height - 10);
        ctx.quadraticCurveTo(35, d.height - 20, 38, d.height - 22);
        ctx.lineTo(34, d.height - 8);
        ctx.lineTo(-4, d.height - 8);
        ctx.lineTo(-4, 20);
        ctx.lineTo(12, 20);
        ctx.closePath();
        ctx.fill();

        // Face looking LEFT (towards green Dino)
        ctx.fillRect(-10, 4, 24, 16);
        ctx.fillStyle = '#be185d'; // Dark eyes
        ctx.fillRect(-2, 8, 4, 4);

        // Graceful Red Ribbon bow tie on head!
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(8, -2);
        ctx.lineTo(14, 4);
        ctx.lineTo(2, 4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(2, -2);
        ctx.lineTo(14, -2);
        ctx.lineTo(8, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Draw hearts animations overlay if Happy Ending is active
      if (state === 'happy-ending') {
        // Spawn romantic particles gradually
        if (Math.random() < 0.08) {
          const spawnX = dinoRef.current.x + dinoRef.current.width + 4;
          heartsArrRef.current.push({
            x: spawnX + (Math.random() * 20 - 10),
            y: dinoGroundY - 30,
            size: 8 + Math.random() * 10,
            alpha: 1.0,
            speedY: -(1.0 + Math.random() * 1.5),
            speedX: Math.random() * 1.0 - 0.5,
          });
        }

        // Tick hearts
        const hearts = heartsArrRef.current;
        for (let i = hearts.length - 1; i >= 0; i--) {
          const h = hearts[i];
          h.y += h.speedY * dtMultiplier;
          h.x += h.speedX * dtMultiplier;
          h.alpha -= 0.012 * dtMultiplier;

          if (h.alpha <= 0) {
            hearts.splice(i, 1);
            continue;
          }

          // Draw vector heart
          ctx.save();
          ctx.globalAlpha = h.alpha;
          ctx.fillStyle = '#f43f5e'; // Soft pink/rose hearts
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          // Left curve
          ctx.bezierCurveTo(h.x - h.size/2, h.y - h.size/2, h.x - h.size, h.y + h.size/3, h.x, h.y + h.size);
          // Right curve
          ctx.bezierCurveTo(h.x + h.size, h.y + h.size/3, h.x + h.size/2, h.y - h.size/2, h.x, h.y);
          ctx.fill();
          ctx.restore();
        }
      }

      // Loop frame
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [totalObstacles]);

  const handleVerifyAnswer = () => {
    if (!quizCard || !selectedAns || quizChecked) return;

    const isCorrect = selectedAns === quizCard.term;
    setQuizIsCorrect(isCorrect);
    setQuizChecked(true);

    if (isCorrect) {
      // Add this card to the set of correctly answered ones
      const updatedCorrect = [...correctlyAnsweredCardIds, quizCard.id];
      setCorrectlyAnsweredCardIds(updatedCorrect);

      // Add score bonus
      scoreRef.current += 20000; // Adds 2000 points to game ticker
      setCurrentScore(Math.floor(scoreRef.current / 10));
    }
  };

  const handleCloseQuizAndContinue = () => {
    if (quizIsCorrect) {
      if (correctlyAnsweredCardIds.length === set.cards.length) {
        // Trigger auto-running and permanent invincibility
        setAutoRunningToFinish(true);
        dinoRef.current.invincibleTimer = 999999;
        setGameState('running');
        setQuizCard(null);
        setCollisionStage(null);
      } else {
        // Revive Dino with standard 1.5s invincibility shield
        dinoRef.current.invincibleTimer = 90; // 90 frames = 1.5 seconds at 60fps
        setGameState('running');
        setQuizCard(null);
        setCollisionStage(null);
      }
    } else {
      // Game Over immediately!
      setGameState('game-over');
      setQuizCard(null);
      setCollisionStage(null);

      // Check high score
      const finalScoreNum = Math.floor(scoreRef.current / 10);
      if (finalScoreNum > highScore) {
        setHighScore(finalScoreNum);
        localStorage.setItem(`quizlet_dino_highscore_${set.id}`, finalScoreNum.toString());
      }
    }
  };

  // Exit Quiz on prompt click
  const handleMainMenuQuit = () => {
    setQuizCard(null);
    setCollisionStage(null);
    setGameState('idle');
    onBack();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top action layout */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="dino-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-brand transition"
        >
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </button>
        <span className="text-xs font-bold text-brand bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
          <Smile size={12} className="text-emerald-500 animate-bounce" />
          <span>Khủng long vượt ải (Dino Runner)</span>
        </span>
      </div>

      {/* Main Game Card */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
        {/* Statistics bar header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-150 pb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{set.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Dùng phím <strong className="text-slate-700">Space</strong> hoặc <strong className="text-slate-700">chạm chuột/điện thoại</strong> để nhảy né.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center sm:text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến độ vượt ải</span>
              <span className="text-sm font-semibold text-brand">
                {passedCount} / {totalObstacles} Chướng ngại vật
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center sm:text-right">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Điểm số</span>
              <span className="text-base font-black text-slate-800 font-mono">{currentScore}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center sm:text-right bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
              <span className="text-[10px] font-extrabold text-amber-700 flex items-center gap-1 uppercase tracking-wider justify-center sm:justify-start">
                <Trophy size={10} className="fill-amber-400" /> Kỷ lục
              </span>
              <span className="text-sm font-extrabold text-amber-900 font-mono mt-0.5 block">{highScore}</span>
            </div>
          </div>
        </div>

        {/* Outer Interactive Canvas game screen */}
        <div className="relative w-full flex justify-center">
          <canvas
            id="dino-scroller-canvas"
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={triggerJump}
            onTouchStart={(e) => {
              e.preventDefault();
              if (gameStateRef.current === 'idle') {
                startGame();
              } else if (gameStateRef.current === 'running') {
                triggerJump();
              }
            }}
            className="w-full max-w-[800px] bg-slate-50 border-2 border-slate-200 rounded-2xl cursor-pointer shadow-md hover:border-brand/40 duration-200"
          />

          {/* Idle status overlay */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-slate-950/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center backdrop-blur-xs">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full shadow-md mb-3 animate-bounce">
                <Smile size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Dino Runner Vocabulary Quiz</h3>
              <p className="text-xs text-slate-600 max-w-sm mt-1 mb-5">
                Né tránh các chướng ngại vật trên đường đi. Mỗi khi đâm vào, bạn có cơ hội "hồi sinh" bằng cách trả lời đúng định nghĩa từ vựng của thẻ tương ứng!
              </p>

              <button
                id="dino-start-game-btn"
                onClick={startGame}
                className="px-8 py-3 bg-brand hover:bg-[#3444cc] text-white font-extrabold text-sm rounded-xl shadow-lg transition active:scale-98 cursor-pointer"
              >
                Bắt Đầu Chạy 🦖
              </button>
            </div>
          )}

          {/* GAME OVER Screen */}
          {gameState === 'game-over' && (
            <div className="absolute inset-0 bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="p-3 bg-rose-500/20 text-rose-500 rounded-full mb-3 border border-rose-500/30">
                <ShieldAlert size={36} className="animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-rose-500 uppercase tracking-wide">Trò Chơi Kết Thúc</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                Bạn đã va chạm chướng ngại vật quá số lần cho phép hoặc trả lời sai câu hỏi hồi sinh.
              </p>

              <div className="my-5 p-3.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between gap-8 text-white min-w-[220px]">
                <span className="text-xs text-slate-400 font-semibold uppercase">Điểm đạt được:</span>
                <span className="text-lg font-black text-amber-400 tracking-tight">{currentScore}</span>
              </div>

              <div className="flex gap-3">
                <button
                  id="dino-replay-btn"
                  onClick={startGame}
                  className="px-6 py-3 bg-brand hover:bg-[#3444cc] text-white font-bold text-sm rounded-lg flex items-center gap-1.5 transition active:scale-98 cursor-pointer"
                >
                  <RefreshCw size={14} /> Chơi Lại Từ Đầu
                </button>
                <button
                  id="dino-quit-to-menu-btn"
                  onClick={onBack}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-lg transition cursor-pointer"
                >
                  Hủy Về Menu
                </button>
              </div>
            </div>
          )}

          {/* HAPPY ENDING ROMANTIC Screen */}
          {gameState === 'happy-ending' && (
            <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 border-4 border-emerald-500/30">
              <div className="inline-flex items-center gap-2 text-rose-500 mb-2">
                <Heart size={36} className="fill-rose-500 animate-bounce" />
                <Heart size={28} className="fill-rose-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-pink-600 uppercase tracking-tight">❤️ Ghép Đôi Thành Công! ❤️</h3>
              <h2 className="text-xl font-bold text-emerald-600 mt-1">Chúc mừng bạn đã phá đảo từ vựng!</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                Khủng long thông thái đã vượt qua toàn bộ <strong className="text-pink-600 font-bold">{totalObstacles} chướng ngại vật</strong> trong học phần <strong className="text-slate-800 font-bold">"{set.title}"</strong> để đoàn tụ lãng mạn cùng một nửa yêu thương!
              </p>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 my-5 flex items-center justify-between gap-6 min-w-[280px]">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase">
                  <GraduationCap size={16} />
                  <span>Trình độ ghi nhớ</span>
                </div>
                <span className="text-base font-extrabold text-emerald-700 font-mono">Đạt Điểm Tuyệt Đối (+1000 Pts)!</span>
              </div>

              <div className="flex gap-3">
                <button
                  id="dino-win-replay-btn"
                  onClick={startGame}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition active:scale-98 cursor-pointer"
                >
                  Chạy Lại Thách Thức New Game
                </button>
                <button
                  id="dino-win-home"
                  onClick={onBack}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition cursor-pointer"
                >
                  Về Trang Chủ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEAMLESS COLLISION MODAL */}
      {gameState === 'paused-collision' && quizCard && (
        <div id="dino-collision-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-in">
            {collisionStage === 'choice' ? (
              <div id="dino-choice-container" className="p-6 sm:p-8 space-y-6 text-left">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-3 bg-indigo-50 text-brand rounded-xl">
                    <ShieldAlert size={24} className="text-indigo-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-tight">⚠️ Bạn Đã Va Chạm Chướng Ngại Vật!</h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Khủng long cần cứu nạn khẩn cấp</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Chú khủng long dũng cảm vừa chạm vào chướng ngại vật cực kỳ hiểm trở! Bạn muốn quay về trang chủ hay tiếp tục chinh phục thử thách định nghĩa từ vựng để hồi sinh và tiếp tục chặng đường đầy mạo hiểm này?
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    id="dino-choice-quit-btn"
                    onClick={onBack}
                    className="w-full sm:flex-1 py-3 border border-slate-200 hover:border-slate-350 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider text-center transition cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    id="dino-choice-continue-btn"
                    onClick={() => setCollisionStage('quiz')}
                    className="w-full sm:flex-1 py-3 bg-brand hover:bg-[#3444cc] text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center cursor-pointer shadow-lg transition"
                  >
                    Tiếp tục chạy 🔥
                  </button>
                </div>
              </div>
            ) : (
              <div id="dino-quiz-container" className="p-6 sm:p-8 space-y-6 text-left">
                {/* Header layout */}
                <div className="bg-rose-600 p-5 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 text-white flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <ShieldAlert size={20} className="text-amber-300 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base tracking-tight uppercase">⚠️ CỨU NẠN KHẨN CẤP KHỦNG LONG! 🦖</h3>
                      <p className="text-[10px] text-rose-100 font-semibold uppercase tracking-wider">Chọn đúng định nghĩa của từ để tiếp tục sinh tồn</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-white/15 px-3 py-1 rounded-full uppercase">Hòn đá hỏi đáp</span>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-5 rounded-xl text-center">
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-1">Dựa vào định nghĩa này để đoán đúng thuật ngữ:</span>
                  <p className="text-base sm:text-lg font-extrabold text-slate-800 leading-relaxed italic">
                    "{quizCard.definition}"
                  </p>
                  {quizCard.example && (
                    <p className="text-xs text-slate-400 italic mt-3">
                      Ví dụ: "{quizCard.example}"
                    </p>
                  )}
                </div>

                {/* Response choices list representation */}
                <div className="space-y-3">
                  {quizOptions.map((option, idx) => {
                    const isSelected = selectedAns === option;
                    let itemStyle = 'border-slate-200 hover:border-slate-350 bg-white text-slate-700';

                    if (quizChecked) {
                      if (option === quizCard.term) {
                        itemStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/10 font-bold';
                      } else if (isSelected) {
                        itemStyle = 'bg-rose-50 border-rose-300 text-rose-800 font-bold';
                      } else {
                        itemStyle = 'bg-slate-50 opacity-40 border-slate-100 text-slate-400';
                      }
                    } else if (isSelected) {
                      itemStyle = 'bg-blue-50/50 border-brand text-brand ring-2 ring-brand/10';
                    }

                    return (
                      <button
                        id={`dino-trivia-option-${idx}`}
                        key={idx}
                        type="button"
                        disabled={quizChecked}
                        onClick={() => setSelectedAns(option)}
                        className={`w-full p-4 border rounded-xl text-sm font-bold text-left flex items-center justify-between cursor-pointer transition ${itemStyle}`}
                      >
                        <span>{option}</span>
                        {quizChecked && option === quizCard.term && (
                          <Check size={18} className="text-emerald-600" />
                        )}
                        {quizChecked && isSelected && option !== quizCard.term && (
                          <X size={18} className="text-rose-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Result alerts feedback messaging panel */}
                {quizChecked && (
                  <div 
                    id="dino-trivia-result-alert-box"
                    className={`p-4 rounded-xl flex items-start gap-2.5 text-xs ${
                      quizIsCorrect 
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-150' 
                        : 'bg-rose-50 text-rose-950 border border-rose-150'
                    }`}
                  >
                    {quizIsCorrect ? (
                      <>
                        <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="block font-bold">Cứu nguy thành công! Khủng long đã Hồi sinh (+2000 Điểm)</strong>
                          <p className="mt-0.5">Một lá chắn bảo vệ bất tử tạm thời đã được kích hoạt trong 1.5 giây đầu.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={16} className="text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="block font-bold">Chưa chính xác! Trò chơi thất bại</strong>
                          <p className="mt-0.5">
                            Thuật ngữ cho "{quizCard.definition}" chính xác là <span className="font-extrabold text-slate-900">"{quizCard.term}"</span>. Hãy chuẩn bị làm lại bài nhé!
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Dynamic Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    id="dino-quiz-menu-quit-btn"
                    onClick={handleMainMenuQuit}
                    className="px-4 py-2.5 hover:bg-slate-100 text-slate-500 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    Thoát Về Menu chính
                  </button>

                  <div className="flex items-center gap-2">
                    {!quizChecked ? (
                      <button
                        id="dino-quiz-verify-btn"
                        onClick={handleVerifyAnswer}
                        disabled={!selectedAns}
                        className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                          selectedAns 
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        Nộp Đáp Án Cứu Dino
                      </button>
                    ) : (
                      <button
                        id="dino-quiz-continue-btn"
                        onClick={handleCloseQuizAndContinue}
                        className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition ${
                          quizIsCorrect 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        {quizIsCorrect ? 'Tiếp tục sinh tồn →' : 'Xem Kết Quả Thảm Bại 📉'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
