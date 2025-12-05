
import { NutraHook, VisualStyle, NutraVertical, Theme, StyleDetail } from './types';
import { Activity, Zap, Leaf, AlertTriangle, Stethoscope, FlaskConical, Camera, Smartphone, Scan, PenTool, Box, Grid, Smile, Heart, Scale, Eye, Bug, Droplet, Flame, Sun, Moon, Cpu, Cog, Newspaper, Layers, Thermometer, Video, Monitor, Music, Ghost, Minus, Circle } from 'lucide-react';

export const HOOK_DETAILS = [
  {
    id: NutraHook.PAIN_BASED,
    label: "Болевой (Суставы/Вены)",
    icon: Zap,
    description: "Показывает проблему лицом: красные суставы, воспаления. Вызывает мгновенное желание избавиться от боли.",
    promptModifier: "Show a visual representation of physical pain, inflamed joints, red arteries, or elderly people experiencing discomfort. High contrast, warm heatmap overlay styles."
  },
  {
    id: NutraHook.MEDICAL_STYLE,
    label: "Медицинский (МРТ/Рентген)",
    icon: Scan,
    description: "Высокое доверие. Снимки МРТ, рентген, клиника. Работает на 'умную' аудиторию, ищущую лечение.",
    promptModifier: "Medical imaging style, MRI blue tones, X-ray transparency, detailed anatomical cross-section of human organs or joints. Clean, sterile, professional look."
  },
  {
    id: NutraHook.NATURAL_HEALING,
    label: "Натуральный (Травы)",
    icon: Leaf,
    description: "Эко-вайб. Мёд, имбирь, зелень. Подходит для офферов 'без химии'. Ощущение безопасности.",
    promptModifier: "Soft natural lighting, macro photography of ginger, honey, herbs, green leaves. Eco-friendly atmosphere, wooden textures, freshness."
  },
  {
    id: NutraHook.CLICKBAIT,
    label: "Тизерный (Шок)",
    icon: AlertTriangle,
    description: "Агрессивный CTR. 'До/После', страшные последствия, яркие стрелки. Для холодной аудитории.",
    promptModifier: "Viral thumbnail style, high saturation, dramatic lighting, use of red attention-grabbing elements, close-up of skin textures or 'shocking' transformations."
  },
  {
    id: NutraHook.DOCTOR_STYLE,
    label: "Врачебный подход",
    icon: Stethoscope,
    description: "Авторитет эксперта. Врач в халате, рекомендующий средство. Закрывает возражения.",
    promptModifier: "A trustworthy doctor in a white coat pointing at a chart or holding a generic bottle. Clinic background, bright lighting, reassuring expression."
  },
  {
    id: NutraHook.LAB_SCIENTIFIC,
    label: "Научный (Клетки/ДНК)",
    icon: FlaskConical,
    description: "Глубокая наука. Молекулы, микроскоп. Показывает, как средство работает изнутри.",
    promptModifier: "Microscopic view, cellular structures, DNA double helix, floating molecules, laboratory glassware, futuristic blue and cyan lighting."
  }
];

export const VERTICAL_DETAILS = [
  { id: NutraVertical.JOINTS, label: "Суставы", icon: Activity },
  { id: NutraVertical.CARDIO, label: "Гипертония", icon: Heart },
  { id: NutraVertical.WEIGHT_LOSS, label: "Похудение", icon: Scale },
  { id: NutraVertical.DIABETES, label: "Диабет", icon: Droplet },
  { id: NutraVertical.POTENCY, label: "Потенция", icon: Flame },
  { id: NutraVertical.VISION, label: "Зрение", icon: Eye },
  { id: NutraVertical.PARASITES, label: "Паразиты", icon: Bug },
  { id: NutraVertical.SKIN, label: "Омоложение", icon: Smile },
];

