import type { RazorpayOptions, RazorpayResponse } from "@/types";

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

// ============================================================
// LOAD RAZORPAY SCRIPT
// ============================================================
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ============================================================
// OPEN RAZORPAY CHECKOUT
// ============================================================
export async function openRazorpayCheckout(params: {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpayResponse) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Failed to load Razorpay SDK. Check your connection.");
  }

  const options: RazorpayOptions = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    amount: params.amount,
    currency: params.currency,
    name: "ExamEdge",
    description: params.description,
    order_id: params.orderId,
    image: "/logo.png",
    prefill: params.prefill,
    theme: {
      color: "#4F46E5",
    },
    handler: params.onSuccess,
    modal: {
      ondismiss: params.onDismiss,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

// ============================================================
// FORMAT PRICE
// ============================================================
export function formatPrice(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}
