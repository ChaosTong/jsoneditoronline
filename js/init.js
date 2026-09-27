(function(root, doc) {
    const STORAGE_KEY = "jsoneditoronline.v1";
    const SAVE_DEBOUNCE_MS = 250;

    const appOnError = (err) => {
        window.jeLastError = err;
        alert(String(err));
    };

    const defaultJson = {
        "array": [1, 2, 3],
        "boolean": true,
        "null": null,
        "number": 123,
        "object": { "a": "b", "c": "d" },
        "string": "Hello World",
    };
    const defaultText = JSON.stringify(defaultJson, null, 2);

    const loadState = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") {
                return null;
            }
            return parsed;
        } catch (err) {
            return null;
        }
    };

    const saved = loadState();
    const leftText = (saved && typeof saved.left?.text === "string")
        ? saved.left.text
        : defaultText;
    const rightText = (saved && typeof saved.right?.text === "string")
        ? saved.right.text
        : defaultText;
    const leftMode = (saved && (saved.left?.mode === "code" || saved.left?.mode === "tree"))
        ? saved.left.mode
        : "code";
    const rightMode = (saved && (saved.right?.mode === "code" || saved.right?.mode === "tree"))
        ? saved.right.mode
        : "tree";

    const editorMountLeft = doc.getElementById("editor-left");
    const editorMountRight = doc.getElementById("editor-right");

    let saveTimer = null;
    let editorLeft;
    let editorRight;

    const persistNow = () => {
        try {
            const state = {
                left: {
                    text: editorLeft.getText(),
                    mode: editorLeft.getMode(),
                },
                right: {
                    text: editorRight.getText(),
                    mode: editorRight.getMode(),
                },
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            // QuotaExceeded / private mode — ignore; editing still works.
            window.jeLastPersistError = err;
        }
    };

    const schedulePersist = () => {
        if (saveTimer !== null) {
            clearTimeout(saveTimer);
        }
        saveTimer = setTimeout(() => {
            saveTimer = null;
            persistNow();
        }, SAVE_DEBOUNCE_MS);
    };

    const editorOptions = (mode) => ({
        mode,
        modes: ["code", "tree"],
        onError: appOnError,
        onChange: schedulePersist,
        onModeChange: schedulePersist,
    });

    editorLeft = new JSONEditor(editorMountLeft, editorOptions(leftMode));
    editorRight = new JSONEditor(editorMountRight, editorOptions(rightMode));
    editorLeft.setText(leftText);
    editorRight.setText(rightText);

    document.addEventListener("click", (evt) => {
        if (evt.target.matches("[data-app-action='to-left']")) {
            evt.target.focus();
            try {
                editorLeft.setText(editorRight.getText());
                schedulePersist();
            } catch (err) {
                appOnError(err);
            }
        } else if (evt.target.matches("[data-app-action='to-right']")) {
            evt.target.focus();
            try {
                editorRight.setText(editorLeft.getText());
                schedulePersist();
            } catch (err) {
                appOnError(err);
            }
        }
    });

    window.addEventListener("beforeunload", persistNow);
    window.addEventListener("pagehide", persistNow);

    root.jeEditorLeft = editorLeft;
    root.jeEditorRight = editorRight;
    root.jePersistNow = persistNow;
})(window, document);
