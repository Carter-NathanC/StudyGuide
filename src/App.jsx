import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Check, 
  X, 
  Trophy, 
  Zap, 
  Settings, 
  ArrowLeft, 
  GraduationCap, 
  Loader2, 
  Upload, 
  Target, 
  Star,
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  BarChart3,
  AlertCircle
} from 'lucide-react';

// --- Configuration & API ---
const apiKey = ""; // Provided by environment

const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

async function callGemini(prompt, isJson = false, base64Image = null) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const parts = [{ text: prompt }];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: base64Image
      }
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: isJson ? { responseMimeType: "application/json" } : {}
  };

  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      if (i === 4) throw error;
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

// --- Constants & Logic ---
const LEVEL_THRESHOLD = 1000;
const XP_MAP = {
  CREATE_CLASS: 100,
  UPLOAD_DOC: 50,
  GENERATE_MATERIAL: 30,
  COMPLETE_QUIZ: 150,
  PERFECT_SCORE: 100,
  ASSIGNMENT_GRADE_MULTIPLIER: 5 // XP = Grade (0-100) * 5
};

const MILESTONES = [
  { id: 'first_class', title: 'The Journey Begins', desc: 'Create your first class', icon: '🌱', xp: 200 },
  { id: 'study_bug', title: 'Study Bug', desc: 'Upload 5 documents', icon: '📚', xp: 500 },
  { id: 'quiz_master', title: 'Quiz Master', desc: 'Complete 3 quizzes with >80% score', icon: '👑', xp: 1000 },
  { id: 'high_achiever', title: 'High Achiever', desc: 'Log an assignment grade of 90% or higher', icon: '🎯', xp: 750 }
];

// --- Sub-Components ---

