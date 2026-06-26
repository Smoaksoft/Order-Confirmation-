/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Send, 
  Mic, 
  MicOff, 
  Globe, 
  Check, 
  Sparkles, 
  MessageSquare,
  Volume2,
  Info,
  Server,
  UserCheck
} from 'lucide-react';
import { Order, CallType } from '../types';

interface SandboxViewProps {
  orders: Order[];
  onCallSuccess: () => void;
  focusedOrder: Order | null;
}

export default function SandboxView({ orders, onCallSuccess, focusedOrder }: SandboxViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [callType, setCallType] = useState<CallType>('COD Verification');
  
  // Call status: 'idle' | 'calling' | 'active' | 'ended'
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'active' | 'ended'>('idle');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'agent' | 'customer'; text: string }>>([]);
  const [userInput, setUserInput] = useState('');
  
  // Call outcomes
  const [detectedLang, setDetectedLang] = useState('English');
  const [detectedIntent, setDetectedIntent] = useState('none');
  const [callSummary, setCallSummary] = useState('');
  const [isGeminiPowered, setIsGeminiPowered] = useState(true);
  const [dialMode, setDialMode] = useState<'simulated' | 'live'>('simulated');
  const [carrierMessage, setCarrierMessage] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Set focused order if navigated from orders panel
  useEffect(() => {
    if (focusedOrder) {
      setSelectedOrderId(focusedOrder.id);
      // Pre-set logical call types based on status
      if (focusedOrder.status === 'Failed Delivery') {
        setCallType('Failed Delivery Recovery');
      } else {
        setCallType('COD Verification');
      }
    } else if (orders.length > 0) {
      // Pick first pending verification order as default
      const pending = orders.find(o => o.status === 'Pending Verification');
      setSelectedOrderId(pending ? pending.id : orders[0].id);
    }
  }, [focusedOrder, orders]);

  // Scroll chat history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const activeOrder = orders.find(o => o.id === selectedOrderId);

  // Trigger outbound call connection
  const handleStartCall = () => {
    if (!activeOrder) return;
    setCallStatus('calling');
    setChatHistory([]);
    setDetectedIntent('none');
    setCallSummary('');
    setCarrierMessage('');

    if (dialMode === 'live') {
      fetch('/api/calls/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          type: callType,
          liveDial: true
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.dialResult && data.dialResult.success) {
          setCallStatus('active');
          const sid = data.dialResult.apiResult.sid || data.dialResult.apiResult.id || 'N/A';
          setCarrierMessage(`Carrier SID: ${sid}`);
          setChatHistory([
            { sender: 'agent', text: `[Live VoIP Trunk Connect Channel]: Outbound call initiated via carrier. Processing live webhook callbacks. Connected with SID: ${sid}` }
          ]);
        } else {
          setCallStatus('ended');
          const reason = data.dialResult?.reason || 'VoIP gateways not provisioned';
          alert(`Live Outbound Connect Failed: ${reason}. Please configure matching carrier account settings under the settings page.`);
          setCallStatus('idle');
        }
      })
      .catch(err => {
        console.error('Error starting live dial:', err);
        alert('Network failure reaching VoIP dialing routing engine.');
        setCallStatus('idle');
      });
    } else {
      // Simulate ringtone for 2.0s
      setTimeout(() => {
        setCallStatus('active');
        
        // Fetch initial greetings from Gemini/Simulator
        fetch('/api/calls/simulate-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: activeOrder.id,
            callType: callType,
            chatHistory: [],
            userMessage: 'CALL_START_INITIAL_HELLO'
          })
        })
        .then(res => res.json())
        .then(data => {
          setChatHistory([{ sender: 'agent', text: data.reply }]);
          setDetectedLang(data.language || 'English');
          setIsGeminiPowered(data.isGeminiPowered);
          
          // Browser text to speech synthesis greeting
          speakText(data.reply, data.language);
        })
        .catch(err => {
          console.error('Error starting call simulation:', err);
          setCallStatus('idle');
        });
      }, 2000);
    }
  };

  // Browser-based Text to Speech synthesis helper
  const speakText = (text: string, langName: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Clean text tags
    const utterance = new SpeechSynthesisUtterance(text);
    if (langName === 'Hindi') {
      utterance.lang = 'hi-IN';
    } else if (langName === 'Bengali') {
      utterance.lang = 'bn-IN';
    } else {
      utterance.lang = 'en-US';
    }
    window.speechSynthesis.speak(utterance);
  };

  // Submit customer response turn
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || !activeOrder) return;

    const speech = userInput.trim();
    const updatedHistory = [...chatHistory, { sender: 'customer' as const, text: speech }];
    setChatHistory(updatedHistory);
    setUserInput('');

    // Trigger AI response turn
    fetch('/api/calls/simulate-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: activeOrder.id,
        callType: callType,
        chatHistory: updatedHistory,
        userMessage: speech
      })
    })
    .then(res => res.json())
    .then(data => {
      setChatHistory([...updatedHistory, { sender: 'agent', text: data.reply }]);
      setDetectedLang(data.language);
      setDetectedIntent(data.intent);
      setCallSummary(data.notes || '');
      setIsGeminiPowered(data.isGeminiPowered);

      speakText(data.reply, data.language);

      // Check if call completed and intent resolved
      if (data.intent === 'confirmed' || data.intent === 'cancelled' || data.intent === 'escalated') {
        setTimeout(() => {
          handleEndCall(true);
        }, 5000); // Wait 5 seconds to let the end response play then hang up
      }
    })
    .catch(err => console.error('Error submitting turn:', err));
  };

  // Hang Up call manual or auto
  const handleEndCall = (isAuto = false) => {
    window.speechSynthesis.cancel();
    setCallStatus('ended');
    onCallSuccess(); // Refresh parents lists of order updates and logs
  };

  // Quick suggestion clicks for multilingual simulations
  const playSuggestion = (text: string) => {
    setUserInput(text);
  };

  const currentSuggestions = {
    'COD Verification': [
      { text: 'Yes, please confirm and ship it', icon: '✅' },
      { text: 'हां, आर्डर बिलकुल कन्फर्म है भेज दीजिये', icon: '🇮🇳' },
      { text: 'হ্যাঁ, আমার অর্ডারটা কনফার্ম করুন', icon: '🇧🇩' },
      { text: 'No, please cancel this order', icon: '❌' },
      { text: 'नहीं, मैंने आर्डर कैंसिल करने के लिए बोला था', icon: '🇮🇳' },
      { text: 'Let me talk to a human agent', icon: '🙋' }
    ],
    'Failed Delivery Recovery': [
      { text: 'The courier guy did not call me. Please deliver tomorrow', icon: '📍' },
      { text: 'landmark is opposite the Axis Bank ATM near sector 15 Noida', icon: '🏢' },
      { text: 'আমার ঘরের পাশে শিব মন্দিরের সামনে ডেলিভারি দিন', icon: '🇧🇩' }
    ],
    'Feedback Collection': [
      { text: 'Very satisfied! I rate your service 5 stars', icon: '⭐' },
      { text: 'बहुत बढ़िया सर्विस है, 5 स्टार !', icon: '🇮🇳' },
      { text: 'খারাপ সার্ভিস, ডেলিভারি অনেক লেট হয়েছে', icon: '🇧🇩' }
    ]
  };

  return (
    <div key="sandbox-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Selector and configuration column */}
      <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-5 space-y-5 shadow-2xs">
        <div>
          <h2 className="text-base font-bold font-display text-slate-800 flex items-center gap-1.5">
            <Sparkles size={16} className="text-indigo-600" /> Outbound Call Simulator
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Test real-time automated voice verification scenarios end-to-end.</p>
        </div>

        <div className="space-y-4 text-xs text-slate-600">
          {/* Active target order drop down */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Customer Order</label>
            <select
              value={selectedOrderId}
              disabled={callStatus !== 'idle'}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
            >
              <option value="">-- Choose Order to Call --</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.id} - {o.customerName} ({o.city} | ₹{o.orderValue} | {o.status})
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Call type selection */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Objective Task</label>
            <div className="grid grid-cols-2 gap-2">
              {(['COD Verification', 'Failed Delivery Recovery', 'Feedback Collection'] as CallType[]).map((type) => (
                <button
                  id={`sandbox-task-${type.replace(' ', '-')}`}
                  key={type}
                  type="button"
                  disabled={callStatus !== 'idle'}
                  onClick={() => setCallType(type)}
                  className={`p-2 border.5 rounded-lg text-left transition-all ${
                    callType === type 
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold shadow-xs' 
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[10px] font-bold">{type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active order meta card */}
          {activeOrder && (
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2.5 text-[11px]">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-700">Client profile details</span>
                <span className="font-mono text-slate-400">{activeOrder.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Recipient Name</span>
                  <span className="font-medium text-slate-800">{activeOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Phone contact</span>
                  <span className="font-medium text-slate-800">{activeOrder.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Total Value / cod</span>
                  <span className="font-semibold text-slate-800">₹{activeOrder.orderValue} ({activeOrder.paymentMethod})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Delivery location</span>
                  <span className="font-medium text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap block" title={activeOrder.address}>
                    {activeOrder.city}, {activeOrder.state}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dial Mode Selector Segment */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Voice Gateway Dial Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={callStatus !== 'idle'}
                onClick={() => setDialMode('simulated')}
                className={`p-2 border rounded-xl text-center font-medium transition-all cursor-pointer ${
                  dialMode === 'simulated'
                    ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-semibold'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                🤖 Web Browser Simulator
              </button>
              <button
                type="button"
                disabled={callStatus !== 'idle'}
                onClick={() => setDialMode('live')}
                className={`p-2 border rounded-xl text-center font-medium transition-all cursor-pointer ${
                  dialMode === 'live'
                    ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-semibold'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                📞 Live Carrier Dials (VoIP)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {dialMode === 'simulated' 
                ? 'Runs interactive TTS synthesis logic inside the browser client directly.' 
                : 'Triggers outbound dials to Twilio/Exotel carrier relays using settings-tab credentials.'}
            </p>
          </div>

          {/* Trigger calls state controller button */}
          {callStatus === 'idle' && (
            <button
              id="btn-simulate-dial"
              onClick={handleStartCall}
              disabled={!selectedOrderId}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-101 transition-all"
            >
              <Phone size={14} className="animate-pulse" />
              {dialMode === 'live' ? 'Dial Real VoIP Outbound' : 'Simulate Outbound Dialing'}
            </button>
          )}

          {callStatus !== 'idle' && (
            <button
              id="btn-simulate-hangup"
              onClick={() => handleEndCall()}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              <PhoneOff size={14} />
              Hang Up (Terminate connection)
            </button>
          )}
        </div>
      </div>

      {/* Simulator active terminal screen column */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-950 rounded-2xl shadow-xl overflow-hidden text-white h-[520px] flex flex-col justify-between">
        
        {/* Call center status header */}
        <div className="bg-slate-950 p-4 px-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${callStatus === 'active' ? 'bg-emerald-500 animate-pulse' : callStatus === 'calling' ? 'bg-amber-500 animate-bounce' : 'bg-slate-600'}`}></div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">
                {callStatus === 'idle' ? 'DIALER DISCONNECTED' : callStatus === 'calling' ? 'DIALING OUTBOUND...' : callStatus === 'active' ? 'CALL TRANSLATION ACTIVE' : 'CALL RECAP LOGGED'}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Server size={10} /> {isGeminiPowered ? 'Gemini 3.5 AI Model connected' : 'Rule-Based Local Simulation Engine'}
              </p>
              {carrierMessage && (
                <p className="text-[9px] text-indigo-400 font-mono mt-0.5 leading-none">
                  ● {carrierMessage}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] bg-slate-800/80 px-2.5 py-1 rounded-lg">
            <Globe size={11} className="text-indigo-400" />
            <span>EN | HI | BN</span>
          </div>
        </div>

        {/* Dynamic simulator content body area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4" ref={scrollRef}>
          {callStatus === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <Phone size={34} className="text-slate-600 bg-slate-800/35 p-3 rounded-2xl h-14 w-14" />
              <div>
                <h4 className="text-xs font-semibold text-slate-300">Outbound Softphone Offline</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1">Select any target customer model and trigger simulation to test the multilingual real-time conversation flows.</p>
              </div>
            </div>
          )}

          {callStatus === 'calling' && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping"></span>
                <Phone size={24} className="text-indigo-400 bg-indigo-500/10 p-5 rounded-full h-16 w-16" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Ringing {activeOrder?.phoneNumber}...</h4>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest animate-pulse">Contacting network provider gateways...</p>
              </div>
            </div>
          )}

          {(callStatus === 'active' || callStatus === 'ended') && (
            <div className="space-y-3">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'customer' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'
                  }`}>
                    <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">
                      {msg.sender === 'customer' ? 'Customer (You)' : 'OrderVoice AI'}
                    </div>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input box bar floor */}
        {callStatus === 'active' && (
          <div className="bg-slate-950 p-3.5 border-t border-slate-800/60 space-y-3.5">
            {/* Suggestion list pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-slate-300 select-none">
              {(currentSuggestions[callType as keyof typeof currentSuggestions] || []).map((sugg, i) => (
                <button
                  key={i}
                  id={`suggestion-pill-${i}`}
                  onClick={() => playSuggestion(sugg.text)}
                  className="px-2.5 py-1.5 border border-slate-800 bg-slate-900 rounded-lg text-[10px] font-medium hover:bg-slate-800 hover:text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <span>{sugg.icon}</span>
                  <span>{sugg.text}</span>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input 
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="Respond as the customer (English, Hindi, Bengali)..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 font-sans text-slate-100"
              />
              <button 
                type="submit"
                id="btn-activecall-submit"
                className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors text-white cursor-pointer"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        )}

        {/* Call ended recap summary floor */}
        {callStatus === 'ended' && (
          <div className="bg-slate-950 p-4 px-5 border-t border-slate-800/80 space-y-3 animate-fade-in text-xs">
            <h3 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
              <UserCheck size={14} /> AI Agent Post-Call Diagnosis
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-850">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Language Detected</span>
                <span className="font-semibold">{detectedLang}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Customer Intent</span>
                <span className="font-semibold uppercase tracking-widest text-indigo-400">{detectedIntent}</span>
              </div>
              <div className="col-span-2 border-t border-slate-800 pt-2 mt-1">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Summary transcript note</span>
                <p className="italic text-slate-400">
                  {callSummary || 'Automated validation complete. Synced with carrier routing networks.'}
                </p>
              </div>
            </div>

            <button
              id="btn-sandbox-done"
              onClick={() => setCallStatus('idle')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs cursor-pointer shadow-xs"
            >
              Acknowledge and Reset Dialer
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
