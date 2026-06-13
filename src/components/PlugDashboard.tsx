import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, MapPin, Star, Briefcase, Phone, CheckCircle2, 
  Wallet, X, MessageSquare, Power, ArrowRight, TrendingUp, HelpCircle, AlertCircle, Banknote, RefreshCw, Loader2
} from 'lucide-react';
import { PlugProfile, Booking, ChatMessage } from '../types';
import { INITIAL_BOOKINGS, FAQ_LIST } from '../data';

interface PlugDashboardProps {
  profile: PlugProfile;
  onLogout: () => void;
}

export default function PlugDashboard({ profile, onLogout }: PlugDashboardProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [walletBalance, setWalletBalance] = useState(45000);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [activeJob, setActiveJob] = useState<Booking | null>(null);
  
  // Withdrawal Form Sheets
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('25000');
  const [selectedBank, setSelectedBank] = useState('Guaranty Trust Bank (GTB)');
  const [accountNum, setAccountNum] = useState('0123456789');
  const [withdrawalStage, setWithdrawalStage] = useState<'idle' | 'processing' | 'success'>('idle');

  // Chat with active customer
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (activeJob) {
      setChatMessages([
        {
          id: '1',
          sender: 'other',
          text: `Hi! Thank you for accepting my request. Looking forward to getting this fixed. Let me know when you are heading over.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [activeJob]);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (amountNum > walletBalance) {
      alert("Insufficient wallet balance");
      return;
    }

    setWithdrawalStage('processing');
    setTimeout(() => {
      setWalletBalance(prev => prev - amountNum);
      setWithdrawalStage('success');
      setTimeout(() => {
        setWithdrawalStage('idle');
        setWithdrawOpen(false);
      }, 2500);
    }, 2000);
  };

  const handleAcceptJob = (job: Booking) => {
    const updatedJob: Booking = { ...job, status: 'in_progress' };
    setActiveJob(updatedJob);
    // Remove from incoming feed list
    setBookings(prev => prev.filter(b => b.id !== job.id));
  };

  const handleDeclineJob = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMessage.trim() || !activeJob) return;

    const professionalMsg: ChatMessage = {
      id: String(chatMessages.length + 1),
      sender: 'user',
      text: pendingMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, professionalMsg]);
    const messageText = pendingMessage.toLowerCase();
    setPendingMessage('');
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      let replyText = `Sounds good. Appreciate the swift update, let me know when you arrive.`;

      if (messageText.includes('on my way') || messageText.includes('heading') || messageText.includes('coming') || messageText.includes('leave')) {
        replyText = `Fantastic, thank you! I'll make sure someone is ready to receive you and guide you to the area.`;
      } else if (messageText.includes('price') || messageText.includes('cost') || messageText.includes('parts')) {
        replyText = `Understood. Please inspect the damage first, and we can discuss the material components cost.`;
      } else if (messageText.includes('arrive') || messageText.includes('here') || messageText.includes('gate') || messageText.includes('flat')) {
        replyText = `Perfect! Opening the door now. Come right in.`;
      }

      const clientMsg: ChatMessage = {
        id: String(chatMessages.length + 2),
        sender: 'other',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, clientMsg]);
    }, 2000);
  };

  const handleCompleteJob = () => {
    if (!activeJob) return;
    setWalletBalance(prev => prev + activeJob.price);
    alert(`Bravo! Job successfully completed. ₦${activeJob.price.toLocaleString()} has been safely released from Escrow into your Security Wallet.`);
    setActiveJob(null);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-[#F6F5F0]" id="plug-dashboard-wrapper">
      {/* Plug header banner */}
      <header className="p-4 pt-5 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-xs flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            {profile.photoUrl ? (
              <img 
                src={profile.photoUrl} 
                alt={`${profile.firstName}`} 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-[#EB9E27]/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#EB9E27]/10 flex items-center justify-center font-display font-semibold text-[#EB9E27]">
                {profile.firstName[0]}
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-[#181C25] text-sm leading-none">
                {profile.firstName} {profile.lastName}
              </h3>
              <ShieldCheck className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#EB9E27] font-bold block mt-0.5">
              Verified {profile.trade}
            </span>
          </div>
        </div>

        {/* Global Toggle Status slider online/offline */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-[10px] font-extrabold tracking-wider transition ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            <Power className="h-3 w-3" /> {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
          
          <button 
            onClick={onLogout}
            className="text-[10px] font-mono hover:bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-1.5 rounded-full transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Primary Dashboard Modules View */}
      <main className="flex-1 p-4 pb-12 overflow-y-auto custom-scrollbar space-y-5">
        
        {/* Verification confirmation Badge alert banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-mono font-extrabold text-emerald-700 tracking-wider uppercase block">
              Identity Status: SECURED Match
            </span>
            <p className="text-[11.5px] font-medium text-emerald-800 leading-relaxed mt-0.5">
              Your NIN ({profile.nin}) is registered under verified biological details. Your professional badge indicates secure matches for both clients and families.
            </p>
          </div>
        </div>

        {/* Quick analytics card & Security Wallet block */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Dashboard balance card */}
          <div className="bg-white rounded-3xl p-4.5 border border-slate-150 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                Security Wallet
              </span>
              <h2 className="font-display font-extrabold text-slate-800 text-xl mt-1">
                ₦{walletBalance.toLocaleString()}
              </h2>
            </div>
            <button
              onClick={() => setWithdrawOpen(true)}
              className="mt-4 bg-[#EB9E27] hover:bg-[#D68B1D] text-white py-1.5 px-3 rounded-full text-[10.5px] font-mono font-extrabold tracking-wider active:scale-98 transition flex items-center justify-center gap-1"
            >
              <Banknote className="h-3.5 w-3.5" /> WITHDRAW
            </button>
          </div>

          {/* Quick Metrics columns */}
          <div className="grid grid-rows-2 gap-3">
            <div className="bg-white rounded-2xl p-3 border border-slate-150 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-[#EB9E27]">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-400 font-bold block">RATING</span>
                <span className="font-mono text-xs font-bold text-slate-800">4.9 / 5.0</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-slate-150 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-400 font-bold block">COMPLETED</span>
                <span className="font-mono text-xs font-bold text-slate-800">{profile.completedJobs} Jobs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Job request / active dashboard section */}
        {activeJob ? (
          /* Active active job diagnostic status workflow */
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#EB9E27]/30 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> CURRENTLY ACTIVE DIAGNOSTIC
                </span>
                <h3 className="font-display font-bold text-lg text-slate-800 mt-1">
                  Work in Progress
                </h3>
              </div>
              <div className="font-mono text-xs text-[#EB9E27] font-bold bg-amber-50 px-2.5 py-1 rounded-full">
                ₦{activeJob.price.toLocaleString()}
              </div>
            </div>

            {/* Client detail info */}
            <div className="space-y-1 bg-[#F6F5F0] p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
              <p className="flex justify-between"><span className="font-bold text-slate-500">Customer:</span> <span className="text-slate-800 font-semibold">{activeJob.clientName}</span></p>
              <p className="flex justify-between"><span className="font-bold text-slate-500">Service Area:</span> <span className="text-slate-800 font-semibold">{activeJob.location}</span></p>
              <p className="flex justify-between"><span className="font-bold text-slate-500">Task Detail:</span> <span className="text-slate-800 font-medium text-right max-w-[200px] truncate">{activeJob.description}</span></p>
            </div>

            {/* Simulated Live Chat thread with Client */}
            <div className="bg-slate-50 border border-slate-100 rounded-[18px] p-3 flex flex-col h-64 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#EB9E27] animate-pulse" />
                <span className="text-[10px] font-mono font-medium text-slate-600">
                  Secure Direct Chat link with Customer (Escrow active)
                </span>
              </div>

              <div id="plug-active-chat-thread" className="flex-1 flex flex-col gap-2 overflow-y-auto mb-2 pr-1 custom-scrollbar text-xs">
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
                    <span className="text-[10px] text-slate-500 font-mono">Client matches keys...</span>
                  </div>
                )}
              </div>

              {/* Chat action input bar */}
              <form onSubmit={handleSendMessage} className="flex gap-1.5 pt-1 border-t border-slate-200">
                <input
                  type="text"
                  value={pendingMessage}
                  onChange={(e) => setPendingMessage(e.target.value)}
                  placeholder="Tell client you are on your way or arrived..."
                  id="plug-chat-field"
                  className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#EB9E27] font-medium"
                />
                <button
                  type="submit"
                  id="submit-professional-chat-message"
                  className="p-1.5 w-8 h-8 rounded-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white shrink-0 flex items-center justify-center transition"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* Click to complete task */}
            <button
              onClick={handleCompleteJob}
              id="mark-job-complete-trigger"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full py-4 text-xs shadow-md transition flex items-center justify-center gap-2 mt-1"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark Diagnostics Complete & Claim Escrow
            </button>
          </div>
        ) : (
          /* Incoming Dispatch Requests Feed */
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-display font-bold text-sm text-[#181C25] uppercase tracking-wide">
                Active Client Feed
              </h3>
              <span className="text-[10px] font-mono font-medium text-slate-500 animate-pulse bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                🔍 listening for jobs near {profile.city}...
              </span>
            </div>

            {isOnline ? (
              <div className="space-y-3" id="incoming-dispatch-bookings">
                {bookings.length > 0 ? (
                  bookings.map((booking, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-[24px] p-4.5 border border-slate-100 shadow-xs flex flex-col gap-3.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">
                            {booking.clientName}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#EB9E27]" /> {booking.location} • {booking.createdAt}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                          ₦{booking.price.toLocaleString()}
                        </div>
                      </div>

                      <p className="text-slate-600 text-xs leading-relaxed font-normal p-3 rounded-xl bg-[#F6F5F0] border border-slate-100">
                        {booking.description}
                      </p>

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => handleDeclineJob(booking.id)}
                          className="text-xs font-mono font-bold text-slate-400 hover:text-rose-500 px-3.5 py-2 rounded-full hover:bg-rose-50/20 transition"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptJob(booking)}
                          id={`accept-job-${booking.id}`}
                          className="bg-[#EB9E27] hover:bg-[#D68B1D] text-white text-xs font-bold py-2.5 px-5 rounded-full transition flex items-center gap-1.5 shadow-sm active:scale-98"
                        >
                          Accept request <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center flex flex-col items-center justify-center">
                    <TrendingUp className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-500">Waiting for requests</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      You are positioned on top ranks of local algorithms. New requests in {profile.city} will pop up here instantly!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 rounded-3xl p-6 border border-dashed border-amber-200 text-center flex flex-col items-center justify-center">
                <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">You are offline</p>
                <p className="text-xs text-amber-700 mt-1 max-w-xs leading-relaxed">
                  Turn your status back online using the dashboard switch to receive lucrative plumbing or electrical bookings in your neighborhood.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trade guides & Help FAQs */}
        <div className="bg-white rounded-3xl p-4.5 border border-slate-150 space-y-3">
          <h4 className="font-display font-extrabold text-[#181C25] text-xs uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="h-4 w-4 text-[#EB9E27]" /> Vetted Professional Policy Check
          </h4>
          
          <div className="space-y-3.5 text-xs text-slate-600">
            {FAQ_LIST.map((faq, i) => (
              <div key={i} className="space-y-1">
                <h5 className="font-bold text-slate-800 leading-snug">{faq.q}</h5>
                <p className="text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* SECURE ESCROW WITHDRAWAL MODAL DRAWER */}
      {withdrawOpen && (
        <div className="fixed inset-0 bg-[#181C25]/40 backdrop-blur-xs z-30 flex items-end justify-center animate-fade-in" id="withdrawal-modal-drawer">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 shadow-2xl border-t border-slate-100 max-h-[85vh] overflow-y-auto flex flex-col gap-4.5 animate-slide-up">
            
            <div className="w-12 h-1 bg-slate-200 rounded-full self-center shrink-0 mb-1" />

            <div className="flex justify-between items-center">
              <h3 className="font-display font-extrabold text-[#111827] text-md">
                Secure Bank Settlement
              </h3>
              <button
                onClick={() => setWithdrawOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 shrink-0 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {withdrawalStage === 'processing' ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <RefreshCw className="h-10 w-10 text-[#EB9E27] animate-spin" />
                <h4 className="font-bold text-slate-800 text-sm mt-2">Connecting Central Settlement...</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Moving ₦{Number(withdrawAmount).toLocaleString()} safely to {selectedBank}. Matches registered biological NIN records.
                </p>
              </div>
            ) : withdrawalStage === 'success' ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  <CheckCircle2 className="h-8 w-8 stroke-[3]" />
                </div>
                <h4 className="font-display font-extrabold text-slate-800 text-md mt-2">settlement initiated ✓</h4>
                <p className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full font-medium max-w-xs">
                  ₦{Number(withdrawAmount).toLocaleString()} dispatched successfully.
                </p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                  Usually reflects within minutes in target CBN bank networks.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4 text-xs">
                
                {/* Available info */}
                <div className="bg-[#F6F5F0] p-4 rounded-2xl flex justify-between items-center border border-slate-150">
                  <span className="font-bold text-slate-600">Available settle limits:</span>
                  <span className="font-mono text-sm font-extrabold text-[#181C25]">
                    ₦{walletBalance.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select CBN Registered Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    id="withdrawal-bank-select"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#EB9E27]"
                  >
                    <option value="Guaranty Trust Bank (GTB)">Guaranty Trust Bank (GTB)</option>
                    <option value="Access Bank PLC">Access Bank PLC</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                    <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                    <option value="Kuda Microfinance Bank">Kuda MFB</option>
                    <option value="Moniepoint Bank">Moniepoint</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Account Number (10 Digits)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNum}
                    onChange={(e) => setAccountNum(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 0123456789"
                    id="withdrawal-account-input"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#EB9E27]"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Enter Settle Amount (₦)</label>
                  <input
                    type="number"
                    max={walletBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    id="withdrawal-amount-input"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#EB9E27]"
                    required
                  />
                </div>

                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                  <p className="text-[10.5px] text-amber-700 leading-normal">
                    Settlements can only trigger to accounts matching biometric details linked during onboarding verification.
                  </p>
                </div>

                <button
                  type="submit"
                  id="submit-settlement-trigger"
                  className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white py-4 px-6 rounded-full font-semibold shadow-md active:scale-98 transition flex items-center justify-center gap-1 text-sm mt-2"
                >
                  Initiate Secure Settlement
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
