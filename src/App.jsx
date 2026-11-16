import { useEffect, useRef, useState, useCallback } from 'react'
import QRCode from 'qrcode'

const QUIET = 4
const PAD = 16
const MAX_QR = 640
const MIN_QR = 80

export default function App() {
  const [startNum, setStartNum] = useState('722279200')
  const [endNum, setEndNum] = useState('722280199')
  const [ms, setMs] = useState('1000')
  const [loop, setLoop] = useState(true)
  const [page, setPage] = useState(0)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })

  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const timerRef = useRef(null)
  // refs taaki timer ke andar stale closure na aaye
  const pageRef = useRef(0)
  const loopRef = useRef(loop)
  const msRef = useRef(ms)

  useEffect(() => {
    loopRef.current = loop
  }, [loop])
  useEffect(() => {
    msRef.current = ms
  }, [ms])

  const start = parseInt(startNum, 10)
  const end = parseInt(endNum, 10)
  const valid = !isNaN(start) && !isNaN(end) && end >= start
  const count = valid ? end - start + 1 : 0

  const current = valid ? start + Math.min(page, count - 1) : start

  // stage ka size track karo (responsive QR size ke liye)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || typeof ResizeObserver === 'undefined') return
    const update = () => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      setStageSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }
    const ro = new ResizeObserver(update)
    ro.observe(stage)
    update()
    return () => ro.disconnect()
  }, [])

  // QR draw — viewport ke hisaab se size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !valid || stageSize.w === 0) return
    const size = Math.min(Math.min(stageSize.w, stageSize.h) - PAD, MAX_QR)
    if (size < MIN_QR) return
    QRCode.toCanvas(canvas, String(current), {
      errorCorrectionLevel: 'M',
      margin: QUIET,
      width: Math.round(size),
      color: { dark: '#000000', light: '#ffffff' },
    }).catch((e) => setStatus('QR error: ' + e.message))
  }, [current, valid, stageSize])

  const goTo = useCallback(
    (p) => {
      if (!valid) return
      if (p >= count || p < 0) {
        if (!loopRef.current) {
          stopTimer()
          return
        }
        p = ((p % count) + count) % count
      }
      pageRef.current = p
      setPage(p)
    },
    [count, valid],
  )

  function stopTimer() {
    setRunning(false)
    clearTimeout(timerRef.current)
  }

  function startTimer() {
    if (!valid) {
      setStatus('Series aur End sahi daalo')
      return
    }
    setStatus('')
    setRunning(true)
    // tick loop — pageRef se padho, side-effect updater me mat karo
    const tick = () => {
      let next = pageRef.current + 1
      if (next >= count) {
        if (!loopRef.current) {
          setRunning(false)
          return // yahan ruko, aage schedule mat karo
        }
        next = 0
      }
      pageRef.current = next
      setPage(next)
      const delay = Math.max(50, parseInt(msRef.current, 10) || 1000)
      timerRef.current = setTimeout(tick, delay)
    }
    clearTimeout(timerRef.current)
    const delay = Math.max(50, parseInt(msRef.current, 10) || 1000)
    timerRef.current = setTimeout(tick, delay)
  }

  function toggleStart() {
    running ? stopTimer() : startTimer()
  }

  // inputs badlo to reset
  function handleRangeChange(setter, value) {
    setter(value)
    stopTimer()
    pageRef.current = 0
    setPage(0)
  }

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      // INPUT/BUTTON par chhodo — Space button ka apna click chalayega
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return
      if (e.code === 'Space') {
        e.preventDefault()
        running ? stopTimer() : startTimer()
      } else if (e.key === 'ArrowLeft') {
        stopTimer()
        goTo(pageRef.current - 1)
      } else if (e.key === 'ArrowRight') {
        stopTimer()
        goTo(pageRef.current + 1)
      } else if (e.key.toLowerCase() === 'f') {
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, goTo])

  // cleanup timer
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const progress = valid ? ((page + 1) / count) * 100 : 0

  return (
    <div className="app">
      <div className="bar" style={{ width: `${progress}%` }} />

      <header className="top">
        <div className="series">{valid ? current : '—'}</div>
        <div className="hint">
          Space = start/stop | ← → = manual | F = fullscreen
        </div>
      </header>

      <div className="stage" ref={stageRef}>
        <canvas ref={canvasRef} />
      </div>

      {status && <div className="status">{status}</div>}

      <div className="hud">
        <div className="hud-fields">
          <div className="field">
            <label htmlFor="startInput">Series Start</label>
            <input
              id="startInput"
              type="number"
              inputMode="numeric"
              value={startNum}
              onChange={(e) => handleRangeChange(setStartNum, e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="endInput">Kahan Tak (End)</label>
            <input
              id="endInput"
              type="number"
              inputMode="numeric"
              value={endNum}
              onChange={(e) => handleRangeChange(setEndNum, e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="msInput">Timer (ms)</label>
            <input
              id="msInput"
              className="small"
              type="number"
              inputMode="numeric"
              min="50"
              step="50"
              value={ms}
              onChange={(e) => setMs(e.target.value)}
            />
          </div>
        </div>

        <div className="hud-actions">
          <button className={running ? 'stop' : ''} onClick={toggleStart}>
            {running ? '⏸ Stop' : '▶ Start'}
          </button>
          <button
            className="secondary"
            onClick={() => {
              stopTimer()
              goTo(pageRef.current - 1)
            }}
          >
            ◀ Prev
          </button>
          <button
            className="secondary"
            onClick={() => {
              stopTimer()
              goTo(pageRef.current + 1)
            }}
          >
            Next ▶
          </button>

          <label className="chk">
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
            />
            Loop
          </label>

          <div className="pageInfo">
            {valid ? `Page ${page + 1} / ${count}` : 'Page — / —'}
          </div>
        </div>
      </div>
    </div>
  )
}
