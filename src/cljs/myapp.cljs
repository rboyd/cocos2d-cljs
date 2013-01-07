(ns myapp.game)

(defn layer-ctor []
  (this-as this
    (.associateWithNative js/cc this (.-Layer js/cc))))

(defn scene-ctor []
  (this-as this
    (.associateWithNative js/cc this (.-Scene js/cc))))

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
      (.addChild this (.-sprite this) 0)
      (.setTouchEnabled this true)


      (set! (.-scoreLabel this) (.create cc/LabelTTF "0" "Arial" 32))
      (doto (.-scoreLabel this)
        (.setAnchorPoint (.p js/cc 0 0))
        (.setPosition (.p js/cc 130 (- (.-height size) 48)))
        (.setHorizontalAlignment (.-TEXT_ALIGNMENT_LEFT js/cc)))

      (.addChild this (.-scoreLabel this)))))


(def clicks (atom 0))

(defn on-touches-began [touches events]
  (this-as this
    (let [sprite (.-sprite this)
          current-rotation (.getRotation sprite)]
      (swap! clicks inc)
      (.setString (.-scoreLabel this) @clicks)
      (.setRotation sprite (+ current-rotation 5)))))
 
(def params (js-obj js/isMouseDown false
                    js/helloImg js/null
                    js/helloLb js/null
                    js/circle js/null
                    js/sprite js/null
                    js/scoreLabel js/null
                    js/init init-fn
                    js/ctor layer-ctor
                    js/onTouchesBegan on-touches-began))
 
(def ^:export hello-world-layer (.extend cc/Layer params))

(def scene-params (js-obj js/ctor scene-ctor
                   js/onEnter (fn []
  (this-as this
    (._super this)
    (let [layer (hello-world-layer.)]
      (.init layer)
      (.addChild this layer))))))

(def ^:export hello-world-scene (.extend cc/Scene scene-params))
