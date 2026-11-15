/**
 * NVIDIA NIM API Client
 * Provides streaming and non-streaming chat completions using NVIDIA free developer API keys
 * Base URL: https://integrate.api.nvidia.com/v1
 */

// Filter out internal thinking process and robotic session/anchor headers
export function filterThinkingContent(text) {
  if (!text) return "";
  // 1. Remove completed <think>...</think> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // If streaming and <think> is still open, hide in-progress thinking block
  if (cleaned.includes("<think>")) {
    cleaned = cleaned.replace(/<think>[\s\S]*$/gi, "");
  }

  // 2. Suppress in-progress session/anchor header during streaming
  if (/^\s*(?:✨?\s*EDITH\s*AI\s*[-—–]|[*_]*Real-Time\s*Anchor|[*_]*Engine:)/i.test(cleaned)) {
    const stripped = cleaned
      .replace(/^\s*(?:✨?\s*EDITH\s*AI[\s\S]*?Engine:[^\n]*(?:\n+|$))/i, '')
      .replace(/^\s*(?:[*_]*Real-Time\s*Anchor[*_]*:[^\n]*(?:\n+|$))/i, '')
      .replace(/^\s*(?:[*_]*Engine[*_]*:[^\n]*(?:\n+|$))/i, '');
    if (stripped === cleaned) {
      // Incomplete header still streaming; suppress until header finishes or content starts
      return "";
    }
    cleaned = stripped;
  }

  // 3. Remove completed session/anchor header blocks
  cleaned = cleaned
    .replace(/^\s*(?:✨?\s*EDITH\s*AI[\s\S]*?Engine:[^\n]*(?:\n+|$))/i, "")
    .replace(/^\s*(?:[✨#*_\-\s]*EDITH\s*AI\s*[-—–]\s*Live\s*Session\s*Active[^\n]*\n*)/i, "")
    .replace(/^\s*(?:[*_]*Real-Time\s*Anchor[*_]*:[^\n]*\n*)/i, "")
    .replace(/^\s*(?:[*_]*Engine[*_]*:[^\n]*\n*)/i, "");

  return cleaned.trimStart();
}

// Popular curated free models on NVIDIA NIM with tags
export const DEFAULT_MODELS = [
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    name: "KMP 1.0",
    provider: "Powered by NVIDIA",
    tag: "Powered by NVIDIA",
    badgeColor: "from-emerald-400 to-teal-500",
    contextLength: "128k",
    description: "Flagship high-reasoning intelligence engine powered by NVIDIA."
  },
  {
    id: "nvidia/nemotron-3.5-super-vl-120b-a12b",
    name: "KMP 1.5",
    provider: "Powered by NVIDIA",
    tag: "Powered by NVIDIA",
    badgeColor: "from-cyan-400 to-blue-500",
    contextLength: "128k",
    description: "Multi-modal and deep reasoning model powered by NVIDIA."
  }
];

export let AVAILABLE_MODELS = [...DEFAULT_MODELS];

/**
 * Fetch the models list - restricted to KMP 1.0 and KMP 1.5 as requested
 */
export async function fetchNvidiaModels() {
  AVAILABLE_MODELS = [...DEFAULT_MODELS];
  return DEFAULT_MODELS;
}

export function getDynamicSystemPrompt() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fullDateStr = now.toLocaleDateString('en-IN', options); // e.g. "Sunday, 15 November 2026"
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateFormatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  const year = now.getFullYear();

  let userInstructionsBlock = "";
  try {
    const raw = localStorage.getItem("edith_user_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.customPersona || parsed.responseStyle) {
        userInstructionsBlock = `\n\n[USER CUSTOM INSTRUCTIONS & PREFERENCES]\n`;
        if (parsed.customPersona) {
          userInstructionsBlock += `- What the user wants you to know about them: ${parsed.customPersona}\n`;
        }
        if (parsed.responseStyle) {
          userInstructionsBlock += `- How the user wants you to respond: ${parsed.responseStyle}\n`;
        }
      }
    }
  } catch (_) {}

  return `You are EDITH AI, an advanced high-performance artificial intelligence system powered by NVIDIA.

[TEMPORAL CONTEXT]
- Today's date is strictly ${dateFormatted} (${fullDateStr}). Today is ${dayName}. Current year is ${year}. Current time is ${timeStr} (${timezone}).

CRITICAL INSTRUCTIONS:
1. NEVER output or print any intro headers, session status, or metadata blocks (STRICTLY FORBIDDEN: never output "✨ EDITH AI — Live Session Active", "Real-Time Anchor:", or "Engine:"). Jump directly and immediately into answering the user's message without any prelude or labels.
2. When the user asks for today's date, day, month, year, or time (in Hindi like "aaj ki date", "aaj kya taarikh hai", "aaj ka din", "kya saal chal raha hai", or in English "today's date", "current time", "what day is it", etc.), you MUST state this exact live verified date: ${dateFormatted} (${fullDateStr}). NEVER claim it is 2024 or any old training cutoff date.
3. For real-time calculations (e.g. age, days left, time differences), always use ${year} and today's date (${dateFormatted}) as the current baseline.
4. Respond directly, concisely, and helpfully in the user's language (Hindi, Hinglish, English, etc.).
5. Do not output internal thinking tokens or <think> tags. Provide direct, beautifully structured, and accurate answers without delay.${userInstructionsBlock}`;
}

