void main() {
    if(reset > 0.5) {
        fragColor = vec4(0);
        return;
    }
    ivec3 c = cell();
    float sum = 0.0;
    float count = 0.0;
    if(c.x > 0) {
        sum += fetchCell(pressureTex, c - EX).r;
        count += 1.0;
    }
    if(c.x < N - 1) {
        sum += fetchCell(pressureTex, c + EX).r;
        count += 1.0;
    }
    if(c.y > 0) {
        sum += fetchCell(pressureTex, c - EY).r;
        count += 1.0;
    }
    if(c.y < N - 1) {
        sum += fetchCell(pressureTex, c + EY).r;
        count += 1.0;
    }
    if(c.z > 0) {
        sum += fetchCell(pressureTex, c - EZ).r;
        count += 1.0;
    }
    if(c.z < N - 1) {
        sum += fetchCell(pressureTex, c + EZ).r;
        count += 1.0;
    }
    float candidate = (sum - fetchCell(divergenceTex, c).r) / count;
    // Weighted Jacobi damps the checkerboard mode of the Neumann problem.
    float pressure = mix(fetchCell(pressureTex, c).r, candidate, 0.8);
    fragColor = vec4(pressure, 0, 0, 1);
}
