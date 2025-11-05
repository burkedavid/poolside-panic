import Phaser from 'phaser'

// Main Game Scene
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // Game state
    this.score = 0
    this.strikes = 5 // Generous! Players get 5 hearts
    this.level = 1 // Level system!
    this.itemsOnLine = 0 // Track items on washing line
    this.maxItemsPerLevel = 5 // Items needed to level up
    this.windSpeed = 2 // Start with VERY low wind!
    this.windDirection = 1 // 1 = right, -1 = left
    this.windIntensity = 0.3 // Start LOW for beginners
    this.isPowering = false
    this.power = 0
    this.laundryInFlight = null
    this.successfulHangs = 0
    this.hangedItems = [] // Track items on line for level system

    // Flick mechanic variables
    this.flickStartY = 0
    this.flickStartTime = 0
    this.flickStartX = 0

    // NEW: Viral game mechanics
    this.combo = 0
    this.maxCombo = 0
    this.multiplier = 1
    this.perfectThrows = 0
    this.totalThrows = 0
    this.stars = 0 // Star rating system
    this.highScore = parseInt(localStorage.getItem('unclePaulHighScore') || '0')
    this.achievements = JSON.parse(localStorage.getItem('unclePaulAchievements') || '[]')
    this.showTutorial = !localStorage.getItem('unclePaulTutorialSeen')

    // Wind particles array
    this.windParticlesActive = []

    // Create scene elements
    this.createBackground()
    this.createAnimatedClouds()
    this.createPool()
    this.createUnclePaul()
    this.createWashingLine()
    this.createLaundryBasket()
    this.createUI()
    this.createPowerMeter()
    this.createWindParticles()

    // Setup input
    this.setupInput()

    // Randomize initial wind
    this.updateWind()

    // Start continuous wind animation
    this.startDynamicWind()

    // Create continuous wind particles
    this.createContinuousWindParticles()

    // Show tutorial on first play
    if (this.showTutorial) {
      this.showTutorialOverlay()
    }
  }

  startDynamicWind() {
    // Wind oscillates naturally like real weather - STARTS SUPER EASY!
    this.time.addEvent({
      delay: 100,
      callback: () => {
        // Level-based wind system - gets harder as you level up
        const levelDifficulty = (this.level - 1) * 0.15 // Increases by 0.15 per level

        // Wind intensity oscillates smoothly - range grows with level
        // Level 1: 0.1 to 0.5 (SUPER EASY!)
        // Level 2: 0.25 to 0.65
        // Level 3: 0.4 to 0.8, etc.
        const minIntensity = Math.min(0.1 + levelDifficulty, 0.6)
        const maxIntensity = Math.min(0.5 + levelDifficulty, 0.95)
        const range = (maxIntensity - minIntensity) / 2
        const center = minIntensity + range

        // Slower oscillation for Level 1, faster as you progress
        const oscillationSpeed = 3500 - (this.level * 200) // Slows down as levels increase
        this.windIntensity = center + Math.sin(this.time.now / oscillationSpeed) * range

        // Direction changes based on level (more frequent at higher levels)
        const directionChance = Math.max(400 - (this.level * 30), 200)
        if (Phaser.Math.Between(0, directionChance) === 0) {
          this.windDirection = -this.windDirection
          this.showWindGust()
        }

        // Level-based wind speed
        const baseWind = Math.max(1, 0.5 + (this.level * 1.5)) // Very low at start!
        const additionalWind = 4 + (this.level * 2) // Scales with level

        this.windSpeed = baseWind + (this.windIntensity * additionalWind)

        this.updateWindDisplay()
      },
      loop: true
    })
  }

  createContinuousWindParticles() {
    // Continuously show wind particles
    this.time.addEvent({
      delay: 150,
      callback: () => {
        // Number of particles based on wind intensity
        const particleCount = Math.floor(this.windIntensity * 5) + 2

        for (let i = 0; i < particleCount; i++) {
          const particle = this.add.graphics()
          const startX = Phaser.Math.Between(-20, 380)
          const startY = Phaser.Math.Between(200, 600)

          // Different particle types for variety
          const particleType = Phaser.Math.Between(0, 2)

          if (particleType === 0) {
            // Leaf
            particle.fillStyle(0x90EE90, 0.7)
            particle.fillEllipse(0, 0, 6, 10)
          } else if (particleType === 1) {
            // Dust
            particle.fillStyle(0xD2B48C, 0.5)
            particle.fillCircle(0, 0, 3)
          } else {
            // Wind streak
            particle.lineStyle(2, 0xFFFFFF, 0.4)
            particle.lineBetween(0, 0, 15 * this.windDirection, 0)
          }

          particle.x = startX
          particle.y = startY
          particle.setDepth(5)

          const distance = this.windIntensity * 150 + 50
          const duration = 1200 - (this.windIntensity * 400)

          this.tweens.add({
            targets: particle,
            x: startX + (this.windDirection * distance),
            y: startY + Phaser.Math.Between(-40, 40),
            alpha: 0,
            rotation: Phaser.Math.FloatBetween(-Math.PI, Math.PI),
            duration: duration,
            ease: 'Sine.easeOut',
            onComplete: () => particle.destroy()
          })

          this.windParticlesActive.push(particle)
        }

        // Clean up old particles
        this.windParticlesActive = this.windParticlesActive.filter(p => p.scene)
      },
      loop: true
    })
  }

  createBackground() {
    // Realistic sky with gradient layers
    const sky = this.add.graphics()

    // Multi-layer sky gradient for depth
    for (let i = 0; i < 200; i++) {
      const alpha = 1
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 135, g: 206, b: 235 },  // Sky blue
        { r: 224, g: 246, b: 255 },  // Light blue
        200, i
      )
      sky.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), alpha)
      sky.fillRect(0, i, 360, 1)
    }

    // Sun
    const sun = this.add.graphics()
    // Sun glow
    for (let i = 0; i < 8; i++) {
      sun.fillStyle(0xFFFF99, 0.05 - i * 0.005)
      sun.fillCircle(300, 60, 40 + i * 5)
    }
    sun.fillStyle(0xFFFFAA, 1)
    sun.fillCircle(300, 60, 25)
    sun.fillStyle(0xFFFFDD, 0.8)
    sun.fillCircle(298, 58, 20)

    // Distant hills with atmospheric perspective
    const hills = this.add.graphics()
    hills.fillStyle(0x8BA888, 0.4)
    hills.beginPath()
    hills.moveTo(0, 180)

    // Create smooth hills using lineTo with multiple points
    const hillPoints = [
      {x: 0, y: 180},
      {x: 60, y: 150},
      {x: 120, y: 165},
      {x: 180, y: 155},
      {x: 240, y: 170},
      {x: 300, y: 160},
      {x: 360, y: 175}
    ]

    for (let i = 1; i < hillPoints.length; i++) {
      hills.lineTo(hillPoints[i].x, hillPoints[i].y)
    }

    hills.lineTo(360, 200)
    hills.lineTo(0, 200)
    hills.closePath()
    hills.fillPath()

    // Villa wall with realistic stucco texture
    const wall = this.add.graphics()

    // Base wall color with gradient
    for (let i = 0; i < 300; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 250, b: 230 },  // Top - lighter
        { r: 245, g: 238, b: 210 },  // Bottom - darker
        300, i
      )
      wall.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      wall.fillRect(0, 200 + i, 360, 1)
    }

    // Stucco texture effect
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, 360)
      const y = Phaser.Math.Between(200, 500)
      const size = Phaser.Math.Between(1, 3)
      const alpha = Phaser.Math.FloatBetween(0.05, 0.15)
      wall.fillStyle(0x000000, alpha)
      wall.fillCircle(x, y, size)
    }

    // Window recesses (shadows)
    wall.fillStyle(0x000000, 0.2)
    wall.fillRect(27, 237, 66, 86)
    wall.fillRect(267, 237, 66, 86)

    // Window glass with realistic reflections
    const windowGradient = this.add.graphics()

    // Left window
    for (let i = 0; i < 80; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 135, g: 206, b: 250 },  // Sky reflection
        { r: 70, g: 130, b: 180 },   // Darker blue
        80, i
      )
      windowGradient.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.8)
      windowGradient.fillRect(30, 240 + i, 60, 1)
    }

    // Right window
    for (let i = 0; i < 80; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 135, g: 206, b: 250 },
        { r: 70, g: 130, b: 180 },
        80, i
      )
      windowGradient.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.8)
      windowGradient.fillRect(270, 240 + i, 60, 1)
    }

    // Window highlights (sun reflection)
    windowGradient.fillStyle(0xFFFFFF, 0.4)
    windowGradient.fillRect(33, 243, 25, 15)
    windowGradient.fillRect(273, 243, 25, 15)

    // Detailed window frames with depth
    wall.lineStyle(6, 0x8B4513, 1)
    wall.strokeRect(30, 240, 60, 80)
    wall.strokeRect(270, 240, 60, 80)

    // Inner frame detail
    wall.lineStyle(3, 0xA0522D, 1)
    wall.strokeRect(33, 243, 54, 74)
    wall.strokeRect(273, 243, 54, 74)

    // Window dividers
    wall.lineStyle(4, 0x8B4513, 1)
    wall.lineBetween(60, 240, 60, 320)
    wall.lineBetween(300, 240, 300, 320)
    wall.lineBetween(30, 280, 90, 280)
    wall.lineBetween(270, 280, 330, 280)

    // Realistic terracotta patio with depth
    const ground = this.add.graphics()

    // Patio gradient
    for (let i = 0; i < 240; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 210, g: 180, b: 140 },  // Top
        { r: 180, g: 140, b: 100 },  // Bottom (darker)
        240, i
      )
      ground.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      ground.fillRect(0, 500 + i, 360, 1)
    }

    // Realistic tile pattern with grout
    ground.lineStyle(3, 0x9B8B7E, 1)
    for (let x = 0; x < 360; x += 45) {
      ground.lineBetween(x, 500, x, 740)
    }
    for (let y = 500; y < 740; y += 45) {
      ground.lineBetween(0, y, 360, y)
    }

    // Tile texture and wear
    for (let tx = 0; tx < 360; tx += 45) {
      for (let ty = 500; ty < 740; ty += 45) {
        // Random wear patterns
        for (let i = 0; i < 15; i++) {
          const xOffset = Phaser.Math.Between(2, 42)
          const yOffset = Phaser.Math.Between(2, 42)
          ground.fillStyle(0x000000, Phaser.Math.FloatBetween(0.02, 0.08))
          ground.fillCircle(tx + xOffset, ty + yOffset, Phaser.Math.Between(1, 4))
        }

        // Highlight spots
        for (let i = 0; i < 5; i++) {
          const xOffset = Phaser.Math.Between(5, 40)
          const yOffset = Phaser.Math.Between(5, 40)
          ground.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.03, 0.08))
          ground.fillCircle(tx + xOffset, ty + yOffset, Phaser.Math.Between(2, 5))
        }
      }
    }

    // Add some plants/foliage
    const plants = this.add.graphics()

    // Left potted plant
    plants.fillStyle(0x8B4513, 1)
    plants.fillRect(5, 520, 30, 35) // Pot
    plants.fillStyle(0xA0522D, 1)
    plants.fillRect(8, 523, 24, 3) // Pot rim

    // Plant leaves
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      plants.fillStyle(0x228B22, 0.8)
      plants.fillEllipse(20 + Math.cos(angle) * 12, 515 + Math.sin(angle) * 10, 15, 8)
      plants.fillStyle(0x32CD32, 0.6)
      plants.fillEllipse(20 + Math.cos(angle) * 10, 515 + Math.sin(angle) * 8, 10, 6)
    }
  }

  createAnimatedClouds() {
    // Create fluffy animated clouds
    this.clouds = []
    for (let i = 0; i < 4; i++) {
      const cloud = this.add.graphics()
      const startX = Phaser.Math.Between(-50, 360)
      const y = Phaser.Math.Between(40, 120)

      // Draw fluffy cloud
      cloud.fillStyle(0xFFFFFF, 0.7)
      cloud.fillCircle(0, 0, 25)
      cloud.fillCircle(20, -5, 20)
      cloud.fillCircle(-20, -5, 20)
      cloud.fillCircle(10, 5, 18)
      cloud.fillCircle(-10, 5, 18)

      cloud.x = startX
      cloud.y = y
      cloud.setDepth(-1)

      this.clouds.push(cloud)

      // Animate cloud movement
      this.tweens.add({
        targets: cloud,
        x: 410,
        duration: Phaser.Math.Between(30000, 50000),
        repeat: -1,
        onRepeat: () => {
          cloud.x = -50
          cloud.y = Phaser.Math.Between(40, 120)
        }
      })
    }
  }

  createWindParticles() {
    // Wind particle system
    this.windParticles = []
  }

  showWindGust() {
    // Visual wind effect
    const particleCount = 15
    for (let i = 0; i < particleCount; i++) {
      const particle = this.add.graphics()
      particle.lineStyle(2, 0xFFFFFF, 0.6)
      const startX = Phaser.Math.Between(0, 360)
      const startY = Phaser.Math.Between(200, 500)

      particle.lineBetween(0, 0, 20, 0)
      particle.x = startX
      particle.y = startY

      const direction = this.windDirection
      this.tweens.add({
        targets: particle,
        x: startX + direction * Phaser.Math.Between(100, 200),
        y: startY + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      })
    }
  }

  createPool() {
    const pool = this.add.graphics()

    // Pool outer edge (stone coping)
    pool.fillStyle(0xB8A896, 1)
    pool.fillRoundedRect(15, 575, 330, 130, 12)

    // Pool inner edge shadow
    pool.fillStyle(0x000000, 0.3)
    pool.fillRoundedRect(20, 580, 320, 120, 10)

    // Realistic water with depth gradient
    for (let i = 0; i < 120; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 64, g: 164, b: 223 },   // Light turquoise at top
        { r: 25, g: 102, b: 153 },   // Deep blue at bottom
        120, i
      )
      pool.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.95)
      pool.fillRoundedRect(20, 580 + i, 320, 1, 10)
    }

    // Water caustics effect (light patterns)
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(25, 335)
      const y = Phaser.Math.Between(585, 695)
      const size = Phaser.Math.Between(8, 20)
      pool.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.05, 0.15))
      pool.fillEllipse(x, y, size, size * 0.6)
    }

    // Surface reflection (sky)
    const reflection = this.add.graphics()
    reflection.fillStyle(0xFFFFFF, 0.3)
    reflection.fillEllipse(80, 605, 120, 40)
    reflection.fillStyle(0xFFFFFF, 0.2)
    reflection.fillEllipse(200, 615, 100, 35)

    // Animated water shimmer
    this.tweens.add({
      targets: reflection,
      alpha: 0.6,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Pool tiles on sides (visible through water)
    pool.lineStyle(2, 0x4DB8E8, 0.4)
    for (let i = 585; i < 695; i += 15) {
      pool.lineBetween(25, i, 335, i)
    }
    for (let i = 25; i < 335; i += 15) {
      pool.lineBetween(i, 585, i, 695)
    }

    // Chrome ladder with realistic metallic shine
    const ladder = this.add.graphics()

    // Ladder shadow
    ladder.fillStyle(0x000000, 0.3)
    ladder.fillRect(313, 598, 24, 64)

    // Ladder rails (chrome effect with gradient)
    for (let i = 0; i < 4; i++) {
      ladder.lineStyle(6 - i, Phaser.Display.Color.GetColor(200 + i * 10, 200 + i * 10, 200 + i * 10), 1)
      ladder.strokeRect(315, 600, 3, 60)
      ladder.strokeRect(332, 600, 3, 60)
    }

    // Ladder rungs with shine
    for (let i = 0; i < 3; i++) {
      const y = 615 + i * 20
      ladder.lineStyle(4, 0xC0C0C0, 1)
      ladder.lineBetween(315, y, 335, y)
      ladder.lineStyle(2, 0xFFFFFF, 0.8)
      ladder.lineBetween(315, y - 1, 335, y - 1)
    }

    // Pool coping texture
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(18, 342)
      const y = Phaser.Math.Between(577, 703)
      const isInWater = x > 22 && x < 338 && y > 582 && y < 698

      if (!isInWater) {
        pool.fillStyle(0x000000, Phaser.Math.FloatBetween(0.05, 0.15))
        pool.fillCircle(x, y, Phaser.Math.Between(1, 2))
      }
    }

    // Store pool collision zone
    this.poolZone = this.add.zone(180, 640, 320, 120)
    this.physics.add.existing(this.poolZone, true)
  }

  createUnclePaul() {
    const unclePaul = this.add.container(280, 430)

    // Shadow underneath Uncle Paul
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.3)
    shadow.fillEllipse(0, 95, 50, 15)

    // Legs (clean skin tone)
    const leftLeg = this.add.graphics()
    leftLeg.fillStyle(0xFFDBAC, 1)
    leftLeg.fillRoundedRect(-15, 50, 13, 45, 3)
    // Subtle shading on left
    leftLeg.fillStyle(0x000000, 0.08)
    leftLeg.fillRect(-15, 50, 3, 45)

    const rightLeg = this.add.graphics()
    rightLeg.fillStyle(0xFFDBAC, 1)
    rightLeg.fillRoundedRect(3, 50, 13, 45, 3)
    // Subtle highlight on right
    rightLeg.fillStyle(0xFFFFFF, 0.1)
    rightLeg.fillRect(13, 50, 3, 45)

    // Feet with sandals
    const feet = this.add.graphics()
    feet.fillStyle(0x8B4513, 1)
    feet.fillEllipse(-9, 93, 15, 8)
    feet.fillEllipse(9, 93, 15, 8)
    feet.fillStyle(0xA0522D, 0.8)
    feet.fillRect(-12, 92, 5, 3)
    feet.fillRect(7, 92, 5, 3)

    // Shorts (clean blue)
    const shorts = this.add.graphics()
    shorts.fillStyle(0x4169E1, 1)
    shorts.fillRoundedRect(-22, 20, 44, 32, 3)

    // Shorts shading
    shorts.fillStyle(0x000000, 0.1)
    shorts.fillRect(-22, 20, 8, 32)
    shorts.fillStyle(0xFFFFFF, 0.1)
    shorts.fillRect(14, 20, 8, 32)

    // Waistband
    shorts.fillStyle(0x2F4F8F, 1)
    shorts.fillRect(-22, 20, 44, 4)

    // Shirt (bright yellow)
    const shirt = this.add.graphics()
    shirt.fillStyle(0xFFDC00, 1)
    shirt.fillEllipse(0, 0, 52, 60)

    // Shirt collar (V-neck)
    shirt.fillStyle(0xFFDC00, 1)
    shirt.beginPath()
    shirt.moveTo(-15, -50)
    shirt.lineTo(-8, -40)
    shirt.lineTo(-3, -48)
    shirt.closePath()
    shirt.fillPath()

    shirt.beginPath()
    shirt.moveTo(15, -50)
    shirt.lineTo(8, -40)
    shirt.lineTo(3, -48)
    shirt.closePath()
    shirt.fillPath()

    // Tropical flower pattern on shirt
    shirt.fillStyle(0xFF4444, 0.7)
    shirt.fillCircle(-15, -10, 5)
    shirt.fillCircle(12, 5, 5)
    shirt.fillStyle(0xFF6B6B, 0.5)
    shirt.fillCircle(-15, -10, 3)
    shirt.fillCircle(12, 5, 3)

    // Subtle shirt shading
    shirt.fillStyle(0x000000, 0.08)
    shirt.fillEllipse(-18, 0, 12, 50)

    // Arms (clean skin tone)
    const leftArm = this.add.graphics()
    leftArm.fillStyle(0xFFDBAC, 1)
    leftArm.fillEllipse(-28, 0, 12, 55)
    leftArm.fillStyle(0x000000, 0.08)
    leftArm.fillEllipse(-32, 0, 6, 50)

    const rightArm = this.add.graphics()
    rightArm.fillStyle(0xFFDBAC, 1)
    rightArm.fillEllipse(28, 0, 12, 55)
    rightArm.fillStyle(0xFFFFFF, 0.1)
    rightArm.fillEllipse(32, 0, 6, 50)

    // Hands
    const hands = this.add.graphics()
    hands.fillStyle(0xFFDBAC, 1)
    hands.fillCircle(-28, 28, 7)
    hands.fillCircle(28, 28, 7)

    // Head - CLEAN AND SIMPLE!
    const head = this.add.graphics()

    // Neck
    head.fillStyle(0xFFDBAC, 1)
    head.fillRect(-8, -42, 16, 15)

    // Main head shape - clean, solid color
    head.fillStyle(0xFFDBAC, 1)
    head.fillCircle(0, -60, 28)

    // Simple cheek shading for depth
    head.fillStyle(0xFFB6C1, 0.3)
    head.fillCircle(-12, -55, 8)
    head.fillCircle(12, -55, 8)

    // Ears - simple and clean
    head.fillStyle(0xFFDBAC, 1)
    head.fillEllipse(-26, -58, 10, 14)
    head.fillEllipse(26, -58, 10, 14)

    // Inner ear detail (minimal)
    head.fillStyle(0xE6BEAA, 1)
    head.fillEllipse(-26, -58, 5, 8)
    head.fillEllipse(26, -58, 5, 8)

    // Hair - CLEAN, DEFINED, MODERN
    head.fillStyle(0x4A2511, 1)

    // Back/top of hair - solid, clean shape
    head.fillEllipse(0, -78, 30, 22)

    // Side hair (defined edges)
    head.fillEllipse(-18, -72, 14, 18)
    head.fillEllipse(18, -72, 14, 18)

    // Front hair sweep - clean, styled
    head.fillEllipse(0, -85, 24, 12)
    head.fillEllipse(10, -88, 16, 10)

    // Hair highlight for dimension (subtle)
    head.fillStyle(0x6B3410, 0.6)
    head.fillEllipse(6, -82, 18, 10)

    // Eyebrows - clean, natural
    head.fillStyle(0x4A2511, 1)
    head.fillEllipse(-12, -67, 10, 3)
    head.fillEllipse(12, -67, 10, 3)

    // Eyes - WHITE BACKGROUND (NO DARK MASK!)
    head.fillStyle(0xFFFFFF, 1)
    head.fillEllipse(-12, -60, 10, 8)
    head.fillEllipse(12, -60, 10, 8)

    // Irises - friendly brown
    head.fillStyle(0x6B4423, 1)
    head.fillCircle(-12, -60, 4)
    head.fillCircle(12, -60, 4)

    // Pupils
    head.fillStyle(0x000000, 1)
    head.fillCircle(-12, -60, 2.5)
    head.fillCircle(12, -60, 2.5)

    // Eye sparkle
    head.fillStyle(0xFFFFFF, 0.9)
    head.fillCircle(-11, -61, 1.5)
    head.fillCircle(13, -61, 1.5)

    // Simple eyelids (thin lines)
    head.lineStyle(2, 0x4A2511, 1)
    head.beginPath()
    head.arc(-12, -60, 5, -Math.PI, 0, true)
    head.strokePath()
    head.beginPath()
    head.arc(12, -60, 5, -Math.PI, 0, true)
    head.strokePath()

    // Nose - simple and clean
    head.fillStyle(0xFFB6C1, 0.4)
    head.fillEllipse(0, -52, 8, 10)

    // Nostrils (subtle)
    head.fillStyle(0x000000, 0.3)
    head.fillCircle(-2, -48, 1.5)
    head.fillCircle(2, -48, 1.5)

    // Friendly smile
    head.lineStyle(3, 0x8B4513, 1)
    head.beginPath()
    head.arc(0, -44, 12, 0.2, Math.PI - 0.2, false)
    head.strokePath()

    // Teeth
    head.fillStyle(0xFFFFFF, 1)
    head.beginPath()
    head.arc(0, -44, 11, 0.3, Math.PI - 0.3, false)
    head.lineTo(-8, -44)
    head.closePath()
    head.fillPath()

    // Add all parts to container (order matters for layering)
    unclePaul.add([shadow, feet, leftLeg, rightLeg, shorts, leftArm, shirt, rightArm, hands, head])

    this.unclePaul = unclePaul

    // Gentle idle animation
    this.tweens.add({
      targets: unclePaul,
      y: 428,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  createWashingLine() {
    // Washing line poles
    const leftPole = this.add.graphics()
    leftPole.fillStyle(0x8B4513, 1)
    leftPole.fillRect(45, 250, 10, 200)

    const rightPole = this.add.graphics()
    rightPole.fillStyle(0x8B4513, 1)
    rightPole.fillRect(305, 250, 10, 200)

    // Washing line (the target)
    const line = this.add.graphics()
    line.lineStyle(4, 0x696969, 1)
    line.lineBetween(55, 280, 310, 280)

    // Create collision zone for the washing line (HUGE zone for easy start!)
    this.washingLineZone = this.add.zone(180, 280, 280, 100)
    this.physics.add.existing(this.washingLineZone, true)

    // Pegs on the line
    for (let i = 70; i < 300; i += 40) {
      const peg = this.add.graphics()
      peg.fillStyle(0xD2691E, 1)
      peg.fillRect(i, 275, 6, 15)
    }

    this.washingLine = line
  }

  createLaundryBasket() {
    const basket = this.add.graphics()

    // Basket body (wicker brown)
    basket.fillStyle(0xD2691E, 1)
    basket.fillRect(30, 520, 80, 50)

    // Basket weave pattern
    basket.lineStyle(2, 0xA0522D, 0.8)
    for (let i = 0; i < 50; i += 8) {
      basket.lineBetween(30, 520 + i, 110, 520 + i)
    }
    for (let i = 0; i < 80; i += 10) {
      basket.lineBetween(30 + i, 520, 30 + i, 570)
    }

    // Basket handles
    basket.lineStyle(4, 0xD2691E, 1)
    basket.strokeRect(30, 520, 80, 50)
    basket.beginPath()
    basket.arc(40, 520, 10, Math.PI, 0, true)
    basket.strokePath()
    basket.beginPath()
    basket.arc(100, 520, 10, Math.PI, 0, true)
    basket.strokePath()

    this.laundryBasket = basket
  }

  createUI() {
    // Score text with high score
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '28px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    })

    // High score indicator
    this.highScoreText = this.add.text(20, 55, `Best: ${this.highScore}`, {
      fontSize: '18px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    })

    // Hearts/Strikes (5 lives!) - moved up to top right
    this.heartsText = this.add.text(360, 20, '❤️❤️❤️❤️❤️', {
      fontSize: '24px',
      fontFamily: 'Arial'
    }).setOrigin(1, 0)

    // Level display (moved down to avoid overlap with score)
    this.levelText = this.add.text(180, 130, 'LEVEL 1', {
      fontSize: '32px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5, 0)

    // Items on line counter (moved down with level)
    this.itemsOnLineText = this.add.text(180, 165, '0/5 on line', {
      fontSize: '18px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0)

    // Combo display (initially hidden)
    this.comboText = this.add.text(180, 100, '', {
      fontSize: '36px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FF69B4',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0)

    // Multiplier display
    this.multiplierText = this.add.text(360, 55, '', {
      fontSize: '22px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0)

    // Wind indicator with enhanced styling
    this.windText = this.add.text(20, 90, '', {
      fontSize: '22px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    })

    // Wind intensity meter
    this.windMeter = this.add.graphics()

    // Stars display (moved to avoid overlap with level text)
    this.starsText = this.add.text(360, 90, '', {
      fontSize: '20px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0)

    // Perfect throw indicator (hidden)
    this.perfectText = this.add.text(180, 280, 'PERFECT!', {
      fontSize: '48px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#FF1493',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0)

    this.updateWindDisplay()
    this.updateStarsDisplay()
  }

  updateStarsDisplay() {
    this.starsText.setText(`★ ${this.stars}`)
  }

  createPowerMeter() {
    // Power meter background
    this.powerMeterBg = this.add.graphics()
    this.powerMeterBg.fillStyle(0x333333, 0.8)
    this.powerMeterBg.fillRoundedRect(30, 680, 300, 30, 5)

    // Power meter fill
    this.powerMeterFill = this.add.graphics()

    // Instruction text
    this.instructionText = this.add.text(180, 695, 'HOLD, THEN FLICK UP!', {
      fontSize: '16px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFF00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
  }

  setupInput() {
    // Touch/Mouse input with flick detection
    this.input.on('pointerdown', this.startPowering, this)
    this.input.on('pointerup', this.releaseLaundry, this)
    this.input.on('pointermove', this.onPointerMove, this)
  }

  startPowering(pointer) {
    if (this.laundryInFlight) return

    this.isPowering = true
    this.power = 0
    this.flickStartY = pointer.y
    this.flickStartX = pointer.x
    this.flickStartTime = this.time.now
  }

  onPointerMove(pointer) {
    if (!this.isPowering) return

    // Track the movement for flick detection
    this.lastPointerY = pointer.y
    this.lastPointerX = pointer.x
    this.lastPointerTime = this.time.now
  }

  releaseLaundry(pointer) {
    if (!this.isPowering) return
    if (this.power < 10) {
      this.isPowering = false
      return
    }

    this.isPowering = false

    // Calculate flick velocity and direction
    const flickTime = this.time.now - this.flickStartTime
    const flickDistanceY = this.flickStartY - pointer.y
    const flickDistanceX = pointer.x - this.flickStartX

    // More forgiving flick detection - easier to trigger
    const flickSpeed = flickDistanceY / Math.max(flickTime, 1)
    const isValidFlick = flickDistanceY > 20 && flickSpeed > 0.03

    if (isValidFlick) {
      // Calculate angle based on horizontal movement during flick
      const flickAngle = Math.atan2(flickDistanceY, flickDistanceX)
      this.throwLaundry(flickSpeed, flickAngle)
    } else {
      // Reset if flick wasn't good enough
      this.power = 0
      this.powerMeterFill.clear()

      // Show feedback
      const feedbackText = this.add.text(180, 400, 'FLICK UP!', {
        fontSize: '32px',
        fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5)

      this.tweens.add({
        targets: feedbackText,
        y: 350,
        alpha: 0,
        duration: 800,
        onComplete: () => feedbackText.destroy()
      })
    }
  }

  throwLaundry(flickSpeed, flickAngle) {
    // Always create realistic pants/trousers
    const pantsColors = [
      [0x1E3A8A, 0x1E293B], // Dark blue jeans
      [0x475569, 0x1E293B], // Gray pants
      [0x78350F, 0x431407], // Brown chinos
      [0x000000, 0x1F2937], // Black dress pants
      [0x3B82F6, 0x1E40AF]  // Light blue denim
    ]

    const colorPair = Phaser.Utils.Array.GetRandom(pantsColors)
    const baseColor = colorPair[0]
    const shadowColor = colorPair[1]

    const laundry = this.add.graphics()

    // Draw realistic pants/trousers
    // Waistband
    laundry.fillStyle(shadowColor, 1)
    laundry.fillRect(-20, -25, 40, 6)

    // Belt loops
    laundry.fillStyle(shadowColor, 0.8)
    for (let i = -15; i <= 15; i += 10) {
      laundry.fillRect(i - 1, -25, 2, 4)
    }

    // Left leg with realistic gradient
    for (let i = 0; i < 45; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(baseColor),
        Phaser.Display.Color.ValueToColor(shadowColor),
        45, i
      )
      laundry.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      laundry.fillRect(-20, -19 + i, 18, 1)
    }

    // Right leg with realistic gradient
    for (let i = 0; i < 45; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(baseColor),
        Phaser.Display.Color.ValueToColor(shadowColor),
        45, i
      )
      laundry.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      laundry.fillRect(2, -19 + i, 18, 1)
    }

    // Denim texture and stitching
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(-19, 19)
      const y = Phaser.Math.Between(-24, 25)
      laundry.fillStyle(0x000000, Phaser.Math.FloatBetween(0.03, 0.12))
      laundry.fillCircle(x, y, 0.5)
    }

    // Seams (center and sides)
    laundry.lineStyle(1.5, shadowColor, 0.6)
    laundry.lineBetween(-20, -19, -20, 26) // Left outer seam
    laundry.lineBetween(20, -19, 20, 26)   // Right outer seam
    laundry.lineBetween(-2, -19, -2, 26)   // Left inner seam
    laundry.lineBetween(2, -19, 2, 26)     // Right inner seam

    // Decorative stitching (like jeans)
    laundry.lineStyle(1, Phaser.Display.Color.GetColor(200, 150, 50), 0.5)
    laundry.lineBetween(-18, -17, -18, 24)
    laundry.lineBetween(18, -17, 18, 24)

    // Front pockets
    laundry.lineStyle(1.5, shadowColor, 0.7)
    laundry.strokeRect(-16, -15, 12, 10) // Left pocket
    laundry.strokeRect(4, -15, 12, 10)   // Right pocket

    // Back pockets outline
    laundry.lineStyle(1, shadowColor, 0.5)
    laundry.strokeRect(-15, 5, 10, 8)
    laundry.strokeRect(5, 5, 10, 8)

    // Button and zipper detail
    laundry.fillStyle(0xC0C0C0, 1)
    laundry.fillCircle(0, -23, 2) // Button
    laundry.lineStyle(1, 0x888888, 1)
    laundry.lineBetween(0, -20, 0, -5) // Zipper

    // Wrinkles and folds for realism
    laundry.lineStyle(1, 0x000000, 0.15)
    laundry.lineBetween(-12, -5, -8, 10)
    laundry.lineBetween(8, -8, 12, 8)
    laundry.lineBetween(-5, 15, -2, 22)
    laundry.lineBetween(2, 18, 5, 24)

    // Outer outline
    laundry.lineStyle(2, 0x000000, 0.4)
    laundry.strokeRect(-20, -25, 40, 6)   // Waistband
    laundry.strokeRect(-20, -19, 18, 45)  // Left leg
    laundry.strokeRect(2, -19, 18, 45)    // Right leg

    // Add dynamic shadow that will move with the item
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.3)
    shadow.fillEllipse(0, 0, 30, 10)
    laundry.shadow = shadow

    laundry.x = 70
    laundry.y = 540

    this.physics.add.existing(laundry)

    // Advanced physics based on flick gesture and wind - EASIER AT START!
    const powerFactor = this.power / 100
    const flickBonus = flickSpeed * 160 // Reduced for better control

    // Level-based difficulty (easier at level 1)
    const levelMultiplier = 0.85 + (this.level * 0.05) // Starts at 85% power, increases 5% per level

    // Base velocity from power and flick
    const baseVelocityX = ((powerFactor * 180) + (Math.cos(flickAngle) * flickBonus)) * levelMultiplier
    const baseVelocityY = (-(powerFactor * 420) - (Math.sin(flickAngle) * flickBonus) - 160) * levelMultiplier

    // Over-flicking physics - too much power makes it fly way up and spin down!
    let verticalMultiplier = 1
    let spinMultiplier = 1
    if (flickSpeed > 0.25) {
      // OVER-FLICKED! Goes flying way up and spins wildly
      verticalMultiplier = 1.5 + (flickSpeed - 0.25) * 3
      spinMultiplier = 2 + (flickSpeed - 0.25) * 4

      // Hilarious visual feedback
      const overFlickText = this.add.text(laundry.x, laundry.y - 60, 'WOAH!!! 🚀', {
        fontSize: '28px',
        fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
        color: '#FF4444',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(10)

      this.tweens.add({
        targets: overFlickText,
        y: laundry.y - 100,
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => overFlickText.destroy()
      })
    }

    // Wind effect - balanced for skill
    const windEffect = this.windSpeed * this.windDirection * 7

    const velocityX = baseVelocityX + windEffect
    const velocityY = baseVelocityY * verticalMultiplier

    laundry.body.setVelocity(velocityX, velocityY)
    laundry.body.setAngularVelocity(Phaser.Math.Between(100, 250) * (flickSpeed + 0.5) * spinMultiplier)
    laundry.body.setDrag(10, 5)

    this.laundryInFlight = laundry
    this.totalThrows++

    // Visual feedback for flick quality
    if (flickSpeed > 0.15) {
      // Great flick!
      const trailParticles = 8
      for (let i = 0; i < trailParticles; i++) {
        const trail = this.add.graphics()
        trail.fillStyle(0xFFD700, 0.6)
        trail.fillCircle(0, 0, 5)
        trail.x = laundry.x
        trail.y = laundry.y
        trail.setDepth(3)

        this.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.3,
          duration: 400,
          delay: i * 50,
          onComplete: () => trail.destroy()
        })
      }
    }

    // Reset power
    this.power = 0
    this.powerMeterFill.clear()
  }

  updateWind() {
    // Progressive difficulty: wind increases gradually with score
    const baseWind = 5
    const progressionFactor = Math.floor(this.successfulHangs / 5)
    const minWind = Math.min(baseWind + progressionFactor * 2, 10)
    const maxWind = Math.min(15 + progressionFactor * 3, 30)

    this.windSpeed = Phaser.Math.Between(minWind, maxWind)
    this.windDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1
    this.updateWindDisplay()
  }

  updateWindDisplay() {
    const arrow = this.windDirection === 1 ? '→' : '←'
    const windSpeedRounded = Math.round(this.windSpeed)

    // Color code wind based on intensity
    let windColor = '#00FF00' // Low wind - green
    if (this.windIntensity > 0.7) {
      windColor = '#FF0000' // High wind - red
    } else if (this.windIntensity > 0.5) {
      windColor = '#FFA500' // Medium wind - orange
    }

    this.windText.setText(`Wind: ${arrow} ${windSpeedRounded} mph`)
    this.windText.setColor(windColor)

    // Update wind intensity meter
    if (this.windMeter) {
      this.windMeter.clear()

      // Background
      this.windMeter.fillStyle(0x333333, 0.6)
      this.windMeter.fillRect(20, 125, 100, 10)

      // Fill based on intensity
      const meterColor = this.windIntensity > 0.7 ? 0xFF0000 : (this.windIntensity > 0.5 ? 0xFFA500 : 0x00FF00)
      this.windMeter.fillStyle(meterColor, 0.9)
      this.windMeter.fillRect(20, 125, this.windIntensity * 100, 10)

      // Border
      this.windMeter.lineStyle(2, 0xFFFFFF, 0.8)
      this.windMeter.strokeRect(20, 125, 100, 10)
    }
  }

  checkLaundryCollision() {
    if (!this.laundryInFlight) return

    const laundry = this.laundryInFlight
    const velocity = laundry.body.velocity

    // Check if laundry has slowed down (near end of trajectory)
    if (Math.abs(velocity.y) < 50 && velocity.y > 0) {
      // Check collision with washing line
      const lineBounds = this.washingLineZone.getBounds()
      const laundryBounds = new Phaser.Geom.Rectangle(
        laundry.x - 15,
        laundry.y - 20,
        30,
        35
      )

      if (Phaser.Geom.Intersects.RectangleToRectangle(lineBounds, laundryBounds)) {
        this.onSuccessfulHang(laundry)
        return
      }
    }

    // Check collision with pool
    if (laundry.y > 580) {
      const poolBounds = this.poolZone.getBounds()
      const laundryBounds = new Phaser.Geom.Rectangle(
        laundry.x - 15,
        laundry.y - 20,
        30,
        35
      )

      if (Phaser.Geom.Intersects.RectangleToRectangle(poolBounds, laundryBounds)) {
        this.onPoolSplash(laundry)
        return
      }
    }

    // Remove if off screen
    if (laundry.y > 750 || laundry.x < -50 || laundry.x > 410) {
      this.onPoolSplash(laundry)
    }
  }

  onSuccessfulHang(laundry) {
    // Prevent double-triggering
    if (!laundry || !laundry.body) return

    // Stop the laundry immediately
    laundry.body.setVelocity(0, 0)
    laundry.body.setAngularVelocity(0)
    laundry.body.setImmovable(true)

    // Snap to line
    laundry.y = 290

    // Calculate performance metrics for star rating
    const lineCenter = 180
    const distanceFromCenter = Math.abs(laundry.x - lineCenter)
    const perfectRange = 40
    const goodRange = 80

    const isPerfect = distanceFromCenter < perfectRange
    const isGood = distanceFromCenter < goodRange

    // Star rating system (like Angry Birds)
    let starsEarned = 1
    if (isPerfect) {
      starsEarned = 3
      this.perfectThrows++
      this.showPerfectThrow()

      // SLOW MOTION EFFECT for perfect throws (only if time scale is normal)
      if (this.time.timeScale === 1) {
        this.time.timeScale = 0.4
        this.time.delayedCall(600, () => {
          if (this.time && this.time.timeScale < 1) {
            this.time.timeScale = 1
          }
        })
      }

      // Epic camera zoom
      if (this.cameras.main.zoom === 1) {
        this.cameras.main.zoom = 1.12
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 1,
          duration: 800,
          ease: 'Cubic.easeOut'
        })
      }
    } else if (isGood) {
      starsEarned = 2
    }

    this.stars += starsEarned
    this.showStars(laundry.x, laundry.y, starsEarned)
    this.updateStarsDisplay()

    // Combo system
    this.combo++
    if (this.combo > this.maxCombo) this.maxCombo = this.combo

    // Calculate multiplier based on combo
    this.multiplier = 1 + Math.floor(this.combo / 3)

    // Update score with multiplier
    const points = isPerfect ? 2 * this.multiplier : this.multiplier
    this.score += points
    this.scoreText.setText(`Score: ${this.score}`)

    // Show floating score
    this.showFloatingScore(laundry.x, laundry.y, points, isPerfect)

    // Update multiplier display
    if (this.multiplier > 1) {
      this.multiplierText.setText(`x${this.multiplier}`)
      this.tweens.add({
        targets: this.multiplierText,
        scale: 1.3,
        duration: 100,
        yoyo: true
      })
    } else {
      this.multiplierText.setText('')
    }

    // Show combo
    if (this.combo >= 3) {
      this.showCombo()
    }

    this.successfulHangs++

    // Track items on line and check for level up!
    this.itemsOnLine++
    this.hangedItems.push(laundry) // Keep reference for level animation
    this.itemsOnLineText.setText(`${this.itemsOnLine}/${this.maxItemsPerLevel} on line`)

    // LEVEL UP when line is full!
    if (this.itemsOnLine >= this.maxItemsPerLevel) {
      this.levelUp()
    }

    // Celebrate with increasing intensity
    this.celebrateUnclePaul()

    // More juice - particles!
    this.createSuccessParticles(laundry.x, laundry.y)

    // Big combo celebration
    if (this.combo === 5) {
      this.cameras.main.flash(300, 255, 215, 0)
      this.cameras.main.shake(150, 0.003)
    } else if (this.combo === 10) {
      this.cameras.main.flash(400, 255, 0, 255)
      this.cameras.main.shake(200, 0.005)
    }

    // Update wind with visual effect
    if (this.successfulHangs % 3 === 0) {
      this.showWindGust()
    }

    // Clear laundry reference and clean up shadow safely
    try {
      if (laundry && laundry.shadow && laundry.shadow.scene) {
        laundry.shadow.destroy()
      }
    } catch (error) {
      console.log('Error cleaning up shadow:', error)
    }

    this.laundryInFlight = null

    // Flash success
    this.cameras.main.flash(200, 144, 238, 144)

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score
      this.highScoreText.setText(`Best: ${this.highScore}`)
      localStorage.setItem('unclePaulHighScore', this.highScore.toString())
    }

    // Check achievements
    this.checkAchievements()
  }

  levelUp() {
    // Clear the washing line!
    this.hangedItems.forEach((item, index) => {
      if (item && item.scene) {
        // Animate items flying away
        this.tweens.add({
          targets: item,
          y: -100,
          x: item.x + Phaser.Math.Between(-50, 50),
          rotation: Math.PI * 2,
          alpha: 0,
          duration: 800,
          delay: index * 100,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            if (item && item.scene) item.destroy()
          }
        })
      }
    })

    // Level up!
    this.level++
    this.itemsOnLine = 0
    this.hangedItems = []

    // Update UI
    this.levelText.setText(`LEVEL ${this.level}`)
    this.levelText.setColor(Phaser.Display.Color.GetColor(
      Phaser.Math.Between(100, 255),
      Phaser.Math.Between(100, 255),
      Phaser.Math.Between(100, 255)
    ))
    this.itemsOnLineText.setText(`0/${this.maxItemsPerLevel} on line`)

    // BIG LEVEL UP CELEBRATION!
    const levelUpText = this.add.text(180, 370, `LEVEL ${this.level}!`, {
      fontSize: '64px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#FF0000',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0).setScale(0.5).setDepth(20)

    const subText = this.add.text(180, 430, 'WIND GETTING STRONGER!', {
      fontSize: '24px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(20)

    // Animate level up text
    this.tweens.add({
      targets: levelUpText,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: levelUpText,
          scale: 1,
          duration: 200
        })

        // Show subtitle
        this.tweens.add({
          targets: subText,
          alpha: 1,
          duration: 300,
          onComplete: () => {
            // Fade out after 2 seconds
            this.time.delayedCall(2000, () => {
              this.tweens.add({
                targets: [levelUpText, subText],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                  levelUpText.destroy()
                  subText.destroy()
                }
              })
            })
          }
        })
      }
    })

    // Epic effects
    this.cameras.main.flash(600, 255, 255, 0)
    this.cameras.main.shake(400, 0.01)

    // Fireworks!
    for (let i = 0; i < 30; i++) {
      this.time.delayedCall(i * 50, () => {
        const x = Phaser.Math.Between(50, 310)
        const y = Phaser.Math.Between(200, 400)
        this.createSuccessParticles(x, y)
      })
    }
  }

  showStars(x, y, count) {
    // Show stars like Angry Birds rating - using text emojis (simpler and works!)
    const starEmoji = '⭐'
    const stars = starEmoji.repeat(count)

    // Big animated star display
    const starText = this.add.text(x, y - 50, stars, {
      fontSize: '40px',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setAlpha(0).setScale(0.5).setDepth(10)

    this.tweens.add({
      targets: starText,
      scale: 1.3,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: starText,
          y: y - 80,
          alpha: 0,
          scale: 0.8,
          duration: 800,
          delay: 600,
          ease: 'Cubic.easeIn',
          onComplete: () => starText.destroy()
        })
      }
    })

    // Show star rating text
    const ratingText = this.add.text(x, y - 90, `${count} STAR${count > 1 ? 'S' : ''}!`, {
      fontSize: '24px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(10)

    this.tweens.add({
      targets: ratingText,
      alpha: 1,
      y: y - 110,
      duration: 500,
      delay: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: ratingText,
          alpha: 0,
          duration: 400,
          delay: 600,
          onComplete: () => ratingText.destroy()
        })
      }
    })
  }

  showPerfectThrow() {
    this.perfectText.setAlpha(1)
    this.perfectText.setScale(0.5)

    this.tweens.add({
      targets: this.perfectText,
      scale: 1.2,
      alpha: 0,
      y: 250,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.perfectText.y = 280
      }
    })
  }

  showCombo() {
    this.comboText.setText(`${this.combo} COMBO!`)
    this.comboText.setAlpha(1)
    this.comboText.setScale(0.8)

    this.tweens.add({
      targets: this.comboText,
      scale: 1.1,
      duration: 200,
      yoyo: true,
      repeat: 1
    })

    // Fade out after showing
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 300
      })
    })
  }

  showFloatingScore(x, y, points, isPerfect) {
    const scorePopup = this.add.text(x, y, `+${points}`, {
      fontSize: isPerfect ? '32px' : '24px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: isPerfect ? '#FFD700' : '#00FF00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.tweens.add({
      targets: scorePopup,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => scorePopup.destroy()
    })
  }

  createSuccessParticles(x, y) {
    // Sparkle particles - using circles and diamonds (no fillStar!)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const particle = this.add.graphics()
      particle.fillStyle(0xFFD700, 1)

      // Alternate between circles and diamonds for variety
      if (i % 2 === 0) {
        particle.fillCircle(0, 0, 4)
      } else {
        // Diamond shape
        particle.beginPath()
        particle.moveTo(0, -6)
        particle.lineTo(4, 0)
        particle.lineTo(0, 6)
        particle.lineTo(-4, 0)
        particle.closePath()
        particle.fillPath()
      }

      particle.x = x
      particle.y = y

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        rotation: Math.PI * 2,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      })
    }
  }

  checkAchievements() {
    const newAchievements = []

    // First hang
    if (this.successfulHangs === 1 && !this.achievements.includes('first_hang')) {
      newAchievements.push({ id: 'first_hang', title: 'First Hang!', desc: 'Hang your first item' })
    }

    // Combo master
    if (this.combo >= 10 && !this.achievements.includes('combo_10')) {
      newAchievements.push({ id: 'combo_10', title: 'Combo Master!', desc: '10 in a row!' })
    }

    // Perfect player
    if (this.perfectThrows >= 5 && !this.achievements.includes('perfect_5')) {
      newAchievements.push({ id: 'perfect_5', title: 'Perfectionist', desc: '5 perfect throws' })
    }

    // High scorer
    if (this.score >= 50 && !this.achievements.includes('score_50')) {
      newAchievements.push({ id: 'score_50', title: 'Laundry Pro', desc: 'Score 50 points' })
    }

    // Show achievement notifications
    newAchievements.forEach((achievement, index) => {
      this.achievements.push(achievement.id)
      this.time.delayedCall(index * 2000, () => {
        this.showAchievement(achievement)
      })
    })

    if (newAchievements.length > 0) {
      localStorage.setItem('unclePaulAchievements', JSON.stringify(this.achievements))
    }
  }

  showAchievement(achievement) {
    const achievementBox = this.add.container(180, -100)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.fillRoundedRect(-120, -40, 240, 80, 10)

    const title = this.add.text(0, -15, achievement.title, {
      fontSize: '20px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    const desc = this.add.text(0, 10, achievement.desc, {
      fontSize: '14px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFFFF'
    }).setOrigin(0.5)

    achievementBox.add([bg, title, desc])

    // Slide in
    this.tweens.add({
      targets: achievementBox,
      y: 150,
      duration: 500,
      ease: 'Back.easeOut'
    })

    // Slide out
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: achievementBox,
        y: -100,
        duration: 400,
        ease: 'Back.easeIn',
        onComplete: () => achievementBox.destroy()
      })
    })
  }

  onPoolSplash(laundry) {
    // Create splash effect
    this.createSplash(laundry.x, 600)

    // Remove laundry and shadow safely
    try {
      if (laundry && laundry.shadow && laundry.shadow.scene) {
        laundry.shadow.destroy()
      }
      if (laundry && laundry.scene) {
        laundry.destroy()
      }
    } catch (error) {
      console.log('Error cleaning up laundry:', error)
    }

    this.laundryInFlight = null

    // COMBO BREAKER!
    if (this.combo >= 3) {
      const breakerText = this.add.text(180, 300, 'COMBO BROKEN!', {
        fontSize: '32px',
        fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
        color: '#FF0000',
        stroke: '#000000',
        strokeThickness: 5
      }).setOrigin(0.5)

      this.tweens.add({
        targets: breakerText,
        y: 250,
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => breakerText.destroy()
      })
    }

    this.combo = 0
    this.multiplier = 1
    this.multiplierText.setText('')
    this.comboText.setAlpha(0)

    // Lose a strike
    this.strikes--
    this.updateHearts()

    // Uncle Paul sad reaction
    this.sadUnclePaul()

    // Check game over
    if (this.strikes <= 0) {
      this.time.delayedCall(1000, () => {
        this.scene.start('GameOverScene', {
          score: this.score,
          maxCombo: this.maxCombo,
          perfectThrows: this.perfectThrows,
          totalThrows: this.totalThrows,
          successfulHangs: this.successfulHangs
        })
      })
    }

    // Camera shake
    this.cameras.main.shake(300, 0.008)
  }

  showTutorialOverlay() {
    const overlay = this.add.container(180, 370)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.9)
    bg.fillRect(-170, -350, 340, 700)

    const title = this.add.text(0, -280, 'How to Play', {
      fontSize: '32px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5)

    const instructions = [
      '👆 TAP & HOLD to charge power',
      '⬆️ FLICK UP to launch pants!',
      '💨 Watch WIND intensity (changes!)',
      '🎯 Throw when wind is LOW',
      '⭐ Land NEAR CENTER for 3 stars',
      '🔥 Build COMBOS for bonuses',
      '❤️ Don\'t hit the pool 3 times!',
      '',
      'TAP TO START!'
    ]

    const instructionTexts = instructions.map((text, index) => {
      return this.add.text(0, -200 + index * 40, text, {
        fontSize: '18px',
        fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
        color: '#FFFFFF',
        align: 'center'
      }).setOrigin(0.5)
    })

    overlay.add([bg, title, ...instructionTexts])

    // Make clickable
    const zone = this.add.zone(180, 370, 340, 700).setInteractive()
    zone.on('pointerdown', () => {
      overlay.destroy()
      zone.destroy()
      localStorage.setItem('unclePaulTutorialSeen', 'true')
    })
  }

  createSplash(x, y) {
    // Create realistic water splash with multiple layers
    const splashContainer = this.add.container(x, y)

    // Main splash droplets
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const distance = Phaser.Math.Between(15, 35)
      const droplet = this.add.graphics()

      // Gradient droplet
      for (let j = 0; j < 8; j++) {
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 79, g: 195, b: 247 },   // Light blue
          { r: 25, g: 102, b: 153 },   // Dark blue
          8, j
        )
        droplet.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.8 - j * 0.1)
        droplet.fillCircle(0, 0, 8 - j)
      }

      droplet.x = Math.cos(angle) * distance
      droplet.y = Math.sin(angle) * distance

      splashContainer.add(droplet)

      // Animate each droplet
      this.tweens.add({
        targets: droplet,
        x: Math.cos(angle) * (distance + 30),
        y: Math.sin(angle) * (distance + 30) + 20,  // Gravity
        alpha: 0,
        duration: Phaser.Math.Between(400, 600),
        ease: 'Quad.easeOut'
      })
    }

    // Center splash burst
    const burst = this.add.graphics()
    burst.fillStyle(0xFFFFFF, 0.7)
    burst.fillCircle(x, y, 15)
    burst.fillStyle(0x4FC3F7, 0.6)
    burst.fillCircle(x, y, 25)

    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 2,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => burst.destroy()
    })

    // Ripples
    for (let i = 0; i < 3; i++) {
      const ripple = this.add.graphics()
      ripple.lineStyle(3, 0x4FC3F7, 0.6)
      ripple.strokeCircle(x, y, 20)

      this.tweens.add({
        targets: ripple,
        alpha: 0,
        scale: 2 + i,
        duration: 800,
        delay: i * 150,
        ease: 'Sine.easeOut',
        onComplete: () => ripple.destroy()
      })
    }

    // Destroy container after animations
    this.time.delayedCall(800, () => splashContainer.destroy())
  }

  updateHearts() {
    const hearts = '❤️'.repeat(this.strikes)
    this.heartsText.setText(hearts)
  }

  celebrateUnclePaul() {
    // JUMP FOR JOY! Multiple bounces
    this.tweens.add({
      targets: this.unclePaul,
      y: 380,
      duration: 200,
      ease: 'Cubic.easeOut',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        // Return to idle position
        this.tweens.add({
          targets: this.unclePaul,
          y: 430,
          duration: 300,
          ease: 'Bounce.easeOut'
        })
      }
    })

    // Add rotation during jump
    this.tweens.add({
      targets: this.unclePaul,
      angle: -8,
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut'
    })

    // Scale slightly bigger (excitement!)
    this.tweens.add({
      targets: this.unclePaul,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 150,
      yoyo: true,
      repeat: 3
    })

    // Confetti particles around Uncle Paul
    for (let i = 0; i < 12; i++) {
      const confetti = this.add.graphics()
      const colors = [0xFFD700, 0xFF69B4, 0x00D4FF, 0x00FF00, 0xFF6B00]
      confetti.fillStyle(Phaser.Utils.Array.GetRandom(colors), 1)
      confetti.fillRect(0, 0, 4, 8)
      confetti.x = this.unclePaul.x + Phaser.Math.Between(-20, 20)
      confetti.y = this.unclePaul.y - 30
      confetti.setDepth(8)

      const angle = (i / 12) * Math.PI * 2
      this.tweens.add({
        targets: confetti,
        x: confetti.x + Math.cos(angle) * 50,
        y: confetti.y + Math.sin(angle) * 50 + 80,
        rotation: Math.PI * 4,
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => confetti.destroy()
      })
    }
  }

  sadUnclePaul() {
    // HANDS ON HEAD reaction!
    // Make him lean back in despair
    this.tweens.add({
      targets: this.unclePaul,
      angle: -10,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        // Shake head side to side
        this.tweens.add({
          targets: this.unclePaul,
          angle: 3,
          duration: 150,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.easeInOut'
        })
      }
    })

    // Slight squat (hands on head posture)
    this.tweens.add({
      targets: this.unclePaul,
      y: 435,
      scaleY: 0.95,
      duration: 300,
      ease: 'Cubic.easeOut',
      yoyo: true
    })

    // Show "NO!" text bubble
    const sadText = this.add.text(this.unclePaul.x, this.unclePaul.y - 120, 'OH NO! 😱', {
      fontSize: '24px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FF0000',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#FFFFFF',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setAlpha(0).setDepth(10)

    this.tweens.add({
      targets: sadText,
      alpha: 1,
      y: this.unclePaul.y - 140,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: sadText,
          alpha: 0,
          duration: 400,
          delay: 600,
          onComplete: () => sadText.destroy()
        })
      }
    })
  }

  update() {
    // Update power meter while holding
    if (this.isPowering) {
      this.power += 2
      if (this.power > 100) this.power = 100

      // Update power meter visual with gradient
      this.powerMeterFill.clear()

      // Smooth gradient power meter
      const meterWidth = (this.power / 100) * 300
      for (let i = 0; i < meterWidth; i++) {
        let color
        const position = (i / meterWidth) * 100

        if (position < 50) {
          // Green to yellow
          color = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 0, g: 255, b: 0 },
            { r: 255, g: 255, b: 0 },
            50, position
          )
        } else if (position < 80) {
          // Yellow to orange
          color = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 255, g: 255, b: 0 },
            { r: 255, g: 165, b: 0 },
            30, position - 50
          )
        } else {
          // Orange to red
          color = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 255, g: 165, b: 0 },
            { r: 255, g: 0, b: 0 },
            20, position - 80
          )
        }

        this.powerMeterFill.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 0.9)
        this.powerMeterFill.fillRect(30 + i, 680, 1, 30)
      }

      // Add shine effect
      this.powerMeterFill.fillStyle(0xFFFFFF, 0.3)
      this.powerMeterFill.fillRoundedRect(30, 682, meterWidth, 10, 3)
    }

    // Update laundry shadow position
    if (this.laundryInFlight && this.laundryInFlight.shadow) {
      const laundry = this.laundryInFlight
      const shadow = laundry.shadow

      // Position shadow on ground based on laundry height
      const groundY = 560
      const shadowScale = Math.max(0.3, 1 - (laundry.y - groundY) / 300)

      shadow.x = laundry.x
      shadow.y = groundY
      shadow.setScale(shadowScale)
      shadow.setAlpha(shadowScale * 0.4)
    }

    // Check laundry collision
    if (this.laundryInFlight) {
      this.checkLaundryCollision()
    }
  }
}

