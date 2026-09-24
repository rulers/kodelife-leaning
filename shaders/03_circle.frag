#version 150
uniform vec2 resolution;
out vec4 fragColor;

void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    float d = length(p);
    float radius = 0.25;
    float edge = 2.0 / resolution.y;
    float mask = 1.0 - smoothstep(radius - edge, radius + edge, d);
    vec3 background = vec3(0.02, 0.03, 0.08);
    vec3 ink = vec3(0.15, 0.85, 0.75);
    fragColor = vec4(mix(background, ink, mask), 1.0);
}
