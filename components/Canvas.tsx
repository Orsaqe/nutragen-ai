
import React, { useRef, useState, useEffect } from 'react';
import { Layer, Theme } from '../types';
import { Move, X, Sparkles, Scaling } from 'lucide-react';

interface CanvasProps {
  layers: Layer[];
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onRemoveLayer: (id: string) => void;
  onSelectLayer: (id: string | null) => void;
  onDragStart: () => void;
  selectedLayerId: string | null;
  mode: 'edit' | 'magic';
  theme: Theme;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  layers, 
  onUpdateLayer, 
  onRemoveLayer, 
  onSelectLayer, 
  onDragStart,
  selectedLayerId,
  mode,
  theme
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [scale, setScale] = useState(0.5); // Start small to avoid flash

  // Monitor container size to update scale
  useEffect(() => {
      const updateScale = () => {
          if (containerRef.current) {
              const newScale = containerRef.current.clientWidth / 1080;
              if (newScale > 0) setScale(newScale);
          }
      };

      const observer = new ResizeObserver(updateScale);
      if (containerRef.current) observer.observe(containerRef.current);
      
      // Initial calculation
      setTimeout(updateScale, 0);

      return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent, layerId: string, isResizeHandle: boolean = false) => {
    e.stopPropagation(); 
    onSelectLayer(layerId);
    if (mode === 'edit') {
        onDragStart(); 
        setDragStart({ x: e.clientX, y: e.clientY });
        setIsResizing(isResizeHandle);
        (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart || !selectedLayerId || mode === 'magic') return;

    // Use the state scale for accurate dragging
    const canvasScale = scale;

    const dx = (e.clientX - dragStart.x) / canvasScale;
    const dy = (e.clientY - dragStart.y) / canvasScale;
    
    const layer = layers.find(l => l.id === selectedLayerId);
    if (layer) {
      if (isResizing) {
          // RESIZE LOGIC
          if (layer.type === 'text') {
              // For Text: Resize changes WIDTH, causing reflow
              const newWidth = Math.max(100, (layer.width || 800) + dx); 
              onUpdateLayer(selectedLayerId, { width: newWidth });
          } else if (layer.type === 'blur') {
              // For Blur: Changes Width & Height
              const newW = Math.max(50, (layer.width || 300) + dx);
              const newH = Math.max(50, (layer.height || 300) + dy);
              onUpdateLayer(selectedLayerId, { width: newW, height: newH });
          } else {
              // For Images: Change Scale
              const currentScale = layer.scale;
              const scaleDelta = dx / 500; 
              const newScale = Math.max(0.1, currentScale + scaleDelta);
              onUpdateLayer(selectedLayerId, { scale: newScale });
          }
      } else {
          // MOVE LOGIC
          onUpdateLayer(selectedLayerId, {
            x: layer.x + dx,
            y: layer.y + dy
          });
      }
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDragStart(null);
    setIsResizing(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === containerRef.current || e.target === containerRef.current?.firstElementChild) {
        onSelectLayer(null);
      }
  };

  const getCanvasBackground = () => {
      if (theme.id === 'win95') return '#ffffff'; 
      if (theme.id === 'steampunk') return '#2b2b2b';
      return 'rgba(255,255,255,0.05)';
  };

  const getBackgroundColor = (hex?: string, opacity?: number) => {
      if (!hex || hex === 'transparent') return 'transparent';
      const op = opacity !== undefined ? opacity : 1;
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      if (result) {
          return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${op})`;
      }
      return hex;
  };

  return (
    <div 
      className={`relative w-full h-full overflow-hidden shadow-2xl transition-all duration-300 rounded-xl backdrop-blur-sm border border-white/10`}
      style={{ backgroundColor: getCanvasBackground() }}
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleCanvasClick}
    >
        {theme.id !== 'win95' && (
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: `radial-gradient(${theme.id === 'cyber' ? '#ec4899' : theme.id === 'steampunk' ? '#c09758' : '#fff'} 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
            }}></div>
        )}
        
        {/* SCALER WRAPPER: Handles the visual zoom only */}
        <div 
            className="absolute top-1/2 left-1/2 origin-center"
            style={{ 
                width: '1080px', 
                height: '1080px', 
                transform: `translate(-50%, -50%) scale(${scale})`,
                pointerEvents: 'none' // Let events pass through to layers or canvas bg
            }}
        >
            {/* EXPORT CONTAINER: Pure 1080x1080, No Transforms, Target for Download */}
            <div 
                id="nutra-export-canvas"
                className="w-full h-full bg-black shadow-lg relative overflow-hidden"
                style={{ pointerEvents: 'auto' }} // Re-enable events
            >
              {layers.map((layer) => {
                const isBackground = layer.id.startsWith('bg-');
                return (
                  <div
                    key={layer.id}
                    id={layer.id}
                    className={`absolute touch-none select-none transition-shadow duration-200
                      ${isBackground ? 'z-0' : (selectedLayerId === layer.id && mode === 'edit' ? 'z-20 animate-[pulse-subtle_2s_infinite]' : 'z-10')}
                      ${mode === 'magic' && !isBackground ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
                      ${!isBackground && mode === 'edit' ? 'cursor-move' : ''}
                    `}
                    style={{
                      transform: `translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation}deg)`,
                      left: '50%',
                      top: '50%',
                      pointerEvents: isBackground ? 'none' : 'auto', 
                      width: layer.type === 'text' || layer.type === 'blur' ? (layer.width || (layer.type === 'text' ? 800 : 300)) : undefined,
                      height: layer.type === 'blur' ? (layer.height || 300) : undefined
                    }}
                    onPointerDown={(e) => !isBackground && handlePointerDown(e, layer.id)}
                  >
                    {layer.type === 'image' && (
                      <div style={{ transform: `scale(${layer.scale})` }}>
                          <img 
                          src={layer.content} 
                          alt="layer" 
                          className="max-w-[1080px] object-cover pointer-events-none rounded-lg"
                          style={{ width: layer.id.startsWith('bg-') ? '1080px' : 'auto', filter: layer.style?.filter || 'none' }}
                          />
                      </div>
                    )}
                    
                    {layer.type === 'product' && (
                       <div style={{ transform: `scale(${layer.scale})` }}>
                          <img 
                          src={layer.content} 
                          alt="product" 
                          className="max-w-[400px] object-contain pointer-events-none drop-shadow-2xl"
                          style={{ filter: layer.style?.filter || 'none' }}
                      />
                     </div>
                    )}

                    {layer.type === 'blur' && (
                        <div 
                          style={{
                              width: '100%',
                              height: '100%',
                              backdropFilter: `blur(${layer.style?.blurStrength || 20}px)`,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '16px',
                              border: '1px solid rgba(255,255,255,0.2)',
                              transform: `scale(${layer.scale})`
                          }}
                        />
                    )}

                    {layer.type === 'text' && (
                      <div 
                        className={`text-center ${selectedLayerId === layer.id ? 'border-2 border-dashed border-blue-400' : ''}`}
                        style={{
                          transform: `scale(${layer.scale})`,
                          color: layer.style?.color || '#ffffff',
                          fontSize: `${layer.style?.fontSize || 80}px`,
                          fontWeight: 'bold',
                          fontFamily: layer.style?.fontFamily || 'Inter',
                          textShadow: '0px 4px 8px rgba(0,0,0,0.5)',
                          backgroundColor: getBackgroundColor(layer.style?.backgroundColor, layer.style?.bgOpacity),
                          backdropFilter: theme.id !== 'win95' && (layer.style?.bgOpacity ?? 1) < 0.9 ? 'blur(16px)' : 'none',
                          padding: `${layer.style?.padding || 16}px`,
                          lineHeight: layer.style?.lineHeight || 1.2,
                          borderRadius: '16px',
                          whiteSpace: 'pre-wrap', 
                          wordBreak: 'break-word',
                          filter: layer.style?.filter || 'none'
                        }}
                      >
                        {layer.content}
                      </div>
                    )}

                    {selectedLayerId === layer.id && mode === 'edit' && !isBackground && (
                      <>
                          <div className="absolute -top-20 left-0 bg-black/75 backdrop-blur text-white rounded-full px-4 py-2 flex items-center space-x-4 shadow-xl border border-white/20 scale-[1.5]">
                              <button onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }}>
                                  <X className="w-5 h-5 text-red-400 hover:text-red-300" />
                              </button>
                              <Move className="w-5 h-5 text-gray-300" />
                          </div>

                          {/* Resize Handle */}
                          <div 
                              onPointerDown={(e) => handlePointerDown(e, layer.id, true)}
                              className="absolute -bottom-6 -right-6 w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-nwse-resize hover:scale-110 transition-transform z-30"
                          >
                              <Scaling className="w-6 h-6 text-white" />
                          </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
        </div>
      
      {mode === 'magic' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
              <div className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm flex items-center gap-2 animate-bounce">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Нажми на объект для магии
              </div>
          </div>
      )}
      
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.9); }
        }
      `}</style>
    </div>
  );
};
