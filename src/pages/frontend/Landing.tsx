import { SEO } from '../../components/common/SEO';
import { buildWebsiteSchema, buildOrganizationSchema, buildSoftwareAppSchema } from '../../lib/structuredData';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import {
  BarChart3,
  Bot,
  Briefcase,
  Calculator as CalculatorIcon,
  ChevronRight,
  Crown,
  Diamond,
  Gem,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Lock,
  Palette,
  PieChart,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  X,
  Zap
} from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Calculator } from './Calculator';
import { Markets } from './Markets';


// When VITE_LAUNCH_MODE=teaser, the app shows landing only — no auth, no backend required.
const IS_TEASER_MODE = import.meta.env.VITE_LAUNCH_MODE === 'teaser';
// Pre-TGE countdown: anchored to 2026-08-31 with a 62-day runway
const PRE_LAUNCH_ANCHOR = '2026-08-31T00:00:00Z';
const PRE_LAUNCH_WINDOW_DAYS = 62;
const TEASER_LAUNCH_AT = import.meta.env.VITE_TEASER_LAUNCH_AT || new Date(
  new Date(PRE_LAUNCH_ANCHOR).getTime() + PRE_LAUNCH_WINDOW_DAYS * 24 * 60 * 60 * 1000
).toISOString();

type CountdownState = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  isLive: boolean;
};

function getTeaserCountdown(targetIso: string): CountdownState {
  const launchMs = new Date(targetIso).getTime();
  if (!Number.isFinite(launchMs)) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', isLive: false };
  }

  const diffMs = launchMs - Date.now();
  if (diffMs <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', isLive: true };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    isLive: false
  };
}

const FALLBACK_SITE_URL = 'https://myalphabag.com';

const LANDING_TOP_SEARCHES = [
  'crypto portfolio tracker',
  'web3 portfolio dashboard',
  'whale wallet tracker',
  'crypto AI market analysis',
  'futures leverage calculator',
  'multi-chain wallet analytics'
];

