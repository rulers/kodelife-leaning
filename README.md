# KodeLife シェーダー入門

色・座標・形・時間を6つのレッスンで学び、動く波紋を作ります。初心者向け、所要時間は約90〜120分です。

## 応用チュートリアル

| 教材 | 作るもの | コード・デモ |
| --- | --- | --- |
| [7. 立ちのぼる煙](tutorials/07_smoke.md) | ノイズで揺れる2Dの煙 | [GLSL](shaders/07_smoke.frag) |
| [8. 水中に広がるインク](tutorials/08_ink_in_water.md) | 一滴が沈んで広がる2D表現 | [GLSL](shaders/08_ink_in_water.frag) |
| [9. 3D流体](tutorials/09_fluid3d.md) | 格子で計算するインクと煙 | [デモ](examples/fluid3d/preview.html)・[GLSL](fluid3d/shaders) |
| [10. 雨粒と曇りガラス](tutorials/10_heartfelt.md) | BigWIngsのHeartfeltを使った雨の表現 | [GLSL](third_party/heartfelt/heartfelt_kodelife.frag) |
| [11. 墨の庭](tutorials/11_interactive_ink.md) | マウスで描くインク。色替え・にじみ調整・PNG保存 | [デモ](examples/inkplay/preview.html)・[GLSL](inkplay/shaders) |

## サンプル一覧

```text
examples/
├── fluid3d -> ../fluid3d
└── inkplay -> ../inkplay
```

サンプルの本体は `examples/` からアクセスできます。各デモはHTMLをダウンロードしてブラウザーで開きます。GitHubではファイルの **Download raw file** を選んでください。3D流体と墨の庭のKodeLife設定は、各チュートリアルを参照してください。

## JavaScriptの検査と整形

デモの手書きJavaScriptには ESLint と Prettier を使います。Node.js を用意したあと、リポジトリのルートで次を実行してください。

```sh
npm install
npm run lint
npm run format
```

整形結果を変更せずに確認する場合は `npm run format:check` を使います。生成された `shaders.js` と、シェーダーを埋め込んだ `preview.html` は検査・整形の対象外です。

## この教材の使い方

入門6レッスンは、コードの全文をKodeLifeの **Fragment** タブへ貼り付けて実行します。同じコードは `shaders/` に保存しています。`.frag` はソースコード、`.kode` は描画設定を含むプロジェクトファイルです。

動かす → 数字を1つ変える → 結果を観察する → 解説を読む、の順に進めましょう。

## 0. 準備する（10〜15分）

### 対象環境を合わせる

必要な環境は **OpenGL 3.2以上／GLSL 150** です。

