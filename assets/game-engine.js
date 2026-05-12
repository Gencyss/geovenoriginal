/* =========================================
   GEOVEN — assets/game-engine.js
   Motor de juego reutilizable para los 3 modos
   ========================================= */

'use strict';

/**
 * GameEngine — maneja timer, vidas, combo, puntos,
 * retroalimentación y game-over para cualquier juego.
 *
 * Configuración esperada:
 * {
 *   gameId:      string  — 'juego1' | 'juego2' | 'juego3'
 *   questions:   Array   — array de preguntas (ver formato abajo)
 *   timerSpeed:  number  — decremento por tick (0.75 = normal, 1.5 = rápido)
 *   hasLifelines: bool   — activa comodines 50/50 y "La Verdadera"
 *   renderQuestion: fn   — callback(pregunta, engine) para render personalizado
 * }
 *
 * Formato de pregunta:
 * { q: string, ops: string[], correct: number, explicacion: string }
 */
window.GameEngine = class GameEngine {

    constructor(config) {
        this.gameId      = config.gameId;
        this.questions   = config.questions || [];
        this.timerSpeed  = config.timerSpeed  ?? 0.75;
        this.hasLifelines = config.hasLifelines ?? false;
        this.renderQuestion = config.renderQuestion ?? null;

        this._state = this._defaultState();
    }

    // ─── Estado por defecto ─────────────────────────────────────
    _defaultState() {
        return {
            indice: 0,
            vidas: 3,
            puntos: 0,
            combo: 1,
            aciertosSeguidos: 0,
            tiempo: 100,
            timerInterval: null,
            bloqueado: false,
            comodines: { fifty: true, truth: true }
        };
    }

    // ─── API pública ────────────────────────────────────────────
    start() {
        this._state = this._defaultState();
        this._syncUI();
        this._cargarNivel();
    }

    reset() {
        clearInterval(this._state.timerInterval);
        this._state = this._defaultState();
        this._syncUI();
    }

    // ─── Sincronizar UI completa ─────────────────────────────────
    _syncUI() {
        this._actualizarVidasUI();
        this._actualizarComboUI();
        const ptsEl = document.getElementById(`pts-${this.gameId}`);
        if (ptsEl) ptsEl.textContent = '0';
    }

    // ─── Cargar pregunta ─────────────────────────────────────────
    _cargarNivel() {
        const s = this._state;
        if (s.indice >= this.questions.length) {
            this._mostrarVictoria();
            return;
        }

        const pregunta = this.questions[s.indice];

        // Render personalizado (cada juego decide cómo mostrar la pregunta)
        if (this.renderQuestion) {
            this.renderQuestion(pregunta, this);
        }

        // Actualizar puntos y combo en header
        const ptsEl = document.getElementById(`pts-${this.gameId}`);
        if (ptsEl) ptsEl.textContent = s.puntos;
        this._actualizarComboUI();

        // Construir opciones
        const opsEl = document.getElementById(`ops-${this.gameId}`);
        if (!opsEl) return;
        opsEl.innerHTML = '';

        pregunta.ops.forEach((txt, i) => {
            const btn = document.createElement('button');
            btn.className = 'btn-opcion';
            btn.textContent = txt;
            btn.addEventListener('click', () => {
                if (s.bloqueado) return;
                if (i === pregunta.correct) {
                    this._procesarAcierto(btn);
                } else {
                    this._procesarError(btn);
                }
            });
            opsEl.appendChild(btn);
        });

        // Renderizar comodines si aplica
        if (this.hasLifelines) this._renderLifelines();

        this._iniciarTimer();
    }

    // ─── Timer ───────────────────────────────────────────────────
    _iniciarTimer() {
        const s = this._state;
        clearInterval(s.timerInterval);
        s.tiempo = 100;

        const bar = document.getElementById(`timer-${this.gameId}`);
        if (!bar) return;

        bar.style.width  = '100%';
        bar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';

        s.timerInterval = setInterval(() => {
            s.tiempo -= this.timerSpeed;
            bar.style.width = Math.max(0, s.tiempo) + '%';

            if (s.tiempo <= 30) {
                bar.style.background = 'linear-gradient(90deg, #ff4d4d, #ff8080)';
            } else if (s.tiempo <= 60) {
                bar.style.background = 'linear-gradient(90deg, #FF9800, #FFC107)';
            }

            if (s.tiempo <= 0) {
                clearInterval(s.timerInterval);
                this._procesarError(null);
            }
        }, 100);
    }

    // ─── Acierto ─────────────────────────────────────────────────
    _procesarAcierto(btn) {
        const s = this._state;
        if (s.bloqueado) return;
        s.bloqueado = true;
        clearInterval(s.timerInterval);

        btn.classList.add('correct');

        s.aciertosSeguidos++;
        if (s.aciertosSeguidos >= 3) s.combo = 2;
        if (s.aciertosSeguidos >= 6) s.combo = 3;

        const pts = 100 * s.combo;
        s.puntos += pts;
        this._mostrarPuntosFlotantes(btn, `+${pts}`, '#4CAF50');

        setTimeout(() => this._mostrarFeedback(true), 600);
    }

    // ─── Error ───────────────────────────────────────────────────
    _procesarError(btn) {
        const s = this._state;
        if (s.bloqueado) return;
        s.bloqueado = true;

        s.vidas--;
        s.aciertosSeguidos = 0;
        s.combo = 1;
        clearInterval(s.timerInterval);

        this._actualizarVidasUI();
        this._actualizarComboUI();

        if (btn) btn.classList.add('wrong');

        const container = document.getElementById(`container-${this.gameId}`);
        if (container) {
            container.classList.add('screen-shake');
            setTimeout(() => container.classList.remove('screen-shake'), 350);
        }

        if ('vibrate' in navigator) navigator.vibrate([80, 40, 80]);

        setTimeout(() => this._mostrarFeedback(false), 400);
    }

    // ─── Modal de feedback ───────────────────────────────────────
    _mostrarFeedback(esAcierto) {
        const pregunta = this.questions[this._state.indice];
        if (!pregunta) return;

        const overlay  = document.createElement('div');
        overlay.id     = 'feedback-modal';
        overlay.className = 'feedback-overlay';

        const color  = esAcierto ? '#4CAF50' : '#ff4d4d';
        const titulo = esAcierto ? '¡Respuesta Correcta! 🎉' : '¡Casi lo logras! 💡';

        overlay.innerHTML = `
            <div class="feedback-card">
                <h2 class="feedback-title" style="color:${color}">${titulo}</h2>
                <p class="feedback-answer">
                    <strong>Respuesta correcta:</strong><br>${pregunta.ops[pregunta.correct]}
                </p>
                <p class="feedback-explanation">${pregunta.explicacion || ''}</p>
                <button id="btn-next-feedback" class="btn-continuar">CONTINUAR</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('btn-next-feedback').addEventListener('click', () => {
            overlay.remove();
            const s = this._state;
            if (!esAcierto && s.vidas <= 0) {
                this._mostrarGameOver();
            } else {
                s.indice++;
                s.bloqueado = false;
                this._cargarNivel();
            }
        });
    }

    // ─── Game Over ───────────────────────────────────────────────
    _mostrarGameOver() {
        clearInterval(this._state.timerInterval);
        const overlay = document.createElement('div');
        overlay.className = 'gameover-overlay';
        overlay.innerHTML = `
            <div class="gameover-content">
                <div class="gameover-title">GAME OVER</div>
                <div class="gameover-pts">PUNTOS: ${this._state.puntos}</div>
                <button id="btn-reintentar" class="btn-reintentar">REINTENTAR</button>
                <a href="../index.html" class="btn-menu-go">MENÚ PRINCIPAL</a>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('btn-reintentar').addEventListener('click', () => {
            overlay.remove();
            this.start();
        });
    }

    // ─── Victoria ────────────────────────────────────────────────
    _mostrarVictoria() {
        clearInterval(this._state.timerInterval);
        const overlay = document.createElement('div');
        overlay.className = 'gameover-overlay';
        overlay.innerHTML = `
            <div class="gameover-content">
                <div class="gameover-title" style="color:#FFE902">¡VICTORIA! 🏆</div>
                <div class="gameover-pts">PUNTOS: ${this._state.puntos}</div>
                <button id="btn-reintentar" class="btn-reintentar">JUGAR DE NUEVO</button>
                <a href="../index.html" class="btn-menu-go">MENÚ PRINCIPAL</a>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('btn-reintentar').addEventListener('click', () => {
            overlay.remove();
            this.start();
        });
    }

    // ─── Comodines ───────────────────────────────────────────────
    _renderLifelines() {
        const s = this._state;
        let lifelines = document.getElementById(`lifelines-${this.gameId}`);
        if (!lifelines) {
            lifelines = document.createElement('div');
            lifelines.id = `lifelines-${this.gameId}`;
            lifelines.className = 'lifelines';
            const container = document.getElementById(`container-${this.gameId}`);
            if (container) container.prepend(lifelines);
        }
        lifelines.innerHTML = `
            <button class="lifeline-btn" id="fifty-${this.gameId}" ${!s.comodines.fifty ? 'disabled' : ''}>50:50</button>
            <button class="lifeline-btn" id="truth-${this.gameId}" ${!s.comodines.truth ? 'disabled' : ''}>🔍 La Verdadera</button>
        `;
        document.getElementById(`fifty-${this.gameId}`)
            ?.addEventListener('click', () => this._usarComodin50());
        document.getElementById(`truth-${this.gameId}`)
            ?.addEventListener('click', () => this._usarComodinTruth());
    }

    _usarComodin50() {
        const s = this._state;
        if (!s.comodines.fifty || s.bloqueado) return;
        s.comodines.fifty = false;
        document.getElementById(`fifty-${this.gameId}`).disabled = true;

        const correctIndex = this.questions[s.indice].correct;
        const opciones     = document.querySelectorAll(`#ops-${this.gameId} .btn-opcion`);
        let eliminadas = 0;

        for (let i = 0; i < opciones.length && eliminadas < 2; i++) {
            if (i !== correctIndex && opciones[i].style.display !== 'none') {
                opciones[i].style.opacity = '0.2';
                opciones[i].style.pointerEvents = 'none';
                eliminadas++;
            }
        }
    }

    _usarComodinTruth() {
        const s = this._state;
        if (!s.comodines.truth || s.bloqueado) return;
        s.comodines.truth = false;
        document.getElementById(`truth-${this.gameId}`).disabled = true;

        const correctIndex = this.questions[s.indice].correct;
        const opciones     = document.querySelectorAll(`#ops-${this.gameId} .btn-opcion`);

        opciones[correctIndex].classList.add('highlight-correct');
        setTimeout(() => opciones[correctIndex].classList.remove('highlight-correct'), 3000);
    }

    // ─── UI helpers ──────────────────────────────────────────────
    _actualizarVidasUI() {
        const s    = this._state;
        const dots = document.querySelectorAll(`#vidas-${this.gameId} .dot`);
        dots.forEach((dot, i) => dot.classList.toggle('perder', i < (3 - s.vidas)));
    }

    _actualizarComboUI() {
        const badge = document.getElementById(`combo-${this.gameId}`);
        if (!badge) return;
        badge.textContent = `x${this._state.combo}`;
        badge.classList.toggle('active', this._state.combo > 1);
    }

    _mostrarPuntosFlotantes(ref, texto, color) {
        const el = document.createElement('div');
        el.textContent  = texto;
        el.className    = 'puntos-flotantes';
        el.style.color  = color;

        const rect = ref.getBoundingClientRect();
        el.style.left = (rect.left + rect.width / 2) + 'px';
        el.style.top  = (rect.top - 10) + 'px';

        document.body.appendChild(el);
        setTimeout(() => el.remove(), 850);
    }
};
