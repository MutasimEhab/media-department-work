import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ArrowRight, Construction, CheckCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

export interface PlaceholderPageProps {
  promptNumber: string;
  titleAr: string;
  titleEn: string;
  route: string;
  allowedRoles: string[];
  descriptionAr: string;
  descriptionEn: string;
  keyFeatures: string[];
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  promptNumber,
  titleAr,
  titleEn,
  route,
  allowedRoles,
  descriptionAr,
  descriptionEn,
  keyFeatures,
}) => {
  const { language } = useApp();
  const isRtl = language === 'ar';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-brand-magenta bg-brand-magenta/10 px-2 py-0.5 rounded">
              {promptNumber}
            </span>
            <span className="font-mono text-xs text-brand-charcoal/70" dir="ltr">
              {route}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-brand-darkText">
            {isRtl ? titleAr : titleEn}
          </h1>
          <p className="text-xs sm:text-sm text-brand-charcoal/80 mt-1">
            {isRtl ? descriptionAr : descriptionEn}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allowedRoles.map(role => (
            <Badge key={role} variant="plum" size="sm">
              {role}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card
            title="مواصفات الشاشة القادمة في خطة التطوير التدريجية"
            subtitle="سيتم بناؤها خطوة بخطوة بالترتيب المتسلسل المعتمد"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 rounded-card bg-brand-lightGray/40 border border-brand-border text-xs text-brand-charcoal">
                <Info className="w-4 h-4 text-brand-plum shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  هذه الشاشة محجوزة ومجهزة بالكامل للبرومبت رقم (<strong>{promptNumber}</strong>). وفقاً لتعليمات البرومبتات، نقوم ببناء وتفعيل الشاشات تباعاً (وحدة وحدة) مع الحفاظ على سلامة الـ Shell والمكونات المشتركة.
                </div>
              </div>

              <div>
                <h4 className="text-sm font-subheading font-bold text-brand-darkText mb-2">
                  الميزات الأساسية للشاشة:
                </h4>
                <ul className="space-y-1.5 text-xs text-brand-charcoal">
                  {keyFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-green shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="إجراءات المطور">
            <div className="space-y-3 text-xs">
              <p className="text-brand-charcoal/80">
                يمكنك معاينة كافة المكونات المعتمدة وحالاتها المتعددة عبر معرض المكونات:
              </p>
              <Link to="/demo/components">
                <Button variant="primary" fullWidth size="sm" rightIcon={<Arrow className="w-4 h-4" />}>
                  الانتقال لمعرض المكونات
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
