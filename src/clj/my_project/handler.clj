(ns my-project.handler
  (:use compojure.core)
  (:require [compojure.handler :as handler]
            [compojure.route :as route]
            [ring.util.response :as resp]))

(defroutes app-routes
  (GET "/" [] (resp/redirect "/resources/public/index.html"))
  (route/files "/" {:root "./"})
  (route/not-found "Not Found"))

(def app
  (handler/site app-routes))
