# 羊毛フェルト動画用プロンプト生成システム

## 基本コンセプト
日本史年号楽曲制作プロジェクトの動画用に、羊毛フェルトの可愛い動物たちが歴史を演じるシーンを生成します。教育的価値を保ちながら、過激な歴史的事実もマイルドに表現し、中高生が口コミしたくなる「可愛さ」を追求します。

## フェルトプロンプトの基本構造

### ベースプロンプト（これをコピーして使用）
```
wool felt stop motion animation style, [動物の種類] [アクション/感情], [シチュエーション], cute needle felted animals, soft pastel colors, cozy handmade texture, simple scene, warm lighting, kawaii style, --ar 1:1 --v 6
```

### 使用例
```
wool felt stop motion animation style, two rabbits hugging each other, on a wooden ship deck, cute needle felted animals, soft pastel colors, cozy handmade texture, simple scene, warm lighting, kawaii style, --ar 1:1 --v 6
```

## プロンプト作成ガイド

### 動物の種類（例）
- rabbit (うさぎ)
- cat (猫)
- dog (犬)
- bear (くま)
- fox (きつね)
- panda (パンダ)
- hamster (ハムスター)
- owl (ふくろう)
- sheep (羊)
- pig (ぶた)

### アクション/感情（例）
- crying sadly (悲しく泣いている)
- celebrating happily (喜んで祝っている)
- fighting gently (優しく戦っている)
- studying hard (一生懸命勉強している)
- raising hands (手を挙げている)
- hugging (抱きしめている)
- bowing (お辞儀している)

### シチュエーション（例）
- in a traditional Japanese room (和室で)
- on a wooden ship (木造船の上で)
- in front of a castle (城の前で)
- around a campfire (焚き火を囲んで)
- in a classroom (教室で)
- on a battlefield (戦場で)
- at a tea ceremony (茶会で)

## プロンプト生成フロー

### ステップ1: 歌詞からシーンを抽出
歌詞を読んで、以下の要素をシンプルに解釈：
- 喜怒哀楽の感情
- 集まる/散るなどの動き
- 勝つ/負けるなどの結果
- 時代の変化

### ステップ2: 動物とシチュエーションの割り当て
- シンプルな動物選択（2-3種類まで）
- 分かりやすいアクション
- 背景はシンプルに

### ステップ3: ベースプロンプトに当てはめる
上記のベースプロンプトの[ ]部分を埋めて完成

## 出力例

### 例1: 白村江の戦い（663年）
歌詞: 「白村江の戦いで惨敗した」
→ シーン解釈: 敗戦の悲しみ
→ プロンプト:
```
wool felt stop motion animation style, rabbit and cat crying sadly, on a wooden ship deck, cute needle felted animals, soft pastel colors, cozy handmade texture, simple scene, warm lighting, kawaii style, --ar 1:1 --v 6
```

### 例2: 大化の改新（645年）
歌詞: 「みんなのルールを決めたい」
→ シーン解釈: みんなで話し合う
→ プロンプト:
```
wool felt stop motion animation style, various animals raising hands enthusiastically, in a traditional meeting room, cute needle felted animals, soft pastel colors, cozy handmade texture, simple scene, warm lighting, kawaii style, --ar 1:1 --v 6
```