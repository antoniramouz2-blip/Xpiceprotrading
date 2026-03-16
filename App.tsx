/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Globe, 
  Eye, 
  EyeOff, 
  Home, 
  BarChart3, 
  Repeat, 
  CircleDollarSign, 
  Wallet, 
  MessageCircle,
  Mail,
  Lock,
  Search,
  Star,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Copy,
  ChevronDown,
  Check,
  ShieldAlert,
  LogIn,
  LogOut as LogOutIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { auth, db, signInWithGoogle, logOut, signUpWithEmail, signInWithEmail } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import AdminPanel from './components/adminpanel';

// Mock data for the chart
const generateChartData = (basePrice: number) => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    price: basePrice + (Math.random() - 0.5) * (basePrice * 0.05),
  }));
};

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [userData, setUserData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingSlow, setLoadingSlow] = useState(false);

  React.useEffect(() => {
    const slowTimeout = setTimeout(() => {
      if (loading) setLoadingSlow(true);
    }, 5000);
    return () => clearTimeout(slowTimeout);
  }, [loading]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [isDepositView, setIsDepositView] = useState(false);
  const [isWithdrawView, setIsWithdrawView] = useState(false);
  const [isRecordView, setIsRecordView] = useState(false);
  const [isProfileView, setIsProfileView] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [depositNetwork, setDepositNetwork] = useState('TRC20');
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [followCode, setFollowCode] = useState('');
  const [marketTab, setMarketTab] = useState('Spot');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const platformName = "Xpice Pro";

  const translations = {
    en: {
      totalBalance: "Total Balance",
      deposit: "Deposit",
      withdraw: "Withdraw",
      market: "Market",
      assets: "Assets",
      follow: "Follow",
      options: "Options",
      records: "Records",
      profile: "Profile",
      loginWithGoogle: "Login with Google",
      createNewAccount: "Create New Account",
      secure: "Secure",
      fast: "Fast",
      global: "Global",
      handlingFee: "Handling Fee",
      actualArrival: "Actual Arrival",
      confirmWithdrawal: "Confirm Withdrawal",
      confirmDeposit: "Confirm Deposit Request",
      currencySelection: "Currency selection",
      depositAmount: "Deposit Amount",
      enterAmount: "Enter amount",
      tips: "Tips",
      tip1: "Please do not deposit any other assets except USDT to the above address.",
      tip2: "Your deposit will be credited after 1 network confirmation.",
      network: "Network",
      address: "Address",
      copy: "Copy",
      copied: "Copied",
      welcome: "Welcome to",
      eliteTraders: "The most secure and professional crypto trading platform for elite traders.",
      buy: "Buy",
      sell: "Sell",
      high24h: "24h High",
      low24h: "24h Low",
      recommendFriends: "Recommend friends to follow orders",
      getCommissions: "Get high invitation commissions",
      enterOrderCode: "Please enter the order code",
      followBtn: "Follow",
      spot: "Spot",
      futures: "Futures",
      favorites: "Favorites",
      latestPrice: "Latest price / 24h chg%",
      currency: "Currency",
      currentPrice: "Current Price",
      call: "Call",
      put: "Put",
      viewAll: "View All",
      teamBenefits: "Team benefits"
    },
    ar: {
      totalBalance: "إجمالي الرصيد",
      deposit: "إيداع",
      withdraw: "سحب",
      market: "السوق",
      assets: "الأصول",
      follow: "متابعة",
      options: "خيارات",
      records: "السجلات",
      profile: "الملف الشخصي",
      loginWithGoogle: "تسجيل الدخول بجوجل",
      createNewAccount: "إنشاء حساب جديد",
      secure: "آمن",
      fast: "سريع",
      global: "عالمي",
      handlingFee: "رسوم المعالجة",
      actualArrival: "الوصول الفعلي",
      confirmWithdrawal: "تأكيد السحب",
      confirmDeposit: "تأكيد طلب الإيداع",
      currencySelection: "اختيار العملة",
      depositAmount: "مبلغ الإيداع",
      enterAmount: "أدخل المبلغ",
      tips: "نصائح",
      tip1: "يرجى عدم إيداع أي أصول أخرى باستثناء USDT إلى العنوان أعلاه.",
      tip2: "سيتم إضافة إيداعك بعد تأكيد شبكة واحدة.",
      network: "الشبكة",
      address: "العنوان",
      copy: "نسخ",
      copied: "تم النسخ",
      welcome: "مرحباً بك في",
      eliteTraders: "منصة تداول العملات الرقمية الأكثر أماناً واحترافية لنخبة المتداولين.",
      buy: "شراء",
      sell: "بيع",
      high24h: "أعلى سعر 24س",
      low24h: "أدنى سعر 24س",
      recommendFriends: "أوصِ الأصدقاء لمتابعة الطلبات",
      getCommissions: "احصل على عمولات دعوة عالية",
      enterOrderCode: "يرجى إدخال رمز الطلب",
      followBtn: "متابعة",
      spot: "فوري",
      futures: "عقود آجلة",
      favorites: "المفضلة",
      latestPrice: "آخر سعر / تغيير 24س%",
      currency: "العملة",
      currentPrice: "السعر الحالي",
      call: "شراء (Call)",
      put: "بيع (Put)",
      viewAll: "عرض الكل",
      teamBenefits: "فوائد الفريق"
    }
  };

  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  React.useEffect(() => {
    // Fallback loading timeout to prevent infinite spinner
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth check timed out, forcing loading state to false");
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            
            // Auto-open admin panel if URL has ?admin=true and user is admin
            const params = new URLSearchParams(window.location.search);
            const isAdmin = data?.role === 'admin' || u.email === 'antoniramouz2@gmail.com';
            if (params.get('admin') === 'true' && isAdmin) {
              setIsAdminPanelOpen(true);
            }
          } else {
            console.warn("User document does not exist in Firestore");
            setUserData(null);
          }
          setLoading(false);
          clearTimeout(loadingTimeout);
        }, (error) => {
          console.error("Firestore snapshot error:", error);
          setLoading(false);
          clearTimeout(loadingTimeout);
          if (error.message.includes('permission-denied')) {
            setLoginError(language === 'ar' ? 'خطأ في الصلاحيات. يرجى تسجيل الدخول مرة أخرى.' : 'Permission denied. Please login again.');
          }
        });
        return () => {
          unsubscribeSnapshot();
          clearTimeout(loadingTimeout);
        };
      } else {
        setUserData(null);
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    });
    return () => {
      unsub();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const handleDeposit = async () => {
    if (!user) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100 || amount > 500) {
      alert('Please enter an amount between $100 and $500');
      return;
    }
    try {
      await addDoc(collection(db, 'deposits'), {
        uid: user.uid,
        amount: amount,
        network: depositNetwork,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert('Deposit request submitted! Wait for admin approval.');
      setIsDepositView(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFollow = async () => {
    if (!user || !userData) return;
    if (followCode.toLowerCase() === 'xpice') {
      if (userData.hasUsedXpice) {
        alert('You have already used this code once.');
        return;
      }
      const balance = userData.balance || 0;
      if (balance <= 0) {
        alert('Insufficient balance to use this code');
        return;
      }

      const deduction = balance * 0.025; // 2.5%
      const newBalance = balance - deduction;

      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 
          balance: newBalance,
          hasUsedXpice: true 
        });
        alert('Code accepted! 2.5% deducted. 10% will be added in 2 minutes.');
        setFollowCode('');

        // Set timer for 2 minutes
        setTimeout(async () => {
          // Fetch latest balance to be safe
          const latestSnap = await getDoc(userRef);
          const latestData = latestSnap.data();
          if (latestData) {
            const currentBalance = latestData.balance || 0;
            const addition = currentBalance * 0.10; // 10%
            await updateDoc(userRef, { balance: currentBalance + addition });
            console.log('10% added after 2 minutes');
          }
        }, 120000); // 2 minutes

      } catch (error) {
        console.error(error);
        alert('An error occurred');
      }
    } else {
      alert('Invalid order code');
    }
  };

  const handleWithdraw = async () => {
    if (!user || !userData) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      alert('Minimum withdrawal is 10 USDT');
      return;
    }
    if (amount > userData.balance) {
      alert('Insufficient balance');
      return;
    }

    try {
      // Deduct balance immediately (optimistic)
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: userData.balance - amount });

      await addDoc(collection(db, 'withdrawals'), {
        uid: user.uid,
        amount,
        network: depositNetwork,
        address: withdrawAddress,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert('Withdrawal request submitted!');
      setIsWithdrawView(false);
      setWithdrawAmount('');
      setWithdrawAddress('');
    } catch (error) {
      console.error(error);
    }
  };

  const coins = [
    { name: 'Bitcoin', symbol: 'BTC', price: '64,231.50', change: '+2.45%', isPositive: true, icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { name: 'Ethereum', symbol: 'ETH', price: '3,452.12', change: '-1.12%', isPositive: false, icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { name: 'Solana', symbol: 'SOL', price: '145.80', change: '+5.67%', isPositive: true, icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { name: 'Binance Coin', symbol: 'BNB', price: '582.30', change: '+0.85%', isPositive: true, icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
    { name: 'Cardano', symbol: 'ADA', price: '0.452', change: '-3.21%', isPositive: false, icon: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
    { name: 'Ripple', symbol: 'XRP', price: '0.621', change: '+1.45%', isPositive: true, icon: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
  ];

  const chartData = useMemo(() => {
    if (!selectedCoin) return [];
    return generateChartData(parseFloat(selectedCoin.price.replace(/,/g, '')));
  }, [selectedCoin]);

  const navItems = [
    { name: 'Home', icon: Home },
    { name: 'Market', icon: BarChart3 },
    { name: 'Follow', icon: Repeat },
    { name: 'Options', icon: CircleDollarSign },
    { name: 'Assets', icon: Wallet },
  ];

  const depositAddresses: Record<string, string> = {
    'TRC20': 'TYo6ApLxk5Fp5z8idTX5vxeaYBEKrVyokW',
    'BEP20': '0x3AfaE052CAAC6fFc8Cb2dd97e3e3d15d6eceEFFD'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddresses[depositNetwork]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.message.startsWith('DOMAIN_ERROR:')) {
        const domain = error.message.split(':')[1];
        setLoginError(`يجب إضافة هذا الرابط في إعدادات Firebase ليعمل تسجيل الدخول: ${domain}`);
      } else {
        setLoginError(error.message);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!email || !password) {
      setLoginError(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      setLoginError(error.message);
    }
  };

  const copyDomainToClipboard = () => {
    const domain = window.location.hostname;
    navigator.clipboard.writeText(domain);
    alert('تم نسخ الرابط! قم بلصقه الآن في إعدادات Firebase.');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Main subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#0F172A]" />
        
        {/* Curved decorative shapes */}
        <div className="absolute top-0 left-0 w-full h-[40%] bg-blue-600/5 rounded-b-[100%] scale-x-150 -translate-y-1/2 blur-3xl" />
        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
        
        {/* Subtle grid or texture could go here, but keeping it clean like the screenshot */}
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6 pb-24 min-h-screen">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-screen text-center px-6">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6" />
              {loadingSlow && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {language === 'ar' 
                      ? 'يبدو أن الاتصال بطيء أو أن هناك مشكلة في النطاق. يرجى التأكد من إضافة هذا الرابط في إعدادات Firebase.' 
                      : 'Connection seems slow or there is a domain issue. Please ensure this URL is added to Firebase authorized domains.'}
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    {language === 'ar' ? 'إعادة تحميل الصفحة' : 'Reload Page'}
                  </button>
                </motion.div>
              )}
            </div>
          ) : !user ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4"
            >
              <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-8 rotate-12">
                <BarChart3 size={48} className="text-white -rotate-12" />
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                {platformName}
              </h1>
              <p className="text-gray-400 mb-8 max-w-[280px] text-sm leading-relaxed">
                {t.eliteTraders}
              </p>
              
              <div className="w-full space-y-4">
                <div className="flex bg-white/5 p-1 rounded-xl mb-4">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                  >
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </button>
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'signup' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                  >
                    {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                  </button>
                </div>

                {loginError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-4 text-left">
                    <div className="flex items-center gap-2 text-rose-400 mb-1">
                      <ShieldAlert size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">{language === 'ar' ? 'خطأ' : 'Error'}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      {loginError}
                    </p>
                    {loginError.includes('إضافة هذا الرابط') && (
                      <button 
                        onClick={copyDomainToClipboard}
                        className="text-[10px] bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-500/30 transition-colors"
                      >
                        {language === 'ar' ? 'نسخ الرابط المطلوب' : 'Copy Required Domain'}
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="email" 
                      placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="password" 
                      placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95"
                  >
                    {authMode === 'login' ? (language === 'ar' ? 'دخول' : 'Login') : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')}
                  </button>
                </form>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{language === 'ar' ? 'أو' : 'OR'}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <button 
                  onClick={handleLogin}
                  className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 shadow-xl"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  {t.loginWithGoogle}
                </button>
              </div>

              <div className="mt-12 flex items-center gap-6 text-gray-500">
                <div className="flex flex-col items-center gap-1">
                  <ShieldAlert size={18} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">{t.secure}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-center gap-1">
                  <Repeat size={18} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">{t.fast}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col items-center gap-1">
                  <Globe size={18} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">{t.global}</span>
                </div>
              </div>
              
              <button 
                onClick={toggleLanguage}
                className="mt-8 flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Globe size={16} />
                {language === 'en' ? 'العربية' : 'English'}
              </button>
            </motion.div>
          ) : isDepositView ? (
            <motion.div
              key="deposit-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col h-full"
            >
              {/* Deposit Header */}
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setIsDepositView(false)}
                  className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">{t.deposit}</h1>
                <div className="w-10" />
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t.currencySelection}</label>
                <div className="relative">
                  <button 
                    onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold">T</div>
                      <span className="font-bold">USDT ({depositNetwork})</span>
                    </div>
                    <ChevronDown size={20} className={`text-gray-500 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isNetworkDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#0D1425] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                      >
                        {['TRC20', 'BEP20'].map((network) => (
                          <button
                            key={network}
                            onClick={() => {
                              setDepositNetwork(network);
                              setIsNetworkDropdownOpen(false);
                            }}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                          >
                            <span className={`font-bold ${depositNetwork === network ? 'text-blue-400' : 'text-gray-300'}`}>
                              USDT {network}
                            </span>
                            {depositNetwork === network && <Check size={18} className="text-blue-400" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t.depositAmount} ($100 - $500)</label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="100"
                    max="500"
                    placeholder={t.enterAmount} 
                    className="bg-transparent border-none outline-none text-white placeholder:text-gray-600 text-lg font-bold flex-1" 
                  />
                  <span className="text-blue-400 font-bold text-sm">USDT</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {[100, 200, 300, 400, 500].map((amt) => (
                    <button 
                      key={amt}
                      onClick={() => setDepositAmount(amt.toString())}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        depositAmount === amt.toString() 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl mb-8">
                  <QRCodeSVG value={depositAddresses[depositNetwork]} size={180} />
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">{t.address}</span>
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? t.copied : t.copy}
                    </button>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-4 break-all text-xs font-mono text-gray-400">
                    {depositAddresses[depositNetwork]}
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <button 
                  onClick={handleDeposit}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/40 transition-all active:scale-95"
                >
                  {t.confirmDeposit}
                </button>
                <div className="mt-4">
                  <h3 className="text-lg font-bold mb-4">{t.tips}</h3>
                  <ul className="space-y-3">
                    <li className="text-xs text-gray-500 flex gap-2">
                      <span className="text-blue-400">•</span>
                      {t.tip1}
                    </li>
                    <li className="text-xs text-gray-500 flex gap-2">
                      <span className="text-blue-400">•</span>
                      {t.tip2}
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : isWithdrawView ? (
            <motion.div
              key="withdraw-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col h-full"
            >
              {/* Withdraw Header */}
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setIsWithdrawView(false)}
                  className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">{t.withdraw}</h1>
                <div className="w-10" />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t.network}</label>
                  <div className="flex gap-3">
                    {['TRC20', 'BEP20'].map((network) => (
                      <button
                        key={network}
                        onClick={() => setDepositNetwork(network)}
                        className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                          depositNetwork === network 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {network}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Withdrawal Address</label>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <input 
                      type="text" 
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="Enter or long press to paste address"
                      className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount</label>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <input 
                      type="number" 
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Minimum 10 USDT"
                      className="bg-transparent border-none outline-none text-white placeholder:text-gray-600 text-sm flex-1"
                    />
                    <span className="text-blue-400 font-bold text-sm">USDT</span>
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    <span className="text-[10px] text-gray-500">Available: {userData?.balance?.toFixed(2) || '0.00'} USDT</span>
                    <button 
                      onClick={() => setWithdrawAmount(userData?.balance?.toString() || '0')}
                      className="text-[10px] text-blue-400 font-bold"
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-400">{t.handlingFee}</span>
                    <span className="text-xs font-bold">5 USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">{t.actualArrival}</span>
                    <span className="text-xs font-bold text-blue-400">
                      {withdrawAmount && parseFloat(withdrawAmount) > 5 
                        ? (parseFloat(withdrawAmount) - 5).toFixed(2) 
                        : '0.00'} USDT
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleWithdraw}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/40 transition-all active:scale-95 mt-8"
              >
                {t.confirmWithdrawal}
              </button>
            </motion.div>
          ) : isRecordView ? (
            <motion.div
              key="record-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setIsRecordView(false)}
                  className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">{t.records}</h1>
                <div className="w-10" />
              </div>

              <div className="flex gap-4 mb-6">
                <button className="flex-1 py-2 border-b-2 border-blue-500 text-blue-400 font-bold">{language === 'ar' ? 'الكل' : 'All'}</button>
                <button className="flex-1 py-2 text-gray-500 font-bold">{t.deposit}</button>
                <button className="flex-1 py-2 text-gray-500 font-bold">{t.withdraw}</button>
              </div>

              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <BarChart3 size={64} className="mb-4" />
                <p className="text-sm font-bold">No records found</p>
              </div>
            </motion.div>
          ) : isProfileView ? (
            <motion.div
              key="profile-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setIsProfileView(false)}
                  className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">{t.profile}</h1>
                <div className="w-10" />
              </div>

              <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 border border-white/10 rounded-3xl">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/20">
                  {userData?.email?.[0].toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold truncate max-w-[200px]">{userData?.email}</h2>
                  <p className="text-xs text-gray-500 font-mono">UID: {userData?.uid?.slice(-8)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Verified</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Security Center', icon: Bell },
                  { label: 'Identity Verification', icon: Check },
                  { label: 'Payment Method', icon: Wallet },
                  { label: 'Invite Friends', icon: Repeat },
                  { label: 'Settings', icon: Globe },
                  { label: 'About Us', icon: MessageCircle },
                ].map((item) => (
                  <button key={item.label} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="text-blue-400" />
                      <span className="font-bold text-sm">{item.label}</span>
                    </div>
                    <ChevronDown size={18} className="text-gray-600 -rotate-90" />
                  </button>
                ))}
              </div>

              <button 
                onClick={logOut}
                className="w-full mt-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-2xl hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <LogOutIcon size={18} />
                Log Out
              </button>
            </motion.div>
          ) : selectedCoin ? (
            <motion.div
              key="trading-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full"
            >
              {/* Trading Header */}
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => setSelectedCoin(null)}
                  className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">{selectedCoin.symbol}/USDT</span>
                  <span className={`text-xs font-bold ${selectedCoin.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedCoin.change}
                  </span>
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Price Display */}
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-1">${selectedCoin.price}</h1>
                <p className="text-sm text-gray-500">≈ {selectedCoin.price} USDT</p>
              </div>

              {/* Chart Placeholder / Recharts */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-8 h-64 relative overflow-hidden">
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded">1H</span>
                  <span className="text-[10px] font-bold text-gray-500 px-2 py-1">4H</span>
                  <span className="text-[10px] font-bold text-gray-500 px-2 py-1">1D</span>
                  <span className="text-[10px] font-bold text-gray-500 px-2 py-1">1W</span>
                </div>
                
                <div className="w-full h-full pt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedCoin.isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={selectedCoin.isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0D1425', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={selectedCoin.isPositive ? "#10b981" : "#f43f5e"} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trading Info */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{t.high24h}</span>
                  <span className="text-sm font-bold text-emerald-400">$65,120.00</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{t.low24h}</span>
                  <span className="text-sm font-bold text-rose-400">$63,800.00</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-auto">
                <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <ArrowUpRight size={20} />
                  {t.buy}
                </button>
                <button className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <ArrowDownRight size={20} />
                  {t.sell}
                </button>
              </div>
            </motion.div>
          ) : activeTab === 'Follow' ? (
            <motion.div
              key="follow-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col h-full -mx-4"
            >
              {/* Follow Header */}
              <div className="flex justify-end px-4 mb-4">
                <button 
                  onClick={() => setIsRecordView(true)}
                  className="flex items-center gap-1 text-blue-400 font-bold text-sm"
                >
                  <BarChart3 size={18} />
                  Record
                </button>
              </div>

              {/* Hero Section */}
              <div className="relative w-full h-[350px] mb-8 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <img 
                    src="https://picsum.photos/seed/crypto-tech/800/600" 
                    alt="Hero Background" 
                    className="w-full h-full object-cover opacity-30 mix-blend-overlay"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050A18]/50 to-[#050A18]" />
                </div>
                
                <div className="relative z-10">
                  <h1 className="text-4xl font-bold mb-4 leading-tight">
                    {t.recommendFriends}
                  </h1>
                  <p className="text-gray-400 text-sm font-medium">
                    {t.getCommissions}
                  </p>
                </div>
              </div>

              {/* Input Section */}
              <div className="px-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
                  <input 
                    type="text" 
                    placeholder={t.enterOrderCode}
                    value={followCode}
                    onChange={(e) => setFollowCode(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-600 text-sm"
                  />
                </div>

                <button 
                  onClick={handleFollow}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/40 transition-all active:scale-95"
                >
                  {t.followBtn}
                </button>
              </div>
            </motion.div>
          ) : activeTab === 'Market' ? (
            <motion.div
              key="market-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{t.market}</h1>
                <button className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <Search size={20} />
                </button>
              </div>

              <div className="flex gap-6 mb-6 border-b border-white/5">
                <button 
                  onClick={() => setMarketTab('Spot')}
                  className={`pb-2 font-bold transition-all ${marketTab === 'Spot' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-500'}`}
                >
                  {t.spot}
                </button>
                <button 
                  onClick={() => setMarketTab('Futures')}
                  className={`pb-2 font-bold transition-all ${marketTab === 'Futures' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-500'}`}
                >
                  {t.futures}
                </button>
                <button 
                  onClick={() => setMarketTab('Favorites')}
                  className={`pb-2 font-bold transition-all ${marketTab === 'Favorites' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-500'}`}
                >
                  {t.favorites}
                </button>
              </div>

              <div className="space-y-4">
                {coins
                  .filter(coin => {
                    if (marketTab === 'Favorites') return favorites.includes(coin.symbol);
                    // Differentiate Spot and Futures slightly for demo purposes
                    if (marketTab === 'Futures') return coin.symbol !== 'ADA' && coin.symbol !== 'XRP';
                    return true;
                  })
                  .map((coin) => (
                    <div 
                      key={coin.symbol}
                      onClick={() => setSelectedCoin(coin)}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites(prev => 
                              prev.includes(coin.symbol) 
                                ? prev.filter(s => s !== coin.symbol)
                                : [...prev, coin.symbol]
                            );
                          }}
                          className={`p-1 rounded-lg transition-colors ${favorites.includes(coin.symbol) ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                          <Star size={16} fill={favorites.includes(coin.symbol) ? 'currentColor' : 'none'} />
                        </button>
                        <img src={coin.icon} alt={coin.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-bold">{coin.symbol}</p>
                          <p className="text-[10px] text-gray-500">{coin.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${coin.price}</p>
                        <p className={`text-xs font-bold ${coin.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {coin.change}
                        </p>
                      </div>
                    </div>
                  ))}
                {marketTab === 'Favorites' && favorites.length === 0 && (
                  <div className="text-center py-12">
                    <Star size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                    <p className="text-gray-500">{language === 'en' ? 'No favorites yet' : 'لا توجد مفضلات بعد'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'Options' ? (
            <motion.div
              key="options-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">{t.options}</h1>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/30">{t.call}</button>
                  <button className="px-3 py-1 bg-white/5 text-gray-500 rounded-lg text-xs font-bold border border-white/10">{t.put}</button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateChartData(64231)}>
                      <Area type="monotone" dataKey="price" stroke="#10b981" fill="#10b981" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-500 mb-2 uppercase tracking-widest font-bold relative z-10">{t.currentPrice}</p>
                <h2 className="text-5xl font-bold text-emerald-400 mb-4 tracking-tighter relative z-10">$64,231.50</h2>
                <div className="flex justify-center gap-4 relative z-10">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{t.high24h}</p>
                    <p className="text-sm font-bold">$65,120</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{t.low24h}</p>
                    <p className="text-sm font-bold">$63,800</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[30, 60, 120].map((sec) => (
                    <button key={sec} className="bg-white/5 border border-white/10 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors">
                      {sec}s
                    </button>
                  ))}
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <input type="number" placeholder="Enter amount" className="bg-transparent border-none outline-none text-white placeholder:text-gray-600 text-sm flex-1" />
                  <span className="text-blue-400 font-bold text-sm">USDT</span>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                    Call (Up)
                  </button>
                  <button className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95">
                    Put (Down)
                  </button>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'Assets' ? (
            <motion.div
              key="assets-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col h-full"
            >
              {/* Assets Header Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-[32px] p-6 mb-6 shadow-2xl shadow-blue-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white/70">Total Balance(USDT)</span>
                      <button onClick={() => setShowBalance(!showBalance)} className="text-white/50 hover:text-white">
                        {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                    <span className="text-4xl font-bold tracking-tight">
                      {showBalance ? (userData?.balance?.toFixed(2) || '0.00') : '*** ***'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white/70 block mb-1">Today Yield</span>
                    <span className="text-2xl font-bold">0</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setIsDepositView(true)}
                  className="bg-[#1A2333] hover:bg-[#252D3D] border border-white/5 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                >
                  <ArrowDownLeft size={20} className="text-blue-400" />
                  {t.deposit}
                </button>
                <button 
                  onClick={() => setIsWithdrawView(true)}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <ArrowUpRight size={20} />
                  {t.withdraw}
                </button>
              </div>

              {/* Tabs & Record */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-6">
                  <button className="relative pb-2 font-bold text-blue-400">
                    {t.assets}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                  </button>
                  <button className="pb-2 font-bold text-gray-500 hover:text-gray-300">
                    {t.totalBalance}
                  </button>
                </div>
                <button 
                  onClick={() => setIsRecordView(true)}
                  className="flex items-center gap-1 text-blue-400 font-bold text-sm"
                >
                  <BarChart3 size={18} />
                  {t.records}
                </button>
              </div>

              {/* List Items */}
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                  <span className="font-bold">{t.teamBenefits}</span>
                  <span className="font-bold text-gray-400">USDT</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Header */}
              <header className="flex items-center justify-between mb-8">
                <div 
                  onClick={() => setIsProfileView(true)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <span className="text-xl font-black italic tracking-tighter">{userData?.email?.[0].toUpperCase() || 'X'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-blue-400 tracking-widest uppercase group-hover:text-blue-300 transition-colors">{platformName}</span>
                    <span className="text-[10px] text-gray-400 font-mono">UID: {userData?.uid?.slice(-8)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                    <Bell size={20} className="text-gray-300" />
                  </button>
                  <button 
                    onClick={toggleLanguage}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                  >
                    <Globe size={20} className="text-gray-300" />
                  </button>
                </div>
              </header>

              {/* Balance Section */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-medium text-gray-400">{t.totalBalance}</h2>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">
                    {showBalance ? (userData?.balance?.toFixed(2) || '0') : '****'}
                  </span>
                  <span className="text-sm font-medium text-gray-500">USDT</span>
                </div>
              </section>

              {/* Announcement Bar */}
              <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
                <div className="relative">
                  <Bell size={16} className="text-blue-400 fill-blue-400/20" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050A18]" />
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-gray-400 truncate">{t.welcome} {platformName}. Secure your assets with 2FA...</p>
                </div>
              </div>

              {/* Market Section */}
              <section className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{t.market}</h3>
                  <button className="text-xs text-blue-400 font-medium hover:underline">{t.viewAll}</button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col">
                  <div className="grid grid-cols-2 p-4 border-b border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t.currency}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">{t.latestPrice}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    {coins.map((coin, index) => (
                      <motion.div 
                        key={coin.symbol}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedCoin(coin)}
                        className="grid grid-cols-2 p-4 items-center border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 p-1.5 overflow-hidden">
                            <img src={coin.icon} alt={coin.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{coin.symbol}</span>
                            <span className="text-[10px] text-gray-400 font-mono">UID: 8273941</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold">${coin.price}</span>
                          <span className={`text-[10px] font-bold ${coin.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {coin.change}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Panel Overlay */}
        <AnimatePresence>
          {isAdminPanelOpen && (
            <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
          )}
        </AnimatePresence>

        {/* Floating Support Button */}
        {!selectedCoin && !isDepositView && !isWithdrawView && !isRecordView && !isProfileView && !isAdminPanelOpen && (
          <button className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50">
            <MessageCircle size={24} />
          </button>
        )}

        {/* Bottom Navigation */}
        {!selectedCoin && !isDepositView && !isWithdrawView && !isRecordView && !isProfileView && !isAdminPanelOpen && (
          <nav className="fixed bottom-6 left-4 right-4 bg-[#0D1425]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex items-center justify-between shadow-2xl z-50">
            {navItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all relative ${
                    isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {item.name === 'Home' ? t.assets : 
                     item.name === 'Market' ? t.market : 
                     item.name === 'Follow' ? t.follow : 
                     item.name === 'Options' ? t.options : 
                     t.assets}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 w-8 h-1 bg-blue-500 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
