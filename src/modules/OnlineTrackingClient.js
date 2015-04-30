const KEY_ID = "ext-online-id",
      TOKEN = "5541dcf064617400a6000001",
      TRACKING_SERVICE = "http://brackets-online.herokuapp.com/",
      TRACKING_URL = `${TRACKING_SERVICE}tick/${TOKEN}/`;

const userId = {

    _savedIds() {
        let userIds = localStorage.getItem(KEY_ID);
        return userIds ? JSON.parse(userIds) : {};
    },

    get() {
        return this._savedIds()[TOKEN] || "";
    },

    set(id) {
        let userIds = this._savedIds();
        userIds[TOKEN] = id;
        localStorage.setItem(KEY_ID, JSON.stringify(userIds));
    }
};

function tick() {
    $.get(TRACKING_URL + userId.get()).then(data => {
        if (data && data !== "OK" && data !== "ERROR") {
            userId.set(data);
        }
    }).fail(() => {
        console.log("Can't track online status, retry in 5 mins.");
        setTimeout(tick, 5 * 60 * 1000);
    });
}

tick();
setInterval(tick, 60 * 60 * 1000);