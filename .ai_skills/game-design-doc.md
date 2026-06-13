---
name: game-design-doc
description: Framework and template for generating structured Game Design Documents (GDD).
---
# Game Design Document (GDD) Template & Guidelines

Use this document as a framework when designing new games. It ensures all aspects of mechanics, visuals, audio, and code structure are planned before writing code.

## 1. Executive Summary
- **Concept**: Elevator pitch of the game.
- **Genre**: e.g., 2D Platformer, Puzzle, Rogue-like.
- **Target Audience**: Age group, platform (web, mobile, PC).
- **Unique Selling Point (USP)**: What makes this game stand out?

## 2. Core Gameplay Loop
Describe the primary action loop the player performs repeatedly.
- *Example*: Control player -> Dodge obstacles -> Collect coins -> Reach exit -> Load next level.

## 3. Game Mechanics
- **Controls**: Key mappings (WASD, Arrows, Space, Mouse click).
- **Movement & Physics**: Speed, jump height, gravity, friction.
- **Game State**: Score, lives, current level, game over conditions.
- **Win/Loss Conditions**: How to win, how to lose.

## 4. Visual & Audio Style
- **Art Style**: Pixel art, vector, minimalist, dark mode, colors.
- **UI Elements**: HUD (heads-up display) for score/lives, main menu, pause menu.
- **Sound Effects (SFX)**: Actions that need sound (jump, hit, win).
- **Background Music (BGM)**: Main loop theme.

## 5. Technical Stack
- **Engine/Framework**: e.g., Phaser 3, Vanilla JS Canvas.
- **Folder Structure**:
  - `/assets` - sprites, audio
  - `/src` - source code (components, scenes)
  - `index.html` - entry point
