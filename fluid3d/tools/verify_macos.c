// macOS offscreen OpenGL verification of the same standalone shader passes.
// Run from repository root. Does not interact with KodeLife or create a window.
#include <OpenGL/OpenGL.h>
#include <OpenGL/gl3.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
static int N=64,iterations=40;
#define W (N*8)
#define H (N*(N/8))
#define COUNT (N*N*N)
static GLuint fbo,vao,programs[12],tex[13];
static float resetValue=0;
static float tick=0,mode=0,cameraYaw=0.35f,vorticity=2.0f;
static const float step=1.0f/60.0f;
static const char *names[]={"01_advect_velocity","02_curl","03_forces","04_divergence","05_pressure_seed","06_pressure_jacobi","07_project","08_density_forward","09_density_reverse","10_state","11_render","00_clock"};
static void fail(const char *msg){fprintf(stderr,"%s\n",msg);exit(1);}
static GLuint compile(GLenum type,const char *src){
 GLuint id=glCreateShader(type);glShaderSource(id,1,&src,NULL);glCompileShader(id);GLint ok;glGetShaderiv(id,GL_COMPILE_STATUS,&ok);
 if(!ok){char log[8192];glGetShaderInfoLog(id,sizeof log,NULL,log);fail(log);}return id;
}
static GLuint load(const char *name){
 char path[256];snprintf(path,sizeof path,"fluid3d/shaders/%s.frag",name);FILE *f=fopen(path,"rb");if(!f)fail(path);
 fseek(f,0,SEEK_END);long n=ftell(f);rewind(f);char *s=calloc(n+1,1);fread(s,1,n,f);fclose(f);
 const char *v="#version 150\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}";
 GLuint vs=compile(GL_VERTEX_SHADER,v),fs=compile(GL_FRAGMENT_SHADER,s),p=glCreateProgram();free(s);glAttachShader(p,vs);glAttachShader(p,fs);glBindFragDataLocation(p,0,"fragColor");glLinkProgram(p);GLint ok;glGetProgramiv(p,GL_LINK_STATUS,&ok);if(!ok){char log[8192];glGetProgramInfoLog(p,sizeof log,NULL,log);fail(log);}glDeleteShader(vs);glDeleteShader(fs);return p;
}
static void scalar(GLuint p,const char *name,float x){glUniform1f(glGetUniformLocation(p,name),x);}
static GLuint texture(int w,int h){
 GLuint t;glGenTextures(1,&t);glBindTexture(GL_TEXTURE_2D,t);
 glTexImage2D(GL_TEXTURE_2D,0,GL_RGBA32F,w,h,0,GL_RGBA,GL_FLOAT,NULL);
 glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_LINEAR);glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,GL_LINEAR);
 glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_WRAP_S,GL_CLAMP_TO_EDGE);glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_WRAP_T,GL_CLAMP_TO_EDGE);
 glBindFramebuffer(GL_FRAMEBUFFER,fbo);glFramebufferTexture2D(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,t,0);
 if(glCheckFramebufferStatus(GL_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)fail("Incomplete float framebuffer");
 glClearColor(0,0,0,0);glClear(GL_COLOR_BUFFER_BIT);return t;
}
static const char *samplers[]={"stateTex","velocityTex","curlTex","divergenceTex","pressureTex","forwardTex","reverseTex"};
static void draw(int pass,GLuint output,int w,int h,GLuint state,GLuint vel,GLuint curl,GLuint div,GLuint pressure,GLuint fw,GLuint rv){
 GLuint p=programs[pass];GLuint inputs[]={state,vel,curl,div,pressure,fw,rv};glUseProgram(p);
 glBindFramebuffer(GL_FRAMEBUFFER,fbo);glFramebufferTexture2D(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,output,0);glViewport(0,0,w,h);
 glUniform1i(glGetUniformLocation(p,"gridSize"),N);scalar(p,"dt",step);scalar(p,"time",tick);scalar(p,"reset",resetValue);scalar(p,"mode",mode);scalar(p,"confinement",vorticity);scalar(p,"yaw",cameraYaw);scalar(p,"pitch",0.08f);scalar(p,"absorption",32);scalar(p,"debugView",0);glUniform2f(glGetUniformLocation(p,"resolution"),w,h);
 for(int i=0;i<7;i++){GLint loc=glGetUniformLocation(p,samplers[i]);if(loc>=0){if(inputs[i]==output)fail("Texture feedback loop");glActiveTexture(GL_TEXTURE0+i);glBindTexture(GL_TEXTURE_2D,inputs[i]);glUniform1i(loc,i);}}
 GLint clockLoc=glGetUniformLocation(p,"clockTex");if(clockLoc>=0){glActiveTexture(GL_TEXTURE7);glBindTexture(GL_TEXTURE_2D,tex[11]);glUniform1i(clockLoc,7);}
 glDrawArrays(GL_TRIANGLES,0,3);if(glGetError()!=GL_NO_ERROR)fail("OpenGL draw error");
}
static float *readTexture(GLuint t){float *a=malloc(COUNT*4*sizeof(float));glBindFramebuffer(GL_FRAMEBUFFER,fbo);glFramebufferTexture2D(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,t,0);glReadPixels(0,0,W,H,GL_RGBA,GL_FLOAT,a);return a;}
static int index3(int x,int y,int z){return (((z/8)*N+y)*W+(z%8)*N+x)*4;}
static double divergence(float *a){double sum=0;for(int z=0;z<N;z++)for(int y=0;y<N;y++)for(int x=0;x<N;x++){int i=index3(x,y,z);double d=a[i]+a[i+1]+a[i+2];if(x>0)d-=a[index3(x-1,y,z)];if(y>0)d-=a[index3(x,y-1,z)+1];if(z>0)d-=a[index3(x,y,z-1)+2];sum+=d*d;}return sqrt(sum/COUNT);}
int main(int argc,char **argv){
 int steps=argc>1?atoi(argv[1]):240;const char *output=argc>2?argv[2]:"/tmp/fluid3d.ppm";mode=argc>3?(float)atof(argv[3]):0;cameraYaw=argc>4?(float)atof(argv[4]):0.35f;
 if(argc>5)vorticity=(float)atof(argv[5]);
 if(argc>6)N=atoi(argv[6]);if(argc>7)iterations=atoi(argv[7]);if(N<16||N>128||N%8!=0||iterations<1)fail("Invalid grid or iterations");
 CGLPixelFormatAttribute attrs[]={kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,kCGLPFAAccelerated,(CGLPixelFormatAttribute)0};CGLPixelFormatObj pf=NULL;CGLContextObj ctx=NULL;GLint np;
 if(CGLChoosePixelFormat(attrs,&pf,&np)!=kCGLNoError||!pf)fail("Cannot create OpenGL pixel format (GPU access required)");
 if(CGLCreateContext(pf,NULL,&ctx)!=kCGLNoError)fail("Cannot create context");CGLSetCurrentContext(ctx);
 glGenFramebuffers(1,&fbo);glGenVertexArrays(1,&vao);glBindVertexArray(vao);
 for(int i=0;i<12;i++)programs[i]=load(names[i]);printf("Compiled and linked 12 GLSL 150 passes.\n");fflush(stdout);
 for(int i=0;i<11;i++)tex[i]=texture(W,H);
 tex[11]=texture(1,1);tex[12]=texture(1,1);
 // state pingpong 0,1; advect 2; curl 3; force 4; div 5; pressure 6,7; projected 8; forward 9; reverse 10
 double before=0,after=0;
 for(int frame=0;frame<steps;frame++){
  draw(11,tex[12],1,1,0,0,0,0,0,0,0);GLuint ct=tex[11];tex[11]=tex[12];tex[12]=ct;
  draw(0,tex[2],W,H,tex[0],0,0,0,0,0,0);
  draw(1,tex[3],W,H,0,tex[2],0,0,0,0,0);
  draw(2,tex[4],W,H,0,tex[2],tex[3],0,0,0,0);
  draw(3,tex[5],W,H,0,tex[4],0,0,0,0,0);
  draw(4,tex[6],W,H,0,0,0,0,0,0,0);
  GLuint pr=tex[6],pw=tex[7];
  for(int j=0;j<iterations;j++){draw(5,pw,W,H,0,0,0,tex[5],pr,0,0);GLuint tmp=pr;pr=pw;pw=tmp;}
  draw(6,tex[8],W,H,0,tex[4],0,0,pr,0,0);
  draw(7,tex[9],W,H,tex[0],tex[8],0,0,0,0,0);
  draw(8,tex[10],W,H,0,tex[8],0,0,0,tex[9],0);
  draw(9,tex[1],W,H,tex[0],tex[8],0,0,0,tex[9],tex[10]);
  GLuint temp=tex[0];tex[0]=tex[1];tex[1]=temp;tick+=step;
  if(frame==steps-1){float *a=readTexture(tex[4]),*b=readTexture(tex[8]);before=divergence(a);after=divergence(b);free(a);free(b);}
 }
 float *a=readTexture(tex[0]);double mass=0,maxDensity=0,zSpread=0;int occupiedSlices=0;
 for(int z=0;z<N;z++){double slice=0;for(int y=0;y<N;y++)for(int x=0;x<N;x++){int i=index3(x,y,z);for(int k=0;k<4;k++)if(!isfinite(a[i+k]))fail("Non-finite state");if(a[i+3]<-1e-6)fail("Negative density");if((x==N-1&&fabs(a[i])>1e-6)||(y==N-1&&fabs(a[i+1])>1e-6)||(z==N-1&&fabs(a[i+2])>1e-6))fail("Wall velocity is nonzero");mass+=a[i+3];slice+=a[i+3];maxDensity=fmax(maxDensity,a[i+3]);}if(slice>0.01)occupiedSlices++;zSpread+=slice*(z-N/2.0)*(z-N/2.0);}
 free(a);printf("grid=%d iterations=%d steps=%d time=%.3f mode=%.0f divergence_before=%.7f after=%.7f ratio=%.4f mass=%.3f max_density=%.4f occupied_z=%d z_rms=%.3f\n",N,iterations,steps,tick,mode,before,after,after/fmax(before,1e-12),mass,maxDensity,occupiedSlices,sqrt(zSpread/fmax(mass,1e-12)));
 if(steps>10&&(mass<0.01||occupiedSlices<3||after>before*0.95))fail("Simulation validation failed");
 GLuint image=texture(720,540);draw(10,image,720,540,tex[0],0,0,0,0,0,0);unsigned char *rgb=malloc(720*540*4);glReadPixels(0,0,720,540,GL_RGBA,GL_UNSIGNED_BYTE,rgb);FILE *f=fopen(output,"wb");if(!f)fail("Cannot write output");fprintf(f,"P6\n720 540\n255\n");for(int y=539;y>=0;y--)for(int x=0;x<720;x++)fwrite(rgb+(y*720+x)*4,1,3,f);fclose(f);free(rgb);printf("Rendered %s; finite values, nonnegative density and closed walls verified.\n",output);
 resetValue=1;draw(9,tex[1],W,H,tex[0],tex[8],0,0,0,tex[9],tex[10]);
 float *cleared=readTexture(tex[1]);for(int i=0;i<COUNT*4;i++)if(cleared[i]!=0)fail("Reset failed");free(cleared);puts("Reset shader verified: all state components zero.");
 CGLDestroyContext(ctx);CGLDestroyPixelFormat(pf);return 0;
}
