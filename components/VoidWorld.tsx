import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { Task } from '../types';
import { COLORS, PHYSICS } from '../constants';

interface VoidWorldProps {
  tasks: Task[];
  onTaskComplete: (id: string) => void;
  onAllCleared: () => void;
}

const VoidWorld: React.FC<VoidWorldProps> = ({ tasks, onTaskComplete, onAllCleared }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  
  // Track tasks to sync physics bodies
  const taskBodiesRef = useRef<Map<string, Matter.Body>>(new Map());
  
  // Refs for props/state to access inside Matter.js loops without closure staleness
  const tasksRef = useRef(tasks);
  const onTaskCompleteRef = useRef(onTaskComplete);
  const onAllClearedRef = useRef(onAllCleared);
  const blackHolesRef = useRef<{ x: number; y: number; active: boolean }[]>([]);
  const particlesRef = useRef<Matter.Body[]>([]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    onTaskCompleteRef.current = onTaskComplete;
    onAllClearedRef.current = onAllCleared;
  }, [onTaskComplete, onAllCleared]);

  // Setup Matter.js
  useEffect(() => {
    if (!sceneRef.current) return;

    // Module aliases
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Events = Matter.Events,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Vector = Matter.Vector;

    // Create engine
    const engine = Engine.create();
    engine.gravity.y = 0.5; // Normal gravity
    engineRef.current = engine;

    // Create renderer
    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        background: 'transparent', // Let HTML background show
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    });

    // Walls
    const wallOptions = { isStatic: true, render: { visible: false } };
    const walls = [
      Bodies.rectangle(width / 2, height + PHYSICS.WALL_THICKNESS / 2 - 10, width, PHYSICS.WALL_THICKNESS, wallOptions), // Floor
      Bodies.rectangle(-PHYSICS.WALL_THICKNESS / 2, height / 2, PHYSICS.WALL_THICKNESS, height, wallOptions), // Left
      Bodies.rectangle(width + PHYSICS.WALL_THICKNESS / 2, height / 2, PHYSICS.WALL_THICKNESS, height, wallOptions) // Right
    ];
    Composite.add(engine.world, walls);

    // Mouse Interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Composite.add(engine.world, mouseConstraint);

    // Helper to check button hit
    const isOverButton = (body: Matter.Body, mousePosition: Matter.Vector) => {
        // Calculate click position relative to body center
        const dx = mousePosition.x - body.position.x;
        const dy = mousePosition.y - body.position.y;
        
        // Rotate coordinates
        const angle = -body.angle;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // Button Configuration
        // Visual button size is 24, but we give a larger hit area (40px)
        const hitSize = 40; 
        const btnX = (PHYSICS.TASK_WIDTH / 2) - 30; // 30px padding from right
        const btnY = 0; 

        return (
            localX >= btnX - hitSize/2 && 
            localX <= btnX + hitSize/2 &&
            localY >= btnY - hitSize/2 &&
            localY <= btnY + hitSize/2
        );
    };

    // Destruction Logic
    const handleTaskDestruction = (body: Matter.Body, taskId: string) => {
      if (!taskBodiesRef.current.has(taskId)) return;
      
      Matter.Composite.remove(engine.world, body);
      taskBodiesRef.current.delete(taskId);
      
      if (onTaskCompleteRef.current) {
        onTaskCompleteRef.current(taskId);
      }

      // Create Particles
      const particleCount = PHYSICS.EXPLOSION_PARTICLES;
      const newParticles: Matter.Body[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * PHYSICS.PARTICLE_SIZE + 2;
        const x = body.position.x + (Math.random() - 0.5) * PHYSICS.TASK_WIDTH;
        const y = body.position.y + (Math.random() - 0.5) * PHYSICS.TASK_HEIGHT;
        
        const particle = Matter.Bodies.rectangle(x, y, size, size, {
          render: {
            fillStyle: body.render.strokeStyle as string
          },
          frictionAir: 0.05,
        });
        
        Matter.Body.applyForce(particle, particle.position, {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02
        });

        newParticles.push(particle);
      }
      
      Matter.Composite.add(engine.world, newParticles);
      particlesRef.current.push(...newParticles);

      // Activate Black Hole
      blackHolesRef.current.push({
        x: body.position.x,
        y: body.position.y,
        active: true
      });

      // Cleanup
      setTimeout(() => {
         const hole = blackHolesRef.current.find(h => h.x === body.position.x && h.y === body.position.y);
         if(hole) hole.active = false;
         
         if (taskBodiesRef.current.size === 0) {
           setTimeout(() => {
              if (onAllClearedRef.current) onAllClearedRef.current();
           }, 1000);
         }
      }, 2000);
    };

    // Mouse Move - Cursor Feedback
    Events.on(mouseConstraint, 'mousemove', (event) => {
        const mousePosition = event.mouse.position;
        const bodies = Composite.allBodies(engine.world);
        // Specifically look for task bodies
        const hoveredBodies = Matter.Query.point(bodies, mousePosition).filter(b => b.label.startsWith('task-'));
        
        let hoveringButton = false;
        for (const body of hoveredBodies) {
            if (isOverButton(body, mousePosition)) {
                hoveringButton = true;
                break;
            }
        }
        
        render.canvas.style.cursor = hoveringButton ? 'pointer' : 'default';
    });

    // Click Handling
    Events.on(mouseConstraint, 'mousedown', (event) => {
      const mousePosition = event.mouse.position;
      const bodies = Composite.allBodies(engine.world);
      // Find FIRST task body under cursor (Query.point can return multiple overlapping bodies)
      const clickedBody = Matter.Query.point(bodies, mousePosition).find(b => b.label.startsWith('task-'));
      
      if (clickedBody) {
        if (isOverButton(clickedBody, mousePosition)) {
            const taskId = clickedBody.label.replace('task-', '');
            handleTaskDestruction(clickedBody, taskId);
        }
      }
    });

    // Game Loop
    Events.on(engine, 'beforeUpdate', () => {
      blackHolesRef.current.forEach((hole) => {
        if (!hole.active) return;
        
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const particle = particlesRef.current[i];
          const forceVector = Vector.sub({ x: hole.x, y: hole.y }, particle.position);
          const distance = Vector.magnitude(forceVector);
          
          if (distance < PHYSICS.BLACK_HOLE_RADIUS) {
            Composite.remove(engine.world, particle);
            particlesRef.current.splice(i, 1);
          } else {
            const normalizedForce = Vector.normalise(forceVector);
            const forceMagnitude = PHYSICS.BLACK_HOLE_FORCE * particle.mass;
            const swirl = Vector.perp(normalizedForce);
            
            Matter.Body.applyForce(particle, particle.position, Vector.mult(normalizedForce, forceMagnitude));
            Matter.Body.applyForce(particle, particle.position, Vector.mult(swirl, forceMagnitude * 0.5));
          }
        }
      });
    });

    // Custom Rendering
    Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '16px "Share Tech Mono", monospace';
      
      taskBodiesRef.current.forEach((body, id) => {
        const task = tasksRef.current.find(t => t.id === id);
        if (task) {
          ctx.save();
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);
          
          // Draw Task Text
          ctx.shadowColor = body.render.strokeStyle as string;
          ctx.shadowBlur = 10;
          ctx.fillStyle = COLORS.WHITE;
          ctx.fillText(task.text, -15, 0); 
          
          // Draw Delete Button
          const btnSize = 24;
          const btnX = (PHYSICS.TASK_WIDTH / 2) - 30;
          
          // Button Box
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#ff003c';
          ctx.strokeStyle = '#ff003c'; 
          ctx.lineWidth = 2;
          ctx.strokeRect(btnX - btnSize/2, -btnSize/2, btnSize, btnSize);

          // Button 'X'
          ctx.beginPath();
          ctx.moveTo(btnX - 6, -6);
          ctx.lineTo(btnX + 6, 6);
          ctx.moveTo(btnX + 6, -6);
          ctx.lineTo(btnX - 6, 6);
          ctx.stroke();

          ctx.restore();
        }
      });
    });

    // Run
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Cleanup
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
    };
  }, []);

  // Sync React Tasks with Matter Bodies
  useEffect(() => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const width = window.innerWidth;

    tasks.forEach(task => {
      if (!taskBodiesRef.current.has(task.id)) {
        const x = Math.random() * (width - 400) + 200;
        const y = -100;
        
        const isCyan = Math.random() > 0.5;
        const color = isCyan ? COLORS.CYAN : COLORS.MAGENTA;

        const body = Bodies.rectangle(x, y, PHYSICS.TASK_WIDTH, PHYSICS.TASK_HEIGHT, {
          label: `task-${task.id}`,
          chamfer: { radius: 5 },
          restitution: 0.5,
          friction: 0.1,
          render: {
            fillStyle: 'transparent',
            strokeStyle: color,
            lineWidth: 2,
          }
        });
        
        Composite.add(world, body);
        taskBodiesRef.current.set(task.id, body);
      }
    });
  }, [tasks]);

  return <div ref={sceneRef} className="absolute inset-0 z-0" />;
};

export default VoidWorld;