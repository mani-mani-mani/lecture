var gl;
var canvas;
var legacygl;
var drawutil;
var camera;
var controlPoints;
var selected = null;
var COMB; // 二項係数の計算をメモする
const MAX = 10; // 最大の次元数
var bezierFunc; // ベジェ曲線の関数

//#####################################################################
//#
//# 制御点のリストを管理するクラス
//#
//####################################################################
class ControlPoints {
    constructor() {
        this.list_ = [];
    }
    get(index) {
        return this.list_[index];
    }
    add(x, y, w) {
        this.list_.push([x, y, w]);
    }
    delete(index) {
        this.list_.splice(index, 1);
    }
    updateX(index, x) {
        this.list_[index][0] = x;
    }
    updateY(index, y) {
        this.list_[index][1] = y;
    }
    updateWeight(index, w) {
        this.list_[index][2] = w;
    }
    length() {
        return this.list_.length;
    }
    get list() {
        return this.list_;
    }
}

//#####################################################################
//#
//# ベジェ曲線に関する計算を行う
//#
//####################################################################

/**
 * 二項計算の前処理を行う
 * 
 * nCr = n-1Cr-1 + n-1Cr
 * 
 * COMB[n][r] = nCr
 */
function init_combination() {
    COMB = new Array(MAX + 1);
    for (let i = 0; i <= MAX; i++) {
        COMB[i] = new Array(MAX);
    }

    COMB[1][0] = 1;
    COMB[1][1] = 1;
    for (let i = 2; i <= MAX; i++) {
        for (let j = 0; j <= i; j++) {
            if (j == 0 || j == i) {
                COMB[i][j] = 1;
                continue;
            }
            COMB[i][j] = COMB[i - 1][j - 1] + COMB[i - 1][j];
        }
    }
}

/**
* 座標のアフィン変換を行う関数
*
* @param {vec2} point
* @param {Number} scalar
*/
function transform(point, scalar) {
    const x = point[0] * scalar;
    const y = point[1] * scalar;
    return [x, y];
}

/**
 * ベジェ曲線の係数を計算する
 * 
 * nCr * t^r * (1-t)^(n-r)
 * 
 * @param {Number} n 次元
 * @param {Number} r インデックス
 * @param {Number} t パラメータ
 * @param {Number} w 重み
 */
function bezier_coefficient(n, r, t) {
    // comination is already calculated in init_combination()
    return COMB[n][r] * Math.pow(t, r) * Math.pow((1 - t), n - r);
}

/**
 * n 次の有理ベジェ曲線を求める関数（バーンスタイン基底関数）
 * 
 * @param {Array} pointList 制御点のリスト
 * @param {t} t パラメータ
 */
function eval_bezier(pointList, t) {
    // 次元数は 制御点の数 - 1 になる
    var dimension = pointList.length - 1;

    // 有理ベジェ曲線の重みの合計の計算（正規化用）
    var weightSum = 0;
    for (let i = 0; i < pointList.length; i++) {
        var coefficient = bezier_coefficient(dimension, i, t);
        var weight_coefficient = pointList[i][2] * coefficient;

        weightSum += weight_coefficient;
    }

    // 計算した各項の点を格納するリスト
    var calcuratedPointList = [];
    
    // 有理ベジェ曲線の各項の計算
    for (let i = 0; i < pointList.length; i++) {
        var xy = [pointList[i][0], pointList[i][1]];
        var weight = pointList[i][2];

        // 正規化する
        var normalized_coefficient = (weight / weightSum) * bezier_coefficient(dimension, i, t);
        var p = transform(xy, normalized_coefficient);

        calcuratedPointList.push(p);
    }


    // 点の配列の (x,y) 座標を合計する関数
    const reducer = (accumulator, currentPoint) => {
        return [accumulator[0] + currentPoint[0], accumulator[1] + currentPoint[1]];
    }

    return calcuratedPointList.reduce(reducer, [0, 0]);
}


/**
 * ド・カステリョのアルゴリズム
 * 
 * 再帰的にベジェ曲線の点を求める
 * 
 * @param {Array} pointList 制御点 
 * @param {Number} t パラメータ 
 */
function eval_deCasteljau_bezier(pointList, t) {
    if (pointList.length == 1) {
        return pointList[0];
    }

    var nextPointList = [];
    for (let i = 0; i < pointList.length - 1; i++) {
        var b1 = transform(pointList[i], t);
        var b2 = transform(pointList[i + 1], 1 - t);
        nextPointList.push([b1[0] + b2[0], b1[1] + b2[1]]);
    }

    return eval_deCasteljau_bezier(nextPointList, t);
}

