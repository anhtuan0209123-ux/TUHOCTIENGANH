import React, { useState, useEffect } from 'react';
import { Card, StudySet } from '../types';
import { ArrowLeft, RefreshCw, Trophy, Sparkles, Check, X, ShieldAlert, Layers, RotateCw, Box, HelpCircle, AlertCircle, Hourglass, Flame, Zap, Hammer, Coins } from 'lucide-react';

interface BlockGameProps {
  set: StudySet;
  onBack: () => void;
}

// Predefined classic block shapes
interface BlockShape {
  id: string;
  cells: [number, number][]; // coordinates relative to anchor [0,0]
  color: string;
  name: string;
  associatedCard?: Card;
  wordClassLabel?: string;
}

const BLOCK_TEMPLATES = [
  { id: 'single', cells: [[0, 0]], name: 'Đơn' },
  { id: 'h-line-2', cells: [[0, 0], [0, 1]], name: 'Dòng Đôi H' },
  { id: 'v-line-2', cells: [[0, 0], [1, 0]], name: 'Dòng Đôi V' },
  { id: 'h-line-3', cells: [[0, 0], [0, 1], [0, 2]], name: 'Dòng Ba H' },
  { id: 'v-line-3', cells: [[0, 0], [1, 0], [2, 0]], name: 'Dòng Ba V' },
  { id: 'square', cells: [[0, 0], [0, 1], [1, 0], [1, 1]], name: 'Khối Vuông' },
  { id: 'l-shape-1', cells: [[0, 0], [1, 0], [1, 1]], name: 'Khối L' },
  { id: 'l-shape-2', cells: [[0, 0], [0, 1], [1, 0]], name: 'Khối L Ngược' },
  { id: 'corner', cells: [[0, 0], [0, 1], [1, 1]], name: 'Góc' }
];

interface GridCell {
  color: string;
  term?: string;
  definition?: string;
}

