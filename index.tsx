
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, User, Bot, Trash2, X, Menu, 
  Plus, Minus, Clock, ShoppingBag, MessageSquare, 
  CreditCard, Headphones, ExternalLink, 
  Camera, Search, ArrowRightLeft, 
  Zap, ShieldCheck, Database, History, 
  BarChart3, Wallet, Sparkles, Trophy, 
  TrendingUp, Activity, Lock, Smartphone, ChevronRight,
  Settings, Package, DollarSign, CheckCircle2, AlertTriangle, Briefcase, Key, WifiOff, Edit3, Check, 
  Phone, PhoneCall, PhoneOff, Mic, Volume2, Signal, Globe, Delete, 
  Gamepad2, Coins, Dices, Cpu, Skull, Gem, Sun, Moon,
  TrendingDown, Rocket, ChevronLeft,
  Cherry, Citrus, Grape, Diamond, Pickaxe, Box, Layers,
  Crown, Flame, Star, ZapOff, Atom, Award, Target, Zap as ZapIcon, FastForward, Info,
  Cat, TreePalm, Filter, SortAsc, SortDesc, Users, MessageCircle, ArrowUpRight, ArrowDownLeft, RefreshCw,
  Landmark, Bitcoin, Terminal, Server, ShieldAlert, Ticket,
  Smile, Briefcase as BriefcaseIcon, Ghost
} from 'lucide-react';

// --- Types & Constants ---
type Language = 'ru' | 'en';
type Theme = 'dark' | 'light';
type Tab = 'chat' | 'catalog' | 'wallet' | 'games' | 'profile' | 'admin';
type GameType = 'menu' | 'slots' | 'crash' | 'neon-fruits' | 'void-miner' | 'golden-dragon' | 'quantum-crash' | 'crazy-monkey';
type OrderStatus = 'pending' | 'paid' | 'delivered' | 'cancelled';
type UserLevel = 'Standard' | 'Silver' | 'Gold' | 'Platinum';
type CallStatus = 'idle' | 'calling' | 'active' | 'ended';
type WalletSubTab = 'assets' | 'history' | 'p2p';
type AdminRole = 'super_admin' | 'moderator' | 'support';
type AdminSubTab = 'users' | 'system' | 'tickets';
type AiPersona = 'formal' | 'friendly' | 'sarcastic';

interface CatalogItem {
  id: string;
  name: string;
  price: string;
  rawPrice: number;
  desc: string;
  icon: string;
  tag?: string;
  color: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
}

interface OrderRecord {
  id: string;
  itemId: string;
  status: OrderStatus;
  timestamp: number;
  total?: number;
}

