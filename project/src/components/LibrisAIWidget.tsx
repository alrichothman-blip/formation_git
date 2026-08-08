import { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Minus, Send, Sparkles, X } from "lucide-react";

// Adaptez ce chemin selon votre configuration (proxy Vite vers XAMPP, domaine du Pi en prod, etc.)
const API_URL = "/api/assistant.php";

const QUICK_ACTIONS = [
  { label: "Vérifier une disponibilité", prompt: "Est-ce que vous avez le livre " },
  { label: "Une recommandation", prompt: "Peux-tu me conseiller un livre sur " },
  { label: "Mes emprunts en cours", prompt: "Quels sont mes emprunts en cours ?" },
];

function RobotAvatar({ className = "h-16 w-16", showLightning = true, isInteractive = false }) {
  return (
    <div className={`relative ${className}`}>
      {showLightning && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce [animation-duration:2s]">
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 8.5H7.5V0.5L0.5 11.5H6.5V19.5L13.5 8.5Z" fill="#4ADE80" stroke="#22C55E" strokeWidth="1" />
          </svg>
        </div>
      )}
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-md">
        {isInteractive && (
          <style>
            {`
              .arm-left {
                transform-origin: 23px 51px;
                transform: rotate(-40deg);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              }
              .arm-right {
                transform-origin: 77px 51px;
                transform: rotate(40deg);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
              }
              .group:hover .arm-left, .jump-active .arm-left {
                transform: rotate(40deg);
              }
              .group:hover .arm-right, .jump-active .arm-right {
                transform: rotate(-40deg);
              }
            `}
          </style>
        )}

        {/* Bras (reposés en bas par défaut, se lèvent au survol) */}
        {isInteractive ? (
          <>
            <rect x="12" y="45" width="22" height="12" rx="6" className="arm-left" fill="#E2E8F0" />
            <rect x="66" y="45" width="22" height="12" rx="6" className="arm-right" fill="#E2E8F0" />
          </>
        ) : (
          <>
            <rect x="12" y="45" width="22" height="12" rx="6" transform="rotate(40 23 51)" fill="#E2E8F0" />
            <rect x="66" y="45" width="22" height="12" rx="6" transform="rotate(-40 77 51)" fill="#E2E8F0" />
          </>
        )}

        {/* Jambes */}
        <rect x="34" y="78" width="12" height="16" rx="6" fill="#E2E8F0" />
        <rect x="54" y="78" width="12" height="16" rx="6" fill="#E2E8F0" />

        {/* Corps rond */}
        <path d="M 50 22 C 30 22, 22 40, 22 60 C 22 80, 35 85, 50 85 C 65 85, 78 80, 78 60 C 78 40, 70 22, 50 22 Z" fill="#F8FAFC" />

        {/* Ligne de séparation au milieu */}
        <path d="M 22 64 Q 50 70 78 64" stroke="#E2E8F0" strokeWidth="2" fill="none" />

        {/* Visage écran */}
        <rect x="32" y="34" width="36" height="24" rx="12" fill="#3B82F6" />

        {/* Yeux souriants */}
        <path d="M 40 45 Q 43 41 46 45" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 54 45 Q 57 41 60 45" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

function SmallRobotAvatar() {
  return (
    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 overflow-hidden">
      <img
        src="/Sans titre.jpg"
        alt="Logo IST"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function Trampoline() {
  return (
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none">
      <div className="h-2.5 w-14 rounded-full bg-slate-700 shadow-inner" />
      <div className="mt-1 flex items-center gap-1">
        <span className="block h-2 w-2 rounded-full bg-cyan-300" />
        <span className="block h-2 w-2 rounded-full bg-cyan-300" />
        <span className="block h-2 w-2 rounded-full bg-cyan-300" />
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <SmallRobotAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <SmallRobotAvatar />}
      <div
        className={`max-w-[78%] whitespace-pre-wrap break-words px-4 py-2.5 text-[13px] leading-relaxed ${isUser
          ? "rounded-2xl rounded-br-sm bg-indigo-600 text-white"
          : "rounded-2xl rounded-bl-sm bg-slate-800 text-slate-100"
          }`}
      >
        {content}
      </div>
    </div>
  );
}

export default function LibrisAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [consented, setConsented] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis Libris AI, l'assistant de la bibliothèque. Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowTeaser(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const openWidget = () => {
    setIsJumping(true);
    setTimeout(() => {
      setIsOpen(true);
      setShowTeaser(false);
      setIsJumping(false);
    }, 300);
  };

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const historique = messages.slice(-6).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, historique }),
      });
      const data = await res.json();

      if (!res.ok || !data.reponse) {
        throw new Error(data.error || "Réponse invalide");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reponse }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Désolé, je ne suis pas joignable pour le moment. Réessayez dans un instant ou contactez le bibliothécaire.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Panneau de chat */}
      <div
        className={`relative flex h-[560px] w-96 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090d16] shadow-2xl transition-all duration-200 ease-out origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0 absolute bottom-0 right-0"
          }`}
      >
        {/* En-tête */}
        <div className="flex flex-none items-center justify-between bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#1e40af] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center">
              <SmallRobotAvatar />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-white">Libris AI</p>
              <p className="text-[11px] leading-tight text-sky-100/95">Assistant de la bibliothèque</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Réduire l'assistant"
            className="rounded-md p-1 text-sky-100 hover:bg-white/10 hover:text-white"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Zone messages (+ overlay de consentement) */}
        <div className="relative flex-1 overflow-hidden">
          <div ref={scrollRef} className="h-full space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
            {loading && <TypingBubble />}

            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => setInput(qa.prompt)}
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500 hover:text-indigo-300"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!consented && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#090d16]/90 px-6">
              <div className="w-full rounded-xl border border-[#1d4ed8]/30 bg-[#071222] p-4 shadow-lg shadow-slate-950/40">
                <div className="mb-2 flex items-center gap-1.5 text-sky-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-sky-200">
                    Traitement local
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Vos échanges sont traités par un modèle hébergé sur le serveur de la
                  bibliothèque — aucune donnée n'est envoyée à un service externe.
                </p>
                <label className="mt-3 flex items-start gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 accent-indigo-600"
                  />
                  J'ai compris et je souhaite discuter avec l'assistant.
                </label>
                <button
                  disabled={!consentChecked}
                  onClick={() => setConsented(true)}
                  className="mt-3 w-full rounded-lg bg-[#1d4ed8] py-2 text-xs font-medium text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                >
                  Commencer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pied de formulaire */}
        <div className="flex-none border-t border-[#1d4ed8]/20 bg-[#071222] p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Poser une question..."
              className="max-h-20 flex-1 resize-none rounded-lg border border-[#1d4ed8]/30 bg-[#081524] px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 focus:border-[#1d4ed8] focus:outline-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Envoyer"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#1d4ed8] text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-right text-[10px] text-slate-600">{input.length}/500</p>
        </div>
      </div>

      {/* Bulle flottante fermée (avec animation de l'avatar) */}
      {!isOpen && (
        <div className="relative mt-4 flex flex-col items-end group">
          {/* Bulle-teaser */}
          {showTeaser && (
            <div className="absolute bottom-full mb-4 right-0 w-72 rounded-xl bg-[#071424] p-4 shadow-xl text-white animate-in fade-in slide-in-from-bottom-4 duration-500 z-10 border border-[#1d4ed8]/20">
              <button
                onClick={(e) => { e.stopPropagation(); setShowTeaser(false); }}
                aria-label="Fermer la suggestion"
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold mb-1.5">Demandez de l'aide à Libris !</p>
              <p className="text-[13px] leading-relaxed text-slate-300">
                Trouvez rapidement le livre qu'il vous faut.<br />
                Vérifiez vos emprunts et disponibilités facilement.
              </p>
              {/* Flèche de la bulle pointée vers le centre du bouton */}
              <div className="absolute -bottom-2 right-10 h-4 w-4 rotate-45 bg-[#2D2D2D]"></div>
            </div>
          )}

          <button
            onClick={openWidget}
            onMouseEnter={() => setShowTeaser(false)}
            aria-label="Ouvrir Libris AI"
            className={`relative flex h-20 w-20 items-center justify-center transition-all duration-300 group ${isJumping ? "-translate-y-10 scale-110 jump-active" : "hover:scale-110"
              }`}
          >
            {isJumping && <Trampoline />}

            {/* Petit mot qui apparaît au survol */}
            <div className={`absolute right-2 transition-all duration-300 pointer-events-none z-20 ${
              isJumping || showTeaser ? "hidden opacity-0" : "-top-4 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1"
              }`}>
              <div className="bg-white text-[#1e3a8a] text-[12px] font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap border border-blue-100">
                Salut, je suis l'assistant virtuel Libris!
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-blue-100 rotate-45"></div>
              </div>
            </div>

            <RobotAvatar className="h-full w-full drop-shadow-2xl" showLightning={true} isInteractive={true} />
          </button>
        </div>
      )}

      {/* Robot flottant quand le chat est ouvert */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Fermer Libris AI"
          className="relative mt-4 z-50 animate-[bounce_3s_ease-in-out_infinite] drop-shadow-xl transition-transform hover:scale-110 group"
        >
          <Trampoline />
          <RobotAvatar className="h-16 w-16" showLightning={true} isInteractive={true} />
        </button>
      )}
    </div>
  );
}