// Title Scene
class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    // Sky gradient background - deeper, more vibrant blue
    const sky = this.add.graphics()
    for (let i = 0; i < 740; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 100, g: 180, b: 250 },
        { r: 180, g: 230, b: 255 },
        740, i
      )
      sky.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      sky.fillRect(0, i, 360, 1)
    }

    // Sun with 12 animated glow layers
    const sun = this.add.graphics()
    for (let i = 0; i < 12; i++) {
      sun.fillStyle(0xFFFF99, 0.08 - i * 0.006)
      sun.fillCircle(300, 80, 45 + i * 6)
    }
    sun.fillStyle(0xFFFFAA, 1)
    sun.fillCircle(300, 80, 28)
    sun.fillStyle(0xFFFFDD, 0.9)
    sun.fillCircle(298, 77, 22)
    sun.fillStyle(0xFFFFFF, 0.6)
    sun.fillCircle(295, 74, 12)

    // Animate sun glow
    this.tweens.add({
      targets: sun,
      alpha: 0.85,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Animated clouds with soft opacity layers
    for (let i = 0; i < 3; i++) {
      const cloud = this.add.graphics()
      const startX = Phaser.Math.Between(-50, 360)
      const y = Phaser.Math.Between(60, 150)

      // Cloud shadow
      cloud.fillStyle(0xCCCCCC, 0.3)
      cloud.fillCircle(2, 2, 25)
      cloud.fillCircle(22, -3, 20)
      cloud.fillCircle(-18, -3, 20)
      cloud.fillCircle(12, 7, 18)
      cloud.fillCircle(-8, 7, 18)

      // Main cloud
      cloud.fillStyle(0xFFFFFF, 0.85)
      cloud.fillCircle(0, 0, 25)
      cloud.fillCircle(20, -5, 20)
      cloud.fillCircle(-20, -5, 20)
      cloud.fillCircle(10, 5, 18)
      cloud.fillCircle(-10, 5, 18)

      // Cloud highlights
      cloud.fillStyle(0xFFFFFF, 0.95)
      cloud.fillCircle(-5, -8, 12)
      cloud.fillCircle(15, -10, 10)

      cloud.x = startX
      cloud.y = y

      this.tweens.add({
        targets: cloud,
        x: 410,
        duration: Phaser.Math.Between(30000, 50000),
        repeat: -1,
        onRepeat: () => {
          cloud.x = -50
          cloud.y = Phaser.Math.Between(60, 150)
        }
      })
    }

    // Villa wall background
    const wall = this.add.graphics()
    for (let i = 0; i < 540; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 250, b: 230 },
        { r: 245, g: 238, b: 210 },
        540, i
      )
      wall.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      wall.fillRect(0, 200 + i, 360, 1)
    }

    // TITLE LOGO - Professional 3D depth with multiple layers (sized to fit 360px screen)
    // Deep shadow layer
    const titleDeepShadow = this.add.text(180, 258, "UNCLE PAUL'S", {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#000000',
      stroke: '#000000',
      strokeThickness: 10,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.4)

    // Mid shadow layer
    const titleMidShadow = this.add.text(180, 254, "UNCLE PAUL'S", {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#000000',
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.6)

    // Main title
    const title = this.add.text(180, 250, "UNCLE PAUL'S", {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#FF8C00',
      strokeThickness: 7,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Inner highlight
    const titleHighlight = this.add.text(180, 248, "UNCLE PAUL'S", {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#FFEB99',
      stroke: '#FFE066',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.7)

    // SUBTITLE - Professional 3D depth (sized to fit)
    // Deep shadow layer
    const subtitleDeepShadow = this.add.text(180, 308, 'POOLSIDE PANIC', {
      fontSize: '34px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#000000',
      stroke: '#000000',
      strokeThickness: 10,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.4)

    // Mid shadow layer
    const subtitleMidShadow = this.add.text(180, 304, 'POOLSIDE PANIC', {
      fontSize: '34px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#000000',
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.6)

    // Main subtitle
    const subtitle = this.add.text(180, 300, 'POOLSIDE PANIC', {
      fontSize: '34px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#00BFFF',
      stroke: '#0066CC',
      strokeThickness: 7,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Inner highlight
    const subtitleHighlight = this.add.text(180, 298, 'POOLSIDE PANIC', {
      fontSize: '34px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#99E6FF',
      stroke: '#66D4FF',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.7)

    // Pulse animation on title and subtitle
    this.tweens.add({
      targets: [titleDeepShadow, titleMidShadow, title, titleHighlight],
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    this.tweens.add({
      targets: [subtitleDeepShadow, subtitleMidShadow, subtitle, subtitleHighlight],
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Tagline
    this.add.text(180, 360, 'Hang laundry, battle the wind!', {
      fontSize: '18px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    // HIGH SCORE BANNER - Gold medal/banner style
    const highScore = parseInt(localStorage.getItem('unclePaulHighScore') || '0')
    if (highScore > 0) {
      const bannerY = 410

      // Banner shadow
      const bannerShadow = this.add.graphics()
      bannerShadow.fillStyle(0x000000, 0.3)
      bannerShadow.fillRoundedRect(55, bannerY + 5, 250, 50, 10)

      // Banner background - gold gradient effect
      const banner = this.add.graphics()
      banner.fillStyle(0xFFD700, 1)
      banner.fillRoundedRect(50, bannerY, 250, 50, 10)

      // Gold highlight strip on top
      banner.fillStyle(0xFFE87C, 1)
      banner.fillRoundedRect(50, bannerY, 250, 15, 10)

      // Gold border
      banner.lineStyle(4, 0xB8860B, 1)
      banner.strokeRoundedRect(50, bannerY, 250, 50, 10)

      // Banner text shadow
      this.add.text(180, bannerY + 27, `HIGH SCORE: ${highScore}`, {
        fontSize: '22px',
        fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0.4)

      // Banner text
      const bannerText = this.add.text(180, bannerY + 25, `HIGH SCORE: ${highScore}`, {
        fontSize: '22px',
        fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
        color: '#8B4513',
        fontStyle: 'bold'
      }).setOrigin(0.5)

      // Subtle pulse animation on banner
      this.tweens.add({
        targets: [banner, bannerText],
        scale: 1.03,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }

    // PLAY BUTTON - Professional 3D button
    const buttonY = 480
    const button = this.add.graphics()

    // Deep shadow layer
    button.fillStyle(0x000000, 0.3)
    button.fillRoundedRect(80, buttonY + 5, 200, 70, 15)

    // Dark base layer (3D depth)
    button.fillStyle(0x2E7D32, 1)
    button.fillRoundedRect(80, buttonY - 35, 200, 70, 15)

    // Button face
    button.fillStyle(0x4CAF50, 1)
    button.fillRoundedRect(80, buttonY - 38, 200, 70, 15)

    // Highlight strip on top (3D effect)
    button.fillStyle(0x66BB6A, 1)
    button.fillRoundedRect(80, buttonY - 38, 200, 25, 15)

    // Gloss highlight
    button.fillStyle(0xFFFFFF, 0.2)
    button.fillRoundedRect(85, buttonY - 35, 190, 15, 12)

    // Button border
    button.lineStyle(5, 0x1B5E20, 1)
    button.strokeRoundedRect(80, buttonY - 38, 200, 70, 15)

    // Button text shadow
    const buttonTextShadow = this.add.text(180, 515 - 35, 'PLAY NOW!', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.4)

    // Button text
    const buttonText = this.add.text(180, 515 - 38, 'PLAY NOW!', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      color: '#FFFFFF',
      stroke: '#2E7D32',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Bounce animation on button
    this.tweens.add({
      targets: [button, buttonText, buttonTextShadow],
      y: '+=8',
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Make button interactive
    const buttonZone = this.add.zone(180, 515 - 38, 200, 70)
    buttonZone.setInteractive({ useHandCursor: true })

    buttonZone.on('pointerdown', () => {
      // Pressed state - button goes down
      button.clear()

      // Shadow disappears when pressed
      button.fillStyle(0x2E7D32, 1)
      button.fillRoundedRect(80, buttonY - 32, 200, 70, 15)

      button.fillStyle(0x45A049, 1)
      button.fillRoundedRect(80, buttonY - 33, 200, 70, 15)

      button.lineStyle(5, 0x1B5E20, 1)
      button.strokeRoundedRect(80, buttonY - 33, 200, 70, 15)

      buttonText.y = 515 - 33
      buttonTextShadow.y = 515 - 33
    })

    buttonZone.on('pointerup', () => {
      this.scene.start('GameScene')
    })

    buttonZone.on('pointerover', () => {
      buttonText.setScale(1.08)
      buttonTextShadow.setScale(1.08)
      button.setAlpha(0.95)
    })

    buttonZone.on('pointerout', () => {
      buttonText.setScale(1)
      buttonTextShadow.setScale(1)
      button.setAlpha(1)
    })

    // Credits at bottom
    this.add.text(180, 680, 'Made with love for Uncle Paul', {
      fontSize: '14px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#AAAAAA',
      align: 'center'
    }).setOrigin(0.5)
  }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data) {
    this.finalScore = data.score || 0
    this.maxCombo = data.maxCombo || 0
    this.perfectThrows = data.perfectThrows || 0
    this.totalThrows = data.totalThrows || 0
    this.successfulHangs = data.successfulHangs || 0
    this.highScore = parseInt(localStorage.getItem('unclePaulHighScore') || '0')
  }

  create() {
    // Semi-transparent overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.85)
    overlay.fillRect(0, 0, 360, 740)

    // Game Over text with animation
    const gameOverText = this.add.text(180, 120, 'GAME OVER!', {
      fontSize: '56px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FF0000',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: gameOverText,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      ease: 'Bounce.easeOut',
      yoyo: true
    })

    // Final score (larger, more prominent)
    this.add.text(180, 200, `SCORE`, {
      fontSize: '22px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.add.text(180, 235, `${this.finalScore}`, {
      fontSize: '48px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5)

    // New high score indicator
    if (this.finalScore >= this.highScore && this.finalScore > 0) {
      const newBestText = this.add.text(180, 285, '🎉 NEW BEST! 🎉', {
        fontSize: '26px',
        fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
        color: '#00FF00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5)

      this.tweens.add({
        targets: newBestText,
        scale: 1.15,
        duration: 500,
        yoyo: true,
        repeat: -1
      })
    }

    // Stats panel with better spacing
    const statsY = this.finalScore >= this.highScore && this.finalScore > 0 ? 330 : 305
    const lineHeight = 40

    this.add.text(180, statsY, '━━━ STATS ━━━', {
      fontSize: '26px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(180, statsY + lineHeight, `Best Combo: ${this.maxCombo}`, {
      fontSize: '22px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FF69B4',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.add.text(180, statsY + lineHeight * 2, `Perfect Throws: ${this.perfectThrows}`, {
      fontSize: '22px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    // FIX: Calculate accuracy correctly using successfulHangs / totalThrows
    const accuracy = this.totalThrows > 0 ? Math.round((this.successfulHangs / this.totalThrows) * 100) : 0
    this.add.text(180, statsY + lineHeight * 3, `Accuracy: ${accuracy}%`, {
      fontSize: '22px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    this.add.text(180, statsY + lineHeight * 4, `All-Time Best: ${this.highScore}`, {
      fontSize: '20px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)

    // Uncle Paul says (better positioned)
    const messageY = statsY + lineHeight * 5 + 20
    this.add.text(180, messageY, 'Uncle Paul says:', {
      fontSize: '20px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    const messages = [
      '"Better luck next time!"',
      '"My pool is full of shirts!"',
      '"Practice makes perfect!"',
      '"The wind was tricky today!"',
      '"You\'ll get the hang of it!"'
    ]

    const message = Phaser.Utils.Array.GetRandom(messages)
    this.add.text(180, messageY + 35, message, {
      fontSize: '19px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 320 }
    }).setOrigin(0.5)

    // Play Again button (better positioned)
    const buttonY = 650
    const button = this.add.graphics()
    button.fillStyle(0x4CAF50, 1)
    button.fillRoundedRect(90, buttonY - 35, 180, 70, 12)
    button.lineStyle(5, 0x2E7D32, 1)
    button.strokeRoundedRect(90, buttonY - 35, 180, 70, 12)

    const buttonText = this.add.text(180, buttonY, 'PLAY AGAIN', {
      fontSize: '28px',
      fontFamily: 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5)

    // Make button interactive
    const buttonZone = this.add.zone(180, buttonY, 180, 70)
    buttonZone.setInteractive({ useHandCursor: true })

    buttonZone.on('pointerdown', () => {
      button.clear()
      button.fillStyle(0x45A049, 1)
      button.fillRoundedRect(90, buttonY - 35, 180, 70, 12)
      button.lineStyle(5, 0x2E7D32, 1)
      button.strokeRoundedRect(90, buttonY - 35, 180, 70, 12)
    })

    buttonZone.on('pointerup', () => {
      this.scene.start('GameScene')
    })

    buttonZone.on('pointerover', () => {
      buttonText.setScale(1.1)
    })

    buttonZone.on('pointerout', () => {
      buttonText.setScale(1)
    })
  }
}

// Game Configuration
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 360,
  height: 740,
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1200 },
      debug: false
    }
  },
  scene: [TitleScene, GameScene, GameOverScene]
}

// Start the game
const game = new Phaser.Game(config)
