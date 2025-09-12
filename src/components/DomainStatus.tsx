// src/components/DomainStatus.tsx (最终完整版)

import { useQuery } from '@tanstack/react-query';
import { getDomains, Domain } from '@/api/domain';
import { CalendarDays, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// =======================================================
// 彩色备注标签组件
// =======================================================
const DomainNoteTags = ({ notes }: { notes?: string }) => {
  if (!notes) {
    return null;
  }

  const colors = [
    'bg-blue-500 text-white',
    'bg-green-500 text-white',
    'bg-purple-500 text-white',
    'bg-red-500 text-white',
    'bg-gray-600 text-white',
  ];

  const tags = notes.split(';').map(tag => tag.trim()).filter(tag => tag);

  return (
    <div className="flex items-center flex-wrap gap-1 mt-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
            colors[index % colors.length]
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};


// =======================================================
// 行内模式卡片 (Inline Mode Card)
// =======================================================
const DomainCardInline = ({ domain }: { domain: Domain }) => {
  const expiresIn = domain.expires_in_days;
  const billingData = domain.BillingData || {};
  const customBackgroundImage = (window as any).CustomBackgroundImage !== "" ? (window as any).CustomBackgroundImage : undefined;

  let statusColorClass = 'bg-green-500';
  if (expiresIn !== undefined && expiresIn <= 10) statusColorClass = 'bg-red-500';
  else if (expiresIn !== undefined && expiresIn <= 30) statusColorClass = 'bg-yellow-500';

  return (
    <a href={`https://${domain.Domain}`} target="_blank" rel="noopener noreferrer" className="block">
      <div
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm p-3 cursor-pointer hover:bg-accent/50 transition-colors w-full",
          { "bg-card/70 backdrop-blur-sm": customBackgroundImage }
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColorClass} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusColorClass}`}></span>
            </span>
            <p className="font-mono font-semibold truncate">{domain.Domain}</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground ml-4">
            <span className="w-24 truncate">{billingData.registrar || 'N/A'}</span>
            <div className="flex items-center gap-1.5 w-28">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>到期: {billingData.endDate ? new Date(billingData.endDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 w-24">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{billingData.renewalPrice || 'N/A'}</span>
            </div>
            <span className="font-semibold w-24">{expiresIn !== undefined ? `${expiresIn} 天` : 'N/A'}</span>
          </div>
        </div>
        <DomainNoteTags notes={billingData.notes} />
      </div>
    </a>
  );
};


// =======================================================
// 卡片模式 (Card Mode)
// =======================================================
const DomainCard = ({ domain }: { domain: Domain }) => {
  const expiresIn = domain.expires_in_days;
  const billingData = domain.BillingData || {};
  const customBackgroundImage = (window as any).CustomBackgroundImage !== "" ? (window as any).CustomBackgroundImage : undefined;

  let progressBarColor = 'bg-gray-300';
  let progressBarWidth = '100%';

  if (expiresIn !== undefined) {
      if (expiresIn <= 10) {
        progressBarColor = 'bg-red-500';
        progressBarWidth = `${Math.max(5, (expiresIn / 10) * 100)}%`;
      } else if (expiresIn <= 100) {
        const lightness = 50 + (expiresIn - 10) / 90 * 20;
        progressBarColor = `bg-[hsl(45,90%,${lightness}%)]`;
        progressBarWidth = `${Math.max(5, (expiresIn / 100) * 100)}%`;
      } else {
        progressBarColor = 'bg-green-500';
      }
  }

  return (
    <a href={`https://${domain.Domain}`} target="_blank" rel="noopener noreferrer" className="block h-full">
      <div className={cn(
        "relative flex flex-col justify-between rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3 transition-all hover:shadow-md cursor-pointer h-full",
        { "bg-card/70 backdrop-blur-sm": customBackgroundImage }
      )}>
        <div>
          <h4 className="font-semibold font-mono tracking-tight">{domain.Domain}</h4>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{billingData.registrar || '未知注册商'}</span>
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            <span>{billingData.endDate ? new Date(billingData.endDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground w-1/3">
             <DollarSign className="h-3 w-3" />
             <span className="truncate">{billingData.renewalPrice || 'N/A'}</span>
          </div>
          <div className="flex-1">
             <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className={cn("h-1.5 rounded-full transition-all duration-500", progressBarColor)} style={{ width: progressBarWidth }} />
             </div>
          </div>
          <span className="font-medium text-muted-foreground w-12 text-right">{expiresIn !== undefined ? `${expiresIn}天` : 'N/A'}</span>
        </div>
        <div className="pt-1">
          <DomainNoteTags notes={billingData.notes} />
        </div>
      </div>
    </a>
  );
};


// =======================================================
// 主组件 (Main Component)
// =======================================================
export const DomainStatus = () => {
  const { data: domains, isLoading, error } = useQuery({
    queryKey: ['domains'],
    queryFn: getDomains,
    refetchInterval: 60 * 60 * 1000,
  });
  
  const [inline, setInline] = useState<string>("0");
  useEffect(() => {
    const checkInlineSettings = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        const inlineState = localStorage.getItem("inline");
        if ((window as any).ForceCardInline) setInline("1");
        else if (inlineState !== null) setInline(inlineState);
      }
    };
    checkInlineSettings();
    
    const handleStorageChange = () => checkInlineSettings();
    window.addEventListener('storage', handleStorageChange);
    
    const handleViewChange = () => {
      const inlineState = localStorage.getItem("inline");
      setInline(inlineState ?? "0");
    };
    window.addEventListener('nezha-view-change', handleViewChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nezha-view-change', handleViewChange);
    };
  }, []);

  const filteredDomains = domains?.filter(d => d.Status === 'verified' || d.Status === 'expired');

  if (error || isLoading || !filteredDomains || filteredDomains.length === 0) {
    return null;
  }

  if (inline === '1') {
    return (
      <div className="flex flex-col gap-2">
        {filteredDomains.map(domain => (
          <DomainCardInline key={domain.ID} domain={domain} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredDomains.map(domain => (
        <DomainCard key={domain.ID} domain={domain} />
      ))}
    </div>
  );
};