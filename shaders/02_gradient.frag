#version 150
uniform vec2 resolution;
out vec4 fragColor;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 color = vec3(uv.x, uv.y, 0.25);
    fragColor = vec4(color, 1.0);
}
