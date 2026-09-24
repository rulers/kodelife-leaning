#version 150
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    vec2 center = vec2(0.25 * sin(time), 0.10 * cos(time));
    float radius = 0.15 + 0.04 * sin(time * 2.0);
    float d = length(p - center);
    float edge = 2.0 / resolution.y;
    float mask = 1.0 - smoothstep(radius - edge, radius + edge, d);
    vec3 color = mix(vec3(0.02, 0.03, 0.08), vec3(1.0, 0.35, 0.55), mask);
    fragColor = vec4(color, 1.0);
}
