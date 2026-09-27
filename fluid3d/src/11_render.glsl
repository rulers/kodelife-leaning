float densityAt(vec3 p) {
    if(any(lessThan(p, vec3(-0.5))) || any(greaterThan(p, vec3(0.5))))
        return 0.0;
    return max(0.0, sampleField(stateTex, (p + 0.5) * float(N) - 0.5).a);
}
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    vec3 background = mode > 0.5 ? vec3(0.023, 0.032, 0.048) : vec3(0.965, 0.965, 0.95);
    if(debugView > 0.5) {
        vec3 p = vec3(uv, 0.0);
        fragColor = vec4(vec3(1.0 - exp(-densityAt(p) * 2.0)), 1);
        return;
    }
    vec3 ro = 2.05 * vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch));
    vec3 forward = normalize(-ro);
    vec3 right = normalize(cross(forward, vec3(0, 1, 0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward * 1.75 + uv.x * right + uv.y * up);
    vec3 safe = sign(rd) * max(abs(rd), vec3(0.00001));
    if(abs(rd.x) < 0.00001)
        safe.x = 0.00001;
    if(abs(rd.y) < 0.00001)
        safe.y = 0.00001;
    if(abs(rd.z) < 0.00001)
        safe.z = 0.00001;
    vec3 t0 = (-vec3(0.5) - ro) / safe;
    vec3 t1 = (vec3(0.5) - ro) / safe;
    vec3 nearPlane = min(t0, t1), farPlane = max(t0, t1);
    float start = max(max(nearPlane.x, nearPlane.y), max(nearPlane.z, 0.0));
    float end = min(min(farPlane.x, farPlane.y), farPlane.z);
    if(end <= start) {
        fragColor = vec4(background, 1);
        return;
    }
    float ds = (end - start) / 160.0;
    float transmittance = 1.0;
    vec3 light = vec3(0);
    for(int i = 0; i < 160; i++) {
        vec3 pos = ro + rd * (start + (float(i) + 0.5) * ds);
        float d = densityAt(pos);
        float alpha = 1.0 - exp(-d * absorption * ds);
        if(mode > 0.5) {
            float shade = exp(-densityAt(pos + vec3(-0.035, 0.055, 0.025)) * 1.8);
            vec3 smoke = mix(vec3(0.25, 0.30, 0.36), vec3(0.90, 0.92, 0.95), shade);
            light += transmittance * alpha * smoke;
        }
        transmittance *= 1.0 - alpha;
        if(transmittance < 0.002)
            break;
    }
    fragColor = vec4(light + background * transmittance, 1);
}
