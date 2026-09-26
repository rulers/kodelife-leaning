#version 150
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

// 0: finished image, 1: noise, 2: shape, 3: density
const int VIEW = 0;

float hash21(vec2 p)
{
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float valueNoise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), u.x), u.y);
}

float fbm(vec2 p)
{
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotation = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; ++i)
    {
        value += amplitude * valueNoise(p);
        p = rotation * p * 2.03 + vec2(13.1, 7.7);
        amplitude *= 0.5;
    }
    return value / 0.96875;
}

void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    // A single drop repeats every 14 clock units, fading out before reset.
    float age = mod(max(time, 0.0), 14.0);
    float growth = 1.0 - exp(-age * 0.32);
    vec2 center = vec2(0.0, 0.25 - 0.035 * min(age, 9.0));
    vec2 q = p - center;
    vec2 flow = q * 3.2 + vec2(0.0, age * 0.10);
    vec2 warp = vec2(fbm(flow + vec2(2.3, 0.0)),
                     fbm(flow + vec2(0.0, 8.1))) - 0.5;
    vec2 curled = q + warp * (0.025 + 0.25 * growth);
    float radius = 0.025 + 0.32 * growth;
    float distanceToDrop = length(curled * vec2(1.0, 0.82));
    float envelope = 1.0 - smoothstep(radius * 0.65, radius, distanceToDrop);
    float textureValue = fbm(curled * 15.0 + warp * 3.0 + vec2(0.0, age * 0.14));
    float veins = pow(1.0 - abs(2.0 * textureValue - 1.0), 3.0);
    float fade = smoothstep(0.0, 0.7, age) * (1.0 - smoothstep(10.0, 14.0, age));
    float density = envelope * (0.22 + 1.3 * veins) * fade / (1.0 + age * 0.12);
    vec3 water = mix(vec3(0.78, 0.87, 0.90), vec3(0.96, 0.98, 0.97), gl_FragCoord.y / resolution.y);
    // RGB absorption: red is absorbed most, leaving blue/purple ink.
    vec3 absorption = vec3(3.8, 2.7, 0.65);
    vec3 color = water * exp(-absorption * density * 2.5);
    if (VIEW == 1) color = vec3(textureValue);
    if (VIEW == 2) color = vec3(envelope);
    if (VIEW == 3) color = vec3(density);
    fragColor = vec4(color, 1.0);
}