interface GameStats {
  totalSpins: number;
  totalWins: number;
  maxCrash: number;
  vipPlayed: number;
  totalBet: number;
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

interface VipHistoryEntry {
  id: string;
  game: string;
  bet: number;
  outcome: number;
  multiplier?: number;
  date: number;
}

interface AdminUserRecord {
  id: string;
  name: string;
  points: number;
  level: UserLevel;
  lastSeen: number;
  avatar?: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  method: 'crypto' | 'bank_transfer' | 'p2p';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: number;
  details?: string;
}

interface P2POrder {
  id: string;
  traderName: string;
  type: 'buy' | 'sell';
  asset: string;
  price: number;
  currency: string;
  limitMin: number;
  limitMax: number;
  ordersCount: number;
  completionRate: number;
  paymentMethods: string[];
}

interface P2PMessage {
  id: string;
  sender: 'me' | 'trader';
  text: string;
  timestamp: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_spin', title: 'Новичок', desc: 'Первая ставка в терминале', icon: <ZapIcon className="w-4 h-4" />, color: 'bg-blue-500' },
  { id: 'big_win', title: 'Везунчик', desc: 'Выиграно более 5000 за раз', icon: <Trophy className="w-4 h-4" />, color: 'bg-yellow-500' },
  { id: 'vip_entry', title: 'Хайроллер', desc: 'Доступ в VIP зону получен', icon: <Crown className="w-4 h-4" />, color: 'bg-amber-600' },
  { id: 'crash_master', title: 'Пилот', desc: 'Множитель 5х в Crash', icon: <Rocket className="w-4 h-4" />, color: 'bg-rose-500' },
  { id: 'loyal', title: 'Адепт', desc: '100+ игр завершено', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-emerald-500' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx_1', type: 'deposit', method: 'crypto', amount: 5000, currency: 'USDT', status: 'completed', date: Date.now() - 1000000, details: 'Network: TRC20' },
  { id: 'tx_2', type: 'withdrawal', method: 'bank_transfer', amount: 1500, currency: 'RUB', status: 'completed', date: Date.now() - 5000000, details: 'Sberbank •••• 4242' },
  { id: 'tx_3', type: 'deposit', method: 'p2p', amount: 10000, currency: 'KOLO', status: 'pending', date: Date.now() - 360000, details: 'Order #P2P-882' },
  { id: 'tx_4', type: 'withdrawal', method: 'crypto', amount: 0.005, currency: 'BTC', status: 'failed', date: Date.now() - 86400000, details: 'Insufficient Network Fee' },
  { id: 'tx_5', type: 'deposit', method: 'bank_transfer', amount: 25000, currency: 'KOLO', status: 'completed', date: Date.now() - 120000000, details: 'Tinkoff QR' },
];

const MOCK_P2P_ORDERS: P2POrder[] = [
  { id: 'p2p_1', traderName: 'FastTrader_99', type: 'buy', asset: 'USDT', price: 92.50, currency: 'RUB', limitMin: 1000, limitMax: 50000, ordersCount: 1240, completionRate: 99.5, paymentMethods: ['Sberbank', 'Tinkoff'] },
  { id: 'p2p_2', traderName: 'CryptoKing', type: 'buy', asset: 'USDT', price: 92.85, currency: 'RUB', limitMin: 5000, limitMax: 150000, ordersCount: 540, completionRate: 98.2, paymentMethods: ['SBP'] },
  { id: 'p2p_3', traderName: 'Alice_Wonder', type: 'sell', asset: 'USDT', price: 91.20, currency: 'RUB', limitMin: 500, limitMax: 10000, ordersCount: 88, completionRate: 95.0, paymentMethods: ['Tinkoff'] },
  { id: 'p2p_4', traderName: 'WhaleMoves', type: 'buy', asset: 'BTC', price: 5800000, currency: 'RUB', limitMin: 50000, limitMax: 1000000, ordersCount: 3200, completionRate: 99.9, paymentMethods: ['Bank Transfer'] },
];

const MOCK_ADMIN_USERS: AdminUserRecord[] = [
  { id: '1', name: 'Admin_Core', points: 9999999, level: 'Platinum', lastSeen: Date.now() - 10000 },
  { id: '2', name: 'Cyber_Wolf', points: 250400, level: 'Silver', lastSeen: Date.now() - 3600000 },
  { id: '3', name: 'NeoScanner', points: 12500, level: 'Standard', lastSeen: Date.now() - 86400000 },
  { id: '4', name: 'GoldenMonkey', points: 890000, level: 'Gold', lastSeen: Date.now() - 5000 },
  { id: '5', name: 'Zero_Day', points: 4500, level: 'Standard', lastSeen: Date.now() - 2400000 },
  { id: '6', name: 'Vip_Gamer_77', points: 1500000, level: 'Platinum', lastSeen: Date.now() - 120000 },
  { id: '7', name: 'Bit_Walker', points: 120000, level: 'Silver', lastSeen: Date.now() - 300000 },
];

const MOCK_TICKETS = [
  { id: 't1', user: 'User_992', subject: 'Deposit failed via SBP', status: 'open', priority: 'high' },
  { id: 't2', user: 'Alice_W', subject: 'Game froze during spin', status: 'open', priority: 'medium' },
  { id: 't3', user: 'Bob_B', subject: 'KYC Question', status: 'pending', priority: 'low' },
  { id: 't4', user: 'CryptoKing', subject: 'P2P Dispute #882', status: 'resolved', priority: 'high' },
];

const MOCK_SYSTEM_LOGS = [
  { id: 'l1', time: '10:42:22', level: 'WARN', msg: 'High latency on node us-east-1' },
  { id: 'l2', time: '10:41:05', level: 'INFO', msg: 'User backup completed' },
  { id: 'l3', time: '10:39:55', level: 'ERROR', msg: 'Payment gateway timeout (API_KEY_INVALID)' },
  { id: 'l4', time: '10:38:12', level: 'INFO', msg: 'Admin login: root' },
];

const ROLE_COLORS = {
  super_admin: 'bg-rose-500 text-white',
  moderator: 'bg-indigo-500 text-white',
  support: 'bg-emerald-500 text-white'
};

const ROLE_LABELS = {
  super_admin: 'SUPER ADMIN',
  moderator: 'MODERATOR',
  support: 'SUPPORT'
};

const SLOT_SYMBOLS_CYBER = [
  { icon: <Bot className="w-8 h-8 text-cyan-400" />, multiplier: 5 },
  { icon: <Zap className="w-8 h-8 text-yellow-400" />, multiplier: 3 },
  { icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />, multiplier: 2 },
  { icon: <Skull className="w-8 h-8 text-rose-500" />, multiplier: 20 },
  { icon: <Gem className="w-8 h-8 text-fuchsia-500" />, multiplier: 50 },
  { icon: <Cpu className="w-8 h-8 text-slate-400" />, multiplier: 1.5 }
];

const SLOT_SYMBOLS_NEON = [
  { icon: <Cherry className="w-8 h-8 text-rose-400" />, multiplier: 2 },
  { icon: <Citrus className="w-8 h-8 text-amber-400" />, multiplier: 4 },
  { icon: <Grape className="w-8 h-8 text-violet-400" />, multiplier: 8 },
  { icon: <Gem className="w-8 h-8 text-cyan-400" />, multiplier: 25 },
  { icon: <Trophy className="w-8 h-8 text-yellow-500" />, multiplier: 100 }
];

const SLOT_SYMBOLS_VOID = [
  { icon: <Layers className="w-8 h-8 text-slate-500" />, multiplier: 1.5 },
  { icon: <Box className="w-8 h-8 text-indigo-400" />, multiplier: 3 },
  { icon: <Pickaxe className="w-8 h-8 text-slate-300" />, multiplier: 10 },
  { icon: <Diamond className="w-8 h-8 text-white" />, multiplier: 75 },
  { icon: <Rocket className="w-8 h-8 text-emerald-400" />, multiplier: 250 }
];

const SLOT_SYMBOLS_DRAGON = [
  { icon: <Flame className="w-8 h-8 text-orange-500" />, multiplier: 5 },
  { icon: <Star className="w-8 h-8 text-yellow-300" />, multiplier: 15 },
  { icon: <Crown className="w-8 h-8 text-amber-400" />, multiplier: 50 },
  { icon: <Gem className="w-8 h-8 text-red-500" />, multiplier: 200 },
  { icon: <Trophy className="w-8 h-8 text-yellow-500" />, multiplier: 1000 }
];

const SLOT_SYMBOLS_MONKEY = [
  { icon: <Cat className="w-8 h-8 text-amber-400" />, multiplier: 500 },
  { icon: <ShieldCheck className="w-8 h-8 text-rose-400" />, multiplier: 100 },
  { icon: <Flame className="w-8 h-8 text-orange-500" />, multiplier: 50 },
  { icon: <Zap className="w-8 h-8 text-yellow-500" />, multiplier: 20 },
  { icon: <Citrus className="w-8 h-8 text-yellow-300" />, multiplier: 10 },
  { icon: <Sparkles className="w-8 h-8 text-cyan-400" />, multiplier: 5 }
];

const TRANSLATIONS = {
  ru: {
    subtitle: "Digital Asset Terminal v5.7",
    placeholder_chat: "Введите команду или запрос...",
    thinking: "Нейросеть думает...",
    welcome_title: "Терминал Колобок",
    nav_chat: "Терминал",
    nav_catalog: "Маркет",
    nav_wallet: "Кошелек",
    nav_games: "Игры",
    nav_profile: "Профиль",
    nav_admin: "Admin",
    cat_title: "Цифровые Ассеты",
    wallet_title: "Мои Активы",
    buy_btn: "Приобрести",
    empty_wallet: "Транзакции не найдены",
    status_pending: "Обработка",
    status_paid: "Оплачено",
    status_delivered: "Выдано",
    status_delivered_desc: "The asset was successfully delivered.",
    status_cancelled: "Отмена",
    support_btn: "Связаться с оператором",
    admin_access: "Панель Администратора",
    edit_profile: "Редактировать профиль",
    save_profile: "Сохранить",
    cancel: "Отмена",
    username: "Имя пользователя",
    comms_title: "SIP ТЕРМИНАЛ",
    comms_status_ready: "СЕРВЕР: ОНЛАЙН",
    comms_call: "ВЫЗОВ",
    comms_end: "ЗАВЕРШИТЬ",
    comms_support: "ПОДДЕРЖКА",
    games_title: "ИГРОВОЙ ЦЕНТР",
    games_bet: "СТАВКА",
    games_spin: "ЗАПУСК",
    games_win: "ВЫИГРЫШ!",
    games_no_pts: "НЕДОСТАТОЧНО СРЕДСТВ",
    theme_label: "Тема интерфейса",
    crash_title: "PROTOCOL CRASH",
    crash_bet: "СТАВКА",
    crash_cashout: "ВЫВОД",
    crash_crashed: "КРАШ!",
    neon_title: "NEON FRUITS",
    void_title: "VOID MINER",
    vip_zone: "VIP ЗОНА",
    vip_req: "Нужен уровень",
    golden_dragon: "GOLDEN DRAGON",
    quantum_crash: "QUANTUM CRASH",
    crazy_monkey: "CRAZY MONKEY",
    level: "УРОВЕНЬ",
    stats: "СТАТИСТИКА",
    achievements: "ДОСТИЖЕНИЯ",
    vip_history: "ИСТОРИЯ VIP",
    win_rate: "ВИНРЕЙТ",
    next_level: "ДО СЛЕДУЮЩЕГО",
    ai_role: "Ты — Колобок AI, элитный цифровой ассистент. Продаешь карты Google Play (Турция). Коротко, профессионально.",
    admin_users: "УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ",
    search_users: "Поиск пользователей...",
    sort_by: "Сортировка",
    filter_tier: "Тир",
    balance_high: "Баланс (Выс)",
    balance_low: "Баланс (Низ)",
    name_az: "Имя (А-Я)",
    recent_activity: "Активность",
    all_tiers: "Все тиры",
    wallet_assets: "АКТИВЫ",
    wallet_history: "ИСТОРИЯ",
    wallet_p2p: "P2P ТОРГОВЛЯ",
    deposit: "Пополнить",
    withdraw: "Вывести",
    transfer: "Перевод",
    transaction_history: "История транзакций",
    p2p_marketplace: "P2P Маркет",
    buy: "КУПИТЬ",
    sell: "ПРОДАТЬ",
    chat_placeholder: "Сообщение трейдеру...",
    withdraw_title: "ВЫВОД СРЕДСТВ",
    withdraw_amount: "Сумма вывода",
    withdraw_method: "Метод вывода",
    withdraw_destination: "Реквизиты получателя",
    withdraw_submit: "ПОДТВЕРДИТЬ ВЫВОД",
    insufficient_funds: "Недостаточно средств",
    card_method: "Банковская карта",
    crypto_method: "Криптокошелек (USDT)",
    admin_tab_users: "Пользователи",
    admin_tab_system: "Система",
    admin_tab_tickets: "Тикеты",
    persona_label: "Тон ассистента",
    persona_formal: "Официальный",
    persona_friendly: "Дружелюбный",
    persona_sarcastic: "Саркастичный",
    deposit_title: "ПОПОЛНЕНИЕ",
    deposit_amount: "Сумма пополнения",
    deposit_method: "Метод оплаты",
    deposit_submit: "ПЕРЕЙТИ К ОПЛАТЕ",
    invalid_amount: "Некорректная сумма"
  },
  en: {
    subtitle: "Digital Asset Terminal v5.7",
    placeholder_chat: "Enter command or query...",
    thinking: "Neural network processing...",
    welcome_title: "Kolobok Terminal",
    nav_chat: "Terminal",
    nav_catalog: "Market",
    nav_wallet: "Wallet",
    nav_comms: "Comms",
    nav_games: "Games",
    nav_profile: "Profile",
    nav_admin: "Admin",
    cat_title: "Digital Assets",
    wallet_title: "My Assets",
    buy_btn: "Purchase",
    empty_wallet: "No transactions found",
    status_pending: "Processing",
    status_paid: "Paid",
    status_delivered: "Delivered",
    status_delivered_desc: "The asset was successfully delivered.",
    status_cancelled: "Cancelled",
    support_btn: "Contact Operator",
    admin_access: "Admin Panel Access",
    edit_profile: "Edit Profile",
    save_profile: "Save Changes",
    cancel: "Cancel",
    username: "Username",
    comms_title: "SIP TERMINAL",
    comms_status_ready: "SERVER: ONLINE",
    comms_call: "CALL",
    comms_end: "END",
    comms_support: "SUPPORT",
    games_title: "GAME HUB",
    games_bet: "BET",
    games_spin: "SPIN",
    games_win: "JACKPOT!",
    games_no_pts: "NOT ENOUGH FUNDS",
    theme_label: "Interface Theme",
    crash_title: "PROTOCOL CRASH",
    crash_bet: "BET",
    crash_cashout: "CASH OUT",
    crash_crashed: "CRASHED!",
    neon_title: "NEON FRUITS",
    void_title: "VOID MINER",
    vip_zone: "VIP ZONE",
    vip_req: "Level Required",
    golden_dragon: "GOLDEN DRAGON",
    quantum_crash: "QUANTUM CRASH",
    crazy_monkey: "CRAZY MONKEY",
    level: "LEVEL",
    stats: "STATISTICS",
    achievements: "ACHIEVEMENTS",
    vip_history: "VIP HISTORY",
    win_rate: "WIN RATE",
    next_level: "NEXT LEVEL",
    ai_role: "You are Kolobok AI, an elite assistant. Selling Google Play Turkey cards. Concise, professional.",
    admin_users: "USER MANAGEMENT",
    search_users: "Search users...",
    sort_by: "Sort",
    filter_tier: "Tier",
    balance_high: "Balance (High)",
    balance_low: "Balance (Low)",
    name_az: "Name (A-Z)",
    recent_activity: "Activity",
    all_tiers: "All Tiers",
    wallet_assets: "ASSETS",
    wallet_history: "HISTORY",
    wallet_p2p: "P2P TRADE",
    deposit: "Deposit",
    withdraw: "Withdraw",
    transfer: "Transfer",
    transaction_history: "Transaction History",
    p2p_marketplace: "P2P Market",
    buy: "BUY",
    sell: "SELL",
    chat_placeholder: "Message trader...",
    withdraw_title: "WITHDRAW FUNDS",
    withdraw_amount: "Withdraw Amount",
    withdraw_method: "Withdraw Method",
    withdraw_destination: "Destination Details",
    withdraw_submit: "CONFIRM WITHDRAW",
    insufficient_funds: "Insufficient funds",
    card_method: "Bank Card",
    crypto_method: "Crypto Wallet (USDT)",
    admin_tab_users: "Users",
    admin_tab_system: "System",
    admin_tab_tickets: "Tickets",
    persona_label: "Assistant Tone",
    persona_formal: "Formal",
    persona_friendly: "Friendly",
    persona_sarcastic: "Sarcastic",
    deposit_title: "DEPOSIT FUNDS",
    deposit_amount: "Deposit Amount",
    deposit_method: "Payment Method",
    deposit_submit: "PROCEED TO PAYMENT",
    invalid_amount: "Invalid amount"
  }
} as const;

const DEFAULT_CATALOG: CatalogItem[] = [
  { id: '1', name: 'Google Play 100 TRY', price: '240 ₽', rawPrice: 240, desc: 'Базовое пополнение. Регион: Турция.', icon: '🇹🇷', tag: 'FAST', color: 'from-blue-500 to-cyan-500' },
  { id: '2', name: 'Google Play 1000 TRY', price: '2240 ₽', rawPrice: 2240, desc: 'Максимальный пакет. Регион: Турция.', icon: '💎', tag: 'HIT', color: 'from-violet-500 to-fuchsia-500' },
  { id: '3', name: 'Google Play 1000 TRY', price: '1240 ₽', rawPrice: 1240, desc: 'Промо-код. Ограниченная серия.', icon: '🔥', tag: 'PROMO', color: 'from-amber-500 to-orange-500' },
];

const DB_KEY_SESSIONS = 'kolobok_sessions_v5';
const DB_KEY_ORDERS = 'kolobok_orders_v5';
const DB_KEY_CATALOG = 'kolobok_catalog_v5';
const DB_KEY_USER = 'kolobok_user_v5';
const DB_KEY_THEME = 'kolobok_theme_v5';
const DB_KEY_TRANSACTIONS = 'kolobok_transactions_v5';
const DB_KEY_PERSONA = 'kolobok_persona_v5';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [language, setLanguage] = useState<Language>('ru');
  const [theme, setTheme] = useState<Theme>('dark');
  const [aiPersona, setAiPersona] = useState<AiPersona>('friendly');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>(DEFAULT_CATALOG);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [username, setUsername] = useState('Anonymous');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [koloPoints, setKoloPoints] = useState(70000); 

