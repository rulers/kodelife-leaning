void main() {
    if(reset>0.5) { fragColor=vec4(0); return; }
    vec3 back=trace(velocityTex,vec3(cell()),-dt);
    fragColor=vec4(0,0,0,sampleField(forwardTex,back).a);
}
