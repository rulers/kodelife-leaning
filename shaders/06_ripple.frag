#version 150
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    float speed = 1.2;
    float frequency = 28.0;
    float d = length(p);
    float wave = 0.5 + 0.5 * sin(d * frequency - time * speed);
    vec3 darkColor = vec3(0.03, 0.02, 0.16);
    vec3 lightColor = vec3(0.15, 0.85, 0.95);
    vec3 color = mix(darkColor, lightColor, wave);
    float vignette = 1.0 - smoothstep(0.25, 0.85, d);
    color *= 0.30 + 0.70 * vignette;
    fragColor = vec4(color, 1.0);
}
