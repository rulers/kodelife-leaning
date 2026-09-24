#version 150
out vec4 fragColor;

void main()
{
    vec3 color = vec3(0.10, 0.55, 0.90);
    fragColor = vec4(color, 1.0);
}
