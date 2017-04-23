/**
 * Created by j0sh on 7/19/16.
 */

var fractalShader      = require("shaders/fractal.glsl");
var vertexShaderString = "attribute vec2 position;\nvoid main() { gl_Position = vec4(position, 0.0, 1.0); }";

function compileShader(shaderSource, shaderType, context) {
    const shader = context.createShader(shaderType);

    context.shaderSource(shader, shaderSource);
    context.compileShader(shader);

    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
        throw "Shader compile failed with: " + context.getShaderInfoLog(shader);
    }

    return shader;
}
function getUniformLocation(program, name, context) {
    const uniformLocation = context.getUniformLocation(program, name);

    if (uniformLocation === -1) {
        throw 'Can not find uniform ' + name + '.';
    }

    return uniformLocation;
}
function getAttribLocation(program, name, context) {
    const attributeLocation = context.getAttribLocation(program, name);

    if (attributeLocation === -1) {
        throw 'Can not find attribute ' + name + '.';
    }

    return attributeLocation;
}
function setupWebglProgram(context, vertexShader, fragmentShader) {
    var program = context.createProgram();
    context.attachShader(program, vertexShader);
    context.attachShader(program, fragmentShader);
    context.linkProgram(program);
    context.useProgram(program);

    var vertexData       = new Float32Array([
        -1.0, 1.0, // top left
        -1.0, -1.0, // bottom left
        1.0, 1.0, // top right
        1.0, -1.0  // bottom right
    ]);
    var vertexDataBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, vertexDataBuffer);
    context.bufferData(context.ARRAY_BUFFER, vertexData, context.STATIC_DRAW);

    var positionHandle = getAttribLocation(program, 'position', context);
    context.enableVertexAttribArray(positionHandle);
    context.vertexAttribPointer(positionHandle,
        2, // position is a vec2
        context.FLOAT, // each component is a float
        context.FALSE, // don't normalize values
        2 * 4, // two 4 byte float components per vertex
        0 // offset into each span of vertex data
    );
    return program;
}

fractal_type = {
    NORMAL: "cadd(cmul(z,z), c)",
    INV_MU: "cadd(cmul(z,z), cdiv(complex(1.0,0.0), c))"
};

/**
 * setup our shader with our particular options
 * @param context html rendering context
 * @param vertexShader vertex shader belonging to this context
 * @param iterations number of iterations
 * @param fractal_type function name in the glsl code. Currently accepts "mandelbrot" or "julia"
 * @param type a field from fractal_type
 */
function reCompileShader(context, vertexShader, iterations, fractal_type, type) {
    var header = "#define NUMBER_OF_ITERATIONS " + iterations + "\n";
    // header += "#define FRAC_EXPRESSION cadd(cmul(z,z), c)\n";
    header += "#define FRAC_EXPRESSION " + type + "\n";
    if (fractal_type == "mandelbrot full") {
        header += "#define FRACTAL_FUNC mandelbrot\n";
        header += "#define SHOW_PREVIEW\n";
        header += "#define ZOOMABLE 0\n";
    } else if (fractal_type == "mandelbrot zoom") {
        header += "#define FRACTAL_FUNC mandelbrot\n";
        header += "#define ZOOMABLE 1\n";
    } else if (fractal_type == "julia") {
        header += "#define FRACTAL_FUNC julia\n";
        header += "#define ZOOMABLE 0\n";
    }
    var newFragmentShader = compileShader(
        header + fractalShader,
        context.FRAGMENT_SHADER,
        context
    );
    return setupWebglProgram(context, vertexShader, newFragmentShader);
}


var canvas_mandelbrot_full  = document.getElementById("canvas_mandelbrot_full");
var canvas_mandelbrot_zoom  = document.getElementById("canvas_mandelbrot_zoom");
var canvas_julia            = document.getElementById("canvas_julia");
var context_mandelbrot_full = canvas_mandelbrot_full.getContext("webgl");
var context_mandelbrot_zoom = canvas_mandelbrot_zoom.getContext("webgl");
var context_julia           = canvas_julia.getContext("webgl");

