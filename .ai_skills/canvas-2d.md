---
name: canvas-2d
description: Guidelines for HTML5 Canvas 2D game loop, rendering, and physics.
---
# HTML5 Canvas 2D Game Development

## 1. Game Loop (requestAnimationFrame)
Always use a delta-time (dt) adjusted game loop to keep updates independent of frame rate.

```javascript
let lastTime = 0;
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

## 2. Canvas Rendering Best Practices
- **Clear Canvas**: `ctx.clearRect(0, 0, width, height)` or redraw background.
- **State Save/Restore**: Wrap transformations in `ctx.save()` and `ctx.restore()`.
- **Pixel Art Scaling**: Set `ctx.imageSmoothingEnabled = false` for retro styles.

## 3. Basic 2D Collision Detection
- **AABB (Axis-Aligned Bounding Box)**:
  ```javascript
  function checkAABB(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  ```
- **Circle-Circle**:
  ```javascript
  function checkCircle(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.radius + c2.radius;
  }
  ```
