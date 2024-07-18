# frontendの役割

    - UIをつかさどる
    - 基本的な動きはgameStateをなんでもbackendで変更して変更後のデータを、Socketで受け取る。
    - Socketでデータを受け取ったことはuseEffectで検知して、gameStateの更新のたびに再レンダリングをする。

# backendの役割

    -   backendの役割は主に以下のように分けられる。
        -   Utility(GameFlowMonitor.ts)
            - StateのPhaseとActionと手持ちの動物、コイン、スター、サイコロの目等、の内容をチェックして
                ゲーム内で、プレイヤーが行うことができる動作かをチェックする。ゲームの状況を管理する。（チート対策のため）
    					- Phaseやターンを進める。
    					- 勝利/敗北を判定する。
        -   Service
            -   ゲームのサービスを提供する。
                - ゲーム上で行えるstateの変更、処理そのものが実装されている。
    							- 動物の効果発動もこの領域で行う
    					- Stateの返却を行う
    						- Service上で変更したstateの値を返却する。

# ゲーム全体の流れ

1. frontend で 操作が行われる
2. backendのソケットポイントを実行
3. データをUtilityでチェックする
4. ServiceでStateを修正する。
5. Serviceでデータを返却する。
6. frontendで5.の処理の変更を受け取り、stateに反映する
7. 6の変更をuseEffectで検知してgameStateに反映させる。
