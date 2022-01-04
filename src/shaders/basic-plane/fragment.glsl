precision mediump float;

uniform vec2 uResolution;
uniform vec2 uMouse;
uniform highp float uTime;
uniform float uBandCount;
uniform sampler2D uAudioData;
uniform sampler2D uRawFrequencyData;
uniform highp float uTotalPower;

#define PI 3.1415926538


// https://gist.github.com/companje/29408948f1e8be54dd5733a74ca49bb9
float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// https://gist.github.com/yiwenl/3f804e80d0930e34a0b33359259b556c
vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main(){
    vec2 st = gl_FragCoord.xy / uResolution;


    float soundValue0 = texture2D( uAudioData, vec2(0.0, 0.0 ) ).r;
    float soundValue1 = texture2D( uAudioData, vec2(0.2, 0.0 ) ).r;
    float soundValue2 = texture2D( uAudioData, vec2(0.4, 0.0 ) ).r;
    float avgSoundSample = ( soundValue0 + soundValue1 + soundValue2 ) / 3.0;

    float noiseVal = snoise(vec3(
        sin(st.x)/1.0,
        cos(st.y)/1.0,
        uTime/10.0+uTotalPower/10.0));

    float noiseVal2 = snoise(vec3(
        sin(st.x)*20.0,
        cos(st.y)*20.0,
        uTime+uTotalPower/10.0));

    float distanceToCenter = distance(st, vec2(0.5));
    distanceToCenter = distance(st, vec2(0.5)) + noiseVal;


    // rotation value
    float distanceToCenterRandomSeed = floor(distanceToCenter*500.0);
    vec2 vecFromCenter = vec2(0.5) - st;
    float randomVal = rand(vec2(distanceToCenterRandomSeed, distanceToCenterRandomSeed));
    float randomAnlge = map(randomVal, 0.0, 1.0, -PI, PI);
    float rotatationAngle = (-(uTime*randomVal) + randomAnlge)*10.0;
    vecFromCenter = rotate(vecFromCenter, rotatationAngle);
    float angle = atan(vecFromCenter.x, vecFromCenter.y);
    float angleIntensity = map(angle, -PI, PI, 0.2, 1.2);


    float totalPowerFactor = min(uTotalPower, 0.5);

    // distanceToCenter = distanceToCenter*distanceToCenter*totalPowerFactor;
    distanceToCenter /= 5.0;
    float soundValueR = texture2D( uRawFrequencyData, vec2(distanceToCenter, 0.0 ) ).r;

    // soundValueR = soundValueR * angleIntensity;
    // soundValueR = map(soundValueR, 0.0, 1.0, 0.0, 2.0);


    vec3 color = vec3(soundValueR);
    gl_FragColor = vec4(color, 1.0);
}