#version 150
// Shared GLSL 150 source. build.py expands this into each standalone pass.
uniform sampler2D stateTex;
uniform sampler2D velocityTex;
uniform sampler2D curlTex;
uniform sampler2D divergenceTex;
uniform sampler2D pressureTex;
uniform sampler2D forwardTex;
uniform sampler2D reverseTex;
uniform vec2 resolution;
uniform sampler2D clockTex;
float simTime() { return texelFetch(clockTex, ivec2(0), 0).r; }
uniform float dt;
uniform float reset;
uniform float mode;       // 0: sinking ink; 1: rising smoke
uniform float confinement; // optional visual restoration of small vortices
uniform float yaw;
uniform float pitch;
uniform float absorption;
uniform float debugView;  // 0: volume, 1: middle density slice
out vec4 fragColor;
uniform int gridSize;
#define N gridSize
const int COLS = 8;
#define ATLAS ivec2(N * COLS, N * (N / COLS))
const ivec3 EX = ivec3(1,0,0);
const ivec3 EY = ivec3(0,1,0);
const ivec3 EZ = ivec3(0,0,1);

ivec2 atlasPixel(ivec3 c) {
    c = clamp(c, ivec3(0), ivec3(N-1));
    return ivec2((c.z % COLS)*N + c.x, (c.z / COLS)*N + c.y);
}
ivec3 cell() {
    ivec2 a = ivec2(gl_FragCoord.xy);
    return ivec3(a.x % N, a.y % N, a.x / N + COLS*(a.y / N));
}
vec4 fetchCell(sampler2D field, ivec3 c) {
    return texelFetch(field, atlasPixel(c), 0);
}
vec4 sampleField(sampler2D field, vec3 p) {
    // Hardware bilinear XY plus explicit Z interpolation; no tile bleed.
    p = clamp(p, vec3(0.0), vec3(float(N-1)));
    int z0 = int(floor(p.z));
    int z1 = min(z0+1, N-1);
    vec2 a = vec2((z0 % COLS)*N, (z0 / COLS)*N) + p.xy + 0.5;
    vec2 b = vec2((z1 % COLS)*N, (z1 / COLS)*N) + p.xy + 0.5;
    return mix(textureLod(field, a/vec2(ATLAS), 0.0),
               textureLod(field, b/vec2(ATLAS), 0.0), fract(p.z));
}
vec3 velocityAt(sampler2D field, vec3 p) {
    // MAC layout: positive X/Y/Z face velocity in R/G/B; scalar in A.
    return vec3(sampleField(field,p-vec3(0.5,0,0)).r,
                sampleField(field,p-vec3(0,0.5,0)).g,
                sampleField(field,p-vec3(0,0,0.5)).b);
}
vec3 trace(sampler2D field, vec3 p, float stepSize) {
    vec3 midpoint = p - 0.5*stepSize*velocityAt(field,p);
    return p-stepSize*velocityAt(field,midpoint);
}
vec3 walls(vec3 v, ivec3 c) {
    // Negative exterior faces are implicit zeros; positive exterior faces explicit.
    if(c.x==N-1) v.x=0.0;
    if(c.y==N-1) v.y=0.0;
    if(c.z==N-1) v.z=0.0;
    return v;
}
float source(vec3 p) {
    vec3 x=(p+0.5)/float(N);
    float result=0.0;
    for(int i=0;i<3;i++) {
        float fi=float(i);
        float age=simTime()-fi*0.32;
        float pulse=smoothstep(0.0,0.15,age)*(1.0-smoothstep(0.8,1.35,age));
        if(mode>0.5) pulse=1.0;
        vec3 center=vec3(0.34+fi*0.16,mode>0.5?0.16:0.84,0.40+fi*0.10);
        center.x+=0.012*sin(simTime()*2.1+fi*2.0);
        vec3 q=(x-center)/vec3(0.045,0.036,0.045);
        result+=exp(-dot(q,q)*1.5)*pulse;
    }
    return result;
}

void main() { fragColor=reset>0.5?vec4(0):vec4(simTime()+dt,0,0,1); }
