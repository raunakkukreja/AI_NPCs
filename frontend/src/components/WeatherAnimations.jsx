// frontend/src/components/WeatherAnimations.jsx
import React, { useEffect, useRef } from 'react';

const WeatherAnimations = ({ animations = [], intensity = 0.5 }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = particlesRef.current;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles based on animations
    const initializeParticles = () => {
      particles.length = 0;

      if (animations.includes('rain')) {
        for (let i = 0; i < 100 * intensity; i++) {
          particles.push(createRainDrop());
        }
      }

      if (animations.includes('snow')) {
        for (let i = 0; i < 80 * intensity; i++) {
          particles.push(createSnowflake());
        }
      }

      if (animations.includes('fog')) {
        for (let i = 0; i < 20 * intensity; i++) {
          particles.push(createFogParticle());
        }
      }

      if (animations.includes('clouds')) {
        for (let i = 0; i < 5; i++) {
          particles.push(createCloudParticle());
        }
      }
    };

    // Particle creation functions
    const createRainDrop = () => ({
      type: 'rain',
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      speed: 3 + Math.random() * 5,
      length: 10 + Math.random() * 20,
      opacity: 0.3 + Math.random() * 0.4,
      width: 1 + Math.random() * 2
    });

    const createSnowflake = () => ({
      type: 'snow',
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      speed: 0.5 + Math.random() * 2,
      size: 2 + Math.random() * 4,
      opacity: 0.4 + Math.random() * 0.6,
      drift: Math.random() * 2 - 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    });

    const createFogParticle = () => ({
      type: 'fog',
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.2 + Math.random() * 0.5,
      size: 20 + Math.random() * 60,
      opacity: 0.1 + Math.random() * 0.2,
      drift: Math.random() * 0.5 - 0.25
    });

    const createCloudParticle = () => ({
      type: 'cloud',
      x: Math.random() * (canvas.width + 200) - 100,
      y: Math.random() * canvas.height * 0.3,
      speed: 0.3 + Math.random() * 0.7,
      size: 80 + Math.random() * 120,
      opacity: 0.1 + Math.random() * 0.15
    });

    // Update particles
    const updateParticles = () => {
      particles.forEach((particle, index) => {
        switch (particle.type) {
          case 'rain':
            particle.y += particle.speed;
            if (particle.y > canvas.height) {
              particles[index] = createRainDrop();
            }
            break;

          case 'snow':
            particle.y += particle.speed;
            particle.x += particle.drift;
            particle.rotation += particle.rotationSpeed;
            if (particle.y > canvas.height) {
              particles[index] = createSnowflake();
            }
            if (particle.x < -10) particle.x = canvas.width + 10;
            if (particle.x > canvas.width + 10) particle.x = -10;
            break;

          case 'fog':
            particle.x += particle.speed;
            particle.y += particle.drift;
            if (particle.x > canvas.width + particle.size) {
              particles[index] = createFogParticle();
            }
            break;

          case 'cloud':
            particle.x += particle.speed;
            if (particle.x > canvas.width + particle.size) {
              particle.x = -particle.size;
            }
            break;
        }
      });
    };

    // Render particles
    const renderParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;

        switch (particle.type) {
          case 'rain':
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = particle.width;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x - 2, particle.y - particle.length);
            ctx.stroke();
            break;

          case 'snow':
            ctx.fillStyle = '#ffffff';
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'fog':
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
            gradient.addColorStop(0, 'rgba(220, 220, 220, 0.3)');
            gradient.addColorStop(1, 'rgba(220, 220, 220, 0)');
            ctx.fillStyle = gradient;
            ctx.translate(particle.x, particle.y);
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'cloud':
            const cloudGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
            cloudGradient.addColorStop(0, 'rgba(200, 200, 200, 0.2)');
            cloudGradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
            ctx.fillStyle = cloudGradient;
            ctx.translate(particle.x, particle.y);
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        ctx.restore();
      });
    };

    // Animation loop
    const animate = () => {
      updateParticles();
      renderParticles();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize and start animation
    initializeParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animations, intensity]);

  // Lightning effect for storms
  const [lightning, setLightning] = React.useState(false);

  useEffect(() => {
    if (animations.includes('lightning')) {
      const lightningInterval = setInterval(() => {
        if (Math.random() < 0.1 * intensity) { // 10% chance per second, scaled by intensity
          setLightning(true);
          setTimeout(() => setLightning(false), 150);
        }
      }, 1000);

      return () => clearInterval(lightningInterval);
    }
  }, [animations, intensity]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
      {lightning && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            pointerEvents: 'none',
            zIndex: 15,
            animation: 'lightning 0.15s ease-out'
          }}
        />
      )}
    </>
  );
};

export default WeatherAnimations;