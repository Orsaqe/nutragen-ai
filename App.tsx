import React, { useState, useRef, useEffect } from 'react';
import { IOSHeader, IOSButton, FloatingNav, LoadingOverlay } from './components/IOSComponents';
import { Canvas } from './components/Canvas';
import { HOOK_DETAILS, STYLE_DETAILS, SUPPORTED_LANGUAGES, VERTICAL_DETAILS, RECOMMENDED_HOOKS, THEMES } from './constants';
import { NutraHook, VisualStyle, Layer, NutraVertical, Theme } from './types';
import { generateNutraImagesBatch, generateMarketingText } from './services/geminiService';
import { toPng } from 'html-to-image';
import { 
  Sparkles, 
  Wand2, 
  History, 
  Download,
  BoxSelect,
  Palette,
  X,
  Plus,
  Type,
  Undo2,
  Trash2,
  Wand,
  Sun,
  Moon,
  Cpu,
  Coins,
  Copy,
  Monitor,
  Cog,
  Glasses,
  Sliders,
  Key,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
  Droplet,
  Save,
  Triangle,
  ImageDown
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [hoveredDescription, setHoveredDescription] = useState<{ title: string; text: string } | null>(null);

  // Generation
  const [prompt, setPrompt] = useState('');
  const [optionalTextPrompt, setOptionalTextPrompt] = useState(''); 
  const [selectedHook, setSelectedHook] = useState<NutraHook>(NutraHook.PAIN_BASED);
  const [selectedVertical, setSelectedVertical] = useState<NutraVertical>(NutraVertical.JOINTS); 
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>(VisualStyle.REALISM);
  const [selectedLanguage, setSelectedLanguage] = useState('ru'); 
  const [exampleImages, setExampleImages] = useState<string[]>([]);
  // Batch Count removed as per request, forced to 1
  const [autoGenerateText, setAutoGenerateText] = useState(false);
  
  const [generatedVariants, setGeneratedVariants] = useState<string[]>([]);

  // Editor
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'edit' | 'magic'>('edit');
  const [showAdvancedTextSettings, setShowAdvancedTextSettings] = useState(true);
  
  const [history, setHistory] = useState<Layer[][]>([]);

  // Modals
  const [showTextAiModal, setShowTextAiModal] = useState(false);
  const [textAiPrompt, setTextAiPrompt] = useState('');
  const [textAiLang, setTextAiLang] = useState('ru');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');

  const [toasts, setToasts] = useState<{id: number, message: string, type: 'success' | 'error'}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exampleInputRef = useRef<HTMLInputElement>(null);

  // Helpers
  const addToast = (message: string, type: 'success' | 'error') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  
  const handleShowInfo = (title: string, text: string) => setHoveredDescription({ title, text });
  const handleHideInfo = () => setHoveredDescription(null);
  
  const t = currentTheme.colors;

  const getHeaderThemeClass = () => {
      if (currentTheme.id === 'steampunk') return 'header-fire';
      if (currentTheme.id === 'cyber') return 'header-cyber';
      if (currentTheme.id === 'dark' || currentTheme.id === 'light') return 'header-aurora';
      return '';
  };

  useEffect(() => {
    const k = localStorage.getItem('GEMINI_API_KEY');
    if (k) { setSavedKey(k); setCustomApiKey(k); }
  }, []);

  const handleSaveKey = () => {
      if (!customApiKey.trim()) return;
      localStorage.setItem('GEMINI_API_KEY', customApiKey.trim());
      setSavedKey(customApiKey.trim());
      addToast("Ключ успешно сохранен!", 'success');
      setShowKeyModal(false);
  };

  const handleRemoveKey = () => {
      localStorage.removeItem('GEMINI_API_KEY');
      setSavedKey('');
      setCustomApiKey('');
      addToast("Ключ удален.", 'error');
  };

  const saveToHistory = () => {
    const snapshot = JSON.parse(JSON.stringify(layers));
    setHistory(prev => [...prev, snapshot].slice(-20));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setHistory(prev => {
        const previousState = prev[prev.length - 1];
        setLayers(previousState);
        return prev.slice(0, prev.length - 1);
    });
  };

  const updateLayersWithHistory = (newLayers: Layer[]) => {
      saveToHistory();
      setLayers(newLayers);
  };

  const updateSingleLayer = (id: string, updates: Partial<Layer>) => {
      if (!('x' in updates) && !('y' in updates)) saveToHistory();
      setLayers(l => l.map(x => x.id === id ? { ...x, ...updates } : x));
  };

  const handleGenerate = async () => {
    if (!prompt) { addToast("Введите идею креатива!", 'error'); return; }
    setIsLoading(true);
    setLoadingMessage('Генерация...');
    setGeneratedVariants([]); 
    
    try {
      const images = await generateNutraImagesBatch(
          1, // Forced to 1
          prompt, selectedHook, selectedStyle, selectedVertical, selectedLanguage, optionalTextPrompt, exampleImages, autoGenerateText
      );
      if (images.length === 0) throw new Error("Не удалось создать изображение.");
      setGeneratedVariants(images);
      addToast(`Готово!`, 'success');
    } catch (error: any) {
      console.error(error);
      addToast(error.message || "Ошибка генерации", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVariant = async (imgUrl: string) => {
      const newBgLayer: Layer = { id: `bg-${Date.now()}`, type: 'image', content: imgUrl, x: 0, y: 0, scale: 1, rotation: 0 };
      setHistory([]);
      const initialLayers = [newBgLayer];
      setLayers(initialLayers);
      setActiveTab('editor');

      if (autoGenerateText) {
        setIsLoading(true);
        setLoadingMessage("AI пишет текст...");
        try {
            const sellingText = await generateMarketingText(optionalTextPrompt || `Продай средство для: ${selectedVertical}`, selectedLanguage);
            const textLayer: Layer = {
                id: `txt-auto-${Date.now()}`,
                type: 'text',
                content: sellingText,
                x: 0,
                y: 350,
                scale: 1,
                width: 800,
                rotation: 0,
                style: { fontSize: 80, color: '#ffffff', backgroundColor: '#ef4444', bgOpacity: 0.8, padding: 32, lineHeight: 1.2 }
            };
            setLayers([...initialLayers, textLayer]);
        } catch(e) { console.error("Auto text failed", e); } finally { setIsLoading(false); }
      }
  };

  const handleSave = async () => {
      addToast("Проект сохранен в истории", 'success');
  };

  const handleDownload = async () => {
      addToast("Подготовка скачивания...", 'success');
      // Deselect layer to avoid capturing selection borders
      setSelectedLayerId(null);
      
      // Wait for React to re-render (remove selection handles)
      setTimeout(async () => {
          const node = document.getElementById('nutra-export-canvas');
          if (!node) {
            addToast("Ошибка: Холст не найден", 'error');
            return;
          }
          
          try {
            await document.fonts.ready;
            
            // Convert the DOM element to PNG using html-to-image
            const dataUrl = await toPng(node, {
                quality: 0.95,
                width: 1080,
                height: 1080,
                pixelRatio: 1, // Fix for Retina displays capturing 2x/3x size
                style: {
                    transform: 'none', // Remove any scaling
                    top: '0',
                    left: '0',
                    margin: '0',
                    position: 'relative'
                }
            });
            
            const link = document.createElement('a');
            link.download = `zhkl-nutra-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            addToast("Картинка сохранена!", 'success');
          } catch (err) {
            console.error("Download error:", err);
            addToast("Ошибка при сохранении", 'error');
          }
      }, 100);
  };
  
  // Layer Add Helpers
  const addText = () => {
      const newLayer: Layer = { id: `txt-${Date.now()}`, type: 'text', content: "Текст", x: 0, y: 0, scale: 1, width: 800, rotation: 0, style: { fontSize: 80, color: 'white', backgroundColor: '#000000', bgOpacity: 0.5, padding: 16, lineHeight: 1.2 } };
      updateLayersWithHistory([...layers, newLayer]);
      setSelectedLayerId(newLayer.id);
  };
  const addBlur = () => {
      const newLayer: Layer = { id: `blur-${Date.now()}`, type: 'blur', content: '', x: 0, y: 0, width: 300, height: 300, scale: 1, rotation: 0, style: { blurStrength: 20 } };
      updateLayersWithHistory([...layers, newLayer]);
      setSelectedLayerId(newLayer.id);
  };
  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newLayer: Layer = { id: `prod-${Date.now()}`, type: 'product', content: event.target?.result as string, x: 0, y: 0, scale: 1, rotation: 0 };
        updateLayersWithHistory([...layers, newLayer]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // -- Render --
  
  return (
    <div 
        className={`fixed inset-0 w-full h-full animate-gradient-xy overflow-hidden flex flex-col transition-colors duration-500 font-${currentTheme.id === 'win95' || currentTheme.id === 'steampunk' ? 'mono' : 'sans'}`}
        style={{ backgroundImage: currentTheme.aura }}
    >
        <div className="absolute inset-0 pointer-events-none animate-aura" style={{ background: currentTheme.aura, opacity: 0.5 }}></div>

      {isLoading && <LoadingOverlay message={loadingMessage} />}
      
      {/* Toast Container */}
      <div className="fixed top-24 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none space-y-2">
          {toasts.map(t => (<div key={t.id} className={`px-4 py-2 rounded-full shadow-xl backdrop-blur-md text-sm font-bold ${t.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>{t.message}</div>))}
      </div>

      {/* HEADER */}
      <IOSHeader 
          title="ZHKL AI" 
          titleClassName="zhkl-super-title text-4xl md:text-5xl" 
          backgroundClass={getHeaderThemeClass()}
          rightAction={
              <div className="flex items-center space-x-2">
                 <button onClick={() => setShowDonateModal(true)} className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold rounded-full text-xs shadow-lg animate-pulse hover:scale-105 transition-transform flex items-center"><Coins size={12} className="mr-1" /> Донат</IOSButton>
                 <button onClick={() => setShowKeyModal(true)} className={`p-1.5 rounded-full ${savedKey ? 'bg-green-100 text-green-600' : `${t.bg} ${t.textSec} ${t.border}`} border`}><Key size={14} /></button>
                 <div className="flex space-x-1">{THEMES.map(theme => { let Icon = Sun; if (theme.id === 'dark') Icon = Moon; if (theme.id === 'cyber') Icon = Cpu; if (theme.id === 'steampunk') Icon = Cog; if (theme.id === 'glass') Icon = Glasses; if (theme.id === 'win95') Icon = Monitor; return (<button key={theme.id} onClick={() => setCurrentTheme(theme)} className={`p-1.5 rounded-full ${currentTheme.id === theme.id ? 'bg-blue-600 text-white' : `${t.bg} ${t.textSec} ${t.border}`}`}><Icon size={14} /></button>)})}</div>
              </div>
          } 
      />

      <div className={`flex-1 overflow-hidden relative pt-20 flex flex-col`}>
        
        {/* === CREATE TAB === */}
        {activeTab === 'generate' && (
             <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* LEFT: Inputs */}
                <div className={`w-full md:w-[400px] flex-shrink-0 border-r ${t.border} flex flex-col bg-white/20 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar space-y-6 z-10 pb-32`}>
                    
                    {/* Verticals */}
                    <div className="space-y-2">
                        <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textSec}`}>Ниша</label>
                        <div className="grid grid-cols-4 gap-2">
                            {VERTICAL_DETAILS.map(v => (
                                <button key={v.id} onClick={() => setSelectedVertical(v.id as NutraVertical)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedVertical === v.id ? `bg-blue-500/10 border-blue-500 ${t.accent}` : `${t.card} ${t.border} ${t.textSec} hover:bg-gray-100/5`}`}>
                                    <v.icon className="w-5 h-5 mb-1" />
                                    <span className="text-[9px] w-full text-center leading-none">{v.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Idea */}
                    <div className="space-y-2">
                        <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textSec}`}>Идея <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-600 rounded ml-2">✨ AI</span></label>
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Что рисуем?" className={`w-full h-24 p-3 rounded-xl border-none focus:ring-1 focus:ring-blue-500 resize-none text-sm ${t.card} ${t.text} shadow-inner`} />
                    </div>

                    {/* Text Settings */}
                    <div className={`p-4 rounded-xl ${t.card} border ${t.border} space-y-3`}>
                         <div className="flex justify-between items-center">
                            <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textSec}`}>Текст</label>
                            <div className="flex items-center space-x-1 cursor-pointer" onClick={() => setAutoGenerateText(!autoGenerateText)}>
                                <span className={`text-[9px] ${t.textSec}`}>Магия AI</span>
                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${autoGenerateText ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${autoGenerateText ? 'translate-x-4' : ''}`} /></div>
                            </div>
                         </div>
                         <div className="flex space-x-2">
                             <input value={optionalTextPrompt} onChange={(e) => setOptionalTextPrompt(e.target.value)} placeholder={autoGenerateText ? "AI пишет заголовок..." : "Ваш текст (опц.)"} disabled={autoGenerateText} className={`flex-1 p-2 rounded-lg text-xs border ${t.border} bg-transparent ${t.text}`} />
                             <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className={`rounded-lg px-2 py-1 text-xs border ${t.border} bg-transparent ${t.text}`}>{SUPPORTED_LANGUAGES.map(lang => (<option key={lang.code} value={lang.code}>{lang.code.toUpperCase()}</option>))}</select>
                         </div>
                    </div>
                    
                    {/* References */}
                    <div className="space-y-2">
                        <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textSec}`}>Референсы ({exampleImages.length}/10)</label>
                        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
                            <button onClick={() => exampleInputRef.current?.click()} className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center hover:bg-white/10 ${t.border} ${t.textSec}`}><Plus size={16} /></button>
                            {exampleImages.map((img, idx) => (<div key={idx} className="flex-shrink-0 w-12 h-12 relative rounded-xl overflow-hidden border border-gray-200"><img src={img} className="w-full h-full object-cover" /><button onClick={() => setExampleImages(p => p.filter((_, i) => i !== idx))} className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 hover:opacity-100"><X size={12} /></button></div>))}
                            <input type="file" ref={exampleInputRef} multiple accept="image/*" className="hidden" onChange={(e) => { const files = e.target.files ? Array.from(e.target.files) : []; Promise.all(files.map(f => new Promise<string>(r => { const rd = new FileReader(); rd.onload = ev => r(ev.target?.result as string); rd.readAsDataURL(f as Blob); }))).then(imgs => setExampleImages(prev => [...prev, ...imgs].slice(0, 10))); }} />
                        </div>
                    </div>

                    <div className="pt-4 pb-20">
                        <IOSButton onClick={handleGenerate} disabled={!prompt} className="h-14 text-lg font-bold shadow-xl relative overflow-hidden group"><span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shimmer" /><Sparkles className="w-5 h-5 mr-2" /> СОЗДАТЬ КРЕАТИВ</IOSButton>
                    </div>
                    
                    {/* INFO PANEL */}
                    <div className={`mt-4 p-4 rounded-xl border ${t.border} ${t.card} min-h-[100px] transition-opacity duration-300 ${hoveredDescription ? 'opacity-100' : 'opacity-0'}`}>
                        {hoveredDescription && (
                            <>
                                <h4 className={`text-xs font-bold uppercase mb-1 ${t.text}`}>{hoveredDescription.title}</h4>
                                <p className={`text-[10px] leading-relaxed ${t.textSec}`}>{hoveredDescription.text}</p>
                            </>
                        )}
                    </div>

                </div>

                {/* RIGHT: Visuals & Results */}
                <div className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar p-6 space-y-8 bg-white/5 backdrop-blur-sm z-0 pb-32">
                    
                    {/* Result Area */}
                    {generatedVariants.length > 0 && (
                        <div className="w-full max-w-xl mx-auto mb-8 animate-in fade-in slide-in-from-top-10">
                            <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textSec} mb-2 block`}>Результат</label>
                            <div className="grid grid-cols-1 gap-4">
                                {generatedVariants.map((img, i) => (
                                    <button key={i} onClick={() => handleSelectVariant(img)} className="aspect-square rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-transform ring-4 ring-white/20">
                                        <img src={img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hooks (Large Cards) */}
                    <div>
                         <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textSec} mb-3 block`}>Маркетинговый Хук</label>
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            {HOOK_DETAILS.map(hook => { 
                                const isRecommended = RECOMMENDED_HOOKS[selectedVertical]?.includes(hook.id as NutraHook); 
                                return (
                                    <button 
                                      key={hook.id} 
                                      onClick={() => setSelectedHook(hook.id as NutraHook)} 
                                      onMouseEnter={() => handleShowInfo(hook.label, hook.description)}
                                      onMouseLeave={handleHideInfo}
                                      className={`flex items-start space-x-3 p-4 rounded-2xl border text-left transition-all relative group overflow-hidden ${selectedHook === hook.id ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : `${t.card} ${t.border} ${t.text} hover:border-blue-300`} ${isRecommended ? 'stripe-pattern' : ''}`}
                                    >
                                        {isRecommended && <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500 rounded-full text-[8px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.8)]">Рекомендуем</div>}
                                        <div className={`p-2 rounded-lg ${selectedHook === hook.id ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}><hook.icon className="w-5 h-5" /></div>
                                        <div className="relative z-10">
                                            <div className="text-xs font-bold uppercase mb-1">{hook.label}</div>
                                            <div className={`text-[10px] leading-relaxed ${selectedHook === hook.id ? 'text-blue-100' : 'text-gray-500'}`}>{hook.description}</div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Styles (Compact Grid) */}
                    <div>
                         <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textSec} mb-3 block`}>Визуальный Стиль</label>
                         <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8 gap-3">
                            {STYLE_DETAILS.map(style => (
                                <button 
                                  key={style.id} 
                                  onClick={() => setSelectedStyle(style.id as VisualStyle)} 
                                  onMouseEnter={() => handleShowInfo(style.label, style.description)}
                                  onMouseLeave={handleHideInfo}
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border aspect-square transition-all ${selectedStyle === style.id ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 ring-offset-2' : `${t.card} ${t.border} ${t.textSec} hover:bg-gray-100/10`}`}
                                >
                                    <style.icon className="w-5 h-5 mb-2 opacity-80" />
                                    <span className="text-[9px] text-center leading-none font-medium">{style.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
        )}
        
        {/* === EDITOR TAB (SIDEBAR LAYOUT) === */}
        {activeTab === 'editor' && (
            <div className={`h-full flex flex-row overflow-hidden`}>
                
                {/* SIDEBAR TOOLS (LEFT) */}
                <div className={`w-80 flex-shrink-0 border-r ${t.border} ${t.card} flex flex-col z-20 shadow-2xl relative`}>
                    <div className="p-4 border-b border-gray-100 space-y-4">
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${t.textSec}`}>Инструменты</h3>
                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={addText} className={`flex items-center justify-center p-3 rounded-xl space-x-2 ${t.bg} ${t.text} hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold text-xs`}><Type size={16} /><span>Текст</span></button>
                             <button onClick={() => fileInputRef.current?.click()} className={`flex items-center justify-center p-3 rounded-xl space-x-2 ${t.bg} ${t.text} hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold text-xs`}><BoxSelect size={16} /><span>Товар</span><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProductUpload} /></button>
                             <button onClick={addBlur} className={`flex items-center justify-center p-3 rounded-xl space-x-2 ${t.bg} ${t.text} hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold text-xs`}><Droplet size={16} /><span>Блюр</span></button>
                             <button onClick={handleUndo} className={`flex items-center justify-center p-3 rounded-xl space-x-2 ${t.bg} ${t.text} hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold text-xs`}><Undo2 size={16} /><span>Отмена</span></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                        {selectedLayer ? (
                            <div className="space-y-6 animate-in slide-in-from-left-10">
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-bold uppercase ${t.textSec}`}>Слой: {selectedLayer.type}</span>
                                    <button onClick={() => { saveToHistory(); setLayers(l => l.filter(x => x.id !== selectedLayerId)); }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                                </div>

                                {selectedLayer.type === 'text' && (
                                    <div className="space-y-4">
                                        <textarea value={selectedLayer.content} onChange={(e) => updateSingleLayer(selectedLayer.id, { content: e.target.value })} className={`w-full p-3 rounded-xl border ${t.border} bg-transparent text-sm min-h-[80px]`} placeholder="Текст..." />
                                        <div className="space-y-2"><label className={`text-[10px] font-bold ${t.textSec}`}>Размер шрифта</label><input type="range" min="20" max="300" value={selectedLayer.style?.fontSize || 80} onChange={(e) => updateSingleLayer(selectedLayer.id, { style: { ...selectedLayer.style, fontSize: parseInt(e.target.value) } })} className="w-full accent-blue-600"/></div>
                                        <div className="space-y-2"><label className={`text-[10px] font-bold ${t.textSec}`}>Цвет текста</label><div className="flex flex-wrap gap-2">{['#ffffff', '#000000', '#ef4444', '#3b82f6', '#22c55e', '#facc15'].map(c => (<button key={c} onClick={() => updateSingleLayer(selectedLayer.id, { style: { ...selectedLayer.style, color: c } })} className="w-8 h-8 rounded-full border border-gray-300" style={{ backgroundColor: c }} />))}</div></div>
                                        <div className="space-y-2"><label className={`text-[10px] font-bold ${t.textSec}`}>Фон текста</label><div className="flex flex-wrap gap-2">{['transparent', '#ffffff', '#000000', '#ef4444', '#3b82f6'].map(c => (<button key={c} onClick={() => updateSingleLayer(selectedLayer.id, { style: { ...selectedLayer.style, backgroundColor: c } })} className="w-8 h-8 rounded-full border border-gray-300" style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }} />))}</div></div>
                                        <div className="space-y-2"><label className={`text-[10px] font-bold ${t.textSec}`}>Прозрачность фона</label><input type="range" min="0" max="1" step="0.1" value={selectedLayer.style?.bgOpacity ?? 1} onChange={(e) => updateSingleLayer(selectedLayer.id, { style: { ...selectedLayer.style, bgOpacity: parseFloat(e.target.value) } })} className="w-full accent-blue-600"/></div>
                                    </div>
                                )}
                                
                                {selectedLayer.type === 'blur' && (
                                     <div className="space-y-2"><label className={`text-[10px] font-bold ${t.textSec}`}>Сила блюра</label><input type="range" min="0" max="50" value={selectedLayer.style?.blurStrength || 20} onChange={(e) => updateSingleLayer(selectedLayer.id, { style: { ...selectedLayer.style, blurStrength: parseInt(e.target.value) } })} className="w-full accent-blue-600"/></div>
                                )}
                            </div>
                        ) : (
                            <div className={`text-center py-10 opacity-50 ${t.textSec}`}>
                                <p className="text-sm">Выберите слой<br/>для настройки</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Sidebar Footer with Buttons */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white/90 backdrop-blur pb-8 flex flex-col gap-2">
                        <IOSButton onClick={handleSave} className="bg-green-600 hover:bg-green-700 shadow-green-500/30 text-sm h-10"><Save size={16} className="mr-2" /> СОХРАНИТЬ ПРОЕКТ</IOSButton>
                        <IOSButton onClick={handleDownload} variant="secondary" className="text-sm h-10"><ImageDown size={16} className="mr-2" /> СКАЧАТЬ PNG</IOSButton>
                    </div>
                </div>

                {/* CANVAS AREA (RIGHT) */}
                <div className="flex-1 relative flex items-center justify-center bg-black/5 overflow-hidden p-12 pb-32">
                     <div className="w-full h-full max-w-[80vh] max-h-[80vh] aspect-square shadow-2xl z-10">
                        <Canvas 
                            layers={layers}
                            selectedLayerId={selectedLayerId}
                            mode={editorMode}
                            theme={currentTheme}
                            onDragStart={saveToHistory}
                            onSelectLayer={(id) => { if (editorMode === 'magic' && id) { /* magic */ } else { setSelectedLayerId(id); } }}
                            onRemoveLayer={(id) => { saveToHistory(); setLayers(l => l.filter(x => x.id !== id)); }}
                            onUpdateLayer={updateSingleLayer}
                        />
                     </div>
                </div>

            </div>
        )}
      </div>

      <FloatingNav activeTab={activeTab} onTabChange={setActiveTab} tabs={[{ id: 'generate', icon: Wand2, label: 'Создать' }, { id: 'editor', icon: Palette, label: 'Редактор' }]} />
      
      {/* Donate Modal */}
      {showDonateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDonateModal(false)}>
              <div className="bg-white p-6 rounded-3xl max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-center mb-4">Женьке на покушать) 🍔</h3>
                  <div className="bg-gray-100 p-4 rounded-xl break-all text-xs font-mono text-center mb-4 border border-gray-200">
                      TAgcacPKcLbQ43yyWnPZ1hu4iZKo1uVSmJ
                  </div>
                  <div className="text-center text-xs text-gray-500 mb-4">USDT TRC20</div>
                  <IOSButton onClick={() => { navigator.clipboard.writeText("TAgcacPKcLbQ43yyWnPZ1hu4iZKo1uVSmJ"); addToast("Скопировано!", 'success'); }}>Скопировать адрес</IOSButton>
              </div>
          </div>
      )}
      
      {/* Key Modal */}
      {showKeyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowKeyModal(false)}>
              <div className="bg-white p-6 rounded-3xl max-w-md w-full mx-4 shadow-2xl animate-in zoom-in" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-2">API Ключ Gemini</h3>
                  <p className="text-sm text-gray-600 mb-4">Добавьте свой ключ для быстрой генерации без лимитов.</p>
                  <input type="password" value={customApiKey} onChange={e => setCustomApiKey(e.target.value)} placeholder="AIzaSy..." className="w-full p-3 rounded-xl border mb-4" />
                  <div className="flex space-x-2">
                      <IOSButton onClick={handleSaveKey}>Сохранить</IOSButton>
                      {savedKey && <IOSButton variant="secondary" onClick={handleRemoveKey}>Удалить</IOSButton>}
                  </div>
                  <div className="mt-4 text-xs text-gray-400 text-center">
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline hover:text-blue-500">Получить ключ (Google AI Studio)</a>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}