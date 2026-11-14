import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Textarea } from '../../components/ui/Textarea';
import { DatePicker } from '../../components/ui/DatePicker';
import { TimePicker } from '../../components/ui/TimePicker';
import { Select } from '../../components/ui/Select';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { RadioGroup } from '../../components/ui/RadioGroup';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { Table, Column } from '../../components/ui/Table';
import { MobileCardList } from '../../components/ui/MobileCardList';
import { Tabs } from '../../components/ui/Tabs';
import { FilterBar } from '../../components/ui/FilterBar';
import { SearchInput } from '../../components/ui/SearchInput';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { Toast, ToastItem } from '../../components/ui/Toast';
import { Tooltip } from '../../components/ui/Tooltip';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Stepper } from '../../components/ui/Stepper';
import { ActivityTimeline } from '../../components/ui/ActivityTimeline';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { useApp } from '../../context/AppContext';
import {
  Send,
  Plus,
  Trash2,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { MOCK_TASKS, MOCK_USERS } from '../../data/mockData';
import { Task } from '../../types';

export const ComponentsShowcase: React.FC = () => {
  const { language, t } = useApp();

  // State controls for interactive showcase
  const [btnLoading, setBtnLoading] = useState(false);
  const [textValue, setTextValue] = useState('نص تجريبي لاختبار حقول الإدخال');
  const [dateValue, setDateValue] = useState('2026-10-31');
  const [timeValue, setTimeValue] = useState('09:15 AM');
  const [selectVal, setSelectVal] = useState('option2');
  const [multiSelectVal, setMultiSelectVal] = useState<string[]>(['U-004', 'U-005']);
  const [radioVal, setRadioVal] = useState('office');
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [activeTab, setActiveTab] = useState('tab1');
  const [searchVal, setSearchVal] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [progressVal, setProgressVal] = useState(65);
  const [currentStep, setCurrentStep] = useState(2);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const newToast: ToastItem = {
      id: Date.now().toString(),
      type,
      message,
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  };

  // Table columns for mock tasks
  const taskColumns: Column<Task>[] = [
    {
      key: 'id',
      header: 'الرمز',
      className: 'w-24 font-mono font-bold text-brand-magenta',
    },
    {
      key: 'titleAr',
      header: 'عنوان التكليف',
      render: task => (
        <div>
          <span className="font-semibold text-brand-darkText">{task.titleAr}</span>
          <p className="text-xs text-brand-charcoal/70 line-clamp-1">{task.descriptionAr}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'الأولوية',
      className: 'w-24',
      render: task => (
        <Badge
          variant={task.priority === 'URGENT' ? 'urgent' : task.priority === 'HIGH' ? 'returned' : 'neutral'}
          size="sm"
        >
          {t.priority[task.priority]}
        </Badge>
      ),
    },
    {
      key: 'deadline',
      header: 'الموعد النهائي',
      className: 'w-36 font-mono text-xs',
      render: task => <span dir="ltr">{task.deadline}</span>,
    },
    {
      key: 'status',
      header: 'الحالة',
      className: 'w-32',
      render: task => {
        const firstStatus = task.recipients[0]?.status || 'RECEIVED';
        const variantMap: Record<string, any> = {
          RECEIVED: 'received',
          IN_PROGRESS: 'in_progress',
          SUBMITTED: 'submitted',
          APPROVED: 'approved',
          RETURNED_FOR_REVISION: 'returned',
        };
        return (
          <Badge variant={variantMap[firstStatus] || 'neutral'} size="sm">
            {t.status[firstStatus]}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Toast Notification Mount */}
      <Toast toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-brand-plum to-brand-magenta text-white p-6 sm:p-8 rounded-card shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-white/20 text-white text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                PROMPT 01 SHOWCASE
              </span>
              <span className="text-white/80 text-xs">
                Design Foundations & Component Library
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              معرض المكونات المعتمدة وقواعد الواجهة
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl leading-relaxed">
              تحتوي هذه الصفحة على توثيق ومعاينة تفاعلية لكافة عناصر واجهة المستخدم المعتمدة بموجب دليل الهوية البصرية لعام 2026 وقواعد سكيل <code>ui-ux-pro-max-skill</code> (التباين، إمكانية الوصول، الأهداف اللمسية 44px، والأرقام اللاتينية 0-9).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-brand-plum border-white hover:bg-white/90"
              onClick={() => setIsModalOpen(true)}
            >
              فتح نافذة Modal
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-brand-charcoal text-white hover:bg-brand-charcoal/90"
              onClick={() => setIsDrawerOpen(true)}
            >
              فتح لوحة Drawer
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Brand Color Tokens & WCAG Contrast */}
      <section className="space-y-4">
        <div className="border-b border-brand-border pb-2">
          <h2 className="text-lg font-subheading font-bold text-brand-darkText">
            1. الرموز اللونية المعتمدة ونسب التباين (WCAG 2.1 AA)
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            مبنية فقط على الألوان الرسمية للجمعية لعام 2026 دون اختراع ألوان إضافية عشوائية.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-brand-magenta text-white p-3.5 rounded-card flex flex-col justify-between h-24 shadow-sm">
            <span className="text-xs font-bold">Primary Magenta</span>
            <div className="font-mono text-xs flex justify-between">
              <span>#C80893</span>
              <span className="opacity-80">4.34:1</span>
            </div>
          </div>

          <div className="bg-brand-plum text-white p-3.5 rounded-card flex flex-col justify-between h-24 shadow-sm">
            <span className="text-xs font-bold">Dark Plum</span>
            <div className="font-mono text-xs flex justify-between">
              <span>#871281</span>
              <span className="opacity-80">6.97:1</span>
            </div>
          </div>

          <div className="bg-brand-charcoal text-white p-3.5 rounded-card flex flex-col justify-between h-24 shadow-sm">
            <span className="text-xs font-bold">Charcoal</span>
            <div className="font-mono text-xs flex justify-between">
              <span>#444444</span>
              <span className="opacity-80">7.87:1</span>
            </div>
          </div>

          <div className="bg-brand-green text-brand-charcoal p-3.5 rounded-card flex flex-col justify-between h-24 border border-brand-green shadow-sm">
            <span className="text-xs font-bold">Fresh Green</span>
            <div className="font-mono text-xs flex justify-between">
              <span>#83C704</span>
              <span className="font-bold">4.70:1</span>
            </div>
          </div>

          <div className="bg-brand-lime text-brand-charcoal p-3.5 rounded-card flex flex-col justify-between h-24 border border-brand-lime shadow-sm">
            <span className="text-xs font-bold">Light Lime Green</span>
            <div className="font-mono text-xs flex justify-between">
              <span>#A9D203</span>
              <span className="font-bold">5.52:1</span>
            </div>
          </div>

          <div className="bg-brand-lightGray text-brand-darkText p-3.5 rounded-card flex flex-col justify-between h-24 border border-brand-border">
            <span className="text-xs font-bold">Light Gray (Base)</span>
            <div className="font-mono text-xs flex justify-between">
              <span>#E6E7E9</span>
              <span className="opacity-80">Surface</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Buttons in all variants, sizes, and states */}
      <section className="space-y-4">
        <div className="border-b border-brand-border pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-subheading font-bold text-brand-darkText">
              2. الأزرار (Buttons) — كافة الحالات والأحجام والأهداف اللمسية
            </h2>
            <p className="text-xs text-brand-charcoal/70">
              أهداف لمسية لا تقل عن 44px، حلقات تركيز بلون Plum وحالات التحميل والتعطيل.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setBtnLoading(!btnLoading)}
          >
            {btnLoading ? 'إيقاف التحميل' : 'محاكاة التحميل'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Primary (Magenta)">
            <div className="flex flex-col gap-2.5">
              <Button variant="primary" size="lg" fullWidth isLoading={btnLoading}>
                حجم كبير (48px)
              </Button>
              <Button variant="primary" size="md" fullWidth leftIcon={<Send className="w-4 h-4" />}>
                حجم قياسي (44px)
              </Button>
              <Button variant="primary" size="sm" fullWidth>
                حجم صغير (36px)
              </Button>
              <Button variant="primary" size="md" fullWidth disabled>
                معطل (Disabled)
              </Button>
            </div>
          </Card>

          <Card title="Secondary (Plum)">
            <div className="flex flex-col gap-2.5">
              <Button variant="secondary" size="lg" fullWidth isLoading={btnLoading}>
                حفظ التعديلات
              </Button>
              <Button variant="secondary" size="md" fullWidth leftIcon={<FileCheck className="w-4 h-4" />}>
                اعتماد التكليف
              </Button>
              <Button variant="secondary" size="sm" fullWidth>
                إجراء ثانوي
              </Button>
              <Button variant="secondary" size="md" fullWidth disabled>
                معطل (Disabled)
              </Button>
            </div>
          </Card>

          <Card title="Outline & Ghost">
            <div className="flex flex-col gap-2.5">
              <Button variant="outline" size="md" fullWidth leftIcon={<Plus className="w-4 h-4" />}>
                إضافة سجل جديد
              </Button>
              <Button variant="outline" size="md" fullWidth disabled>
                محدد ومعطل
              </Button>
              <Button variant="ghost" size="md" fullWidth>
                زر شفاف (Ghost)
              </Button>
              <Button variant="ghost" size="sm" fullWidth disabled>
                شفاف معطل
              </Button>
            </div>
          </Card>

          <Card title="Feedback & Trigger Toasts">
            <div className="flex flex-col gap-2.5">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => addToast('success', 'تم حفظ بيانات التكليف بنجاح في الذاكرة!')}
              >
                تنبيه نجاح (Success Toast)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => addToast('error', 'تعذر إتمام العملية: الحقل مطلوب')}
              >
                تنبيه خطأ (Error Toast)
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => addToast('warning', 'تنبيه: اقترب موعد تسليم التكليف')}
              >
                تنبيه تحذيري (Warning Toast)
              </Button>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => addToast('info', 'تم نقل السجل إلى الأرشيف المؤقت')}
              >
                تنبيه إجراء خطر (Danger)
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. Form Inputs */}
      <section className="space-y-4">
        <div className="border-b border-brand-border pb-2">
          <h2 className="text-lg font-subheading font-bold text-brand-darkText">
            3. حقول النماذج والإدخال (Form Fields)
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            تسميات ظاهرة، إشعارات أخطاء مقروءة بواسطة قارئات الشاشة، ودعم الأرقام اللاتينية 0-9.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card title="حقول النصوص والملاحظات">
            <div className="space-y-4">
              <TextField
                label="عنوان العمل المنجز"
                requiredIndicator
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                onClear={() => setTextValue('')}
                helperText="أدخل وصفاً مختصراً ودقيقاً للنشاط المنجز."
              />

              <TextField
                label="حقل نصي مع حالة خطأ (Error State)"
                defaultValue="قيمة خاطئة"
                error="صيغة الرابط غير صحيحة، يُسمح بروابط Google Drive فقط."
              />

              <TextField
                label="حقل معطل (Disabled State)"
                disabled
                defaultValue="قيمة ثابتة غير قابلة للتعديل"
              />

              <Textarea
                label="تفاصيل ومخرجات التكليف"
                rows={3}
                showCharCount
                maxLength={200}
                defaultValue="تم تصميم البطاقات وتجهيزها بصيغة PNG عالية الدقة مع مراعاة كافة خطوط الهوية البصرية."
                helperText="بحد أقصى 200 حرف."
              />
            </div>
          </Card>

          <Card title="التواريخ والأوقات والقوائم">
            <div className="space-y-4">
              <DatePicker
                label="تاريخ العمل (Latin 0-9)"
                requiredIndicator
                value={dateValue}
                onChange={e => setDateValue(e.target.value)}
                helperText="التاريخ المجمد للعرض: 2026-10-31"
              />

              <TimePicker
                label="وقت الإنجاز (12-Hour ص/م)"
                requiredIndicator
                value={timeValue}
                onChange={val => setTimeValue(val)}
                helperText="نظام 12 ساعة مع مؤشرات صباحاً / مساءً"
              />

              <Select
                label="موقع العمل"
                requiredIndicator
                value={selectVal}
                onChange={e => setSelectVal(e.target.value)}
                options={[
                  { value: 'option1', label: 'مكتبي (داخل مقر الجمعية)' },
                  { value: 'option2', label: 'ميداني (في موقع الفعالية)' },
                  { value: 'option3', label: 'عمل عن بعد (استثنائي)' },
                ]}
                helperText="اختر المكان الذي تم فيه تنفيذ النشاط."
              />

              <MultiSelect
                label="الموظفون المكلفون (MultiSelect)"
                options={MOCK_USERS.filter(u => u.role === 'EMPLOYEE').map(u => ({
                  value: u.id,
                  label: `${u.arabicName} (${u.jobTitleAr.split('&')[0]})`,
                }))}
                value={multiSelectVal}
                onChange={val => setMultiSelectVal(val)}
                helperText="يمكنك اختيار أكثر من موظف لنفس التكليف."
              />
            </div>
          </Card>

          <Card title="أزرار الاختيار والتحقق">
            <div className="space-y-5">
              <RadioGroup
                name="workType"
                label="طبيعة العمل الموثق:"
                value={radioVal}
                onChange={val => setRadioVal(val)}
                options={[
                  { value: 'office', label: 'عمل روتيني مجدول', description: 'ضمن الخطة الشهرية المعتمدة' },
                  { value: 'urgent', label: 'تكليف عاجل وطارئ', description: 'بناءً على طلب مباشر من المدير' },
                  { value: 'field', label: 'تغطية إعلامية خارجية', description: 'توثيق فوتوغرافي أو فيديو ميداني' },
                ]}
              />

              <div className="pt-2 border-t border-brand-border/60">
                <Checkbox
                  label="تأكيد الاطلاع على شروط التسليم"
                  description="أقر بأن كافة الروابط المرفقة تتبع حساب Google Drive المعتمد للجمعية."
                  checked={checkboxVal}
                  onChange={e => setCheckboxVal(e.target.checked)}
                />

                <Checkbox
                  label="طلب استثناء إداري للتسجيل"
                  description="يتطلب موافقة رسمية من مدير القسم."
                  disabled
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. Badges & Statuses */}
      <section className="space-y-4">
        <div className="border-b border-brand-border pb-2">
          <h2 className="text-lg font-subheading font-bold text-brand-darkText">
            4. شارات الحالة (Badges) — مع معاني نصية وأيقونات مستقلة
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            تطبيق قاعدة UI/UX Pro Max: عدم الاعتماد على اللون بمفرده للتعبير عن الحالة، مع التزام تباين النص الداكن على الأخضر.
          </p>
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="approved">معتمد (Approved)</Badge>
            <Badge variant="in_progress">قيد التنفيذ (In Progress)</Badge>
            <Badge variant="submitted">تم التسليم (Submitted)</Badge>
            <Badge variant="received">تم الاستلام (Received)</Badge>
            <Badge variant="returned">أُعيد للتعديل (Returned)</Badge>
            <Badge variant="overdue">متأخر (Overdue)</Badge>
            <Badge variant="urgent">عاجل جداً (Urgent)</Badge>
            <Badge variant="draft">مسودة (Draft)</Badge>
            <Badge variant="plum">إداري (Management)</Badge>
            <Badge variant="neutral">سجل محايد (Neutral)</Badge>
          </div>
        </Card>
      </section>

      {/* 5. Interactive Table & MobileCardList */}
      <section className="space-y-4">
        <div className="border-b border-brand-border pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-subheading font-bold text-brand-darkText">
              5. جدول البيانات والتكيّف على الشاشات الصغيرة (Table & MobileCardList)
            </h2>
            <p className="text-xs text-brand-charcoal/70">
              يتحول الجدول تلقائياً إلى بطاقات منسدلة أنيقة على الهواتف (&lt;768px) منعاً للتمرير الأفقي.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-brand-charcoal">الأرقام: 0-9</span>
          </div>
        </div>

        {/* FilterBar Demo */}
        <FilterBar
          hasActiveFilters={Boolean(searchVal)}
          onReset={() => setSearchVal('')}
        >
          <SearchInput
            value={searchVal}
            onChange={setSearchVal}
            placeholder="بحث في التكليفات..."
          />
        </FilterBar>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table
            columns={taskColumns}
            data={MOCK_TASKS}
            keyExtractor={item => item.id}
          />
        </div>

        {/* Mobile Card List Alternative */}
        <div className="block md:hidden">
          <MobileCardList
            items={MOCK_TASKS}
            keyExtractor={item => item.id}
            titleExtractor={item => item.titleAr}
            subtitleExtractor={item => item.id}
            statusExtractor={item => (
              <Badge variant={item.priority === 'URGENT' ? 'urgent' : 'neutral'} size="sm">
                {t.priority[item.priority]}
              </Badge>
            )}
            fields={[
              { label: 'المُرسِل', render: item => item.creatorNameAr },
              { label: 'الموعد', render: item => <span dir="ltr">{item.deadline}</span> },
              { label: 'المشروع', render: item => item.projectId || 'مستقل' },
            ]}
          />
        </div>

        {/* Pagination Demo */}
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={4}
            onPageChange={page => setCurrentPage(page)}
          />
        </div>
      </section>

      {/* 6. Tabs, Stepper, ProgressBar & Tooltips */}
      <section className="space-y-4">
        <div className="border-b border-brand-border pb-2">
          <h2 className="text-lg font-subheading font-bold text-brand-darkText">
            6. التبويبات والمراحل وشريط التقدم (Tabs, Stepper, Progress)
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            مؤشرات واضحة للمراحل المتتابعة وعلامات التبويب المتوافقة مع قارئات الشاشة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="علامات التبويب (Tabs)">
            <div className="space-y-4">
              <Tabs
                tabs={[
                  { id: 'tab1', label: 'التكليفات النشطة', count: 4 },
                  { id: 'tab2', label: 'المسودات المؤجلة', count: 1 },
                  { id: 'tab3', label: 'الأرشيف المعتمد', count: 12 },
                ]}
                activeTab={activeTab}
                onChange={id => setActiveTab(id)}
              />

              <div className="p-4 bg-brand-lightGray/40 rounded-card text-xs text-brand-charcoal">
                المحتوى المعروض حالياً يتبع التبويب: <strong>{activeTab}</strong>
              </div>

              {/* Tooltip Demonstration */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-medium text-brand-darkText">تلميحات التوضيح:</span>
                <Tooltip content="أرقام لاتينية 0-9 معتمدة وفقاً لدليل الهوية" position="top">
                  <span className="cursor-help px-2.5 py-1 rounded bg-brand-plum/10 text-brand-plum text-xs font-semibold">
                    مرر الفأرة هنا (Tooltip)
                  </span>
                </Tooltip>
              </div>
            </div>
          </Card>

          <Card title="مراحل الإنجاز وشريط التقدم (Stepper & Progress)">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-subheading font-bold text-brand-darkText block mb-3">
                  مراحل دورة حياة التكليف:
                </span>
                <Stepper
                  currentStep={currentStep}
                  steps={[
                    { id: 1, title: 'الإسناد', subtitle: 'تم التعيين' },
                    { id: 2, title: 'التنفيذ', subtitle: 'جاري العمل' },
                    { id: 3, title: 'التسليم', subtitle: 'رفع الرابط' },
                    { id: 4, title: 'الاعتماد', subtitle: 'موافقة المدير' },
                  ]}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentStep <= 1}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                  >
                    السابق
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={currentStep >= 4}
                    onClick={() => setCurrentStep(prev => prev + 1)}
                  >
                    التالي
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border/60">
                <ProgressBar
                  value={progressVal}
                  label="نسبة إنجاز خطة المحتوى الشهري"
                  color="magenta"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 7. Activity Timeline & Empty States */}
      <section className="space-y-4">
        <div className="border-b border-brand-border pb-2">
          <h2 className="text-lg font-subheading font-bold text-brand-darkText">
            7. خط النشاط الزمني وحالات الفراغ والتحميل (Timeline, Skeletons, Empty States)
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="سجل النشاط الزمني (Timeline)">
            <ActivityTimeline
              events={[
                {
                  id: '1',
                  title: 'تم اعتماد مخرجات التكليف TSK-103',
                  timestamp: '10:30 ص',
                  author: 'عمر النجار (مدير القسم)',
                  description: 'تمت مراجعة الفيديو التلخيصي والموافقة على نشره رسمياً.',
                  icon: <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />,
                },
                {
                  id: '2',
                  title: 'قام سامر عادل برفع مخرجات TSK-102',
                  timestamp: '09:00 ص',
                  author: 'سامر عادل (مصور فوتوغرافي)',
                  description: 'رفع 15 صورة ملائمة للنشر عبر رابط جوجل درايف.',
                },
                {
                  id: '3',
                  title: 'إصدار التعميم الإداري رقم CIR-301',
                  timestamp: '08:30 ص',
                  author: 'عمر النجار',
                  description: 'تأكيد الالتزام بسياسة تسجيل العمل اليومي في نفس اليوم.',
                },
              ]}
            />
          </Card>

          <Card title="هياكل التحميل (Skeleton Placeholders)">
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
              <Skeleton variant="rectangular" height={90} />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton variant="rectangular" height={40} />
                <Skeleton variant="rectangular" height={40} />
              </div>
            </div>
          </Card>

          <Card title="حالة خلو البيانات (Empty State)">
            <EmptyState
              title="لا توجد تكليفات متأخرة حالياً"
              description="كافة المهام المسندة للموظف تسير وفق الجدول الزمني المحدد دون تأخير."
              actionLabel="عرض كافة التكليفات"
              onAction={() => addToast('info', 'تم التوجيه لقائمة التكليفات')}
            />
          </Card>
        </div>
      </section>

      {/* Modal Dialog Component Preview */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="نموذج نافذة تفاعلية (Modal Dialog)"
        subtitle="متوافقة مع معايير إمكانية الوصول والتنقل عبر لوحة المفاتيح"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                addToast('success', 'تم حفظ التعديلات من داخل النافذة المنبثقة');
              }}
            >
              تأكيد وحفظ
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-brand-charcoal">
          <p className="leading-relaxed">
            تم تصميم هذا المكون لدعم محاصرة التركيز (Focus Trap) وإمكانية الإغلاق عبر مفتاح <strong>Esc</strong> أو النقر على الخلفية المعتمة، مع الحفاظ على تباين لوني سليم.
          </p>
          <TextField
            label="ملاحظات الاعتماد الإداري"
            placeholder="أدخل أي ملاحظات ترغب بإرفاقها..."
          />
        </div>
      </Modal>

      {/* Drawer Component Preview */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="لوحة التفاصيل الجانبية (Slide Drawer)"
      >
        <div className="space-y-4 text-xs text-brand-charcoal">
          <p className="leading-relaxed">
            تُستخدم هذه اللوحة لعرض تفاصيل التكليفات وتتبع الملاحظات دون مغادرة الصفحة الرئيسية.
          </p>
          <div className="p-3 rounded-card bg-brand-lightGray/40 border border-brand-border space-y-2">
            <span className="font-bold text-brand-darkText">معلومات التكليف المختار:</span>
            <div className="flex justify-between">
              <span>رمز التكليف:</span>
              <span className="font-mono font-bold text-brand-magenta">TSK-101</span>
            </div>
            <div className="flex justify-between">
              <span>الأولوية:</span>
              <Badge variant="returned" size="sm">عالية</Badge>
            </div>
          </div>
          <Button variant="primary" fullWidth size="sm" onClick={() => setIsDrawerOpen(false)}>
            إغلاق اللوحة
          </Button>
        </div>
      </Drawer>
    </div>
  );
};
