// Polyfills for MSW v2 in Jest/Node.js environment
// This file runs before MSW is imported, ensuring all required globals are available

// MessageChannel/MessagePort (required by undici)
// Use lightweight polyfill to avoid leaving open handles in tests
if (typeof globalThis.MessageChannel === 'undefined' || typeof globalThis.MessagePort === 'undefined') {
  class PolyfillMessagePort {
    constructor() {
      this.onmessage = null;
      this._listeners = new Set();
      this._closed = false;
      this._target = null;
    }

    postMessage(message) {
      if (this._closed || !this._target) {
        return;
      }
      queueMicrotask(() => {
        if (this._closed) {
          return;
        }
        const event = { data: message };
        this._target.onmessage?.(event);
        this._target._listeners.forEach((listener) => listener(event));
      });
    }

    addEventListener(type, listener) {
      if (type === 'message') {
        this._listeners.add(listener);
      }
    }

    removeEventListener(type, listener) {
      if (type === 'message') {
        this._listeners.delete(listener);
      }
    }

    start() {}

    close() {
      this._closed = true;
      this._listeners.clear();
    }
  }

  class PolyfillMessageChannel {
    constructor() {
      this.port1 = new PolyfillMessagePort();
      this.port2 = new PolyfillMessagePort();
      this.port1._target = this.port2;
      this.port2._target = this.port1;
    }
  }

  globalThis.MessageChannel = PolyfillMessageChannel;
  globalThis.MessagePort = PolyfillMessagePort;
}

// Streams (needed for fetch body handling)
if (
  typeof globalThis.ReadableStream === 'undefined' ||
  typeof globalThis.WritableStream === 'undefined' ||
  typeof globalThis.TransformStream === 'undefined'
) {
  const { TransformStream, WritableStream, ReadableStream } = require('stream/web');
  globalThis.TransformStream = TransformStream;
  globalThis.WritableStream = WritableStream;
  globalThis.ReadableStream = ReadableStream;
}

// Fetch API globals
// Node.js 22+ has native fetch, but MSW needs it available at import time
// Use undici for consistent behavior across environments
const { fetch, Headers, Request, Response, FormData } = require('undici');
const { Blob, File } = require('buffer');

globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.FormData = FormData;
globalThis.Blob = Blob;
globalThis.File = File;

// BroadcastChannel (required by MSW v2 for WebSocket support)
if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
  };
}
