'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('view'), status = $('status'), error = $('error');
  let gl, running = true, failed = false, targetTime = null;
  let simulationTime = 0, accumulator = 0, lastTime = 0, lastStatus = 0, frames = 0;
  let yaw = 20 * Math.PI / 180, pitch = 0.08, pointer = null;
  const dt = 1 / 60;
  let n = 64, width = n * 8, height = n * (n / 8);
  const programs = {}, buffers = [];
  let framebuffer, needsRender=true;
  const uniforms = ['stateTex','velocityTex','curlTex','divergenceTex','pressureTex','forwardTex','reverseTex',
    'gridSize','clockTex','resolution','time','dt','reset','mode','confinement','yaw','pitch','absorption','debugView'];
  function stopWithError(e) {
    failed = true; running = false;
    error.textContent = String(e.message || e);
    status.textContent = '計算を停止しました。';
    for (const id of ['pause','reset','step','advance']) $(id).disabled = true;
    console.error(e);
  }
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(source) {
    const p = gl.createProgram();
    const vs = shader(gl.VERTEX_SHADER, '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}');
    const fs = shader(gl.FRAGMENT_SHADER, source.replace('#version 150', '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;'));
    gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.deleteShader(vs); gl.deleteShader(fs);
    return {handle:p, locations:Object.fromEntries(uniforms.map(u=>[u,gl.getUniformLocation(p,u)]))};
  }
  function texture(clock=false) {
    const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
    // Half-float textures support linear sampling in WebGL2.
    gl.texImage2D(gl.TEXTURE_2D,0,clock?gl.RGBA32F:gl.RGBA16F,clock?1:width,clock?1:height,0,gl.RGBA,clock?gl.FLOAT:gl.HALF_FLOAT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,clock?gl.NEAREST:gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,clock?gl.NEAREST:gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error('浮動小数点の描画先を作成できません。WebGL2対応ブラウザーで開いてください。');
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    return t;
  }
  function draw(name, output, inputs={}) {
    const p=programs[name]; gl.useProgram(p.handle);
    gl.bindFramebuffer(gl.FRAMEBUFFER,output?framebuffer:null);
    if(output) gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,output,0);
    const w=output?(name==='00_clock'?1:width):canvas.width, h=output?(name==='00_clock'?1:height):canvas.height;
    inputs={...inputs,clockTex:buffers[11]};
    gl.viewport(0,0,w,h);
    const values={time:simulationTime,dt,reset:0,mode:Number($('mode').value),confinement:Number($('vorticity').value),yaw,pitch,absorption:Number($('absorption').value),debugView:Number($('display').value)};
    for(const [key,value] of Object.entries(values)) if(p.locations[key]!==null) gl.uniform1f(p.locations[key],value);
    if(p.locations.resolution!==null) gl.uniform2f(p.locations.resolution,w,h);
    if(p.locations.gridSize!==null)gl.uniform1i(p.locations.gridSize,n);
    let unit=0;
    for(const [key,t] of Object.entries(inputs)) {
      if(p.locations[key]===null) continue;
      if(t===output) throw new Error('同じテクスチャを読み書きしようとしました。');
      gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(p.locations[key],unit++);
    }
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  function step() {
    draw('00_clock',buffers[12]);[buffers[11],buffers[12]]=[buffers[12],buffers[11]];
    draw('01_advect_velocity',buffers[2],{stateTex:buffers[0]});
    draw('02_curl',buffers[3],{velocityTex:buffers[2]});
    draw('03_forces',buffers[4],{velocityTex:buffers[2],curlTex:buffers[3]});
    draw('04_divergence',buffers[5],{velocityTex:buffers[4]});
    draw('05_pressure_seed',buffers[6]);
    let a=buffers[6],b=buffers[7];
    for(let i=0;i<Number($('iterations').value);i++) {
      draw('06_pressure_jacobi',b,{pressureTex:a,divergenceTex:buffers[5]});[a,b]=[b,a];
    }
    draw('07_project',buffers[8],{velocityTex:buffers[4],pressureTex:a});
    draw('08_density_forward',buffers[9],{stateTex:buffers[0],velocityTex:buffers[8]});
    draw('09_density_reverse',buffers[10],{forwardTex:buffers[9],velocityTex:buffers[8]});
    draw('10_state',buffers[1],{stateTex:buffers[0],velocityTex:buffers[8],forwardTex:buffers[9],reverseTex:buffers[10]});
    [buffers[0],buffers[1]]=[buffers[1],buffers[0]];
    simulationTime+=dt;needsRender=true;
  }
  function render(){draw('11_render',null,{stateTex:buffers[0]});needsRender=false;}
  function updateButton(){$('pause').textContent=running?'一時停止':'再生';}
  function clear() {
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    for(const t of buffers){gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}
    simulationTime=0;accumulator=0;targetTime=null;render();
  }
  function animate(now) {
    if(failed)return;
    try {
      if(targetTime!==null) {
        for(let i=0;i<6 && simulationTime<targetTime-dt*0.1;i++) step();
        if(simulationTime>=targetTime-dt*0.1){targetTime=null;running=false;updateButton();}
        accumulator=0;
      } else if(running) {
        accumulator+=Math.min((now-lastTime)/1000,0.1);
        let count=0;
        while(accumulator>=dt && count<5){step();accumulator-=dt;count++;}
        if(count===5)accumulator=0;
      } else accumulator=0;
      if(needsRender){render();frames++;}
      if(now-lastStatus>500) {
        const fps=Math.round(frames*1000/(now-lastStatus));frames=0;lastStatus=now;
        status.textContent=`${targetTime!==null?'計算中':running?'再生中':'停止中'} · ${simulationTime.toFixed(2)} 秒 · ${running||targetTime!==null?fps+' fps · ':''}圧力 ${$('iterations').value} 回`;
        const err=gl.getError();if(err!==gl.NO_ERROR)throw new Error('WebGL描画エラー: '+err);
      }
      lastTime=now;requestAnimationFrame(animate);
    } catch(e){stopWithError(e);}
  }
  try {
    gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:true});
    if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw new Error('WebGL2とEXT_color_buffer_floatが必要です。対応ブラウザーで開いてください。');
    gl.bindVertexArray(gl.createVertexArray());framebuffer=gl.createFramebuffer();
    for(const [name,source] of Object.entries(window.FLUID_SHADERS))programs[name]=program(source);
    for(let i=0;i<11;i++)buffers.push(texture());
    buffers.push(texture(true),texture(true));
    $('pause').onclick=()=>{targetTime=null;running=!running;updateButton();};
    $('reset').onclick=()=>{clear();running=true;updateButton();};
    $('step').onclick=()=>{targetTime=null;running=false;step();render();updateButton();};
    $('advance').onclick=()=>{if(simulationTime>=8)clear();targetTime=8;running=false;updateButton();};
    $('grid').onchange=()=>{
      try {
        for(const t of buffers)gl.deleteTexture(t);buffers.length=0;
        n=Number($('grid').value);width=n*8;height=n*(n/8);
        for(let i=0;i<11;i++)buffers.push(texture());buffers.push(texture(true),texture(true));
        $('gridLabel').textContent=`${n} × ${n} × ${n}`;
        if(n>64)$('iterations').value='80';
        clear();running=true;updateButton();
      }catch(e){stopWithError(e);}
    };
    $('mode').onchange=()=>{clear();running=true;updateButton();};
    $('absorption').oninput=()=>{$('absorptionValue').value=$('absorption').value;needsRender=true;};
    $('vorticity').oninput=()=>{$('vorticityValue').value=Number($('vorticity').value).toFixed(1);};
    $('yaw').oninput=()=>{yaw=Number($('yaw').value)*Math.PI/180;$('yawValue').value=$('yaw').value+'°';needsRender=true;};
    $('display').onchange=()=>{needsRender=true;};
    $('quality').onchange=()=>{canvas.width=Number($('quality').value);canvas.height=canvas.width*3/4;needsRender=true;};
    canvas.onpointerdown=e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
    canvas.onpointermove=e=>{if(!pointer)return;yaw+=(e.clientX-pointer.x)*0.006;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-pointer.y)*0.006));pointer={x:e.clientX,y:e.clientY};yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));$('yaw').value=Math.round(yaw*180/Math.PI);$('yawValue').value=$('yaw').value+'°';needsRender=true;};
    canvas.onpointerup=()=>{pointer=null;};canvas.onpointercancel=()=>{pointer=null;};
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stopWithError(new Error('GPU接続が失われました。ページを再読み込みしてください。'));});
    lastTime=performance.now();lastStatus=lastTime;requestAnimationFrame(animate);
  } catch(e){stopWithError(e);}
})();
