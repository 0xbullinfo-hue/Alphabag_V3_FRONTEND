import React, { useState, useEffect } from 'react';
import { Shield, Zap, BarChart3, Lock, CheckCircle2, ArrowRight, Wallet, Briefcase, TrendingUp, Bot, Send, Crown, LayoutGrid, X, ShieldCheck, Rocket, Trophy, PieChart, BellRing, ChevronRight, Sun, Moon, Calculator as CalculatorIcon, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calculator } from './Calculator';
import { Markets } from './Markets';

import { IS_DEMO_MODE } from '../../services/config';

// When VITE_LAUNCH_MODE=teaser, the app shows landing only — no auth, no backend required.
const IS_TEASER_MODE = import.meta.env.VITE_LAUNCH_MODE === 'teaser';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    nav_home: "Home",
    nav_features: "Features",
    nav_tokenomics: "Tokenomics",
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
    stat_assets: "$1.8B+",
    stat_assets_lbl: "Assets tracked",
    stat_members: "240k+",
    stat_members_lbl: "Active members",
    stat_crypto: "15,000+",
    stat_crypto_lbl: "Cryptocurrencies",
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
    stat_assets: "1.8 مليار دولار+",
    stat_assets_lbl: "الأصول المتتبعة",
    stat_members: "240 ألف+",
    stat_members_lbl: "الأعضاء النشطين",
    stat_crypto: "15,000+",
    stat_crypto_lbl: "العملات الرقمية",
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
    stat_assets: "680 مليون د.ب+",
    stat_assets_lbl: "الأصول المتتبعة",
    stat_members: "240 ألف+",
    stat_members_lbl: "الأعضاء النشطين",
    stat_crypto: "15,000+",
    stat_crypto_lbl: "العملات الرقمية",
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
    stat_assets: "$1.8B+",
    stat_assets_lbl: "İzlənilən aktivlər",
    stat_members: "240k+",
    stat_members_lbl: "Aktiv üzvlər",
    stat_crypto: "15,000+",
    stat_crypto_lbl: "Kriptovalyutalar",
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
    nav_tokenomics: "Tokenomics",
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
    stat_assets: "$1.8B+",
    stat_assets_lbl: "Verfolgte Assets",
    stat_members: "240k+",
    stat_members_lbl: "Aktive Mitglieder",
    stat_crypto: "15,000+",
    stat_crypto_lbl: "Kryptowährungen",
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
    stat_assets: "$1.8B+",
    stat_assets_lbl: "Assets tracked",
    stat_members: "240k+",
    stat_members_lbl: "Active members",
    stat_crypto: "15,000+",
    stat_crypto_lbl: "Cryptocurrencies",
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
    stat_assets: "$1.8B+",
    stat_assets_lbl: "Assets tracked",
    stat_members: "240k+",
    stat_members_lbl: "Active members",
    stat_crypto: "15,000+",
    stat_crypto_lbl: "Cryptocurrencies",
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
    stat_assets: "$1.8B+",
    stat_assets_lbl: "Assets tracked",
    stat_members: "240k+",
    stat_members_lbl: "Active members",
    stat_crypto: "15,000+",
    stat_crypto_lbl: "Cryptocurrencies",
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

