import { useState } from "react";
import { BedDouble, UserPlus, CheckCircle2, XCircle, Clock, Loader2, Search, Shield, ShieldOff, Sparkles, ArrowRightLeft, Droplets } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { BREEDS, SEVERITY_NAMES, SEVERITY_BORDER, DISEASE_NAMES, HERBS, POLLUTION_LEVEL_NAMES, POLLUTION_LEVEL_COLORS, ELEMENT_EMOJI, ELEMENT_NAMES, ELEMENT_BG_COLORS, PURIFY_HERB_INFO, isPurifyHerb } from "@/data/gameData";
import type { Bed } from "@/types/game";

interface BedGridProps {
  onBedClick: (bed: Bed) => void;
  onPurifyClick?: (bed: Bed) => void;
}

export function BedGrid({ onBedClick, onPurifyClick }: BedGridProps) {
  const beds = useGameStore(s => s.beds);
  const staff = useGameStore(s => s.staff);
  const inventory = useGameStore(s => s.inventory);
  const selectedBedId = useGameStore(s => s.selectedBedId);
  const selectedBedForSwapId = useGameStore(s => s.selectedBedForSwapId);
  const selectBed = useGameStore(s => s.selectBed);
  const selectBedForSwap = useGameStore(s => s.selectBedForSwap);
  const collectFromBed = useGameStore(s => s.collectFromBed);
  const swapBeds = useGameStore(s => s.swapBeds);
  const toggleIsolateBed = useGameStore(s => s.toggleIsolateBed);
  const purifyBed = useGameStore(s => s.purifyBed);
  const [swapMode, setSwapMode] = useState(false);
  const [purifyBedId, setPurifyBedId] = useState<string | null>(null);
  const [selectedPurifyHerbs, setSelectedPurifyHerbs] = useState<string[]>([]);

  const handleSwapClick = (bed: Bed) => {
    if (!selectedBedForSwapId) {
      selectBedForSwap(bed.id);
    } else if (selectedBedForSwapId === bed.id) {
      selectBedForSwap(null);
    } else {
      swapBeds(selectedBedForSwapId, bed.id);
    }
  };

  const togglePurifyHerb = (herbId: string) => {
    setSelectedPurifyHerbs(prev => {
      if (prev.includes(herbId)) return prev.filter(id => id !== herbId);
      if (prev.length >= 3) return prev;
      if ((inventory[herbId] ?? 0) < 1) return prev;
      return [...prev, herbId];
    });
  };

  const confirmPurify = () => {
    if (!purifyBedId || selectedPurifyHerbs.length === 0) return;
    purifyBed(purifyBedId, selectedPurifyHerbs);
    setPurifyBedId(null);
    setSelectedPurifyHerbs([]);
  };

  const purifyHerbs = HERBS.filter(h => isPurifyHerb(h.id));

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-clinic-deep flex items-center gap-2">
          <span>🛏️</span> 灵气污染场 — 治疗区
          <span className="ml-2 text-sm bg-clinic-amber/20 text-clinic-deep px-2 py-0.5 rounded-full font-medium">
            {beds.filter(b => b.status === "occupied").length}/{beds.length} 床位
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSwapMode(!swapMode); selectBedForSwap(null); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              swapMode
                ? "bg-clinic-amber text-white shadow-md"
                : "bg-white border border-clinic-border/60 text-clinic-deep hover:border-clinic-amber/60 hover:bg-clinic-amber/10"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {swapMode ? "交换中" : "调整床位"}
          </button>
        </div>
      </div>

      {swapMode && (
        <div className="mb-3 p-2.5 rounded-lg bg-clinic-amber/10 border border-clinic-amber/30 text-[11px] text-clinic-deep flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-clinic-amber flex-shrink-0" />
          <span>
            {selectedBedForSwapId
              ? `已选择 ${beds.find(b => b.id === selectedBedForSwapId)?.name}，点击另一张床位完成交换，再次点击取消`
              : "点击任意床位开始交换位置，以优化元素排列、减少相克污染"}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {beds.map(bed => {
          const isSelected = selectedBedId === bed.id;
          const isSwapSelected = selectedBedForSwapId === bed.id;
          const isEmpty = bed.status === "empty";
          const snapshot = bed.beastSnapshot;
          const breed = snapshot ? BREEDS.find(b => b.id === snapshot.breedId) : null;
          const assignedStaff = bed.assignedStaffId ? staff.find(s => s.id === bed.assignedStaffId) : null;
          const progress = bed.treatmentTotal > 0 ? (bed.treatmentProgress / bed.treatmentTotal) * 100 : 0;
          const herbsUsed = bed.currentPrescriptionHerbs.map(id => {
            const h = HERBS.find(x => x.id === id);
            return h ? h.emoji + h.name : "";
          }).filter(Boolean);

          const resolved = bed.result !== "pending";
          const isSuccess = bed.result === "success";

          return (
            <div
              key={bed.id}
              onClick={() => {
                if (swapMode) {
                  handleSwapClick(bed);
                  return;
                }
                if (isEmpty) {
                  selectBed(isSelected ? null : bed.id);
                  onBedClick(bed);
                } else if (resolved) {
                  collectFromBed(bed.id);
                } else {
                  selectBed(isSelected ? null : bed.id);
                  onBedClick(bed);
                }
              }}
              className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 bg-gradient-to-br ${
                isEmpty
                  ? "from-gray-50 to-gray-100 border-dashed border-gray-300 hover:border-clinic-jade/60 hover:from-clinic-jade/5"
                  : snapshot
                  ? `from-white to-clinic-bg border-2 ${bed.isolated ? "border-purple-400" : SEVERITY_BORDER[snapshot.severity]} ${
                      resolved
                        ? isSuccess
                          ? "animate-heal-glow"
                          : "animate-shake"
                        : ""
                    }`
                  : "from-white to-gray-50 border-gray-300"
              } ${isSwapSelected ? "ring-4 ring-clinic-amber shadow-glow -translate-y-1" : ""} ${isSelected && !swapMode ? "ring-2 ring-clinic-amber shadow-glow -translate-y-0.5" : "hover:-translate-y-0.5 hover:shadow-md"}`}
            >
              {bed.isolated && !isEmpty && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" />
                    隔离
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <BedDouble className={`w-4 h-4 ${isEmpty ? "text-gray-400" : "text-clinic-jade"}`} />
                <span className="text-sm font-semibold text-clinic-deep">{bed.name}</span>
                {!isEmpty && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    resolved
                      ? isSuccess
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                      : "bg-clinic-jade/15 text-clinic-jade"
                  }`}>
                    {resolved ? (isSuccess ? "✓ 可领取" : "✗ 处理") : "治疗中"}
                  </span>
                )}
              </div>

              {bed.elementResidues.length > 0 && (
                <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${POLLUTION_LEVEL_COLORS[bed.pollutionLevel]}`}>
                    <Droplets className="w-2.5 h-2.5 inline mr-0.5" />
                    {POLLUTION_LEVEL_NAMES[bed.pollutionLevel]} {bed.pollutionValue}
                  </span>
                  {bed.elementResidues.slice(0, 4).map(r => (
                    <span key={r.element} className={`text-[10px] px-1 py-0.5 rounded border ${ELEMENT_BG_COLORS[r.element]}`}>
                      {ELEMENT_EMOJI[r.element]} {r.amount}
                    </span>
                  ))}
                  {bed.elementResidues.length > 4 && (
                    <span className="text-[10px] text-gray-500">+{bed.elementResidues.length - 4}</span>
                  )}
                </div>
              )}

              {isEmpty ? (
                <div>
                  <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mb-1">
                      <BedDouble className="w-6 h-6" />
                    </div>
                    <p className="text-xs">空闲床位</p>
                    <p className="text-[10px] opacity-70 mt-1">{swapMode ? "点击交换" : "点击分配灵兽"}</p>
                  </div>
                  {bed.elementResidues.length > 0 && !swapMode && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPurifyBedId(bed.id); setSelectedPurifyHerbs([]); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-400 transition-all"
                      >
                        <Droplets className="w-3 h-3" />
                        净化残留
                      </button>
                    </div>
                  )}
                </div>
              ) : snapshot && breed ? (
                <div>
                  <div className="flex gap-2">
                    <div className="text-3xl w-12 h-12 self-center flex items-center justify-center rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-inner border border-clinic-border/40">
                      {breed.emoji}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="font-semibold text-sm text-clinic-deep truncate">
                        {snapshot.name}
                        <span className="ml-1 text-xs text-gray-500">{breed.name}</span>
                        <span className="ml-1 text-xs">{ELEMENT_EMOJI[breed.element]}{ELEMENT_NAMES[breed.element]}</span>
                      </div>
                      <div className="text-[11px] flex items-center gap-1 flex-wrap">
                        <span className={`tag border ${
                          snapshot.severity === "mild" ? "bg-clinic-jade/10 text-clinic-jade border-clinic-jade/30" :
                          snapshot.severity === "moderate" ? "bg-amber-100/60 text-amber-700 border-amber-300" :
                          snapshot.severity === "severe" ? "bg-orange-100/60 text-orange-700 border-orange-300" :
                          "bg-red-100/60 text-clinic-crisis border-clinic-crisis/40"
                        }`}>
                          {SEVERITY_NAMES[snapshot.severity]}
                        </span>
                        {resolved ? (
                          <span className="text-clinic-crisis flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            确诊 {DISEASE_NAMES[snapshot.disease]}
                          </span>
                        ) : bed.playerDiagnosis ? (
                          <span className="text-gray-600 flex items-center gap-0.5">
                            <Search className="w-3 h-3" />
                            拟诊 {DISEASE_NAMES[bed.playerDiagnosis]}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">观察中...</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        💊 {herbsUsed.join(" ")}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        {assignedStaff ? (
                          <span className="flex items-center gap-0.5 bg-clinic-light-jade/10 px-1.5 rounded">
                            <UserPlus className="w-3 h-3" />
                            {assignedStaff.emoji} {assignedStaff.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">未分配护理员</span>
                        )}
                      </div>
                    </div>
                    <div className="self-start">
                      {resolved ? (
                        isSuccess ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <XCircle className="w-6 h-6 text-clinic-crisis" />
                        )
                      ) : (
                        <Loader2 className="w-5 h-5 text-clinic-jade animate-spin" />
                      )}
                    </div>
                  </div>

                  {!resolved && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          治疗进度
                        </span>
                        <span className="tabular-nums font-medium">{Math.floor(progress)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-clinic-jade via-clinic-light-jade to-clinic-amber transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!resolved && !swapMode && (
                    <div className="mt-2 flex gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleIsolateBed(bed.id); }}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          bed.isolated
                            ? "bg-purple-100 text-purple-700 border border-purple-300"
                            : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                        }`}
                      >
                        {bed.isolated ? <Shield className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                        {bed.isolated ? "解除隔离" : "隔离"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPurifyBedId(bed.id); setSelectedPurifyHerbs([]); onPurifyClick?.(bed); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 hover:border-cyan-400 transition-all"
                        disabled={bed.elementResidues.length === 0}
                      >
                        <Droplets className="w-3 h-3" />
                        净化
                      </button>
                    </div>
                  )}

                  {resolved && (
                    <div className={`mt-2 text-center text-xs font-semibold py-1.5 rounded-lg animate-fade ${
                      isSuccess
                        ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700"
                        : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700"
                    }`}>
                      {isSuccess ? "🎉 点击领取诊金！" : "⚠️ 治疗失败，点击处理"}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {purifyBedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade" onClick={() => { setPurifyBedId(null); setSelectedPurifyHerbs([]); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-clinic-card rounded-2xl shadow-2xl p-5 border border-clinic-border/60 animate-fade" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg text-clinic-deep mb-3 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-600" />
              净化 {beds.find(b => b.id === purifyBedId)?.name}
            </h3>
            <p className="text-xs text-gray-600 mb-3">选择净化药材（最多3味），针对性净化元素残留。</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {purifyHerbs.map(h => {
                const count = inventory[h.id] ?? 0;
                const selected = selectedPurifyHerbs.includes(h.id);
                const info = PURIFY_HERB_INFO[h.id];
                const disabled = (!selected && (count < 1 || selectedPurifyHerbs.length >= 3));
                return (
                  <button
                    key={h.id}
                    onClick={() => togglePurifyHerb(h.id)}
                    disabled={disabled}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      selected
                        ? "border-cyan-500 bg-cyan-50 shadow-sm"
                        : count > 0
                        ? "border-clinic-border/50 bg-white hover:border-cyan-400"
                        : "border-gray-200 bg-gray-50 opacity-50"
                    } ${disabled && !selected ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <div className="text-xl">{h.emoji}</div>
                    <div className="text-[10px] font-medium text-clinic-deep truncate">{h.name}</div>
                    <div className="text-[9px] text-cyan-600">
                      {info.targetElement === "all" ? "全净化" : `净${ELEMENT_NAMES[info.targetElement]}`} -{info.purifyAmount}
                    </div>
                    <div className="text-[9px] text-gray-400">💰{h.price} 剩{count}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setPurifyBedId(null); setSelectedPurifyHerbs([]); }}
                className="flex-1 py-2 rounded-lg border-2 border-clinic-border/60 text-gray-600 hover:bg-white/80 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={confirmPurify}
                disabled={selectedPurifyHerbs.length === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:!bg-gray-300 text-sm"
              >
                确认净化
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-clinic-jade/5 via-white to-clinic-amber/5 border border-clinic-border/40">
        <div className="font-display text-sm text-clinic-deep mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-clinic-amber" />
          灵气污染场规则
        </div>
        <ul className="text-[11px] text-gray-600 space-y-1 list-disc list-inside">
          <li><span className="font-semibold text-clinic-deep">元素散发：</span>治疗中的灵兽每小时向相邻床位散发自身元素残留，病情越重散发越多</li>
          <li><span className="font-semibold text-clinic-deep">相生增益：</span>火→土→雷→水→木→火，相邻相生元素残留+50%，同系灵兽治疗成功率+3%/残留</li>
          <li><span className="font-semibold text-clinic-deep">相克干扰：</span>火克木、木克土、土克水、水克火、雷克木、光暗互克，相克残留-50%，成功率-5%/残留</li>
          <li><span className="font-semibold text-clinic-deep">污染危害：</span>轻度-3%/慢5%，中度-10%/慢15%，重度-20%/慢30%，且可能使病情恶化加重</li>
          <li><span className="font-semibold text-clinic-deep">应对策略：</span>调整床位（相生为邻）、使用净化药材清除残留、开启隔离模式阻挡传播</li>
        </ul>
      </div>
    </div>
  );
}
