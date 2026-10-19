(() => {
  "use strict";
  // Este archivo concentra la interacción. Secciones: accesibilidad, audio, video y minijuego.
  // Evita selección accidental de texto y menú contextual; los controles siguen funcionando.
  document.addEventListener("contextmenu", e => { if (!e.target.closest("video,button,a")) e.preventDefault(); });
  // Música ambiental original: intentamos autoplay, pero Safari y móviles pueden exigir interacción.
  // Si el navegador lo bloquea, el botón visible queda listo para iniciar el audio con un toque.
  const music = document.getElementById("backgroundMusic");
  const musicToggle = document.getElementById("musicToggle");
  const musicLabel = document.getElementById("musicLabel");
  music.volume = 0.68;
  function syncMusicControl(isPlaying) {
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Pausar música de terror" : "Activar música de terror");
    musicLabel.textContent = isPlaying ? "PAUSAR AMBIENTE" : "ACTIVAR AMBIENTE";
    musicToggle.classList.toggle("is-playing", isPlaying);
  }
  // No se puede garantizar autoplay con sonido: la política depende del navegador y del usuario.
  music.play().then(() => syncMusicControl(true)).catch(() => {
    syncMusicControl(false);
    musicLabel.textContent = "TOCA PARA ACTIVAR";
    musicToggle.setAttribute("aria-label", "La reproducción automática fue bloqueada. Toca para activar la música");
  });
  musicToggle.addEventListener("click", async () => {
    if (!music.paused) {
      music.pause();
      syncMusicControl(false);
      return;
    }
    try {
      await music.play();
      syncMusicControl(true);
    } catch (error) {
      syncMusicControl(false);
      musicToggle.setAttribute("aria-label", "No se pudo reproducir. Pulsa para volver a intentar");
      musicLabel.textContent = "TOCA PARA REINTENTAR";
    }
  });
  music.addEventListener("pause", () => syncMusicControl(false));
  music.addEventListener("play", () => syncMusicControl(true));
  music.addEventListener("ended", () => syncMusicControl(false));
  music.addEventListener("error", () => {
    syncMusicControl(false);
    musicLabel.textContent = "AUDIO NO DISPONIBLE";
    musicToggle.disabled = true;
  });
  // Apertura cinematográfica. El mismo toque que entra a la invitación también habilita audio en móviles compatibles.
  const cinemaIntro = document.getElementById("cinemaIntro");
  const enterInvitation = document.getElementById("enterInvitation");
  enterInvitation.addEventListener("click", async () => {
    cinemaIntro.classList.add("is-leaving");
    document.body.classList.add("invitation-entered");
    // La transición visual continúa aunque el navegador bloquee el audio.
    try {
      await music.play();
      syncMusicControl(true);
    } catch (error) {
      syncMusicControl(false);
      musicLabel.textContent = "TOCA PARA ACTIVAR";
    }
    window.setTimeout(() => { cinemaIntro.hidden = true; }, 850);
  });

  // Cuenta regresiva: 24 oct 2026, 21:00 en Monterrey (UTC-6); termina el 25 oct a las 04:00.
  const countdownMessage = document.getElementById("countdownMessage");
  const countdownNodes = {
    days: document.getElementById("countDays"),
    hours: document.getElementById("countHours"),
    minutes: document.getElementById("countMinutes"),
    seconds: document.getElementById("countSeconds")
  };
  const eventStart = Date.parse("2026-10-25T03:00:00Z");
  const eventEnd = Date.parse("2026-10-25T10:00:00Z");
  const pad = value => String(value).padStart(2, "0");
  function updateCountdown() {
    const now = Date.now();
    if (now < eventStart) {
      let remaining = Math.floor((eventStart - now) / 1000);
      countdownNodes.days.textContent = String(Math.floor(remaining / 86400)).padStart(2, "0");
      remaining %= 86400;
      countdownNodes.hours.textContent = pad(Math.floor(remaining / 3600));
      remaining %= 3600;
      countdownNodes.minutes.textContent = pad(Math.floor(remaining / 60));
      countdownNodes.seconds.textContent = pad(remaining % 60);
      countdownMessage.textContent = "LA NOCHE COMIENZA EN";
    } else if (now < eventEnd) {
      countdownMessage.textContent = "LA TRANSMISIÓN ESTÁ EN VIVO";
      Object.values(countdownNodes).forEach(node => node.textContent = "●");
    } else {
      countdownMessage.textContent = "LA TRANSMISIÓN HA TERMINADO";
      Object.values(countdownNodes).forEach(node => node.textContent = "—");
    }
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // Safari/iOS puede retrasar loadeddata hasta iniciar la reproducción. El placeholder inicia oculto
  // y solo se muestra si el navegador reporta un error real de carga/decodificación.
  const video = document.getElementById("terrorVideo"), placeholder = document.getElementById("videoPlaceholder");
  video.addEventListener("loadedmetadata", () => { placeholder.hidden = true; });
  video.addEventListener("playing", () => { placeholder.hidden = true; });
  video.addEventListener("error", () => { placeholder.hidden = false; });
  // Juego arcade de un solo nivel: 2 vidas, llave, puerta y pantalla GAME OVER.
  const canvas = document.getElementById("gameCanvas"), ctx = canvas.getContext("2d");
  const message = document.getElementById("gameMessage"), startBtn = document.getElementById("startGame");
  const lifeCounter = document.getElementById("lifeCounter"), status = document.getElementById("gameStatus");
  // Medidas del mundo lógico: 20 columnas x 11 filas, con casillas de 32 px.
  const W=640,H=360,T=32, cols=20, rows=11;
  // Mapa del nivel: # pared, P inicio, K llave y E salida.
  const map=[
    "####################",
    "#P....#.......#...E#",
    "#.##..#.#####.#.##..#",
    "#.....#.....#.#.....#",
    "###.#####.#.#.#####.#",
    "#...#.....#.#.....#.#",
    "#.###.#####.###.#.#.#",
    "#.....#.......#.#...#",
    "#.#####.#####.#.###.#",
    "#K...........#......#",
    "####################"
  ];
  let player, enemy, key, lives, running=false, won=false, last=0, moveTimer=0, keys={}, touchDir=null, raf=0;
  const walls=new Set();
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(map[y][x]==="#")walls.add(`${x},${y}`);
  // Inicia o reinicia una partida y oculta la capa de mensaje. La regla CSS [hidden] es esencial.
  function reset(){
    // La sombra aparece lejos de la salida para no bloquear la condición de victoria desde el primer instante.
    player={x:1,y:1}; enemy={x:17,y:7}; key={x:1,y:9,got:false}; lives=2; running=true;won=false;moveTimer=0;
    message.hidden=true; status.textContent="SOBREVIVE"; lifeCounter.textContent="♥ ♥"; draw(); cancelAnimationFrame(raf); raf=requestAnimationFrame(loop);
  }
  function blocked(x,y){return x<0||y<0||x>=cols||y>=rows||walls.has(`${x},${y}`)}
  // Movimiento del jugador, recogida de llave, colisiones y comprobación de salida.
  function movePlayer(dx,dy){
    if(!running)return; const nx=player.x+dx,ny=player.y+dy;
    if(!blocked(nx,ny)){player.x=nx;player.y=ny}
    if(player.x===key.x&&player.y===key.y)key.got=true;
    if(player.x===enemy.x&&player.y===enemy.y)hurt();
    if(player.x===18&&player.y===1&&key.got){running=false;won=true;status.textContent="ESCAPASTE";showMessage("SOBREVIVISTE… POR AHORA","La puerta se cerró detrás de ti.", "JUGAR OTRA VEZ");}
    draw();
  }
  // Boleto de asistencia: se genera en el navegador sin enviar el nombre a un servidor.
  const ticketModal = document.getElementById("ticketModal");
  const openTicket = document.getElementById("openTicket");
  const closeTicket = document.getElementById("closeTicket");
  const guestName = document.getElementById("guestName");
  const ticketResult = document.getElementById("ticketResult");
  const ticketCanvas = document.getElementById("ticketCanvas");
  const ticketStatus = document.getElementById("ticketStatus");
  let ticketFolio = "";
  const ticketCutoffAt = Date.parse("2026-10-25T03:00:00Z"); // 24 oct, 21:00 Monterrey
  const ticketDeadlinePassed = () => Date.now() >= ticketCutoffAt;
  function showTicketClosedMessage() {
    const notice = document.getElementById("ticketCutoffNotice");
    if (notice) { notice.hidden = false; notice.textContent = "☠ LA NOCHE HA COMENZADO. Ya no es posible generar ni descargar boletos."; notice.classList.add("is-closed"); }
    ticketStatus.textContent = "La generación de boletos cerró a las 9:00 p. m. del 24 de octubre.";
    ticketResult.hidden = true;
    document.getElementById("generateTicket").disabled = true;
    document.getElementById("downloadTicket").disabled = true;
    ticketModal.hidden = true;
    document.body.style.overflow = "";
  }
  openTicket.addEventListener("click", () => {
    if (ticketDeadlinePassed()) { showTicketClosedMessage(); return; }
    ticketModal.hidden = false; document.body.style.overflow = "hidden"; guestName.focus();
  });
  function closeTicketModal(){ticketModal.hidden = true;document.body.style.overflow = "";openTicket.focus();}
  closeTicket.addEventListener("click", closeTicketModal);
  ticketModal.addEventListener("click", e => {if(e.target===ticketModal)closeTicketModal();});
  document.addEventListener("keydown", e => {if(e.key==="Escape"&&!ticketModal.hidden)closeTicketModal();});
  document.getElementById("generateTicket").addEventListener("click", () => {
    if (ticketDeadlinePassed()) { showTicketClosedMessage(); return; }
    const name = guestName.value.trim();
    if(!name){guestName.setCustomValidity("Escribe el nombre para personalizar el boleto.");guestName.reportValidity();guestName.addEventListener("input",()=>guestName.setCustomValidity(""),{once:true});return;}
    ticketFolio = "IRV-" + new Date().getFullYear() + "-" + Array.from(crypto.getRandomValues(new Uint8Array(4)),b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
    const c=ticketCanvas,ctx=c.getContext("2d"),w=c.width,h=c.height;
    // Usa el póster que proporcionó el organizador como diseño exacto del boleto.
    const template = new Image();
    template.onload = () => {
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle="#050306";ctx.fillRect(0,0,w,h);
      // El póster conserva su composición; el pie agrega nombre y folio sin tapar los QR del diseño.
      const posterHeight = 1500;
      ctx.drawImage(template,0,0,w,posterHeight);
      ctx.fillStyle="#080509";ctx.fillRect(0,posterHeight,w,h-posterHeight);
      ctx.strokeStyle="#b51e2b";ctx.lineWidth=3;ctx.strokeRect(18,posterHeight+10,w-36,h-posterHeight-20);
      ctx.textAlign="center";
      ctx.fillStyle="#d82c40";ctx.font="bold 22px monospace";ctx.fillText("INVITADO/A",w/2,posterHeight+39);
      ctx.fillStyle="#fff2f1";ctx.font="bold 28px sans-serif";
      let displayName=name;while(ctx.measureText(displayName).width>w-70&&displayName.length>5)displayName=displayName.slice(0,-2)+"…";
      ctx.fillText(displayName,w/2,posterHeight+72);
      ctx.fillStyle="#d8aeb5";ctx.font="bold 18px monospace";ctx.fillText("FOLIO: "+ticketFolio,w/2,posterHeight+96);
      ticketResult.hidden=false;
      ticketStatus.textContent="Boleto listo. Descárgalo y guárdalo en tu dispositivo.";
    };
    template.onerror = () => {
      ticketStatus.textContent="No se pudo cargar el diseño del boleto. Verifica que assets/ticket-template.png esté en la carpeta del proyecto.";
      ticketResult.hidden=false;
    };
    template.src="assets/ticket-template.png";

  });
  document.getElementById("downloadTicket").addEventListener("click",()=>{
    if (ticketDeadlinePassed()) { showTicketClosedMessage(); return; }
    if(!ticketFolio)return;
    ticketCanvas.toBlob(blob=>{if(!blob){ticketStatus.textContent="No se pudo crear la imagen. Intenta de nuevo.";return;}const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=ticketFolio+".png";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);ticketStatus.textContent="Descarga solicitada. Revisa tus archivos.";},"image/png");
  });

  // Gestiona las dos vidas; al agotarlas detiene el bucle y presenta la pantalla GAME OVER.
  function hurt(){lives--;lifeCounter.textContent=lives===2?"♥ ♥":lives===1?"♥":"—";if(lives<=0){running=false;status.textContent="GAME OVER";showMessage("GAME OVER","La sombra te encontró. La casa recuerda tu nombre.","REINTENTAR");}else{player={x:1,y:1};status.textContent="UNA VIDA MENOS";}}
  // Reutiliza la capa de mensaje para victoria y GAME OVER; el botón nuevo recibe su propio evento.
  function showMessage(title,desc,button){message.innerHTML=`<strong>${title}</strong><p>${desc}</p><button id="startGame" class="arcade-button">${button}</button>`;message.hidden=false;document.getElementById("startGame").addEventListener("click",reset);}
  // Dibuja escenario, paredes, objetos, personajes y efecto de oscuridad directamente en el canvas.
  function draw(){
    ctx.fillStyle="#10121b";ctx.fillRect(0,0,W,H);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const px=x*T,py=y*T;
      if(walls.has(`${x},${y}`)){ctx.fillStyle="#292331";ctx.fillRect(px,py,T,T);ctx.fillStyle="#443040";ctx.fillRect(px+2,py+2,T-4,4);ctx.fillStyle="#17131f";ctx.fillRect(px+4,py+10,T-8,T-12);}
      else {ctx.fillStyle=(x+y)%2?"#151722":"#181925";ctx.fillRect(px,py,T,T);ctx.fillStyle="#24202c";ctx.fillRect(px+4,py+4,2,2);}
    }
    // Puerta cerrada hasta obtener la llave.
    ctx.fillStyle=key.got?"#2c9d75":"#67232d";ctx.fillRect(18*T+5,T+4,22,24);ctx.fillStyle="#d7a85e";ctx.fillRect(18*T+20,T+15,3,3);
    if(!key.got){ctx.fillStyle="#ffcc54";ctx.fillRect(key.x*T+10,key.y*T+8,12,5);ctx.fillRect(key.x*T+14,key.y*T+12,4,9);ctx.fillRect(key.x*T+18,key.y*T+17,7,3);}
    // Sombra pixelada.
    ctx.fillStyle="#08070c";ctx.fillRect(enemy.x*T+7,enemy.y*T+5,18,22);ctx.fillStyle="#e13d52";ctx.fillRect(enemy.x*T+10,enemy.y*T+10,4,3);ctx.fillRect(enemy.x*T+19,enemy.y*T+10,4,3);
    // Personaje.
    ctx.fillStyle="#e8d8d0";ctx.fillRect(player.x*T+10,player.y*T+5,12,8);ctx.fillStyle="#b62b3d";ctx.fillRect(player.x*T+7,player.y*T+13,18,13);ctx.fillStyle="#21141d";ctx.fillRect(player.x*T+9,player.y*T+8,3,3);ctx.fillRect(player.x*T+18,player.y*T+8,3,3);
    // Oscuridad radial: el jugador solo ve una pequeña zona.
    const px=player.x*T+T/2,py=player.y*T+T/2, grad=ctx.createRadialGradient(px,py,35,px,py,190);grad.addColorStop(0,"#00000000");grad.addColorStop(1,"#020208d9");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#5e3148";ctx.lineWidth=2;ctx.strokeRect(1,1,W-2,H-2);
  }
  // La sombra intenta acercarse al jugador por una casilla en cada turno.
  function enemyStep(){
    if(!running)return;
    const choices=[[Math.sign(player.x-enemy.x),0],[0,Math.sign(player.y-enemy.y)]].filter(a=>a[0]||a[1]);
    choices.sort(()=>Math.random()-.5);
    for(const [dx,dy] of choices){if(!blocked(enemy.x+dx,enemy.y+dy)){enemy.x+=dx;enemy.y+=dy;break;}}
    if(enemy.x===player.x&&enemy.y===player.y)hurt();
  }
  // Bucle de animación: limita el ritmo de movimiento para que sea jugable en equipos distintos.
  function loop(t){if(!running)return;const dt=t-last;last=t;moveTimer+=dt;if(moveTimer>155){moveTimer=0;let d=touchDir;if(keys.ArrowUp||keys.w||keys.W)d="up";else if(keys.ArrowDown||keys.s||keys.S)d="down";else if(keys.ArrowLeft||keys.a||keys.A)d="left";else if(keys.ArrowRight||keys.d||keys.D)d="right";if(d){const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};movePlayer(...dirs[d]);}enemyStep();draw();}raf=requestAnimationFrame(loop);}
  startBtn.addEventListener("click",reset);
  // Teclado (WASD/flechas) y botones táctiles para móviles.
  window.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys[e.key]=true;},{passive:false});
  window.addEventListener("keyup",e=>keys[e.key]=false);
  document.querySelectorAll("[data-dir]").forEach(b=>{const d=b.dataset.dir;b.addEventListener("pointerdown",e=>{e.preventDefault();touchDir=d;});["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>touchDir=null));});
  draw();
})();




/* =========================================================
   IRVINGFEST — BLOQUEO DE BOLETOS (MODO DE PRUEBA)
   Fecha de prueba: 19 octubre 2026, 07:00 Monterrey
   07:00 Monterrey = 13:00 UTC
   ========================================================= */

(() => {
  "use strict";

  const ticketCutoffAt = Date.parse("2026-10-01T13:00:00Z");

  const openTicket = document.getElementById("openTicket");
  const generateTicket = document.getElementById("generateTicket");
  const downloadTicket = document.getElementById("downloadTicket");
  const ticketModal = document.getElementById("ticketModal");
  const ticketResult = document.getElementById("ticketResult");
  const ticketStatus = document.getElementById("ticketStatus");
  const ticketNotice = document.getElementById("ticketCutoffNotice");

  function ticketDeadlinePassed() {
    return Date.now() >= ticketCutoffAt;
  }

  function showTicketClosedMessage() {
    if (ticketNotice) {
      ticketNotice.hidden = false;
      ticketNotice.textContent =
        "☠ LA NOCHE HA COMENZADO. Ya no es posible generar ni descargar boletos.";
      ticketNotice.classList.add("is-closed");
    }

    if (ticketStatus) {
      ticketStatus.textContent =
        "La generación y descarga de boletos está cerrada.";
    }

    if (ticketResult) ticketResult.hidden = true;
    if (ticketModal) ticketModal.hidden = true;

    document.body.style.overflow = "";
  }

  function updateCutoff() {
    const closed = ticketDeadlinePassed();

    [openTicket, generateTicket, downloadTicket].forEach(button => {
      if (!button) return;

      button.disabled = closed;
      button.setAttribute("aria-disabled", String(closed));
      button.classList.toggle("ticket-download-closed", closed);
    });

    if (ticketNotice) {
      ticketNotice.hidden = false;
      ticketNotice.textContent = closed
        ? "☠ LA NOCHE HA COMENZADO. Ya no es posible generar ni descargar boletos."
        : "MODO DE PRUEBA: puedes generar boletos hasta las 7:00 a. m.";

      ticketNotice.classList.toggle("is-closed", closed);
    }

    if (closed) showTicketClosedMessage();
  }

  // Bloquear apertura del formulario.
  if (openTicket) {
    openTicket.addEventListener("click", event => {
      if (!ticketDeadlinePassed()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      showTicketClosedMessage();
    }, true);
  }

  // Bloquear la generación, incluso si se intenta activar el botón directamente.
  if (generateTicket) {
    generateTicket.addEventListener("click", event => {
      if (!ticketDeadlinePassed()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      showTicketClosedMessage();
    }, true);
  }

  // Bloquear la descarga.
  if (downloadTicket) {
    downloadTicket.addEventListener("click", event => {
      if (!ticketDeadlinePassed()) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      showTicketClosedMessage();
    }, true);
  }

  // Comprobar al abrir, cada 5 segundos y al volver a la pestaña.
  updateCutoff();
  window.setInterval(updateCutoff, 5000);
  document.addEventListener("visibilitychange", updateCutoff);
})();

