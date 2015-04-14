const STATUS_INDICATOR_ID = "brackets-svg-font.convert-status";

let StatusBar   = brackets.getModule("widgets/StatusBar");

let $statusIndicator = null;

function showBusyStatus(statusText) {
    StatusBar.showBusyIndicator();
    if (!$statusIndicator) {
        $statusIndicator = $("<div/>");
        StatusBar.addIndicator(STATUS_INDICATOR_ID, $statusIndicator, false);
    }
    $statusIndicator.text(statusText);
    StatusBar.updateIndicator(STATUS_INDICATOR_ID, true);
}

function hideBusyStatus() {
    StatusBar.hideBusyIndicator();
    StatusBar.updateIndicator(STATUS_INDICATOR_ID, false);
}

export { showBusyStatus, hideBusyStatus };