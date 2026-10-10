const $ = s => document.querySelector(s);
const canvas=$("#visualizer"), ctx=canvas.getContext("2d",{alpha:false}), audio=$("#audio");
let audioContext, analyser, sourceNode, mediaDestination, image=null, imageUrl=null, audioUrl=null;
let format="landscape", intensity=.75, glow=.7, particleCount=90, particles=[], recording=false, clipExporting=false, clipItems=[], clipId=0, clipBlobUrls=[];
let lyrics=[], lastBeat=0, beatFlash=0, previousBass=0, sceneIndex=0, sceneStarted=0, lastSceneChange=0;
const palettes={
 gothic:{name:"GOTHIC",hue:292,secondary:326,accent:"#ff3fbf"},
 cyberpunk:{name:"CYBERPUNK",hue:185,secondary:300,accent:"#64eaff"},
 opening:{name:"ANIME OPENING",hue:325,secondary:45,accent:"#ff7ac8"},
 fantasy:{name:"DARK FANTASY",hue:270,secondary:205,accent:"#a78bfa"}
};
const scenes=["AWAKENING","NEON RAIN","VOID HEART","AFTERGLOW"];
let palette=palettes.gothic;
function status(t){$("#status").textContent=t}
function resizeCanvas(){canvas.width=format==="landscape"?1920:1080;canvas.height=format==="landscape"?1080:1920;canvas.style.aspectRatio=format==="landscape"?"16/9":"9/16";seedParticles()}
function seedParticles(){particles=Array.from({length:particleCount},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:.5+Math.random()*2.5,s:.3+Math.random()*1.5,a:.15+Math.random()*.7,p:Math.random()*6.28}))}
function setupAudio(){if(audioContext){if(audioContext.state==="suspended")audioContext.resume();return Promise.resolve()}audioContext=new AudioContext();analyser=audioContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.72;sourceNode=audioContext.createMediaElementSource(audio);mediaDestination=audioContext.createMediaStreamDestination();sourceNode.connect(analyser);analyser.connect(audioContext.destination);analyser.connect(mediaDestination);return audioContext.resume()}
function frequencyData(){const d=new Uint8Array(analyser?.frequencyBinCount||1024);if(analyser)analyser.getByteFrequencyData(d);return d}
function average(data,a,b){let s=0,n=0;for(let i=a;i<Math.min(b,data.length);i++){s+=data[i];n++}return n?s/n:0}
function drawBg(bass,mid,time){const w=canvas.width,h=canvas.height;ctx.fillStyle="#06040b";ctx.fillRect(0,0,w,h);
 if(image){const scale=Math.max(w/image.width,h/image.height),zoom=1+(bass/255)*intensity*.09;const iw=image.width*scale*zoom,ih=image.height*scale*zoom;ctx.drawImage(image,(w-iw)/2,(h-ih)/2,iw,ih)}
 else{const g=ctx.createRadialGradient(w*.5,h*.45,5,w*.5,h*.45,Math.max(w,h)*.75);g.addColorStop(0,`hsl(${palette.hue} 60% 19%)`);g.addColorStop(.65,"#100a1b");g.addColorStop(1,"#030208");ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}
 const shade=ctx.createLinearGradient(0,0,0,h);shade.addColorStop(0,"#05020a99");shade.addColorStop(.5,"#08030a20");shade.addColorStop(1,"#05020add");ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
 const pulse=.07+(bass/255)*intensity*.4+(beatFlash*.12);const glow=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.min(w,h)*.68);glow.addColorStop(0,`hsla(${palette.hue},100%,60%,${pulse})`);glow.addColorStop(.55,`hsla(${palette.secondary},100%,55%,${pulse*.35})`);glow.addColorStop(1,"transparent");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 const sy=(time*.025)%h;ctx.fillStyle=`hsla(${palette.hue},100%,70%,${.025*glow})`;ctx.fillRect(0,sy,w,Math.max(2,h*.0015));
 // Scene transition: soft chromatic flash on bass transients and periodic scene changes.
 if(beatFlash>.02){ctx.fillStyle=`hsla(${palette.secondary},100%,70%,${beatFlash*.12})`;ctx.fillRect(0,0,w,h);beatFlash*=.86}
}
function drawParticles(bass,time){ctx.save();ctx.globalCompositeOperation="lighter";for(const p of particles.slice(0,particleCount)){p.y-=p.s*(.45+bass/150)*intensity;p.x+=Math.sin(time*.0005+p.p)*.35;if(p.y<0){p.y=canvas.height+5;p.x=Math.random()*canvas.width}ctx.beginPath();ctx.arc(p.x,p.y,p.r+(bass/255)*2,0,Math.PI*2);ctx.fillStyle=`hsla(${palette.hue+Math.sin(p.p)*25},100%,70%,${Math.min(1,p.a*(.5+bass/300))*.55})`;ctx.shadowBlur=12*glow;ctx.shadowColor=palette.accent;ctx.fill()}ctx.restore()}
function drawSpectrum(data,bass,time){if(!$("#showSpectrum").checked)return;const w=canvas.width,h=canvas.height,cx=w*.5,cy=h*(format==="portrait"?.48:.51),base=Math.min(w,h)*(format==="portrait"?.145:.19);ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation="lighter";for(let i=0;i<144;i++){const v=data[Math.floor(i*data.length/144)]/255,ang=i/144*Math.PI*2-Math.PI/2,len=(10+v*base*.7)*intensity;ctx.beginPath();ctx.moveTo(Math.cos(ang)*base,Math.sin(ang)*base);ctx.lineTo(Math.cos(ang)*(base+len+beatFlash*base*.18),Math.sin(ang)*(base+len+beatFlash*base*.18));ctx.strokeStyle=`hsla(${palette.hue+(i/144)*70},100%,${60+v*25}%,${.4+v*.6})`;ctx.lineWidth=Math.max(2,Math.min(w,h)*.0025);ctx.shadowBlur=glow*22;ctx.shadowColor=palette.accent;ctx.stroke()}ctx.beginPath();ctx.arc(0,0,base-2,0,Math.PI*2);ctx.strokeStyle=`hsla(${palette.secondary},100%,70%,.5)`;ctx.lineWidth=2;ctx.stroke();ctx.restore()}
function drawText(){if(!$("#showText").checked)return;const w=canvas.width,h=canvas.height,min=Math.min(w,h),y=format==="portrait"?h*.72:h*.82;ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.shadowBlur=18*glow;ctx.shadowColor=palette.accent;ctx.fillStyle="#fff4ff";ctx.font=`900 ${Math.round(min*(format==="portrait"?.05:.06))}px Arial`;ctx.fillText($("#songTitle").value.toUpperCase(),w/2,y,w*.84);ctx.shadowBlur=10*glow;ctx.fillStyle="#a9f7ff";ctx.font=`600 ${Math.round(min*.022)}px Arial`;ctx.fillText($("#artistName").value.toUpperCase(),w/2,y+min*.055,w*.75);ctx.restore()}
function drawLyrics(){
 if(!lyrics.length || !Number.isFinite(audio.currentTime)) return;
 const offset=Number($("#lyricsOffset")?.value||0); const lyricClock=audio.currentTime-offset; let index=-1;
 for(let i=0;i<lyrics.length;i++){if(lyricClock>=lyrics[i].time)index=i;else break}
 if(index<0)return;
 const line=lyrics[index], next=lyrics[index+1];
 if(next && lyricClock>=next.time)return;
 const w=canvas.width,h=canvas.height,min=Math.min(w,h),y=h*(format==="portrait"?.855:.905),bandH=min*.075;
 ctx.save();
 const grad=ctx.createLinearGradient(0,y-bandH/2,0,y+bandH/2);
 grad.addColorStop(0,"rgba(5,2,12,0)");grad.addColorStop(.5,"rgba(5,2,12,.72)");grad.addColorStop(1,"rgba(5,2,12,0)");
 ctx.fillStyle=grad;ctx.fillRect(0,y-bandH/2,w,bandH);
 ctx.textAlign="center";ctx.textBaseline="middle";
 ctx.font=`700 ${Math.round(min*(format==="portrait"?.034:.032))}px Arial`;
 ctx.shadowColor=palette.accent;ctx.shadowBlur=18*glow;ctx.fillStyle="#fff";
 ctx.fillText(line.text,w/2,y,w*.88);ctx.restore();
}
function drawVignette(){const w=canvas.width,h=canvas.height,g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.18,w/2,h/2,Math.max(w,h)*.72);g.addColorStop(0,"transparent");g.addColorStop(1,"rgba(0,0,0,.65)");ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}
function render(time=0){requestAnimationFrame(render);const d=frequencyData(),bass=average(d,0,14),mid=average(d,14,100);if(bass>previousBass+18&&bass>65){beatFlash=1;lastBeat=time}previousBass=bass;
 if($("#autoScenes").checked&&time-lastSceneChange>18000){sceneIndex=(sceneIndex+1)%scenes.length;lastSceneChange=time;$("#sceneLabel").textContent=`ESCENA 0${sceneIndex+1} / ${scenes[sceneIndex]}`}
 drawBg(bass,mid,time);drawParticles(bass,time);drawSpectrum(d,bass,time);drawText();drawVignette();drawLyrics()}
