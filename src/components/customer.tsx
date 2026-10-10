"use client";
import { useActionState, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Copy, Printer, ArrowRight } from "lucide-react";
import {
  customerCancel,
  customerReturn,
  privateOrderSummaries,
  contact,
} from "@/lib/client-actions";
import {
  money,
  type Order,
  type Result,
  type ReturnRequest,
} from "@/lib/types";
import { useStore, saveOrder } from "./browser-store";
type Summary = Awaited<ReturnType<typeof privateOrderSummaries>>[number];
function ActionMessage({ result }: { result: Result<string> | null }) {
  return result ? (
    <p
      role={result.ok ? "status" : "alert"}
      className={result.ok ? "success" : "error"}
    >
      {result.ok ? `Saved: ${result.value}` : result.error}
    </p>
  ) : null;
}
export function OrderHistory() {
  const store = useStore();
  const [list, setList] = useState<Summary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const tokens = store.orders;
  useEffect(() => {
    if (!store.ready) return;
    let live = true;
    privateOrderSummaries(tokens)
      .then((rows) => {
        if (live) {
          setList(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (live) {
          setError("Could not load your saved orders. Please refresh.");
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, [tokens, store.ready]);
  return (
    <div className="container section">
      <p className="eyebrow">YOUR K&G PURCHASES</p>
      <h1>Your orders</h1>
      <p className="muted">
        Private order links saved on this browser. No account needed.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading your orders…</p>
      ) : list.length ? (
        <div className="history-grid">
          {list.map((o) => (
            <Link
              href={`/order/${o.token}`}
              className="panel history-card"
              key={o.token}
            >
              <div>
                <Package size={23} />
                <strong>{o.id}</strong>
                <span className={`status status-${o.status.toLowerCase()}`}>
                  {o.status}
                </span>
              </div>
              <p>
                {new Date(o.createdAt).toLocaleDateString("en-IN")} ·{" "}
                {o.itemCount} items
              </p>
              <strong>{money(o.total)}</strong>
              <span className="text-link">View & track order →</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Package size={40} />
          <h2>No saved orders yet</h2>
          <p>
            Orders placed on this browser appear here. You can also open a
            private access link.
          </p>
          <Link className="button" href="/shop">
            Start shopping
          </Link>
        </div>
      )}
      <Link className="text-link" href="/track-order">
        Have a private order link? Track your order →
      </Link>
    </div>
  );
}
export function TrackOrder() {
  const [error, setError] = useState("");
  const router = useRouter();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = String(
      new FormData(e.currentTarget).get("access") || "",
    ).trim();
    let token = raw;
    try {
      if (raw.includes("/"))
        token =
          new URL(raw, window.location.origin).pathname.split("/order/")[1] ||
          "";
    } catch {
      token = "";
    }
    if (!/^[a-f0-9]{48}$/.test(token)) {
      setError(
        "Enter the private access code or link from your order confirmation.",
      );
      return;
    }
    router.push(`/order/${token}`);
  }
  return (
    <div className="container section info-page">
      <p className="eyebrow">FOLLOW YOUR ORDER</p>
      <h1>Track your order</h1>
      <p>
        Use your private confirmation link or 48-character access code. Keep it
        private: it grants access to your order details.
      </p>
      <form onSubmit={submit} className="panel form-stack">
        <label>
          Private order link or access code
          <input name="access" required maxLength={500} />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button">
          View order <ArrowRight size={17} />
        </button>
      </form>
      <Link className="text-link" href="/orders">
        See orders saved on this browser
      </Link>
    </div>
  );
}
export function OrderTools({
  order,
  request,
  eligible,
}: {
  order: Order;
  request?: ReturnRequest;
  eligible: boolean;
}) {
  const [cancel, cancelAction, cancelPending] = useActionState(
    customerCancel,
    null as Result<string> | null,
  );
  const [returned, returnAction, returnPending] = useActionState(
    customerReturn,
    null as Result<string> | null,
  );
  const [message, setMessage] = useState("");
  return (
    <>
      <div className="order-tools">
        <button
          className="button outline small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setMessage("Private link copied.");
            } catch {
              setMessage(
                "Copy the private link from your browser address bar.",
              );
            }
          }}
        >
          <Copy size={15} /> Copy private link
        </button>
        <button className="button outline small" onClick={() => window.print()}>
          <Printer size={15} /> Print summary
        </button>
        <button
          className="text-link"
          onClick={() => {
            const r = saveOrder(order.token);
            setMessage(r.ok ? "Order saved on this browser." : r.error);
          }}
        >
          Save order on this browser
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {["Placed", "Processing"].includes(order.status) && (
        <section className="panel customer-request">
          <h3>Need to cancel?</h3>
          <p>
            You can cancel before shipping. Sample inventory will be restored.
          </p>
          <form
            action={cancelAction}
            onSubmit={(e) => {
              if (!window.confirm("Cancel this demo order?"))
                e.preventDefault();
            }}
          >
            <input type="hidden" name="token" value={order.token} />
            <button disabled={cancelPending} className="button outline">
              {cancelPending ? "Cancelling…" : "Cancel order"}
            </button>
          </form>
          <ActionMessage result={cancel} />
        </section>
      )}
      {request ? (
        <section className="panel customer-request">
          <h3>Return {request.id}</h3>
          <p>
            Status: <strong>{request.status}</strong>
          </p>
          <p>{request.reason}</p>
          <p className="muted">No actual pickup or refund is initiated.</p>
        </section>
      ) : eligible ? (
        <section className="panel customer-request">
          <h3>Request a return</h3>
          <p>
            Whole-order returns within seven days of recorded delivery. Unworn
            items with tags only.
          </p>
          <form action={returnAction} className="form-stack">
            <input type="hidden" name="token" value={order.token} />
            <label>
              Reason for return
              <textarea
                name="reason"
                required
                minLength={10}
                maxLength={1000}
                rows={3}
              />
            </label>
            <button className="button outline" disabled={returnPending}>
              {returnPending ? "Submitting…" : "Request return"}
            </button>
          </form>
          <ActionMessage result={returned} />
        </section>
      ) : (
        order.status === "Delivered" && (
          <p className="muted">
            {order.deliveredAt
              ? "The seven-day return window has ended."
              : "Delivery date was not recorded for this older order. Contact demo support for help."}
          </p>
        )
      )}
    </>
  );
}
export function ContactForm() {
  const [state, action, pending] = useActionState(
    contact,
    null as Result<string> | null,
  );
  return (
    <form action={action} className="panel form-stack">
      <h2>How can we help?</h2>
      <p>
        Your message is saved in this local demo for admin to review. No email
        is sent.
      </p>
      <label>
        Full name
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
        />
      </label>
      <label>
        Email address
        <input
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
        />
      </label>
      <label>
        Subject
        <input name="subject" required minLength={3} maxLength={120} />
      </label>
      <label>
        Message
        <textarea
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={2000}
        />
      </label>
      <ActionMessage result={state} />
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Send demo message"}
      </button>
    </form>
  );
}
