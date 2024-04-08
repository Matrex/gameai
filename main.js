window.addEventListener("load", app);

function app() {
  var canvas = document.getElementsByTagName("canvas")[0],
    ctx = canvas.getContext("2d"),
    // canvas dimensions
    w = 568,
    h = 480,
    // scale, keep at 2 for best retina results
    s = 2;

  // set canvas dimensions with scale
  canvas.width = w * s;
  canvas.height = h * s;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.scale(s, s);

  /* Main app code */
  // all artwork done by me :)
  var sprites = [
      "https://i.ibb.co/TqMC0Dp/grass.png",
      "https://i.ibb.co/GTsDmJF/fountain.png",
      "https://i.ibb.co/59SRcxm/chibi-m.png",
      "https://i.ibb.co/PChphHS/chibi-f.png"
        ],
        images = [];

    for (var sp in sprites) {
      images.push(new Image());
      images[sp].src = sprites[sp];
    }

  var player = new avatar("Player",0,0,30,60,3,28,2,w/2 - 15,h*0.8 - chatBar.barH),
    claude = new avatar("Claude", 0, 1, 30, 60, 3, 28, 2, w/2 + 50, h*0.8 - chatBar.barH, 0),
    structures = [
      new structure(w,50,0,-40),
      new structure(10,h - chatBar.barH - 10,0,10),
      new structure(10,h - chatBar.barH - 10,w - 10,10),
      new structure(300,200,w/2 - 150,100,70,images[1],true,12)
    ],
    worldObjs = [],
    control = function(avatar, e) {
      // avatar.dir values: 0 = up, 1 = right, 2 = down, 3 = left
      if (e && !chatBar.active) {
        avatar.isMoving = true;
        avatar.canMove = true;
        switch (e.keyCode) {
          case 37:
            avatar.dir = 3;
            break;
          case 38:
            avatar.dir = 0;
            break;
          case 39:
            avatar.dir = 1;
            break;
          case 40:
            avatar.dir = 2;
            break;
          default:
            avatar.canMove = false;
            break;
        }                           
      }                 
    },
    stopControl = function(avatar) {
      avatar.isMoving = false;
    },
    start = function() {
      chatBar.create();
      // load player and Claude
      worldObjs[0] = player;
      worldObjs[1] = claude;
      // load structures
      let avatars = worldObjs.length;
      for (var ss in structures) {
        ss = +ss + avatars;
        worldObjs[ss] = structures[ss - avatars];
      }
      // onboarding
      let onboardingTxt = "Welcome! To get started, enter /help for commands.",
        chatLog = document.querySelector(".chat-log"),
        newEntry = document.createElement("span");

      newEntry.className = "info-text";
      newEntry.appendChild(document.createTextNode(onboardingTxt));
      chatLog.insertBefore(newEntry, chatLog.childNodes[0]);
      screenText.updateText(onboardingTxt,h - chatBar.barH,screenText.fontS*2,"#ff4");
      // run everything!
      claudeAI();
      runDisplay();
    };

  start();

  // player moving
  document.addEventListener("keydown",function(e){
    let field = document.querySelector("input"),
      send = document.querySelector(".send"),
      viewChat = document.querySelector(".view-chat");
    
    // Send button availability
    setTimeout(function(){
      send.disabled = field.value.length > 0 ? "" : "disabled";
    },10);                  
    
    // move only if not using chat
    if (!chatBar.active) {
      control(player, e);

    // surf through own input history
    } else if (chatBar.history.length > 0) {
      // back
      if (e.keyCode == 38 && chatBar.curHistoryItem != chatBar.history.length - 1) {
        ++chatBar.curHistoryItem;
        field.value = chatBar.history[chatBar.history.length - chatBar.curHistoryItem - 1];
        // move insertion point to end
        e.preventDefault();                                                   
        if (typeof field.selectionStart == "number") {
              field.selectionStart = field.selectionEnd = field.value.length;
          } else if (typeof field.createTextRange != "undefined") {
              field.focus();
              let range = field.createTextRange();
              range.collapse(true);
              range.select();
          }
      // forward
      } else if (e.keyCode == 40 && chatBar.curHistoryItem > -1) {
        --chatBar.curHistoryItem;
        field.value = chatBar.curHistoryItem == -1 ? "" : chatBar.history[chatBar.history.length - chatBar.curHistoryItem - 1];
      }
    }
    // autocomplete commands
    let spaces = 0;
    
    for (var sp in field.value) {
      if (field.value[sp] == " ") {
        ++spaces;
      }
    }
    chatBar.autoCmpltLvl = spaces;
    
    if (e.keyCode == 9 && field.value[0] == "/" && chatBar.active) {
      e.preventDefault();
      let chatLog = document.querySelector(".chat-log"),
        availOpts = document.createElement("span"),
        entityResults = [player.name, claude.name],
        displayEntResults = "";
            
        entityResults.sort(function(a, b){
            if (a.toLowerCase() < b.toLowerCase())
            return -1;
            if (a.toLowerCase() > b.toLowerCase())
            return 1;
            return 0;
        });
                
        for (var der in entityResults) {
          der = +der;
          displayEntResults += (der > 0 ? ", " : "") + entityResults[der];
        }
      
      // command name
      if (chatBar.autoCmpltLvl === 0) {
        let curString = field.value.substr(1,field.value.length - 1),
          foundCmdMatch = false;

        // search part of command in command list, must not be entire command name
        for (var fm in cmd) {
          if (cmd[fm].name.indexOf(curString) === 0 && curString.length >= 1 && curString != cmd[fm].name) {
            chatBar.curAutoCmpltCmd = +fm;
            foundCmdMatch = true;
            field.value = "/" + cmd[chatBar.curAutoCmpltCmd].name;
          }
        }
        
        // suggest next command
        if (!foundCmdMatch && field.value.length > 0 && (cmd.find(c => c.name == curString) || field.value == "/")) {
          if (chatBar.curAutoCmpltCmd == -1) {  
            let getCmds = "";

            for (var ac in cmd) {
              getCmds += (ac > 0 ? ", " : "") + "/" + cmd[ac].name;
            }
          
            availOpts.appendChild(document.createTextNode(getCmds));
            chatLog.insertBefore(availOpts, chatLog.childNodes[0]);
          }

          ++chatBar.curAutoCmpltCmd;
          
          if (chatBar.curAutoCmpltCmd > cmd.length - 1) {
            chatBar.curAutoCmpltCmd = 0;
          }
          
          field.value = "/" + cmd[chatBar.curAutoCmpltCmd].name;
        }
      // first or second argument
      } else if (chatBar.autoCmpltLvl == 1) {
        
        let curCmd = field.value.split(" ")[0].substring(1),
          cmdInHand = cmd.find(c => c.name === curCmd) || 0,
          reqArgs = (cmdInHand.args.match(/</g) || []).length;

        if (curCmd !== 0 && reqArgs >= 1) {
          let arg1Result = "";
          if (cmdInHand.args.indexOf("name") == 1) {
            
            if (chatBar.arg1pg == -1) {
              availOpts.appendChild(document.createTextNode(displayEntResults));
              chatLog.insertBefore(availOpts, chatLog.childNodes[0]);
            }
            
            ++chatBar.arg1pg;
          
            if (chatBar.arg1pg > entityResults.length - 1) {
              chatBar.arg1pg = 0;
            }
            
            arg1Result = entityResults[chatBar.arg1pg];
            
          } else if (cmdInHand.args.indexOf("add") == 1 || cmdInHand.args.indexOf("del") == 1) {
            let opResults = ["add","del"];
            
            if (chatBar.arg1pg == -1) {
              availOpts.appendChild(document.createTextNode("add, del"));
              chatLog.insertBefore(availOpts, chatLog.childNodes[0]);
            }

            ++chatBar.arg1pg;
          
            if (chatBar.arg1pg > opResults.length - 1) {
              chatBar.arg1pg = 0;
            }

            arg1Result = opResults[chatBar.arg1pg];
          }
          field.value = "/" + cmdInHand.name + " " + arg1Result;
        }
      } else if (chatBar.autoCmpltLvl == 2) {
        let curCmd = field.value.substring(1).split(" "),
          cmdInHand = cmd.find(c => c.name === curCmd[0]) || 0,
          curArgs = curCmd[1],
          reqArgs = (cmdInHand.args.match(/</g) || []).length;
        
        if (curCmd[0] !== 0 && reqArgs >= 2) {
          if (cmdInHand.args.indexOf("name") > -1) {
            
            if (chatBar.arg2pg == -1) {
              availOpts.appendChild(document.createTextNode(displayEntResults));
              chatLog.insertBefore(availOpts, chatLog.childNodes[0]);
            }
            
            ++chatBar.arg2pg;
          
            if (chatBar.arg2pg > entityResults.length - 1) {
              chatBar.arg2pg = 0;
            }
            field.value = "/" + cmdInHand.name + " " + curCmd[1] + " " + entityResults[chatBar.arg2pg];
          }
        }
      }
    } else {
      chatBar.curAutoCmpltCmd = -1;
      chatBar.arg1pg = -1;
      chatBar.arg2pg = -1;
    }

    // toggle chat with V
    if (e.keyCode == 86 && !chatBar.active) {
      e.preventDefault();
      chatBar.logToggle();

    // quickly start typing command
    } else if (e.keyCode == 191 && !chatBar.active) {
      field.value = "";
      chatBar.logToggle();

    // close chat using Esc
    } else if (e.keyCode == 27) {
      chatBar.active = false;
      chatBar.logHide();
      field.blur();
      send.blur();
      viewChat.blur();
    }
  });
  // player stop moving
  document.addEventListener("keyup",function(){
    stopControl(player);
  });
}