function setMetaTag(name: string, content: string): void {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function setPropertyMetaTag(property: string, content: string): void {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function setCanonicalLink(href: string): void {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', href);
}

function upsertStructuredData(id: string, payload: unknown): HTMLScriptElement {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
  return script;
}

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    nav_home: "Home",
    nav_features: "Features",
    nav_tokenomics: "Alphanomics",
    nav_alpha_pass: "Alpha Pass",
    nav_buy: "Buy",
    nav_roadmap: "Roadmap",
    nav_faq: "FAQ",
    nav_pricing: "Pricing",
    hero_title_1: "Track Your Crypto",
    hero_title_2: "Total Stealth",
    hero_desc: "Manage diverse Web3 portfolios, track whale movements, and simulate your ROE with real-time accuracy. Access Alpha-grade trade signals and explore ways to earn.",
    btn_build_portfolio: "Build your portfolio",
    btn_join_community: "Join community",
    btn_notify_me: "Notify Me at Launch",
    stat_assets: "Multi-Chain",
    stat_assets_lbl: "Wallet & CEX tracking",
    stat_members: "Early Access",
    stat_members_lbl: "Join the waitlist",
    stat_crypto: "T2E Rewards",
    stat_crypto_lbl: "Earn while you hold",
    calculator_title: "Alpha Calculator",
    calculator_badge: "Live Simulator",
    features_title: "Engineered for",
    features_title_alpha: "Alpha",
    features_subtitle: "Stop using spreadsheets. Upgrade to a hub aimed at maximizing yield and minimizing latency.",
    why_title: "Why",
    why_title_alpha: "AlphaBAG?",
    why_desc: "Built by traders, for traders. We strip away the noise and deliver high-frequency intelligence directly to your terminal. No emotional biases, just raw, actionable data.",
    why_latency_title: "Zero Latency Execution",
    why_latency_desc: "Unlike traditional dashboards that cache data for minutes, AlphaBAG connects directly to RPC nodes to provide split-second updates on whale movements and market shifts.",
    why_privacy_title: "Absolute Privacy",
    why_privacy_desc: "We operate in a fully stealth, read-only environment. Your private keys never touch our servers. Monitor your wealth with total peace of mind.",
    why_ai_title: "AlphaAi Integration",
    why_ai_desc: "Stop manually parsing charts. Our proprietary LLM analyzes technical structures and order book flow to deliver institutional-grade trade setups directly to your inbox.",
    pricing_title: "Membership Tiers",
    pricing_subtitle: "Scale your operation. Cancel anytime.",
    tier_free: "Beta Tester",
    tier_free_price: "Free Access",
    tier_free_tokens: "Current Option (Current Alpha)",
    tier_free_badge: "ACTIVE: CURRENT ALPHA",
    tier_premium: "Alphabag (coming soon)",
    tier_premium_price: "Premium",
    tier_premium_tokens: "All Features Locked",
    tier_premium_badge: "ELIGIBILITY: GENESIS HOLDER"
  },
  ar: {
    nav_home: "الرئيسية",
    nav_features: "الميزات",
    nav_tokenomics: "اقتصاديات الرمز",
    nav_alpha_pass: "ألفا باس",
    nav_buy: "شراء",
    nav_roadmap: "خارطة الطريق",
    nav_faq: "الأسئلة الشائعة",
    nav_pricing: "العضوية",
    hero_title_1: "تتبع العملات الرقمية",
    hero_title_2: "بسرية تامة",
    hero_desc: "قم بإدارة محافظ Web3 المتنوعة، وتتبع تحركات الحيتان، وحاكي العائد على الاستثمار بدقة فورية. احصل على إشارات تداول واستكشف طرق الكسب.",
    btn_build_portfolio: "ابنِ محفظتك",
    btn_join_community: "انضم إلى المجتمع",
    btn_notify_me: "أبلغني عند الإطلاق",
    stat_assets: "متعدد السلاسل",
    stat_assets_lbl: "تتبع المحافظ والمنصات",
    stat_members: "وصول مبكر",
    stat_members_lbl: "انضم لقائمة الانتظار",
    stat_crypto: "مكافآت T2E",
    stat_crypto_lbl: "اربح أثناء الاحتفاظ",
    calculator_title: "حاسبة ألفا",
    calculator_badge: "محاكي مباشر",
    features_title: "مصمم من أجل",
    features_title_alpha: "ألفا",
    features_subtitle: "توقف عن استخدام جداول البيانات. قم بالترقية إلى مركز يهدف إلى زيادة العائد وتقليل زمن الانتقال.",
    why_title: "لماذا",
    why_title_alpha: "ألفاباج؟",
    why_desc: "بنيت من قبل المتداولين، للمتداولين. نقوم بإزالة الضوضاء وتقديم معلومات عالية التردد مباشرة إلى جهازك.",
    why_latency_title: "تنفيذ بدون زمن انتقال",
    why_latency_desc: "على عكس لوحات المعلومات التقليدية، يتصل AlphaBAG مباشرة بالعقد لتوفير تحديثات سريعة.",
    why_privacy_title: "خصوصية مطلقة",
    why_privacy_desc: "نحن نعمل في بيئة سرية تماماً للقراءة فقط. مفاتيحك الخاصة لا تلمس خوادمنا أبداً.",
    why_ai_title: "تكامل AlphaAi",
    why_ai_desc: "يقوم الذكاء الاصطناعي الخاص بنا بتحليل الهياكل الفنية وتقديم إعدادات تداول مباشرة.",
    pricing_title: "فئات العضوية",
    pricing_subtitle: "توسيع نطاق العملية الخاصة بك. إلغاء في أي وقت.",
    tier_free: "مختبر بيتا",
    tier_free_price: "وصول مجاني",
    tier_free_tokens: "الخيار الحالي (ألفا الحالية)",
    tier_free_badge: "نشط: ألفا الحالية",
    tier_premium: "ألفاباج (قريباً)",
    tier_premium_price: "مميز",
    tier_premium_tokens: "جميع الميزات مغلقة",
    tier_premium_badge: "الأهلية: حامل جينيسيس"
  },
  "ar-bh": {
    nav_home: "الرئيسية",
    nav_features: "الميزات",
    nav_tokenomics: "اقتصاديات الرمز",
    nav_buy: "شراء",
    nav_roadmap: "خارطة الطريق",
    nav_faq: "الأسئلة الشائعة",
    nav_pricing: "العضوية",
    hero_title_1: "تتبع العملات الرقمية",
    hero_title_2: "بسرية تامة",
    hero_desc: "قم بإدارة محافظ Web3 المتنوعة، وتتبع تحركات الحيتان، وحاكي العائد على الاستثمار بدقة فورية. احصل على إشارات تداول واستكشف طرق الكسب في البحرين.",
    btn_build_portfolio: "ابنِ محفظتك",
    btn_join_community: "انضم إلى المجتمع",
    btn_notify_me: "أبلغني عند الإطلاق",
    stat_assets: "متعدد السلاسل",
    stat_assets_lbl: "تتبع المحافظ والمنصات",
    stat_members: "وصول مبكر",
    stat_members_lbl: "انضم لقائمة الانتظار",
    stat_crypto: "مكافآت T2E",
    stat_crypto_lbl: "اربح أثناء الاحتفاظ",
    calculator_title: "حاسبة ألفا",
    calculator_badge: "محاكي مباشر",
    features_title: "مصمم من أجل",
    features_title_alpha: "ألفا",
    features_subtitle: "توقف عن استخدام جداول البيانات. قم بالترقية إلى مركز يهدف إلى زيادة العائد وتقليل زمن الانتقال.",
    why_title: "لماذا",
    why_title_alpha: "ألفاباج؟",
    why_desc: "بنيت من قبل المتداولين، للمتداولين. نقوم بإزالة الضوضاء وتقديم معلومات عالية التردد مباشرة إلى جهازك في البحرين.",
    why_latency_title: "تنفيذ بدون زمن انتقال",
    why_latency_desc: "على عكس لوحات المعلومات التقليدية، يتصل AlphaBAG مباشرة بالعقد لتوفير تحديثات سريعة.",
    why_privacy_title: "خصوصية مطلقة",
    why_privacy_desc: "نحن نعمل في بيئة سرية تماماً للقراءة فقط. مفاتيحك الخاصة لا تلمس خوادمنا أبداً.",
    why_ai_title: "تكامل AlphaAi",
    why_ai_desc: "يقوم الذكاء الاصطناعي الخاص بنا بتحليل الهياكل الفنية وتقديم إعدادات تداول مباشرة.",
    pricing_title: "فئات العضوية",
    pricing_subtitle: "توسيع نطاق العملية الخاصة بك. إلغاء في أي وقت.",
    tier_free: "مختبر بيتا",
    tier_free_price: "وصول مجاني",
    tier_free_tokens: "الخيار الحالي (ألفا الحالية)",
    tier_free_badge: "نشط: ألفا الحالية",
    tier_premium: "ألفاباج (قريباً)",
    tier_premium_price: "مميز",
    tier_premium_tokens: "جميع الميزات مغلقة",
    tier_premium_badge: "الأهلية: حامل جينيسيس"
  },
  az: {
    nav_home: "Ana Səhifə",
    nav_features: "Özəlliklər",
    nav_tokenomics: "Tokenomika",
    nav_alpha_pass: "Alpha Keçidi",
    nav_buy: "Satın Al",
    nav_roadmap: "Yol Xəritəsi",
    nav_faq: "FAQ",
    nav_pricing: "Üzvlük",
    hero_title_1: "Kriptonuzu İzləyin",
    hero_title_2: "Tamamilə Gizli",
    hero_desc: "Müxtəlif Web3 portfellərini idarə edin, balina hərəkətlərini izləyin və ROE-nizi real vaxt rejimində dəqiqliklə simulyasiya edin. Alpha dərəcəli siqnalları əldə edin.",
    btn_build_portfolio: "Portfelinizi yaradın",
    btn_join_community: "İcmaya qoşulun",
    btn_notify_me: "Başlanğıcda mənə bildir",
    stat_assets: "Çox Zəncirli",
    stat_assets_lbl: "Cüzdan və CEX izləmə",
    stat_members: "Erkən Giriş",
    stat_members_lbl: "Gözləmə siyahısına qoşulun",
    stat_crypto: "T2E Mükafatları",
    stat_crypto_lbl: "Saxladıqca qazanın",
    calculator_title: "Alpha Kalkulyatoru",
    calculator_badge: "Canlı Simulyator",
    features_title: "Mühəndislik",
    features_title_alpha: "Alpha",
    features_subtitle: "Cədvəllərdən istifadəni dayandırın. Gəlirliliyi artırmaq və gecikməni minimuma endirmək üçün mərkəzə keçin.",
    why_title: "Niyə",
    why_title_alpha: "AlphaBAG?",
    why_desc: "Trederlər tərəfindən trederlər üçün hazırlanmışdır. Səsi kəsirik və birbaşa terminalınıza yüksək tezlikli kəşfiyyat çatdırırıq.",
    why_latency_title: "Sıfır Gecikmə İcra",
    why_latency_desc: "Məlumatları saxlayan ənənəvi panellərdən fərqli olaraq, AlphaBAG balina hərəkətləri barədə anında məlumat verir.",
    why_privacy_title: "Mütləq Məxfilik",
    why_privacy_desc: "Biz tamamilə gizli, yalnız oxumaq üçün nəzərdə tutulmuş mühitdə işləyirik. Şəxsi açarlarınız serverlərimizə toxunmur.",
    why_ai_title: "AlphaAi İnteqrasiyası",
    why_ai_desc: "Qrafikləri əllə təhlil etməyi dayandırın. Bizim xüsusi süni intellektimiz birbaşa sizə siqnallar göndərir.",
    pricing_title: "Üzvlük Səviyyələri",
    pricing_subtitle: "Əməliyyatınızı genişləndirin. İstənilən vaxt ləğv edin.",
    tier_free: "Beta Test Cihazı",
    tier_free_price: "Pulsuz Giriş",
    tier_free_tokens: "Cari Seçim (Cari Alpha)",
    tier_free_badge: "AKTİV: CARİ ALPHA",
    tier_premium: "Alphabag (tezliklə)",
    tier_premium_price: "Premium",
    tier_premium_tokens: "Bütün Özəlliklər Kilidlidir",
    tier_premium_badge: "UYĞUNLUQ: GENESIS SAHİBİ"
  },
  de: {
    nav_home: "Startseite",
    nav_features: "Funktionen",
    nav_tokenomics: "Alphanomics",
    nav_alpha_pass: "Alpha-Pass",
    nav_buy: "Kaufen",
    nav_roadmap: "Roadmap",
    nav_faq: "FAQ",
    nav_pricing: "Preise",
    hero_title_1: "Verfolgen Sie Ihre Krypto-Assets",
    hero_title_2: "Absolute Anonymität",
    hero_desc: "Verwalten Sie vielfältige Web3-Portfolios, verfolgen Sie Wal-Aktivitäten und simulieren Sie Ihre Eigenkapitalrendite (ROE) mit Echtzeitpräzision. Nutzen Sie erstklassige Handelssignale.",
    btn_build_portfolio: "Erstellen Sie Ihr Portfolio",
    btn_join_community: "Treten Sie der Community bei",
    btn_notify_me: "Bei Start benachrichtigen",
    stat_assets: "Multi-Chain",
    stat_assets_lbl: "Wallet- & CEX-Tracking",
    stat_members: "Früher Zugang",
    stat_members_lbl: "Warteliste beitreten",
    stat_crypto: "T2E-Belohnungen",
    stat_crypto_lbl: "Verdienen beim Halten",
    calculator_title: "Alpha-Rechner",
    calculator_badge: "Echtzeit-Simulator",
    features_title: "Entwickelt für",
    features_title_alpha: "Alpha",
    features_subtitle: "Vergessen Sie Tabellenkalkulationen. Wechseln Sie zu einer Plattform, die auf maximalen Ertrag und minimale Latenz ausgelegt ist.",
    why_title: "Warum",
    why_title_alpha: "AlphaBAG?",
    why_desc: "Von Tradern für Trader gebaut. Wir blenden das Rauschen aus und liefern hochfrequente Analysen direkt an Ihr Terminal.",
    why_latency_title: "Latenzfreie Ausführung",
    why_latency_desc: "Im Gegensatz zu traditionellen Dashboards verbindet sich AlphaBAG direkt mit RPC-Nodes, um sofortige Updates zu Wal-Bewegungen bereitzustellen.",
    why_privacy_title: "Absolute Privatsphäre",
    why_privacy_desc: "Wir arbeiten in einer rein lesbaren Stealth-Umgebung. Ihre privaten Schlüssel berühren niemals unsere Server.",
    why_ai_title: "AlphaAi-Integration",
    why_ai_desc: "Schluss mit der manuellen Chartanalyse. Unsere KI analysiert technische Strukturen und liefert profitable Setups.",
    pricing_title: "Mitgliedschaftsstufen",
    pricing_subtitle: "Erweitern Sie Ihre Möglichkeiten. Jederzeit kündbar.",
    tier_free: "Beta-Tester",
    tier_free_price: "Kostenloser Zugang",
    tier_free_tokens: "Aktuelle Option (Aktuelle Alpha)",
    tier_free_badge: "AKTIV: AKTUELLE ALPHA",
    tier_premium: "Alphabag (demnächst)",
    tier_premium_price: "Premium",
    tier_premium_tokens: "Alle Funktionen gesperrt",
    tier_premium_badge: "BERECHTIGUNG: GENESIS HOLDER"
  },
  "en-ae": {
    nav_home: "Home",
    nav_features: "Features",
    nav_tokenomics: "Tokenomics",
    nav_buy: "Buy",
    nav_roadmap: "Roadmap",
    nav_faq: "FAQ",
    nav_pricing: "Pricing",
    hero_title_1: "Track Your Crypto",
    hero_title_2: "Total Stealth",
    hero_desc: "Manage diverse Web3 portfolios, track whale movements, and simulate your ROE with real-time accuracy. Access Alpha-grade trade signals and explore ways to earn in UAE.",
    btn_build_portfolio: "Build your portfolio",
    btn_join_community: "Join community",
    btn_notify_me: "Notify Me at Launch",
    stat_assets: "Multi-Chain",
    stat_assets_lbl: "Wallet & CEX tracking",
    stat_members: "Early Access",
    stat_members_lbl: "Join the waitlist",
    stat_crypto: "T2E Rewards",
    stat_crypto_lbl: "Earn while you hold",
    calculator_title: "Alpha Calculator",
    calculator_badge: "Live Simulator",
    features_title: "Engineered for",
    features_title_alpha: "Alpha",
    features_subtitle: "Stop using spreadsheets. Upgrade to a hub aimed at maximizing yield and minimizing latency.",
    why_title: "Why",
    why_title_alpha: "AlphaBAG?",
    why_desc: "Built by traders, for traders. We strip away the noise and deliver high-frequency intelligence directly to your terminal. No emotional biases, just raw, actionable data.",
    why_latency_title: "Zero Latency Execution",
    why_latency_desc: "Unlike traditional dashboards that cache data for minutes, AlphaBAG connects directly to RPC nodes to provide split-second updates on whale movements and market shifts.",
    why_privacy_title: "Absolute Privacy",
    why_privacy_desc: "We operate in a fully stealth, read-only environment. Your private keys never touch our servers. Monitor your wealth with total peace of mind.",
    why_ai_title: "AlphaAi Integration",
    why_ai_desc: "Stop manually parsing charts. Our proprietary LLM analyzes technical structures and order book flow to deliver institutional-grade trade setups directly to your inbox.",
    pricing_title: "Membership Tiers",
    pricing_subtitle: "Scale your operation. Cancel anytime.",
    tier_free: "Beta Tester",
    tier_free_price: "Free Access",
    tier_free_tokens: "Current Option (Current Alpha)",
    tier_free_badge: "ACTIVE: CURRENT ALPHA",
    tier_premium: "Alphabag (coming soon)",
    tier_premium_price: "Premium",
    tier_premium_tokens: "All Features Locked",
    tier_premium_badge: "ELIGIBILITY: GENESIS HOLDER"
  },
  "en-au": {
    nav_home: "Home",
    nav_features: "Features",
    nav_tokenomics: "Tokenomics",
    nav_buy: "Buy",
    nav_roadmap: "Roadmap",
    nav_faq: "FAQ",
    nav_pricing: "Pricing",
    hero_title_1: "Track Your Crypto",
    hero_title_2: "Total Stealth",
    hero_desc: "Manage diverse Web3 portfolios, track whale movements, and simulate your ROE with real-time accuracy. Access Alpha-grade trade signals and explore ways to earn in Australia.",
    btn_notify_me: "Build your portfolio",
    stat_assets: "Multi-Chain",
    stat_assets_lbl: "Wallet & CEX tracking",
    stat_members: "Early Access",
    stat_members_lbl: "Join the waitlist",
    stat_crypto: "T2E Rewards",
    stat_crypto_lbl: "Earn while you hold",
    calculator_title: "Alpha Calculator",
    calculator_badge: "Live Simulator",
    features_title: "Engineered for",
    features_title_alpha: "Alpha",
    features_subtitle: "Stop using spreadsheets. Upgrade to a hub aimed at maximizing yield and minimizing latency.",
    why_title: "Why",
    why_title_alpha: "AlphaBAG?",
    why_desc: "Built by traders, for traders. We strip away the noise and deliver high-frequency intelligence directly to your terminal. No emotional biases, just raw, actionable data.",
    why_latency_title: "Zero Latency Execution",
    why_latency_desc: "Unlike traditional dashboards that cache data for minutes, AlphaBAG connects directly to RPC nodes to provide split-second updates on whale movements and market shifts.",
    why_privacy_title: "Absolute Privacy",
    why_privacy_desc: "We operate in a fully stealth, read-only environment. Your private keys never touch our servers. Monitor your wealth with total peace of mind.",
    why_ai_title: "AlphaAi Integration",
    why_ai_desc: "Stop manually parsing charts. Our proprietary LLM analyzes technical structures and order book flow to deliver institutional-grade trade setups directly to your inbox.",
    pricing_title: "Membership Tiers",
    pricing_subtitle: "Scale your operation. Cancel anytime.",
    tier_free: "Beta Tester",
    tier_free_price: "Free Access",
    tier_free_tokens: "Current Option (Current Alpha)",
    tier_free_badge: "ACTIVE: CURRENT ALPHA",
    tier_premium: "Alphabag (coming soon)",
    tier_premium_price: "Premium",
    tier_premium_tokens: "All Features Locked",
    tier_premium_badge: "ELIGIBILITY: GENESIS HOLDER"
  },
  "en-bh": {
    nav_home: "Home",
    nav_features: "Features",
    nav_tokenomics: "Tokenomics",
    nav_buy: "Buy",
    nav_roadmap: "Roadmap",
    nav_faq: "FAQ",
    nav_pricing: "Pricing",
    hero_title_1: "Track Your Crypto",
    hero_title_2: "Total Stealth",
    hero_desc: "Manage diverse Web3 portfolios, track whale movements, and simulate your ROE with real-time accuracy. Access Alpha-grade trade signals and explore ways to earn in Bahrain.",
    btn_build_portfolio: "Build your portfolio",
    btn_join_community: "Join community",
    btn_notify_me: "Notify Me at Launch",
    stat_assets: "Multi-Chain",
    stat_assets_lbl: "Wallet & CEX tracking",
    stat_members: "Early Access",
    stat_members_lbl: "Join the waitlist",
    stat_crypto: "T2E Rewards",
    stat_crypto_lbl: "Earn while you hold",
    calculator_title: "Alpha Calculator",
    calculator_badge: "Live Simulator",
    features_title: "Engineered for",
    features_title_alpha: "Alpha",
    features_subtitle: "Stop using spreadsheets. Upgrade to a hub aimed at maximizing yield and minimizing latency.",
    why_title: "Why",
    why_title_alpha: "AlphaBAG?",
    why_desc: "Built by traders, for traders. We strip away the noise and deliver high-frequency intelligence directly to your terminal. No emotional biases, just raw, actionable data.",
    why_latency_title: "Zero Latency Execution",
    why_latency_desc: "Unlike traditional dashboards that cache data for minutes, AlphaBAG connects directly to RPC nodes to provide split-second updates on whale movements and market shifts.",
    why_privacy_title: "Absolute Privacy",
    why_privacy_desc: "We operate in a fully stealth, read-only environment. Your private keys never touch our servers. Monitor your wealth with total peace of mind.",
    why_ai_title: "AlphaAi Integration",
    why_ai_desc: "Stop manually parsing charts. Our proprietary LLM analyzes technical structures and order book flow to deliver institutional-grade trade setups directly to your inbox.",
    pricing_title: "Membership Tiers",
    pricing_subtitle: "Scale your operation. Cancel anytime.",
    tier_free: "Beta Tester",
    tier_free_price: "Free Access",
    tier_free_tokens: "Current Option (Current Alpha)",
    tier_free_badge: "ACTIVE: CURRENT ALPHA",
    tier_premium: "Alphabag (coming soon)",
    tier_premium_price: "Premium",
    tier_premium_tokens: "All Features Locked",
    tier_premium_badge: "ELIGIBILITY: GENESIS HOLDER"
  }
};

