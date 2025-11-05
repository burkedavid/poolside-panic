# 🎮 Uncle Paul's Poolside Panic - VIRAL EDITION 🔥

The most addictive mobile game of the year! Help Uncle Paul hang laundry while battling crazy Portuguese winds. Build insane combos, unlock achievements, and compete for the high score!

## 🌟 VIRAL GAME FEATURES

### 🎯 Core Mechanics
- **Photorealistic Graphics** - Near-lifelike Portuguese villa scene with detailed textures
- **Uncle Paul Character** - Cool, relatable character who reacts to your plays
- **Tap-and-Hold Power System** - Smooth gradient power meter (green → yellow → orange → red)
- **Dynamic Wind Physics** - Wind affects trajectory in real-time with visual particles
- **Perfect Throw System** - Land near center for 2x points + "PERFECT!" animation
- **Progressive Difficulty** - Wind increases every 5 successful hangs (5-30 mph range)

### 🔥 COMBO SYSTEM
- **Build Streaks** - Chain successful hangs for massive bonuses
- **Score Multipliers** - Every 3 combos = 1x multiplier increase
- **Combo Notifications** - "3 COMBO!", "5 COMBO!", "10 COMBO!"
- **Combo Breaker** - Dramatic "COMBO BROKEN!" when you miss
- **Special Effects** - Screen shake and color flashes at 5 and 10 combos

### 🏆 ACHIEVEMENT SYSTEM
- **First Hang!** - Hang your first item
- **Combo Master!** - Get 10 in a row
- **Perfectionist** - 5 perfect throws
- **Laundry Pro** - Score 50 points
- **Slide-in Notifications** - Beautiful animated achievement popups
- **Persistent Progress** - Achievements saved to localStorage

### 💎 VISUAL POLISH ("Juice")
- **Golden Star Particles** - 12 stars burst on every success
- **Floating Score Popups** - +1, +2, +4 points animate upward
- **Dynamic Shadows** - Laundry casts realistic moving shadows
- **Wind Gust Effects** - 15 particle streams show wind direction
- **Animated Clouds** - 4 fluffy clouds drift across the sky
- **Water Shimmer** - Pool surface reflects and shimmers
- **Camera Effects** - Flash on success, shake on failure
- **Realistic Splash** - Multi-layered water droplets with ripples

### 📊 STATS & PROGRESSION
- **High Score System** - Best score saved locally with localStorage
- **Detailed Stats** - Track best combo, perfect throws, accuracy
- **New Best Celebration** - Pulsing "🎉 NEW BEST! 🎉" notification
- **Enhanced Game Over** - Full stats breakdown with accuracy percentage
- **Persistent Data** - All progress saves between sessions

## How to Play

1. **TAP & HOLD** anywhere on the screen to charge your throw power
2. Watch the power meter fill up (green → yellow → red)
3. **RELEASE** to throw the laundry item toward the washing line
4. The **wind** will affect your trajectory - watch the wind indicator!
5. **Score points** by getting clothes on the washing line
6. **Lose a heart** if clothes land in Uncle Paul's pool
7. Game ends when you lose all 3 hearts

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The game will open at `http://localhost:3000` (or next available port)

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Deployment to Vercel

### Quick Deploy

1. Push this repository to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Vercel will auto-detect the Vite configuration
6. Click "Deploy"

### Manual Configuration (if needed)

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Technology Stack

- **Phaser 3** (v3.80.1) - Game framework with excellent physics and rendering
- **Vite** - Lightning-fast build tool and dev server
- **JavaScript ES6+** - Modern JavaScript features
- **Mobile-first design** - Optimized for touch screens

## Game Mechanics

### Scoring System
- +1 point per successful hang
- Lose 1 heart when clothes land in pool
- Game over at 0 hearts

### Wind System
- Wind speed: 5-30 (increases every 5 successful hangs)
- Wind direction: Random (left or right)
- Visual indicator shows current wind

### Power Meter
- Range: 0-100%
- Color indicators: Green (weak), Yellow (medium), Red (strong)
- Affects both throw distance and arc height

## Phase 1 MVP Features (Complete)

✅ Simpsons-quality cartoon graphics
✅ Uncle Paul character with funny appearance
✅ Portuguese villa setting with pool
✅ Tap-hold-release power meter
✅ Physics-based laundry throwing
✅ Wind system with visual indicator
✅ Collision detection (line/pool)
✅ Score and strike system
✅ Game over screen with replay
✅ Responsive mobile design
✅ Uncle Paul reactions (celebrate/sad)

## Future Enhancements (Phase 2+)

- Multiple clothing types (shirts, pants, socks)
- Sound effects and background music
- Particle effects (splashes, sparkles)
- Local high score system
- Difficulty selection
- Animated Uncle Paul reactions
- Tutorial overlay
- Pause functionality

## Browser Support

- iOS Safari (mobile)
- Chrome Android (mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Credits

Built with Phaser 3 game framework
Designed for mobile-first gameplay
Created with love for Uncle Paul! 🏖️

---

**Have fun and keep the laundry dry!** 👕🌊
