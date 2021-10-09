/**
 * smc Pocket Calculator v.1.0.0
 *
 * Author: Mihai - Calin Simion
 * Website: htps://smcstylus.github.io
 * Date: 2021 October
 *
 * Features:
 * - interface
 * Simulate the press of the UI buttons when the trackpad is clicked or keyboard keys are pressed/released
 * On/Off button
 * Autoclose (timer) switch. Reset timer on each UI button or keyboard allowed keys pressed.
 * Lights switch
 * Clear screen button
 * Backspace (delete) button
 * Decimal button
 * Numbers buttons
 * Math buttons
 * Autosize entire calculator by changing just the --numPad-size value
 *
 * - display
 * Display history of operations with all the operations. Scrollable area. Autoscroll to last result.
 * Display previous result
 * Display current operation sign
 * Display curent number
 *
 * - others
 * Use UI buttons or keyboard keys
 * Use JavaScript object as memory to store different variables
 * Use custom decimals (0 - 8). To be set in calcMemory constant
 * Math operations: + - * / % sqrt ^
 *
 * Technology:
 * HTML: PUG template engine
 * CSS: CSS3, Bootstrap 5
 * JavaScript: Vanila JS (ES6), jQuery 3.4.1
 * Fonts: FontAvesome5, Urbanist, Quicksand
 *
 */