var vertexShader_mandelbrot_full = compileShader(vertexShaderString, context_julia.VERTEX_SHADER, context_mandelbrot_full);
var vertexShader_mandelbrot_zoom = compileShader(vertexShaderString, context_julia.VERTEX_SHADER, context_mandelbrot_zoom);
var vertexShader_julia           = compileShader(vertexShaderString, context_julia.VERTEX_SHADER, context_julia);

var program_julia;
var program_mandelbrot_full;
var program_mandelbrot_zoom;
function compileAllShaders(iterations, formula) {
    program_julia           = reCompileShader(context_julia, vertexShader_julia, iterations, "julia", formula);
    program_mandelbrot_full = reCompileShader(context_mandelbrot_full, vertexShader_mandelbrot_full, iterations, "mandelbrot full", formula);
    program_mandelbrot_zoom = reCompileShader(context_mandelbrot_zoom, vertexShader_mandelbrot_zoom, iterations, "mandelbrot zoom", formula);
}


// HTML elements
var n_res_x                = document.getElementById("res_x");
var n_res_y                = document.getElementById("res_y");
var n_iterations           = document.getElementById("iterations");
var n_check_julia_animated = document.getElementById("fractal_julia_animated");
var n_c_real               = document.getElementById("c_real");
var n_c_imag               = document.getElementById("c_imag");
var n_render_running       = document.getElementById("render_running");
var n_formula_normal       = document.getElementById("formula_normal");
var n_formula_inverse_mu   = document.getElementById("formula_inverse_mu");

// default config
var config = {
    width             : Number(n_res_x.value),
    height            : Number(n_res_y.value),
    formula           : fractal_type.NORMAL,
    iterations        : Number(n_iterations.value),
    c_real            : Number(n_c_real.value),
    c_imag            : Number(n_c_imag.value),
    canvas_width_full : Number(canvas_mandelbrot_full.width),
    canvas_height_full: Number(canvas_mandelbrot_full.height),
    canvas_width_zoom : Number(canvas_mandelbrot_zoom.width),
    canvas_height_zoom: Number(canvas_mandelbrot_zoom.height),
    frame_radius_full : 2,
    frame_radius_zoom : 0.125,
    fractal_type      : "julia",
    do_animation      : false
};
compileAllShaders(config.iterations, config.formula);

// parameters
n_res_x.onkeyup      = function () {
    canvas_julia.width           = Number(n_res_x.value);
    canvas_mandelbrot_full.width = Number(n_res_x.value);
    canvas_mandelbrot_zoom.width = Number(n_res_x.value);
    config.width                 = Number(n_res_x.value);
};
n_res_y.onkeyup      = function () {
    canvas_julia.height           = Number(n_res_y.value);
    canvas_mandelbrot_full.height = Number(n_res_y.value);
    canvas_mandelbrot_zoom.height = Number(n_res_y.value);
    config.height                 = Number(n_res_y.value);
};
n_iterations.onkeyup = function () {
    config.iterations = Number(n_iterations.value);
    compileAllShaders(config.iterations);
};
n_c_real.onkeyup     = function () { config.c_real = Number(n_c_real.value); };
n_c_imag.onkeyup     = function () { config.c_imag = Number(n_c_imag.value); };

n_formula_normal.onclick     = function () {
    config.formula = fractal_type.NORMAL;
    compileAllShaders(config.iterations, config.formula);
};
n_formula_inverse_mu.onclick = function () {
    config.formula = fractal_type.INV_MU;
    compileAllShaders(config.iterations, config.formula);
};

// canvas movement
var canvas_is_clicked_full = false;
var canvas_is_clicked_zoom = false;

function update_position_full(e) {
    // dragging on full canvas is absolute
    var center_real_offset = ((e.offsetX / config.canvas_width_full) * 2 - 1) * config.frame_radius_full;
    var center_imag_offset = ((e.offsetY / config.canvas_height_full) * 2 - 1) * config.frame_radius_full;
    config.c_real          = center_real_offset;
    config.c_imag          = center_imag_offset;
    n_c_real.value         = config.c_real;
    n_c_imag.value         = config.c_imag;
}

