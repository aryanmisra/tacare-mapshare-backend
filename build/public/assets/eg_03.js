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
      // using an object since it's a pointer
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWdfMDMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9wdWJsaWMvYXNzZXRzL2VnXzAzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx5REFBeUQ7QUFDekQsMENBQTBDO0FBQzFDLEVBQUU7QUFDRiwwRUFBMEU7QUFDMUUsaUNBQWlDO0FBRWpDLElBQUksS0FBSyxHQUFHLENBQUM7SUFDWCxVQUFVO0lBQ1YsRUFBRTtJQUNGLGlEQUFpRDtJQUNqRCxNQUFNLGFBQWEsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxFQUN2RSxnQkFBZ0IsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxDQUFDO0lBQ3pFLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUVqQixpQ0FBaUM7SUFDakMseURBQXlEO0lBQ3pELDZCQUE2QjtJQUM3QixLQUFLO0lBQ0wsbURBQW1EO0lBQ25ELGlEQUFpRDtJQUNqRCxPQUFPLENBQUMsSUFBSSxHQUFHO1FBQ2IsUUFBUSxFQUFFLFVBQVUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7WUFDbEQsSUFBSSxHQUFHLEdBQUcsdUJBQXVCLENBQUM7WUFDbEMsSUFBSSxHQUFHLEdBQUcseUJBQXlCLENBQUM7WUFDcEMsSUFBSSxHQUFHLEdBQUcsMEJBQTBCLENBQUM7WUFDckMsSUFBSSxDQUFDLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUN0QixJQUFJLElBQUk7Z0JBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDO1lBQ2pFLElBQUksSUFBSTtnQkFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFD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