// Let's secure our data wrapping all in a IIFE - Immediately invoked function execution
(function () {
  /*** ----- Constants ----- ***/
  // c = clear = Clear; p = Power; l = Lights, t = Timer; q = sqrt; enter = =;
  // Added synonym map to eleiminate more conditionals
  const calcConfig = {
    keyUI: {
      operand: ["-", "+", "*", "/"],
      operandAdvanced: ["%", "^", "sqrt"],
      function: ["backspace", "clear", "power"],
      meta: ["=", "."],
    },

    keyBoard: {
      number: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      operand: ["-", "+", "*", "/"],
      operandAdvanced: ["%", "^", "q"],
      function: ["backspace", "delete", "clear", "c", "power", "p"],
      meta: ["=", ".", "enter"],
      switch: ["l", "t"],
      synonym: {
        "%": "%",
        "^": "^",
        q: "sqrt",
        backspace: "backspace",
        delete: "backspace",
        clear: "clear",
        c: "clear",
        power: "power",
        p: "power",
        "=": "=",
        enter: "=",
        ".": ".",
        l: "light",
        t: "timer",
      },
    },

    el: {
      calcBody: ".calc-body",
      powerBtn: "#btn--power",
      padBtn: ".calc-numPad",
      lightSw: "#calcLightSwitch",
      timerSw: "#calcTimerSwitch",
      timerTxt: "#calc-TimerTxt b",
      screen: "#calc-numPadScreen",
      screenEach: ".calc-screen b",
      screenHistory: "#calc-screenHistory ul",
      screenOperation: "#calc-screenOperation b",
      screenOperand: "#calc-screenOperand",
      screenCurent: "#calc-screenCurent b",
    },
  };

  const memoryDefaults = () => {
    return {
      memory: {
        curent: "",
        previous: "",
        operand: "",
        operation: "",
        key_val: "",
        history: {
          lastId: -1,
          items: [],
        },
        key_fired: false,
        ui_button: "",
      },
    };
  };
  const calcMemory = {
    memory: {
      power: false,
    },
    precision: 4, //2,4,6,8
    timers: {
      timeDefault: 180, // 3 min
      name: null,
      timeLeft: 0,
      state: false,
    },
  };

  /*** ----- Variables ----- ***/
  let calcVars;

  function extendOptions() {
    // Create a new object
    let extended = {};
    // Merge the object into the extended object
    let merge = function (obj) {
      for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          // Push each value from `obj` into `extended`
          extended[prop] = obj[prop];
        }
      }
    };
    // Loop through each object and conduct a merge
    for (let i = 0; i < arguments.length; i++) {
      merge(arguments[i]);
    }
    return extended;
  }

  const scrollHistory = (id) =>
    $(calcConfig.el.screenHistory).scrollTop(
      $(calcConfig.el.screenHistory).scrollTop() +
        $(`li[data-id='${id}']`).position().top
    );

  /*** ----- Memory ----- ***/
  // Reset memory
  const resetMemory = () => {
    let m = memoryDefaults();
    calcVars = extendOptions(calcMemory, m);
  };

  // Memory set
  const memorySet = (type, value) => (calcVars.memory[type] = value);
  // Memory get
  const memoryGet = (type) => calcVars.memory[type];
  // Memory set (curent) operation
  const memorySetOperation = (value, add = true) => {
    calcVars.memory.operation =
      (add === true ? calcVars.memory.operation + "" : "") + value;
  };
  // Memory get (curent) operation
  const memoryGetOperation = () => calcVars.memory.operation;
  // Memory set history (of operations)
  const memorySetHistory = (val, operation) => {
    // Generate new ID
    let newId = parseInt(calcVars.memory.history.lastId) + 1;
    // Time now
    time = Date.now();
    // Add new item to history array
    calcVars.memory.history.items.push(
      `{"id":${newId}, "result":${val}, "operation":${operation}, "time":${time}}`
    );
    return newId + "-" + time;
  };

  /*** ----- Screen ----- ***/
  // Display timer
  const displayTimer = (time) => $(calcConfig.el.timerTxt).text(time);
  // Display history operations
  const displayHistory = (id, operation, curScreen) =>
    $(calcConfig.el.screenHistory).append(
      `<li data-id="${id}"><i>${operation}</i>${curScreen}</li>`
    );
  // Clear history operations
  const resetScreenHistory = () => $(calcConfig.el.screenHistory).html("");
  // Display operations
  const displayOperation = (value) =>
    $(calcConfig.el.screenOperation).text(value);
  // Display curent
  const displayCurent = (value) => $(calcConfig.el.screenCurent).text(value);
  // Display operand
  const displayOperand = (value) => $(calcConfig.el.screenOperand).text(value);
  // Clear screen
  const clearScreen = () => {
    $(calcConfig.el.screenEach).each(function () {
      $(this).text("");
    });
    resetScreenHistory();
    displayOperand("");
  };

  // Reset to 0
  const zeroize = () => {
    resetMemory();
    displayCurent(0);
    memorySet("curent", 0);
    memorySet("key_val", 0);
  };

  /*** ----- Buttons ----- ***/
  // Lights switch
  const switchLights = (act = "off") => {
    if (act === "off") {
      // Uncheck the light switch
      $(calcConfig.el.lightSw).prop("checked", false);
      // Remove the lights class
      $(calcConfig.el.calcBody).removeClass("lightOn");
    } else if (act === "on") {
      // Check the light switch
      $(calcConfig.el.lightSw).prop("checked", true);
      // Add the light class
      $(calcConfig.el.calcBody).addClass("lightOn");
    } else {
      // Remove the lights class
      $(calcConfig.el.calcBody).removeClass("lightOn");
      // Add the lights class if is checked
      if ($(calcConfig.el.lightSw).is(":checked")) {
        $(calcConfig.el.calcBody).addClass("lightOn");
      }
    }
  };

  // Timer switch
  const switchTimer = (act = "off") => {
    if (act === "off") {
      $(calcConfig.el.timerSw).prop("checked", false);
      calculatorCountdown("stop");
    } else if (act === "on") {
      $(calcConfig.el.timerSw).prop("checked", true);
      calculatorCountdown("start");
    }
  };

  // Countdown -  autoclose the calculator
  const calculatorCountdown = (act = "start") => {
    let timeObj = calcVars.timers;
    switch (act) {
      default:
      case "start":
        timeObj.timeLeft = timeObj.timeDefault;
        timeObj.state = true;
        timeObj.name = setInterval(function () {
          let t = timeObj.timeLeft;
          if (t <= 0) {
            // Stop the timer
            switchTimer();
            // Remove lights class
            switchLights();
            // Clear screen
            clearScreen();
            // Set power off mode
            calcVars.memory.power = false;
            timeObj.state = false;
            $(calcConfig.el.powerBtn).removeClass("on");
          } else {
            displayTimer(`${t} s`);
          }
          timeObj.timeLeft -= 1;
        }, 1000);
        break;

      case "stop":
        clearInterval(timeObj.name);
        timeObj.state = false;
        displayTimer("");
        break;

      case "reset":
        if (timeObj.state) {
          clearInterval(timeObj.name);
          calculatorCountdown();
        }
        break;
    }
  };

  // Power on the calculator
  const powerOn = () => {
    zeroize();
    calcVars.memory.power = true;
    $(calcConfig.el.powerBtn).addClass("on");
  };

  // Power off the calculator
  const powerOff = () => {
    // Reset memory
    resetMemory();

    calcVars.memory.power = false;
    // Stop timer
    switchTimer("off");
    // Switch lights off
    switchLights();
    // Clear screen
    clearScreen();
    // Set power off mode
    calcVars.memory.power = false;
    $(calcConfig.el.powerBtn).removeClass("on");
  };

  // Power on/off the calculator
  const powerSwitch = () => {
    if (calcVars.memory.power === false) {
      powerOn();
    } else {
      powerOff();
    }
  };

  // Unfocus the button
  const numPad_looseFocus = (target) => target.blur();

  // Return UI key pushed
  const validatePadKey = (e) => {
    //   e.which; //   e.keyCode; //   e.shiftKey; //   e.ctrlKey; //   e.altKey; //   e.key;
    let k = e; //;.key;
    let meta = (k + "").toLowerCase();
    let r = { type: undefined, key: k };
    // Number
    if (/\d/.test(+k)) {
      r.type = "number";
    }
    // Operand
    else if (!!~calcConfig.keyUI.operand.indexOf(k)) {
      r.type = "operand";
    }
    // Operand advanced
    else if (!!~calcConfig.keyUI.operandAdvanced.indexOf(k)) {
      r.type = "operandAdvanced";
    }
    // Function
    else if (!!~calcConfig.keyUI.function.indexOf(k)) {
      r.type = "function";
    }
    // Meta
    else if (!!~calcConfig.keyUI.meta.indexOf(meta)) {
      r.type = "meta";
      r.key = meta;
    }
    // Not allowed
    else {
      r.type = "NAAI"; //not allowed action intercepted :))
    }
    return r;
  };

  const validateKeyboardKey = (e) => {
    //   e.which; //   e.keyCode; //   e.shiftKey; //   e.ctrlKey; //   e.altKey; //   e.key;
    let k = e; //;.key;
    let meta = (k + "").toLowerCase();
    let r = { type: undefined, key: k };
    // Number
    if (/\d/.test(+k)) {
      r.type = "number";
    }
    // Operand
    else if (!!~calcConfig.keyBoard.operand.indexOf(k)) {
      r.type = "operand";
    }
    // Operand advanced
    else if (!!~calcConfig.keyBoard.operandAdvanced.indexOf(meta)) {
      r.type = "operandAdvanced";
      r.key = calcConfig.keyBoard.synonym[meta];
    }
    // Function
    else if (!!~calcConfig.keyBoard.function.indexOf(meta)) {
      r.type = "function";
      r.key = calcConfig.keyBoard.synonym[meta];
    }
    // Meta
    else if (!!~calcConfig.keyBoard.meta.indexOf(meta)) {
      r.type = "meta";
      r.key = calcConfig.keyBoard.synonym[meta];
    }
    // Switch
    else if (!!~calcConfig.keyBoard.switch.indexOf(meta)) {
      r.type = "switch";
      r.key = calcConfig.keyBoard.synonym[meta];
    }
    // Not allowed
    else {
      r.type = "NAAI"; //not allowed action intercepted :))
    }
    return r;
  };

  // Transform data value in JSON object
  const getKeyData = (key) => JSON.parse(key.data("pad").replace(/'/g, '"'));

  /*** ----- Math ----- ***/
  // Return allowed decimals for toFixed() function
  const setPrecision = () => {
    let p = parseInt(calcVars.precision);
    // Set min 0
    if (p < 0) p = 0;
    // Set max 8
    else if (p > 8) p = 8;
    return p;
  };

  // Set number precision regarding the allowed decimals
  const fixDecimals = (nr) => {
    // Return fixed number
    return parseFloat(parseFloat(nr).toFixed(setPrecision()));
  };

  // Build a string of zero characters equal in length with number of allowed decimals
  const genZero = () => {
    let i = 0,
      z = "";
    for (i; i < calcVars.precision; i++) z += "0";
  };

  // Check if last used is and adv operator
  const checkAdv = (val) => {
    let el,
      r = false;
    for (el of calcConfig.keyUI.operandAdvanced) {
      if (val.endsWith(el)) {
        r = true;
        break;
      }
    }
    return r;
  };

  const mathFunctions = (operator, previous, curent) => {
    previous = fixDecimals(previous);
    curent = fixDecimals(curent);

    switch (operator) {
      case "+":
        return previous + curent;
        break;
      case "-":
        return previous - curent;
        break;
      case "*":
        return previous * curent;
        break;
      case "/":
        return previous / curent;
        break;
      case "%":
        return previous / 100;
        break;
      case "sqrt":
        return Math.sqrt(previous);
        break;
    }
  };

  const doMath = () => {
    let curScreen = memoryGet("curent"),
      prevScreen = memoryGet("previous"),
      operand = memoryGet("operand"),
      newVal = 0;

    newVal = mathFunctions(operand, prevScreen, curScreen);
    newVal = fixDecimals(newVal);

    switch (newVal) {
      case newVal > Number.MAX_VALUE:
        newVal = Number.MAX_VALUE;
        break;
      case newVal > Number.MIN_VALUE:
        newVal = Number.MIN_VALUE;
        break;
      case newVal > Number.MAX_SAFE_INTEGER:
        newVal = Number.MAX_SAFE_INTEGER;
        break;
      case newVal < Number.MIN_SAFE_INTEGER:
        newVal = Number.MIN_SAFE_INTEGER;
        break;
    }

    let newFix = fixDecimals(newVal);
    let nAr = `${newFix}`.split(".");
    // Return negative/ positive with decimals.
    // If all decimals are 0 then return Integer
    // If nr = -0 return 0
    return nAr[1] === genZero()
      ? nAr[0].length == 2 && nAr[0][0] == "-" && nAr[0][1] == "0"
        ? 0
        : parseInt(nAr[0])
      : newFix;
  };

  const computeMath = (key) => {
    let curent = memoryGet("curent"),
      operand = memoryGet("operand"),
      newVal = curent;

    // Do math if operand exist and allowed
    if (
      operand !== "" &&
      (calcConfig.keyUI.operand.includes(operand) ||
        calcConfig.keyUI.operandAdvanced.includes(operand))
    ) {
      newVal = doMath();
    }

    // Is not a number display the current number but reset operand
    if (isNaN(newVal)) {
      newVal = curent;
      memorySet("operand", "");
      displayOperand("");
    } else {
      memorySet("operand", key);
      let prev = memoryGetOperation().trim();

      curent = checkAdv(prev) === true && curent == 0 ? "" : curent;
      memorySetOperation(` ${curent} ${key} `);
      displayOperand(key);
    }
    memorySet("key_val", key);

    memorySet("previous", newVal);
    memorySet("curent", 0);
    displayOperation(newVal);
    displayCurent(0);

    // Return for 'enter' function
    return newVal;
  };

  // Numbers
  const computeNumber = (key) => {
    let curent = memoryGet("curent") + "",
      // If curScreen is 0 and don't have a decimal character then replace with typed number
      newVal =
        (parseFloat(curent) == 0 && curent.length < 2 ? "" : curent) + key;

    // Do not type more than max safe integer
    let fVal = parseFloat(newVal);
    if (fVal > Number.MAX_VALUE || fVal > Number.MAX_SAFE_INTEGER) return;

    // Check for e number
    // Nr contain decimals
    if (!!~newVal.indexOf(".")) {
      let nAr = newVal.split(".");
      if (nAr[0].length === 12) {
        newVal = "e" + curent;
      } else if (nAr[0].length > 12) {
        return;
      }
      if (nAr[1].length > setPrecision()) return;
    } else {
      if (newVal.length === 12) {
        newVal = "e" + curent;
      } else if (newVal.length > 12) {
        return;
      }
    }

    memorySet("key_val", key);
    memorySet("curent", newVal);
    displayCurent(newVal);
  };

  // Backspace
  const computeDelete = () => {
    let curent = memoryGet("curent") + "",
      newVal = "",
      len = curent.length;

    // Stop if float number is 0 and have no decimal character
    if (parseFloat(curent) === 0 && len < 2) return;

    memorySet("key_val", "backspace");
    memorySet("operand", null);
    //memorySet("previous", '');

    // Max math nr riched
    if (curent[0] === "e") {
      newVal = curent.substring(1, len);
      memorySet("curent", newVal);
      displayCurent(newVal);
      return;
    }

    // Nr length negative
    if (len <= 2 && curent[0] === "-") {
      newVal = 0;
      memorySet("curent", newVal);
      displayCurent(newVal);
      return;
    }
    // Nr length positive
    else if (len <= 1) {
      newVal = 0;
      memorySet("curent", newVal);
      displayCurent(newVal);
      return;
    } else {
      newVal = curent.substring(0, len - 1);
      memorySet("curent", newVal);
      displayCurent(newVal);
      return;
    }
  };

  // Decimal
  const computeDecimal = () => {
    let curent = memoryGet("curent") + "",
      newVal = "";

    // Stop if decimal character exist
    if (!!~curent.indexOf(".")) return;

    // Add 0 if curent is empty val
    newVal = curent.length < 1 ? "0" : curent + ".";

    memorySet("key_val", ".");
    //memorySet("previous", curScreen);
    memorySet("curent", newVal);
    displayCurent(newVal);
  };

  // Enter
  const computeEnter = () => {
    let curent = memoryGet("curent"),
      operation = "";

    if (memoryGet("key_val") === "=") return;
    curent = computeMath("=");

    memorySet("key", "=");
    memorySet("operand", null);
    memorySet("previous", curent);
    memorySetOperation(curent, true);
    memorySet("curent", 0);

    operation = memoryGetOperation();

    id = memorySetHistory(curent, operation);
    displayHistory(id, operation, curent);
    displayCurent(0);
    displayOperation("");
    displayOperand("");
    memorySetOperation("", false);
    scrollHistory(id);
  };

  const keyFinder = (button_data) => {
    memorySet("ui_button", button_data);
    return $(calcConfig.el.padBtn).find(`[data-pad="${button_data}"]`);
  };

  const keyState = (state = "keyup") => {
    let button = $(calcConfig.el.padBtn).find(
      `[data-pad="${memoryGet("ui_button")}"]`
    );
    if (state === "keydown" && button) {
      button.addClass("hover");
    } else if (state === "keyup" && button) {
      button.removeClass("hover");
      memorySet("ui_button", "");
    }
  };

  const keyActions = (type, key) => {
    // Power switch
    if (key === "power") {
      powerSwitch();
      return;
    }

    // Reset timer if there is any interaction with the calculator
    if (type !== "naai") {
      calculatorCountdown("reset");
    }

    // Buttons actions
    switch (type) {
      // Switch buttons
      case "switch":
        // Countdowd switch
        if (key == "timer") {
          $(calcConfig.el.timerSw).click();
        }
        // Lights switch
        if (key == "light") {
          $(calcConfig.el.lightSw).click();
        }
        break;
      // Clear, Backspace
      case "function":
        // Cl - Clear screen function
        if (key === "clear") {
          // Remove all text
          clearScreen();
          // Clear memory / set to zero main screen
          zeroize();
        }
        // Backspace - Delete function
        else if (key === "backspace") {
          computeDelete();
        }
        return;
        break;

      // Enter, decimal
      case "meta":
        // = (Enter) - enter key
        if (key === "=") {
          computeEnter();
        }
        // Decimal (.) - decimal key
        else if (key === ".") {
          computeDecimal();
        }
        break;

      // Numbers
      case "number":
        computeNumber(key);
        break;

      // +, -, *,  sqrt, % /
      case "operand":
      case "operandAdvanced":
        computeMath(key);
        break;
      // do nothing
      default:
        return;
        break;
    }
  };

  jQuery(document).ready(function ($) {
    /*** ----- UI ----- ***/
    powerOff();

    // Calculator lights switch button actions
    $(calcConfig.el.lightSw).on("click", function (e) {
      if (calcVars.memory.power === false) {
        e.preventDefault();
        return;
      }
      switchLights("switch");
    });

    // Calculator autoclose timer
    $(calcConfig.el.timerSw).on("click", function (e) {
      if (calcVars.memory.power === false) {
        e.preventDefault();
        return;
      }

      if ($(this).is(":checked")) {
        calculatorCountdown();
      } else {
        calculatorCountdown("stop");
      }
    });

    // UI Numpad buttons actions
    $(".numPad-no")
      .on("click", function (e) {
        // Memorize this
        let _this = $(this);

        // Simulate push when click on trackpad
        _this.addClass("hover");
        setTimeout(function () {
          _this.removeClass("hover");
        }, 200);

        // Unfocus the button
        numPad_looseFocus(_this);

        // Get the data of the pressed button
        let keyPressed = getKeyData(_this);

        // Stop execution on power off of all the keys, allowing only the power button
        if (keyPressed?.key !== "power" && calcVars.memory.power === false) {
          e.preventDefault();
          return;
        }

        // Check for allowed keys
        let { type, key } = validatePadKey(keyPressed.key);

        // Do key action
        keyActions(type, key);
      })
      .on("mousedown", function (e) {
        $(this).addClass("hover");
      })
      .on("mouseup mouseleave", function (e) {
        $(this).removeClass("hover");
      });

    /*** ----- Keyboard ----- ***/
    $(window)
      .keydown(function (e) {
        e.preventDefault();
        // Prevent repeating key on continuous press. Allow just 'Shift' key for composed key, eg: shift+=, shift+8...
        if (e.key.toLocaleLowerCase() != "shift") {
          if (!memoryGet("key_fired")) {
            memorySet("key_fired", true);
          } else {
            return;
          }
        }
        // Check for allowed keys
        let keyPressed = validateKeyboardKey(e.key);
        let { type, key } = keyPressed;

        // Stop execution on power off of all the keys, allowing only the power key (p / power)
        if (key !== "power" && calcVars.memory.power === false) {
          e.preventDefault();
          return;
        }

        // Detect UI button related to keyboard pressed key using returned object and data properties of the UI buttons
        let button_data = JSON.stringify(keyPressed).replace(/"/g, "'");
        let button = keyFinder(button_data);

        // Simulate button press when keyboard keys are pressed
        if (button) button.addClass("hover");

        // Do key action
        keyActions(type, key);
      })
      .keyup(function (e) {
        // Reset the fired key variable
        memorySet("key_fired", false);
        // Simulate button release when the keyboard keys are released
        keyState("keyup");
      });

    /*** ----- Simulation ----- ***/
    const renderNewSize = (size) => {
      let csId = "numPadSize",
        // Select style
        csEl = document.getElementById(csId),
        // CSS properties
        css = `:root{--numPad-size: ${size}px;}`,
        // Select HEAD element
        head = document.head || document.getElementsByTagName("head")[0],
        // Create style element
        style = document.createElement("style");
      // Set style ID
      style.setAttribute("id", csId);
      // Remove style if exist
      if (csEl) head.removeChild(csEl);
      // Open style to header
      head.appendChild(style);
      // Write style properties
      if (style.styleSheet) {
        // This is required for IE8 and below.
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    };
    // Control the pocket calculator size
    $("#calcSize").on("change", function () {
      renderNewSize(this.value);
    });
  });
})();
