precision mediump float;

uniform vec2 uResolution;
uniform vec2 uMouse;
uniform highp float uTime;
uniform float uBandCount;
uniform sampler2D uAudioData;
uniform sampler2D uRawFrequencyData;
uniform highp float uTotalPower;

#define PI 3.1415926538

void main(){
    vec2 st = gl_FragCoord.xy / uResolution;

    float soundValue0 = texture2D( uAudioData, vec2(0.0, 0.0 ) ).r;
    float soundValue1 = texture2D( uAudioData, vec2(0.2, 0.0 ) ).r;
    float soundValue2 = texture2D( uAudioData, vec2(0.4, 0.0 ) ).r;
    float avgSoundSample = ( soundValue0 + soundValue1 + soundValue2 ) / 3.0;


    float distanceToCenter = distance(st, vec2(0.5));
    float totalPowerFactor = min(uTotalPower, 0.5);

    // distanceToCenter = distanceToCenter*distanceToCenter*totalPowerFactor;
    distanceToCenter /= 5.0;
    float soundValueR = texture2D( uRawFrequencyData, vec2(distanceToCenter, 0.0 ) ).r;



    vec3 color = vec3(soundValueR, soundValueR, soundValueR);
    gl_FragColor = vec4(color, 1.0);
}