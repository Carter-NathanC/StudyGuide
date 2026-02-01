import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Check, 
  X, 
  Play, 
  Award, 
  Zap, 
  Settings, 
  MoreVertical,
  ArrowLeft,
  GraduationCap,
  Loader2,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

/* NEUROSTUDY - AI Powered Study Guide
   Open Source Release v1.0
*/

// --- Security & Environment Configuration ---

/* RETRIEVE API KEY SECURELY
   1. Checks window.env (Docker Runtime Injection)
   2. Checks process.env (Build Time for standard bundlers)
   3. Fallback to empty string (Prompt user)
*/
const getApiKey = () => {
  // 1. Check for runtime config (Docker / Nginx injection)
  if (typeof window !== 'undefined' && window.env && window.env.GEMINI_API_KEY) {
    return window.env.GEMINI_API_KEY;
  }
  
  // 2. Safe check for build-time env vars (compatible with ES2015 targets)
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Check for standard naming conventions
      if (process.env.REACT_APP_GEMINI_API_KEY) return process.env.REACT_APP_GEMINI_API_KEY;
      if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
      if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // Ignore reference errors if process is undefined
  }

  return "";
};

const apiKey = getApiKey();

// --- API Utilities ---

async function generateAIContent(prompt, type) {
  if (!apiKey) {
    throw new Error("MISSING_KEY");
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  // Add JSON schema enforcement for structured data
  if (type === 'flashcards' || type === 'quiz') {
    payload.generationConfig = {
      responseMimeType: "application/json"
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("No content generated");

    return text;
  } catch (error) {
    console.error("AI Generation failed", error);
    throw error;
  }
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon }) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 focus:ring-indigo-500",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-400",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 focus:ring-red-500",
    ghost: "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Sub-Features ---

const FlashcardGame = ({ deck, onFinish, onUpdateXP }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState([]);

  const handleNext = (known) => {
    if (known) {
      setMastered([...mastered, currentIndex]);
      onUpdateXP(10); // 10 XP per card known
    }
    
    setIsFlipped(false);
    
    if (currentIndex < deck.cards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      onFinish(mastered.length + (known ? 1 : 0), deck.cards.length);
    }
  };

  const currentCard = deck.cards[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto py-8">
      <div className="mb-6 flex items-center justify-between w-full text-sm text-gray-500">
        <span>Card {currentIndex + 1} of {deck.cards.length}</span>
        <span>Mastered: {mastered.length}</span>
      </div>

      <div 
        className="w-full aspect-video perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white border-2 border-indigo-100 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center hover:border-indigo-300 transition-colors">
            <span className="text-xs font-bold tracking-wider text-indigo-500 mb-4 uppercase">Front</span>
            <p className="text-2xl font-medium text-gray-800">{currentCard.front}</p>
            <span className="absolute bottom-4 text-gray-400 text-xs">Click to flip</span>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center text-white">
            <span className="text-xs font-bold tracking-wider text-indigo-200 mb-4 uppercase">Back</span>
            <p className="text-xl font-medium">{currentCard.back}</p>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="mt-8 flex gap-4 w-full max-w-md animate-in slide-in-from-bottom-4">
          <Button 
            variant="danger" 
            className="flex-1 py-4" 
            onClick={() => handleNext(false)}
            icon={X}
          >
            Study Again
          </Button>
          <Button 
            variant="success" 
            className="flex-1 py-4" 
            onClick={() => handleNext(true)}
            icon={Check}
          >
            I Know This
          </Button>
        </div>
      )}
    </div>
  );
};

