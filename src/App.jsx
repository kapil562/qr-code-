import { useEffect, useRef, useState, useCallback } from 'react'
import QRCode from 'qrcode'

const QUIET = 4

export default function App() {
  const [startNum, setStartNum] = useState('722279200')
  const [endNum, setEndNum] = useState('722280199')
  const [ms, setMs] = useState('1000')
  const [loop, setLoop] = useState(true)
  const [page, setPage] = useState(0)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')

  const canvasRef = useRef(null)
  const timerRef = useRef(null)

  const start = parseInt(startNum, 10)
  const end = parseInt(endNum, 10)
  const valid = !isNaN(start) && !isNaN(end) && end >= start
  const count = valid ? end - start + 1 : 0

  const current = valid ? start + Math.min(page, count - 1) : start

  // QR draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !valid) return

    const text = String(current)
    QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: 'M',
      margin: QUIET,
      width: 560,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch((e) => setStatus('QR error: ' + e.message))
  }, [current, valid])

  const goTo = useCallback(
    (p) => {
      if (!valid) return
      if (p >= count || p < 0) {
        if (!loop) {
          stopTimer()
          return
        }
        p = ((p % count) + count) % count
      }
      setPage(p)
    },
    [count, loop, valid],
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
    // tick loop
    const tick = () => {
      setPage((p) => {
        let next = p + 1
        if (next >= count) {
          if (!loop) {
            setRunning(false)
            return p
          }
          next = 0
        }
        return next
      })
      timerRef.current = setTimeout(tick, Math.max(50, parseInt(ms, 10) || 1000))
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(tick, Math.max(50, parseInt(ms, 10) || 1000))
  }

  function toggleStart() {
    running ? stopTimer() : startTimer()
  }

  // inputs badlo to reset
  function handleRangeChange(setter, value) {
    setter(value)
    stopTimer()
    setPage(0)
  }

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        running ? stopTimer() : startTimer()
      } else if (e.key === 'ArrowLeft') {
        stopTimer()
        goTo(page - 1)
      } else if (e.key === 'ArrowRight') {
        stopTimer()
        goTo(page + 1)
      } else if (e.key.toLowerCase() === 'f') {
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, page, goTo])

  // cleanup timer
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const progress = valid ? ((page + 1) / count) * 100 : 0

  return (
    <div className="app">
      <div className="bar" style={{ width: `${progress}%` }} />

      <div className="series">{valid ? current : '—'}</div>
      <div className="hint">
        Space = start/stop | ← → = manual | F = fullscreen
      </div>

      <div className="stage">
        <canvas ref={canvasRef} />
      </div>

      {status && <div className="status">{status}</div>}

      <div className="hud">
        <div className="field">
          <label>Series Start</label>
          <input
            type="number"
            value={startNum}
            onChange={(e) => handleRangeChange(setStartNum, e.target.value)}
          />
        </div>
        <div className="field">
          <label>Kahan Tak (End)</label>
          <input
            type="number"
            value={endNum}
            onChange={(e) => handleRangeChange(setEndNum, e.target.value)}
          />
        </div>
        <div className="field">
          <label>Timer (ms)</label>
          <input
            className="small"
            type="number"
            min="50"
            step="50"
            value={ms}
            onChange={(e) => setMs(e.target.value)}
          />
        </div>

        <button className={running ? 'stop' : ''} onClick={toggleStart}>
          {running ? '⏸ Stop' : '▶ Start'}
        </button>
        <button
          className="secondary"
          onClick={() => {
            stopTimer()
            goTo(page - 1)
          }}
        >
          ◀ Prev
        </button>
        <button
          className="secondary"
          onClick={() => {
            stopTimer()
            goTo(page + 1)
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
  )
}
