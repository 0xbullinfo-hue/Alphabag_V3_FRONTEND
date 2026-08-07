import React, { useState, useEffect } from 'react';
import { Shield, Zap, BarChart3, Lock, CheckCircle2, ArrowRight, Wallet, Briefcase, TrendingUp, Bot, Send, Crown, LayoutGrid, X, ShieldCheck, Rocket, Trophy, PieChart, BellRing, ChevronRight, Calculator as CalculatorIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calculator } from './Calculator';
import { Markets } from './Markets';

import { IS_DEMO_MODE } from '../../services/config';

// When VITE_LAUNCH_MODE=teaser, the app shows landing only — no auth, no backend required.
const IS_TEASER_MODE = import.meta.env.VITE_LAUNCH_MODE === 'teaser';
const TEASER_LAUNCH_AT = import.meta.env.VITE_TEASER_LAUNCH_AT || '2026-12-01T12:00:00Z';

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

export const Landing: React.FC = () => {
  const { open } = useWeb3Modal();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'tokenomics' | 'roadmap' | 'faq' | 'calculator' | 'markets'>('home');
  const [showTeaserToast, setShowTeaserToast] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [teaserCountdown, setTeaserCountdown] = useState<CountdownState>(() => getTeaserCountdown(TEASER_LAUNCH_AT));
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

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
    if (!IS_TEASER_MODE) return;
    const tick = () => setTeaserCountdown(getTeaserCountdown(TEASER_LAUNCH_AT));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

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
            text: 'AlphaBAG is a crypto intelligence hub that combines multi-chain portfolio tracking, whale monitoring, and AI-driven market analysis in one interface.'
          }
        },
        {
          '@type': 'Question',
          name: 'Is AlphaBAG wallet tracking secure?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. AlphaBAG uses read-only tracking and does not require private keys, so users can monitor portfolios without exposing signing credentials.'
          }
        },
        {
          '@type': 'Question',
          name: 'What can AlphaAI do in AlphaBAG?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AlphaAI can summarize market sentiment, review portfolio context, and provide natural-language insights using near real-time market and ecosystem signals.'
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

  const handleWaitlistSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = waitlistEmail.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setWaitlistError('Enter a valid email address to join the early-access waitlist.');
      return;
    }

    const storageKey = 'alphabag_waitlist_signups';
    const raw = localStorage.getItem(storageKey);
    let list: Array<{ email: string; source: string; createdAt: string }> = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    if (!list.some(item => item.email === email)) {
      list.push({
        email,
        source: 'teaser-landing',
        createdAt: new Date().toISOString()
      });
      // Keep local cache bounded.
      localStorage.setItem(storageKey, JSON.stringify(list.slice(-500)));
    }

    setWaitlistSubmitted(true);
    setWaitlistError('');
    setWaitlistEmail('');
  };

  const handleViewMarkets = () => {
    setActiveTab('markets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (tab: 'home' | 'features' | 'tokenomics' | 'roadmap' | 'faq' | 'calculator' | 'markets') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-alphabag-text overflow-x-hidden bg-alphabag-black" style={{ backgroundImage: 'radial-gradient(circle at 18% 12%, rgba(245, 203, 66, 0.08), transparent 26%), radial-gradient(circle at 86% 8%, rgba(255, 255, 255, 0.05), transparent 22%), linear-gradient(180deg, rgba(22,26,34,1) 0%, rgba(22,26,34,1) 100%)' }}>

      {/* ── TEASER TOAST NOTIFICATION ── */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
        showTeaserToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-2 bg-alphabag-dark border border-alphabag-yellow/40 text-alphabag-text px-5 py-3.5 rounded-xl  backdrop-blur-xl">
          <BellRing size={16} className="text-alphabag-yellow animate-bounce" />
          <span className="text-sm font-bold">
            {teaserCountdown.isLive ? 'Testnet is live now.' : `Testnet launch in ${teaserCountdown.days}d ${teaserCountdown.hours}h ${teaserCountdown.minutes}m ${teaserCountdown.seconds}s.`}
            <span className="text-alphabag-yellow"> Stay tuned on Telegram & X.</span>
          </span>
          <button onClick={() => setShowTeaserToast(false)} className="ml-2 text-alphabag-subtext hover:text-alphabag-text">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── ANNOUNCEMENT BANNER ── */}
      {IS_TEASER_MODE && !bannerDismissed && (
        <div className="w-full bg-gradient-to-r from-alphabag-yellow/10 via-alphabag-yellow/20 to-alphabag-yellow/10 border-b border-alphabag-yellow/20 py-2.5 px-4 flex items-center justify-center gap-2 relative">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alphabag-yellow opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-alphabag-yellow"></span>
          </span>
          <p className="text-xs font-medium text-alphabag-text text-center">
            Testnet Launching Soon &mdash; Join our community for early access
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-alphabag-yellow text-xs font-medium hover:underline">
              <Send size={11} /> Telegram <ChevronRight size={11} />
            </a>
            <a href="https://x.com/myalphabag" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-alphabag-yellow text-xs font-medium hover:underline">
              <X size={11} /> Follow <ChevronRight size={11} />
            </a>
          </div>
          <button onClick={() => setBannerDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-alphabag-subtext hover:text-alphabag-text">
            <X size={12} />
          </button>
        </div>
      )}

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
              <button onClick={() => handleNavClick('roadmap')} className={`transition-colors ${activeTab === 'roadmap' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_roadmap')}</button>
              <button onClick={() => handleNavClick('faq')} className={`transition-colors ${activeTab === 'faq' ? 'text-alphabag-text' : 'hover:text-alphabag-text'}`}>{t('nav_faq')}</button>
            </div>
          </div>

          {/* Right Side: Wallet/Login Buttons */}
          <div className="hidden md:flex items-center space-x-2">

            {/* Main Auth/Demo CTAs */}
            {!isAuthenticated ? (
              IS_DEMO_MODE ? (
                <Button size="sm" onClick={handleDemoLogin} className="font-semibold px-6 bg-alphabag-yellow text-black hover:bg-yellow-400 border-none">
                  {t('btn_demo_login') || 'Demo Login'}
                </Button>
              ) : (
                <Button size="sm" onClick={handleLaunchApp} className="font-semibold px-6 bg-alphabag-yellow text-black hover:bg-yellow-400 border-none">
                  {t('btn_connect_wallet') || 'Connect Wallet'}
                </Button>
              )
            ) : (
              <Button size="sm" onClick={handleLaunchApp} className="font-semibold px-6 bg-alphabag-yellow text-black hover:bg-yellow-400 border-none">
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
            <button onClick={() => handleNavClick('roadmap')} className={`text-left py-2 text-sm font-medium ${activeTab === 'roadmap' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_roadmap')}</button>
            <button onClick={() => handleNavClick('faq')} className={`text-left py-2 text-sm font-medium ${activeTab === 'faq' ? 'text-alphabag-text' : 'text-alphabag-subtext'}`}>{t('nav_faq')}</button>
            <Button size="lg" onClick={handleLaunchApp} className="w-full font-semibold bg-alphabag-yellow text-black">{isAuthenticated ? 'Open App' : t('btn_connect_wallet') || 'Connect Wallet'}</Button>
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
                  <h1 className="text-4xl md:text-6xl lg:text-[68px] font-bold text-alphabag-text leading-[1.1] tracking-tight">
                    {t('hero_title_1')}
                    <span className="block text-alphabag-yellow mt-1">{t('hero_title_2')}</span>
                  </h1>

                  <p className="text-base md:text-lg text-alphabag-subtext leading-relaxed font-normal animate-fade-in-up delay-100 max-w-xl">
                    {t('hero_desc')}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 animate-fade-in-up delay-200">
                    {IS_TEASER_MODE ? (
                      <>
                        <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-alphabag-yellow text-black hover:bg-yellow-400 border-none  transition-all" onClick={handleLaunchApp}>
                          {t('btn_notify_me')}
                        </Button>
                        <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base border-alphabag-gray hover:border-alphabag-muted hover:bg-alphabag-gray/40 backdrop-blur-md text-alphabag-text font-medium transition-all flex items-center gap-2">
                            <Send size={16} /> {t('btn_join_community')}
                          </Button>
                        </a>
                      </>
                    ) : (
                      <>
                        <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-alphabag-yellow text-black hover:bg-yellow-400 border-none  transition-all" onClick={isAuthenticated ? handleLaunchApp : (IS_DEMO_MODE ? handleDemoLogin : handleLaunchApp)}>
                          {isAuthenticated ? (t('btn_open_hub') || 'Open Hub') : (IS_DEMO_MODE ? `${t('btn_build_portfolio')} (Demo)` : t('btn_build_portfolio'))}
                        </Button>
                        <a href="https://t.me/alphabag_access" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-4 text-base border-alphabag-gray hover:border-alphabag-muted hover:bg-alphabag-gray/40 backdrop-blur-md text-alphabag-text font-medium transition-all flex items-center gap-2">
                            <Send size={16} /> {t('btn_join_community')}
                          </Button>
                        </a>
                      </>
                    )}
                  </div>

                  {IS_TEASER_MODE && (
                    <div className="mt-2 rounded-2xl border border-alphabag-yellow/30 bg-alphabag-darkgray/70 p-4 max-w-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-alphabag-yellow">Testnet Countdown</div>
                        <div className="text-[10px] text-alphabag-subtext font-semibold uppercase">Early Access Onboarding</div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          { label: 'Days', value: teaserCountdown.days },
                          { label: 'Hours', value: teaserCountdown.hours },
                          { label: 'Min', value: teaserCountdown.minutes },
                          { label: 'Sec', value: teaserCountdown.seconds }
                        ].map((item) => (
                          <div key={item.label} className="rounded-lg border border-alphabag-gray bg-alphabag-black/60 py-2 text-center">
                            <div className="text-xl md:text-2xl font-black text-alphabag-yellow tabular-nums leading-tight">{item.value}</div>
                            <div className="text-[9px] uppercase font-semibold tracking-widest text-alphabag-subtext mt-1">{item.label}</div>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          value={waitlistEmail}
                          onChange={(e) => {
                            setWaitlistEmail(e.target.value);
                            if (waitlistError) setWaitlistError('');
                            if (waitlistSubmitted) setWaitlistSubmitted(false);
                          }}
                          placeholder="Email for early access"
                          className="w-full rounded-lg border border-alphabag-gray bg-alphabag-black px-3 py-2 text-sm text-alphabag-text placeholder:text-alphabag-subtext outline-none focus:border-alphabag-yellow"
                          required
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="px-4 bg-alphabag-yellow text-black hover:bg-yellow-400 border-none font-semibold whitespace-nowrap"
                        >
                          Join Waitlist
                        </Button>
                      </form>

                      {waitlistError && <div className="mt-2 text-[11px] text-red-400 font-medium">{waitlistError}</div>}
                      {waitlistSubmitted && <div className="mt-2 text-[11px] text-alphabag-green font-medium">You are in. Watch your inbox for early-access onboarding.</div>}
                    </div>
                  )}

                  {/* Stats Section */}
                  <div className="flex flex-wrap gap-x-5 gap-y-3 md:gap-x-8 md:gap-y-3 pt-6 border-t border-alphabag-gray mt-6 animate-fade-in-up delay-300">
                    <div className="space-y-1.5">
                      <div className="text-2xl font-bold text-alphabag-text leading-tight">{t('stat_assets')}</div>
                      <div className="text-xs font-semibold text-alphabag-subtext leading-relaxed">{t('stat_assets_lbl')}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-2xl font-bold text-alphabag-text leading-tight">{t('stat_members')}</div>
                      <div className="text-xs font-semibold text-alphabag-subtext leading-relaxed">{t('stat_members_lbl')}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-2xl font-bold text-alphabag-text leading-tight">{t('stat_crypto')}</div>
                      <div className="text-xs font-semibold text-alphabag-subtext leading-relaxed">{t('stat_crypto_lbl')}</div>
                    </div>
                  </div>

                  {IS_TEASER_MODE && (
                    <div className="mt-3 p-3 rounded-xl border border-alphabag-yellow/20 bg-alphabag-black/40 max-w-xl">
                      <div className="text-[10px] text-alphabag-subtext uppercase tracking-[0.18em] font-semibold mb-2">Launch Countdown</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Days', value: teaserCountdown.days },
                          { label: 'Hours', value: teaserCountdown.hours },
                          { label: 'Min', value: teaserCountdown.minutes },
                          { label: 'Sec', value: teaserCountdown.seconds }
                        ].map(item => (
                          <div key={item.label} className="rounded-lg border border-alphabag-gray bg-alphabag-darkgray/80 text-center py-1.5">
                            <div className="text-base md:text-lg font-bold text-alphabag-yellow tabular-nums">{item.value}</div>
                            <div className="text-[9px] uppercase tracking-wider text-alphabag-subtext font-medium">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Calculator Card */}
                <div className="lg:col-span-6 w-full bg-alphabag-darkgray border border-alphabag-gray rounded-2xl p-4 shadow-2xl relative overflow-hidden lg:h-[630px] lg:overflow-y-auto custom-scrollbar">
                  
                  <div className="flex items-center justify-between mb-2 border-b border-alphabag-gray pb-3">
                    <h3 className="text-sm font-semibold text-alphabag-text uppercase tracking-wider flex items-center gap-2">
                      <CalculatorIcon size={16} className="text-alphabag-yellow" /> {t('calculator_title')}
                    </h3>
                    <span className="text-[10px] bg-alphabag-yellow/10 text-alphabag-yellow px-2 py-0.5 rounded font-semibold">{t('calculator_badge')}</span>
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
                <h2 className="text-4xl md:text-5xl font-semibold mb-2 tracking-tight text-alphabag-text">{t('features_title')} <span className="text-alphabag-yellow">{t('features_title_alpha')}</span></h2>
                <p className="text-xl text-alphabag-subtext">{t('features_subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
              <div className="mt-32 pt-20 border-t border-alphabag-gray relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-alphabag-yellow/20 to-transparent"></div>
                
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-semibold mb-2 tracking-tight text-alphabag-text">{t('why_title')} <span className="text-alphabag-yellow">{t('why_title_alpha')}</span></h2>
                  <p className="text-base text-alphabag-subtext max-w-2xl mx-auto">
                    {t('why_desc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-5xl mx-auto items-center">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-10 h-10 shrink-0 bg-alphabag-yellow/10 text-alphabag-yellow flex items-center justify-center rounded-xl border border-alphabag-yellow/20">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-alphabag-text tracking-tight mb-2">{t('why_latency_title')}</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">{t('why_latency_desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 shrink-0 bg-green-500/10 text-green-500 flex items-center justify-center rounded-xl border border-green-500/20">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-alphabag-text tracking-tight mb-2">{t('why_privacy_title')}</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">{t('why_privacy_desc')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 shrink-0 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-xl border border-blue-500/20">
                        <Bot size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-alphabag-text tracking-tight mb-2">{t('why_ai_title')}</h4>
                        <p className="text-sm text-alphabag-subtext leading-relaxed">{t('why_ai_desc')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-full min-h-[300px] rounded-3xl border border-alphabag-gray bg-alphabag-darkgray overflow-hidden flex items-center justify-center group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-alphabag-yellow/5 to-transparent"></div>
                    <div className="w-24 h-24 bg-alphabag-darkgray border border-alphabag-gray rounded-2xl flex items-center justify-center  group-hover:scale-110 group-hover: transition-all duration-700 relative z-10">
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
                <h2 className="text-4xl md:text-5xl font-semibold mb-2 tracking-tight text-alphabag-text">Alphabag <span className="text-alphabag-yellow">Tokenomics</span></h2>
                <p className="text-alphabag-subtext text-sm max-w-4xl mx-auto leading-relaxed">Detailed token distribution and exact tokenomics for Alphabag ecosystem</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Left Column: Metrics */}
                <div className="lg:col-span-1 flex flex-col gap-2">
                  <TokenMetricCard label="Token Name" value="AlphaBAG (Not Yet Live)" icon={<Briefcase />} />
                  <TokenMetricCard label="Ticker" value="$BAG" isMasked icon={<TrendingUp />} />
                  <TokenMetricCard label="Network" value="BNB Smart Chain" icon={<LayoutGrid />} />
                  <TokenMetricCard label="Total Supply" value="21,000,000" icon={<PieChart />} />
                  <TokenMetricCard label="Contract Address" value="TBA" icon={<Lock />} />
                </div>

                {/* Right Column: Allocations Unmasked */}
                <div className="lg:col-span-2 relative bg-alphabag-darkgray border border-alphabag-gray rounded-3xl p-4 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full h-full">
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

        {/* Terminal Roadmap Section */}
        {activeTab === 'roadmap' && (
          <section id="roadmap" className="pt-40 pb-24 px-6 relative overflow-hidden bg-alphabag-black/40 min-h-[85vh] flex flex-col justify-center">


            <div className="max-w-[1400px] mx-auto relative z-10 xl:px-8">
              <div className="text-center mb-2 mt-12">
                <h2 className="text-4xl md:text-5xl font-semibold mb-2 tracking-tight text-alphabag-text">Execution <span className="text-alphabag-yellow">Sequence</span></h2>
                <p className="text-alphabag-subtext text-sm">Network Deployment Phases</p>
              </div>

              <div className="relative w-full overflow-x-auto pb-2 pt-12 custom-scrollbar snap-x snap-mandatory">
                {/* Main Horizontal Trace */}
                <div className="absolute top-[68px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-alphabag-yellow/50 to-alphabag-gray min-w-[max(100%,1200px)]"></div>

                <div className="flex flex-row gap-2 md:gap-2 w-max px-6 mx-auto min-w-full justify-between items-start mt-4">
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
                <h2 className="text-4xl md:text-5xl font-semibold mb-2 tracking-tight text-alphabag-text">System <span className="text-alphabag-yellow">FAQ</span></h2>
                <p className="text-lg text-alphabag-subtext max-w-2xl mx-auto">Everything you need to know about the AlphaBAG hub and ecosystem.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
                {/* Left Column */}
                <div className="space-y-2">
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
                <div className="space-y-2">
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

      <footer className="py-12 px-6 border-t border-alphabag-gray bg-alphabag-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-alphabag-dark border border-alphabag-gray text-alphabag-yellow flex items-center justify-center rounded">
              <Lock size={14} fill="currentColor" />
            </div>
            <span className="text-alphabag-text text-xs font-semibold uppercase tracking-widest">ALPHABAG Systems © 2026</span>
          </div>

          <div className="flex items-center gap-2">
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
const RoadmapStep = ({ phase, title, status, points }: { phase: string, title: string, status: 'VERIFIED' | 'EXECUTING' | 'PENDING' | 'QUEUED', points: string[] }) => {
  const statusColors = {
    VERIFIED: "text-green-500 bg-green-500/10 border-green-500/20",
    EXECUTING: "text-alphabag-yellow bg-alphabag-yellow/10 border-alphabag-yellow/20 animate-pulse",
    PENDING: "text-[#8BA1C9] bg-alphabag-gray/40 border-alphabag-gray",
    QUEUED: "text-alphabag-subtext bg-transparent border-alphabag-border"
  };

  const statusIndicatorColors = {
    VERIFIED: "bg-green-500",
    EXECUTING: "bg-alphabag-yellow",
    PENDING: "bg-[#8BA1C9] border border-alphabag-gray",
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
      <div className={`absolute -top-12 w-px h-12 border-l border-dashed ${status === 'VERIFIED' ? 'border-green-500/30' : status === 'EXECUTING' ? 'border-alphabag-yellow/30' : 'border-alphabag-gray'}`}></div>

      {/* Content Box */}
      <div className="w-full">
        <div className={`p-[1px] rounded-xl bg-gradient-to-br transition-all duration-300 transform group-hover:-translate-y-2
            ${status === 'EXECUTING' ? 'from-alphabag-yellow/30 via-alphabag-yellow/5 to-transparent' : status === 'VERIFIED' ? 'from-green-500/20 via-green-500/5 to-transparent' : 'from-alphabag-gray via-transparent to-transparent'}
          `}>
          <div className={`bg-alphabag-darkgray border rounded-xl p-4 h-full flex flex-col min-h-[320px] transition-colors duration-300
               ${status === 'EXECUTING' ? 'border-alphabag-yellow/50 ' : 'border-alphabag-gray'}
            `}>
            {/* Header Info */}
            <div className="flex justify-between items-start mb-2 gap-2">
              <div>
                <div className="text-[10px] font-mono text-alphabag-subtext mb-1 tracking-widest">{phase}</div>
                <h3 className={`text-sm font-bold font-mono tracking-tight uppercase ${status === 'EXECUTING' ? 'text-alphabag-yellow' : 'text-alphabag-text'}`}>
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
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-alphabag-yellow/50 bg-alphabag-yellow/5 ' : 'border-alphabag-gray bg-alphabag-darkgray hover:border-alphabag-gray/80 hover:bg-alphabag-gray/40'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-bold text-alphabag-text uppercase tracking-wider text-sm">{question}</span>
        <div className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-alphabag-yellow text-black' : 'bg-alphabag-gray/40 text-alphabag-text'}`}>
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
  <div className="bg-alphabag-darkgray border border-alphabag-gray p-5 rounded-xl hover:border-alphabag-muted transition-all group cursor-default shadow-lg">
    <div className="mb-2.5 bg-alphabag-darkgray w-9 h-9 rounded-lg flex items-center justify-center border border-alphabag-gray group-hover:scale-110 transition-all">
      {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    </div>
    <h3 className="text-lg font-semibold text-alphabag-text mb-1.5 leading-tight">{title}</h3>
    <p className="text-[13px] text-alphabag-subtext font-medium leading-relaxed">{desc}</p>
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

const TokenomicsDetailCard = ({ title, percentage, subtitle, desc, highlight }: { title: string, percentage: string, subtitle?: string, desc: string, highlight?: boolean }) => (
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

const ComparisonRow = ({ label, spreadsheet, alphabag }: { label: string, spreadsheet: boolean, alphabag: boolean }) => (
  <div className="grid grid-cols-3 gap-2 py-4 border-b border-alphabag-border items-center">
    <div className="col-span-1 font-semibold text-alphabag-text text-sm md:text-base">{label}</div>
    <div className="col-span-1 flex justify-center">
      {spreadsheet ? <CheckCircle2 className="text-green-500" size={20} /> : <X className="text-white/20" size={20} />}
    </div>
    <div className="col-span-1 flex justify-center">
      {alphabag ? <div className="bg-alphabag-yellow/20 p-1 rounded-full"><CheckCircle2 className="text-alphabag-yellow" size={20} /></div> : <X className="text-red-500" size={20} />}
    </div>
  </div>
);

const PricingCard = ({ tier, tokens, price, features, recommended = false, onAction }: { tier: string, tokens: string, price: string, features: string[], recommended?: boolean, onAction: () => void }) => (
  <div className={`relative flex flex-col p-4 rounded-xl border ${recommended ? 'bg-alphabag-darkgray border-alphabag-yellow  scale-105 z-10' : 'bg-alphabag-darkgray border-alphabag-gray'}`}>
    {recommended && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-alphabag-yellow text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg flex items-center">
        <Crown size={10} className="mr-1" fill="currentColor" /> Best Value
      </div>
    )}
    <div className="mb-2 text-center">
      <h3 className="text-alphabag-subtext text-[9px] font-black uppercase tracking-[0.3em] mb-1.5 opacity-60">{tier}</h3>
      <div className="text-3xl font-black mb-1.5 uppercase tracking-tighter text-alphabag-text">{price}</div>
      {recommended && <div className="text-alphabag-yellow font-black text-[9px] uppercase tracking-widest mb-1.5">ELIGIBILITY: GENESIS HOLDER</div>}
      <div className="text-alphabag-yellow font-black text-[9px] uppercase tracking-widest bg-alphabag-yellow/5 inline-block px-2.5 py-1 rounded border border-alphabag-yellow/20">{tokens}</div>
    </div>
    <ul className="space-y-2 mb-2 flex-1 text-[11px] font-bold">
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
