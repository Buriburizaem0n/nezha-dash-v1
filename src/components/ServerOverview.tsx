// src/components/ServerOverview.tsx (最终完整版)

import { Card, CardContent } from "@/components/ui/card"
import { useStatus } from "@/hooks/use-status"
import { formatBytes} from "@/lib/format"
import { cn } from "@/lib/utils"
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from "@heroicons/react/20/solid"
import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"

// 扩展 props 类型，以接收域名总数和新的交互逻辑
type ServerOverviewProps = {
  online: number
  offline: number
  total: number
  up: number
  down: number
  upSpeed: number
  downSpeed: number
  totalDomains: number // 新增：接收域名总数
  onViewChange: (view: 'servers' | 'domains') => void // 新增：点击事件回调
  activeView: 'servers' | 'domains' // 新增：当前激活的视图
}

export default function ServerOverview({
  online,
  offline,
  total,
  up,
  down,
  upSpeed,
  downSpeed,
  totalDomains,
  onViewChange,
  activeView,
}: ServerOverviewProps) {
  const { t } = useTranslation()
  const { status, setStatus } = useStatus()

  // --- 所有原始变量和逻辑保持不变 ---
  const disableAnimatedMan = (window as any).DisableAnimatedMan as boolean
  const customIllustration = (window as any).CustomIllustration || "/animated-man.webp"
  const customBackgroundImage = (window as any).CustomBackgroundImage !== "" ? (window as any).CustomBackgroundImage : undefined

  // 新增：一个组合了两个动作的点击处理函数
  const handleServerCardClick = (serverStatus: 'all' | 'online' | 'offline') => {
    onViewChange('servers'); // 动作1: 确保视图切换回服务器
    setStatus(serverStatus); // 动作2: 执行原有的状态筛选
  }

  return (
    <>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5 server-overview">
        <Card
          onClick={() => handleServerCardClick("all")}
          className={cn(
            "hover:border-blue-500 cursor-pointer transition-all",
            { "bg-card/70": customBackgroundImage },
          )}
        >
          <CardContent className="flex h-full items-center px-6 py-3">
            <section className="flex flex-col gap-1">
              <p className="text-sm font-medium md:text-base">{t("serverOverview.totalServers")}</p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                </span>
                <div className="text-lg font-semibold">{total}</div>
              </div>
            </section>
          </CardContent>
        </Card>
        <Card
          onClick={() => handleServerCardClick("online")}
          className={cn(
            "cursor-pointer hover:ring-green-500 ring-1 ring-transparent transition-all",
            { "bg-card/70": customBackgroundImage },
            { "ring-green-500 ring-2 border-transparent": activeView === 'servers' && status === "online" }
          )}
        >
          <CardContent className="flex h-full items-center px-6 py-3">
            <section className="flex flex-col gap-1">
              <p className="text-sm font-medium md:text-base">{t("serverOverview.onlineServers")}</p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
                <div className="text-lg font-semibold">{online}</div>
              </div>
            </section>
          </CardContent>
        </Card>
        <Card
          onClick={() => handleServerCardClick("offline")}
          className={cn(
            "cursor-pointer hover:ring-red-500 ring-1 ring-transparent transition-all",
            { "bg-card/70": customBackgroundImage },
            { "ring-red-500 ring-2 border-transparent": activeView === 'servers' && status === "offline" }
          )}
        >
          <CardContent className="flex h-full items-center px-6 py-3">
            <section className="flex flex-col gap-1">
              <p className="text-sm font-medium md:text-base">{t("serverOverview.offlineServers")}</p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                <div className="text-lg font-semibold">{offline}</div>
              </div>
            </section>
          </CardContent>
        </Card>
        
        <Card
          onClick={() => onViewChange('domains')}
          className={cn(
            "cursor-pointer hover:ring-indigo-500 ring-1 ring-transparent transition-all",
            { "bg-card/70": customBackgroundImage },
            { "ring-indigo-500 ring-2 border-transparent": activeView === 'domains' }
          )}
        >
          <CardContent className="flex h-full items-center px-6 py-3">
            <section className="flex flex-col gap-1">
              <p className="text-sm font-medium md:text-base">总域名数</p>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="text-lg font-semibold">{totalDomains}</div>
              </div>
            </section>
          </CardContent>
        </Card>

        <Card
          className={cn("hover:ring-purple-500 ring-1 ring-transparent transition-all", { "bg-card/70": customBackgroundImage })}
        >
          <CardContent className="flex h-full items-center relative px-6 py-3">
            <section className="flex flex-col gap-1 w-full">
              <div className="flex items-center w-full justify-between"><p className="text-sm font-medium md:text-base">{t("serverOverview.network")}</p></div>
              <section className="flex items-start flex-row z-10 pr-0 gap-1">
                <p className="sm:text-[12px] text-[10px] text-blue-800 dark:text-blue-400   text-nowrap font-medium">↑{formatBytes(up)}</p>
                <p className="sm:text-[12px] text-[10px]  text-purple-800 dark:text-purple-400  text-nowrap font-medium">↓{formatBytes(down)}</p>
              </section>
              <section className="flex flex-col sm:flex-row -mr-1 sm:items-center items-start gap-1">
                <p className="text-[11px] flex items-center text-nowrap font-semibold"><ArrowUpCircleIcon className="size-3 mr-0.5 sm:mb-[1px]" />{formatBytes(upSpeed)}/s</p>
                <p className="text-[11px] flex items-center  text-nowrap font-semibold"><ArrowDownCircleIcon className="size-3 mr-0.5" />{formatBytes(downSpeed)}/s</p>
              </section>
            </section>
            {!disableAnimatedMan && (
              <img className="absolute right-3 top-[-85px] z-50 w-20 scale-90 group-hover:opacity-50 md:scale-100 transition-all" alt={"animated-man"} src={customIllustration} loading="eager" />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}