$("#audioFile").addEventListener("change",e=>{const f=e.target.files?.[0];if(!f)return;if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(f);audio.src=audioUrl;$("#trackName").textContent=f.name;$("#exportMessage").textContent="Audio cargado. La detección de beats se activa al reproducir.";status("AUDIO CARGADO")});
$("#imageFile").addEventListener("change",e=>{const f=e.target.files?.[0];if(!f)return;if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=URL.createObjectURL(f);const im=new Image();im.onload=()=>image=im;im.src=imageUrl});
$("#playBtn").addEventListener("click",async()=>{if(!audio.src){$("#audioFile").click();return}try{await setupAudio();if(audio.paused){await audio.play();$("#playBtn").textContent="Ⅱ Pausar";status("REPRODUCIENDO")}else{audio.pause();$("#playBtn").textContent="▶ Reproducir";status("PAUSADO")}}catch(e){alert("No se pudo reproducir el audio: "+e.message)}});
audio.addEventListener("ended",()=>{if(!recording)status("TERMINADO")});audio.addEventListener("pause",()=>{if(!recording)$("#playBtn").textContent="▶ Reproducir"});
$("#stopBtn").addEventListener("click",()=>{audio.pause();audio.currentTime=0;$("#playBtn").textContent="▶ Reproducir";status("DETENIDO")});
document.querySelectorAll(".format").forEach(b=>b.addEventListener("click",()=>{format=b.dataset.format;document.querySelectorAll(".format").forEach(x=>x.classList.toggle("active",x===b));resizeCanvas()}));
$("#preset").addEventListener("change",e=>{palette=palettes[e.target.value]||palettes.gothic;document.documentElement.style.setProperty("--pink",palette.accent);});
function range(id,out,fmt,fn){$("#"+id).addEventListener("input",e=>{const v=+e.target.value;$("#"+out).textContent=fmt(v);fn(v)})}
range("intensity","intensityOut",v=>v+"%",v=>intensity=v/100);range("glow","glowOut",v=>v+"%",v=>glow=v/100);range("particles","particlesOut",v=>v,v=>{particleCount=v;seedParticles()});
function parseLyricTime(raw){
 const value=raw.trim().replace(/^\[|\]$/g,"");
 if(/^\d+(?:\.\d+)?$/.test(value))return Number(value);
 const m=value.match(/^(\d{1,3}):([0-5]?\d(?:\.\d+)?)$/);
 return m?Number(m[1])*60+Number(m[2]):NaN;
}
function parseLyricRow(row){
 // Standard LRC: [mm:ss.xx] lyric
 let m=row.match(/^\[(\d{1,3}:[0-5]?\d(?:\.\d+)?)\]\s*(.+)$/);
 if(m)return {time:parseLyricTime(m[1]),text:m[2].trim()};
 // Custom: timestamp | lyric (also accepts semicolon)
 m=row.match(/^(\d{1,3}:[0-5]?\d(?:\.\d+)?|\d+(?:\.\d+)?)\s*[|;]\s*(.+)$/);
 if(m)return {time:parseLyricTime(m[1]),text:m[2].trim()};
 // Legacy format with a hyphen delimiter, only when it clearly follows a timestamp.
 m=row.match(/^(\d{1,3}:[0-5]?\d(?:\.\d+)?|\d+(?:\.\d+)?)\s+-\s+(.+)$/);
 if(m)return {time:parseLyricTime(m[1]),text:m[2].trim()};
 return null;
}
function setLyricsOffset(raw){
 const n=Number(raw);
 const safe=Number.isFinite(n)?Math.max(-60,Math.min(60,n)):0;
 const rounded=Math.round(safe*10)/10;
 $("#lyricsOffset").value=String(rounded);
 $("#lyricsOffsetNumber").value=String(rounded);
 $("#lyricsOffsetOut").textContent=`${rounded>0?"+":""}${rounded.toFixed(1)} s`;
}
$("#lyricsOffset").addEventListener("input",e=>setLyricsOffset(e.target.value));
$("#lyricsOffsetNumber").addEventListener("change",e=>setLyricsOffset(e.target.value));
$("#offsetMinus").addEventListener("click",()=>setLyricsOffset(Number($("#lyricsOffset").value)-0.1));
$("#offsetPlus").addEventListener("click",()=>setLyricsOffset(Number($("#lyricsOffset").value)+0.1));
$("#applyLyrics").addEventListener("click",()=>{
 const rows=$("#lyrics").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),parsed=[],invalid=[];
 for(const row of rows){
  const item=parseLyricRow(row);
  if(item&&Number.isFinite(item.time)&&item.text)parsed.push(item);else invalid.push(row);
 }
 lyrics=parsed.sort((a,b)=>a.time-b.time);
 $("#lyricsStatus").textContent=lyrics.length
 ? `${lyrics.length} líneas cargadas${invalid.length?`; ${invalid.length} línea(s) no reconocidas`:''}.`
 : "No se detectaron líneas. Usa [01:12.50] Texto, 01:12.5 | Texto o 72.5 | Texto.";
});

