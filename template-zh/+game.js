(function() {
  var game;
  var ui;

  var DateOptions = {hour: 'numeric',
                 minute: 'numeric',
                 second: 'numeric',
                 year: 'numeric',
                 month: 'short',
                 day: 'numeric' };

  var main = function(dendryUI) {
    ui = dendryUI;
    game = ui.game;

    window.getMoonInfo = function() {
    var now = new Date();

    // Convert current time to Julian Date
    var year = now.getUTCFullYear();
    var month = now.getUTCMonth() + 1;
    var day =
        now.getUTCDate() +
        (now.getUTCHours() +
         now.getUTCMinutes() / 60 +
         now.getUTCSeconds() / 3600) / 24;

    var y = year;
    var m = month;

    if (m <= 2) {
        y -= 1;
        m += 12;
    }

    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);

    var julianDate =
        Math.floor(365.25 * (y + 4716)) +
        Math.floor(30.6001 * (m + 1)) +
        day + B - 1524.5;

    // Known new moon: 2000-01-06 18:14 UTC
    var knownNewMoon = 2451550.25972;

    // Length of one lunar synodic cycle
    var synodicMonth = 29.530588853;

    // Moon's age in days since the last new moon
    var moonAge = (julianDate - knownNewMoon) % synodicMonth;

    if (moonAge < 0) {
        moonAge += synodicMonth;
    }

    // Number of days before/after the exact phase that
    // counts as Dark Moon or Bright Moon.
    var phaseWindow = 2.5;

    var fullMoon = synodicMonth / 2;

    // How many days until the next Dark Moon begins?
    var daysUntilDark;

    if (moonAge <= phaseWindow) {
        // Already in Dark Moon
        daysUntilDark = 0;
    } else {
        daysUntilDark = synodicMonth - moonAge - phaseWindow;

        if (daysUntilDark < 0) {
            daysUntilDark = 0;
        }
    }

    // How many days until the next Bright Moon begins?
    var daysUntilBright;

    if (moonAge >= fullMoon - phaseWindow &&
        moonAge <= fullMoon + phaseWindow) {
        // Already in Bright Moon
        daysUntilBright = 0;
    } else if (moonAge < fullMoon - phaseWindow) {
        daysUntilBright = (fullMoon - phaseWindow) - moonAge;
    } else {
        daysUntilBright =
            (synodicMonth - moonAge) +
            (fullMoon - phaseWindow);
    }

    // Determine current moon type
    var type;

    if (moonAge <= phaseWindow ||
        moonAge >= synodicMonth - phaseWindow) {
        type = "dark_moon";
    } else if (Math.abs(moonAge - fullMoon) <= phaseWindow) {
        type = "bright_moon";
    } else {
        type = "normal_moon";
    }

    // If we're already in a special moon, the next one
    // we're interested in is the *other* one.
    var daysUntilNext;

    if (type === "bright_moon") {
        daysUntilNext = Math.ceil(daysUntilDark);
    } else if (type === "dark_moon") {
        daysUntilNext = Math.ceil(daysUntilBright);
    } else {
        daysUntilNext = Math.ceil(
            Math.min(daysUntilBright, daysUntilDark)
        );
    }

    return {
        type: type,
        nextType: type === "bright_moon"
            ? "dark_moon"
            : type === "dark_moon"
                ? "bright_moon"
                : (daysUntilBright <= daysUntilDark
                    ? "bright_moon"
                    : "dark_moon"),
        daysUntilNext: daysUntilNext
    };
};

window.setCombatHand = function(active) {
  const engine = window.dendryUI.dendryEngine;

  if (!engine._normalDisplayChoices) {
    engine._normalDisplayChoices = engine.displayChoices;
  }

  if (!active) {
    engine.displayChoices = engine._normalDisplayChoices;

    const oldHand = document.getElementById('combat-hand');
    if (oldHand) {
      oldHand.remove();
    }

    return;
  }

  engine.displayChoices = function() {
    const choices = this.getCurrentChoices();

    if (!choices) {
      return this;
    }

    const content = document.getElementById('content');

    if (!content) {
      return this;
    }

    // Remove any combat hand left over from a previous display.
    const oldHand = document.getElementById('combat-hand');
    if (oldHand) {
      oldHand.remove();
    }

    const combatHand = document.createElement('div');
    combatHand.id = 'combat-hand';
    combatHand.className = 'hand';

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const choiceScene = this.game.scenes[choice.id];

      if (!choiceScene) {
        continue;
      }

      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'card-in-hand';

      const card = document.createElement('a');
      card.className = 'card';
      card.href = '#';

      if (choiceScene.cardImage) {
        const image = document.createElement('img');
        image.className = 'card-img';
        image.src = choiceScene.cardImage;
        image.alt = choice.title || '';
        card.appendChild(image);
      }

      const caption = document.createElement('span');
      caption.className = 'card-caption';
      // choice.title 可能是富文本数组(含 insert/emphasis),必须经 contentToHTML
      // 转换后再插入;直接赋 textContent 会把数组强制成 "a,b," 的形式。
      const captionTitle = choice.title || choice.id;
      if (typeof captionTitle === 'string') {
        caption.textContent = captionTitle;
      } else {
        caption.innerHTML = window.dendryUI.contentToHTML.convertLine(captionTitle);
      }
      card.appendChild(caption);

      card.addEventListener('click', function(event) {
        event.preventDefault();

        if (!choice.canChoose) {
          return;
        }

        engine.choose(i);
      });

      cardWrapper.appendChild(card);
      combatHand.appendChild(cardWrapper);
    }

    content.appendChild(combatHand);

    return this;
  };
};

window.setSworceryUI = function(active) {
  const content = document.getElementById('content');

  if (content) {
    content.style.backgroundColor = active ? '#d8c9df' : '';
  }
};

    // Add your custom code here.
  };

  var TITLE = "社会民主:另一段历史" + '_' + "Autumn Chen";

  // the url is a link to game.json
  // TODO; 
  window.loadMod = function(url) {
  };

  window.showStats = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('library')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('library');
    }
  };
  
  window.showOptions = function() {
      var save_element = document.getElementById('options');
      window.populateOptions();
      save_element.style.display = "block";
      if (!save_element.onclick) {
          save_element.onclick = function(evt) {
              var target = evt.target;
              var save_element = document.getElementById('options');
              if (target == save_element) {
                  window.hideOptions();
              }
          };
      }
  };

  window.hideOptions = function() {
      var save_element = document.getElementById('options');
      save_element.style.display = "none";
  };

  window.disableBg = function() {
      window.dendryUI.disable_bg = true;
      document.body.style.backgroundImage = 'none';
      window.dendryUI.saveSettings();
  };

  window.enableBg = function() {
      window.dendryUI.disable_bg = false;
      window.dendryUI.setBg(window.dendryUI.dendryEngine.state.bg);
      window.dendryUI.saveSettings();
  };

  window.disableAnimate = function() {
      window.dendryUI.animate = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimate = function() {
      window.dendryUI.animate = true;
      window.dendryUI.saveSettings();
  };

  window.disableAnimateBg = function() {
      window.dendryUI.animate_bg = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimateBg = function() {
      window.dendryUI.animate_bg = true;
      window.dendryUI.saveSettings();
  };

  window.disableAudio = function() {
      window.dendryUI.toggle_audio(false);
      window.dendryUI.saveSettings();
  };

  window.enableAudio = function() {
      window.dendryUI.toggle_audio(true);
      window.dendryUI.saveSettings();
  };

  window.enableDarkmode = function() {
      window.dendryUI.dark_mode = true;
      document.body.classList.add('dark-mode');
      window.dendryUI.saveSettings();
  };
  window.disableDarkmode = function() {
      window.dendryUI.dark_mode = false;
      document.body.classList.remove('dark-mode');
      window.dendryUI.saveSettings();
  };


  // populates the checkboxes in the options view
  window.populateOptions = function() {
    var disable_bg = window.dendryUI.disable_bg;
    var animate = window.dendryUI.animate;
    var disable_audio = window.dendryUI.disable_audio;
    if (disable_bg) {
        $('#backgrounds_no')[0].checked = true;
    } else {
        $('#backgrounds_yes')[0].checked = true;
    }
    if (animate) {
        $('#animate_yes')[0].checked = true;
    } else {
        $('#animate_no')[0].checked = true;
    }
    if (disable_audio) {
        $('#audio_no')[0].checked = true;
    } else {
        $('#audio_yes')[0].checked = true;
    }
    if (window.dendryUI.dark_mode) {
        $('#dark_mode_yes')[0].checked = true;
    } else {
        $('#dark_mode_no')[0].checked = true;
    }
  };

  // 显示层映射:运行时状态值(人名 / 党派代码 / 占位符)一律译为中文。
  // 引擎把 insert 求值结果作为独立字符串片段交给本函数,故可做精确整串匹配,
  // 不会误伤正文散文。值必须与 .dry 中的赋值逐字一致(含 'Streseman' 等原版拼误)。
  window.__zhValueMap = {
    // ---- 党派代码 ----
    SPD: '社民党', KPD: '共产党', NSDAP: '纳粹党', DNVP: '国家人民党',
    DVP: '人民党', DDP: '德国民主党', DStP: '德国国家党', RDP: '激进民主党',
    BVP: '巴伐利亚人民党', BAP: '巴伐利亚工人党', Z: '中央党',
    VONC: '不信任联盟', I: '无党籍',
    // ---- 人名(内阁席位 / 总统 / 党魁 / 候选人)----
    Ebert: '艾伯特', Hindenburg: '兴登堡', Marx: '马克思', Hergt: '赫尔格特',
    Luther: '路德', Müller: '米勒', Brüning: '布吕宁', Braun: '布劳恩',
    Wirth: '维尔特', Papen: '帕彭', Schleicher: '施莱谢尔', Hitler: '希特勒',
    Seldte: '泽尔特', Scholz: '朔尔茨', Groener: '格勒纳', Gessler: '格斯勒',
    'Koch-Weser': '科赫-韦泽', Külz: '屈尔茨', Bracht: '布拉赫特',
    Wels: '韦尔斯', Schumacher: '舒马赫', Breitscheid: '布赖特沙伊德',
    Juchacz: '尤哈茨', Seeckt: '泽克特', Bumke: '布姆克',
    'Bumke (acting)': '布姆克(代理)', Großmann: '格罗斯曼', Simons: '西蒙斯',
    'Simons (acting)': '西蒙斯(代理)', Thälmann: '台尔曼', Göring: '戈林',
    Goring: '戈林', Münzenberg: '明岑贝格', Munzenberg: '明岑贝格',
    Adenauer: '阿登纳', Einstein: '爱因斯坦', Eckener: '埃克纳', Mann: '曼',
    Ossietzky: '奥西茨基', Kaas: '卡斯', Joos: '约斯',
    Stegerwald: '施特格瓦尔德', Hilferding: '希法亭', Leber: '勒贝尔',
    Wissell: '维塞尔', Wissel: '维塞尔', Radbruch: '拉德布鲁赫',
    Severing: '泽韦林', Schacht: '沙赫特', Hugenberg: '胡根贝格',
    Pieck: '皮克', Ulbricht: '乌布利希', Eberlein: '埃伯莱因',
    Goebbels: '戈培尔', Baade: '巴德', Dietrich: '迪特里希',
    Brauns: '布劳恩斯', Curtius: '库尔提乌斯', Moldenhauer: '莫尔登豪尔',
    Köhler: '克勒', Schiele: '席勒', Schlieben: '施利本', Schmidt: '施密特',
    Neuhaus: '诺伊豪斯', Frenken: '弗伦肯', Hermes: '赫尔梅斯',
    Fillak: '菲拉克', Fischer: '菲舍尔', 'von Kanitz': '冯·卡尼茨',
    'von Keudell': '冯·克伊德尔', "Streseman": '施特雷泽曼', Stresemann: '施特雷泽曼',
    // ---- 占位 / 特殊值 ----
    'N/A': '空缺', Empty: '空缺', Nobody: '无人', Conciliators: '调和派',
    '&nbsp;': ''
  };

  // This function allows you to modify the text before it's displayed.
  // E.g. wrapping chat-like messages in spans.
  window.displayText = function(text) {
      if (typeof text === 'string' && window.__zhValueMap[text] !== undefined) {
          return window.__zhValueMap[text];
      }
      return text;
  };

  // This function allows you to do something in response to signals.
  window.handleSignal = function(signal, event, scene_id) {
  };
  
  // This function runs on a new page. Right now, this auto-saves.
  window.onNewPage = function() {
    var scene = window.dendryUI.dendryEngine.state.sceneId;
    if (scene != 'root' && !window.justLoaded) {
        window.dendryUI.autosave();
    }
    if (window.justLoaded) {
        window.justLoaded = false;
    }
  };

  // TODO: have some code for tabbed sidebar browsing.
  window.updateSidebar = function() {
      $('#qualities').empty();
      var scene = dendryUI.game.scenes[window.statusTab];
      dendryUI.dendryEngine._runActions(scene.onArrival);
      var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
      $('#qualities').append(dendryUI.contentToHTML.convert(displayContent));
  };

  window.changeTab = function(newTab, tabId) {
      if (tabId == 'poll_tab' && dendryUI.dendryEngine.state.qualities.historical_mode) {
          window.alert('历史模式下无法查看民调。');
          return;
      }
      var tabButton = document.getElementById(tabId);
      var tabButtons = document.getElementsByClassName('tab_button');
      for (i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(' active', '');
      }
      tabButton.className += ' active';
      window.statusTab = newTab;
      window.updateSidebar();
  };

  window.onDisplayContent = function() {
      window.updateSidebar();
  };

  /*
   * This function copied from the code for Infinite Space Battle Simulator
   *
   * quality - a number between max and min
   * qualityName - the name of the quality
   * max and min - numbers
   * colors - if true/1, will use some color scheme - green to yellow to red for high to low
   * */
  window.generateBar = function(quality, qualityName, max, min, colors) {
      var bar = document.createElement('div');
      bar.className = 'bar';
      var value = document.createElement('div');
      value.className = 'barValue';
      var width = (quality - min)/(max - min);
      if (width > 1) {
          width = 1;
      } else if (width < 0) {
          width = 0;
      }
      value.style.width = Math.round(width*100) + '%';
      if (colors) {
          value.style.backgroundColor = window.probToColor(width*100);
      }
      bar.textContent = qualityName + ': ' + quality;
      if (colors) {
          bar.textContent += '/' + max;
      }
      bar.appendChild(value);
      return bar;
  };


  window.justLoaded = true;
  window.statusTab = "status";
  window.dendryModifyUI = main;
  console.log("Modifying stats: see dendryUI.dendryEngine.state.qualities");

  window.onload = function() {
    window.dendryUI.loadSettings();
    window.pinnedCardsDescription = "顾问卡 — 每 6 个月仅可使用一次行动。";
  };

}());
