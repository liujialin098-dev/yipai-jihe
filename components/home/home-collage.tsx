"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Pencil,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { StickerOutlineControls } from "@/components/stickers/outline-controls";
import { GarmentSticker } from "@/components/wardrobe/garment-sticker";
import {
  bound,
  type CollagePiece,
  type CollageSource,
  defaultCollage,
  homeCollageKey,
  restoreCollage,
} from "@/lib/home/collage";

export function HomeCollage({
  items,
  viewerId,
}: {
  items: CollageSource[];
  viewerId: string;
}) {
  const [saved, setSaved] = useState(() => defaultCollage(items));
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const board = useRef<HTMLFieldSetElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const drag = useRef<{
    pointer: number;
    id: string;
    startX: number;
    startY: number;
    piece: CollagePiece;
    width: number;
    height: number;
  } | null>(null);
  const key = homeCollageKey(viewerId);
  useEffect(() => {
    if (!editing && restoreFocus.current) {
      editButton.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [editing]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const next = restoreCollage(raw ? JSON.parse(raw) : null, items);
      setSaved(next);
      setDraft(next);
    } catch {
      setMessage("无法读取本设备拼图，可以重新编辑。");
    }
    setReady(true);
  }, [key, items]);
  const visible = new Map(
    items.filter((item) => item.cutoutUrl).map((item) => [item.id, item]),
  );
  const pieces = (editing ? draft : saved).filter((piece) =>
    visible.has(piece.id),
  );
  const active = selected
    ? pieces.find((piece) => piece.id === selected)
    : null;
  function change(id: string, patch: Partial<CollagePiece>) {
    setDraft((old) =>
      old.map((p) =>
        p.id === id
          ? {
              ...p,
              ...patch,
              x: bound(patch.x ?? p.x, 8, 92, p.x),
              y: bound(patch.y ?? p.y, 8, 92, p.y),
            }
          : p,
      ),
    );
  }
  function stopEdit() {
    restoreFocus.current = true;
    setEditing(false);
    setSelected(null);
    drag.current = null;
  }
  function save() {
    const next = restoreCollage({ version: 1, pieces: draft }, items);
    try {
      localStorage.setItem(key, JSON.stringify({ version: 1, pieces: next }));
      setSaved(next);
      setMessage("拼图已保存到本设备");
      stopEdit();
    } catch {
      setMessage("保存失败，编辑内容仍在。请释放浏览器存储后重试。");
    }
  }
  function cancel() {
    setDraft(saved);
    setMessage("");
    stopEdit();
  }
  function toggleItem(item: CollageSource) {
    if (draft.some((p) => p.id === item.id)) {
      if (draft.length === 1) {
        setMessage("至少保留一件衣物");
        return;
      }
      setDraft((old) => old.filter((p) => p.id !== item.id));
      if (selected === item.id) setSelected(null);
    } else {
      if (draft.length >= 8) {
        setMessage("最多选择8件，请先移除一件");
        return;
      }
      setDraft((old) => [
        ...old,
        {
          id: item.id,
          x: 50,
          y: 50,
          width: 42,
          height: 48,
          rotate: 0,
          scale: 1,
        },
      ]);
      setSelected(item.id);
    }
    setMessage("");
  }
  function begin(event: PointerEvent<HTMLButtonElement>, piece: CollagePiece) {
    if (!editing || !event.isPrimary || event.button !== 0 || drag.current)
      return;
    const rect = board.current?.getBoundingClientRect();
    if (!rect) return;
    setSelected(piece.id);
    drag.current = {
      pointer: event.pointerId,
      id: piece.id,
      startX: event.clientX,
      startY: event.clientY,
      piece,
      width: rect.width,
      height: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.pointer !== event.pointerId) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (Math.hypot(dx, dy) < 4) return;
    change(d.id, {
      x: d.piece.x + (dx / d.width) * 100,
      y: d.piece.y + (dy / d.height) * 100,
    });
  }
  function end(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const d = drag.current;
    if (!d || d.pointer !== event.pointerId) return;
    if (cancelled) change(d.id, d.piece);
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function layer(top: boolean) {
    if (!active) return;
    setDraft((old) =>
      top
        ? [...old.filter((p) => p.id !== active.id), active]
        : [active, ...old.filter((p) => p.id !== active.id)],
    );
  }
  return (
    <div className="home-collage" data-no-swipe>
      <div className="home-feature-heading">
        <h2 className="app-section-title">衣橱拼图</h2>
        <span>{pieces.length} 件贴纸</span>
        <button
          ref={editButton}
          type="button"
          className="collage-edit-trigger"
          disabled={!ready || editing}
          onClick={() => {
            setDraft(saved);
            setEditing(true);
            setMessage("");
          }}
          aria-expanded={editing}
        >
          <Pencil size={15} aria-hidden="true" />
          编辑
        </button>
      </div>
      <StickerOutlineControls compact />
      <fieldset
        ref={board}
        className="home-look-composition home-collage-board"
        data-editing={editing}
        data-count={pieces.length}
        aria-label="衣橱贴纸拼图，不代表一套推荐"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setSelected(null);
        }}
      >
        {pieces.map((p, index) => {
          const item = visible.get(p.id);
          if (!item) return null;
          const style = {
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.width}%`,
            height: `${p.height}%`,
            transform: `translate(-50%, -50%) rotate(${p.rotate}deg) scale(${p.scale})`,
            zIndex: index,
          };
          const image = (
            <GarmentSticker
              key={p.id}
              imageUrl={item.imageUrl}
              cutoutUrl={item.cutoutUrl}
              alt={item.name}
              sizes="(max-width:480px)40vw,180px"
              eager={index < 2}
              surface="loose"
              className="size-full"
              imageClassName="object-contain"
            />
          );
          return editing ? (
            <button
              key={p.id}
              type="button"
              className="home-collage-piece"
              style={style}
              aria-label={`调整${item.name}`}
              aria-pressed={selected === p.id}
              onClick={() => setSelected(p.id)}
              onPointerDown={(e) => begin(e, p)}
              onPointerMove={move}
              onPointerUp={(e) => end(e)}
              onPointerCancel={(e) => end(e, true)}
              onLostPointerCapture={(e) => end(e, true)}
              onKeyDown={(e) => {
                const steps: Record<string, [number, number]> = {
                  ArrowLeft: [-2, 0],
                  ArrowRight: [2, 0],
                  ArrowUp: [0, -2],
                  ArrowDown: [0, 2],
                };
                const step = steps[e.key];
                if (step) {
                  e.preventDefault();
                  change(p.id, { x: p.x + step[0], y: p.y + step[1] });
                }
              }}
            >
              {image}
            </button>
          ) : (
            <div key={p.id} className="home-look-piece" style={style}>
              {image}
            </div>
          );
        })}
      </fieldset>
      {editing ? (
        <div className="collage-editor-panel">
          {active ? (
            <div className="collage-adjustments">
              <p className="collage-selected-name">
                {visible.get(active.id)?.name}
              </p>
              <div className="collage-tool-row">
                {(
                  [
                    [ArrowLeft, "左移", -2, 0],
                    [ArrowRight, "右移", 2, 0],
                    [ArrowUp, "上移", 0, -2],
                    [ArrowDown, "下移", 0, 2],
                  ] as const
                ).map(([Icon, label, x, y]) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    onClick={() =>
                      change(active.id, { x: active.x + x, y: active.y + y })
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="collage-tool-row collage-rotation-row">
                <button
                  type="button"
                  aria-label="逆时针旋转"
                  onClick={() =>
                    change(active.id, {
                      rotate: bound(active.rotate - 15, -180, 180, 0),
                    })
                  }
                >
                  <RotateCcw size={18} aria-hidden="true" />
                  左转
                </button>
                <button
                  type="button"
                  aria-label="顺时针旋转"
                  onClick={() =>
                    change(active.id, {
                      rotate: bound(active.rotate + 15, -180, 180, 0),
                    })
                  }
                >
                  <RotateCw size={18} aria-hidden="true" />
                  右转
                </button>
                <span>{Math.round(active.rotate)}°</span>
              </div>
              <label className="collage-slider">
                大小{" "}
                <input
                  type="range"
                  min="0.5"
                  max="1.6"
                  step="0.05"
                  value={active.scale}
                  onChange={(e) =>
                    change(active.id, { scale: Number(e.target.value) })
                  }
                />
                <output>{Math.round(active.scale * 100)}%</output>
              </label>
              <div className="collage-tool-row">
                <button type="button" onClick={() => layer(false)}>
                  置底
                </button>
                <button type="button" onClick={() => layer(true)}>
                  置顶
                </button>
              </div>
            </div>
          ) : (
            <p className="collage-hint">点选衣物调整位置、大小与角度</p>
          )}
          <details className="collage-wardrobe-picker">
            <summary>
              选择衣物 <span>{draft.length} / 8</span>
            </summary>
            <label className="collage-search">
              搜索衣物
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="输入衣物名称"
              />
            </label>
            <div className="collage-item-options">
              {items
                .filter(
                  (item) => item.cutoutUrl && item.name.includes(query.trim()),
                )
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={draft.some((p) => p.id === item.id)}
                    onClick={() => toggleItem(item)}
                  >
                    <span className="collage-item-image">
                      <GarmentSticker
                        imageUrl={item.imageUrl}
                        cutoutUrl={item.cutoutUrl}
                        alt=""
                        sizes="72px"
                        surface="loose"
                        className="size-full"
                      />
                    </span>
                    <span>{item.name}</span>
                    {draft.some((p) => p.id === item.id) ? (
                      <Check size={16} aria-hidden="true" />
                    ) : null}
                  </button>
                ))}
            </div>
          </details>
          <div className="collage-editor-actions">
            <button
              type="button"
              onClick={() => {
                const next = defaultCollage(
                  draft.flatMap((p) => {
                    const item = visible.get(p.id);
                    return item ? [item] : [];
                  }),
                );
                setDraft(next);
                setSelected(null);
              }}
            >
              重新排布
            </button>
            <button type="button" onClick={cancel}>
              取消
            </button>
            <button type="button" className="collage-save" onClick={save}>
              保存拼图
            </button>
          </div>
        </div>
      ) : null}
      <output className="collage-status">{message}</output>
    </div>
  );
}
