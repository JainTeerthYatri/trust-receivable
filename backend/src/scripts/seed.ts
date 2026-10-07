import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";
import { Invoice } from "../models/Invoice.js";
import { FinancingRequest } from "../models/FinancingRequest.js";
import { Payment } from "../models/Payment.js";
import { Dispute } from "../models/Dispute.js";
import { Notification } from "../models/Notification.js";
import { fingerprintInvoice } from "../utils/hash.js";
import { detectDuplicate } from "../ai/duplicate.js";
import { computeReceivableTrustScore } from "../ai/riskEngine.js";
import { logger } from "../utils/logger.js";
import type { LifecycleStatus } from "../types/domain.js";

const DEMO_PASSWORD = "Demo@12345";

export async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) {
    logger.info("Database already has users; skip auto-seed");
    return;
  }
  await seedAll();
}

export async function seedAll() {
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Invoice.deleteMany({}),
    FinancingRequest.deleteMany({}),
    Payment.deleteMany({}),
    Dispute.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const abc = await Company.create({
    legalName: "ABC Precision Manufacturing Private Limited",
    businessName: "ABC Manufacturing",
    GSTIN: "27AABCU9603R1ZM",
    UdyamNumber: "UDYAM-MH-26-0123456",
    PAN: "AABCU9603R",
    address: "Plot 42, MIDC Bhosari",
    city: "Pune",
    state: "Maharashtra",
    industry: "Industrial manufacturing",
    verificationStatus: "VERIFIED",
    trustScore: 91,
    onTimePaymentRate: 0.94,
    historicInvoiceCount: 48
  });
  const steel = await Company.create({
    legalName: "Narmada Steel Components LLP",
    businessName: "Narmada Steel",
    GSTIN: "24AAHFN2288P1Z5",
    UdyamNumber: "UDYAM-GJ-03-0099881",
    PAN: "AAHFN2288P",
    address: "GIDC Vatva, Phase II",
    city: "Ahmedabad",
    state: "Gujarat",
    industry: "Metals",
    verificationStatus: "VERIFIED",
    trustScore: 84
  });
  const knit = await Company.create({
    legalName: "Coimbatore KnitWorks Private Limited",
    businessName: "KnitWorks",
    GSTIN: "33AAGCK4411Q1Z2",
    UdyamNumber: "UDYAM-TN-02-0044556",
    PAN: "AAGCK4411Q",
    address: "SIDCO Industrial Estate",
    city: "Coimbatore",
    state: "Tamil Nadu",
    industry: "Textiles",
    verificationStatus: "PENDING",
    trustScore: 62
  });

  const xyz = await Company.create({
    legalName: "XYZ Industries Limited",
    businessName: "XYZ Industries",
    GSTIN: "29AAACX1234F1Z7",
    UdyamNumber: "",
    PAN: "AAACX1234F",
    address: "Whitefield Industrial Area",
    city: "Bengaluru",
    state: "Karnataka",
    industry: "Automotive OEM",
    verificationStatus: "VERIFIED",
    trustScore: 93,
    onTimePaymentRate: 0.96
  });
  const infra = await Company.create({
    legalName: "Godavari Infra Projects Limited",
    businessName: "Godavari Infra",
    GSTIN: "36AADCG7788K1Z1",
    PAN: "AADCG7788K",
    address: "HITEC City",
    city: "Hyderabad",
    state: "Telangana",
    industry: "Infrastructure",
    verificationStatus: "VERIFIED",
    trustScore: 80
  });
  const retail = await Company.create({
    legalName: "Sagar Retail Distribution Private Limited",
    businessName: "Sagar Retail",
    GSTIN: "07AALCS9900B1Z9",
    PAN: "AALCS9900B",
    address: "Okhla Phase III",
    city: "New Delhi",
    state: "Delhi",
    industry: "Retail distribution",
    verificationStatus: "VERIFIED",
    trustScore: 74
  });

  const capital = await Company.create({
    legalName: "Meru Working Capital Partners",
    businessName: "Meru Capital",
    GSTIN: "27AAMCM5522L1Z8",
    PAN: "AAMCM5522L",
    address: "BKC, Bandra East",
    city: "Mumbai",
    state: "Maharashtra",
    industry: "NBFC / working capital (demo counterparty)",
    verificationStatus: "VERIFIED",
    trustScore: 88
  });
  const river = await Company.create({
    legalName: "Riverbank Trade Finance",
    businessName: "Riverbank Finance",
    GSTIN: "27AABCR4410C1Z3",
    PAN: "AABCR4410C",
    address: "Nariman Point",
    city: "Mumbai",
    state: "Maharashtra",
    industry: "Trade finance (demo counterparty)",
    verificationStatus: "VERIFIED",
    trustScore: 85
  });

  const msme = await User.create({
    name: "Ananya Deshpande",
    email: "msme@demo.com",
    passwordHash,
    phone: "9876500101",
    role: "msme",
    companyId: abc._id,
    isVerified: true
  });
  const msme2 = await User.create({
    name: "Ritesh Patel",
    email: "msme2@demo.com",
    passwordHash,
    phone: "9876500102",
    role: "msme",
    companyId: steel._id,
    isVerified: true
  });
  const msme3 = await User.create({
    name: "Lakshmi Narayanan",
    email: "msme3@demo.com",
    passwordHash,
    phone: "9876500103",
    role: "msme",
    companyId: knit._id,
    isVerified: false
  });
  const buyer = await User.create({
    name: "Vikram Rao",
    email: "buyer@demo.com",
    passwordHash,
    phone: "9876500201",
    role: "buyer",
    companyId: xyz._id,
    isVerified: true
  });
  const buyer2 = await User.create({
    name: "Meera Reddy",
    email: "buyer2@demo.com",
    passwordHash,
    phone: "9876500202",
    role: "buyer",
    companyId: infra._id,
    isVerified: true
  });
  const buyer3 = await User.create({
    name: "Arjun Malhotra",
    email: "buyer3@demo.com",
    passwordHash,
    phone: "9876500203",
    role: "buyer",
    companyId: retail._id,
    isVerified: true
  });
  const financier = await User.create({
    name: "Sana Qureshi",
    email: "financier@demo.com",
    passwordHash,
    phone: "9876500301",
    role: "financier",
    companyId: capital._id,
    isVerified: true
  });
  await User.create({
    name: "Dev Khanna",
    email: "financier2@demo.com",
    passwordHash,
    phone: "9876500302",
    role: "financier",
    companyId: river._id,
    isVerified: true
  });
  await User.create({
    name: "Platform Admin",
    email: "admin@demo.com",
    passwordHash,
    phone: "9876500000",
    role: "admin",
    isVerified: true
  });

  const specs: Array<{
    publicId: string;
    invoiceNumber: string;
    seller: typeof msme;
    buyer: typeof buyer;
    sellerCo: typeof abc;
    buyerCo: typeof xyz;
    amount: number;
    invoiceDate: string;
    dueDate: string;
    po: string;
    description: string;
    lifecycle: LifecycleStatus;
    extra?: (invId: string) => Promise<void>;
  }> = [
    {
      publicId: "TR-INV1045",
      invoiceNumber: "INV-1045",
      seller: msme,
      buyer,
      sellerCo: abc,
      buyerCo: xyz,
      amount: 1850000,
      invoiceDate: "2026-08-12",
      dueDate: "2026-10-11",
      po: "PO-XYZ-7781",
      description: "Precision machined gearbox housings — lot 22",
      lifecycle: "FINANCING_AVAILABLE"
    },
    {
      publicId: "TR-INV1042",
      invoiceNumber: "INV-1042",
      seller: msme,
      buyer,
      sellerCo: abc,
      buyerCo: xyz,
      amount: 920000,
      invoiceDate: "2026-07-02",
      dueDate: "2026-08-31",
      po: "PO-XYZ-7702",
      description: "CNC fixtures and jigs",
      lifecycle: "PAID"
    },
    {
      publicId: "TR-INV1038",
      invoiceNumber: "INV-1038",
      seller: msme,
      buyer: buyer2,
      sellerCo: abc,
      buyerCo: infra,
      amount: 2460000,
      invoiceDate: "2026-08-20",
      dueDate: "2026-11-18",
      po: "PO-GOD-441",
      description: "Structural steel brackets for metro package",
      lifecycle: "FINANCED"
    },
    {
      publicId: "TR-INV1021",
      invoiceNumber: "INV-1021",
      seller: msme,
      buyer,
      sellerCo: abc,
      buyerCo: xyz,
      amount: 540000,
      invoiceDate: "2026-09-01",
      dueDate: "2026-10-31",
      po: "PO-XYZ-7810",
      description: "Prototype tooling set",
      lifecycle: "BUYER_PENDING"
    },
    {
      publicId: "TR-NS209",
      invoiceNumber: "NS-209",
      seller: msme2,
      buyer: buyer3,
      sellerCo: steel,
      buyerCo: retail,
      amount: 675000,
      invoiceDate: "2026-09-08",
      dueDate: "2026-11-07",
      po: "PO-SAG-19",
      description: "Cold-rolled sheet supply",
      lifecycle: "ACCEPTED"
    },
    {
      publicId: "TR-NS188",
      invoiceNumber: "NS-188",
      seller: msme2,
      buyer,
      sellerCo: steel,
      buyerCo: xyz,
      amount: 1125000,
      invoiceDate: "2026-06-15",
      dueDate: "2026-08-14",
      po: "PO-XYZ-6610",
      description: "Forged blanks — automotive grade",
      lifecycle: "PAID"
    },
    {
      publicId: "TR-NS201",
      invoiceNumber: "NS-201",
      seller: msme2,
      buyer: buyer2,
      sellerCo: steel,
      buyerCo: infra,
      amount: 3100000,
      invoiceDate: "2026-09-12",
      dueDate: "2026-12-11",
      po: "PO-GOD-512",
      description: "Rebar and plates for flyover package",
      lifecycle: "FINANCING_REQUESTED"
    },
    {
      publicId: "TR-KW77",
      invoiceNumber: "KW-77",
      seller: msme3,
      buyer: buyer3,
      sellerCo: knit,
      buyerCo: retail,
      amount: 430000,
      invoiceDate: "2026-09-18",
      dueDate: "2026-10-18",
      po: "PO-SAG-44",
      description: "Knitted fabric rolls — autumn line",
      lifecycle: "DISPUTED"
    },
    {
      publicId: "TR-KW74",
      invoiceNumber: "KW-74",
      seller: msme3,
      buyer: buyer3,
      sellerCo: knit,
      buyerCo: retail,
      amount: 288000,
      invoiceDate: "2026-08-01",
      dueDate: "2026-09-15",
      po: "PO-SAG-31",
      description: "Sample garments for retail QA",
      lifecycle: "VERIFIED"
    },
    {
      publicId: "TR-INV1040",
      invoiceNumber: "INV-1040",
      seller: msme,
      buyer: buyer2,
      sellerCo: abc,
      buyerCo: infra,
      amount: 1575000,
      invoiceDate: "2026-09-22",
      dueDate: "2026-11-21",
      po: "PO-GOD-530",
      description: "Machined coupler assemblies",
      lifecycle: "CREATED"
    }
  ];

  for (const spec of specs) {
    const { canonical, invoiceHash } = fingerprintInvoice({
      invoiceNumber: spec.invoiceNumber,
      seller: spec.sellerCo.legalName,
      buyer: spec.buyerCo.legalName,
      amount: spec.amount,
      invoiceDate: spec.invoiceDate,
      purchaseOrder: spec.po,
      dueDate: spec.dueDate
    });
    const dup = await detectDuplicate({
      invoiceNumber: spec.invoiceNumber,
      sellerId: String(spec.seller._id),
      buyerId: String(spec.buyer._id),
      amount: spec.amount,
      invoiceDate: new Date(spec.invoiceDate),
      purchaseOrderNumber: spec.po,
      invoiceHash
    });

    const flags = flagsFor(spec.lifecycle);
    const invoice = await Invoice.create({
      publicId: spec.publicId,
      invoiceNumber: spec.invoiceNumber,
      sellerId: spec.seller._id,
      buyerId: spec.buyer._id,
      sellerCompany: spec.sellerCo._id,
      buyerCompany: spec.buyerCo._id,
      amount: spec.amount,
      invoiceDate: spec.invoiceDate,
      dueDate: spec.dueDate,
      purchaseOrderNumber: spec.po,
      description: spec.description,
      invoiceHash,
      canonicalPayload: canonical,
      lifecycleStatus: spec.lifecycle,
      duplicateLevel: dup.level,
      duplicateNotes: dup.notes,
      financingBlocked: dup.financingBlocked || spec.lifecycle === "DISPUTED",
      ...flags,
      timeline: timelineFor(spec.lifecycle, spec.seller._id)
    });

    if (spec.lifecycle === "PAID") {
      await Payment.create({
        invoiceId: invoice._id,
        amount: spec.amount,
        paymentMethod: "NEFT",
        reference: `NEFT${spec.invoiceNumber.replace(/\W/g, "")}`,
        status: "SETTLED",
        paymentDate: new Date("2026-09-20")
      });
    }
    if (spec.lifecycle === "FINANCED" || spec.lifecycle === "FINANCING_REQUESTED") {
      await FinancingRequest.create({
        invoiceId: invoice._id,
        sellerId: spec.seller._id,
        requestedAmount: Math.round(spec.amount * 0.8),
        requestedTenure: 60,
        status: spec.lifecycle === "FINANCED" ? "APPROVED" : "PENDING",
        financierId: spec.lifecycle === "FINANCED" ? financier._id : undefined,
        approvedAmount: spec.lifecycle === "FINANCED" ? Math.round(spec.amount * 0.8) : 0,
        interestRate: spec.lifecycle === "FINANCED" ? 13.4 : 0,
        decisionDate: spec.lifecycle === "FINANCED" ? new Date("2026-09-28") : undefined
      });
    }
    if (spec.lifecycle === "DISPUTED") {
      await Dispute.create({
        invoiceId: invoice._id,
        raisedBy: spec.buyer._id,
        reason: "Quantity mismatch",
        description: "Received 18 rolls against 24 billed. Awaiting credit note.",
        status: "OPEN"
      });
    }
    await computeReceivableTrustScore(String(invoice._id));
  }

  await Notification.create({
    userId: msme._id,
    title: "Welcome to TrustReceivable",
    message: "Your demo workspace is seeded. Create INV-DEMO for the 3-minute judge flow.",
    type: "system"
  });

  logger.info("Seed complete. Demo password: Demo@12345");
}

