import {
  buildVietQrUrl,
  isVietQrConfigured,
  vietQrConfig,
} from '../src/config/payment';

test('does not produce a payment QR for an unconfigured restaurant account', () => {
  expect(isVietQrConfigured()).toBe(false);
  expect(buildVietQrUrl(54000, 4, 'invoice-4')).toBeUndefined();
});

test('builds a transfer QR URL with the bill amount and table reference', () => {
  vietQrConfig.bankBin = '970436';
  vietQrConfig.accountNumber = '123456789';
  vietQrConfig.accountName = 'NGUYEN VAN A';

  try {
    const qrUrl = buildVietQrUrl(54000, 4, 'invoice-4');
    if (!qrUrl) {
      throw new Error('Expected the configured payment QR URL.');
    }
    const parsedUrl = new URL(qrUrl);

    expect(parsedUrl.hostname).toBe('img.vietqr.io');
    expect(parsedUrl.searchParams.get('amount')).toBe('54000');
    expect(parsedUrl.searchParams.get('addInfo')).toBe(
      'Thanh toan ban 04 invoice-4',
    );
    expect(parsedUrl.searchParams.get('accountName')).toBe('NGUYEN VAN A');
  } finally {
    vietQrConfig.bankBin = '';
    vietQrConfig.accountNumber = '';
    vietQrConfig.accountName = '';
  }
});