//#####################################################################
//#
//# 描画やユーザーとのインタラクティブな処理を行う
//#
//# https://utokyo-iscg-2020-assigment-m1-spline.glitch.me/ とほとんど同じです
//#
//# 制御点の扱いなどが少し異なります
//#
//####################################################################

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // projection & camera position
    mat4.perspective(legacygl.uniforms.projection.value, Math.PI / 6, canvas.aspect_ratio(), 0.1, 1000);
    var modelview = legacygl.uniforms.modelview;
    camera.lookAt(modelview.value);

    // xy grid
    gl.lineWidth(1);
    legacygl.color(0.5, 0.5, 0.5);
    drawutil.xygrid(100);

    // draw line segments composing curve
    legacygl.color(1, 0.6, 0.2);
    legacygl.begin(gl.LINE_STRIP);
    var numsteps = Number(document.getElementById("input_numsteps").value);
    for (var i = 0; i <= numsteps; ++i) {
        var t = i / numsteps;
            // ベジェ曲線の点を計算する
            legacygl.vertex2(bezierFunc(controlPoints.list, t));
    }
    legacygl.end();
    // draw sample points
    if (document.getElementById("input_show_samplepoints").checked) {
        legacygl.begin(gl.POINTS);
        for (var i = 0; i <= numsteps; ++i) {
            var t = i / numsteps;
            // ベジェ曲線の点を計算する
            legacygl.vertex2(bezierFunc(controlPoints.list, t));
        }
        legacygl.end();
    }
    // draw control points
    if (document.getElementById("input_show_controlpoints").checked) {
        legacygl.color(0.2, 0.5, 1);
        legacygl.begin(gl.LINE_STRIP);
        for (let i = 0; i < controlPoints.length(); i++) {
            const p = controlPoints.get(i);
            legacygl.vertex2(p);
        }
        legacygl.end();
        legacygl.begin(gl.POINTS);
        for (let i = 0; i < controlPoints.length(); i++) {
            const p = controlPoints.get(i);
            legacygl.vertex2(p);
        }
        legacygl.end();
    }

    // 制御点のリストを更新する
    updateControlListTable();
};
function init() {

    // 二項計算の前処理と
    init_combination();

    // 制御点を扱うオブジェクト
    controlPoints = new ControlPoints();

    // デフォルトでは多項式でベジェ曲線の計算をする
    bezierFunc = eval_bezier;

    // OpenGL context
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("experimental-webgl");
    if (!gl)
        alert("Could not initialise WebGL, sorry :-(");
    var vertex_shader_src = "\
        attribute vec3 a_vertex;\
        attribute vec3 a_color;\
        varying vec3 v_color;\
        uniform mat4 u_modelview;\
        uniform mat4 u_projection;\
        void main(void) {\
            gl_Position = u_projection * u_modelview * vec4(a_vertex, 1.0);\
            v_color = a_color;\
            gl_PointSize = 5.0;\
        }\
        ";
    var fragment_shader_src = "\
        precision mediump float;\
        varying vec3 v_color;\
        void main(void) {\
            gl_FragColor = vec4(v_color, 1.0);\
        }\
        ";
    legacygl = get_legacygl(gl, vertex_shader_src, fragment_shader_src);
    legacygl.add_uniform("modelview", "Matrix4f");
    legacygl.add_uniform("projection", "Matrix4f");
    legacygl.add_vertex_attribute("color", 3);
    legacygl.vertex2 = function (p) {
        this.vertex(p[0], p[1], 0);
    };
    drawutil = get_drawutil(gl, legacygl);
    camera = get_camera(canvas.width);
    camera.eye = [0, 0, 7];

    // 制御点の初期設定
    controlPoints.add(-1.5, 0.0, 1.0);
    controlPoints.add(-1.0, 1.0, 1.0);
    controlPoints.add(1.0, 1.0, 1.0);
    controlPoints.add(1.5, 0.0, 1.0);

    // event handlers
    canvas.onmousedown = function (evt) {
        var mouse_win = this.get_mousepos(evt);
        if (evt.altKey) {
            camera.start_moving(mouse_win, evt.shiftKey ? "zoom" : "pan");
            return;
        }
        // pick nearest object
        var viewport = [0, 0, canvas.width, canvas.height];
        var dist_min = 10000000;
        for (var i = 0; i < controlPoints.length(); ++i) {
            var object_win = glu.project([controlPoints.get(i)[0], controlPoints.get(i)[1], 0],
                legacygl.uniforms.modelview.value,
                legacygl.uniforms.projection.value,
                viewport);
            var dist = vec2.dist(mouse_win, object_win);
            if (dist < dist_min) {
                dist_min = dist;
                selected = i;
            }
        }
    };
    canvas.onmousemove = function (evt) {
        var mouse_win = this.get_mousepos(evt);
        if (camera.is_moving()) {
            camera.move(mouse_win);
            draw();
            return;
        }
        if (selected != null) {
            var viewport = [0, 0, canvas.width, canvas.height];
            mouse_win.push(1);
            var mouse_obj = glu.unproject(mouse_win,
                legacygl.uniforms.modelview.value,
                legacygl.uniforms.projection.value,
                viewport);
            // just reuse the same code as the 3D case
            var plane_origin = [0, 0, 0];
            var plane_normal = [0, 0, 1];
            var eye_to_mouse = vec3.sub([], mouse_obj, camera.eye);
            var eye_to_origin = vec3.sub([], plane_origin, camera.eye);
            var s1 = vec3.dot(eye_to_mouse, plane_normal);
            var s2 = vec3.dot(eye_to_origin, plane_normal);
            var eye_to_intersection = vec3.scale([], eye_to_mouse, s2 / s1);

            var x = camera.eye[0] + eye_to_intersection[0];
            var y = camera.eye[1] + eye_to_intersection[1];
            var z = camera.eye[2] + eye_to_intersection[2];
            
            // 制御点を移動する
            controlPoints.updateX(selected, x);
            controlPoints.updateY(selected, y);
            draw();
        }
    }
    document.onmouseup = function (evt) {
        if (camera.is_moving()) {
            camera.finish_moving();
            return;
        }
        selected = null;
    };
    // init OpenGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1);
};


