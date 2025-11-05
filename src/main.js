import Phaser from 'phaser'

// Main Game Scene
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    // Game state
    this.score = 0
    this.strikes = 3
    this.windSpeed = 8
    this.windDirection = 1 // 1 = right, -1 = left
    this.isPowering = false
    this.power = 0
    this.laundryInFlight = null
    this.successfulHangs = 0

    // NEW: Viral game mechanics
    this.combo = 0
    this.maxCombo = 0
    this.multiplier = 1
    this.perfectThrows = 0
    this.totalThrows = 0
    this.highScore = parseInt(localStorage.getItem('unclePaulHighScore') || '0')
    this.achievements = JSON.parse(localStorage.getItem('unclePaulAchievements') || '[]')
    this.showTutorial = !localStorage.getItem('unclePaulTutorialSeen')

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

    // Show tutorial on first play
    if (this.showTutorial) {
      this.showTutorialOverlay()
    }
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

    // Legs with realistic shading (skin tone)
    const leftLeg = this.add.graphics()

    // Left leg gradient
    for (let i = 0; i < 45; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 219, b: 172 },  // Light skin
        { r: 230, g: 190, b: 150 },  // Darker skin
        45, i
      )
      leftLeg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      leftLeg.fillRect(-15, 50 + i, 13, 1)
    }
    // Leg shading
    leftLeg.fillStyle(0x000000, 0.15)
    leftLeg.fillRect(-15, 50, 3, 45)

    const rightLeg = this.add.graphics()
    // Right leg gradient
    for (let i = 0; i < 45; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 219, b: 172 },
        { r: 230, g: 190, b: 150 },
        45, i
      )
      rightLeg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      rightLeg.fillRect(3, 50 + i, 13, 1)
    }
    // Highlight on right leg
    rightLeg.fillStyle(0xFFFFFF, 0.2)
    rightLeg.fillRect(10, 50, 3, 45)

    // Feet with sandals
    const feet = this.add.graphics()
    feet.fillStyle(0x8B4513, 1)
    feet.fillEllipse(-9, 93, 15, 8)
    feet.fillEllipse(9, 93, 15, 8)
    feet.fillStyle(0xA0522D, 0.8)
    feet.fillRect(-12, 92, 5, 3)
    feet.fillRect(7, 92, 5, 3)

    // Shorts with realistic fabric texture
    const shorts = this.add.graphics()

    // Shorts gradient (royal blue)
    for (let i = 0; i < 32; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 65, g: 105, b: 225 },   // Lighter blue
        { r: 40, g: 70, b: 180 },    // Darker blue
        32, i
      )
      shorts.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      shorts.fillRoundedRect(-22, 20 + i, 44, 1, 3)
    }

    // Shorts shadows and highlights
    shorts.fillStyle(0x000000, 0.2)
    shorts.fillRect(-22, 20, 8, 32)  // Left shadow
    shorts.fillStyle(0xFFFFFF, 0.15)
    shorts.fillRect(14, 20, 8, 32)   // Right highlight

    // Waistband
    shorts.fillStyle(0x2F4F8F, 1)
    shorts.fillRect(-22, 20, 44, 4)

    // Body/Shirt (bright tropical yellow)
    const shirt = this.add.graphics()

    // Shirt body with gradient
    for (let i = 0; i < 60; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 220, b: 0 },    // Bright yellow
        { r: 255, g: 200, b: 0 },    // Slightly darker
        60, i
      )
      shirt.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      shirt.fillEllipse(0, -30 + i, 52, 1)
    }

    // Shirt collar (Hawaiian style)
    shirt.fillStyle(0xFFD700, 1)
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

    // Shirt shading
    shirt.fillStyle(0x000000, 0.15)
    shirt.fillEllipse(-18, 0, 15, 50)

    // Arms with realistic shading
    const leftArm = this.add.graphics()
    for (let i = 0; i < 55; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 219, b: 172 },
        { r: 230, g: 190, b: 150 },
        55, i
      )
      leftArm.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      leftArm.fillEllipse(-28, -25 + i, 12, 1)
    }
    leftArm.fillStyle(0x000000, 0.2)
    leftArm.fillEllipse(-32, 0, 8, 50)

    const rightArm = this.add.graphics()
    for (let i = 0; i < 55; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 219, b: 172 },
        { r: 230, g: 190, b: 150 },
        55, i
      )
      rightArm.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      rightArm.fillEllipse(28, -25 + i, 12, 1)
    }
    rightArm.fillStyle(0xFFFFFF, 0.2)
    rightArm.fillEllipse(32, 0, 8, 50)

    // Hands
    const hands = this.add.graphics()
    hands.fillStyle(0xFFDBAC, 1)
    hands.fillCircle(-28, 28, 7)
    hands.fillCircle(28, 28, 7)
    // Fingers suggestion
    hands.fillStyle(0xFFDBAC, 0.8)
    hands.fillRect(-30, 33, 3, 5)
    hands.fillRect(27, 33, 3, 5)

    // Head with realistic skin gradient - YOUNG GUY IN 20s
    const head = this.add.graphics()

    // Head sphere with youthful fresh shading
    for (let i = 0; i < 50; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 224, b: 189 },  // Fresh youthful skin
        { r: 245, g: 210, b: 175 },  // Subtle shadow
        50, i
      )
      head.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      head.fillCircle(0 - i * 0.5, -60, 28)
    }

    // Ears with detail
    head.fillStyle(0xFFDBAC, 1)
    head.fillEllipse(-24, -58, 9, 14)
    head.fillEllipse(24, -58, 9, 14)
    // Inner ear
    head.fillStyle(0xE6BEAA, 1)
    head.fillEllipse(-24, -58, 5, 8)
    head.fillEllipse(24, -58, 5, 8)

    // Modern full hair - dark brown, thick and stylish (20s style)
    head.fillStyle(0x3d2817, 1)

    // Full hair coverage - no bald spot!
    head.fillCircle(0, -75, 26)

    // Hair volume and texture - modern messy style
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(angle) * 24
      const y = -75 + Math.sin(angle) * 18
      head.fillEllipse(x, y, 10, 14)
    }

    // Hair highlights for depth (modern styled look)
    head.fillStyle(0x5a3d2a, 0.7)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI - Math.PI / 2
      const x = Math.cos(angle) * 20
      const y = -78 + Math.sin(angle) * 12
      head.fillEllipse(x, y, 8, 10)
    }

    // Front hair sweep (trendy)
    head.fillStyle(0x3d2817, 1)
    head.fillEllipse(8, -82, 16, 12)
    head.fillEllipse(-5, -84, 14, 10)

    // Eyebrows - younger, more defined
    head.fillStyle(0x3d2817, 1)
    head.fillEllipse(-11, -65, 10, 3)
    head.fillEllipse(11, -65, 10, 3)

    // Eyes - bright and youthful (no sunglasses!)
    head.fillStyle(0xFFFFFF, 1)
    head.fillEllipse(-11, -60, 10, 8)
    head.fillEllipse(11, -60, 10, 8)

    // Irises - friendly brown eyes
    head.fillStyle(0x6B4423, 1)
    head.fillCircle(-11, -60, 4)
    head.fillCircle(11, -60, 4)

    // Pupils
    head.fillStyle(0x000000, 1)
    head.fillCircle(-11, -60, 2.5)
    head.fillCircle(11, -60, 2.5)

    // Eye shine (youthful sparkle)
    head.fillStyle(0xFFFFFF, 0.9)
    head.fillCircle(-10, -61, 1.5)
    head.fillCircle(12, -61, 1.5)

    // Upper eyelids
    head.lineStyle(2, 0x3d2817, 1)
    head.beginPath()
    head.arc(-11, -60, 5, -Math.PI, 0, true)
    head.strokePath()
    head.beginPath()
    head.arc(11, -60, 5, -Math.PI, 0, true)
    head.strokePath()

    // Nose - smaller, youthful
    head.fillStyle(0xFFDBAC, 1)
    head.fillEllipse(2, -52, 8, 12)
    head.fillStyle(0xE6BEAA, 0.4)
    head.fillEllipse(0, -52, 5, 8)
    // Nostrils - subtle
    head.fillStyle(0x000000, 0.3)
    head.fillCircle(-2, -48, 1.5)
    head.fillCircle(4, -48, 1.5)

    // Friendly smile - young and fun
    head.lineStyle(3, 0x8B4513, 1)
    head.beginPath()
    head.arc(0, -42, 12, 0.2, Math.PI - 0.2, false)
    head.strokePath()

    // Teeth - bright and healthy
    head.fillStyle(0xFFFFFF, 1)
    head.beginPath()
    head.arc(0, -42, 11, 0.3, Math.PI - 0.3, false)
    head.lineTo(-8, -42)
    head.closePath()
    head.fillPath()

    // No mustache! Clean shaven for 20s look

    // Subtle jawline definition (youthful structure)
    head.lineStyle(1, 0xE6BEAA, 0.5)
    head.beginPath()
    head.arc(0, -50, 22, 0.8, Math.PI - 0.8, false)
    head.strokePath()

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

    // Create collision zone for the washing line (bigger zone for achievable gameplay)
    this.washingLineZone = this.add.zone(180, 280, 240, 50)
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
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    })

    // High score indicator
    this.highScoreText = this.add.text(20, 55, `Best: ${this.highScore}`, {
      fontSize: '18px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    })

    // Hearts/Strikes
    this.heartsText = this.add.text(360, 20, '❤️❤️❤️', {
      fontSize: '28px',
      fontFamily: 'Arial'
    }).setOrigin(1, 0)

    // Combo display (initially hidden)
    this.comboText = this.add.text(180, 100, '', {
      fontSize: '36px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FF69B4',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0)

    // Multiplier display
    this.multiplierText = this.add.text(360, 55, '', {
      fontSize: '22px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0)

    // Wind indicator with enhanced styling
    this.windText = this.add.text(20, 90, '', {
      fontSize: '22px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    })

    // Perfect throw indicator (hidden)
    this.perfectText = this.add.text(180, 280, 'PERFECT!', {
      fontSize: '48px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFD700',
      stroke: '#FF1493',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0)

    this.updateWindDisplay()
  }

  createPowerMeter() {
    // Power meter background
    this.powerMeterBg = this.add.graphics()
    this.powerMeterBg.fillStyle(0x333333, 0.8)
    this.powerMeterBg.fillRoundedRect(30, 680, 300, 30, 5)

    // Power meter fill
    this.powerMeterFill = this.add.graphics()

    // Instruction text
    this.instructionText = this.add.text(180, 695, 'TAP & HOLD TO THROW', {
      fontSize: '16px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFFF00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
  }

  setupInput() {
    // Touch/Mouse input
    this.input.on('pointerdown', this.startPowering, this)
    this.input.on('pointerup', this.releaseLaundry, this)
  }

  startPowering() {
    if (this.laundryInFlight) return

    this.isPowering = true
    this.power = 0
  }

  releaseLaundry() {
    if (!this.isPowering) return
    if (this.power < 10) {
      this.isPowering = false
      return
    }

    this.isPowering = false
    this.throwLaundry()
  }

  throwLaundry() {
    // Create realistic laundry item with fabric textures
    const itemTypes = [
      { name: 'shirt', colors: [[0xFF6B6B, 0xCC5555], [0x4ECDC4, 0x3DA8A0], [0xFFE66D, 0xCCB857]] },
      { name: 'shorts', colors: [[0x4169E1, 0x2F4F8F], [0x8B4513, 0x654321], [0x228B22, 0x196B19]] },
      { name: 'towel', colors: [[0xFF69B4, 0xCC5490], [0x87CEEB, 0x6BA8CC], [0xFFD700, 0xCCAA00]] }
    ]

    const itemType = Phaser.Utils.Array.GetRandom(itemTypes)
    const colorPair = Phaser.Utils.Array.GetRandom(itemType.colors)
    const baseColor = colorPair[0]
    const shadowColor = colorPair[1]

    const laundry = this.add.graphics()

    if (itemType.name === 'shirt') {
      // Realistic T-shirt with fabric texture
      for (let i = 0; i < 35; i++) {
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(baseColor),
          Phaser.Display.Color.ValueToColor(shadowColor),
          35, i
        )
        laundry.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
        laundry.fillRect(-15, -20 + i, 30, 1)
      }

      // Fabric texture
      for (let i = 0; i < 50; i++) {
        const x = Phaser.Math.Between(-14, 14)
        const y = Phaser.Math.Between(-19, 14)
        laundry.fillStyle(0x000000, Phaser.Math.FloatBetween(0.02, 0.08))
        laundry.fillCircle(x, y, 1)
      }

      // Sleeves with shading
      for (let i = 0; i < 20; i++) {
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(baseColor),
          Phaser.Display.Color.ValueToColor(shadowColor),
          20, i
        )
        laundry.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
        laundry.fillRect(-20, -15 + i, 10, 1)
        laundry.fillRect(10, -15 + i, 10, 1)
      }

      // Collar
      laundry.fillStyle(shadowColor, 1)
      laundry.fillRect(-8, -20, 16, 3)

      // Outline
      laundry.lineStyle(2, 0x000000, 0.3)
      laundry.strokeRect(-15, -20, 30, 35)
      laundry.strokeRect(-20, -15, 10, 20)
      laundry.strokeRect(10, -15, 10, 20)

      // Wrinkles/folds
      laundry.lineStyle(1, 0x000000, 0.2)
      laundry.lineBetween(-10, -10, -5, 5)
      laundry.lineBetween(5, -8, 10, 3)

    } else if (itemType.name === 'shorts') {
      // Realistic shorts
      for (let i = 0; i < 30; i++) {
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(baseColor),
          Phaser.Display.Color.ValueToColor(shadowColor),
          30, i
        )
        laundry.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
        laundry.fillRect(-18, -15 + i, 36, 1)
      }

      // Fabric texture
      for (let i = 0; i < 40; i++) {
        const x = Phaser.Math.Between(-17, 17)
        const y = Phaser.Math.Between(-14, 14)
        laundry.fillStyle(0x000000, Phaser.Math.FloatBetween(0.03, 0.1))
        laundry.fillCircle(x, y, 1)
      }

      // Waistband
      laundry.fillStyle(shadowColor, 1)
      laundry.fillRect(-18, -15, 36, 4)

      // Leg openings
      laundry.fillStyle(0x000000, 0.2)
      laundry.fillRect(-18, 10, 15, 5)
      laundry.fillRect(3, 10, 15, 5)

      // Outline
      laundry.lineStyle(2, 0x000000, 0.3)
      laundry.strokeRect(-18, -15, 36, 30)

    } else {
      // Realistic towel
      for (let i = 0; i < 40; i++) {
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(baseColor),
          Phaser.Display.Color.ValueToColor(shadowColor),
          40, i
        )
        laundry.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
        laundry.fillRect(-20, -20 + i, 40, 1)
      }

      // Terry cloth texture (loops)
      for (let i = 0; i < 80; i++) {
        const x = Phaser.Math.Between(-19, 19)
        const y = Phaser.Math.Between(-19, 19)
        laundry.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.1, 0.2))
        laundry.fillCircle(x, y, 2)
      }

      // Stripes
      laundry.fillStyle(shadowColor, 0.4)
      laundry.fillRect(-20, -18, 40, 3)
      laundry.fillRect(-20, 15, 40, 3)

      // Outline
      laundry.lineStyle(2, 0x000000, 0.3)
      laundry.strokeRect(-20, -20, 40, 40)
    }

    // Add dynamic shadow that will move with the item
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.3)
    shadow.fillEllipse(0, 0, 30, 10)
    laundry.shadow = shadow

    laundry.x = 70
    laundry.y = 540

    this.physics.add.existing(laundry)

    // Balanced physics - challenging but achievable
    const powerFactor = this.power / 100
    const baseVelocityX = powerFactor * 300
    const windEffect = this.windSpeed * this.windDirection * 8  // Reduced wind impact for better control
    const velocityX = baseVelocityX + windEffect
    const velocityY = -(powerFactor * 600) - 150

    laundry.body.setVelocity(velocityX, velocityY)
    laundry.body.setAngularVelocity(Phaser.Math.Between(150, 300))
    laundry.body.setDrag(10, 5)  // Reduced drag for more predictable trajectory

    this.laundryInFlight = laundry
    this.totalThrows++  // Track total throws

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
    this.windText.setText(`Wind: ${arrow} ${this.windSpeed}`)
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
    // Stop the laundry
    laundry.body.setVelocity(0, 0)
    laundry.body.setAngularVelocity(0)

    // Snap to line
    laundry.y = 290

    // Check for perfect throw (landed near center of line)
    const lineCenter = 180
    const perfectRange = 30
    const isPerfect = Math.abs(laundry.x - lineCenter) < perfectRange

    if (isPerfect) {
      this.perfectThrows++
      this.showPerfectThrow()
    }

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

    // Update wind every 5 successful hangs with visual effect
    if (this.successfulHangs % 5 === 0) {
      this.updateWind()
      this.showWindGust()
    }

    // Clear laundry reference
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
      fontFamily: 'Comic Sans MS, cursive',
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
    // Sparkle particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const particle = this.add.graphics()
      particle.fillStyle(0xFFD700, 1)
      particle.fillStar(0, 0, 5, 4, 8, 0)
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
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    const desc = this.add.text(0, 10, achievement.desc, {
      fontSize: '14px',
      fontFamily: 'Comic Sans MS, cursive',
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

    // Remove laundry and shadow
    if (laundry.shadow) laundry.shadow.destroy()
    laundry.destroy()
    this.laundryInFlight = null

    // COMBO BREAKER!
    if (this.combo >= 3) {
      const breakerText = this.add.text(180, 300, 'COMBO BROKEN!', {
        fontSize: '32px',
        fontFamily: 'Comic Sans MS, cursive',
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
          totalThrows: this.totalThrows
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
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5)

    const instructions = [
      '👆 TAP & HOLD to charge power',
      '🎯 AIM for the washing line',
      '💨 Watch the WIND direction',
      '⭐ Land near CENTER for PERFECT',
      '🔥 Build COMBOS for bonus points',
      '❤️ Don\'t hit the pool 3 times!',
      '',
      'TAP TO START!'
    ]

    const instructionTexts = instructions.map((text, index) => {
      return this.add.text(0, -200 + index * 40, text, {
        fontSize: '18px',
        fontFamily: 'Comic Sans MS, cursive',
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
    this.tweens.add({
      targets: this.unclePaul,
      y: 420,
      duration: 100,
      yoyo: true,
      repeat: 2
    })
  }

  sadUnclePaul() {
    this.tweens.add({
      targets: this.unclePaul,
      angle: -5,
      duration: 100,
      yoyo: true,
      repeat: 3
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
    // Sky gradient background
    const sky = this.add.graphics()
    for (let i = 0; i < 740; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 135, g: 206, b: 235 },
        { r: 224, g: 246, b: 255 },
        740, i
      )
      sky.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      sky.fillRect(0, i, 360, 1)
    }

    // Sun
    const sun = this.add.graphics()
    for (let i = 0; i < 8; i++) {
      sun.fillStyle(0xFFFF99, 0.05 - i * 0.005)
      sun.fillCircle(300, 80, 40 + i * 5)
    }
    sun.fillStyle(0xFFFFAA, 1)
    sun.fillCircle(300, 80, 25)
    sun.fillStyle(0xFFFFDD, 0.8)
    sun.fillCircle(298, 78, 20)

    // Animated clouds
    for (let i = 0; i < 3; i++) {
      const cloud = this.add.graphics()
      const startX = Phaser.Math.Between(-50, 360)
      const y = Phaser.Math.Between(60, 150)

      cloud.fillStyle(0xFFFFFF, 0.7)
      cloud.fillCircle(0, 0, 25)
      cloud.fillCircle(20, -5, 20)
      cloud.fillCircle(-20, -5, 20)
      cloud.fillCircle(10, 5, 18)
      cloud.fillCircle(-10, 5, 18)

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

    // Game Title with shadow
    const titleShadow = this.add.text(180, 252, "UNCLE PAUL'S", {
      fontSize: '42px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#000000',
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const title = this.add.text(180, 250, "UNCLE PAUL'S", {
      fontSize: '42px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFD700',
      stroke: '#FF6B00',
      strokeThickness: 6,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const subtitleShadow = this.add.text(180, 302, 'POOLSIDE PANIC', {
      fontSize: '36px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#000000',
      stroke: '#000000',
      strokeThickness: 7,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const subtitle = this.add.text(180, 300, 'POOLSIDE PANIC', {
      fontSize: '36px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#00D4FF',
      stroke: '#0066CC',
      strokeThickness: 5,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Pulse animation on title
    this.tweens.add({
      targets: [title, subtitle],
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Tagline
    this.add.text(180, 360, 'Hang laundry, battle the wind!', {
      fontSize: '18px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    // High score display
    const highScore = parseInt(localStorage.getItem('unclePaulHighScore') || '0')
    if (highScore > 0) {
      this.add.text(180, 410, `HIGH SCORE: ${highScore}`, {
        fontSize: '24px',
        fontFamily: 'Comic Sans MS, cursive',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5)
    }

    // Play button
    const button = this.add.graphics()
    button.fillStyle(0x4CAF50, 1)
    button.fillRoundedRect(80, 480, 200, 70, 15)
    button.lineStyle(5, 0x45A049, 1)
    button.strokeRoundedRect(80, 480, 200, 70, 15)

    const buttonText = this.add.text(180, 515, '▶ PLAY NOW!', {
      fontSize: '32px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 5,
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Bounce animation on button
    this.tweens.add({
      targets: [button, buttonText],
      y: '+=5',
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Make button interactive
    const buttonZone = this.add.zone(180, 515, 200, 70)
    buttonZone.setInteractive({ useHandCursor: true })

    buttonZone.on('pointerdown', () => {
      button.clear()
      button.fillStyle(0x45A049, 1)
      button.fillRoundedRect(80, 480, 200, 70, 15)
    })

    buttonZone.on('pointerup', () => {
      this.scene.start('GameScene')
    })

    buttonZone.on('pointerover', () => {
      buttonText.setScale(1.1)
      button.setAlpha(0.9)
    })

    buttonZone.on('pointerout', () => {
      buttonText.setScale(1)
      button.setAlpha(1)
    })

    // Credits at bottom
    this.add.text(180, 680, 'Made with ❤️ for Uncle Paul', {
      fontSize: '14px',
      fontFamily: 'Comic Sans MS, cursive',
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
    this.highScore = parseInt(localStorage.getItem('unclePaulHighScore') || '0')
  }

  create() {
    // Semi-transparent overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.8)
    overlay.fillRect(0, 0, 360, 740)

    // Game Over text with animation
    const gameOverText = this.add.text(180, 150, 'GAME OVER!', {
      fontSize: '52px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FF0000',
      stroke: '#000000',
      strokeThickness: 6
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
    this.add.text(180, 220, `Score: ${this.finalScore}`, {
      fontSize: '40px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5)

    // New high score indicator
    if (this.finalScore >= this.highScore && this.finalScore > 0) {
      const newBestText = this.add.text(180, 265, '🎉 NEW BEST! 🎉', {
        fontSize: '24px',
        fontFamily: 'Comic Sans MS, cursive',
        color: '#00FF00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5)

      this.tweens.add({
        targets: newBestText,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
      })
    }

    // Stats panel
    const statsY = 310
    const lineHeight = 35

    this.add.text(180, statsY, 'STATS', {
      fontSize: '24px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.add.text(180, statsY + lineHeight, `Best Combo: ${this.maxCombo}`, {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FF69B4'
    }).setOrigin(0.5)

    this.add.text(180, statsY + lineHeight * 2, `Perfect Throws: ${this.perfectThrows}`, {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFD700'
    }).setOrigin(0.5)

    const accuracy = this.totalThrows > 0 ? Math.round((this.finalScore / this.totalThrows) * 100) : 0
    this.add.text(180, statsY + lineHeight * 3, `Accuracy: ${accuracy}%`, {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#00FF00'
    }).setOrigin(0.5)

    this.add.text(180, statsY + lineHeight * 4, `High Score: ${this.highScore}`, {
      fontSize: '18px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#AAAAAA'
    }).setOrigin(0.5)

    // Uncle Paul says
    this.add.text(180, 360, 'Uncle Paul says:', {
      fontSize: '20px',
      fontFamily: 'Comic Sans MS, cursive',
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
    this.add.text(180, 400, message, {
      fontSize: '18px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5)

    // Play Again button
    const button = this.add.graphics()
    button.fillStyle(0x4CAF50, 1)
    button.fillRoundedRect(105, 480, 150, 60, 10)
    button.lineStyle(4, 0x2E7D32, 1)
    button.strokeRoundedRect(105, 480, 150, 60, 10)

    const buttonText = this.add.text(180, 510, 'PLAY AGAIN', {
      fontSize: '24px',
      fontFamily: 'Comic Sans MS, cursive',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    // Make button interactive
    const buttonZone = this.add.zone(180, 510, 150, 60)
    buttonZone.setInteractive({ useHandCursor: true })

    buttonZone.on('pointerdown', () => {
      button.clear()
      button.fillStyle(0x45A049, 1)
      button.fillRoundedRect(105, 480, 150, 60, 10)
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
