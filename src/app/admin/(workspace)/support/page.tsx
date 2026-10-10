import { supportMessages } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { resolveMessage } from "@/app/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q = "", status = "" } = await searchParams;
  const list = supportMessages().filter(
    (m) =>
      (!status || m.status === status) &&
      `${m.id} ${m.name} ${m.email} ${m.subject}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">CUSTOMER CARE</p>
          <h1>Support inbox</h1>
          <p>Messages saved locally. Resolving a message sends no email.</p>
        </div>
      </div>
      <form className="admin-search">
        <input
          name="q"
          aria-label="Search support"
          placeholder="Name, email or subject"
          defaultValue={q}
        />
        <select name="status" aria-label="Message status" defaultValue={status}>
          <option value="">All messages</option>
          <option>New</option>
          <option>Resolved</option>
        </select>
        <button className="button small">Search</button>
      </form>
      <div className="history-grid">
        {list.map((m) => (
          <section className="panel" key={m.id}>
            <p className="eyebrow">
              {m.id} · {m.status}
            </p>
            <h2>{m.subject}</h2>
            <p>
              {m.name} · {m.email}
            </p>
            <p className="support-body">{m.message}</p>
            <p className="muted">
              {new Date(m.createdAt).toLocaleString("en-IN")}
            </p>
            {m.status === "New" && (
              <form action={resolveMessage}>
                <input type="hidden" name="id" value={m.id} />
                <button className="button outline">Mark resolved</button>
              </form>
            )}
          </section>
        ))}
      </div>
      {!list.length && <p className="panel empty">No messages match.</p>}
    </>
  );
}
