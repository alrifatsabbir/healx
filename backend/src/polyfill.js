// Polyfill for Node.js 18 compatibility with modern webidl-conversions / whatwg-url on CloudLinux
if (typeof ArrayBuffer !== 'undefined') {
    if (!Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')) {
        Object.defineProperty(ArrayBuffer.prototype, 'resizable', {
            get() { return false; },
            configurable: true,
            enumerable: false,
        });
    }
    if (!Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'maxByteLength')) {
        Object.defineProperty(ArrayBuffer.prototype, 'maxByteLength', {
            get() { return this.byteLength; },
            configurable: true,
            enumerable: false,
        });
    }
}