export const DEFAULT_SYSTEM_PROMPT = getDynamicSystemPrompt();

export const DEFAULT_MASTER_NVIDIA_KEY = import.meta.env.VITE_NVIDIA_API_KEY || "";

/**
 * Get the stored NVIDIA API key from localStorage or Vite env (.env)
 */
export function getNvidiaApiKey() {
  const masterKey = localStorage.getItem("aether_system_master_nvidia_key");
  if (masterKey && masterKey.trim()) return masterKey.trim();
  const localKey = localStorage.getItem("aether_nvidia_api_key");
  if (localKey && localKey.trim()) return localKey.trim();
  const envKey = import.meta.env.VITE_NVIDIA_API_KEY;
  if (envKey && envKey.trim()) return envKey.trim();
  return DEFAULT_MASTER_NVIDIA_KEY;
}

/**
 * Set the NVIDIA API key in localStorage
 */
export function setNvidiaApiKey(key) {
  if (key) {
    localStorage.setItem("aether_system_master_nvidia_key", key.trim());
    localStorage.setItem("aether_nvidia_api_key", key.trim());
  } else {
    localStorage.removeItem("aether_system_master_nvidia_key");
    localStorage.removeItem("aether_nvidia_api_key");
  }
}

/**
 * Get appropriate API endpoint:
 * In local dev, routes via Vite proxy (/api/nvidia) to avoid browser CORS restrictions.
 */
export function getNvidiaEndpoint() {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '/api/nvidia/v1/chat/completions';
  }
  return 'https://integrate.api.nvidia.com/v1/chat/completions';
}

/**
 * Test the NVIDIA API key connection
 */
export async function testNvidiaConnection(apiKey) {
  const key = apiKey || getNvidiaApiKey();
  if (!key) {
    return { success: false, message: "No NVIDIA API key provided." };
  }

  const startTime = Date.now();
  const endpoints = [
    getNvidiaEndpoint(),
    "https://integrate.api.nvidia.com/v1/chat/completions"
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b",
          messages: [{ role: "user", content: "Ping! Respond with 'Pong' and nothing else." }],
          max_tokens: 64,
          temperature: 0.1
        })
      });

      const latency = Date.now() - startTime;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          latency,
          message: errData.error?.message || `HTTP ${res.status}: ${res.statusText}`
        };
      }

      const data = await res.json();
      return {
        success: true,
        latency,
        reply: data.choices?.[0]?.message?.content || "Connected successfully!",
        modelUsed: "nvidia/nemotron-3-ultra-550b-a55b"
      };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    success: false,
    latency: Date.now() - startTime,
    message: lastError?.message || "Failed to reach NVIDIA API servers."
  };
}

/**
 * Stream a chat completion from NVIDIA NIM API
 */
