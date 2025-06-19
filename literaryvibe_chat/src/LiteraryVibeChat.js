import React, { useState, useRef, useEffect } from "react";

// Color palette
const COLORS = {
  primary: "#4B0082",
  secondary: "#8A2BE2",
  accent: "#FFD700",
  background: "#F5F3FF",
  white: "#fff",
  text: "#24123A",
  border: "#E6E0FF",
};

// Sample famous literary characters
const CHARACTERS = [
  {
    id: "sherlock",
    name: "Sherlock Holmes",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Sherlock_Holmes_Paget.jpg/120px-Sherlock_Holmes_Paget.jpg",
    vibe: {
      primary: "#4B0082",
      secondary: "#8A2BE2",
      accent: "#FFD700",
      background: "#F5F3FF",
      text: "#24123A",
    },
    systemPrompt:
      "You are Sherlock Holmes, the ever-logical, fact-driven detective from Baker Street. Always stay composed and analytical in your replies.",
    sampleGreeting:
      "Greetings. How may I assist with your latest mystery?",
  },
  {
    id: "dracula",
    name: "Count Dracula",
    img: "https://upload.wikimedia.org/wikipedia/commons/3/31/Dracula_1897.jpg",
    vibe: {
      primary: "#232135",
      secondary: "#8A2BE2",
      accent: "#FFD700",
      background: "#120d21",
      text: "#FFD700",
    },
    systemPrompt:
      "You are Count Dracula. Mysterious, eloquent, and slightly menacing—speak like a gothic vampire lord from Bram Stoker's novel.",
    sampleGreeting: "Welcome to my castle, child of the night...",
  },
  {
    id: "elizabeth",
    name: "Elizabeth Bennet",
    img: "https://upload.wikimedia.org/wikipedia/commons/5/59/PrideAndPrejudiceTitlePage.jpg",
    vibe: {
      primary: "#8A2BE2",
      secondary: "#4B0082",
      accent: "#FFD700",
      background: "#FFEFFF",
      text: "#24123A",
    },
    systemPrompt:
      "You are Elizabeth Bennet from Pride & Prejudice. Witty, independent, and elegant—converse in a sharp but polite manner, Regency-era style.",
    sampleGreeting: "How delightful to make your acquaintance.",
  },
  {
    id: "gatsby",
    name: "Jay Gatsby",
    img: "https://upload.wikimedia.org/wikipedia/commons/a/a0/TheGreatGatsby_1925jacket.jpeg",
    vibe: {
      primary: "#FFD700",
      secondary: "#4B0082",
      accent: "#8A2BE2",
      background: "#FFFBEA",
      text: "#693703",
    },
    systemPrompt:
      "You are Jay Gatsby from The Great Gatsby. Speak with mystery, charm, and longing for the unreachable, with 1920s slang.",
    sampleGreeting: "Old sport! Won't you join my splendid soirée?",
  },
];

// PUBLIC_INTERFACE
/**
 * LiteraryVibeChat - The main container component for LiteraryVibe Chat.
 * Features: Character selection, chat UI, OpenAI API integration, responsive design, optional text-to-speech.
 */