type RoadmapStatus = 'VERIFIED' | 'EXECUTING' | 'PENDING' | 'QUEUED';

type RoadmapPhase = {
  phase: string;
  title: string;
  status: RoadmapStatus;
  points: string[];
  note?: string;
  completed?: boolean;
};

const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 'PHASE 01',
    title: 'FOUNDATION_AND_CORE_SYSTEMS',
    status: 'EXECUTING',
    completed: true,
    points: [
      'Core dashboard infrastructure built for portfolio tracking and real-time market data',
      'AlphaAI research engine deployed for signal detection and trend analysis',
      'Security and privacy framework implemented with read-only wallet connections',
      'Internal testing completed for performance, stability, and user experience'
    ]
  },
  {
    phase: 'PHASE 02',
    title: 'BETA_LAUNCH_AND_COMMUNITY_ONBOARDING',
    status: 'PENDING',
    note: 'No requirements. Free for everyone during Beta.',
    points: [
      'Public Beta: Free access to portfolio tracking, alerts, and basic market dashboards',
      'Genesis Cohort: Early users onboarded via waitlist to test features and provide feedback',
      'AlphaAI Assistant: Context-aware insights and weekly strategy summaries for beta users',
      'Feedback Loops: Continuous UX improvements based on community input'
    ]
  },
  {
    phase: 'PHASE 03',
    title: 'UTILITY_AND_PREMIUM_EXPERIENCE',
    status: 'PENDING',
    note: 'Premium features roll out in stages. Early users get first access.',
    points: [
      'Ecosystem Activation: Introduce the ALPHABAG Passes to reward early supporters',
      'Pro Terminal: Advanced analytics, custom intelligence feeds, and priority data access',
      'Partner Integrations: Expanded data providers and execution tools for power users',
      'Tiered Access: Unlock higher frequency alerts and deeper insights through participation and loyalty'
    ]
  },
  {
    phase: 'PHASE 04',
    title: 'GLOBAL_SCALE_AND_INTELLIGENCE_NETWORK',
    status: 'QUEUED',
    points: [
      'Global Expansion: Localized onboarding and multi-language support',
      'Mobile Intelligence: Native apps with push alerts and real-time portfolio updates',
      'Institutional Reliability: Upgraded infrastructure for scale, uptime, and data accuracy',
      'Autonomous AI: Progressive upgrades toward self-learning research and strategy guidance'
    ]
  }
];

const ALPHA_PASS_STATS = [
  { label: 'Total Supply', value: '4,000', icon: <Layers size={20} /> },
  { label: 'Unique Traits', value: '200+', icon: <Palette size={20} /> },
  { label: 'Blockchain', value: 'BNB Chain', icon: <ShieldCheck size={20} /> },
  { label: 'Mint Price', value: '0.07 BNB', icon: <Diamond size={20} /> },
];

const ALPHA_PASS_UTILITIES = [
  {
    icon: <Zap size={24} />,
    title: 'Platform Access',
    desc: 'Unlock premium features, advanced analytics, and exclusive trading tools within the AlphaBAG ecosystem.',
  },
  {
    icon: <Crown size={24} />,
    title: 'Tier-Based Perks',
    desc: 'Rarity determines your tier — higher rarity grants elevated platform privileges and priority access.',
  },
  {
    icon: <Trophy size={24} />,
    title: 'T2E Boosters',
    desc: 'NFT holders receive multiplied Trade-to-Earn rewards, stacking with platform engagement.',
  },
  {
    icon: <Users size={24} />,
    title: 'DEX & CEX Wallet Tracking',
    desc: 'Track and manage your decentralized and centralized exchange wallets with real-time balance monitoring and analytics.',
  },
  {
    icon: <Star size={24} />,
    title: 'Airdrop Priority',
    desc: 'Holders are first in line for future token airdrops, partner project drops, and exclusive events.',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'Alpha Signals',
    desc: 'Access private alpha channels with institutional-grade trade signals and whale movement alerts.',
  },
];

const ALPHA_PASS_RARITY_TIERS = [
  { name: 'Common', pct: '50%', color: '#94a3b8' },
  { name: 'Rare', pct: '25%', color: '#3b82f6' },
  { name: 'Epic', pct: '15%', color: '#a855f7' },
  { name: 'Legendary', pct: '8%', color: '#f59e0b' },
  { name: 'Mythic', pct: '2%', color: '#ef4444' },
];

export type LandingTab = 'home' | 'features' | 'tokenomics' | 'alpha-pass' | 'roadmap' | 'faq' | 'calculator' | 'markets';

