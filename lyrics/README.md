# 日本史語呂合わせ歌詞集

このフォルダには、YouTube動画制作用の日本史年号語呂合わせ歌詞ファイルを保存します。

## フォルダ構成

```
lyrics/
├── README.md                     # このファイル
├── era-songs/                    # 時代別歌詞
│   ├── ancient.md               # 古代（～794年）
│   ├── medieval.md              # 中世（794～1573年）
│   ├── early-modern.md          # 近世（1573～1868年）
│   └── modern.md                # 近現代（1853年～）
├── complete-songs/              # 完全版歌詞
│   ├── full-200-dates.md        # 全200年号完全版
│   ├── top-100-dates.md         # 重要100年号版
│   └── exam-essential.md        # 受験必須版
└── templates/                   # 歌詞テンプレート
    ├── verse-template.md        # 詩節テンプレート
    └── chorus-template.md       # サビテンプレート
```

## 歌詞作成方針

1. **覚えやすいメロディ**: 既存の童謡やポップスのメロディに合わせる
2. **語呂合わせ重視**: 年号の数字が自然に歌詞に組み込まれている
3. **時代の流れ**: 歴史の流れに沿って構成
4. **重要度別**: 受験頻出度に応じて歌詞の配置を調整

## データソース

- `/data/japanese-history-dates.yml` - 200個の年号データベース
- 各エントリーの `mnemonic` フィールドを歌詞に活用

## 動画制作連携

- 歌詞ファイルは `image_scenario` と連動
- 各年号に対応する映像イメージも記載
- YouTube動画の構成案も含める