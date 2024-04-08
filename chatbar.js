var chatBar = {
  barH: 54,
  logH: 220,
  margin: 5,
  active: false,
  showLog: false,
  maxLines: 32,
  history: [],
  curHistoryItem: -1,
  curAutoCmpltCmd: -1,
  arg1pg: -1,
  arg2pg: -1,
  autoCmpltLvl: 0,
  logShow: function() {
    try {
      let log = document.querySelector(".chat-log").style,
        field = document.querySelector("input");
        
      log.display = "flex";
      this.active = true;
      this.showLog = true;
      field.focus();
    }
    catch(err) {
      console.log("Chatbar must be created first in order to show the log");
    }
  },
  logHide: function() {
    try {
      let log = document.querySelector(".chat-log").style,
        field = document.querySelector("input");
        
      log.display = "none";
      this.active = false;
      this.showLog = false;
      field.blur();
    }
    catch(err) {
      console.log("Chatbar must be created first in order to hide the log");
    }
  },
  logToggle: function() {
    if (this.showLog) {
      this.logHide();
    } else {
      this.logShow();
    }
  },
  create: function()
  {
let form = document.createElement("form"),
field = document.createElement("input"),
btn1 = document.createElement("button"),
btn2 = document.createElement("button"),
log = document.createElement("div");


Copy code
// set up form elements and translate them to inside canvas
form.action = "";
form.style.padding = this.margin + "px";
form.style.width = (canvas.width / s) + "px";
form.style.height = (this.barH) + "px";
form.style.transform = "translateY(" + (-this.barH) + "px)";
// text input
field.type = "text";
field.style.fontSize = (this.barH*0.4) + "px";
field.style.height = (this.barH - this.margin*2) + "px";
field.style.padding = "0 " + this.margin + "px";
field.maxLength = 64;
// send button
btn1.className = "send";
btn1.style.fontSize = (this.barH*0.4) + "px";
btn1.style.height = (this.barH - this.margin*2) + "px";
btn1.disabled = "disabled";
// view chat button
btn2.className = "view-chat";
btn2.style.fontSize = (this.barH*0.25) + "px";
btn2.style.height = (this.barH - this.margin*2) + "px";

// chat log                                           
log.className = "chat-log";
log.style.width = (canvas.width / s) + "px";
log.style.height = (this.logH) + "px";
log.style.transform = "translateY(" + (-this.barH*2 - this.logH) + "px)";
log.style.padding = this.margin + "px";

document.body.appendChild(form);
document.body.appendChild(log);
form.appendChild(field);
form.appendChild(btn1);
form.appendChild(btn2);
btn1.appendChild(document.createTextNode("Send"));
btn2.appendChild(document.createTextNode("View Chat"));
}

};