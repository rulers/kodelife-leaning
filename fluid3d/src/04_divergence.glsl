void main() {
    if(reset>0.5) { fragColor=vec4(0); return; }
    ivec3 c=cell(); vec3 v=fetchCell(velocityTex,c).xyz;
    float left=c.x>0?fetchCell(velocityTex,c-EX).r:0.0;
    float down=c.y>0?fetchCell(velocityTex,c-EY).g:0.0;
    float back=c.z>0?fetchCell(velocityTex,c-EZ).b:0.0;
    fragColor=vec4(v.x-left+v.y-down+v.z-back,0,0,1);
}