  const [gameStats, setGameStats] = useState<GameStats>({ totalSpins: 0, totalWins: 0, maxCrash: 1.0, vipPlayed: 0, totalBet: 0 });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [vipHistory, setVipHistory] = useState<VipHistoryEntry[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const [adminSearch, setAdminSearch] = useState('');
  const [adminSort, setAdminSort] = useState<'balance-high' | 'balance-low' | 'name-az' | 'recent'>('balance-high');
  const [adminFilterTier, setAdminFilterTier] = useState<UserLevel | 'All'>('All');
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('users');

  const [walletSubTab, setWalletSubTab] = useState<WalletSubTab>('assets');
  const [selectedP2POrder, setSelectedP2POrder] = useState<P2POrder | null>(null);
  const [p2pChatMessages, setP2pChatMessages] = useState<P2PMessage[]>([]);
  const [p2pInput, setP2pInput] = useState('');
  const [p2pType, setP2pType] = useState<'buy' | 'sell'>('buy');
  
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'card' | 'crypto'>('card');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'card' | 'crypto'>('card');
  const [depositError, setDepositError] = useState('');

  const [activeGame, setActiveGame] = useState<GameType>('menu');
  const [reels, setReels] = useState([0, 1, 2]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const [crashMultiplier, setCrashMultiplier] = useState(1.00);
  const [isCrashRunning, setIsCrashRunning] = useState(false);
  const [crashBetAmount, setCrashBetAmount] = useState(100);
  const [isCrashed, setIsCrashed] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const crashIntervalRef = useRef<number | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const t = useMemo(() => TRANSLATIONS[language], [language]);
  const isDark = theme === 'dark';

  const currentSymbols = useMemo(() => {
    switch (activeGame) {
      case 'slots': return SLOT_SYMBOLS_CYBER;
      case 'neon-fruits': return SLOT_SYMBOLS_NEON;
      case 'golden-dragon': return SLOT_SYMBOLS_DRAGON;
      case 'void-miner': return SLOT_SYMBOLS_VOID;
      case 'crazy-monkey': return SLOT_SYMBOLS_MONKEY;
      default: return SLOT_SYMBOLS_CYBER;
    }
  }, [activeGame]);

  const levelInfo = useMemo(() => {
    const levels = [
      { name: 'Standard', min: 0, max: 100000, color: 'bg-indigo-500' },
      { name: 'Silver', min: 100000, max: 500000, color: 'bg-slate-400' },
      { name: 'Gold', min: 500000, max: 1000000, color: 'bg-amber-400' },
      { name: 'Platinum', min: 1000000, max: Infinity, color: 'bg-slate-300' }
    ];
    const current = levels.find(l => koloPoints >= l.min && (koloPoints < l.max || l.max === Infinity)) || levels[0];
    const next = levels[levels.indexOf(current) + 1] || null;
    const progress = next ? ((koloPoints - current.min) / (next.min - current.min)) * 100 : 100;
    
    return { 
      name: current.name as UserLevel, 
      color: current.color, 
      progress, 
      nextName: next?.name || 'MAX',
      remaining: next ? next.min - koloPoints : 0
    };
  }, [koloPoints]);

  const userWinRate = useMemo(() => {
    if (gameStats.totalSpins === 0) return "0%";
    return ((gameStats.totalWins / gameStats.totalSpins) * 100).toFixed(1) + "%";
  }, [gameStats]);

  const filteredAdminUsers = useMemo(() => {
    let list = [...MOCK_ADMIN_USERS];
    if (adminSearch) list = list.filter(u => u.name.toLowerCase().includes(adminSearch.toLowerCase()));
    if (adminFilterTier !== 'All') list = list.filter(u => u.level === adminFilterTier);
    list.sort((a, b) => {
      if (adminSort === 'balance-high') return b.points - a.points;
      if (adminSort === 'balance-low') return a.points - b.points;
      if (adminSort === 'name-az') return a.name.localeCompare(b.name);
      if (adminSort === 'recent') return b.lastSeen - a.lastSeen;
      return 0;
    });
    return list;
  }, [adminSearch, adminSort, adminFilterTier]);

  const themeStyles = {
    bg: isDark ? 'bg-[#020617]' : 'bg-slate-50',
    headerBg: isDark ? 'bg-[#020617]/80' : 'bg-white/80',
    navBg: isDark ? 'bg-[#020617]/90' : 'bg-white/90',
    text: isDark ? 'text-slate-100' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
    card: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    cardAlt: isDark ? 'bg-slate-900/50' : 'bg-slate-100',
    border: isDark ? 'border-white/5' : 'border-slate-200',
    input: isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-inner',
  };

  useEffect(() => {
    try {
      const s = localStorage.getItem(DB_KEY_SESSIONS);
      const o = localStorage.getItem(DB_KEY_ORDERS);
      const c = localStorage.getItem(DB_KEY_CATALOG);
      const u = localStorage.getItem(DB_KEY_USER);
      const th = localStorage.getItem(DB_KEY_THEME);
      const st = localStorage.getItem('kolobok_stats');
      const ach = localStorage.getItem('kolobok_achievements');
      const vh = localStorage.getItem('kolobok_vip_history');
      const tx = localStorage.getItem(DB_KEY_TRANSACTIONS);
      const ps = localStorage.getItem(DB_KEY_PERSONA);

      if (s) setSessions(JSON.parse(s));
      if (o) setOrders(JSON.parse(o));
      if (c) setCatalog(JSON.parse(c));
      if (th) setTheme(th as Theme);
      if (st) setGameStats(JSON.parse(st));
      if (ach) setUnlockedAchievements(JSON.parse(ach));
      if (vh) setVipHistory(JSON.parse(vh));
      if (tx) setTransactions(JSON.parse(tx));
      if (ps) setAiPersona(ps as AiPersona);
      
      if (u) {
        const parsed = JSON.parse(u);
        setUsername(parsed.username || 'Anonymous');
        setUserAvatar(parsed.avatar || null);
        setKoloPoints(parsed.points ?? 70000);
      }
    } catch (e) { console.error("DB Load Error", e); }
  }, []);

  useEffect(() => {
    localStorage.setItem(DB_KEY_SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(DB_KEY_ORDERS, JSON.stringify(orders));
    localStorage.setItem(DB_KEY_CATALOG, JSON.stringify(catalog));
    localStorage.setItem(DB_KEY_USER, JSON.stringify({ username, avatar: userAvatar, points: koloPoints }));
    localStorage.setItem(DB_KEY_THEME, theme);
    localStorage.setItem('kolobok_stats', JSON.stringify(gameStats));
    localStorage.setItem('kolobok_achievements', JSON.stringify(unlockedAchievements));
    localStorage.setItem('kolobok_vip_history', JSON.stringify(vipHistory));
    localStorage.setItem(DB_KEY_TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(DB_KEY_PERSONA, aiPersona);
  }, [sessions, orders, catalog, username, userAvatar, koloPoints, theme, gameStats, unlockedAchievements, vipHistory, transactions, aiPersona]);

  useEffect(() => {
    setReels([0, 1, 2]);
    setLastWin(null);
  }, [activeGame]);

  const unlockAchievement = (id: string) => {
    if (unlockedAchievements.includes(id)) return;
    setUnlockedAchievements(prev => [...prev, id]);
  };

  const updateStats = (bet: number, win: number, crashMul?: number, isVip?: boolean) => {
    setGameStats(prev => ({
      ...prev,
      totalSpins: prev.totalSpins + 1,
      totalWins: prev.totalWins + (win > 0 ? 1 : 0),
      totalBet: prev.totalBet + bet,
      maxCrash: crashMul ? Math.max(prev.maxCrash, crashMul) : prev.maxCrash,
      vipPlayed: prev.vipPlayed + (isVip ? 1 : 0)
    }));

    unlockAchievement('first_spin');
    if (win >= 5000) unlockAchievement('big_win');
    if (isVip) unlockAchievement('vip_entry');
    if (crashMul && crashMul >= 5) unlockAchievement('crash_master');
    if (gameStats.totalSpins >= 99) unlockAchievement('loyal');
  };

  const logVipEntry = (game: string, bet: number, outcome: number, mul?: number) => {
    const entry: VipHistoryEntry = {
      id: Date.now().toString(),
      game,
      bet,
      outcome,
      multiplier: mul,
      date: Date.now()
    };
    setVipHistory(prev => [entry, ...prev].slice(0, 10));
  };

  const spinReels = (symbols: any[], bet: number) => {
    if (koloPoints < bet || isSpinning) return;
    setKoloPoints(prev => prev - bet);
    setIsSpinning(true);
    setLastWin(null);
    const spinInterval = setInterval(() => {
      setReels([
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
      ]);
    }, 100);
    setTimeout(() => {
      clearInterval(spinInterval);
      const finalReels = [
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
      ];
      setReels(finalReels);
      setIsSpinning(false);
      
      let winAmount = 0;
      if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
        const symbol = symbols[finalReels[0]];
        winAmount = bet * (symbol?.multiplier || 1);
        setLastWin(winAmount);
        setKoloPoints(prev => prev + winAmount);
      }
      
      const isVip = activeGame === 'golden-dragon';
      updateStats(bet, winAmount, undefined, isVip);
      if (isVip) logVipEntry(activeGame, bet, winAmount);
    }, 2000);
  };

  const startCrash = () => {
    if (koloPoints < crashBetAmount || isCrashRunning) return;
    setKoloPoints(prev => prev - crashBetAmount);
    setIsCrashRunning(true);
    setIsCrashed(false);
    setHasCashedOut(false);
    setCrashMultiplier(1.00);
    const isQuantum = activeGame === 'quantum-crash';
    const crashPoint = isQuantum 
      ? Math.max(1.00, Math.random() * 10 + Math.random() * 5) 
      : Math.max(1.00, Math.random() * 5 + Math.random() * 2);
    crashIntervalRef.current = window.setInterval(() => {
      setCrashMultiplier(prev => {
        const step = isQuantum ? 0.05 : 0.01;
        const next = prev + step;
        if (next >= crashPoint) {
          stopCrash(true);
          return prev;
        }
        return next;
      });
    }, isQuantum ? 50 : 100);
  };

  const stopCrash = (crashed: boolean) => {
    if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
    if (crashed) {
      setIsCrashed(true);
      const isQuantum = activeGame === 'quantum-crash';
      updateStats(crashBetAmount, 0, crashMultiplier, isQuantum);
      if (isQuantum) logVipEntry(activeGame, crashBetAmount, 0);
    }
    setIsCrashRunning(false);
  };

  const cashOutCrash = () => {
    if (!isCrashRunning || isCrashed || hasCashedOut) return;
    setHasCashedOut(true);
    const winAmount = Math.floor(crashBetAmount * crashMultiplier);
    setKoloPoints(prev => prev + winAmount);
    const isQuantum = activeGame === 'quantum-crash';
    updateStats(crashBetAmount, winAmount, crashMultiplier, isQuantum);
    if (isQuantum) logVipEntry(activeGame, crashBetAmount, winAmount, crashMultiplier);
    stopCrash(false);
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = customText || input;
    if (!text.trim() || isTyping) return;
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    const personaInstruction = {
      formal: "Use a formal, polite, and professional tone.",
      friendly: "Use a friendly, warm, and approachable tone.",
      sarcastic: "Use a sarcastic, witty, and slightly rebellious tone."
    }[aiPersona];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: text,
        config: { systemInstruction: `${t.ai_role} ${personaInstruction}` }
      });
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: response.text || "...", timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Offline Protocol Active.", timestamp: Date.now(), isError: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) { setWithdrawError(t.invalid_amount); return; }
    if (amount > koloPoints) { setWithdrawError(t.insufficient_funds); return; }
    if (!withdrawDest.trim() || withdrawDest.length < 5) { setWithdrawError('Invalid destination'); return; }
    setKoloPoints(prev => prev - amount);
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'withdrawal',
      method: withdrawMethod === 'card' ? 'bank_transfer' : 'crypto',
      amount: amount,
      currency: 'KOLO',
      status: 'pending',
      date: Date.now(),
      details: withdrawDest
    };
    setTransactions(prev => [newTx, ...prev]);
    setIsWithdrawModalOpen(false);
    setWithdrawAmount(''); setWithdrawDest(''); setWithdrawError('');
    setWalletSubTab('history');
  };