function LiteraryVibeChat() {
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
  const [theme, setTheme] = useState(CHARACTERS[0].vibe);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: CHARACTERS[0].sampleGreeting,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsOn, setTtsOn] = useState(false);
  const chatEndRef = useRef(null);

  // Optionally use localStorage/API keys here

  useEffect(() => {
    setTheme(selectedCharacter.vibe);
    setMessages([
      { role: "assistant", text: selectedCharacter.sampleGreeting },
    ]);
    setInput("");
  }, [selectedCharacter]);

  useEffect(() => {
    // Scroll to bottom on message send
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    // Optionally auto-play text-to-speech if ttsOn and the latest message is from assistant
    if (
      ttsOn &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      "speechSynthesis" in window
    ) {
      const utterance = new window.SpeechSynthesisUtterance(
        messages[messages.length - 1].text
      );
      utterance.pitch = 1.08;
      utterance.rate = 1;
      utterance.voice = findEnglishVoice();
      window.speechSynthesis.speak(utterance);
    }
  }, [messages, ttsOn]);

  // Helper: Select an English voice for TTS
  function findEnglishVoice() {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prefer UK female, fallback to any English, else null
    return (
      voices.find(
        (v) =>
          v.lang.startsWith("en-") &&
          v.name.toLowerCase().includes("female")
      ) ||
      voices.find((v) => v.lang.startsWith("en-")) ||
      null
    );
  }

  // PUBLIC_INTERFACE
  // Handle sending a user message and fetching response from OpenAI
  async function handleSend(e) {
    e && e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setMessages((old) => [...old, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    // Build OpenAI API chat history
    const openaiMessages = [
      { role: "system", content: selectedCharacter.systemPrompt },
      ...messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) =>
          m.role === "user"
            ? { role: "user", content: m.text }
            : { role: "assistant", content: m.text }
        ),
      { role: "user", content: userMsg },
    ];

    // Replace with your OpenAI API key or use environment variable/serverless function
    const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "<YOUR_OPENAI_API_KEY>";
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "<YOUR_OPENAI_API_KEY>") {
      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          text: "OpenAI API key missing. Please configure the API key to enable chat.",
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: openaiMessages,
          max_tokens: 160,
          temperature: 0.8,
        }),
      });
      const data = await response.json();
      if (data && data.choices && data.choices[0]?.message?.content) {
        setMessages((old) => [
          ...old,
          { role: "assistant", text: data.choices[0].message.content.trim() },
        ]);
      } else {
        setMessages((old) => [
          ...old,
          {
            role: "assistant",
            text: "Sorry, I am unable to respond right now.",
          },
        ]);
      }
    } catch (error) {
      setMessages((old) => [
        ...old,
        { role: "assistant", text: "Error connecting to OpenAI." },
      ]);
    }
    setIsLoading(false);
  }

  // Styling
  const containerStyle = {
    background: theme.background,
    minHeight: "100vh",
    color: theme.text,
    transition: "background 0.3s, color 0.3s",
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  };
  const sidebarStyle = {
    minWidth: 110,
    maxWidth: 135,
    background: theme.primary,
    color: theme.accent,
    borderRight: `2px solid ${theme.secondary}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 24,
    gap: 26,
    zIndex: 2,
  };
  const mainPanelStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  };
  const chatWindowStyle = {
    flex: 1,
    padding: "0 0 20px 0",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    background: "transparent",
    maxHeight: "calc(100vh - 108px)",
  };
  const messageBubble = (role) => ({
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    background:
      role === "user"
        ? theme.accent
        : `linear-gradient(135deg, ${theme.secondary} 70%, ${theme.accent} 100%)`,
    color: role === "user" ? theme.primary : theme.white || "#fff",
    padding: "13px 17px",
    borderRadius: "1.15em",
    margin: "9px 0",
    maxWidth: "81%",
    fontSize: "1rem",
    boxShadow:
      role === "user"
        ? "0 1px 3px rgba(75,0,130,0.13)"
        : "0 1px 5px rgba(138,43,226,0.09)",
    border:
      role === "assistant"
        ? `1.5px solid ${theme.accent}`
        : `1.5px solid transparent`,
    wordBreak: "break-word",
    whiteSpace: "pre-line",
    position: "relative",
  });
  const chatInputBarStyle = {
    display: "flex",
    gap: 8,
    borderTop: `1.5px solid ${theme.secondary}`,
    background: theme.background,
    padding: 10,
    paddingRight: 16,
    alignItems: "stretch",
  };

  // PUBLIC_INTERFACE
  // Component rendering
  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          minHeight: "100vh",
        }}
      >
        {/* Character sidebar */}
        <aside style={sidebarStyle}>
          {CHARACTERS.map((character) => (
            <button
              key={character.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: selectedCharacter.id === character.id
                  ? theme.accent
                  : theme.secondary,
                border: selectedCharacter.id === character.id
                  ? `2px solid ${theme.primary}`
                  : "2px solid transparent",
                borderRadius: "50%",
                width: 64,
                height: 64,
                outline: "none",
                margin: "0 0 6px 0",
                boxShadow:
                  selectedCharacter.id === character.id
                    ? `0 0 8px 2px ${theme.accent}30`
                    : "none",
                cursor: "pointer",
                padding: 0,
                transition: "box-shadow 0.2s, border 0.2s",
              }}
              title={character.name}
              onClick={() => setSelectedCharacter(character)}
              aria-label={`Chat with ${character.name}`}
            >
              <img
                src={character.img}
                alt={character.name}
                style={{
                  width: 46,
                  height: 46,
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: "2.5px solid #FFF",
                  marginBottom: 3,
                }}
              />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.68rem",
                  color:
                    selectedCharacter.id === character.id
                      ? theme.primary
                      : theme.accent,
                  letterSpacing: 0.01,
                }}
              >
                {character.name.split(" ")[0]}
              </span>
            </button>
          ))}
          <div style={{flex: 1}} />
          <button
            onClick={() => setTtsOn((v) => !v)}
            style={{
              marginTop: 28,
              marginBottom: 12,
              background: ttsOn ? theme.accent : theme.secondary,
              color: ttsOn ? theme.primary : theme.accent,
              border: ttsOn ? `2px solid ${theme.primary}` : "2px solid transparent",
              borderRadius: 18,
              minWidth: 30,
              padding: "5px 10px",
              fontSize: "1.04em",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            aria-label={`Toggle text-to-speech ${ttsOn ? 'on' : 'off'}`}
            title="Text-to-Speech"
          >
            <span role="img" aria-label="speaker">
              🔊
            </span>
          </button>
        </aside>
        {/* Main chat panel */}
        <main style={mainPanelStyle}>
          {/* Header */}
          <header
            style={{
              height: 54,
              padding: "0 22px",
              background: theme.primary,
              borderBottom: `1.5px solid ${theme.secondary}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              position: "sticky",
              top: 0,
              zIndex: 9,
            }}
          >
            <img
              src={selectedCharacter.img}
              alt={selectedCharacter.name}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: `2px solid ${theme.accent}`,
                objectFit: "cover",
                marginRight: 6,
              }}
            />
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1.23rem",
                  color: theme.accent,
                }}
              >
                {selectedCharacter.name}
              </div>
              <div
                style={{
                  fontSize: "0.93rem",
                  color: theme.white || "#fff",
                  opacity: 0.72,
                  marginTop: -2,
                }}
              >
                LiteraryVibe Chat
              </div>
            </div>
            <div style={{flex: 1}} />
            <span
              style={{
                color: theme.accent,
                opacity: 0.95,
                fontWeight: 600,
                fontSize: 20,
                fontFamily: "serif",
              }}
              title="Powered by OpenAI"
            >
              🤖
            </span>
          </header>
          {/* Chat window */}
          <section style={chatWindowStyle}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", padding: "17px 2vw 4px 2vw" }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={messageBubble(m.role)}
                  aria-label={m.role === "user" ? "You" : selectedCharacter.name}
                >
                  {m.role === "assistant" && (
                    <span
                      style={{
                        fontWeight: 700,
                        color: theme.accent,
                        marginRight: 5,
                        fontSize: "0.98em",
                        fontFamily: "serif",
                        opacity: 0.91,
                      }}
                    >
                      {selectedCharacter.name}:
                    </span>
                  )}
                  {m.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </section>
          {/* Chat input bar */}
          <footer style={chatInputBarStyle}>
            <form
              onSubmit={handleSend}
              style={{ display: "flex", gap: 8, flex: 1 }}
              aria-label="Send chat message"
            >
              <input
                aria-label="Type your message"
                style={{
                  flex: 1,
                  padding: "11px 14px",
                  borderRadius: 11,
                  border: `1.5px solid ${theme.secondary}`,
                  outline: "none",
                  fontSize: "1.1rem",
                  background: "#fff",
                  color: theme.primary,
                  boxShadow: "0 1px 3px rgba(75,0,130,0.04)",
                  marginRight: 2,
                  fontFamily: "inherit",
                  transition: "border 0.2s",
                }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder={`Chat with ${selectedCharacter.name}...`}
                autoFocus
                maxLength={320}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  background: theme.accent,
                  color: theme.primary,
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: 10,
                  fontSize: "1.04em",
                  padding: "0 18px",
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading || !input.trim() ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
                aria-label="Send message"
              >
                <span role="img" aria-label="send">
                  ➤
                </span>
              </button>
            </form>
          </footer>
        </main>
      </div>
      {/* Responsive style injection */}
      <style>
        {`
          @media (max-width: 870px) {
            aside {
              min-width: 60px !important;
              max-width: 66px !important;
              padding-top: 7px !important;
              padding-bottom: 6px !important;
            }
            aside button span {
              font-size: 0.69rem !important;
            }
            main header {
              font-size: 1.06em;
              padding-left: 5px !important;
            }
          }
          @media (max-width: 650px) {
            .lv-main-container-flex {
              flex-direction: column !important;
            }
            aside {
              flex-direction: row !important;
              min-width: 100% !important;
              max-width: 100vw !important;
              border-right: none !important;
              border-bottom: 2px solid ${theme.secondary} !important;
              height: 64px !important;
              width: 100% !important;
              overflow-x: auto;
              gap: 9px !important;
            }
            main header {
              font-size: 1em !important;
            }
            section {
              padding-top: 3px !important;
              padding-bottom: 6px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default LiteraryVibeChat;
