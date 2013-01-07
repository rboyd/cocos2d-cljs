(ns myapp.game)

(defn init-fn []
  (this-as this
    (._super this)
    (let [size (-> cc/Director .getInstance .getWinSize)]
      (set! (.-sprite this) (.create cc/Sprite "res/HelloWorld.png"))
      (doto (.-sprite this)
        (.setPosition (.p js/cc (/ (.-width size) 2) (/ (.-height size) 2)))
        (.setVisible true)
        (.setAnchorPoint (.p js/cc 0.5 0.5))
        (.setScale 0.5)
        (.setRotation 90))
      (.addChild this (.-sprite this) 0))))

(def params (js-obj js/isMouseDown false
                    js/helloImg js/null
                    js/helloLb js/null
                    js/circle js/null
                    js/sprite js/null
                    js/init init-fn))

(def ^:export hello-world-layer (.extend cc/Layer params))

(def scene-params (js-obj js/onEnter (fn []
  (this-as this
    (._super this)
    (let [layer (hello-world-layer.)]
      (.init layer)
      (.addChild this layer))))))

(def ^:export hello-world-scene (.extend cc/Scene scene-params))