// Added descriptions to styles
export const STYLE_DETAILS: StyleDetail[] = [
  { id: VisualStyle.REALISM, label: "Реализм", icon: Camera, description: "Как фото. Максимальная достоверность. Идеально для 'Историй успеха' и врачей." },
  { id: VisualStyle.MEDICAL_CGI, label: "Мед. 3D", icon: Activity, description: "Дорогая 3D графика органов. Выглядит как реклама из аптеки. Высокое доверие." },
  { id: VisualStyle.UGC_NATIVE, label: "TikTok UGC", icon: Smartphone, description: "Любительский стиль, снято на телефон. Пробивает баннерную слепоту в соцсетях." },
  { id: VisualStyle.HEATMAP_XRAY, label: "Тепловизор", icon: Thermometer, description: "Показывает 'очаг воспаления' цветом. Отлично для суставов и боли." },
  { id: VisualStyle.NEWS_TV, label: "Новости", icon: Newspaper, description: "Стиль выпуска новостей / сенсации. 'Врачи скрывали это!'" },
  { id: VisualStyle.COLLAGE_MIX, label: "Коллаж", icon: Layers, description: "Смесь фото и графики. Ярко, динамично, много информации в одном кадре." },
  { id: VisualStyle.BLUEPRINT_TECH, label: "Схема", icon: PenTool, description: "Чертеж или схема лечения. Работает на мужскую аудиторию (потенция, зрение)." },
  { id: VisualStyle.APPLE_MINIMAL, label: "Apple UI", icon: Monitor, description: "Чистый, белый, стерильный дизайн. Дорого и премиально." },
  { id: VisualStyle.ILLUSTRATION, label: "Арт", icon: PenTool, description: "Рисованный стиль. Хорошо для деликатных тем (паразиты, грибок)." },
  { id: VisualStyle.PIXEL_ART, label: "Пиксель", icon: Grid, description: "Ретро-гейминг стиль. Необычно, привлекает внимание гиков." },
  { id: VisualStyle.COMIC, label: "Комикс", icon: Smile, description: "Яркие контуры, поп-арт. Эмоционально и броско." },
  { id: VisualStyle.ISOMETRIC_3D, label: "3D Cute", icon: Box, description: "Милая 3D графика. Игрушечный стиль. Хорошо для легких тем." },
  // New Styles
  { id: VisualStyle.RETRO_WAVE, label: "Ретровейв", icon: Music, description: "Неон, 80-е, сетка. Яркие фиолетовые тона. Привлекает внимание." },
  { id: VisualStyle.GOTHIC_DARK, label: "Готика", icon: Ghost, description: "Темный, мрачный, высококонтрастный стиль. Хорошо для 'страшных' тизеров." },
  { id: VisualStyle.MINIMAL_LINE, label: "Линии", icon: Minus, description: "Минимализм в линиях. Стильно, векторно, ничего лишнего." },
  { id: VisualStyle.CLAYMORPHISM, label: "Клей", icon: Circle, description: "Мягкий, 'пухлый' 3D стиль. Очень трендово и приятно глазу." },
];

export const SUPPORTED_LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'hi', name: 'Hindi' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
];

export const RECOMMENDED_HOOKS: Record<string, NutraHook[]> = {
  [NutraVertical.JOINTS]: [NutraHook.PAIN_BASED, NutraHook.MEDICAL_STYLE, NutraHook.DOCTOR_STYLE],
  [NutraVertical.CARDIO]: [NutraHook.MEDICAL_STYLE, NutraHook.PAIN_BASED, NutraHook.NATURAL_HEALING],
  [NutraVertical.WEIGHT_LOSS]: [NutraHook.CLICKBAIT, NutraHook.TESTIMONIAL, NutraHook.PRODUCT_FOCUS],
  [NutraVertical.DIABETES]: [NutraHook.MEDICAL_STYLE, NutraHook.NATURAL_HEALING],
  [NutraVertical.POTENCY]: [NutraHook.NATURAL_HEALING, NutraHook.PRODUCT_FOCUS],
  [NutraVertical.VISION]: [NutraHook.LAB_SCIENTIFIC, NutraHook.MEDICAL_STYLE],
  [NutraVertical.PARASITES]: [NutraHook.CLICKBAIT, NutraHook.LAB_SCIENTIFIC],
  [NutraVertical.SKIN]: [NutraHook.CLICKBAIT, NutraHook.TESTIMONIAL, NutraHook.PRODUCT_FOCUS],
};

export const THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Светлая',
    aura: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15), transparent 70%)',
    colors: {
      bg: 'bg-gray-50',
      card: 'bg-white',
      text: 'text-gray-900',
      textSec: 'text-gray-500',
      accent: 'text-blue-600',
      border: 'border-gray-200'
    }
  },
  {
    id: 'dark',
    name: 'Dark Pro',
    aura: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15), transparent 70%)',
    colors: {
      bg: 'bg-slate-900',
      card: 'bg-slate-800',
      text: 'text-white',
      textSec: 'text-slate-400',
      accent: 'text-indigo-400',
      border: 'border-slate-700'
    }
  },
  {
    id: 'cyber',
    name: 'Киберпанк',
    aura: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.2), transparent 70%)',
    colors: {
      bg: 'bg-black',
      card: 'bg-zinc-900',
      text: 'text-yellow-400',
      textSec: 'text-cyan-400',
      accent: 'text-pink-500',
      border: 'border-pink-500/30'
    }
  },
  {
    id: 'steampunk',
    name: 'Стимпанк',
    aura: 'radial-gradient(circle at 50% 50%, rgba(192, 151, 88, 0.15), transparent 70%)',
    colors: {
      bg: 'bg-[#2b2b2b]',
      card: 'bg-[#3e3b36]',
      text: 'text-[#d4c5a3]',
      textSec: 'text-[#8c8270]',
      accent: 'text-[#c09758]', // Brass
      border: 'border-[#5a5043]'
    }
  },
  {
    id: 'glass',
    name: 'Жидкое Стекло',
    aura: 'radial-gradient(circle at 50% 50%, rgba(147, 197, 253, 0.3), transparent 70%)',
    colors: {
      bg: 'bg-gradient-to-br from-blue-100 to-pink-100',
      card: 'bg-white/40 backdrop-blur-xl',
      text: 'text-slate-800',
      textSec: 'text-slate-500',
      accent: 'text-blue-600',
      border: 'border-white/50'
    }
  },
  {
    id: 'win95',
    name: 'Windows 95',
    aura: 'none',
    colors: {
      bg: 'bg-[#008080]', // Classic Teal
      card: 'bg-[#c0c0c0]',
      text: 'text-black',
      textSec: 'text-gray-600',
      accent: 'text-blue-800',
      border: 'border-gray-400'
    }
  }
];
