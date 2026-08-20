import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const demoUserId = "demo-user";
const bankAccountId = "demo-bank-account";
const statementId = "demo-statement-2026-08";

const merchants = [
  ["merchant-biedronka", "Biedronka"], ["merchant-zabka", "Żabka"],
  ["merchant-lidl", "Lidl"], ["merchant-mcdonalds", "McDonald's"],
  ["merchant-uber", "Uber"], ["merchant-spotify", "Spotify"],
  ["merchant-netflix", "Netflix"], ["merchant-rossmann", "Rossmann"],
  ["merchant-allegro", "Allegro"], ["merchant-ztm", "ZTM Poznań"],
];

const aliases = [
  ["Biedronka", "merchant-biedronka"], ["BIEDRONKA 1829", "merchant-biedronka"],
  ["JERONIMO MARTINS", "merchant-biedronka"], ["JERONIMO MARTINS POLSKA", "merchant-biedronka"],
  ["JERONIMO MARTINS POLSKA S.A.", "merchant-biedronka"], ["ZABKA", "merchant-zabka"],
  ["ZABKA POLSKA", "merchant-zabka"], ["ŻABKA", "merchant-zabka"],
];

const categories = [
  ["category-food", "Food", "food", null],
  ["category-groceries", "Groceries", "groceries", "category-food"],
  ["category-restaurants", "Restaurants", "restaurants", "category-food"],
  ["category-transport", "Transport", "transport", null],
  ["category-taxi", "Taxi", "taxi", "category-transport"],
  ["category-public-transport", "Public transport", "public-transport", "category-transport"],
  ["category-shopping", "Shopping", "shopping", null],
  ["category-subscriptions", "Subscriptions", "subscriptions", null],
  ["category-health-beauty", "Health & beauty", "health-beauty", null],
];

const transactionRows = [
  ["tx-01", "2026-08-15", null, "JERONIMO MARTINS POLSKA S.A.", "84.37", "merchant-biedronka", "category-groceries"],
  ["tx-02", "2026-08-14", "2026-08-15", "ZABKA POLSKA", "18.49", "merchant-zabka", "category-groceries"],
  ["tx-03", "2026-08-13", null, "LIDL 0142 POZNAN", "126.20", "merchant-lidl", "category-groceries"],
  ["tx-04", "2026-08-12", null, "UBER *TRIP", "32.40", "merchant-uber", "category-taxi"],
  ["tx-05", "2026-08-11", null, "MCDONALDS POZNAN", "28.90", "merchant-mcdonalds", "category-restaurants"],
  ["tx-06", "2026-08-10", null, "SPOTIFY P312", "23.99", "merchant-spotify", "category-subscriptions"],
  ["tx-07", "2026-08-09", null, "NETFLIX.COM", "49.99", "merchant-netflix", "category-subscriptions"],
  ["tx-08", "2026-08-08", null, "ROSSMANN 1032", "67.25", "merchant-rossmann", "category-health-beauty"],
  ["tx-09", "2026-08-08", null, "ALLEGRO.PL", "67.25", "merchant-allegro", "category-shopping"],
  ["tx-10", "2026-08-07", null, "ZTM POZNAN BILET", "15.00", "merchant-ztm", "category-public-transport"],
  ["tx-11", "2026-08-06", null, "BIEDRONKA 1829", "45.22", "merchant-biedronka", "category-groceries"],
  ["tx-12", "2026-08-05", null, "ŻABKA", "12.30", "merchant-zabka", "category-groceries"],
  ["tx-13", "2026-08-04", null, "UBER *TRIP", "26.70", "merchant-uber", "category-taxi"],
  ["tx-14", "2026-08-03", null, "LIDL POLSKA", "91.76", "merchant-lidl", "category-groceries"],
  ["tx-15", "2026-08-02", null, "MCDONALDS POZNAN", "36.40", "merchant-mcdonalds", "category-restaurants"],
  ["tx-16", "2026-08-01", null, "PAYU ALLEGRO", "159.90", "merchant-allegro", "category-shopping"],
  ["tx-17", "2026-07-31", null, "ROSSMANN 1032", "21.50", "merchant-rossmann", "category-health-beauty"],
  ["tx-18", "2026-07-30", null, "ZTM POZNAN", "45.00", "merchant-ztm", "category-public-transport"],
];

const receiptRows = [
  ["receipt-01", "Biedronka", "merchant-biedronka", "2026-08-15", "84.37"],
  ["receipt-02", "Żabka", "merchant-zabka", "2026-08-13", "18.49"],
  ["receipt-03", "Lidl", "merchant-lidl", "2026-08-13", "126.20"],
  ["receipt-04", "McDonald's", "merchant-mcdonalds", "2026-08-11", "28.90"],
  ["receipt-05", "Drogeria", null, "2026-08-08", "67.25"],
  ["receipt-06", "Local bakery", null, "2026-08-16", "17.40"],
];

