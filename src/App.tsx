import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

/* ---- drag-number hook: double-click + drag up/down to adjust ---- */
function useDragNumber(
  value: number,
  onChange: (v: number) => void,
  opts: { min?: number; max?: number; step?: number } = {},
) {
  const { min = -Infinity, max = Infinity, step = 1 } = opts
  const ref = useRef<{ startY: number; startVal: number } | null>(null)

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startY = e.clientY
    const startVal = value
    ref.current = { startY, startVal }

    const onMove = (ev: MouseEvent) => {
      const d = ref.current
      if (!d) return
      const delta = Math.round((d.startY - ev.clientY) / 2) * step
      const next = Math.min(max, Math.max(min, +(d.startVal + delta).toFixed(4)))
      onChange(next)
    }
    const onUp = () => {
      ref.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [value, onChange, min, max, step])

  return { onDoubleClick }
}

/* ---- DragInput: input with double-click+drag to adjust value ---- */
function DragInput({ onValueChange, resetValue, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value: number
  onValueChange: (v: number) => void
  resetValue?: number
}) {
  const { onDoubleClick } = useDragNumber(
    Number(props.value),
    onValueChange,
    { min: Number(props.min ?? -Infinity), max: Number(props.max ?? Infinity), step: Number(props.step ?? 1) },
  )
  return (
    <input
      {...props}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (resetValue !== undefined) {
          onValueChange(resetValue)
        } else {
          onDoubleClick(e)
        }
      }}
      onChange={(e) => onValueChange(Number(e.target.value))}
    />
  )
}

type Direction = 'horizontal' | 'vertical'
type Align = 'start' | 'center' | 'end'

type Crop = { top: number; right: number; bottom: number; left: number }

type TextItem = {
  id: string
  text: string
  fontSize: number
  color: string
  padding: number
  x: number
  y: number
}

const SNAP_THRESHOLD = 20

type ImageItem = {
  id: string
  file: File
  url: string
  width: number
  height: number
  scale: number
  crop: Crop
}

const DEFAULT_PREVIEW_WIDTH = 600

/* ---- pure helpers (no hooks / no state) ---- */

function croppedSize(item: ImageItem) {
  const cw = item.width * (1 - (item.crop.left + item.crop.right) / 100)
  const ch = item.height * (1 - (item.crop.top + item.crop.bottom) / 100)
  return { cw: Math.max(1, cw), ch: Math.max(1, ch) }
}

function getUniformTarget(images: ImageItem[], dir: Direction): number {
  if (!images.length) return 0
  return dir === 'vertical'
    ? Math.max(...images.map((i) => i.width))
    : Math.max(...images.map((i) => i.height))
}

function calcDisplaySize(
  item: ImageItem,
  dir: Direction,
  uniformTarget: number,
) {
  const { cw, ch } = croppedSize(item)
  if (dir === 'vertical') {
    const baseW = uniformTarget
    const baseH = Math.round(baseW * (ch / cw))
    return { w: Math.round(baseW * item.scale), h: Math.round(baseH * item.scale), baseW, baseH }
  } else {
    const baseH = uniformTarget
    const baseW = Math.round(baseH * (cw / ch))
    return { w: Math.round(baseW * item.scale), h: Math.round(baseH * item.scale), baseW, baseH }
  }
}

function calcMetrics(
  images: ImageItem[],
  dir: Direction,
  gap: number,
) {
  if (!images.length) return { width: 900, height: 520 }
  const ut = getUniformTarget(images, dir)
  const sizes = images.map((item) => calcDisplaySize(item, dir, ut))
  if (dir === 'horizontal') {
    const width = sizes.reduce((s, sz) => s + sz.baseW, 0) + gap * (images.length - 1)
    const height = Math.max(...sizes.map((sz) => sz.baseH))
    return { width, height }
  }
  const width = Math.max(...sizes.map((sz) => sz.baseW))
  const height = sizes.reduce((s, sz) => s + sz.baseH, 0) + gap * (images.length - 1)
  return { width, height }
}

const imageCache = new Map<string, HTMLImageElement>()

function loadImage(url: string) {
  const cached = imageCache.get(url)
  if (cached) return Promise.resolve(cached)
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => { imageCache.set(url, img); resolve(img) }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}

/* ---- component ---- */