function update_position_zoom(e) {
    // dragging on zoomed canvas is relative
    var center_real_offset = (-(e.movementX / config.canvas_width_zoom) * 2) * config.frame_radius_zoom;
    var center_imag_offset = (-(e.movementY / config.canvas_height_zoom) * 2) * config.frame_radius_zoom;
    config.c_real += center_real_offset;
    config.c_imag += center_imag_offset;
    n_c_real.value         = config.c_real;
    n_c_imag.value         = config.c_imag;
}

canvas_mandelbrot_full.onmousedown = function (e) {
    e.preventDefault();
    canvas_is_clicked_full = true;
};
canvas_mandelbrot_zoom.onmousedown = function (e) {
    e.preventDefault();
    canvas_is_clicked_zoom = true;
};
window.onmouseup                   = function (e) {
    canvas_is_clicked_full = false;
    canvas_is_clicked_zoom = false;
};
window.onmousemove                 = function (e) {
    if (canvas_is_clicked_full) {
        update_position_full(e);
    }
    if (canvas_is_clicked_zoom) {
        update_position_zoom(e);
    }
};

// canvas zoom
canvas_mandelbrot_full.onwheel = function (e) {
    e.preventDefault();
    if (e.deltaY > 0) {
        // zoom out
        config.frame_radius_zoom *= 1.1;
    } else {
        // zoom in
        config.frame_radius_zoom /= 1.1;
    }
};
canvas_mandelbrot_zoom.onwheel = canvas_mandelbrot_full.onwheel;

function drawFrame() {

    // check if we're animated
    if (n_check_julia_animated.checked) {
        var time       = Date.now() * 1.2;
        config.c_real  = -0.79 + Math.sin(time / 2000) / 40;
        config.c_imag  = 0.2121 + Math.cos(time / 1330) / 40;
        n_c_real.value = config.c_real;
        n_c_imag.value = config.c_imag;
    }

    // update the size of the webgl part of the canvas
    [
        [context_julia, program_julia],
        [context_mandelbrot_full, program_mandelbrot_full],
        [context_mandelbrot_zoom, program_mandelbrot_zoom],
    ].forEach(function (v, i) {
        var context = v[0];
        var program = v[1];

        context.viewport(0, 0, config.width, config.height);

        var dataToSendToGPU = new Float32Array(8);
        dataToSendToGPU[0]  = config.width;
        dataToSendToGPU[1]  = config.height;
        dataToSendToGPU[2]  = Number(config.c_real);
        dataToSendToGPU[3]  = Number(config.c_imag);
        dataToSendToGPU[4]  = config.c_real - config.frame_radius_zoom;
        dataToSendToGPU[5]  = config.c_real + config.frame_radius_zoom;
        dataToSendToGPU[6]  = config.c_imag - config.frame_radius_zoom;
        dataToSendToGPU[7]  = config.c_imag + config.frame_radius_zoom;

        var dataPointerFloatArray = getUniformLocation(program, 'data', context);
        context.uniform1fv(dataPointerFloatArray, dataToSendToGPU);
        context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
    });
    if (n_render_running.checked) {
        requestAnimationFrame(drawFrame)
    }
}
requestAnimationFrame(drawFrame);
n_render_running.onclick = function () {
    // gotta start it again if it stopped
    if (n_render_running.checked) {
        requestAnimationFrame(drawFrame);
    }
};

// set canvases to one-third of the screen
var size                  = Math.floor(window.innerWidth / 3);
config.width              = size;
config.height             = size;
n_res_x.value             = size;
n_res_y.value             = size;
config.canvas_height_full = size;
config.canvas_width_full  = size;
config.canvas_height_zoom = size;
config.canvas_width_zoom  = size;
[canvas_julia, canvas_mandelbrot_full, canvas_mandelbrot_zoom].forEach(function (v, i) {
    v.width  = size;
    v.height = size;
});