export const Landing: React.FC = () => {
  const { open } = useWeb3Modal();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'buy' | 'tokenomics' | 'roadmap' | 'faq' | 'calculator' | 'markets'>('home');
  const [showTeaserToast, setShowTeaserToast] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('alphabag_language') || 'en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dir = language.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('alphabag_language', language);
  }, [language]);

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || '';
  };

  const languagesList = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
    { code: 'ar-bh', label: 'العربية (البحرين)' },
    { code: 'az', label: 'Azərbaycan' },
    { code: 'de', label: 'Deutsch' },
    { code: 'en-ae', label: 'English (UAE)' },
    { code: 'en-au', label: 'English (Australia)' },
    { code: 'en-bh', label: 'English (Bahrain)' },
  ];

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Only redirect to app if NOT in teaser mode and user is authenticated
    if (!IS_TEASER_MODE && isAuthenticated) {
      navigate('/airdrop');
    }
  }, [isAuthenticated, navigate]);

  const handleLaunchApp = () => {
    if (IS_TEASER_MODE) {
      // In teaser mode — show a "coming soon" notification instead of login
      setShowTeaserToast(true);
      setTimeout(() => setShowTeaserToast(false), 4000);
      return;
    }
    if (isAuthenticated) {
      navigate('/airdrop');
    } else {
      window.dispatchEvent(new Event('open-login-modal'));
    }
  };

  const handleDemoLogin = () => {
    sessionStorage.setItem('alphabag_token', 'mock_dev_token_2026');
    sessionStorage.setItem('alphabag_user', JSON.stringify({
      id: 'mock-user-id',
      email: 'alpha_tester@alphabag.pro',
      tier: 'ULTIMATE',
      alphaAiUsageSeconds: 0,
      lastAlphaAiReset: new Date().toISOString(),
      isAdmin: true,
      onboardingComplete: true
    }));
    window.location.reload();
  };

  const handleViewMarkets = () => {
    setActiveTab('markets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (tab: 'home' | 'features' | 'buy' | 'tokenomics' | 'roadmap' | 'faq' | 'calculator' | 'markets') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-alphabag-black min-h-screen text-alphabag-text overflow-x-hidden">

      {/* ── TEASER TOAST NOTIFICATION ── */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
        showTeaserToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3 bg-alphabag-dark border border-alphabag-yellow/40 text-white px-5 py-3.5 rounded-xl shadow-[0_0_40px_rgba(252,213,53,0.2)] backdrop-blur-xl">
          <BellRing size={16} className="text-alphabag-yellow animate-bounce" />
          <span className="text-sm font-bold">Testnet is launching soon — <span className="text-alphabag-yellow">stay tuned on Telegram & X.</span></span>
          <button onClick={() => setShowTeaserToast(false)} className="ml-2 text-alphabag-subtext hover:text-white">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── ANNOUNCEMENT BANNER ── */}
      {IS_TEASER_MODE && !bannerDismissed && (
        <div className="w-full bg-gradient-to-r from-alphabag-yellow/10 via-alphabag-yellow/20 to-alphabag-yellow/10 border-b border-alphabag-yellow/20 py-2.5 px-4 flex items-center justify-center gap-3 relative">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alphabag-yellow opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-alphabag-yellow"></span>
          </span>
          <p className="text-xs font-medium text-white text-center">
            Testnet Launching Soon &mdash; Join our community for early access
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-alphabag-yellow text-xs font-medium hover:underline">
              <Send size={11} /> Telegram <ChevronRight size={11} />
            </a>
            <a href="https://x.com/myalphabag" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-alphabag-yellow text-xs font-medium hover:underline">
              <X size={11} /> Follow <ChevronRight size={11} />
            </a>
          </div>
          <button onClick={() => setBannerDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-alphabag-subtext hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-alphabag-gray" style={{ backgroundColor: 'rgba(30, 35, 41, 0.95)' }}>
        <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
          
          {/* Left Side: Logo + Nav Links (Binance layout) */}
          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-2 cursor-pointer shrink-0" onClick={() => handleNavClick('home')}>
              <img src="/logo.png" alt="AlphaBAG Logo" className="w-6 h-6 object-contain rounded-full shadow-[0_0_20px_rgba(252,213,53,0.1)]" />
              <span className="text-lg font-bold tracking-tight text-[#fcd535]">ALPHABAG</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-alphabag-subtext">
              <button onClick={() => handleNavClick('home')} className={`transition-colors ${activeTab === 'home' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_home')}</button>
              <button onClick={() => handleNavClick('features')} className={`transition-colors ${activeTab === 'features' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_features')}</button>
              <button onClick={() => handleNavClick('tokenomics')} className={`transition-colors ${activeTab === 'tokenomics' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_tokenomics')}</button>
              {!IS_TEASER_MODE && <button onClick={() => handleNavClick('buy')} className={`transition-colors ${activeTab === 'buy' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_buy')}</button>}
              <button onClick={() => handleNavClick('roadmap')} className={`transition-colors ${activeTab === 'roadmap' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_roadmap')}</button>
              <button onClick={() => handleNavClick('faq')} className={`transition-colors ${activeTab === 'faq' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_faq')}</button>
            </div>
          </div>

          {/* Right Side: Translation Globe + Theme + Wallet/Login Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* World Globe Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="p-2 rounded-xl transition-all duration-300 active:scale-[0.98] bg-transparent text-alphabag-subtext hover:text-alphabag-text hover:bg-white/5 border border-transparent hover:border-white/10 shrink-0"
                title="Change Language"
              >
                <Globe size={18} />
              </button>
              {isLangDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-alphabag-darkgray border border-alphabag-gray shadow-2xl py-2 z-50 animate-slide-in">
                    {languagesList.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          localStorage.setItem('alphabag_language', lang.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition-all ${language === lang.code ? 'text-[#fcd535]' : 'text-alphabag-subtext'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all duration-300 active:scale-[0.98] bg-transparent text-alphabag-subtext hover:text-alphabag-text hover:bg-white/5 border border-transparent hover:border-white/10 shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Main Auth/Demo CTAs */}
            {!isAuthenticated ? (
              IS_DEMO_MODE ? (
                <Button size="sm" onClick={handleDemoLogin} className="font-semibold px-6 bg-[#fcd535] text-black hover:bg-yellow-400 border-none">
                  {t('btn_demo_login') || 'Demo Login'}
                </Button>
              ) : (
                <Button size="sm" onClick={handleLaunchApp} className="font-semibold px-6 bg-[#fcd535] text-black hover:bg-yellow-400 border-none">
                  {t('btn_connect_wallet') || 'Connect Wallet'}
                </Button>
              )
            ) : (
              <Button size="sm" onClick={handleLaunchApp} className="font-semibold px-6 bg-[#fcd535] text-black hover:bg-yellow-400 border-none">
                Open App
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            
            {/* World Globe Language Switcher Mobile */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="p-2 rounded-xl text-alphabag-subtext"
              >
                <Globe size={18} />
              </button>
              {isLangDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-alphabag-darkgray border border-alphabag-gray shadow-2xl py-2 z-50 animate-slide-in">
                    {languagesList.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          localStorage.setItem('alphabag_language', lang.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition-all ${language === lang.code ? 'text-[#fcd535]' : 'text-alphabag-subtext'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-alphabag-subtext"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <LayoutGrid />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full backdrop-blur-xl border-b border-alphabag-gray p-6 flex flex-col space-y-4 animate-slide-in" style={{ backgroundColor: 'rgba(30, 35, 41, 0.95)' }}>
            <button onClick={() => handleNavClick('home')} className={`text-left py-2 text-sm font-medium ${activeTab === 'home' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_home')}</button>
            <button onClick={() => handleNavClick('features')} className={`text-left py-2 text-sm font-medium ${activeTab === 'features' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_features')}</button>
            <button onClick={() => handleNavClick('tokenomics')} className={`text-left py-2 text-sm font-medium ${activeTab === 'tokenomics' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_tokenomics')}</button>
            {!IS_TEASER_MODE && <button onClick={() => handleNavClick('buy')} className={`text-left py-2 text-sm font-medium ${activeTab === 'buy' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_buy')}</button>}
            <button onClick={() => handleNavClick('roadmap')} className={`text-left py-2 text-sm font-medium ${activeTab === 'roadmap' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_roadmap')}</button>
            <button onClick={() => handleNavClick('faq')} className={`text-left py-2 text-sm font-medium ${activeTab === 'faq' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_faq')}</button>
            <Button size="lg" onClick={handleLaunchApp} className="w-full font-semibold bg-[#fcd535] text-black">{isAuthenticated ? 'Open App' : t('btn_connect_wallet') || 'Connect Wallet'}</Button>
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start w-full">
                
                {/* Left Column: Copy & Stats */}
                <div className="lg:col-span-6 text-left space-y-3 flex flex-col justify-center">
                  <h1 className="text-4xl md:text-6xl lg:text-[68px] font-bold text-white leading-[1.1] tracking-tight">
                    {t('hero_title_1')}
                    <span className="block text-[#fcd535] mt-1">{t('hero_title_2')}</span>
                  </h1>

                  <p className="text-base md:text-lg text-alphabag-subtext leading-relaxed font-normal animate-fade-in-up delay-100 max-w-xl">
                    {t('hero_desc')}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 animate-fade-in-up delay-150">
                    {[
                      t('tag_pulse') || 'Real-time market pulse',
                      t('tag_coverage') || 'Multi-chain coverage',
                      t('tag_insights') || 'Institutional-grade insights'
                    ].map((item) => (
                      <span key={item} className="inline-flex items-center rounded-full border border-alphabag-gray bg-alphabag-darkgray px-3 py-1.5 text-xs font-medium text-alphabag-subtext">
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 animate-fade-in-up delay-200">
                    {IS_TEASER_MODE ? (
                      <>
                        <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-[#fcd535] text-black hover:bg-yellow-400 border-none shadow-[0_0_20px_rgba(252,213,53,0.3)] transition-all" onClick={handleLaunchApp}>
                          {t('btn_notify_me')}
                        </Button>
                        <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-md text-white font-medium transition-all flex items-center gap-2">
                            <Send size={16} /> {t('btn_join_community')}
                          </Button>
                        </a>
                      </>
                    ) : (
                      <>
                        <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-[#fcd535] text-black hover:bg-yellow-400 border-none shadow-[0_0_20px_rgba(252,213,53,0.3)] transition-all" onClick={isAuthenticated ? handleLaunchApp : (IS_DEMO_MODE ? handleDemoLogin : handleLaunchApp)}>
                          {isAuthenticated ? (t('btn_open_hub') || 'Open Hub') : (IS_DEMO_MODE ? `${t('btn_build_portfolio')} (Demo)` : t('btn_build_portfolio'))}
                        </Button>
                        <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-md text-white font-medium transition-all flex items-center gap-2">
                            <Send size={16} /> {t('btn_join_community')}
                          </Button>
                        </a>
                      </>
                    )}
                  </div>

                  {/* Stats Section */}
                  <div className="flex flex-wrap gap-3 md:gap-3 pt-6 border-t border-alphabag-gray mt-6 animate-fade-in-up delay-300">
                    <div>
                      <div className="text-2xl font-bold text-alphabag-text mb-1">{t('stat_assets')}</div>
                      <div className="text-xs font-semibold text-alphabag-subtext">{t('stat_assets_lbl')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-alphabag-text mb-1">{t('stat_members')}</div>
                      <div className="text-xs font-semibold text-alphabag-subtext">{t('stat_members_lbl')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-alphabag-text mb-1">{t('stat_crypto')}</div>
                      <div className="text-xs font-semibold text-alphabag-subtext">{t('stat_crypto_lbl')}</div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Calculator Card */}
                <div className="lg:col-span-6 w-full bg-[#2b323c] border border-alphabag-gray rounded-2xl p-6 shadow-2xl relative overflow-hidden lg:h-[630px] lg:overflow-y-auto custom-scrollbar">
                  <div className="absolute top-[-50px] right-[-30px] w-40 h-40 bg-[#fcd535] filter blur-[80px] opacity-[0.06] pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-4 border-b border-alphabag-gray pb-3">
                    <h3 className="text-sm font-semibold text-alphabag-text uppercase tracking-wider flex items-center gap-2">
                      <CalculatorIcon size={16} className="text-alphabag-yellow" /> {t('calculator_title')}
                    </h3>
                    <span className="text-[10px] bg-[#fcd535]/10 text-alphabag-yellow px-2 py-0.5 rounded font-semibold">{t('calculator_badge')}</span>
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

        {/* Features Grid */}
        {activeTab === 'features' && (
          <section id="features" className="py-32 px-6 min-h-[85vh] flex flex-col justify-center">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight text-alphabag-text">{t('features_title')} <span className="text-alphabag-yellow">{t('features_title_alpha')}</span></h2>
                <p className="text-xl text-alphabag-subtext">{t('features_subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FeatureHighlight
                  icon={<Bot size={32} className="text-alphabag-yellow" />}
                  title={t('feature_1_title') || "AlphaAi Agent"}
                  desc={t('feature_1_desc') || "Your personal analyst. Ask about your PnL, request chart generation, or get real-time market sentiment analysis."}
                />
                <FeatureHighlight
                  icon={<ShieldCheck size={32} className="text-green-400" />}
                  title={t('feature_2_title') || "Multi-Network Security"}
                  desc={t('feature_2_desc') || "Track assets across EVM and Solana networks without exposing your private keys. Read-only permissions by default."}
                />
                <FeatureHighlight
                  icon={<BarChart3 size={32} className="text-blue-400" />}
                  title={t('feature_3_title') || "Whale Watch"}
                  desc={t('feature_3_desc') || "Follow the smart money. Get alerted when high-net-worth wallets enter or exit positions in real-time."}
                />
                <FeatureHighlight
                  icon={<Wallet size={32} className="text-purple-400" />}
                  title={t('feature_4_title') || "CEX/DEX HUB"}
                  desc={t('feature_4_desc') || "Connect your DEX Wallets and exchange APIs for a truly unified overview of your crypto net worth across 20+ major platforms."}
                />
                <FeatureHighlight
                  icon={<Rocket size={32} className="text-[#D8B4FE]" />}
                  title={t('feature_5_title') || "Alpha Calculator"}
                  desc={t('feature_5_desc') || "Simulate complex futures and spot trades with real-time accuracy before executing on-chain."}
                />
                <FeatureHighlight
                  icon={<Trophy size={32} className="text-alphabag-yellow" />}
                  title={t('feature_6_title') || "T2E REWARDS"}
                  desc={t('feature_6_desc') || "Participate in the ecosystem through missions and social tasks to earn your share of the $BAG allocation."}
                />
              </div>

              {/* Why AlphaBAG Section */}
              <div className="mt-32 pt-20 border-t border-white/5 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-alphabag-yellow/20 to-transparent"></div>
                
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-semibold mb-6 tracking-tight text-alphabag-text">{t('why_title')} <span className="text-alphabag-yellow">{t('why_title_alpha')}</span></h2>
                  <p className="text-base text-alphabag-subtext max-w-2xl mx-auto">
                    {t('why_desc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl mx-auto items-center">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 bg-alphabag-yellow/10 text-alphabag-yellow flex items-center justify-center rounded-xl border border-alphabag-yellow/20">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-alphabag-text tracking-tight mb-2">{t('why_latency_title')}</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">{t('why_latency_desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 bg-green-500/10 text-green-500 flex items-center justify-center rounded-xl border border-green-500/20">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-alphabag-text tracking-tight mb-2">{t('why_privacy_title')}</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">{t('why_privacy_desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-xl border border-blue-500/20">
                        <Bot size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-alphabag-text tracking-tight mb-2">{t('why_ai_title')}</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">{t('why_ai_desc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-full min-h-[300px] rounded-3xl border border-white/10 bg-[#2b323c] overflow-hidden flex items-center justify-center group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-alphabag-yellow/5 to-transparent"></div>
                    <div className="w-24 h-24 bg-[#1e2329] border border-white/5 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(252,213,53,0.1)] group-hover:scale-110 group-hover:shadow-[0_0_80px_rgba(252,213,53,0.2)] transition-all duration-700 relative z-10">
                      <Lock size={40} className="text-alphabag-yellow" />
                    </div>
                    <div className="absolute w-full h-full inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tokenomics Section */}
        {activeTab === 'tokenomics' && (
          <section className="relative pt-40 pb-24 px-6 min-h-[85vh] flex flex-col justify-center">

            
            <div className="max-w-7xl mx-auto relative z-10 w-full">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-alphabag-text">Alphabag <span className="text-alphabag-yellow">Tokenomics</span></h2>
                <p className="text-alphabag-subtext text-sm max-w-4xl mx-auto leading-relaxed">Detailed token distribution and exact tokenomics for Alphabag ecosystem</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Metrics */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <TokenMetricCard label="Token Name" value="AlphaBAG (Not Yet Live)" icon={<Briefcase />} />
                  <TokenMetricCard label="Ticker" value="$BAG" isMasked icon={<TrendingUp />} />
                  <TokenMetricCard label="Network" value="BNB Smart Chain" icon={<LayoutGrid />} />
                  <TokenMetricCard label="Total Supply" value="21,000,000" icon={<PieChart />} />
                  <TokenMetricCard label="Contract Address" value="TBA" icon={<Lock />} />
                </div>

                {/* Right Column: Allocations Unmasked */}
                <div className="lg:col-span-2 relative bg-[#2b323c] border border-white/5 rounded-3xl p-8 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full">
                    <TokenomicsDetailCard title="Liquidity Pool (LP)" percentage="30%" desc="Paired initially with BNB upon PancakeSwap deployment. burnt to secure the market floor." />
                    <TokenomicsDetailCard title="Trade-to-Earn (T2E)" percentage="35%" desc="Emission-based distribution. Tokens are systematically distributed to users through Our task-to-earn gamification and ecosystem engagement over an extended timeline, eliminating massive upfront supply shocks. Allocation locked for 3months. released to activate the Alpha-drops T2E dapp" />
                    <TokenomicsDetailCard title="Development & Ecosystem" percentage="15%" desc="Allocated for infrastructure upgrades, API integrations, and core platform development. Automated post-deployment allocation." />
                    <TokenomicsDetailCard title="Marketing & Strategic Growth" percentage="10%" desc="Distributed directly to designated marketing for ecosystem expansion and strategic partnerships." />
                    <TokenomicsDetailCard title="Team & Advisors" percentage="10%" desc="Distributed to team custody at deployment, guarded by strict multi-sig parameters and long-term ecosystem commitment thresholds. locked for 12months with stiff unlock strategy (more details soon)" />
                    <TokenomicsDetailCard title="TOTAL SUPPLY" percentage="100%" subtitle="21,000,000" desc="Strictly hard-capped supply. No mint function exists post-deployment." highlight />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* How to Buy Section */}
        {activeTab === 'buy' && (
          <section className="relative pt-40 pb-24 px-6 min-h-[85vh] flex flex-col justify-center">


            <div className="max-w-7xl mx-auto relative z-10 w-full">
              <div className="text-center md:text-left mb-20 relative">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                  <div className="h-px w-8 bg-alphabag-yellow"></div>
                  <span className="text-[10px] font-bold text-alphabag-yellow uppercase tracking-[0.3em]">Get Started</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-alphabag-text">How to <span className="text-alphabag-yellow">Buy</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {/* Horizontal Connection Line */}
                <div className="hidden md:block absolute top-8 left-10 right-10 h-px bg-white/10 z-0"></div>

                <BuyStepCard 
                  step="01" 
                  title="CREATE WALLET" 
                  desc="Download Trust Wallet or MetaMask and create a new wallet. Save your seed phrase securely."
                />
                <BuyStepCard 
                  step="02" 
                  title="FUND WITH BNB" 
                  desc="Purchase BNB from any exchange (Binance, Coinbase) and transfer it to your wallet."
                />
                <BuyStepCard 
                  step="03" 
                  title="CONNECT TO DEX" 
                  desc="Visit PancakeSwap and connect your wallet to the BNB Smart Chain network."
                />
                <BuyStepCard 
                  step="04" 
                  title="PASTE CONTRACT" 
                  desc={
                    <span>
                      In the swap interface, paste the <span className="text-white/20 blur-[3px] select-none">$BAG</span> contract address to find the token. 
                      <span className="block mt-2 text-[10px] text-alphabag-yellow font-bold uppercase tracking-tight">
                        ONLY USE CA FROM OUR WEBSITE OR OFFICIAL COMMUNITY CHANELS/GROUPS WHEN WE ARE LIVE.
                      </span>
                    </span>
                  }
                />
                <BuyStepCard 
                  step="05" 
                  title={<span>SWAP FOR <span className="text-white/20 blur-[4px] select-none inline-block">$BAG</span></span>}
                  desc={<span>Enter the amount of BNB, confirm the swap, and welcome to the <span className="text-white/20 blur-[3px] select-none inline-block">$BAG</span> community.</span>}
                />
              </div>

              <div className="mt-24 flex justify-center">
                <div className="bg-[#2b323c] border border-alphabag-yellow text-alphabag-yellow font-semibold px-8 py-4 rounded cursor-not-allowed flex items-center gap-3">
                  <ArrowRight size={18} /> Swap on PancakeSwap (coming soon)
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Terminal Roadmap Section */}
        {activeTab === 'roadmap' && (
          <section id="roadmap" className="pt-40 pb-24 px-6 relative overflow-hidden bg-alphabag-black/40 min-h-[85vh] flex flex-col justify-center">


            <div className="max-w-[1400px] mx-auto relative z-10 xl:px-8">
              <div className="text-center mb-8 mt-12">
                <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-alphabag-text">Execution <span className="text-alphabag-yellow">Sequence</span></h2>
                <p className="text-alphabag-subtext text-sm">Network Deployment Phases</p>
              </div>

              <div className="relative w-full overflow-x-auto pb-12 pt-12 custom-scrollbar snap-x snap-mandatory">
                {/* Main Horizontal Trace */}
                <div className="absolute top-[68px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-alphabag-yellow/50 to-alphabag-gray min-w-[max(100%,1200px)]"></div>

                <div className="flex flex-row gap-3 md:gap-4 w-max px-6 mx-auto min-w-full justify-between items-start mt-4">
                  <RoadmapStep
                    phase="PHASE_01"
                    title="CORE_INITIALIZATION"
                    status="VERIFIED"
                    points={[
                      "System Core Architecture Defined: Finalize full-stack infrastructure for high-frequency data.",
                      "Smart Contract Beta Deployment: Develop 21M fixed-supply $BAG contract with internal auto-tax logic.",
                      "Internal AlphaAi Logic Initialized: Develop core tracking and SocialFi algorithms for the Alpha Radar.",
                      "V1 Platform Launch & Stress Testing: Conduct internal testing of dashboard performance and security."
                    ]}
                  />
                  <RoadmapStep
                    phase="PHASE_02"
                    title="SYSTEM_EXPANSION & DEPLOYMENT"
                    status="EXECUTING"
                    points={[
                      "Community Onboarding & Genesis Campaign: Launch initial marketing to acquire high-conviction holders.",
                      "Smart Contract Finalization: Final audit of the automated protection and renounce logic.",
                      "Utility Token Launch: Deploy token on BSC with pre-set allocations. Execute contract renouncement post-launch for immutable security. Burn liquidity.",
                      "V1 Beta Deployment: Implement upgraded mechanics dashboard features launch for user testing."
                    ]}
                  />
                  <RoadmapStep
                    phase="PHASE_03"
                    title="LIQUIDITY_DEPLOYMENT"
                    status="PENDING"
                    points={[
                      "Synthetic Utility Token Implementation: Integrate Utility token as the primary engine for platform features access.",
                      "Strategic Community Collaborations: Partner with institutional data providers to scale all features in Alphabag.",
                      "Pro-Terminal Release: Launch top tier functions on Alphabag for tier holders"
                    ]}
                  />
                  <RoadmapStep
                    phase="PHASE_04"
                    title="GLOBAL_DOMINANCE"
                    status="QUEUED"
                    points={[
                      "Global Scaling: Expand narrative reach and platform infrastructure to international markets.",
                      "Future development: Expand use-case to adapt to mobile usage"
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {activeTab === 'faq' && (
          <section id="faq" className="py-24 px-6 border-y border-alphabag-border bg-alphabag-black min-h-[85vh] flex flex-col justify-center">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight text-alphabag-text">System <span className="text-alphabag-yellow">FAQ</span></h2>
                <p className="text-lg text-alphabag-subtext max-w-2xl mx-auto">Everything you need to know about the AlphaBAG hub and ecosystem.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                {/* Left Column */}
                <div className="space-y-3">
                  <FaqItem
                    question="What is AlphaBAG?"
                    answer="AlphaBAG is an advanced centralized intelligence hub for smart investors. It aggregates portfolio tracking, whale watching, and AI-driven market analysis into a single, professional interface."
                  />
                  <FaqItem
                    question="Is my wallet data secure?"
                    answer="Absolutely. AlphaBAG operates on a strict read-only basis for portfolio tracking. We never ask for your private keys, and our hub cannot execute transactions on your behalf without explicit confirmation via your wallet provider."
                  />
                  <FaqItem
                    question="How does AlphaBAG conversion work?"
                    answer="AlphaBAG is the synthetic utility metric powering the hub ecosystem during the Genesis Phase. Upon official launch, top-tier AlphaBAG members who have verified their wallets holdings will be eligible to access Alphabag feature."
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <FaqItem
                    question="How does AlphaAI work?"
                    answer="AlphaAI utilizes fine-tuned large language models (LLMs) with access to real-time market data. It can analyze your specific portfolio composition against current market trends to provide actionable, natural-language insights."
                  />
                  <FaqItem
                    question="Which blockchain networks are supported?"
                    answer="Currently, tracking is fully integrated across all major EVM-compatible networks (Ethereum, BSC, Polygon, Arbitrum, Avalanche, Base) as well as the Solana network. We are actively developing support for more non-EVM ecosystems."
                  />
                </div>
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

      <footer className="py-12 px-6 border-t border-white/10 bg-alphabag-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-zinc-900 border border-white/10 text-alphabag-yellow flex items-center justify-center rounded">
              <Lock size={14} fill="currentColor" />
            </div>
            <span className="text-white text-xs font-semibold uppercase tracking-widest">ALPHABAG Systems © 2026</span>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://x.com/myalphabag" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-alphabag-muted hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2">
              <X size={14} /> X.com
            </a>
            <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-alphabag-muted hover:text-white uppercase tracking-[0.2em] transition-all flex items-center gap-2">
              <Send size={14} /> Telegram
            </a>
          </div>
        </div>
      </footer>
    </div >
  );
};

// Component Helpers
const RoadmapStep = ({ phase, title, status, points }: { phase: string, title: string, status: 'VERIFIED' | 'EXECUTING' | 'PENDING' | 'QUEUED', points: string[] }) => {
  const statusColors = {
    VERIFIED: "text-green-500 bg-green-500/10 border-green-500/20",
    EXECUTING: "text-alphabag-yellow bg-alphabag-yellow/10 border-alphabag-yellow/20 animate-pulse",
    PENDING: "text-[#8BA1C9] bg-white/5 border-white/10",
    QUEUED: "text-alphabag-subtext bg-transparent border-alphabag-border"
  };

  const statusIndicatorColors = {
    VERIFIED: "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]",
    EXECUTING: "bg-alphabag-yellow shadow-[0_0_15px_rgba(252,213,53,0.5)]",
    PENDING: "bg-[#8BA1C9] border border-white/20",
    QUEUED: "bg-alphabag-gray"
  };

  return (
    <div className="relative flex flex-col items-center w-[280px] shrink-0 snap-center group">

      {/* Horizontal Timeline Indicator */}
      <div className={`absolute -top-12 w-4 h-4 rounded-full z-20 ${statusIndicatorColors[status]}`}>
        {status === 'EXECUTING' && (
          <div className="absolute inset-0 rounded-full border-2 border-alphabag-yellow animate-ping"></div>
        )}
      </div>

      {/* Vertical Connector Line (from horizontal trace to box) */}
      <div className={`absolute -top-12 w-px h-12 border-l border-dashed ${status === 'VERIFIED' ? 'border-green-500/30' : status === 'EXECUTING' ? 'border-alphabag-yellow/30' : 'border-white/10'}`}></div>

      {/* Content Box */}
      <div className="w-full">
        <div className={`p-[1px] rounded-xl bg-gradient-to-br transition-all duration-300 transform group-hover:-translate-y-2
            ${status === 'EXECUTING' ? 'from-alphabag-yellow/30 via-alphabag-yellow/5 to-transparent' : status === 'VERIFIED' ? 'from-green-500/20 via-green-500/5 to-transparent' : 'from-white/10 via-transparent to-transparent'}
          `}>
          <div className={`bg-[#2b323c] border rounded-xl p-4 h-full flex flex-col min-h-[320px] transition-colors duration-300
               ${status === 'EXECUTING' ? 'border-alphabag-yellow/50 shadow-[0_0_30px_rgba(252,213,53,0.05)]' : 'border-alphabag-gray'}
            `}>
            {/* Header Info */}
            <div className="flex justify-between items-start mb-4 gap-2">
              <div>
                <div className="text-[10px] font-mono text-alphabag-subtext mb-1 tracking-widest">{phase}</div>
                <h3 className={`text-sm font-bold font-mono tracking-tight uppercase ${status === 'EXECUTING' ? 'text-alphabag-yellow' : 'text-white'}`}>
                  {">"} {title}
                </h3>
              </div>
              <div className={`px-2 py-1 text-[9px] font-mono uppercase font-bold tracking-widest rounded border shrink-0 ${statusColors[status]}`}>
                {status}
              </div>
            </div>

            {/* Tasks List */}
            <ul className="space-y-2 font-mono text-[11px] leading-tight">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`text-[9px] mt-0.5 shrink-0 ${status === 'VERIFIED' ? 'text-green-500' : 'text-alphabag-subtext'}`}>
                    {status === 'VERIFIED' ? '[✓]' : '[ ]'}
                  </span>
                  <span className={`${status === 'QUEUED' ? 'text-alphabag-subtext/50' : 'text-[#8BA1C9]'}`}>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-alphabag-yellow/50 bg-alphabag-yellow/5 shadow-[0_0_30px_rgba(252,213,53,0.05)]' : 'border-alphabag-gray bg-[#2b323c] hover:border-alphabag-gray/80 hover:bg-white/5'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-bold text-white uppercase tracking-wider text-sm">{question}</span>
        <div className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-alphabag-yellow text-black' : 'bg-white/10 text-white'}`}>
          {isOpen ? <X size={14} /> : <span className="text-lg leading-none font-light mb-1">+</span>}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0 text-[13px] text-alphabag-subtext leading-relaxed border-t border-alphabag-border mt-1 font-medium opacity-60">
          {answer}
        </div>
      </div>
    </div>
  );
};

// Component Helpers
const FeatureHighlight = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="bg-[#2b323c] border border-alphabag-gray p-5 rounded-xl hover:border-[#474d57] transition-all group cursor-default shadow-lg">
    <div className="mb-2.5 bg-[#1e2329] w-9 h-9 rounded-lg flex items-center justify-center border border-alphabag-gray group-hover:scale-110 transition-all">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <h3 className="text-lg font-semibold text-white mb-1.5 leading-tight">{title}</h3>
    <p className="text-[13px] text-alphabag-subtext font-medium leading-relaxed">{desc}</p>
  </div>
);

const BuyStepCard = ({ step, title, desc }: { step: string, title: React.ReactNode, desc: React.ReactNode }) => (
  <div className="relative flex flex-col items-center text-center group mt-8 md:mt-0 p-5 rounded-xl border border-alphabag-gray bg-[#2b323c] shadow-lg">
    <div className="w-12 h-12 bg-[#1e2329] border border-alphabag-yellow/30 text-alphabag-yellow text-base font-semibold rounded-lg flex items-center justify-center mb-3 relative z-10 group-hover:scale-110 transition-all duration-300">
      {step}
    </div>
    <h3 className="text-sm font-semibold text-white mb-2 h-8 flex items-center justify-center">{title}</h3>
    <p className="text-xs text-alphabag-subtext leading-relaxed font-medium px-2">{desc}</p>
  </div>
);

const TokenMetricCard = ({ label, value, icon, isMasked }: { label: string, value: string, icon: any, isMasked?: boolean }) => (
  <div className="bg-[#2b323c] border border-alphabag-gray p-5 md:p-6 rounded-2xl flex items-center gap-4 md:gap-5 hover:border-[#474d57] transition-all group h-full shadow-lg">
    <div className="w-12 h-12 shrink-0 bg-[#1e2329] border border-alphabag-gray rounded-xl flex items-center justify-center text-alphabag-yellow group-hover:scale-110 transition-transform shadow-inner">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <div>
      <div className="text-[10px] text-alphabag-subtext font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg md:text-xl font-bold text-white tracking-tight leading-none ${isMasked ? 'text-transparent blur-[6px] select-none bg-clip-text bg-white' : ''}`}>
        {value}
      </div>
    </div>
  </div>
);

const TokenomicsDetailCard = ({ title, percentage, subtitle, desc, highlight }: { title: string, percentage: string, subtitle?: string, desc: string, highlight?: boolean }) => (
  <div className={`p-6 rounded-2xl border flex flex-col h-full ${highlight ? 'bg-[#2b323c] border-[#fcd535] shadow-[0_0_20px_rgba(252,213,53,0.1)]' : 'bg-[#2b323c] border-alphabag-gray hover:border-[#474d57]'} transition-all`}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className={`text-sm md:text-base font-semibold uppercase tracking-tight ${highlight ? 'text-alphabag-yellow' : 'text-white'}`}>{title}</h4>
        {subtitle && <div className="text-xs md:text-sm font-semibold text-alphabag-yellow mt-1">{subtitle}</div>}
      </div>
      <div className={`text-xl md:text-2xl font-bold ${highlight ? 'text-alphabag-yellow' : 'text-white'}`}>{percentage}</div>
    </div>
    <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-medium">{desc}</p>
  </div>
);

const ComparisonRow = ({ label, spreadsheet, alphabag }: { label: string, spreadsheet: boolean, alphabag: boolean }) => (
  <div className="grid grid-cols-3 gap-4 py-4 border-b border-alphabag-border items-center">
    <div className="col-span-1 font-semibold text-white text-sm md:text-base">{label}</div>
    <div className="col-span-1 flex justify-center">
      {spreadsheet ? <CheckCircle2 className="text-green-500" size={20} /> : <X className="text-white/20" size={20} />}
    </div>
    <div className="col-span-1 flex justify-center">
      {alphabag ? <div className="bg-alphabag-yellow/20 p-1 rounded-full"><CheckCircle2 className="text-alphabag-yellow" size={20} /></div> : <X className="text-red-500" size={20} />}
    </div>
  </div>
);

const PricingCard = ({ tier, tokens, price, features, recommended = false, onAction }: { tier: string, tokens: string, price: string, features: string[], recommended?: boolean, onAction: () => void }) => (
  <div className={`relative flex flex-col p-6 rounded-xl border ${recommended ? 'bg-[#2b323c] border-alphabag-yellow shadow-[0_0_40px_rgba(252,213,53,0.1)] scale-105 z-10' : 'bg-[#2b323c] border-white/10'}`}>
    {recommended && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-alphabag-yellow text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg flex items-center">
        <Crown size={10} className="mr-1" fill="currentColor" /> Best Value
      </div>
    )}
    <div className="mb-6 text-center">
      <h3 className="text-alphabag-subtext text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 opacity-60">{tier}</h3>
      <div className="text-3xl font-black mb-1.5 uppercase tracking-tighter text-white">{price}</div>
      {recommended && <div className="text-alphabag-yellow font-black text-[9px] uppercase tracking-widest mb-1.5">ELIGIBILITY: GENESIS HOLDER</div>}
      <div className="text-alphabag-yellow font-black text-[9px] uppercase tracking-widest bg-alphabag-yellow/5 inline-block px-2.5 py-1 rounded border border-alphabag-yellow/20">{tokens}</div>
    </div>
    <ul className="space-y-3 mb-8 flex-1 text-[11px] font-bold">
      {features.map((f, i) => (
        <li key={i} className="flex items-center space-x-2.5 text-gray-400">
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={8} className="text-green-400" />
          </div>
          <span className="uppercase tracking-widest opacity-80">{f}</span>
        </li>
      ))}
    </ul>
    <Button variant={recommended ? 'primary' : 'secondary'} size="lg" className="w-full font-black py-4 uppercase tracking-widest text-[11px] h-12 rounded-xl" onClick={onAction}>
      {tier.includes('Free') ? 'Start for Free' : 'Secure Ultimate Access'}
    </Button>
  </div>
);
