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
    float t = time * 0.35;
    float h = p.y + 0.43;
    float height = clamp(h, 0.0, 1.0);
    float width = 0.025 + 0.19 * height;
    float drift = 0.045 * sin(height * 7.0 - t);
    vec2 flow = vec2(p.x * 3.5, h * 2.8 - t);
    vec2 warp = vec2(fbm(flow + vec2(0.0, 3.4)),
                     fbm(flow + vec2(5.2, 0.0))) - 0.5;
    float x = p.x - drift + warp.x * 0.24 * height;
    float envelope = exp(-pow(x / width, 2.0) * 1.4);
    envelope *= smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.50, 0.95, h));
    float textureValue = fbm(flow * 2.0 + warp * 2.8);
    float density = envelope * smoothstep(0.18, 0.80, textureValue);
    float opacity = 1.0 - exp(-density * 3.2);
    vec3 background = vec3(0.018, 0.026, 0.045);
    vec3 smokeColor = mix(vec3(0.28, 0.34, 0.43), vec3(0.82, 0.87, 0.91), textureValue);
    vec3 color = mix(background, smokeColor, opacity);
    if (VIEW == 1) color = vec3(textureValue);
    if (VIEW == 2) color = vec3(envelope);
    if (VIEW == 3) color = vec3(density);
    fragColor = vec4(color, 1.0);
}
