<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const containerRef = ref<HTMLDivElement | null>(null)
let cleanupFn: (() => void) | null = null

onMounted(async () => {
  if (!containerRef.value) return

  try {
    const THREE = await import('https://esm.sh/three@0.160.0')
    const { EffectComposer } = await import('https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js')
    const { RenderPass } = await import('https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js')
    const { UnrealBloomPass } = await import('https://esm.sh/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js')
    const { OutputPass } = await import('https://esm.sh/three@0.160.0/examples/jsm/postprocessing/OutputPass.js')
    const { ShaderPass } = await import('https://esm.sh/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js')

    const scene = new THREE.Scene()
    scene.background = null

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 20

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
      premultipliedAlpha: false,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    renderer.setClearColor(0x000000, 0)

    const dom = renderer.domElement
    dom.style.position = 'fixed'
    dom.style.top = '0'
    dom.style.left = '0'
    dom.style.width = '100%'
    dom.style.height = '100%'
    dom.style.zIndex = '0'
    dom.style.pointerEvents = 'none'

    containerRef.value.appendChild(dom)

    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.3,
      1.25,
      0.0
    )
    composer.addPass(bloomPass)

    const analogDecayShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uAnalogGrain: { value: 0.4 },
        uAnalogBleeding: { value: 1.0 },
        uAnalogVSync: { value: 1.0 },
        uAnalogScanlines: { value: 1.0 },
        uAnalogVignette: { value: 1.0 },
        uAnalogJitter: { value: 0.4 },
        uAnalogIntensity: { value: 0.6 },
        uLimboMode: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uAnalogGrain;
        uniform float uAnalogBleeding;
        uniform float uAnalogVSync;
        uniform float uAnalogScanlines;
        uniform float uAnalogVignette;
        uniform float uAnalogJitter;
        uniform float uAnalogIntensity;
        uniform float uLimboMode;
        varying vec2 vUv;

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float gaussian(float z, float u, float o) {
          return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
        }

        vec3 grain(vec2 uv, float time, float intensity) {
          float seed = dot(uv, vec2(12.9898, 78.233));
          float noise = fract(sin(seed) * 43758.5453 + time * 2.0);
          noise = gaussian(noise, 0.0, 0.5 * 0.5);
          return vec3(noise) * intensity;
        }

        void main() {
          vec2 uv = vUv;
          float time = uTime * 1.8;
          vec2 jitteredUV = uv;

          if (uAnalogJitter > 0.01) {
            float jitterAmount = (random(vec2(floor(time * 60.0))) - 0.5) * 0.003 * uAnalogJitter * uAnalogIntensity;
            jitteredUV.x += jitterAmount;
            jitteredUV.y += (random(vec2(floor(time * 30.0) + 1.0)) - 0.5) * 0.001 * uAnalogJitter * uAnalogIntensity;
          }

          if (uAnalogVSync > 0.01) {
            float vsyncRoll = sin(time * 2.0 + uv.y * 100.0) * 0.02 * uAnalogVSync * uAnalogIntensity;
            float vsyncChance = step(0.95, random(vec2(floor(time * 4.0))));
            jitteredUV.y += vsyncRoll * vsyncChance;
          }

          vec4 color = texture2D(tDiffuse, jitteredUV);

          if (uAnalogBleeding > 0.01) {
            float bleedAmount = 0.012 * uAnalogBleeding * uAnalogIntensity;
            float offsetPhase = time * 1.5 + uv.y * 20.0;
            vec2 redOffset = vec2(sin(offsetPhase) * bleedAmount, 0.0);
            vec2 blueOffset = vec2(-sin(offsetPhase * 1.1) * bleedAmount * 0.8, 0.0);
            float r = texture2D(tDiffuse, jitteredUV + redOffset).r;
            float g = texture2D(tDiffuse, jitteredUV).g;
            float b = texture2D(tDiffuse, jitteredUV + blueOffset).b;
            color = vec4(r, g, b, color.a);
          }

          if (uAnalogGrain > 0.01) {
            vec3 grainEffect = grain(uv, time, 0.075 * uAnalogGrain * uAnalogIntensity);
            grainEffect *= (1.0 - color.rgb);
            color.rgb += grainEffect;
          }

          if (uAnalogScanlines > 0.01) {
            float scanlineFreq = 600.0 + uAnalogScanlines * 400.0;
            float scanlinePattern = sin(uv.y * scanlineFreq) * 0.5 + 0.5;
            float scanlineIntensity = 0.1 * uAnalogScanlines * uAnalogIntensity;
            color.rgb *= (1.0 - scanlinePattern * scanlineIntensity);
            float horizontalLines = sin(uv.y * scanlineFreq * 0.1) * 0.02 * uAnalogScanlines * uAnalogIntensity;
            color.rgb *= (1.0 - horizontalLines);
          }

          if (uAnalogVignette > 0.01) {
            vec2 vignetteUV = (uv - 0.5) * 2.0;
            float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.3 * uAnalogVignette * uAnalogIntensity;
            color.rgb *= vignette;
          }

          if (uLimboMode > 0.5) {
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = vec3(gray);
          }

          gl_FragColor = color;
        }
      `,
    }

    const analogDecayPass = new ShaderPass(analogDecayShader)
    composer.addPass(analogDecayPass)
    composer.addPass(new OutputPass())

    const fluorescentColors: Record<string, number> = {
      orange: 0xff4500,
      green: 0x00ff80,
    }

    const atmosphereGeometry = new THREE.PlaneGeometry(300, 300)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ghostPosition: { value: new THREE.Vector3(0, 0, 0) },
        revealRadius: { value: 43 },
        fadeStrength: { value: 2.2 },
        baseOpacity: { value: 0.35 },
        revealOpacity: { value: 0.0 },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 ghostPosition;
        uniform float revealRadius;
        uniform float fadeStrength;
        uniform float baseOpacity;
        uniform float revealOpacity;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          float dist = distance(vWorldPosition.xy, ghostPosition.xy);
          float dynamicRadius = revealRadius + sin(time * 2.0) * 5.0;
          float reveal = smoothstep(dynamicRadius * 0.2, dynamicRadius, dist);
          reveal = pow(reveal, fadeStrength);
          float opacity = mix(revealOpacity, baseOpacity, reveal);
          gl_FragColor = vec4(0.001, 0.001, 0.002, opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    })

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    atmosphere.position.z = -50
    atmosphere.renderOrder = -100
    scene.add(atmosphere)

    scene.add(new THREE.AmbientLight(0x0a0a2e, 0.08))

    const ghostGroup = new THREE.Group()
    scene.add(ghostGroup)

    const ghostGeometry = new THREE.SphereGeometry(2, 40, 40)
    const positionAttribute = ghostGeometry.getAttribute('position')
    const positions = positionAttribute.array
    for (let i = 0; i < positions.length; i += 3) {
      if (positions[i + 1] < -0.2) {
        const x = positions[i]
        const z = positions[i + 2]
        const noise1 = Math.sin(x * 5) * 0.35
        const noise2 = Math.cos(z * 4) * 0.25
        const noise3 = Math.sin((x + z) * 3) * 0.15
        positions[i + 1] = -2.0 + (noise1 + noise2 + noise3)
      }
    }
    ghostGeometry.computeVertexNormals()

    const ghostMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f2027,
      transparent: true,
      opacity: 0.88,
      emissive: fluorescentColors.orange,
      emissiveIntensity: 5.8,
      roughness: 0.02,
      metalness: 0.0,
      side: THREE.DoubleSide,
      alphaTest: 0.1,
    })

    const ghostBody = new THREE.Mesh(ghostGeometry, ghostMaterial)
    ghostGroup.add(ghostBody)

    const rimLight1 = new THREE.DirectionalLight(0x4a90e2, 1.8)
    rimLight1.position.set(-8, 6, -4)
    scene.add(rimLight1)

    const rimLight2 = new THREE.DirectionalLight(0x50e3c2, 1.26)
    rimLight2.position.set(8, -4, -6)
    scene.add(rimLight2)

    const eyeGroup = new THREE.Group()
    ghostGroup.add(eyeGroup)

    const socketGeometry = new THREE.SphereGeometry(0.45, 16, 16)
    const socketMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })

    const leftSocket = new THREE.Mesh(socketGeometry, socketMaterial)
    leftSocket.position.set(-0.7, 0.6, 1.9)
    leftSocket.scale.set(1.1, 1.0, 0.6)
    eyeGroup.add(leftSocket)

    const rightSocket = new THREE.Mesh(socketGeometry, socketMaterial)
    rightSocket.position.set(0.7, 0.6, 1.9)
    rightSocket.scale.set(1.1, 1.0, 0.6)
    eyeGroup.add(rightSocket)

    const eyeGeometry = new THREE.SphereGeometry(0.3, 12, 12)
    const leftEyeMat = new THREE.MeshBasicMaterial({ color: fluorescentColors.green, transparent: true, opacity: 0 })
    const rightEyeMat = new THREE.MeshBasicMaterial({ color: fluorescentColors.green, transparent: true, opacity: 0 })

    const leftEye = new THREE.Mesh(eyeGeometry, leftEyeMat)
    leftEye.position.set(-0.7, 0.6, 2.0)
    eyeGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, rightEyeMat)
    rightEye.position.set(0.7, 0.6, 2.0)
    eyeGroup.add(rightEye)

    const outerGlowGeometry = new THREE.SphereGeometry(0.525, 12, 12)
    const leftOuterMat = new THREE.MeshBasicMaterial({ color: fluorescentColors.green, transparent: true, opacity: 0, side: THREE.BackSide })
    const rightOuterMat = new THREE.MeshBasicMaterial({ color: fluorescentColors.green, transparent: true, opacity: 0, side: THREE.BackSide })

    const leftOuterGlow = new THREE.Mesh(outerGlowGeometry, leftOuterMat)
    leftOuterGlow.position.set(-0.7, 0.6, 1.95)
    eyeGroup.add(leftOuterGlow)

    const rightOuterGlow = new THREE.Mesh(outerGlowGeometry, rightOuterMat)
    rightOuterGlow.position.set(0.7, 0.6, 1.95)
    eyeGroup.add(rightOuterGlow)

    const fireflies: any[] = []
    const fireflyGroup = new THREE.Group()
    scene.add(fireflyGroup)

    for (let i = 0; i < 20; i++) {
      const fireflyGeo = new THREE.SphereGeometry(0.02, 2, 2)
      const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xffff44, transparent: true, opacity: 0.9 })
      const firefly = new THREE.Mesh(fireflyGeo, fireflyMat)
      firefly.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20)

      const glowGeo = new THREE.SphereGeometry(0.08, 8, 8)
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xffff88, transparent: true, opacity: 0.4, side: THREE.BackSide })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      firefly.add(glow)

      const light = new THREE.PointLight(0xffff44, 0.8, 3, 2)
      firefly.add(light)

      firefly.userData = {
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04),
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 2 + Math.random() * 3,
        glowMat,
        fireflyMat,
        light,
      }
      fireflyGroup.add(firefly)
      fireflies.push(firefly)
    }

    const mouse = new THREE.Vector2()
    const prevMouse = new THREE.Vector2()
    const mouseSpeed = new THREE.Vector2()
    let lastMouseUpdate = 0
    let currentMovement = 0
    let isUserActive = false
    let inactivityTimer: any = null

    const handlePointerMove = (clientX: number, clientY: number) => {
      const now = performance.now()
      if (now - lastMouseUpdate > 16) {
        prevMouse.x = mouse.x
        prevMouse.y = mouse.y
        mouse.x = (clientX / window.innerWidth) * 2 - 1
        mouse.y = -(clientY / window.innerHeight) * 2 + 1
        mouseSpeed.x = mouse.x - prevMouse.x
        mouseSpeed.y = mouse.y - prevMouse.y
        lastMouseUpdate = now
        isUserActive = true

        clearTimeout(inactivityTimer)
        inactivityTimer = setTimeout(() => {
          isUserActive = false
        }, 3000)
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchstart', onTouchMove, { passive: true })

    let animId = 0
    let time = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      time += 0.01

      atmosphereMaterial.uniforms.time.value = time
      analogDecayPass.uniforms.uTime.value = time

      // Se estiver no mobile ou sem interações, faz o fantasma se mover sozinho suavemente
      let targetX = mouse.x * 11
      let targetY = mouse.y * 7

      if (!isUserActive) {
        targetX = Math.sin(time * 0.8) * 6 + Math.cos(time * 0.3) * 2
        targetY = Math.cos(time * 0.6) * 4 + Math.sin(time * 1.2) * 1.5
      }

      const prevGhostPosition = ghostGroup.position.clone()

      ghostGroup.position.x += (targetX - ghostGroup.position.x) * 0.05
      ghostGroup.position.y += (targetY - ghostGroup.position.y) * 0.05

      atmosphereMaterial.uniforms.ghostPosition.value.copy(ghostGroup.position)

      const movementAmount = prevGhostPosition.distanceTo(ghostGroup.position)
      currentMovement = currentMovement * 0.95 + movementAmount * 0.05

      ghostGroup.position.y += Math.sin(time * 2.4) * 0.03 + Math.cos(time * 1.1) * 0.018

      const pulse = Math.sin(time * 1.6) * 0.6
      ghostMaterial.emissiveIntensity = 5.8 + pulse

      fireflies.forEach((f) => {
        const p = Math.sin((time + f.userData.phase) * f.userData.pulseSpeed) * 0.4 + 0.6
        f.userData.glowMat.opacity = 2.6 * 0.4 * p
        f.userData.fireflyMat.opacity = 2.6 * 0.9 * p
        f.userData.light.intensity = 2.6 * 0.8 * p

        f.userData.velocity.x += (Math.random() - 0.5) * 0.001
        f.userData.velocity.y += (Math.random() - 0.5) * 0.001
        f.userData.velocity.z += (Math.random() - 0.5) * 0.001
        f.userData.velocity.clampLength(0, 0.04)
        f.position.add(f.userData.velocity)
      })

      // No mobile / autônomo, os olhos piscam e brilham periodicamente
      const isMoving = isUserActive ? (currentMovement > 0.07) : (Math.sin(time * 1.5) > 0.2)
      const targetGlow = isMoving ? 1.0 : 0.0
      const newOpacity = leftEyeMat.opacity + (targetGlow - leftEyeMat.opacity) * 0.31

      leftEyeMat.opacity = newOpacity
      rightEyeMat.opacity = newOpacity
      leftOuterMat.opacity = newOpacity * 0.3
      rightOuterMat.opacity = newOpacity * 0.3

      composer.render()
    }


    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    cleanupFn = () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom)
      }
    }
  } catch (err) {
    console.error('Ghost animation init error:', err)
  }
})

onUnmounted(() => {
  if (cleanupFn) cleanupFn()
})
</script>

<template>
  <div ref="containerRef" class="fixed inset-0 pointer-events-none z-0" />
</template>