// XZ Clip Generator: manually editable segments + heuristic lyric-based suggestions.
function parseClipTime(raw){
 const s=String(raw??"").trim();
 if(!s)return NaN;
 if(/^\d+(?:\.\d+)?$/.test(s))return Number(s);
 const m=s.match(/^(\d{1,3}):([0-5]?\d(?:\.\d+)?)$/);
 return m?Number(m[1])*60+Number(m[2]):NaN;
}
function fmtTime(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),s=(sec%60).toFixed(1).padStart(4,"0");return `${String(m).padStart(2,"0")}:${s}`;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function addClip(start,end,name,selected=true){
 const duration=audio.duration;
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||(Number.isFinite(duration)&&end>duration)){
  $("#clipStatus").textContent=`Tiempo inválido. La duración de la canción es ${Number.isFinite(duration)?fmtTime(duration):"desconocida"}.`;
  return false;
 }
 const duplicate=clipItems.some(c=>Math.abs(c.start-start)<.05&&Math.abs(c.end-end)<.05);
 if(duplicate){$("#clipStatus").textContent="Ese fragmento ya está en la lista.";return false}
 clipItems.push({id:++clipId,start,end,name:(name||`Clip ${clipId}`).trim(),selected});
 renderClipList();$("#clipStatus").textContent=`Fragmento añadido: ${fmtTime(start)} – ${fmtTime(end)}.`;return true;
}
function renderClipList(){
 const root=$("#clipList");
 if(!clipItems.length){root.innerHTML='<p class="hint">Aún no hay clips en la lista.</p>';return}
 root.innerHTML=clipItems.map(c=>`<article class="clip-item" data-id="${c.id}">
 <div class="clip-head"><input type="checkbox" class="clip-select" ${c.selected?"checked":""} aria-label="Seleccionar clip"><strong>${escapeHtml(c.name)}</strong></div>
 <div class="clip-meta">${fmtTime(c.start)} → ${fmtTime(c.end)} · ${(c.end-c.start).toFixed(1)} s</div>
 <div class="clip-input-grid"><label>Inicio<input class="edit-start" value="${c.start.toFixed(2)}" inputmode="decimal"></label><label>Final<input class="edit-end" value="${c.end.toFixed(2)}" inputmode="decimal"></label></div>
 <label>Nombre<input class="edit-name" maxlength="80" value="${escapeHtml(c.name)}"></label>
 <div class="clip-actions"><button type="button" class="preview-clip">▶ Previsualizar</button><button type="button" class="save-clip">Guardar cambios</button><button type="button" class="delete-clip">Eliminar</button></div></article>`).join("");
 root.querySelectorAll(".clip-item").forEach(card=>{
  const id=Number(card.dataset.id),item=clipItems.find(c=>c.id===id);
  card.querySelector(".clip-select").addEventListener("change",e=>item.selected=e.target.checked);
  card.querySelector(".save-clip").addEventListener("click",()=>{
   const a=parseClipTime(card.querySelector(".edit-start").value),b=parseClipTime(card.querySelector(".edit-end").value),n=card.querySelector(".edit-name").value.trim();
   if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<=a||(Number.isFinite(audio.duration)&&b>audio.duration)){alert("Revisa el inicio y el final del fragmento.");return}
   item.start=a;item.end=b;item.name=n||`Clip ${id}`;renderClipList();
  });
  card.querySelector(".delete-clip").addEventListener("click",()=>{clipItems=clipItems.filter(c=>c.id!==id);renderClipList()});
  card.querySelector(".preview-clip").addEventListener("click",async()=>{if(!audio.src)return;try{await setupAudio();audio.currentTime=item.start;await audio.play();$("#playBtn").textContent="Ⅱ Pausar";audio.ontimeupdate=()=>{if(audio.currentTime>=item.end){audio.pause();audio.ontimeupdate=null;audio.currentTime=item.start}}}catch(e){alert("No se pudo previsualizar: "+e.message)}});
 });
}
$("#addClipBtn").addEventListener("click",()=>{
 const a=parseClipTime($("#clipStart").value),b=parseClipTime($("#clipEnd").value);
 addClip(a,b,$("#clipName").value||`Clip ${clipItems.length+1}`);
});
$("#detectClipsBtn").addEventListener("click",()=>{
 if(!audio.src){$("#clipStatus").textContent="Primero carga una canción.";return}
 if(!lyrics.length){$("#clipStatus").textContent="Primero pega las letras y pulsa Aplicar letras.";return}
 const groups=[];
 // Use explicit section markers and repeated lines as a transparent heuristic.
 const marked=lyrics.filter(l=>/\b(coro|estribillo|puente|breakdown|outro|verso)\b/i.test(l.text));
 for(const l of marked){
  const idx=lyrics.indexOf(l),next=lyrics[idx+1];
  const start=Math.max(0,l.time-2),end=Math.min(audio.duration||Infinity,(next?.time??l.time+30)+1);
  if(end-start>=5)groups.push({start,end,name:`Sección: ${l.text}`});
 }
 const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N} ]/gu,"").trim();
 const byText=new Map();
 lyrics.forEach(l=>{const key=norm(l.text);if(key.length>=12){if(!byText.has(key))byText.set(key,[]);byText.get(key).push(l)}});
 for(const [key,lines] of byText){
  if(lines.length>=2){
   for(const l of lines){const idx=lyrics.indexOf(l),next=lyrics[idx+1];const start=Math.max(0,l.time-2),end=Math.min(audio.duration||Infinity,(next?.time??l.time+20)+1);if(end-start>=5)groups.push({start,end,name:`Frase repetida: ${l.text}`})}
  }
 }
 // Rank long/emphatic lines as candidate highlights, without claiming acoustic chorus detection.
 for(const l of lyrics){
  if(l.text.length>=34&&/[!?…]|harto|verdad|realidad|sombras|corazon|corazón/i.test(l.text)){
   const idx=lyrics.indexOf(l),next=lyrics[idx+1],start=Math.max(0,l.time-2),end=Math.min(audio.duration||Infinity,(next?.time??l.time+18)+1);
   if(end-start>=5)groups.push({start,end,name:`Frase destacada: ${l.text}`});
  }
 }
 const unique=[];
 groups.sort((a,b)=>a.start-b.start).forEach(g=>{
  if(!unique.some(u=>Math.abs(u.start-g.start)<3&&Math.abs(u.end-g.end)<4))unique.push(g)
 });
 let added=0;
 for(const g of unique.slice(0,40))if(addClip(g.start,g.end,g.name,true))added++;
 $("#clipStatus").textContent=added?`Se añadieron ${added} sugerencias y quedaron seleccionadas para exportar. Revisa sus tiempos y desmarca las que no quieras.`:"No se detectaron candidatos claros. Puedes crear un clip manual con inicio y final; no hace falta tener letras para exportar un fragmento.";
});
async function loadFFmpeg(){const {FFmpeg}=await import("https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js");const {toBlobURL}=await import("https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js");const ff=new FFmpeg();ff.on("progress",({progress})=>{$("#progressBar").style.width=`${Math.min(99,Math.round(progress*100))}%`;$("#exportMessage").textContent=`Conversión MP4: ${Math.round(progress*100)}%`});const core="https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",wasm="https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm";await ff.load({coreURL:await toBlobURL(core,"text/javascript"),wasmURL:await toBlobURL(wasm,"application/wasm")});return ff}

