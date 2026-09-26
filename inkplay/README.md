# 墨の庭 / Ink Playground

マウス・タッチでインクを落とし、にじみと色の重なりを描く2D WebGL2アプリです。

- **すぐ試す：** [preview.html](preview.html)をダウンロードしてブラウザーで開く（ネット接続不要）。
- **操作と仕組み：** [チュートリアル11](../tutorials/11_interactive_ink.md)。
- **開発：** `python3 inkplay/tools/build.py`。`src/`からGLSL150と単体HTMLを生成します。
- **実装：** 固定時間刻みの速度・圧力・色素更新に、にじみの演出を加えています。実写素材や参考サイトのコードは含みません。ルートのMITライセンスが適用されます。

WebGL2とEXT_color_buffer_floatが必要です。描画はローカルで処理され、PNG保存以外の永続保存はありません。