const QuizGame = ({ quiz, onFinish, onUpdateXP }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (idx) => {
    setSelected(idx);
    setShowResult(true);
    
    const correct = idx === quiz.questions[currentQ].correctAnswerIndex;
    if (correct) {
      setScore(s => s + 1);
      onUpdateXP(25); // 25 XP per correct answer
    }

    setTimeout(() => {
      if (currentQ < quiz.questions.length - 1) {
        setCurrentQ(c => c + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        onFinish(score + (correct ? 1 : 0), quiz.questions.length);
      }
    }, 1500);
  };

  const question = quiz.questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto py-8">
       <div className="mb-6 flex items-center justify-between w-full text-sm font-medium text-gray-500">
        <span>Question {currentQ + 1} / {quiz.questions.length}</span>
        <span>Score: {score}</span>
      </div>

      <Card className="p-8 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">{question.question}</h3>
        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            let btnClass = "w-full text-left p-4 rounded-lg border-2 transition-all ";
            if (showResult) {
              if (idx === question.correctAnswerIndex) btnClass += "border-green-500 bg-green-50 text-green-700";
              else if (idx === selected) btnClass += "border-red-500 bg-red-50 text-red-700";
              else btnClass += "border-gray-100 text-gray-400 opacity-50";
            } else {
              btnClass += "border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 text-gray-700";
            }

            return (
              <button
                key={idx}
                disabled={showResult}
                onClick={() => handleAnswer(idx)}
                className={btnClass}
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs mr-3 opacity-50">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  // State
  const [modules, setModules] = useState([
    { 
      id: 1, 
      name: 'Biology 101', 
      icon: '🧬', 
      color: 'bg-green-100 text-green-700',
      documents: [],
      flashcardSets: [],
      quizzes: []
    },
    { 
      id: 2, 
      name: 'World History', 
      icon: '🌍', 
      color: 'bg-blue-100 text-blue-700',
      documents: [],
      flashcardSets: [],
      quizzes: []
    }
  ]);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard, module, study-flash, study-quiz
  const [activeItem, setActiveItem] = useState(null); // The specific flashcard set or quiz being used
  
  // Gamification State
  const [xp, setXP] = useState(1250);
  const [level, setLevel] = useState(3);
  const [quests, setQuests] = useState([
    { id: 1, title: 'Knowledge Seeker', desc: 'Create your first Module', xp: 500, completed: true },
    { id: 2, title: 'Bookworm', desc: 'Add 3 Documents to a module', xp: 300, completed: false },
    { id: 3, title: 'Quiz Master', desc: 'Score 100% on any quiz', xp: 1000, completed: false },
  ]);

  // UI State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Handlers ---

  const handleCreateModule = () => {
    if (!newModuleName.trim()) return;
    const newMod = {
      id: Date.now(),
      name: newModuleName,
      icon: '📚',
      color: 'bg-indigo-100 text-indigo-700',
      documents: [],
      flashcardSets: [],
      quizzes: []
    };
    setModules([...modules, newMod]);
    setNewModuleName('');
    setIsCreateModalOpen(false);
    updateXP(100);
  };

  const handleAddDocument = async () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) return;
    
    // Simulate processing
    setIsGenerating(true);
    
    try {
      // 1. Generate Summary
      const summaryPrompt = `Summarize the following text in about 3 sentences. Keep it concise and educational. Text: ${newDocContent.substring(0, 5000)}`;
      const summary = await generateAIContent(summaryPrompt, 'text');

      const newDoc = {
        id: Date.now(),
        title: newDocTitle,
        content: newDocContent,
        summary: summary,
        date: new Date().toLocaleDateString()
      };

      const updatedModules = modules.map(m => {
        if (m.id === activeModuleId) {
          return { ...m, documents: [newDoc, ...m.documents] };
        }
        return m;
      });

      setModules(updatedModules);
      setNewDocTitle('');
      setNewDocContent('');
      setIsDocModalOpen(false);
      updateXP(50);
      
      // Check quest
      const currentMod = updatedModules.find(m => m.id === activeModuleId);
      if (currentMod.documents.length >= 3) completeQuest(2);

    } catch (e) {
      if (e.message === 'MISSING_KEY') {
        alert("Configuration Error: Gemini API Key is missing. Please check your Docker environment variables.");
      } else {
        alert("Failed to process document. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFlashcards = async (doc) => {
    setIsGenerating(true);
    try {
      const prompt = `Create 5 study flashcards based on this text. Return ONLY raw JSON in the following format: { "cards": [{ "front": "question", "back": "answer" }] }. Text: ${doc.content.substring(0, 5000)}`;
      const jsonStr = await generateAIContent(prompt, 'flashcards');
      // Clean markdown code blocks if present
      const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '');
      const data = JSON.parse(cleanJson);

      const newSet = {
        id: Date.now(),
        title: `Cards: ${doc.title}`,
        cards: data.cards,
        sourceDocId: doc.id
      };

      setModules(mods => mods.map(m => {
        if (m.id === activeModuleId) {
          return { ...m, flashcardSets: [newSet, ...m.flashcardSets] };
        }
        return m;
      }));
      updateXP(20);
    } catch (e) {
       if (e.message === 'MISSING_KEY') {
        alert("Configuration Error: Gemini API Key is missing. Please check your Docker environment variables.");
      } else {
        console.error(e);
        alert("Failed to generate flashcards. AI might be busy.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuiz = async (doc) => {
    setIsGenerating(true);
    try {
      const prompt = `Create a multiple choice quiz with 5 questions based on this text. Return ONLY raw JSON in this format: { "questions": [{ "question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0 }] }. Text: ${doc.content.substring(0, 5000)}`;
      const jsonStr = await generateAIContent(prompt, 'quiz');
      const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '');
      const data = JSON.parse(cleanJson);

      const newQuiz = {
        id: Date.now(),
        title: `Quiz: ${doc.title}`,
        questions: data.questions,
        sourceDocId: doc.id,
        bestScore: null
      };

      setModules(mods => mods.map(m => {
        if (m.id === activeModuleId) {
          return { ...m, quizzes: [newQuiz, ...m.quizzes] };
        }
        return m;
      }));
      updateXP(20);
    } catch (e) {
       if (e.message === 'MISSING_KEY') {
        alert("Configuration Error: Gemini API Key is missing. Please check your Docker environment variables.");
      } else {
        console.error(e);
        alert("Failed to generate quiz.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateXP = (amount) => {
    setXP(prev => {
      const newTotal = prev + amount;
      // Level up logic (simple: level * 1000)
      const nextLevelReq = level * 1000;
      if (newTotal >= nextLevelReq) {
        setLevel(l => l + 1);
        // Could show level up modal here
      }
      return newTotal;
    });
  };

  const completeQuest = (questId) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed) {
        updateXP(q.xp);
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  // --- Render Helpers ---

  const activeModule = modules.find(m => m.id === activeModuleId);

  const renderDashboard = () => (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Scholar.</p>
        </div>
        <div className="flex gap-2">
           {!apiKey && (
             <div className="flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 text-sm font-medium">
               <AlertTriangle className="w-4 h-4 mr-2" />
               API Key Missing
             </div>
           )}
          <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus}>
            New Class Module
          </Button>
        </div>
      </div>

      {/* Stats / Quest Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2 flex items-center"><Award className="w-5 h-5 mr-2"/> Current Quest</h2>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="font-medium text-lg">
                {quests.find(q => !q.completed)?.title || "All Quests Completed!"}
              </p>
              <p className="text-indigo-100 text-sm mt-1">
                {quests.find(q => !q.completed)?.desc || "You are a master of knowledge."}
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium opacity-90">
              <span className="bg-white/20 px-2 py-1 rounded text-xs mr-2">REWARD</span>
              +{quests.find(q => !q.completed)?.xp || 0} XP
            </div>
          </div>
          <Brain className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-10 rotate-12" />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-3 relative">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full border border-white">
              Lvl {level}
            </div>
          </div>
          <div className="text-center w-full">
            <div className="text-2xl font-bold text-gray-800">{xp} XP</div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${(xp % 1000) / 10}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{(level * 1000) - xp} XP to next level</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">Your Classes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(mod => (
          <div 
            key={mod.id}
            onClick={() => { setActiveModuleId(mod.id); setView('module'); }}
            className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className={`w-12 h-12 rounded-lg ${mod.color} flex items-center justify-center text-xl mb-4`}>
              {mod.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {mod.name}
            </h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <FileText className="w-4 h-4 mr-2" />
                {mod.documents.length} Documents
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Zap className="w-4 h-4 mr-2" />
                {mod.flashcardSets.length + mod.quizzes.length} Study Activities
              </div>
            </div>
            <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-gray-300" />
          </div>
        ))}

        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
        >
          <Plus className="w-8 h-8 mb-2" />
          <span className="font-medium">Add Class Module</span>
        </button>
      </div>
    </div>
  );

  const renderModuleView = () => (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Module Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-gray-100">
          <button 
            onClick={() => setView('dashboard')}
            className="flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${activeModule.color} flex items-center justify-center text-lg`}>
              {activeModule.icon}
            </div>
            <h2 className="font-bold text-gray-900 leading-tight">{activeModule.name}</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Document Section */}
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Documents</span>
              <button onClick={() => setIsDocModalOpen(true)} className="hover:bg-gray-100 p-1 rounded">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {activeModule.documents.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-4 italic">No docs yet</div>
            ) : (
              <div className="space-y-1">
                {activeModule.documents.map(doc => (
                  <div key={doc.id} className="text-sm text-gray-700 p-2 hover:bg-gray-50 rounded cursor-pointer truncate">
                    📄 {doc.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flashcards Section */}
          <div>
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Flashcards</span>
            </div>
            <div className="space-y-2">
              {activeModule.flashcardSets.map(set => (
                <div 
                  key={set.id} 
                  onClick={() => { setActiveItem(set); setView('study-flash'); }}
                  className="bg-orange-50 text-orange-800 text-sm p-3 rounded-lg border border-orange-100 cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="font-medium flex items-center">
                    <BookOpen className="w-3 h-3 mr-2" />
                    {set.title}
                  </div>
                  <div className="text-xs opacity-75 mt-1">{set.cards.length} cards</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Section */}
          <div>
             <div className="flex items-center justify-between mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Quizzes</span>
            </div>
            <div className="space-y-2">
              {activeModule.quizzes.map(q => (
                <div 
                  key={q.id}
                  onClick={() => { setActiveItem(q); setView('study-quiz'); }}
                  className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="font-medium flex items-center">
                    <Brain className="w-3 h-3 mr-2" />
                    {q.title}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {q.bestScore !== null ? `Best: ${q.bestScore}/${q.questions.length}` : 'Not taken'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeModule.documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Start Studying</h3>
            <p className="max-w-md mb-6">Add your first document (notes, textbook excerpt, essay) to generate AI study materials.</p>
            <Button onClick={() => setIsDocModalOpen(true)} icon={Plus}>Add Document</Button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Study Materials</h2>
            
            {activeModule.documents.map(doc => (
              <Card key={doc.id} className="overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">{doc.title}</h3>
                  <span className="text-xs text-gray-400">{doc.date}</span>
                </div>
                <div className="p-6">
                  <div className="mb-6 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">AI Summary</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{doc.summary}</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      variant="secondary" 
                      className="flex-1" 
                      onClick={() => generateFlashcards(doc)}
                      disabled={isGenerating}
                      icon={BookOpen}
                    >
                      {isGenerating ? 'Generating...' : 'Generate Flashcards'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1" 
                      onClick={() => generateQuiz(doc)}
                      disabled={isGenerating}
                      icon={Brain}
                    >
                       {isGenerating ? 'Generating...' : 'Generate Quiz'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveStudySession = () => {
    const isQuiz = view === 'study-quiz';
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setView('module')} 
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{activeItem?.title}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-medium">
            <Zap className="w-4 h-4" /> Gain XP
          </div>
        </header>

        <main className="flex-1 overflow-hidden p-4">
          {isQuiz ? (
            <QuizGame 
              quiz={activeItem} 
              onUpdateXP={updateXP}
              onFinish={(score, total) => {
                alert(`Quiz Complete! Score: ${score}/${total}`);
                // Update best score logic would go here
                if (score === total) completeQuest(3);
                setView('module');
              }}
            />
          ) : (
            <FlashcardGame 
              deck={activeItem}
              onUpdateXP={updateXP}
              onFinish={(learned, total) => {
                alert(`Session Complete! You mastered ${learned} out of ${total} cards.`);
                setView('module');
              }}
            />
          )}
        </main>
      </div>
    );
  };

  // --- Main Render ---

  return (
    <div className="font-sans text-gray-900 bg-gray-50 min-h-screen">
      {view === 'dashboard' && renderDashboard()}
      {view === 'module' && renderModuleView()}
      {(view === 'study-flash' || view === 'study-quiz') && renderActiveStudySession()}

      {/* Modals */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create New Class Module"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Intro to Psychology"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleCreateModule}>Create Module</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isDocModalOpen} 
        onClose={() => setIsDocModalOpen(false)} 
        title="Add Study Material"
      >
        <div className="space-y-4">
           {isGenerating ? (
             <div className="flex flex-col items-center justify-center py-8 text-center">
               <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
               <p className="text-gray-600 font-medium">Reading document & generating summary...</p>
               <p className="text-xs text-gray-400 mt-2">Powered by Gemini AI</p>
             </div>
           ) : (
             <>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Chapter 1 Notes"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (Paste Text)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-48 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Paste your notes, essay, or book content here..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pro Tip: Copy text from your PDFs or PowerPoints and paste it here.
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleAddDocument}>Process & Add</Button>
              </div>
             </>
           )}
        </div>
      </Modal>
    </div>
  );
}