$("#exportClipsBtn").addEventListener("click",async()=>{
 if(clipExporting)return;
 if(!audio.src){alert("Carga una canción antes de exportar.");return}
 const selected=clipItems.filter(c=>c.selected);
 const formats=[];
 if($("#clipVertical").checked)formats.push("portrait");
 if($("#clipHorizontal").checked)formats.push("landscape");
 if(!selected.length){alert("No hay clips seleccionados. Añade un fragmento manual o pulsa Detectar coros y frases; las sugerencias aparecerán seleccionadas automáticamente.");return}
 if(!formats.length){alert("Selecciona al menos un formato de salida.");return}
 if(!window.MediaRecorder||!canvas.captureStream){alert("Usa Chrome o Edge actualizado para exportar clips.");return}
 const btn=$("#exportClipsBtn"),msg=$("#clipsExportMessage"),bar=$("#clipsProgressBar"),downloadRoot=$("#clipDownloads");
 let ff=null,fetchFileFn=null,ffmpegUnavailable=false;const outputs=[];clipExporting=true;recording=true;btn.disabled=true;downloadRoot.innerHTML="";$("#clipsZipLink").hidden=true;bar.style.width="0%";
 const oldFormat=format,oldTime=audio.currentTime,oldPaused=audio.paused;
 try{
  await setupAudio();
  msg.textContent="Primero se grabará cada clip como video WebM. Después se intentará convertir a MP4; si FFmpeg no carga, se conservará el video WebM descargable.";
  const total=selected.length*formats.length;let done=0;
  for(const item of selected){
   for(const targetFormat of formats){
    format=targetFormat;resizeCanvas();
    // Allow the canvas to paint in its target aspect ratio before recording.
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    audio.pause();
    await new Promise((resolve,reject)=>{
     let settled=false;
     const cleanup=()=>{clearTimeout(timer);audio.removeEventListener("seeked",ok);audio.removeEventListener("error",bad)};
     const finish=()=>{if(settled)return;settled=true;cleanup();resolve()};
     const ok=()=>{if(Math.abs(audio.currentTime-item.start)<0.25)finish()};
     const bad=()=>{if(settled)return;settled=true;cleanup();reject(new Error("El navegador no pudo buscar el segundo "+fmtTime(item.start)+" en el audio."))};
     const timer=setTimeout(()=>{if(settled)return;settled=true;cleanup();reject(new Error("Tiempo de espera agotado al buscar el inicio del clip. Espera a que el audio termine de cargar e inténtalo otra vez."))},8000);
     audio.addEventListener("seeked",ok);audio.addEventListener("error",bad);
     if(Math.abs(audio.currentTime-item.start)<0.02){finish();return}
     audio.currentTime=item.start;
     if(audio.seeking===false && audio.readyState>=2 && Math.abs(audio.currentTime-item.start)<0.25)finish();
    });
    await setupAudio();
    // Preflight playback while still inside the export flow. This catches blocked
    // playback before MediaRecorder starts, rather than leaving a silent/empty clip.
    try {
     await audio.play();
     await new Promise((resolve,reject)=>{
      if(!audio.paused && audio.readyState>=2){resolve();return;}
      const timer=setTimeout(()=>{cleanup();reject(new Error("El audio no comenzó a reproducirse. Pulsa Reproducir una vez y vuelve a exportar."));},5000);
      const playing=()=>{cleanup();resolve();};
      const error=()=>{cleanup();reject(new Error("El navegador no pudo iniciar el audio para grabar."));};
      function cleanup(){clearTimeout(timer);audio.removeEventListener("playing",playing);audio.removeEventListener("error",error);}
      audio.addEventListener("playing",playing,{once:true});audio.addEventListener("error",error,{once:true});
     });
     audio.pause();
     if(Math.abs(audio.currentTime-item.start)>0.05){
      await new Promise((resolve,reject)=>{
       const timer=setTimeout(()=>{cleanup();reject(new Error("No se pudo volver al inicio del clip después de comprobar el audio."));},5000);
       const seeked=()=>{cleanup();resolve();};
       function cleanup(){clearTimeout(timer);audio.removeEventListener("seeked",seeked);}
       audio.addEventListener("seeked",seeked,{once:true});audio.currentTime=item.start;
      });
     }
    } catch(preflightError) { throw preflightError; }
    const fps=Number($("#fps").value),compact=$("#quality").value==="compact";
    const canvasStream=canvas.captureStream(fps);
    const stream=new MediaStream([...canvasStream.getVideoTracks(),...mediaDestination.stream.getAudioTracks()]);
    const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?"video/webm;codecs=vp9,opus":"video/webm";
    const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:compact?4500000:8000000});
    const chunks=[];recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    const stopped=new Promise((resolve,reject)=>{
     const watchdog=setTimeout(()=>reject(new Error("La grabadora del navegador no terminó de cerrar el video.")),Math.max(20000,(item.end-item.start)*3000));
     recorder.addEventListener("stop",()=>{clearTimeout(watchdog);resolve()},{once:true});
     recorder.addEventListener("error",e=>{clearTimeout(watchdog);reject(new Error("MediaRecorder falló: "+(e.error?.message||"error desconocido")))},{once:true});
    });
    recorder.start(250);status(`GRABANDO CLIP ${done+1}/${total}`);msg.textContent=`Grabando video en tiempo real: ${item.name} (${targetFormat==="portrait"?"9:16":"16:9"})…`;
    try { await audio.play(); }
    catch(playError) {
     if(recorder.state!=="inactive")recorder.stop();
     try { await stopped; } catch {}
     canvasStream.getTracks().forEach(t=>t.stop());
     stream.getTracks().forEach(t=>t.stop());
     throw new Error("No se pudo iniciar la reproducción durante la grabación: "+(playError?.message||playError));
    }
    await new Promise((resolve,reject)=>{
     let finished=false;
     const cleanup=()=>{clearInterval(poll);clearTimeout(timeout);audio.removeEventListener("timeupdate",tick);audio.removeEventListener("error",onError)};
     const finish=()=>{if(finished)return;finished=true;cleanup();audio.pause();resolve()};
     const tick=()=>{if(audio.currentTime>=item.end-0.015||audio.ended)finish()};
     const onError=()=>{if(finished)return;finished=true;cleanup();audio.pause();reject(new Error("Error durante la reproducción del audio del clip"))};
     const poll=setInterval(tick,30);
     const timeout=setTimeout(()=>{if(finished)return;finished=true;cleanup();audio.pause();reject(new Error("La reproducción no avanzó. Verifica que el audio pueda reproducirse y vuelve a intentar."))},Math.max(15000,(item.end-item.start)*2500));
     audio.addEventListener("timeupdate",tick);
     audio.addEventListener("error",onError,{once:true});
     tick();
    });
    if(recorder.state!=="inactive")recorder.stop();
    await stopped;canvasStream.getTracks().forEach(t=>t.stop());stream.getTracks().forEach(t=>{if(t.kind==="video")t.stop()});
    const webm=new Blob(chunks,{type:"video/webm"});if(!webm.size)throw new Error(`El clip "${item.name}" quedó vacío.`);
    const inputName="xz_clip_input.webm",outputName="xz_clip_output.mp4";
    let blob=webm,extension="webm",conversionNote="WebM";
    // Do not make video recording depend on FFmpeg/CDN availability.
    // Attempt MP4 conversion only after a non-empty video has already been recorded.
    if(!ffmpegUnavailable){
     try{
      if(!ff){msg.textContent="Video grabado. Cargando convertidor MP4…";ff=await loadFFmpeg();fetchFileFn=(await import("https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js")).fetchFile;}
      try{await ff.deleteFile(inputName)}catch{}
      try{await ff.deleteFile(outputName)}catch{}
      await ff.writeFile(inputName,await fetchFileFn(webm));
      const args=["-i",inputName,"-t",(item.end-item.start).toFixed(3)];
      if(compact)args.push("-vf",targetFormat==="portrait"?"scale=720:1280:flags=lanczos":"scale=1280:720:flags=lanczos");
      args.push("-c:v","libx264","-preset","ultrafast","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart","-f","mp4",outputName);
      await ff.exec(args);
      const data=await ff.readFile(outputName),mp4Blob=new Blob([data.buffer],{type:"video/mp4"});
      if(mp4Blob.size<1024)throw new Error("FFmpeg generó un archivo demasiado pequeño.");
      blob=mp4Blob;extension="mp4";conversionNote="MP4";
      try{await ff.deleteFile(inputName)}catch{}
      try{await ff.deleteFile(outputName)}catch{}
     }catch(convertErr){
      console.error("Conversión MP4 falló; se conserva WebM:",convertErr);
      if(!ff){ffmpegUnavailable=true;}
      else if(/failed to fetch|network|import|load|fetch/i.test(String(convertErr?.message||convertErr)))ffmpegUnavailable=true;
      msg.textContent="No se pudo convertir a MP4 ("+(convertErr?.message||convertErr)+"). El video ya está grabado; se entregará en WebM para no perderlo.";
      try{if(ff){await ff.deleteFile(inputName)} }catch{}
      try{if(ff){await ff.deleteFile(outputName)} }catch{}
     }
    }
    const safeName=item.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||`clip-${item.id}`;
    const fileName=`XZ-${safeName}-${targetFormat==="portrait"?"9x16":"16x9"}.${extension}`;
    outputs.push({name:fileName,blob});
    const url=URL.createObjectURL(blob);clipBlobUrls.push(url);
    const a=document.createElement("a");a.href=url;a.download=fileName;a.textContent=`⬇ ${fileName} · ${conversionNote} (${(blob.size/1048576).toFixed(1)} MB)`;downloadRoot.appendChild(a);
    done++;bar.style.width=`${Math.round(done/total*90)}%`;
   }
  }
  msg.textContent=`Videos grabados (${outputs.length}). Creando ZIP…`;
  try{
   const JSZip=(await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
   const zip=new JSZip();outputs.forEach(o=>zip.file(o.name,o.blob));
   const zipBlob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:1}},meta=>{bar.style.width=`${90+Math.round(meta.percent*.1)}%`});
   const zipUrl=URL.createObjectURL(zipBlob);clipBlobUrls.push(zipUrl);
   const zipLink=$("#clipsZipLink");zipLink.href=zipUrl;zipLink.download="XZ-Clip-Generator-clips.zip";zipLink.textContent=`⬇ Descargar todos los clips en ZIP (${(zipBlob.size/1048576).toFixed(1)} MB)`;zipLink.hidden=false;
   bar.style.width="100%";msg.textContent=`Listo: ${outputs.length} video(s) generado(s). Los que se convirtieron están en MP4; si FFmpeg falló, el archivo individual/ZIP contiene WebM. Descarga los archivos de abajo.`;status("CLIPS GENERADOS");
  }catch(zipErr){
   console.error("ZIP no disponible:",zipErr);
   msg.textContent=`Se generaron ${outputs.length} video(s) y aparecen como enlaces individuales, pero no se pudo crear el ZIP: ${zipErr?.message||zipErr}.`;
   status("VIDEOS GENERADOS");
  }
 }catch(err){
  console.error(err);msg.textContent="ERROR EN EXPORTACIÓN: "+(err?.message||err)+". Revisa si el fallo ocurrió al cargar FFmpeg, grabar el WebM, convertir a MP4 o empaquetar el ZIP. Prueba primero un clip de 5–10 s en un solo formato.";
  status("ERROR EN CLIPS");
 }finally{
  try{audio.pause();audio.ontimeupdate=null;audio.currentTime=Math.min(oldTime||0,Number.isFinite(audio.duration)?audio.duration:0)}catch{}
  format=oldFormat;resizeCanvas();recording=false;clipExporting=false;btn.disabled=false;
  if(!oldPaused&&audio.src){/* Keep transport state predictable; don't resume after batch export. */}
  $("#playBtn").textContent="▶ Reproducir";
  if(ff){try{ff.terminate()}catch{}}
 }
});
$("#exportBtn").addEventListener("click",async()=>{
 if(recording)return;
 if(!audio.src){alert("Primero carga la canción que quieres convertir en video.");return}
 if(!window.MediaRecorder||!canvas.captureStream){alert("Necesitas Chrome o Edge actualizado para generar el video.");return}
 let recorder=null,canvasStream=null,stream=null,webm=null;
 const btn=$("#exportBtn"),link=$("#downloadLink"),msg=$("#exportMessage"),bar=$("#progressBar");
 try{
  await setupAudio();
  if(audio.readyState<2)await new Promise((resolve,reject)=>{const ok=()=>{clean();resolve()},bad=()=>{clean();reject(new Error("No se pudo cargar el audio."))},clean=()=>{audio.removeEventListener("canplay",ok);audio.removeEventListener("error",bad)};audio.addEventListener("canplay",ok,{once:true});audio.addEventListener("error",bad,{once:true});audio.load()});
  recording=true;btn.disabled=true;link.hidden=true;bar.style.width="0%";
  const fps=Number($("#fps").value),compact=$("#quality").value==="compact";
  canvasStream=canvas.captureStream(fps);stream=new MediaStream([...canvasStream.getVideoTracks(),...mediaDestination.stream.getAudioTracks()]);
  const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?"video/webm;codecs=vp9,opus":"video/webm";
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:compact?4500000:8000000});
  const chunks=[];recorder.addEventListener("dataavailable",e=>{if(e.data?.size)chunks.push(e.data)});
  const stopped=new Promise((resolve,reject)=>{recorder.addEventListener("stop",resolve,{once:true});recorder.addEventListener("error",e=>reject(new Error(e.error?.message||"Error de grabación")),{once:true})});
  audio.pause();audio.currentTime=0;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  recorder.start(1000);status("GENERANDO VIDEO COMPLETO");msg.textContent="Generando el video de la canción completa en tiempo real. No necesitas crear clips. Mantén esta pestaña abierta.";
  await audio.play();
  const duration=Number.isFinite(audio.duration)?audio.duration:0;
  await new Promise((resolve,reject)=>{let done=false;const finish=()=>{if(done)return;done=true;clearInterval(poll);clearTimeout(timeout);audio.removeEventListener("ended",finish);audio.removeEventListener("error",bad);resolve()},bad=()=>{if(done)return;done=true;clearInterval(poll);clearTimeout(timeout);reject(new Error("La reproducción de audio falló durante la grabación."))};const poll=setInterval(()=>{if(duration>0)bar.style.width=Math.min(95,Math.round(audio.currentTime/duration*95))+"%";if(audio.ended||(duration>0&&audio.currentTime>=duration-.05))finish()},100);const timeout=setTimeout(()=>{if(!audio.ended){done=true;clearInterval(poll);audio.removeEventListener("ended",finish);audio.removeEventListener("error",bad);reject(new Error("La reproducción no llegó al final. Comprueba que la canción se reproduce completa."))}},Math.max(60000,(duration||60)*2000));audio.addEventListener("ended",finish,{once:true});audio.addEventListener("error",bad,{once:true});if(audio.ended)finish()});
  if(recorder.state!=="inactive")recorder.stop();await stopped;webm=new Blob(chunks,{type:"video/webm"});
  if(!webm.size)throw new Error("La grabación terminó vacía; el navegador no entregó datos de video.");
  let blob=webm,ext="webm",note="Video WebM listo";
  msg.textContent="Video grabado. Intentando convertirlo a MP4…";status("CONVIRTIENDO MP4");
  let ff=null;
  try{ff=await loadFFmpeg();const {fetchFile}=await import("https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js");await ff.writeFile("xz-full-input.webm",await fetchFile(webm));const args=["-i","xz-full-input.webm"];if(compact)args.push("-vf",format==="portrait"?"scale=720:1280:flags=lanczos":"scale=1280:720:flags=lanczos");args.push("-c:v","libx264","-preset","ultrafast","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart","-f","mp4","xz-full-output.mp4");await ff.exec(args);const data=await ff.readFile("xz-full-output.mp4");const converted=new Blob([data.buffer],{type:"video/mp4"});if(converted.size<1024)throw new Error("MP4 demasiado pequeño");blob=converted;ext="mp4";note="MP4 generado correctamente";
  }catch(convErr){console.warn("MP4 no disponible; se entrega el video WebM grabado",convErr);note="MP4 no disponible; video WebM generado";msg.textContent="La conversión MP4 falló, pero el video ya está grabado. Preparando descarga WebM…"}
  finally{if(ff)try{ff.terminate()}catch{}}
  const url=URL.createObjectURL(blob);link.href=url;link.download=`XZ-Visualizer-${format==="landscape"?"16x9":"9x16"}.${ext}`;link.textContent=`⬇ Descargar video completo ${ext.toUpperCase()} (${(blob.size/1048576).toFixed(1)} MB)`;link.hidden=false;bar.style.width="100%";msg.textContent=`${note}. Pulsa “Descargar video completo” para guardarlo.`;status("VIDEO GENERADO");
 }catch(err){console.error(err);msg.textContent="No se pudo generar el video: "+(err?.message||err);status("ERROR DE VIDEO")}
 finally{try{audio.pause()}catch{};if(recorder&&recorder.state!=="inactive")try{recorder.stop()}catch{};if(canvasStream)canvasStream.getTracks().forEach(t=>t.stop());if(stream)stream.getTracks().forEach(t=>t.getTracks?.().forEach(x=>x.stop()));recording=false;btn.disabled=false;$("#playBtn").textContent="▶ Reproducir"}
});
resizeCanvas();seedParticles();render();
