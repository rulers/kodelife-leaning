void main() {
    if(reset > 0.5) {
        fragColor = vec4(0);
        return;
    }
    ivec3 c = cell();
    vec3 p = vec3(c);
    vec3 back = clamp(trace(velocityTex, p, dt), vec3(0), vec3(float(N - 1)));
    ivec3 base = ivec3(floor(back));
    float lo = 1e10;
    float hi = -1e10;
    for(int z = 0; z < 2; z++) for(int y = 0; y < 2; y++) for(int x = 0; x < 2; x++) {
                float d = fetchCell(stateTex, base + ivec3(x, y, z)).a;
                lo = min(lo, d);
                hi = max(hi, d);
            }
    float forward = fetchCell(forwardTex, c).a;
    float corrected = forward + 0.5 * (fetchCell(stateTex, c).a - fetchCell(reverseTex, c).a);
    // Limited MacCormack: use first-order value if correction overshoots.
    if(corrected < lo || corrected > hi)
        corrected = forward;
    float density = max(0.0, corrected) * exp(-dt * (mode > 0.5 ? 0.035 : 0.005));
    density += dt * source(p) * 7.0;
    fragColor = vec4(fetchCell(velocityTex, c).xyz, min(density, 4.0));
}
