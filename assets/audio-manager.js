/* =====================================================
   GEOVEN — assets/audio-manager.js
   Gestor Global de Audio — v2.0

   RESPONSABILIDADES:
   ─ Música de fondo ininterrumpida entre páginas
     (guarda currentTime cada 250ms → se reanuda
      en la siguiente página desde el mismo punto)
   ─ Desbloqueo del AudioContext en el primer toque
   ─ SFX por nombre (click, win, lose)
   ─ Botón de silencio sincronizado en todas las páginas
   ─ API global: window.GeoAudio

   USO EN CUALQUIER HTML:
     <script src="../assets/audio-manager.js"></script>
     o
     <script src="assets/audio-manager.js"></script>
   ===================================================== */

'use strict';

(function () {

    /* ══════════════════════════════════════════════
       CLAVES DE sessionStorage
    ══════════════════════════════════════════════ */
    const KEY_TIME    = 'geoven_music_time';
    const KEY_MUTED   = 'geoven_muted';
    const KEY_STARTED = 'geoven_music_started';

    /* ══════════════════════════════════════════════
       RUTAS DE AUDIO (relativas al HTML que carga
       este script — se resuelven en tiempo de init)
    ══════════════════════════════════════════════ */

    /**
     * Detecta la profundidad del HTML actual respecto a la raíz www/
     * para construir la ruta correcta a /assets/sounds/.
     * Páginas en raíz     → 'assets/sounds/'
     * Páginas en juego-N/ → '../assets/sounds/'
     */
    function resolveAssetsPath() {
        const path = window.location.pathname;
        // Si la URL contiene un subdirectorio después de la raíz del servidor
        const depth = (path.match(/\//g) || []).length;
        // depth 1 = /index.html (raíz)
        // depth 2 = /juego-2/index.html (un nivel abajo)
        return depth >= 2 ? '../assets/sounds/' : 'assets/sounds/';
    }

    /* ══════════════════════════════════════════════
       CLASE PRINCIPAL
    ══════════════════════════════════════════════ */

    class AudioManager {

        constructor() {
            this._base      = resolveAssetsPath();
            this._music     = null;
            this._sfxCache  = {};
            this._muted     = sessionStorage.getItem(KEY_MUTED) === '1';
            this._unlocked  = false;
            this._heartbeat = null;

            this._init();
        }

        /* ── Inicialización ─────────────────────── */
        _init() {
            // Crear elemento <audio> para la música de fondo
            this._music = new Audio();
            this._music.src    = this._base + 'music-fondo.ogg';
            this._music.loop   = true;
            this._music.volume = 0.28;
            this._music.muted  = this._muted;
            this._music.preload = 'auto';

            // Restaurar posición exacta guardada en la página anterior
            const savedTime = parseFloat(sessionStorage.getItem(KEY_TIME) || '0');
            if (savedTime > 0) {
                this._music.currentTime = savedTime;
            }

            // Si ya hubo interacción previa, intentar autoplay inmediato
            if (sessionStorage.getItem(KEY_STARTED) === '1') {
                this._tryPlay();
            }

            // Desbloqueo en primer toque/click
            const unlock = () => {
                this._unlock();
                document.removeEventListener('click',      unlock);
                document.removeEventListener('touchstart', unlock);
                document.removeEventListener('keydown',    unlock);
            };
            document.addEventListener('click',      unlock, { passive: true });
            document.addEventListener('touchstart', unlock, { passive: true });
            document.addEventListener('keydown',    unlock, { passive: true });

            // Heartbeat: guarda currentTime cada 250ms
            // para que la siguiente página pueda reanudarlo
            this._heartbeat = setInterval(() => {
                if (!this._music.paused && this._music.currentTime > 0) {
                    sessionStorage.setItem(KEY_TIME, this._music.currentTime);
                }
            }, 250);

            // Guardar tiempo justo antes de cerrar/navegar
            window.addEventListener('pagehide',         () => this._saveTime());
            window.addEventListener('beforeunload',     () => this._saveTime());
            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') this._saveTime();
            });

            // Sincronizar botones de sonido en el DOM (pueden añadirse después)
            document.addEventListener('DOMContentLoaded', () => this._syncBtn());
            // Si el DOM ya está listo
            if (document.readyState !== 'loading') this._syncBtn();
        }

        /* ── Desbloqueo del AudioContext ────────── */
        _unlock() {
            if (this._unlocked) return;
            this._unlocked = true;
            sessionStorage.setItem(KEY_STARTED, '1');
            this._tryPlay();
        }

        /* ── Reproducir música ──────────────────── */
        _tryPlay() {
            if (this._muted || !this._music) return;
            this._music.play().catch(() => {
                // Autoplay bloqueado → esperar siguiente interacción
                this._unlocked = false;
                sessionStorage.removeItem(KEY_STARTED);
            });
        }

        /* ── Guardar posición ───────────────────── */
        _saveTime() {
            if (this._music && !this._music.paused) {
                sessionStorage.setItem(KEY_TIME, this._music.currentTime);
            }
        }

        /* ── Sincronizar botón de sonido del DOM ── */
        _syncBtn() {
            const btn = document.getElementById('soundBtn');
            if (!btn) return;
            btn.textContent = this._muted ? '🔇' : '🔊';
            // Evitar listeners duplicados
            btn.replaceWith(btn.cloneNode(true));
            const freshBtn = document.getElementById('soundBtn');
            freshBtn?.addEventListener('click', e => {
                e.stopPropagation();
                this.toggleMute();
            });
        }

        /* ═══════════════════════════════════════════
           API PÚBLICA
        ═══════════════════════════════════════════ */

        /** Alterna silencio y actualiza todos los botones */
        toggleMute() {
            this._muted = !this._muted;
            if (this._music) this._music.muted = this._muted;
            sessionStorage.setItem(KEY_MUTED, this._muted ? '1' : '0');
            document.querySelectorAll('#soundBtn').forEach(btn => {
                btn.textContent = this._muted ? '🔇' : '🔊';
            });
            if (!this._muted) this._tryPlay();
        }

        /** ¿Está silenciado? */
        get muted() { return this._muted; }

        /**
         * Reproduce un efecto de sonido por nombre.
         * Nombres válidos: 'click' | 'win' | 'lose'
         * Crea y cachea el elemento <audio> la primera vez.
         */
        sfx(name) {
            if (this._muted) return;
            if (!this._sfxCache[name]) {
                const a = new Audio(this._base + name + '.ogg');
                a.volume = 0.6;
                this._sfxCache[name] = a;
            }
            const audio = this._sfxCache[name];
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }

        /** Fuerza una pausa de la música (ej. game over) */
        pauseMusic() {
            this._music?.pause();
        }

        /** Reanuda la música (ej. tras game over) */
        resumeMusic() {
            this._tryPlay();
        }
    }

    /* ══════════════════════════════════════════════
       SINGLETON GLOBAL
    ══════════════════════════════════════════════ */
    window.GeoAudio = new AudioManager();

})();
