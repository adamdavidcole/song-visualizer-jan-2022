precision mediump float;

uniform vec2 uResolution;
uniform vec2 uMouse;
uniform highp float uTime;
uniform sampler2D uAudioData;

#define PI 3.1415926538

void main(){
    vec2 st = gl_FragCoord.xy / uResolution;

    float soundValue0 = texture2D( uAudioData, vec2(0.0, 0.0 ) ).r;
    float soundValue1 = texture2D( uAudioData, vec2(0.2, 0.0 ) ).r;
    float soundValue2 = texture2D( uAudioData, vec2(0.4, 0.0 ) ).r;
    float avgSoundSample = ( soundValue0 + soundValue1 + soundValue2 ) / 3.0;

    float distanceToCenter = distance(st, vec2(0.5));

    vec3 color = vec3(distanceToCenter, distanceToCenter, avgSoundSample);
    gl_FragColor = vec4(color, 1.0);
}