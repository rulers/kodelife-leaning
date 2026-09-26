void main() {
    if(reset>0.5) { fragColor=vec4(0); return; }
    vec3 p=vec3(cell());
    vec3 dx=(velocityAt(velocityTex,p+vec3(1,0,0))-velocityAt(velocityTex,p-vec3(1,0,0)))*0.5;
    vec3 dy=(velocityAt(velocityTex,p+vec3(0,1,0))-velocityAt(velocityTex,p-vec3(0,1,0)))*0.5;
    vec3 dz=(velocityAt(velocityTex,p+vec3(0,0,1))-velocityAt(velocityTex,p-vec3(0,0,1)))*0.5;
    vec3 w=vec3(dy.z-dz.y,dz.x-dx.z,dx.y-dy.x);
    fragColor=vec4(w,length(w));
}
