class ChannelService {
  constructor() {
    this.pluginKey = 'e1a0c008-c134-41ef-9961-7195beb7b165';
  }

  loadScript() {
    var w = window;
    if (w.ChannelIO) {
      return;
    }
    var ch = function() {
      ch.c(arguments);
    };
    ch.q = [];
    ch.c = function(args) {
      ch.q.push(args);
    };
    w.ChannelIO = ch;
    
    function l() {
      if (w.ChannelIOInitialized) {
        return;
      }
      w.ChannelIOInitialized = true;
      var s = document.createElement("script");
      s.type = "text/javascript";
      s.async = true;
      s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
      var x = document.getElementsByTagName("script")[0];
      if (x && x.parentNode) {
        x.parentNode.insertBefore(s, x);
      } else {
        document.head.appendChild(s);
      }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
      l();
    } else {
      w.addEventListener("DOMContentLoaded", l);
      w.addEventListener("load", l);
    }
  }

  boot() {
    this.loadScript();
    if (window.ChannelIO) {
      window.ChannelIO('boot', {
        pluginKey: this.pluginKey,
      });
    }
  }

  shutdown() {
    if (window.ChannelIO) {
      window.ChannelIO('shutdown');
    }
  }
}

export const channelService = new ChannelService();
