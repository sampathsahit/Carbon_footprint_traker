import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, Home, Calculator, MessageSquare, Target, Trophy, 
  Car, Zap, Utensils, ShoppingBag, Droplets, ArrowRight,
  Send, Bot, User, AlertCircle, CheckCircle2, TrendingDown,
  TreePine, Wind, BarChart3, Medal, Calendar, Award, Shield,
  Users, Flame, Sparkles, LogIn, ChevronRight, Globe, Share2, HelpCircle
} from 'lucide-react';

const apiKey = ""; // API key is injected by the environment or system

const generateAIResponse = async (prompt, chatHistory) => {
  const systemInstruction = `You are EcoBot, a helpful, encouraging, and highly knowledgeable AI Sustainability Scientist inside the EcoTrack platform. 
  Your goal is to help users reduce their carbon footprint, explain green energy concepts, recommend eco-friendly substitutions, and support climate goals. 
  Keep answers friendly, clear, structured with bullet points where appropriate, and highly actionable. Reference specific metrics if the user shares them.`;
  
  const userQuery = chatHistory.length > 0 
    ? `Context of conversation: ${chatHistory.slice(-5).map(m => `${m.role}: ${m.text}`).join(' | ')}. \n\nUser's new message: ${prompt}`
    : prompt;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  let retries = 3;
  let delay = 1000;

  while (retries > 0) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that right now.";
    } catch (error) {
      retries--;
      if (retries === 0) {
        return "I'm having trouble connecting to my knowledge base right now. Let me suggest a small action: Try reducing phantom loads by unplugging electronics when not in use!";
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

const INITIAL_EMISSIONS = {
  transport: 140, 
  electricity: 90,
  food: 75,
  shopping: 40,
  water: 15
};

const TREND_DATA = [
  { month: 'Jan', value: 390 },
  { month: 'Feb', value: 370 },
  { month: 'Mar', value: 350 },
  { month: 'Apr', value: 320 },
  { month: 'May', value: 290 },
  { month: 'Jun', value: 360 }, // Current month, dynamically adjusts
];

const BADGES = [
  { id: 1, name: 'First Step', desc: 'Completed your carbon audit.', icon: <Target className="w-6 h-6 text-blue-500" />, unlocked: true, unlockedAt: 'Just Now' },
  { id: 2, name: 'Challenger', desc: 'Participated in a collective challenge.', icon: <Trophy className="w-6 h-6 text-amber-500" />, unlocked: true, unlockedAt: '2 days ago' },
  { id: 3, name: 'Tree Hugger', desc: 'Dropped monthly footprint below 220kg.', icon: <TreePine className="w-6 h-6 text-emerald-500" />, unlocked: false, unlockedAt: null },
  { id: 4, name: 'Eco Champion', desc: 'Maintained low emissions for 3 consecutive months.', icon: <Medal className="w-6 h-6 text-purple-500" />, unlocked: false, unlockedAt: null },
];

const LEADERBOARD_USERS = [
  { rank: 1, name: "Sarah Jenkins", points: 890, level: "Climate Sage", avatar: "SJ" },
  { rank: 2, name: "David Chen", points: 740, level: "Green Guardian", avatar: "DC" },
  { rank: 3, name: "Maria Rodriguez", points: 590, level: "Eco Warrior", avatar: "MR" },
  { rank: 4, name: "You", points: 340, level: "Green Warrior", avatar: "ME", highlighted: true },
  { rank: 5, name: "Alex Mercer", points: 310, level: "Eco Beginner", avatar: "AM" }
];

const CHALLENGES = [
  { id: 1, title: 'No-Car Day', description: 'Walk, cycle, or take public transit for 24 hours straight.', points: 50, icon: <Car className="w-6 h-6" />, joined: true, completed: false, participants: 1420 },
  { id: 2, title: 'Energy-Saving Week', description: 'Reduce power consumption by 15% by turning off lights and standby devices.', points: 120, icon: <Zap className="w-6 h-6" />, joined: false, completed: false, participants: 840 },
  { id: 3, title: 'Meat-Free Mondays', description: 'Substitute all meat with delicious plant-based alternatives for a day.', points: 40, icon: <Utensils className="w-6 h-6" />, joined: false, completed: false, participants: 2150 },
  { id: 4, title: 'Zero Single-Use Plastics', description: 'Avoid buying or using single-use plastic bottles, cups, and packaging.', points: 80, icon: <ShoppingBag className="w-6 h-6" />, joined: true, completed: true, participants: 3105 },
];

export default function App() {
  const [viewMode, setViewMode] = useState('landing'); // 'landing' or 'app'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [emissions, setEmissions] = useState(INITIAL_EMISSIONS);
  const [targetGoal, setTargetGoal] = useState(250);
  const [points, setPoints] = useState(340);
  const [challenges, setChallenges] = useState(CHALLENGES);
  const [trendData, setTrendData] = useState(TREND_DATA);
  const [badges, setBadges] = useState(BADGES);
  const [leaderboard, setLeaderboard] = useState(LEADERBOARD_USERS);

  // Computed state calculations
  const totalEmissions = Object.values(emissions).reduce((a, b) => a + b, 0);
  const treesEquivalent = Math.max(1, Math.floor(totalEmissions / 18.5)); 
  const pointsToNextLevel = 500 - (points % 500);

  const handleUpdateEmissions = (newEmissions) => {
    setEmissions(newEmissions);
    setPoints(prev => {
      const added = prev + 60;
      // Update leaderboard user points
      setLeaderboard(prevLeader => 
        prevLeader.map(user => 
          user.highlighted ? { ...user, points: added } : user
        ).sort((a, b) => b.points - a.points)
         .map((user, idx) => ({ ...user, rank: idx + 1 }))
      );
      return added;
    });
    
    const newTotal = Object.values(newEmissions).reduce((a, b) => a + b, 0);
    setTrendData(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], value: newTotal };
      return updated;
    });
    
    // Check for badge unlock condition
    if (newTotal < 220) {
      setBadges(prev => prev.map(b => b.id === 3 ? { ...b, unlocked: true, unlockedAt: 'Just Now' } : b));
    }
    setActiveTab('dashboard');
  };

  const toggleChallenge = (id) => {
    setChallenges(challenges.map(c => {
      if (c.id === id) {
        if (!c.joined) return { ...c, joined: true };
        if (c.joined && !c.completed) {
          const addedPoints = points + c.points;
          setPoints(addedPoints);
          setLeaderboard(prevLeader => 
            prevLeader.map(user => 
              user.highlighted ? { ...user, points: addedPoints } : user
            ).sort((a, b) => b.points - a.points)
             .map((user, idx) => ({ ...user, rank: idx + 1 }))
          );
          return { ...c, completed: true };
        }
      }
      return c;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {viewMode === 'landing' ? (
        <LandingPage onEnterApp={() => setViewMode('app')} />
      ) : (
        <div className="min-h-screen flex flex-col md:flex-row">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shadow-2xl flex-shrink-0 z-20">
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <button onClick={() => setViewMode('landing')} className="flex items-center gap-3 group">
                <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">EcoTrack</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Console</p>
                </div>
              </button>
              <button 
                onClick={() => setViewMode('landing')}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
              >
                Exit App
              </button>
            </div>
            
            {/* User Level Indicator */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/40">
              <div className="rounded-2xl p-4 bg-slate-800/40 border border-slate-800 relative overflow-hidden">
                <div className="absolute right-[-15px] bottom-[-15px] opacity-10 pointer-events-none transform rotate-12">
                  <Trophy className="w-24 h-24 text-emerald-400" />
                </div>
                <p className="text-xs font-medium text-emerald-400 mb-0.5 tracking-wider uppercase">Active Tier</p>
                <h4 className="font-bold text-lg text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400 fill-yellow-400/20" /> Green Warrior
                </h4>
                <div className="mt-3 w-full bg-slate-900 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((points % 500) / 500) * 100}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-semibold">
                  <span>{points} Total XP</span>
                  <span>{pointsToNextLevel} XP to Next Tier</span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Options */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {[
                { id: 'dashboard', label: 'Emissions Hub', icon: <Home className="w-5 h-5" /> },
                { id: 'calculator', label: 'Carbon Calculator', icon: <Calculator className="w-5 h-5" /> },
                { id: 'goals', label: 'Goals & Badges', icon: <Target className="w-5 h-5" /> },
                { id: 'challenges', label: 'Eco-Challenges', icon: <Trophy className="w-5 h-5" /> },
                { id: 'assistant', label: 'EcoBot AI Assistant', icon: <MessageSquare className="w-5 h-5" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/10' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            
            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center font-medium bg-slate-950/20">
              ⚡ Carbon Footprint Platform
            </div>
          </aside>

          {/* Main Application Container */}
          <main className="flex-1 overflow-y-auto bg-slate-50">
            <div className="max-w-6xl mx-auto p-4 md:p-8">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  emissions={emissions} 
                  totalEmissions={totalEmissions} 
                  treesEquivalent={treesEquivalent} 
                  trendData={trendData}
                  leaderboard={leaderboard}
                />
              )}
              {activeTab === 'calculator' && (
                <CalculatorTab 
                  currentEmissions={emissions} 
                  onCalculate={handleUpdateEmissions} 
                />
              )}
              {activeTab === 'assistant' && <AIAssistant />}
              {activeTab === 'challenges' && (
                <ChallengesTab challenges={challenges} onToggle={toggleChallenge} />
              )}
              {activeTab === 'goals' && (
                <GoalsTab 
                  totalEmissions={totalEmissions} 
                  targetGoal={targetGoal} 
                  setTargetGoal={setTargetGoal}
                  points={points}
                  badges={badges}
                />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

function LandingPage({ onEnterApp }) {
  const [quickMiles, setQuickMiles] = useState(250);
  const [quickElectricity, setQuickElectricity] = useState(350);
  const [quickDiet, setQuickDiet] = useState('mixed');

  const estimateCO2 = () => {
    let dietFactor = 75;
    if (quickDiet === 'vegan') dietFactor = 30;
    if (quickDiet === 'vegetarian') dietFactor = 45;
    if (quickDiet === 'heavy-meat') dietFactor = 110;

    return Math.round((quickMiles * 0.4) + (quickElectricity * 0.38) + dietFactor);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Landing Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">EcoTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-slate-600 font-semibold text-sm">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#calculator" className="hover:text-emerald-600 transition-colors">Quick Estimator</a>
            <a href="#impact" className="hover:text-emerald-600 transition-colors">The Problem</a>
            <a href="#about" className="hover:text-emerald-600 transition-colors">Why EcoTrack</a>
          </div>
          <button 
            onClick={onEnterApp}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Launch Platform <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Header Section */}
      <header className="relative py-20 lg:py-32 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute right-[-10%] top-[-20%] w-[500px] h-[500px] bg-emerald-100 rounded-full filter blur-[120px]"></div>
          <div className="absolute left-[-5%] bottom-[-10%] w-[400px] h-[400px] bg-teal-100 rounded-full filter blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> AI-powered Sustainability Platform
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">
                Measure, Track, and <br/>
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">Reduce Your Carbon</span> Footprint.
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Sustain your lifestyle without guessing. EcoTrack is a smart platform offering comprehensive data calculations, a conversational AI eco-advisor, and engaging gamification challenges to make carbon reduction simple and trackable.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={onEnterApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl transition-all"
                >
                  Create Free Account <ArrowRight className="w-5 h-5 text-emerald-400" />
                </button>
                <a 
                  href="#calculator"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm transition-all"
                >
                  Try Fast Estimator
                </a>
              </div>
            </div>

            {/* Dashboard Mockup Panel */}
            <div className="lg:col-span-5 relative mt-8 lg:mt-0">
              <div className="relative mx-auto max-w-[420px] rounded-3xl bg-slate-900 shadow-2xl border border-slate-800 p-5 overflow-hidden text-white">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Preview: App Console</span>
                </div>
                
                {/* Visual Widgets */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Carbon Savings Streak</p>
                    <div className="flex items-center justify-between mt-1">
                      <h4 className="text-2xl font-black text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500 animate-pulse fill-orange-500/20" /> 18 Days Row
                      </h4>
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">-34.2kg CO₂</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Weekly Energy Breakdown</p>
                    <div className="space-y-2 mt-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                          <span>Home Appliances</span>
                          <span className="font-semibold text-white">65%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5">
                          <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
                          <span>Transportation</span>
                          <span className="font-semibold text-white">25%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5">
                          <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI response box simulator */}
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Bot className="w-4 h-4" /> EcoBot AI Agent:
                    </span>
                    <p className="text-slate-300 italic leading-relaxed">
                      "Unplugging your home workspace routers and screens at night can cut your appliance carbon emissions by up to 12% next month!"
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Quick Estimator Widget (Highly Interactive Feature) */}
      <section id="calculator" className="py-20 bg-slate-100 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-950">Quick Carbon Estimator</h2>
            <p className="text-slate-600 mt-2 font-medium">Estimate your footprint instantly. Interact with the metrics below to view changes.</p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Monthly Travel (Miles)</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" 
                    min="0" 
                    max="1500" 
                    step="50"
                    value={quickMiles} 
                    onChange={(e) => setQuickMiles(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-20 text-center">{quickMiles}m</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Power Consumption (kWh)</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    step="20"
                    value={quickElectricity} 
                    onChange={(e) => setQuickElectricity(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-20 text-center">{quickElectricity}k</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Diet Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'vegan', label: 'Vegan' },
                    { id: 'mixed', label: 'Mixed' },
                    { id: 'heavy-meat', label: 'Heavy Meat' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setQuickDiet(option.id)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        quickDiet === option.id 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-8 rounded-2xl flex flex-col justify-center text-center relative overflow-hidden shadow-inner">
              <div className="absolute right-0 bottom-0 pointer-events-none opacity-5">
                <Leaf className="w-56 h-56" />
              </div>
              <p className="text-slate-400 font-bold uppercase text-xs tracking-wider">Your Estimated Footprint</p>
              <h3 className="text-5xl font-black text-white mt-3 mb-1 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {estimateCO2()} kg
              </h3>
              <p className="text-sm text-slate-300 font-medium">CO₂ emissions per month</p>
              
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-2">
                <p className="text-xs text-slate-400">Equivalent yearly offset requirement:</p>
                <p className="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <TreePine className="w-5 h-5 text-emerald-400" /> {Math.ceil(estimateCO2() * 12 / 18.5)} trees planted
                </p>
              </div>
              
              <button 
                onClick={onEnterApp}
                className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-emerald-600/10"
              >
                Access Full Carbon Auditor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Everything You Need to Track Carbon & Build Habits</h2>
            <p className="text-slate-600 font-medium text-lg leading-relaxed">
              We compile data science metrics into standard emission factor calculations, giving you highly customizable insights to systematically plan lifestyle adjustments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">1. Carbon Auditing</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Input flight frequencies, utility statements, food distributions, and weekly commuting patterns to gauge high-impact sectors accurately.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">2. AI Eco-Advisor</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Chat with our resident AI EcoBot to get step-by-step sustainable suggestions, energy configurations, food substitutes, and green alternatives.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">3. Gamification</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Unlock detailed system levels, compete with friends inside community challenges, and earn green badges as you keep emissions under target values.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Hub / The Problem Section */}
      <section id="impact" className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <span className="text-emerald-400 font-bold uppercase text-xs tracking-widest">The Climate Objective</span>
            <h2 className="text-3xl sm:text-4xl font-black">Understanding Your Footprint</h2>
            <p className="text-slate-400 font-medium">To achieve net-zero targets globally, individuals must understand their direct contribution to resource load profiles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-400 font-bold tracking-wider">EPIDEMIOLOGY OF IMPACT</span>
                <Globe className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-lg font-bold">Global Emissions Goals</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                IPCC reports suggest limiting global warming to 1.5°C requires cutting carbon dioxide emissions by nearly 45% by 2030, reducing average individual footprints from 16 tons to under 2 tons yearly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-400 font-bold tracking-wider">DOMESTIC SECTORS</span>
                <Home className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-lg font-bold">Electricity Loading</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Residential spaces account for roughly 20% of domestic greenhouse gas emissions. Upgrading to energy-efficient LED light configurations and heat pumps makes significant impacts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-400 font-bold tracking-wider">COMMUTING MATRICES</span>
                <Car className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-lg font-bold">Active Transportation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                A single short-distance flight emits more carbon than average families produce globally in several weeks. Opting for train transportation saves up to 80% carbon per passenger-mile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <span className="font-extrabold text-slate-900">EcoTrack</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">© 2026 EcoTrack Systems Inc. All rights reserved. Made for Global Sustainability Actions.</p>
          <div className="flex gap-4">
            <button 
              onClick={onEnterApp}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Start Tracking Now
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Dashboard({ emissions, totalEmissions, treesEquivalent, trendData, leaderboard }) {
  const maxCategory = Math.max(...Object.values(emissions));

  let recommendation = { title: "", text: "", icon: null };
  if (emissions.transport === maxCategory) {
    recommendation = { title: "Reduce Travel Footprint", text: "Transportation is currently your top carbon driver. Try carpooling with work colleagues, arranging grocery clusters, or choosing standard train transit.", icon: <Car className="w-5 h-5 text-blue-500" /> };
  } else if (emissions.electricity === maxCategory) {
    recommendation = { title: "Configure Smart Home Energy", text: "Grid energy drives your highest index. Ensure your laundry loads are fully integrated at cold temperatures, switch off phantom standbys, and program thermostats down 1.5°F.", icon: <Zap className="w-5 h-5 text-yellow-500" /> };
  } else if (emissions.food === maxCategory) {
    recommendation = { title: "Optimize Meal Balance", text: "Food represents your highest category index. Introducing plant-based protein selections on select weekdays lowers raw agriculture impact values.", icon: <Utensils className="w-5 h-5 text-orange-500" /> };
  } else {
    recommendation = { title: "Mindful Consumer Choices", text: "Upcycling and minimizing package volumes are key metrics to explore. Target durable reusable variations over quick-convenience packaging.", icon: <ShoppingBag className="w-5 h-5 text-purple-500" /> };
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Emissions Command Hub</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">Real-time indicators, trend plots, and dynamic leaderboards.</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Profile Connected
          </span>
        </div>
      </header>

      {/* Impact Indicators Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-40 pointer-events-none"></div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Monthly Index</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-slate-900">{totalEmissions}</h3>
            <span className="text-slate-500 font-bold text-sm">kg CO₂</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-bold bg-emerald-50 w-max px-2.5 py-1 rounded-lg">
            <TrendingDown className="w-4 h-4 mr-1" /> 14.1% reduction versus base
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
          <Wind className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Yearly Tree Offset</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-emerald-400">{treesEquivalent}</h3>
            <span className="text-slate-300 font-bold text-sm">Mature Trees</span>
          </div>
          <p className="mt-4 text-xs text-slate-400 font-medium leading-relaxed">
            Your load profiles match the clean-up potential of {treesEquivalent} fully-grown evergreen trees.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Priority Optimization</p>
            <div className="flex items-center gap-2 mt-1 mb-2">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl">{recommendation.icon}</div>
              <h4 className="font-bold text-slate-900 text-sm">{recommendation.title}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {recommendation.text}
            </p>
          </div>
        </div>
      </div>

      {/* Grid detailing graph trends and breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Progress Breakdown Bars */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm lg:col-span-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" /> Sector Demographics
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Transportation', value: emissions.transport, color: 'bg-blue-500', icon: <Car className="w-4 h-4" /> },
              { label: 'Energy Load', value: emissions.electricity, color: 'bg-amber-500', icon: <Zap className="w-4 h-4" /> },
              { label: 'Diet Matrix', value: emissions.food, color: 'bg-orange-500', icon: <Utensils className="w-4 h-4" /> },
              { label: 'Consumer Goods', value: emissions.shopping, color: 'bg-purple-500', icon: <ShoppingBag className="w-4 h-4" /> },
              { label: 'Water Utilities', value: emissions.water, color: 'bg-cyan-500', icon: <Droplets className="w-4 h-4" /> },
            ].sort((a, b) => b.value - a.value).map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-bold">
                    <span className="text-slate-400">{item.icon}</span>
                    {item.label}
                  </div>
                  <div className="text-slate-900 font-extrabold">{item.value} <span className="text-slate-400 font-normal">kg</span></div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`${item.color} h-2 rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${(item.value / maxCategory) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6-Month Plot Widget */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm lg:col-span-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> 6-Month Trend Plot
            </h3>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg uppercase tracking-wider border border-emerald-100">kg CO₂</span>
          </div>

          <div className="flex-1 flex items-end gap-3 h-48 relative border-b border-slate-100 pb-2">
            {/* Horizontal Line Rules */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
              <div className="border-t border-slate-950 w-full"></div>
              <div className="border-t border-slate-950 w-full"></div>
              <div className="border-t border-slate-950 w-full"></div>
              <div className="border-t border-slate-950 w-full"></div>
            </div>

            {trendData.map((data, idx) => {
              const maxVal = Math.max(...trendData.map(d => d.value), 450);
              const heightPercentage = Math.min(100, (data.value / maxVal) * 100);
              const isCurrent = idx === trendData.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative z-10">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-extrabold text-white bg-slate-900 px-2 py-1 rounded-lg absolute -top-10 pointer-events-none z-20 shadow-md">
                    {data.value} kg
                  </div>
                  <div 
                    className={`w-full max-w-[34px] rounded-t-lg transition-all duration-1000 relative ${isCurrent ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.2)]' : 'bg-slate-200 group-hover:bg-slate-300'}`}
                    style={{ height: `${heightPercentage}%` }}
                  ></div>
                  <span className={`text-xs mt-2 font-bold ${isCurrent ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Competitions / Leaderboard */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm lg:col-span-12 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Eco Leaderboard
            </h3>
            <span className="text-xs text-slate-500 font-bold">Community Division 1</span>
          </div>

          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div 
                key={user.rank} 
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  user.highlighted 
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-sm' 
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-black w-6 text-center ${
                    user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-slate-400' : user.rank === 3 ? 'text-orange-400' : 'text-slate-600'
                  }`}>
                    #{user.rank}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {user.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{user.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">{user.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900">{user.points} XP</span>
                  <p className="text-[10px] text-emerald-600 font-bold">Weekly Active</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function CalculatorTab({ currentEmissions, onCalculate }) {
  const [formData, setFormData] = useState({
    carMiles: 250,
    flightHours: 2,
    kwh: 400,
    diet: 'mixed', 
    shopping: 'moderate'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    
    const transportEmissions = Math.round((Number(formData.carMiles) * 0.4) + (Number(formData.flightHours) * 85));
    const electricityEmissions = Math.round(Number(formData.kwh) * 0.38);
    
    let foodEmissions = 60;
    if (formData.diet === 'vegan') foodEmissions = 30;
    if (formData.diet === 'vegetarian') foodEmissions = 45;
    if (formData.diet === 'heavy-meat') foodEmissions = 110;

    let shoppingEmissions = 35;
    if (formData.shopping === 'rare') shoppingEmissions = 15;
    if (formData.shopping === 'frequent') shoppingEmissions = 75;

    onCalculate({
      transport: transportEmissions,
      electricity: electricityEmissions,
      food: foodEmissions,
      shopping: shoppingEmissions,
      water: currentEmissions.water 
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl mb-4 shadow-sm">
          <Calculator className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Eco Audit Estimator</h2>
        <p className="text-slate-500 mt-2 text-sm font-semibold">Fine-tune your indices using verified EPA environmental values.</p>
      </div>

      <form onSubmit={handleCalculate} className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Transportation Group */}
          <section className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Car className="w-5 h-5 text-blue-500" /> Commuting & Flights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Car Travel (Monthly Miles)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    name="carMiles" 
                    min="0"
                    max="2000"
                    step="50"
                    value={formData.carMiles} 
                    onChange={handleChange}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <input 
                    type="number" 
                    name="carMiles" 
                    value={formData.carMiles} 
                    onChange={handleChange}
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-extrabold text-sm text-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Flight Durations (Hours/mo)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    name="flightHours" 
                    min="0"
                    max="40"
                    step="1"
                    value={formData.flightHours} 
                    onChange={handleChange}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <input 
                    type="number" 
                    name="flightHours" 
                    value={formData.flightHours} 
                    onChange={handleChange}
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-extrabold text-sm text-slate-800"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Energy Group */}
          <section className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-5 h-5 text-amber-500" /> Electricity & Utilities
            </h3>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Utility Load (kWh/mo)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  name="kwh" 
                  min="0"
                  max="1500"
                  step="25"
                  value={formData.kwh} 
                  onChange={handleChange}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <input 
                  type="number" 
                  name="kwh" 
                  value={formData.kwh} 
                  onChange={handleChange}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-extrabold text-sm text-slate-800"
                />
              </div>
            </div>
          </section>

          {/* Lifestyle Preferences */}
          <section className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Utensils className="w-5 h-5 text-orange-500" /> Diet & Goods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Primary Dietary Framework</label>
                <select 
                  name="diet" 
                  value={formData.diet} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold text-slate-800 cursor-pointer"
                >
                  <option value="vegan">Vegan (Completely Plant-Based)</option>
                  <option value="vegetarian">Vegetarian (Dairy & Greens)</option>
                  <option value="mixed">Mixed Profile (Balanced Protein)</option>
                  <option value="heavy-meat">Heavy Meat Profile</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Shopping Tendency Index</label>
                <select 
                  name="shopping" 
                  value={formData.shopping} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold text-slate-800 cursor-pointer"
                >
                  <option value="rare">Minimal (Essentials/Organic)</option>
                  <option value="moderate">Average consumer trends</option>
                  <option value="frequent">Frequent purchase behaviors</option>
                </select>
              </div>
            </div>
          </section>

        </div>
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-3">
          <button 
            type="submit"
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center gap-2 text-sm"
          >
            Calculate & Update Profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function AIAssistant() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'model', text: "Hello! I am **EcoBot**, your specialized AI environmental consultant. How can I help you adjust your home power load or travel footprints today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const newMessages = [...messages, { id: Date.now(), role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    const aiResponseText = await generateAIResponse(userText, newMessages);
    
    setMessages(prev => [...prev, { id: Date.now(), role: 'model', text: aiResponseText }]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col animate-in fade-in duration-500 max-w-4xl mx-auto">
      <header className="mb-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Bot className="w-7 h-7 text-emerald-600" /> EcoBot AI Assistant
        </h2>
        <p className="text-slate-500 text-xs font-semibold">Conversational guidance backed by standard EPA coefficients.</p>
      </header>

      <div className="flex-1 bg-white border border-slate-200/60 rounded-3xl shadow-xl flex flex-col overflow-hidden">
        {/* Chat History Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-100 text-emerald-600'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Leaf className="w-5 h-5" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i !== 0 ? 'mt-2' : ''}>
                      {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
                        part.startsWith('**') && part.endsWith('**') 
                          ? <strong key={j} className="font-extrabold">{part.slice(2, -2)}</strong> 
                          : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <Leaf className="w-5 h-5 text-emerald-600 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 rounded-tl-none flex gap-1.5 items-center shadow-sm">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Prompt Suggestions & Inputs */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Explain how a vegan diet changes carbon coefficients."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-slate-700"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all flex items-center justify-center w-12 flex-shrink-0 shadow-lg shadow-emerald-600/5"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {[
              "Best home energy practices?", 
              "Carbon ratio of trains vs cars", 
              "Explain direct offset metrics"
            ].map((suggest, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => setInput(suggest)}
                className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg whitespace-nowrap transition-colors border border-emerald-100 font-bold"
              >
                {suggest}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengesTab({ challenges, onToggle }) {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" /> Active Challenges
          </h2>
          <p className="text-slate-500 mt-1 font-semibold text-sm">Join climate operations and claim your rank XP rewards.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map(challenge => (
          <div 
            key={challenge.id} 
            className={`rounded-3xl border p-6 transition-all ${
              challenge.completed 
                ? 'bg-slate-50 border-slate-200/60 opacity-80' 
                : challenge.joined 
                  ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/50' 
                  : 'bg-white border-slate-200/60 hover:border-emerald-200 hover:shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${challenge.completed ? 'bg-slate-200 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                {challenge.icon}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-bold">{challenge.participants.toLocaleString()} active</span>
                <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs">
                  +{challenge.points} XP
                </span>
              </div>
            </div>
            
            <h3 className={`text-lg font-bold mb-1.5 ${challenge.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {challenge.title}
            </h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6 min-h-[36px]">
              {challenge.description}
            </p>

            <button 
              onClick={() => onToggle(challenge.id)}
              disabled={challenge.completed}
              className={`w-full py-3 rounded-xl font-extrabold text-sm flex justify-center items-center gap-2 transition-colors ${
                challenge.completed 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : challenge.joined
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              {challenge.completed ? (
                <><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Goal Completed</>
              ) : challenge.joined ? (
                <><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Claim Completion</>
              ) : (
                'Accept Operation'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsTab({ totalEmissions, targetGoal, setTargetGoal, points, badges }) {
  const [newGoal, setNewGoal] = useState(targetGoal);

  const handleSaveGoal = () => {
    setTargetGoal(Number(newGoal));
  };

  const levels = [
    { name: 'Eco Beginner', min: 0, icon: <Leaf className="w-6 h-6" /> },
    { name: 'Green Warrior', min: 300, icon: <Trophy className="w-6 h-6" /> },
    { name: 'Climate Champion', min: 600, icon: <TreePine className="w-6 h-6" /> },
  ];

  const currentLevelIdx = levels.reduce((acc, lvl, idx) => points >= lvl.min ? idx : acc, 0);
  const currentLevel = levels[currentLevelIdx];
  const nextLevel = levels[currentLevelIdx + 1];
  
  const currentLevelXPBasis = points - currentLevel.min;
  const nextLevelXPDifference = nextLevel ? nextLevel.min - currentLevel.min : 100;
  const progressPercent = nextLevel 
    ? (currentLevelXPBasis / nextLevelXPDifference) * 100 
    : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
          <Target className="w-7 h-7 text-red-500" /> Platform Progression
        </h2>
        <p className="text-slate-500 mt-1 font-semibold text-sm">Fine-tune targets, review locked badges, and evaluate your status.</p>
      </header>

      {/* Leveling Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-5 transform rotate-45">
          <Wind className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center flex-shrink-0">
            {React.cloneElement(currentLevel.icon, { className: "w-10 h-10 text-emerald-400" })}
          </div>
          
          <div className="flex-1 w-full space-y-2 text-center md:text-left">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Demographic Rank</span>
            <h3 className="text-2xl font-black leading-none">{currentLevel.name}</h3>
            
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
              <span>{points} XP Logged</span>
              <span>
                {nextLevel ? `Goal: ${nextLevel.name} at ${nextLevel.min} XP` : 'Maximum Tier Achieved'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Goal Customization Panel */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Configure Monthly Targets</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Target Threshold (kg CO₂)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-base font-extrabold text-slate-800"
                />
                <button 
                  onClick={handleSaveGoal}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all shadow-sm text-sm"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-semibold">
              🎯 Carbon targets below 250 kg place you well below international averages, driving sustainable resource preservation.
            </div>
          </div>
        </div>

        {/* Long term projection */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between text-center items-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-inner">
            <TreePine className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">Visualized Projection</h3>
            <p className="text-slate-500 text-xs font-semibold max-w-xs leading-relaxed">
              Maintaining {targetGoal} kg monthly yields {(380 - targetGoal) * 12} kg of annual greenhouse savings relative to typical grids.
            </p>
          </div>
          <div className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 mt-4">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Evergreen Equivalent Offset</p>
            <p className="text-3xl font-black text-emerald-700 mt-1">{Math.max(1, Math.floor(((400 - targetGoal) * 12) / 18.5))} Trees</p>
          </div>
        </div>

      </div>

      {/* Badge Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" /> Milestone Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                badge.unlocked 
                  ? 'bg-white border-slate-200 shadow-sm hover:scale-[1.02]' 
                  : 'bg-slate-50 border-slate-100 opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${badge.unlocked ? 'bg-slate-50 border border-slate-100' : 'bg-slate-200/50 text-slate-400'}`}>
                {badge.icon}
              </div>
              <h4 className={`font-bold text-xs ${badge.unlocked ? 'text-slate-900' : 'text-slate-400'}`}>{badge.name}</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed min-h-[30px]">{badge.desc}</p>
              {badge.unlocked ? (
                <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  {badge.unlockedAt || 'Unlocked'}
                </span>
              ) : (
                <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                  Locked
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
