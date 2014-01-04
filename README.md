# cocos2d-cljs

A Cocos2d-x example app in ClojureScript.

Write a game in ClojureScript and target iOS, Android, Windows and HTML5? Yes please.

## Building and serving

1. To build the application, while watching for changes, run: 

    > lein cljsbuild auto

2. To view the result in the browser, run:

    > lein ring server

## Attaching a REPL

3. Run:

    > lein repl

4. Then enter the following in the REPL:

    user=> (require 'cljs.repl.browser)

    user=> (cemerick.piggieback/cljs-repl :repl-env (cljs.repl.browser/repl-env :port 9000))

5. Now, refresh the browser.

6. In the repl, test with:

    cljs.user=> (js/alert "Hello, world!")

## Cider/Emacs

1. Add marmalade to emacs, by putting the following in init.el:

    (require 'package)

    (add-to-list 'package-archives '("melpa" . "http://melpa.milkbox.net/packages/") t)

2. alt-x `package-install` cider

1. Install cider using `package-install` from marmalade.
2. Open project.clj in emacs
3. alt-x `cider-jack-in` to start a repl based on the current project file
4. Enter the following into the repl emacs provides you:

    user=> (require 'cljs.repl.browser)

    user=> (cemerick.piggieback/cljs-repl :repl-env (cljs.repl.browser/repl-env :port 9000))

5. Follow steps under *Building and serving*

## Leiningen

1. Get https://raw.github.com/technomancy/leiningen/stable/bin/lein

2. Copy to ~/bin/lein

3. Run:

    > chmod a+x ~/bin/lein

## Troubleshooting

A. Cider: "pp does not exist"

See:
  [https://github.com/clojure-emacs/cider/issues/382#issuecomment-26300490]
  [https://github.com/clojure-emacs/cider/issues/382#issuecomment-26328079]

i. Delete .emacs.d/elpa/nrepl* and .emacs.d/elpa/cider* and .emacs.d/elpa/clojure-mode*
ii. alt-x `package-install-file` nrepl-0.2.0.el from http://marmalade-repo.org/packages/nrepl-0.2.0.el
iii. alt-x `package-install` cider

