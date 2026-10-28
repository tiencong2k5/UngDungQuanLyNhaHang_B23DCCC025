export const vietQrConfig = {
  bankBin: '',
  accountNumber: '',
  accountName: '',
};

export function isVietQrConfigured() {
  return Boolean(
    vietQrConfig.bankBin.trim() &&
      vietQrConfig.accountNumber.trim() &&
      vietQrConfig.accountName.trim(),
  );
}

export function buildVietQrUrl(
  amount: number,
  tableNumber: number,
  invoiceId: string,
) {
  if (!isVietQrConfigured()) {
    return undefined;
  }

  const addInfo = `Thanh toan ban ${String(tableNumber).padStart(
    2,
    '0',
  )} ${invoiceId}`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: vietQrConfig.accountName,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(
    vietQrConfig.bankBin,
  )}-${encodeURIComponent(
    vietQrConfig.accountNumber,
  )}-compact2.png?${params.toString()}`;
}