async function seed() {
  const passwordHash = await argon2.hash("SpendLensDemo123!", { type: argon2.argon2id });
  await prisma.$transaction(async (database) => {
    // Only the fixed demo identity is replaced; no other user's data is touched.
    await database.user.deleteMany({ where: { id: demoUserId } });
    await database.merchant.createMany({ data: merchants.map(([id, name]) => ({ id, name, normalizedName: name.toLocaleUpperCase("pl-PL") })), skipDuplicates: true });
    await database.merchantAlias.createMany({ data: aliases.map(([value, merchantId], index) => ({ id: `alias-${index + 1}`, value, normalizedValue: value.toLocaleUpperCase("pl-PL").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim(), merchantId })), skipDuplicates: true });
    for (const [id, name, slug, parentId] of categories) {
      await database.category.upsert({ where: { id }, update: { name, slug, parentId }, create: { id, name, slug, parentId } });
    }
    await database.user.create({ data: { id: demoUserId, email: "demo@spendlens.local", name: "Demo User", passwordHash } });
    await database.bankAccount.create({ data: { id: bankAccountId, userId: demoUserId, name: "Everyday account ·•• 4821", bankName: "Demo Bank Polska", currency: "PLN" } });
    await database.statement.create({ data: { id: statementId, userId: demoUserId, bankAccountId, fileName: "statement-2026-08.pdf", fileKey: "private/demo-user/statements/2026-08", periodFrom: new Date("2026-07-30T00:00:00Z"), periodTo: new Date("2026-08-15T00:00:00Z"), status: "PROCESSED" } });
    await database.transaction.createMany({ data: transactionRows.map(([id, transactionDate, postingDate, merchantRaw, amount, merchantId, categoryId]) => ({ id, userId: demoUserId, statementId, bankAccountId, transactionDate: new Date(`${transactionDate}T00:00:00Z`), postingDate: postingDate ? new Date(`${postingDate}T00:00:00Z`) : null, merchantRaw, amount, currency: "PLN", merchantId, categoryId })) });
    await database.receipt.createMany({ data: receiptRows.map(([id, merchantRaw, merchantId, receiptDate, total]) => ({ id, userId: demoUserId, fileName: `${id}.jpg`, fileKey: `private/demo-user/receipts/${id}`, merchantRaw, merchantId, receiptDate: new Date(`${receiptDate}T00:00:00Z`), total, currency: "PLN", status: "PROCESSED" })) });
    await database.receiptItem.createMany({ data: [
      { id: "item-01", receiptId: "receipt-01", nameRaw: "Mleko 2%", nameNormalized: "Milk 2%", quantity: "2", unitPrice: "3.49", totalPrice: "6.98", categoryId: "category-groceries" },
      { id: "item-02", receiptId: "receipt-01", nameRaw: "Warzywa", nameNormalized: "Vegetables", totalPrice: "24.18", categoryId: "category-groceries" },
      { id: "item-03", receiptId: "receipt-02", nameRaw: "Kanapka", nameNormalized: "Sandwich", totalPrice: "12.99", categoryId: "category-groceries" },
      { id: "item-04", receiptId: "receipt-03", nameRaw: "Zakupy spożywcze", nameNormalized: "Groceries", totalPrice: "126.20", categoryId: "category-groceries" },
      { id: "item-05", receiptId: "receipt-04", nameRaw: "McZestaw", nameNormalized: "Meal", totalPrice: "28.90", categoryId: "category-restaurants" },
      { id: "item-06", receiptId: "receipt-05", nameRaw: "Kosmetyki", nameNormalized: "Cosmetics", totalPrice: "67.25", categoryId: "category-health-beauty" },
      { id: "item-07", receiptId: "receipt-06", nameRaw: "Pieczywo", nameNormalized: "Bread", totalPrice: "17.40", categoryId: "category-groceries" },
    ] });
    await database.receiptMatch.createMany({ data: [
      { id: "match-01", receiptId: "receipt-01", transactionId: "tx-01", score: "1", amountScore: "1", dateScore: "1", merchantScore: "1", status: "AUTO_MATCHED" },
      { id: "match-02", receiptId: "receipt-02", transactionId: "tx-02", score: "0.9625", amountScore: "1", dateScore: "0.85", merchantScore: "1", status: "AUTO_MATCHED" },
      { id: "match-03", receiptId: "receipt-03", transactionId: "tx-03", score: "1", amountScore: "1", dateScore: "1", merchantScore: "1", status: "AUTO_MATCHED" },
      { id: "match-04", receiptId: "receipt-04", transactionId: "tx-05", score: "1", amountScore: "1", dateScore: "1", merchantScore: "1", status: "CONFIRMED" },
      { id: "match-05", receiptId: "receipt-05", transactionId: "tx-08", score: "0.75", amountScore: "1", dateScore: "1", merchantScore: "0", status: "PENDING_REVIEW" },
      { id: "match-06", receiptId: "receipt-05", transactionId: "tx-09", score: "0.75", amountScore: "1", dateScore: "1", merchantScore: "0", status: "PENDING_REVIEW" },
    ] });
  });
}

seed().catch((error) => {
  console.error("Demo database seeding failed", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
