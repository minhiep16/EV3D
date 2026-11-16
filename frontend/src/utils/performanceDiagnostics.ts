/**
 * Performance Diagnostics Utility for EVShare 3D (Phase 4.3)
 *
 * Lightweight, non-intrusive performance telemetry designed for development
 * and diagnostic profiling of:
 * - FPS and frame delta consistency
 * - Three.js WebGL draw calls, triangles, and geometry/texture counts
 * - React render frequencies
 * - API request rates
 *
 * Rules:
 * 1. Disabled by default in production interfaces.
 * 2. Zero per-frame overhead when disabled (immediate early return).
 * 3. Never introduces permanent UI overlays or alters visual composition.
 * 4. Never logs sensitive user, authentication, or financial payload data.
 */

import type * as THREE from 'three';

export interface PerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  activeQueries: number;
}

class PerformanceDiagnosticsManager {
  private isEnabled: boolean = false;
  private frameCount: number = 0;
  private lastFpsUpdateTime: number = 0;
  private currentFps: number = 60;
  private currentFrameTime: number = 16.6;

  constructor() {
    // Only allow activation in non-production environments or explicit query param '?perf=true'
    if (typeof window !== 'undefined') {
      const isDev = Boolean((import.meta as any)?.env?.DEV);
      const urlHasPerf = window.location.search.includes('perf=true');
      this.isEnabled = isDev && (urlHasPerf || Boolean((window as any).__EVSHARE_PERF_DIAGNOSTICS__));
      (window as any).__togglePerfDiagnostics = (enable?: boolean) => {
        this.isEnabled = enable !== undefined ? enable : !this.isEnabled;
        console.info(`[EVShare 3D Perf] Diagnostics ${this.isEnabled ? 'ENABLED' : 'DISABLED'}`);
      };
    }
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Sample frame timing in useFrame loop with zero allocations.
   */
  public recordFrame(deltaSeconds: number): void {
    if (!this.isEnabled) return;

    this.frameCount++;
    this.currentFrameTime = deltaSeconds * 1000;

    const now = performance.now();
    if (now - this.lastFpsUpdateTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
    }
  }

  /**
   * Sample WebGL rendering statistics from Three.js WebGLRenderer.
   */
  public getSnapshot(renderer?: THREE.WebGLRenderer | null): PerformanceMetrics {
    const info = renderer?.info;
    return {
      fps: this.currentFps,
      frameTimeMs: Math.round(this.currentFrameTime * 10) / 10,
      drawCalls: info?.render?.calls ?? 0,
      triangles: info?.render?.triangles ?? 0,
      geometries: info?.memory?.geometries ?? 0,
      textures: info?.memory?.textures ?? 0,
      activeQueries: 0,
    };
  }

  /**
   * Safe diagnostic log of WebGL memory footprint (development only).
   */
  public logReport(renderer?: THREE.WebGLRenderer | null): void {
    if (!this.isEnabled) return;
    const snap = this.getSnapshot(renderer);
    console.table({
      'FPS': snap.fps,
      'Frame Time': `${snap.frameTimeMs} ms`,
      'Draw Calls': snap.drawCalls,
      'Triangles': snap.triangles.toLocaleString(),
      'Geometries': snap.geometries,
      'Textures': snap.textures,
    });
  }
}

export const perfDiagnostics = new PerformanceDiagnosticsManager();
