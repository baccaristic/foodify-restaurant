import QRCode = require('qrcode-terminal/vendor/QRCode');
import QRErrorCorrectLevel = require('qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel');

export type QrMatrix = boolean[][];

export const createQrMatrix = (
  value: string,
  errorCorrection: keyof typeof QRErrorCorrectLevel = 'M'
): QrMatrix => {
  const qr = new QRCode(-1, QRErrorCorrectLevel[errorCorrection]);
  qr.addData(value);
  qr.make();
  return qr.modules;
};
