import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { COLORS } from '../constants';

const SystemShatter: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Common = Matter.Common;

    const engine = Engine.create();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false
      }
    });

    // Create Shatter Shards
    // We create a grid of polygons to simulate the screen breaking
    const cols = 10;
    const rows = 10;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const shards: Matter.Body[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellWidth + cellWidth / 2;
        const y = r * cellHeight + cellHeight / 2;
        
        // Randomize vertices slightly to make it look like broken glass
        const sides = Math.floor(Math.random() * 3) + 3; // 3 to 5 sides
        const radius = Math.min(cellWidth, cellHeight) / 1.5;

        const shard = Bodies.polygon(x, y, sides, radius, {
          render: {
            fillStyle: COLORS.BACKGROUND,
            strokeStyle: Math.random() > 0.5 ? COLORS.CYAN : COLORS.MAGENTA,
            lineWidth: 1
          },
          restitution: 0.1,
          friction: 0.5
        });

        // Add random rotation and slight offset
        Matter.Body.rotate(shard, Math.random() * Math.PI);
        shards.push(shard);
      }
    }

    Composite.add(engine.world, shards);

    // Run
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Initial explostion to break the static look
    shards.forEach(shard => {
       Matter.Body.setStatic(shard, false); // Ensure they fall
       // Small push
       Matter.Body.applyForce(shard, shard.position, {
         x: (Math.random() - 0.5) * 0.05,
         y: 0.05 // Push down
       });
    });

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
    };
  }, []);

  return <div ref={sceneRef} className="absolute inset-0 z-40 pointer-events-none" />;
};

export default SystemShatter;