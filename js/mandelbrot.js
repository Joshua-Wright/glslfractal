/**
 * Created by j0sh on 7/19/16.
 */

var fractalShader = require("shaders/fractal.glsl");
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

    var vertexData = new Float32Array([
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


var canvas = document.getElementById("main_canvas");
var context = canvas.getContext("webgl");
var vertexShader = compileShader(vertexShaderString, context.VERTEX_SHADER, context);

/**
 * setup our shader with our particular options
 * @param iterations number of iterations
 * @param fractal_type function name in the glsl code. Currently accepts "mandelbrot" or "julia"
 */
function reCompileShader(iterations, fractal_type) {
    var newFragmentShader = compileShader(
        fractalShader
            .replace("__NUMBER_OF_ITERATIONS", iterations)
            .replace("__FRACTAL_FUNC", fractal_type)
        ,
        context.FRAGMENT_SHADER,
        context
    );
    program = setupWebglProgram(context, vertexShader, newFragmentShader);
}
reCompileShader(1024, "julia");

// HTML elements
var n_res_x = document.getElementById("res_x");
var n_res_y = document.getElementById("res_y");
var n_iterations = document.getElementById("iterations");
var n_check_mandelbrot = document.getElementById("fractal_mandelbrot");
var n_check_julia = document.getElementById("fractal_julia");
var n_check_julia_animated = document.getElementById("fractal_julia_animated");
var n_c_real = document.getElementById("c_real");
var n_c_imag = document.getElementById("c_imag");
// default config
var config = {
    width: n_res_x.value,
    height: n_res_y.value,
    iterations: n_iterations.value,
    c_real: n_c_real.value,
    c_imag: n_c_imag.value,
    center_real: 0,
    center_imag: 0,
    frame_radius: 2,
    fractal_type: "julia",
};

// parameters
n_res_x.onkeyup = function () {
    canvas.width = Number(n_res_x.value);
    config.width = Number(n_res_x.value);
};
n_res_y.onkeyup = function () {
    canvas.height = Number(n_res_y.value);
    config.height = Number(n_res_y.value);
};
n_iterations.onkeyup = function () {
    config.iterations = Number(n_iterations.value);
    reCompileShader(config.iterations, config.fractal_type);
};
n_check_julia.onclick = function () {
    config.fractal_type = "julia";
    reCompileShader(config.iterations, config.fractal_type);
};
n_check_mandelbrot.onclick = function () {
    config.fractal_type = "mandelbrot";
    reCompileShader(config.iterations, config.fractal_type);
};
n_c_real.onkeyup = function () { config.c_real = Number(n_c_real.value); };
n_c_imag.onkeyup = function () { config.c_imag = Number(n_c_imag.value); };

// canvas movement
(function () {
    var canvas_is_clicked = false;
    window.onmousemove = function (e) {
        a = e;
        if (canvas_is_clicked) {
            // only prevent default if we're dragging, to preserve selecting text functionality
            e.preventDefault();
            // negate the offset because we're dragging it
            var center_real_offset = (-(e.movementX / canvas.width) * 2 ) * config.frame_radius;
            var center_imag_offset = (-(e.movementY / canvas.height) * 2 ) * config.frame_radius;
            config.center_real += center_real_offset;
            config.center_imag += center_imag_offset;
        }
    };
    canvas.onmousedown = function () {canvas_is_clicked = true;};
    window.onmouseup = function () {canvas_is_clicked = false;};
})();
// canvas zoom
canvas.onwheel = function (e) {
    e.preventDefault();
    if (e.deltaY > 0) {
        // zoom out
        config.frame_radius *= 1.1;
    } else {
        // zoom in
        config.frame_radius /= 1.1;
    }
};


function drawFrame() {
    // update the size of the webgl part of the canvas
    context.viewport(0, 0, canvas.width, canvas.height);

    var time = Date.now();

    var dataToSendToGPU = new Float32Array(9);
    dataToSendToGPU[0] = config.width;
    dataToSendToGPU[1] = config.height;
    if (n_check_julia_animated.checked) {
        dataToSendToGPU[2] = -0.795 + Math.sin(time / 2000) / 40;
        dataToSendToGPU[3] = 0.2321 + Math.cos(time / 1330) / 40;
    } else {
        dataToSendToGPU[2] = Number(config.c_real);
        dataToSendToGPU[3] = Number(config.c_imag);
    }
    dataToSendToGPU[4] = 8;
    dataToSendToGPU[5] = config.center_real - config.frame_radius;
    dataToSendToGPU[6] = config.center_real + config.frame_radius;
    dataToSendToGPU[7] = config.center_imag - config.frame_radius;
    dataToSendToGPU[8] = config.center_imag + config.frame_radius;

    var dataPointerFloatArray = getUniformLocation(program, 'data', context);
    context.uniform1fv(dataPointerFloatArray, dataToSendToGPU);
    context.drawArrays(context.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(drawFrame)
}
requestAnimationFrame(drawFrame);