function flagsFor(status: LifecycleStatus) {
  const verified = !["DRAFT", "CREATED"].includes(status);
  const accepted = ["ACCEPTED", "DELIVERY_VERIFIED", "FINANCING_AVAILABLE", "FINANCING_REQUESTED", "FINANCED", "PAYMENT_PENDING", "PAID"].includes(status);
  const delivered = ["DELIVERY_VERIFIED", "FINANCING_AVAILABLE", "FINANCING_REQUESTED", "FINANCED", "PAYMENT_PENDING", "PAID"].includes(status);
  return {
    blockchainStatus: verified ? "MOCK" : "NOT_REGISTERED",
    blockchainTxHash: verified ? `mock_seed_${status.toLowerCase()}` : "",
    buyerAcceptanceStatus: status === "REJECTED" ? "REJECTED" : accepted ? "ACCEPTED" : "PENDING",
    deliveryStatus: delivered ? "VERIFIED" : "PENDING",
    financingStatus: status === "FINANCED" || status === "PAYMENT_PENDING" ? "FINANCED" : status === "FINANCING_REQUESTED" ? "REQUESTED" : "NONE",
    paymentStatus: status === "PAID" ? "PAID" : "UNPAID",
    disputeStatus: status === "DISPUTED" ? "OPEN" : "NONE"
  };
}

function timelineFor(status: LifecycleStatus, actorId: mongoose.Types.ObjectId) {
  const steps: LifecycleStatus[] = ["CREATED", "VERIFIED", "BUYER_PENDING", "ACCEPTED", "DELIVERY_VERIFIED", "FINANCING_AVAILABLE", "FINANCING_REQUESTED", "FINANCED", "PAID"];
  const cut = Math.max(1, steps.indexOf(status as never) + 1 || 1);
  if (status === "DISPUTED") {
    return [
      { status: "CREATED", note: "Invoice created", actorId, at: new Date("2026-09-18") },
      { status: "DISPUTED", note: "Quantity mismatch raised by buyer", actorId, at: new Date("2026-09-22") }
    ];
  }
  return steps.slice(0, cut).map((s, i) => ({
    status: s,
    note: `Moved to ${s}`,
    actorId,
    at: new Date(Date.UTC(2026, 7, 12 + i))
  }));
}

const isMain = process.argv[1]?.includes("seed.ts");
if (isMain) {
  connectDatabase()
    .then(seedAll)
    .then(() => disconnectDatabase())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