function App() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [direction, setDirection] = useState<Direction>('vertical')
  const [gap, setGap] = useState(0)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [align, setAlign] = useState<Align>('center')
  const [texts, setTexts] = useState<TextItem[]>([])
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [jpgQuality, setJpgQuality] = useState(0.92)
  const [exportScale, setExportScale] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState(false)
  const [maxPreviewWidth, setMaxPreviewWidth] = useState(DEFAULT_PREVIEW_WIDTH)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRectsRef = useRef<{ id: string; x: number; y: number; w: number; h: number }[]>([])
  const dragRef = useRef<{ side: keyof Crop; startVal: number; startPos: number } | null>(null)
  const textDragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const cropImgRef = useRef<HTMLDivElement | null>(null)

  const selectedImage = images.find((i) => i.id === selectedId) ?? null

  const metrics = calcMetrics(images, direction, gap)

  /* ---- preview effect: 依赖项变化时重绘预览画布 ---- */

  const renderIdRef = useRef(0)

  useEffect(() => {
    const id = ++renderIdRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    const m = calcMetrics(images, direction, gap)
    const ut = getUniformTarget(images, direction)
    let previewScale = ut > maxPreviewWidth ? maxPreviewWidth / ut : 1
    // cap total pixels to keep canvas manageable for scrolling
    const MAX_PIXELS = 4_000_000
    const estW = m.width * previewScale
    const estH = m.height * previewScale
    if (estW * estH > MAX_PIXELS) previewScale *= Math.sqrt(MAX_PIXELS / (estW * estH))

    ;(async () => {
      const width = Math.max(1, Math.round(m.width * previewScale))
      const height = Math.max(1, Math.round(m.height * previewScale))
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx || id !== renderIdRef.current) return

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)

      let cursorX = 0
      let cursorY = 0
      const rects: { id: string; x: number; y: number; w: number; h: number }[] = []

      for (const item of images) {
        if (id !== renderIdRef.current) return
        const img = await loadImage(item.url)
        if (id !== renderIdRef.current) return

        const sz = calcDisplaySize(item, direction, ut)
        const dw = sz.w * previewScale
        const dh = sz.h * previewScale
        let dx = cursorX
        let dy = cursorY

        if (direction === 'horizontal') {
          const remain = m.height - sz.h
          if (align === 'center') dy += (remain / 2) * previewScale
          if (align === 'end') dy += remain * previewScale
        } else {
          const remain = m.width - sz.w
          if (align === 'center') dx += (remain / 2) * previewScale
          if (align === 'end') dx += remain * previewScale
        }

        const srcX = img.naturalWidth * item.crop.left / 100
        const srcY = img.naturalHeight * item.crop.top / 100
        const srcW = img.naturalWidth * (1 - (item.crop.left + item.crop.right) / 100)
        const srcH = img.naturalHeight * (1 - (item.crop.top + item.crop.bottom) / 100)
        ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh)
        rects.push({ id: item.id, x: dx, y: dy, w: dw, h: dh })

        if (direction === 'horizontal') cursorX += dw + gap * previewScale
        else cursorY += dh + gap * previewScale
      }

      if (id !== renderIdRef.current) return

      if (selectedId) {
        const sel = rects.find((r) => r.id === selectedId)
        if (sel) {
          ctx.strokeStyle = '#1f6feb'
          ctx.lineWidth = 3
          ctx.setLineDash([6, 4])
          ctx.strokeRect(sel.x - 1.5, sel.y - 1.5, sel.w + 3, sel.h + 3)
          ctx.setLineDash([])
        }
      }

      imageRectsRef.current = rects

      for (const t of texts) {
        if (t.text.trim()) {
          const fsPx = Math.round(t.fontSize * previewScale)
          ctx.font = `${fsPx}px "Arial","PingFang SC",sans-serif`
          ctx.textBaseline = 'top'
          ctx.fillStyle = t.color
          const lines = t.text.split('\n')
          const lineH = fsPx * 1.2
          for (let li = 0; li < lines.length; li++) {
            ctx.fillText(lines[li], t.x * previewScale, t.y * previewScale + li * lineH)
          }
          if (t.id === selectedTextId) {
            const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width))
            ctx.strokeStyle = '#1f6feb'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 3])
            ctx.strokeRect(t.x * previewScale - 2, t.y * previewScale - 2, maxW + 4, lineH * lines.length + 4)
            ctx.setLineDash([])
          }
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, direction, gap, bgColor, align, texts, selectedId, selectedTextId, cropMode, maxPreviewWidth])

  /* ---- handlers ---- */

  const onFileChange = async (fileList: FileList | null) => {
    if (!fileList) return
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    const loaded = await Promise.all(
      validFiles.map(async (file) => {
        const url = URL.createObjectURL(file)
        const img = await loadImage(url)
        return {
          id: crypto.randomUUID(),
          file,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          scale: 1,
          crop: { top: 0, right: 0, bottom: 0, left: 0 },
        } satisfies ImageItem
      }),
    )
    setImages((prev) => [...prev, ...loaded])
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const t = prev.find((i) => i.id === id)
      if (t) { imageCache.delete(t.url); URL.revokeObjectURL(t.url) }
      return prev.filter((i) => i.id !== id)
    })
    if (selectedId === id) setSelectedId(null)
  }

  const moveImage = (index: number, step: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev]
      const t = index + step
      if (t < 0 || t >= next.length) return prev
      ;[next[index], next[t]] = [next[t], next[index]]
      return next
    })
  }

  const setImageScale = (id: string, v: number) => {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, scale: v } : i)))
  }

  const setImageCrop = (id: string, side: keyof Crop, v: number) => {
    setImages((prev) => prev.map((i) =>
      i.id === id ? { ...i, crop: { ...i.crop, [side]: v } } : i
    ))
  }

  const exportImage = async (format: 'image/png' | 'image/jpeg') => {
    if (!images.length) return
    setIsExporting(true)
    try {
      const offscreen = document.createElement('canvas')
      const m = calcMetrics(images, direction, gap)
      const ut = getUniformTarget(images, direction)
      const s = exportScale
      offscreen.width = Math.max(1, Math.round(m.width * s))
      offscreen.height = Math.max(1, Math.round(m.height * s))
      const ctx = offscreen.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, offscreen.width, offscreen.height)

      let cx = 0, cy = 0
      for (const item of images) {
        const img = await loadImage(item.url)
        const sz = calcDisplaySize(item, direction, ut)
        const dw = sz.w * s, dh = sz.h * s
        let dx = cx, dy = cy
        if (direction === 'horizontal') {
          const remain = m.height - sz.h
          if (align === 'center') dy += (remain / 2) * s
          if (align === 'end') dy += remain * s
        } else {
          const remain = m.width - sz.w
          if (align === 'center') dx += (remain / 2) * s
          if (align === 'end') dx += remain * s
        }
        const srcX = img.naturalWidth * item.crop.left / 100
        const srcY = img.naturalHeight * item.crop.top / 100
        const srcW = img.naturalWidth * (1 - (item.crop.left + item.crop.right) / 100)
        const srcH = img.naturalHeight * (1 - (item.crop.top + item.crop.bottom) / 100)
        ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh)
        if (direction === 'horizontal') cx += dw + gap * s
        else cy += dh + gap * s
      }
      for (const t of texts) {
        if (t.text.trim()) {
          const fsPx = Math.round(t.fontSize * s)
          ctx.font = `${fsPx}px "Arial","PingFang SC",sans-serif`
          ctx.textBaseline = 'top'
          ctx.fillStyle = t.color
          const lines = t.text.split('\n')
          const lineH = fsPx * 1.2
          for (let li = 0; li < lines.length; li++) {
            ctx.fillText(lines[li], t.x * s, t.y * s + li * lineH)
          }
        }
      }

      const quality = format === 'image/jpeg' ? jpgQuality : undefined
      const url = offscreen.toDataURL(format, quality)
      const a = document.createElement('a')
      a.href = url
      a.download = `mergecanvas-${Date.now()}.${format === 'image/png' ? 'png' : 'jpg'}`
      a.click()
    } finally {
      setIsExporting(false)
    }
  }

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top) * sy

    const m = calcMetrics(images, direction, gap)
    const ut = getUniformTarget(images, direction)
    let previewScale = ut > maxPreviewWidth ? maxPreviewWidth / ut : 1
    const MAX_PIXELS = 4_000_000
    const estW = m.width * previewScale
    const estH = m.height * previewScale
    if (estW * estH > MAX_PIXELS) previewScale *= Math.sqrt(MAX_PIXELS / (estW * estH))

    // check text hit first (reverse order = top-most first)
    const offscreen = document.createElement('canvas')
    offscreen.width = canvas.width
    offscreen.height = canvas.height
    const tctx = offscreen.getContext('2d')
    if (tctx) {
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i]
        if (!t.text.trim()) continue
        const fsPx = Math.round(t.fontSize * previewScale)
        tctx.font = `${fsPx}px "Arial","PingFang SC",sans-serif`
        const lines = t.text.split('\n')
        const tw = Math.max(...lines.map((l) => tctx.measureText(l).width))
        const tx = t.x * previewScale
        const ty = t.y * previewScale
        const th = fsPx * 1.2 * lines.length
        if (cx >= tx && cx <= tx + tw && cy >= ty && cy <= ty + th) {
          setSelectedTextId(t.id)
          setSelectedId(null)
          textDragRef.current = { id: t.id, startX: e.clientX, startY: e.clientY, origX: t.x, origY: t.y }
          const canvasW = m.width
          const canvasH = m.height
          const scaleX = rect.width / canvasW
          const scaleY = rect.height / canvasH
          const onMove = (ev: MouseEvent) => {
            const d = textDragRef.current
            if (!d) return
            const rawX = Math.round(d.origX + (ev.clientX - d.startX) / scaleX)
            const rawY = Math.round(d.origY + (ev.clientY - d.startY) / scaleY)
            setTexts((prev) => prev.map((tt) => {
              if (tt.id !== d.id) return tt
              const pad = tt.padding
              let nx = rawX, ny = rawY
              // snap X: left-edge, center, right-edge
              if (Math.abs(nx - pad) < SNAP_THRESHOLD) nx = pad
              else if (Math.abs(nx - Math.round(canvasW / 2)) < SNAP_THRESHOLD) nx = Math.round(canvasW / 2)
              else if (Math.abs(nx - (canvasW - pad)) < SNAP_THRESHOLD) nx = canvasW - pad
              // snap Y: top-edge, center, bottom-edge
              if (Math.abs(ny - pad) < SNAP_THRESHOLD) ny = pad
              else if (Math.abs(ny - Math.round(canvasH / 2)) < SNAP_THRESHOLD) ny = Math.round(canvasH / 2)
              else if (Math.abs(ny - (canvasH - pad)) < SNAP_THRESHOLD) ny = canvasH - pad
              return { ...tt, x: nx, y: ny }
            }))
          }
          const onUp = () => {
            textDragRef.current = null
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
          }
          document.addEventListener('mousemove', onMove)
          document.addEventListener('mouseup', onUp)
          return
        }
      }
    }

    // image hit
    const hit = [...imageRectsRef.current].reverse().find(
      (r) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h,
    )
    setSelectedId(hit ? hit.id : null)
    setSelectedTextId(null)
  }

  const onCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const cx = (e.clientX - rect.left) * sx
    const cy = (e.clientY - rect.top) * sy
    const hit = [...imageRectsRef.current].reverse().find(
      (r) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h,
    )
    if (hit) {
      setSelectedId(hit.id)
      setCropMode(true)
    }
  }

  const addText = () => {
    const t: TextItem = { id: crypto.randomUUID(), text: '文字', fontSize: 36, color: '#111111', padding: 20, x: 40, y: 40 }
    setTexts((prev) => [...prev, t])
    setSelectedTextId(t.id)
  }

  const removeText = (id: string) => {
    setTexts((prev) => prev.filter((t) => t.id !== id))
    if (selectedTextId === id) setSelectedTextId(null)
  }

  const updateText = (id: string, patch: Partial<TextItem>) => {
    setTexts((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t))
  }

  const startCropDrag = (side: keyof Crop, e: React.MouseEvent) => {
    e.preventDefault()
    if (!selectedImage) return
    const startVal = selectedImage.crop[side]
    const startPos = side === 'top' || side === 'bottom' ? e.clientY : e.clientX
    dragRef.current = { side, startVal, startPos }

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current
      if (!d || !cropImgRef.current || !selectedId) return
      const rect = cropImgRef.current.getBoundingClientRect()
      const isVert = d.side === 'top' || d.side === 'bottom'
      const total = isVert ? rect.height : rect.width
      const delta = ((isVert ? ev.clientY : ev.clientX) - d.startPos) / total * 100
      let newVal: number
      if (d.side === 'top' || d.side === 'left') {
        newVal = d.startVal + delta
      } else {
        newVal = d.startVal - delta
      }
      newVal = Math.min(49, Math.max(0, Math.round(newVal)))
      setImageCrop(selectedId, d.side, newVal)
    }

    const onUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  /* ---- JSX ---- */

  return (
    <main className="app">
      <header className="top">
        <h1>MergeCanvas</h1>
        <p>在线无损拼图工具 —— 本地处理、快速导出</p>
      </header>

      <section className="grid">
        {/* 左：图片列表 */}
        <aside className="panel">
          <h2>图片</h2>
          <label className="upload">
            上传图片
            <input type="file" accept="image/*" multiple onChange={(e) => void onFileChange(e.target.files)} />
          </label>
          <ul className="list">
            {images.map((item, idx) => (
              <li key={item.id} className={item.id === selectedId ? 'selected' : ''} onClick={() => setSelectedId(item.id)}>
                <div className="item-head">
                  <img className="thumb" src={item.url} alt="" draggable={false} />
                  <div>
                    <strong>{item.file.name}</strong>
                    <span>{item.width} × {item.height}</span>
                  </div>
                  <div className="row-btn">
                    <button onClick={(e) => { e.stopPropagation(); moveImage(idx, -1) }}>↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveImage(idx, 1) }}>↓</button>
                    <button onClick={(e) => { e.stopPropagation(); removeImage(item.id) }}>✕</button>
                  </div>
                </div>
                {item.id === selectedId && (
                  <div className="item-tools">
                    <label>缩放：{item.scale.toFixed(2)}x</label>
                    <DragInput
                      type="range"
                      min={0.1}
                      max={3}
                      step={0.01}
                      value={item.scale}
                      resetValue={1}
                      onClick={(e) => e.stopPropagation()}
                      onValueChange={(v) => setImageScale(item.id, v)}
                    />
                    <div className="crop-controls">
                      <button onClick={(e) => { e.stopPropagation(); setCropMode(true) }}>✂ 可视化裁切</button>
                      <div className="crop-grid">
                        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                          <label key={side}>
                            <span>{{top:'上',right:'右',bottom:'下',left:'左'}[side]}</span>
                            <DragInput
                              type="number"
                              min={0}
                              max={49}
                              value={item.crop[side]}
                              onClick={(e) => e.stopPropagation()}
                              onValueChange={(v) => setImageCrop(item.id, side, Math.min(49, Math.max(0, v)))}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* 中：预览 */}
        <section className="panel preview-panel">
          <h2>预览 <span className="tip-inline">（点击画布选中图片）</span></h2>
          {cropMode && selectedImage ? (
            <div className="crop-editor">
              <div className="crop-img-wrap" ref={cropImgRef} onDoubleClick={() => setCropMode(false)}>
                <img src={selectedImage.url} draggable={false} alt="" />
                {/* 遮罩 */}
                <div className="crop-mask" style={{ top: 0, left: 0, right: 0, height: `${selectedImage.crop.top}%` }} />
                <div className="crop-mask" style={{ bottom: 0, left: 0, right: 0, height: `${selectedImage.crop.bottom}%` }} />
                <div className="crop-mask" style={{ top: `${selectedImage.crop.top}%`, left: 0, bottom: `${selectedImage.crop.bottom}%`, width: `${selectedImage.crop.left}%` }} />
                <div className="crop-mask" style={{ top: `${selectedImage.crop.top}%`, right: 0, bottom: `${selectedImage.crop.bottom}%`, width: `${selectedImage.crop.right}%` }} />
                {/* 拖拽手柄 */}
                <div className="crop-handle crop-h" style={{ top: `${selectedImage.crop.top}%` }} onMouseDown={(e) => startCropDrag('top', e)} />
                <div className="crop-handle crop-h" style={{ bottom: `${selectedImage.crop.bottom}%` }} onMouseDown={(e) => startCropDrag('bottom', e)} />
                <div className="crop-handle crop-v" style={{ left: `${selectedImage.crop.left}%` }} onMouseDown={(e) => startCropDrag('left', e)} />
                <div className="crop-handle crop-v" style={{ right: `${selectedImage.crop.right}%` }} onMouseDown={(e) => startCropDrag('right', e)} />
              </div>
              <div className="crop-actions">
                <button onClick={() => { if (selectedId) setImages((prev) => prev.map((i) => i.id === selectedId ? { ...i, crop: { top: 0, right: 0, bottom: 0, left: 0 } } : i)); }}>重置裁切</button>
                <button className="active" onClick={() => setCropMode(false)}>完成裁切</button>
              </div>
            </div>
          ) : (
            <div className="canvas-wrap">
              <canvas ref={canvasRef} onMouseDown={onCanvasMouseDown} onDoubleClick={onCanvasDoubleClick} style={{ cursor: 'crosshair', maxWidth: '100%', height: 'auto', willChange: 'transform' }} />
            </div>
          )}
          <p className="tip">画布尺寸：{metrics.width} × {metrics.height}</p>
        </section>

        {/* 右：设置 */}
        <aside className="panel">
          <h2>设置与导出</h2>

          <div className="field">
            <label>拼接方向</label>
            <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
              <option value="vertical">纵向</option>
              <option value="horizontal">横向</option>
            </select>
          </div>
          <div className="field">
            <label>对齐方式</label>
            <select value={align} onChange={(e) => setAlign(e.target.value as Align)}>
              <option value="start">起始对齐</option>
              <option value="center">居中</option>
              <option value="end">末端对齐</option>
            </select>
          </div>
          <div className="field">
            <label>间距：{gap}px</label>
            <div className="row-btn">
              {[0, 4, 8, 16, 32, 64].map((v) => (
                <button key={v} className={gap === v ? 'active' : ''} onClick={() => setGap(v)}>{v === 0 ? '无' : v}</button>
              ))}
            </div>
            <DragInput type="range" min={0} max={120} value={gap} onValueChange={setGap} />
          </div>
          <div className="field">
            <label>背景色</label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
          </div>

          <h3>文字</h3>
          <button onClick={addText} style={{ marginBottom: 8 }}>+ 添加文字</button>
          <ul className="text-list">
            {texts.map((t) => (
              <li key={t.id} className={t.id === selectedTextId ? 'selected' : ''} onClick={() => { setSelectedTextId(t.id); setSelectedId(null) }}>
                <div className="text-item-head">
                  <textarea rows={2} value={t.text} onClick={(e) => e.stopPropagation()} onChange={(e) => updateText(t.id, { text: e.target.value })} />
                  <button onClick={(e) => { e.stopPropagation(); removeText(t.id) }}>✕</button>
                </div>
                {t.id === selectedTextId && (
                  <div className="text-item-tools">
                    <div className="field two">
                      <div>
                        <label>字号</label>
                        <DragInput type="number" min={10} max={240} value={t.fontSize} onValueChange={(v) => updateText(t.id, { fontSize: v })} />
                      </div>
                      <div>
                        <label>颜色</label>
                        <input type="color" value={t.color} onChange={(e) => updateText(t.id, { color: e.target.value })} />
                      </div>
                    </div>
                    <div className="field">
                      <label>边距：{t.padding}px</label>
                      <DragInput type="range" min={0} max={200} value={t.padding} onValueChange={(v) => updateText(t.id, { padding: v })} />
                    </div>
                    <p className="tip">拖拽文字调整位置，吸附时自动留出边距</p>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="field">
            <label>预览质量：{maxPreviewWidth}px</label>
            <DragInput type="range" min={400} max={3000} step={100} value={maxPreviewWidth} resetValue={DEFAULT_PREVIEW_WIDTH} onValueChange={setMaxPreviewWidth} />
          </div>

          <h3>导出</h3>
          <div className="field">
            <label>导出倍率</label>
            <select value={exportScale} onChange={(e) => setExportScale(Number(e.target.value))}>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
            </select>
          </div>
          <div className="field">
            <label>JPEG 质量：{jpgQuality.toFixed(2)}</label>
            <DragInput type="range" min={0.5} max={1} step={0.01} value={jpgQuality} onValueChange={setJpgQuality} />
          </div>
          <div className="export-btns">
            <button disabled={!images.length || isExporting} onClick={() => void exportImage('image/png')}>导出 PNG</button>
            <button disabled={!images.length || isExporting} onClick={() => void exportImage('image/jpeg')}>导出 JPEG</button>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
