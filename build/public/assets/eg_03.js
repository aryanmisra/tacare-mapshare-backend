"use strict";
// This JavaScript is entended to work with all supported
// browsers. Some polyfills may be needed.
//
// See https://getbootstrap.com/docs/4.0/getting-started/browsers-devices/
// for the supported browser list
let DS_EG = (function () {
  // globals
  //
  // NotifyJS -- see https://notifyjs.jpillora.com/
  const notify_info_t = { className: "info", globalPosition: "top center" },
    notify_warning_t = { className: "warn", globalPosition: "top center" };
  let library = {};
  // See http://jsfiddle.net/unLSJ/
  // USAGE: $(el).html(library.json.prettyPrint(json_obj));
  // where el is <pre><code> el
  // or
  // $(el).html(library.json.prettyPrint2(json_obj));
  // where el is any el (<pre><code> will be added)
  library.json = {
    replacer: function (match, pIndent, pKey, pVal, pEnd) {
      var key = "<span class=json-key>";
      var val = "<span class=json-value>";
      var str = "<span class=json-string>";
      var r = pIndent || "";
      if (pKey) r = r + key + pKey.replace(/[": ]/g, "") + "</span>: ";
      if (pVal) r = r + (pVal[0] == '"' ? str : val) + pVal + "</span>";
      return r + (pEnd || "");
    },
    prettyPrint: function (obj) {
      var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{]|\[],|\{},|\[]|\{})?$/gm;
      return JSON.stringify(obj, null, 3)
        .replace(/&/g, "&amp;")
        .replace(/\\"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(jsonLine, library.json.replacer);
    },
    prettyPrint2: function (obj) {
      var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/gm,
        out = JSON.stringify(obj, null, 3)
          .replace(/&/g, "&amp;")
          .replace(/\\"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(jsonLine, library.json.replacer);
      return "<pre><code>" + out + "</code></pre>";
    },
  };
  // Add on_click handlers to elements with data-busy attribute
  function augment_busy() {
    $('a[data-busy="href"]').click(busy_href);
    $('form[data-busy="form"]').submit(busy_form);
    $('form[data-busy="form-download"]').submit(busy_form_download);
  }
  // Process flash messages from the server
  function process_server_flash_msgs() {
    let flash_msg_raw = $("#server_data").attr("data-server-data"),
      flash_msg_json = flash_msg_raw ? JSON.parse(flash_msg_raw) : false,
      flash_msg_info = flash_msg_json && flash_msg_json.flash && flash_msg_json.flash.info;
    _.forEach(flash_msg_info, function (msg) {
      $.notify(msg, notify_info_t);
    });
  }
  // process json display
  function process_json_display() {
    let json_raw = $("#server_json_data").attr("data-server-json-data"),
      json_raw2 = json_raw ? JSON.parse(json_raw) : false,
      json_raw3 = json_raw2 && json_raw2.json,
      json = JSON.parse(json_raw3);
    if (json) {
      $("#json-display").html(library.json.prettyPrint(json));
    }
  }
  // Handles clicks for elements with attribute data-busy="href"
  // 1. Make global feedback and busy indicators visible
  // 2. Change location to the element's href value
  let busy_href = function _busy_href(e) {
    e.preventDefault();
    $("#feedback,#busy").show();
    $("#content").hide();
    const href = $(e.target).attr("href");
    window.location = href;
  };
  let countdownInfo = {
      countdown: null,
      intervalId: null, // id of the count down interval
    },
    // When starting a download request, how long should the spinner display?
    downloadSpinnerMS = 3000;
  let busy_form = function _busy_form(e) {
    e.preventDefault();
    $("#feedback,#busy").show();
    $("#content").hide();
    const form = $(e.target);
    form.get(0).submit();
    countdownInfo.countdown = true;
    doCountdown();
  };
  let busy_form_download = function _busy_form_download(e) {
    e.preventDefault();
    $("#feedback,#busy").show();
    $("#content").hide();
    const form = $(e.target);
    form.get(0).submit();
    countdownInfo.countdown = true;
    doCountdown();
    let stopCount = info => {
      info.countdown = false;
      clearInterval(info.intervalId);
      $("#feedback h3 span").text("your download will start soon.");
      $("#busy").hide();
      $("#download-continue").show();
    };
    setTimeout(stopCount, downloadSpinnerMS, countdownInfo);
  };
  function doCountdown() {
    let value = 200,
      timerMS = 300,
      el = $("#feedback h3 span"),
      show = () => {
        if (countdownInfo.countdown) {
          el.text(value);
        }
        value -= 1;
      };
    show();
    countdownInfo.intervalId = setInterval(show, timerMS);
  }
  let start_up = function () {
    augment_busy();
    process_server_flash_msgs();
    process_json_display();
  };
  function notify_info(msg) {
    $.notify(msg, notify_info_t);
  }
  function notify_warning(msg) {
    $.notify(msg, notify_warning_t);
  }
  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  // Return the publicly exposed items
  return {
    start_up: start_up,
  };
})();
// Main stem
$(document).ready(function () {
  DS_EG.start_up();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWdfMDMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9wdWJsaWMvYXNzZXRzL2VnXzAzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSx5REFBeUQ7QUFDekQsMENBQTBDO0FBQzFDLEVBQUU7QUFDRiwwRUFBMEU7QUFDMUUsaUNBQWlDO0FBRWpDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDWCxVQUFVO0lBQ1YsRUFBRTtJQUNGLGlEQUFpRDtJQUNqRCxNQUFNLGFBQWEsR0FBRyxFQUFFLFNBQVMsRUFBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxFQUNsRSxnQkFBZ0IsR0FBRyxFQUFFLFNBQVMsRUFBQyxNQUFNLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxDQUN0RTtJQUNMLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUVqQixpQ0FBaUM7SUFDakMseURBQXlEO0lBQ3pELDZCQUE2QjtJQUM3QixLQUFLO0lBQ0wsbURBQW1EO0lBQ25ELGlEQUFpRDtJQUNqRCxPQUFPLENBQUMsSUFBSSxHQUFHO1FBQ2IsUUFBUSxFQUFFLFVBQVMsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDaEQsSUFBSSxHQUFHLEdBQUcsdUJBQXVCLENBQUM7WUFDbEMsSUFBSSxHQUFHLEdBQUcseUJBQXlCLENBQUM7WUFDcEMsSUFBSSxHQUFHLEdBQUcsMEJBQTBCLENBQUM7WUFDckMsSUFBSSxDQUFDLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUN0QixJQUFJLElBQUk7Z0JBQ0wsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDO1lBQzFELElBQUksSUFBSTtnQkFDTCxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFD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
