
export enum NutraHook {
  PAIN_BASED = 'Pain-Based (Joints/Arteries)',
  MEDICAL_STYLE = 'Medical/MRI/X-Ray',
  NATURAL_HEALING = 'Natural Healing/Herbal',
  CLICKBAIT = 'Clickbait/Shock',
  TESTIMONIAL = 'Testimonial/Social',
  DOCTOR_STYLE = 'Doctor Recommendation',
  LAB_SCIENTIFIC = 'Scientific/Laboratory',
  PRODUCT_FOCUS = 'Product Focus'
}

export enum VisualStyle {
  REALISM = 'Photorealism',
  APPLE_MINIMAL = 'Apple/Clean Minimal',
  MEDICAL_CGI = 'Medical CGI/3D',
  ILLUSTRATION = 'Illustration',
  SKETCH = 'Hand Drawn Sketch',
  MACRO = 'Macro Photography',
  PIXEL_ART = 'Pixel Art',
  COMIC = 'Comic Book/Pop Art',
  ISOMETRIC_3D = 'Isometric 3D Clay',
  // New Styles
  UGC_NATIVE = 'UGC/TikTok Style (Amateur)',
  HEATMAP_XRAY = 'Thermal/Heatmap X-Ray',
  COLLAGE_MIX = 'Scrapbook/Collage',
  BLUEPRINT_TECH = 'Technical Blueprint/Schematic',
  NEWS_TV = 'Breaking News/TV Interface',
  // Newer Styles
  RETRO_WAVE = 'Retro Wave/Synth',
  GOTHIC_DARK = 'Gothic/Dark Mood',
  MINIMAL_LINE = 'Minimal Line Art',
  CLAYMORPHISM = 'Soft Claymorphism'
}

export enum NutraVertical {
  JOINTS = 'Joints/Pain',
  CARDIO = 'Cardio/Heart',
  WEIGHT_LOSS = 'Weight Loss/Diet',
  DIABETES = 'Diabetes/Sugar',
  POTENCY = 'Potency/Men Health',
  VISION = 'Vision/Eyes',
  SKIN = 'Skin/Rejuvenation',
  PARASITES = 'Parasites/Detox'
}

export interface Layer {
  id: string;
  type: 'image' | 'text' | 'product' | 'blur';
  content: string; // URL or text content
  x: number;
  y: number;
  width?: number;  // For resizing images/blur
  height?: number; // For resizing images/blur
  scale: number;
  rotation: number;
  style?: any;
}

export interface Theme {
  id: string;
  name: string;
  aura: string; // CSS Gradient for background aura
  colors: {
    bg: string;
    card: string;
    text: string;
    textSec: string;
    accent: string;
    border: string;
  };
}

// Added description to StyleDetail for the Info Panel
export interface StyleDetail {
    id: string;
    label: string;
    icon: any;
    description: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
