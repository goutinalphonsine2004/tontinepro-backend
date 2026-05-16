import * as QRCode from 'qrcode-terminal';

const codeQR = 'TONTINEPRO-TEST-123456';

QRCode.generate(codeQR, { small: true }, (qrcode: string) => {
  console.log('\n=== QR CODE COLLECTEUR ===');
  console.log(qrcode);
  console.log('Code :', codeQR);
  console.log('==========================\n');
});
