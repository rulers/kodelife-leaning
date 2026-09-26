# 3D Ink / Smoke — KodeLife study

[日本語チュートリアル](../tutorials/09_fluid3d.md) · [単体デモHTML](preview.html)

標準64³（デモでは96³／128³も選択可能）の3D MAC型格子で、速度の移流、外力、圧力補正、制限付きMacCormack濃度移流を実行します。3D濃度をレイマーチして描画します。ノイズで流体模様を生成する方式ではありません。

- `preview.html`：ダウンロードしてブラウザーで開けるデモ。WebGL2と浮動小数点描画が必要。
- `src/`：編集用の共通GLSLと各処理。
- `shaders/`：共通部分を展開した、KodeLifeへ貼り付けられるGLSL 150。
- `pipeline.json`：51Passの順序・入力・パラメーター。ネイティブのプロジェクト形式ではありません。
- `demo/`：WebGL2の実行コード。半精度の状態バッファと32bitの計算時計を使用。
- `tools/build.py`：生成物を更新。`--check`で整合性を確認。
- `tools/verify_macos.c`：macOS OpenGLで同じGLSLを実行し、数値検証と画像出力。
- `VALIDATION.md`：実行結果と未検証の範囲。

`.kode`は未同梱です。KodeLifeの組み立て方と制約はチュートリアルを参照してください。実写と同等の細い膜・筋を再現するには、さらに解像度と移流精度を上げる必要があります。