export const Landing: React.FC = () => {
  useWeb3Modal();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: LandingTab[] = ['home', 'features', 'tokenomics', 'alpha-pass', 'roadmap', 'faq', 'calculator', 'markets'];
  const rawTab = searchParams.get('tab');
  const initialTab: LandingTab = (rawTab && validTabs.includes(rawTab as LandingTab))
    ? (rawTab as LandingTab)
    : (rawTab === 'alpha-access' || rawTab === 'nft' ? 'alpha-pass' : 'home');

  const [activeTab, setActiveTab] = useState<LandingTab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'alpha-pass' || tabParam === 'alpha-access' || tabParam === 'nft') {
      setActiveTab('alpha-pass');
    } else if (tabParam && validTabs.includes(tabParam as LandingTab)) {
      setActiveTab(tabParam as LandingTab);
    }
  }, [searchParams]);
  const [teaserCountdown, setTeaserCountdown] = useState<CountdownState>(() => getTeaserCountdown(TEASER_LAUNCH_AT));
  const [openRoadmapItems, setOpenRoadmapItems] = useState<number[]>([0, 1]);
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>('all');
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const t = (key: string): string => {
    return TRANSLATIONS['en']?.[key] || '';
  };


  useEffect(() => {
    // Only redirect to app if NOT in teaser mode and user is authenticated
    if (!IS_TEASER_MODE && isAuthenticated) {
      navigate('/airdrop');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const tick = () => setTeaserCountdown(getTeaserCountdown(TEASER_LAUNCH_AT));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!legalModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLegalModal(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [legalModal]);

  useEffect(() => {
    const siteUrl = import.meta.env.VITE_SITE_URL || FALLBACK_SITE_URL;
    const canonical = `${window.location.origin}${window.location.pathname}`;
    const pageTitle = 'AlphaBAG | Crypto Portfolio Tracker, Whale Alerts & AI Market Intelligence';
    const pageDescription = 'AlphaBAG helps crypto investors track multi-chain portfolios, monitor whale activity, and use AI-powered market intelligence with a live leverage simulator.';

    document.title = pageTitle;
    setCanonicalLink(canonical || siteUrl);

    setMetaTag('description', pageDescription);
    setMetaTag('keywords', LANDING_TOP_SEARCHES.join(', '));
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('author', 'AlphaBAG');
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', pageTitle);
    setMetaTag('twitter:description', pageDescription);
    setMetaTag('twitter:image', `${siteUrl}/hero-dashboard.png`);

    setPropertyMetaTag('og:type', 'website');
    setPropertyMetaTag('og:site_name', 'AlphaBAG');
    setPropertyMetaTag('og:url', canonical || siteUrl);
    setPropertyMetaTag('og:title', pageTitle);
    setPropertyMetaTag('og:description', pageDescription);
    setPropertyMetaTag('og:image', `${siteUrl}/hero-dashboard.png`);

    const websiteLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AlphaBAG',
      url: siteUrl,
      description: pageDescription,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/#/markets?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    const softwareLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'AlphaBAG',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Beta access and teaser launch waitlist'
      },
      featureList: [
        'Multi-chain portfolio tracking',
        'Whale wallet movement alerts',
        'AI market intelligence and analysis',
        'Leverage and PnL simulation calculator',
        'Trade-to-earn ecosystem onboarding'
      ],
      url: siteUrl
    };

    const orgLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'AlphaBAG',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      sameAs: ['https://x.com/myalphabag', 'https://t.me/alphabag_access']
    };

    const faqLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is AlphaBAG?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AlphaBAG is a crypto intelligence terminal that combines multi-chain portfolio tracking, whale activity monitoring, and AI-powered market analysis in one dashboard.'
          }
        },
        {
          '@type': 'Question',
          name: 'Is AlphaBAG wallet tracking secure?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. AlphaBAG uses a strict read-only model and never requests private keys, so users can monitor wallets without exposing signing credentials.'
          }
        },
        {
          '@type': 'Question',
          name: 'How does Genesis access work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'During the Genesis phase, access is rolled out in tiers. Eligible users from the AlphaBAG community unlock expanded tools as release milestones are completed.'
          }
        },
        {
          '@type': 'Question',
          name: 'What can AlphaAI do in AlphaBAG?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AlphaAI analyzes portfolio context, market structure, and momentum signals to generate concise, actionable insights for faster decision-making.'
          }
        },
        {
          '@type': 'Question',
          name: 'Which blockchain networks are supported?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AlphaBAG currently supports major EVM networks including Ethereum, BNB Chain, Polygon, Arbitrum, Avalanche, and Base, plus Solana, with additional integrations in development.'
          }
        }
      ]
    };

    const scripts = [
      upsertStructuredData('alphabag-schema-website', websiteLd),
      upsertStructuredData('alphabag-schema-software', softwareLd),
      upsertStructuredData('alphabag-schema-org', orgLd),
      upsertStructuredData('alphabag-schema-faq', faqLd)
    ];

    return () => {
      scripts.forEach((script) => {
        if (script.parentNode) script.parentNode.removeChild(script);
      });
    };
  }, []);

  const handleLaunchApp = () => {
    if (IS_TEASER_MODE) {
      // In teaser mode, convert visitors to the community funnel directly.
      window.open('https://t.me/alphabag_access', '_blank', 'noopener,noreferrer');
      return;
    }
    if (isAuthenticated) {
      navigate('/airdrop');
    } else {
      window.dispatchEvent(new Event('open-login-modal'));
    }
  };




  const handleNavClick = (tab: LandingTab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      setSearchParams(next, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleRoadmapItem = (index: number) => {
    setOpenRoadmapItems((prev) => (
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    ));
  };

  return (
    
      <div className="min-h-screen text-alphabag-text overflow-x-hidden bg-alphabag-black" style={{ backgroundImage: 'radial-gradient(circle at 18% 12%, rgba(245, 203, 66, 0.08), transparent 26%), radial-gradient(circle at 86% 8%, rgba(255, 255, 255, 0.05), transparent 22%), linear-gradient(180deg, rgba(22,26,34,1) 0%, rgba(22,26,34,1) 100%)' }}>
      <SEO
        title="AlphaBAG | Crypto Portfolio Tracker, Whale Alerts & AI Market Intelligence"
        description="AlphaBAG helps crypto investors track multi-chain portfolios, monitor whale activity, and use AI-powered market intelligence with a live leverage simulator."
        canonicalUrl="/"
        structuredData={[buildWebsiteSchema(), buildOrganizationSchema(), buildSoftwareAppSchema()]}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-alphabag-gray bg-alphabag-dark/95">
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
          
          {/* Left Side: Logo + Nav Links (Binance layout) */}
          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-2 cursor-pointer shrink-0" onClick={() => handleNavClick('home')}>
              <img src="/logo.png" alt="AlphaBAG Logo" className="w-6 h-6 object-contain rounded-full " />
              <span className="text-lg font-bold tracking-tight text-alphabag-yellow">ALPHABAG</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-5 text-sm font-medium text-alphabag-subtext">
              <button onClick={() => handleNavClick('home')} className={`transition-colors ${activeTab === 'home' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_home')}</button>
              <button onClick={() => handleNavClick('features')} className={`transition-colors ${activeTab === 'features' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_features')}</button>
              <button onClick={() => handleNavClick('tokenomics')} className={`transition-colors ${activeTab === 'tokenomics' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_tokenomics')}</button>
              <button onClick={() => handleNavClick('alpha-pass')} className={`transition-colors ${activeTab === 'alpha-pass' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_alpha_pass') || 'Alpha Pass'}</button>
              <button onClick={() => handleNavClick('roadmap')} className={`transition-colors ${activeTab === 'roadmap' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_roadmap')}</button>
              <button onClick={() => handleNavClick('faq')} className={`transition-colors ${activeTab === 'faq' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_faq')}</button>
            </div>
          </div>

          {/* Right Side: Wallet/Login Buttons */}
          <div className="hidden md:flex items-center space-x-2">

            {/* Main Auth/Demo CTAs */}
            {IS_TEASER_MODE ? (
              <Button size="sm" onClick={handleLaunchApp} className="font-semibold px-6 bg-alphabag-yellow text-black hover:bg-yellow-400 border-none cursor-pointer">
                JOIN US
              </Button>
            ) : !isAuthenticated ? (
              <Button
                size="sm"
                className="font-semibold px-6 bg-alphabag-yellow text-black border-none cursor-default opacity-90 select-none"
              >
                Connect Soon
              </Button>
            ) : (
              <Button size="sm" onClick={handleLaunchApp} className="font-semibold px-6 bg-alphabag-yellow text-black hover:bg-yellow-400 border-none cursor-pointer">
                Open App
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button className="text-alphabag-text" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <LayoutGrid />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full backdrop-blur-xl border-b border-alphabag-gray p-4 flex flex-col space-y-2 animate-slide-in bg-alphabag-dark/95">
            <button onClick={() => handleNavClick('home')} className={`text-left py-2 text-sm font-medium ${activeTab === 'home' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_home')}</button>
            <button onClick={() => handleNavClick('features')} className={`text-left py-2 text-sm font-medium ${activeTab === 'features' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_features')}</button>
            <button onClick={() => handleNavClick('tokenomics')} className={`text-left py-2 text-sm font-medium ${activeTab === 'tokenomics' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_tokenomics')}</button>
            <button onClick={() => handleNavClick('alpha-pass')} className={`text-left py-2 text-sm font-medium ${activeTab === 'alpha-pass' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_alpha_pass') || 'Alpha Pass'}</button>
            <button onClick={() => handleNavClick('roadmap')} className={`text-left py-2 text-sm font-medium ${activeTab === 'roadmap' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_roadmap')}</button>
            <button onClick={() => handleNavClick('faq')} className={`text-left py-2 text-sm font-medium ${activeTab === 'faq' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_faq')}</button>
            <Button
              size="lg"
              className="w-full font-semibold bg-alphabag-yellow text-black cursor-default opacity-90 select-none"
            >
              Connect Soon
            </Button>
          </div>
        )}
      </nav>

      {/* Dynamic Content Area */}
      <div className="flex flex-col w-full min-h-[85vh]">

        {/* Hero Section */}
        {activeTab === 'home' && (
          <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center" >

            <div className="max-w-[1400px] mx-auto w-full relative z-10 flex flex-col items-center xl:px-8">
              
              {/* Split Layout: Hero Text & Calculator side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start w-full">
                
                {/* Left Column: Copy & Stats */}
                <div className="lg:col-span-6 text-left space-y-2 flex flex-col justify-center">
                  <h1 className="text-4xl md:text-6xl lg:text-[68px] font-bold text-alphabag-text leading-[0.88] tracking-[-0.04em]">
                    <span className="block">{t('hero_title_1')}</span>
                    <span className="block mt-1">
                      <span className="inline-block align-middle text-[0.38em] md:text-[0.34em] lg:text-[0.32em] font-semibold text-alphabag-text/80 tracking-[-0.02em] mr-3">with</span>
                      <span className="inline-block align-middle text-alphabag-yellow">{t('hero_title_2')}</span>
                    </span>
                  </h1>

                  <p className="text-base md:text-lg text-alphabag-subtext leading-relaxed font-normal animate-fade-in-up delay-100 max-w-xl">
                    {t('hero_desc')}
                  </p>

                  <div className="w-full max-w-xl animate-fade-in-up delay-200">
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3">
                      <Button
                        size="lg"
                        className="w-full sm:flex-1 px-8 py-4 text-base font-semibold bg-alphabag-yellow text-black border-none transition-all cursor-default opacity-90 select-none"
                      >
                        Track Smart
                      </Button>
                      <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer" className="w-full sm:flex-1">
                        <Button variant="outline" size="lg" className="w-full px-8 py-4 text-base border-alphabag-gray hover:border-alphabag-muted hover:bg-alphabag-gray/40 backdrop-blur-md text-alphabag-text font-medium transition-all flex items-center justify-center gap-2 cursor-pointer">
                          <Send size={16} /> {t('btn_join_community')}
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Pre-TGE Countdown Timer */}
                  <div className="mt-3 rounded-2xl border border-alphabag-yellow/30 bg-alphabag-darkgray/70 p-3 max-w-xl backdrop-blur-sm animate-fade-in-up delay-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-yellow flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-alphabag-yellow animate-ping inline-block"></span>
                        {teaserCountdown.isLive ? 'Live now' : 'BETA TESTING COUNT DOWN'}
                      </div>
                      <div className="text-[10px] text-alphabag-subtext font-semibold uppercase">Early Access</div>
                    </div>

                    {teaserCountdown.isLive ? (
                      <div className="rounded-lg border border-alphabag-yellow/40 bg-alphabag-black/60 px-4 py-3 text-center">
                        <div className="text-xl md:text-2xl font-black text-alphabag-yellow">LIVE NOW</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Days', value: teaserCountdown.days },
                          { label: 'Hours', value: teaserCountdown.hours },
                          { label: 'Min', value: teaserCountdown.minutes },
                          { label: 'Sec', value: teaserCountdown.seconds }
                        ].map((item) => (
                          <div key={item.label} className="rounded-lg border border-alphabag-gray bg-alphabag-black/60 py-1.5 text-center">
                            <div className="text-lg md:text-xl font-black text-alphabag-yellow tabular-nums leading-tight">{item.value}</div>
                            <div className="text-[8px] uppercase font-semibold tracking-widest text-alphabag-subtext mt-1">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats Section */}
                  <div className="flex flex-wrap gap-x-5 gap-y-3 md:gap-x-8 md:gap-y-3 pt-6 border-t border-alphabag-gray mt-6 animate-fade-in-up delay-300">
                    <div className="space-y-1.5">
                      <div className="text-2xl font-bold text-alphabag-text leading-tight">{t('stat_assets')}</div>
                      <div className="text-xs font-semibold text-alphabag-subtext leading-relaxed">{t('stat_assets_lbl')}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-2xl font-bold text-alphabag-text leading-tight">AlphaCalls</div>
                      <div className="text-xs font-semibold text-alphabag-subtext leading-relaxed">Trade smarter</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-2xl font-bold text-alphabag-text leading-tight">{t('stat_crypto')}</div>
                      <div className="text-xs font-semibold text-alphabag-subtext leading-relaxed">{t('stat_crypto_lbl')}</div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Calculator Card */}
                <div className="lg:col-span-6 w-full bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-4 shadow-2xl relative overflow-hidden lg:h-[630px] lg:overflow-y-auto custom-scrollbar">
                  
                  <div className="mb-2 border-b border-alphabag-gray pb-3">
                    <h3 className="text-sm font-semibold text-alphabag-text uppercase tracking-wider flex items-center gap-2">
                      <CalculatorIcon size={16} className="text-alphabag-yellow" /> {t('calculator_title')}
                    </h3>
                  </div>
                  <Calculator minimal={true} />
                </div>

              </div>

              {/* 3D Dashboard Preview */}
              <div className="mt-24 relative max-w-7xl w-full mx-auto opacity-40 hover:opacity-100 transition-opacity duration-1000 block">
                <div className="bg-alphabag-dark rounded-[20px] overflow-hidden relative shadow-2xl border border-alphabag-gray mask-image-b">
                  <img
                    src="/hero-dashboard.png"
                    alt="Dashboard Interface"
                    className="w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-alphabag-black via-alphabag-black/50 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {legalModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
            <button
              type="button"
              aria-label="Close legal information"
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setLegalModal(null)}
            />

            <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-alphabag-gray/80 bg-alphabag-darkgray p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-alphabag-text">
                  {legalModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                </h3>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => setLegalModal(null)}
                  className="rounded-full border border-alphabag-gray bg-alphabag-black/60 p-2 text-alphabag-subtext transition-colors hover:text-alphabag-text"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-sm leading-7 text-alphabag-subtext">
                {legalModal === 'terms' ? (
                  <>
                    <p>These Terms & Conditions govern access to the AlphaBAG teaser experience and any future AlphaBAG products, services, or community access made available through the platform.</p>
                    <p>By using this website, you confirm that you are at least 18 years old and that you are accessing the materials for informational purposes only. AlphaBAG does not provide regulated financial, legal, or tax advice.</p>
                    <p>All product features, launch timing, waitlist status, and community access are subject to change without notice. We reserve the right to pause, alter, or discontinue any feature, beta access, or early-access program at our discretion.</p>
                    <p>Any references to portfolio performance, market signals, calculators, or projected returns are illustrative and should not be interpreted as guarantees of profit, investment advice, or contractual commitments.</p>
                    <p>Users remain responsible for their own decisions, including any trades, wallet actions, or financial commitments made using data or tools available through AlphaBAG.</p>
                  </>
                ) : (
                  <>
                    <p>AlphaBAG respects your privacy and is designed with a read-only, privacy-first model. We do not require your private keys or seed phrases to access informational features on this site.</p>
                    <p>We may collect basic usage, analytics, and contact information when you interact with the site, sign up for early access, or join our community channels. This information is used to improve service quality, support product onboarding, and communicate launch updates.</p>
                    <p>We do not sell personal data. We may share necessary information with trusted service providers that support hosting, analytics, or communication infrastructure under strict confidentiality obligations.</p>
                    <p>Cookies and similar technologies may be used to improve site performance, remember preferences, and monitor aggregate engagement patterns. You can manage cookies through your browser settings.</p>
                    <p>By continuing to use the site, you agree to the collection and processing of information described in this privacy notice. For any questions, contact the AlphaBAG team through official community channels or support contacts published on the site.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        {activeTab === 'features' && (
          <section id="features" className="py-24 px-6 min-h-[85vh] flex flex-col justify-center">
            <div className="max-w-7xl mx-auto w-full">
              {/* Main Header */}
              <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-semibold mb-3 tracking-tight text-alphabag-text">
                  Engineered for <span className="text-alphabag-yellow">Alpha</span>
                </h2>
                <p className="text-base md:text-lg text-alphabag-subtext font-normal">
                  Stop guessing. Start trading with data.
                </p>
              </div>

              {/* 9-Card Specific Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                <FeatureHighlight
                  icon={<Bot className="text-alphabag-yellow" />}
                  title="ALPHA AI AGENT"
                  tagline="Ask anything about your portfolio — get answers you can verify."
                  desc="AlphaAI reads your actual positions — wallet tokens, LP, lending, staking, and CEX balances — and answers with sourced, timestamped data. Every number it states traces back to a real source. If it doesn't have the data, it says so. No hallucinated PnL. No vague hype. Just what your positions are actually doing."
                />
                <FeatureHighlight
                  icon={<Layers className="text-blue-400" />}
                  title="ALL CHAINS. ONE DASHBOARD."
                  tagline="Ethereum, Base, Arbitrum, Polygon, BNB Chain, Avalanche — and Solana when it ships."
                  desc="One wallet. Every chain. Every position. No tab switching, no manual reconciliation. 100% read-only by design — nothing can move without your signature."
                />
                <FeatureHighlight
                  icon={<BarChart3 className="text-green-400" />}
                  title="WHALE WATCH"
                  tagline="Know the moment smart money moves."
                  desc="Configure which wallets matter to you, set your size thresholds, and get alerted seconds after a trade hits the chain — with the size, the direction, and the destination attached. See the trade as it happens. Not a summary the next morning."
                />
                <FeatureHighlight
                  icon={<Wallet className="text-purple-400" />}
                  title="CEX + DEX UNIFIED"
                  tagline="One number that finally tells the truth."
                  desc="Spot, Earn, funding, and futures balances from your exchanges. LP, lending, staking, and wallet holdings on-chain. Borrowed debt subtracted. Spam tokens excluded. This is your real net worth — not a spot-only approximation that misses 30% of your portfolio."
                />
                <FeatureHighlight
                  icon={<CalculatorIcon className="text-pink-400" />}
                  title="TRADE SIMULATOR"
                  tagline="Model the trade before you commit the capital."
                  desc="Test spot and futures strategies against live data. Adjust size, leverage, and timing. See what your edge would have produced. No capital at risk. No trades executed on your behalf — ever."
                />
                <FeatureHighlight
                  icon={<Trophy className="text-alphabag-yellow" />}
                  title="EARN WHILE YOU TRADE"
                  tagline="Complete missions. Share insights. Climb the leaderboard."
                  desc="Every action during Beta earns Points. When rewards go live, Points convert — and early users get the biggest multipliers. Pass holders stack on top. The earlier you're in, the more it compounds."
                />
                <FeatureHighlight
                  icon={<Zap className="text-blue-400" />}
                  title="SOURCE-TAGGED DATA"
                  tagline="Every number carries its age."
                  desc="Prices refresh in under 2 seconds. Balances every 6 seconds. DeFi position decodes run on a longer cycle — because reading a Uniswap V3 LP position takes more than one RPC call. We show you the timestamp so you always know how fresh the number is. No hidden caching. No mystery delays."
                />
                <FeatureHighlight
                  icon={<ShieldCheck className="text-green-400" />}
                  title="READ-ONLY BY DESIGN"
                  tagline="We never see your keys. Ever."
                  desc="No private keys. No seed phrases. CEX credentials are encrypted with AES-256-GCM — and we refuse any key with withdrawal or transfer permissions, by design. Admins can't see your secrets. Neither can we."
                />
                <FeatureHighlight
                  icon={<Lock className="text-indigo-400" />}
                  title="APPROVAL SCANNER"
                  tagline="See every contract you've ever approved — and revoke in one click."
                  desc="Most wallets carry dozens of stale token approvals from protocols you've forgotten. Each one is a standing invitation. We scan your entire approval history, flag risky ones, and let you revoke directly from the dashboard."
                />
              </div>

              {/* WHY ALPHABAG Section */}
              <div className="mt-24 pt-16 border-t border-alphabag-border relative">
                <div className="text-center mb-14 max-w-3xl mx-auto">
                  <h2 className="text-2xl md:text-4xl font-semibold mb-2 tracking-tight text-alphabag-text">
                    Why <span className="text-alphabag-yellow">AlphaBAG?</span>
                  </h2>
                  <p className="text-base md:text-lg text-alphabag-text font-medium mb-2">
                    Built by traders who got tired of numbers without sources.
                  </p>
                  <p className="text-sm text-alphabag-subtext leading-relaxed max-w-2xl mx-auto">
                    Most dashboards show you a figure and hide where it came from. We show you the number, the source, and the timestamp — every time. No hidden staleness. No phantom positions. Just data you can act on.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
                  <div className="bg-alphabag-dark/50 border border-alphabag-border p-6 rounded-xl shadow-panel">
                    <div className="w-9 h-9 bg-alphabag-yellow/10 text-alphabag-yellow flex items-center justify-center rounded-lg border border-alphabag-yellow/20 mb-3.5">
                      <TrendingUp size={18} />
                    </div>
                    <h4 className="text-base font-semibold font-mono text-alphabag-text mb-1 uppercase">SIGNALS WITH RECEIPTS</h4>
                    <p className="text-xs font-mono font-medium text-alphabag-yellow/90 mb-2">Stop drawing lines manually.</p>
                    <p className="text-[13px] text-alphabag-subtext leading-relaxed">
                      AlphaAI reads order flow, on-chain activity, and market structure — and surfaces what's worth your attention, with the data behind every call. You decide what to do with it. We never tell you to buy or sell.
                    </p>
                  </div>

                  <div className="bg-alphabag-dark/50 border border-alphabag-border p-6 rounded-xl shadow-panel">
                    <div className="w-9 h-9 bg-rose-500/10 text-rose-400 flex items-center justify-center rounded-lg border border-rose-500/20 mb-3.5">
                      <Zap size={18} />
                    </div>
                    <h4 className="text-base font-semibold font-mono text-alphabag-text mb-1 uppercase">POSITION HEALTH ALERTS</h4>
                    <p className="text-xs font-mono font-medium text-alphabag-yellow/90 mb-2">Get pinged before your health factor gets dangerous.</p>
                    <p className="text-[13px] text-alphabag-subtext leading-relaxed">
                      Set thresholds on your Aave and Compound positions. We watch the health factor in the background and alert you the moment it drifts into risky territory — long before the liquidation engine does.
                    </p>
                  </div>

                  <div className="bg-alphabag-dark/50 border border-alphabag-border p-6 rounded-xl shadow-panel">
                    <div className="w-9 h-9 bg-blue-500/10 text-blue-400 flex items-center justify-center rounded-lg border border-blue-500/20 mb-3.5">
                      <PieChart size={18} />
                    </div>
                    <h4 className="text-base font-semibold font-mono text-alphabag-text mb-1 uppercase">COST BASIS TRACKING</h4>
                    <p className="text-xs font-mono font-medium text-alphabag-yellow/90 mb-2">Know your real PnL. Not an approximation.</p>
                    <p className="text-[13px] text-alphabag-subtext leading-relaxed">
                      We match your buys, sells, LP entry/exit, and CEX trades to give you cost basis per asset — FIFO or LIFO. Export when tax season arrives with exact trade provenance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Alphanomics Section (formerly Tokenomics) — masked with Coming Soon */}
        {activeTab === 'tokenomics' && (
          <section className="relative py-32 px-6 min-h-[85vh] flex flex-col justify-center">


            <div className="max-w-7xl mx-auto relative z-10 w-full">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-semibold mb-2 tracking-tight text-alphabag-text">Alphabag <span className="text-alphabag-yellow">Alphanomics</span></h2>
                <p className="text-alphabag-subtext text-sm max-w-4xl mx-auto leading-relaxed">Detailed token distribution and exact tokenomics for Alphabag ecosystem</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Left Column: Metrics */}
                <div className="lg:col-span-1 flex flex-col gap-2">
                  <TokenMetricCard label="Token Name" value="AlphaBAG (Not Yet Live)" icon={<Briefcase />} />
                  <TokenMetricCard label="Ticker" value="TBA" icon={<TrendingUp />} />
                  <TokenMetricCard label="Network" value="BNB Smart Chain" icon={<LayoutGrid />} />
                  <TokenMetricCard label="Total Supply" value="21,000,000" icon={<PieChart />} />
                  <TokenMetricCard label="Contract Address" value="TBA" icon={<Lock />} />
                </div>

                {/* Right Column: Allocations Unmasked */}
                <div className="lg:col-span-2 relative bg-alphabag-darkgray border border-alphabag-gray rounded-3xl p-4 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full h-full">
                    <TokenomicsDetailCard 
                      title="Liquidity Pool (LP)" 
                      percentage="30%" 
                      subtitle={<>6,300,000 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-alphabag-black border border-alphabag-yellow/40 text-alphabag-yellow text-[11px] font-mono font-bold tracking-wider select-none shadow-sm ml-1"><Lock size={10} className="inline opacity-80" />***</span></>} 
                      desc="Paired initially with BNB upon PancakeSwap deployment. Burnt to secure the market floor." 
                    />
                    <TokenomicsDetailCard 
                      title="Trade-to-Earn (T2E)" 
                      percentage="35%" 
                      subtitle={<>7,350,000 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-alphabag-black border border-alphabag-yellow/40 text-alphabag-yellow text-[11px] font-mono font-bold tracking-wider select-none shadow-sm ml-1"><Lock size={10} className="inline opacity-80" />***</span></>} 
                      desc="Systematic emissions for missions & platform rewards. Locked for 6 months. Unlocked to begin T2E reward system for all community." 
                    />
                    <TokenomicsDetailCard 
                      title="Development & Ecosystem" 
                      percentage="15%" 
                      subtitle={<>3,150,000 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-alphabag-black border border-alphabag-yellow/40 text-alphabag-yellow text-[11px] font-mono font-bold tracking-wider select-none shadow-sm ml-1"><Lock size={10} className="inline opacity-80" />***</span></>} 
                      desc="Infrastructure, API integrations & core platform upgrades. Locked for 6 months." 
                    />
                    <TokenomicsDetailCard 
                      title="Marketing & Strategic Growth" 
                      percentage="10%" 
                      subtitle={<>2,100,000 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-alphabag-black border border-alphabag-yellow/40 text-alphabag-yellow text-[11px] font-mono font-bold tracking-wider select-none shadow-sm ml-1"><Lock size={10} className="inline opacity-80" />***</span></>} 
                      desc="Ecosystem expansion & strategic partnerships. Locked for 6 months to build organic community and partnerships." 
                    />
                    <TokenomicsDetailCard 
                      title="Team & Advisors" 
                      percentage="10%" 
                      subtitle={<>2,100,000 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-alphabag-black border border-alphabag-yellow/40 text-alphabag-yellow text-[11px] font-mono font-bold tracking-wider select-none shadow-sm ml-1"><Lock size={10} className="inline opacity-80" />***</span></>} 
                      desc="Team Allocation Locked for 24 months. Unlocked in phases." 
                    />
                    <TokenomicsDetailCard title="TOTAL SUPPLY" percentage="100%" subtitle="21,000,000" desc="Strictly hard-capped supply. No mint function exists post-deployment." highlight />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        
        {/* Alpha Pass Section — masked with centralized Coming Soon */}
        {activeTab === 'alpha-pass' && (
          <section className="relative py-28 px-6 min-h-[85vh] flex flex-col justify-center">


            <div className="max-w-7xl mx-auto relative z-10 w-full space-y-16">
              {/* Collection Hero & Mint Card */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                <div className="flex flex-col justify-between space-y-6">
                  <div>

                    <h2 className="text-4xl md:text-6xl font-black tracking-tight text-alphabag-text leading-[1.1] mb-4">
                      Alpha<span className="text-alphabag-yellow">BAG</span> Pass
                    </h2>
                    <p className="text-alphabag-subtext text-base md:text-lg leading-relaxed max-w-xl">
                      A curated collection of <span className="text-alphabag-yellow font-semibold">exclusive NFT art pieces</span> designed 
                      to serve as your key to the AlphaBAG ecosystem. Each piece unlocks platform utility,
                      governance rights, and enhanced earning potential.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {ALPHA_PASS_STATS.map((stat) => (
                      <div key={stat.label} className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-alphabag-black border border-alphabag-gray flex items-center justify-center text-alphabag-yellow">
                          {stat.icon}
                        </div>
                        <div>
                          <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider">{stat.label}</div>
                          <div className="text-lg font-bold text-alphabag-text">{stat.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button disabled className="flex-1 px-8 py-4 rounded-xl bg-alphabag-yellow/20 text-alphabag-yellow font-bold text-base border border-alphabag-yellow/30 cursor-not-allowed flex items-center justify-center gap-2">
                      <Wallet size={18} /> Mint Coming Soon
                    </button>
                    <button disabled className="px-6 py-4 rounded-xl bg-alphabag-darkgray text-alphabag-subtext font-semibold text-base border border-alphabag-gray cursor-not-allowed flex items-center justify-center gap-2">
                      <ImageIcon size={18} /> View Gallery
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-alphabag-darkgray border border-alphabag-gray rounded-3xl p-6 md:p-8 shadow-2xl">
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-alphabag-text uppercase tracking-wider">Mint Progress</span>
                        <span className="text-sm font-mono font-bold text-alphabag-yellow">0 / 4,000</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-alphabag-black border border-alphabag-gray overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-alphabag-yellow to-yellow-600" style={{ width: '0%' }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider">
                        <span>0% Minted</span>
                        <span>Phase 1</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-alphabag-black rounded-xl p-4 border border-alphabag-gray text-center">
                        <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-1">Price</div>
                        <div className="text-xl font-black text-alphabag-yellow">0.07 BNB</div>
                      </div>
                      <div className="bg-alphabag-black rounded-xl p-4 border border-alphabag-gray text-center">
                        <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-1">Max Per Wallet</div>
                        <div className="text-xl font-black text-alphabag-text">5</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xs text-alphabag-subtext font-semibold uppercase tracking-wider mb-2">Quantity</div>
                      <div className="flex items-center gap-3">
                        <button disabled className="w-10 h-10 rounded-xl bg-alphabag-black border border-alphabag-gray text-alphabag-subtext font-bold text-lg cursor-not-allowed">-</button>
                        <div className="flex-1 h-10 rounded-xl bg-alphabag-black border border-alphabag-gray flex items-center justify-center text-lg font-bold text-alphabag-text">1</div>
                        <button disabled className="w-10 h-10 rounded-xl bg-alphabag-black border border-alphabag-gray text-alphabag-subtext font-bold text-lg cursor-not-allowed">+</button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 py-3 border-t border-b border-alphabag-gray">
                      <span className="text-sm font-semibold text-alphabag-subtext">Total</span>
                      <span className="text-lg font-black text-alphabag-yellow">0.07 BNB</span>
                    </div>

                    <button disabled className="w-full py-4 rounded-xl bg-alphabag-yellow/20 text-alphabag-yellow font-bold text-base border border-alphabag-yellow/30 cursor-not-allowed flex items-center justify-center gap-2">
                      <Lock size={18} /> Connect Wallet to Mint
                    </button>

                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs text-alphabag-subtext font-semibold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-yellow-500/60 animate-pulse" />
                        Minting Not Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Utility Grid */}
              <div>
                <div className="text-center mb-10">
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-alphabag-text mb-2">
                    Pass <span className="text-alphabag-yellow">Utility</span>
                  </h3>
                  <p className="text-alphabag-subtext text-sm md:text-base max-w-xl mx-auto">
                    Every Alpha Pass NFT is more than art — it's your key to the AlphaBAG ecosystem.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALPHA_PASS_UTILITIES.map((feat) => (
                    <div key={feat.title} className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-6 hover:border-alphabag-muted transition-all">
                      <div className="w-12 h-12 rounded-xl bg-alphabag-black border border-alphabag-gray flex items-center justify-center text-alphabag-yellow mb-4">
                        {feat.icon}
                      </div>
                      <h4 className="text-base font-bold text-alphabag-text mb-2">{feat.title}</h4>
                      <p className="text-sm text-alphabag-subtext leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rarity Tiers */}
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-alphabag-text mb-2">
                    Rarity <span className="text-alphabag-yellow">Tiers</span>
                  </h3>
                  <p className="text-alphabag-subtext text-sm md:text-base max-w-lg mx-auto">
                    5 rarity levels determine your tier and unlock escalating platform benefits.
                  </p>
                </div>

                <div className="space-y-3">
                  {ALPHA_PASS_RARITY_TIERS.map((tier) => (
                    <div key={tier.name} className="bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-5 flex items-center justify-between hover:border-alphabag-muted transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ borderColor: tier.color + '60', background: tier.color + '15' }}>
                          <Gem size={20} style={{ color: tier.color }} />
                        </div>
                        <div>
                          <div className="text-base font-bold text-alphabag-text">{tier.name}</div>
                          <div className="text-xs text-alphabag-subtext font-medium">{tier.pct} Allocation</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden sm:block w-32 h-2 rounded-full bg-alphabag-black border border-alphabag-gray overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: tier.pct, background: tier.color }} />
                        </div>
                        <div className="text-lg font-black min-w-[50px] text-right" style={{ color: tier.color }}>{tier.pct}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Terminal Roadmap Section */}
        {activeTab === 'roadmap' && (
          <section id="roadmap" className="py-24 px-6 relative overflow-hidden bg-alphabag-black/40 min-h-[85vh] flex flex-col justify-center">
            <div className="max-w-4xl mx-auto relative z-10 w-full">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-semibold mb-2 tracking-tight text-alphabag-text">
                  Alpha<span className="text-alphabag-yellow">Map</span>
                </h2>
                <p className="text-sm md:text-base text-alphabag-subtext">Network Deployment Phases</p>
              </div>

              {/* Clean, professional roadmap accordion */}
              <div className="space-y-4">
                {ROADMAP_PHASES.map((phase, index) => {
                  const isOpen = openRoadmapItems.includes(index);
                  const statusStyles = {
                    VERIFIED: 'text-green-400 border-green-500/30 bg-green-500/10',
                    EXECUTING: 'text-alphabag-yellow border-alphabag-yellow/30 bg-alphabag-yellow/10',
                    PENDING: 'text-blue-400 border-blue-400/30 bg-blue-500/10',
                    QUEUED: 'text-alphabag-subtext border-alphabag-border bg-alphabag-border/20',
                  } as const;

                  return (
                    <div
                      key={phase.phase}
                      className="rounded-xl border border-alphabag-border bg-alphabag-dark/60 overflow-hidden shadow-panel hover:border-alphabag-border-light transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleRoadmapItem(index)}
                        aria-expanded={isOpen}
                        className="w-full p-5 md:p-6 text-left flex items-start justify-between gap-4 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                            <span className="text-xs font-mono font-medium text-alphabag-subtext tracking-wider">
                              {phase.phase}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-mono font-medium uppercase tracking-wider rounded border ${statusStyles[phase.status]}`}
                            >
                              STATUS: {phase.status}
                            </span>
                          </div>
                          <h3 className="text-sm md:text-base font-semibold font-mono tracking-tight uppercase text-alphabag-text break-words">
                            {'>'} {phase.title}
                          </h3>
                        </div>
                        <div className="w-7 h-7 rounded-md bg-alphabag-darkgray flex items-center justify-center text-alphabag-subtext shrink-0 mt-0.5">
                          <ChevronRight
                            size={14}
                            className={`transition-transform duration-200 ${isOpen ? 'rotate-90 text-alphabag-text' : ''}`}
                          />
                        </div>
                      </button>

                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isOpen ? 'max-h-[600px] opacity-100 border-t border-alphabag-border/60' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <ul className="p-5 md:p-6 space-y-3 font-sans text-sm text-alphabag-text leading-relaxed">
                          {phase.points.map((point, itemIndex) => {
                            const isChecked = phase.completed || phase.status === 'VERIFIED';
                            return (
                              <li key={itemIndex} className="flex items-start gap-3">
                                <span
                                  className={`font-mono font-bold text-xs shrink-0 mt-0.5 ${
                                    isChecked ? 'text-green-400' : 'text-alphabag-muted'
                                  }`}
                                >
                                  {isChecked ? '[✓]' : '[ ]'}
                                </span>
                                <span className={phase.status === 'QUEUED' ? 'text-alphabag-subtext' : 'text-alphabag-text'}>
                                  {point}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        {phase.note && (
                          <div className="px-5 pb-5 md:px-6 md:pb-6">
                            <div className="text-xs font-mono text-alphabag-yellow/90 bg-alphabag-yellow/5 border border-alphabag-yellow/20 rounded-lg px-4 py-2.5">
                              {phase.note}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {activeTab === 'faq' && (
          <section id="faq" className="py-24 px-6 border-y border-alphabag-border bg-alphabag-black min-h-[85vh] flex flex-col justify-center">
            <div className="max-w-5xl mx-auto w-full">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-semibold mb-3 tracking-tight text-alphabag-text">
                  FAQ - <span className="text-alphabag-yellow">Everything you need to know</span>
                </h2>
                <p className="text-xs md:text-sm text-alphabag-subtext max-w-xl mx-auto">
                  Transparent details on data sourcing, zero-latency caching, read-only security, and platform economics.
                </p>

                {/* Category Pill Filters on 1 Single Line */}
                <div className="flex flex-nowrap items-center justify-start md:justify-center gap-1.5 md:gap-2 mt-8 max-w-5xl mx-auto overflow-x-auto no-scrollbar scrollbar-none px-2 py-1">
                  {[
                    { id: 'all', label: 'All Topics' },
                    { id: 'start', label: 'Getting Started' },
                    { id: 'data', label: 'Data & Accuracy' },
                    { id: 'security', label: 'Security & Privacy' },
                    { id: 'ai', label: 'AlphaAI' },
                    { id: 'networks', label: 'Networks & Integrations' },
                    { id: 'rewards', label: 'Rewards & Passes' },
                    { id: 'support', label: 'Troubleshooting' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveFaqCategory(cat.id)}
                      className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        activeFaqCategory === cat.id
                          ? 'bg-alphabag-yellow text-black font-semibold shadow-sm'
                          : 'bg-alphabag-dark/60 text-alphabag-subtext border border-alphabag-border hover:text-alphabag-text hover:border-alphabag-border-light'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-10">
                {/* Category 1: Getting Started */}
                {(activeFaqCategory === 'all' || activeFaqCategory === 'start') && (
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-alphabag-yellow mb-3.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-alphabag-yellow inline-block"></span>
                      Getting started
                    </h3>
                    <div className="space-y-2.5">
                      <FaqItem
                        question="What is AlphaBAG?"
                        answer="AlphaBAG is a trading command center. It combines multi-chain portfolio tracking, CEX + DeFi position monitoring, whale alerts, and AlphaAI market intelligence in one dashboard. Hold an AlphaBAG Pass to unlock boosted rewards and Pro tools as the platform grows."
                      />
                      <FaqItem
                        question="Do I need to buy a Pass to start?"
                        answer="No. The dashboard, wallet tracking, basic alerts, and the Points system are free. Passes are for users who want faster rewards and earlier access to Pro features."
                      />
                      <FaqItem
                        question="What do I need to get started?"
                        answer="Just a wallet address. Connect any supported wallet, paste a public address, or read-only import — you never sign a transaction to start tracking. You can add CEX connections later if you want them included in your totals."
                      />
                      <FaqItem
                        question="Do you support non-custodial wallets and hardware wallets?"
                        answer="Yes. Because we only ever read public on-chain data, hardware wallets and any self-custody address work the same way. Nothing is signed, nothing is moved."
                      />
                    </div>
                  </div>
                )}

                {/* Category 2: Data & accuracy */}
                {(activeFaqCategory === 'all' || activeFaqCategory === 'data') && (
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-3.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
                      Data & accuracy
                    </h3>
                    <div className="space-y-2.5">
                      <FaqItem
                        question="Where does your price and balance data come from?"
                        answer="Prices are aggregated from centralized exchange feeds and on-chain oracles. On-chain positions are read directly from public RPC nodes across every supported chain. Every data point carries a source and timestamp."
                      />
                      <FaqItem
                        question="How fresh is the data?"
                        answer="Live prices update in under ~2 seconds. Wallet balances refresh on a ~6-second cycle. DeFi position decodes (LP, lending, staking) refresh on a longer cycle because they require multiple on-chain reads per position. Every figure in the dashboard shows its age — you'll never see a number without knowing when it was last verified."
                      />
                      <FaqItem
                        question="Why does my portfolio total differ from what I see elsewhere?"
                        answer={"Three reasons, in order of frequency:\n\n1. Spam tokens: Unsolicited airdrops are hidden by default and excluded from your totals. You can still see and dismiss them in the Spam drawer.\n2. DeFi positions: LP principal, borrowed debt, staked derivatives, and unclaimed rewards are counted separately from plain wallet balances. Most trackers miss one or more of these.\n3. Refresh timing: If you're comparing a 'live' number on our side to a cached number elsewhere, they will differ. Our timestamp tells you exactly how old ours is."}
                      />
                      <FaqItem
                        question="Do you count borrowed debt?"
                        answer="Yes. Debt is shown as a negative position and subtracted from net worth. Your 'portfolio value' is net of debt, and we show a health factor for lending positions so you can see liquidation risk."
                      />
                      <FaqItem
                        question="Why do some tokens show a dash (—) instead of a price?"
                        answer="Because we don't have a reliable price for them. We will never show '$0.00' for a token we can't value — a fake zero is worse than an honest blank."
                      />
                    </div>
                  </div>
                )}

                {/* Category 3: Security & privacy */}
                {(activeFaqCategory === 'all' || activeFaqCategory === 'security') && (
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-green-400 mb-3.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                      Security & privacy
                    </h3>
                    <div className="space-y-2.5">
                      <FaqItem
                        question="Is my wallet data secure?"
                        answer="Yes. AlphaBAG uses strictly read-only connections. We never ask for private keys or seed phrases. No transaction can be signed or executed through AlphaBAG, ever."
                      />
                      <FaqItem
                        question="What about CEX API keys — are those safe?"
                        answer="CEX keys are encrypted at rest with AES-256-GCM using envelope encryption, per-key. We only accept read-only keys — if a key you paste has withdrawal or transfer permissions, we refuse to store it and tell you why. Your secret is never displayed again after you paste it, not even to AlphaBAG admins."
                      />
                      <FaqItem
                        question="Can AlphaBAG staff see my API secret?"
                        answer="No. Admins see the last four characters of a key fingerprint for support purposes, and the permission scopes we detected — nothing else. The secret itself is stored encrypted and is never decrypted for display."
                      />
                      <FaqItem
                        question="Do you sell or share my data?"
                        answer="No. We don't sell user data, and we don't share wallet-level analytics with third parties without your explicit action."
                      />
                      <FaqItem
                        question="Can I revoke access?"
                        answer={"Yes, at any time, in two places:\n\n• CEX keys: delete the connection in AlphaBAG, then (recommended) also delete the key on the exchange side.\n• Wallet tracking: disconnect the wallet — we hold no keys for it, so disconnecting removes it completely."}
                      />
                    </div>
                  </div>
                )}

                {/* Category 4: AI */}
                {(activeFaqCategory === 'all' || activeFaqCategory === 'ai') && (
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400 mb-3.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"></span>
                      AlphaAI
                    </h3>
                    <div className="space-y-2.5">
                      <FaqItem
                        question="How does AlphaAI work?"
                        answer="AlphaAI reads your actual portfolio, market structure, and on-chain activity, then explains what it sees. It answers questions about your positions, surfaces whale movements, and turns noisy data into three things: Portfolio Insights, Whale Alerts, and Trade Ideas."
                      />
                      <FaqItem
                        question="Does AlphaAI make up numbers?"
                        answer="No — and this is deliberate. Every figure AlphaAI states is pulled from real data with a source and a timestamp. If AlphaAI doesn't have the data to answer a question, it says so instead of guessing. It will never estimate your PnL or health factor from an LLM's math; those are always computed from your positions first."
                      />
                      <FaqItem
                        question="Does AlphaAI give financial advice?"
                        answer="No. AlphaAI describes what's happening and why it might matter. It does not tell you to buy or sell, and it does not predict prices. Treat it as a research assistant, not a financial advisor."
                      />
                      <FaqItem
                        question="What if my data is out of date?"
                        answer="If any number AlphaAI uses is older than its freshness window, the response is prefixed with a warning showing how old the data is and which source it came from. Stale data is never presented as live."
                      />
                      <FaqItem
                        question="Can I ask AlphaAI about a token I don't hold?"
                        answer="Yes — you can ask about any token on a supported chain. AlphaAI will pull price, liquidity, holder count, and risk signals. It will flag tokens with honeypot, spam, or low-liquidity characteristics."
                      />
                    </div>
                  </div>
                )}

                {/* Category 5: Supported networks & integrations */}
                {(activeFaqCategory === 'all' || activeFaqCategory === 'networks') && (
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-3.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                      Supported networks & integrations
                    </h3>
                    <div className="space-y-2.5">
                      <FaqItem
                        question="Which networks are supported?"
                        answer="Ethereum, BNB Chain, Polygon, Arbitrum, Avalanche, Base, and Solana. More chains roll out with each phase."
                      />
                      <FaqItem
                        question="Which DeFi protocols are decoded?"
                        answer="At launch: Uniswap V3 (LP positions and unclaimed fees), Aave V3 (supply, borrow, health factor), and ERC-4626 vaults including Yearn and Beefy. New protocols ship in batches — the protocol list in the dashboard is always current."
                      />
                      <FaqItem
                        question="Which CEXs can I connect?"
                        answer="Binance, Coinbase, Kraken, OKX, and Bybit are supported. Each connection includes a guided setup that shows you exactly which permissions to enable, a test step before we save anything, and a health indicator so you can see when a key needs reconnecting."
                      />
                      <FaqItem
                        question="Do you count Earn, Funding, and Margin balances on CEXs?"
                        answer="Yes. A spot-only view under-reports most users by 10–40%. We pull spot, Earn (flexible and locked), funding wallets, and open margin/futures positions into one number."
                      />
                    </div>
                  </div>
                )}

                {/* Category 6: Rewards & the Pass */}
                {(activeFaqCategory === 'all' || activeFaqCategory === 'rewards') && (
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 mb-3.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                      Rewards & the Pass
                    </h3>
                    <div className="space-y-2.5">
                      <FaqItem
                        question="How does the rewards system work?"
                        answer="During Beta, everyone earns Points for using the dashboard and completing missions. When rewards go live, Points convert and AlphaBAG Pass holders receive multipliers. The more you participate, the more you unlock."
                      />
                      <FaqItem
                        question="What is an AlphaBAG Pass?"
                        answer="An AlphaBAG Pass is your membership to the ecosystem. There are 4,000 Genesis Passes that unlock boosted T2E rewards, early access to Pro tools, and community privileges. Free users keep full access to the dashboard — Passes accelerate progress rather than gate the basics."
                      />
                      <FaqItem
                        question="When do premium features unlock?"
                        answer={"Premium features roll out in phases:\n\n• Phase 2 — Beta tools for everyone\n• Phase 3 — Pro Terminal and boosted rewards for Pass holders\n• Phase 4 — Full AI automation and Founders-tier access\n\nSee the AlphaMap for exact timelines and current status."}
                      />
                      <FaqItem
                        question="Can I lose my Pass?"
                        answer="No. Passes are permanent to the wallet that holds them. If you transfer a Pass, the benefits move with it."
                      />
                    </div>
                  </div>
                )}

                {/* Category 7: Support & troubleshooting */}
                {(activeFaqCategory === 'all' || activeFaqCategory === 'support') && (
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400 mb-3.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
                      Support & troubleshooting
                    </h3>
                    <div className="space-y-2.5">
                      <FaqItem
                        question="Why is an exchange I connected showing 'Needs reconnect'?"
                        answer="Exchange keys can expire, get revoked, or hit permission changes. When we detect a failure, the connection card shows the reason and a one-click reconnect flow. Your historical data stays intact."
                      />
                      <FaqItem
                        question="Why did I get a 'key rejected' error when connecting my exchange?"
                        answer={"The three most common causes:\n\n1. The key has withdrawal or transfer permissions enabled — we refuse those by design.\n2. The key is region-locked (e.g. a .US key on the global endpoint).\n3. The key is IP-restricted and our egress IP isn't on your whitelist — we show you the exact IP to add.\n\nThe wizard walks you through each case."}
                      />
                      <FaqItem
                        question="A token appeared in my wallet that I didn't buy. What is it?"
                        answer="Almost certainly a spam airdrop. We detect these and hide them from your totals by default, but they remain visible in the Spam drawer so you can see and dismiss them. Never interact with, approve, or sell a token you didn't purchase."
                      />
                      <FaqItem
                        question="Can AlphaBAG place trades for me?"
                        answer="No. AlphaBAG is read-only by design. We do not execute trades on your behalf, and no permission we request from a CEX or wallet would allow it."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Global Markets Section */}
        {activeTab === 'markets' && (
          <section className="relative pt-20 pb-20 px-6 min-h-[90vh]">

            <div className="max-w-7xl mx-auto relative z-10 w-full">
               <Markets />
            </div>
          </section>
        )}

      </div> {/* End Dynamic Content Area */}

      <footer className="py-12 px-6 border-t border-alphabag-gray bg-alphabag-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-alphabag-dark border border-alphabag-gray text-alphabag-yellow flex items-center justify-center rounded">
              <Lock size={14} fill="currentColor" />
            </div>
            <span className="text-alphabag-text text-xs font-semibold uppercase tracking-widest">ALPHABAG Systems © 2026</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <button type="button" onClick={() => setLegalModal('terms')} className="text-[10px] font-black text-alphabag-muted hover:text-alphabag-text uppercase tracking-[0.2em] transition-all">
              Terms
            </button>

            <button type="button" onClick={() => setLegalModal('privacy')} className="text-[10px] font-black text-alphabag-muted hover:text-alphabag-text uppercase tracking-[0.2em] transition-all">
              Privacy
            </button>
            <a href="https://x.com/myalphabag" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-alphabag-muted hover:text-alphabag-text uppercase tracking-[0.2em] transition-all flex items-center gap-2">
              <X size={14} /> X.com
            </a>
            <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-alphabag-muted hover:text-alphabag-text uppercase tracking-[0.2em] transition-all flex items-center gap-2">
              <Send size={14} /> Telegram
            </a>
          </div>
        </div>
      </footer>
    </div >
  );
};

// Component Helpers
const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${
      isOpen
        ? 'border-alphabag-yellow/40 bg-alphabag-dark/80 shadow-panel'
        : 'border-alphabag-border bg-alphabag-dark/40 hover:border-alphabag-border-light hover:bg-alphabag-dark/60'
    }`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors"
      >
        <span className="font-semibold text-alphabag-text text-sm md:text-[15px] leading-snug pr-4">{question}</span>
        <div className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-mono font-bold transition-colors ${
          isOpen ? 'bg-alphabag-yellow text-black' : 'bg-alphabag-darkgray text-alphabag-subtext'
        }`}>
          {isOpen ? '–' : '+'}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[650px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 md:px-5 md:pb-5 text-[13px] md:text-sm text-alphabag-subtext leading-relaxed border-t border-alphabag-border/50 pt-3 font-normal whitespace-pre-line">
          {answer}
        </div>
      </div>
    </div>
  );
};

// Component Helpers
const FeatureHighlight = ({
  icon,
  title,
  tagline,
  desc,
}: {
  icon: any;
  title: string;
  tagline?: string;
  desc: string;
}) => (
  <div className="bg-alphabag-dark/50 border border-alphabag-border p-6 rounded-xl hover:border-alphabag-yellow/40 hover:bg-alphabag-dark/80 transition-all duration-200 shadow-panel flex flex-col justify-between group">
    <div>
      <div className="mb-3.5 bg-alphabag-black/50 w-10 h-10 rounded-lg flex items-center justify-center border border-alphabag-border group-hover:scale-105 group-hover:border-alphabag-yellow/30 transition-all">
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <h3 className="text-base font-semibold text-alphabag-text mb-1 tracking-tight font-mono uppercase">{title}</h3>
      {tagline && <p className="text-xs font-mono font-medium text-alphabag-yellow/90 mb-2.5 leading-snug">{tagline}</p>}
      <p className="text-[13px] text-alphabag-subtext font-normal leading-relaxed">{desc}</p>
    </div>
  </div>
);
const TokenMetricCard = ({ label, value, icon, isMasked }: { label: string, value: string, icon: any, isMasked?: boolean }) => (
  <div className="bg-alphabag-darkgray border border-alphabag-gray p-5 md:p-4 rounded-2xl flex items-center gap-2 md:gap-2 hover:border-alphabag-muted transition-all group h-full shadow-lg">
    <div className="w-12 h-12 shrink-0 bg-alphabag-darkgray border border-alphabag-gray rounded-xl flex items-center justify-center text-alphabag-yellow group-hover:scale-110 transition-transform shadow-inner">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <div>
      <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg md:text-xl font-bold text-alphabag-text tracking-tight leading-none ${isMasked ? 'text-transparent blur-[6px] select-none bg-clip-text bg-alphabag-text' : ''}`}>
        {value}
      </div>
    </div>
  </div>
);
const TokenomicsDetailCard = ({ title, percentage, subtitle, desc, highlight }: { title: string, percentage: string, subtitle?: React.ReactNode, desc: string, highlight?: boolean }) => (
  <div className={`p-4 rounded-2xl border flex flex-col h-full ${highlight ? 'bg-alphabag-darkgray border-alphabag-yellow ' : 'bg-alphabag-darkgray border-alphabag-gray hover:border-alphabag-muted'} transition-all`}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className={`text-sm md:text-base font-semibold uppercase tracking-tight ${highlight ? 'text-alphabag-yellow' : 'text-alphabag-text'}`}>{title}</h4>
        {subtitle && <div className="text-xs md:text-sm font-semibold text-alphabag-yellow mt-1">{subtitle}</div>}
      </div>
      <div className={`text-xl md:text-2xl font-bold ${highlight ? 'text-alphabag-yellow' : 'text-alphabag-text'}`}>{percentage}</div>
    </div>
    <p className="text-xs md:text-sm text-alphabag-subtext leading-relaxed font-medium">{desc}</p>
  </div>
);
