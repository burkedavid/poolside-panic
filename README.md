# Uncle Paul's Poolside Panic 🏊‍♂️👕

A mobile-first browser game built with Phaser 3 where players hang laundry on a washing line while battling wind gusts that threaten to blow clothes into the pool!

## 🎮 Game Features

- **Tap-hold-release mechanic** - Charge power and throw laundry items
- **Wind system** - Dynamic wind affects trajectory (increases difficulty over time)
- **Cartoon graphics** - Simpsons-style Portuguese villa with pool
- **Various clothing types** - T-shirts, pants, socks, and shorts
- **3 strikes system** - Don't let too many items fall in the pool!
- **Progressive difficulty** - Wind speed increases every 5 successful hangs

## 🚀 Play Now

[Play the game here](#) _(Coming soon after Vercel deployment)_

## 🛠️ Tech Stack

- **Phaser 3** - Game framework
- **JavaScript ES6+** - Game logic
- **Single HTML file** - Easy deployment
- **Mobile-optimized** - Touch controls for mobile browsers

## 🎯 How to Play

1. **Tap and hold** anywhere on screen to charge power meter
2. Watch the meter fill (red → yellow → green)
3. **Release** to throw the laundry item
4. Aim for the **washing line**
5. Avoid the **pool** - you only have 3 hearts!
6. Wind direction and speed shown at top of screen
7. Score points for each successful hang

## 🏃 Run Locally

```bash
# Clone the repository
git clone https://github.com/burkedavid/poolside-panic.git
cd poolside-panic

# Start a local server (Python)
python3 -m http.server 8000

# Or use Node.js http-server
npx http-server

# Open browser to http://localhost:8000
```

## 📦 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or use the Vercel web interface:
1. Import GitHub repository
2. Framework Preset: "Other"
3. Build Command: (leave empty)
4. Output Directory: `./`
5. Deploy!

## 🎨 Game Design

### Phase 1: MVP (Complete)
- ✅ Core gameplay mechanics
- ✅ Power meter system
- ✅ Wind physics
- ✅ Collision detection
- ✅ Cartoon graphics
- ✅ Multiple clothing types
- ✅ Uncle Paul character
- ✅ Portuguese villa scene

### Phase 2: Polish (Future)
- 🔄 Uncle Paul animations (cheer/sad reactions)
- 🔄 Sound effects (splash, success, wind)
- 🔄 Background music
- 🔄 Particle effects
- 🔄 Local high scores
- 🔄 Difficulty selection

## 📄 License

MIT

## 🤝 Credits

Game concept and design by Uncle Paul enthusiasts worldwide!
