declare module 'qrcode-terminal/vendor/QRCode' {
  interface QRCode {
    modules: boolean[][];
    addData(data: string): void;
    make(): void;
    getModuleCount(): number;
  }

  const QRCode: {
    new (typeNumber: number, errorCorrectLevel: number): QRCode;
  };

  export = QRCode;
}

declare module 'qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel' {
  const levels: Record<string, number>;
  export = levels;
}
