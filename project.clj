(defproject cocos2d-cljs "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}

  :dependencies [[org.clojure/clojure "1.5.1"]
                 [compojure "1.1.5"]
                 [org.clojure/clojurescript "0.0-2030"]
                 [com.cemerick/piggieback "0.1.2"]]

  :profiles {:dev {:dependencies [[ring-mock "0.1.3"]]}}

  :plugins [[lein-cljsbuild "1.0.0-alpha2"]
            [lein-ring "0.8.2"]
            [com.cemerick/austin "0.1.3"]]

  :ring {:handler my-project.handler/app}

  :repl-options {:nrepl-middleware [cemerick.piggieback/wrap-cljs-repl]}

  :source-paths ["src/clj"]
  :cljsbuild {
              :builds [{
                        :source-paths ["src/cljs"]
                        :compiler {
                                   :output-to "resources/public/myApp.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}]})
