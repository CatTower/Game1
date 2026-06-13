---
name: phaser-js
description: Guidelines for Phaser 3 game engine development.
---
# Phaser 3 Game Development

## 1. Setup and Config
Configure the game window, rendering type, and physics engines.

```javascript
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
const game = new Phaser.Game(config);
```

## 2. Basic Scene Functions
- **preload()**: Load assets before starting.
  ```javascript
  function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
  }
  ```
- **create()**: Initialize game objects.
  ```javascript
  function create() {
    this.add.image(400, 300, 'sky');
    this.player = this.physics.add.sprite(100, 450, 'dude');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
  }
  ```
- **update()**: Runs every frame.
  ```javascript
  function update() {
    const cursors = this.input.keyboard.createCursorKeys();
    if (cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }
  }
  ```
