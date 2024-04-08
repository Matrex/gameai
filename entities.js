var bubbleObj = function(text,w,x,y) {
  let minW = 35;
  this.text = text;
  this.w = w < minW ? minW : w;
  this.x = x;
  this.y = y;
},
cmdObj = function(name, args, desc) {
  this.name = name;
  this.args = args || "";
  this.desc = desc || "";
},
cmd = [
  new cmdObj("clear","","clear chat"),
  new cmdObj("help","","get help menu"),
  new cmdObj("entityinfo","<name>","get details of entity"),
  new cmdObj("modentity","<name> <newname> [gender] [skin] [speed] [level]","modify entity"),
  new cmdObj("npc","<add|del> <name> [gender] [skin] [speed] [level] [<x> <y>]","add/delete NPC"),
  new cmdObj("tp","<name> <x> <y> or <name> <targetname>","teleport entity to new location"),
  new cmdObj("who","","get list of all entities")
],
avatar = function(name, gender, skinTone, width, height, speed, frames, dir, x, y, lvl) {
  let nameLenLimit = 16;
  this.name = name.length > nameLenLimit ? name.substr(0,nameLenLimit) : name || "Anonymous";
  this.gender = gender || 0;
  this.skinTone = skinTone || 0;
  this.w = width || 0;
  this.h = height || 0;
  this.speed = speed || 0;
  this.curFrame = 1;
  this.frames = frames || 1;
  this.dir = dir || null;
  this.isMoving = false;
  this.canMove = true;
  this.x = x || 0;
  this.y = y || 0;
  this.lvl = lvl || 0;
  this.lastMsg = "";
  this.msgTimer = 0;
  this.msgMaxTime = 3000;
  this.msgFadeTime = 150;
  this.sendMsg = function(msg) {
    if (msg.length > 0) {
      let isCmd = false;
      chatBar.curAutoCmpltCmd = -1;
      chatBar.arg1pg = -1;
      chatBar.arg2pg = -1;
      
      // update last message if not a command
      if (msg[0] != "/") {
        this.lastMsg = msg;
      } else {
        isCmd = true;
      }
      
      let chatLog = document.querySelector(".chat-log"),
        newEntry = document.createElement("span");
      
      /* if command, execute if used by player (whose level is always 0,
      and NPCs never send anything if they too are set at level 0) */
      if (this.lvl === 0 && isCmd) {
        switch (msg.substr(1,msg.length - 1).split(" ")[0]) {
          // display help
          case "help":
            let helpHeading = "----- Help -----",
              cmdInfo = [],
              helpScrnTxt = "";

            for (var c in cmd) {
              cmdInfo[c] = "/" + cmd[c].name + " " + cmd[c].args + (cmd[c].args.length > 0 ? " " : "") + "- " + cmd[c].desc;
            }
            
            newEntry.className = "help-text";
            newEntry.appendChild(document.createTextNode(helpHeading));
            helpScrnTxt += helpHeading + "%";
            
            // show available commands
            for (var ci in cmdInfo) {
              newEntry.appendChild(document.createElement("br"));
              newEntry.appendChild(document.createTextNode(cmdInfo[ci]));
              helpScrnTxt += cmdInfo[ci] + "%";
            }
            
            screenText.updateText(helpScrnTxt,h - chatBar.barH - (screenText.fontS*1.5*(cmdInfo.length)),screenText.fontS*2*(cmdInfo.length),"#4f4");
            break;
            
          // clear chat
          case "clear":
            let clearMsg = "Chat cleared";
            chatLog.innerHTML = "";
            newEntry.appendChild(document.createTextNode(clearMsg));
            screenText.updateText(clearMsg,h - chatBar.barH,screenText.fontS*2);
            break;
            
          // get entity details
          case "entityinfo":
            let eiArgs = msg.split(" "),
              eiTarget = eiArgs[1],
              eiSearch = worldObjs.find(s => s.name === eiTarget) || 0,
              eiFBLines = [],
              eiFeedback = "";
            
              if (eiSearch !== 0 && eiTarget) {
                eiFBLines[0] = "----- " + eiSearch.name +  " -----";
                eiFBLines[1] = "Gender - " + (eiSearch.gender === 0 ? "male" : "female");
                eiFBLines[2] = "Skin - " + eiSearch.skinTone;
                eiFBLines[3] = "Speed - " + eiSearch.speed;
                eiFBLines[4] = "Coordinates - " + Math.round(eiSearch.x) + "," + Math.round(eiSearch.y);
                eiFBLines[5] = "AI activity level - " + eiSearch.lvl;
                
                newEntry.className = "info-text";
                
                for (var ei in eiFBLines) {
                  newEntry.appendChild(document.createTextNode(eiFBLines[ei]));
                  newEntry.appendChild(document.createElement("br"));
                  eiFeedback += eiFBLines[ei] + "%";
                }

              } else {
                eiFeedback = !eiArgs[1] ? "Please specify an entity." : "Entity not found";
                newEntry.className = "error-text";
                newEntry.appendChild(document.createTextNode(eiFeedback));
              }
            
              let eiFBLen = eiFBLines.length > 0 ? eiFBLines.length : 1;
            
            screenText.updateText(eiFeedback,h - chatBar.barH - (screenText.fontS*1.5*(eiFBLen - 1)),screenText.fontS*2*(eiFBLen - 1),eiSearch !== 0 && eiArgs[1] ? "#ff4" : "#f44");
            break;
            
          // modify entity
          case "modentity":
            let meArgs = msg.split(" "),
              meTarget = meArgs[1],
              meName = meArgs[2],
              meGender = meArgs[3],
              meSkin = meArgs[4],
              meSpeed = meArgs[5],
              meLevel = meArgs[6],
              meSearch = worldObjs.find(s => s.name === meTarget) || 0,
              meInvalid = false,
              meValidArgCt = 0,
              meFeedback = "Entity modified successfully";
            
            if (meTarget) {
              if (meSearch !== 0) {
                if (meName) {
                  meValidArgCt = 2;
                  // check if new name isnt already used
                  let meNameUsed = worldObjs.find(ne => ne.name === meName) || 0;
                  if (meNameUsed === 0 || meTarget == meNameUsed.name) {
                    if (meGender) {
                      if ((meGender >= 0 && meGender <= 1) || meGender == "male" || meGender == "m" || meGender == "female" || meGender == "f") {
                        ++meValidArgCt;
                        if (meSkin) {
                          if (meSkin >= 0 && meSkin <= 2) {
                            ++meValidArgCt;
                            if (meSpeed) {
                              if (meSpeed >= 0 && meSpeed <= 9) {
                                ++meValidArgCt;
                                if (meLevel) {
                                  if (meLevel >= 0 && meLevel <= 20) {
                                    ++meValidArgCt;
                                    if (meTarget == player.name) {
                                      meInvalid = true;
                                      meFeedback = "Entity must be an NPC to modify AI activity level.";
                                    }
                                  } else {
                                    meInvalid = true;
                                    meFeedback = "Level must be between 0 and 20.";
                                  }
                                }
                              }  else {
                                meInvalid = true;
                                meFeedback = "Speed must be between 0 and 9.";
                              }
                            }
                          } else {
                            meInvalid = true;
                            meFeedback = "Skin must be between 0 and 2.";
                          }
                        }
                      } else {
                        meInvalid = true;
                        meFeedback = "Gender must be 0 or 1. m(ale) and f(emale) are also valid.";
                      }
                    }
                  } else {
                    meInvalid = true;
                    meFeedback = "'" + meNameUsed.name + "' has already been used. Please choose another name.";
                  }
                } else {
                  meInvalid = true;
                  meFeedback = "Please give at least a new name to use";
                }
              } else {
                meInvalid = true;
                meFeedback = "Entity does not exist.";
              }
            } else {
              meInvalid = true;
              meFeedback = "Usage: /modentity <name> <newname> [gender] [skin] [speed] [level]";
            }
            
            if (!meInvalid) {
              let nameLenLimit = 16;
              meSearch.name = meName.length > nameLenLimit ? meName.substr(0,nameLenLimit) : meName;
              if (meValidArgCt >= 3)
                meSearch.gender = meGender == "male" || meGender == "m" ? 0 : (meGender == "female" || meGender == "f" ? 1 : meGender);
              if (meValidArgCt >= 4)
                meSearch.skinTone = meSkin;
              if (meValidArgCt >= 5)
                meSearch.speed = +meSpeed;
              if (meValidArgCt == 6)
                meSearch.lvl = +meLevel;
            }
            
            newEntry.className = !meInvalid ? "" : "error-text";
            newEntry.appendChild(document.createTextNode(meFeedback));
            screenText.updateText(meFeedback,h - chatBar.barH,screenText.fontS*2,!meInvalid ? "#fff" : "#f44");
            break;
          
          // teleport
          case "tp":
            let tpArgs = msg.split(" "),
              tpEntity = tpArgs[1],
              tpAfterEn = tpArgs[2],
              enSearch = worldObjs.find(s => s.name === tpEntity) || 0,
              rel = "~",
              tpOK = false,
              tpFeedback = "",
              tpUsage = "Usage: /tp <name> <x> <y> or <name> <targetname>";
              
            if (tpAfterEn) {
              if (isNaN(tpAfterEn) && tpAfterEn[0] != rel) {
                let tarEntity = tpAfterEn,
                  tEnSearch = worldObjs.find(ts => ts.name === tarEntity) || 0,
                  bothNames = tpEntity && tarEntity ? true : false;
              
                tpOK = bothNames && enSearch !== 0 && tEnSearch !== 0 ? true : false;
                tpFeedback = bothNames ? (enSearch !== 0 ? (tEnSearch !== 0 ? "Teleported " + tpEntity + " to " + tarEntity : "Target entity does not exist") : "Entity does not exist") : tpUsage;
              
                if (tpOK) {
                  enSearch.x = tEnSearch.x;
                  enSearch.y = tEnSearch.y;
                }
              
              } else {
                let tpX = tpAfterEn,
                  tpY = tpArgs[3];
                
                if (tpX && tpY) {
                  // convert relative positions to regular
                  if (tpX[0] == rel) {
                    tpX = +tpX.substr(1,tpX.length - 1) + enSearch.x;
                  } else {
                    tpX = +tpX;
                  }
                  if (tpY[0] == rel) {
                    tpY = +tpY.substr(1,tpY.length - 1) + enSearch.y;
                  } else {
                    tpY = +tpY;
                  }
                }
                
                let cw = canvas.offsetWidth,
                  allValues = tpEntity && (tpX || tpX === 0) && (tpY || tpY === 0) ? true : false,
                  wthnScrn = tpX >= 0 && tpX <= cw && tpY >= 0 && tpY <= h - chatBar.barH ? true : false;
                
                tpOK = enSearch !== 0 && allValues && wthnScrn ? true : false
Copy


Claude does not have the ability to run the code it generates yet.
MR
continue

,
tpFeedback = allValues ? (enSearch !== 0 ? (wthnScrn ? "Teleported " + tpEntity + " to " + Math.round(tpX) + "," + Math.round(tpY) : "Coordinates are out of bounds. X limit is 0-" + cw + ". Y limit is 0-" + (h - chatBar.barH) + ".") : "Entity does not exist.") : tpUsage;
if (tpOK) {
enSearch.x = tpX;
enSearch.y = tpY;
}
}
} else {
tpFeedback = tpUsage;
}


Copy code
        newEntry.className = tpOK ? "" : "error-text";
        newEntry.appendChild(document.createTextNode(tpFeedback));
        screenText.updateText(tpFeedback,h - chatBar.barH,screenText.fontS*2,tpOK ? "#fff" : "#f44");
        break;
      
      // get list of all entities in alphabetical order
      case "who":
        let getEntities = [player.name, claude.name],
          displayEntNames = "Entity list: ";
        
        getEntities.sort(function(a, b){
            if (a.toLowerCase() < b.toLowerCase())
            return -1;
            if (a.toLowerCase() > b.toLowerCase())
            return 1;
            return 0;
        });
        
        for (var de in getEntities) {
          de = +de;
          displayEntNames += (de > 0 ? ", " : "") + getEntities[de];
        }
        
        newEntry.appendChild(document.createTextNode(displayEntNames));
        screenText.updateText(displayEntNames,h - chatBar.barH,screenText.fontS*2);
        break;
      
      // invalid command
      default:
        let cmdErr = "Invalid command. See /help for a list of available commands.";
        
        newEntry.className = "error-text";
        newEntry.appendChild(document.createTextNode(cmdErr));
        screenText.updateText(cmdErr,h - chatBar.barH,screenText.fontS*2,"#f44");
        break;
    }
    
  } else {
    this.msgTimer = this.msgMaxTime;
    newEntry.appendChild(document.createTextNode(this.name + ": " + this.lastMsg));
  }
  // add new line
  chatLog.insertBefore(newEntry, chatLog.childNodes[0]);
  
  // cut off oldest line if at max lines allowed
  if (chatLog.childNodes.length > chatBar.maxLines) {
    chatLog.removeChild(chatLog.getElementsByTagName("span")[chatBar.maxLines]);
  }
}
};
},
structure = function(width, height, x, y, backArea, img, isAnim, frames) {
this.w = width;
this.h = height;
this.x = x;
this.y = y;
this.backArea = backArea || 0;
this.img = img || null;
this.isAnim = img && isAnim ? (typeof isAnim == "boolean" ? true : false) : false;
this.frames = frames || 1;
this.curFrame = 1;
};