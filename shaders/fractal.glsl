// fractal.glsl

#ifndef NUMBER_OF_ITERATIONS
#define NUMBER_OF_ITERATIONS 1024
#endif

#ifndef FRACTAL_FUNC
#define FRACTAL_FUNC mandelbrot
#endif

#ifndef ZOOMABLE
#define ZOOMABLE 0
#endif

#ifndef CROSSHAIR_WIDTH
#define CROSSHAIR_WIDTH 0.002
#endif

precision highp float;

/*
width.
height

c_real
c_imag

x min
x max
y min
y max
*/
uniform float data[8];

float WIDTH            = data[0];
float HEIGHT         = data[1];

float C_REAL         = data[2];
float C_IMAG         = data[3];

float X_MIN            = data[4];
float X_MAX            = data[5];
float Y_MIN            = data[6];
float Y_MAX            = data[7];

const int MAX_ITERATIONS = NUMBER_OF_ITERATIONS;

vec2 iResolution = vec2(WIDTH, HEIGHT);

struct complex {
    float real;
    float imaginary;
};

float fractal(complex c, complex z) {
    for (int iteration = 0; iteration < MAX_ITERATIONS; iteration++) {

        // z <- z^2 + c
        float real = z.real * z.real - z.imaginary * z.imaginary + c.real;
        float imaginary = 2.0 * z.real * z.imaginary + c.imaginary;

        z.real = real;
        z.imaginary = imaginary;

        if (z.real * z.real + z.imaginary * z.imaginary > 4.0) {
            float sl = float(iteration) - log2(log2(z.real * z.real + z.imaginary * z.imaginary)) + 4.0;
            return sl;
        }
    }

    return 0.0;
}

float mandelbrot(vec2 coordinate, vec2 offset) {
    complex c = complex(coordinate.x, coordinate.y);
    complex z = complex(0.0, 0.0);

    return fractal(c, z);
}

float julia(vec2 coordinate, vec2 offset) {
    complex c = complex(offset.x, offset.y);
    complex z = complex(coordinate.x, coordinate.y);

    return fractal(c, z);
}

vec2 fragCoordToXY(vec4 fragCoord) {
    vec2 relativePosition = fragCoord.xy / iResolution.xy;
#if ZOOMABLE
    float aspectRatio = iResolution.x / HEIGHT;

    vec2 center = vec2((X_MAX + X_MIN) / 2.0, (Y_MAX + Y_MIN) / 2.0);

    vec2 cartesianPosition = (relativePosition - 0.5) * (X_MAX - X_MIN);
    cartesianPosition.x += center.x;
    cartesianPosition.y -= center.y;
    cartesianPosition.x *= aspectRatio;
    return cartesianPosition;
#else
    return relativePosition * 4.0 - 2.0;
#endif
}

void main() {
    vec2 coordinate = fragCoordToXY(gl_FragCoord);

    float fractalValue = FRACTAL_FUNC(coordinate, vec2(C_REAL, C_IMAG));

    vec3 color = 0.5 + 0.5*cos( 3.0 + fractalValue*0.15 + vec3(0.0,0.6,1.0));

#ifdef SHOW_PREVIEW
    // show preview of the zoomable window
    if (coordinate.x >= X_MIN && coordinate.x <= X_MAX &&
        coordinate.y <= -Y_MIN && coordinate.y >= -Y_MAX) {
        color = mix(color, vec3(0,0,0), 0.2);
    }
#endif

#if ZOOMABLE
    vec2 relativePosition = gl_FragCoord.xy / iResolution.xy -  0.5;
    if (((abs(relativePosition.x) < CROSSHAIR_WIDTH) ||(abs(relativePosition.y) < CROSSHAIR_WIDTH))
        && dot(relativePosition, relativePosition) < 0.0025) {
        color = mix(color, vec3(0,0,0), 0.4);
    }
#endif

    gl_FragColor = vec4(color, 1.0);
}
