import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  Settings as SettingsIcon, 
  Trash2, 
  Lightbulb, 
  ImagePlus, 
  X, 
  Eye, 
  EyeOff, 
  Key, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Target, 
  PieChart as PieIcon, 
  ArrowRightLeft, 
  FileText, 
  Download, 
  Share2, 
  ChevronRight,
  HelpCircle,
  Activity,
  Plus
} from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Type, FunctionDeclaration } from '@google/genai';
import { useAppContext } from '../store/AppContext';
import { cn, hapticFeedback, getBudgetMonth, safeStorage, formatCurrency } from '../utils';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FinancialHealthAssessment, AISavingPlan } from '../types';
import { calculateFinancialHealth, generateSavingPlanAI } from '../services/geminiService';

// Import unified components
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';

import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isKeyError?: boolean;
  chart?: { type: string; title: string; data: any[] };
  healthAssessment?: FinancialHealthAssessment;
  savingPlan?: AISavingPlan;
  actionSummary?: string;
}

const MODEL_NAME = 'gemini-3.7-flash';

export default function Assistant() {
  const { 
    accounts, 
    expenses, 
    income,
    budgets, 
    currency, 
    categories, 
    addExpense, 
    addIncome, 
    deleteExpense, 
    setBudget, 
    updateAccount, 
    addGoal, 
    goals, 
    firstDayOfMonth, 
    transferAccount, 
    addCategory,
    updateGoal
  } = useAppContext();

  const currentMonth = getBudgetMonth(new Date(), firstDayOfMonth);
  const budget = budgets?.find(b => b.month === currentMonth);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const currentMonthTotalSpend = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const [query, setQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: `مرحباً بك! أنا **مستشارك المالي الذكي الشخصي** 💼🇹🇳\n\nأنا هنا لمساعدتك على:\n- **تدقيق صحتك المالية** واكتشاف فرص التوفير الخفية.\n- **قراءة فواتير الستاغ والصوناد وإيصالات السوبرماركت** وتحويلها لمصاريف بنقرة واحدة.\n- **إدارة المعاملات والميزانيات والأهداف** عبر الأوامر الصوتية أو النصية.\n- **بناء خطط ادخار محكمة** لأهدافك العائلية.\n\nكيف يمكنني توجيهك اليوم؟` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(safeStorage.getItem('gemini_api_key') || '');
  const [showKeyText, setShowKeyText] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageIdx, setSpeakingMessageIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatHistoryRef = useRef<any[]>([]);
  const recognitionRef = useRef<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        toast.success('تم إرفاق الصورة، اكتب سؤالك أو أرسل لقراءتها مباشرة!');
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const key = safeStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY;
    if (!key) {
      setApiKeyMissing(true);
    } else {
      setApiKeyMissing(false);
    }
  }, []);

  // Voice recording speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ar-TN'; // Tunisian Arabic fallback to Arabic

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
        hapticFeedback('success');
        toast.success('تم التقاط الصوت بنجاح!');
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsRecording(false);
        toast.error('تعذر التعرف على الصوت. يمكنك المحاولة مجدداً أو الكتابة.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      toast.error('التعرف الصوتي غير مدعوم في هذا المتصفح.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      hapticFeedback('light');
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        hapticFeedback('medium');
        toast('تحدث الآن... استمع إليك 🎙️', { icon: '🎙️' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Text-to-speech for reading advice
  const toggleSpeak = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) {
      toast.error('خاصية القراءة الصوتية غير متوفرة في متصفحك.');
      return;
    }

    if (speakingMessageIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = text.replace(/[*#_`~[\]]/g, '').replace(/\n+/g, '. ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setSpeakingMessageIdx(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageIdx(null);
    };

    setSpeakingMessageIdx(idx);
    window.speechSynthesis.speak(utterance);
    hapticFeedback('light');
  };

  const saveApiKey = () => {
    if (customApiKey.trim()) {
      safeStorage.setItem('gemini_api_key', customApiKey.trim());
      setApiKeyMissing(false);
      setShowSettings(false);
      toast.success('تم حفظ مفتاح API بنجاح');
    } else {
      safeStorage.removeItem('gemini_api_key');
      setApiKeyMissing(!process.env.GEMINI_API_KEY);
      toast.error('تم مسح مفتاح API');
    }
  };

  const executeAsk = async (textToSubmit: string, imageToSubmit: string | null) => {
    const apiKey = safeStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      setApiKeyMissing(true);
      return;
    }

    const userQuery = textToSubmit.trim();
    const userImage = imageToSubmit;
    hapticFeedback('medium');
    setQuery('');
    setSelectedImage(null);
    setMessages(prev => [...prev, { role: 'user', content: userQuery || (userImage ? 'قم بقراءة هذه الفاتورة/الإيصال واستخراج البيانات المالية بدقة.' : ''), image: userImage || undefined }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });

      const addExpenseDeclaration: FunctionDeclaration = {
        name: 'addExpense',
        description: 'إضافة مصروف جديد إلى حساب المستخدم',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'قيمة المصروف (رقم موجب بالدينار التونسي)' },
            categoryId: { type: Type.STRING, description: 'معرف الفئة (ID). يجب اختياره من قائمة الفئات المتاحة.' },
            note: { type: Type.STRING, description: 'ملاحظة أو وصف للمصروف' },
            accountId: { type: Type.STRING, description: 'معرف الحساب (ID). يجب اختياره من قائمة الحسابات المتاحة.' },
            date: { type: Type.STRING, description: 'تاريخ المصروف بصيغة YYYY-MM-DD. استخدم تاريخ اليوم إذا لم يحدد المستخدم.' }
          },
          required: ['amount', 'categoryId', 'note', 'accountId', 'date']
        }
      };

      const addIncomeDeclaration: FunctionDeclaration = {
        name: 'addIncome',
        description: 'إضافة دخل جديد إلى حساب المستخدم',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'قيمة الدخل (رقم موجب بالدينار التونسي)' },
            source: { type: Type.STRING, description: 'مصدر الدخل (مثال: راتب، مكافأة، منحة)' },
            accountId: { type: Type.STRING, description: 'معرف الحساب (ID). يجب اختياره من قائمة الحسابات المتاحة.' },
            date: { type: Type.STRING, description: 'تاريخ الدخل بصيغة YYYY-MM-DD.' }
          },
          required: ['amount', 'source', 'accountId', 'date']
        }
      };

      const deleteExpenseDeclaration: FunctionDeclaration = {
        name: 'deleteExpense',
        description: 'حذف مصروف موجود من سجلات المستخدم',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'معرف المصروف (ID) المراد حذفه' }
          },
          required: ['id']
        }
      };

      const setBudgetDeclaration: FunctionDeclaration = {
        name: 'setBudget',
        description: 'تحديد أو تحديث الميزانية الشهرية الإجمالية',
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'قيمة الميزانية الإجمالية بالدينار' }
          },
          required: ['amount']
        }
      };

      const updateAccountDeclaration: FunctionDeclaration = {
        name: 'updateAccount',
        description: 'تحديث بيانات حساب مالي (مثل الرصيد أو الاسم)',
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'معرف الحساب (ID)' },
            balance: { type: Type.NUMBER, description: 'الرصيد الجديد' },
            name: { type: Type.STRING, description: 'الاسم الجديد للحساب' }
          },
          required: ['id']
        }
      };

      const addGoalDeclaration: FunctionDeclaration = {
        name: 'addGoal',
        description: 'إضافة هدف ادخار جديد',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'اسم الهدف' },
            targetAmount: { type: Type.NUMBER, description: 'المبلغ المستهدف' },
            currentAmount: { type: Type.NUMBER, description: 'المبلغ الحالي المدخر' },
            deadline: { type: Type.STRING, description: 'تاريخ الاستحقاق (YYYY-MM-DD)' },
            linkedCategoryId: { type: Type.STRING, description: 'معرف الفئة المرتبطة (اختياري)' }
          },
          required: ['name', 'targetAmount', 'currentAmount', 'deadline']
        }
      };

      const transferAccountDeclaration: FunctionDeclaration = {
        name: 'transferAccount',
        description: 'تحويل مبلغ مالي من حساب إلى آخر',
        parameters: {
          type: Type.OBJECT,
          properties: {
            fromAccountId: { type: Type.STRING, description: 'معرف الحساب المحول منه (ID)' },
            toAccountId: { type: Type.STRING, description: 'معرف الحساب المحول إليه (ID)' },
            amount: { type: Type.NUMBER, description: 'المبلغ المراد تحويله' },
            date: { type: Type.STRING, description: 'تاريخ التحويل (YYYY-MM-DD)' },
            note: { type: Type.STRING, description: 'ملاحظة حول التحويل' }
          },
          required: ['fromAccountId', 'toAccountId', 'amount']
        }
      };

      const addCategoryDeclaration: FunctionDeclaration = {
        name: 'addCategory',
        description: 'إضافة فئة جديدة للمصاريف أو الدخل',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'اسم الفئة' },
            type: { type: Type.STRING, enum: ['expense', 'income'], description: 'نوع الفئة: مصروف أو دخل' },
            color: { type: Type.STRING, description: 'لون الفئة (مثال: #10B981)' },
            icon: { type: Type.STRING, description: 'اسم الأيقونة' }
          },
          required: ['name', 'type', 'color', 'icon']
        }
      };

      const generateChartDeclaration: FunctionDeclaration = {
        name: 'generateChart',
        description: 'إنشاء رسم بياني تفاعلي لعرض البيانات المالية للمستخدم',
        parameters: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['pie', 'bar', 'line'], description: 'نوع الرسم البياني' },
            title: { type: Type.STRING, description: 'عنوان الرسم البياني' },
            data: {
              type: Type.ARRAY,
              description: 'بيانات الرسم البياني. يجب أن تحتوي على name و value.',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'الاسم أو الفئة' },
                  value: { type: Type.NUMBER, description: 'القيمة الرقمية' }
                },
                required: ['name', 'value']
              }
            }
          },
          required: ['type', 'title', 'data']
        }
      };

      const conductFinancialAuditDeclaration: FunctionDeclaration = {
        name: 'conductFinancialAudit',
        description: 'إجراء فحص شامل للصحة المالية واستخراج بطاقة التدقيق والدرجة من 100 مع خطة عمل',
        parameters: {
          type: Type.OBJECT,
          properties: {
            notes: { type: Type.STRING, description: 'ملاحظات إضافية للفحص' }
          }
        }
      };

      const createSavingPlanDeclaration: FunctionDeclaration = {
        name: 'createSavingPlan',
        description: 'إنشاء خطة ادخار ذكية ومفصلة لتحقيق هدف معين',
        parameters: {
          type: Type.OBJECT,
          properties: {
            goalName: { type: Type.STRING, description: 'اسم الهدف' },
            targetAmount: { type: Type.NUMBER, description: 'المبلغ المطلوب توفيره' },
            timeframeMonths: { type: Type.INTEGER, description: 'المدة بالأشهر' }
          },
          required: ['goalName', 'targetAmount', 'timeframeMonths']
        }
      };

      const context = `
        أنت مستشار مالي ذكي وخبير اقتصادي تونسي متخصص في التخطيط المالي والميزانيات العائلية.
        العملة: ${currency} (الدينار التونسي - TND).
        ملاحظة حاسمة: 1 دينار = 1000 مليم، لذا اعرض دائماً المبالغ بدقة المليمات بـ 3 أرقام بعد الفاصلة (مثال: 15.200 د.ت).
        تاريخ اليوم: ${new Date().toISOString().split('T')[0]}
        
        بيانات المستخدم المالية:
        - الرصيد الإجمالي: ${totalBalance.toFixed(3)} TND
        - الحسابات: ${JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, balance: a.balance })))}
        - الفئات: ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
        - الميزانية المحددة للشهر: ${budget?.amount ? budget.amount.toFixed(3) : 'غير محددة'}
        - إجمالي المصاريف هذا الشهر: ${currentMonthTotalSpend.toFixed(3)} TND
        - الأهداف: ${JSON.stringify(goals.map(g => ({ id: g.id, name: g.name, target: g.targetAmount, current: g.currentAmount })))}
        - آخر 25 عملية صرف: ${JSON.stringify(expenses.slice(0, 25).map(e => ({
          amount: e.amount,
          note: e.note,
          category: categories.find(c => c.id === e.categoryId)?.name || 'أخرى',
          date: e.date
        })))}
        
        تعليمات سلوك المستشار:
        1. تحدث باللغة العربية الواضحة المشجعة، مع مراعاة الواقع المعيشي التونسي (قفة السوق، فواتير الستاغ والصوناد، مستلزمات وحليب الأطفال، أسعار المواد الاستهلاكية).
        2. عند قراءة الفواتير أو الصور، استخرج المبالغ بدقة واعرضها واستدعِ دالة addExpense إذا كان واضحاً أن المستخدم يريد تسجيلها أو قدم له ملخصاً مع تأكيد.
        3. استخدم أدوات Tools لإنشاء الرسوم البيانية وفحص الصحة المالية وخطط الادخار عندما يطلب المستخدم ذلك.
      `;

      // Append user message to history
      const userParts: any[] = [];
      if (userQuery) userParts.push({ text: userQuery });
      if (userImage) {
        const mimeType = userImage.split(';')[0].split(':')[1];
        const base64Data = userImage.split(',')[1];
        userParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
      chatHistoryRef.current.push({ role: 'user', parts: userParts });

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          { role: 'user', parts: [{ text: context }] },
          { role: 'model', parts: [{ text: 'أهلاً بك! أنا مستشارك المالي الذكي، جاهز لتحليل بياناتك وإدارتها بكفاءة عالية.' }] },
          ...chatHistoryRef.current
        ],
        config: {
          tools: [{ 
            functionDeclarations: [
              addExpenseDeclaration, 
              addIncomeDeclaration, 
              deleteExpenseDeclaration, 
              setBudgetDeclaration, 
              updateAccountDeclaration, 
              addGoalDeclaration, 
              transferAccountDeclaration, 
              addCategoryDeclaration, 
              generateChartDeclaration,
              conductFinancialAuditDeclaration,
              createSavingPlanDeclaration
            ] 
          }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        }
      });

      let responseText = response.text || '';
      let chartData: any = undefined;
      let healthData: FinancialHealthAssessment | undefined = undefined;
      let planData: AISavingPlan | undefined = undefined;
      let actionExecutedText = '';

      // Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        hapticFeedback('success');
        
        for (const call of response.functionCalls) {
          const args = call.args as any;
          if (call.name === 'addExpense') {
            addExpense({
              amount: Number(args.amount),
              categoryId: args.categoryId || categories[0]?.id || '1',
              note: args.note || 'مصروف ذكي',
              accountId: args.accountId || accounts[0]?.id || '1',
              date: args.date || new Date().toISOString().split('T')[0],
              paymentMethod: 'cash'
            });
            actionExecutedText += `\n\n✅ **تم تسجيل المصروف بنجاح**: ${formatCurrency(args.amount, currency)} - ${args.note}`;
          } else if (call.name === 'addIncome') {
            addIncome({
              amount: Number(args.amount),
              source: args.source || 'دخل إضافي',
              accountId: args.accountId || accounts[0]?.id || '1',
              date: args.date || new Date().toISOString().split('T')[0]
            });
            actionExecutedText += `\n\n✅ **تم تسجيل الدخل بنجاح**: ${formatCurrency(args.amount, currency)} - ${args.source}`;
          } else if (call.name === 'deleteExpense') {
            deleteExpense(args.id);
            actionExecutedText += '\n\n🗑️ **تم حذف المصروف المحدد بنجاح.**';
          } else if (call.name === 'setBudget') {
            setBudget({ 
              amount: Number(args.amount), 
              month: currentMonth,
              categoryBudgets: budget?.categoryBudgets || {} 
            });
            actionExecutedText += `\n\n🎯 **تم تحديث الميزانية الشهرية إلى**: ${formatCurrency(args.amount, currency)}`;
          } else if (call.name === 'updateAccount') {
            updateAccount(args.id, { balance: args.balance, name: args.name });
            actionExecutedText += '\n\n💳 **تم تحديث بيانات الحساب بنجاح.**';
          } else if (call.name === 'addGoal') {
            addGoal({
              name: args.name,
              targetAmount: Number(args.targetAmount),
              currentAmount: Number(args.currentAmount || 0),
              deadline: args.deadline || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
              linkedCategoryId: args.linkedCategoryId
            });
            actionExecutedText += `\n\n🚀 **تم إنشاء هدف الادخار**: "${args.name}" بمبلغ مستهدف ${formatCurrency(args.targetAmount, currency)}`;
          } else if (call.name === 'transferAccount') {
            transferAccount(args.fromAccountId, args.toAccountId, Number(args.amount), args.date || new Date().toISOString().split('T')[0], args.note || 'تحويل مالي');
            actionExecutedText += `\n\n🔄 **تم تحويل المبلغ**: ${formatCurrency(args.amount, currency)} بنجاح.`;
          } else if (call.name === 'addCategory') {
            addCategory({
              name: args.name,
              type: args.type || 'expense',
              color: args.color || '#6366f1',
              icon: args.icon || 'Tag'
            });
            actionExecutedText += `\n\n🏷️ **تم إضافة الفئة الجديدة**: ${args.name}`;
          } else if (call.name === 'generateChart') {
            chartData = {
              type: args.type,
              title: args.title,
              data: args.data
            };
          } else if (call.name === 'conductFinancialAudit') {
            healthData = await calculateFinancialHealth(expenses, income, budget || null, goals, accounts, categories, currency);
          } else if (call.name === 'createSavingPlan') {
            planData = await generateSavingPlanAI(args.goalName, Number(args.targetAmount), Number(args.timeframeMonths || 6), expenses, income, categories, currency);
          }
        }
        
        // Append model's function call to history
        chatHistoryRef.current.push({ role: 'model', parts: [{ functionCall: response.functionCalls[0] }] });
        // Append function response to history
        chatHistoryRef.current.push({ role: 'user', parts: [{ functionResponse: { name: response.functionCalls[0].name, response: { success: true } } }] });
        
        const fullContent = (responseText ? `${responseText}\n` : '') + actionExecutedText;
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: fullContent || 'تم إتمام طلبك بنجاح.', 
          chart: chartData,
          healthAssessment: healthData,
          savingPlan: planData
        }]);
      } else {
        // Append normal text response to history
        chatHistoryRef.current.push({ role: 'model', parts: [{ text: responseText }] });
        setMessages(prev => [...prev, { role: 'assistant', content: responseText || 'تم معالجة طلبك.' }]);
      }
    } catch (error: any) {
      console.error('Error calling Gemini:', error);
      let errorMessage = 'عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى التحقق من الاتصال بالإنترنت ومفتاح API.';
      let isKeyError = false;
      
      const errorStr = (error?.message || '').toUpperCase();
      if (
        errorStr.includes('API_KEY') || 
        errorStr.includes('API KEY') || 
        errorStr.includes('INVALID_ARGUMENT') || 
        errorStr.includes('INVALID') ||
        errorStr.includes('KEY') ||
        errorStr.includes('400') ||
        errorStr.includes('403') ||
        !safeStorage.getItem('gemini_api_key')
      ) {
        isKeyError = true;
      }
      
      if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'لقد بلغت الحد المؤقت للاستخدام المجاني لـ Gemini API. يمكنك إضافة مفتاح API خاص بك من الإعدادات لمتابعة الخدمة بلا انقطاع.';
        isKeyError = true;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage, isKeyError }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!query.trim() && !selectedImage) || isLoading) return;
    executeAsk(query, selectedImage);
  };

  const triggerPrompt = (promptText: string) => {
    executeAsk(promptText, null);
  };

  const handleAuditDirect = async () => {
    setIsLoading(true);
    hapticFeedback('medium');
    setMessages(prev => [...prev, { role: 'user', content: 'أريد إجراء فحص وتدقيق كامل لصحتي المالية الآن 🩺' }]);
    try {
      const assessment = await calculateFinancialHealth(expenses, income, budget || null, goals, accounts, categories, currency);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `### 🩺 تقرير التدقيق والعافية المالية الشامل\n\nبناءً على تحليلي لتدفقاتك النقدية ومصاريفك، إليك النتيجة التفصيلية وخريطة الطريق للتحسين:`,
        healthAssessment: assessment
      }]);
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء إجراء الفحص المالي');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-full p-4 md:p-6 pb-36 flex flex-col min-h-screen"
    >
      <PageHeader
        title="المستشار المالي الذكي (AI Advisor)"
        subtitle="شريكك الذكي لتحليل المصاريف، قراءة الفواتير، وتحقيق الأمان المالي لعائلتك"
        action={
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-black rounded-full border border-violet-500/20 flex items-center gap-1.5 shadow-xs">
              <Sparkles size={13} className="text-violet-500 animate-pulse" />
              <span>Gemini 3.7 Pro</span>
            </span>
            <button 
              onClick={() => { hapticFeedback('light'); setShowSettings(!showSettings); }}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
              title="إعدادات المفتاح"
            >
              <SettingsIcon size={18} />
            </button>
          </div>
        }
      />

      {/* Live Financial Context Bar */}
      <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block">إجمالي الرصيد</span>
          <span className="text-sm font-black text-slate-900 dark:text-white font-sans">{formatCurrency(totalBalance, currency)}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block">مصاريف هذا الشهر</span>
          <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-sans">{formatCurrency(currentMonthTotalSpend, currency)}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold block">الميزانية الشهرية</span>
          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-sans">
            {budget?.amount ? formatCurrency(budget.amount, currency) : 'غير محددة'}
          </span>
        </div>
        <button
          onClick={handleAuditDirect}
          disabled={isLoading}
          className="p-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-indigo-500/15 flex items-center justify-between transition-all cursor-pointer active:scale-95 text-right disabled:opacity-50"
        >
          <div>
            <span className="text-[10px] text-violet-200 font-bold block">فحص فوري</span>
            <span className="text-xs font-black">العافية المالية 🩺</span>
          </div>
          <Activity size={18} className="animate-pulse" />
        </button>
      </div>

      {/* Settings Modal Bar */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Key size={16} className="text-violet-500" />
                إعدادات مفتاح Google Gemini API
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              يستخدم التطبيق افتراضياً البيئة السحابية. إذا رغبت في رفع القيود أو استخدام مفتاحك الخاص من <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-violet-600 underline font-bold">Google AI Studio</a>، يمكنك إدخاله هنا بأمان:
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeyText ? "text" : "password"}
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none font-sans"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                onClick={saveApiKey}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 shadow-md shadow-violet-500/20"
              >
                حفظ المفتاح
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden relative min-h-[560px]">
        {/* Chat Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-600 shadow-inner">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">المستشار المالي التونسي</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400">جاهز للاستشارة والتحليل</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setMessages([{ 
                  role: 'assistant', 
                  content: 'تم بدء محادثة جديدة! كيف يمكنني مساعدتك مالياً اليوم؟' 
                }]);
                chatHistoryRef.current = [];
                hapticFeedback('warning');
                toast.success('تم مسح سجل المحادثة.');
              }}
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all cursor-pointer"
              title="محادثة جديدة"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Quick Topic Chips */}
        <div className="px-6 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs">
          <span className="text-[10px] font-black text-slate-400 shrink-0">مقترحات:</span>
          {[
            { label: '🩺 فحص الصحة المالية', prompt: 'قم بإجراء فحص شامل وتدقيق للصحة المالية الحالية مع تحديد الدرجة وخطة العمل' },
            { label: '🛒 ترشيد قفة الأسبوع', prompt: 'كيف يمكنني تقليص نفقات قفة الأسبوع والمشتريات الاستهلاكية بنسبة 20%؟' },
            { label: '👶 ميزانية البيبي', prompt: 'حلل نفقات ومستلزمات البيبي واقترح أفضل سبل التوفير وشراء الجملة في تونس' },
            { label: '⚡ تخفيض فاتورة STEG', prompt: 'ما هي أهم النصائح العملية لتخفيض فاتورة الكهرباء والغاز (الستاغ) في المنزل؟' },
            { label: '📊 تحليل مصاريف الشهر', prompt: 'اعرض رسماً بيانياً يوضح توزيع مصاريف هذا الشهر حسب الفئات مع نصائح للترشيد' },
            { label: '🎯 خطة ادخار 300 د.ت', prompt: 'أريد خطة ادخار ذكية لتوفير 300 دينار خلال 3 أشهر. من أي فئات يمكنني الاقتطاع؟' }
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => triggerPrompt(chip.prompt)}
              disabled={isLoading}
              className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 dark:hover:text-violet-400 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[90%] md:max-w-[80%] p-4 md:p-6 rounded-3xl shadow-sm relative group",
                msg.role === 'user' 
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-indigo-500/15" 
                  : "bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700"
              )}>
                {/* Assistant message content */}
                {msg.role === 'assistant' ? (
                  <div className="space-y-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Speech Playback Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        onClick={() => toggleSpeak(msg.content, index)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors cursor-pointer"
                      >
                        {speakingMessageIdx === index ? (
                          <>
                            <VolumeX size={14} className="text-rose-500" />
                            <span className="text-rose-500">إيقاف القراءة</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={14} />
                            <span>استمع للنصيحة</span>
                          </>
                        )}
                      </button>

                      <span className="text-[9px] font-black text-slate-400">المستشار المالي</span>
                    </div>

                    {/* Embedded Health Assessment Card */}
                    {msg.healthAssessment && (
                      <div className="mt-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md space-y-4 text-right">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            درجة العافية: {msg.healthAssessment.grade}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">مؤشر الصحة:</span>
                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-sans">
                              {msg.healthAssessment.score}/100
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                          {msg.healthAssessment.summary}
                        </p>

                        {/* Metric Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-[9px] text-slate-400 font-bold block">معدل الادخار</span>
                            <span className="text-xs font-black text-slate-800 dark:text-white font-sans">{msg.healthAssessment.metrics.savingsRatePercent}%</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-[9px] text-slate-400 font-bold block">صندوق الطوارئ</span>
                            <span className="text-xs font-black text-slate-800 dark:text-white font-sans">{msg.healthAssessment.metrics.emergencyFundMonths} أشهر نفقات</span>
                          </div>
                        </div>

                        {/* Strengths & Vulnerabilities */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
                            <ShieldCheck size={13} /> نقاط القوة:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            {msg.healthAssessment.strengths.map((s, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>

                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block flex items-center gap-1 pt-1">
                            <ShieldAlert size={13} /> فرص التحسين والتسرب:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            {msg.healthAssessment.vulnerabilities.map((v, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <ChevronRight size={12} className="text-amber-500 shrink-0" />
                                <span>{v}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Action Plan */}
                        {msg.healthAssessment.actionPlan && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 block">
                              خطة العمل المقترحة:
                            </span>
                            {msg.healthAssessment.actionPlan.map((act, i) => (
                              <div key={i} className="p-2.5 bg-violet-500/5 rounded-xl border border-violet-500/15 flex items-center justify-between gap-2">
                                <div className="text-right">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.title}</p>
                                  <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">{act.impact}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Embedded Saving Plan Card */}
                    {msg.savingPlan && (
                      <div className="mt-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md space-y-4 text-right">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            واقعية الخطة: {msg.savingPlan.feasibilityRating}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Target size={16} className="text-emerald-500" />
                            {msg.savingPlan.goalName}
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-bold block">المبلغ المستهدف</span>
                            <span className="text-xs font-black text-emerald-600 font-sans">{formatCurrency(msg.savingPlan.targetAmount, currency)}</span>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-bold block">الادخار الشهري</span>
                            <span className="text-xs font-black text-indigo-600 font-sans">{formatCurrency(msg.savingPlan.monthlySavingsRequired, currency)} / شهر</span>
                          </div>
                        </div>

                        {/* Category Reductions */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-500 block">مقترحات تقليص المصاريف:</span>
                          {msg.savingPlan.categoryReductions.map((red, i) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-emerald-600 font-sans">توفير: {formatCurrency(red.suggestedReduction, currency)}</span>
                                <span className="text-slate-800 dark:text-slate-200">{red.category}</span>
                              </div>
                              <ul className="text-[11px] text-slate-500 space-y-1">
                                {red.tips.map((t, idx) => (
                                  <li key={idx} className="flex items-center gap-1">
                                    <ChevronRight size={11} className="text-slate-400" />
                                    <span>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Embedded Charts */}
                    {msg.chart && (
                      <div className="mt-4 w-full h-64 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-inner border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <h4 className="text-xs font-bold text-center mb-3 text-slate-700 dark:text-slate-300">{msg.chart.title}</h4>
                        <ResponsiveContainer width="100%" height="85%">
                          {msg.chart.type === 'pie' ? (
                            <PieChart>
                              <Pie data={msg.chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                                {msg.chart.data.map((_, i) => (
                                  <Cell key={`cell-${i}`} fill={['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(val) => formatCurrency(val as number, currency)} />
                              <Legend />
                            </PieChart>
                          ) : msg.chart.type === 'bar' ? (
                            <BarChart data={msg.chart.data}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(val) => formatCurrency(val as number, currency)} />
                              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          ) : (
                            <LineChart data={msg.chart.data}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(val) => formatCurrency(val as number, currency)} />
                              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* API Key prompt fallback */}
                    {msg.isKeyError && (
                      <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-right">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <Key size={16} />
                          <span className="text-xs font-black">إضافة مفتاح API خاص بك:</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          يمكنك الحصول على مفتاح مجاني وسريع من Google AI Studio لإزالة أي حدود على الاستخدام.
                        </p>
                        <button
                          onClick={() => setShowSettings(true)}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer mt-1"
                        >
                          فتح إعدادات المفتاح
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* User message content */
                  <div className="space-y-3">
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="Uploaded invoice/receipt" 
                        className="max-w-full h-auto max-h-56 rounded-2xl object-contain bg-black/20 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {msg.content && <p className="text-sm font-bold leading-relaxed">{msg.content}</p>}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="flex gap-1.5">
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-violet-600"
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2.5 h-2.5 rounded-full bg-violet-600"
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2.5 h-2.5 rounded-full bg-violet-600"
                  />
                </div>
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">جاري التفكير والتحليل المالي...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Actions */}
        <div className="p-3 md:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleAsk} className="relative max-w-4xl mx-auto">
            {/* Image Preview Floating Thumbnail */}
            {selectedImage && (
              <div className="absolute bottom-full mb-3 right-0 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-3">
                <img 
                  src={selectedImage} 
                  alt="Receipt Preview" 
                  className="h-20 w-auto rounded-xl object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">فاتورة / إيصال جاهز</span>
                  <span className="text-[10px] text-slate-400">اضغط إرسال للاستخراج الفوري</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />

            <div className="flex items-center gap-2">
              {/* Photo Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
                title="إرفاق صورة فاتورة أو إيصال"
              >
                <ImagePlus size={20} />
              </button>

              {/* Voice Speech Recognition Button */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                disabled={isLoading}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs",
                  isRecording 
                    ? "bg-rose-500 text-white animate-pulse" 
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}
                title={isRecording ? "إيقاف التسجيل" : "تحدث بالصوت"}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isRecording ? "جاري الاستماع إليك..." : "اكتب سؤالك أو اطلب تسجيل عملية مالية..."}
                className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm outline-none focus:ring-2 focus:ring-violet-500 font-bold transition-all shadow-inner"
                disabled={isLoading}
              />

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={(!query.trim() && !selectedImage) || isLoading}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 disabled:opacity-40 disabled:shadow-none transition-all shrink-0 cursor-pointer"
              >
                <Send size={18} className="rotate-180" />
              </motion.button>
            </div>
          </form>

          <p className="text-center text-[10px] font-bold text-slate-400 mt-2.5">
            المساعد مدعوم بـ Gemini 3.7 Pro مع تحليلات تراعي الاقتصاد التونسي والمصاريف العائلية.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
