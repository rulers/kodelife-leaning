vec3 vortexForce(ivec3 c) {
    vec3 grad=vec3(fetchCell(curlTex,c+EX).a-fetchCell(curlTex,c-EX).a,
                   fetchCell(curlTex,c+EY).a-fetchCell(curlTex,c-EY).a,
                   fetchCell(curlTex,c+EZ).a-fetchCell(curlTex,c-EZ).a)*0.5;
    vec3 normal=grad/max(length(grad),0.0001);
    return confinement*cross(normal,fetchCell(curlTex,c).xyz);
}
void main() {
    if(reset>0.5) { fragColor=vec4(0); return; }
    ivec3 c=cell(); vec3 p=vec3(c);
    vec4 old=fetchCell(velocityTex,c);
    vec3 f0=vortexForce(c);
    vec3 f=0.5*vec3(f0.x+vortexForce(c+EX).x,f0.y+vortexForce(c+EY).y,f0.z+vortexForce(c+EZ).z);
    float density=0.5*(old.a+fetchCell(velocityTex,c+EY).a);
    float direction=mode>0.5?1.0:-1.0;
    f.y+=direction*(density*5.0+source(p+vec3(0,0.5,0))*28.0);
    // Slightly angled, time-varying injection breaks perfect axial symmetry.
    // This is a localized external force, not a procedural density pattern.
    f.x+=source(p+vec3(0.5,0,0))*18.0*sin(simTime()*3.0+p.z*0.35);
    f.z+=source(p+vec3(0,0,0.5))*18.0*cos(simTime()*2.7+p.x*0.31);
    vec3 v=old.xyz+dt*f*(float(N)/64.0);
    // Emergency speed bound for large time steps / extreme user settings.
    v=clamp(v,vec3(-24.0)*float(N)/64.0,vec3(24.0)*float(N)/64.0);
    fragColor=vec4(walls(v,c),old.a);
}