//#####################################################################
//#
//# 追加した機能
//#
//# 1. 制御点の更新や表示、削除、追加ができるようにする
//#
//# 2. ベジェ曲線の計算方法を変更する
//#
//####################################################################


/**
 * 1. 制御点のリストを表示する。ユーザーの入力に対して制御点を変えられるようにする。
 */
function updateControlListTable() {
    // show current control points list
    const table = document.getElementById("controlPointsList");
    table.innerHTML = "";

    // 見出し
    var tr = document.createElement("tr");
    var title_p = document.createElement("th");
    var title_x = document.createElement("th");
    var title_y = document.createElement("th");
    var title_w = document.createElement("th");
    title_p.innerText = "制御点";
    title_x.innerText = "X座標";
    title_y.innerText = "Y座標";
    title_w.innerText = "重み";
    tr.appendChild(title_p);
    tr.appendChild(title_x);
    tr.appendChild(title_y);
    table.appendChild(tr);

    // 制御点のリストを表示する
    for (let i = 0; i < controlPoints.length(); i++) {
        const p = controlPoints.get(i);

        var tr = document.createElement("tr");
        var title = document.createElement("td");
        var body_x = document.createElement("td");
        var body_y = document.createElement("td");
        var body_w = document.createElement("td");

        var inputX = document.createElement("input");
        var inputY = document.createElement("input");
        var inputWeight = document.createElement("input");
        var button = document.createElement("button");

        title.innerText = "p" + i;
        inputX.value = p[0];
        inputY.value = p[1];
        inputWeight.value = p[2];
        inputX.dataset.pointXId = i;
        inputY.dataset.pointYId = i;
        inputWeight.dataset.pointWId = i;

        inputX.onchange = value_changed;
        inputY.onchange = value_changed;
        inputWeight.onchange = value_changed;

        button.dataset.index = i;
        button.innerText = "-";
        button.onclick = value_delete;

        body_x.appendChild(inputX);
        body_y.appendChild(inputY);
        body_w.appendChild(inputWeight);
        tr.appendChild(title);
        tr.appendChild(body_x);
        tr.appendChild(body_y);
        tr.appendChild(body_w);
        tr.appendChild(button);
        table.appendChild(tr);
    }


    // 制御点を新しく追加する入力欄
    var tr = document.createElement("tr");
    var title = document.createElement("td");
    var body_x = document.createElement("td");
    var body_y = document.createElement("td");
    var inputX = document.createElement("input");
    var inputY = document.createElement("input");
    var button = document.createElement("button");

    tr.id = "addNewControlPoint";
    title.innerText = "新しい制御点"
    title.style = "color: red";
    inputX.placeholder = "X座標";
    inputY.placeholder = "Y座標";
    inputX.id = "new-point-x";
    inputY.id = "new-point-y";
    button.innerText = "+";
    button.onclick = value_insert;

    body_x.appendChild(inputX);
    body_y.appendChild(inputY);
    tr.appendChild(title);
    tr.appendChild(body_x);
    tr.appendChild(body_y);
    tr.appendChild(button);
    table.appendChild(tr);
}

// ユーザーの入力で制御点の値を変更する
function value_changed(e) {
    var xid = e.srcElement.dataset.pointXId;
    var yid = e.srcElement.dataset.pointYId;
    var wid = e.srcElement.dataset.pointWId;
    if (xid) {
        controlPoints.updateX(xid, e.srcElement.value);
    }
    if (yid) {
        controlPoints.updateY(yid, e.srcElement.value);
    }
    if (wid) {
        controlPoints.updateWeight(wid, e.srcElement.value);
    }
    draw();
}

// ユーザーの入力で制御点を削除する
function value_delete(e) {
    var index = e.srcElement.dataset.index;

    controlPoints.delete(index);
    draw();
}

// ユーザーの入力で制御点を追加する
function value_insert() {
    var x = document.getElementById("new-point-x").value;
    var y = document.getElementById("new-point-y").value;
    var w = 1.0;

    if (x && y) {
        controlPoints.add(x, y, w);
    }
    draw();
}


/**
 * 2. ベジェ曲線の関数を変える
 */
function updateBezierFunc(value) {
    if (value == 0) {
        bezierFunc = eval_bezier;
    } else {
        bezierFunc = eval_deCasteljau_bezier;
    }
    draw();
}