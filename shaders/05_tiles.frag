#version 150
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    float tiles = 5.0;
    vec2 cell = fract(p * tiles) - 0.5;
    float radius = 0.25 + 0.07 * sin(time * 2.0);
    float edge = 2.0 * tiles / resolution.y;
    float mask = 1.0 - smoothstep(radius - edge, radius + edge, length(cell));
    vec3 color = mix(vec3(0.04, 0.03, 0.10), vec3(0.95, 0.65, 0.20), mask);
    fragColor = vec4(color, 1.0);
}
