let initialized = false

type EffectMode = 'fireworks' | 'hearts' | 'confetti'

let currentMode: EffectMode = (localStorage.getItem('fx:mode') as EffectMode) || 'fireworks'
let enabled = localStorage.getItem('fx:enabled') !== 'false'

export function setEffectMode(mode: EffectMode) {
  currentMode = mode
  localStorage.setItem('fx:mode', mode)
}

export function getEffectMode(): EffectMode {
  return currentMode
}

export function setEffectEnabled(v: boolean) {
  enabled = v
  localStorage.setItem('fx:enabled', String(v))
}

export function getEffectEnabled(): boolean {
  return enabled
}

export function initClickFireworks() {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') return
  initialized = true

  const COLORS = ['#d7698e', '#4caae7', '#6d6e6e', '#c1dcc7']

  let balls: Array<Ball> = []
  let longPressed = false
  let longPressTimer: number | null = null
  let multiplier = 0
  let width = 0
  let height = 0
  let origin = { x: 0, y: 0 }
  let normal = { x: 0, y: 0 }
  let ctx: CanvasRenderingContext2D | null = null

  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.zIndex = '99999'
  canvas.style.position = 'fixed'
  canvas.style.pointerEvents = 'none'
  document.body.appendChild(canvas)

  ctx = canvas.getContext('2d')
  if (!ctx) return
  updateSize()
  window.addEventListener('resize', updateSize, false)
  loop()

  window.addEventListener('mousedown', (e) => {
    if (!enabled) return
    pushBalls(randBetween(10, 20), e.clientX, e.clientY)
    document.body.classList.add('is-pressed')
    longPressTimer = window.setTimeout(() => {
      document.body.classList.add('is-longpress')
      longPressed = true
    }, 500)
  })

  window.addEventListener('mouseup', (e) => {
    if (longPressTimer) window.clearTimeout(longPressTimer)
    if (!enabled) return void document.body.classList.remove('is-pressed')
    if (longPressed) {
      document.body.classList.remove('is-longpress')
      pushBalls(randBetween(50 + Math.ceil(multiplier), 100 + Math.ceil(multiplier)), e.clientX, e.clientY)
      longPressed = false
    }
    document.body.classList.remove('is-pressed')
  })

  function updateSize() {
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    width = window.innerWidth
    height = window.innerHeight
    origin = { x: width / 2, y: height / 2 }
    normal = { x: width / 2, y: height / 2 }
  }

  class Ball {
    x: number
    y: number
    angle: number
    multiplier: number
    vx: number
    vy: number
    r: number
    color: string
    constructor(x = origin.x, y = origin.y) {
      this.x = x
      this.y = y
      this.angle = Math.PI * 2 * Math.random()
      this.multiplier = longPressed ? randBetween(14 + multiplier, 15 + multiplier) : randBetween(6, 12)
      this.vx = (this.multiplier + Math.random() * 0.5) * Math.cos(this.angle)
      this.vy = (this.multiplier + Math.random() * 0.5) * Math.sin(this.angle)
      this.r = randBetween(8, 12) + 3 * Math.random()
      this.color = COLORS[(Math.random() * COLORS.length) | 0]
    }
    update() {
      this.x += this.vx - normal.x
      this.y += this.vy - normal.y
      normal.x = (-2 / window.innerWidth) * Math.sin(this.angle)
      normal.y = (-2 / window.innerHeight) * Math.cos(this.angle)
      this.r -= 0.3
      this.vx *= 0.9
      this.vy *= 0.9
    }
  }

  function pushBalls(count = 1, x = origin.x, y = origin.y) {
    for (let i = 0; i < count; i++) {
      balls.push(new Ball(x, y))
    }
  }

  function randBetween(min: number, max: number) {
    return Math.floor(Math.random() * max) + min
  }

  function loop() {
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i]
      if (b.r < 0) continue
      ctx.fillStyle = b.color
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2, false)
      ctx.fill()
      b.update()
    }
    if (longPressed) {
      multiplier += 0.2
    } else if (!longPressed && multiplier >= 0) {
      multiplier -= 0.4
    }
    removeBall()
    requestAnimationFrame(loop)
  }

  function removeBall() {
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i]
      if (b.x + b.r < 0 || b.x - b.r > width || b.y + b.r < 0 || b.y - b.r > height || b.r < 0) {
        balls.splice(i, 1)
      }
    }
  }
}


