import React, { useState, useMemo, useEffect } from 'react';
import { 
  Code, 
  Play, 
  Eye, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Sparkles,
  X,
  FileCode
} from 'lucide-react';

// Languages that can be live-rendered in the interactive browser sandbox
const PREVIEWABLE_LANGUAGES = ['html', 'htm', 'jsx', 'tsx', 'javascript', 'js', 'typescript', 'ts', 'react', 'svg'];

export default function CodeArtifactViewer({ language = 'javascript', code = '', id = 'code', isStreaming = false }) {
  const cleanLang = (language || 'text').toLowerCase().replace(/^language-/, '');
  
  const canPreview = useMemo(() => {
    if (PREVIEWABLE_LANGUAGES.includes(cleanLang)) return true;
    if (code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<svg')) return true;
    if (code.includes('useState') || code.includes('export default') || /<[A-Z][A-Za-z0-9_]*\s*[\/>]/.test(code)) return true;
    return false;
  }, [cleanLang, code]);

  const [activeTab, setActiveTab] = useState(() => {
    if (isStreaming) return 'code';
    if (canPreview && (['html', 'htm', 'svg', 'jsx', 'tsx', 'react'].includes(cleanLang) || code.includes('return'))) {
      return 'preview';
    }
    return 'code';
  });

  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Automatically activate live preview when streaming completes
  useEffect(() => {
    if (!isStreaming && canPreview && (['html', 'htm', 'svg', 'jsx', 'tsx', 'react'].includes(cleanLang) || code.includes('return') || code.includes('export default'))) {
      setActiveTab('preview');
    }
  }, [isStreaming, canPreview, cleanLang, code]);

  // Handle Code Copy
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine file extension for direct file download
  const getExtension = () => {
    switch (cleanLang) {
      case 'html':
      case 'htm':
        return 'html';
      case 'jsx':
      case 'react':
        return 'jsx';
      case 'tsx':
        return 'tsx';
      case 'javascript':
      case 'js':
        return 'js';
      case 'typescript':
      case 'ts':
        return 'ts';
      case 'python':
      case 'py':
        return 'py';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'sql':
        return 'sql';
      case 'svg':
        return 'svg';
      case 'markdown':
      case 'md':
        return 'md';
      case 'bash':
      case 'sh':
        return 'sh';
      case 'c':
        return 'c';
      case 'cpp':
        return 'cpp';
      case 'java':
        return 'java';
      default:
        return 'txt';
    }
  };

  // Handle Direct File Download
  const handleDownload = () => {
    const ext = getExtension();
    const fileName = `edith-artifact-${id || Date.now()}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  // Prepare Sandboxed HTML for Preview with TypeScript + React 18 + Lucide Icons + Tailwind
  const previewHtml = useMemo(() => {
    if (!canPreview) return '';

    const isSvg = cleanLang === 'svg' || (code.trim().startsWith('<svg') && code.trim().endsWith('</svg>'));
    const isHtmlDoc = code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<body');
    const isReact = !isSvg && !isHtmlDoc;

    if (isSvg) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #08090d; padding: 20px; box-sizing: border-box; }
    svg { max-width: 100%; max-height: 80vh; filter: drop-shadow(0 10px 25px rgba(0,0,0,0.5)); }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }

    if (isReact) {
      let processed = code;

      // Extract all imported icons (from lucide-react or any other library)
      const lucideImports = new Set([
        'Plus', 'Minus', 'X', 'Check', 'Search', 'Sparkles', 'Download', 'Trash', 'Trash2', 
        'Heart', 'RotateCcw', 'RefreshCw', 'ChevronRight', 'ChevronLeft', 'ChevronDown', 
        'ChevronUp', 'Play', 'Pause', 'Eye', 'EyeOff', 'Copy', 'User', 'Settings', 'Lock', 
        'Unlock', 'Bell', 'Calendar', 'Clock', 'Mail', 'Phone', 'Camera', 'Video', 'Volume2', 
        'VolumeX', 'Sun', 'Moon', 'Star', 'Share', 'Share2', 'Filter', 'Sliders', 'Activity', 
        'BarChart', 'PieChart', 'Cpu', 'Layers', 'Grid', 'List', 'Folder', 'File', 'Upload', 
        'ExternalLink', 'Info', 'AlertCircle', 'AlertTriangle', 'Zap', 'Flame', 'Compass', 
        'Globe', 'Navigation', 'MapPin', 'ShoppingBag', 'ShoppingCart', 'CreditCard', 'DollarSign',
        'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Send', 'Terminal'
      ]);

      const importMatches = [...processed.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g)];
      for (const m of importMatches) {
        const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
        names.forEach(n => lucideImports.add(n));
      }

      // Remove all module imports safely
      processed = processed.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
      processed = processed.replace(/import\s+['"][^'"]+['"];?/g, '');

      // Clean TypeScript interfaces and type definitions
      processed = processed.replace(/interface\s+[A-Za-z0-9_]+(?:\s*<[^>]*>)?(?:\s+extends\s+[^{]+)?\s*\{[\s\S]*?\n\}/g, '');
      processed = processed.replace(/type\s+[A-Za-z0-9_]+(?:\s*<[^>]*>)?\s*=\s*[^;]+;/g, '');

      // Identify main component name
      let componentName = 'App';
      const funcMatch = processed.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
      if (funcMatch) {
        componentName = funcMatch[1];
        processed = processed.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/, 'function $1');
      } else {
        const namedExport = processed.match(/export\s+default\s+([A-Za-z0-9_]+);?/);
        if (namedExport) {
          componentName = namedExport[1];
          processed = processed.replace(/export\s+default\s+([A-Za-z0-9_]+);?/, '');
        } else {
          const anonExport = processed.match(/export\s+default\s+(?:\(\)\s*=>|function\s*\(\))/);
          if (anonExport) {
            componentName = 'App';
            processed = processed.replace(/export\s+default/, 'const App =');
          } else {
            const capMatch = processed.match(/(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)/);
            if (capMatch) componentName = capMatch[1];
          }
        }
      }
      processed = processed.replace(/export\s+/g, '');

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.10/babel.min.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <style>
    body { margin: 0; padding: 1.25rem; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #08090d; color: #f8fafc; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error-boundary" style="display:none; color:#fca5a5; background:#450a0a; border:1px solid #991b1b; padding:12px; border-radius:10px; font-family:monospace; font-size:12px; margin-top:12px; white-space:pre-wrap;"></div>

  <script>
    // Universal Error Handler
    window.onerror = function(msg, url, line, col, err) {
      var errBox = document.getElementById('error-boundary');
      if (errBox) {
        errBox.style.display = 'block';
        errBox.innerHTML = '<div style="font-weight:bold;margin-bottom:4px;">⚠️ Live Preview Notice:</div>' + (err ? err.message : msg);
      }
      return false;
    };

    // Universal Icon Component Generator
    window.createIcon = function(name) {
      return function DynamicIcon(props) {
        props = props || {};
        var size = props.size || 18;
        var strokeWidth = props.strokeWidth || 2;
        var className = props.className || 'w-4 h-4 inline-block';
        
        var iconDict = {
          Plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
          Minus: '<line x1="5" y1="12" x2="19" y2="12"></line>',
          X: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
          Check: '<polyline points="20 6 9 17 4 12"></polyline>',
          Search: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
          Sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>',
          Download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
          Trash: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
          Trash2: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>',
          Heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>',
          RotateCcw: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>',
          RefreshCw: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>',
          ChevronRight: '<polyline points="9 18 15 12 9 6"></polyline>',
          ChevronLeft: '<polyline points="15 18 9 12 15 6"></polyline>',
          ChevronDown: '<polyline points="6 9 12 15 18 9"></polyline>',
          ChevronUp: '<polyline points="18 15 12 9 6 15"></polyline>',
          Play: '<polygon points="5 3 19 12 5 21 5 3"></polygon>',
          Pause: '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>',
          Eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>',
          Copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
          User: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
          Settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>'
        };

        var path = iconDict[name] || '<circle cx="12" cy="12" r="7"></circle><path d="M12 9v6"></path><path d="M9 12h6"></path>';
        return React.createElement('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: className,
          dangerouslySetInnerHTML: { __html: path },
          ...props
        });
      };
    };

    window.Lucide = new Proxy({}, {
      get: function(t, p) { return window.createIcon(String(p)); }
    });

    // Mock Framer Motion
    window.motion = new Proxy({}, {
      get: function(t, tag) {
        return function MotionProxy(props) {
          props = props || {};
          var p = Object.assign({}, props);
          delete p.initial; delete p.animate; delete p.exit; delete p.transition;
          delete p.whileHover; delete p.whileTap; delete p.whileFocus;
          return React.createElement(tag, p);
        };
      }
    });
    window.AnimatePresence = function(props) { return props.children; };
  </script>

  <script type="text/babel" data-presets="typescript,react">
    const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;
    const { ${Array.from(lucideImports).join(', ')} } = window.Lucide;
    
    try {
      ${processed}

      const TargetComp = typeof ${componentName} !== 'undefined' 
        ? ${componentName} 
        : (typeof App !== 'undefined' ? App : null);

      if (TargetComp) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(TargetComp));
      } else {
        document.getElementById('root').innerHTML = '<div style="padding:20px; color:#94a3b8; text-align:center;">Component ready.</div>';
      }
    } catch(err) {
      console.error(err);
      window.onerror(err.message || String(err), '', 0, 0, err);
    }
  </script>
</body>
</html>`;
    }

    // Standard HTML Document or Snippet
    let processedHtml = code;
    const usesTailwind = /class(?:Name)?=["'][^"']*\b(?:bg-|text-|flex|grid|p-|m-|rounded|border)\b/i.test(processedHtml);

    const polyfillHead = `
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${usesTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  <script>
    // Safe In-Memory localStorage mock to prevent DOMException in sandboxed iframes
    try {
      var test = window.localStorage;
      if (!test) throw new Error();
      localStorage.setItem('__test', '1');
      localStorage.removeItem('__test');
    } catch (e) {
      var store = {};
      window.localStorage = {
        getItem: function(k) { return store[k] || null; },
        setItem: function(k, v) { store[k] = String(v); },
        removeItem: function(k) { delete store[k]; },
        clear: function() { store = {}; }
      };
      window.sessionStorage = window.localStorage;
    }

    // Safe AudioContext & SpeechSynthesis mocks for sandboxed iframes
    if (!window.AudioContext && !window.webkitAudioContext) {
      window.AudioContext = function() {
        return {
          createOscillator: function() { return { connect: function(){}, start: function(){}, stop: function(){} }; },
          createGain: function() { return { connect: function(){}, gain: { value: 1 } }; },
          destination: {}
        };
      };
      window.webkitAudioContext = window.AudioContext;
    }

    // Ensure DOMContentLoaded and load listeners always fire in srcdoc
    (function() {
      var ready = false;
      function fire() {
        if (ready) return;
        ready = true;
        try {
          window.dispatchEvent(new Event('DOMContentLoaded'));
          window.dispatchEvent(new Event('load'));
        } catch (_) {}
      }
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(fire, 50);
      } else {
        document.addEventListener('readystatechange', function() {
          if (document.readyState === 'complete' || document.readyState === 'interactive') fire();
        });
      }
      var origAdd = window.addEventListener;
      window.addEventListener = function(type, listener, opt) {
        if ((type === 'DOMContentLoaded' || type === 'load') && (document.readyState === 'complete' || document.readyState === 'interactive')) {
          setTimeout(listener, 20);
        }
        return origAdd.call(window, type, listener, opt);
      };
      var origDocAdd = document.addEventListener;
      document.addEventListener = function(type, listener, opt) {
        if (type === 'DOMContentLoaded' && (document.readyState === 'complete' || document.readyState === 'interactive')) {
          setTimeout(listener, 20);
        }
        return origDocAdd.call(document, type, listener, opt);
      };
    })();
  </script>
`;

    const errorBanner = `
  <div id="edith-sandbox-error" style="display:none;position:fixed;bottom:8px;left:8px;right:8px;z-index:999999;background:#450a0a;border:1px solid #ef4444;color:#fca5a5;padding:10px 14px;border-radius:8px;font-family:monospace;font-size:12px;box-shadow:0 10px 25px rgba(0,0,0,0.5);"></div>
  <script>
    window.onerror = function(msg, url, line, col, err) {
      var b = document.getElementById('edith-sandbox-error');
      if (b) {
        b.style.display = 'block';
        b.innerHTML = '<strong>Preview Notice:</strong> ' + (err ? err.message : msg);
      }
      return false;
    };
  </script>
`;

    if (/<head[^>]*>/i.test(processedHtml)) {
      processedHtml = processedHtml.replace(/<head[^>]*>/i, '$&' + polyfillHead);
    } else if (/<html[^>]*>/i.test(processedHtml)) {
      processedHtml = processedHtml.replace(/<html[^>]*>/i, '$&<head>' + polyfillHead + '</head>');
    } else {
      processedHtml = `<!DOCTYPE html><html><head>${polyfillHead}</head><body>${processedHtml}</body></html>`;
    }

    if (/<\/body>/i.test(processedHtml)) {
      processedHtml = processedHtml.replace(/<\/body>/i, errorBanner + '</body>');
    } else {
      processedHtml += errorBanner;
    }

    return processedHtml;
  }, [code, cleanLang, canPreview]);

  // Width style depending on selected viewport
  const viewportWidthClass = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[375px]'
  }[viewport];

  return (
    <div className={`rounded-2xl overflow-hidden my-4 border border-white/[0.1] bg-[#0c0d14] shadow-2xl transition-all ${
      isFullscreen 
        ? 'fixed inset-4 z-50 flex flex-col bg-[#08090d] border-emerald-500/40 shadow-2xl shadow-black/80' 
        : 'relative w-full'
    }`}>
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#10121b] border-b border-white/[0.08] select-none">
        
        {/* Left: Language & Tabs */}
        <div className="flex items-center space-x-2">
          {/* File / Language Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-mono font-medium text-slate-300">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="uppercase text-[11px] tracking-wide">{cleanLang}</span>
          </div>

          {/* Mode Switcher Tabs (Code vs Live Preview) */}
          {canPreview && (
            <div className="flex items-center bg-[#07080c] p-0.5 rounded-lg border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'code'
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                <span>Live Preview</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions (Viewport, Reload, Download, Copy, Fullscreen) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Viewport switchers (only visible when in Preview mode) */}
          {canPreview && activeTab === 'preview' && (
            <div className="hidden sm:flex items-center bg-[#07080c] p-0.5 rounded-lg border border-white/[0.08] mr-1">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                title="Desktop View"
                className={`p-1.5 rounded-md transition-colors ${viewport === 'desktop' ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('tablet')}
                title="Tablet View (768px)"
                className={`p-1.5 rounded-md transition-colors ${viewport === 'tablet' ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                title="Mobile View (375px)"
                className={`p-1.5 rounded-md transition-colors ${viewport === 'mobile' ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reload Sandbox */}
          {canPreview && activeTab === 'preview' && (
            <button
              type="button"
              onClick={() => setReloadKey(k => k + 1)}
              title="Reload Preview"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Direct File Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            title={`Download .${getExtension()} file`}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all"
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold">Download</span>
              </>
            )}
          </button>

          {/* Copy Code Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Code"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>

          {/* Fullscreen / Expand Canvas Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Live Canvas'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main View Area: Code or Preview */}
      <div className={`relative ${isFullscreen ? 'flex-1 overflow-hidden' : ''}`}>
        
        {/* PREVIEW TAB */}
        {canPreview && activeTab === 'preview' ? (
          <div className={`w-full bg-[#050608] flex items-center justify-center p-2 sm:p-4 overflow-auto ${
            isFullscreen ? 'h-full min-h-[500px]' : 'min-h-[380px] max-h-[620px]'
          }`}>
            <div className={`transition-all duration-300 mx-auto shadow-2xl rounded-xl overflow-hidden border border-white/[0.1] bg-[#08090d] ${viewportWidthClass} ${
              isFullscreen ? 'h-full' : 'h-[380px] sm:h-[480px]'
            }`}>
              <iframe
                key={reloadKey}
                title="EDITH Live Sandbox"
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
                className="w-full h-full border-0 bg-[#08090d]"
              />
            </div>
          </div>
        ) : (
          
          /* CODE TAB */
          <div className={`overflow-x-auto p-4 bg-[#08090d] text-slate-100 font-mono text-xs leading-relaxed ${
            isFullscreen ? 'h-full overflow-y-auto' : 'max-h-[500px] overflow-y-auto'
          }`}>
            <pre className="!m-0 !p-0 !bg-transparent">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-3.5 py-1.5 bg-[#0a0c12] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400/80 inline-block" />
          <span>EDITH Sandbox Engine // Ready</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-500">
          <span>{code.split('\n').length} lines</span>
          <span>{(new TextEncoder().encode(code).length / 1024).toFixed(1)} KB</span>
        </div>
      </div>
    </div>
  );
}
