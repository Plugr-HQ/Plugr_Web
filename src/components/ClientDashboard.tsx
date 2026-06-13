import React, { useState, useEffect } from 'react';
import { 
  Search, Sliders, ShieldCheck, MapPin, Star, Briefcase, Phone, 
  ChevronRight, ArrowLeft, Send, CheckCircle2, Clock, ThumbsUp, Wallet, X,
  BadgeAlert, Sparkles, MessageSquare, Loader2
} from 'lucide-react';
import { PlugProfile, Booking, ChatMessage } from '../types';
import { MOCK_PLUGS } from '../data';

interface ClientDashboardProps {
  clientName: string;
  clientCity: string;
  clientPhone: string;
  avatarUrl?: string;
  onLogout: () => void;
}

export default function ClientDashboard({ clientName, clientCity, clientPhone, avatarUrl, onLogout }: ClientDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<'all' | 'electrician' | 'plumber'>('all');
  const [selectedCity, setSelectedCity] = useState(clientCity || 'Lagos');
  const [plugsList, setPlugsList] = useState<PlugProfile[]>(MOCK_PLUGS);
  
  // Selected plug for detailed portfolio modal
  const [viewingPlug, setViewingPlug] = useState<PlugProfile | null>(null);
  
  // Booking workspace
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [jobPrice, setJobPrice] = useState(15000);
  
  // Active tracking stage
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [trackingStage, setTrackingStage] = useState<'requesting' | 'accepted' | 'progress' | 'completed' | null>(null);
  const [trackingSeconds, setTrackingSeconds] = useState(0);
  
  // Simulated Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState('');
  const [typing, setTyping] = useState(false);

  // Filter Plugs based on search, trade and city
  useEffect(() => {
    let filtered = MOCK_PLUGS;
    
    if (selectedTrade !== 'all') {
      filtered = filtered.filter(p => p.trade === selectedTrade);
    }
    
    if (selectedCity) {
      filtered = filtered.filter(p => p.city.toLowerCase() === selectedCity.toLowerCase());
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.firstName.toLowerCase().includes(query) || 
        p.lastName.toLowerCase().includes(query) ||
        p.trade.toLowerCase().includes(query)
      );
    }
    
    setPlugsList(filtered);
  }, [searchQuery, selectedTrade, selectedCity]);

  // Handle tracking state cycles for simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (trackingStage === 'requesting') {
      timer = setTimeout(() => {
        setTrackingStage('accepted');
        // Add introductory message from the Plug
        const nameOfPlug = viewingPlug ? `${viewingPlug.firstName}` : "Your Plug";
        const tradeOfPlug = viewingPlug ? viewingPlug.trade : "technician";
        
        setChatMessages([
          {
            id: '1',
            sender: 'other',
            text: `Hi ${clientName.split(' ')[0]}! I just accepted your request for the ${tradeOfPlug} service in ${jobAddress || clientCity}. I'm getting my tools ready and will head your way shortly.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 4000);
    } else if (trackingStage === 'accepted') {
      timer = setTimeout(() => {
        setTrackingStage('progress');
        // Add update message from the Plug
        if (viewingPlug) {
          setChatMessages(prev => [
            ...prev,
            {
              id: String(prev.length + 1),
              sender: 'other',
              text: `En route now! Traffic is light, I'll be there in about 15 minutes. See you soon.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [trackingStage]);

  // Handle automated replies inside dynamic live tracking Chat UI
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMessage.trim() || !viewingPlug) return;

    const userMsg: ChatMessage = {
      id: String(chatMessages.length + 1),
      sender: 'user',
      text: pendingMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const messageText = pendingMessage.toLowerCase();
    setPendingMessage('');
    setTyping(true);

    // Simulate response delay
    setTimeout(() => {
      setTyping(false);
      let replyText = `Thanks for letting me know. I've noted that!`;
      
      if (messageText.includes('price') || messageText.includes('charge') || messageText.includes('pay')) {
        replyText = `Understood. The quoted ₦${jobPrice.toLocaleString()} rate covers the diagnostics and initial work. I will give you a full breakdown of any spare parts needed on site.`;
      } else if (messageText.includes('time') || messageText.includes('where') || messageText.includes('far')) {
        replyText = `Just navigating with map directions. I am on track and should reach your address in just a few minutes.`;
      } else if (messageText.includes('ok') || messageText.includes('fine') || messageText.includes('cool')) {
        replyText = `Awesome! See you in a bit.`;
      } else if (viewingPlug.trade === 'electrician') {
        replyText = `No problem. Please keep the main distribution box or switchboard easily accessible so I can inspect the lines quickly upon arrival.`;
      } else if (viewingPlug.trade === 'plumber') {
        replyText = `Got it. If you can locate the main water shut-off valve, turning it off now will help prevent further leak damage.`;
      }

      const otherMsg: ChatMessage = {
        id: String(chatMessages.length + 2),
        sender: 'other',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, otherMsg]);
    }, 2000);
  };

  const handleCreateBooking = () => {
    if (!viewingPlug) return;
    
    const block: Booking = {
      id: `B-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: clientName,
      clientPhone: clientPhone,
      trade: viewingPlug.trade,
      description: jobDescription || `General repair for ${viewingPlug.trade} issues.`,
      status: 'pending',
      location: jobAddress || clientCity,
      price: jobPrice,
      createdAt: 'Just now'
    };

    setActiveBooking(block);
    setBookingModalOpen(false);
    setTrackingStage('requesting');
  };

  const handleFinishJob = () => {
    setTrackingStage(null);
    setActiveBooking(null);
    setViewingPlug(null);
    setJobDescription('');
    setJobAddress('');
    alert(`Success: Job completed and verified. ₦${jobPrice.toLocaleString()} released from Escrow to ${viewingPlug?.firstName}!`);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-[#F6F5F0]" id="client-dashboard-frame">
      {/* Top Client Header Banner */}
      <header className="p-4 pt-5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={clientName} 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-[#EB9E27]/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#EB9E27]/10 flex items-center justify-center font-display font-semibold text-[#EB9E27]">
                {clientName[0]}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#181C25] text-sm leading-tight">{clientName}</h3>
            <span className="text-slate-400 font-mono text-[10px] tracking-wide flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0 text-[#EB9E27]" /> {selectedCity}
            </span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="text-xs font-mono font-medium tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition"
        >
          Logout
        </button>
      </header>

      {/* Main Interactive Layout Area */}
      <main className="flex-1 p-4 pb-12 overflow-y-auto custom-scrollbar">
        {trackingStage ? (
          /* Live simulated tracking status interface */
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#EB9E27]/20 flex flex-col gap-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#EB9E27]">
                  Escrow Secure Match
                </span>
                <h2 className="font-display font-semibold text-lg text-slate-800">
                  {trackingStage === 'requesting' ? 'Pairing your Plug...' : 'Plug En Route'}
                </h2>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-100 font-mono text-xs text-amber-800 font-medium">
                <Wallet className="h-3.5 w-3.5 text-[#EB9E27]" /> ₦{jobPrice.toLocaleString()}
              </div>
            </div>

            {/* Standard tracker steps view */}
            <div className="relative pl-6 flex flex-col gap-6 font-sans">
              {/* Tracker connector line */}
              <div className="absolute left-2.5 top-1.5 w-0.5 h-[80%] bg-slate-100 z-0">
                <div 
                  className="w-full bg-[#EB9E27] transition-all duration-1000"
                  style={{
                    height: trackingStage === 'requesting' ? '0%' 
                          : trackingStage === 'accepted' ? '40%' 
                          : trackingStage === 'progress' ? '75%' 
                          : '100%'
                  }}
                />
              </div>

              {/* Step 1: Matching */}
              <div className="relative z-10 flex gap-3 text-xs">
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border ${
                  trackingStage === 'requesting' ? 'bg-amber-100 border-[#EB9E27] text-[#EB9E27] animate-pulse' : 'bg-emerald-500 border-emerald-500 text-white'
                }`}>
                  {trackingStage === 'requesting' ? <Clock className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">1. Searching NIMC-Verified Plugs</h4>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    {trackingStage === 'requesting' 
                      ? "Pinging nearby plumbers/electricians with high liveness ratings..." 
                      : "Succeeded in identifying a 100% verified provider."}
                  </p>
                </div>
              </div>

              {/* Step 2: Accepted */}
              <div className="relative z-10 flex gap-3 text-xs">
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border ${
                  trackingStage === 'requesting' ? 'bg-[#F6F5F0] border-slate-200 text-slate-400'
                  : trackingStage === 'accepted' ? 'bg-amber-100 border-[#EB9E27] text-[#EB9E27] animate-pulse'
                  : 'bg-emerald-500 border-emerald-500 text-white'
                }`}>
                  <Sliders className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">2. Verification Validation Checked</h4>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    {trackingStage === 'requesting' ? 'Pending check...' 
                     : `Accepted! ${viewingPlug?.firstName} ${viewingPlug?.lastName} verified their background via NIN.`}
                  </p>
                </div>
              </div>

              {/* Step 3: Transit */}
              <div className="relative z-10 flex gap-3 text-xs">
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 border ${
                  trackingStage === 'progress' ? 'bg-amber-100 border-[#EB9E27] text-[#EB9E27] animate-pulse'
                  : trackingStage === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-[#F6F5F0] border-slate-200 text-slate-400'
                }`}>
                  <MapPin className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">3. Plug Diagnostic Execution</h4>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    {trackingStage === 'progress' ? "Plug has arrived on-site! Diagnostic check taking place." 
                     : trackingStage === 'accepted' ? "Plug is backing tools & in transit."
                     : "Awaiting arrival details."}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Chat Drawer Segment with the mapped Plug */}
            {trackingStage !== 'requesting' && (
              <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3 mt-4 flex flex-col h-64 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-medium text-slate-600">
                    Live Chat with {viewingPlug?.firstName} (NIMC ID Checked)
                  </span>
                </div>

                {/* Message items container style */}
                <div id="direct-plug-chat-thread" className="flex-1 flex flex-col gap-2 overflow-y-auto mb-2 pr-1 custom-scrollbar text-xs">
                  {chatMessages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`max-w-[85%] rounded-[14px] p-2.5 ${
                        msg.sender === 'user' 
                          ? 'bg-[#EB9E27] text-white self-end rounded-tr-none' 
                          : 'bg-white text-slate-800 self-start border border-slate-100 rounded-tl-none'
                      }`}
                    >
                      <p className="leading-tight font-medium text-[11.5px]">{msg.text}</p>
                      <span className="text-[9px] font-mono block text-right mt-1 opacity-60">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}
                  {typing && (
                    <div className="bg-white border border-slate-100 rounded-[14px] p-2 rounded-tl-none self-start max-w-[50%] flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-[#EB9E27]" />
                      <span className="text-[10px] text-slate-500 font-mono">Plug matches keys...</span>
                    </div>
                  )}
                </div>

                {/* Input action bar */}
                <form onSubmit={handleSendMessage} className="flex gap-1.5 pt-1 border-t border-slate-200">
                  <input
                    type="text"
                    value={pendingMessage}
                    onChange={(e) => setPendingMessage(e.target.value)}
                    placeholder="Type directions, instructions..."
                    id="plug-chat-message-field"
                    className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#EB9E27] font-medium"
                  />
                  <button
                    type="submit"
                    id="submit-plug-chat-message"
                    className="p-1.5 w-8 h-8 rounded-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white shrink-0 flex items-center justify-center transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Finish and release button for demo completion flow */}
            {trackingStage === 'progress' && (
              <button
                onClick={handleFinishJob}
                id="complete-simulation-client"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full py-3.5 px-4 shadow-md transition flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4" /> Release Funds and Complete
              </button>
            )}

            <button
              onClick={() => {
                if (confirm("Are you sure you want to cancel the request and withdraw escrow?")) {
                  setTrackingStage(null);
                  setActiveBooking(null);
                }
              }}
              className="text-[11px] font-mono text-center text-slate-400 hover:text-rose-500 font-medium tracking-wide mt-1 transition"
            >
              Cancel Verification Booking
            </button>
          </div>
        ) : (
          /* Search & browse listing view */
          <div className="space-y-5">
            {/* Vetted introduction Card */}
            <div className="bg-[#EB9E27]/10 rounded-3xl p-5 border border-[#EB9E27]/25 relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-28 h-28 bg-[#EB9E27]/15 rounded-full blur-xl pointer-events-none" />
              <div className="flex gap-2.5 items-center text-amber-800 font-display font-bold text-xs">
                <Sparkles className="h-4 w-4 text-[#EB9E27] fill-[#EB9E27]/50" /> VETTED PROFESSIONAL NETWORK
              </div>
              <h1 className="font-display font-extrabold text-[#181C25] text-lg mt-2 tracking-tight">
                Pledging allegiance to your success.
              </h1>
              <p className="text-slate-600 text-[11.5px] leading-relaxed mt-1">
                All Plugs listed below are verified through biometric liveness matches and their National Identity Number (NIN).
              </p>
            </div>

            {/* Quick trade filters pills and Search block */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search electricians, plumbers, smart grids..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="vetted-listings-search-input"
                  className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EB9E27]/40 focus:border-[#EB9E27] font-medium transition"
                />
              </div>

              {/* Trade pills Selection widget */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTrade('all')}
                  className={`text-xs px-4 py-2 rounded-full font-medium transition ${
                    selectedTrade === 'all' 
                      ? 'bg-[#EB9E27] text-white' 
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  All Trades
                </button>
                <button
                  onClick={() => setSelectedTrade('electrician')}
                  className={`text-xs px-4 py-2 rounded-full font-medium transition flex items-center gap-1.5 ${
                    selectedTrade === 'electrician' 
                      ? 'bg-[#EB9E27] text-white' 
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  ⚡ Electricians
                </button>
                <button
                  onClick={() => setSelectedTrade('plumber')}
                  className={`text-xs px-4 py-2 rounded-full font-medium transition flex items-center gap-1.5 ${
                    selectedTrade === 'plumber' 
                      ? 'bg-[#EB9E27] text-white' 
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  💧 Plumbers
                </button>

                {/* City dropdown quick selector */}
                <div className="ml-auto flex items-center text-xs font-mono font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full">
                  <select 
                    value={selectedCity} 
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="Lagos">Lagos 🇳🇬</option>
                    <option value="Abuja">Abuja 🇳🇬</option>
                    <option value="Port Harcourt">Port H.</option>
                    <option value="Ibadan">Ibadan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Plug list Cards */}
            <div className="space-y-3" id="verified-plugs-grid">
              {plugsList.length > 0 ? (
                plugsList.map((plug, i) => (
                  <div
                    key={i}
                    onClick={() => setViewingPlug(plug)}
                    className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-[#EB9E27]/30 transition active:scale-99 shadow-xs hover:shadow-xs cursor-pointer flex gap-3.5"
                  >
                    {/* Avatar Container with verification icons */}
                    <div className="relative shrink-0">
                      <img
                        src={plug.photoUrl}
                        alt={`${plug.firstName} ${plug.lastName}`}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-100"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-xs" title="NIMC Identity Verified">
                        <ShieldCheck className="h-3 w-3 fill-emerald-500 text-white" />
                      </div>
                    </div>

                    {/* Meta info details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-extrabold text-[#111827] text-sm tracking-tight truncate">
                          {plug.firstName} {plug.lastName}
                        </h4>
                        <span className="bg-[#EB9E27]/10 text-[#EB9E27] text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                          {plug.trade}
                        </span>
                      </div>

                      <p className="text-slate-400 font-medium text-[11px] truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {plug.city}, Nigeria
                      </p>

                      <div className="flex items-center gap-3.5 mt-2.5 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-mono text-xs font-bold text-slate-700">{plug.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-mono text-[10.5px]">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          <span>{plug.completedJobs} Jobs</span>
                        </div>
                        <div className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-[#EB9E27] font-bold">
                          View Portfolio <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center flex flex-col items-center justify-center">
                  <BadgeAlert className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No Verified Plugs Found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Try changing your search keywords or switching cities to inspect alternative vetted providers.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Portfolio & Booking Drawer / Sheet */}
      {viewingPlug && !trackingStage && (
        <div className="fixed inset-0 bg-[#181C25]/40 backdrop-blur-xs z-30 flex items-end justify-center animate-fade-in" id="plug-portfolio-drawer">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-5 shadow-2xl border-t border-slate-100 overflow-y-auto max-h-[85vh] flex flex-col gap-4 animate-slide-up">
            
            {/* Drawer top notch line */}
            <div className="w-12 h-1 bg-slate-200 rounded-full self-center mb-1 shrink-0" />

            {/* Header info */}
            <div className="flex justify-between items-start">
              <button 
                onClick={() => setViewingPlug(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
              <span className="bg-[#EB9E27]/10 text-[#EB9E27] text-[10.5px] font-mono font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-sm">
                VETTED PROFILE
              </span>
            </div>

            {/* Profile Hero section in drawer */}
            <div className="flex gap-4 items-center bg-[#F6F5F0] p-4 rounded-2xl border border-slate-100">
              <img
                src={viewingPlug.photoUrl}
                alt={viewingPlug.firstName}
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-2xl object-cover border-2 border-[#EB9E27]/30"
              />
              <div>
                <h3 className="font-display font-extrabold text-[#181C25] text-lg leading-tight">
                  {viewingPlug.firstName} {viewingPlug.lastName}
                </h3>
                <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-widest mt-0.5 block">
                  🛡️ Vetted {viewingPlug.trade}
                </span>
                
                <div className="flex items-center gap-3.5 mt-2">
                  <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" /> {viewingPlug.rating}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-0.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {viewingPlug.completedJobs} Jobs
                  </span>
                </div>
              </div>
            </div>

            {/* Credentials details check grid */}
            <div className="grid grid-cols-2 gap-3.5 py-1">
              <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-3 flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 fill-emerald-500/15 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800">NIMC Database ID</h4>
                  <p className="text-[10px] font-mono text-emerald-700 mt-1 uppercase font-semibold">
                    100% MATCHED ✓
                  </p>
                </div>
              </div>

              <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-3 flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600 fill-emerald-500/15 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Biometric Liveness</h4>
                  <p className="text-[10px] font-mono text-emerald-700 mt-1 uppercase font-semibold">
                    SCAN OK ✓
                  </p>
                </div>
              </div>
            </div>

            {/* Vetted portfolio reviews explanation or details */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Vetted Background Details</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Matched with identity number ending in <span className="font-mono text-slate-800 font-semibold">*{viewingPlug.nin?.slice(-4)}</span>. 
                Vetted through localized city inspections to guarantee customer security. Serves residential and commercial environments inside {viewingPlug.city} and suburbs.
              </p>
            </div>

            {/* Booking flow form toggled drawer */}
            {bookingModalOpen ? (
              <div className="p-4 rounded-2xl border border-dashed border-[#EB9E27]/40 bg-amber-50/20 space-y-3.5 animate-slide-up" id="secure-escrow-booking-sheet">
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                  <span className="font-display font-bold text-sm text-slate-800">Create Escrow Booking</span>
                  <button 
                    onClick={() => setBookingModalOpen(false)}
                    className="text-slate-400 text-xs font-medium hover:text-slate-600"
                  >
                    Cancel Form
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Explain Job / Diagnostic issue</label>
                    <textarea
                      placeholder="e.g. Toilet is leaking and spraying water on the floor, or power outlets stopped working in kitchen."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      id="escrow-desc-textarea"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#EB9E27] font-medium"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Service Address / Apartment Number</label>
                    <input
                      type="text"
                      placeholder="e.g. Block C, Flat 12, Lekki Phase 1"
                      value={jobAddress}
                      onChange={(e) => setJobAddress(e.target.value)}
                      id="escrow-address-input"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#EB9E27] font-medium"
                    />
                  </div>

                  {/* Pricing matches recommendation tracker widget */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-700 block">Vetted Escrow Price</span>
                      <span className="text-[10px] text-slate-400">Guarantees safe payment holding</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        value={jobPrice}
                        onChange={(e) => setJobPrice(Number(e.target.value))}
                        id="escrow-pricing-select"
                        className="font-mono font-bold text-sm text-slate-800 bg-slate-50 border border-slate-200 p-1.5 rounded-lg focus:outline-none"
                      >
                        <option value={8000}>₦8,000</option>
                        <option value={12000}>₦12,000</option>
                        <option value={15000}>₦15,000</option>
                        <option value={20000}>₦20,000</option>
                        <option value={35000}>₦35,000</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Confirm booking button */}
                <button
                  onClick={handleCreateBooking}
                  id="confirm-escrow-booking"
                  className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold rounded-full py-4 shadow-md transition text-xs mt-2"
                >
                  Confirm and Book Vetted Plug
                </button>
              </div>
            ) : (
              /* Initial booking activator buttons */
              <div className="flex gap-2.5 pt-2 shrink-0">
                <button
                  onClick={() => alert(`Dialing Vetted Line for ${viewingPlug.firstName}: ${viewingPlug.phone}`)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-full py-4 text-xs transition flex items-center justify-center gap-2"
                >
                  <Phone className="h-4.5 w-4.5 text-[#EB9E27]" /> Call Vetted Line
                </button>
                <button
                  onClick={() => setBookingModalOpen(true)}
                  id="initiate-booking-trigger"
                  className="flex-1 bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold rounded-full py-4 text-xs transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4.5 w-4.5" /> Book with Escrow
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