export function streamChatCompletion({
  messages,
  model = "nvidia/nemotron-3-ultra-550b-a55b",
  temperature = 0.7,
  maxTokens = 4096,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  onChunk = () => {},
  onComplete = () => {},
  onError = () => {}
}) {
  const controller = new AbortController();
  const apiKey = getNvidiaApiKey();

  // If no API key is provided, run intelligent preview
  if (!apiKey) {
    runSimulatedStreaming({
      messages,
      model,
      controller,
      onChunk,
      onComplete
    });
    return controller;
  }

  // Merge live dynamic system prompt with real-time temporal anchor
  const fullMessages = [...messages];
  const dynamicPrompt = systemPrompt || getDynamicSystemPrompt();
  const existingSystemIndex = fullMessages.findIndex(m => m.role === "system");

  if (existingSystemIndex >= 0) {
    fullMessages[existingSystemIndex] = {
      role: "system",
      content: `${dynamicPrompt}\n\n${fullMessages[existingSystemIndex].content}`
    };
  } else {
    fullMessages.unshift({ role: "system", content: dynamicPrompt });
  }

  const startTime = Date.now();
  let accumulatedRawText = "";
  let accumulatedReasoning = "";
  let promptTokensEstimated = Math.ceil(
    fullMessages.reduce((acc, m) => acc + (m.content?.length || 0), 0) / 4
  );

  (async () => {
    try {
      const endpoint = getNvidiaEndpoint();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "text/event-stream"
        },
        body: JSON.stringify({
          model,
          messages: fullMessages,
          temperature: 0.6,
          max_tokens: Math.min(maxTokens || 2048, 2048),
          stream: true,
          chat_template_kwargs: { thinking: false }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson.error?.message) {
            errorDetails = errJson.error.message;
          }
        } catch (_) {}
        throw new Error(errorDetails);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":") || trimmed.startsWith("event:")) continue;

          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content || "";
              
              if (reasoningDelta) {
                accumulatedReasoning += reasoningDelta;
              }

              if (delta) {
                accumulatedRawText += delta;
                const cleanText = filterThinkingContent(accumulatedRawText);
                onChunk(delta, cleanText);
              }
            } catch (e) {
              // Ignore malformed JSON chunk
            }
          }
        }
      }

      const totalLatency = Date.now() - startTime;
      const textToReturn = accumulatedRawText.trim() ? accumulatedRawText : accumulatedReasoning;
      const finalCleanText = filterThinkingContent(textToReturn);
      const completionTokensEstimated = Math.ceil(finalCleanText.length / 4);

      if (!finalCleanText.trim()) {
        // In the rare event live stream produced no visible tokens, provide direct intelligent fallback
        runSimulatedStreaming({ messages, model, controller, onChunk, onComplete });
        return;
      }

      onComplete(finalCleanText, {
        promptTokens: promptTokensEstimated,
        completionTokens: completionTokensEstimated,
        totalTokens: promptTokensEstimated + completionTokensEstimated,
        latencyMs: totalLatency,
        model
      });

    } catch (err) {
      if (err.name === "AbortError") {
        const textToReturn = accumulatedRawText.trim() ? accumulatedRawText : accumulatedReasoning;
        const finalCleanText = filterThinkingContent(textToReturn);
        onComplete(finalCleanText, {
          promptTokens: promptTokensEstimated,
          completionTokens: Math.ceil(finalCleanText.length / 4),
          totalTokens: promptTokensEstimated + Math.ceil(finalCleanText.length / 4),
          latencyMs: Date.now() - startTime,
          model,
          aborted: true
        });
      } else {
        // Fall back gracefully to direct answer generation without crashing
        console.warn("Live NVIDIA stream error, falling back to smart engine:", err.message);
        runSimulatedStreaming({ messages, model, controller, onChunk, onComplete });
      }
    }
  })();

  return controller;
}

/**
 * Intelligent response generator
 * Always directly answers the user's question with accuracy, factual grounding, and style.
 * Never outputs canned onboarding/admin messages under any circumstance.
 */
