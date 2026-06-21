import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, Home, Calculator, MessageSquare, Target, Trophy, 
  Car, Zap, Utensils, ShoppingBag, Droplets, ArrowRight,
  Send, Bot, User, AlertCircle, CheckCircle2, TrendingDown,
  TreePine, Wind, BarChart3, Medal, Calendar, Award
} from 'lucide-react';

// --- Gemini API Configuration ---
const apiKey = ""; // API key is injected by the environment

const generateAIResponse = async (prompt, chatHistory) => {
  const systemInstruction = "You are EcoBot, a helpful, encouraging, and knowledgeable AI Sustainability Assistant within a Carbon Footprint tracking app. Your goal is to help users reduce their carbon footprint, answer questions about sustainability, suggest eco-friendly alternatives, and motivate them to achieve their climate goals. Keep answers concise, actionable, and friendly.";
  
  // Format history for context if needed (simplified for this preview)
  const userQuery = chatHistory.length > 0 
    ? `Context of conversation: ${chatHistory.map(m => `${m.role}: ${m.text}`).join(' | ')}. \n\nUser's new message: ${prompt}`
    : prompt;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  let retries = 5;
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
        return "I'm having trouble connecting to my knowledge base right now. Please try again later.";
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// --- Mock Data & Initial State ---
const INITIAL_EMISSIONS = {
  transport: 120, // kg CO2
  electricity: 85,
  food: 60,
  shopping: 35,
  water: 10
};

const TREND_DATA = [
  { month: 'Jan', value: 340 },
  { month: 'Feb', value: 320 },
  { month: 'Mar', value: 310 },
  { month: 'Apr', value: 280 },
  { month: 'May', value: 290 },
  { month: 'Jun', value: 210 },
];

const BADGES = [
  { id: 1, name: 'First Step', desc: 'Calculated footprint for the first time.', icon: <Target className="w-5 h-5 text-blue-500" />, unlocked: true },
  { id: 2, name: 'Challenger', desc: 'Joined a community challenge.', icon: <Trophy className="w-5 h-5 text-yellow-500" />, unlocked: true },
  { id: 3, name: 'Tree Hugger', desc: 'Reduced footprint under 200kg.', icon: <TreePine className="w-5 h-5 text-emerald-500" />, unlocked: false },
  { id: 4, name: 'Consistency', desc: 'Logged data 3 months in a row.', icon: <Calendar className="w-5 h-5 text-purple-500" />, unlocked: false },
];

const CHALLENGES = [
  { id: 1, title: 'No-Car Day', description: 'Use public transport or cycle for a full day.', points: 50, icon: <Car className="w-6 h-6" />, joined: true, completed: false },
  { id: 2, title: 'Energy Saving Week', description: 'Reduce electricity usage by 15% this week.', points: 100, icon: <Zap className="w-6 h-6" />, joined: false, completed: false },
  { id: 3, title: 'Meatless Monday', description: 'Eat only plant-based meals for one day.', points: 30, icon: <Utensils className="w-6 h-6" />, joined: false, completed: false },
  { id: 4, title: 'Plastic-Free Challenge', description: 'Avoid single-use plastics for 3 days.', points: 75, icon: <ShoppingBag className="w-6 h-6" />, joined: true, completed: true },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [emissions, setEmissions] = useState(INITIAL_EMISSIONS);
  const [targetGoal, setTargetGoal] = useState(250);
  const [points, setPoints] = useState(340);
  const [challenges, setChallenges] = useState(CHALLENGES);
  const [trendData, setTrendData] = useState(TREND_DATA);
  const [badges, setBadges] = useState(BADGES);
  
  // App State Helpers
  const totalEmissions = Object.values(emissions).reduce((a, b) => a + b, 0);
  const progressToGoal = Math.max(0, Math.min(100, ((targetGoal - totalEmissions) / targetGoal) * 100 + 100)); // Simplified logic
  const treesEquivalent = Math.floor(totalEmissions / 21); // Approx 21kg CO2 absorbed by a tree per year

  // Navigation Links
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'calculator', label: 'Calculator', icon: <Calculator className="w-5 h-5" /> },
    { id: 'goals', label: 'Goals & Impact', icon: <Target className="w-5 h-5" /> },
    { id: 'challenges', label: 'Challenges', icon: <Trophy className="w-5 h-5" /> },
    { id: 'assistant', label: 'AI Assistant', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const handleUpdateEmissions = (newEmissions) => {
    setEmissions(newEmissions);
    setPoints(prev => prev + 50); // Reward for calculating
    
    // Update current month trend dynamically
    const newTotal = Object.values(newEmissions).reduce((a, b) => a + b, 0);
    setTrendData(prev => {
      const newData = [...prev];
      newData[newData.length - 1] = { ...newData[newData.length - 1], value: newTotal };
      return newData;
    });
    
    // Unlock badge if emissions drop below 200
    if (newTotal < 200) {
      setBadges(prev => prev.map(b => b.id === 3 ? { ...b, unlocked: true } : b));
    }

    setActiveTab('dashboard');
  };

  const toggleChallenge = (id) => {
    setChallenges(challenges.map(c => {
      if (c.id === id) {
        if (!c.joined) return { ...c, joined: true };
        if (c.joined && !c.completed) {
          setPoints(p => p + c.points);
          return { ...c, completed: true };
        }
      }
      return c;
    }));
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-emerald-900 text-white flex flex-col shadow-xl flex-shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">EcoTrack</h1>
        </div>
        
        <div className="px-6 pb-6">
          <div className="bg-emerald-800/50 rounded-xl p-4 text-sm border border-emerald-700/50">
            <p className="text-emerald-200 mb-1">Current Level</p>
            <p className="font-bold text-lg flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Green Warrior
            </p>
            <div className="mt-2 w-full bg-emerald-950 rounded-full h-2">
              <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${(points % 500) / 5}%` }}></div>
            </div>
            <p className="text-xs text-emerald-300 mt-2 text-right">{points} / 500 XP</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                activeTab === item.id 
                  ? 'bg-emerald-500 text-white font-medium shadow-md' 
                  : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-emerald-800 text-xs text-emerald-400 text-center">
          EcoTrack Prototype v1.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-stone-50">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              emissions={emissions} 
              totalEmissions={totalEmissions} 
              treesEquivalent={treesEquivalent} 
              trendData={trendData}
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
  );
}

// --- Dashboard Component ---
function Dashboard({ emissions, totalEmissions, treesEquivalent, trendData }) {
  const maxCategory = Math.max(...Object.values(emissions));

  // Determine top recommendation based on highest emission
  let recommendation = { title: "", text: "", icon: null };
  if (emissions.transport === maxCategory) {
    recommendation = { title: "Reduce Travel Emissions", text: "Transportation is your highest contributor. Try carpooling, taking public transit twice a week, or using a bicycle for trips under 3 miles.", icon: <Car className="w-5 h-5 text-blue-500" /> };
  } else if (emissions.electricity === maxCategory) {
    recommendation = { title: "Optimize Home Energy", text: "Electricity is your highest contributor. Switch to LED bulbs, unplug phantom loads, and adjust your thermostat by 2 degrees.", icon: <Zap className="w-5 h-5 text-yellow-500" /> };
  } else if (emissions.food === maxCategory) {
    recommendation = { title: "Adjust Dietary Habits", text: "Food is your highest contributor. Consider incorporating 2-3 plant-based days into your week to significantly lower your footprint.", icon: <Utensils className="w-5 h-5 text-orange-500" /> };
  } else {
    recommendation = { title: "Mindful Consumption", text: "Look into buying second-hand goods or reducing single-use packaging to lower your shopping emissions.", icon: <ShoppingBag className="w-5 h-5 text-purple-500" /> };
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-stone-800">Welcome back, Eco Warrior!</h2>
        <p className="text-stone-500 mt-1">Here is a summary of your environmental impact this month.</p>
      </header>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 pointer-events-none"></div>
          <p className="text-stone-500 text-sm font-medium mb-1">Total Monthly Emissions</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-stone-800">{totalEmissions}</h3>
            <span className="text-stone-500 font-medium">kg CO₂</span>
          </div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium bg-emerald-50 w-max px-2 py-1 rounded-md">
            <TrendingDown className="w-4 h-4 mr-1" /> 12% lower than last month
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <Wind className="absolute -right-2 -bottom-2 w-32 h-32 text-white/10 pointer-events-none" />
          <p className="text-emerald-50 text-sm font-medium mb-1">Impact Equivalent</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black">{treesEquivalent}</h3>
            <span className="text-emerald-100 font-medium">Trees Planted</span>
          </div>
          <p className="mt-4 text-sm text-emerald-100">
            Your footprint is equivalent to the CO₂ absorbed by {treesEquivalent} mature trees in a year.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <p className="text-stone-500 text-sm font-medium mb-1">Smart Recommendation</p>
          <div className="flex items-center gap-2 mt-2 mb-2">
            <div className="p-2 bg-stone-100 rounded-lg">{recommendation.icon}</div>
            <h4 className="font-bold text-stone-800">{recommendation.title}</h4>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            {recommendation.text}
          </p>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-bold text-stone-800 mb-6">Emissions Breakdown</h3>
          <div className="space-y-5">
            {[
              { label: 'Transportation', value: emissions.transport, color: 'bg-blue-500', icon: <Car className="w-4 h-4" /> },
              { label: 'Electricity', value: emissions.electricity, color: 'bg-yellow-500', icon: <Zap className="w-4 h-4" /> },
              { label: 'Food & Diet', value: emissions.food, color: 'bg-orange-500', icon: <Utensils className="w-4 h-4" /> },
              { label: 'Shopping', value: emissions.shopping, color: 'bg-purple-500', icon: <ShoppingBag className="w-4 h-4" /> },
              { label: 'Water Usage', value: emissions.water, color: 'bg-cyan-500', icon: <Droplets className="w-4 h-4" /> },
            ].sort((a, b) => b.value - a.value).map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2 text-stone-700 font-medium">
                    <span className="text-stone-400">{item.icon}</span>
                    {item.label}
                  </div>
                  <div className="text-stone-900 font-bold">{item.value} <span className="text-xs text-stone-400 font-normal">kg</span></div>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`${item.color} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${(item.value / maxCategory) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" /> 6-Month Trend
            </h3>
            <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">kg CO₂ / mo</span>
          </div>
          
          <div className="flex-1 flex items-end gap-2 sm:gap-4 h-48 mt-auto pt-4 border-b border-stone-100 relative">
            {/* Y-axis lines mock */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="border-t border-stone-800 w-full"></div>
              <div className="border-t border-stone-800 w-full"></div>
              <div className="border-t border-stone-800 w-full"></div>
              <div className="border-t border-stone-800 w-full"></div>
            </div>

            {trendData.map((data, idx) => {
              const maxVal = Math.max(...trendData.map(d => d.value), 400); // Dynamic scale
              const heightPct = Math.min(100, (data.value / maxVal) * 100);
              const isCurrent = idx === trendData.length - 1;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group z-10 relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-emerald-700 bg-white border border-emerald-100 shadow-sm px-2 py-1 rounded-md absolute -top-8 pointer-events-none z-20">
                    {data.value} kg
                  </div>
                  <div 
                    className={`w-full max-w-[40px] rounded-t-md transition-all duration-1000 relative ${isCurrent ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-stone-200 hover:bg-stone-300'}`}
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <span className={`text-xs mt-2 ${isCurrent ? 'font-bold text-emerald-700' : 'text-stone-400'}`}>
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-stone-900 rounded-2xl p-6 shadow-sm text-white relative overflow-hidden flex flex-col justify-center lg:col-span-2">
          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
          <h3 className="text-xl font-bold mb-2 relative z-10">Monthly Goal Tracker</h3>
          <p className="text-stone-400 text-sm mb-8 relative z-10">Keep your emissions under 250 kg this month to earn the 'Climate Champion' badge.</p>
          
          <div className="relative z-10">
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-emerald-400">Current: {totalEmissions} kg</span>
              <span className="text-stone-400">Goal: 250 kg</span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-4 p-1">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${totalEmissions > 250 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (totalEmissions / 300) * 100)}%` }}
              ></div>
            </div>
            {totalEmissions > 250 ? (
              <p className="text-red-400 text-sm mt-4 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> You've exceeded your monthly goal.
              </p>
            ) : (
              <p className="text-emerald-400 text-sm mt-4 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> You're on track! Keep it up.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Calculator Component ---
function CalculatorTab({ currentEmissions, onCalculate }) {
  const [formData, setFormData] = useState({
    carMiles: 150,
    flightHours: 0,
    kwh: 300,
    diet: 'mixed', // vegan, vegetarian, mixed, heavy-meat
    shopping: 'moderate' // rare, moderate, frequent
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    // Simplified estimation logic based on standard factors
    const transportEmissions = Math.round((formData.carMiles * 0.4) + (formData.flightHours * 90));
    const electricityEmissions = Math.round(formData.kwh * 0.38);
    
    let foodEmissions = 60;
    if (formData.diet === 'vegan') foodEmissions = 30;
    if (formData.diet === 'vegetarian') foodEmissions = 45;
    if (formData.diet === 'heavy-meat') foodEmissions = 100;

    let shoppingEmissions = 35;
    if (formData.shopping === 'rare') shoppingEmissions = 15;
    if (formData.shopping === 'frequent') shoppingEmissions = 70;

    onCalculate({
      transport: transportEmissions,
      electricity: electricityEmissions,
      food: foodEmissions,
      shopping: shoppingEmissions,
      water: currentEmissions.water // Kept static for prototype
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
          <Calculator className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-stone-800">Carbon Footprint Calculator</h2>
        <p className="text-stone-500 mt-2">Update your monthly activities to see your environmental impact.</p>
      </div>

      <form onSubmit={handleCalculate} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Transport */}
          <section>
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4 border-b border-stone-100 pb-2">
              <Car className="w-5 h-5 text-blue-500" /> Transportation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Miles Driven (Monthly)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    name="carMiles" 
                    min="0"
                    max="2000"
                    step="10"
                    value={formData.carMiles} 
                    onChange={handleChange}
                    className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <input 
                    type="number" 
                    name="carMiles" 
                    value={formData.carMiles} 
                    onChange={handleChange}
                    className="w-20 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Flight Hours (Monthly)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    name="flightHours" 
                    min="0"
                    max="50"
                    step="1"
                    value={formData.flightHours} 
                    onChange={handleChange}
                    className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <input 
                    type="number" 
                    name="flightHours" 
                    value={formData.flightHours} 
                    onChange={handleChange}
                    className="w-20 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Energy */}
          <section>
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4 border-b border-stone-100 pb-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Home Energy
            </h3>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Electricity Usage (kWh/Month)</label>
              <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    name="kwh" 
                    min="0"
                    max="2000"
                    step="10"
                    value={formData.kwh} 
                    onChange={handleChange}
                    className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <input 
                    type="number" 
                    name="kwh" 
                    value={formData.kwh} 
                    onChange={handleChange}
                    className="w-24 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                  />
              </div>
            </div>
          </section>

          {/* Lifestyle */}
          <section>
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-4 border-b border-stone-100 pb-2">
              <Utensils className="w-5 h-5 text-orange-500" /> Lifestyle & Diet
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Diet Type</label>
                <select 
                  name="diet" 
                  value={formData.diet} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="vegan">Vegan</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="mixed">Mixed (Average Meat)</option>
                  <option value="heavy-meat">Heavy Meat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Shopping Habits</label>
                <select 
                  name="shopping" 
                  value={formData.shopping} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="rare">Minimal (Essentials Only)</option>
                  <option value="moderate">Moderate (Average)</option>
                  <option value="frequent">Frequent</option>
                </select>
              </div>
            </div>
          </section>

        </div>
        <div className="bg-stone-50 p-6 border-t border-stone-200 flex justify-end">
          <button 
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            Calculate & Update Profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

// --- AI Assistant Component ---
function AIAssistant() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'model', text: "Hi! I'm EcoBot, your personal sustainability assistant. How can I help you reduce your carbon footprint today?" }
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
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500 max-w-4xl mx-auto">
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <Bot className="w-8 h-8 text-emerald-600" /> AI Sustainability Assistant
        </h2>
        <p className="text-stone-500 text-sm">Powered by Gemini. Ask me about eco-friendly alternatives!</p>
      </header>

      <div className="flex-1 bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Leaf className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-stone-50 border border-stone-100 text-stone-800 rounded-tl-none'
                }`}>
                  {/* Basic markdown-like rendering for bold text */}
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i !== 0 ? 'mt-2' : ''}>
                      {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
                        part.startsWith('**') && part.endsWith('**') 
                          ? <strong key={j} className="font-bold">{part.slice(2, -2)}</strong> 
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
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-emerald-600 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 rounded-tl-none flex gap-1 items-center">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-stone-100">
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., Is cycling actually better than taking an electric bus?"
              className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center w-12 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar">
            {["How to reduce food emissions?", "Eco-friendly lighting options", "Calculate train vs plane"].map((suggestion, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => setInput(suggestion)}
                className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full whitespace-nowrap transition-colors border border-emerald-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Challenges Component ---
function ChallengesTab({ challenges, onToggle }) {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" /> Community Challenges
          </h2>
          <p className="text-stone-500 mt-2">Participate in challenges, earn Green Points, and level up!</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map(challenge => (
          <div 
            key={challenge.id} 
            className={`rounded-2xl border p-6 transition-all ${
              challenge.completed 
                ? 'bg-stone-50 border-stone-200 opacity-75' 
                : challenge.joined 
                  ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500' 
                  : 'bg-white border-stone-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${challenge.completed ? 'bg-stone-200 text-stone-500' : 'bg-emerald-100 text-emerald-600'}`}>
                {challenge.icon}
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full text-sm">
                  +{challenge.points} XP
                </span>
              </div>
            </div>
            
            <h3 className={`text-xl font-bold mb-2 ${challenge.completed ? 'text-stone-500 line-through' : 'text-stone-800'}`}>
              {challenge.title}
            </h3>
            <p className="text-stone-600 text-sm mb-6 min-h-[40px]">
              {challenge.description}
            </p>

            <button 
              onClick={() => onToggle(challenge.id)}
              disabled={challenge.completed}
              className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors ${
                challenge.completed 
                  ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  : challenge.joined
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
              }`}
            >
              {challenge.completed ? (
                <><CheckCircle2 className="w-5 h-5" /> Completed</>
              ) : challenge.joined ? (
                <><CheckCircle2 className="w-5 h-5" /> Mark as Done</>
              ) : (
                'Join Challenge'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Goals & Impact Component ---
function GoalsTab({ totalEmissions, targetGoal, setTargetGoal, points, badges }) {
  const [newGoal, setNewGoal] = useState(targetGoal);

  const handleSaveGoal = () => {
    setTargetGoal(Number(newGoal));
  };

  const levels = [
    { name: 'Eco Beginner', min: 0, icon: <Leaf className="w-6 h-6" /> },
    { name: 'Green Warrior', min: 200, icon: <Trophy className="w-6 h-6" /> },
    { name: 'Climate Champion', min: 500, icon: <TreePine className="w-6 h-6" /> },
  ];

  const currentLevelIndex = levels.reduce((acc, level, idx) => points >= level.min ? idx : acc, 0);
  const currentLevel = levels[currentLevelIndex];
  const nextLevel = levels[currentLevelIndex + 1];
  
  const progressToNext = nextLevel 
    ? ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 
    : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
          <Target className="w-8 h-8 text-red-500" /> Goals & Progression
        </h2>
        <p className="text-stone-500 mt-2">Set targets and visualize your long-term environmental impact.</p>
      </header>

      {/* Gamification Status */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <Wind className="absolute right-0 top-0 w-64 h-64 text-white/5 pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center border-4 border-emerald-400 flex-shrink-0 relative">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin-slow"></div>
            {React.cloneElement(currentLevel.icon, { className: "w-12 h-12 text-yellow-400" })}
          </div>
          
          <div className="flex-1 w-full text-center md:text-left">
            <p className="text-emerald-300 font-medium tracking-wide uppercase text-sm mb-1">Current Status</p>
            <h3 className="text-3xl font-black mb-4">{currentLevel.name}</h3>
            
            <div className="w-full bg-black/30 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-yellow-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressToNext}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm font-medium">
              <span className="text-emerald-100">{points} XP</span>
              <span className="text-stone-400">
                {nextLevel ? `Next: ${nextLevel.name} (${nextLevel.min} XP)` : 'Max Level Reached!'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goal Setting */}
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-xl font-bold text-stone-800 mb-6">Set Monthly Target</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Target Carbon Footprint (kg CO₂)</label>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg font-bold"
                />
                <button 
                  onClick={handleSaveGoal}
                  className="px-6 py-3 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-sm text-emerald-800">
                <strong>Tip:</strong> The global average footprint is around 350 kg/month per person. A sustainable target is below 200 kg/month.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Impact */}
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <TreePine className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-stone-800 mb-2">Long-Term Impact</h3>
          <p className="text-stone-600 text-sm mb-6">
            If you maintain your goal of {targetGoal} kg/month for a year, you will save roughly {(400 - targetGoal) * 12} kg of CO₂ compared to the average person.
          </p>
          <div className="w-full p-4 bg-stone-50 rounded-xl border border-stone-100">
            <p className="font-bold text-stone-800 text-lg mb-1">Equivalent to planting</p>
            <p className="text-3xl font-black text-emerald-600">{Math.max(0, Math.floor(((400 - targetGoal) * 12) / 21))} trees</p>
          </div>
        </div>
      </div>

      {/* Achievements / Badges Section */}
      <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm mt-6">
        <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-purple-500" /> Your Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                badge.unlocked 
                  ? 'bg-gradient-to-b from-white to-purple-50/30 border-purple-200 shadow-sm hover:-translate-y-1 hover:shadow-md cursor-default' 
                  : 'bg-stone-50 border-stone-100 opacity-60 grayscale'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${badge.unlocked ? 'bg-purple-100' : 'bg-stone-200'}`}>
                {badge.icon}
              </div>
              <h4 className={`font-bold text-sm ${badge.unlocked ? 'text-stone-800' : 'text-stone-500'}`}>{badge.name}</h4>
              <p className="text-xs text-stone-500 mt-1">{badge.desc}</p>
              {badge.unlocked && (
                <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                  Unlocked
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}