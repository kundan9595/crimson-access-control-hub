// Browser polyfills for Node.js modules used by Supabase
(function() {
  'use strict';
  
  // Ensure global exists
  if (typeof global === 'undefined') {
    window.global = window.globalThis || window;
  }
  
  // Ensure process exists with minimal required properties
  if (typeof process === 'undefined') {
    window.process = {
      env: {},
      version: 'v18.0.0',
      versions: {},
      platform: 'browser',
      nextTick: function(callback) {
        setTimeout(callback, 0);
      },
      cwd: function() {
        return '/';
      },
      browser: true
    };
  }
  
  // Ensure Buffer exists (basic implementation)
  if (typeof Buffer === 'undefined') {
    window.Buffer = {
      from: function(data, encoding) {
        if (typeof data === 'string') {
          return new TextEncoder().encode(data);
        }
        return data;
      },
      isBuffer: function(obj) {
        return obj instanceof Uint8Array;
      }
    };
  }
  
  // Polyfill for util.inherits if needed
  if (typeof window.util === 'undefined') {
    window.util = {
      inherits: function(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
    };
  }
  
  // Basic events polyfill if needed
  if (typeof window.events === 'undefined') {
    window.events = {
      EventEmitter: function() {
        this._events = {};
      }
    };
    
    window.events.EventEmitter.prototype = {
      on: function(event, listener) {
        if (!this._events[event]) {
          this._events[event] = [];
        }
        this._events[event].push(listener);
      },
      emit: function(event) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (this._events[event]) {
          this._events[event].forEach(function(listener) {
            listener.apply(null, args);
          });
        }
      },
      removeListener: function(event, listener) {
        if (this._events[event]) {
          var index = this._events[event].indexOf(listener);
          if (index !== -1) {
            this._events[event].splice(index, 1);
          }
        }
      }
    };
  }
  
  console.log('✅ Browser polyfills loaded successfully');
})();