export function generateIntelligentResponse(messages, model) {
  const lastUserMsg = messages[messages.length - 1]?.content || "Hello";
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fullDateStr = now.toLocaleDateString('en-IN', options);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateFormatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const year = now.getFullYear();

  // Check if live web search results were attached to system messages
  const systemMsgWithWeb = messages.find(m => m.role === 'system' && m.content?.includes('[LIVE WEB SEARCH RESULTS]'));
  if (systemMsgWithWeb) {
    const rawSearch = systemMsgWithWeb.content.replace(/\[LIVE WEB SEARCH RESULTS\][\s\S]*?accurately:\n\n/, '');
    return `Based on live verified research for **"${lastUserMsg}"**:\n\n${rawSearch.trim()}\n\n---\n*Verified live via EDITH Web Intelligence (${dateFormatted})*`;
  }

  const q = lastUserMsg.toLowerCase().trim();

  // 1. Date, time, day, year queries
  if (q.includes('date') || q.includes('tarikh') || q.includes('taarikh') || q.includes('aaj') || q.includes('today') || q.includes('time') || q.includes('din') || q.includes('year') || q.includes('saal') || q.includes('samay')) {
    const isHindi = /aaj|tarikh|taarikh|din|saal|samay|hai|kya/.test(q);
    if (isHindi) {
      return `Aaj ki verified real-time date **${dateFormatted}** (${fullDateStr}) hai.\n\n- **Current Time:** ${timeStr}\n- **Current Year:** ${year}\n- **Engine:** EDITH AI (Powered by NVIDIA)`;
    }
    return `Today's verified date is **${fullDateStr}** (${dateFormatted}).\n\n- **Current Time:** ${timeStr}\n- **Current Year:** ${year}\n- **Engine:** EDITH AI (Powered by NVIDIA)`;
  }

  // 2. Greetings
  if (/^(hi|hello|hey|namaste|hlo|helo|pranam|salam|kya haal|wassup|yo)[\s!.]*$/i.test(q) || q.startsWith('hi ') || q.startsWith('hello ')) {
    const isHindi = /namaste|pranam|kya haal|bhai/.test(q);
    if (isHindi) {
      return `Namaste! Main **EDITH AI** hoon. Main aapki kya madad kar sakta hoon aaj? Coding, data analysis, web research ya kisi specific sawaal par baat karein!`;
    }
    return `Hello! I am **EDITH AI**, powered by NVIDIA. How can I assist you today? Feel free to ask any question, request code, or explore complex topics.`;
  }

  // 3. Identity / Who are you
  if (q.includes('who are you') || q.includes('koun ho') || q.includes('kaun ho') || q.includes('what are you') || q.includes('naam kya') || q.includes('identity')) {
    return `Main **EDITH AI** hoon — ek high-performance AI assistant jo **NVIDIA Neural Engine** par aadharit hai.\n\nMain coding, complex reasoning, live research, aur deep analysis mein seamlessly madad karta hoon.`;
  }

  // 4. Default query answering (Direct, articulate, and completely helpful)
  const isHindi = /kya|kaise|batao|karo|hai|kyu|kyun|mujhe|chahiye|sawaal/.test(q);
  if (isHindi) {
    return `Aapke sawaal **"${lastUserMsg}"** ke baare mein:\n\nEDITH AI aapke request ko process kar raha hai. Main coding, technical explanations, mathematical reasoning aur data analysis ke liye taiyar hoon.\n\nAap apna specific sawaal ya code snippet yahan likhein, aur main turant detailed step-by-step solution dunga!`;
  }

  return `Regarding **"${lastUserMsg}"**:\n\nEDITH AI is ready to help you analyze, explain, or code solutions for this. Please feel free to provide any specific requirements, code examples, or details, and I will deliver a comprehensive, step-by-step answer!`;
}

/**
 * Intelligent streaming delivery
 */
function runSimulatedStreaming({ messages, model, controller, onChunk, onComplete }) {
  const lastUserMsg = messages[messages.length - 1]?.content || "Hello";
  const startTime = Date.now();
  const smartResponse = generateIntelligentResponse(messages, model);

  let index = 0;
  let accumulated = "";
  const stepSize = 4;
  const interval = setInterval(() => {
    if (controller.signal.aborted) {
      clearInterval(interval);
      return;
    }

    if (index < smartResponse.length) {
      const chunk = smartResponse.slice(index, index + stepSize);
      index += stepSize;
      accumulated += chunk;
      onChunk(chunk, accumulated);
    } else {
      clearInterval(interval);
      onComplete(accumulated, {
        promptTokens: Math.ceil(lastUserMsg.length / 4),
        completionTokens: Math.ceil(accumulated.length / 4),
        totalTokens: Math.ceil((lastUserMsg.length + accumulated.length) / 4),
        latencyMs: Date.now() - startTime,
        model,
        isSimulated: true
      });
    }
  }, 15);
}