export const BlockGame: React.FC<BlockGameProps> = ({ set, onBack }) => {
  const gridSize = 5;

  // Word classification helper
  const classifyWord = (term: string) => {
    const t = term.toLowerCase().trim();
    if (t.endsWith('tion') || t.endsWith('ness') || t.endsWith('ment') || t.endsWith('ity') || t.endsWith('er') || t.endsWith('ship') || t.endsWith('or')) {
      return { label: 'Danh từ (Noun)', color: 'bg-blue-500 text-blue-100 border-blue-600' };
    }
    if (t.endsWith('ly')) {
      return { label: 'Trạng từ (Adverb)', color: 'bg-emerald-500 text-emerald-100 border-emerald-600' };
    }
    if (t.endsWith('ive') || t.endsWith('ful') || t.endsWith('ous') || t.endsWith('al') || t.endsWith('able') || t.endsWith('ible') || t.endsWith('ent') || t.endsWith('ant')) {
      return { label: 'Tính từ (Adj)', color: 'bg-amber-500 text-amber-100 border-amber-600' };
    }
    // Alternate based on character sum
    const hash = term.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (hash % 2 === 0) {
      return { label: 'Động từ (Verb)', color: 'bg-rose-500 text-rose-100 border-rose-600' };
    } else {
      return { label: 'Danh từ (Noun)', color: 'bg-blue-500 text-blue-100 border-blue-600' };
    }
  };

  // Game board grid state holding colors & card definitions
  const [grid, setGrid] = useState<GridCell[][]>(
    Array(gridSize).fill(null).map(() => Array(gridSize).fill({ color: '', term: '', definition: '' }))
  );
  const [candidates, setCandidates] = useState<BlockShape[]>([]);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [blocksPlaced, setBlocksPlaced] = useState(0);
  
  // Hold piece storage state
  const [heldBlock, setHeldBlock] = useState<BlockShape | null>(null);
  const [hasHeldThisTurn, setHasHeldThisTurn] = useState(false);

  // Combo system state
  const [comboStreak, setComboStreak] = useState(0);
  const [comboMessage, setComboMessage] = useState<string | null>(null);

  // Clear vocab floating show
  const [clearedVocabList, setClearedVocabList] = useState<{ term: string; definition: string }[]>([]);
  const [vocabTimeoutId, setVocabTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Active quiz popup state (every 4 block placements)
  const [quizCard, setQuizCard] = useState<Card | null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState(false);

  // Revive (Rescue rescue quiz modal) state
  const [hasRevived, setHasRevived] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showReviveQuiz, setShowReviveQuiz] = useState(false);
  const [reviveQuizData, setReviveQuizData] = useState<{
    question: string;
    correctAnswer: string;
    options: string[];
    hint: string;
  } | null>(null);
  const [reviveAnswerSelected, setReviveAnswerSelected] = useState<string | null>(null);
  const [reviveChecked, setReviveChecked] = useState(false);
  const [reviveIsCorrect, setReviveIsCorrect] = useState(false);
  const [showReviveHint, setShowReviveHint] = useState(false);
  const [loadingReviveQuiz, setLoadingReviveQuiz] = useState(false);

  // Blitz Mode, Power-ups, and AI preloading states
  const [isBlitzMode, setIsBlitzMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(12);
  const [isHammerActive, setIsHammerActive] = useState(false);
  const [preloadedReviveQuiz, setPreloadedReviveQuiz] = useState<any>(null);

  // Background Preload AI Rescue Quiz when grid starts getting crowded (>= 14 filled cells)
  useEffect(() => {
    if (hasRevived || preloadedReviveQuiz !== null || set.cards.length === 0) return;

    let filledCount = 0;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c].color !== '') filledCount++;
      }
    }

    if (filledCount >= 14) {
      const preload = async () => {
        try {
          const response = await fetch('/api/generate-revive-quiz', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cards: set.cards }),
          });
          if (response.ok) {
            const data = await response.json();
            setPreloadedReviveQuiz(data);
            console.log("Preloaded AI rescue quiz successfully!");
          }
        } catch (err) {
          console.warn("Preloading AI rescue quiz failed or timed out", err);
        }
      };
      preload();
    }
  }, [grid, hasRevived, preloadedReviveQuiz, set.cards]);

  // Blitz Mode countdown timer effect
  useEffect(() => {
    if (!isBlitzMode || isGameOver || showReviveQuiz || quizCard) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          triggerRiseBottomLine();
          return 12; // Reset for next turn
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlitzMode, isGameOver, showReviveQuiz, quizCard, grid]);

  // Shift current rows up and spawn random blocks at the bottom row (Blitz mode penalty)
  const triggerRiseBottomLine = () => {
    setComboMessage("⚠️ HẾT GIỜ! Gạch dâng lên từ dưới đáy!");
    setTimeout(() => setComboMessage(null), 2500);

    setGrid((prevGrid) => {
      // Row 0 is lost as we shift row 1 to row 0, row 2 to row 1, etc.
      const nextGrid = prevGrid.map((row, rIdx) => {
        if (rIdx < gridSize - 1) {
          return [...prevGrid[rIdx + 1]];
        } else {
          // New bottom row with 3 random blocks (leaving 2 empty so they don't immediately clear)
          return Array(gridSize).fill(null).map((_, colIdx) => {
            if (Math.random() < 0.6) {
              const greyColors = ['bg-slate-600', 'bg-slate-700', 'bg-indigo-400/80'];
              const card = set.cards && set.cards.length > 0 ? set.cards[Math.floor(Math.random() * set.cards.length)] : undefined;
              return {
                color: greyColors[Math.floor(Math.random() * greyColors.length)],
                term: card?.term || 'Blitz',
                definition: card?.definition || 'Chớp nhoáng'
              };
            }
            return { color: '', term: '', definition: '' };
          });
        }
      });
      return nextGrid;
    });

    setTimeLeft(12);
  };

  // Load HighScore
  useEffect(() => {
    const saved = localStorage.getItem(`quizlet_block_highscore_${set.id}`);
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
    generateCandidates();
  }, [set.id]);

  // Rotate a list of shape coordinates relative to anchor [0,0]
  const rotateShapeCells = (cells: [number, number][]): [number, number][] => {
    // 90deg clockwise: (dr, dc) => (dc, -dr)
    const rotated = cells.map(([r, c]) => [c, -r] as [number, number]);
    const minR = Math.min(...rotated.map(([r]) => r));
    const minC = Math.min(...rotated.map(([, c]) => c));
    return rotated.map(([r, c]) => [r - minR, c - minC] as [number, number]);
  };

  const handleRotateSelected = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (selectedCandidateIdx === null) return;
    const shape = candidates[selectedCandidateIdx];
    if (!shape) return;

    const rotatedCells = rotateShapeCells(shape.cells);
    const updatedCandidates = [...candidates];
    updatedCandidates[selectedCandidateIdx] = {
      ...shape,
      cells: rotatedCells
    };
    setCandidates(updatedCandidates);
  };

  // Generate 3 block options below
  const generateCandidates = () => {
    const generated: BlockShape[] = [];
    for (let i = 0; i < 3; i++) {
      const template = BLOCK_TEMPLATES[Math.floor(Math.random() * BLOCK_TEMPLATES.length)];
      
      let associatedCard: Card | undefined = undefined;
      let wordClassLabel = 'Từ vựng (Word)';
      let blockColor = 'bg-indigo-500';

      if (set.cards && set.cards.length > 0) {
        associatedCard = set.cards[Math.floor(Math.random() * set.cards.length)];
        const classification = classifyWord(associatedCard.term);
        wordClassLabel = classification.label;
        blockColor = classification.color;
      }

      generated.push({
        id: `${template.id}-${Date.now()}-${i}-${Math.random()}`,
        cells: template.cells as [number, number][],
        color: blockColor,
        name: template.name,
        associatedCard,
        wordClassLabel
      });
    }
    setCandidates(generated);
  };

  const resetGame = () => {
    setGrid(Array(gridSize).fill(null).map(() => Array(gridSize).fill({ color: '', term: '', definition: '' })));
    setScore(0);
    setBlocksPlaced(0);
    setComboStreak(0);
    setComboMessage(null);
    setClearedVocabList([]);
    setSelectedCandidateIdx(null);
    setHoveredCell(null);
    setHeldBlock(null);
    setHasHeldThisTurn(false);
    setHasRevived(false);
    setIsGameOver(false);
    setShowReviveQuiz(false);
    setTimeLeft(12);
    setIsHammerActive(false);
    setPreloadedReviveQuiz(null);
    generateCandidates();
  };

  // Check if a block shape can fit on grid at a given row, col anchor
  const canPlaceBlock = (shape: BlockShape, row: number, col: number, currentGrid: GridCell[][]) => {
    for (const [dr, dc] of shape.cells) {
      const targetRow = row + dr;
      const targetCol = col + dc;
      
      // Check boundaries
      if (targetRow < 0 || targetRow >= gridSize || targetCol < 0 || targetCol >= gridSize) {
        return false;
      }
      // Check occupied
      if (currentGrid[targetRow][targetCol].color !== '') {
        return false;
      }
    }
    return true;
  };

  // Run a quick check if ANY moves are available for any candidates left, if not, trigger rescue revive
  const isAnyMovePossible = (currCandidates: BlockShape[], currGrid: GridCell[][]) => {
    // If all slot candidates are empty, we'll generate new ones, so yes.
    if (currCandidates.filter(Boolean).length === 0) return true;

    for (let idx = 0; idx < currCandidates.length; idx++) {
      const shape = currCandidates[idx];
      if (!shape) continue;

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (canPlaceBlock(shape, r, c, currGrid)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Hold swap action
  const handleHoldBlock = () => {
    if (selectedCandidateIdx === null) return;
    if (hasHeldThisTurn) {
      alert('Bạn chỉ có thể lưu trữ/hoán đổi khối một lần trong mỗi lượt đặt!');
      return;
    }
    const currentShape = candidates[selectedCandidateIdx];
    if (!currentShape) return;

    const previouslyHeld = heldBlock;
    setHeldBlock(currentShape);

    const updatedCandidates = [...candidates];
    if (previouslyHeld) {
      updatedCandidates[selectedCandidateIdx] = previouslyHeld;
    } else {
      updatedCandidates[selectedCandidateIdx] = null as any;
    }

    setCandidates(updatedCandidates);
    setSelectedCandidateIdx(null);
    setHoveredCell(null);
    setHasHeldThisTurn(true);

    // If all candidates are now empty, generate new candidates
    if (updatedCandidates.filter(Boolean).length === 0) {
      generateCandidates();
    }
  };

  // Place block on click/drop
  const handleCellClick = (row: number, col: number) => {
    if (isHammerActive) {
      if (grid[row][col].color === '') {
        alert("Vui lòng click vào một ô CÓ GẠCH để đập vỡ!");
        return;
      }
      const newGrid = grid.map((r, rIdx) => 
        r.map((cell, cIdx) => {
          if (rIdx === row && cIdx === col) {
            return { color: '', term: '', definition: '' };
          }
          return { ...cell };
        })
      );
      setGrid(newGrid);
      setIsHammerActive(false);
      setComboMessage("🔨 Đập tan thành công ô gạch lựa chọn!");
      setTimeout(() => setComboMessage(null), 2000);
      return;
    }

    if (selectedCandidateIdx === null) return;
    const shape = candidates[selectedCandidateIdx];
    if (!shape) return;

    if (!canPlaceBlock(shape, row, col, grid)) {
      return; // Can't place, ignore
    }

    // Place block
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    for (const [dr, dc] of shape.cells) {
      newGrid[row + dr][col + dc] = {
        color: shape.color,
        term: shape.associatedCard?.term || '',
        definition: shape.associatedCard?.definition || ''
      };
    }

    // Process line clears
    let clearedLines = 0;
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Check rows
    for (let r = 0; r < gridSize; r++) {
      if (newGrid[r].every(cell => cell.color !== '')) {
        rowsToClear.push(r);
      }
    }

    // Check cols
    for (let c = 0; c < gridSize; c++) {
      let isColFull = true;
      for (let r = 0; r < gridSize; r++) {
        if (newGrid[r][c].color === '') {
          isColFull = false;
          break;
        }
      }
      if (isColFull) {
        colsToClear.push(c);
      }
    }

    // Gather vocabulary being cleared to display!
    const newlyClearedVocab: { term: string; definition: string }[] = [];

    // Apply clears
    for (const r of rowsToClear) {
      for (let c = 0; c < gridSize; c++) {
        const cell = newGrid[r][c];
        if (cell.term) {
          newlyClearedVocab.push({ term: cell.term, definition: cell.definition || '' });
        }
        newGrid[r][c] = { color: '', term: '', definition: '' };
      }
      clearedLines++;
    }

    for (const c of colsToClear) {
      for (let r = 0; r < gridSize; r++) {
        const cell = newGrid[r][c];
        if (cell.term) {
          if (!newlyClearedVocab.some(v => v.term === cell.term)) {
            newlyClearedVocab.push({ term: cell.term, definition: cell.definition || '' });
          }
        }
        newGrid[r][c] = { color: '', term: '', definition: '' };
      }
      clearedLines++;
    }

    // Show newly cleared vocabulary list as rapid notification banners
    if (newlyClearedVocab.length > 0) {
      setClearedVocabList(newlyClearedVocab);
      if (vocabTimeoutId) clearTimeout(vocabTimeoutId);
      const tid = setTimeout(() => {
        setClearedVocabList([]);
      }, 5000);
      setVocabTimeoutId(tid);
    }

    // Calculate score
    const blockPlacingScore = shape.cells.length * 10;
    let finalAddedScore = blockPlacingScore;

    if (clearedLines > 0) {
      const nextStreak = comboStreak + 1;
      setComboStreak(nextStreak);
      
      const multiplier = Math.max(clearedLines, nextStreak);
      const lineClearScore = clearedLines * 100 * multiplier;
      finalAddedScore = blockPlacingScore + lineClearScore;

      setComboMessage(`COMBO x${multiplier}! +${lineClearScore} điểm! 🔥🎉`);
      setTimeout(() => {
        setComboMessage(null);
      }, 3000);
    } else {
      setComboStreak(0);
    }

    const newScore = score + finalAddedScore;
    setScore(newScore);

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem(`quizlet_block_highscore_${set.id}`, newScore.toString());
    }

    // Mark current candidate as placed (null)
    const newCandidates = [...candidates];
    newCandidates[selectedCandidateIdx] = null as any; // clears slot

    // Check if all candidates empty
    const remainingCount = newCandidates.filter(Boolean).length;
    let finalCandidates = newCandidates;
    if (remainingCount === 0) {
      const generated: BlockShape[] = [];
      for (let i = 0; i < 3; i++) {
        const template = BLOCK_TEMPLATES[Math.floor(Math.random() * BLOCK_TEMPLATES.length)];
        let associatedCard: Card | undefined = undefined;
        let wordClassLabel = 'Từ vựng (Word)';
        let blockColor = 'bg-indigo-500';

        if (set.cards && set.cards.length > 0) {
          associatedCard = set.cards[Math.floor(Math.random() * set.cards.length)];
          const classification = classifyWord(associatedCard.term);
          wordClassLabel = classification.label;
          blockColor = classification.color;
        }

        generated.push({
          id: `${template.id}-${Date.now()}-${i}-${Math.random()}`,
          cells: template.cells as [number, number][],
          color: blockColor,
          name: template.name,
          associatedCard,
          wordClassLabel
        });
      }
      finalCandidates = generated;
      setCandidates(generated);
    } else {
      setCandidates(newCandidates);
    }

    setGrid(newGrid);
    setSelectedCandidateIdx(null);
    setHoveredCell(null);
    setHasHeldThisTurn(false);
    setTimeLeft(12); // Reset Blitz countdown timer for the new turn!

    // Increase total blocks placed & check for quiz trigger
    const nextPlacedCount = blocksPlaced + 1;
    setBlocksPlaced(nextPlacedCount);

    if (nextPlacedCount % 4 === 0) {
      triggerQuiz();
    }

    // Check if any moves are possible on the newly saved state
    const movePossible = isAnyMovePossible(finalCandidates, newGrid);
    if (!movePossible) {
      if (!hasRevived) {
        triggerReviveQuiz(newGrid);
      } else {
        setIsGameOver(true);
      }
    }
  };

  // Power-up Shop actions
  const buyHammer = () => {
    if (score < 150) {
      alert("Không đủ điểm! Bạn cần ít nhất 150 điểm từ vựng để kích hoạt Búa Hủy Diệt.");
      return;
    }
    setIsHammerActive(true);
    setScore(prev => prev - 150);
    setComboMessage("🔨 CHẾ ĐỘ BÚA KÍCH HOẠT! Click vào một ô có gạch trên lưới để phá hủy!");
    setTimeout(() => setComboMessage(null), 3500);
  };

  const buyReroll = () => {
    if (score < 80) {
      alert("Không đủ điểm! Bạn cần ít nhất 80 điểm từ vựng để mua Đổi Khối.");
      return;
    }
    setScore(prev => prev - 80);
    generateCandidates();
    setSelectedCandidateIdx(null);
    setComboMessage("🎲 Đổi thành công 3 khối gạch mới!");
    setTimeout(() => setComboMessage(null), 2500);
  };

  // Trigger Vocabulary Trivia Card Quiz popup (regular interval)
  const triggerQuiz = () => {
    if (set.cards.length === 0) return;
    
    // Pick random card
    const randomCard = set.cards[Math.floor(Math.random() * set.cards.length)];
    const correctAns = randomCard.term;

    // Get 2 distractors
    const otherCards = set.cards.filter(c => c.id !== randomCard.id);
    const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 2).map(c => c.term);

    const options = [correctAns, ...distractors].sort(() => Math.random() - 0.5);

    setQuizCard(randomCard);
    setQuizOptions(options);
    setQuizAnswerSelected(null);
    setQuizChecked(false);
    setQuizIsCorrect(false);
  };

  const handleSelectQuizAnswer = (ans: string) => {
    if (quizChecked) return;
    setQuizAnswerSelected(ans);
  };

  const handleVerifyQuizAnswer = () => {
    if (!quizCard || !quizAnswerSelected || quizChecked) return;

    const isCorrect = quizAnswerSelected === quizCard.term;
    setQuizIsCorrect(isCorrect);
    setQuizChecked(true);

    if (isCorrect) {
      const bonus = 200;
      setScore(prev => {
        const next = prev + bonus;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem(`quizlet_block_highscore_${set.id}`, next.toString());
        }
        return next;
      });
      // Close modal immediately so they can keep playing
      setQuizCard(null);
    }
  };

  const handleCloseQuiz = () => {
    setQuizCard(null);
  };

  // Trigger Revive Quiz (Rescue) powered by Gemini API
  const triggerReviveQuiz = async (latestGrid: GridCell[][]) => {
    setShowReviveQuiz(true);
    setReviveAnswerSelected(null);
    setReviveChecked(false);
    setReviveIsCorrect(false);
    setShowReviveHint(false);

    if (preloadedReviveQuiz) {
      setReviveQuizData(preloadedReviveQuiz);
      setLoadingReviveQuiz(false);
      // Clear preloaded quiz so next game or next round will preload a new one
      setPreloadedReviveQuiz(null);
      return;
    }

    setLoadingReviveQuiz(true);
    try {
      const response = await fetch('/api/generate-revive-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cards: set.cards
        }),
      });

      if (!response.ok) {
        throw new Error('Can not fetch revive quiz from AI server');
      }

      const data = await response.json();
      setReviveQuizData(data);
    } catch (err) {
      console.error('Revive Quiz Generation Fallback', err);
      // Client-side fallback quiz setup
      const fallbackCard = set.cards.length > 0 ? set.cards[Math.floor(Math.random() * set.cards.length)] : { term: "diligent", definition: "chăm chỉ, cần cù" };
      const correctAns = fallbackCard.term;
      const otherTerms = set.cards.filter(c => c.term !== correctAns).map(c => c.term);
      const distractors = [...otherTerms, "ubiquitous", "meticulous", "resilient"].slice(0, 3);
      const options = [correctAns, ...distractors].sort(() => Math.random() - 0.5);

      setReviveQuizData({
        question: `Từ vựng tiếng Anh nâng cao nào tương xứng nhất với nét nghĩa đơn giản sau: "${fallbackCard.definition || 'Chăm chỉ cần cù'}"?`,
        correctAnswer: correctAns,
        options: options,
        hint: `Từ này có chữ cái đầu tiên là "${correctAns.charAt(0).toUpperCase()}".`
      });
    } finally {
      setLoadingReviveQuiz(false);
    }
  };

  const handleVerifyReviveAnswer = () => {
    if (!reviveQuizData || !reviveAnswerSelected || reviveChecked) return;

    const isCorrect = reviveAnswerSelected === reviveQuizData.correctAnswer;
    setReviveIsCorrect(isCorrect);
    setReviveChecked(true);

    if (isCorrect) {
      // Correct! Revive player by clearing a 3x3 region around the center
      const newGrid = grid.map(r => r.map(c => ({ ...c })));
      // Center of 5x5 is row 2, col 2. Clear 3x3 surrounding cells
      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) {
          newGrid[r][c] = { color: '', term: '', definition: '' };
        }
      }
      setGrid(newGrid);
      setHasRevived(true);
      setComboStreak(0);
      setScore(prev => prev + 300); // 300 bonus points for reviving!
    }
  };

  const handleCloseReviveModal = () => {
    setShowReviveQuiz(false);
    if (!reviveIsCorrect) {
      setIsGameOver(true);
    }
  };

  const handleClearStuckGrid = () => {
    if (confirm('Bảng xếp hình đang bị kẹt? Bạn có thể dọn dẹp bảng về trống để tiếp tục tích lũy điểm số! (Điểm số hiện tại của bạn sẽ được giữ nguyên)')) {
      setGrid(Array(gridSize).fill(null).map(() => Array(gridSize).fill({ color: '', term: '', definition: '' })));
      generateCandidates();
      setSelectedCandidateIdx(null);
      setComboStreak(0);
      setClearedVocabList([]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Quiz Top Action Rail */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="blockgame-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-brand transition cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Về trang chủ</span>
        </button>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
          <Layers size={12} />
          <span>Xếp gạch trí tuệ (Block Puzzle) v2</span>
        </span>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Score indicators, Hold box and stats */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
            <h2 id="block-set-title-badge" className="font-extrabold text-slate-900 leading-tight line-clamp-1">
              {set.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Ôn tập qua Game Xếp Gạch</p>

            <div className="mt-4 space-y-3">
              <div className="bg-indigo-50/50 rounded-lg p-3 flex items-center justify-between border border-indigo-100/40">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand animate-ping" />
                  <span className="text-xs font-bold text-slate-500 uppercase">Điểm Số</span>
                </div>
                <span className="text-2xl font-black text-brand tracking-tight">{score}</span>
              </div>

              <div className="bg-amber-50/50 rounded-lg p-3 flex items-center justify-between border border-amber-100/40">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <Trophy size={14} className="fill-amber-400 text-amber-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase">Kỷ Lục</span>
                </div>
                <span className="text-xl font-bold text-amber-800 tracking-tight">{highScore}</span>
              </div>
            </div>

            {/* Time Attack (Blitz Mode) Selector & Progress bar */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
                  <Hourglass size={14} className={isBlitzMode ? "text-amber-500 animate-spin" : "text-slate-400"} />
                  <span>THỬ THÁCH THỜI GIAN</span>
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isBlitzMode} 
                    onChange={(e) => {
                      setIsBlitzMode(e.target.checked);
                      setTimeLeft(12);
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {isBlitzMode ? (
                <div className="bg-amber-50 border border-amber-100/85 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span className="flex items-center gap-1">
                      <Flame size={12} className="text-amber-500 animate-pulse" />
                      Thời gian còn lại:
                    </span>
                    <span className="font-mono text-sm px-1.5 py-0.5 bg-amber-200/50 rounded">{timeLeft} giây</span>
                  </div>
                  <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        timeLeft <= 4 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                      }`}
                      style={{ width: `${(timeLeft / 12) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-amber-600 italic leading-snug">
                    * Đặt khối trước khi hết giờ, nếu không gạch sẽ tự động dâng lên từ dưới đáy!
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">
                  Chế độ thường. Bật chế độ Thời gian để tăng kịch tính và dâng gạch thử thách!
                </p>
              )}
            </div>

            {/* Hold Box Container */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
                  <Box size={14} className="text-indigo-600" />
                  <span>HỘP LƯU TRỮ (HOLD)</span>
                </span>
                {heldBlock && (
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Sẵn sàng
                  </span>
                )}
              </div>
              <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4 flex items-center justify-between">
                {heldBlock ? (
                  <div className="flex items-center gap-3">
                    {/* Held item miniature representation */}
                    <div className="grid gap-0.5 border border-slate-200 p-1.5 bg-white rounded-lg">
                      {[0, 1, 2].map((r) => {
                        const colsInRow = heldBlock.cells
                          .filter(([dr]) => dr === r)
                          .map(([, dc]) => dc);
                          
                        if (colsInRow.length === 0 && r > 0) return null;

                        return (
                          <div key={r} className="flex gap-0.5">
                            {[0, 1, 2].map((c) => {
                              const active = heldBlock.cells.some(([dr, dc]) => dr === r && dc === c);
                              return (
                                <div 
                                  key={c} 
                                  className={`w-3 h-3 rounded-xs ${active ? heldBlock.color : 'bg-transparent'}`}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black text-slate-800 leading-tight">{heldBlock.name}</p>
                      {heldBlock.associatedCard && (
                        <p className="text-[9px] font-extrabold text-slate-400 font-mono mt-0.5 truncate max-w-[130px]">
                          {heldBlock.associatedCard.term}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider italic">Trống (Chọn khối rồi cất)</span>
                )}

                <button
                  onClick={handleHoldBlock}
                  disabled={selectedCandidateIdx === null || hasHeldThisTurn}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase tracking-wide transition cursor-pointer ${
                    selectedCandidateIdx === null || hasHeldThisTurn
                      ? 'bg-slate-100 text-slate-350 cursor-not-allowed border border-slate-200'
                      : 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  Cất / Đổi
                </button>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Khối đã đặt (Tích câu hỏi):</span>
                <span>{blocksPlaced}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5 relative">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-350"
                  style={{ width: `${(blocksPlaced % 4) * 25}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed text-center">
                * Đặt thêm <strong className="text-brand font-bold">{4 - (blocksPlaced % 4)} khối</strong> nữa để mở Khóa Thẻ Hỏi Đáp Vựng!
              </p>
            </div>
          </div>

          {/* Shop Power-ups Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Coins size={14} className="text-indigo-600" />
              <span>VẬT PHẨM TRỢ GIÚP (SHOP)</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dùng điểm tích lũy để mua quyền cứu trợ:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Powerup 1: Hammer */}
              <button
                id="buy-hammer-powerup-btn"
                onClick={buyHammer}
                disabled={score < 150 || isHammerActive}
                className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center transition gap-1 cursor-pointer outline-none ${
                  isHammerActive
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-500/10'
                    : score >= 150
                      ? 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 text-slate-700'
                      : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed text-slate-400'
                }`}
              >
                <Hammer size={18} className={isHammerActive ? "text-indigo-600 animate-bounce" : "text-slate-600"} />
                <span className="text-[10px] font-bold block mt-1">Búa Hủy Diệt</span>
                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full mt-0.5">
                  150 Điểm
                </span>
              </button>

              {/* Powerup 2: Reroll */}
              <button
                id="buy-reroll-powerup-btn"
                onClick={buyReroll}
                disabled={score < 80}
                className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center transition gap-1 cursor-pointer outline-none ${
                  score >= 80
                    ? 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50 text-slate-700'
                    : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed text-slate-400'
                }`}
              >
                <RefreshCw size={16} className="text-slate-600" />
                <span className="text-[10px] font-bold block mt-1">Đổi Khối</span>
                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full mt-0.5">
                  80 Điểm
                </span>
              </button>
            </div>

            {isHammerActive && (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 text-[10px] text-rose-800 font-bold flex items-start gap-1.5 animate-pulse">
                <Zap size={12} className="shrink-0 text-rose-600 mt-0.5" />
                <span>🔨 CLICK vào 1 ô có gạch bất kỳ trên bảng để đập vỡ!</span>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 text-xs text-slate-500 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              <span>Cơ chế chiến thuật đặc thù:</span>
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
              <li><span className="font-extrabold text-indigo-700">Xoay khối:</span> Chọn khối bên dưới rồi nhấn <span className="font-black text-brand uppercase">"Xoay Khối"</span> hoặc click lại khối đó để xoay 90 độ!</li>
              <li><span className="font-extrabold text-indigo-700">Lưu trữ (Hold):</span> Chọn khối rồi click <span className="font-bold text-indigo-600">"Cất / Đổi"</span> để giữ tạm khối khó cho lượt sau.</li>
              <li><span className="font-extrabold text-indigo-700">Hệ màu Loại từ:</span> Khối <span className="font-bold text-blue-500">Xanh dương</span> = Danh từ; <span className="font-bold text-rose-500">Đỏ</span> = Động từ; <span className="font-bold text-amber-500">Vàng</span> = Tính từ; <span className="font-bold text-emerald-500">Xanh lá</span> = Trạng từ.</li>
              <li><span className="font-extrabold text-indigo-700">Combo Multiplier:</span> Phá nhiều dòng một lúc hoặc ăn dòng liên tiếp để nhân gấp đôi, gấp ba điểm số!</li>
              <li><span className="font-extrabold text-rose-600">AI Cứu Mạng:</span> Khi bảng đầy, trả lời câu hỏi trắc nghiệm từ vựng siêu khó để kích hoạt cứu mạng, quét sạch vùng 3x3 và tiếp tục giữ điểm!</li>
            </ul>
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                id="block-grid-clear-stuck-btn"
                onClick={handleClearStuckGrid}
                className="flex-1 py-2 border border-slate-200 hover:border-slate-350 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold text-center transition cursor-pointer"
              >
                Dọn Bảng Tránh Kẹt
              </button>
              <button
                id="block-game-reset-btn"
                onClick={resetGame}
                className="py-2 px-3 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw size={10} /> Đặt lại điểm
              </button>
            </div>
          </div>
        </div>

        {/* Right column: The Grid and block templates selection */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-6">
          {/* Combo Flash Message Banner */}
          {comboMessage && (
            <div className="w-full bg-gradient-to-r from-amber-500 via-brand to-pink-500 text-white p-3 rounded-xl shadow-md text-center text-xs font-black animate-bounce uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles size={16} className="animate-spin" />
              <span>{comboMessage}</span>
            </div>
          )}

          {/* Cleared Vocabulary quick-learn ticker */}
          {clearedVocabList.length > 0 && (
            <div className="w-full bg-slate-900 border border-slate-700/80 p-3.5 rounded-xl shadow-lg space-y-2 animate-fade-in text-left">
              <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase block">
                ⚡ ĐÃ GIẢI PHÓNG HÀNG & THU THẬP TỪ VỰNG:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {clearedVocabList.map((vocab, index) => (
                  <div key={index} className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 flex items-start gap-2">
                    <span className="text-xs">✅</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{vocab.term}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{vocab.definition}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5x5 Interaction Grid Board */}
          <div 
            id="block-puzzle-gameplay-canvas"
            className="bg-slate-900 p-5 rounded-2xl shadow-xl border-4 border-slate-800/90 relative"
          >
            {/* Visual gameover overlay inside canvas */}
            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/90 rounded-xl flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
                <AlertCircle size={44} className="text-rose-500 animate-pulse mb-3" />
                <h3 className="text-lg font-black text-white tracking-tight uppercase">Trò chơi kết thúc!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Bảng xếp hình đã bị lấp đầy hoàn toàn và không còn nước đi khả dụng. Bạn đã đạt được <strong className="text-brand font-black">{score} điểm</strong>!
                </p>
                <button
                  onClick={resetGame}
                  className="mt-5 px-6 py-3 bg-brand hover:bg-[#3444cc] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Chơi Lượt Mới 🎮
                </button>
              </div>
            )}

            <div 
              className="grid gap-2 select-none"
              style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {grid.map((rowCells, rIdx) => 
                rowCells.map((cell, cIdx) => {
                  const isSelected = selectedCandidateIdx !== null;
                  const currentShape = isSelected ? candidates[selectedCandidateIdx] : null;

                  // Evaluate preview shadow highlights
                  let isHoverHighlighted = false;
                  let isHoverOccupiedOrInvalid = false;

                  if (currentShape && hoveredCell) {
                    const [hr, hc] = hoveredCell;
                    // Check if current cell falls under the shape bounds
                    for (const [dr, dc] of currentShape.cells) {
                      if (hr + dr === rIdx && hc + dc === cIdx) {
                        isHoverHighlighted = true;
                        // check if placed or out of bound
                        if (canPlaceBlock(currentShape, hr, hc, grid) === false) {
                          isHoverOccupiedOrInvalid = true;
                        }
                        break;
                      }
                    }
                  }

                  // Ghost highlight: cells that are valid anchors for the current selected candidate
                  const isValidAnchor = currentShape ? canPlaceBlock(currentShape, rIdx, cIdx, grid) : false;

                  let bgStyle = 'bg-slate-800 hover:bg-slate-750';
                  let borderStyle = 'border-slate-700/60';
                  let cellContent = null;

                  if (cell.color) {
                    bgStyle = cell.color; // Use block shape origin color
                    // Render miniature name or checkmark for placed items
                    cellContent = (
                      <span className="text-[9px] font-extrabold text-white/40 font-mono tracking-tighter truncate max-w-[40px]">
                        {cell.term}
                      </span>
                    );
                  } else if (isHoverHighlighted) {
                    bgStyle = isHoverOccupiedOrInvalid ? 'bg-rose-500/50' : 'bg-indigo-600/65 scale-95 duration-75';
                  } else if (isValidAnchor) {
                    // Ghost piece hint: soft border with subtle glow
                    borderStyle = 'border-dashed border-emerald-500/60 ring-1 ring-emerald-500/20';
                    bgStyle = 'bg-slate-800/90 hover:bg-slate-750';
                  }

                  return (
                    <div
                      id={`grid-cell-${rIdx}-${cIdx}`}
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      onMouseEnter={() => setHoveredCell([rIdx, cIdx])}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg transition-all duration-150 cursor-pointer border flex flex-col items-center justify-center text-center p-1 relative overflow-hidden ${bgStyle} ${borderStyle}`}
                    >
                      {cellContent}
                      {/* Ghost target indicator dot */}
                      {isValidAnchor && !isHoverHighlighted && (
                        <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Block Selection Pool Candidates Row */}
          <div className="mt-4 text-center w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-150 p-3 rounded-xl max-w-lg mx-auto">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {selectedCandidateIdx === null 
                  ? '👉 Chọn 1 trong 3 khối gạch để chơi:' 
                  : `📌 Đã chọn ${candidates[selectedCandidateIdx]?.name}! Hãy đặt hoặc:`
                }
              </span>
              
              {selectedCandidateIdx !== null && (
                <button
                  onClick={() => handleRotateSelected()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand hover:bg-[#3444cc] text-white text-xs font-black rounded-lg uppercase tracking-wide transition cursor-pointer shadow-xs"
                >
                  <RotateCw size={12} />
                  <span>Xoay Khối</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-lg mx-auto">
              {candidates.map((shape, idx) => {
                if (!shape) {
                  return (
                    <div 
                      key={`empty-candidate-${idx}`}
                      className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 h-36 flex items-center justify-center text-slate-350 text-xs font-semibold"
                    >
                      Đã dùng
                    </div>
                  );
                }

                const isCurrentlySelected = selectedCandidateIdx === idx;

                return (
                  <button
                    id={`candidate-shape-slot-${idx}`}
                    key={shape.id}
                    onClick={() => {
                      if (isCurrentlySelected) {
                        // Clicking again rotates it naturally! Satisfying mechanic.
                        handleRotateSelected();
                      } else {
                        setSelectedCandidateIdx(idx);
                      }
                    }}
                    className={`p-3 border-2 rounded-xl flex flex-col items-center justify-between gap-2.5 transition-all cursor-pointer h-36 hover:shadow-xs outline-none ${
                      isCurrentlySelected 
                        ? 'border-brand bg-indigo-50/20 shadow-md ring-2 ring-brand/10 scale-102' 
                        : 'border-slate-200 hover:border-slate-350 bg-white'
                    }`}
                  >
                    {/* Render word class color badge */}
                    {shape.associatedCard && (
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 max-w-full truncate">
                        {shape.wordClassLabel?.split(' ')[0]}
                      </span>
                    )}

                    {/* Render miniature representation of shape */}
                    <div className="grid gap-0.5 justify-center">
                      {[0, 1, 2].map((r) => {
                        const colsInRow = shape.cells
                          .filter(([dr]) => dr === r)
                          .map(([, dc]) => dc);
                          
                        if (colsInRow.length === 0 && r > 0) return null;

                        return (
                          <div key={r} className="flex gap-0.5">
                            {[0, 1, 2].map((c) => {
                              const active = shape.cells.some(([dr, dc]) => dr === r && dc === c);
                              return (
                                <div 
                                  key={c} 
                                  className={`w-3 h-3 rounded-xs ${active ? shape.color : 'bg-transparent'}`}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-center w-full min-w-0">
                      <span className="text-[9px] font-bold text-slate-500 block truncate">{shape.name}</span>
                      {shape.associatedCard && (
                        <span className="text-[10px] font-black text-slate-800 block truncate mt-0.5 max-w-full font-sans tracking-tight">
                          {shape.associatedCard.term}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Vocabulary trivia check overlay modal popup popup */}
      {quizCard && (
        <div id="blockgame-trivia-popup-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-in">
            {/* Header notification icon block */}
            <div className="bg-gradient-to-r from-brand to-indigo-600 p-5 text-white flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Sparkles size={20} className="text-amber-300 fill-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight uppercase">Mở Khóa Trí Tuệ AI Quiz</h3>
                  <p className="text-[10px] text-indigo-100 font-semibold uppercase tracking-wider">Học tập nâng cao gấp đôi điểm số</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-white/15 px-3 py-1 rounded-full">+200 điểm nếu đúng</span>
            </div>

            {/* Questions Body panel */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-1">ĐỊNH NGHĨA (DEFINITION)</span>
                <p className="text-base sm:text-lg font-extrabold text-slate-800 leading-relaxed italic">
                  "{quizCard.definition}"
                </p>
                {quizCard.example && (
                  <p className="text-xs text-slate-400 italic mt-3">
                    Ví dụ: "{quizCard.example}"
                  </p>
                )}
              </div>

              {/* Multiple response choices list representation */}
              <div className="space-y-3">
                {quizOptions.map((option, idx) => {
                  const isSelected = quizAnswerSelected === option;
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
                      id={`trivia-option-button-${idx}`}
                      key={idx}
                      type="button"
                      disabled={quizChecked}
                      onClick={() => handleSelectQuizAnswer(option)}
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
                  id="trivia-result-alert-box"
                  className={`p-4 rounded-xl flex items-start gap-2.5 text-xs ${
                    quizIsCorrect 
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-150' 
                      : 'bg-rose-50 text-rose-900 border border-rose-150'
                  }`}
                >
                  {quizIsCorrect ? (
                    <>
                      <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block font-bold">Quá chính xác! Ngưỡng tài giỏi (+200 Điểm)</strong>
                        <p className="mt-0.5">Thuật ngữ này đã được bạn liên kết một cách hoàn hảo.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={16} className="text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block font-bold">Chưa chính xác nhưng không sao cả!</strong>
                        <p className="mt-0.5">
                          Thuật ngữ cho "{quizCard.definition}" chính xác là <span className="font-extrabold text-slate-900">"{quizCard.term}"</span>. Hãy ghi nhớ cho các vòng chơi kế tiếp!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Dynamic Footer Controls */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {!quizChecked ? (
                  <button
                    id="trivia-verify-btn"
                    onClick={handleVerifyQuizAnswer}
                    disabled={!quizAnswerSelected}
                    className={`px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      quizAnswerSelected 
                        ? 'bg-brand hover:bg-[#3444cc] text-white shadow-xs cursor-pointer' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    Kiểm Tra Câu Trả Lời
                  </button>
                ) : (
                  <button
                    id="trivia-resume-btn"
                    onClick={handleCloseQuiz}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition"
                  >
                    Tiếp Tục Xếp Hình 🎮
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Rescue Revive Quiz Modal */}
      {showReviveQuiz && (
        <div id="blockgame-revive-overlay" className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            {/* Header Block */}
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg animate-pulse">
                  <ShieldAlert size={22} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight uppercase">CỨU MẠNG BẰNG KIẾN THỨC AI ⚡</h3>
                  <p className="text-[10px] text-rose-100 font-semibold uppercase tracking-wider">Giải phóng 3x3 ô vuông để tiếp tục chuỗi điểm!</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white/15 px-2.5 py-1 rounded-full uppercase">1 Cơ Hội Duy Nhất</span>
            </div>

            {/* Questions Body panel */}
            <div className="p-6 space-y-5">
              {loadingReviveQuiz ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-8 w-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-500 animate-pulse">Gemini đang biên soạn câu hỏi từ vựng siêu khó...</p>
                </div>
              ) : reviveQuizData ? (
                <>
                  <div className="bg-indigo-50/50 border border-indigo-100/80 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block mb-1">CÂU HỎI HỌC THUẬT SIÊU KHÓ:</span>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-relaxed italic">
                      "{reviveQuizData.question}"
                    </p>
                  </div>

                  {/* Multiple response choices list representation */}
                  <div className="space-y-2.5">
                    {reviveQuizData.options.map((option, idx) => {
                      const isSelected = reviveAnswerSelected === option;
                      let itemStyle = 'border-slate-200 hover:border-slate-350 bg-white text-slate-700';

                      if (reviveChecked) {
                        if (option === reviveQuizData.correctAnswer) {
                          itemStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/10 font-bold';
                        } else if (isSelected) {
                          itemStyle = 'bg-rose-50 border-rose-300 text-rose-800 font-bold';
                        } else {
                          itemStyle = 'bg-slate-50 opacity-40 border-slate-100 text-slate-400';
                        }
                      } else if (isSelected) {
                        itemStyle = 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/10';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={reviveChecked}
                          onClick={() => setReviveAnswerSelected(option)}
                          className={`w-full p-3.5 border rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer transition ${itemStyle}`}
                        >
                          <span>{option}</span>
                          {reviveChecked && option === reviveQuizData.correctAnswer && (
                            <Check size={16} className="text-emerald-600" />
                          )}
                          {reviveChecked && isSelected && option !== reviveQuizData.correctAnswer && (
                            <X size={16} className="text-rose-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hint Drawer Toggle */}
                  {reviveQuizData.hint && (
                    <div className="text-left">
                      {!showReviveHint ? (
                        <button
                          onClick={() => setShowReviveHint(true)}
                          className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <HelpCircle size={12} />
                          <span>Yêu cầu gợi ý tinh tế từ Gemini?</span>
                        </button>
                      ) : (
                        <div className="p-3 bg-amber-50 rounded-lg text-[10px] text-amber-900 border border-amber-100 italic leading-relaxed">
                          <strong>Gợi ý AI:</strong> {reviveQuizData.hint}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Result alert banner */}
                  {reviveChecked && (
                    <div className={`p-4 rounded-xl flex items-start gap-2.5 text-xs ${
                      reviveIsCorrect 
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-150' 
                        : 'bg-rose-50 text-rose-900 border border-rose-150'
                    }`}>
                      {reviveIsCorrect ? (
                        <>
                          <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                          <div>
                            <strong className="block font-bold">GIẢI CỨU THÀNH CÔNG! (+300 Điểm) 🎉</strong>
                            <p className="mt-0.5">Tuyệt vời! Một vùng 3x3 ở trung tâm bảng đã được quét sạch. Hãy tiếp tục tích lũy điểm kỷ lục!</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <X size={16} className="text-rose-600 mt-0.5 shrink-0" />
                          <div>
                            <strong className="block font-bold">Trọng thương rồi! Không cứu mạng được.</strong>
                            <p className="mt-0.5">Đáp án đúng phải là <span className="font-extrabold">"{reviveQuizData.correctAnswer}"</span>. Chúc bạn may mắn ở các lượt sau!</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Dynamic control footer */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    {!reviveChecked ? (
                      <button
                        onClick={handleVerifyReviveAnswer}
                        disabled={!reviveAnswerSelected}
                        className={`px-5 py-3 rounded-lg text-2xs font-extrabold uppercase tracking-wider transition ${
                          reviveAnswerSelected 
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        Kiểm Tra Để Giải Cứu
                      </button>
                    ) : (
                      <button
                        onClick={handleCloseReviveModal}
                        className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-2xs font-extrabold uppercase tracking-wider cursor-pointer shadow-xs transition"
                      >
                        {reviveIsCorrect ? 'Tiếp Tục Chơi Ngay! 🎮' : 'Đóng & Chấp Nhận Thua'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 font-bold">
                  Không thể chuẩn bị câu hỏi trắc nghiệm giải cứu. Vui lòng bấm đóng.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