1. 未インストールなら[公式サイト](https://hexler.net/kodelife)からKodeLifeを入手して起動します。
2. Preferences → General → **Graphics API** でOpenGLを選びます。Projectの **Renderer** も確認してください。
3. 新規プロジェクトか、全画面を描画するサンプルを開きます。既存作品を使う場合は別名保存してください。
4. **1つのRender Passで全画面を描画**します。Vertexとメッシュの設定を保ち、Fragmentを編集します。
5. ProjectとPassの描画解像度を1280×720にします。
6. Fragmentへレッスン1を貼り付けます。画面全体が青くなれば準備完了です。

公式マニュアル：[Preferences / General](https://hexler.net/kodelife/manual/preferences-general)、[Project](https://hexler.net/kodelife/manual/kontrolpanel-project)。

### レッスン2以降の入力を接続する

**Kontrol Panel** でFragmentのShader Stageを選び、Parametersに次の2つを設定します。同名のパラメーターがある場合は、その設定を確認してください。

| GLSL側の名前 | KodeLifeで選ぶ組み込みパラメーター | GLSLの型 | 用途 |
| --- | --- | --- | --- |
| `resolution` | Frame → Resolution | `vec2` | 出力の幅・高さ |
| `time` | Clock | `float` | アニメーション用の時間 |

名前は大文字・小文字も含めてコードと一致させます。`time`の入力には **Clock** を選び、前進・Speed 1・Loop無効に設定します。

コードの `uniform` 宣言とアプリのパラメーターを接続すると、解像度と時間がシェーダーに渡ります。

公式マニュアル：[Parameters / Built-In](https://hexler.net/kodelife/manual/parameters-built-in)、[Kontrol Panel](https://hexler.net/kodelife/manual/kontrolpanel)。

### 画面で見る場所

- **Fragment**：今回編集する色の計算式。
- **描画プレビュー**：実際にできた絵を確認する場所。
- **Output panel**：コンパイルの警告やエラーを確認する場所。
- **Kontrol Panel**：解像度や入力パラメーターを設定する場所。

エディターと出力の説明は[公式Editorマニュアル](https://hexler.net/kodelife/manual/interface-editor)を参照してください。

## 1. 画面を好きな色にする

**10分：画面全体を青く塗ります。**

フラグメントシェーダーの `main()` で、画面上の各地点の色を計算します。

`vec3` は3つの数のまとまりです。ここでは赤・緑・青（RGB）を0.0〜1.0で指定します。`vec4(color, 1.0)` でアルファ値1.0を加え、`fragColor` に出力します。

**やってみる：** `vec3(1.0, 0.3, 0.1)` に変更して、オレンジにしましょう。次に数字を1つずつ変えてください。

**理解チェック：** 黒は `vec3(0.0)`、白は `vec3(1.0)`。同じ値を3成分に入れる省略表記です。

### 貼り付けるコード

```glsl
#version 150
out vec4 fragColor;

void main()
{
    vec3 color = vec3(0.10, 0.55, 0.90);
    fragColor = vec4(color, 1.0);
}
```

## 2. 座標を色に変える

**15分：右ほど赤く、上ほど緑になるグラデーションを作ります。**

`uniform` はアプリから受け取る値の宣言です。`resolution` は描画領域の幅と高さを持つ `vec2`（2成分）です。

`gl_FragCoord.xy` は現在のピクセル座標です。幅と高さで割り、画面内の位置をほぼ0〜1で表した値を `uv` に入れます。

OpenGLの通常のフラグメント座標では左下が原点です。ピクセルの中心を扱うため、端の値は厳密な0や1にはなりません。

**やってみる：** 色を `vec3(uv.x)` にすると左右の白黒グラデーション、`vec3(uv.y)` にすると上下になります。

**理解チェック：** 解像度で割るのは、画面サイズが変わっても位置を同じ尺度で扱うためです。

### 貼り付けるコード

```glsl
#version 150
uniform vec2 resolution;
out vec4 fragColor;

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 color = vec3(uv.x, uv.y, 0.25);
    fragColor = vec4(color, 1.0);
}
```

## 3. 中央に円を描く

**20分：暗い背景の中央にミント色の円を描きます。**

画面サイズの半分を引いて中心を原点にし、xとyを高さ `resolution.y` で割ります。縦横の尺度がそろい、横長の画面でも円を描けます。上端は約0.5、下端は約−0.5です。

`float` は小数を扱う型。`length(p)` は原点からの距離です。円は「中心からの距離が半径より小さい場所」として作れます。半径0.25は画面の高さの25%で、直径は高さの50%です。

`smoothstep(a, b, d)` は、dがa以下なら0、b以上なら1、その間は滑らかに変化する関数です。`1.0 - ...` で反転して円の内側を1、外側を0にします。この白黒の判定値をマスクと呼びます。aはbより小さくします。

`mix(background, ink, mask)` は、マスクが0なら背景色、1なら円の色、中間なら混ざった色を返します。境界に幅を持たせてギザギザを和らげています。

**やってみる：** 半径を0.1、0.35に変える。`length(p - vec2(0.2, 0.0))` にして円を右へ移動する。

**理解チェック：** 円を左右に伸ばさないために、xもyも同じ値で割っています。

### 貼り付けるコード

```glsl
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
```

## 4. 円を動かす

**15分：ピンクの円を楕円軌道で動かし、伸縮させます。**

`time` は準備で接続した **Clock** の値です。

`sin` と `cos` は−1〜1の間を滑らかに往復します。引数はラジアンで、約6.283進むと1周します。Clockが毎秒1進む設定なら `sin(time)` の周期は約6.28秒です。

`0.25 * sin(time)` の0.25が移動の幅、`sin(time * 2.0)` の2.0が速さを調整します。半径は0.15を中心に±0.04変わるので、0.11〜0.19を往復します。

**やってみる：** 中心の式の `sin(time)` と `cos(time)` を両方 `sin(time * 0.5)`、`cos(time * 0.5)` にして軌道の動きを半分の速さにする。

**理解チェック：** `sin(time) * 2.0` は振れ幅を2倍、`sin(time * 2.0)` は速さを2倍にします。

### 貼り付けるコード

```glsl
#version 150
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    vec2 center = vec2(0.25 * sin(time), 0.10 * cos(time));
    float radius = 0.15 + 0.04 * sin(time * 2.0);
    float d = length(p - center);
    float edge = 2.0 / resolution.y;
    float mask = 1.0 - smoothstep(radius - edge, radius + edge, d);
    vec3 color = mix(vec3(0.02, 0.03, 0.08), vec3(1.0, 0.35, 0.55), mask);
    fragColor = vec4(color, 1.0);
}
```

## 5. 模様を繰り返す

**15分：伸縮する黄色い水玉を並べます。**

`fract(x)` は `x - floor(x)`、つまり小数部分を返します。例えば1.2は0.2、2.2も0.2です。負の値でも結果は0以上1未満になります。

`p * tiles` を `fract` に入れると、座標が何度も0〜1へ折り返されます。0.5を引いて各マスの中心を原点にすると、前のレッスンの円の式を各マスで再利用できます。

`tiles = 5.0` は画面の高さ全体で5周期という意味です。横方向の数は画面の縦横比によって変わり、端で円が切れる場合もあります。`edge` にもtilesを掛け、座標の拡大に合わせています。

**やってみる：** tilesを3.0、8.0に変更する。`fract(p * tiles + vec2(time * 0.2, 0.0))` にすると模様が横へ流れます。

**理解チェック：** 座標を繰り返すと、同じ式から複数の円を描けます。

### 貼り付けるコード

```glsl
#version 150
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    float tiles = 5.0;
    vec2 cell = fract(p * tiles) - 0.5;
    float radius = 0.25 + 0.07 * sin(time * 2.0);
    float edge = 2.0 * tiles / resolution.y;
    float mask = 1.0 - smoothstep(radius - edge, radius + edge, length(cell));
    vec3 color = mix(vec3(0.04, 0.03, 0.10), vec3(0.95, 0.65, 0.20), mask);
    fragColor = vec4(color, 1.0);
}
```

## 6. 作品：色が流れる波紋

**15分：青紫とシアンの波紋を外側へ流します。**

`d` は中心からの距離です。同じ距離の場所に同じ色を出すので同心円になります。`sin(d * frequency - time * speed)` で距離と時間の両方を色に反映します。

`sin` の−1〜1を `0.5 + 0.5 * ...` で0〜1へ変換すると、そのまま2色を混ぜる割合に使えます。`frequency` を大きくすると波が細かくなり、`speed` を大きくすると色の変化が速くなります。

最後の2行で外側を少し暗くしています。`color *= ...` は `color = color * ...` の省略です。

**やってみる：** frequencyを14.0、50.0に変える。speedを−1.2にすると波の進む方向が逆になります。2色を好みの組み合わせにしてください。

**完成課題：** 「落ち着いた波」「鮮やかな波」「逆向きの波」の3作品を別名保存し、変えた値をメモする。

**理解チェック：** 模様の形は座標、動きは時間、見た目は色の組み合わせで変えられます。

### 貼り付けるコード

```glsl
#version 150
uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

void main()
{
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    float speed = 1.2;
    float frequency = 28.0;
    float d = length(p);
    float wave = 0.5 + 0.5 * sin(d * frequency - time * speed);
    vec3 darkColor = vec3(0.03, 0.02, 0.16);
    vec3 lightColor = vec3(0.15, 0.85, 0.95);
    vec3 color = mix(darkColor, lightColor, wave);
    float vignette = 1.0 - smoothstep(0.25, 0.85, d);
    color *= 0.30 + 0.70 * vignette;
    fragColor = vec4(color, 1.0);
}
```

## 困ったときの確認表

| 症状 | 確認・対処 |
| --- | --- |
| `#version` や `out` でエラー | RendererがOpenGLで、GLSL 150を扱えるか確認。Metalや古いGLSLではこのまま使えません。 |
| 黒いまま | レッスン1へ戻る。1も出なければPass・ProjectのEnabledや全画面描画の土台を確認。1は出るならresolutionの接続を確認。 |
| エラー後に絵が変わらない | 古い描画結果が残る場合があります。Output panelで先頭のエラーから直します。 |
| `undeclared identifier` | 変数の宣言、綴り、コピー漏れを確認します。 |
| `syntax error` | 行末の `;`、括弧 `()`、波括弧 `{}` を確認。エラー表示の1行前も見ます。 |
| 型が合わないエラー | `float`、`vec2`、`vec3`、`vec4` の成分数を確認。小数には `1.0` のような表記を使います。 |
| 円が伸びる・中心がずれる | コードが `.y` で割っているか、Passの描画サイズとresolutionが一致するか確認。 |
| 動かない | timeの入力がClockか、停止・Speed 0になっていないか、Projectが更新中か確認。 |
| 動作が重い | まず解像度を640×360へ下げ、不要なPassを無効化して確認。 |

## 学んだことを定着させる

1. 円を左上へ移動し、色をオレンジにする。
2. 円の位置を固定して、半径だけ変化させる。
3. 水玉の数を増やし、ゆっくり横に流す。
4. 波紋を内側へ流し、好みの2色へ変える。

答えのヒント：1は `p - vec2(-0.2, 0.2)`、2はcenterを `vec2(0.0)`、3はtilesとfractの入力、4はspeedの符号と2つの色です。

各作品をプロジェクトとして別名保存すると、パラメーターや描画設定も残せます。「変更した値／予想／結果」をメモして比較しましょう。

次は冒頭の応用チュートリアルから、作りたい表現を選んでください。

## 動作確認

入門6レッスンの操作手順は公式マニュアルに基づきます（2026年9月16日確認）。KodeLife内でのコンパイル・描画は未検証です。応用教材の検証状況は各チュートリアルを参照してください。

## ライセンス

基本は[MIT](LICENSE)です。Heartfeltの原作・移植版・描画例には **CC BY-NC-SA 3.0** が適用されます。[作者表記と利用条件](third_party/heartfelt/NOTICE.md)を確認してください。