const ProgressBar = ({ value, max, color = "bg-indigo-600", height = "h-2" }) => (
  <div className={`w-full bg-gray-100 rounded-full ${height} overflow-hidden`}>
    <div 
      className={`${color} h-full transition-all duration-500 ease-out`} 
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
    />
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// --- Core App ---

export default function App() {
  // State
  const [view, setView] = useState('dashboard'); // dashboard, class, study
  const [classes, setClasses] = useState([]);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [activeStudyItem, setActiveStudyItem] = useState(null);
  
  // Modals
  const [modals, setModals] = useState({ class: false, doc: false, assignment: false, result: false });
  const [loading, setLoading] = useState(false);
  const [studyResult, setStudyResult] = useState(null);

  // Derived State
  const level = Math.floor(xp / LEVEL_THRESHOLD) + 1;
  const xpInLevel = xp % LEVEL_THRESHOLD;
  const activeClass = classes.find(c => c.id === activeClassId);

  // XP & Gamification Logic
  const addXp = (amount) => setXp(prev => prev + amount);

  const checkMilestones = (updatedClasses, updatedXp) => {
    const newAchievements = [];
    const earnedIds = achievements.map(a => a.id);

    // First Class
    if (!earnedIds.includes('first_class') && updatedClasses.length > 0) {
      newAchievements.push(MILESTONES.find(m => m.id === 'first_class'));
    }
    // Study Bug (5 docs)
    const totalDocs = updatedClasses.reduce((sum, c) => sum + c.docs.length, 0);
    if (!earnedIds.includes('study_bug') && totalDocs >= 5) {
      newAchievements.push(MILESTONES.find(m => m.id === 'study_bug'));
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      newAchievements.forEach(a => addXp(a.xp));
    }
  };

  // Handlers
  const handleAddClass = (e) => {
    e.preventDefault();
    const name = e.target.className.value;
    const newClass = {
      id: Date.now().toString(),
      name,
      docs: [],
      assignments: [],
      materials: [], // flashcards, quizzes, summaries
      color: ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500'][classes.length % 5]
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    addXp(XP_MAP.CREATE_CLASS);
    checkMilestones(updated, xp + XP_MAP.CREATE_CLASS);
    setModals({ ...modals, class: false });
  };

  const removeClass = (id) => {
    setClasses(classes.filter(c => c.id !== id));
    if (activeClassId === id) setView('dashboard');
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    const title = e.target.docTitle.value;
    const fileInput = e.target.docFile;
    const textContent = e.target.docText.value;
    
    setLoading(true);
    try {
      let docData = { id: Date.now().toString(), title, date: new Date().toLocaleDateString() };
      let promptText = textContent;

      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.type.startsWith('image/')) {
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
          });
          const analysis = await callGemini("Identify the key educational concepts in this image and provide a 4-sentence study summary.", false, base64);
          docData.summary = analysis;
          docData.type = 'image';
          promptText = analysis;
        } else {
          // Fallback for text files if needed
          docData.type = 'text';
          docData.summary = "Processing text content...";
        }
      } else {
        const summary = await callGemini(`Summarize these student notes into a concise, high-level overview for a study guide: ${textContent.slice(0, 4000)}`);
        docData.summary = summary;
        docData.type = 'text';
      }

      const updated = classes.map(c => {
        if (c.id === activeClassId) return { ...c, docs: [docData, ...c.docs] };
        return c;
      });
      setClasses(updated);
      addXp(XP_MAP.UPLOAD_DOC);
      checkMilestones(updated, xp + XP_MAP.UPLOAD_DOC);
      setModals({ ...modals, doc: false });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logAssignment = (e) => {
    e.preventDefault();
    const name = e.target.assignName.value;
    const grade = parseFloat(e.target.assignGrade.value);
    const newAssign = { id: Date.now().toString(), name, grade, date: new Date().toLocaleDateString() };
    
    const xpEarned = Math.floor(grade * XP_MAP.ASSIGNMENT_GRADE_MULTIPLIER);
    
    const updated = classes.map(c => {
      if (c.id === activeClassId) return { ...c, assignments: [newAssign, ...c.assignments] };
      return c;
    });
    setClasses(updated);
    addXp(xpEarned);
    
    if (grade >= 90 && !achievements.find(a => a.id === 'high_achiever')) {
      checkMilestones(updated, xp + xpEarned);
    }
    
    setModals({ ...modals, assignment: false });
  };

  const generateAI = async (doc, type) => {
    setLoading(true);
    try {
      let prompt = "";
      if (type === 'quiz') {
        prompt = `Generate 5 challenging multiple choice questions based on the following content. Return ONLY a JSON object with this structure: { "title": "Quiz Name", "questions": [{ "question": "text", "options": ["A","B","C","D"], "correctIndex": 0 }] }. Content: ${doc.summary}`;
      } else if (type === 'flashcards') {
        prompt = `Generate 6 study flashcards. Return ONLY a JSON object with this structure: { "title": "Deck Name", "cards": [{ "front": "term/question", "back": "definition/answer" }] }. Content: ${doc.summary}`;
      }

      const raw = await callGemini(prompt, true);
      const data = JSON.parse(raw);
      const material = { ...data, id: Date.now().toString(), type, docId: doc.id };
      
      setClasses(classes.map(c => {
        if (c.id === activeClassId) return { ...c, materials: [material, ...c.materials] };
        return c;
      }));
      addXp(XP_MAP.GENERATE_MATERIAL);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- View Components ---

  const Dashboard = () => (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-indigo-600 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">Welcome Back, Scholar</h1>
            <p className="text-indigo-100 opacity-90 max-w-md">Your cognitive journey continues. You're {LEVEL_THRESHOLD - xpInLevel} XP away from Level {level + 1}.</p>
          </div>
          <div className="mt-8 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold tracking-widest uppercase text-indigo-200">Level {level}</span>
              <span className="text-2xl font-black">{xpInLevel} / {LEVEL_THRESHOLD} <span className="text-sm font-normal text-indigo-200">XP</span></span>
            </div>
            <ProgressBar value={xpInLevel} max={LEVEL_THRESHOLD} color="bg-white" height="h-3" />
          </div>
          <Brain className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-2xl font-black text-gray-800">{achievements.length}</span>
            <span className="text-xs font-bold text-gray-400 uppercase">Achievements</span>
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-indigo-500" />
            </div>
            <span className="text-2xl font-black text-gray-800">{classes.length}</span>
            <span className="text-xs font-bold text-gray-400 uppercase">Active Classes</span>
          </Card>
          <Card className="p-6 flex flex-col items-center justify-center text-center col-span-2">
            <div className="w-full flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Top Milestone</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <p className="font-bold text-gray-800 truncate w-full">
              {achievements.length > 0 ? achievements[achievements.length - 1].title : "None Yet"}
            </p>
          </Card>
        </div>
      </div>

      {/* Classes Grid */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-600" />
            Your Classes
          </h2>
          <button 
            onClick={() => setModals({ ...modals, class: true })}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Class
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">Empty Study Hall</h3>
            <p className="text-gray-400 max-w-xs mt-2">Create your first class module to start generating study guides and earning XP.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setActiveClassId(c.id); setView('class'); }}
                className="group relative bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
              >
                <div className={`w-14 h-14 ${c.color} rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg`}>
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-gray-800 group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                <div className="mt-6 flex gap-4 text-sm font-bold text-gray-400">
                  <span className="flex items-center"><FileText className="w-4 h-4 mr-1.5" /> {c.docs.length} Docs</span>
                  <span className="flex items-center"><Target className="w-4 h-4 mr-1.5" /> {c.assignments.length} Tasks</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeClass(c.id); }}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Milestones */}
      <section>
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center">
          <Star className="w-6 h-6 mr-2 text-amber-500" />
          Milestones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MILESTONES.map(m => {
            const isEarned = achievements.find(a => a.id === m.id);
            return (
              <div key={m.id} className={`p-6 rounded-2xl border transition-all ${isEarned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                <div className="text-3xl mb-3">{m.icon}</div>
                <h4 className="font-bold text-gray-800 mb-1">{m.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
                <div className="mt-3 text-xs font-black text-amber-600">+{m.xp} XP</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const ClassView = () => (
    <div className="flex h-screen bg-white overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-50">
          <button onClick={() => setView('dashboard')} className="flex items-center text-sm font-bold text-gray-400 hover:text-indigo-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </button>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${activeClass.color} rounded-2xl flex items-center justify-center text-white shadow-md`}>
              <Brain className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-gray-800 truncate">{activeClass.name}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Assignments Mini-List */}
          <div>
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Assignments</h3>
              <button onClick={() => setModals({ ...modals, assignment: true })} className="p-1 hover:bg-indigo-50 rounded text-indigo-600">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {activeClass.assignments.map(a => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-gray-700 truncate mr-2">{a.name}</span>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{a.grade}%</span>
                  </div>
                </div>
              ))}
              {activeClass.assignments.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No grades logged</p>}
            </div>
          </div>

          {/* Generated Materials */}
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-4">AI Materials</h3>
            <div className="space-y-3">
              {activeClass.materials.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => { setActiveStudyItem(m); setView('study'); }}
                  className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-300 cursor-pointer transition-all flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.type === 'quiz' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                    {m.type === 'quiz' ? <Brain className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{m.title}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{m.type}</p>
                  </div>
                </div>
              ))}
              {activeClass.materials.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Create materials from docs</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-800">Knowledge Base</h2>
            <button 
              onClick={() => setModals({ ...modals, doc: true })}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl font-bold flex items-center transition-all shadow-sm"
            >
              <Upload className="w-5 h-5 mr-2" /> Upload Document
            </button>
          </div>

          <div className="space-y-6">
            {activeClass.docs.map(doc => (
              <Card key={doc.id} className="p-8">
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${doc.type === 'image' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {doc.type === 'image' ? <ImageIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-black text-gray-800 truncate">{doc.title}</h3>
                      <span className="text-xs font-bold text-gray-400">{doc.date}</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 italic">"{doc.summary}"</p>
                    
                    <div className="flex gap-3">
                      <button 
                        disabled={loading}
                        onClick={() => generateAI(doc, 'quiz')}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-all flex items-center"
                      >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                        Generate Quiz
                      </button>
                      <button 
                        disabled={loading}
                        onClick={() => generateAI(doc, 'flashcards')}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-bold rounded-xl transition-all flex items-center"
                      >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                        Flashcards
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {activeClass.docs.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-lg font-bold text-gray-400">No documents yet.</p>
                <p className="text-sm text-gray-400">Paste notes or upload images to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const StudyView = () => {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [score, setScore] = useState(null);

    const handleQuizAnswer = (optIdx) => {
      const isCorrect = optIdx === activeStudyItem.questions[index].correctIndex;
      const newAnswers = [...answers, isCorrect];
      setAnswers(newAnswers);
      
      if (index < activeStudyItem.questions.length - 1) {
        setTimeout(() => setIndex(index + 1), 600);
      } else {
        const finalScore = Math.round((newAnswers.filter(a => a).length / newAnswers.length) * 100);
        setScore(finalScore);
        addXp(XP_MAP.COMPLETE_QUIZ + (finalScore === 100 ? XP_MAP.PERFECT_SCORE : 0));
        if (finalScore >= 80) checkMilestones(classes, xp + XP_MAP.COMPLETE_QUIZ);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-6 animate-in zoom-in duration-300">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => setView('class')}
            className="flex items-center text-sm font-black text-gray-400 hover:text-indigo-600 mb-8 uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit Session
          </button>

          {score !== null ? (
            <Card className="p-12 text-center">
              <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-xl shadow-indigo-200">
                {score}%
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Knowledge Synced!</h2>
              <p className="text-gray-500 mb-8">You've earned some massive XP for this session.</p>
              <button onClick={() => setView('class')} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg">Return to Class</button>
            </Card>
          ) : activeStudyItem.type === 'quiz' ? (
            <div className="space-y-8">
               <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-gray-800">{activeStudyItem.title}</h2>
                  <p className="text-gray-400 font-bold uppercase text-xs mt-1">Question {index + 1} of {activeStudyItem.questions.length}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600">+{XP_MAP.COMPLETE_QUIZ}</span>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Est. XP</p>
                </div>
              </div>
              <ProgressBar value={index} max={activeStudyItem.questions.length - 1} color="bg-indigo-600" height="h-3" />
              
              <Card className="p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-8">{activeStudyItem.questions[index].question}</h3>
                <div className="grid gap-4">
                  {activeStudyItem.questions[index].options.map((opt, i) => (
                    <button 
                      key={i}
                      onClick={() => handleQuizAnswer(i)}
                      className="w-full text-left p-5 rounded-2xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold text-gray-700 flex items-center"
                    >
                      <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-4 text-xs font-black text-gray-400 uppercase">{String.fromCharCode(65+i)}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black text-gray-800">{activeStudyItem.title}</h2>
                <p className="text-gray-400 font-bold uppercase text-xs mt-2">Card {index + 1} of {activeStudyItem.cards.length}</p>
              </div>

              <div 
                className="relative h-96 w-full cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                  <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border-4 border-indigo-50 shadow-xl flex items-center justify-center p-12 text-center">
                    <p className="text-2xl font-black text-gray-800">{activeStudyItem.cards[index].front}</p>
                    <div className="absolute bottom-6 text-xs font-black text-gray-300 uppercase tracking-widest">Click to Flip</div>
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-3xl shadow-xl flex items-center justify-center p-12 text-center text-white">
                    <p className="text-2xl font-bold leading-relaxed">{activeStudyItem.cards[index].back}</p>
                    <div className="absolute bottom-6 text-xs font-black text-indigo-300 uppercase tracking-widest">Concept Mastered</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center px-4">
                <button 
                  disabled={index === 0}
                  onClick={() => { setIndex(index - 1); setIsFlipped(false); }}
                  className="p-4 bg-white border border-gray-200 rounded-2xl disabled:opacity-30"
                ><ArrowLeft /></button>
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-800">{index + 1} <span className="text-gray-300">/</span> {activeStudyItem.cards.length}</div>
                </div>
                <button 
                  onClick={() => { 
                    if (index < activeStudyItem.cards.length - 1) {
                      setIndex(index + 1); setIsFlipped(false); 
                    } else {
                      setScore(100);
                    }
                  }}
                  className="p-4 bg-indigo-600 text-white rounded-2xl"
                ><ChevronRight /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans text-gray-900 selection:bg-indigo-100">
      {view === 'dashboard' && <Dashboard />}
      {view === 'class' && activeClass && <ClassView />}
      {view === 'study' && activeStudyItem && <StudyView />}

      {/* Modals */}
      <Modal isOpen={modals.class} onClose={() => setModals({...modals, class: false})} title="Create New Class">
        <form onSubmit={handleAddClass} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Class Name</label>
            <input name="className" required className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold transition-all" placeholder="e.g. Molecular Biology" />
          </div>
          <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-all">Establish Module (+100 XP)</button>
        </form>
      </Modal>

      <Modal isOpen={modals.doc} onClose={() => setModals({...modals, doc: false})} title="Upload Knowledge">
        <form onSubmit={handleUploadDoc} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Title</label>
            <input name="docTitle" required className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold" placeholder="e.g. Lecture 4: DNA Repair" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">File (Image/Slide)</label>
              <input type="file" name="docFile" accept="image/*" className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Or Paste Text Notes</label>
            <textarea name="docText" className="w-full h-40 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-medium text-sm" placeholder="Paste your raw study notes here..." />
          </div>
          <button disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-black rounded-2xl shadow-lg flex items-center justify-center">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sync with AI (+50 XP)"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modals.assignment} onClose={() => setModals({...modals, assignment: false})} title="Log Assignment Grade">
        <form onSubmit={logAssignment} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Assignment Name</label>
            <input name="assignName" required className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold" placeholder="e.g. Midterm Exam" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Grade (0-100)</label>
            <input name="assignGrade" type="number" min="0" max="100" required className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-2xl text-indigo-600" placeholder="95" />
          </div>
          <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg">Collect Academic XP</button>
        </form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}