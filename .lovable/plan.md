

# Windows 95 Desktop Theme Overhaul

Transform the entire app from the retro green terminal aesthetic into an authentic Windows 95 desktop experience with classic UI chrome, system fonts, and the iconic gray color palette.

## What Changes

### 1. Color Palette and CSS Variables (`src/index.css`)
- Replace all green terminal HSL values with Windows 95 colors:
  - Background: classic teal desktop (`#008080`)
  - Window background: `#c0c0c0` (silver gray)
  - Primary: `#000080` (navy blue title bars)
  - Text: black on gray
  - Borders: white (highlight) and `#808080` (shadow) for the classic beveled 3D look
- Remove all terminal-specific effects: scanlines, CRT flicker, glow-pulse, matrix-fall, text-glow utilities
- Replace scrollbar styling with Win95-style gray scrollbars
- Add new Win95 utility classes for raised/sunken 3D border effects (`win95-raised`, `win95-sunken`, `win95-button`)

### 2. Fonts (`src/index.css` + `tailwind.config.ts`)
- Replace VT323 and Share Tech Mono Google Fonts import with MS Sans Serif / Tahoma / Arial stack
- Update `fontFamily` in Tailwind config from `terminal`/`mono` to `win95` system font stack
- Body font set to the classic pixelated sans-serif look

### 3. TerminalWindow -> Win95 Window (`src/components/TerminalWindow.tsx`)
- Replace the terminal chrome with a classic Win95 window:
  - Gray title bar with navy blue gradient background
  - White title text, left-aligned
  - Minimize, maximize, close buttons (squares with symbols) on the right
  - 3D beveled border (white top/left, dark gray bottom/right)
  - Remove scanlines overlay and CRT flicker

### 4. TerminalButton -> Win95 Button (`src/components/TerminalButton.tsx`)
- Classic raised 3D gray button with beveled borders
- Pressed state: sunken border effect
- Remove bracket decorations `[ ]` and glow effects
- Standard black text on gray background

### 5. TerminalInput -> Win95 Input (`src/components/TerminalInput.tsx`)
- White sunken input field with black text
- Remove the `$` prefix and blinking cursor overlay
- Standard label styling above the input

### 6. ASCIIElements -> Win95 Elements (`src/components/ASCIIElements.tsx`)
- ASCIILoader: Replace ASCII progress bar with Win95-style chunky blue progress bar in a sunken frame
- ASCIIDivider: Replace `===` line with Win95 horizontal rule (sunken groove line)
- BlinkingCursor: Standard text cursor
- Remove ASCIIBox component's Unicode box-drawing characters

### 7. StoryDisplay (`src/components/StoryDisplay.tsx`)
- Replace ASCII art "SELECT A ROVER" box with a simple Win95 dialog message
- Story content in a white sunken text area
- Replace terminal decorations (corner glyphs, dashed lines) with simple Win95 group boxes

### 8. TraitDisplay (`src/components/TraitDisplay.tsx`)
- Replace ASCII tree characters with a Win95 list view / property sheet style
- Simple table layout with sunken cells

### 9. WordCountSelector (`src/components/WordCountSelector.tsx`)
- Style as Win95 radio buttons or option group in a group box frame

### 10. BattleSimulator (`src/components/BattleSimulator.tsx`)
- Rover cards styled as Win95 windows/panels with 3D borders
- Battle results in dialog-style boxes
- Alpha Rovers tab and battle tab styled as Win95 property sheet tabs

### 11. BackgroundMusic (`src/components/BackgroundMusic.tsx`)
- Style the toggle button as a Win95 taskbar-style button

### 12. Index Page (`src/pages/Index.tsx`)
- Teal desktop background
- Tab navigation styled as Win95 property sheet tabs
- Optional: a simple taskbar at the bottom with a "Start" button and clock

### 13. Tailwind Config (`tailwind.config.ts`)
- Update color tokens for Win95 palette
- Remove terminal-specific animations (pulse-glow, typing, blink)
- Add Win95-specific border radius (1-2px, not 0)
- Update keyframes for simpler Win95-style animations

## Technical Details

### Win95 3D Border CSS Pattern
```text
Raised:  border-top/left = white, border-bottom/right = #808080, outer shadow = black
Sunken:  border-top/left = #808080, border-bottom/right = white
Button:  raised at rest, sunken on :active
```

### Win95 Color Tokens
```text
Desktop:     #008080 (teal)
Window:      #c0c0c0 (silver)  
Title bar:   #000080 (navy) -> #1084d0 (gradient)
Title text:  #ffffff
Button face: #c0c0c0
Text:        #000000
Highlight:   #000080 bg, #ffffff text
Disabled:    #808080
```

### Files Modified (13 files)
1. `src/index.css` - Complete theme rewrite
2. `tailwind.config.ts` - Colors, fonts, animations
3. `src/components/TerminalWindow.tsx` - Win95 window chrome
4. `src/components/TerminalButton.tsx` - Win95 button style
5. `src/components/TerminalInput.tsx` - Win95 input field
6. `src/components/ASCIIElements.tsx` - Win95 progress/dividers
7. `src/components/StoryDisplay.tsx` - Win95 text display
8. `src/components/TraitDisplay.tsx` - Win95 list/table view
9. `src/components/WordCountSelector.tsx` - Win95 option group
10. `src/components/BattleSimulator.tsx` - Win95 panels and dialogs
11. `src/components/BackgroundMusic.tsx` - Win95 taskbar button
12. `src/components/AlphaRovers.tsx` - Win95 card styling
13. `src/pages/Index.tsx` - Desktop layout with taskbar