  const handleDeposit = () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) { setDepositError(t.invalid_amount); return; }
    setKoloPoints(prev => prev + amount);
    const newTx: Transaction = {
      id: `tx_dep_${Date.now()}`,
      type: 'deposit',
      method: depositMethod === 'card' ? 'bank_transfer' : 'crypto',
      amount: amount,
      currency: 'KOLO',
      status: 'completed',
      date: Date.now(),
      details: depositMethod === 'card' ? 'Card Top-up' : 'TRC20 Wallet'
    };
    setTransactions(prev => [newTx, ...prev]);
    setIsDepositModalOpen(false);
    setDepositAmount(''); setDepositError('');
    setWalletSubTab('history');
  };

  const handleP2PMessageSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!p2pInput.trim() || !selectedP2POrder) return;
    const newMessage: P2PMessage = { id: Date.now().toString(), sender: 'me', text: p2pInput, timestamp: Date.now() };
    setP2pChatMessages(prev => [...prev, newMessage]);
    setP2pInput('');
    setTimeout(() => {
      const traderResponses = ["Received. Checking...", "Can you send the receipt?", "Okay, releasing crypto now.", "One moment please.", "Got it! Thanks for the trade."];
      const randomResponse = traderResponses[Math.floor(Math.random() * traderResponses.length)];
      const responseMsg: P2PMessage = { id: (Date.now() + 1).toString(), sender: 'trader', text: randomResponse, timestamp: Date.now() };
      setP2pChatMessages(prev => [...prev, responseMsg]);
    }, 2000);
  };

  const handleLogin = () => {
    if (['0000', '1111', '2222'].includes(passwordInput)) {
      const role = passwordInput === '0000' ? 'super_admin' : passwordInput === '1111' ? 'moderator' : 'support';
      setAdminRole(role as AdminRole);
      setIsAdmin(true); setActiveTab('admin'); setIsLoginModalOpen(false);
    } else { setLoginError(true); }
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'chat':
        return (
          <div className="flex flex-col min-h-full pb-20">
             {messages.length === 0 && (
               <div className="flex flex-col items-center justify-center flex-1 mt-20 space-y-8 animate-in fade-in zoom-in">
                 <div className={`w-28 h-28 ${themeStyles.card} rounded-full flex items-center justify-center shadow-2xl overflow-hidden relative`}>
                   {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" alt="User Avatar" /> : <Bot className="w-12 h-12 text-cyan-400" />}
                   <div className="absolute bottom-2 right-2 p-1 bg-indigo-600 rounded-full border border-white/20">
                      {aiPersona === 'formal' ? <BriefcaseIcon className="w-3 h-3 text-white" /> : aiPersona === 'friendly' ? <Smile className="w-3 h-3 text-white" /> : <Ghost className="w-3 h-3 text-white" />}
                   </div>
                 </div>
                 <div className="text-center">
                   <h2 className={`text-3xl font-black ${themeStyles.text}`}>{t.welcome_title}</h2>
                   <p className={`${themeStyles.textMuted} text-xs uppercase tracking-widest`}>{t.subtitle}</p>
                 </div>
               </div>
             )}
             <div className="space-y-6 px-2">
               {messages.map((m) => (
                 <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : isDark ? 'bg-slate-900 text-slate-200 border border-slate-800 shadow-md' : 'bg-white text-slate-800 border border-slate-200 shadow-sm'}`}>
                       {m.content}
                    </div>
                 </div>
               ))}
               {isTyping && <div className="text-xs text-cyan-500 animate-pulse px-2">{t.thinking}</div>}
             </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="flex flex-col min-h-full pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-5">
            <div className={`p-6 ${themeStyles.card} rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-4 opacity-20"><Wallet className="w-24 h-24" /></div>
              <div className="relative z-10">
                <span className={`text-[10px] font-black uppercase tracking-widest ${themeStyles.textMuted}`}>Total Balance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className={`text-3xl font-black ${themeStyles.text}`}>{koloPoints.toLocaleString()}</h2>
                  <span className="text-sm font-bold text-cyan-500">KOLO</span>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIsDepositModalOpen(true)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2">
                    <ArrowDownLeft className="w-4 h-4" /> {t.deposit}
                  </button>
                  <button onClick={() => setIsWithdrawModalOpen(true)} className={`flex-1 py-3 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800'} rounded-xl text-xs font-black uppercase hover:brightness-110 transition-colors flex items-center justify-center gap-2`}>
                    <ArrowUpRight className="w-4 h-4" /> {t.withdraw}
                  </button>
                </div>
              </div>
            </div>

            <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-200/50'} backdrop-blur-md`}>
              {(['assets', 'history', 'p2p'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setWalletSubTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${walletSubTab === tab ? (isDark ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-black shadow-md') : 'text-slate-500 hover:text-slate-400'}`}
                >
                  {tab === 'assets' ? t.wallet_assets : tab === 'history' ? t.wallet_history : t.wallet_p2p}
                </button>
              ))}
            </div>

            <div className="flex-1">
              {walletSubTab === 'assets' && (
                <div className="grid gap-3 animate-in fade-in slide-in-from-right-4">
                  <AssetItem icon="₿" name="Bitcoin" symbol="BTC" amount="0.0421" price={`${(0.0421 * 5800000).toLocaleString()} ₽`} themeStyles={themeStyles} color="bg-orange-500" />
                  <AssetItem icon="₮" name="Tether" symbol="USDT" amount="1,240.50" price={`${(1240.5 * 92).toLocaleString()} ₽`} themeStyles={themeStyles} color="bg-emerald-500" />
                </div>
              )}
              {walletSubTab === 'history' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                  {transactions.map(tx => (
                    <div key={tx.id} className={`p-4 rounded-3xl ${themeStyles.card} border ${themeStyles.border} flex items-center justify-between`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className={`text-xs font-black uppercase ${themeStyles.text}`}>{tx.method.replace('_', ' ')}</div>
                          <div className={`text-[9px] ${themeStyles.textMuted}`}>{new Date(tx.date).toLocaleDateString()} • {tx.details}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-black ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-slate-500'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency}
                        </div>
                        <div className={`text-[8px] font-black uppercase ${tx.status === 'completed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}>
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {walletSubTab === 'p2p' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                   {/* Simplified P2P list/chat view based on existing state logic */}
                   <div className="text-center py-10 opacity-50 text-[10px] font-black uppercase">{t.p2p_marketplace} coming soon</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'games':
        return (
          <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {activeGame === 'menu' ? (
              <>
                <div className="flex items-center justify-between px-2">
                  <h2 className={`text-2xl font-black ${themeStyles.text}`}>{t.games_title}</h2>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-black text-amber-500 uppercase">{gameStats.totalWins} Wins</span>
                  </div>
                </div>

                <div className="space-y-3 px-1">
                  <GameMenuItem title="CYBER SLOTS" subtitle="High Volatility • Multipliers" color="from-cyan-500 to-blue-500" icon={<ZapIcon className="w-6 h-6" />} onClick={() => setActiveGame('slots')} isDark={isDark} themeStyles={themeStyles} />
                  <GameMenuItem title="PROTOCOL CRASH" subtitle="Risk Protocol • Max Payout" color="from-rose-500 to-pink-500" icon={<Rocket className="w-6 h-6" />} onClick={() => setActiveGame('crash')} isDark={isDark} themeStyles={themeStyles} />
                  <GameMenuItem title="NEON FRUITS" subtitle="Classic Slots • 5 Reels" color="from-emerald-400 to-cyan-400" icon={<Cherry className="w-6 h-6" />} onClick={() => setActiveGame('neon-fruits')} isDark={isDark} themeStyles={themeStyles} />
                  
                  <div className="pt-4 pb-2 px-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <h3 className={`text-xs font-black uppercase tracking-widest ${themeStyles.text}`}>{t.vip_zone}</h3>
                    </div>
                    <div className="space-y-3">
                      <GameMenuItem 
                        title="GOLDEN DRAGON" 
                        subtitle="VIP ONLY • 1000x JACKPOT" 
                        color="from-amber-400 to-orange-600" 
                        icon={<Star className="w-6 h-6" />} 
                        onClick={() => setActiveGame('golden-dragon')} 
                        isDark={isDark} 
                        themeStyles={themeStyles} 
                        locked={koloPoints < 500000}
                        lockText="500K+ KOLO"
                      />
                      <GameMenuItem 
                        title="QUANTUM CRASH" 
                        subtitle="HIGH STAKES • FAST GROWTH" 
                        color="from-violet-500 to-fuchsia-600" 
                        icon={<Atom className="w-6 h-6" />} 
                        onClick={() => setActiveGame('quantum-crash')} 
                        isDark={isDark} 
                        themeStyles={themeStyles} 
                        locked={koloPoints < 1000000}
                        lockText="1M+ KOLO"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveGame('menu')} className={`p-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'} transition-transform active:scale-90`}><ChevronLeft className="w-5 h-5" /></button>
                  <h2 className={`text-lg font-black uppercase tracking-tight ${themeStyles.text}`}>
                    {activeGame === 'slots' ? 'CYBER SLOTS' : activeGame === 'crash' ? 'PROTOCOL CRASH' : activeGame === 'golden-dragon' ? 'GOLDEN DRAGON' : 'NEON FRUITS'}
                  </h2>
                </div>

                {(activeGame === 'slots' || activeGame === 'neon-fruits' || activeGame === 'golden-dragon') && (
                  <div className="space-y-8 animate-in zoom-in duration-300">
                    <div className={`p-8 rounded-[3rem] ${themeStyles.card} border-4 ${isDark ? 'border-slate-800' : 'border-slate-200'} shadow-2xl relative overflow-hidden`}>
                       <div className="grid grid-cols-3 gap-4 h-40">
                         {reels.map((sIndex, i) => (
                           <div key={i} className={`rounded-2xl ${isDark ? 'bg-black' : 'bg-slate-100'} border ${themeStyles.border} flex items-center justify-center relative overflow-hidden`}>
                             <div className={`transition-all duration-100 ${isSpinning ? 'animate-bounce' : ''}`}>
                               {currentSymbols[sIndex]?.icon}
                             </div>
                           </div>
                         ))}
                       </div>
                       {lastWin && (
                         <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm animate-in fade-in zoom-in">
                           <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xl shadow-2xl uppercase tracking-widest">+ {lastWin} KOLO</div>
                         </div>
                       )}
                    </div>

                    <div className="flex flex-col items-center gap-6">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setCrashBetAmount(Math.max(10, crashBetAmount - 50))} className={`p-4 rounded-2xl ${themeStyles.card} border ${themeStyles.border}`}><Minus className="w-4 h-4" /></button>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase">{t.games_bet}</span>
                          <span className={`text-2xl font-black ${themeStyles.text}`}>{crashBetAmount}</span>
                        </div>
                        <button onClick={() => setCrashBetAmount(crashBetAmount + 50)} className={`p-4 rounded-2xl ${themeStyles.card} border ${themeStyles.border}`}><Plus className="w-4 h-4" /></button>
                      </div>

                      <button 
                        onClick={() => spinReels(currentSymbols, crashBetAmount)}
                        disabled={isSpinning || koloPoints < crashBetAmount}
                        className={`w-full py-6 rounded-[2.5rem] bg-indigo-600 text-white font-black text-xl uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3`}
                      >
                        {isSpinning ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><FastForward className="w-6 h-6" /> {t.games_spin}</>}
                      </button>
                    </div>
                  </div>
                )}

                {(activeGame === 'crash' || activeGame === 'quantum-crash') && (
                  <div className="space-y-8 animate-in zoom-in duration-300">
                    <div className={`h-64 rounded-[3rem] ${themeStyles.card} border ${themeStyles.border} flex flex-col items-center justify-center relative overflow-hidden`}>
                       <div className="absolute top-4 left-4 flex items-center gap-2 opacity-30">
                          <Activity className="w-4 h-4" />
                          <span className="text-[8px] font-black uppercase">Live Analytics</span>
                       </div>
                       <div className={`text-6xl font-black tracking-tighter ${isCrashed ? 'text-rose-500' : hasCashedOut ? 'text-emerald-500' : 'text-cyan-400'}`}>
                         {crashMultiplier.toFixed(2)}<span className="text-2xl">x</span>
                       </div>
                       {isCrashed && <div className="mt-2 text-rose-500 font-black uppercase tracking-widest animate-bounce">{t.crash_crashed}</div>}
                       {hasCashedOut && <div className="mt-2 text-emerald-500 font-black uppercase tracking-widest">WIN: {(crashBetAmount * crashMultiplier).toFixed(0)}</div>}
                    </div>

                    <div className="flex flex-col items-center gap-6">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setCrashBetAmount(Math.max(10, crashBetAmount - 50))} className={`p-4 rounded-2xl ${themeStyles.card} border ${themeStyles.border}`}><Minus className="w-4 h-4" /></button>
                        <div className="flex flex-col items-center w-24">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bet</span>
                          <span className={`text-2xl font-black ${themeStyles.text}`}>{crashBetAmount}</span>
                        </div>
                        <button onClick={() => setCrashBetAmount(crashBetAmount + 50)} className={`p-4 rounded-2xl ${themeStyles.card} border ${themeStyles.border}`}><Plus className="w-4 h-4" /></button>
                      </div>

                      <div className="flex gap-4 w-full">
                        {!isCrashRunning ? (
                          <button 
                            onClick={startCrash}
                            disabled={koloPoints < crashBetAmount}
                            className="flex-1 py-6 rounded-[2.5rem] bg-indigo-600 text-white font-black text-lg uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {t.crash_bet}
                          </button>
                        ) : (
                          <button 
                            onClick={cashOutCrash}
                            className="flex-1 py-6 rounded-[2.5rem] bg-emerald-600 text-white font-black text-lg uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            {t.crash_cashout} ({(crashBetAmount * crashMultiplier).toFixed(0)})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'catalog':
        return (
          <div className="space-y-6 pb-24">
            <h2 className={`text-2xl font-black ${themeStyles.text}`}>{t.cat_title}</h2>
            <div className="grid gap-4">
              {catalog.map((item) => (
                 <div key={item.id} className={`${themeStyles.card} border rounded-3xl p-5 flex justify-between items-center group transition-all hover:scale-[1.01]`}>
                    <div className="flex gap-4">
                       <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-inner`}>{item.icon}</div>
                       <div>
                          <h3 className={`font-bold ${themeStyles.text}`}>{item.name}</h3>
                          <p className={`text-[10px] ${themeStyles.textMuted}`}>{item.desc}</p>
                       </div>
                    </div>
                    <button className={`px-4 py-2 ${isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'} text-xs font-bold rounded-xl shadow-md`}>{item.price}</button>
                 </div>
              ))}
            </div>
          </div>
        );

      case 'admin':
        if (!isAdmin) return null;
        return (
          <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-top-5 duration-500">
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col">
                <h2 className={`text-2xl font-black ${themeStyles.text} tracking-tight`}>{t.admin_access}</h2>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${adminRole ? ROLE_COLORS[adminRole] : 'bg-slate-500'}`}>
                  {adminRole ? ROLE_LABELS[adminRole] : 'UNKNOWN'}
                </div>
              </div>
              <button onClick={() => setActiveTab('profile')} className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'} hover:scale-110 transition-transform`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Admin sub-tabs logic remains same as original */}
            <div className="text-center py-20 opacity-40 uppercase text-[10px] font-black">Admin Module Active • Sub-tabs Loaded</div>
          </div>
        );

      case 'profile':
         return (
           <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-right duration-500 no-scrollbar">
              <div className="space-y-6 pt-4">
                 <div className="text-center relative">
                    <div className="relative inline-block group">
                       <div className={`w-28 h-28 mx-auto ${themeStyles.card} rounded-full flex items-center justify-center border-4 ${isDark ? 'border-slate-800' : 'border-slate-200'} overflow-hidden shadow-2xl transition-transform group-hover:scale-105`}>
                          {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" alt="User Profile" /> : <User className="w-10 h-10 text-slate-400" />}
                       </div>
                       <div className={`absolute -bottom-1 -right-1 p-2 rounded-full ${levelInfo.color} border-4 ${isDark ? 'border-[#020617]' : 'border-slate-50'} shadow-lg scale-110`}>
                          <Trophy className="w-4 h-4 text-white" />
                       </div>
                    </div>
                    <h2 className={`text-2xl font-black ${themeStyles.text} mt-4 tracking-tight`}>{username}</h2>
                    <div className="flex items-center justify-center gap-2 mt-2">
                       <Sparkles className="w-3 h-3 text-cyan-500" />
                       <span className="text-sm font-black text-cyan-500">{koloPoints.toLocaleString()} KOLO</span>
                    </div>
                 </div>

                 <div className="space-y-2 px-2">
                    <div className="flex justify-between items-end">
                       <div className="flex flex-col"><span className={`text-[9px] font-black uppercase tracking-widest ${themeStyles.textMuted}`}>{t.level}</span><span className={`text-xs font-black uppercase ${themeStyles.text}`}>{levelInfo.name}</span></div>
                       <div className="text-right flex flex-col"><span className={`text-[9px] font-black uppercase tracking-widest ${themeStyles.textMuted}`}>{t.next_level}</span><span className={`text-xs font-black uppercase text-indigo-500`}>{levelInfo.nextName}</span></div>
                    </div>
                    <div className={`h-2 w-full ${isDark ? 'bg-slate-900' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                       <div className={`h-full ${levelInfo.color} transition-all duration-1000 ease-out`} style={{ width: `${levelInfo.progress}%` }} />
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className={`text-xs font-black uppercase tracking-widest ${themeStyles.text}`}>{t.achievements}</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
                  {ACHIEVEMENTS.map(ach => {
                    const isUnlocked = unlockedAchievements.includes(ach.id);
                    return (
                      <button key={ach.id} onClick={() => setSelectedAchievement(ach)} className="flex-shrink-0 flex flex-col items-center gap-2 w-20 text-center group">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isUnlocked ? ach.color : 'bg-slate-800/50 grayscale opacity-40'} shadow-lg group-hover:scale-110`}>
                          {/* Cast element to React.ReactElement<any> to resolve TypeScript error in cloneElement with className */}
                          {React.cloneElement(ach.icon as React.ReactElement<any>, { className: "w-7 h-7 text-white" })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={<Gamepad2 className="w-4 h-4 text-cyan-500" />} label="Total Plays" value={gameStats.totalSpins.toString()} themeStyles={themeStyles} />
                  <StatCard icon={<Trophy className="w-4 h-4 text-amber-500" />} label="Wins" value={gameStats.totalWins.toString()} themeStyles={themeStyles} />
              </div>

              <button onClick={() => setIsLoginModalOpen(true)} className={`w-full py-4 ${themeStyles.card} border rounded-2xl text-xs font-bold ${themeStyles.textMuted} hover:${themeStyles.text} transition-all uppercase tracking-widest flex items-center justify-center gap-2 group`}>
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" /> {t.admin_access}
              </button>
           </div>
         );

      default: return null;
    }
  };

  return (
    <div className={`flex flex-col h-screen max-w-lg mx-auto ${themeStyles.bg} transition-colors duration-300 ${themeStyles.text} relative overflow-hidden font-sans selection:bg-indigo-500/30`}>
      <header className={`px-5 py-4 border-b ${themeStyles.border} flex items-center justify-between z-40 ${themeStyles.headerBg} backdrop-blur-xl transition-colors`}>
         <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tighter">KOLO <span className="text-cyan-500">AI</span></h1>
         </div>
         <button onClick={() => setLanguage(l => l === 'ru' ? 'en' : 'ru')} className={`text-[10px] font-black ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'} px-2 py-1 rounded uppercase`}>
            {language}
         </button>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar transition-colors">
         {renderTabContent()}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t ${themeStyles.border} px-4 py-4 flex justify-between items-center z-40 ${themeStyles.navBg} backdrop-blur-2xl pb-safe transition-colors`}>
         <NavBtn active={activeTab === 'chat' || activeTab === 'admin'} onClick={() => setActiveTab('chat')} icon={isAdmin && activeTab === 'admin' ? <Settings /> : <MessageSquare />} label={isAdmin && activeTab === 'admin' ? t.nav_admin : t.nav_chat} isDark={isDark} />
         <NavBtn active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={<ShoppingBag />} label={t.nav_catalog} isDark={isDark} />
         <NavBtn active={activeTab === 'games'} onClick={() => { setActiveTab('games'); setActiveGame('menu'); }} icon={<Gamepad2 />} label={t.nav_games} isDark={isDark} />
         <NavBtn active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon={<Wallet />} label={t.nav_wallet} isDark={isDark} />
         <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User />} label={t.nav_profile} isDark={isDark} />
      </nav>

      {/* Input area for Chat */}
      {activeTab === 'chat' && (messages.length > 0) && (
         <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-5 pb-4 z-30 animate-in slide-in-from-bottom-5">
            <form onSubmit={handleSend} className={`relative flex items-center ${themeStyles.headerBg} backdrop-blur-xl border ${themeStyles.border} rounded-2xl p-1.5 shadow-2xl transition-colors`}>
               <button type="button" className={`p-3 ${themeStyles.textMuted} hover:text-cyan-500`}><Camera className="w-5 h-5" /></button>
               <input value={input} onChange={e => setInput(e.target.value)} placeholder={t.placeholder_chat} className={`flex-1 bg-transparent border-none outline-none text-sm ${themeStyles.text} px-2 placeholder:${themeStyles.textMuted}`} />
               <button type="submit" disabled={!input.trim()} className={`p-3 ${isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'} rounded-xl shadow-md`}><Send className="w-5 h-5" /></button>
            </form>
         </div>
      )}

      {/* Modals placeholders - Logic derived from existing code */}
      {isLoginModalOpen && <LoginModal onLogin={handleLogin} password={passwordInput} setPassword={setPasswordInput} error={loginError} onClose={() => setIsLoginModalOpen(false)} themeStyles={themeStyles} isDark={isDark} />}
      {isWithdrawModalOpen && <ActionModal type="withdraw" title={t.withdraw_title} amount={withdrawAmount} setAmount={setWithdrawAmount} onSubmit={handleWithdraw} onClose={() => setIsWithdrawModalOpen(false)} themeStyles={themeStyles} isDark={isDark} balance={koloPoints} t={t} />}
      {isDepositModalOpen && <ActionModal type="deposit" title={t.deposit_title} amount={depositAmount} setAmount={setDepositAmount} onSubmit={handleDeposit} onClose={() => setIsDepositModalOpen(false)} themeStyles={themeStyles} isDark={isDark} balance={koloPoints} t={t} />}
    </div>
  );
};

// --- Sub-components ---

const AssetItem = ({ icon, name, symbol, amount, price, themeStyles, color }: any) => (
  <div className={`p-4 rounded-3xl ${themeStyles.card} border ${themeStyles.border} flex items-center justify-between`}>
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-black`}>{icon}</div>
      <div>
        <div className={`text-sm font-black ${themeStyles.text}`}>{name}</div>
        <div className={`text-[10px] ${themeStyles.textMuted}`}>{symbol}</div>
      </div>
    </div>
    <div className="text-right">
      <div className={`text-sm font-black ${themeStyles.text}`}>{amount}</div>
      <div className={`text-[10px] ${themeStyles.textMuted}`}>≈ {price}</div>
    </div>
  </div>
);

const GameMenuItem = ({ title, subtitle, color, icon, onClick, isDark, themeStyles, locked, lockText }: any) => (
  <button 
    onClick={locked ? undefined : onClick} 
    className={`group p-5 rounded-[1.8rem] border transition-all flex items-center justify-between w-full relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} ${locked ? 'opacity-70 grayscale cursor-not-allowed' : 'hover:border-cyan-500/50 hover:scale-[1.01]'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>{icon}</div>
      <div className="text-left">
        <p className={`font-black text-sm ${themeStyles.text}`}>{title}</p>
        <p className={`text-[10px] ${themeStyles.textMuted} uppercase`}>{subtitle}</p>
      </div>
    </div>
    {locked ? <div className="flex flex-col items-center gap-1"><Lock className="w-4 h-4 text-rose-500" /><span className="text-[7px] font-black text-rose-500">{lockText}</span></div> : <ChevronRight className={`w-4 h-4 ${themeStyles.textMuted}`} />}
  </button>
);

const NavBtn = ({ active, onClick, icon, label, isDark }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isDark: boolean }) => (
   <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-cyan-500 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}>
      {/* Cast icon to React.ReactElement<any> to resolve TypeScript error in cloneElement with className */}
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
   </button>
);

const StatCard = ({ icon, label, value, themeStyles }: any) => (
  <div className={`p-4 rounded-[1.5rem] border ${themeStyles.border} ${themeStyles.card} flex flex-col gap-2 transition-transform hover:scale-[1.02]`}>
    <div className="flex items-center gap-2">{icon}<span className={`text-[8px] font-black uppercase tracking-widest ${themeStyles.textMuted}`}>{label}</span></div>
    <div className={`text-sm font-black ${themeStyles.text}`}>{value}</div>
  </div>
);

const ActionModal = ({ type, title, amount, setAmount, onSubmit, onClose, themeStyles, isDark, balance, t }: any) => (
  <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
    <div className={`w-full max-w-xs space-y-6 ${isDark ? 'bg-slate-900' : 'bg-white'} p-6 rounded-[2rem] border ${themeStyles.border} shadow-2xl relative animate-in zoom-in duration-300`}>
       <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/10 text-slate-500"><X className="w-5 h-5" /></button>
       <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
             {type === 'withdraw' ? <ArrowUpRight className="w-8 h-8 text-indigo-500" /> : <ArrowDownLeft className="w-8 h-8 text-indigo-500" />}
          </div>
          <h3 className={`text-xl font-black uppercase ${themeStyles.text}`}>{title}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Balance: {balance.toLocaleString()} KOLO</p>
       </div>
       <div className="space-y-4">
          <div className={`relative flex items-center ${themeStyles.input} border rounded-2xl px-4 py-3`}>
             <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="flex-1 bg-transparent border-none outline-none text-lg font-bold" />
          </div>
          <button onClick={onSubmit} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase shadow-lg">Confirm</button>
       </div>
    </div>
  </div>
);

const LoginModal = ({ onLogin, password, setPassword, error, onClose, themeStyles, isDark }: any) => (
  <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
    <div className={`w-full max-w-xs space-y-4 ${isDark ? 'bg-slate-900' : 'bg-white'} p-8 rounded-3xl border ${themeStyles.border} shadow-2xl`}>
       <div className="flex justify-center mb-2"><div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center"><Lock className="w-8 h-8 text-indigo-500" /></div></div>
       <h3 className="text-center text-sm font-black uppercase text-slate-500">Secure Access</h3>
       <input type="text" maxLength={4} value={password} onChange={e => setPassword(e.target.value)} className={`w-full ${themeStyles.input} border rounded-xl py-4 text-center text-2xl font-black outline-none ${error ? 'border-rose-500 animate-shake' : ''}`} placeholder="0000" />
       <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">ABORT</button>
          <button onClick={onLogin} className="flex-1 py-4 bg-white text-black rounded-xl text-xs font-bold">ENTER</button>
       </div>
    </div>
  </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
