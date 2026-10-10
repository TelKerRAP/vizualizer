const $ = s => document.querySelector(s);
const canvas=$("#visualizer"), ctx=canvas.getContext("2d",{alpha:false}), audio=$("#audio");
let audioContext, analyser, sourceNode, mediaDestination, image=null, imageUrl=null, audioUrl=null;
let format="landscape", intensity=.75, glow=.7, particleCount=90, particles=[], recording=false;
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
async function loadFFmpeg(){const {FFmpeg}=await import("https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js");const {toBlobURL}=await import("https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js");const ff=new FFmpeg();ff.on("progress",({progress})=>{$("#progressBar").style.width=`${Math.min(99,Math.round(progress*100))}%`;$("#exportMessage").textContent=`Conversión MP4: ${Math.round(progress*100)}%`});const core="https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",wasm="https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm";await ff.load({coreURL:await toBlobURL(core,"text/javascript"),wasmURL:await toBlobURL(wasm,"application/wasm")});return ff}
$("#exportBtn").addEventListener("click",async()=>{if(recording)return;if(!audio.src){$("#audioFile").click();return}if(!window.MediaRecorder||!canvas.captureStream){alert("Usa Chrome o Edge actualizado para grabar el canvas.");return}
 let recorder,canvasStream;try{await setupAudio();recording=true;$("#exportBtn").disabled=true;$("#downloadLink").hidden=true;$("#progressBar").style.width="0%";audio.currentTime=0;await audio.play();const fps=+$("#fps").value,compact=$("#quality").value==="compact";canvasStream=canvas.captureStream(fps);const stream=new MediaStream([...canvasStream.getVideoTracks(),...mediaDestination.stream.getAudioTracks()]);const mime=MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?"video/webm;codecs=vp9,opus":"video/webm";recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:compact?4500000:8000000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.start(1000);status("GRABANDO");$("#exportMessage").textContent="Grabando en tiempo real hasta que termine la canción. Mantén la pestaña activa.";
 await new Promise((resolve,reject)=>{audio.addEventListener("ended",resolve,{once:true});audio.addEventListener("error",()=>reject(new Error("Error de reproducción del audio")),{once:true})});recorder.stop();await stopped;canvasStream.getTracks().forEach(t=>t.stop());const webm=new Blob(chunks,{type:"video/webm"});if(!webm.size)throw new Error("Grabación vacía");
 status("CONVIRTIENDO");$("#exportMessage").textContent="Cargando FFmpeg y convirtiendo a MP4…";const ff=await loadFFmpeg();const {fetchFile}=await import("https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js");await ff.writeFile("input.webm",await fetchFile(webm));const args=["-i","input.webm"];if(compact)args.push("-vf","scale=1280:720:flags=lanczos");args.push("-c:v","libx264","-preset","ultrafast","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart","output.mp4");await ff.exec(args);const out=await ff.readFile("output.mp4");const blob=new Blob([out.buffer],{type:"video/mp4"}),url=URL.createObjectURL(blob),link=$("#downloadLink");link.href=url;link.download=`XZ-Visualizer-${format==="landscape"?"16x9":"9x16"}.mp4`;link.textContent=`⬇ Descargar MP4 (${(blob.size/1048576).toFixed(1)} MB)`;link.hidden=false;$("#progressBar").style.width="100%";$("#exportMessage").textContent="Exportación terminada.";status("EXPORTADO");await ff.deleteFile("input.webm");await ff.deleteFile("output.mp4");
 }catch(err){console.error(err);if(recorder&&recorder.state!=="inactive")recorder.stop();$("#exportMessage").textContent="Error al exportar: "+(err.message||err)+". Comprueba la conexión y prueba con un tema corto.";status("ERROR")}finally{recording=false;$("#exportBtn").disabled=false;if(!audio.paused)audio.pause();$("#playBtn").textContent="▶ Reproducir";if(canvasStream)canvasStream.getTracks().forEach(t=>t.stop())}});
resizeCanvas();seedParticles();render();
