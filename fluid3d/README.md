# 3Dのインクと煙

3D格子で速度・圧力・濃度を計算し、インクと煙の動きを観察する教材です。格子の解像度は64³、96³、128³から選べます。

## 試す

[preview.html](preview.html)をダウンロードしてブラウザーで開きます。WebGL2と浮動小数点描画が必要です。

操作とKodeLifeの設定は[チュートリアル9](../tutorials/09_fluid3d.md)を参照してください。KodeLifeではGLSLを使ってPassを組み立てます。`.kode`ファイルは未同梱です。

## 実装とファイル

MAC格子上で速度を移流し、外力と圧力補正を加えます。濃度の移流には制限付きMacCormack法、描画にはレイマーチを使います。

| ファイル | 内容 |
| --- | --- |
| `src/` | 編集用のGLSL |
| `shaders/` | 共通処理を展開したGLSL 150 |
| `pipeline.json` | 標準構成の51 Passの順序・入力・パラメーター |
| `demo/` | ブラウザー版の実行コード |
| `tools/build.py` | GLSLと単体HTMLの生成 |
| `tools/verify_macos.c` | macOS OpenGLでの数値検証・画像出力 |
| [VALIDATION.md](VALIDATION.md) | 検証結果 |

リポジトリのルートで実行します。

```sh
python3 fluid3d/tools/build.py
python3 fluid3d/tools/build.py --check
```
