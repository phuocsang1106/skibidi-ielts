import { prisma } from "@/lib/db";

export type PaymentBankSetting = {
  configured: boolean;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  qrTemplate?: string;
  qrUrlTemplate?: string;
};

export async function getPaymentBankSetting(): Promise<PaymentBankSetting> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "PAYMENT_BANK" } });
  if (!setting || typeof setting.value !== "object" || setting.value === null || Array.isArray(setting.value)) return { configured: false, bankName: "", accountNumber: "", accountName: "" };
  const v = setting.value as Record<string, unknown>;
  return {
    configured: v.configured === true,
    bankName: typeof v.bankName === "string" ? v.bankName : "",
    bankCode: typeof v.bankCode === "string" ? v.bankCode : undefined,
    accountNumber: typeof v.accountNumber === "string" ? v.accountNumber : "",
    accountName: typeof v.accountName === "string" ? v.accountName : "",
    qrTemplate: typeof v.qrTemplate === "string" ? v.qrTemplate : undefined,
    qrUrlTemplate: typeof v.qrUrlTemplate === "string" ? v.qrUrlTemplate : undefined
  };
}

export function paymentQrUrl(setting: PaymentBankSetting, amount: number, reference: string) {
  if (!setting.configured || !setting.qrUrlTemplate) return null;
  const replacements: Record<string,string> = {
    "{bankCode}": encodeURIComponent(setting.bankCode || ""),
    "{accountNumber}": encodeURIComponent(setting.accountNumber),
    "{accountName}": encodeURIComponent(setting.accountName),
    "{amount}": String(amount),
    "{reference}": encodeURIComponent(reference)
  };
  return Object.entries(replacements).reduce((url,[token,value])=>url.replaceAll(token,value),setting.qrUrlTemplate);
}
