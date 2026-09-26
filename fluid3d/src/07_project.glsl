void main() {
    if(reset>0.5) { fragColor=vec4(0); return; }
    ivec3 c=cell(); float p=fetchCell(pressureTex,c).r;
    vec3 gradient=vec3(fetchCell(pressureTex,c+EX).r-p,
                       fetchCell(pressureTex,c+EY).r-p,
                       fetchCell(pressureTex,c+EZ).r-p);
    vec4 old=fetchCell(velocityTex,c);
    fragColor=vec4(walls(old.xyz-gradient,c),old.a);
}
