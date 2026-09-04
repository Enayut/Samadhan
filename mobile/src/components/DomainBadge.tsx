import React from 'react';
import { DomainType } from '../types';
import { Shield, Trees, Factory, Users, HardHat, FileText, AlertTriangle } from 'lucide-react';

interface DomainBadgeProps {
  domain: DomainType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const getDomainMeta = (domain: DomainType) => {
  switch (domain) {
    case 'SAFETY':
      return {
        label: 'SAFETY',
        icon: Shield,
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        colorHex: '#E53E3E',
      };
    case 'ENVIRONMENT':
      return {
        label: 'ENVIRONMENT',
        icon: Trees,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        colorHex: '#38A169',
      };
    case 'PRODUCTION':
      return {
        label: 'PRODUCTION',
        icon: Factory,
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        colorHex: '#D69E2E',
      };
    case 'LABOUR':
      return {
        label: 'LABOUR',
        icon: Users,
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        colorHex: '#5A67D8',
      };
    case 'CONTRACTOR':
      return {
        label: 'CONTRACTOR',
        icon: HardHat,
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        colorHex: '#3182CE',
      };
    case 'GRIEVANCE':
      return {
        label: 'GRIEVANCE',
        icon: FileText,
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        colorHex: '#718096',
      };
    case 'ANOMALY':
    default:
      return {
        label: 'ANOMALY',
        icon: AlertTriangle,
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        colorHex: '#DD6B20',
      };
  }
};

export const DomainBadge: React.FC<DomainBadgeProps> = ({
  domain,
  size = 'md',
  showIcon = true,
}) => {
  const meta = getDomainMeta(domain);
  const IconComponent = meta.icon;

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] py-0.5 px-2 gap-1 font-semibold tracking-wide'
      : 'text-[11px] py-1 px-2.5 gap-1.5 font-bold tracking-wider';

  return (
    <span
      className={`inline-flex items-center uppercase rounded-[4px] border ${meta.bg} ${meta.text} ${meta.border} ${sizeClasses}`}
      style={{ letterSpacing: '0.05em' }}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{meta.label}</span>
    </span>
  );
};
