void main() {
    if(reset > 0.5) {
        fragColor = vec4(0);
        return;
    }
    ivec3 c = cell();
    vec3 p = vec3(c);
    vec3 bx = trace(stateTex, p + vec3(0.5, 0, 0), dt) - vec3(0.5, 0, 0);
    vec3 by = trace(stateTex, p + vec3(0, 0.5, 0), dt) - vec3(0, 0.5, 0);
    vec3 bz = trace(stateTex, p + vec3(0, 0, 0.5), dt) - vec3(0, 0, 0.5);
    vec3 v = vec3(sampleField(stateTex, bx).r, sampleField(stateTex, by).g, sampleField(stateTex, bz).b);
    fragColor = vec4(walls(v, c), fetchCell(stateTex, c).a);
}
